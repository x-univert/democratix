#!/bin/bash

# Circuit Compilation Script for DEMOCRATIX
# Compiles all Circom circuits to R1CS, WASM, and symbols

set -e  # Exit on error

echo "======================================"
echo "  DEMOCRATIX Circuit Compilation"
echo "======================================"
echo ""

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ Error: circom compiler not found!"
    echo "Please install circom first:"
    echo "  https://docs.circom.io/getting-started/installation/"
    exit 1
fi

echo "✅ circom compiler found: $(circom --version)"
echo ""

# Create output directory
mkdir -p build
cd build

# Compile voter_eligibility.circom
echo "📦 Compiling voter_eligibility.circom..."
circom ../voter_eligibility.circom \
    --r1cs --wasm --sym --c \
    --output .

if [ $? -eq 0 ]; then
    echo "✅ voter_eligibility.circom compiled successfully!"
    echo "   - voter_eligibility.r1cs"
    echo "   - voter_eligibility_js/voter_eligibility.wasm"
    echo "   - voter_eligibility.sym"
else
    echo "❌ Failed to compile voter_eligibility.circom"
    exit 1
fi

echo ""

# Compile valid_vote.circom
echo "📦 Compiling valid_vote.circom..."
circom ../valid_vote.circom \
    --r1cs --wasm --sym --c \
    --output .

if [ $? -eq 0 ]; then
    echo "✅ valid_vote.circom compiled successfully!"
    echo "   - valid_vote.r1cs"
    echo "   - valid_vote_js/valid_vote.wasm"
    echo "   - valid_vote.sym"
else
    echo "❌ Failed to compile valid_vote.circom"
    exit 1
fi

echo ""
echo "======================================"
echo "  ✅ All circuits compiled!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Download Powers of Tau: ./download-ptau.sh"
echo "  2. Run setup: ./setup-all.sh"
echo "  3. Test circuits: ./test-circuits.sh"
echo ""
