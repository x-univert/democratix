import { Router } from 'express';
import { petitionController } from '../controllers/petitionController';

const router = Router();

/**
 * GET /api/petitions/:petitionId
 * Récupérer une pétition par ID
 */
router.get(
  '/:petitionId',
  petitionController.getPetition
);

/**
 * GET /api/petitions
 * Récupérer toutes les pétitions
 */
router.get(
  '/',
  petitionController.getAllPetitions
);

/**
 * GET /api/petitions/active
 * Récupérer les pétitions actives
 */
router.get(
  '/active',
  petitionController.getActivePetitions
);

/**
 * GET /api/petitions/:petitionId/has-signed
 * Vérifier si un utilisateur a signé une pétition
 * Query params: nullifier (required)
 */
router.get(
  '/:petitionId/has-signed',
  petitionController.hasUserSigned
);

/**
 * GET /api/petitions/count
 * Récupérer le nombre de pétitions
 */
router.get(
  '/count',
  petitionController.getPetitionsCount
);

/**
 * GET /api/petitions/:petitionId/signatures
 * Récupérer les signatures d'une pétition
 */
router.get(
  '/:petitionId/signatures',
  petitionController.getPetitionSignatures
);

/**
 * POST /api/petitions/upload-metadata
 * Uploader les métadonnées d'une pétition sur IPFS
 */
router.post(
  '/upload-metadata',
  petitionController.uploadPetitionMetadata
);

export default router;
