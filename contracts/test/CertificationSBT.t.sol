// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────────────────
// CertificationSBT.t.sol – Foundry Test Suite
// Run:  forge test --match-contract CertificationSBT -vv
// ─────────────────────────────────────────────────────────────────────────────

import { Test, console } from "forge-std/Test.sol";
import { CertificationSBT, CertificationParams, CertLevel, Certification } from "../src/CertificationSBT.sol";
import { IERC5192 } from "../src/IERC5192.sol";
import { IERC721 }  from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC165 }  from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract CertificationSBTTest is Test {
    // ── Fixtures ──────────────────────────────────────────────────────────────
    CertificationSBT internal sbt;

    address internal owner   = address(0xABCD);
    address internal issuer  = address(0x1111);
    address internal student = address(0x2222);
    address internal rando   = address(0x3333);

    CertificationParams internal defaultParams;

    function setUp() public {
        vm.startPrank(owner);
        sbt = new CertificationSBT(issuer);
        vm.stopPrank();

        defaultParams = CertificationParams({
            recipient:      student,
            competenceName: "Smart Contract Security",
            level:          CertLevel.Expert,
            examScore:      88,
            proofOfWorkURL: "https://github.com/student/proof",
            studentId:      keccak256(abi.encodePacked("student@example.com"))
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deployment
    // ─────────────────────────────────────────────────────────────────────────

    function test_DeploymentState() public view {
        assertEq(sbt.issuer(), issuer, "issuer mismatch");
        assertEq(sbt.owner(),  owner,  "owner mismatch");
        assertEq(sbt.totalMinted(), 0, "should start with 0 tokens");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Minting
    // ─────────────────────────────────────────────────────────────────────────

    function test_MintByIssuer() public {
        vm.prank(issuer);
        uint256 tokenId = sbt.mint(defaultParams);

        assertEq(tokenId, 0,       "first token id should be 0");
        assertEq(sbt.ownerOf(0), student, "owner should be student");
        assertEq(sbt.totalMinted(), 1);
    }

    function test_MintEmitsLockedEvent() public {
        vm.expectEmit(true, false, false, false, address(sbt));
        emit IERC5192.Locked(0);

        vm.prank(issuer);
        sbt.mint(defaultParams);
    }

    function test_MintEmitsCertificationIssuedEvent() public {
        // Pre-calculate certHash the same way the contract does.
        uint64 ts = uint64(block.timestamp);
        bytes32 expectedHash = keccak256(
            abi.encodePacked(defaultParams.competenceName, defaultParams.studentId, ts)
        );

        vm.expectEmit(true, true, false, true, address(sbt));
        emit CertificationSBT.CertificationIssued(student, 0, expectedHash);

        vm.prank(issuer);
        sbt.mint(defaultParams);
    }

    function test_MintRevertsIfNotIssuer() public {
        vm.prank(rando);
        vm.expectRevert(CertificationSBT.NotIssuer.selector);
        sbt.mint(defaultParams);
    }

    function test_MintRevertsOnScoreOver100() public {
        CertificationParams memory bad = defaultParams;
        bad.examScore = 101;

        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(CertificationSBT.ScoreOutOfRange.selector, 101));
        sbt.mint(bad);
    }

    function test_CertificationDataStoredCorrectly() public {
        vm.prank(issuer);
        sbt.mint(defaultParams);

        Certification memory cert = sbt.getCertification(0);
        // Certification is a file-level struct imported directly.
        assertEq(cert.competenceName,  "Smart Contract Security");
        assertEq(uint8(cert.level),    uint8(CertLevel.Expert));
        assertEq(cert.examScore,       88);
        assertEq(cert.proofOfWorkURL,  "https://github.com/student/proof");
        assertEq(cert.studentId,       keccak256(abi.encodePacked("student@example.com")));
        assertGt(cert.acquisitionDate, 0);
        assertFalse(cert.certHash == bytes32(0), "certHash must be non-zero");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ERC-5192 Non-Transferability
    // ─────────────────────────────────────────────────────────────────────────

    function test_LockedReturnsTrue() public {
        vm.prank(issuer);
        sbt.mint(defaultParams);

        assertTrue(sbt.locked(0), "token must be locked");
    }

    function test_LockedRevertsForNonExistentToken() public {
        vm.expectRevert(abi.encodeWithSelector(CertificationSBT.TokenDoesNotExist.selector, 99));
        sbt.locked(99);
    }

    function test_TransferReverts() public {
        vm.prank(issuer);
        sbt.mint(defaultParams);

        vm.prank(student);
        vm.expectRevert(
            abi.encodeWithSelector(CertificationSBT.SoulboundTransferBlocked.selector, 0)
        );
        sbt.transferFrom(student, rando, 0);
    }

    function test_SafeTransferReverts() public {
        vm.prank(issuer);
        sbt.mint(defaultParams);

        vm.prank(student);
        vm.expectRevert(
            abi.encodeWithSelector(CertificationSBT.SoulboundTransferBlocked.selector, 0)
        );
        sbt.safeTransferFrom(student, rando, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Token URI
    // ─────────────────────────────────────────────────────────────────────────

    function test_TokenURIStartsWithDataPrefix() public {
        vm.prank(issuer);
        sbt.mint(defaultParams);

        string memory uri = sbt.tokenURI(0);
        // Must start with the data URI prefix for base64 JSON.
        bytes memory prefix = bytes("data:application/json;base64,");
        bytes memory uriBytes = bytes(uri);

        bool startsCorrectly = true;
        for (uint256 i = 0; i < prefix.length; i++) {
            if (uriBytes[i] != prefix[i]) {
                startsCorrectly = false;
                break;
            }
        }
        assertTrue(startsCorrectly, "tokenURI must start with data:application/json;base64,");
        console.log("TokenURI length:", uriBytes.length);
    }

    function test_TokenURIRevertsForNonExistentToken() public {
        vm.expectRevert(abi.encodeWithSelector(CertificationSBT.TokenDoesNotExist.selector, 0));
        sbt.tokenURI(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Revocation
    // ─────────────────────────────────────────────────────────────────────────

    function test_RevokeByOwner() public {
        vm.prank(issuer);
        sbt.mint(defaultParams);

        vm.expectEmit(true, false, false, false, address(sbt));
        emit CertificationSBT.CertificationRevoked(0);

        vm.prank(owner);
        sbt.revoke(0);

        // Token should no longer exist.
        vm.expectRevert();
        sbt.ownerOf(0);
    }

    function test_RevokeByIssuer() public {
        vm.prank(issuer);
        sbt.mint(defaultParams);

        vm.prank(issuer);
        sbt.revoke(0);

        vm.expectRevert();
        sbt.ownerOf(0);
    }

    function test_RevokeByRandomAddressReverts() public {
        vm.prank(issuer);
        sbt.mint(defaultParams);

        vm.prank(rando);
        vm.expectRevert(CertificationSBT.NotAuthorizedToRevoke.selector);
        sbt.revoke(0);
    }

    function test_RevokeNonExistentTokenReverts() public {
        vm.expectRevert(abi.encodeWithSelector(CertificationSBT.TokenDoesNotExist.selector, 0));
        vm.prank(owner);
        sbt.revoke(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin: setIssuer
    // ─────────────────────────────────────────────────────────────────────────

    function test_SetIssuerByOwner() public {
        address newIssuer = address(0x9999);

        vm.expectEmit(true, true, false, false, address(sbt));
        emit CertificationSBT.IssuerUpdated(issuer, newIssuer);

        vm.prank(owner);
        sbt.setIssuer(newIssuer);

        assertEq(sbt.issuer(), newIssuer);
    }

    function test_SetIssuerByNonOwnerReverts() public {
        vm.prank(rando);
        vm.expectRevert();
        sbt.setIssuer(rando);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ERC-165 Interface Detection
    // ─────────────────────────────────────────────────────────────────────────

    function test_SupportsIERC5192() public view {
        bytes4 iERC5192 = 0xb45a3c0e;
        assertTrue(sbt.supportsInterface(iERC5192), "should support IERC5192");
    }

    function test_SupportsIERC721() public view {
        bytes4 iERC721 = type(IERC721).interfaceId;
        assertTrue(sbt.supportsInterface(iERC721), "should support IERC721");
    }

    function test_SupportsIERC165() public view {
        bytes4 iERC165 = type(IERC165).interfaceId;
        assertTrue(sbt.supportsInterface(iERC165), "should support IERC165");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fuzz: token IDs increment correctly
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_MultiMintTokenIdsAreSequential(uint8 count) public {
        vm.assume(count > 0 && count <= 20);

        vm.startPrank(issuer);
        for (uint256 i = 0; i < count; i++) {
            uint256 id = sbt.mint(defaultParams);
            assertEq(id, i, "token ids must be sequential");
        }
        vm.stopPrank();

        assertEq(sbt.totalMinted(), count);
    }
}
