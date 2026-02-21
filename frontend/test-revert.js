import { createPublicClient, http, encodeFunctionData, keccak256, encodeAbiParameters, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const oracleKey = "0xcd69776498fa9682ac0c605ddbcbb493e9a12fb98364952f098cf064c7e63b0b";
const account = privateKeyToAccount(oracleKey);

const address = account.address;
const competenceName = "Open Source Contributor";
const proofOfWorkURL = "https://github.com/torvalds";
const scoreNum = 85;
const level = 2; // Expert
const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // valid for 1h
const studentId = keccak256(toBytes("ai-audit"));

// Same structure as route.ts
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
        deadline
    ]
);

const structHash = keccak256(encoded);
const signature = await account.signMessage({ message: { raw: structHash } });

const client = createPublicClient({
  chain: sepolia,
  transport: http("https://eth-sepolia.g.alchemy.com/v2/cHlS7x_GM0vGi2RFEmiM1")
});

const ABI = [
  {
    type: "function",
    name: "submitOracleProof",
    stateMutability: "nonpayable",
    inputs: [
      { name: "signature", type: "bytes" },
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "recipient", type: "address" },
          { name: "competenceName", type: "string" },
          { name: "level", type: "uint8" },
          { name: "examScore", type: "uint32" },
          { name: "proofOfWorkURL", type: "string" },
          { name: "studentId", type: "bytes32" },
          { name: "deadline", type: "uint64" },
        ],
      },
    ],
    outputs: [{ name: "attestationUID", type: "bytes32" }],
  }
];

try {
    const res = await client.simulateContract({
        address: "0x9c78239c3c1c201554d4c5f0e0bc5aabc9cbb631",
        abi: ABI,
        functionName: "submitOracleProof",
        args: [
            signature,
            {
                recipient: address,
                competenceName,
                level,
                examScore: scoreNum,
                proofOfWorkURL,
                studentId,
                deadline
            }
        ],
        account: address
    });
    console.log("Success! No revert detected.");
} catch (err) {
    console.error("REVERT REASON:", err.message);
}
