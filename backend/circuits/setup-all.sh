#!/bin/bash

# Circuit Setup Script for DEMOCRATIX
# Performs trusted setup (Phase 2) for all circuits

set -e  # Exit on error

echo "======================================"
echo "  DEMOCRATIX Circuit Setup (Phase 2)"
echo "======================================"
echo ""

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ Error: snarkjs not found!"
    echo "Please install snarkjs:"
    echo "  npm install -g snarkjs"
    exit 1
fi

echo "✅ snarkjs found"
echo ""

cd build

# Check if Powers of Tau file exists
if [ ! -f "powersOfTau28_hez_final_20.ptau" ]; then
    echo "❌ Powers of Tau file not found!"
    echo "Please download it first:"
    echo "  cd build"
    echo "  wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau"
    echo ""
    echo "Or run: ./download-ptau.sh"
    exit 1
fi

echo "✅ Powers of Tau file found"
echo ""

# ==========================================
# Setup voter_eligibility circuit
# ==========================================
echo "🔐 Setting up voter_eligibility circuit..."

echo "  Step 1/3: Groth16 setup..."
snarkjs groth16 setup \
    voter_eligibility.r1cs \
    powersOfTau28_hez_final_20.ptau \
    voter_eligibility_0000.zkey

echo "  Step 2/3: Contributing to ceremony..."
echo "democratix" | snarkjs zkey contribute \
    voter_eligibility_0000.zkey \
    voter_eligibility_final.zkey \
    --name="DEMOCRATIX Contributor" -v

echo "  Step 3/3: Exporting verification key..."
snarkjs zkey export verificationkey \
    voter_eligibility_final.zkey \
    voter_eligibility_verification_key.json

echo "✅ voter_eligibility setup complete!"
echo "   - voter_eligibility_final.zkey"
echo "   - voter_eligibility_verification_key.json"
echo ""

# Clean up intermediate files
rm -f voter_eligibility_0000.zkey

# ==========================================
# Setup valid_vote circuit
# ==========================================
echo "🔐 Setting up valid_vote circuit..."

echo "  Step 1/3: Groth16 setup..."
snarkjs groth16 setup \
    valid_vote.r1cs \
    powersOfTau28_hez_final_20.ptau \
    valid_vote_0000.zkey

echo "  Step 2/3: Contributing to ceremony..."
echo "democratix" | snarkjs zkey contribute \
    valid_vote_0000.zkey \
    valid_vote_final.zkey \
    --name="DEMOCRATIX Contributor" -v

echo "  Step 3/3: Exporting verification key..."
snarkjs zkey export verificationkey \
    valid_vote_final.zkey \
    valid_vote_verification_key.json

echo "✅ valid_vote setup complete!"
echo "   - valid_vote_final.zkey"
   - valid_vote_verification_key.json"
echo ""

# Clean up intermediate files
rm -f valid_vote_0000.zkey

echo "======================================"
echo "  ✅ All circuits setup complete!"
echo "======================================"
echo ""
echo "⚠️  SECURITY WARNING:"
echo "  For PRODUCTION, use a multi-party ceremony!"
echo "  This single-contributor setup is for DEVELOPMENT only."
echo ""
echo "Generated files:"
echo "  - voter_eligibility_final.zkey (proving key)"
echo "  - voter_eligibility_verification_key.json"
echo "  - valid_vote_final.zkey (proving key)"
echo "  - valid_vote_verification_key.json"
echo ""
echo "Next steps:"
echo "  1. Test circuits: ./test-circuits.sh"
echo "  2. Integrate with backend: Update paths in cryptoService.ts"
echo "  3. Integrate with smart contracts: Implement Groth16 verifier"
echo ""
