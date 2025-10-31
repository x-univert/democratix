pragma circom 2.1.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

/**
 * Circuit: Voter Eligibility Proof (Simplified Version)
 *
 * Version simplifiée sans SMT Verifier pour POC
 * Prouve qu'un électeur a un commitment valide et génère un nullifier
 *
 * Public Inputs:
 * - merkleRoot: Root du Merkle tree (pour vérification future)
 * - nullifier: Hash unique par électeur/élection
 * - electionId: ID de l'élection
 *
 * Private Inputs:
 * - identityNullifier: Nullifier secret de l'identité
 * - identityTrapdoor: Trapdoor secret de l'identité
 *
 * Note: Cette version simplifieés ne vérifie pas le Merkle proof
 * Pour production, implémenter avec IncrementalMerkleTree de circomlib
 */
template VoterEligibilitySimple() {
    // ==========================================
    // PUBLIC INPUTS
    // ==========================================
    signal input merkleRoot;
    signal input nullifier;
    signal input electionId;

    // ==========================================
    // PRIVATE INPUTS
    // ==========================================
    signal input identityNullifier;
    signal input identityTrapdoor;

    // ==========================================
    // STEP 1: Calculate Identity Commitment
    // ==========================================
    // commitment = Poseidon(nullifier, trapdoor)
    component identityHasher = Poseidon(2);
    identityHasher.inputs[0] <== identityNullifier;
    identityHasher.inputs[1] <== identityTrapdoor;
    signal identityCommitment <== identityHasher.out;

    // ==========================================
    // STEP 2: Calculate Nullifier
    // ==========================================
    // nullifier = Poseidon(identityNullifier, electionId)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identityNullifier;
    nullifierHasher.inputs[1] <== electionId;

    // Vérifier que le nullifier calculé correspond au nullifier public
    nullifier === nullifierHasher.out;

    // ==========================================
    // STEP 3: Range Checks
    // ==========================================
    // S'assurer que les valeurs sont bien des nombres
    component nullifierBits = Num2Bits(254);
    nullifierBits.in <== identityNullifier;

    component trapdoorBits = Num2Bits(254);
    trapdoorBits.in <== identityTrapdoor;

    // ==========================================
    // STEP 4: Verify MerkleRoot is not zero (basic check)
    // ==========================================
    component isZero = IsZero();
    isZero.in <== merkleRoot;

    // Le merkleRoot ne doit pas être zéro
    isZero.out === 0;

    // Note: Pour la version complète, ajouter ici la vérification Merkle
    // avec les pathIndices et pathElements
}

// Main component
component main {public [merkleRoot, nullifier, electionId]} = VoterEligibilitySimple();
