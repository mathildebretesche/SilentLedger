// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SilentLedgerAttester, OracleData} from "../src/SilentLedgerAttester.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SubmitOracleProofTest is Test {
    SilentLedgerAttester public attester;
    uint256 public constant ORACLE_PRIVATE_KEY = 0xcd69776498fa9682ac0c605ddbcbb493e9a12fb98364952f098cf064c7e63b0b;
    address public oracle;

    function setUp() public {
        oracle = vm.addr(ORACLE_PRIVATE_KEY);
        attester = new SilentLedgerAttester(
            address(0x1), 
            address(0x2), 
            address(0x3), 
            oracle,
            address(0x4)
        );
    }

    function testOracleSignature() public {
        address recipient = address(0x123);
        string memory competenceName = "Open Source Contributor";
        uint8 level = 1;
        uint32 examScore = 75;
        string memory url = "https://github.com/torvalds";
        bytes32 studentId = keccak256(bytes("ai-audit"));
        uint64 deadline = uint64(block.timestamp + 3600);

        bytes32 structHash = keccak256(
            abi.encode(
                recipient,
                keccak256(bytes(competenceName)),
                level,
                examScore,
                keccak256(bytes(url)),
                studentId,
                deadline
            )
        );
        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ORACLE_PRIVATE_KEY, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        address recovered = ECDSA.recover(hash, signature);
        assertEq(recovered, oracle);
        console.log("Signature recovered correctly");
        
        vm.expectRevert();
        attester.submitOracleProof(
            signature,
            OracleData({
                recipient: recipient,
                competenceName: competenceName,
                level: level,
                examScore: examScore,
                proofOfWorkURL: url,
                studentId: studentId,
                deadline: deadline
            })
        );
    }
}
