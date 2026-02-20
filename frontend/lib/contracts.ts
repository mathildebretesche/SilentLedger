/**
 * contracts.ts – Silent Ledger
 * Centralise les adresses et ABIs des contrats déployés.
 * Mettre à jour NEXT_PUBLIC_ATTESTER_ADDRESS après le déploiement Foundry.
 */

// ─── ABI (extrait – seules les fonctions importantes pour le frontend) ────────
export const SILENT_LEDGER_ATTESTER_ABI = [
  // ─── SilentLedgerAttester ABI ────────────────────────────────────────────────
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
  {
    type: "function",
    name: "submitOracleProof",
    stateMutability: "nonpayable",
    inputs: [
      { name: "signature", type: "bytes" },
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "recipient", type: "address" },
          { name: "competenceName", type: "string" },
          { name: "level", type: "uint8" },
          { name: "examScore", type: "uint32" },
          { name: "proofOfWorkURL", type: "string" },
          { name: "studentId", type: "bytes32" },
          { name: "deadline", type: "uint64" },
        ],
      },
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
  {
    type: "function",
    name: "sbtContract",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
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

// ─── CertificationSBT ABI ────────────────────────────────────────────────────
export const CERTIFICATION_SBT_ABI = [
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "getTokensOfOwner",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getCertification",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "competenceName", type: "string" },
          { name: "level", type: "uint8" },
          { name: "acquisitionDate", type: "uint64" },
          { name: "examScore", type: "uint32" },
          { name: "proofOfWorkURL", type: "string" },
          { name: "certHash", type: "bytes32" },
          { name: "studentId", type: "bytes32" },
        ],
      },
    ],
  },
] as const;

export const SBT_ADDRESS =
  (process.env.NEXT_PUBLIC_SBT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";
