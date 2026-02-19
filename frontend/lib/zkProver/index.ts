/**
 * index.ts – Ghost ZK Prover
 * Point d'entrée unique du moteur de preuve ZK "Ghost".
 */

// ─── GhostProver (attestation pseudonyme) ─────────────────────────────────────
export { GhostProver, ghostProver } from "./GhostProver";

// ─── DisclosureProver (divulgation sélective) ─────────────────────────────────
export {
  DisclosureProver,
  disclosureProver,
  DISCLOSURE_TIERS,
  customTier,
  bestTierForScore,
  eligibleTiersForScore,
} from "./DisclosureProver";

// ─── Commitments (Poseidon, keccak, helpers) ──────────────────────────────────
export {
  computeUsernameHash,
  computePlatformFieldId,
  computeIdentityCommitment,
  computeNullifier,
  computeClaimIdentifier,
  generateSalt,
  fieldToHex,
  recomputeCommitmentFromStorage,
  verifyCommitment,
} from "./commitments";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  // GhostIdentity
  GhostAttestation,
  GhostAttestationMeta,
  GhostCircuitInputs,
  GhostCircuitPrivateInputs,
  GhostCircuitPublicInputs,
  GhostProverOptions,
  GhostPublicSignals,
  GhostVerifierCalldata,
  Groth16Proof,
  // GhostDisclosure
  DisclosureTier,
  GhostDisclosureAttestation,
  GhostDisclosureCalldata,
  GhostDisclosureCircuitInputs,
  GhostDisclosurePublicSignals,
} from "./types";
export { GhostProverError } from "./types";
export type { GhostProverErrorCode } from "./types";
