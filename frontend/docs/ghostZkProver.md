# Ghost ZK Prover – Documentation technique

> **Dossier source :** `frontend/lib/zkProver/` · `contracts/circuits/` · `contracts/src/GhostVerifier.sol`

---

## Vue d'ensemble

Le moteur "Ghost" transforme une preuve zkTLS Reclaim (qui atteste une session
HTTP réelle vers GitHub, Slack, etc.) en une **attestation ZK-SNARK Groth16**
publiée on-chain via l'EAS (Ethereum Attestation Service).

**Garantie centrale :** on-chain, personne ne peut relier l'attestation à un
login réel. L'attestation prouve uniquement :

> *"Cette adresse Ethereum contrôle un compte sur \<plateforme\> dont le score de
> réputation est ≥ \<seuil\>."*

---

## Modèle de confidentialité

| Donnée | Visibilité | Description |
|--------|-----------|-------------|
| `identityCommitment` | **Public** (on-chain) | $\text{Poseidon}(\text{usernameHash},\ \text{salt})$ |
| `platformId` | **Public** (on-chain) | $\text{keccak256}(\texttt{"github"})$ tronqué |
| `reputationThreshold` | **Public** (on-chain) | Seuil minimal prouvé |
| `nullifier` | **Public** (on-chain) | $\text{Poseidon}(\text{usernameHash},\ \text{platformId},\ \text{nonce})$ |
| `usernameHash` | **Privé** (witness local) | $\text{keccak256}(\text{username})$ |
| `reputationScore` | **Privé** (witness local) | Score réel (ex : 420 contributions) |
| `salt` | **Privé** (stocké client) | Entropie 128 bits locale |
| `nonce` | **Privé** (unique/soumission) | Entropie anti-replay |

---

## Architecture du flux complet

```
Utilisateur (navigateur)
       │
       │  1. Reclaim zkTLS proof
       │     extractedParams.contributions = "420"
       │     claimInfo.provider = "github"
       │
       ▼
  GhostProver.prove()                          [frontend/lib/zkProver/GhostProver.ts]
       │
       ├── computeUsernameHash("johndoe")      → usernameHash  (privé)
       ├── generateSalt()                      → salt          (privé, stocker localement)
       ├── generateNonce()                     → nonce         (privé, à usage unique)
       ├── computePlatformFieldId("github")    → platformId    (public)
       ├── computeIdentityCommitment(h, salt)  → commitment    (public)
       └── computeNullifier(h, platformId, n)  → nullifier     (public)
                                                                [commitments.ts]
       │
       ▼
  snarkjs.groth16.fullProve(inputs, wasm, zkey)
       │    Circuit : GhostIdentity.circom
       │    Vérifie les 4 contraintes algébriques (voir §Circuit)
       │
       ▼
  GhostAttestation { proof, publicSignals, calldata, meta }
       │
       ├── Vérification locale (sanity check, évite du gas inutile)
       │
       ▼
  GhostVerifier.verifyAndAttest(pA, pB, pC, pubSignals)   [contrat Solidity]
       │
       ├── Groth16Verifier.verifyProof()   ← revert si invalide
       ├── _checkNullifier()               ← revert si déjà consommé
       └── IEAS.attest()                  → attestation EAS permanente
```

---

## Contraintes du circuit ZK

Le circuit `contracts/circuits/GhostIdentity.circom` impose **4 contraintes**
que la preuve Groth16 doit satisfaire :

$$
(1)\quad \text{identityCommitment} = \text{Poseidon}(\text{usernameHash},\ \text{salt})
$$

$$
(2)\quad \text{nullifier} = \text{Poseidon}(\text{usernameHash},\ \text{platformId},\ \text{nonce})
$$

$$
(3)\quad \text{reputationScore} \geq \text{reputationThreshold}
$$

$$
(4)\quad \text{reputationScore} < 2^{32}
$$

Si **une seule** contrainte n'est pas satisfaite, `snarkjs.groth16.fullProve()`
échoue côté client et `Groth16Verifier.verifyProof()` reverte on-chain.

---

## Fichiers du projet

### `frontend/lib/zkProver/types.ts`

Définit tous les types TypeScript du moteur.

| Type / Interface | Rôle |
|-----------------|------|
| `GhostCircuitPrivateInputs` | 4 inputs privés du circuit (`usernameHash`, `reputationScore`, `salt`, `nonce`) |
| `GhostCircuitPublicInputs` | 4 inputs publics (`identityCommitment`, `platformId`, `reputationThreshold`, `nullifier`) |
| `GhostCircuitInputs` | Union des deux (passé au witness generator) |
| `Groth16Proof` | Preuve sérialisable (`pi_a`, `pi_b`, `pi_c`) |
| `GhostPublicSignals` | Tuple `[string, string, string, string]` dans l'ordre des outputs circuit |
| `GhostAttestation` | Objet final : proof + publicSignals + calldata + meta |
| `GhostVerifierCalldata` | `pA`, `pB`, `pC`, `pubSignals` en `bigint`, prêts pour l'appel contrat |
| `GhostAttestationMeta` | Métadonnées locales : platform, threshold, generatedAt, nullifierHex |
| `GhostProverOptions` | Options : `reputationThreshold`, `forceRegenerate` |
| `GhostProverError` | Erreur typée avec un `GhostProverErrorCode` |

### `frontend/lib/zkProver/commitments.ts`

Calculs cryptographiques côté client. Toutes les fonctions sont **pures** (sauf
`buildPoseidon` qui initialise le WASM circomlibjs de façon lazy).

#### `computeUsernameHash(username)`

```typescript
import { computeUsernameHash } from "@/lib/zkProver";

const h = computeUsernameHash("johndoe");
// → BigInt field element < FIELD_PRIME_BN128
```

Calcule `keccak256(username)` et le réduit modulo l'ordre du corps BN128.
C'est l'input secret principal du circuit.

---

#### `computePlatformFieldId(platform)`

```typescript
const pid = computePlatformFieldId("github");
// → keccak256("github") as field element
```

Identifiant de plateforme hashé — **public** dans le circuit.

---

#### `generateSalt()` / `generateNonce()`

```typescript
const salt  = generateSalt();  // 128 bits aléatoires, à persister
const nonce = generateNonce(); // 128 bits aléatoires, à usage unique
```

> **Important :** conserver le `salt` dans le `localStorage` chiffré de
> l'utilisateur. Il est nécessaire pour recomputer l'`identityCommitment` sans
> re-prouver.

---

#### `computeIdentityCommitment(usernameHash, salt)`

```typescript
const commitment = await computeIdentityCommitment(usernameHash, salt);
// → Poseidon(usernameHash, salt) comme BigInt
```

C'est l'identifiant pseudonyme de l'utilisateur, visible on-chain, mais
indiscernable sans connaître username ET salt.

---

#### `computeNullifier(usernameHash, platformId, nonce)`

```typescript
const nullifier = await computeNullifier(usernameHash, platformId, nonce);
// → Poseidon(usernameHash, platformId, nonce) comme BigInt
```

Unique par `(identité × plateforme × nonce)`. Stocké on-chain pour empêcher
la double soumission d'une même preuve.

---

#### `verifyCommitment(username, saltHex, expectedCommitmentHex)`

```typescript
const isMatch = await verifyCommitment(
  "johndoe",
  "0xabcd...1234",
  "0x1234...abcd"   // commitment stocké on-chain
);
```

Vérifie côté client qu'un `identityCommitment` on-chain correspond bien
à un utilisateur donné, sans générer de preuve ZK complète.

---

#### `fieldToHex(n)` / `recomputeCommitmentFromStorage(username, saltHex)`

```typescript
const hex = fieldToHex(commitment);
// → "0x0000...1a2b" (64 caractères hex)

const commitment = await recomputeCommitmentFromStorage("johndoe", saltHex);
```

Utilitaires de sérialisation / désérialisation entre BigInt et représentation
hexadécimale.

---

### `frontend/lib/zkProver/GhostProver.ts`

Classe principale du moteur. Orchestre les étapes : calcul des inputs,
génération du témoin, preuve Groth16, vérification locale, export calldata.

#### `ghostProver.prove(reclaimProof, platform, username, options?)`

```typescript
import { ghostProver } from "@/lib/zkProver";

const attestation = await ghostProver.prove(
  reclaimProof,       // ZKProof depuis ReclaimService
  "github",           // plateforme
  "johndoe",          // login réel — NE QUITTE PAS LE NAVIGATEUR
  { reputationThreshold: 10 }
);

// attestation.calldata est prêt pour l'appel on-chain :
await contract.verifyAndAttest(
  attestation.calldata.pA,
  attestation.calldata.pB,
  attestation.calldata.pC,
  attestation.calldata.pubSignals,
);
```

**Erreurs possibles :**

| Code | Cause |
|------|-------|
| `INSUFFICIENT_REPUTATION` | `reputationScore < reputationThreshold` |
| `CIRCUIT_NOT_LOADED` | Fichier `.wasm` ou `.zkey` inaccessible dans `/public/circuits/` |
| `PROOF_GENERATION_FAILED` | Circuit non satisfait ou snarkjs interne |
| `NULLIFIER_ALREADY_USED` | Vérification locale avant soumission |

#### `ghostProver.verifyLocally(attestation)`

```typescript
const valid = await ghostProver.verifyLocally(attestation);
// → true si la preuve est valide selon la vkey locale
```

Permet de valider une `GhostAttestation` stockée sans la re-générer.

---

### `contracts/circuits/GhostIdentity.circom`

Circuit Circom 2.1.5 compilable en Groth16/BN128.

**Dépendances circomlib :**
- `poseidon.circom` — hash ZK-friendly (~100× moins de contraintes que SHA-256)
- `comparators.circom` — `LessThan` pour le range proof
- `bitify.circom` — `Num2Bits` (utilisé par les comparateurs)

**Gabarit interne `RangeProof(n)` :** prouve `threshold ≤ value < 2^n` sans
révéler `value`. Utilisé pour le range check du score de réputation.

---

### `contracts/src/GhostVerifier.sol`

Contrat Solidity déployable sur Sepolia (ou tout EVM compatible).

#### `verifyAndAttest(pA, pB, pC, pubSignals)`

```solidity
bytes32 uid = ghostVerifier.verifyAndAttest(pA, pB, pC, pubSignals);
```

Flux interne :
1. `Groth16Verifier.verifyProof()` — revert si la preuve Groth16 est invalide.
2. Vérification anti-replay : `usedNullifiers[nullifier]` — revert si déjà consommé.
3. `IEAS.attest()` — création d'une attestation EAS permanente avec le schéma Ghost.
4. Émission de `GhostAttestationCreated`.

**Schéma EAS enregistré :**
```
uint256 identityCommitment, uint256 platformId,
uint256 reputationThreshold, uint256 nullifier
```

#### `isNullifierUsed(bytes32 nullifier) → bool`

Vérification préalable côté client avant de payer du gas.

#### `getGhostAttestations(address user) → bytes32[]`

Retourne tous les UIDs EAS Ghost d'une adresse.

#### `setGroth16Verifier(address)` *(onlyOwner)*

Met à jour le vérificateur si le circuit est recompilé (nouveau setup de
confiance).

---

### `contracts/scripts/compile-circuit.sh`

Script bash automatisant toute la chaîne de compilation :

```
[1] mkdir artefacts
[2] circom GhostIdentity.circom → .r1cs + .wasm + .sym
[3] snarkjs powersoftau new/contribute/prepare  (Powers of Tau 2^17)
[4] snarkjs groth16 setup + zkey contribute     (proving key)
[5] snarkjs zkey export verificationkey         (vkey.json)
[6] snarkjs zkey export solidityverifier        (Groth16Verifier.sol)
```

```bash
cd contracts
npm install circomlib
bash scripts/compile-circuit.sh
```

> **Production :** remplacer la cérémonie Powers of Tau par une
> [cérémonie multi-parties publique](https://github.com/privacy-scaling-explorations/perpetualpowersoftau)
> pour garantir la sécurité du setup de confiance.

---

## Étapes de déploiement

```bash
# 1. Compiler le circuit
cd contracts
bash scripts/compile-circuit.sh

# 2. Déployer les contrats
source .env
forge script script/SilentLedgerAttester.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast

# 3. Déployer GhostVerifier manuellement ou via un script dédié :
#    forge create src/Groth16Verifier.sol:Groth16Verifier --rpc-url ...
#    forge create src/GhostVerifier.sol:GhostVerifier \
#      --constructor-args <EAS> <SchemaRegistry> <Groth16Verifier> \
#      --rpc-url ...
```

---

## Schéma récapitulatif des engagements

```
username ──keccak256──► usernameHash ──┐
                                       ├─ Poseidon ──► identityCommitment  [PUBLIC]
                           salt ────────┘

usernameHash ───────────────────────────┐
platformId ─────────────────────────────┼─ Poseidon ──► nullifier           [PUBLIC]
nonce ──────────────────────────────────┘

reputationScore ── circuit ──► score ≥ threshold                            [PUBLIC]
                               (score réel jamais révélé)
```
