import { Router } from 'express';
import { z } from 'zod';
import { electionController } from '../controllers/electionController';
import { validate, validateParams, CreateElectionSchema, IdParamSchema } from '../validators/schemas';

const router = Router();

/**
 * POST /api/elections/prepare
 * Préparer une transaction de création d'élection
 */
router.post(
  '/prepare',
  validate(CreateElectionSchema.extend({
    senderAddress: z.string().min(62).max(62), // erd1... address
  })),
  electionController.prepareCreateElection
);

/**
 * GET /api/elections/:id
 * Récupérer une élection par ID
 */
router.get(
  '/:id',
  validateParams(IdParamSchema),
  electionController.getElection
);

/**
 * GET /api/elections
 * Lister toutes les élections
 */
router.get(
  '/',
  electionController.listElections
);

/**
 * POST /api/elections/:id/activate
 * Préparer une transaction d'activation d'élection
 */
router.post(
  '/:id/activate',
  validateParams(IdParamSchema),
  electionController.prepareActivateElection
);

/**
 * POST /api/elections/:id/close
 * Préparer une transaction de fermeture d'élection
 */
router.post(
  '/:id/close',
  validateParams(IdParamSchema),
  electionController.prepareCloseElection
);

/**
 * GET /api/elections/:id/results
 * Récupérer les résultats d'une élection
 */
router.get(
  '/:id/results',
  validateParams(IdParamSchema),
  electionController.getResults
);

/**
 * GET /api/elections/:id/votes
 * Obtenir le nombre total de votes
 */
router.get(
  '/:id/votes',
  validateParams(IdParamSchema),
  electionController.getTotalVotes
);

/**
 * GET /api/elections/tx/:txHash
 * Vérifier le statut d'une transaction
 */
router.get(
  '/tx/:txHash',
  electionController.checkTransactionStatus
);

export default router;
