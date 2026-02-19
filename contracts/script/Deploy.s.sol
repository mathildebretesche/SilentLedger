// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SilentLedgerAttester} from "../src/SilentLedgerAttester.sol";

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
        0xf90085f5FD1A3BeB8678623409B3811e4b50b8f3;

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

        SilentLedgerAttester attester = new SilentLedgerAttester(
            EAS,
            SCHEMA_REGISTRY,
            reclaimVerifier
        );

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
