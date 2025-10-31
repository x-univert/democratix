/**
 * Service de Vérification zk-SNARK
 *
 * Ce service vérifie les preuves Groth16 générées par les circuits Circom
 * - valid_vote.circom : Prouve qu'un vote est pour un candidat valide
 * - voter_eligibility_simple.circom : Prouve qu'un électeur est éligible
 */

import * as snarkjs from 'snarkjs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

// Helper pour typer les erreurs
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface PublicSignals extends Array<string> {}

export class ZKVerifierService {
  private static instance: ZKVerifierService;
  private validVoteVKey: any;
  private voterEligibilityVKey: any;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * Singleton pattern pour éviter de recharger les clés à chaque fois
   */
  public static getInstance(): ZKVerifierService {
    if (!ZKVerifierService.instance) {
      ZKVerifierService.instance = new ZKVerifierService();
    }
    return ZKVerifierService.instance;
  }

  /**
   * Initialise le service en chargeant les verification keys
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('ZKVerifier already initialized');
      return;
    }

    try {
      logger.info('Initializing ZKVerifier service...');

      // Charger la verification key pour valid_vote
      const validVoteKeyPath = join(
        __dirname,
        '../../circuits/build/valid_vote_verification_key.json'
      );
      this.validVoteVKey = JSON.parse(readFileSync(validVoteKeyPath, 'utf-8'));
      logger.info(`✅ Loaded valid_vote verification key`);

      // Charger la verification key pour voter_eligibility_simple
      const voterEligibilityKeyPath = join(
        __dirname,
        '../../circuits/build/voter_eligibility_simple_verification_key.json'
      );
      this.voterEligibilityVKey = JSON.parse(
        readFileSync(voterEligibilityKeyPath, 'utf-8')
      );
      logger.info(`✅ Loaded voter_eligibility_simple verification key`);

      this.initialized = true;
      logger.info('✅ ZKVerifier service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize ZKVerifier:', error);
      throw new Error(`ZKVerifier initialization failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Vérifie une preuve de vote valide
   *
   * @param proof - La preuve Groth16
   * @param publicSignals - Les signaux publics [electionId, numCandidates, voteCommitment]
   * @returns true si la preuve est valide, false sinon
   */
  public async verifyValidVoteProof(
    proof: Proof,
    publicSignals: PublicSignals
  ): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('ZKVerifier not initialized. Call initialize() first.');
    }

    try {
      logger.info('Verifying valid_vote proof...');
      logger.debug('Public signals:', publicSignals);

      // Vérifier la preuve avec snarkjs
      const isValid = await snarkjs.groth16.verify(
        this.validVoteVKey,
        publicSignals,
        proof
      );

      if (isValid) {
        logger.info('✅ valid_vote proof is VALID');
      } else {
        logger.warn('❌ valid_vote proof is INVALID');
      }

      return isValid;
    } catch (error) {
      logger.error('❌ Error verifying valid_vote proof:', error);
      throw new Error(`Proof verification failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Vérifie une preuve d'éligibilité d'électeur
   *
   * @param proof - La preuve Groth16
   * @param publicSignals - Les signaux publics [merkleRoot, nullifier, electionId]
   * @returns true si la preuve est valide, false sinon
   */
  public async verifyVoterEligibilityProof(
    proof: Proof,
    publicSignals: PublicSignals
  ): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('ZKVerifier not initialized. Call initialize() first.');
    }

    try {
      logger.info('Verifying voter_eligibility_simple proof...');
      logger.debug('Public signals:', publicSignals);

      // Vérifier la preuve avec snarkjs
      const isValid = await snarkjs.groth16.verify(
        this.voterEligibilityVKey,
        publicSignals,
        proof
      );

      if (isValid) {
        logger.info('✅ voter_eligibility_simple proof is VALID');
      } else {
        logger.warn('❌ voter_eligibility_simple proof is INVALID');
      }

      return isValid;
    } catch (error) {
      logger.error('❌ Error verifying voter_eligibility_simple proof:', error);
      throw new Error(`Proof verification failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Vérifie une preuve complète de vote (éligibilité + vote valide)
   *
   * @param eligibilityProof - Preuve d'éligibilité
   * @param eligibilityPublicSignals - Signaux publics éligibilité
   * @param voteProof - Preuve de vote valide
   * @param votePublicSignals - Signaux publics vote
   * @returns true si les deux preuves sont valides
   */
  public async verifyCompleteVoteProof(
    eligibilityProof: Proof,
    eligibilityPublicSignals: PublicSignals,
    voteProof: Proof,
    votePublicSignals: PublicSignals
  ): Promise<{
    valid: boolean;
    eligibilityValid: boolean;
    voteValid: boolean;
  }> {
    logger.info('Verifying complete vote proof (eligibility + vote)...');

    const eligibilityValid = await this.verifyVoterEligibilityProof(
      eligibilityProof,
      eligibilityPublicSignals
    );

    const voteValid = await this.verifyValidVoteProof(
      voteProof,
      votePublicSignals
    );

    const valid = eligibilityValid && voteValid;

    logger.info(`Complete vote verification: ${valid ? '✅ VALID' : '❌ INVALID'}`);
    logger.info(
      `  - Eligibility: ${eligibilityValid ? '✅' : '❌'}, Vote: ${voteValid ? '✅' : '❌'}`
    );

    return {
      valid,
      eligibilityValid,
      voteValid
    };
  }

  /**
   * Extrait les informations publiques d'une preuve de vote
   */
  public parseVotePublicSignals(publicSignals: PublicSignals): {
    electionId: string;
    numCandidates: string;
    voteCommitment: string;
  } {
    if (publicSignals.length !== 3) {
      throw new Error(
        `Invalid public signals length for valid_vote. Expected 3, got ${publicSignals.length}`
      );
    }

    return {
      electionId: publicSignals[0],
      numCandidates: publicSignals[1],
      voteCommitment: publicSignals[2]
    };
  }

  /**
   * Extrait les informations publiques d'une preuve d'éligibilité
   */
  public parseEligibilityPublicSignals(publicSignals: PublicSignals): {
    merkleRoot: string;
    nullifier: string;
    electionId: string;
  } {
    if (publicSignals.length !== 3) {
      throw new Error(
        `Invalid public signals length for voter_eligibility. Expected 3, got ${publicSignals.length}`
      );
    }

    return {
      merkleRoot: publicSignals[0],
      nullifier: publicSignals[1],
      electionId: publicSignals[2]
    };
  }

  /**
   * Vérifie que les verification keys sont chargées
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Retourne les informations sur les verification keys
   */
  public getVerificationKeysInfo(): {
    validVote: any;
    voterEligibility: any;
  } {
    return {
      validVote: this.validVoteVKey
        ? {
            protocol: this.validVoteVKey.protocol,
            curve: this.validVoteVKey.curve,
            nPublic: this.validVoteVKey.nPublic
          }
        : null,
      voterEligibility: this.voterEligibilityVKey
        ? {
            protocol: this.voterEligibilityVKey.protocol,
            curve: this.voterEligibilityVKey.curve,
            nPublic: this.voterEligibilityVKey.nPublic
          }
        : null
    };
  }
}

// Export singleton instance
export const zkVerifier = ZKVerifierService.getInstance();
