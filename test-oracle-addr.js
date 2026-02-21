import { privateKeyToAccount } from 'viem/accounts';

const oracleKey = "0xcd69776498fa9682ac0c605ddbcbb493e9a12fb98364952f098cf064c7e63b0b";
const account = privateKeyToAccount(oracleKey);

console.log("Derived Address:", account.address);
