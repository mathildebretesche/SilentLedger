/**
 * proof.ts – Silent Ledger shared types
 * Types partagés entre le frontend et les services.
 */

/** Représente une attestation EAS récupérée depuis le contrat. */
export interface OnChainAttestation {
  /** UID EAS (bytes32 hex string). */
  uid: `0x${string}`;
  /** platformId hashé (keccak256 de "github:<username>"). */
  platformId: `0x${string}`;
  /** Score de réputation (contributions GitHub, etc.). */
  reputationScore: bigint;
  /** La preuve a-t-elle été vérifiée on-chain ? Toujours true si présente. */
  isVerified: boolean;
  /** Timestamp de création de l'attestation (block time). */
  time: bigint;
}

/** Map des plateformes supportées. */
export type Platform = "github" | "discord" | "slack";

export const PLATFORM_LABELS: Record<Platform, string> = {
  github: "GitHub",
  discord: "Discord",
  slack: "Slack",
};

export const PLATFORM_ICONS: Record<Platform, string> = {
  github: "🐙",
  discord: "💬",
  slack: "💼",
};
