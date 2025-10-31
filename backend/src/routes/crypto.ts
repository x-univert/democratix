/**
 * Routes Crypto - Endpoints pour le CryptoService
 *
 * Base path: /api/crypto
 */

import express from 'express';
import {
  generateIdentity,
  registerVoter,
  generateProof,
  verifyProof,
  generateNullifier,
  generateToken,
  blindToken,
  signBlindedToken,
  unblindSignature,
  verifyToken,
  getStats,
  getMerkleRoot
} from '../controllers/cryptoController';

const router = express.Router();

// ==========================================
// IDENTITY & MERKLE TREE ROUTES
// ==========================================

/**
 * POST /api/crypto/identity
 * Génère une nouvelle identité d'électeur
 *
 * Body: { seed?: string }
 * Response: { nullifier, trapdoor, commitment }
 */
router.post('/identity', generateIdentity);

/**
 * POST /api/crypto/register
 * Enregistre un électeur dans le Merkle tree
 *
 * Body: { commitment: string (hex) }
 * Response: { index, root, totalVoters }
 */
router.post('/register', registerVoter);

/**
 * POST /api/crypto/proof
 * Génère une preuve Merkle pour un électeur
 *
 * Body: { commitment: string (hex) }
 * Response: { root, pathIndices, siblings, leaf }
 */
router.post('/proof', generateProof);

/**
 * POST /api/crypto/verify-proof
 * Vérifie une preuve Merkle
 *
 * Body: { root, pathIndices, siblings, leaf }
 * Response: { valid: boolean }
 */
router.post('/verify-proof', verifyProof);

/**
 * POST /api/crypto/nullifier
 * Génère un nullifier pour une élection
 *
 * Body: { identityNullifier: string (hex), electionId: number }
 * Response: { nullifier, electionId }
 */
router.post('/nullifier', generateNullifier);

// ==========================================
// BLIND SIGNATURE ROUTES
// ==========================================

/**
 * POST /api/crypto/token
 * Génère un token de vote aléatoire
 *
 * Body: {}
 * Response: { token }
 */
router.post('/token', generateToken);

/**
 * POST /api/crypto/blind-token
 * Aveugle un token de vote
 *
 * Body: { token: string (hex), blindingFactor?: string (hex) }
 * Response: { blindedToken }
 */
router.post('/blind-token', blindToken);

/**
 * POST /api/crypto/sign-token
 * Signe un token aveuglé (autorité)
 *
 * Body: { blindedToken: string (hex) }
 * Response: { signature }
 */
router.post('/sign-token', signBlindedToken);

/**
 * POST /api/crypto/unblind-signature
 * Dé-aveugle une signature
 *
 * Body: { blindedSignature: string, blindingFactor: string (hex) }
 * Response: { unblindedSignature }
 */
router.post('/unblind-signature', unblindSignature);

/**
 * POST /api/crypto/verify-token
 * Vérifie une signature de token
 *
 * Body: { token: string (hex), signature: string }
 * Response: { valid: boolean }
 */
router.post('/verify-token', verifyToken);

// ==========================================
// STATS & INFO ROUTES
// ==========================================

/**
 * GET /api/crypto/stats
 * Obtient des statistiques sur le système crypto
 *
 * Response: { merkleTree: {...}, blindSignature: {...} }
 */
router.get('/stats', getStats);

/**
 * GET /api/crypto/root
 * Obtient le root actuel du Merkle tree
 *
 * Response: { root, voterCount }
 */
router.get('/root', getMerkleRoot);

export default router;
