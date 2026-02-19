# Documentation: GhostVerifier

`GhostVerifier` gère la vérification on-chain pour l'identité "Ghost" du protocole Silent Ledger.

## 📌 Objectif
L'objectif de `GhostVerifier` est de permettre à un utilisateur de prouver cryptographiquement qu'il dispose d'une certaine réputation (score) sur une plateforme donnée, **sans jamais révéler son identifiant réel**. 

Contrairement à `SilentLedgerAttester` qui s'appuie sur le Reclaim Protocol standard, ce contrat s'interface directement avec un circuit Circom personnalisé (`GhostIdentity.circom`) via une preuve zk-SNARK `Groth16`. L'attestation produite par l'EAS est pseudonyme.

## 🔄 Flux de Vérification

1. L'utilisateur fournit au contrat sa preuve zk-SNARK (points elliptiques `pA`, `pB`, `pC`).
2. Le contrat fait appel à un vérificateur solidity Groth16 (`IGroth16Verifier`) généré par `snarkjs`.
3. Pour éviter le "replay" (soumission de la même preuve plusieurs fois), le contrat utilise un système de nullifieurs (`nullifier`). Ce nullifieur figure spécifiquement parmi les signaux publics de la preuve.
4. Si la preuve est valide et nouvelle, le contrat enregistre de façon immuable l'attestation EAS associée à la réputation de l'utilisateur.

## ⚙️ Fonctions Principales

### `verifyAndAttest`
```solidity
function verifyAndAttest(
    uint256[2]    calldata pA,
    uint256[2][2] calldata pB,
    uint256[2]    calldata pC,
    uint256[4]    calldata pubSignals
) external returns (bytes32 attestationUID)
```
Vérifie la preuve ZK passée en paramètre. Les signaux publics (pubSignals) doivent contenir précisément :
1. `identityCommitment`: Engagement de l'identité de l'utilisateur (hash).
2. `platformId`: Hash désignant la plateforme (ex: GitHub, X).
3. `reputationThreshold`: Seuil ou score prouvé.
4. `nullifier`: L'identifiant unique empêchant les attaques par rejeu.

Une attestation EAS (`ghostSchemaUID`) encapsulant ces données est créée à l'issue de la fonction.

### `isNullifierUsed`
```solidity
function isNullifierUsed(bytes32 nullifier) external view returns (bool)
```
Sert aux applications clientes pour vérifier si une preuve donnée a déjà été validée sur la blockchain en inspectant son `nullifier`.

### `getGhostAttestations`
```solidity
function getGhostAttestations(address user) external view returns (bytes32[] memory)
```
Liste l'historique des UIDs d'attestations Ghost associées au portefeuille d'un utilisateur.
