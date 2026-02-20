// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SilentLedgerAttester} from "../src/SilentLedgerAttester.sol";
import {CertificationSBT} from "../src/CertificationSBT.sol";

/**
 * @title DeployScript
 * @notice Deploys SilentLedgerAttester to Ethereum Sepolia.
 *
 * Required env vars (set in contracts/.env):
 *   PRIVATE_KEY        – Deployer private key (0x-prefixed)
 *   SEPOLIA_RPC_URL    – Alchemy / Infura Sepolia endpoint
 *
 * Optional env var:
 *   RECLAIM_VERIFIER   – Reclaim Protocol verifier address on Sepolia.
 *                        Defaults to 0xF90085f5Fd1a3bEb8678623409b3811e4B50b8F3
 *                        (can be updated later via setReclaimVerifier()).
 *
 * Run:
 *   source .env && forge script script/Deploy.s.sol:DeployScript \
 *     --rpc-url $SEPOLIA_RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     -vvvv
 */
contract DeployScript is Script {
    // ── Sepolia – Ethereum Attestation Service (EAS v0.26) ─────────────────
    address constant EAS = 0xC2679fBD37d54388Ce493F1DB75320D236e1815e;
    address constant SCHEMA_REGISTRY =
        0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0;

    // ── Reclaim Protocol verifier default (Sepolia) ─────────────────────────
    address constant RECLAIM_DEFAULT =
        0xAe94FB09711e1c6B057853a515483792d8e474d0;

    function run() external {
        // Allow override via env var; fall back to the known Sepolia address.
        address reclaimVerifier = vm.envOr("RECLAIM_VERIFIER", RECLAIM_DEFAULT);

        console.log("=== SilentLedger Deployment ===");
        console.log("Network       : Sepolia");
        console.log("EAS           :", EAS);
        console.log("SchemaRegistry:", SCHEMA_REGISTRY);
        console.log("ReclaimVerif. :", reclaimVerifier);
        console.log("Deployer      :", msg.sender);
        console.log("");

        vm.startBroadcast();

        // 1. Deploy SBT with the deployer as temporary issuer
        CertificationSBT sbt = new CertificationSBT(msg.sender);
        console.log("CertificationSBT deployed at :", address(sbt));

        // 2. Deploy Attester
        SilentLedgerAttester attester = new SilentLedgerAttester(
            EAS,
            SCHEMA_REGISTRY,
            reclaimVerifier,
            msg.sender, // oracle signer (deployer for now)
            address(sbt)
        );

        // 3. Set Attester as SBT issuer
        sbt.setIssuer(address(attester));

        vm.stopBroadcast();

        console.log("SilentLedgerAttester deployed at:", address(attester));
        console.log(
            "Schema UID                      :",
            vm.toString(attester.schemaUID())
        );
        console.log("");
        console.log(
            "Next step: set NEXT_PUBLIC_ATTESTER_ADDRESS in frontend/.env.local"
        );
    }
}
