# Nullifier anti cross-wallet & ZK Selective Disclosure – Documentation technique

> Concerne les fichiers produits lors de la dernière itération du moteur Ghost.
> **Doc parent :** `frontend/docs/ghostZkProver.md`

---

## Sommaire

1. [Nullifier anti cross-wallet](#1-nullifier-anti-cross-wallet)
2. [ZK Selective Disclosure – tiers](#2-zk-selective-disclosure--tiers)
3. [Circuit GhostDisclosure.circom](#3-circuit-ghostdisclosurecircom)
4. [DisclosureProver.ts – API complète](#4-disclosureprovertss--api-complète)
5. [Comparatif des deux circuits](#5-comparatif-des-deux-circuits)
6. [Flux de compilation](#6-flux-de-compilation)

---

## 1. Nullifier anti cross-wallet

### Problème initial

La version précédente du nullifier utilisait un `nonce` **aléatoire** généré
par le client :

$$
\text{nullifier}_{\text{ancien}} = \text{Poseidon}(\text{usernameHash},\ \text{platformId},\ \text{nonce}_{\text{random}})
$$

**Conséquence :** deux wallets différents soumettant la **même** contribution
Reclaim avec des nonces distincts produisaient des nullifiers différents
→ deux attestations distinctes pour un même fait → double comptage possible.

### Correction apportée

Le `nonce` aléatoire est **remplacé par le `reclaimIdentifier`**, un `bytes32`
déterministe fourni par le SDK Reclaim dans `CompleteClaimData.identifier`.

$$
\text{nullifier}_{\text{nouveau}} = \text{Poseidon}(\text{usernameHash},\ \text{platformId},\ \text{reclaimIdentifier})
$$

Le `reclaimIdentifier` est calculé par les nœuds attestors Reclaim depuis les
paramètres intrinsèques du claim (URL, regex, timestamp de la réponse HTTPS).
Il est **identique** pour la même contribution, quel que soit le wallet.

### Garantie obtenue

```
Wallet A (johndoe)  ──► nullifier = Poseidon(H("johndoe"), H("github"), id_claim_42)
                                   = 0x1a2b...

Wallet B (johndoe)  ──► nullifier = Poseidon(H("johndoe"), H("github"), id_claim_42)
                                   = 0x1a2b...  ← identique !
                                   → GhostVerifier.sol: NullifierAlreadyUsed
```

Un utilisateur peut toujours prouver **plusieurs contributions différentes**
(chaque claim Reclaim a son propre `identifier`).

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| [contracts/circuits/GhostIdentity.circom](../contracts/circuits/GhostIdentity.circom) | `nonce` → `reclaimIdentifier` dans le signal input et la contrainte 2 |
| [frontend/lib/zkProver/types.ts](../frontend/lib/zkProver/types.ts) | `nonce: bigint` → `reclaimIdentifier: bigint` dans `GhostCircuitPrivateInputs` |
| [frontend/lib/zkProver/commitments.ts](../frontend/lib/zkProver/commitments.ts) | `generateNonce()` supprimée, `computeClaimIdentifier()` ajoutée |
| [frontend/lib/zkProver/GhostProver.ts](../frontend/lib/zkProver/GhostProver.ts) | Utilise `computeClaimIdentifier(reclaimProof.identifier)` |

### Nouvelle fonction `computeClaimIdentifier`

```typescript
import { computeClaimIdentifier } from "@/lib/zkProver";

// reclaimProof.identifier est un bytes32 hex fourni par le SDK Reclaim
const reclaimIdentifier = computeClaimIdentifier(reclaimProof.identifier);
// → BigInt field element BN128
```

---

## 2. ZK Selective Disclosure – tiers

### Concept

La divulgation sélective permet à l'utilisateur de choisir **exactement**
ce qu'il révèle de son score de réputation.

Au lieu d'une simple preuve `score ≥ seuil`, l'utilisateur sélectionne
un **tier** — un intervalle $[\text{min}, \text{max}[$ — et prouve que son
score y appartient, sans révéler la valeur exacte.

| Ce qui est révélé on-chain | Ce qui reste secret |
|---------------------------|---------------------|
| `identityCommitment` (Poseidon) | Login / username réel |
| `platformId` (hash de "github") | Score exact |
| `tierMinScore` (ex: 500) | Salt |
| `tierMaxScore` (ex: 5000) | `reclaimIdentifier` |
| `nullifier` | — |

**Exemple concret :**

> Score réel : `420`
>
> L'utilisateur choisit le tier *Silver* `[50, 500[`.
>
> On-chain, tout le monde voit : `"Entre 50 et 499 contributions sur GitHub"`.
>
> Personne ne sait si c'est 51 ou 499.

### Tiers prédéfinis

Définis dans `DISCLOSURE_TIERS` dans [DisclosureProver.ts](../frontend/lib/zkProver/DisclosureProver.ts) :

| Clé | Label | Intervalle | Description |
|-----|-------|-----------|-------------|
| `ACTIVE` | Contributeur actif | `[1, 50[` | Activité minimale prouvée |
| `REGULAR` | Contributeur régulier | `[50, 500[` | Engagement soutenu |
| `GOLD` | Contributeur Gold | `[500, 5000[` | Expertise confirmée |
| `PLATINUM` | Top contributeur | `[5000, 2³²[` | Excellence |
| `TOP_1_PCT` | Top 1% | `[10 000, 2³²[` | Élite de la plateforme |
| `DAO_ELIGIBLE` | DAO eligible | `[100, 2³²[` | Éligible à la gouvernance |

---

## 3. Circuit GhostDisclosure.circom

**Fichier :** [contracts/circuits/GhostDisclosure.circom](../contracts/circuits/GhostDisclosure.circom)

### Signaux

```
PRIVÉS (witness — jamais révélés)   │  PUBLICS (vérifiés on-chain)
───────────────────────────────────  │  ────────────────────────────────────────
usernameHash       (keccak256)       │  identityCommitment  Poseidon(h, salt)
reputationScore    (valeur exacte)   │  platformId          keccak256("github")
salt               (128 bits)        │  tierMinScore        borne basse inclusive
reclaimIdentifier  (claim Reclaim)   │  tierMaxScore        borne haute exclusive
                                     │  nullifier           Poseidon(h, pid, id)
```

### Les 5 contraintes algébriques

$$
(1)\quad \text{identityCommitment} = \text{Poseidon}(\text{usernameHash},\ \text{salt})
$$

$$
(2)\quad \text{nullifier} = \text{Poseidon}(\text{usernameHash},\ \text{platformId},\ \text{reclaimIdentifier})
$$

$$
(3)\quad \text{tierMinScore} \leq \text{reputationScore}
$$

$$
(4)\quad \text{reputationScore} < \text{tierMaxScore}
$$

$$
(5)\quad \text{reputationScore} < 2^{32} \quad \text{(overflow protection)}
$$

### Gabarit interne `RangeInclusion(n)`

```circom
template RangeInclusion(n) {
    signal input value;
    signal input minBound;
    signal input maxBound;
    // 3 comparateurs LessThan(n) :
    //   value < 2^n         (overflow)
    //   minBound < value+1  (borne basse)
    //   value < maxBound    (borne haute)
}
```

---

## 4. DisclosureProver.ts – API complète

**Fichier :** [frontend/lib/zkProver/DisclosureProver.ts](../frontend/lib/zkProver/DisclosureProver.ts)

### `eligibleTiersForScore(score)`

Retourne tous les tiers que le score satisfait, triés du plus exclusif au moins.

```typescript
import { eligibleTiersForScore } from "@/lib/zkProver";

const tiers = eligibleTiersForScore(420);
// → [{ label: "Contributeur régulier", minScore: 50, maxScore: 500 }]
// (Gold n'est pas éligible car 420 < 500)

const tiers2 = eligibleTiersForScore(8000);
// → [{ label: "Contributeur Gold" }, { label: "Top contributeur" }, ...]
```

### `bestTierForScore(score)`

Retourne le tier le plus exclusif disponible pour un score donné.
Utile pour proposer automatiquement le badge le plus valorisant.

```typescript
import { bestTierForScore } from "@/lib/zkProver";

const best = bestTierForScore(12000);
// → { label: "Top 1%", minScore: 10000, maxScore: 2^32 }
```

### `customTier(label, minScore, maxScore, description?)`

Crée un tier personnalisé à la volée — ex: seuil spécifique à une DAO.

```typescript
import { customTier } from "@/lib/zkProver";

const daoTier = customTier("DAO XYZ – Voting eligible", 250, 2 ** 32 - 1);
```

### `disclosureProver.prove(reclaimProof, platform, username, tier)`

Point d'entrée principal. Génère la preuve Groth16 de divulgation sélective.

```typescript
import { disclosureProver, DISCLOSURE_TIERS } from "@/lib/zkProver";

const attestation = await disclosureProver.prove(
  reclaimProof,              // ZKProof depuis ReclaimService
  "github",                  // plateforme
  "johndoe",                 // login réel — ne quitte JAMAIS le navigateur
  DISCLOSURE_TIERS.GOLD      // tier choisi par l'utilisateur
);

// Ce qui est visible on-chain :
// publicSignals[0] = identityCommitment
// publicSignals[1] = platformId (hash de "github")
// publicSignals[2] = 500   ← tierMinScore
// publicSignals[3] = 5000  ← tierMaxScore
// publicSignals[4] = nullifier

// Soumission on-chain :
await disclosureVerifier.verifyAndAttest(
  attestation.calldata.pA,
  attestation.calldata.pB,
  attestation.calldata.pC,
  attestation.calldata.pubSignals,
);
```

**Erreurs possibles :**

| Code | Cause |
|------|-------|
| `SCORE_NOT_IN_TIER` | `reputationScore` hors de l'intervalle `[minScore, maxScore[` |
| `CIRCUIT_NOT_LOADED` | Fichiers `.wasm` ou `.zkey` absents de `/public/circuits/` |
| `PROOF_GENERATION_FAILED` | Circuit non satisfait ou erreur snarkjs interne |

### `disclosureProver.verifyLocally(attestation)`

Vérifie une `GhostDisclosureAttestation` localement sans la re-générer.

```typescript
const valid = await disclosureProver.verifyLocally(attestation);
// → true if proof valid against local vkey
```

### Type `GhostDisclosureAttestation`

```typescript
interface GhostDisclosureAttestation {
  proof: Groth16Proof;                     // pA, pB, pC
  publicSignals: GhostDisclosurePublicSignals; // [commitment, pid, min, max, nullifier]
  calldata: GhostDisclosureCalldata;       // ABI-encodé, prêt pour le contrat
  tier: DisclosureTier;                    // tier utilisé
  meta: {
    platform: string;
    tierLabel: string;                     // ex: "Contributeur Gold"
    generatedAt: number;                   // timestamp ms
    nullifierHex: `0x${string}`;           // pour déduplication locale
  };
}
```

---

## 5. Comparatif des deux circuits

| | `GhostIdentity.circom` | `GhostDisclosure.circom` |
|---|---|---|
| **Objectif** | Prouver `score ≥ seuil` | Prouver `min ≤ score < max` |
| **Inputs publics** | commitment, platformId, threshold, nullifier | commitment, platformId, **tierMin**, **tierMax**, nullifier |
| **Signaux publics** | 4 | 5 |
| **Message on-chain** | "score ≥ 10" | "score dans [500, 5000[" |
| **Divulgation** | Seuil minimal seulement | Intervalle de tier choisi par l'user |
| **Nullifier** | `Poseidon(h, pid, reclaimId)` | `Poseidon(h, pid, reclaimId)` (identique) |
| **Artefacts** | `GhostIdentity*.wasm/zkey/vkey` | `GhostDisclosure*.wasm/zkey/vkey` |
| **Verifier Solidity** | `Groth16Verifier.sol` | `Groth16DisclosureVerifier.sol` |

Les deux circuits **partagent le même schéma de nullifier** → ils utilisent
le même registre `usedNullifiers` dans `GhostVerifier.sol`. Une contribution
ne peut générer qu'une seule attestation, quel que soit le circuit choisi.

---

## 6. Flux de compilation

Le script [contracts/scripts/compile-circuit.sh](../contracts/scripts/compile-circuit.sh)
compile désormais les **deux circuits** en séquence :

```
[1] Création des répertoires
[2] circom GhostIdentity.circom     → wasm + r1cs + sym
[3] Powers of Tau (partagé)         → pot17_final.ptau
[4] Groth16 Setup GhostIdentity     → GhostIdentity_final.zkey
[5] Export vkey GhostIdentity       → GhostIdentity_vkey.json
[6] Export Solidity GhostIdentity   → src/Groth16Verifier.sol
[7] circom GhostDisclosure.circom   → wasm + r1cs + sym
[8] Groth16 Setup GhostDisclosure   → GhostDisclosure_final.zkey
[9] Export vkey + Solidity          → GhostDisclosure_vkey.json
                                    → src/Groth16DisclosureVerifier.sol
```

Les artefacts `frontend/public/circuits/` servis côté client :

```
frontend/public/circuits/
  ├── GhostIdentity_js/
  │   └── GhostIdentity.wasm
  ├── GhostIdentity_final.zkey
  ├── GhostIdentity_vkey.json
  ├── GhostDisclosure_js/
  │   └── GhostDisclosure.wasm
  ├── GhostDisclosure_final.zkey
  └── GhostDisclosure_vkey.json
```

```bash
cd contracts
npm install circomlib
bash scripts/compile-circuit.sh
```

> **Production :** les étapes Powers of Tau et `zkey contribute` doivent être
> remplacées par une [cérémonie multi-parties publique](https://github.com/privacy-scaling-explorations/perpetualpowersoftau)
> pour garantir la propriété de sécurité du setup Groth16.
