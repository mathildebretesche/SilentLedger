/**
 * commitments.ts – Ghost ZK Prover
 *
 * Génération des engagements cryptographiques (commitments) pour le système
 * de preuve Ghost. Utilise le hash de Poseidon, natif des circuits ZK
 * (contrairement à keccak256 très coûteux en contraintes Circom).
 *
 * Poseidon est une fonction de hachage algébrique conçue pour être
 * "ZK-friendly" : ~100× moins de contraintes que SHA-256 dans un circuit R1CS.
 *
 * Schéma de commitments :
 *
 *   identityCommitment = Poseidon([usernameHash, salt])
 *     → Lie l'identité à un sel local → binding + hiding
 *
 *   nullifier = Poseidon([usernameHash, platformId, nonce])
 *     → Unique par (identité × plateforme × nonce) → anti double-preuve
 *
 *   usernameHash = keccak256(username) as field element
 *     → Représentation du username en field BN128 (< p)
 */

import { buildPoseidon } from "circomlibjs";
import { keccak256, toBytes, concat } from "viem";

// ─── Initialisation lazy du hasher Poseidon ───────────────────────────────────

/** Singleton du hasher Poseidon, chargé une seule fois. */
let poseidonHasher: Awaited<ReturnType<typeof buildPoseidon>> | null = null;

/**
 * Retourne le hasher Poseidon (initialisation lazy).
 * L'initialisation de circomlibjs est asynchrone et coûteuse en mémoire ;
 * on ne la fait qu'une fois, au premier appel.
 */
async function getPoseidon() {
  if (!poseidonHasher) {
    poseidonHasher = await buildPoseidon();
  }
  return poseidonHasher;
}

// ─── Ordre du corps BN128 (field prime) ──────────────────────────────────────

/**
 * Ordre du corps scalaire de la courbe BN128 utilisée par Groth16.
 * Tout input de circuit doit être < FIELD_PRIME.
 */
const FIELD_PRIME =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// ─── Helpers internes ─────────────────────────────────────────────────────────

/**
 * Convertit un BigInt en field element BN128 (modulo p).
 * Garantit que l'input est valide pour le circuit Circom.
 */
function toField(n: bigint): bigint {
  return ((n % FIELD_PRIME) + FIELD_PRIME) % FIELD_PRIME;
}

/**
 * Hash Poseidon d'un tableau de BigInts.
 * Retourne la valeur de sortie en BigInt.
 */
async function poseidon(inputs: bigint[]): Promise<bigint> {
  const h = await getPoseidon();
  const fieldInputs = inputs.map(toField);
  const result = h(fieldInputs);
  return BigInt(h.F.toString(result));
}

/**
 * Convertit un hash hex (0x...) en BigInt field element.
 * Utilisé pour passer les outputs de keccak256 dans le circuit.
 */
function hexToField(hex: `0x${string}`): bigint {
  return toField(BigInt(hex));
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Calcule le hash du nom d'utilisateur côté client.
 * keccak256(username) converti en field element BN128.
 *
 * Ce hash est l'input privé principal du circuit. Il ne quitte jamais
 * le navigateur — seul son engagement (identityCommitment) est public.
 *
 * @param username  Login brut de la plateforme (ex: "johndoe").
 * @returns         Field element < FIELD_PRIME.
 */
export function computeUsernameHash(username: string): bigint {
  const hash = keccak256(toBytes(username));
  return hexToField(hash);
}

/**
 * Calcule le platformId en tant que field element.
 * keccak256("github" | "slack" | ...) tronqué pour tenir dans BN128.
 *
 * @param platform  Identifiant de la plateforme en minuscules.
 */
export function computePlatformFieldId(platform: string): bigint {
  const hash = keccak256(toBytes(platform.toLowerCase()));
  return hexToField(hash);
}

/**
 * Génère un sel cryptographiquement aléatoire de 128 bits.
 * À stocker côté client (localStorage chiffré) pour permettre
 * de recalculer l'identityCommitment sans re-prouver.
 *
 * @returns BigInt < FIELD_PRIME.
 */
export function generateSalt(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(16)); // 128 bits
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  return toField(n);
}

/**
 * Convertit le `CompleteClaimData.identifier` d'une preuve Reclaim
 * en field element BN128.
 *
 * L'identifier Reclaim est un bytes32 déterministe calculé depuis les
 * paramètres de la requête HTTPS (URL, regex, timestamp…). Il est donc
 * IDENTIQUE pour la même contribution, quel que soit le wallet qui soumet.
 *
 * En l'utilisant dans le nullifier, on garantit :
 *   "Deux wallets différents qui soumettent la même contribution → même
 *    nullifier → le second appel revert sur GhostVerifier.sol."
 *
 * @param identifier  reclaimProof.identifier (ex: "0x1a2b3c...")
 */
export function computeClaimIdentifier(identifier: string): bigint {
  // L'identifier est déjà un bytes32 hex — on le convertit en field element
  const hex = identifier.startsWith("0x") ? identifier : `0x${identifier}`;
  return hexToField(hex as `0x${string}`);
}

/**
 * Calcule l'identityCommitment.
 *
 *   identityCommitment = Poseidon([usernameHash, salt])
 *
 * C'est le seul hash qui apparaît on-chain pour identifier un utilisateur.
 * Il est "hiding" (le username est indiscernable depuis le commitment)
 * et "binding" (un username ne peut avoir qu'un seul commitment par sel).
 *
 * @param usernameHash  Résultat de `computeUsernameHash()`.
 * @param salt          Résultat de `generateSalt()`.
 */
export async function computeIdentityCommitment(
  usernameHash: bigint,
  salt: bigint
): Promise<bigint> {
  return poseidon([usernameHash, salt]);
}

/**
 * Calcule le nullifier d'une soumission.
 *
 *   nullifier = Poseidon([usernameHash, platformId, reclaimIdentifier])
 *
 * Propriétés :
 *   • Déterministe : le même claim Reclaim produit toujours le même nullifier.
 *   • Anti cross-wallet : deux wallets différents soumettant la MÊME contribution
 *     (même reclaimIdentifier) obtiendront le même nullifier → revert on-chain.
 *   • Ne révèle ni le username ni le salt.
 *   • Un utilisateur peut prouver plusieurs contributions distinctes car
 *     chaque claim Reclaim a un identifier différent.
 *
 * @param usernameHash       Résultat de `computeUsernameHash()`.
 * @param platformId         Résultat de `computePlatformFieldId()`.
 * @param reclaimIdentifier  Résultat de `computeClaimIdentifier()`.
 */
export async function computeNullifier(
  usernameHash: bigint,
  platformId: bigint,
  reclaimIdentifier: bigint
): Promise<bigint> {
  return poseidon([usernameHash, platformId, reclaimIdentifier]);
}

/**
 * Convertit un BigInt field element en string hexadécimal 0x-préfixé.
 * Utilisé pour sérialiser les commitments/nullifiers pour stockage
 * ou comparaison avec les valeurs on-chain.
 */
export function fieldToHex(n: bigint): `0x${string}` {
  return `0x${n.toString(16).padStart(64, "0")}`;
}

/**
 * Recrée l'identityCommitment depuis le storage local.
 * Utile pour vérifier côté client qu'un commitment on-chain appartient
 * à l'utilisateur courant, sans re-générer une preuve complète.
 *
 * @param username  Login brut (input utilisateur).
 * @param saltHex   Sel stocké localement (résultat de `fieldToHex(salt)`).
 */
export async function recomputeCommitmentFromStorage(
  username: string,
  saltHex: `0x${string}`
): Promise<bigint> {
  const usernameHash = computeUsernameHash(username);
  const salt = BigInt(saltHex);
  return computeIdentityCommitment(usernameHash, salt);
}

/**
 * Vérifie côté client qu'un commitment hex correspond bien à un username
 * et un sel donnés. Retourne true si la correspondance est confirmée.
 *
 * @example
 * const ok = await verifyCommitment("johndoe", saltHex, onChainCommitmentHex);
 */
export async function verifyCommitment(
  username: string,
  saltHex: `0x${string}`,
  expectedCommitmentHex: `0x${string}`
): Promise<boolean> {
  const commitment = await recomputeCommitmentFromStorage(username, saltHex);
  return fieldToHex(commitment) === expectedCommitmentHex.toLowerCase();
}
