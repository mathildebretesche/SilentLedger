// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────────────────
// GhostVerifier.sol – Silent Ledger
//
// Vérificateur on-chain pour les preuves ZK "Ghost".
//
// Ce contrat joue deux rôles :
//   1. Vérifier la preuve Groth16 produite par GhostIdentity.circom
//      (appel au vérificateur auto-généré par snarkjs).
//   2. Émettre une attestation EAS pseudonyme qui prouve :
//      "Cette adresse Ethereum possède un compte <platform> avec un score ≥ threshold"
//      sans révéler le login réel.
//
// Flux d'appel :
//   client
//     └─► GhostVerifier.verifyAndAttest(pA, pB, pC, pubSignals)
//               │
//               ├─► Groth16Verifier.verifyProof()   ← auto-généré par snarkjs
//               │       revert si preuve invalide
//               │
//               ├─► _checkNullifier()   ← revert si double soumission
//               │
//               └─► IEAS.attest()   ← attestation EAS permanente
//
// Déploiement :
//   1. Générer Groth16Verifier.sol via :
//        snarkjs zkey export solidityverifier GhostIdentity_final.zkey Groth16Verifier.sol
//   2. Déployer Groth16Verifier, puis GhostVerifier en passant son adresse.
// ─────────────────────────────────────────────────────────────────────────────

import { IEAS, AttestationRequest, AttestationRequestData } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { ISchemaRegistry } from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import { ISchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

// ---------------------------------------------------------------------------
// Interface du vérificateur Groth16 auto-généré par snarkjs
// ---------------------------------------------------------------------------

/**
 * @dev Interface du contrat Groth16Verifier.sol produit par :
 *        snarkjs zkey export solidityverifier GhostIdentity_final.zkey Groth16Verifier.sol
 *      Le contrat généré expose `verifyProof(pA, pB, pC, pubSignals)`.
 */
interface IGroth16Verifier {
    function verifyProof(
        uint256[2]    calldata pA,
        uint256[2][2] calldata pB,
        uint256[2]    calldata pC,
        uint256[4]    calldata pubSignals
    ) external view returns (bool);
}

// ---------------------------------------------------------------------------
// GhostVerifier
// ---------------------------------------------------------------------------

contract GhostVerifier is Ownable {

    // ── Dépendances ────────────────────────────────────────────────────────
    /// @notice Contrat EAS pour la création d'attestations.
    IEAS public immutable eas;

    /// @notice Vérificateur Groth16 auto-généré depuis le circuit Circom.
    IGroth16Verifier public groth16Verifier;

    /// @notice UID du schéma EAS Ghost enregistré au déploiement.
    ///         Schéma : "uint256 identityCommitment, uint256 platformId,
    ///                   uint256 reputationThreshold, uint256 nullifier"
    bytes32 public ghostSchemaUID;

    // ── Anti double-preuve ─────────────────────────────────────────────────
    /// @notice Nullifiers déjà consommés.
    ///         nullifier = Poseidon(usernameHash, platformId, nonce)
    ///         Un nullifier ne peut être soumis qu'une seule fois.
    mapping(bytes32 => bool) public usedNullifiers;

    // ── Attestations par utilisateur ───────────────────────────────────────
    /// @notice UIDs EAS des attestations Ghost par adresse.
    mapping(address => bytes32[]) public ghostAttestations;

    // ── Events ─────────────────────────────────────────────────────────────

    /**
     * @dev Émis à chaque attestation Ghost créée avec succès.
     * @param attester            Adresse soumettant la preuve.
     * @param identityCommitment  Commitment de l'identité (Poseidon).
     * @param platformId          Hash de la plateforme.
     * @param reputationThreshold Seuil de réputation prouvé.
     * @param nullifier           Nullifier consommé (anti-replay).
     * @param attestationUID      UID EAS de l'attestation créée.
     */
    event GhostAttestationCreated(
        address indexed attester,
        uint256 indexed identityCommitment,
        uint256         platformId,
        uint256         reputationThreshold,
        bytes32 indexed nullifier,
        bytes32         attestationUID
    );

    // ── Errors ─────────────────────────────────────────────────────────────
    error InvalidProof();
    error NullifierAlreadyUsed(bytes32 nullifier);
    error SchemaNotRegistered();

    // ── Constructor ────────────────────────────────────────────────────────

    /**
     * @param _eas              Adresse du contrat EAS sur le réseau cible.
     * @param _schemaRegistry   Adresse du SchemaRegistry EAS.
     * @param _groth16Verifier  Adresse du Groth16Verifier.sol auto-généré.
     */
    constructor(
        address _eas,
        address _schemaRegistry,
        address _groth16Verifier
    ) Ownable(msg.sender) {
        eas = IEAS(_eas);
        groth16Verifier = IGroth16Verifier(_groth16Verifier);

        // Enregistrement du schéma Ghost dans l'EAS SchemaRegistry
        // Les champs correspondent exactement aux signaux publics du circuit :
        //   out_identityCommitment | out_platformId | out_reputationThreshold | out_nullifier
        ghostSchemaUID = ISchemaRegistry(_schemaRegistry).register(
            "uint256 identityCommitment,uint256 platformId,uint256 reputationThreshold,uint256 nullifier",
            ISchemaResolver(address(0)),
            true // révocable
        );
    }

    // ── External ───────────────────────────────────────────────────────────

    /**
     * @notice Vérifie une preuve ZK Ghost et crée l'attestation EAS associée.
     *
     * @dev pubSignals layout (ordre défini par les `signal output` du circuit) :
     *        [0] identityCommitment
     *        [1] platformId
     *        [2] reputationThreshold
     *        [3] nullifier
     *
     * @param pA          Point G1 de la preuve Groth16.
     * @param pB          Point G2 de la preuve Groth16.
     * @param pC          Point G1 de la preuve Groth16.
     * @param pubSignals  Les 4 signaux publics du circuit.
     *
     * @return attestationUID UID EAS de l'attestation créée.
     */
    function verifyAndAttest(
        uint256[2]    calldata pA,
        uint256[2][2] calldata pB,
        uint256[2]    calldata pC,
        uint256[4]    calldata pubSignals
    ) external returns (bytes32 attestationUID) {
        if (ghostSchemaUID == bytes32(0)) revert SchemaNotRegistered();

        // ── Vérification de la preuve Groth16 ─────────────────────────────
        // Revert automatique si la preuve est invalide (mauvais paramètres,
        // circuit non satisfait, clés incorrectes…).
        bool valid = groth16Verifier.verifyProof(pA, pB, pC, pubSignals);
        if (!valid) revert InvalidProof();

        // ── Anti double-preuve via nullifier ──────────────────────────────
        bytes32 nullifier = bytes32(pubSignals[3]);
        if (usedNullifiers[nullifier]) revert NullifierAlreadyUsed(nullifier);
        usedNullifiers[nullifier] = true;

        // ── Création de l'attestation EAS pseudonyme ──────────────────────
        // recipient = msg.sender (l'adresse Ethereum, pas le login plateforme)
        // Les données ABI-encodées correspondent au schéma Ghost enregistré.
        bytes memory encodedData = abi.encode(
            pubSignals[0], // identityCommitment
            pubSignals[1], // platformId
            pubSignals[2], // reputationThreshold
            pubSignals[3]  // nullifier
        );

        AttestationRequest memory request = AttestationRequest({
            schema: ghostSchemaUID,
            data: AttestationRequestData({
                recipient:      msg.sender,
                expirationTime: 0,
                revocable:      true,
                refUID:         bytes32(0),
                data:           encodedData,
                value:          0
            })
        });

        attestationUID = eas.attest(request);

        // ── Stockage + Event ───────────────────────────────────────────────
        ghostAttestations[msg.sender].push(attestationUID);

        emit GhostAttestationCreated(
            msg.sender,
            pubSignals[0],  // identityCommitment
            pubSignals[1],  // platformId
            pubSignals[2],  // reputationThreshold
            nullifier,
            attestationUID
        );
    }

    // ── Views ──────────────────────────────────────────────────────────────

    /**
     * @notice Retourne tous les UIDs EAS Ghost d'une adresse.
     */
    function getGhostAttestations(address user)
        external view returns (bytes32[] memory)
    {
        return ghostAttestations[user];
    }

    /**
     * @notice Vérifie si un nullifier a déjà été consommé.
     *         Permet au client de savoir avant soumission si la preuve
     *         sera acceptée.
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    /**
     * @notice Met à jour le vérificateur Groth16 si le circuit est mis à jour
     *         (nouveau setup de confiance).
     */
    function setGroth16Verifier(address _newVerifier) external onlyOwner {
        groth16Verifier = IGroth16Verifier(_newVerifier);
    }
}
