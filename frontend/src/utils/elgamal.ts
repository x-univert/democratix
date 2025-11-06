/**
 * Utilitaires de chiffrement ElGamal pour le frontend
 * Option 1 : ElGamal seul (sans zk-SNARK)
 */

import { secp256k1 } from '@noble/curves/secp256k1';

/**
 * Vote chiffré avec ElGamal
 */
export interface ElGamalCiphertext {
  /** Composante 1 : c1 = r × G */
  c1: string;
  /** Composante 2 : c2 = r × pk + m × G */
  c2: string;
}

/**
 * Chiffre un candidateId avec ElGamal
 *
 * @param candidateId - ID du candidat à chiffrer
 * @param publicKey - Clé publique de l'élection (hex)
 * @returns Vote chiffré {c1, c2}
 */
export const encryptVote = (
  candidateId: number,
  publicKey: string
): ElGamalCiphertext => {
  try {
    console.log('🔐 encryptVote called with:', {
      candidateId,
      publicKey,
      publicKeyLength: publicKey.length,
      publicKeyType: typeof publicKey
    });

    const G = secp256k1.ProjectivePoint.BASE;

    // Validate and parse public key
    console.log('🔑 Parsing public key...');
    const pk = secp256k1.ProjectivePoint.fromHex(publicKey);
    console.log('✅ Public key parsed successfully');

    // Générer r aléatoire avec secp256k1.utils.randomPrivateKey()
    // Cette fonction garantit 0 < r < curve_order (n)
    const randomPrivateKey = secp256k1.utils.randomPrivateKey();
    const r = BigInt('0x' + Array.from(randomPrivateKey).map(b => b.toString(16).padStart(2, '0')).join(''));

    // c1 = r × G
    const c1Point = G.multiply(r);
    const c1 = c1Point.toHex(true);

    // c2 = r × pk + (candidateId + 1) × G
    // Note: We add 1 to candidateId to avoid multiplication by 0 (invalid in secp256k1)
    // The smart contract will subtract 1 during decryption
    const encodedCandidateId = BigInt(candidateId + 1);
    const c2Point = pk.multiply(r).add(G.multiply(encodedCandidateId));
    const c2 = c2Point.toHex(true);

    console.log('✅ Vote encrypted (ElGamal)', {
      candidateId,
      c1: c1.slice(0, 10) + '...',
      c2: c2.slice(0, 10) + '...'
    });

    return { c1, c2 };
  } catch (error) {
    console.error('❌ Failed to encrypt vote:', error);
    throw new Error('Failed to encrypt vote with ElGamal');
  }
};

/**
 * Vérifie si une clé publique est valide
 *
 * @param publicKey - Clé publique (hex)
 * @returns true si valide
 */
export const isValidPublicKey = (publicKey: string): boolean => {
  try {
    secp256k1.ProjectivePoint.fromHex(publicKey);
    return true;
  } catch {
    return false;
  }
};
