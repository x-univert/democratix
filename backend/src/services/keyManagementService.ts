/**
 * KeyManagementService - Gestion sécurisée des clés privées ElGamal
 *
 * Ce service gère le stockage chiffré des clés privées d'élection.
 * Les clés sont chiffrées avec AES-256-GCM avant stockage.
 *
 * PRODUCTION: Utiliser un HSM (Hardware Security Module) ou AWS KMS
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const scryptAsync = promisify(scrypt);

// Algorithme de chiffrement
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

// Répertoire de stockage des clés (à sécuriser en production)
const KEYS_DIR = path.join(process.cwd(), '.secure-keys');

export interface EncryptedKeyData {
  encryptedKey: string; // Clé privée chiffrée (hex)
  iv: string; // Vecteur d'initialisation (hex)
  authTag: string; // Tag d'authentification (hex)
  salt: string; // Salt pour dérivation de clé (hex)
  algorithm: string;
  createdAt: number;
}

export class KeyManagementService {
  private masterPassword: string;

  constructor() {
    // PRODUCTION: Récupérer depuis variable d'environnement sécurisée
    this.masterPassword = process.env.MASTER_KEY_PASSWORD || this.generateSecurePassword();

    if (!process.env.MASTER_KEY_PASSWORD) {
      logger.warn('⚠️  No MASTER_KEY_PASSWORD in env. Using generated password (DEV ONLY)');
      logger.warn(`⚠️  Generated password: ${this.masterPassword}`);
      logger.warn('⚠️  PRODUCTION: Set MASTER_KEY_PASSWORD environment variable!');
    }

    this.ensureKeysDirectory();
  }

  /**
   * Génère un mot de passe sécurisé pour le développement
   * PRODUCTION: Utiliser une vraie variable d'environnement
   */
  private generateSecurePassword(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Assure que le répertoire de clés existe
   */
  private async ensureKeysDirectory(): Promise<void> {
    try {
      await fs.mkdir(KEYS_DIR, { recursive: true, mode: 0o700 });
    } catch (error) {
      logger.error('Failed to create keys directory', { error });
    }
  }

  /**
   * Dérive une clé de chiffrement depuis le mot de passe maître
   */
  private async deriveKey(salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(this.masterPassword, salt, KEY_LENGTH)) as Buffer;
  }

  /**
   * Chiffre une clé privée avec AES-256-GCM
   *
   * @param privateKey - Clé privée en hex
   * @returns Données de clé chiffrée
   */
  async encryptPrivateKey(privateKey: string): Promise<EncryptedKeyData> {
    try {
      // Générer salt et IV aléatoires
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);

      // Dériver la clé de chiffrement
      const key = await this.deriveKey(salt);

      // Créer le cipher
      const cipher = createCipheriv(ALGORITHM, key, iv);

      // Chiffrer la clé privée
      const encrypted = Buffer.concat([
        cipher.update(privateKey, 'hex'),
        cipher.final()
      ]);

      // Obtenir le tag d'authentification
      const authTag = cipher.getAuthTag();

      logger.info('✅ Private key encrypted successfully');

      return {
        encryptedKey: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: ALGORITHM,
        createdAt: Date.now()
      };
    } catch (error) {
      logger.error('❌ Failed to encrypt private key', { error });
      throw new Error('Failed to encrypt private key');
    }
  }

  /**
   * Déchiffre une clé privée avec AES-256-GCM
   *
   * @param encryptedData - Données de clé chiffrée
   * @returns Clé privée en hex
   */
  async decryptPrivateKey(encryptedData: EncryptedKeyData): Promise<string> {
    try {
      // Convertir depuis hex
      const encryptedKey = Buffer.from(encryptedData.encryptedKey, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      const salt = Buffer.from(encryptedData.salt, 'hex');

      // Dériver la clé de chiffrement
      const key = await this.deriveKey(salt);

      // Créer le decipher
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Déchiffrer
      const decrypted = Buffer.concat([
        decipher.update(encryptedKey),
        decipher.final()
      ]);

      logger.debug('✅ Private key decrypted successfully');

      return decrypted.toString('hex');
    } catch (error) {
      logger.error('❌ Failed to decrypt private key', { error });
      throw new Error('Failed to decrypt private key (invalid password or corrupted data)');
    }
  }

  /**
   * Stocke une clé privée chiffrée sur disque
   *
   * @param electionId - ID de l'élection
   * @param encryptedData - Données de clé chiffrée
   */
  async storeEncryptedKey(electionId: number, encryptedData: EncryptedKeyData): Promise<void> {
    try {
      const filePath = path.join(KEYS_DIR, `election-${electionId}-key.json`);
      await fs.writeFile(filePath, JSON.stringify(encryptedData, null, 2), {
        mode: 0o600 // Lecture/écriture propriétaire uniquement
      });

      logger.info('✅ Encrypted private key stored', {
        electionId,
        filePath: filePath.substring(filePath.length - 30)
      });
    } catch (error) {
      logger.error('❌ Failed to store encrypted key', { error, electionId });
      throw new Error('Failed to store encrypted key');
    }
  }

  /**
   * Récupère une clé privée chiffrée depuis le disque
   *
   * @param electionId - ID de l'élection
   * @returns Données de clé chiffrée
   */
  async retrieveEncryptedKey(electionId: number): Promise<EncryptedKeyData | null> {
    try {
      const filePath = path.join(KEYS_DIR, `election-${electionId}-key.json`);
      const data = await fs.readFile(filePath, 'utf-8');

      logger.debug('✅ Encrypted key retrieved', { electionId });

      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.warn('No encrypted key found for election', { electionId });
        return null;
      }
      logger.error('❌ Failed to retrieve encrypted key', { error, electionId });
      throw new Error('Failed to retrieve encrypted key');
    }
  }

  /**
   * Stocke et chiffre une clé privée
   *
   * @param electionId - ID de l'élection
   * @param privateKey - Clé privée en hex
   */
  async securelyStorePrivateKey(electionId: number, privateKey: string): Promise<void> {
    const encryptedData = await this.encryptPrivateKey(privateKey);
    await this.storeEncryptedKey(electionId, encryptedData);
  }

  /**
   * Récupère et déchiffre une clé privée
   *
   * @param electionId - ID de l'élection
   * @returns Clé privée en hex
   */
  async securelyRetrievePrivateKey(electionId: number): Promise<string | null> {
    const encryptedData = await this.retrieveEncryptedKey(electionId);
    if (!encryptedData) {
      return null;
    }
    return await this.decryptPrivateKey(encryptedData);
  }

  /**
   * Supprime une clé privée stockée (après déchiffrement final)
   *
   * @param electionId - ID de l'élection
   */
  async deletePrivateKey(electionId: number): Promise<void> {
    try {
      const filePath = path.join(KEYS_DIR, `election-${electionId}-key.json`);
      await fs.unlink(filePath);

      logger.info('✅ Private key deleted', { electionId });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.warn('No key to delete', { electionId });
        return;
      }
      logger.error('❌ Failed to delete private key', { error, electionId });
      throw new Error('Failed to delete private key');
    }
  }

  /**
   * Vérifie qu'une clé privée existe pour une élection
   *
   * @param electionId - ID de l'élection
   * @returns true si la clé existe
   */
  async hasPrivateKey(electionId: number): Promise<boolean> {
    const encryptedData = await this.retrieveEncryptedKey(electionId);
    return encryptedData !== null;
  }

  /**
   * Liste toutes les élections avec clés stockées
   *
   * @returns Liste des IDs d'élections
   */
  async listElectionsWithKeys(): Promise<number[]> {
    try {
      const files = await fs.readdir(KEYS_DIR);
      const electionIds: number[] = [];

      for (const file of files) {
        const match = file.match(/^election-(\d+)-key\.json$/);
        if (match) {
          electionIds.push(parseInt(match[1]));
        }
      }

      return electionIds;
    } catch (error) {
      logger.error('❌ Failed to list elections with keys', { error });
      return [];
    }
  }

  /**
   * Test de chiffrement/déchiffrement
   * Utilisé pour validation
   */
  async testEncryption(): Promise<boolean> {
    try {
      logger.info('🧪 Testing key encryption/decryption...');

      const testKey = 'a'.repeat(64); // 64 hex chars = 32 bytes

      // Chiffrer
      const encrypted = await this.encryptPrivateKey(testKey);

      // Déchiffrer
      const decrypted = await this.decryptPrivateKey(encrypted);

      // Vérifier
      if (decrypted !== testKey) {
        logger.error('❌ Encryption test failed: decrypted key does not match');
        return false;
      }

      logger.info('✅ Key encryption test passed!');
      return true;
    } catch (error) {
      logger.error('❌ Key encryption test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const keyManagementService = new KeyManagementService();
