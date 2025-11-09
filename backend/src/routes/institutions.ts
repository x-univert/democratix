import { Router } from 'express';
import { institutionRegistryController } from '../controllers/institutionRegistryController';

const router = Router();

/**
 * GET /api/institutions/:institutionId
 * Récupérer une institution par ID
 */
router.get(
  '/:institutionId',
  institutionRegistryController.getInstitution
);

/**
 * GET /api/institutions/code/:territoryCode
 * Récupérer une institution par son code territoire
 */
router.get(
  '/code/:territoryCode',
  institutionRegistryController.getInstitutionByCode
);

/**
 * GET /api/institutions/communes/all
 * Récupérer toutes les communes
 */
router.get(
  '/communes/all',
  institutionRegistryController.getAllCommunes
);

/**
 * GET /api/institutions/departments/all
 * Récupérer tous les départements
 */
router.get(
  '/departments/all',
  institutionRegistryController.getAllDepartments
);

/**
 * GET /api/institutions/regions/all
 * Récupérer toutes les régions
 */
router.get(
  '/regions/all',
  institutionRegistryController.getAllRegions
);

/**
 * GET /api/institutions/communes/:communeId/mayor
 * Récupérer le maire d'une commune
 */
router.get(
  '/communes/:communeId/mayor',
  institutionRegistryController.getMayor
);

/**
 * GET /api/institutions/stats
 * Récupérer les statistiques du registre
 */
router.get(
  '/stats',
  institutionRegistryController.getRegistryStats
);

/**
 * GET /api/institutions/:institutionId/is-admin
 * Vérifier si une adresse est admin d'une institution
 * Query params: userAddress (required)
 */
router.get(
  '/:institutionId/is-admin',
  institutionRegistryController.isInstitutionAdmin
);

/**
 * POST /api/institutions/upload-metadata
 * Uploader les métadonnées d'une institution sur IPFS
 */
router.post(
  '/upload-metadata',
  institutionRegistryController.uploadInstitutionMetadata
);

export default router;
