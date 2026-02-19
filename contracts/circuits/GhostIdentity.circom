pragma circom 2.1.5;

// ─────────────────────────────────────────────────────────────────────────────
// GhostIdentity.circom – Silent Ledger
//
// Circuit Groth16 (BN128) qui prouve :
//
//   "Je connais un (usernameHash, salt, reclaimIdentifier, reputationScore) tels que :
//      1. identityCommitment == Poseidon(usernameHash, salt)
//      2. nullifier          == Poseidon(usernameHash, platformId, reclaimIdentifier)
//      3. reputationScore    >=  reputationThreshold
//      4. reputationScore    <   2^32  (range proof, évite overflow)"
//
// ── Sécurité anti cross-wallet ──────────────────────────────────────────────
// Le nullifier est lié au `reclaimIdentifier` : l'identifiant unique du claim
// Reclaim (hash déterministe des paramètres de la requête HTTPS). Deux portefeuilles
// différents qui tenteraient de prouver la MÊME contribution obtiendraient le MÊME
// nullifier → la deuxième soumission revertit sur GhostVerifier.sol.
//
// sans révéler usernameHash, salt, nonce ni reputationScore.
//
// Dépendances :
//   circomlib >= 2.0.5 (https://github.com/iden3/circomlib)
//   • poseidon.circom     → hash ZK-friendly
//   • comparators.circom  → LessThan, GreaterEqThan
//   • bitify.circom       → Num2Bits (range proof)
//
// Compilation :
//   circom circuits/GhostIdentity.circom \
//     --r1cs --wasm --sym \
//     -l node_modules/circomlib/circuits
//
// Setup de confiance (Powers of Tau pour 2^17 contraintes) :
//   snarkjs powersoftau new bn128 17 pot17_0000.ptau
//   snarkjs powersoftau contribute pot17_0000.ptau pot17_0001.ptau
//   snarkjs powersoftau prepare phase2 pot17_0001.ptau pot17_final.ptau
//   snarkjs groth16 setup GhostIdentity.r1cs pot17_final.ptau GhostIdentity_0000.zkey
//   snarkjs zkey contribute GhostIdentity_0000.zkey GhostIdentity_final.zkey
//   snarkjs zkey export verificationkey GhostIdentity_final.zkey GhostIdentity_vkey.json
//
// Les artefacts produits (.wasm, _final.zkey, _vkey.json) doivent être
// placés dans frontend/public/circuits/ pour être servis côté client.
// ─────────────────────────────────────────────────────────────────────────────

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";

// ─── Gabarit : range proof ≥ threshold ───────────────────────────────────────

/**
 * Prouve que `value` ≥ `threshold` sans révéler `value`.
 * Utilise deux LessThan pour vérifier : threshold <= value < 2^n.
 *
 * @param n  Nombre de bits de la plage (ex : 32 pour valeurs jusqu'à 4 milliards).
 */
template RangeProof(n) {
    signal input value;
    signal input threshold;

    // 1. value < 2^n  (value est bien un entier non signé sur n bits)
    component upperBound = LessThan(n);
    upperBound.in[0] <== value;
    upperBound.in[1] <== (1 << n);  // 2^n comme constante
    upperBound.out === 1;

    // 2. threshold <= value  ⟺  threshold < value + 1
    component lowerBound = LessThan(n);
    lowerBound.in[0] <== threshold;
    lowerBound.in[1] <== value + 1;
    lowerBound.out === 1;
}

// ─── Circuit principal ────────────────────────────────────────────────────────

template GhostIdentity() {

    // ── Inputs PRIVÉS (witness — jamais révélés) ──────────────────────────
    signal input usernameHash;      // keccak256(username) as BN128 field elem
    signal input reputationScore;   // score réel (ex: contributions GitHub)
    signal input salt;              // entropie 128 bits, générée côté client
    signal input reclaimIdentifier;  // CompleteClaimData.identifier (bytes32 → field)
                                    // Déterministe par claim → lie le nullifier
                                    // à une contribution spécifique, pas au wallet.

    // ── Inputs PUBLICS (vérifiés on-chain par GhostVerifier.sol) ─────────
    signal input identityCommitment;  // Poseidon(usernameHash, salt)
    signal input platformId;          // keccak256("github") as field elem
    signal input reputationThreshold; // seuil minimal prouvé
    signal input nullifier;           // Poseidon(usernameHash, platformId, reclaimIdentifier)

    // ── Outputs PUBLICS ───────────────────────────────────────────────────
    // Les signaux output sont automatiquement publics dans Circom.
    signal output out_identityCommitment;
    signal output out_platformId;
    signal output out_reputationThreshold;
    signal output out_nullifier;

    // =========================================================================
    // Contrainte 1 : identityCommitment == Poseidon(usernameHash, salt)
    // =========================================================================
    component commitmentHash = Poseidon(2);
    commitmentHash.inputs[0] <== usernameHash;
    commitmentHash.inputs[1] <== salt;

    // Le commitment fourni en public doit correspondre au hash calculé
    identityCommitment === commitmentHash.out;

    // =========================================================================
    // Contrainte 2 : nullifier == Poseidon(usernameHash, platformId, reclaimIdentifier)
    //
    // reclaimIdentifier est le hash déterministe du claim Reclaim.
    // Garanti unique par contribution → deux wallets différents qui soumettent
    // la même contribution produiront le MÊME nullifier → revert on-chain.
    // =========================================================================
    component nullifierHash = Poseidon(3);
    nullifierHash.inputs[0] <== usernameHash;
    nullifierHash.inputs[1] <== platformId;
    nullifierHash.inputs[2] <== reclaimIdentifier;

    nullifier === nullifierHash.out;

    // =========================================================================
    // Contrainte 3 : reputationScore >= reputationThreshold
    //                ET reputationScore < 2^32
    // =========================================================================
    component rangeCheck = RangeProof(32);
    rangeCheck.value     <== reputationScore;
    rangeCheck.threshold <== reputationThreshold;

    // =========================================================================
    // Propagation vers les outputs (rend les inputs publics vérifiables)
    // =========================================================================
    out_identityCommitment  <== identityCommitment;
    out_platformId          <== platformId;
    out_reputationThreshold <== reputationThreshold;
    out_nullifier           <== nullifier;
}

component main {
    public [
        identityCommitment,
        platformId,
        reputationThreshold,
        nullifier
    ]
} = GhostIdentity();
