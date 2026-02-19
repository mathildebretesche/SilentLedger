# Documentation: CertificationSBT

`CertificationSBT` est une implémentation de jeton non-fongible lié à l'âme (Soulbound Token - SBT) conforme au standard ERC-5192.

## 📌 Rôle
Ce contrat permet à une autorité de certification (l'`issuer`) d'émettre des badges de compétence de manière permanente. Les tokens émis sont "Soulbound", c'est-à-dire verrouillés: une fois assignés à une adresse, **ils ne peuvent plus être transférés ni revendus**.

Toute l'infrastructure visuelle du token (SVG) et de ses métadonnées (JSON) est entièrement générée et hébergée **100% on-chain**.

## ⚙️ Fonctions Principales

### `mint`
```solidity
function mint(CertificationParams calldata params) external onlyIssuer returns (uint256 tokenId)
```
Permet à l'autorité (`issuer`) de décerner une certification à un utilisateur. Les paramètres définissent le niveau, le score, mais aussi l'identifiant pseudonymisé de l'étudiant. La fonction émet un événement `Locked` (standard ERC-5192).

### `revoke`
```solidity
function revoke(uint256 tokenId) external
```
Permet au propriétaire du contrat ou à l'émetteur de révoquer (détruire) un SBT existant en cas d'erreur ou d'annulation de la certification.

### `tokenURI`
```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory)
```
Génère de façon dynamique une `Data URI` (base64) contenant :
- Les métadonnées JSON du token (Nom, Attributs de la certification...).
- Le visuel intégral du badge au format SVG (avec des anneaux de progression proportionnels au score).

### `getCertification`
```solidity
function getCertification(uint256 tokenId) external view returns (Certification memory)
```
Retourne la structure complète des données de certification rattachée à un token donné.

## 🔒 Implémentation ERC-5192
Le standard ERC-5192 stipule que les contrats doivent exposer l'état de verrouillage des tokens.
- **`locked(uint256 tokenId)`** : Retournera toujours `true` pour les tokens existants, validant leur aspect non transférable.
- Les transferts sont bloqués directement dans la méthode interne de mapping `_update`, en s'assurant que seules la création (depuis `address(0)`) et la destruction (vers `address(0)`) sont autorisées.
