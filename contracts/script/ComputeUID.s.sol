// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script, console} from "forge-std/Script.sol";
import {
    ISchemaResolver
} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";

contract ComputeUID is Script {
    function run() external {
        string
            memory schemaStr = "bytes32 platformId,uint256 reputationScore,bool isVerified";
        ISchemaResolver resolver = ISchemaResolver(address(0));
        bool revocable = true;

        bytes32 uid = keccak256(
            abi.encodePacked(schemaStr, resolver, revocable)
        );
        console.log("Calculated UID:");
        console.logBytes32(uid);
    }
}
