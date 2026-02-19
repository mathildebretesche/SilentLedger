pragma circom 2.1.5;

// ─────────────────────────────────────────────────────────────────────────────
// GhostDisclosure.circom – Silent Ledger
//
// Circuit de Divulgation Sélective (Selective Disclosure).
//
// Prouve :  "Mon score sur <platform> est dans le tier [minScore, maxScore["
// Sans révéler : le login réel, le score exact, le salt ou le nonce.
//
// ─── Exemples de tiers ───────────────────────────────────────────────────────
//   Tier         minScore   maxScore    Message affiché
//   ─────────────────────────────────────────────────────
//   Bronze         1         50         "Contributeur actif"
//   Silver        50        500         "Contributeur régulier"
//   Gold         500       5000         "Contributeur expérimenté"
//   Platinum    5000       2^32         "Top contributeur"
//   Top 1%     10000       2^32         "Top 1% GitHub"
//
// L'utilisateur choisit le tier qu'il veut divulguer.
// tierMinScore et tierMaxScore sont des signaux PUBLICS → visible on-chain,
// mais le score exact ne l'est pas.
//
// ─── Contraintes ZK ──────────────────────────────────────────────────────────
//   1. identityCommitment == Poseidon(usernameHash, salt)
//   2. nullifier          == Poseidon(usernameHash, platformId, reclaimIdentifier)
//   3. tierMinScore       <= reputationScore          (score dans la borne basse)
//   4. reputationScore    <  tierMaxScore             (score dans la borne haute)
//   5. reputationScore    <  2^32                     (range proof overflow)
//
// ─── Compilation ─────────────────────────────────────────────────────────────
//   circom circuits/GhostDisclosure.circom \
//     --r1cs --wasm --sym \
//     -l node_modules/circomlib/circuits
// ─────────────────────────────────────────────────────────────────────────────

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

// ─── Gabarit : preuve d'appartenance à un intervalle ─────────────────────────

/**
 * Prouve que `minBound <= value < maxBound` sans révéler `value`.
 *
 * @param n  Nombre de bits de la plage (32 → valeurs jusqu'à ~4 milliards).
 */
template RangeInclusion(n) {
    signal input value;
    signal input minBound;
    signal input maxBound;

    // 1. value < 2^n  (overflow protection)
    component upperOverflow = LessThan(n);
    upperOverflow.in[0] <== value;
    upperOverflow.in[1] <== (1 << n);
    upperOverflow.out === 1;

    // 2. minBound <= value  ⟺  minBound < value + 1
    component lowerCheck = LessThan(n);
    lowerCheck.in[0] <== minBound;
    lowerCheck.in[1] <== value + 1;
    lowerCheck.out === 1;

    // 3. value < maxBound
    component upperCheck = LessThan(n);
    upperCheck.in[0] <== value;
    upperCheck.in[1] <== maxBound;
    upperCheck.out === 1;
}

// ─── Circuit principal ────────────────────────────────────────────────────────

template GhostDisclosure() {

    // ── Inputs PRIVÉS (witness — jamais révélés) ──────────────────────────
    signal input usernameHash;       // keccak256(username) as BN128 field elem
    signal input reputationScore;    // score réel — prouvé dans [min, max[
    signal input salt;               // entropie 128 bits locale
    signal input reclaimIdentifier;  // CompleteClaimData.identifier — anti cross-wallet

    // ── Inputs PUBLICS (vérifiés on-chain) ────────────────────────────────
    signal input identityCommitment; // Poseidon(usernameHash, salt)
    signal input platformId;         // keccak256("github"|"slack"|…) as field
    signal input tierMinScore;       // borne basse du tier choisi (inclusive)
    signal input tierMaxScore;       // borne haute du tier choisi (exclusive)
    signal input nullifier;          // Poseidon(usernameHash, platformId, reclaimIdentifier)

    // ── Outputs PUBLICS ───────────────────────────────────────────────────
    signal output out_identityCommitment;
    signal output out_platformId;
    signal output out_tierMinScore;
    signal output out_tierMaxScore;
    signal output out_nullifier;

    // =========================================================================
    // Contrainte 1 : identityCommitment == Poseidon(usernameHash, salt)
    //
    // Lie le commitment à l'identité privée sans révéler le username.
    // =========================================================================
    component commitmentHash = Poseidon(2);
    commitmentHash.inputs[0] <== usernameHash;
    commitmentHash.inputs[1] <== salt;
    identityCommitment === commitmentHash.out;

    // =========================================================================
    // Contrainte 2 : nullifier == Poseidon(usernameHash, platformId, reclaimIdentifier)
    //
    // Même schéma que GhostIdentity → compatible avec le même mapping
    // usedNullifiers on-chain dans GhostVerifier.sol.
    // =========================================================================
    component nullifierHash = Poseidon(3);
    nullifierHash.inputs[0] <== usernameHash;
    nullifierHash.inputs[1] <== platformId;
    nullifierHash.inputs[2] <== reclaimIdentifier;
    nullifier === nullifierHash.out;

    // =========================================================================
    // Contraintes 3+4+5 : tierMinScore <= reputationScore < tierMaxScore
    //                      ET reputationScore < 2^32
    //
    // C'est le cœur de la divulgation sélective : on prouve l'appartenance
    // au tier sans révéler le score exact.
    // =========================================================================
    component tierCheck = RangeInclusion(32);
    tierCheck.value    <== reputationScore;
    tierCheck.minBound <== tierMinScore;
    tierCheck.maxBound <== tierMaxScore;

    // =========================================================================
    // Propagation vers les outputs
    // =========================================================================
    out_identityCommitment <== identityCommitment;
    out_platformId         <== platformId;
    out_tierMinScore       <== tierMinScore;
    out_tierMaxScore       <== tierMaxScore;
    out_nullifier          <== nullifier;
}

component main {
    public [
        identityCommitment,
        platformId,
        tierMinScore,
        tierMaxScore,
        nullifier
    ]
} = GhostDisclosure();
