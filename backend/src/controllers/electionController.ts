import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { multiversxService } from '../services/multiversxService';
import { ipfsService } from '../services/ipfsService';

export class ElectionController {
  /**
   * Préparer une transaction de création d'élection
   *
   * Le backend prépare la transaction et la retourne au frontend
   * Le frontend la signe avec le wallet de l'utilisateur
   */
  prepareCreateElection = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, startTime, endTime, candidates, senderAddress } = req.body;

      logger.info('Preparing election creation', { title, candidatesCount: candidates.length });

      // 1. Upload de la description complète sur IPFS
      const electionMetadata = {
        title,
        description,
        organizer: senderAddress,
        candidates: candidates.map((c: any) => ({
          id: c.id,
          name: c.name,
          biography: c.biography || '',
          program: c.program || '',
        })),
        createdAt: new Date().toISOString(),
      };

      const ipfsHash = await ipfsService.uploadElectionMetadata(electionMetadata);
      logger.info('Election metadata uploaded to IPFS', { ipfsHash });

      // 2. Upload des métadonnées de chaque candidat sur IPFS (si nécessaire)
      const candidatesWithIpfs = await Promise.all(
        candidates.map(async (candidate: any) => {
          if (candidate.biography || candidate.program) {
            const candidateIpfs = await ipfsService.uploadCandidateMetadata({
              name: candidate.name,
              biography: candidate.biography || '',
              program: candidate.program || '',
            });
            return {
              id: candidate.id,
              name: candidate.name,
              description_ipfs: candidateIpfs,
            };
          }
          return {
            id: candidate.id,
            name: candidate.name,
            description_ipfs: '',
          };
        })
      );

      // 3. Préparer la transaction blockchain
      const transaction = multiversxService.prepareCreateElectionTransaction({
        title,
        descriptionIpfs: ipfsHash,
        startTime,
        endTime,
        candidates: candidatesWithIpfs,
        sender: senderAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Transaction prepared successfully',
        data: {
          transaction: transaction.toPlainObject(),
          ipfsHash,
          candidates: candidatesWithIpfs,
        },
      });
    } catch (error: any) {
      logger.error('Error preparing election creation', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Récupérer une élection par ID
   */
  getElection = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      logger.info('Fetching election', { electionId });

      const election = await multiversxService.getElection(electionId);

      if (!election) {
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      // Récupérer les métadonnées depuis IPFS
      let metadata = null;
      try {
        metadata = await ipfsService.downloadJSON(election.description_ipfs);
      } catch (error) {
        logger.warn('Could not fetch election metadata from IPFS', {
          ipfsHash: election.description_ipfs
        });
      }

      res.status(200).json({
        success: true,
        data: {
          ...election,
          metadata,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching election', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Lister toutes les élections
   *
   * NOTE: Pour le POC, on retourne une liste vide.
   * En production, il faudrait indexer les événements blockchain
   * ou utiliser une base de données secondaire.
   */
  listElections = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Listing elections');

      // TODO: Implémenter indexation des événements ou base de données
      // Pour l'instant, retourne un message explicatif

      res.status(200).json({
        success: true,
        message: 'Election listing requires event indexing (to be implemented)',
        data: {
          elections: [],
          note: 'Use getElection(id) to fetch specific elections for now',
        },
      });
    } catch (error: any) {
      logger.error('Error listing elections', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Préparer une transaction d'activation d'élection
   */
  prepareActivateElection = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);
      const { senderAddress } = req.body;

      logger.info('Preparing election activation', { electionId });

      const transaction = multiversxService.prepareActivateElectionTransaction({
        electionId,
        sender: senderAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Activation transaction prepared',
        data: {
          transaction: transaction.toPlainObject(),
        },
      });
    } catch (error: any) {
      logger.error('Error preparing election activation', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Préparer une transaction de fermeture d'élection
   */
  prepareCloseElection = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);
      const { senderAddress } = req.body;

      logger.info('Preparing election closure', { electionId });

      const transaction = multiversxService.prepareCloseElectionTransaction({
        electionId,
        sender: senderAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Closure transaction prepared',
        data: {
          transaction: transaction.toPlainObject(),
        },
      });
    } catch (error: any) {
      logger.error('Error preparing election closure', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Récupérer les résultats d'une élection
   */
  getResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      logger.info('Fetching election results', { electionId });

      const election = await multiversxService.getElection(electionId);

      if (!election) {
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      // Vérifier que l'élection est fermée ou finalisée
      if (election.status !== 'Closed' && election.status !== 'Finalized') {
        res.status(400).json({
          success: false,
          error: 'Election is not closed yet',
          data: { status: election.status },
        });
        return;
      }

      // TODO: Implémenter le dépouillement avec le smart contract "results"
      // Pour l'instant, retourne les informations de base

      res.status(200).json({
        success: true,
        message: 'Results decryption not yet implemented',
        data: {
          electionId,
          status: election.status,
          totalVotes: election.total_votes,
          note: 'Decryption and tallying will be implemented with homomorphic encryption',
        },
      });
    } catch (error: any) {
      logger.error('Error fetching results', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Obtenir le nombre total de votes pour une élection
   */
  getTotalVotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      logger.info('Fetching total votes', { electionId });

      const totalVotes = await multiversxService.getTotalVotes(electionId);

      res.status(200).json({
        success: true,
        data: {
          electionId,
          totalVotes,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching total votes', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Vérifier le statut d'une transaction
   */
  checkTransactionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { txHash } = req.params;

      logger.info('Checking transaction status', { txHash });

      const isSuccessful = await multiversxService.waitForTransaction(txHash, 5000);

      res.status(200).json({
        success: true,
        data: {
          txHash,
          isSuccessful,
          status: isSuccessful ? 'success' : 'pending/failed',
        },
      });
    } catch (error: any) {
      logger.error('Error checking transaction', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}

// Export singleton
export const electionController = new ElectionController();
