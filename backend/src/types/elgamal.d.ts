/**
 * Types pour le chiffrement ElGamal des votes privés
 */

/**
 * Paire de clés ElGamal pour une élection
 */
export interface ElGamalKeyPair {
  /** Clé publique (hex string) - Publiée pour que les électeurs chiffrent */
  publicKey: string;
  /** Clé privée (hex string) - Gardée secrète par l'organisateur */
  privateKey: string;
}

/**
 * Vote chiffré avec ElGamal
 */
export interface ElGamalCiphertext {
  /** Composante 1 du chiffré : c1 = r × G (hex string) */
  c1: string;
  /** Composante 2 du chiffré : c2 = r × pk + m × G (hex string) */
  c2: string;
}

/**
 * Résultats agrégés après déchiffrement
 */
export interface DecryptedResults {
  /** Map candidateId → nombre de votes */
  results: Record<number, number>;
  /** Nombre total de votes déchiffrés */
  totalVotes: number;
  /** Timestamp du déchiffrement */
  decryptedAt: number;
}

/**
 * Métadonnées de clé pour une élection
 */
export interface ElectionKeyMetadata {
  /** ID de l'élection */
  electionId: number;
  /** Clé publique */
  publicKey: string;
  /** Hash de la clé privée (pour vérification intégrité) */
  privateKeyHash: string;
  /** Timestamp de création */
  createdAt: number;
  /** Statut de la clé */
  status: 'active' | 'used' | 'revoked';
}
