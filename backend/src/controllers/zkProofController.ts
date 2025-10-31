/**
 * Contrôleur pour la vérification des preuves zk-SNARK
 */

import { Request, Response } from 'express';
import { zkVerifier, Proof, PublicSignals } from '../services/zkVerifierService';
import { logger } from '../utils/logger';
import { createHash, randomBytes } from 'crypto';

// Helper pour typer les erreurs
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * GET /api/zk/health
 * Vérifie que le service zk-SNARK est opérationnel
 */
export const getHealthStatus = async (_req: Request, res: Response) => {
  try {
    const isInitialized = zkVerifier.isInitialized();
    const keysInfo = zkVerifier.getVerificationKeysInfo();

    res.json({
      status: isInitialized ? 'healthy' : 'initializing',
      initialized: isInitialized,
      verificationKeys: keysInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      error: getErrorMessage(error)
    });
  }
};

/**
 * POST /api/zk/verify-vote
 * Vérifie une preuve de vote valide
 *
 * Body:
 * {
 *   "proof": { pi_a, pi_b, pi_c, protocol, curve },
 *   "publicSignals": ["electionId", "numCandidates", "voteCommitment"]
 * }
 */
export const verifyVoteProof = async (req: Request, res: Response) => {
  try {
    const { proof, publicSignals }: { proof: Proof; publicSignals: PublicSignals } =
      req.body;

    // Validation des inputs
    if (!proof || !publicSignals) {
      return res.status(400).json({
        error: 'Missing required fields: proof and publicSignals'
      });
    }

    if (!Array.isArray(publicSignals) || publicSignals.length !== 3) {
      return res.status(400).json({
        error: 'publicSignals must be an array with 3 elements [electionId, numCandidates, voteCommitment]'
      });
    }

    logger.info('Received vote proof verification request');
    logger.debug('Public signals:', publicSignals);

    // Vérifier la preuve
    const isValid = await zkVerifier.verifyValidVoteProof(proof, publicSignals);

    if (!isValid) {
      logger.warn('❌ Invalid vote proof received');
      return res.status(400).json({
        verified: false,
        error: 'Invalid proof'
      });
    }

    // Extraire les informations
    const voteInfo = zkVerifier.parseVotePublicSignals(publicSignals);

    // Générer une signature pour autoriser la transaction blockchain
    const signature = generateBackendSignature(publicSignals);

    logger.info('✅ Vote proof verified successfully');

    res.json({
      verified: true,
      voteInfo,
      signature,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error verifying vote proof:', error);
    res.status(500).json({
      verified: false,
      error: getErrorMessage(error)
    });
  }
};

/**
 * POST /api/zk/verify-eligibility
 * Vérifie une preuve d'éligibilité d'électeur
 *
 * Body:
 * {
 *   "proof": { pi_a, pi_b, pi_c, protocol, curve },
 *   "publicSignals": ["merkleRoot", "nullifier", "electionId"]
 * }
 */
export const verifyEligibilityProof = async (req: Request, res: Response) => {
  try {
    const { proof, publicSignals }: { proof: Proof; publicSignals: PublicSignals } =
      req.body;

    // Validation des inputs
    if (!proof || !publicSignals) {
      return res.status(400).json({
        error: 'Missing required fields: proof and publicSignals'
      });
    }

    if (!Array.isArray(publicSignals) || publicSignals.length !== 3) {
      return res.status(400).json({
        error: 'publicSignals must be an array with 3 elements [merkleRoot, nullifier, electionId]'
      });
    }

    logger.info('Received eligibility proof verification request');
    logger.debug('Public signals:', publicSignals);

    // Vérifier la preuve
    const isValid = await zkVerifier.verifyVoterEligibilityProof(proof, publicSignals);

    if (!isValid) {
      logger.warn('❌ Invalid eligibility proof received');
      return res.status(400).json({
        verified: false,
        error: 'Invalid proof'
      });
    }

    // Extraire les informations
    const eligibilityInfo = zkVerifier.parseEligibilityPublicSignals(publicSignals);

    // Générer une signature pour autoriser la transaction blockchain
    const signature = generateBackendSignature(publicSignals);

    logger.info('✅ Eligibility proof verified successfully');

    res.json({
      verified: true,
      eligibilityInfo,
      signature,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error verifying eligibility proof:', error);
    res.status(500).json({
      verified: false,
      error: getErrorMessage(error)
    });
  }
};

/**
 * POST /api/zk/verify-complete
 * Vérifie une preuve complète (éligibilité + vote)
 *
 * Body:
 * {
 *   "eligibilityProof": { ... },
 *   "eligibilityPublicSignals": [...],
 *   "voteProof": { ... },
 *   "votePublicSignals": [...]
 * }
 */
export const verifyCompleteProof = async (req: Request, res: Response) => {
  try {
    const {
      eligibilityProof,
      eligibilityPublicSignals,
      voteProof,
      votePublicSignals
    }: {
      eligibilityProof: Proof;
      eligibilityPublicSignals: PublicSignals;
      voteProof: Proof;
      votePublicSignals: PublicSignals;
    } = req.body;

    // Validation des inputs
    if (!eligibilityProof || !eligibilityPublicSignals || !voteProof || !votePublicSignals) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    logger.info('Received complete proof verification request');

    // Vérifier les deux preuves
    const result = await zkVerifier.verifyCompleteVoteProof(
      eligibilityProof,
      eligibilityPublicSignals,
      voteProof,
      votePublicSignals
    );

    if (!result.valid) {
      logger.warn('❌ Complete proof verification failed');
      return res.status(400).json({
        verified: false,
        eligibilityValid: result.eligibilityValid,
        voteValid: result.voteValid,
        error: 'One or more proofs are invalid'
      });
    }

    // Extraire les informations
    const eligibilityInfo = zkVerifier.parseEligibilityPublicSignals(eligibilityPublicSignals);
    const voteInfo = zkVerifier.parseVotePublicSignals(votePublicSignals);

    // Vérifier que les electionId correspondent
    if (eligibilityInfo.electionId !== voteInfo.electionId) {
      return res.status(400).json({
        verified: false,
        error: 'Election IDs do not match between eligibility and vote proofs'
      });
    }

    // Générer signature complète
    const signature = generateBackendSignature([
      ...eligibilityPublicSignals,
      ...votePublicSignals
    ]);

    logger.info('✅ Complete proof verified successfully');

    res.json({
      verified: true,
      eligibilityValid: true,
      voteValid: true,
      eligibilityInfo,
      voteInfo,
      signature,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error verifying complete proof:', error);
    res.status(500).json({
      verified: false,
      error: getErrorMessage(error)
    });
  }
};

/**
 * Génère une signature backend pour autoriser la transaction blockchain
 *
 * Note: Dans une implémentation production, utilisez une vraie clé privée
 * stockée dans un HSM/KMS, pas un simple hash
 */
function generateBackendSignature(publicSignals: PublicSignals): string {
  // TODO: Remplacer par une vraie signature cryptographique (Ed25519)
  const message = publicSignals.join('');
  const hash = createHash('sha256').update(message).digest('hex');

  // Simuler une signature (pour POC)
  const nonce = randomBytes(16).toString('hex');
  const signature = `${hash}.${nonce}`;

  return signature;
}

/**
 * POST /api/zk/test
 * Endpoint de test pour vérifier que le service fonctionne
 * avec des données de test
 */
export const testVerification = async (_req: Request, res: Response) => {
  try {
    logger.info('Running zk-SNARK verification test...');

    // Données de test (doivent correspondre aux tests dans circuits/build/)
    const testVoteProof = {
      // Les valeurs réelles seront dans les fichiers de test
      pi_a: [],
      pi_b: [],
      pi_c: [],
      protocol: 'groth16',
      curve: 'bn128'
    };

    const testVotePublicSignals = ['1', '5', '20273507361485954822755207693659837460600561274343142878581704438813782001667'];

    // Note: Cette fonction échouera jusqu'à ce qu'on ait des vraies preuves de test
    res.json({
      message: 'Test endpoint - load real test proofs to verify',
      zkVerifierInitialized: zkVerifier.isInitialized(),
      testData: {
        proof: testVoteProof,
        publicSignals: testVotePublicSignals
      }
    });
  } catch (error) {
    logger.error('Test verification failed:', error);
    res.status(500).json({
      error: getErrorMessage(error)
    });
  }
};
