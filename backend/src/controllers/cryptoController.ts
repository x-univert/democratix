/**
 * CryptoController - Endpoints API pour le CryptoService
 *
 * Routes:
 * POST /api/crypto/identity - Générer une identité d'électeur
 * POST /api/crypto/register - Enregistrer un électeur dans le Merkle tree
 * POST /api/crypto/proof - Générer une preuve Merkle
 * POST /api/crypto/verify-proof - Vérifier une preuve Merkle
 * POST /api/crypto/nullifier - Générer un nullifier pour une élection
 * POST /api/crypto/token - Générer un token de vote
 * POST /api/crypto/blind-token - Aveugler un token
 * POST /api/crypto/sign-token - Signer un token aveuglé
 * POST /api/crypto/unblind-signature - Dé-aveugler une signature
 * POST /api/crypto/verify-token - Vérifier une signature de token
 * GET /api/crypto/stats - Obtenir des statistiques
 * GET /api/crypto/root - Obtenir le root du Merkle tree
 */

import { Request, Response } from 'express';
import { cryptoService } from '../services/cryptoService';
import { logger } from '../utils/logger';
import { z } from 'zod';

// ==========================================
// SCHEMAS DE VALIDATION
// ==========================================

const GenerateIdentitySchema = z.object({
  seed: z.string().optional()
});

const RegisterVoterSchema = z.object({
  commitment: z.string().regex(/^[0-9a-fA-F]+$/, 'Commitment must be hex')
});

const GenerateProofSchema = z.object({
  commitment: z.string().regex(/^[0-9a-fA-F]+$/, 'Commitment must be hex')
});

const VerifyProofSchema = z.object({
  root: z.string().regex(/^[0-9a-fA-F]+$/, 'Root must be hex'),
  pathIndices: z.array(z.number()),
  siblings: z.array(z.string().regex(/^[0-9a-fA-F]+$/)),
  leaf: z.string().regex(/^[0-9a-fA-F]+$/)
});

const GenerateNullifierSchema = z.object({
  identityNullifier: z.string().regex(/^[0-9a-fA-F]+$/, 'Nullifier must be hex'),
  electionId: z.number().int().positive()
});

const BlindTokenSchema = z.object({
  token: z.string().regex(/^[0-9a-fA-F]+$/, 'Token must be hex'),
  blindingFactor: z.string().regex(/^[0-9a-fA-F]+$/).optional()
});

const SignTokenSchema = z.object({
  blindedToken: z.string().regex(/^[0-9a-fA-F]+$/, 'Blinded token must be hex')
});

const UnblindSignatureSchema = z.object({
  blindedSignature: z.string(),
  blindingFactor: z.string().regex(/^[0-9a-fA-F]+$/, 'Blinding factor must be hex')
});

const VerifyTokenSchema = z.object({
  token: z.string().regex(/^[0-9a-fA-F]+$/, 'Token must be hex'),
  signature: z.string()
});

// ==========================================
// CONTROLLERS
// ==========================================

/**
 * POST /api/crypto/identity
 * Génère une nouvelle identité d'électeur
 */
export const generateIdentity = async (req: Request, res: Response) => {
  try {
    const { seed } = GenerateIdentitySchema.parse(req.body);

    const identity = cryptoService.generateVoterIdentity(seed);

    res.json({
      success: true,
      data: {
        nullifier: identity.nullifier.toString(16),
        trapdoor: identity.trapdoor.toString(16),
        commitment: identity.commitment.toString(16)
      }
    });
  } catch (error: any) {
    logger.error('Error generating identity:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate identity'
    });
  }
};

/**
 * POST /api/crypto/register
 * Enregistre un électeur dans le Merkle tree
 */
export const registerVoter = async (req: Request, res: Response) => {
  try {
    const { commitment } = RegisterVoterSchema.parse(req.body);

    const commitmentBigInt = BigInt('0x' + commitment);
    const result = await cryptoService.addVoterToMerkleTree(commitmentBigInt);

    res.json({
      success: true,
      data: {
        index: result.index,
        root: result.root,
        totalVoters: cryptoService.getVoterCount()
      }
    });
  } catch (error: any) {
    logger.error('Error registering voter:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to register voter'
    });
  }
};

/**
 * POST /api/crypto/proof
 * Génère une preuve Merkle pour un électeur
 */
export const generateProof = async (req: Request, res: Response) => {
  try {
    const { commitment } = GenerateProofSchema.parse(req.body);

    const commitmentBigInt = BigInt('0x' + commitment);
    const proof = await cryptoService.generateMerkleProof(commitmentBigInt);

    res.json({
      success: true,
      data: proof
    });
  } catch (error: any) {
    logger.error('Error generating proof:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate proof'
    });
  }
};

/**
 * POST /api/crypto/verify-proof
 * Vérifie une preuve Merkle
 */
export const verifyProof = async (req: Request, res: Response) => {
  try {
    const proof = VerifyProofSchema.parse(req.body);

    const isValid = await cryptoService.verifyMerkleProof(proof);

    res.json({
      success: true,
      data: {
        valid: isValid
      }
    });
  } catch (error: any) {
    logger.error('Error verifying proof:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify proof'
    });
  }
};

/**
 * POST /api/crypto/nullifier
 * Génère un nullifier pour une élection
 */
export const generateNullifier = async (req: Request, res: Response) => {
  try {
    const { identityNullifier, electionId } = GenerateNullifierSchema.parse(req.body);

    const identityNullifierBigInt = BigInt('0x' + identityNullifier);
    const nullifier = cryptoService.generateNullifier(identityNullifierBigInt, electionId);

    res.json({
      success: true,
      data: {
        nullifier,
        electionId
      }
    });
  } catch (error: any) {
    logger.error('Error generating nullifier:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate nullifier'
    });
  }
};

/**
 * POST /api/crypto/token
 * Génère un token de vote aléatoire
 */
export const generateToken = async (req: Request, res: Response) => {
  try {
    const token = cryptoService.generateVotingToken();

    res.json({
      success: true,
      data: token
    });
  } catch (error: any) {
    logger.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate token'
    });
  }
};

/**
 * POST /api/crypto/blind-token
 * Aveugle un token de vote
 */
export const blindToken = async (req: Request, res: Response) => {
  try {
    const { token, blindingFactor } = BlindTokenSchema.parse(req.body);

    const blindedToken = cryptoService.blindToken(token, blindingFactor);

    res.json({
      success: true,
      data: {
        blindedToken
      }
    });
  } catch (error: any) {
    logger.error('Error blinding token:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to blind token'
    });
  }
};

/**
 * POST /api/crypto/sign-token
 * Signe un token aveuglé (côté autorité)
 */
export const signBlindedToken = async (req: Request, res: Response) => {
  try {
    const { blindedToken } = SignTokenSchema.parse(req.body);

    const signature = cryptoService.signBlindedToken(blindedToken);

    res.json({
      success: true,
      data: {
        signature
      }
    });
  } catch (error: any) {
    logger.error('Error signing blinded token:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to sign blinded token'
    });
  }
};

/**
 * POST /api/crypto/unblind-signature
 * Dé-aveugle une signature
 */
export const unblindSignature = async (req: Request, res: Response) => {
  try {
    const { blindedSignature, blindingFactor } = UnblindSignatureSchema.parse(req.body);

    const unblindedSignature = cryptoService.unblindSignature(blindedSignature, blindingFactor);

    res.json({
      success: true,
      data: {
        unblindedSignature
      }
    });
  } catch (error: any) {
    logger.error('Error unblinding signature:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to unblind signature'
    });
  }
};

/**
 * POST /api/crypto/verify-token
 * Vérifie une signature de token
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const { token, signature } = VerifyTokenSchema.parse(req.body);

    const isValid = cryptoService.verifyTokenSignature(token, signature);

    res.json({
      success: true,
      data: {
        valid: isValid
      }
    });
  } catch (error: any) {
    logger.error('Error verifying token:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify token'
    });
  }
};

/**
 * GET /api/crypto/stats
 * Obtient des statistiques sur le système crypto
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = cryptoService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats'
    });
  }
};

/**
 * GET /api/crypto/root
 * Obtient le root actuel du Merkle tree
 */
export const getMerkleRoot = async (req: Request, res: Response) => {
  try {
    const root = cryptoService.getMerkleRoot();
    const voterCount = cryptoService.getVoterCount();

    res.json({
      success: true,
      data: {
        root,
        voterCount
      }
    });
  } catch (error: any) {
    logger.error('Error getting Merkle root:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Merkle root'
    });
  }
};
