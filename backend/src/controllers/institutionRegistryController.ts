import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { institutionRegistryService } from '../services/institutionRegistryService';
import { ipfsService } from '../services/ipfsService';

export class InstitutionRegistryController {
  /**
   * Récupérer une institution par ID
   */
  getInstitution = async (req: Request, res: Response): Promise<void> => {
    try {
      const { institutionId } = req.params;

      logger.info('Fetching institution', { institutionId });

      const institution = await institutionRegistryService.getInstitution(parseInt(institutionId));

      if (!institution) {
        res.status(404).json({
          success: false,
          error: 'Institution not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: institution,
      });
    } catch (error: any) {
      logger.error('Error fetching institution', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer une institution par son code territoire
   */
  getInstitutionByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { territoryCode } = req.params;

      logger.info('Fetching institution by code', { territoryCode });

      const institution = await institutionRegistryService.getInstitutionByCode(territoryCode);

      if (!institution) {
        res.status(404).json({
          success: false,
          error: 'Institution not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: institution,
      });
    } catch (error: any) {
      logger.error('Error fetching institution by code', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer toutes les communes
   */
  getAllCommunes = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching all communes');

      const communes = await institutionRegistryService.getAllCommunes();

      res.status(200).json({
        success: true,
        data: communes,
      });
    } catch (error: any) {
      logger.error('Error fetching all communes', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer tous les départements
   */
  getAllDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching all departments');

      const departments = await institutionRegistryService.getAllDepartments();

      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error: any) {
      logger.error('Error fetching all departments', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer toutes les régions
   */
  getAllRegions = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching all regions');

      const regions = await institutionRegistryService.getAllRegions();

      res.status(200).json({
        success: true,
        data: regions,
      });
    } catch (error: any) {
      logger.error('Error fetching all regions', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer le maire d'une commune
   */
  getMayor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { communeId } = req.params;

      logger.info('Fetching mayor', { communeId });

      const mayor = await institutionRegistryService.getMayor(parseInt(communeId));

      if (!mayor) {
        res.status(404).json({
          success: false,
          error: 'Mayor not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: mayor,
      });
    } catch (error: any) {
      logger.error('Error fetching mayor', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer les statistiques du registre
   */
  getRegistryStats = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching registry stats');

      const stats = await institutionRegistryService.getRegistryStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error fetching registry stats', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Vérifier si une adresse est admin d'une institution
   */
  isInstitutionAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { institutionId } = req.params;
      const { userAddress } = req.query;

      if (!userAddress || typeof userAddress !== 'string') {
        res.status(400).json({
          success: false,
          error: 'User address is required',
        });
        return;
      }

      logger.info('Checking if user is institution admin', { institutionId, userAddress });

      const isAdmin = await institutionRegistryService.isInstitutionAdmin(
        parseInt(institutionId),
        userAddress
      );

      res.status(200).json({
        success: true,
        data: { isAdmin },
      });
    } catch (error: any) {
      logger.error('Error checking if user is institution admin', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Uploader les métadonnées d'une institution sur IPFS
   */
  uploadInstitutionMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const metadata = req.body;

      logger.info('Uploading institution metadata to IPFS');

      const ipfsHash = await ipfsService.uploadJSON(metadata, 'institution');

      res.status(200).json({
        success: true,
        data: { ipfsHash },
      });
    } catch (error: any) {
      logger.error('Error uploading institution metadata', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export const institutionRegistryController = new InstitutionRegistryController();
