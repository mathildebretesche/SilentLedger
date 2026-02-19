# Documentation: Counter

`Counter` est un contrat minimal (basique) fourni par défaut par l'environnement de développement de contrats intelligents **Foundry**.

## 📌 Objectif
Il s'agit essentiellement d'un exemple "Hello World" servant à valider le bon fonctionnement de la chaîne d'outils de compilation, de test (`forge test`) et de déploiement (`forge script`), ainsi qu'à vérifier que l'interaction avec la blockchain (ou un nœud local Anvil) s'établit correctement.

## ⚙️ Fonctions

### `setNumber`
```solidity
function setNumber(uint256 newNumber) public
```
Démarre ou réinitialise le compteur à une nouvelle valeur passée en paramètre.

### `increment`
```solidity
function increment() public
```
Incrémente la valeur de stockage existante du compteur (`number`) par 1. Modifie le statut d'état.
