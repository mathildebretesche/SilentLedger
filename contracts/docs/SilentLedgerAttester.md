# Documentation: SilentLedgerAttester

`SilentLedgerAttester` est le contrat principal qui fait le pont entre les preuves zkTLS (générées via Reclaim Protocol) et l'Ethereum Attestation Service (EAS).

## 📌 Architecture ZK / EAS

Ce contrat permet de valider des contributions Web2 de manière pseudonyme et cryptographique :
1. **Génération de la preuve (hors ligne) :** L'utilisateur génère une preuve zkTLS côté client prouvant l'authenticité d'une réponse HTTPS (ex: l'API GitHub).
2. **Vérification on-chain :** La preuve est soumise au contrat `SilentLedgerAttester` qui appelle le contrat `Reclaim` pour valider la signature de la preuve ZK.
3. **Création de l'attestation :** Si la preuve est valide, le contrat extrait les données pseudonymisées (identifiant de la plateforme hashé, score) et crée une attestation permanente via EAS.

## ⚙️ Fonctions Principales

### `submitProof`
```solidity
function submitProof(
    ReclaimProof calldata proof,
    bytes32 platformId,
    uint256 reputationScore
) external returns (bytes32 attestationUID)
```
**Point d'entrée principal**.
- Vérifie la validité cryptographique de la preuve zkTLS fournie.
- S'assure que le fournisseur (provider) est correct ("http").
- Encode les données et appelle EAS pour créer l'attestation on-chain associée au signataire (`msg.sender`).

### `getAttestations`
```solidity
function getAttestations(address user) external view returns (bytes32[] memory)
```
Retourne la liste complète des UIDs d'attestations EAS créées pour une adresse donnée.

### `setReclaimVerifier`
```solidity
function setReclaimVerifier(address _newVerifier) external onlyOwner
```
Fonction d'administration (réservée au propriétaire) permettant de mettre à jour l'adresse du contrat vérificateur Reclaim Protocol en cas de nouvelle version sur le réseau.

## 📦 Schéma EAS
Lors de son déploiement, le contrat enregistre son schéma dans l'EAS SchemaRegistry :
- `bytes32 platformId` : L'identifiant de l'utilisateur pseudonymisé (ex: hash du login GitHub).
- `uint256 reputationScore` : Le score extrait de la preuve zkTLS.
- `bool isVerified` : Statut de vérification (toujours `true` car cryptographiquement prouvé).

Si le schéma est déjà présent (ex: suite à un redéploiement), le contrat récupère dynamiquement l'UID du schéma existant au lieu d'échouer.
