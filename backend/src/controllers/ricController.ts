import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ricService } from '../services/ricService';
import { ipfsService } from '../services/ipfsService';

export class RICController {
  /**
   * Récupérer une proposition RIC par ID
   */
  getProposal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { proposalId } = req.params;

      logger.info('Fetching RIC proposal', { proposalId });

      const proposal = await ricService.getProposal(parseInt(proposalId));

      if (!proposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: proposal,
      });
    } catch (error: any) {
      logger.error('Error fetching RIC proposal', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer toutes les propositions RIC
   */
  getAllProposals = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching all RIC proposals');

      const proposals = await ricService.getAllProposals();

      res.status(200).json({
        success: true,
        data: proposals,
      });
    } catch (error: any) {
      logger.error('Error fetching all RIC proposals', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer un référendum par ID
   */
  getReferendum = async (req: Request, res: Response): Promise<void> => {
    try {
      const { referendumId } = req.params;

      logger.info('Fetching RIC referendum', { referendumId });

      const referendum = await ricService.getReferendum(parseInt(referendumId));

      if (!referendum) {
        res.status(404).json({
          success: false,
          error: 'Referendum not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: referendum,
      });
    } catch (error: any) {
      logger.error('Error fetching RIC referendum', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer les arguments de campagne pour un référendum
   */
  getCampaignArguments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { referendumId } = req.params;

      logger.info('Fetching campaign arguments', { referendumId });

      const campaignArguments = await ricService.getCampaignArguments(parseInt(referendumId));

      res.status(200).json({
        success: true,
        data: campaignArguments,
      });
    } catch (error: any) {
      logger.error('Error fetching campaign arguments', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Vérifier si un utilisateur a signé une proposition
   */
  hasUserSigned = async (req: Request, res: Response): Promise<void> => {
    try {
      const { proposalId } = req.params;
      const { userAddress } = req.query;

      if (!userAddress || typeof userAddress !== 'string') {
        res.status(400).json({
          success: false,
          error: 'User address is required',
        });
        return;
      }

      logger.info('Checking if user signed RIC proposal', { proposalId, userAddress });

      const hasSigned = await ricService.hasUserSigned(parseInt(proposalId), userAddress);

      res.status(200).json({
        success: true,
        data: { hasSigned },
      });
    } catch (error: any) {
      logger.error('Error checking if user signed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Récupérer le nombre de propositions
   */
  getProposalsCount = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Fetching RIC proposals count');

      const count = await ricService.getProposalsCount();

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      logger.error('Error fetching proposals count', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Uploader les métadonnées d'une proposition RIC sur IPFS
   */
  uploadProposalMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const metadata = req.body;

      logger.info('Uploading RIC proposal metadata to IPFS');

      const ipfsHash = await ipfsService.uploadJSON(metadata, 'ric-proposal');

      res.status(200).json({
        success: true,
        data: { ipfsHash },
      });
    } catch (error: any) {
      logger.error('Error uploading RIC proposal metadata', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

export const ricController = new RICController();
