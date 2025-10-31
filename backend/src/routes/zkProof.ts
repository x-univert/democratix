/**
 * Routes pour la vérification des preuves zk-SNARK
 */

import { Router } from 'express';
import {
  getHealthStatus,
  verifyVoteProof,
  verifyEligibilityProof,
  verifyCompleteProof,
  testVerification
} from '../controllers/zkProofController';

const router = Router();

/**
 * GET /api/zk/health
 * Vérifier l'état du service zk-SNARK
 */
router.get('/health', getHealthStatus);

/**
 * POST /api/zk/verify-vote
 * Vérifier une preuve de vote valide
 *
 * Body:
 * {
 *   "proof": {...},
 *   "publicSignals": ["electionId", "numCandidates", "voteCommitment"]
 * }
 */
router.post('/verify-vote', verifyVoteProof);

/**
 * POST /api/zk/verify-eligibility
 * Vérifier une preuve d'éligibilité d'électeur
 *
 * Body:
 * {
 *   "proof": {...},
 *   "publicSignals": ["merkleRoot", "nullifier", "electionId"]
 * }
 */
router.post('/verify-eligibility', verifyEligibilityProof);

/**
 * POST /api/zk/verify-complete
 * Vérifier une preuve complète (éligibilité + vote)
 *
 * Body:
 * {
 *   "eligibilityProof": {...},
 *   "eligibilityPublicSignals": [...],
 *   "voteProof": {...},
 *   "votePublicSignals": [...]
 * }
 */
router.post('/verify-complete', verifyCompleteProof);

/**
 * POST /api/zk/test
 * Endpoint de test pour vérifier le service
 */
router.post('/test', testVerification);

export default router;
