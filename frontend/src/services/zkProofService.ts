import axios from 'axios';
import { randomBytes } from 'crypto';
import { groth16 } from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000';

// Paths to circuit files
const CIRCUITS_PATH = '/circuits';
const VALID_VOTE_WASM = `${CIRCUITS_PATH}/valid_vote.wasm`;
const VALID_VOTE_ZKEY = `${CIRCUITS_PATH}/valid_vote_final.zkey`;
const ELIGIBILITY_WASM = `${CIRCUITS_PATH}/voter_eligibility_simple.wasm`;
const ELIGIBILITY_ZKEY = `${CIRCUITS_PATH}/voter_eligibility_simple_final.zkey`;

/**
 * Interface pour une preuve zk-SNARK Groth16
 */
export interface ZKProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

/**
 * Signaux publics pour une preuve de vote valide
 * [electionId, numCandidates, voteCommitment]
 */
export type VotePublicSignals = [string, string, string];

/**
 * Signaux publics pour une preuve d'éligibilité
 * [merkleRoot, nullifier, electionId]
 */
export type EligibilityPublicSignals = [string, string, string];

/**
 * Réponse de vérification du backend
 */
export interface VerificationResponse {
  verified: boolean;
  voteInfo?: {
    electionId: string;
    numCandidates: string;
    voteCommitment: string;
  };
  eligibilityInfo?: {
    merkleRoot: string;
    nullifier: string;
    electionId: string;
  };
  signature: string;
  timestamp: string;
  error?: string;
}

/**
 * Données de vote privé pour la blockchain
 */
export interface PrivateVoteData {
  electionId: number;
  voteCommitment: string;
  nullifier: string;
  backendSignature: string;
}

/**
 * Service de gestion des preuves zk-SNARK pour le vote privé
 */
export class ZKProofService {
  private backendUrl: string;
  private poseidon: any = null;

  constructor(backendUrl: string = BACKEND_API_URL) {
    this.backendUrl = backendUrl;
  }

  /**
   * Initialise Poseidon hash (lazy loading)
   */
  private async getPoseidon() {
    if (!this.poseidon) {
      this.poseidon = await buildPoseidon();
    }
    return this.poseidon;
  }

  /**
   * Vérifie l'état de santé du service zk-SNARK backend
   */
  async checkHealth(): Promise<{
    status: string;
    initialized: boolean;
    verificationKeys: any;
  }> {
    try {
      const response = await axios.get(`${this.backendUrl}/api/zk/health`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur de connexion au service zk-SNARK:', error);
      throw new Error(
        `Impossible de se connecter au service zk-SNARK: ${error.message}`
      );
    }
  }

  /**
   * Génère un commitment de vote avec Poseidon hash
   *
   * @param electionId - ID de l'élection
   * @param candidateId - ID du candidat choisi
   * @param randomness - Sel aléatoire pour le commitment
   * @returns Hash du vote (commitment) en format décimal
   */
  async generateVoteCommitment(
    electionId: number,
    candidateId: number,
    randomness: string
  ): Promise<string> {
    const poseidon = await this.getPoseidon();

    // Convertir randomness (hex) en BigInt
    const randomnessBigInt = BigInt('0x' + randomness);

    // voteCommitment = Poseidon(electionId, candidateId, randomness)
    const hash = poseidon([electionId, candidateId, randomnessBigInt]);
    const commitmentDecimal = poseidon.F.toString(hash);

    console.log('🔐 Vote commitment generated (Poseidon):', {
      electionId,
      candidateId,
      randomness: randomness.substring(0, 10) + '...',
      commitment: commitmentDecimal
    });

    return commitmentDecimal;
  }

  /**
   * Génère un nullifier unique avec Poseidon hash
   *
   * @param electionId - ID de l'élection
   * @param identityNullifier - Secret de l'électeur (identityNullifier)
   * @returns Nullifier unique en format décimal
   */
  async generateNullifier(
    electionId: number,
    identityNullifier: string
  ): Promise<string> {
    const poseidon = await this.getPoseidon();

    // Convertir identityNullifier (hex) en BigInt
    const identityBigInt = BigInt('0x' + identityNullifier);

    // nullifier = Poseidon(identityNullifier, electionId)
    const hash = poseidon([identityBigInt, electionId]);
    const nullifierDecimal = poseidon.F.toString(hash);

    console.log('🔒 Nullifier generated (Poseidon):', {
      electionId,
      identityNullifier: identityNullifier.substring(0, 10) + '...',
      nullifier: nullifierDecimal
    });

    return nullifierDecimal;
  }

  /**
   * Génère un secret aléatoire pour l'électeur (identityNullifier)
   * À stocker de manière sécurisée côté client (localStorage, etc.)
   *
   * @returns Secret hexadécimal
   */
  generateVoterSecret(): string {
    const secret = randomBytes(32).toString('hex');
    console.log('🔑 Voter secret generated');
    return secret;
  }

  /**
   * Génère une preuve de vote valide avec Groth16
   *
   * @param electionId - ID de l'élection
   * @param candidateId - ID du candidat
   * @param numCandidates - Nombre total de candidats
   * @param randomness - Sel aléatoire (32 bytes hex)
   * @returns Preuve et signaux publics
   */
  async generateVoteProof(
    electionId: number,
    candidateId: number,
    numCandidates: number,
    randomness: string
  ): Promise<{
    proof: ZKProof;
    publicSignals: VotePublicSignals;
  }> {
    console.log('🔨 Generating REAL vote proof with Groth16...');
    console.log('📊 Inputs:', { electionId, candidateId, numCandidates });

    try {
      // Générer le commitment avec Poseidon
      const voteCommitment = await this.generateVoteCommitment(
        electionId,
        candidateId,
        randomness
      );

      // Convertir randomness en BigInt
      const randomnessBigInt = BigInt('0x' + randomness);

      // Inputs pour le circuit valid_vote.circom
      const circuitInputs = {
        electionId: electionId.toString(),
        numCandidates: numCandidates.toString(),
        voteCommitment: voteCommitment,
        candidateId: candidateId.toString(),
        randomness: randomnessBigInt.toString()
      };

      console.log('⏳ Generating zk-SNARK proof... (this may take 2-5 seconds)');

      // Générer la preuve avec snarkjs.groth16.fullProve()
      const { proof, publicSignals } = await groth16.fullProve(
        circuitInputs,
        VALID_VOTE_WASM,
        VALID_VOTE_ZKEY
      );

      console.log('✅ Real vote proof generated successfully!');
      console.log('📦 Proof:', {
        pi_a_length: proof.pi_a.length,
        pi_b_length: proof.pi_b.length,
        pi_c_length: proof.pi_c.length
      });

      // Convertir la preuve au format attendu par le backend
      const zkProof: ZKProof = {
        pi_a: proof.pi_a.slice(0, 3), // Take first 3 elements
        pi_b: proof.pi_b.slice(0, 3).map((arr: any) => arr.slice(0, 2)), // 3x2 matrix
        pi_c: proof.pi_c.slice(0, 3), // Take first 3 elements
        protocol: proof.protocol || 'groth16',
        curve: proof.curve || 'bn128'
      };

      const votePublicSignals: VotePublicSignals = [
        publicSignals[0], // electionId
        publicSignals[1], // numCandidates
        publicSignals[2]  // voteCommitment
      ];

      return { proof: zkProof, publicSignals: votePublicSignals };
    } catch (error: any) {
      console.error('❌ Error generating vote proof:', error);
      throw new Error(`Failed to generate vote proof: ${error.message}`);
    }
  }

  /**
   * Vérifie une preuve de vote auprès du backend
   *
   * @param proof - Preuve zk-SNARK
   * @param publicSignals - Signaux publics
   * @returns Réponse de vérification avec signature backend
   */
  async verifyVoteProof(
    proof: ZKProof,
    publicSignals: VotePublicSignals
  ): Promise<VerificationResponse> {
    try {
      console.log('📡 Sending vote proof to backend for verification...');

      const response = await axios.post(
        `${this.backendUrl}/api/zk/verify-vote`,
        {
          proof,
          publicSignals
        },
        {
          timeout: 30000 // 30 secondes
        }
      );

      console.log('✅ Backend verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Backend verification failed:', error);

      if (error.response) {
        throw new Error(
          `Verification failed: ${error.response.data.error || error.message}`
        );
      }

      throw new Error(`Backend communication error: ${error.message}`);
    }
  }

  /**
   * Génère une preuve d'éligibilité (version MOCK pour POC)
   *
   * @param electionId - ID de l'élection
   * @param merkleRoot - Racine de l'arbre de Merkle des électeurs
   * @param secret - Secret de l'électeur
   * @returns Preuve et signaux publics
   */
  async generateEligibilityProof(
    electionId: number,
    merkleRoot: string,
    secret: string
  ): Promise<{
    proof: ZKProof;
    publicSignals: EligibilityPublicSignals;
  }> {
    console.log('🔨 Generating eligibility proof (MOCK)...');

    // Générer le nullifier
    const nullifier = this.generateNullifier(electionId, secret);

    // POC: Preuve mock
    const mockProof: ZKProof = {
      pi_a: [
        '0x' + randomBytes(32).toString('hex'),
        '0x' + randomBytes(32).toString('hex'),
        '0x' + randomBytes(32).toString('hex')
      ],
      pi_b: [
        [
          '0x' + randomBytes(32).toString('hex'),
          '0x' + randomBytes(32).toString('hex')
        ],
        [
          '0x' + randomBytes(32).toString('hex'),
          '0x' + randomBytes(32).toString('hex')
        ],
        [
          '0x' + randomBytes(32).toString('hex'),
          '0x' + randomBytes(32).toString('hex')
        ]
      ],
      pi_c: [
        '0x' + randomBytes(32).toString('hex'),
        '0x' + randomBytes(32).toString('hex'),
        '0x' + randomBytes(32).toString('hex')
      ],
      protocol: 'groth16',
      curve: 'bn128'
    };

    const publicSignals: EligibilityPublicSignals = [
      merkleRoot,
      nullifier,
      electionId.toString()
    ];

    console.log('✅ Eligibility proof generated (MOCK)');
    return { proof: mockProof, publicSignals };
  }

  /**
   * Vérifie une preuve d'éligibilité auprès du backend
   */
  async verifyEligibilityProof(
    proof: ZKProof,
    publicSignals: EligibilityPublicSignals
  ): Promise<VerificationResponse> {
    try {
      console.log('📡 Sending eligibility proof to backend...');

      const response = await axios.post(
        `${this.backendUrl}/api/zk/verify-eligibility`,
        {
          proof,
          publicSignals
        },
        {
          timeout: 30000
        }
      );

      console.log('✅ Backend verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Backend verification failed:', error);
      throw new Error(
        `Verification failed: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Flux complet de vote privé zk-SNARK
   *
   * @param electionId - ID de l'élection
   * @param candidateId - ID du candidat
   * @param numCandidates - Nombre total de candidats
   * @param voterSecret - Secret de l'électeur (identityNullifier) ou généré automatiquement
   * @returns Données pour soumettre la transaction blockchain
   */
  async preparePrivateVote(
    electionId: number,
    candidateId: number,
    numCandidates: number,
    voterSecret?: string
  ): Promise<PrivateVoteData> {
    console.log('🚀 Starting private vote preparation...');
    console.log('📊 Vote parameters:', {
      electionId,
      candidateId,
      numCandidates
    });

    // 1. Générer ou utiliser le secret de l'électeur (identityNullifier)
    const identityNullifier = voterSecret || this.generateVoterSecret();
    console.log('🔑 Using voter identityNullifier');

    // 2. Générer un randomness aléatoire pour le commitment
    const randomness = randomBytes(32).toString('hex');
    console.log('🎲 Generated randomness for vote commitment');

    // 3. Générer la preuve de vote
    console.log('⏳ Step 1/3: Generating vote proof with Groth16...');
    const { proof: voteProof, publicSignals: voteSignals } =
      await this.generateVoteProof(
        electionId,
        candidateId,
        numCandidates,
        randomness
      );

    // 4. Vérifier la preuve auprès du backend
    console.log('⏳ Step 2/3: Verifying proof with backend...');
    const verificationResult = await this.verifyVoteProof(
      voteProof,
      voteSignals
    );

    if (!verificationResult.verified) {
      throw new Error('Proof verification failed');
    }

    // 5. Générer le nullifier
    console.log('⏳ Step 3/3: Generating nullifier...');
    const nullifier = await this.generateNullifier(electionId, identityNullifier);

    // 6. Préparer les données pour la transaction
    const privateVoteData: PrivateVoteData = {
      electionId,
      voteCommitment: verificationResult.voteInfo!.voteCommitment,
      nullifier,
      backendSignature: verificationResult.signature
    };

    console.log('✅ Private vote prepared successfully!');
    console.log('📦 Vote data:', {
      electionId: privateVoteData.electionId,
      voteCommitment: privateVoteData.voteCommitment.substring(0, 16) + '...',
      nullifier: privateVoteData.nullifier.substring(0, 16) + '...',
      signatureLength: privateVoteData.backendSignature.length
    });

    return privateVoteData;
  }

  /**
   * Sauvegarde le secret de l'électeur dans le localStorage
   * ATTENTION: En production, utiliser un stockage plus sécurisé
   *
   * @param secret - Le secret à sauvegarder
   * @param walletAddress - L'adresse du wallet (optionnel, pour multi-wallet)
   */
  saveVoterSecret(secret: string, walletAddress?: string): void {
    try {
      const key = walletAddress
        ? `democratix_voter_secret_${walletAddress}`
        : 'democratix_voter_secret';
      localStorage.setItem(key, secret);
      console.log('💾 Voter secret saved to localStorage', { walletAddress: walletAddress?.substring(0, 10) + '...' });
    } catch (error) {
      console.error('❌ Failed to save voter secret:', error);
    }
  }

  /**
   * Récupère le secret de l'électeur depuis le localStorage
   *
   * @param walletAddress - L'adresse du wallet (optionnel, pour multi-wallet)
   */
  loadVoterSecret(walletAddress?: string): string | null {
    try {
      const key = walletAddress
        ? `democratix_voter_secret_${walletAddress}`
        : 'democratix_voter_secret';
      const secret = localStorage.getItem(key);
      if (secret) {
        console.log('📂 Voter secret loaded from localStorage', { walletAddress: walletAddress?.substring(0, 10) + '...' });
      }
      return secret;
    } catch (error) {
      console.error('❌ Failed to load voter secret:', error);
      return null;
    }
  }

  /**
   * Supprime le secret de l'électeur du localStorage
   *
   * @param walletAddress - L'adresse du wallet (optionnel, pour multi-wallet)
   */
  clearVoterSecret(walletAddress?: string): void {
    try {
      const key = walletAddress
        ? `democratix_voter_secret_${walletAddress}`
        : 'democratix_voter_secret';
      localStorage.removeItem(key);
      console.log('🗑️ Voter secret cleared from localStorage', { walletAddress: walletAddress?.substring(0, 10) + '...' });
    } catch (error) {
      console.error('❌ Failed to clear voter secret:', error);
    }
  }
}

// Export de l'instance singleton
export const zkProofService = new ZKProofService();
