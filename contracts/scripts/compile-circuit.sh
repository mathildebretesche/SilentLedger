#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# compile-circuit.sh – Silent Ledger
#
# Script de compilation du circuit GhostIdentity.circom et de génération
# des artefacts nécessaires au prover (wasm, zkey, vkey).
#
# Prérequis :
#   npm install -g circom snarkjs
#   npm install circomlib   (dans contracts/)
#
# Usage :
#   cd contracts/
#   bash scripts/compile-circuit.sh
#
# Résultat :
#   frontend/public/circuits/
#     ├── GhostIdentity_js/
#     │   └── GhostIdentity.wasm   ← witness generator (côté client)
#     ├── GhostIdentity_final.zkey  ← proving key
#     ├── GhostIdentity_vkey.json   ← verification key (client + on-chain)
#     └── Groth16Verifier.sol       ← vérificateur Solidity à déployer
# ─────────────────────────────────────────────────────────────────────────────

set -e

CIRCUIT_DIR="circuits"
CIRCUIT_NAME="GhostIdentity"
OUTPUT_DIR="../frontend/public/circuits"
PTAU_DIR=".ptau"
PTAU_SIZE=17  # 2^17 = 131072 contraintes max (largement suffisant)

echo "━━━ [1/6] Création des répertoires ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$PTAU_DIR"

echo "━━━ [2/6] Compilation du circuit Circom ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
circom "$CIRCUIT_DIR/$CIRCUIT_NAME.circom" \
  --r1cs \
  --wasm \
  --sym \
  --output "$OUTPUT_DIR" \
  -l node_modules/circomlib/circuits

echo "    ✓ R1CS, WASM et symboles générés dans $OUTPUT_DIR"

echo "━━━ [3/6] Powers of Tau (setup de confiance) ━━━━━━━━━━━━━━━━━━━━━━━━━━"
PTAU_0="$PTAU_DIR/pot${PTAU_SIZE}_0000.ptau"
PTAU_1="$PTAU_DIR/pot${PTAU_SIZE}_0001.ptau"
PTAU_FINAL="$PTAU_DIR/pot${PTAU_SIZE}_final.ptau"

if [ ! -f "$PTAU_FINAL" ]; then
  echo "    Génération du pot initial..."
  snarkjs powersoftau new bn128 $PTAU_SIZE "$PTAU_0" -v

  echo "    Contribution #1 (aléatoire — remplacer par cérémonie réelle en prod)..."
  snarkjs powersoftau contribute "$PTAU_0" "$PTAU_1" \
    --name="SilentLedger Dev Contribution" \
    -e="$(openssl rand -hex 32)" \
    -v

  echo "    Préparation phase 2..."
  snarkjs powersoftau prepare phase2 "$PTAU_1" "$PTAU_FINAL" -v
  echo "    ✓ Powers of Tau prêts"
else
  echo "    ℹ Powers of Tau déjà présents, skip."
fi

echo "━━━ [4/6] Groth16 Setup (zkey) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ZKEY_0="$OUTPUT_DIR/${CIRCUIT_NAME}_0000.zkey"
ZKEY_FINAL="$OUTPUT_DIR/${CIRCUIT_NAME}_final.zkey"

snarkjs groth16 setup \
  "$OUTPUT_DIR/${CIRCUIT_NAME}.r1cs" \
  "$PTAU_FINAL" \
  "$ZKEY_0" \
  -v

echo "    Contribution au zkey..."
snarkjs zkey contribute "$ZKEY_0" "$ZKEY_FINAL" \
  --name="SilentLedger Dev ZKey" \
  -e="$(openssl rand -hex 32)" \
  -v

echo "    ✓ Proving key générée : $ZKEY_FINAL"

echo "━━━ [5/6] Export de la Verification Key ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
snarkjs zkey export verificationkey \
  "$ZKEY_FINAL" \
  "$OUTPUT_DIR/${CIRCUIT_NAME}_vkey.json"
echo "    ✓ Verification key : $OUTPUT_DIR/${CIRCUIT_NAME}_vkey.json"

echo "━━━ [6/6] Export du vérificateur Solidity ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
snarkjs zkey export solidityverifier \
  "$ZKEY_FINAL" \
  "src/Groth16Verifier.sol"
echo "    ✓ Groth16Verifier.sol généré dans src/"

# ═══════════════════════════════════════════════════════════════════════════════
# CIRCUIT 2 : GhostDisclosure (Selective Disclosure)
# ═══════════════════════════════════════════════════════════════════════════════
DISCLOSURE_NAME="GhostDisclosure"
DISCLOSURE_ZKEY_0="$OUTPUT_DIR/${DISCLOSURE_NAME}_0000.zkey"
DISCLOSURE_ZKEY_FINAL="$OUTPUT_DIR/${DISCLOSURE_NAME}_final.zkey"

echo ""
echo "━━━ [7/9] Compilation du circuit GhostDisclosure ━━━━━━━━━━━━━━━━━━━━━━"
circom "$CIRCUIT_DIR/$DISCLOSURE_NAME.circom" \
  --r1cs \
  --wasm \
  --sym \
  --output "$OUTPUT_DIR" \
  -l node_modules/circomlib/circuits
echo "    ✓ GhostDisclosure WASM + R1CS générés"

echo "━━━ [8/9] Groth16 Setup GhostDisclosure ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
snarkjs groth16 setup \
  "$OUTPUT_DIR/${DISCLOSURE_NAME}.r1cs" \
  "$PTAU_FINAL" \
  "$DISCLOSURE_ZKEY_0" \
  -v

snarkjs zkey contribute "$DISCLOSURE_ZKEY_0" "$DISCLOSURE_ZKEY_FINAL" \
  --name="SilentLedger Disclosure ZKey" \
  -e="$(openssl rand -hex 32)" \
  -v
echo "    ✓ Proving key : $DISCLOSURE_ZKEY_FINAL"

echo "━━━ [9/9] Export vkey + Solidity verifier (GhostDisclosure) ━━━━━━━━━━━"
snarkjs zkey export verificationkey \
  "$DISCLOSURE_ZKEY_FINAL" \
  "$OUTPUT_DIR/${DISCLOSURE_NAME}_vkey.json"
echo "    ✓ Verification key : $OUTPUT_DIR/${DISCLOSURE_NAME}_vkey.json"

snarkjs zkey export solidityverifier \
  "$DISCLOSURE_ZKEY_FINAL" \
  "src/Groth16DisclosureVerifier.sol"
echo "    ✓ Groth16DisclosureVerifier.sol généré dans src/"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Compilation terminée. Artefacts dans : $OUTPUT_DIR"
echo ""
echo "  Circuits compilés :"
echo "    • GhostIdentity   → identité pseudonyme + seuil minimal"
echo "    • GhostDisclosure → divulgation sélective par tier"
echo ""
echo "  Prochaines étapes :"
echo "    1. Déployer Groth16Verifier.sol          (pour GhostIdentity)"
echo "    2. Déployer Groth16DisclosureVerifier.sol (pour GhostDisclosure)"
echo "    3. Déployer GhostVerifier.sol avec l'adresse du Groth16Verifier"
echo "    4. Lancer le frontend : cd ../frontend && npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
