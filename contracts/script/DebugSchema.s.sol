// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script, console} from "forge-std/Script.sol";
import {
    ISchemaRegistry
} from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";
import {
    ISchemaResolver
} from "@ethereum-attestation-service/eas-contracts/contracts/resolver/ISchemaResolver.sol";

contract DebugSchema is Script {
    function run() external {
        address SCHEMA_REGISTRY = 0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0;
        string
            memory schemaStr = "bytes32 platformId,uint256 reputationScore,bool isVerified";
        ISchemaResolver resolver = ISchemaResolver(address(0));
        bool revocable = true;

        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        try
            ISchemaRegistry(SCHEMA_REGISTRY).register(
                schemaStr,
                resolver,
                revocable
            )
        returns (bytes32 uid) {
            console.log("Registered with UID:");
            console.logBytes32(uid);
        } catch Error(string memory reason) {
            console.log("Error:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("Low level error");
            console.logBytes(lowLevelData);
        }
        vm.stopBroadcast();
    }
}
