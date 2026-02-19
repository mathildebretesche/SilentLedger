/**
 * GhostProver.ts – Silent Ledger
 *
 * Moteur de preuve ZK "Ghost" : transforme une preuve zkTLS Reclaim en une
 * attestation ZK-SNARK (Groth16/BN128) qui prouve :
 *
 *   "Cette personne possède un compte valide sur <platform> dont le score
 *    de réputation est ≥ <threshold>"
 *
 * sans révéler :
 *   • le login / username réel
 *   • le score exact (seulement qu'il dépasse le seuil)
 *   • toute donnée liée à son identité réelle
 *
 * ─── Architecture ──────────────────────────────────────────────────────────
 *
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │  ReclaimProof (zkTLS)                                               │
 *  │    └─ extractedParams.contributions = "420"   (privé)              │
 *  │    └─ claimInfo.provider = "github"           (semi-public)        │
 *  └───────────────────────┬─────────────────────────────────────────────┘
 *                          │  GhostProver.prove()
 *                          ▼
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │  Circuit GhostIdentity.circom (Groth16 / BN128)                    │
 *  │                                                                     │
 *  │  Inputs PRIVÉS :                                                    │
 *  │    usernameHash     = keccak256("johndoe") as field                │
 *  │    reputationScore  = 420                                          │
 *  │    salt             = random128()                                   │
 *  │    nonce            = random128()                                   │
 *  │                                                                     │
 *  │  Inputs PUBLICS (vérifiés on-chain) :                              │
 *  │    identityCommitment = Poseidon(usernameHash, salt)               │
 *  │    platformId         = keccak256("github") as field               │
 *  │    reputationThreshold = 10                                        │
 *  │    nullifier          = Poseidon(usernameHash, platformId, nonce)  │
 *  └───────────────────────┬─────────────────────────────────────────────┘
 *                          │  snarkjs.groth16.fullProve()
 *                          ▼
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │  GhostAttestation                                                   │
 *  │    proof        : Groth16Proof  (pA, pB, pC)                       │
 *  │    publicSignals: [commitment, platformId, threshold, nullifier]    │
 *  │    calldata     : ABI-encodé pour GhostVerifier.sol                 │
 *  └───────────────────────┬─────────────────────────────────────────────┘
 *                          │  SilentLedgerAttester.submitGhostProof()
 *                          ▼
 *                     On-chain (Sepolia)
 */

import * as snarkjs from "snarkjs";

import type { ZKProof } from "../../services/ReclaimService";
import type {
  GhostAttestation,
  GhostCircuitInputs,
  GhostProverOptions,
  GhostPublicSignals,
  GhostVerifierCalldata,
  Groth16Proof,
} from "./types";
import { GhostProverError } from "./types";
import {
  computeClaimIdentifier,
  computeIdentityCommitment,
  computeNullifier,
  computePlatformFieldId,
  computeUsernameHash,
  fieldToHex,
  generateSalt,
} from "./commitments";

// ─── Chemins vers les artefacts du circuit ────────────────────────────────────

/**
 * Ces fichiers sont produits par la compilation du circuit Circom :
 *   circom circuits/GhostIdentity.circom --r1cs --wasm --sym
 *   snarkjs groth16 setup ...       → zkey
 *   snarkjs zkey export verificationkey → vkey.json
 *
 * En production, les servir depuis /public pour qu'ils soient
 * accessibles côté client sans build step supplémentaire.
 */
const CIRCUIT_WASM_URL = "/circuits/GhostIdentity_js/GhostIdentity.wasm";
const CIRCUIT_ZKEY_URL = "/circuits/GhostIdentity_final.zkey";
const CIRCUIT_VKEY_URL = "/circuits/GhostIdentity_vkey.json";

// ─── Seuils par défaut ────────────────────────────────────────────────────────

const DEFAULT_REPUTATION_THRESHOLD = 1n;

// ─── GhostProver ─────────────────────────────────────────────────────────────

/**
 * Moteur de preuve ZK Ghost. Instancier une fois par session.
 *
 * @example
 * const prover = new GhostProver();
 * const attestation = await prover.prove(reclaimProof, "github", "johndoe");
 *
 * // Soumettre on-chain
 * await contract.submitGhostProof(
 *   attestation.calldata.pA,
 *   attestation.calldata.pB,
 *   attestation.calldata.pC,
 *   attestation.calldata.pubSignals,
 * );
 */
export class GhostProver {
  /** Clé de vérification chargée depuis /public/circuits/. */
  private vKey: object | null = null;

  // ── Chargement de la clé de vérification ──────────────────────────────

  private async loadVKey(): Promise<object> {
    if (this.vKey) return this.vKey;
    try {
      const res = await fetch(CIRCUIT_VKEY_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.vKey = await res.json();
      return this.vKey!;
    } catch (err) {
      throw new GhostProverError(
        "CIRCUIT_NOT_LOADED",
        `Impossible de charger la vkey depuis ${CIRCUIT_VKEY_URL}`,
        err
      );
    }
  }

  // ── Génération de la preuve ────────────────────────────────────────────

  /**
   * Génère une preuve ZK Ghost à partir d'une preuve Reclaim zkTLS.
   *
   * @param reclaimProof  Preuve zkTLS validée par `ReclaimService`.
   * @param platform      Plateforme source ("github", "slack", "discord"…).
   * @param username      Login réel — utilisé en local pour les commitments,
   *                      ne quitte JAMAIS le navigateur.
   * @param options       Options du prover (seuil de réputation, etc.).
   *
   * @throws {GhostProverError} si la réputation est insuffisante ou si le
   *                            circuit ne parvient pas à prouver le témoin.
   */
  async prove(
    reclaimProof: ZKProof,
    platform: string,
    username: string,
    options: GhostProverOptions = {}
  ): Promise<GhostAttestation> {
    const threshold =
      BigInt(options.reputationThreshold ?? 1) || DEFAULT_REPUTATION_THRESHOLD;

    // ── Extraction du score de réputation ──────────────────────────────
    const rawScore = reclaimProof.extractedParams["contributions"] ?? "0";
    const reputationScore = BigInt(rawScore.replace(/[^0-9]/g, "") || "0");

    if (reputationScore < threshold) {
      throw new GhostProverError(
        "INSUFFICIENT_REPUTATION",
        `Score ${reputationScore} inférieur au seuil requis ${threshold}`
      );
    }

    // ── Calcul des inputs privés ───────────────────────────────────────
    const usernameHash = computeUsernameHash(username);
    const salt = generateSalt();

    // reclaimIdentifier : identifier déterministe issu du claim Reclaim.
    // Garantit que la même contribution ne peut être prouvée qu'une seule fois,
    // quel que soit le wallet qui soumet.
    const reclaimIdentifier = computeClaimIdentifier(reclaimProof.identifier);

    // ── Calcul des inputs publics ──────────────────────────────────────
    const platformId = computePlatformFieldId(platform);
    const identityCommitment = await computeIdentityCommitment(
      usernameHash,
      salt
    );
    const nullifier = await computeNullifier(
      usernameHash,
      platformId,
      reclaimIdentifier
    );

    // ── Construction des inputs du circuit ────────────────────────────
    const circuitInputs: GhostCircuitInputs = {
      // privés
      usernameHash,
      reputationScore,
      salt,
      reclaimIdentifier,
      // publics
      identityCommitment,
      platformId,
      reputationThreshold: threshold,
      nullifier,
    };

    // ── Génération de la preuve Groth16 ───────────────────────────────
    const { proof, publicSignals } = await this._fullProve(circuitInputs);

    // ── Vérification locale (sanity check avant soumission on-chain) ──
    await this._verifyLocally(proof, publicSignals);

    // ── Export du calldata Solidity ───────────────────────────────────
    const calldata = await this._exportCalldata(proof, publicSignals);

    return {
      proof,
      publicSignals: publicSignals as GhostPublicSignals,
      calldata,
      meta: {
        platform,
        reputationThreshold: Number(threshold),
        generatedAt: Date.now(),
        nullifierHex: fieldToHex(BigInt(publicSignals[3])),
      },
    };
  }

  // ── Vérification locale ────────────────────────────────────────────────

  /**
   * Vérifie la preuve localement avec la vkey.
   * Permet de détecter une erreur avant de payer du gas on-chain.
   */
  async verifyLocally(
    attestation: GhostAttestation
  ): Promise<boolean> {
    return this._verifyLocally(
      attestation.proof,
      Array.from(attestation.publicSignals)
    );
  }

  // ── Méthodes internes ──────────────────────────────────────────────────

  private async _fullProve(
    inputs: GhostCircuitInputs
  ): Promise<{ proof: Groth16Proof; publicSignals: string[] }> {
    // snarkjs attend des strings pour les BigInts
    const stringifiedInputs: Record<string, string> = Object.fromEntries(
      Object.entries(inputs).map(([k, v]) => [k, v.toString()])
    );

    try {
      const result = await snarkjs.groth16.fullProve(
        stringifiedInputs,
        CIRCUIT_WASM_URL,
        CIRCUIT_ZKEY_URL
      );
      return result as { proof: Groth16Proof; publicSignals: string[] };
    } catch (err) {
      throw new GhostProverError(
        "PROOF_GENERATION_FAILED",
        "Échec de la génération de la preuve Groth16",
        err
      );
    }
  }

  private async _verifyLocally(
    proof: Groth16Proof,
    publicSignals: string[]
  ): Promise<boolean> {
    const vKey = await this.loadVKey();

    try {
      const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      if (!valid) {
        throw new GhostProverError(
          "PROOF_GENERATION_FAILED",
          "La preuve générée est invalide (vérification locale échouée)"
        );
      }
      return true;
    } catch (err) {
      if (err instanceof GhostProverError) throw err;
      throw new GhostProverError(
        "PROOF_GENERATION_FAILED",
        "Erreur lors de la vérification locale",
        err
      );
    }
  }

  private async _exportCalldata(
    proof: Groth16Proof,
    publicSignals: string[]
  ): Promise<GhostVerifierCalldata> {
    // snarkjs retourne une string du style:
    // ["0x...", "0x..."],  [["0x...","0x..."],["0x...","0x..."]], ...
    const raw: string = await snarkjs.groth16.exportSolidityCallData(
      proof,
      publicSignals
    );

    // Parse the raw calldata string into a structured object
    const parsed = JSON.parse(`[${raw}]`) as [
      [string, string],
      [[string, string], [string, string]],
      [string, string],
      [string, string, string, string]
    ];

    return {
      pA: [BigInt(parsed[0][0]), BigInt(parsed[0][1])],
      pB: [
        [BigInt(parsed[1][0][0]), BigInt(parsed[1][0][1])],
        [BigInt(parsed[1][1][0]), BigInt(parsed[1][1][1])],
      ],
      pC: [BigInt(parsed[2][0]), BigInt(parsed[2][1])],
      pubSignals: [
        BigInt(parsed[3][0]),
        BigInt(parsed[3][1]),
        BigInt(parsed[3][2]),
        BigInt(parsed[3][3]),
      ],
    };
  }
}

// ─── Singleton exporté ────────────────────────────────────────────────────────

/**
 * Instance partagée du GhostProver pour toute l'application.
 * La vkey est chargée une fois, mise en cache, et réutilisée.
 */
export const ghostProver = new GhostProver();
