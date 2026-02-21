import { createWalletClient, http, keccak256, encodeAbiParameters, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const oracleKey = "0xcd69776498fa9682ac0c605ddbcbb493e9a12fb98364952f098cf064c7e63b0b";
const account = privateKeyToAccount(oracleKey);

const address = account.address; // Deployer address
const competenceName = "Open Source Contributor";
const proofOfWorkURL = "https://github.com/torvalds";
const scoreNum = 85;
const level = 2; // Expert
const deadline = Math.floor(Date.now() / 1000) + 3600; // valid for 1h
const studentId = keccak256(toBytes("ai-audit"));

const encoded = encodeAbiParameters(
    [
        { type: 'address' },
        { type: 'bytes32' },
        { type: 'uint8' },
        { type: 'uint32' },
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'uint64' }
    ],
    [
        address,
        keccak256(toBytes(competenceName)),
        level,
        scoreNum,
        keccak256(toBytes(proofOfWorkURL)),
        studentId,
        BigInt(deadline)
    ]
);

const structHash = keccak256(encoded);
const signature = await account.signMessage({ message: { raw: structHash } });

const dataTuple = `(${address},"${competenceName}",${level},${scoreNum},"${proofOfWorkURL}",${studentId},${deadline})`;
console.log("export SIG=" + signature);
console.log("export DATA='" + dataTuple + "'");
