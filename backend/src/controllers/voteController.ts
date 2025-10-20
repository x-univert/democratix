import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { multiversxService } from '../services/multiversxService';

export class VoteController {
  /**
   * Préparer une transaction de vote
   *
   * Le backend prépare la transaction avec le vote chiffré
   * Le frontend la signe avec le wallet de l'utilisateur
   */
  prepareCastVote = async (req: Request, res: Response): Promise<void> => {
    try {
      const { electionId, votingToken, encryptedVote, proof, senderAddress } = req.body;

      logger.info('Preparing vote submission', {
        electionId,
        senderAddress,
      });

      // Vérifier d'abord que le token est valide
      const isTokenValid = await multiversxService.isTokenValid(electionId, votingToken);

      if (!isTokenValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid voting token',
        });
        return;
      }

      // Préparer la transaction de vote
      const transaction = multiversxService.prepareCastVoteTransaction({
        electionId,
        votingToken,
        encryptedVote,
        proof,
        sender: senderAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Vote transaction prepared',
        data: {
          transaction: transaction.toPlainObject(),
        },
      });
    } catch (error: any) {
      logger.error('Error preparing vote submission', {
        error: error.message,
      });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * Générer un vote chiffré (côté serveur - MOCK pour POC)
   *
   * En production, le chiffrement doit être fait côté client
   * avec la clé publique de l'élection
   */
  encryptVote = async (req: Request, res: Response): Promise<void> => {
    try {
      const { electionId, candidateId } = req.body;

      logger.info('Encrypting vote (MOCK)', { electionId, candidateId });

      // MOCK: En production, utiliser vrai chiffrement homomorphique
      const mockEncryptedVote = Buffer.from(
        JSON.stringify({ candidate: candidateId, nonce: Math.random() })
      ).toString('hex');

      const mockProof = Buffer.from(
        `zk_proof_election_${electionId}_candidate_${candidateId}_${Date.now()}`
      ).toString('hex');

      res.status(200).json({
        success: true,
        message: 'Vote encrypted (MOCK - use real encryption in production)',
        data: {
          encryptedVote: mockEncryptedVote,
          proof: mockProof,
          warning: 'This is a MOCK implementation. Real encryption must be done client-side.',
        },
      });
    } catch (error: any) {
      logger.error('Error encrypting vote', {
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
export const voteController = new VoteController();
