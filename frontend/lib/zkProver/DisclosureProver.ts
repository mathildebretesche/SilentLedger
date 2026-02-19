/**
 * DisclosureProver.ts – Silent Ledger
 *
 * Moteur de Divulgation Sélective (Selective Disclosure).
 *
 * Permet à l'utilisateur de choisir CE QU'IL RÉVÈLE depuis sa preuve Reclaim.
 * Au lieu d'exposer son score exact ou son login, il sélectionne un "tier"
 * et prouve uniquement qu'il se trouve dans cet intervalle.
 *
 * Exemples :
 *   "Je suis top 1% sur GitHub"   sans révéler son login ni son score exact.
 *   "J'ai 500+ contributions"     sans révéler si c'est 501 ou 9999.
 *   "Je suis contributeur actif"  sans aucune autre information.
 *
 * Circuit utilisé : GhostDisclosure.circom (Groth16/BN128)
 * Signaux publics : [identityCommitment, platformId, tierMinScore, tierMaxScore, nullifier]
 */

import * as snarkjs from "snarkjs";

import type { ZKProof } from "../../../services/ReclaimService";
import type {
  DisclosureTier,
  GhostDisclosureAttestation,
  GhostDisclosureCalldata,
  GhostDisclosureCircuitInputs,
  GhostDisclosurePublicSignals,
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

// ─── Artefacts du circuit GhostDisclosure ─────────────────────────────────────

const DISCLOSURE_WASM_URL = "/circuits/GhostDisclosure_js/GhostDisclosure.wasm";
const DISCLOSURE_ZKEY_URL = "/circuits/GhostDisclosure_final.zkey";
const DISCLOSURE_VKEY_URL = "/circuits/GhostDisclosure_vkey.json";

// ─── Tiers prédéfinis ─────────────────────────────────────────────────────────

/**
 * Catalogue de tiers de divulgation prédéfinis.
 * L'utilisateur choisit le tier qu'il souhaite prouver.
 * Chaque tier correspond à un intervalle [minScore, maxScore[.
 *
 * Ces tiers peuvent être étendus ou surchargés via `customTier()`.
 */
export const DISCLOSURE_TIERS: Record<string, DisclosureTier> = {
  /** Au moins 1 contribution — prouver une activité minimale. */
  ACTIVE: {
    label: "Contributeur actif",
    description: "A au moins 1 contribution sur la plateforme.",
    minScore: 1,
    maxScore: 50,
  },

  /** Entre 50 et 499 contributions. */
  REGULAR: {
    label: "Contributeur régulier",
    description: "Entre 50 et 499 contributions.",
    minScore: 50,
    maxScore: 500,
  },

  /** Entre 500 et 4999 contributions. */
  GOLD: {
    label: "Contributeur Gold",
    description: "Plus de 500 contributions.",
    minScore: 500,
    maxScore: 5000,
  },

  /** 5000+ contributions — top contributeur. */
  PLATINUM: {
    label: "Top contributeur",
    description: "Plus de 5 000 contributions.",
    minScore: 5000,
    maxScore: 2 ** 32 - 1,
  },

  /** Équivalent "top 1%" sur les principales plateformes. */
  TOP_1_PCT: {
    label: "Top 1%",
    description: "Dans le top 1% des contributeurs de la plateforme.",
    minScore: 10_000,
    maxScore: 2 ** 32 - 1,
  },

  /** Seuil minimal pour participer à certaines DAOs / gouvernances. */
  DAO_ELIGIBLE: {
    label: "DAO eligible",
    description: "Réputation suffisante pour participer à la gouvernance.",
    minScore: 100,
    maxScore: 2 ** 32 - 1,
  },
};

/**
 * Crée un tier personnalisé à la volée.
 *
 * @example
 * const myTier = customTier("200+ contributions", 200, 2**32 - 1);
 */
export function customTier(
  label: string,
  minScore: number,
  maxScore: number,
  description?: string
): DisclosureTier {
  return {
    label,
    minScore,
    maxScore,
    description: description ?? `Score entre ${minScore} et ${maxScore}.`,
  };
}

/**
 * Retourne le tier le plus élevé que l'utilisateur peut prouver
 * pour un score donné, ou null si aucun tier n'est satisfait.
 *
 * Utilisation : proposer automatiquement le meilleur tier disponible.
 */
export function bestTierForScore(score: number): DisclosureTier | null {
  const candidates = Object.values(DISCLOSURE_TIERS).filter(
    (t) => score >= t.minScore && score < t.maxScore
  );
  if (candidates.length === 0) return null;
  // Retourne celui avec le minScore le plus élevé (tier le plus "exclusif")
  return candidates.sort((a, b) => b.minScore - a.minScore)[0];
}

/**
 * Retourne tous les tiers que l'utilisateur peut prouver pour un score donné.
 * L'utilisateur choisit ensuite lequel révéler.
 */
export function eligibleTiersForScore(score: number): DisclosureTier[] {
  return Object.values(DISCLOSURE_TIERS)
    .filter((t) => score >= t.minScore && score < t.maxScore)
    .sort((a, b) => b.minScore - a.minScore);
}

// ─── DisclosureProver ─────────────────────────────────────────────────────────

/**
 * Génère une preuve de divulgation sélective (circuit GhostDisclosure).
 *
 * @example
 * const prover = new DisclosureProver();
 *
 * // L'utilisateur choisit son tier
 * const eligible = eligibleTiersForScore(420);
 * const tier = eligible[0]; // "Contributeur Gold"
 *
 * const attestation = await prover.prove(reclaimProof, "github", "johndoe", tier);
 *
 * // On-chain : seuls commitment, platformId, [50, 500[, nullifier sont visibles
 * await disclosureVerifier.verifyAndAttest(
 *   attestation.calldata.pA,
 *   attestation.calldata.pB,
 *   attestation.calldata.pC,
 *   attestation.calldata.pubSignals,
 * );
 */
export class DisclosureProver {
  private vKey: object | null = null;

  // ── Chargement de la vkey ──────────────────────────────────────────────

  private async loadVKey(): Promise<object> {
    if (this.vKey) return this.vKey;
    try {
      const res = await fetch(DISCLOSURE_VKEY_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.vKey = await res.json();
      return this.vKey!;
    } catch (err) {
      throw new GhostProverError(
        "CIRCUIT_NOT_LOADED",
        `Impossible de charger la vkey depuis ${DISCLOSURE_VKEY_URL}`,
        err
      );
    }
  }

  // ── Génération de la preuve ────────────────────────────────────────────

  /**
   * Génère une preuve ZK de divulgation sélective.
   *
   * @param reclaimProof  Preuve zkTLS validée par `ReclaimService`.
   * @param platform      Plateforme source ("github", "slack"…).
   * @param username      Login réel — NE QUITTE PAS LE NAVIGATEUR.
   * @param tier          Tier à prouver (depuis `DISCLOSURE_TIERS` ou `customTier()`).
   *
   * @throws {GhostProverError} SCORE_NOT_IN_TIER si le score est hors de l'intervalle.
   * @throws {GhostProverError} PROOF_GENERATION_FAILED si le circuit échoue.
   */
  async prove(
    reclaimProof: ZKProof,
    platform: string,
    username: string,
    tier: DisclosureTier
  ): Promise<GhostDisclosureAttestation> {
    // ── Extraction + validation du score ──────────────────────────────
    const rawScore = reclaimProof.extractedParams["contributions"] ?? "0";
    const reputationScore = Number(rawScore.replace(/[^0-9]/g, "") || "0");

    if (reputationScore < tier.minScore || reputationScore >= tier.maxScore) {
      throw new GhostProverError(
        "SCORE_NOT_IN_TIER",
        `Score ${reputationScore} hors du tier "${tier.label}" ` +
          `[${tier.minScore}, ${tier.maxScore}[`
      );
    }

    // ── Inputs privés ─────────────────────────────────────────────────
    const usernameHash = computeUsernameHash(username);
    const salt = generateSalt();
    const reclaimIdentifier = computeClaimIdentifier(reclaimProof.identifier);

    // ── Inputs publics ────────────────────────────────────────────────
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
    const tierMinScore = BigInt(tier.minScore);
    // maxScore = 2^32 - 1 en circuit → on utilise 2^32 comme borne exclusive
    const tierMaxScore =
      tier.maxScore >= 2 ** 32 - 1
        ? BigInt(2 ** 32) // la borne haute du circuit est strictement exclusive
        : BigInt(tier.maxScore);

    // ── Construction des inputs du circuit ────────────────────────────
    const circuitInputs: GhostDisclosureCircuitInputs = {
      usernameHash,
      reputationScore: BigInt(reputationScore),
      salt,
      reclaimIdentifier,
      identityCommitment,
      platformId,
      tierMinScore,
      tierMaxScore,
      nullifier,
    };

    // ── Génération Groth16 ────────────────────────────────────────────
    const { proof, publicSignals } = await this._fullProve(circuitInputs);

    // ── Vérification locale ───────────────────────────────────────────
    await this._verifyLocally(proof, publicSignals);

    // ── Export calldata ───────────────────────────────────────────────
    const calldata = await this._exportCalldata(proof, publicSignals);

    return {
      proof,
      publicSignals: publicSignals as GhostDisclosurePublicSignals,
      calldata,
      tier,
      meta: {
        platform,
        tierLabel: tier.label,
        generatedAt: Date.now(),
        nullifierHex: fieldToHex(BigInt(publicSignals[4])),
      },
    };
  }

  // ── Vérification locale ────────────────────────────────────────────────

  async verifyLocally(
    attestation: GhostDisclosureAttestation
  ): Promise<boolean> {
    return this._verifyLocally(
      attestation.proof,
      Array.from(attestation.publicSignals)
    );
  }

  // ── Méthodes internes ──────────────────────────────────────────────────

  private async _fullProve(
    inputs: GhostDisclosureCircuitInputs
  ): Promise<{ proof: Groth16Proof; publicSignals: string[] }> {
    const stringifiedInputs: Record<string, string> = Object.fromEntries(
      Object.entries(inputs).map(([k, v]) => [k, v.toString()])
    );
    try {
      const result = await snarkjs.groth16.fullProve(
        stringifiedInputs,
        DISCLOSURE_WASM_URL,
        DISCLOSURE_ZKEY_URL
      );
      return result as { proof: Groth16Proof; publicSignals: string[] };
    } catch (err) {
      throw new GhostProverError(
        "PROOF_GENERATION_FAILED",
        "Échec de la génération de la preuve Groth16 (GhostDisclosure)",
        err
      );
    }
  }

  private async _verifyLocally(
    proof: Groth16Proof,
    publicSignals: string[]
  ): Promise<boolean> {
    const vKey = await this.loadVKey();
    const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    if (!valid) {
      throw new GhostProverError(
        "PROOF_GENERATION_FAILED",
        "Vérification locale de la preuve GhostDisclosure échouée"
      );
    }
    return true;
  }

  private async _exportCalldata(
    proof: Groth16Proof,
    publicSignals: string[]
  ): Promise<GhostDisclosureCalldata> {
    const raw: string = await snarkjs.groth16.exportSolidityCallData(
      proof,
      publicSignals
    );
    const parsed = JSON.parse(`[${raw}]`) as [
      [string, string],
      [[string, string], [string, string]],
      [string, string],
      [string, string, string, string, string]
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
        BigInt(parsed[3][4]),
      ],
    };
  }
}

// ─── Singleton exporté ────────────────────────────────────────────────────────

/** Instance partagée du DisclosureProver. */
export const disclosureProver = new DisclosureProver();
