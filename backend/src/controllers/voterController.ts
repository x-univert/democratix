import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { multiversxService } from '../services/multiversxService';

export class VoterController {
  /**
   * Préparer une transaction d'enregistrement d'électeur
   */
  prepareRegisterVoter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { electionId, credentialProof, senderAddress } = req.body;

      logger.info('Preparing voter registration', {
        electionId,
        senderAddress,
      });

      // Préparer la transaction
      const transaction = multiversxService.prepareRegisterVoterTransaction({
        electionId,
        credentialProof,
        sender: senderAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Voter registration transaction prepared',
        data: {
          transaction: transaction,
        },
      });
    } catch (error: any) {
      logger.error('Error preparing voter registration', {
        error: error.message,
      });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Vérifier si un token de vote est valide
   */
  checkTokenValidity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { electionId, token } = req.body;

      logger.info('Checking token validity', { electionId });

      const isValid = await multiversxService.isTokenValid(electionId, token);

      res.status(200).json({
        success: true,
        data: {
          electionId,
          isValid,
        },
      });
    } catch (error: any) {
      logger.error('Error checking token validity', {
        error: error.message,
      });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

// Export singleton
export const voterController = new VoterController();
