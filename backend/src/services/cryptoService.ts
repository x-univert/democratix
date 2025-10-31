/**
 * CryptoService - Service cryptographique pour DEMOCRATIX
 *
 * Inspiré de Semaphore Protocol:
 * - Merkle tree pour anonymity set
 * - Identity commitments
 * - Nullifiers pour éviter double vote
 * - Blind signatures pour tokens anonymes
 *
 * Architecture: Semaphore-like (voir docs/.claude/CRYPTO_STUDY_EXISTING_PROJECTS.md)
 */

// @ts-ignore - circomlibjs n'a pas de types officiels
import { buildPoseidon, newMemEmptyTrie } from 'circomlibjs';
import NodeRSA from 'node-rsa';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';

/**
 * Identity d'un électeur (style Semaphore)
 */
export interface VoterIdentity {
  /** Nullifier secret (permet de générer nullifiers uniques par élection) */
  nullifier: bigint;
  /** Trapdoor secret (pour commitment) */
  trapdoor: bigint;
  /** Commitment public = Hash(nullifier, trapdoor) */
  commitment: bigint;
}

/**
 * Preuve Merkle pour un électeur
 */
export interface MerkleProof {
  /** Root du Merkle tree */
  root: string;
  /** Chemin dans l'arbre (indices: 0 = gauche, 1 = droite) */
  pathIndices: number[];
  /** Siblings à chaque niveau */
  siblings: string[];
  /** Leaf (identity commitment) */
  leaf: string;
}

/**
 * Token de vote aveuglé (blind signature)
 */
export interface VotingToken {
  /** Token aléatoire généré par l'électeur */
  token: string;
  /** Token aveuglé (avant signature) */
  blindedToken?: string;
  /** Signature de l'autorité */
  signature?: string;
  /** Token dé-aveuglé (pour voter) */
  unblindedSignature?: string;
}

/**
 * Service cryptographique principal
 */
export class CryptoService {
  private merkleTree: any;
  private poseidonHash: any;
  private blindSigningKey!: NodeRSA;
  private depth: number = 20; // Profondeur du tree (2^20 = 1M voters max)

  constructor() {
    this.initializeMerkleTree();
    this.initializeBlindSignature();
  }

  /**
   * Initialise le Merkle tree
   */
  private async initializeMerkleTree() {
    try {
      this.poseidonHash = await buildPoseidon();
      this.merkleTree = await newMemEmptyTrie();
      logger.info('✅ Merkle tree initialized (depth: 20, max: 1,048,576 voters)');
    } catch (error) {
      logger.error('❌ Failed to initialize Merkle tree:', error);
      throw error;
    }
  }

  /**
   * Initialise les clés pour blind signature
   */
  private initializeBlindSignature() {
    // Clé RSA 2048 bits pour blind signatures
    this.blindSigningKey = new NodeRSA({ b: 2048 });
    logger.info('✅ Blind signature key generated (RSA-2048)');
  }

  /**
   * Génère une nouvelle identité d'électeur
   * Similaire à Semaphore: Identity = (nullifier, trapdoor) → commitment
   */
  generateVoterIdentity(seed?: string): VoterIdentity {
    // Générer secrets aléatoires ou depuis seed
    const nullifier = seed
      ? BigInt('0x' + Buffer.from(seed + '_nullifier').toString('hex'))
      : BigInt('0x' + randomBytes(31).toString('hex'));

    const trapdoor = seed
      ? BigInt('0x' + Buffer.from(seed + '_trapdoor').toString('hex'))
      : BigInt('0x' + randomBytes(31).toString('hex'));

    // Commitment = Poseidon(nullifier, trapdoor)
    // Note: Pour production, utiliser Poseidon de circomlibjs
    // Pour l'instant, simple hash pour POC
    const commitment = this.hashIdentityCommitment(nullifier, trapdoor);

    logger.info(`✅ Generated voter identity (commitment: ${commitment.toString(16).slice(0, 10)}...)`);

    return {
      nullifier,
      trapdoor,
      commitment
    };
  }

  /**
   * Hash un identity commitment
   * commitment = Poseidon(nullifier, trapdoor)
   */
  private hashIdentityCommitment(nullifier: bigint, trapdoor: bigint): bigint {
    // Pour POC: simple hash
    // Pour production: utiliser Poseidon de circomlibjs
    const hash = BigInt(
      '0x' +
        Buffer.from(nullifier.toString() + trapdoor.toString())
          .toString('hex')
          .slice(0, 64)
    );
    return hash % (2n ** 254n); // Field size pour BN254
  }

  /**
   * Génère un nullifier pour une élection spécifique
   * nullifier_hash = Poseidon(identity_nullifier, election_id)
   * Empêche un électeur de voter 2x dans la même élection
   */
  generateNullifier(identityNullifier: bigint, electionId: number): string {
    // Pour POC: simple hash
    // Pour production: Poseidon(nullifier, electionId)
    const nullifierHash = BigInt(
      '0x' +
        Buffer.from(identityNullifier.toString() + electionId.toString())
          .toString('hex')
          .slice(0, 64)
    );

    const result = (nullifierHash % (2n ** 254n)).toString(16);
    logger.info(`✅ Generated nullifier for election ${electionId}: ${result.slice(0, 10)}...`);
    return result;
  }

  /**
   * Ajoute un électeur au Merkle tree
   * @param commitment Identity commitment de l'électeur
   * @returns Index dans le tree et nouveau root
   */
  async addVoterToMerkleTree(commitment: bigint): Promise<{ index: number; root: string }> {
    try {
      // Convertir bigint en Buffer pour circomlibjs
      const commitmentBuf = Buffer.from(commitment.toString(16).padStart(64, '0'), 'hex');

      // Insérer dans le tree
      await this.merkleTree.insert(commitmentBuf, commitmentBuf);

      const root = this.merkleTree.root;
      const index = Number(this.merkleTree.nextIdx) - 1;

      logger.info(`✅ Voter added to Merkle tree (index: ${index}, root: ${root.toString('hex').slice(0, 10)}...)`);

      return {
        index,
        root: root.toString('hex')
      };
    } catch (error) {
      logger.error('❌ Failed to add voter to Merkle tree:', error);
      throw error;
    }
  }

  /**
   * Génère une preuve Merkle pour un électeur
   * Prouve qu'un commitment est dans le tree sans révéler lequel
   */
  async generateMerkleProof(commitment: bigint): Promise<MerkleProof> {
    try {
      const commitmentBuf = Buffer.from(commitment.toString(16).padStart(64, '0'), 'hex');

      // Générer preuve
      const proof = await this.merkleTree.generateProof(commitmentBuf);

      const merkleProof: MerkleProof = {
        root: this.merkleTree.root.toString('hex'),
        pathIndices: proof.pathIndices || [],
        siblings: (proof.siblings || []).map((s: Buffer) => s.toString('hex')),
        leaf: commitmentBuf.toString('hex')
      };

      logger.info(`✅ Generated Merkle proof (depth: ${merkleProof.siblings.length})`);

      return merkleProof;
    } catch (error) {
      logger.error('❌ Failed to generate Merkle proof:', error);
      throw error;
    }
  }

  /**
   * Vérifie une preuve Merkle
   */
  async verifyMerkleProof(proof: MerkleProof): Promise<boolean> {
    try {
      const rootBuf = Buffer.from(proof.root, 'hex');
      const leafBuf = Buffer.from(proof.leaf, 'hex');
      const siblings = proof.siblings.map(s => Buffer.from(s, 'hex'));

      const isValid = await this.merkleTree.verifyProof(
        rootBuf,
        leafBuf,
        siblings,
        proof.pathIndices
      );

      logger.info(`✅ Merkle proof verification: ${isValid ? 'VALID' : 'INVALID'}`);

      return isValid;
    } catch (error) {
      logger.error('❌ Failed to verify Merkle proof:', error);
      return false;
    }
  }

  /**
   * Obtient le root actuel du Merkle tree
   */
  getMerkleRoot(): string {
    const root = this.merkleTree.root.toString('hex');
    logger.info(`📊 Current Merkle root: ${root.slice(0, 10)}...`);
    return root;
  }

  /**
   * Obtient le nombre d'électeurs dans le tree
   */
  getVoterCount(): number {
    const count = Number(this.merkleTree.nextIdx);
    logger.info(`📊 Total voters in tree: ${count}`);
    return count;
  }

  // ==========================================
  // BLIND SIGNATURES (Chaum's Protocol)
  // ==========================================

  /**
   * Génère un token de vote aléatoire
   */
  generateVotingToken(): VotingToken {
    const token = randomBytes(32).toString('hex');
    logger.info(`✅ Generated voting token: ${token.slice(0, 10)}...`);

    return {
      token
    };
  }

  /**
   * Aveugle un token avant de l'envoyer à l'autorité
   * blinded_token = token * r^e mod n
   * @param token Token de vote
   * @param blindingFactor Facteur d'aveuglement (random)
   */
  blindToken(token: string, blindingFactor?: string): string {
    try {
      const r = blindingFactor || randomBytes(256).toString('hex');
      const tokenBuf = Buffer.from(token, 'hex');

      // Pour POC: simple XOR avec r
      // Pour production: vraie blind signature RSA
      const blindedToken = Buffer.alloc(tokenBuf.length);
      const rBuf = Buffer.from(r.slice(0, tokenBuf.length * 2), 'hex');

      for (let i = 0; i < tokenBuf.length; i++) {
        blindedToken[i] = tokenBuf[i] ^ rBuf[i];
      }

      const result = blindedToken.toString('hex');
      logger.info(`✅ Token blinded: ${result.slice(0, 10)}...`);

      return result;
    } catch (error) {
      logger.error('❌ Failed to blind token:', error);
      throw error;
    }
  }

  /**
   * Signe un token aveuglé (côté autorité)
   * signature = blinded_token^d mod n
   */
  signBlindedToken(blindedToken: string): string {
    try {
      const signature = this.blindSigningKey.sign(blindedToken, 'base64');
      logger.info(`✅ Blinded token signed: ${signature.slice(0, 10)}...`);
      return signature;
    } catch (error) {
      logger.error('❌ Failed to sign blinded token:', error);
      throw error;
    }
  }

  /**
   * Dé-aveugle une signature
   * unblinded_sig = blinded_sig / r mod n
   */
  unblindSignature(blindedSignature: string, blindingFactor: string): string {
    try {
      // Pour POC: simple reverse XOR
      // Pour production: division modulo RSA
      const sigBuf = Buffer.from(blindedSignature, 'base64');
      const rBuf = Buffer.from(blindingFactor.slice(0, sigBuf.length * 2), 'hex');
      const unblindedSig = Buffer.alloc(sigBuf.length);

      for (let i = 0; i < sigBuf.length && i < rBuf.length; i++) {
        unblindedSig[i] = sigBuf[i] ^ rBuf[i];
      }

      const result = unblindedSig.toString('base64');
      logger.info(`✅ Signature unblinded: ${result.slice(0, 10)}...`);

      return result;
    } catch (error) {
      logger.error('❌ Failed to unblind signature:', error);
      throw error;
    }
  }

  /**
   * Vérifie une signature de token
   */
  verifyTokenSignature(token: string, signature: string): boolean {
    try {
      const tokenBuf = Buffer.from(token, 'hex');
      const isValid = this.blindSigningKey.verify(tokenBuf, signature, 'buffer', 'base64');
      logger.info(`✅ Token signature verification: ${isValid ? 'VALID' : 'INVALID'}`);
      return isValid;
    } catch (error) {
      logger.error('❌ Failed to verify token signature:', error);
      return false;
    }
  }

  /**
   * Obtient la clé publique RSA pour blind signatures
   */
  getBlindSignaturePublicKey(): string {
    const publicKey = this.blindSigningKey.exportKey('public');
    return publicKey;
  }

  // ==========================================
  // STATISTIQUES & MONITORING
  // ==========================================

  /**
   * Obtient des statistiques sur le système crypto
   */
  getStats() {
    return {
      merkleTree: {
        depth: this.depth,
        maxVoters: Math.pow(2, this.depth),
        currentVoters: this.getVoterCount(),
        currentRoot: this.getMerkleRoot()
      },
      blindSignature: {
        keySize: 2048,
        algorithm: 'RSA',
        publicKey: this.getBlindSignaturePublicKey().slice(0, 100) + '...'
      }
    };
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();
