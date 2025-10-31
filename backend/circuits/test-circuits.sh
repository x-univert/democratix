#!/bin/bash

# Test Script for DEMOCRATIX Circuits

set -e  # Exit on error

echo "======================================"
echo "  DEMOCRATIX Circuit Testing"
echo "======================================"
echo ""

cd build

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ Error: snarkjs not found!"
    exit 1
fi

# ==========================================
# Test 1: Valid Vote Circuit
# ==========================================
echo "🧪 TEST 1: Valid Vote Circuit"
echo "────────────────────────────────────"
echo ""

# Create test input
echo "Creating test input..."
cat > test_valid_vote_input.json <<EOF
{
  "electionId": "1",
  "numCandidates": "5",
  "voteCommitment": "12345678901234567890123456789012",
  "candidateId": "2",
  "randomness": "98765432109876543210987654321098"
}
EOF

echo "✅ Test input created"
echo ""

# Generate witness
echo "Generating witness..."
node valid_vote_js/generate_witness.js \
    valid_vote_js/valid_vote.wasm \
    test_valid_vote_input.json \
    test_valid_vote_witness.wtns

if [ $? -eq 0 ]; then
    echo "✅ Witness generated successfully"
else
    echo "❌ Witness generation failed"
    exit 1
fi

echo ""

# Generate proof
echo "Generating proof..."
snarkjs groth16 prove \
    valid_vote_final.zkey \
    test_valid_vote_witness.wtns \
    test_valid_vote_proof.json \
    test_valid_vote_public.json

if [ $? -eq 0 ]; then
    echo "✅ Proof generated successfully"
else
    echo "❌ Proof generation failed"
    exit 1
fi

echo ""

# Verify proof
echo "Verifying proof..."
snarkjs groth16 verify \
    valid_vote_verification_key.json \
    test_valid_vote_public.json \
    test_valid_vote_proof.json

if [ $? -eq 0 ]; then
    echo "✅ Proof verified successfully!"
else
    echo "❌ Proof verification failed"
    exit 1
fi

echo ""
echo "✅ Valid Vote Circuit: ALL TESTS PASSED"
echo ""

# ==========================================
# Test 2: Voter Eligibility Circuit (Simplified)
# ==========================================
echo "🧪 TEST 2: Voter Eligibility Circuit"
echo "────────────────────────────────────"
echo ""
echo "⚠️  Note: Full test requires Merkle tree setup"
echo "   Skipping for now - implement in integration tests"
echo ""

# Clean up test files
echo "Cleaning up test files..."
rm -f test_*.json test_*.wtns

echo "======================================"
echo "  ✅ Circuit Testing Complete!"
echo "======================================"
echo ""
echo "Summary:"
echo "  ✅ Valid Vote Circuit: PASSED"
echo "  ⏸️  Voter Eligibility Circuit: SKIPPED (requires Merkle tree)"
echo ""
echo "Next steps:"
echo "  1. Integrate circuits with backend (cryptoService.ts)"
echo "  2. Implement Groth16 verifier in Rust smart contracts"
echo "  3. Create end-to-end integration tests"
echo ""
