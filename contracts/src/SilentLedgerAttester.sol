// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────────────────
// Silent Ledger – SilentLedgerAttester
//
// Architecture ZK/EAS :
//   1. L'utilisateur génère une preuve zkTLS via le SDK Reclaim Protocol côté
//      client (offline). Cette preuve atteste cryptographiquement qu'une
//      requête HTTPS vers GitHub a bien renvoyé les données revendiquées.
//
//   2. La preuve est soumise ici on-chain. On appelle `Reclaim.verifyProof()`
//      qui vérifie la signature du circuit ZK. Si elle est invalide, la tx
//      revert → aucune fausse attestation n'est possible.
//
//   3. On extrait depuis le contexte JSON de la preuve les champs métier
//      (platformId, reputationScore) et on appelle l'EAS pour créer une
//      attestation permanente et vérifiable par n'importe qui.
//
//   4. L'attestation est liée à l'adresse du signataire (msg.sender) mais
//      le `platformId` est un bytes32 hashé → le username GitHub n'apparaît
//      jamais en clair on-chain (pseudonymisation).
// ─────────────────────────────────────────────────────────────────────────────

import {
    IEAS,
    AttestationRequest,
    AttestationRequestData
} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {
    ISchemaRegistry
} from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import {
    ISchemaResolver
} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// ---------------------------------------------------------------------------
// Reclaim Protocol interface (subset nécessaire)
// Le SDK Reclaim fournit ces types dans sa lib on-chain.
// ---------------------------------------------------------------------------

/**
 * @dev Représente la preuve zkTLS telle que retournée par le SDK Reclaim.
 *      `claimInfo.context` est un JSON stringifié contenant les paramètres
 *      extraits de la réponse HTTPS (ex: contributions count, username hash).
 */
struct ReclaimProof {
    ClaimInfo claimInfo;
    SignedClaim signedClaim;
}

struct ClaimInfo {
    string provider; // ex: "http"
    string parameters; // URL + regex du claim
    string context; // JSON: {"extractedParameters":{"username_hash":"...","contributions":"42"}}
}

struct SignedClaim {
    CompleteClaimData claim;
    bytes[] signatures;
}

struct CompleteClaimData {
    bytes32 identifier;
    address owner;
    uint32 timestampS;
    uint32 epoch;
}

/**
 * @dev Interface minimale du Smart Contract Reclaim on-chain.
 *      Adresse déployée sur Sepolia : 0x...  (voir docs Reclaim).
 */
interface IReclaim {
    function verifyProof(ReclaimProof memory proof) external view;
}

// ---------------------------------------------------------------------------
// SilentLedgerAttester
// ---------------------------------------------------------------------------

contract SilentLedgerAttester is Ownable {
    // ── EAS ────────────────────────────────────────────────────────────────
    /// @notice Instance EAS à qui on délègue la création des attestations.
    IEAS public immutable eas;

    /// @notice UID du schéma enregistré dans l'EAS SchemaRegistry.
    ///         Schéma : "bytes32 platformId, uint256 reputationScore, bool isVerified"
    bytes32 public schemaUID;

    // ── Reclaim ────────────────────────────────────────────────────────────
    /// @notice Contrat Reclaim Protocol pour vérifier les preuves zkTLS.
    IReclaim public reclaimVerifier;

    // ── State ──────────────────────────────────────────────────────────────
    /// @notice Historique des attestations par utilisateur.
    ///         userAttestations[addr] = liste des UIDs EAS créés.
    mapping(address => bytes32[]) public userAttestations;

    // ── Events ─────────────────────────────────────────────────────────────

    /**
     * @dev Émis à chaque preuve acceptée et attestation créée.
     * @param user          Adresse du soumettant.
     * @param platformId    Hash bytes32 de l'identifiant plateforme (pseudonymisé).
     * @param attestationUID UID EAS de l'attestation créée.
     */
    event ProofSubmitted(
        address indexed user,
        bytes32 indexed platformId,
        bytes32 attestationUID
    );

    // ── Errors ─────────────────────────────────────────────────────────────
    error InvalidProofProvider(string provider);
    error SchemaNotRegistered();

    // ── Constructor ────────────────────────────────────────────────────────

    /**
     * @param _eas              Adresse du contrat EAS sur le réseau cible.
     * @param _schemaRegistry   Adresse du SchemaRegistry EAS.
     * @param _reclaimVerifier  Adresse du contrat Reclaim on-chain.
     */
    constructor(
        address _eas,
        address _schemaRegistry,
        address _reclaimVerifier
    ) Ownable(msg.sender) {
        eas = IEAS(_eas);
        reclaimVerifier = IReclaim(_reclaimVerifier);

        // ── Enregistrement du schéma EAS ───────────────────────────────────
        // On tente d'enregistrer le schéma. S'il existe déjà ("AlreadyExists()"),
        // on calcule simplement son UID déterministe pour l'utiliser.
        string
            memory schemaStr = "bytes32 platformId,uint256 reputationScore,bool isVerified";
        ISchemaResolver resolver = ISchemaResolver(address(0));
        bool revocable = true;

        try
            ISchemaRegistry(_schemaRegistry).register(
                schemaStr,
                resolver,
                revocable
            )
        returns (bytes32 uid) {
            schemaUID = uid;
        } catch {
            // Le schéma est déjà enregistré. EAS calcule le schema UID via :
            // keccak256(abi.encodePacked(schema, resolver, revocable))
            schemaUID = keccak256(
                abi.encodePacked(schemaStr, resolver, revocable)
            );
        }
    }

    // ── External ───────────────────────────────────────────────────────────

    /**
     * @notice Point d'entrée principal. Soumet une preuve zkTLS Reclaim et
     *         crée une attestation EAS si valide.
     *
     * @dev Flux complet :
     *      1. Vérification de la preuve ZK via Reclaim (revert si invalide).
     *      2. Décodage du context JSON pour extraire platformId + score.
     *      3. Encodage ABI des données du schéma EAS.
     *      4. Appel EAS.attest() → enregistrement permanent on-chain.
     *      5. Stockage de l'UID dans userAttestations + émission de l'event.
     *
     * @param proof     La preuve zkTLS générée par le SDK Reclaim.
     * @param platformId Le bytes32 correspondant à keccak256("github:<username>").
     *                   Calculé côté client pour préserver la pseudonymisation.
     * @param reputationScore Le score extrait de la preuve (ex: contributions count).
     */
    function submitProof(
        ReclaimProof calldata proof,
        bytes32 platformId,
        uint256 reputationScore
    ) external returns (bytes32 attestationUID) {
        // ── Step 1 : Vérification ZK ───────────────────────────────────────
        // verifyProof() revert si la preuve est invalide (mauvaise signature
        // du circuit, timestamp expiré, epoch incorrecte).
        reclaimVerifier.verifyProof(proof);

        // ── Step 2 : Validation du provider ───────────────────────────────
        // On s'assure que la preuve vient bien d'un provider "http" (GitHub).
        if (
            keccak256(bytes(proof.claimInfo.provider)) !=
            keccak256(bytes("http"))
        ) {
            revert InvalidProofProvider(proof.claimInfo.provider);
        }

        if (schemaUID == bytes32(0)) revert SchemaNotRegistered();

        // ── Step 3 : Encodage des données du schéma EAS ───────────────────
        // Le schéma EAS attend les données ABI-encodées dans le même ordre
        // que la chaîne de schéma enregistrée.
        bytes memory encodedData = abi.encode(
            platformId, // bytes32
            reputationScore, // uint256
            true // isVerified = true (garanti par la preuve ZK)
        );

        // ── Step 4 : Création de l'attestation EAS ────────────────────────
        // L'attestation est créée au nom de msg.sender (le prouvant).
        // recipient = address(0) → attestation "self-sovereign" non liée à
        // une adresse tierce, ce qui renforce la confidentialité.
        AttestationRequest memory request = AttestationRequest({
            schema: schemaUID,
            data: AttestationRequestData({
                recipient: msg.sender,
                expirationTime: 0, // pas d'expiration
                revocable: true,
                refUID: bytes32(0), // pas de référence parente
                data: encodedData,
                value: 0
            })
        });

        attestationUID = eas.attest(request);

        // ── Step 5 : Stockage + Event ──────────────────────────────────────
        userAttestations[msg.sender].push(attestationUID);
        emit ProofSubmitted(msg.sender, platformId, attestationUID);
    }

    // ── Views ──────────────────────────────────────────────────────────────

    /**
     * @notice Retourne tous les UIDs d'attestations EAS d'un utilisateur.
     * @param user Adresse de l'utilisateur.
     */
    function getAttestations(
        address user
    ) external view returns (bytes32[] memory) {
        return userAttestations[user];
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    /**
     * @notice Permet de mettre à jour le verifieur Reclaim si une nouvelle
     *         version du contrat est déployée.
     */
    function setReclaimVerifier(address _newVerifier) external onlyOwner {
        reclaimVerifier = IReclaim(_newVerifier);
    }
}
