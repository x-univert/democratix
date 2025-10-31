pragma circom 2.1.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

/**
 * Circuit: Valid Vote Proof
 *
 * Prouve qu'un vote est pour un candidat valide sans révéler pour qui.
 *
 * Public Inputs:
 * - electionId: ID de l'élection
 * - numCandidates: Nombre de candidats dans l'élection
 * - voteCommitment: Commitment du vote chiffré
 *
 * Private Inputs:
 * - candidateId: ID du candidat choisi (secret!)
 * - randomness: Sel aléatoire pour le commitment
 *
 * Le circuit prouve:
 * 1. candidateId < numCandidates (vote valide)
 * 2. voteCommitment = Hash(electionId, candidateId, randomness)
 */
template ValidVote() {
    // ==========================================
    // PUBLIC INPUTS
    // ==========================================
    signal input electionId;
    signal input numCandidates;
    signal input voteCommitment;

    // ==========================================
    // PRIVATE INPUTS
    // ==========================================
    signal input candidateId;
    signal input randomness;

    // ==========================================
    // STEP 1: Verify Candidate ID is Valid
    // ==========================================
    // candidateId doit être < numCandidates
    component lessThan = LessThan(32);
    lessThan.in[0] <== candidateId;
    lessThan.in[1] <== numCandidates;
    lessThan.out === 1;

    // ==========================================
    // STEP 2: Verify Vote Commitment
    // ==========================================
    // voteCommitment = Poseidon(electionId, candidateId, randomness)
    component commitmentHasher = Poseidon(3);
    commitmentHasher.inputs[0] <== electionId;
    commitmentHasher.inputs[1] <== candidateId;
    commitmentHasher.inputs[2] <== randomness;

    // Vérifier que le commitment calculé correspond au commitment public
    voteCommitment === commitmentHasher.out;

    // ==========================================
    // STEP 3: Range Check (Security)
    // ==========================================
    // S'assurer que candidateId est bien un nombre (pas de overflow)
    component candidateBits = Num2Bits(32);
    candidateBits.in <== candidateId;

    // S'assurer que randomness est bien un nombre
    component randomnessBits = Num2Bits(254);
    randomnessBits.in <== randomness;
}

// Main component
component main {public [electionId, numCandidates, voteCommitment]} = ValidVote();
