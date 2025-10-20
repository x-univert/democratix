#!/bin/bash

# Script de déploiement sur MultiversX Devnet
# Ce script déploie tous les smart contracts DEMOCRATIX sur le devnet

set -e

echo "=========================================="
echo "  DEMOCRATIX - Deploiement sur Devnet"
echo "=========================================="
echo ""

# Vérifier que mxpy est installé
if ! command -v mxpy &> /dev/null
then
    echo "Error: mxpy n'est pas installé"
    echo "Installation: pip3 install multiversx-sdk-cli --upgrade"
    exit 1
fi

# Vérifier que les contrats sont buildés
if [ ! -f "voter-registry/output/voter-registry.wasm" ]; then
    echo "Error: voter-registry.wasm not found. Run ./build.sh first"
    exit 1
fi

if [ ! -f "voting/output/voting.wasm" ]; then
    echo "Error: voting.wasm not found. Run ./build.sh first"
    exit 1
fi

# Demander le PEM file
read -p "Enter path to your wallet PEM file: " PEM_FILE

if [ ! -f "$PEM_FILE" ]; then
    echo "Error: PEM file not found at $PEM_FILE"
    exit 1
fi

echo ""
echo "Deploying to devnet..."
echo ""

# Déployer voter-registry
echo "1/3 Deploying voter-registry..."
VOTER_REGISTRY_ADDRESS=$(mxpy --verbose contract deploy \
    --bytecode=voter-registry/output/voter-registry.wasm \
    --recall-nonce \
    --pem="$PEM_FILE" \
    --gas-limit=50000000 \
    --proxy=https://devnet-gateway.multiversx.com \
    --chain=D \
    --send | grep -oP 'bech32: \K[^ ]+')

echo "✓ voter-registry deployed at: $VOTER_REGISTRY_ADDRESS"
echo ""

# Déployer voting
echo "2/3 Deploying voting..."
VOTING_ADDRESS=$(mxpy --verbose contract deploy \
    --bytecode=voting/output/voting.wasm \
    --recall-nonce \
    --pem="$PEM_FILE" \
    --gas-limit=50000000 \
    --proxy=https://devnet-gateway.multiversx.com \
    --chain=D \
    --send | grep -oP 'bech32: \K[^ ]+')

echo "✓ voting deployed at: $VOTING_ADDRESS"
echo ""

# Déployer results
if [ -f "results/output/results.wasm" ]; then
    echo "3/3 Deploying results..."
    RESULTS_ADDRESS=$(mxpy --verbose contract deploy \
        --bytecode=results/output/results.wasm \
        --recall-nonce \
        --pem="$PEM_FILE" \
        --gas-limit=50000000 \
        --proxy=https://devnet-gateway.multiversx.com \
        --chain=D \
        --send | grep -oP 'bech32: \K[^ ]+')

    echo "✓ results deployed at: $RESULTS_ADDRESS"
else
    echo "3/3 Skipping results (not built yet)"
    RESULTS_ADDRESS="NOT_DEPLOYED"
fi

echo ""
echo "=========================================="
echo "  ✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Contract Addresses:"
echo "  VOTER_REGISTRY_CONTRACT=$VOTER_REGISTRY_ADDRESS"
echo "  VOTING_CONTRACT=$VOTING_ADDRESS"
echo "  RESULTS_CONTRACT=$RESULTS_ADDRESS"
echo ""
echo "Next steps:"
echo "  1. Copy these addresses to your .env file"
echo "  2. Update backend/.env with these values"
echo "  3. Test the contracts: ./interact-devnet.sh"
echo ""
echo "Explorer links:"
echo "  - voter-registry: https://devnet-explorer.multiversx.com/accounts/$VOTER_REGISTRY_ADDRESS"
echo "  - voting: https://devnet-explorer.multiversx.com/accounts/$VOTING_ADDRESS"
echo "  - results: https://devnet-explorer.multiversx.com/accounts/$RESULTS_ADDRESS"
