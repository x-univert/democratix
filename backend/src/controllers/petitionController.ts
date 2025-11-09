import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { petitionService } from '../services/petitionService';
import { ipfsService } from '../services/ipfsService';

export class PetitionController {
  /**
   * Récupérer une pétition par ID
   */
  getPetition = async (req: Request, res: Response): Promise<void> => {
    try {
      const { petitionId } = req.params;

      logger.info('Fetching petition', { petitionId });

      const petition = await petitionService.getPetition(parseInt(petitionId));

      if (!petition) {
        res.status(404).json({
          success: false,
          error: 'Petition not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: petition,
      });
    } catch (error: any) {
      logger.error('Error fetching petition', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer toutes les pétitions
   */
  getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching all petitions');

      const petitions = await petitionService.getAllPetitions();

      res.status(200).json({
        success: true,
        data: petitions,
      });
    } catch (error: any) {
      logger.error('Error fetching all petitions', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer les pétitions actives
   */
  getActivePetitions = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching active petitions');

      const petitions = await petitionService.getActivePetitions();

      res.status(200).json({
        success: true,
        data: petitions,
      });
    } catch (error: any) {
      logger.error('Error fetching active petitions', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Vérifier si un utilisateur a signé une pétition
   */
  hasUserSigned = async (req: Request, res: Response): Promise<void> => {
    try {
      const { petitionId } = req.params;
      const { nullifier } = req.query;

      if (!nullifier || typeof nullifier !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Nullifier is required',
        });
        return;
      }

      logger.info('Checking if user signed petition', { petitionId, nullifier });

      const hasSigned = await petitionService.hasUserSigned(parseInt(petitionId), nullifier);

      res.status(200).json({
        success: true,
        data: { hasSigned },
      });
    } catch (error: any) {
      logger.error('Error checking if user signed petition', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer le nombre de pétitions
   */
  getPetitionsCount = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching petitions count');

      const count = await petitionService.getPetitionsCount();

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      logger.error('Error fetching petitions count', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer les signatures d'une pétition
   */
  getPetitionSignatures = async (req: Request, res: Response): Promise<void> => {
    try {
      const { petitionId } = req.params;

      logger.info('Fetching petition signatures', { petitionId });

      const signatures = await petitionService.getPetitionSignatures(parseInt(petitionId));

      res.status(200).json({
        success: true,
        data: signatures,
      });
    } catch (error: any) {
      logger.error('Error fetching petition signatures', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Uploader les métadonnées d'une pétition sur IPFS
   */
  uploadPetitionMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const metadata = req.body;

      logger.info('Uploading petition metadata to IPFS');

      const ipfsHash = await ipfsService.uploadJSON(metadata, 'petition');

      res.status(200).json({
        success: true,
        data: { ipfsHash },
      });
    } catch (error: any) {
      logger.error('Error uploading petition metadata', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export const petitionController = new PetitionController();
