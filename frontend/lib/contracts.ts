/**
 * contracts.ts – Silent Ledger
 * Centralise les adresses et ABIs des contrats déployés.
 * Mettre à jour NEXT_PUBLIC_ATTESTER_ADDRESS après le déploiement Foundry.
 */

// ─── ABI (extrait – seules les fonctions importantes pour le frontend) ────────
export const SILENT_LEDGER_ATTESTER_ABI = [
  // submitProof(proof, platformId, reputationScore) -> bytes32
  {
    type: "function",
    name: "submitProof",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "proof",
        type: "tuple",
        components: [
          {
            name: "claimInfo",
            type: "tuple",
            components: [
              { name: "provider", type: "string" },
              { name: "parameters", type: "string" },
              { name: "context", type: "string" },
            ],
          },
          {
            name: "signedClaim",
            type: "tuple",
            components: [
              {
                name: "claim",
                type: "tuple",
                components: [
                  { name: "identifier", type: "bytes32" },
                  { name: "owner", type: "address" },
                  { name: "timestampS", type: "uint32" },
                  { name: "epoch", type: "uint32" },
                ],
              },
              { name: "signatures", type: "bytes[]" },
            ],
          },
        ],
      },
      { name: "platformId", type: "bytes32" },
      { name: "reputationScore", type: "uint256" },
    ],
    outputs: [{ name: "attestationUID", type: "bytes32" }],
  },
  // getAttestations(address) -> bytes32[]
  {
    type: "function",
    name: "getAttestations",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bytes32[]" }],
  },
  // schemaUID() -> bytes32
  {
    type: "function",
    name: "schemaUID",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  // events
  {
    type: "event",
    name: "ProofSubmitted",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "platformId", type: "bytes32", indexed: true },
      { name: "attestationUID", type: "bytes32", indexed: false },
    ],
  },
] as const;

/** Adresse du contrat SilentLedgerAttester (à mettre à jour après `forge script`). */
export const ATTESTER_ADDRESS =
  (process.env.NEXT_PUBLIC_ATTESTER_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

/** URL de l'explorateur EAS pour inspecter les attestations. */
export const EAS_EXPLORER_URL = "https://sepolia.easscan.org/attestation/view";
