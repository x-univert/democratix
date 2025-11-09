import { Router } from 'express';
import { pollController } from '../controllers/pollController';

const router = Router();

/**
 * GET /api/polls/:pollId
 * Récupérer un sondage par ID
 */
router.get(
  '/:pollId',
  pollController.getPoll
);

/**
 * GET /api/polls
 * Récupérer tous les sondages
 */
router.get(
  '/',
  pollController.getAllPolls
);

/**
 * GET /api/polls/active
 * Récupérer les sondages actifs
 */
router.get(
  '/active',
  pollController.getActivePolls
);

/**
 * GET /api/polls/:pollId/questions
 * Récupérer les questions d'un sondage
 */
router.get(
  '/:pollId/questions',
  pollController.getPollQuestions
);

/**
 * GET /api/polls/questions/:questionId/options
 * Récupérer les options d'une question
 */
router.get(
  '/questions/:questionId/options',
  pollController.getQuestionOptions
);

/**
 * GET /api/polls/:pollId/results
 * Récupérer les résultats d'un sondage
 */
router.get(
  '/:pollId/results',
  pollController.getPollResults
);

/**
 * GET /api/polls/:pollId/has-responded
 * Vérifier si un utilisateur a répondu à un sondage
 * Query params: userAddress (required)
 */
router.get(
  '/:pollId/has-responded',
  pollController.hasUserResponded
);

/**
 * GET /api/polls/count
 * Récupérer le nombre de sondages
 */
router.get(
  '/count',
  pollController.getPollsCount
);

/**
 * POST /api/polls/upload-metadata
 * Uploader les métadonnées d'un sondage sur IPFS
 */
router.post(
  '/upload-metadata',
  pollController.uploadPollMetadata
);

export default router;
