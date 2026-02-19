/**
 * types.ts – Ghost ZK Prover
 *
 * Types du moteur de preuve ZK "Ghost".
 *
 * Modèle de confidentialité :
 *   L'utilisateur prouve qu'il possède un identifiant valide sur une plateforme
 *   (GitHub, Slack, Discord…) SANS révéler cet identifiant.
 *
 *   Ce qui est PUBLIC (on-chain, visible de tous) :
 *     • identityCommitment  : Poseidon(usernameHash, salt)
 *     • platformId          : keccak256("github") etc.
 *     • reputationThreshold : seuil de score minimal prouvé
 *     • nullifier           : Poseidon(usernameHash, platformId, nonce)
 *                             → empêche la double soumission d'une même preuve
 *
 *   Ce qui est PRIVÉ (jamais révélé, input secret du circuit) :
//     • usernameHash       : keccak256 du login plateforme
//     • reputationScore    : score réel (prouvé >= threshold sans le divulguer)
//     • salt               : entropie aléatoire locale du client
//     • reclaimIdentifier  : CompleteClaimData.identifier as field element
//                            Déterministe par claim → anti cross-wallet :
//                            deux wallets qui prouvent la même contribution
//                            obtiennent le même nullifier → revert on-chain.
 */

// ─── Inputs du circuit ────────────────────────────────────────────────────────

/**
 * Inputs PRIVÉS du circuit Circom GhostIdentity.
 * Ne quittent jamais le navigateur — servent uniquement à la génération
 * du témoin (witness) en local.
 */
export interface GhostCircuitPrivateInputs {
  /** keccak256(username) représenté en BigInt (field element). */
  usernameHash: bigint;
  /** Score de réputation réel (ex: nb contributions GitHub). */
  reputationScore: bigint;
  /** Sel aléatoire 128 bits généré localement. */
  salt: bigint;
  /**
   * Identifiant unique du claim Reclaim (CompleteClaimData.identifier).
   * Hashé de manière déterministe depuis les paramètres de la requête HTTPS.
   * Garanti identique pour la même contribution, quel que soit le wallet
   * qui soumet la preuve → empêche la double-preuve cross-wallet.
   */
  reclaimIdentifier: bigint;
}

/**
 * Inputs PUBLICS du circuit Circom GhostIdentity.
 * Vérifiés on-chain par le contrat GhostVerifier.
 */
export interface GhostCircuitPublicInputs {
  /** Poseidon(usernameHash, salt) — engagement cryptographique de l'identité. */
  identityCommitment: bigint;
  /** keccak256("github" | "slack" | …) tronqué en field element. */
  platformId: bigint;
  /**
   * Seuil minimal de réputation prouvé.
   * Le circuit garantit reputationScore >= reputationThreshold
   * sans divulguer reputationScore.
   */
  reputationThreshold: bigint;
  /**
   * Poseidon(usernameHash, platformId, reclaimIdentifier).
   * Unique par (identité × plateforme × claim Reclaim).
   * Stocké on-chain pour empêcher la double-preuve.
   * Deux wallets soumettant la même contribution produisent le MÊME nullifier
   * → le second appel revert sur GhostVerifier.sol.
   */
  nullifier: bigint;
}

/** Tous les inputs du circuit (privés + publics), passés au witness generator. */
export interface GhostCircuitInputs
  extends GhostCircuitPrivateInputs,
    GhostCircuitPublicInputs {}

// ─── Preuve produite par snarkjs ──────────────────────────────────────────────

/**
 * Preuve Groth16 produite par snarkjs.
 * Sérialisable en JSON pour stockage ou transmission.
 */
export interface Groth16Proof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: "groth16";
  curve: "bn128";
}

/**
 * Signaux publics retournés par snarkjs après le prouvage.
 * Ordre identique à la déclaration `signal output` dans le circuit.
 */
export type GhostPublicSignals = [
  string, // identityCommitment
  string, // platformId
  string, // reputationThreshold
  string, // nullifier
];

// ─── Attestation Ghost complète ───────────────────────────────────────────────

/**
 * Objet complet retourné par `GhostProver.prove()`.
 * Contient tout ce qui est nécessaire pour la soumission on-chain.
 */
export interface GhostAttestation {
  /** Preuve Groth16 sérialisable. */
  proof: Groth16Proof;
  /** Signaux publics vérifiés par le contrat. */
  publicSignals: GhostPublicSignals;
  /**
   * Calldata ABI-encodé prêt pour `GhostVerifier.verifyAndAttest()`.
   * Format : [pA, pB, pC, pubSignals]
   */
  calldata: GhostVerifierCalldata;
  /** Métadonnées locales (jamais envoyées on-chain). */
  meta: GhostAttestationMeta;
}

/**
 * Calldata décodé pour appel direct au contrat Solidity.
 * Produit par `snarkjs.groth16.exportSolidityCallData()`.
 */
export interface GhostVerifierCalldata {
  pA: [bigint, bigint];
  pB: [[bigint, bigint], [bigint, bigint]];
  pC: [bigint, bigint];
  pubSignals: [bigint, bigint, bigint, bigint];
}

/**
 * Métadonnées locales associées à une attestation Ghost.
 * Utilisées côté frontend pour l'affichage et la gestion d'état.
 * Ne sont jamais soumises on-chain.
 */
export interface GhostAttestationMeta {
  /** Plateforme source humainement lisible. */
  platform: string;
  /** Seuil de réputation prouvé. */
  reputationThreshold: number;
  /** Timestamp local de génération de la preuve (ms). */
  generatedAt: number;
  /**
   * Nullifier hex string pour déduplication côté frontend.
   * Identique à publicSignals[3].
   */
  nullifierHex: `0x${string}`;
}

// ─── Options du prover ────────────────────────────────────────────────────────

export interface GhostProverOptions {
  /**
   * Seuil de réputation minimum à prouver.
   * Par défaut : 1 (l'utilisateur a au moins 1 contribution).
   */
  reputationThreshold?: number;
  /**
   * Forcer la re-génération même si un nullifier identique existe en cache.
   * Par défaut : false.
   */
  forceRegenerate?: boolean;
}

// ─── Erreurs du prover ────────────────────────────────────────────────────────

export type GhostProverErrorCode =
  | "CIRCUIT_NOT_LOADED"
  | "WITNESS_GENERATION_FAILED"
  | "PROOF_GENERATION_FAILED"
  | "INSUFFICIENT_REPUTATION"
  | "NULLIFIER_ALREADY_USED"
  | "INVALID_RECLAIM_PROOF"
  | "SCORE_NOT_IN_TIER";

// ─── Selective Disclosure – Tiers ────────────────────────────────────────────

/**
 * Définition d'un tier de divulgation sélective.
 * L'utilisateur prouve que son score est dans l'intervalle [minScore, maxScore[
 * sans révéler la valeur exacte ni son identité.
 */
export interface DisclosureTier {
  /** Label humain lisible (ex: "Top 1%", "Gold", "500+ contributions"). */
  label: string;
  /** Score minimum inclusif (proof : score >= minScore). */
  minScore: number;
  /**
   * Score maximum exclusif (proof : score < maxScore).
   * Utiliser 2^32 - 1 pour un tier sans limite supérieure (ex: Platinum).
   */
  maxScore: number;
  /** Description affichée à l'utilisateur. */
  description: string;
}

/**
 * Inputs du circuit GhostDisclosure.
 * Mêmes inputs privés que GhostIdentity, mais les signaux publics
 * remplacent le seuil unique par les bornes du tier.
 */
export interface GhostDisclosureCircuitInputs {
  // privés
  usernameHash: bigint;
  reputationScore: bigint;
  salt: bigint;
  reclaimIdentifier: bigint;
  // publics
  identityCommitment: bigint;
  platformId: bigint;
  tierMinScore: bigint;
  tierMaxScore: bigint;
  nullifier: bigint;
}

/**
 * Signaux publics du circuit GhostDisclosure.
 * Ordre : [identityCommitment, platformId, tierMinScore, tierMaxScore, nullifier]
 */
export type GhostDisclosurePublicSignals = [
  string, // identityCommitment
  string, // platformId
  string, // tierMinScore
  string, // tierMaxScore
  string, // nullifier
];

/**
 * Calldata Solidity pour le circuit à 5 signaux publics.
 */
export interface GhostDisclosureCalldata {
  pA: [bigint, bigint];
  pB: [[bigint, bigint], [bigint, bigint]];
  pC: [bigint, bigint];
  pubSignals: [bigint, bigint, bigint, bigint, bigint];
}

/**
 * Attestation de divulgation sélective complète.
 */
export interface GhostDisclosureAttestation {
  proof: Groth16Proof;
  publicSignals: GhostDisclosurePublicSignals;
  calldata: GhostDisclosureCalldata;
  tier: DisclosureTier;
  meta: {
    platform: string;
    tierLabel: string;
    generatedAt: number;
    nullifierHex: `0x${string}`;
  };
}

export class GhostProverError extends Error {
  constructor(
    public readonly code: GhostProverErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`[GhostProver:${code}] ${message}`);
    this.name = "GhostProverError";
  }
}
