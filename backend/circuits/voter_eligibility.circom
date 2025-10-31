pragma circom 2.1.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/smt/smtverifier.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

/**
 * Circuit: Voter Eligibility Proof
 *
 * Prouve qu'un électeur est dans le Merkle tree sans révéler son identité.
 *
 * Public Inputs:
 * - merkleRoot: Root du Merkle tree (liste des électeurs)
 * - nullifier: Hash unique par électeur/élection (empêche double vote)
 * - electionId: ID de l'élection
 *
 * Private Inputs:
 * - identityNullifier: Nullifier secret de l'identité
 * - identityTrapdoor: Trapdoor secret de l'identité
 * - merklePathIndices: Chemin dans le Merkle tree (0=gauche, 1=droite)
 * - merklePathElements: Siblings à chaque niveau
 *
 * Circuit inspiré de Semaphore Protocol:
 * https://github.com/semaphore-protocol/semaphore/blob/main/packages/circuits/semaphore.circom
 */
template VoterEligibility(levels) {
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
    signal input merklePathIndices[levels];
    signal input merklePathElements[levels];

    // ==========================================
    // STEP 1: Calculate Identity Commitment
    // ==========================================
    // commitment = Poseidon(nullifier, trapdoor)
    component identityHasher = Poseidon(2);
    identityHasher.inputs[0] <== identityNullifier;
    identityHasher.inputs[1] <== identityTrapdoor;
    signal identityCommitment <== identityHasher.out;

    // ==========================================
    // STEP 2: Verify Merkle Proof
    // ==========================================
    // Prouve que identityCommitment est dans le Merkle tree
    component merkleVerifier = SMTVerifier(levels);
    merkleVerifier.enabled <== 1;
    merkleVerifier.root <== merkleRoot;
    merkleVerifier.value <== identityCommitment;

    for (var i = 0; i < levels; i++) {
        merkleVerifier.siblings[i] <== merklePathElements[i];
    }

    // Convert path indices to bits
    component pathBits = Num2Bits(levels);
    pathBits.in <== merklePathIndices[0];
    for (var i = 0; i < levels; i++) {
        merkleVerifier.oldKey[i] <== pathBits.out[i];
    }

    // ==========================================
    // STEP 3: Calculate Nullifier
    // ==========================================
    // nullifier = Poseidon(identityNullifier, electionId)
    // Ceci empêche un électeur de voter 2x dans la même élection
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identityNullifier;
    nullifierHasher.inputs[1] <== electionId;

    // Vérifier que le nullifier calculé correspond au nullifier public
    nullifier === nullifierHasher.out;

    // ==========================================
    // OUTPUT
    // ==========================================
    // Pas de output explicite, le circuit vérifie juste les contraintes
}

// Main component avec 20 niveaux (2^20 = 1M voters max)
component main {public [merkleRoot, nullifier, electionId]} = VoterEligibility(20);
