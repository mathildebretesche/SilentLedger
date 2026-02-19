// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { AttestationRequest } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { SilentLedgerAttester, ReclaimProof, ClaimInfo, SignedClaim, CompleteClaimData } from "../src/SilentLedgerAttester.sol";

// ─── Mock Contracts ───────────────────────────────────────────────────────────

contract MockEAS {
    uint256 private _counter;

    /// @dev Matches IEAS.attest(AttestationRequest calldata) selector exactly.
    function attest(AttestationRequest calldata) external returns (bytes32) {
        return bytes32(++_counter);
    }
}

contract MockSchemaRegistry {
    bytes32 private constant SCHEMA_UID = keccak256("silent-ledger-schema-v1");

    function register(string calldata, address, bool) external pure returns (bytes32) {
        return SCHEMA_UID;
    }
}

contract MockReclaimVerifier {
    bool private _shouldRevert;

    function setShouldRevert(bool v) external { _shouldRevert = v; }

    function verifyProof(ReclaimProof memory) external view {
        if (_shouldRevert) revert("InvalidProof");
    }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

contract SilentLedgerAttesterTest is Test {
    SilentLedgerAttester public attester;
    MockEAS public mockEAS;
    MockSchemaRegistry public mockRegistry;
    MockReclaimVerifier public mockReclaim;

    address internal alice = makeAddr("alice");

    function setUp() public {
        mockEAS = new MockEAS();
        mockRegistry = new MockSchemaRegistry();
        mockReclaim = new MockReclaimVerifier();

        attester = new SilentLedgerAttester(
            address(mockEAS),
            address(mockRegistry),
            address(mockReclaim)
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _makeProof() internal view returns (ReclaimProof memory) {
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = hex"deadbeef";

        return ReclaimProof({
            claimInfo: ClaimInfo({
                provider: "http",
                parameters: "https://github.com/alice",
                context: '{"extractedParameters":{"contributions":"420"}}'
            }),
            signedClaim: SignedClaim({
                claim: CompleteClaimData({
                    identifier: keccak256("claim-id"),
                    owner: address(0x1),
                    timestampS: uint32(block.timestamp),
                    epoch: 1
                }),
                signatures: sigs
            })
        });
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    function test_SchemaRegisteredOnDeploy() public view {
        assertNotEq(attester.schemaUID(), bytes32(0), "Schema UID doit etre non-zero");
    }

    function test_SubmitProof_Success() public {
        bytes32 platformId = keccak256("github:alice");
        uint256 score = 420;

        vm.prank(alice);
        bytes32 uid = attester.submitProof(_makeProof(), platformId, score);

        assertNotEq(uid, bytes32(0), "Attestation UID doit etre non-zero");

        bytes32[] memory attestations = attester.getAttestations(alice);
        assertEq(attestations.length, 1, "Alice doit avoir 1 attestation");
        assertEq(attestations[0], uid, "UID stocke doit correspondre");
    }

    function test_SubmitProof_EmitsEvent() public {
        bytes32 platformId = keccak256("github:alice");

        vm.prank(alice);
        vm.expectEmit(true, true, false, false, address(attester));
        emit SilentLedgerAttester.ProofSubmitted(alice, platformId, bytes32(uint256(1)));

        attester.submitProof(_makeProof(), platformId, 100);
    }

    function test_SubmitProof_RevertsOnInvalidProof() public {
        mockReclaim.setShouldRevert(true);

        vm.prank(alice);
        vm.expectRevert("InvalidProof");
        attester.submitProof(_makeProof(), keccak256("github:alice"), 100);
    }

    function test_SubmitProof_RevertsOnWrongProvider() public {
        ReclaimProof memory proof = _makeProof();
        proof.claimInfo.provider = "discord"; // Wrong provider

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                SilentLedgerAttester.InvalidProofProvider.selector,
                "discord"
            )
        );
        attester.submitProof(proof, keccak256("discord:alice"), 100);
    }

    function test_MultipleAttestations() public {
        bytes32 platformId = keccak256("github:alice");

        vm.startPrank(alice);
        attester.submitProof(_makeProof(), platformId, 100);
        attester.submitProof(_makeProof(), platformId, 200);
        vm.stopPrank();

        bytes32[] memory attestations = attester.getAttestations(alice);
        assertEq(attestations.length, 2, "Alice doit avoir 2 attestations");
    }

    function test_OnlyOwnerCanSetVerifier() public {
        address newVerifier = makeAddr("newVerifier");

        vm.prank(alice);
        vm.expectRevert();
        attester.setReclaimVerifier(newVerifier);

        // Owner can do it
        attester.setReclaimVerifier(newVerifier);
        assertEq(address(attester.reclaimVerifier()), newVerifier);
    }
}
