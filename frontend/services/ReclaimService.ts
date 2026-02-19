/**
 * ReclaimService.ts – Silent Ledger
 *
 * Ce service orchestre le flux zkTLS via le SDK Reclaim Protocol.
 *
 * Fonctionnement ZK :
 *   1. On construit un ProofRequest ciblant l'endpoint GitHub qui renvoie
 *      les données de contributions (réponse HTTPS publique).
 *   2. Le SDK Reclaim génère une session et retourne une URL/QR code vers
 *      son attestor network. L'utilisateur ouvre cette URL sur son device.
 *   3. L'attestor network intercepte la réponse HTTPS, applique le regex
 *      paramétré dans la requête, et génère une preuve ZK (zkTLS MPC-TLS)
 *      sans jamais exposer le token ou les en-têtes HTTP privés.
 *   4. La preuve, signée par les nœuds attestors, est retournée via callback.
 *   5. On la passe ensuite à SilentLedgerAttester.submitProof() on-chain.
 */

import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import {
  sanitizeProofContext,
  sanitizeExtractedParams,
  SensitiveDataLeakError,
} from "../lib/sensitiveDataMasker";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProofRequestOptions {
  /** Username GitHub à prouver (sera hashé avant envoi on-chain). */
  githubUsername: string;
  /** Callback déclenché quand la preuve ZK est prête. */
  onProofReady: (result: ZKProof) => void;
  /** Callback d'erreur. */
  onError?: (error: Error) => void;
}

/**
 * Représentation typée de la preuve ZK retournée par le SDK Reclaim.
 * Ces données sont ensuite passées au contrat SilentLedgerAttester.
 */
export interface ZKProof {
  /** Proof brute sérialisée (à passer telle quelle au contract). */
  raw: string;
  /** Provider utilisé (doit être "http" pour nos cas d'usage). */
  provider: string;
  /** Paramètres extraits : contributions count etc. */
  extractedParams: Record<string, string>;
  /** Timestamp UNIX de génération de la preuve. */
  timestampS: number;
  /** Identifiant unique du claim (bytes32 on-chain). */
  identifier: string;
}

export interface ReclaimCallbackResult {
  proof: ZKProof;
  /** platformId côté client : keccak256("github:<username>").
   *  Calculé ici pour éviter que le username n'apparaisse jamais on-chain. */
  platformId: `0x${string}`;
  /** Score de réputation extrait de la preuve. */
  reputationScore: bigint;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * ID du provider Reclaim pour les contributions GitHub.
 * À créer sur https://dev.reclaimprotocol.org/ et stocker dans .env.local
 *
 * Le provider "GitHub Contributions" utilise le regex suivant sur
 * https://github.com/<username> pour extraire le nombre de contributions
 * de l'année en cours depuis le HTML public de la page.
 */
const GITHUB_PROVIDER_ID =
  process.env.NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID ?? "";

/** App ID Reclaim (depuis dashboard dev.reclaimprotocol.org). */
const APP_ID = process.env.NEXT_PUBLIC_RECLAIM_APP_ID ?? "";

/** App Secret Reclaim (ne doit JAMAIS être exposé côté client en production). */
const APP_SECRET = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET ?? "";

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Calcule le keccak256 de "github:<username>" côté client (en JS).
 * On utilise l'ABI encoder de viem pour reproduire exactement ce que
 * le contrat Solidity ferait avec keccak256(abi.encodePacked("github:", username)).
 */
async function computePlatformId(
  username: string
): Promise<`0x${string}`> {
  // Dynamique import pour éviter le bundle côté serveur si SSR
  const { keccak256, toBytes, concat } = await import("viem");
  const encoded = concat([toBytes("github:"), toBytes(username)]);
  return keccak256(encoded);
}

/**
 * Extrait le score de réputation du contexte JSON de la preuve Reclaim.
 * Le JSON a la forme :
 * { "extractedParameters": { "contributions": "420", ... } }
 */
function extractReputationScore(proof: ZKProof): bigint {
  const raw = proof.extractedParams["contributions"] ?? "0";
  return BigInt(raw.replace(/[^0-9]/g, "") || "0");
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Initialise un ProofRequest Reclaim pour prouver le nombre de contributions
 * GitHub d'un utilisateur sans révéler son token ou ses cookies.
 *
 * @returns L'URL/QR code de la session Reclaim à présenter à l'utilisateur.
 */
export async function initGitHubContributionsProof(
  options: ProofRequestOptions
): Promise<string> {
  const { githubUsername, onProofReady, onError } = options;

  if (!APP_ID || !APP_SECRET || !GITHUB_PROVIDER_ID) {
    throw new Error(
      "Missing Reclaim env vars. Check NEXT_PUBLIC_RECLAIM_APP_ID, " +
        "NEXT_PUBLIC_RECLAIM_APP_SECRET, NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID"
    );
  }

  // ── Création de la session Reclaim ─────────────────────────────────────
  const proofRequest = await ReclaimProofRequest.init(
    APP_ID,
    APP_SECRET,
    GITHUB_PROVIDER_ID
  );

  // Contexte additionnel passé dans la preuve pour lier le claim à un username.
  // Ce contexte est signé par l'attestor → impossibilité de le falsifier.
  proofRequest.setAppCallbackUrl(
    `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/reclaim-callback`
  );

  proofRequest.addContext(
    `github_user`,
    githubUsername
  );

  // ── Callback de réception de la preuve ─────────────────────────────────
  await proofRequest.startSession({
    onSuccess: async (proofData: unknown) => {
      try {
        const result = await handleProofCallback(proofData, githubUsername);
        onProofReady(result.proof);
      } catch (err) {
        if (err instanceof SensitiveDataLeakError) {
          // Fuite détectée : on bloque silencieusement et on remonte l'erreur
          // sans logger le payload pour ne pas exposer la donnée.
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

  // getRequestUrl() is async in this SDK version
  return await proofRequest.getRequestUrl();
}

/**
 * Traite le callback Reclaim et retourne la preuve structurée.
 * Appelé automatiquement par startSession() ou manuellement depuis
 * le route handler Next.js /api/reclaim-callback.
 *
 * @param rawProof  Objet preuve brut reçu du SDK.
 * @param username  Username GitHub correspondant (pour calcul du platformId).
 */
export async function handleProofCallback(
  rawProof: unknown,
  username: string
): Promise<ReclaimCallbackResult> {
  // Validation de la structure de base
  if (!rawProof || typeof rawProof !== "object") {
    throw new Error("Invalid proof: expected an object");
  }

  const proofObj = rawProof as Record<string, unknown>;

  const claimInfo = proofObj["claimInfo"] as Record<string, string> | undefined;
  const signedClaim = proofObj["signedClaim"] as
    | Record<string, unknown>
    | undefined;

  if (!claimInfo || !signedClaim) {
    throw new Error("Invalid proof structure: missing claimInfo or signedClaim");
  }

  // Extraction des paramètres depuis le contexte JSON
  let extractedParams: Record<string, string> = {};
  try {
    const ctx = JSON.parse(claimInfo["context"] ?? "{}") as {
      extractedParameters?: Record<string, string>;
    };
    extractedParams = ctx.extractedParameters ?? {};
  } catch {
    // Le contexte n'est pas du JSON valide – on continue avec un objet vide
  }

  // ── Audit de sécurité : détection de fuite avant tout traitement ────────
  // Lance une SensitiveDataLeakError si un token/password est détecté.
  sanitizeProofContext(rawProof, { throwOnLeak: true });

  // Nettoyage défensif des paramètres extraits (double-sécurité)
  const safeExtractedParams = sanitizeExtractedParams(extractedParams);

  const claim = signedClaim["claim"] as Record<string, unknown>;
  const zkProof: ZKProof = {
    raw: JSON.stringify(rawProof),
    provider: claimInfo["provider"] ?? "http",
    extractedParams: safeExtractedParams,
    timestampS: Number(claim?.["timestampS"] ?? 0),
    identifier: String(claim?.["identifier"] ?? "0x0"),
  };

  const platformId = await computePlatformId(username);
  const reputationScore = extractReputationScore(zkProof);

  return { proof: zkProof, platformId, reputationScore };
}
