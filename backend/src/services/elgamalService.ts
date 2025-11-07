/**
 * ElGamalService - Service de chiffrement ElGamal pour votes privés
 *
 * Implémente le chiffrement ElGamal sur courbe elliptique secp256k1
 * pour permettre le comptage des votes privés tout en maintenant l'anonymat.
 *
 * Architecture Option 1 : ElGamal seul (sans zk-SNARK)
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';
import type {
  ElGamalKeyPair,
  ElGamalCiphertext,
  DecryptedResults,
  ElectionKeyMetadata
} from '../types/elgamal';

export class ElGamalService {
  /**
   * Génère une paire de clés ElGamal pour une élection
   *
   * @returns {publicKey, privateKey} - Clés en format hex
   */
  generateKeys(): ElGamalKeyPair {
    try {
      // Générer clé privée avec secp256k1.utils.randomPrivateKey()
      // Cela garantit que la clé est < curve order (n)
      const privateKeyBytes = secp256k1.utils.randomPrivateKey();
      const privateKey = Buffer.from(privateKeyBytes).toString('hex');

      // Calculer clé publique : pk = sk × G
      const privateKeyBigInt = BigInt('0x' + privateKey);
      const publicKeyPoint = secp256k1.ProjectivePoint.BASE.multiply(privateKeyBigInt);

      // Encoder en format compressé (33 bytes)
      const publicKey = publicKeyPoint.toHex(true);

      logger.info('✅ ElGamal keys generated', {
        publicKeyLength: publicKey.length,
        publicKeyPreview: publicKey.slice(0, 10) + '...'
      });

      return { publicKey, privateKey };
    } catch (error) {
      logger.error('❌ Failed to generate ElGamal keys:', error);
      throw new Error('Failed to generate ElGamal keys');
    }
  }

  /**
   * Chiffre un candidateId avec ElGamal
   *
   * @param candidateId - ID du candidat (0 à numCandidates-1)
   * @param publicKey - Clé publique de l'élection (hex)
   * @param randomness - Optionnel: randomness pour tests (hex)
   * @returns {c1, c2} - Vote chiffré
   */
  encrypt(
    candidateId: number,
    publicKey: string,
    randomness?: string
  ): ElGamalCiphertext {
    try {
      const G = secp256k1.ProjectivePoint.BASE;
      const pk = secp256k1.ProjectivePoint.fromHex(publicKey);

      // Générer r aléatoire (ou utiliser celui fourni pour tests)
      const r = randomness
        ? BigInt('0x' + randomness)
        : BigInt('0x' + Buffer.from(randomBytes(32)).toString('hex'));

      // c1 = r × G
      const c1Point = G.multiply(r);
      const c1 = c1Point.toHex(true);

      // c2 = r × pk + (candidateId + 1) × G
      // Note: candidateId is already mapped (-1 → 0, 0 → 1, 1 → 2, etc.)
      // We add 1 to avoid multiplication by 0: mapped 0 → encoded 1, mapped 1 → encoded 2, etc.
      // Decryption will subtract 1 and then reverse the mapping
      const mappedCandidateId = candidateId + 1; // -1 → 0, 0 → 1, etc.
      const encodedCandidateId = BigInt(mappedCandidateId + 1);
      const c2Point = pk.multiply(r).add(G.multiply(encodedCandidateId));
      const c2 = c2Point.toHex(true);

      logger.debug('✅ Vote encrypted', {
        candidateId,
        c1Preview: c1.slice(0, 10) + '...',
        c2Preview: c2.slice(0, 10) + '...'
      });

      return { c1, c2 };
    } catch (error) {
      logger.error('❌ Failed to encrypt vote:', error);
      throw new Error('Failed to encrypt vote');
    }
  }

  /**
   * Déchiffre un vote avec la clé privée
   *
   * @param c1 - Composante 1 du chiffré (hex)
   * @param c2 - Composante 2 du chiffré (hex)
   * @param privateKey - Clé privée de l'élection (hex)
   * @returns candidateId - ID du candidat déchiffré
   */
  decrypt(c1: string, c2: string, privateKey: string): number {
    try {
      const c1Point = secp256k1.ProjectivePoint.fromHex(c1);
      const c2Point = secp256k1.ProjectivePoint.fromHex(c2);

      // Normaliser la clé privée (enlever les espaces, newlines, etc.)
      const normalizedKey = privateKey.replace(/\s+/g, '').toLowerCase();

      // Valider que la clé est un hex valide de 64 caractères
      if (!/^[0-9a-f]{64}$/i.test(normalizedKey)) {
        throw new Error(`Invalid private key format: expected 64 hex characters, got ${normalizedKey.length} characters`);
      }

      const sk = BigInt('0x' + normalizedKey);

      // Valider que la clé est dans la plage valide pour secp256k1
      const CURVE_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
      if (sk <= 0n || sk >= CURVE_ORDER) {
        throw new Error(`Invalid private key: scalar must be > 0 and < curve order. Key value: ${sk.toString(16).substring(0, 16)}...`);
      }

      // m × G = c2 - sk × c1
      const mG = c2Point.subtract(c1Point.multiply(sk));

      // Recherche discrète : trouver m tel que m × G = mG
      // (Brute force, efficace pour m petit : candidateId < 100)
      // Note: We start from 1 because encryption encodes to avoid 0
      const G = secp256k1.ProjectivePoint.BASE;

      for (let m = 1; m <= 200; m++) {
        if (G.multiply(BigInt(m)).equals(mG)) {
          // Reverse the encoding: m = encodedCandidateId
          // encodedCandidateId = mappedCandidateId + 1
          // mappedCandidateId = candidateId + 1
          // So: candidateId = (m - 1) - 1 = m - 2
          const candidateId = m - 2;
          logger.debug('✅ Vote decrypted', { candidateId });
          return candidateId;
        }
      }

      throw new Error('Failed to decrypt: candidateId > 199 or invalid ciphertext');
    } catch (error: any) {
      logger.error('❌ Failed to decrypt vote:', {
        error: error.message,
        c1Length: c1?.length,
        c2Length: c2?.length,
        privateKeyLength: privateKey?.length
      });
      throw error;
    }
  }

  /**
   * Déchiffre tous les votes d'une élection et agrège les résultats
   *
   * @param votes - Liste des votes chiffrés
   * @param privateKey - Clé privée de l'élection
   * @returns Résultats agrégés par candidat
   */
  tallyVotes(
    votes: Array<{ c1: string; c2: string }>,
    privateKey: string
  ): DecryptedResults {
    try {
      const results: Record<number, number> = {};
      let successfulDecryptions = 0;
      let failedDecryptions = 0;

      logger.info(`📊 Starting to decrypt ${votes.length} votes...`);

      for (let i = 0; i < votes.length; i++) {
        try {
          const vote = votes[i];
          const candidateIdCircuit = this.decrypt(vote.c1, vote.c2, privateKey);

          // Remap du circuit (-1, 0, 1...) vers onChain (1, 2, 3...)
          // Smart contract expects 1-indexed candidate IDs (id > 0)
          const candidateIdOnChain = candidateIdCircuit + 2;

          // Incrémenter le compteur pour ce candidat
          results[candidateIdOnChain] = (results[candidateIdOnChain] || 0) + 1;
          successfulDecryptions++;

          // Log progress tous les 100 votes
          if ((i + 1) % 100 === 0) {
            logger.info(`📊 Progress: ${i + 1}/${votes.length} votes decrypted`);
          }
        } catch (error) {
          failedDecryptions++;
          logger.warn(`⚠️ Failed to decrypt vote #${i}:`, error);
        }
      }

      logger.info('✅ Vote tallying completed', {
        totalVotes: votes.length,
        successfulDecryptions,
        failedDecryptions,
        results
      });

      return {
        results,
        totalVotes: successfulDecryptions,
        decryptedAt: Date.now()
      };
    } catch (error) {
      logger.error('❌ Failed to tally votes:', error);
      throw new Error('Failed to tally votes');
    }
  }

  /**
   * Hash une clé privée pour stockage sécurisé (vérification intégrité)
   *
   * @param privateKey - Clé privée (hex)
   * @returns Hash SHA-256 de la clé (hex)
   */
  hashPrivateKey(privateKey: string): string {
    const hash = sha256(Buffer.from(privateKey, 'hex'));
    return Buffer.from(hash).toString('hex');
  }

  /**
   * Vérifie qu'une clé privée correspond à une clé publique
   *
   * @param publicKey - Clé publique (hex)
   * @param privateKey - Clé privée (hex)
   * @returns true si correspond, false sinon
   */
  verifyKeyPair(publicKey: string, privateKey: string): boolean {
    try {
      const sk = BigInt('0x' + privateKey);
      const computedPk = secp256k1.ProjectivePoint.BASE.multiply(sk);
      const computedPkHex = computedPk.toHex(true);

      return computedPkHex === publicKey;
    } catch (error) {
      logger.error('❌ Failed to verify key pair:', error);
      return false;
    }
  }

  /**
   * Génère des métadonnées pour une clé d'élection
   *
   * @param electionId - ID de l'élection
   * @param keyPair - Paire de clés ElGamal
   * @returns Métadonnées de clé
   */
  generateKeyMetadata(
    electionId: number,
    keyPair: ElGamalKeyPair
  ): ElectionKeyMetadata {
    return {
      electionId,
      publicKey: keyPair.publicKey,
      privateKeyHash: this.hashPrivateKey(keyPair.privateKey),
      createdAt: Date.now(),
      status: 'active'
    };
  }

  /**
   * Test de bout en bout : Chiffrement → Déchiffrement
   * Utilisé pour validation
   */
  testEncryptDecrypt(): boolean {
    try {
      logger.info('🧪 Testing ElGamal encryption/decryption...');

      // 1. Générer clés
      const keys = this.generateKeys();

      // 2. Tester chiffrement/déchiffrement pour plusieurs candidats
      const testCases = [0, 1, 2, 5, 10, 42, 99];

      for (const candidateId of testCases) {
        const encrypted = this.encrypt(candidateId, keys.publicKey);
        const decrypted = this.decrypt(encrypted.c1, encrypted.c2, keys.privateKey);

        if (decrypted !== candidateId) {
          logger.error(`❌ Test failed for candidateId ${candidateId}: got ${decrypted}`);
          return false;
        }
      }

      // 3. Tester tallying
      const testVotes = testCases.map(id => this.encrypt(id, keys.publicKey));
      const results = this.tallyVotes(testVotes, keys.privateKey);

      logger.info('✅ ElGamal test passed!', { results: results.results });
      return true;
    } catch (error) {
      logger.error('❌ ElGamal test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const elgamalService = new ElGamalService();
