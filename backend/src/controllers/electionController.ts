import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { multiversxService } from '../services/multiversxService';
import { ipfsService } from '../services/ipfsService';
import { elgamalService } from '../services/elgamalService';
import { keyManagementService } from '../services/keyManagementService';
import { coOrganizersService } from '../services/coOrganizersService';
import { websocketService } from '../services/websocketService';
import { EmailService } from '../services/emailService';
import {
  validateSetupEncryptionRequest,
  validateDecryptVotesRequest,
  ValidationError,
  AuthorizationError
} from '../utils/validation';

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
          transaction: transaction,
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
          transaction: transaction,
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
          transaction: transaction,
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

  /**
   * Générer les clés ElGamal pour une élection (Option 1)
   * À appeler lors de la création de l'élection si encryption activée
   *
   * Cette méthode:
   * 1. Génère les clés ElGamal (pk, sk)
   * 2. Prépare la transaction pour stocker pk on-chain
   * 3. Retourne pk et sk à l'organisateur
   */
  setupElGamalEncryption = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      // ✅ VALIDATION: Validate request body
      const validation = validateSetupEncryptionRequest({ electionId, ...req.body });
      if (!validation.valid) {
        logger.warn('Invalid setup encryption request', { error: validation.error });
        res.status(400).json({
          success: false,
          error: validation.error
        });
        return;
      }

      const { organizerAddress } = validation.data!;

      logger.info('Setting up ElGamal encryption', { electionId, organizerAddress });

      // ✅ AUTHORIZATION: Verify user is the election organizer
      const election = await multiversxService.getElection(electionId);

      if (!election) {
        logger.warn('Election not found', { electionId });
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      // Initialiser le système de co-organisateurs si pas encore fait
      const existingCoOrgs = coOrganizersService.getElectionOrganizers(electionId);
      if (!existingCoOrgs) {
        await coOrganizersService.initializeElection(electionId, election!.organizer);
      }

      // Vérifier si l'utilisateur peut setup l'encryption (organizer principal ou co-organizer avec permission)
      if (!coOrganizersService.canSetupEncryption(electionId, organizerAddress)) {
        logger.warn('Unauthorized setup attempt', { electionId, organizerAddress });
        res.status(403).json({
          success: false,
          error: 'You do not have permission to setup encryption for this election'
        });
        return;
      }

      // Check if encryption already setup
      const existingKey = await keyManagementService.hasPrivateKey(electionId);
      if (existingKey) {
        logger.warn('ElGamal encryption already setup for election', { electionId });
        res.status(409).json({
          success: false,
          error: 'ElGamal encryption already setup for this election'
        });
        return;
      }

      // 1. Générer les clés ElGamal
      const keys = elgamalService.generateKeys();
      const metadata = elgamalService.generateKeyMetadata(electionId, keys);

      // 2. Préparer la transaction pour stocker la clé publique on-chain
      const transaction = multiversxService.prepareSetElectionPublicKeyTransaction({
        electionId,
        publicKey: keys.publicKey,
        sender: organizerAddress
      });

      // 🔒 SÉCURITÉ: Stocker la clé privée de manière chiffrée (avec backup IPFS)
      const encryptedData = await keyManagementService.encryptPrivateKey(keys.privateKey);
      const backupResult = await keyManagementService.storeEncryptedKey(electionId, encryptedData);

      // Obtenir les informations de backup
      const backupInfo = await keyManagementService.getBackupInfo(electionId);

      logger.info('ElGamal keys generated and transaction prepared', {
        electionId,
        publicKey: keys.publicKey.slice(0, 10) + '...',
        privateKeyStored: '🔒 encrypted',
        ipfsBackup: backupInfo.hasIPFS ? '✅ backed up' : '⚠️  no backup'
      });

      // ⚠️ IMPORTANT: La clé privée est retournée UNE SEULE FOIS ici
      // L'organisateur DOIT la télécharger et la stocker de manière sécurisée
      // Elle ne sera PLUS JAMAIS accessible via l'API
      res.status(200).json({
        success: true,
        message: backupInfo.hasIPFS
          ? 'ElGamal encryption setup successfully. Private key stored locally AND backed up on IPFS. IMPORTANT: Download and securely store your private key.'
          : 'ElGamal encryption setup successfully. Private key stored locally (IPFS backup failed). IMPORTANT: Download and securely store your private key.',
        data: {
          electionId,
          publicKey: keys.publicKey,
          privateKey: keys.privateKey, // ⚠️ Retourné UNE SEULE FOIS - À télécharger immédiatement
          privateKeyWarning: 'CRITICAL: Save this private key securely. You will need it to decrypt votes after election closure. It cannot be recovered if lost.',
          metadata,
          transaction, // Transaction à signer par l'organisateur
          backup: {
            local: backupInfo.hasLocal,
            ipfs: backupInfo.hasIPFS,
            ipfsHash: backupInfo.ipfsHash,
            ipfsUrl: backupInfo.ipfsUrl
          }
        },
      });
    } catch (error: any) {
      logger.error('Error setting up ElGamal encryption', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Récupérer la clé publique ElGamal d'une élection depuis le smart contract
   * Utilisé par les électeurs pour chiffrer leur vote
   */
  getElGamalPublicKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      logger.info('Fetching ElGamal public key from smart contract', { electionId });

      // Récupérer la clé publique depuis le smart contract
      const publicKey = await multiversxService.getElectionPublicKey(electionId);

      if (!publicKey) {
        res.status(404).json({
          success: false,
          error: 'Cette élection n\'a pas de clé publique ElGamal configurée'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          electionId,
          publicKey,
          algorithm: 'ElGamal on secp256k1',
          keyLength: 256,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching ElGamal public key', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Déchiffrer les votes privés après clôture de l'élection
   * Réservé à l'organisateur
   */
  decryptPrivateVotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      // ✅ VALIDATION: Validate request body
      const validation = validateDecryptVotesRequest(req.body);
      if (!validation.valid) {
        logger.warn('Invalid decrypt votes request', { error: validation.error });
        res.status(400).json({
          success: false,
          error: validation.error
        });
        return;
      }

      const { privateKey, organizerAddress } = validation.data!;

      logger.info('Decrypting private votes', {
        electionId,
        organizerAddress,
        hasPrivateKey: !!privateKey,
        privateKeyLength: privateKey.length,
        privateKeyPreview: privateKey.substring(0, 10) + '...'
      });

      // 1. ✅ VALIDATION: Verify election exists and is closed
      const election = await multiversxService.getElection(electionId);
      if (!election) {
        logger.warn('Election not found', { electionId });
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      if (election.status !== 'Closed' && election.status !== 'Finalized') {
        logger.warn('Election not closed, cannot decrypt', { electionId, status: election.status });
        res.status(400).json({
          success: false,
          error: 'Election must be closed before decrypting votes. Current status: ' + election.status
        });
        return;
      }

      // 2. ✅ AUTHORIZATION: Verify user can decrypt votes (organizer or co-organizer with permission)
      if (organizerAddress) {
        // Initialiser le système de co-organisateurs si pas encore fait
        const existingCoOrgs = coOrganizersService.getElectionOrganizers(electionId);
        if (!existingCoOrgs) {
          await coOrganizersService.initializeElection(electionId, election!.organizer);
        }

        if (!coOrganizersService.canDecryptVotes(electionId, organizerAddress)) {
          logger.warn('Unauthorized decryption attempt', {
            electionId,
            organizerAddress,
            actualOrganizer: election.organizer
          });
          res.status(403).json({
            success: false,
            error: 'You do not have permission to decrypt votes for this election'
          });
          return;
        }
      }

      // 3. ✅ VALIDATION: Verify private key matches the public key on-chain
      try {
        const publicKeyOnChain = await multiversxService.getElectionPublicKey(electionId);
        if (!publicKeyOnChain) {
          logger.error('No public key found on-chain for election', { electionId });
          res.status(404).json({
            success: false,
            error: 'No ElGamal public key found for this election. Was encryption setup?'
          });
          return;
        }

        const isValid = elgamalService.verifyKeyPair(publicKeyOnChain, privateKey);
        if (!isValid) {
          logger.error('Private key does not match public key on-chain', { electionId });
          res.status(400).json({
            success: false,
            error: 'Invalid private key: does not match the public key stored on-chain'
          });
          return;
        }

        logger.info('✅ Private key verified successfully', { electionId });
      } catch (error: any) {
        logger.error('Error verifying private key', { error: error.message });
        res.status(500).json({
          success: false,
          error: 'Failed to verify private key: ' + error.message
        });
        return;
      }

      // 3. Déterminer le type de chiffrement et récupérer les votes appropriés
      const encryptionType = election.encryption_type || 0;
      logger.info('Fetching encrypted votes from blockchain', { electionId, encryptionType });

      let encryptedVotes: Array<{ c1: string; c2: string; timestamp: number }> = [];

      if (encryptionType === 1) {
        // Option 1: ElGamal simple
        logger.info('Using Option 1 decryption (ElGamal simple)');
        encryptedVotes = await multiversxService.getEncryptedVotes(electionId);
      } else if (encryptionType === 2) {
        // Option 2: ElGamal + zk-SNARK
        logger.info('Using Option 2 decryption (ElGamal + zk-SNARK)');
        const votesWithProof = await multiversxService.getEncryptedVotesWithProof(electionId);
        // Convert to the same format as Option 1 (we don't need nullifier for decryption)
        encryptedVotes = votesWithProof.map(vote => ({
          c1: vote.c1,
          c2: vote.c2,
          timestamp: vote.timestamp
        }));
      } else {
        logger.warn('Unsupported encryption type', { encryptionType });
        res.status(400).json({
          success: false,
          error: `Unsupported encryption type: ${encryptionType}. This election does not use ElGamal encryption.`
        });
        return;
      }

      if (encryptedVotes.length === 0) {
        res.status(200).json({
          success: true,
          message: 'Aucun vote chiffré trouvé pour cette élection',
          data: {
            electionId,
            encryptionType,
            results: {},
            totalVotes: 0,
            decryptedAt: new Date().toISOString()
          }
        });
        return;
      }

      // 4. Déchiffrer et compter les votes (même algorithme pour Option 1 et Option 2)
      const results = elgamalService.tallyVotes(encryptedVotes, privateKey);

      logger.info('Votes decrypted successfully', {
        electionId,
        totalVotes: results.totalVotes,
        results: results.results
      });

      // Notify via WebSocket
      websocketService.notifyElection(electionId, 'vote:decrypted', {
        electionId,
        totalVotes: results.totalVotes,
        candidateCount: Object.keys(results.results).length,
        decryptedBy: organizerAddress
      });

      res.status(200).json({
        success: true,
        message: 'Votes decrypted successfully',
        data: {
          electionId,
          encryptionType,
          results: results.results,
          totalVotes: results.totalVotes,
          decryptedAt: results.decryptedAt,
          status: 'decrypted'
        },
      });
    } catch (error: any) {
      logger.error('Error decrypting private votes', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Ajouter un co-organisateur à une élection
   * Seul l'organisateur principal ou un co-organizer avec permission peut ajouter d'autres co-organisateurs
   */
  addCoOrganizer = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);
      const { coOrganizerAddress, requestedBy, permissions } = req.body;

      logger.info('Adding co-organizer', { electionId, coOrganizerAddress, requestedBy });

      // Vérifier que l'élection existe
      const election = await multiversxService.getElection(electionId);
      if (!election) {
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      // Initialiser le système de co-organisateurs si pas encore fait
      const existingCoOrgs = coOrganizersService.getElectionOrganizers(electionId);
      if (!existingCoOrgs) {
        await coOrganizersService.initializeElection(electionId, election!.organizer);
      }

      // Vérifier que l'utilisateur qui fait la requête a la permission d'ajouter des co-organisateurs
      if (!coOrganizersService.canAddCoOrganizers(electionId, requestedBy)) {
        logger.warn('Unauthorized attempt to add co-organizer', { electionId, requestedBy });
        res.status(403).json({
          success: false,
          error: 'You do not have permission to add co-organizers to this election'
        });
        return;
      }

      // Ajouter le co-organisateur
      await coOrganizersService.addCoOrganizer(
        electionId,
        coOrganizerAddress,
        requestedBy,
        permissions
      );

      // Notify via WebSocket
      websocketService.notifyElection(electionId, 'coorganizer:added', {
        electionId,
        address: coOrganizerAddress,
        addedBy: requestedBy,
        permissions
      });

      websocketService.notifyOrganizer(election!.organizer, 'coorganizer:added', {
        electionId,
        address: coOrganizerAddress,
        addedBy: requestedBy
      });

      res.status(200).json({
        success: true,
        message: 'Co-organizer added successfully',
        data: {
          electionId,
          coOrganizer: coOrganizerAddress,
          permissions
        }
      });
    } catch (error: any) {
      logger.error('Error adding co-organizer', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Retirer un co-organisateur d'une élection
   */
  removeCoOrganizer = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);
      const { coOrganizerAddress, requestedBy } = req.body;

      logger.info('Removing co-organizer', { electionId, coOrganizerAddress, requestedBy });

      // Vérifier que l'utilisateur qui fait la requête a la permission
      if (!coOrganizersService.canAddCoOrganizers(electionId, requestedBy)) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to remove co-organizers'
        });
        return;
      }

      await coOrganizersService.removeCoOrganizer(electionId, coOrganizerAddress, requestedBy);

      // Notify via WebSocket
      websocketService.notifyElection(electionId, 'coorganizer:removed', {
        electionId,
        address: coOrganizerAddress,
        removedBy: requestedBy
      });

      res.status(200).json({
        success: true,
        message: 'Co-organizer removed successfully',
        data: {
          electionId,
          coOrganizer: coOrganizerAddress
        }
      });
    } catch (error: any) {
      logger.error('Error removing co-organizer', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Obtenir la liste des organisateurs d'une élection
   */
  getElectionOrganizers = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      let organizers = coOrganizersService.getElectionOrganizers(electionId);

      // Si l'élection n'est pas initialisée, récupérer l'organisateur depuis la blockchain
      if (!organizers) {
        logger.info('Election not initialized for co-organizers, fetching from blockchain', { electionId });

        const election = await multiversxService.getElection(electionId);

        if (!election) {
          res.status(404).json({
            success: false,
            error: 'Election not found'
          });
          return;
        }

        // Auto-initialiser avec l'organisateur principal uniquement
        coOrganizersService.initializeElection(electionId, election.organizer);
        organizers = coOrganizersService.getElectionOrganizers(electionId);
      }

      res.status(200).json({
        success: true,
        data: {
          electionId,
          primaryOrganizer: organizers!.primaryOrganizer,
          coOrganizers: organizers!.coOrganizers.map(co => ({
            address: co.address,
            addedAt: co.addedAt,
            addedBy: co.addedBy,
            permissions: co.permissions
          }))
        }
      });
    } catch (error: any) {
      logger.error('Error getting election organizers', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Notifier d'un événement de transaction réussie
   * Endpoint appelé par le frontend après confirmation on-chain
   */
  notifyTransactionEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);
      const { eventType, txHash, data } = req.body;

      logger.info('Transaction event notification received', { electionId, eventType, txHash });

      // Valider le type d'événement
      const validEvents = ['vote:received', 'election:activated', 'election:closed', 'election:finalized', 'candidate:added'];
      if (!validEvents.includes(eventType)) {
        res.status(400).json({
          success: false,
          error: `Invalid event type. Must be one of: ${validEvents.join(', ')}`
        });
        return;
      }

      // Préparer les données spécifiques selon le type d'événement
      let notificationData: any = { electionId, txHash, timestamp: new Date().toISOString() };

      switch (eventType) {
        case 'vote:received':
          const totalVotes = await multiversxService.getTotalVotes(electionId);
          notificationData.totalVotes = totalVotes;
          break;

        case 'election:activated':
          notificationData.status = 'active';
          break;

        case 'election:closed':
          notificationData.status = 'closed';
          break;

        case 'election:finalized':
          notificationData.status = 'finalized';
          break;

        case 'candidate:added':
          notificationData.candidateName = data?.candidateName || 'Unknown';
          break;
      }

      // Émettre la notification WebSocket
      websocketService.notifyElection(electionId, eventType, notificationData);

      // Si c'est un événement important, notifier aussi l'organisateur
      if (['election:activated', 'election:closed', 'election:finalized'].includes(eventType)) {
        const election = await multiversxService.getElection(electionId);
        if (election) {
          websocketService.notifyOrganizer(election.organizer, eventType, notificationData);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Notification sent successfully'
      });
    } catch (error: any) {
      logger.error('Error sending transaction event notification', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Envoyer des invitations par email
   * POST /api/elections/:id/send-invitations-email
   *
   * @body emails - Liste d'emails (séparés par virgule, espace, ou retour ligne)
   * @body invitationCodes - Liste de codes d'invitation générés
   */
  sendInvitationsByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);
      const { emails, invitationCodes } = req.body;

      // Validation
      if (!emails || !invitationCodes) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: emails and invitationCodes'
        });
        return;
      }

      if (!Array.isArray(invitationCodes) || invitationCodes.length === 0) {
        res.status(400).json({
          success: false,
          error: 'invitationCodes must be a non-empty array'
        });
        return;
      }

      // Vérifier que SendGrid est configuré
      if (!EmailService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: 'Email service not configured. Please set SENDGRID_API_KEY in environment variables.'
        });
        return;
      }

      // Extraire et valider les emails
      const emailsList = typeof emails === 'string'
        ? EmailService.extractEmails(emails)
        : emails;

      if (emailsList.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid email addresses found'
        });
        return;
      }

      // Vérifier qu'on a assez de codes
      if (emailsList.length > invitationCodes.length) {
        res.status(400).json({
          success: false,
          error: `Not enough invitation codes. You have ${invitationCodes.length} codes but ${emailsList.length} emails.`
        });
        return;
      }

      logger.info('Sending invitation emails', {
        electionId,
        emailCount: emailsList.length,
        codeCount: invitationCodes.length
      });

      // Récupérer les infos de l'élection
      const election = await multiversxService.getElection(electionId);
      if (!election) {
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      // Préparer les invitations (1 email = 1 code)
      const invitations = emailsList.map((email: string, index: number) => ({
        to: email,
        electionId: electionId,
        electionTitle: election.title,
        organizerName: election.organizer,
        invitationCode: invitationCodes[index],
        expirationDate: new Date(election.end_time * 1000).toLocaleDateString('fr-FR')
      }));

      // Envoyer les emails en masse
      const results = await EmailService.sendBulkInvitations(invitations, 100); // 100ms entre chaque email

      // Analyser les résultats
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const failedEmails = results.filter(r => !r.success).map(r => ({
        email: r.email,
        error: r.error
      }));

      logger.info('Email sending completed', {
        electionId,
        successCount,
        failureCount
      });

      res.status(200).json({
        success: true,
        data: {
          totalEmails: emailsList.length,
          successCount,
          failureCount,
          results: results.map(r => ({
            email: r.email,
            success: r.success,
            messageId: r.messageId,
            error: r.error
          })),
          failedEmails: failedEmails.length > 0 ? failedEmails : undefined
        }
      });
    } catch (error: any) {
      logger.error('Error sending invitation emails', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Envoyer un email de test
   * POST /api/elections/test-email
   */
  sendTestEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email address is required'
        });
        return;
      }

      // Vérifier que SendGrid est configuré
      if (!EmailService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: 'Email service not configured. Please set SENDGRID_API_KEY in environment variables.'
        });
        return;
      }

      logger.info('Sending test email', { email });

      const result = await EmailService.sendTestEmail(email);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Test email sent successfully',
          data: {
            email: result.email,
            messageId: result.messageId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      logger.error('Error sending test email', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Obtenir des statistiques détaillées pour le dashboard
   * GET /api/elections/stats/detailed
   */
  getDetailedStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Pour l'instant, on retourne des stats basiques
      // car l'indexation complète n'est pas implémentée
      logger.info('Getting detailed stats (simplified version)');

      res.status(200).json({
        success: true,
        message: 'Detailed stats require full event indexing',
        data: {
          note: 'Use frontend to aggregate elections data from user-specific queries'
        }
      });
    } catch (error: any) {
      logger.error('Error getting detailed stats', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Obtenir l'évolution des votes dans le temps pour une élection
   * GET /api/elections/:id/stats/votes-timeline
   */
  getVotesTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      // Récupérer l'élection
      const election = await multiversxService.getElection(electionId);
      if (!election) {
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      // Pour le moment, on simule une progression temporelle
      // En production, il faudrait tracker les timestamps des votes réels
      const timeline = this.simulateVotesTimeline(election);

      res.status(200).json({
        success: true,
        data: timeline
      });
    } catch (error: any) {
      logger.error('Error getting votes timeline', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };


  /**
   * Helper: Générer une timeline de votes réaliste avec statistiques avancées
   */
  private simulateVotesTimeline(election: any): any {
    const startTime = election.start_time * 1000;
    const endTime = election.end_time * 1000;
    const now = Date.now();
    const duration = endTime - startTime;
    const elapsed = Math.min(now - startTime, duration);

    // Si l'élection n'a pas encore commencé
    if (now < startTime) {
      return {
        timeline: [],
        stats: {
          peakHour: null,
          peakVotes: 0,
          averageVotesPerHour: 0,
          quietestHour: null,
          quietestVotes: 0,
          currentTrend: 'not-started',
          predictedFinalTurnout: 0,
          predictedFinalVotes: 0
        }
      };
    }

    // Créer des points de données PAR HEURE pour plus de granularité
    const hoursElapsed = Math.ceil(elapsed / (1000 * 60 * 60));
    const hourlyInterval = 1000 * 60 * 60; // 1 heure en millisecondes
    const timeline = [];
    const hourlyVotes = [];

    // Simuler une distribution réaliste des votes
    // Généralement : pic au début, pic en fin de journée, creux la nuit
    let cumulativeVotes = 0;
    const totalVotes = election.total_votes;

    for (let i = 0; i <= hoursElapsed; i++) {
      const timestamp = startTime + (hourlyInterval * i);
      if (timestamp > now) break;

      // Calculer les votes pour cette heure
      const hour = new Date(timestamp).getHours();
      const dayOfWeek = new Date(timestamp).getDay();

      // Facteur basé sur l'heure de la journée (comportement réaliste)
      let hourFactor = 1;
      if (hour >= 8 && hour <= 10) hourFactor = 1.5; // Pic matin
      else if (hour >= 12 && hour <= 14) hourFactor = 1.3; // Pic midi
      else if (hour >= 17 && hour <= 20) hourFactor = 1.6; // Pic soir (max)
      else if (hour >= 0 && hour <= 6) hourFactor = 0.2; // Creux nuit
      else if (hour >= 22 && hour <= 23) hourFactor = 0.4; // Creux tard

      // Facteur basé sur le jour (week-end vs semaine)
      let dayFactor = 1;
      if (dayOfWeek === 0 || dayOfWeek === 6) dayFactor = 0.7; // Week-end moins actif

      // Facteur basé sur la progression (rush de dernière minute)
      const progressPercent = (elapsed > 0) ? (i * hourlyInterval) / elapsed : 0;
      let urgencyFactor = 1;
      if (progressPercent > 0.8) urgencyFactor = 1.4; // Rush final
      else if (progressPercent > 0.9) urgencyFactor = 1.8; // Rush extrême

      // Calculer les votes pour cette heure
      const baseVotesPerHour = totalVotes / Math.max(hoursElapsed, 1);
      const votesThisHour = Math.round(
        baseVotesPerHour * hourFactor * dayFactor * urgencyFactor * (0.8 + Math.random() * 0.4)
      );

      cumulativeVotes = Math.min(cumulativeVotes + votesThisHour, totalVotes);
      hourlyVotes.push(votesThisHour);

      const date = new Date(timestamp);
      timeline.push({
        timestamp,
        date: date.toLocaleString('fr-FR'),
        hour: `${date.getHours()}h`,
        dayOfWeek: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
        votes: cumulativeVotes,
        votesThisHour,
        percentage: election.registered_voters_count > 0
          ? Math.round((cumulativeVotes / election.registered_voters_count) * 100)
          : 0,
        turnoutRate: election.registered_voters_count > 0
          ? ((cumulativeVotes / election.registered_voters_count) * 100).toFixed(1)
          : '0.0'
      });
    }

    // Calculer les statistiques avancées
    const stats = this.calculateTimelineStats(timeline, hourlyVotes, election, elapsed, duration);

    return {
      timeline,
      stats
    };
  }

  /**
   * Calculer les statistiques avancées de la timeline
   */
  private calculateTimelineStats(timeline: any[], hourlyVotes: number[], election: any, elapsed: number, duration: number): any {
    if (timeline.length === 0) {
      return {
        peakHour: null,
        peakVotes: 0,
        averageVotesPerHour: 0,
        quietestHour: null,
        quietestVotes: 0,
        currentTrend: 'stable',
        predictedFinalTurnout: 0,
        predictedFinalVotes: 0
      };
    }

    // Trouver le pic
    let peakIndex = 0;
    let peakVotes = 0;
    for (let i = 0; i < hourlyVotes.length; i++) {
      if (hourlyVotes[i] > peakVotes) {
        peakVotes = hourlyVotes[i];
        peakIndex = i;
      }
    }

    // Trouver l'heure la plus calme
    let quietestIndex = 0;
    let quietestVotes = Infinity;
    for (let i = 0; i < hourlyVotes.length; i++) {
      if (hourlyVotes[i] < quietestVotes) {
        quietestVotes = hourlyVotes[i];
        quietestIndex = i;
      }
    }

    // Moyenne des votes par heure
    const averageVotesPerHour = hourlyVotes.length > 0
      ? Math.round(hourlyVotes.reduce((a, b) => a + b, 0) / hourlyVotes.length)
      : 0;

    // Déterminer la tendance actuelle (3 dernières heures)
    let currentTrend = 'stable';
    if (hourlyVotes.length >= 3) {
      const recent = hourlyVotes.slice(-3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

      if (recentAvg > averageVotesPerHour * 1.2) {
        currentTrend = 'increasing';
      } else if (recentAvg < averageVotesPerHour * 0.8) {
        currentTrend = 'decreasing';
      }
    }

    // Prédiction finale basée sur la tendance actuelle
    const currentVotes = election.total_votes;
    const registeredVoters = election.registered_voters_count || 0;
    const hoursRemaining = Math.max(0, (duration - elapsed) / (1000 * 60 * 60));

    let predictedFinalVotes = currentVotes;
    if (hoursRemaining > 0 && averageVotesPerHour > 0) {
      // Prédiction simple : votes actuels + (moyenne par heure × heures restantes × facteur tendance)
      let trendFactor = 1;
      if (currentTrend === 'increasing') trendFactor = 1.2;
      else if (currentTrend === 'decreasing') trendFactor = 0.8;

      const predictedRemainingVotes = Math.round(averageVotesPerHour * hoursRemaining * trendFactor);
      predictedFinalVotes = Math.min(currentVotes + predictedRemainingVotes, registeredVoters);
    }

    const predictedFinalTurnout = registeredVoters > 0
      ? ((predictedFinalVotes / registeredVoters) * 100).toFixed(1)
      : '0.0';

    return {
      peakHour: timeline[peakIndex]?.hour || null,
      peakHourTimestamp: timeline[peakIndex]?.timestamp || null,
      peakVotes,
      averageVotesPerHour,
      quietestHour: timeline[quietestIndex]?.hour || null,
      quietestHourTimestamp: timeline[quietestIndex]?.timestamp || null,
      quietestVotes,
      currentTrend,
      hoursRemaining: Math.round(hoursRemaining),
      predictedFinalTurnout: parseFloat(predictedFinalTurnout),
      predictedFinalVotes,
      currentTurnout: registeredVoters > 0
        ? ((currentVotes / registeredVoters) * 100).toFixed(1)
        : '0.0'
    };
  }

  /**
   * Envoyer un code OTP par SMS
   * POST /api/elections/:id/send-otp
   */
  sendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
        return;
      }

      // Récupérer l'élection pour le titre
      const election = await multiversxService.getElection(electionId);
      if (!election) {
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      logger.info('Sending OTP via SMS', { electionId, phoneNumber });

      // Import dynamique du service SMS
      const { SMSService } = await import('../services/smsService');
      const result = await SMSService.sendOTP(phoneNumber, electionId, election.title);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'OTP sent successfully',
          data: {
            phoneNumber: result.phoneNumber,
            messageId: result.messageId
          }
        });
      } else {
        res.status(result.retryAfter ? 429 : 500).json({
          success: false,
          error: result.error,
          retryAfter: result.retryAfter
        });
      }
    } catch (error: any) {
      logger.error('Error sending OTP', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Vérifier un code OTP
   * POST /api/elections/:id/verify-otp
   */
  verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        res.status(400).json({
          success: false,
          error: 'Phone number and code are required'
        });
        return;
      }

      logger.info('Verifying OTP', { phoneNumber });

      // Import dynamique du service SMS
      const { SMSService } = await import('../services/smsService');
      const result = await SMSService.verifyOTP(phoneNumber, code);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'OTP verified successfully',
          data: {
            phoneNumber: result.phoneNumber
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          attemptsRemaining: result.attemptsRemaining
        });
      }
    } catch (error: any) {
      logger.error('Error verifying OTP', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Envoyer des invitations par SMS en masse
   * POST /api/elections/:id/send-invitations-sms
   */
  sendInvitationsBySMS = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);
      const { phoneNumbers } = req.body;

      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Phone numbers array is required'
        });
        return;
      }

      // Récupérer l'élection
      const election = await multiversxService.getElection(electionId);
      if (!election) {
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      logger.info('Sending bulk SMS invitations', {
        electionId,
        count: phoneNumbers.length
      });

      // Import dynamique du service SMS
      const { SMSService } = await import('../services/smsService');
      const results = await SMSService.sendBulkOTP(
        phoneNumbers,
        electionId,
        election.title
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.status(200).json({
        success: true,
        message: `SMS invitations sent: ${successCount} success, ${failureCount} failed`,
        data: {
          total: results.length,
          success: successCount,
          failed: failureCount,
          results
        }
      });
    } catch (error: any) {
      logger.error('Error sending bulk SMS', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Envoyer un SMS de test
   * POST /api/elections/test-sms
   */
  sendTestSMS = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
        return;
      }

      logger.info('Sending test SMS', { phoneNumber });

      // Import dynamique du service SMS
      const { SMSService } = await import('../services/smsService');
      const result = await SMSService.sendOTP(
        phoneNumber,
        0,
        'Test DEMOCRATIX'
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Test SMS sent successfully',
          data: {
            phoneNumber: result.phoneNumber,
            messageId: result.messageId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          retryAfter: result.retryAfter
        });
      }
    } catch (error: any) {
      logger.error('Error sending test SMS', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Prépare les résultats finaux pour la finalisation
   * Calcule les totaux de votes et uploade les résultats détaillés sur IPFS
   * POST /api/elections/:id/prepare-final-results
   */
  prepareFinalResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const electionId = parseInt(req.params.id);

      logger.info('🔍 Preparing final results for election', { electionId });

      // 1. Récupérer l'élection
      const election = await multiversxService.getElection(electionId);
      if (!election) {
        res.status(404).json({
          success: false,
          error: 'Election not found'
        });
        return;
      }

      // Vérifier que l'élection est fermée
      if (election.status !== 'Closed') {
        res.status(400).json({
          success: false,
          error: 'Election must be Closed to finalize results'
        });
        return;
      }

      // 2. Récupérer les candidats
      const candidates = await multiversxService.getElectionCandidates(electionId);
      if (!candidates || candidates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No candidates found for this election'
        });
        return;
      }

      // 3. Calculer les résultats totaux par candidat
      const candidateResults: Array<{ candidate_id: number; votes: number; name: string }> = [];

      for (const candidate of candidates) {
        let totalVotes = 0;

        // Votes publics (Option 0)
        if (election.encryption_type === 0) {
          const publicVotes = await multiversxService.getCandidateVotes(electionId, candidate.id);
          totalVotes += publicVotes;
        }

        // Votes ElGamal déchiffrés (Options 1 et 2) - depuis le body de la requête
        const elgamalDecryptedVotes = req.body.elgamalDecryptedVotes;
        if (elgamalDecryptedVotes && elgamalDecryptedVotes[candidate.id]) {
          totalVotes += elgamalDecryptedVotes[candidate.id];
        }

        candidateResults.push({
          candidate_id: candidate.id,
          votes: totalVotes,
          name: candidate.name
        });
      }

      // Trier par nombre de votes décroissant
      candidateResults.sort((a, b) => b.votes - a.votes);

      // 4. Créer le JSON détaillé des résultats
      const detailedResults = {
        electionId,
        electionTitle: election.title,
        totalVotes: election.total_votes,
        encryptionType: election.encryption_type,
        finalizedAt: new Date().toISOString(),
        candidates: candidateResults.map((r, index) => ({
          rank: index + 1,
          candidate_id: r.candidate_id,
          name: r.name,
          votes: r.votes,
          percentage: election.total_votes > 0
            ? ((r.votes / election.total_votes) * 100).toFixed(2)
            : '0.00'
        })),
        winner: candidateResults[0] || null,
        metadata: {
          startTime: election.start_time,
          endTime: election.end_time,
          registeredVoters: election.registered_voters_count,
          turnout: election.registered_voters_count > 0
            ? ((election.total_votes / election.registered_voters_count) * 100).toFixed(2)
            : '0.00'
        }
      };

      logger.info('📊 Results calculated', {
        electionId,
        totalVotes: election.total_votes,
        candidatesCount: candidateResults.length
      });

      // 5. Uploader les résultats détaillés sur IPFS
      let ipfsHash: string | undefined;
      try {
        const ipfsName = `election-${electionId}-final-results-${Date.now()}.json`;
        ipfsHash = await ipfsService.uploadJSON(detailedResults, ipfsName);

        logger.info('✅ Results uploaded to IPFS', {
          electionId,
          ipfsHash,
          url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        });
      } catch (ipfsError: any) {
        logger.warn('⚠️  IPFS upload failed (continuing without IPFS hash)', {
          electionId,
          error: ipfsError.message
        });
        // Continue sans hash IPFS (optionnel)
      }

      // 6. Retourner les données pour la transaction blockchain
      res.status(200).json({
        success: true,
        message: 'Final results prepared successfully',
        data: {
          electionId,
          results: candidateResults.map(r => ({
            candidate_id: r.candidate_id,
            votes: r.votes
          })),
          ipfsHash,
          ipfsUrl: ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : undefined,
          detailedResults
        }
      });

    } catch (error: any) {
      logger.error('❌ Error preparing final results', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({
        success: false,
        error: 'Failed to prepare final results',
        details: error.message
      });
    }
  };
}

// Export singleton
export const electionController = new ElectionController();
