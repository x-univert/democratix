import { Router } from 'express';
import { electionController } from '../controllers/electionController';
import { validate, validateParams, CreateElectionWithSenderSchema, IdParamSchema } from '../validators/schemas';

const router = Router();

/**
 * POST /api/elections/prepare
 * Préparer une transaction de création d'élection
 */
router.post(
  '/prepare',
  validate(CreateElectionWithSenderSchema),
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

/**
 * POST /api/elections/:id/setup-encryption
 * Générer les clés ElGamal pour une élection (Option 1)
 */
router.post(
  '/:id/setup-encryption',
  validateParams(IdParamSchema),
  electionController.setupElGamalEncryption
);

/**
 * GET /api/elections/:id/public-key
 * Récupérer la clé publique ElGamal d'une élection
 */
router.get(
  '/:id/public-key',
  validateParams(IdParamSchema),
  electionController.getElGamalPublicKey
);

/**
 * POST /api/elections/:id/decrypt-votes
 * Déchiffrer les votes privés après clôture (organisateur seulement)
 */
router.post(
  '/:id/decrypt-votes',
  validateParams(IdParamSchema),
  electionController.decryptPrivateVotes
);

/**
 * POST /api/elections/:id/co-organizers
 * Ajouter un co-organisateur à une élection
 */
router.post(
  '/:id/co-organizers',
  validateParams(IdParamSchema),
  electionController.addCoOrganizer
);

/**
 * DELETE /api/elections/:id/co-organizers
 * Retirer un co-organisateur d'une élection
 */
router.delete(
  '/:id/co-organizers',
  validateParams(IdParamSchema),
  electionController.removeCoOrganizer
);

/**
 * GET /api/elections/:id/organizers
 * Obtenir la liste des organisateurs (principal + co-organisateurs)
 */
router.get(
  '/:id/organizers',
  validateParams(IdParamSchema),
  electionController.getElectionOrganizers
);

/**
 * POST /api/elections/:id/notify
 * Notifier d'un événement de transaction réussie (appelé par le frontend après confirmation)
 */
router.post(
  '/:id/notify',
  validateParams(IdParamSchema),
  electionController.notifyTransactionEvent
);

/**
 * POST /api/elections/:id/send-invitations-email
 * Envoyer des invitations par email avec codes d'invitation
 */
router.post(
  '/:id/send-invitations-email',
  validateParams(IdParamSchema),
  electionController.sendInvitationsByEmail
);

/**
 * POST /api/elections/test-email
 * Envoyer un email de test pour vérifier la configuration SendGrid
 */
router.post(
  '/test-email',
  electionController.sendTestEmail
);

/**
 * POST /api/elections/:id/send-otp
 * Envoyer un code OTP par SMS à un numéro de téléphone
 */
router.post(
  '/:id/send-otp',
  validateParams(IdParamSchema),
  electionController.sendOTP
);

/**
 * POST /api/elections/:id/verify-otp
 * Vérifier un code OTP pour un numéro de téléphone
 */
router.post(
  '/:id/verify-otp',
  validateParams(IdParamSchema),
  electionController.verifyOTP
);

/**
 * POST /api/elections/:id/send-invitations-sms
 * Envoyer des invitations par SMS en masse avec codes OTP
 */
router.post(
  '/:id/send-invitations-sms',
  validateParams(IdParamSchema),
  electionController.sendInvitationsBySMS
);

/**
 * POST /api/elections/test-sms
 * Envoyer un SMS de test pour vérifier la configuration Twilio
 */
router.post(
  '/test-sms',
  electionController.sendTestSMS
);

/**
 * GET /api/elections/stats/detailed
 * Obtenir des statistiques détaillées pour le dashboard
 */
router.get(
  '/stats/detailed',
  electionController.getDetailedStats
);

/**
 * GET /api/elections/:id/stats/votes-timeline
 * Obtenir l'évolution des votes dans le temps pour une élection
 */
router.get(
  '/:id/stats/votes-timeline',
  validateParams(IdParamSchema),
  electionController.getVotesTimeline
);

/**
 * POST /api/elections/:id/prepare-final-results
 * Prépare les résultats finaux pour la finalisation (upload IPFS + calcul des totaux)
 */
router.post(
  '/:id/prepare-final-results',
  validateParams(IdParamSchema),
  electionController.prepareFinalResults
);

export default router;
