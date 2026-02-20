/**
 * ReclaimService.ts – Silent Ledger
 *
 * Ce service orchestre le flux zkTLS via le SDK Reclaim Protocol.
 *
 * Fonctionnement ZK :
 *   1. La route serveur /api/reclaim/init crée et signe un ProofRequest.
 *   2. Le client reconstruit la session via fromJsonString() et obtient une URL.
 *   3. L'utilisateur ouvre l'URL sur son appareil et s'authentifie sur GitHub.
 *   4. L'attestor réseau vérifie la session GitHub → preuve ZK sans exposer
 *      aucun cookie ni token.
 *   5. La preuve est ancrée on-chain via SilentLedgerAttester.submitProof().
 */

import { ReclaimProofRequest, transformForOnchain } from "@reclaimprotocol/js-sdk";
import {
  sanitizeProofContext,
  sanitizeExtractedParams,
  SensitiveDataLeakError,
} from "../lib/sensitiveDataMasker";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProofRequestOptions {
  /** Adresse du wallet (liée au contexte de la preuve). */
  walletAddress: string;
  /** Callback déclenché quand la preuve ZK est prête. */
  onProofReady: (result: ReclaimCallbackResult) => void;
  /** Callback d'erreur. */
  onError?: (error: Error) => void;
}

export interface ZKProof {
  /** Proof brute sérialisée (à passer telle quelle au contrat). */
  raw: string;
  /** Provider utilisé. */
  provider: string;
  /** Paramètres extraits par le provider. */
  extractedParams: Record<string, string>;
  /** Timestamp UNIX de génération de la preuve. */
  timestampS: number;
  /** Identifiant unique du claim (bytes32 on-chain). */
  identifier: string;
}

export interface ReclaimCallbackResult {
  proof: ZKProof;
  /**
   * platformId = keccak256("github") — identifie la plateforme GitHub,
   * indépendamment du username, pour l'ancrage on-chain.
   */
  platformId: `0x${string}`;
  /**
   * Score extrait de la preuve (contributions, repos, followers…).
   * Vaut 1 par défaut si rien n'est trouvé (simple possession du compte).
   */
  reputationScore: bigint;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GITHUB_PROVIDER_ID =
  process.env.NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID ?? "";

// ─── Utility ─────────────────────────────────────────────────────────────────

/** platformId fixe pour la plateforme GitHub (keccak256("github")). */
async function getGithubPlatformId(): Promise<`0x${string}`> {
  const { keccak256, toBytes } = await import("viem");
  return keccak256(toBytes("github"));
}

/**
 * Extrait un score numérique de la preuve.
 * Tente les clés courantes puis retourne 1 (simple possession de compte).
 */
function extractReputationScore(proof: ZKProof): bigint {
  const keys = ["contributions", "followers", "public_repos", "score", "count"];
  for (const key of keys) {
    const val = proof.extractedParams[key];
    if (val) {
      const n = BigInt(val.replace(/[^0-9]/g, "") || "0");
      if (n > 0n) return n;
    }
  }
  return 1n; // compte vérifié = score symbolique 1
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Initie une session zkTLS Reclaim pour vérifier que l'utilisateur possède
 * un compte GitHub. Aucun username n'est demandé — la preuve est générée
 * depuis la session GitHub active sur l'appareil de l'utilisateur.
 *
 * @returns L'URL de la session Reclaim à ouvrir sur le téléphone.
 */
export async function initGitHubProof(
  options: ProofRequestOptions
): Promise<string> {
  const { walletAddress, onProofReady, onError } = options;

  if (!GITHUB_PROVIDER_ID) {
    throw new Error(
      "Missing env var: NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID"
    );
  }

  // ── 1. Obtenir la config signée depuis le serveur ──────────────────────
  const res = await fetch("/api/reclaim/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerId: GITHUB_PROVIDER_ID, walletAddress }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(`Reclaim init failed: ${body.error ?? res.statusText}`);
  }

  const { requestConfig } = await res.json() as { requestConfig: string };

  // ── 2. Reconstruire la session côté client ─────────────────────────────
  const proofRequest = await ReclaimProofRequest.fromJsonString(requestConfig);

  // ── 3. Callbacks ───────────────────────────────────────────────────────
  await proofRequest.startSession({
    onSuccess: async (proofData: unknown) => {
      try {
        const result = await handleProofCallback(proofData);
        onProofReady(result);
      } catch (err) {
        if (err instanceof SensitiveDataLeakError) {
          onError?.(err);
          return;
        }
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return await proofRequest.getRequestUrl();
}

/** @deprecated Utiliser initGitHubProof à la place. */
export async function initGitHubContributionsProof(
  options: { githubUsername: string } & Omit<ProofRequestOptions, "walletAddress">
): Promise<string> {
  return initGitHubProof({
    walletAddress: options.githubUsername,
    onProofReady: options.onProofReady,
    onError: options.onError,
  });
}

/**
 * Traite le payload de preuve retourné par le SDK Reclaim v4.
 *
 * Le SDK v4 passe un `Proof | Proof[]` avec la structure :
 *   proof.claimData     → provider, parameters, context, identifier, timestampS
 *   proof.extractedParameterValues → paramètres extraits (clé/valeur)
 *   proof.signatures, proof.witnesses
 *
 * `transformForOnchain(proof)` produit { claimInfo, signedClaim } attendu
 * par le contrat SilentLedgerAttester.submitProof().
 */
export async function handleProofCallback(
  rawProof: unknown
): Promise<ReclaimCallbackResult> {
  if (!rawProof) {
    throw new Error("Invalid proof: received empty payload");
  }

  // Le SDK peut envoyer un tableau (multi-claim) ou un objet seul
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proofObj: any = Array.isArray(rawProof) ? rawProof[0] : rawProof;

  if (!proofObj || typeof proofObj !== "object") {
    throw new Error("Invalid proof: expected an object");
  }

  const claimData = proofObj.claimData as Record<string, unknown> | undefined;

  if (!claimData) {
    throw new Error("Invalid proof structure: missing claimData");
  }

  // Paramètres extraits par le provider (SDK v4 : extractedParameterValues)
  const extractedParameterValues: Record<string, string> =
    proofObj.extractedParameterValues ?? {};

  // Audit de sécurité : détection de fuite de données sensibles
  sanitizeProofContext(proofObj, { throwOnLeak: true });
  const safeExtractedParams = sanitizeExtractedParams(
    extractedParameterValues as Record<string, string>
  );

  // Transformation pour l'on-chain → { claimInfo, signedClaim }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChainData: any = transformForOnchain(proofObj);

  const zkProof: ZKProof = {
    // raw contient le format { claimInfo, signedClaim } attendu par le contrat
    raw: JSON.stringify(onChainData),
    provider: String(claimData["provider"] ?? "http"),
    extractedParams: safeExtractedParams,
    timestampS: Number(claimData["timestampS"] ?? 0),
    identifier: String(proofObj.identifier ?? claimData["identifier"] ?? "0x0"),
  };

  const platformId = await getGithubPlatformId();
  const reputationScore = extractReputationScore(zkProof);

  return { proof: zkProof, platformId, reputationScore };
}
