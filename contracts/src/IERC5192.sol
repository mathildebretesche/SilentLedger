// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// ─────────────────────────────────────────────────────────────────────────────
// IERC5192 – Minimal Soulbound NFT Interface
// EIP-5192: https://eips.ethereum.org/EIPS/eip-5192
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @title  IERC5192
 * @notice Interface for ERC-5192: Minimal Soulbound NFTs.
 *
 * @dev    Every token governed by this interface is permanently "locked"
 *         (non-transferable). Implementors MUST:
 *           • Return `true` from `locked()` for all existing tokens.
 *           • Emit `Locked(tokenId)` when a token is minted or locked.
 *           • Emit `Unlocked(tokenId)` if a token becomes transferable
 *             (not required when tokens are always locked, but defined
 *             for interface completeness).
 *         The interface id is `0xb45a3c0e` (keccak256 of the selector).
 */
interface IERC5192 is IERC165 {
    // ── Events ────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when the locking status of a token is set to locked.
     * @dev    MUST be emitted when a token is minted (as all tokens start locked)
     *         and whenever a token transitions from unlocked → locked.
     */
    event Locked(uint256 indexed tokenId);

    /**
     * @notice Emitted when the locking status of a token is set to unlocked.
     * @dev    Included for interface completeness. Implementations that keep
     *         tokens permanently locked need never emit this.
     */
    event Unlocked(uint256 indexed tokenId);

    // ── Functions ─────────────────────────────────────────────────────────────

    /**
     * @notice Returns the locking status of a token.
     * @dev    Tokens that do not exist MUST revert.
     * @param  tokenId  The identifier of the token.
     * @return          `true` if the token is locked (non-transferable),
     *                  `false` if it may be transferred.
     */
    function locked(uint256 tokenId) external view returns (bool);
}
