// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {
    CertificationSBT,
    CertificationParams,
    CertLevel
} from "../src/CertificationSBT.sol";

/**
 * @title  CertificationSBTScript
 * @notice Script to deploy the SBT contract and mint a sample certification.
 *
 * @dev    Run local node:  anvil
 *         Run script:     forge script script/CertificationSBT.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
 */
contract CertificationSBTScript is Script {
    function setUp() public {}

    function run() public {
        // Use PRIVATE_KEY from .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy contract with the deployer as the initial issuer.
        CertificationSBT sbt = new CertificationSBT(deployer);
        console.log("CertificationSBT deployed at:", address(sbt));

        // 2. Mint a sample certification.
        CertificationParams memory params = CertificationParams({
            recipient: deployer, // Mint to deployer instead of Anvil #2
            competenceName: "Advanced ZK-TLS Security",
            level: CertLevel.Expert,
            examScore: 95,
            proofOfWorkURL: "https://github.com/silent-ledger/proof-ex",
            studentId: keccak256(abi.encodePacked("student@silentledger.com"))
        });

        uint256 tokenId = sbt.mint(params);
        console.log("Sample Certification minted! Token ID:", tokenId);
        console.log("Recipient:", params.recipient);

        // 3. Log the tokenURI (base64) so user can see it works.
        string memory uri = sbt.tokenURI(tokenId);
        console.log("--- Token Metadata (Base64 JSON) ---");
        console.log(uri);

        vm.stopBroadcast();
    }
}
