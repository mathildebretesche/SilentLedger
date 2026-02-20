// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────────────────
// CertificationSBT – ERC-5192 Soulbound Certification Token
//
// Architecture:
//   1. An authorised "issuer" (a logic contract or trusted EOA) calls mint()
//      after validating on-chain that the student completed the challenge.
//   2. Each token records a Certification struct on-chain (competence name,
//      level, score, acquisition date, proof URL, pseudonymised student ID).
//   3. The token is permanently locked — _update() reverts any transfer where
//      from != address(0) (not a mint) and to != address(0) (not a burn).
//   4. tokenURI() returns a self-contained data URI (base64 JSON + SVG badge).
//   5. The owner or issuer may revoke (burn) a token at any time.
// ─────────────────────────────────────────────────────────────────────────────

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721URIStorage
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC5192} from "./IERC5192.sol";

// ─────────────────────────────────────────────────────────────────────────────
// Data structures
// ─────────────────────────────────────────────────────────────────────────────

/// @dev Level enum stored as uint8 on-chain.
enum CertLevel {
    Beginner,
    Intermediate,
    Expert
}

/**
 * @dev Full metadata stored on-chain for each token.
 *      `certHash` and `studentId` are stored as bytes32 for immutability.
 *      Rich JSON metadata is generated on-the-fly in tokenURI().
 */
struct Certification {
    string competenceName; // e.g. "Smart Contract Security"
    CertLevel level; // Beginner / Intermediate / Expert
    uint64 acquisitionDate; // block.timestamp at mint
    uint32 examScore; // 0–100
    string proofOfWorkURL; // GitHub URL or IPFS CID
    bytes32 certHash; // keccak256(competenceName · studentId · acquisitionDate)
    bytes32 studentId; // keccak256 of student identifier (pseudonymised)
}

/**
 * @dev Parameters passed by the issuer to mint().
 *      Kept separate from Certification to avoid stack-too-deep during minting.
 */
struct CertificationParams {
    address recipient;
    string competenceName;
    CertLevel level;
    uint32 examScore;
    string proofOfWorkURL;
    bytes32 studentId; // keccak256 of student identifier
}

// ─────────────────────────────────────────────────────────────────────────────
// CertificationSBT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @title  CertificationSBT
 * @notice Non-transferable ERC-721 certification badges complying with ERC-5192.
 *
 * @dev    Inheritance chain:
 *           ERC721URIStorage (OpenZeppelin v5)
 *             └─ ERC721 (base)
 *           IERC5192 (locked / Locked event)
 *           Ownable   (admin functions)
 */
contract CertificationSBT is ERC721URIStorage, IERC5192, Ownable {
    using Strings for uint256;
    using Strings for uint32;
    using Strings for uint64;

    // ── ERC-165 interface id for IERC5192 ─────────────────────────────────────
    bytes4 private constant _INTERFACE_ID_ERC5192 = 0xb45a3c0e;

    // ── State ─────────────────────────────────────────────────────────────────

    /// @notice Address authorised to call mint() and revoke().
    address public issuer;

    /// @dev Monotonically increasing token id counter.
    uint256 private _nextTokenId;

    /// @dev Metadata stored per token.
    mapping(uint256 => Certification) private _certifications;

    /// @dev Mapping owner => list of tokenIds (Simple Enumeration)
    mapping(address => uint256[]) private _ownerTokens;

    // ── Events ────────────────────────────────────────────────────────────────

    event CertificationIssued(
        address indexed recipient,
        uint256 indexed tokenId,
        bytes32 certHash
    );

    event CertificationRevoked(uint256 indexed tokenId);

    event IssuerUpdated(address indexed oldIssuer, address indexed newIssuer);

    // ── Errors ────────────────────────────────────────────────────────────────

    error NotIssuer();
    error SoulboundTransferBlocked(uint256 tokenId);
    error TokenDoesNotExist(uint256 tokenId);
    error NotAuthorizedToRevoke();
    error ScoreOutOfRange(uint32 score);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyIssuer() {
        if (msg.sender != issuer) revert NotIssuer();
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _issuer  Address of the logic contract (or trusted EOA) that
     *                 validates proofs and calls mint().
     */
    constructor(
        address _issuer
    ) ERC721("Silent Ledger Certification", "SLC") Ownable(msg.sender) {
        issuer = _issuer;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Minting
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Mint a new Soulbound certification badge.
     * @dev    Only callable by the authorised issuer.
     *         The certHash is derived on-chain for immutability.
     *
     * @param  params  CertificationParams struct with all certification data.
     * @return tokenId The id of the newly minted token.
     */
    function mint(
        CertificationParams calldata params
    ) external onlyIssuer returns (uint256 tokenId) {
        if (params.examScore > 100) revert ScoreOutOfRange(params.examScore);

        tokenId = _nextTokenId++;

        // Derive an immutable, on-chain hash for this certification.
        bytes32 certHash = keccak256(
            abi.encodePacked(
                params.competenceName,
                params.studentId,
                uint64(block.timestamp)
            )
        );

        // Store metadata on-chain.
        _certifications[tokenId] = Certification({
            competenceName: params.competenceName,
            level: params.level,
            acquisitionDate: uint64(block.timestamp),
            examScore: params.examScore,
            proofOfWorkURL: params.proofOfWorkURL,
            certHash: certHash,
            studentId: params.studentId
        });

        // Mint (calls _update internally; from == address(0) → allowed).
        _safeMint(params.recipient, tokenId);

        // ERC-5192: emit Locked on every mint.
        emit Locked(tokenId);
        emit CertificationIssued(params.recipient, tokenId, certHash);

        // Update Enumeration
        _ownerTokens[params.recipient].push(tokenId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ERC-5192 Non-Transferability
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @inheritdoc IERC5192
     * @dev Always returns true — all tokens are permanently locked.
     */
    function locked(
        uint256 tokenId
    ) external view override tokenExists(tokenId) returns (bool) {
        return true;
    }

    /**
     * @dev Hook called by ERC721 on every token operation (mint, burn, transfer).
     *      Reverts on any transfer that is not a mint (from == address(0))
     *      or a burn (to == address(0)).
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferBlocked(tokenId);
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Helper to add token to enumeration.
     *         We only support minting (from=0) and burning (to=0) in this contract's context
     *         as transfers are blocked.
     */
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override {
        super._increaseBalance(account, value);
    }

    // We override mint/burn logic in _update (already done above),
    // but for enumeration we need to hook into the state changes.
    // Actually, distinct mint and burn functions in this contract make it easier to just update the mapping there
    // OR verify if we can override _update to handle the mapping.
    // Since _update is internal, we can append logic.
    // But modifying _update signature is not possible.
    // Let's just update the mapping in mint() and revoke().
    // It is safer and cleaner than overriding _update which handles approvals etc.
    // WAIT: _update is called by _safeMint.

    // Let's add it to `mint` function where we know it's a mint.
    // And `revoke` where we know it's a burn.

    // ─────────────────────────────────────────────────────────────────────────
    // Token URI — on-chain dynamic SVG
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns a fully on-chain data URI containing JSON metadata
     *         and an inline SVG badge image.
     * @dev    Format: `data:application/json;base64,<base64(JSON)>`
     *         The JSON `image` field is `data:image/svg+xml;base64,<base64(SVG)>`.
     */
    function tokenURI(
        uint256 tokenId
    ) public view override tokenExists(tokenId) returns (string memory) {
        Certification storage cert = _certifications[tokenId];

        string memory svg = _buildSVG(cert);
        string memory imgData = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(svg))
            )
        );

        string memory json = string(
            abi.encodePacked(
                '{"name":"Silent Ledger Certification #',
                tokenId.toString(),
                '",'
                '"description":"Soulbound certification issued by Silent Ledger. Non-transferable ERC-5192 badge.",'
                '"image":"',
                imgData,
                '",'
                '"attributes":['
                '{"trait_type":"Competence","value":"',
                cert.competenceName,
                '"},'
                '{"trait_type":"Level","value":"',
                _levelLabel(cert.level),
                '"},'
                '{"trait_type":"Exam Score","value":',
                uint256(cert.examScore).toString(),
                "},"
                '{"display_type":"date","trait_type":"Acquisition Date","value":',
                uint256(cert.acquisitionDate).toString(),
                "},"
                '{"trait_type":"Proof of Work","value":"',
                cert.proofOfWorkURL,
                '"}'
                "],"
                '"cert_hash":"',
                _bytes32ToHex(cert.certHash),
                '",'
                '"student_id":"',
                _bytes32ToHex(cert.studentId),
                '"'
                "}"
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Revocation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Revoke (burn) a certification.
     * @dev    Callable by contract owner or the issuer.
     *         Burning is allowed by _update() because to == address(0).
     *
     * @param tokenId Token to revoke.
     */
    function revoke(uint256 tokenId) external tokenExists(tokenId) {
        if (msg.sender != owner() && msg.sender != issuer) {
            revert NotAuthorizedToRevoke();
        }
        delete _certifications[tokenId];

        // Remove from enumeration (swap and pop)
        address owner = _ownerOf(tokenId);
        uint256[] storage tokens = _ownerTokens[owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }

        _burn(tokenId);
        emit CertificationRevoked(tokenId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Update the authorised issuer address.
     * @dev    Only callable by owner. Used to point to a new logic contract.
     */
    function setIssuer(address _newIssuer) external onlyOwner {
        emit IssuerUpdated(issuer, _newIssuer);
        issuer = _newIssuer;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the full on-chain Certification struct for a token.
     */
    function getCertification(
        uint256 tokenId
    ) external view tokenExists(tokenId) returns (Certification memory) {
        return _certifications[tokenId];
    }

    /**
     * @notice Returns the total number of tokens minted (including burned ones).
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Returns all token IDs owned by `user`.
     */
    function getTokensOfOwner(
        address user
    ) external view returns (uint256[] memory) {
        return _ownerTokens[user];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ERC-165
    // ─────────────────────────────────────────────────────────────────────────

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, IERC165) returns (bool) {
        return
            interfaceId == _INTERFACE_ID_ERC5192 ||
            super.supportsInterface(interfaceId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _levelLabel(
        CertLevel level
    ) internal pure returns (string memory) {
        if (level == CertLevel.Beginner) return "Beginner";
        if (level == CertLevel.Intermediate) return "Intermediate";
        return "Expert";
    }

    /**
     * @dev Converts a bytes32 value to its 0x-prefixed hexadecimal string.
     */
    function _bytes32ToHex(
        bytes32 value
    ) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66); // "0x" + 64 hex chars
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    /**
     * @dev Generates an on-chain SVG badge.
     *      Dark background · violet gradient border · competence name + level + score ring.
     */
    function _buildSVG(
        Certification storage cert
    ) internal view returns (string memory) {
        string memory levelLabel = _levelLabel(cert.level);
        string memory scoreStr = uint256(cert.examScore).toString();

        // Score ring: circumference = 2π × 45 ≈ 283. Fill = score/100 × 283.
        // We approximate: strokeDasharray = "<fill> 283"
        // Using integer math: fill = (283 * score) / 100
        uint256 fill = (283 * uint256(cert.examScore)) / 100;

        string memory levelColor = cert.level == CertLevel.Expert
            ? "#22c55e"
            : cert.level == CertLevel.Intermediate
                ? "#f59e0b"
                : "#a78bfa";

        return
            string(
                abi.encodePacked(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
                    "<defs>",
                    '<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">',
                    '<stop offset="0%" stop-color="#0f0f13"/>',
                    '<stop offset="100%" stop-color="#09090b"/>',
                    "</linearGradient>",
                    '<linearGradient id="border" x1="0" y1="0" x2="1" y2="1">',
                    '<stop offset="0%" stop-color="#7c3aed"/>',
                    '<stop offset="100%" stop-color="#5b21b6"/>',
                    "</linearGradient>",
                    "</defs>",
                    // Background
                    '<rect width="400" height="400" rx="20" fill="url(#bg)"/>',
                    // Gradient border
                    '<rect x="1" y="1" width="398" height="398" rx="19" fill="none" stroke="url(#border)" stroke-width="2"/>',
                    // Logo icon (simplified fingerprint rings)
                    '<circle cx="200" cy="80" r="28" fill="none" stroke="#7c3aed" stroke-width="3"/>',
                    '<circle cx="200" cy="80" r="18" fill="none" stroke="#7c3aed" stroke-width="2.5"/>',
                    '<circle cx="200" cy="80" r="8"  fill="#7c3aed"/>',
                    // Score ring (background track)
                    '<circle cx="200" cy="230" r="45" fill="none" stroke="#1c1c22" stroke-width="8"/>',
                    // Score ring (filled arc)
                    '<circle cx="200" cy="230" r="45" fill="none" stroke="',
                    levelColor,
                    '" stroke-width="8"',
                    ' stroke-dasharray="',
                    fill.toString(),
                    ' 283"',
                    ' stroke-dashoffset="70"',
                    ' stroke-linecap="round"',
                    ' transform="rotate(-90 200 230)"/>',
                    // Score text inside ring
                    '<text x="200" y="224" text-anchor="middle" font-family="Inter,sans-serif"',
                    ' font-size="22" font-weight="700" fill="#fafafa">',
                    scoreStr,
                    "</text>",
                    '<text x="200" y="244" text-anchor="middle" font-family="Inter,sans-serif"',
                    ' font-size="11" fill="#71717a">SCORE</text>',
                    // Competence name
                    '<text x="200" y="145" text-anchor="middle" font-family="Inter,sans-serif"',
                    ' font-size="16" font-weight="700" fill="#fafafa">',
                    cert.competenceName,
                    "</text>",
                    // Level badge
                    '<rect x="150" y="295" width="100" height="24" rx="12" fill="',
                    levelColor,
                    '" fill-opacity="0.15"/>',
                    '<rect x="150" y="295" width="100" height="24" rx="12" fill="none" stroke="',
                    levelColor,
                    '" stroke-width="1"/>',
                    '<text x="200" y="311" text-anchor="middle" font-family="Inter,sans-serif"',
                    ' font-size="11" font-weight="600" fill="',
                    levelColor,
                    '">',
                    levelLabel,
                    "</text>",
                    // Footer
                    '<text x="200" y="370" text-anchor="middle" font-family="Inter,sans-serif"',
                    ' font-size="10" fill="#52525b">Silent Ledger - ERC-5192 Soulbound</text>',
                    "</svg>"
                )
            );
    }
}
