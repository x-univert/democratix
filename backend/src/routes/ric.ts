import { Router } from 'express';
import { ricController } from '../controllers/ricController';

const router = Router();

/**
 * GET /api/ric/proposals/:proposalId
 * Récupérer une proposition RIC par ID
 */
router.get(
  '/proposals/:proposalId',
  ricController.getProposal
);

/**
 * GET /api/ric/proposals
 * Récupérer toutes les propositions RIC
 */
router.get(
  '/proposals',
  ricController.getAllProposals
);

/**
 * GET /api/ric/referendums/:referendumId
 * Récupérer un référendum par ID
 */
router.get(
  '/referendums/:referendumId',
  ricController.getReferendum
);

/**
 * GET /api/ric/referendums/:referendumId/campaign-arguments
 * Récupérer les arguments de campagne pour un référendum
 */
router.get(
  '/referendums/:referendumId/campaign-arguments',
  ricController.getCampaignArguments
);

/**
 * GET /api/ric/proposals/:proposalId/has-signed
 * Vérifier si un utilisateur a signé une proposition
 * Query params: userAddress (required)
 */
router.get(
  '/proposals/:proposalId/has-signed',
  ricController.hasUserSigned
);

/**
 * GET /api/ric/proposals/count
 * Récupérer le nombre de propositions
 */
router.get(
  '/proposals/count',
  ricController.getProposalsCount
);

/**
 * POST /api/ric/proposals/upload-metadata
 * Uploader les métadonnées d'une proposition RIC sur IPFS
 */
router.post(
  '/proposals/upload-metadata',
  ricController.uploadProposalMetadata
);

export default router;
