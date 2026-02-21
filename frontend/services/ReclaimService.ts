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

export type SupportedPlatform = "github" | "x" | "linkedin" | "farcaster";

export interface ProofRequestOptions {
  /** Plateforme à vérifier (ex: "github", "x", "linkedin"). */
  platform: SupportedPlatform;
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
   * platformId = keccak256(platform) — identifie la plateforme,
   * indépendamment du username, pour l'ancrage on-chain.
   */
  platformId: `0x${string}`;
  /**
   * Score extrait de la preuve (contributions, repos, followers…).
   * Vaut 1 par défaut si rien n'est trouvé (simple possession du compte).
   */
  reputationScore: bigint;
  /**
   * Username extrait de la preuve (utile pour l'UI, ex: AI Audit), non stocké on-chain par défaut.
   */
  username?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDER_IDS: Record<SupportedPlatform, string | undefined> = {
  github: process.env.NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID,
  x: process.env.NEXT_PUBLIC_RECLAIM_X_PROVIDER_ID,
  linkedin: process.env.NEXT_PUBLIC_RECLAIM_LINKEDIN_PROVIDER_ID,
  farcaster: process.env.NEXT_PUBLIC_RECLAIM_FARCASTER_PROVIDER_ID,
};

// ─── Utility ─────────────────────────────────────────────────────────────────

/** platformId fixe pour la plateforme (keccak256(platformName)). */
async function getPlatformId(platform: SupportedPlatform): Promise<`0x${string}`> {
  const { keccak256, toBytes } = await import("viem");
  return keccak256(toBytes(platform));
}

/**
 * Extrait un score numérique de la preuve.
 * Tente les clés courantes puis retourne 1 (simple possession de compte).
 */
function extractReputationScore(proof: ZKProof): bigint {
  const keys = ["contributions", "followers", "public_repos", "score", "count", "connections"];
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
 * un compte sur la plateforme spécifiée.
 *
 * @returns L'URL de la session Reclaim à ouvrir sur le téléphone.
 */
export async function initPlatformProof(
  options: ProofRequestOptions
): Promise<string> {
  const { platform, walletAddress, onProofReady, onError } = options;
  const providerId = PROVIDER_IDS[platform];

  if (!providerId) {
    throw new Error(
      `Missing env var for platform: ${platform}`
    );
  }

  // ── 1. Obtenir la config signée depuis le serveur ──────────────────────
  const res = await fetch("/api/reclaim/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerId, walletAddress }),
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
        const result = await handleProofCallback(proofData, platform);
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

/** @deprecated Utiliser initPlatformProof à la place. */
export async function initGitHubProof(
  options: Omit<ProofRequestOptions, "platform">
): Promise<string> {
  return initPlatformProof({ ...options, platform: "github" });
}

/**
 * Traite le payload de preuve retourné par le SDK Reclaim v4.
 */
export async function handleProofCallback(
  rawProof: unknown,
  platform: SupportedPlatform = "github"
): Promise<ReclaimCallbackResult> {
  if (!rawProof) {
    throw new Error("Invalid proof: received empty payload");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proofObj: any = Array.isArray(rawProof) ? rawProof[0] : rawProof;

  if (!proofObj || typeof proofObj !== "object") {
    throw new Error("Invalid proof: expected an object");
  }

  const claimData = proofObj.claimData as Record<string, unknown> | undefined;

  if (!claimData) {
    throw new Error("Invalid proof structure: missing claimData");
  }

  const extractedParameterValues: Record<string, string> =
    proofObj.extractedParameterValues ?? {};

  // Audit de sécurité
  sanitizeProofContext(proofObj, { throwOnLeak: true });
  const safeExtractedParams = sanitizeExtractedParams(
    extractedParameterValues as Record<string, string>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChainData: any = transformForOnchain(proofObj);

  const zkProof: ZKProof = {
    raw: JSON.stringify(onChainData),
    provider: String(claimData["provider"] ?? "http"),
    extractedParams: safeExtractedParams,
    timestampS: Number(claimData["timestampS"] ?? 0),
    identifier: String(proofObj.identifier ?? claimData["identifier"] ?? "0x0"),
  };

  const platformId = await getPlatformId(platform);
  const reputationScore = extractReputationScore(zkProof);

  // Log extracted parameters for debugging
  console.log("[ReclaimService] Extracted Params:", safeExtractedParams);

  // Try to extract username from common params extracted by providers
  let username = safeExtractedParams["login"] || safeExtractedParams["username"] || safeExtractedParams["username_hash"] || safeExtractedParams["screen_name"];

  // Some templates stringify the entire Github response in one parameter
  if (!username) {
    for (const key of Object.keys(safeExtractedParams)) {
      try {
        const parsed = JSON.parse(safeExtractedParams[key]);
        if (parsed.login) username = parsed.login;
        if (parsed.username) username = parsed.username;
      } catch (e) { /* ignore parse errors */ }
    }
  }

  // Last resort fallback from raw context if present
  if (!username && claimData["context"]) {
    try {
      const contextObj = typeof claimData["context"] === 'string' ? JSON.parse(claimData["context"]) : claimData["context"];
      const ep = contextObj?.extractedParameters;
      if (ep) {
        username = ep["login"] || ep["username"] || ep["username_hash"];
      }
    } catch (e) { /* ignore */ }
  }

  // Debug log
  console.log("[ReclaimService] Final extracted username:", username);

  return { proof: zkProof, platformId, reputationScore, username };
}
