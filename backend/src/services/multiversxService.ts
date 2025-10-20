import {
  ApiNetworkProvider,
  ProxyNetworkProvider,
} from '@multiversx/sdk-network-providers';
import {
  Address,
  SmartContract,
  AbiRegistry,
  ResultsParser,
  Transaction,
  TransactionWatcher,
  Account,
  U64Value,
  BytesValue,
  StringValue,
  VariadicValue,
  Struct,
  Field,
} from '@multiversx/sdk-core';
import { logger } from '../utils/logger';

export interface ElectionData {
  id: number;
  title: string;
  description_ipfs: string;
  organizer: string;
  start_time: number;
  end_time: number;
  candidates: Array<{
    id: number;
    name: string;
    description_ipfs: string;
  }>;
  status: string;
  total_votes: number;
}

/**
 * Service pour interagir avec les smart contracts MultiversX
 */
export class MultiversXService {
  private networkProvider: ApiNetworkProvider;
  private proxyProvider: ProxyNetworkProvider;
  private votingContract: SmartContract;
  private voterRegistryContract: SmartContract;
  private resultsParser: ResultsParser;

  constructor() {
    const apiUrl = process.env.MULTIVERSX_API_URL || 'https://devnet-api.multiversx.com';
    const gatewayUrl = process.env.MULTIVERSX_GATEWAY_URL || 'https://devnet-gateway.multiversx.com';

    this.networkProvider = new ApiNetworkProvider(apiUrl);
    this.proxyProvider = new ProxyNetworkProvider(gatewayUrl);

    const votingContractAddress = process.env.VOTING_CONTRACT || '';
    const voterRegistryAddress = process.env.VOTER_REGISTRY_CONTRACT || '';

    this.votingContract = new SmartContract({
      address: new Address(votingContractAddress),
    });

    this.voterRegistryContract = new SmartContract({
      address: new Address(voterRegistryAddress),
    });

    this.resultsParser = new ResultsParser();

    logger.info('MultiversXService initialized', {
      network: process.env.MULTIVERSX_NETWORK,
      votingContract: votingContractAddress,
      voterRegistryContract: voterRegistryAddress,
    });
  }

  /**
   * Créer une élection sur la blockchain
   *
   * NOTE: Cette fonction prépare la transaction mais ne la signe pas.
   * La signature doit être faite côté frontend avec le wallet de l'utilisateur.
   */
  prepareCreateElectionTransaction(params: {
    title: string;
    descriptionIpfs: string;
    startTime: number;
    endTime: number;
    candidates: Array<{
      id: number;
      name: string;
      description_ipfs: string;
    }>;
    sender: string;
  }): Transaction {
    try {
      logger.info('Preparing create election transaction', {
        title: params.title,
        candidatesCount: params.candidates.length,
      });

      // Convertir les candidats en format attendu par le smart contract
      const candidatesArgs = params.candidates.map(c =>
        Struct.fromJSON({
          id: new U64Value(c.id),
          name: BytesValue.fromUTF8(c.name),
          description_ipfs: BytesValue.fromUTF8(c.description_ipfs),
        })
      );

      const transaction = this.votingContract.methods
        .createElection([
          BytesValue.fromUTF8(params.title),
          BytesValue.fromUTF8(params.descriptionIpfs),
          new U64Value(params.startTime),
          new U64Value(params.endTime),
          VariadicValue.fromItems(...candidatesArgs),
        ])
        .withSender(new Address(params.sender))
        .withGasLimit(20_000_000)
        .withChainID(process.env.MULTIVERSX_NETWORK === 'mainnet' ? 1 : 'D')
        .buildTransaction();

      return transaction;
    } catch (error: any) {
      logger.error('Error preparing create election transaction', {
        error: error.message,
      });
      throw new Error(`Failed to prepare transaction: ${error.message}`);
    }
  }

  /**
   * Récupérer une élection depuis la blockchain
   */
  async getElection(electionId: number): Promise<ElectionData | null> {
    try {
      logger.info('Fetching election from blockchain', { electionId });

      const query = this.votingContract.methods
        .getElection([new U64Value(electionId)])
        .buildQuery();

      const queryResponse = await this.networkProvider.queryContract(query);

      if (!queryResponse.returnData || queryResponse.returnData.length === 0) {
        logger.warn('Election not found', { electionId });
        return null;
      }

      // Parser la réponse (à adapter selon le format exact retourné par le SC)
      const parsedResults = this.resultsParser.parseQueryResponse(
        queryResponse,
        this.votingContract.getEndpoint('getElection')
      );

      // Convertir en ElectionData (à adapter selon la structure exacte)
      const election: ElectionData = {
        id: electionId,
        title: parsedResults.values[0].valueOf(),
        description_ipfs: parsedResults.values[1].valueOf(),
        organizer: parsedResults.values[2].valueOf().bech32(),
        start_time: parsedResults.values[3].valueOf().toNumber(),
        end_time: parsedResults.values[4].valueOf().toNumber(),
        candidates: parsedResults.values[5].valueOf(),
        status: parsedResults.values[6].valueOf(),
        total_votes: parsedResults.values[7].valueOf().toNumber(),
      };

      logger.info('Election fetched successfully', { electionId });
      return election;
    } catch (error: any) {
      logger.error('Error fetching election', {
        error: error.message,
        electionId,
      });
      throw new Error(`Failed to fetch election: ${error.message}`);
    }
  }

  /**
   * Récupérer le nombre total de votes pour une élection
   */
  async getTotalVotes(electionId: number): Promise<number> {
    try {
      const query = this.votingContract.methods
        .getTotalVotes([new U64Value(electionId)])
        .buildQuery();

      const queryResponse = await this.networkProvider.queryContract(query);
      const parsedResults = this.resultsParser.parseQueryResponse(
        queryResponse,
        this.votingContract.getEndpoint('getTotalVotes')
      );

      const totalVotes = parsedResults.values[0].valueOf().toNumber();

      logger.info('Total votes fetched', { electionId, totalVotes });
      return totalVotes;
    } catch (error: any) {
      logger.error('Error fetching total votes', {
        error: error.message,
        electionId,
      });
      throw new Error(`Failed to fetch total votes: ${error.message}`);
    }
  }

  /**
   * Préparer une transaction d'enregistrement d'électeur
   */
  prepareRegisterVoterTransaction(params: {
    electionId: number;
    credentialProof: string;
    sender: string;
  }): Transaction {
    try {
      logger.info('Preparing register voter transaction', {
        electionId: params.electionId,
      });

      const transaction = this.voterRegistryContract.methods
        .registerVoter([
          new U64Value(params.electionId),
          BytesValue.fromHex(params.credentialProof),
        ])
        .withSender(new Address(params.sender))
        .withGasLimit(10_000_000)
        .withChainID(process.env.MULTIVERSX_NETWORK === 'mainnet' ? 1 : 'D')
        .buildTransaction();

      return transaction;
    } catch (error: any) {
      logger.error('Error preparing register voter transaction', {
        error: error.message,
      });
      throw new Error(`Failed to prepare transaction: ${error.message}`);
    }
  }

  /**
   * Vérifier si un token de vote est valide
   */
  async isTokenValid(electionId: number, token: string): Promise<boolean> {
    try {
      const query = this.voterRegistryContract.methods
        .isTokenValid([
          new U64Value(electionId),
          BytesValue.fromHex(token),
        ])
        .buildQuery();

      const queryResponse = await this.networkProvider.queryContract(query);
      const parsedResults = this.resultsParser.parseQueryResponse(
        queryResponse,
        this.voterRegistryContract.getEndpoint('isTokenValid')
      );

      const isValid = parsedResults.values[0].valueOf();

      logger.info('Token validation result', { electionId, isValid });
      return isValid;
    } catch (error: any) {
      logger.error('Error validating token', {
        error: error.message,
        electionId,
      });
      return false;
    }
  }

  /**
   * Préparer une transaction de vote
   */
  prepareCastVoteTransaction(params: {
    electionId: number;
    votingToken: string;
    encryptedVote: string;
    proof: string;
    sender: string;
  }): Transaction {
    try {
      logger.info('Preparing cast vote transaction', {
        electionId: params.electionId,
      });

      const encryptedVoteStruct = Struct.fromJSON({
        encrypted_choice: BytesValue.fromHex(params.encryptedVote),
        proof: BytesValue.fromHex(params.proof),
        timestamp: new U64Value(Math.floor(Date.now() / 1000)),
      });

      const transaction = this.votingContract.methods
        .castVote([
          new U64Value(params.electionId),
          BytesValue.fromHex(params.votingToken),
          encryptedVoteStruct,
        ])
        .withSender(new Address(params.sender))
        .withGasLimit(15_000_000)
        .withChainID(process.env.MULTIVERSX_NETWORK === 'mainnet' ? 1 : 'D')
        .buildTransaction();

      return transaction;
    } catch (error: any) {
      logger.error('Error preparing cast vote transaction', {
        error: error.message,
      });
      throw new Error(`Failed to prepare transaction: ${error.message}`);
    }
  }

  /**
   * Préparer une transaction d'activation d'élection
   */
  prepareActivateElectionTransaction(params: {
    electionId: number;
    sender: string;
  }): Transaction {
    try {
      const transaction = this.votingContract.methods
        .activateElection([new U64Value(params.electionId)])
        .withSender(new Address(params.sender))
        .withGasLimit(5_000_000)
        .withChainID(process.env.MULTIVERSX_NETWORK === 'mainnet' ? 1 : 'D')
        .buildTransaction();

      return transaction;
    } catch (error: any) {
      logger.error('Error preparing activate election transaction', {
        error: error.message,
      });
      throw new Error(`Failed to prepare transaction: ${error.message}`);
    }
  }

  /**
   * Préparer une transaction de fermeture d'élection
   */
  prepareCloseElectionTransaction(params: {
    electionId: number;
    sender: string;
  }): Transaction {
    try {
      const transaction = this.votingContract.methods
        .closeElection([new U64Value(params.electionId)])
        .withSender(new Address(params.sender))
        .withGasLimit(5_000_000)
        .withChainID(process.env.MULTIVERSX_NETWORK === 'mainnet' ? 1 : 'D')
        .buildTransaction();

      return transaction;
    } catch (error: any) {
      logger.error('Error preparing close election transaction', {
        error: error.message,
      });
      throw new Error(`Failed to prepare transaction: ${error.message}`);
    }
  }

  /**
   * Attendre qu'une transaction soit complétée
   */
  async waitForTransaction(txHash: string, timeout: number = 60000): Promise<boolean> {
    try {
      logger.info('Waiting for transaction', { txHash });

      const watcher = new TransactionWatcher(this.networkProvider);
      const transactionOnNetwork = await watcher.awaitCompleted({ getHash: () => txHash }, timeout);

      const isSuccessful = transactionOnNetwork.status.isSuccessful();

      logger.info('Transaction completed', { txHash, isSuccessful });
      return isSuccessful;
    } catch (error: any) {
      logger.error('Error waiting for transaction', {
        error: error.message,
        txHash,
      });
      return false;
    }
  }

  /**
   * Obtenir le statut du réseau
   */
  async getNetworkStatus(): Promise<any> {
    try {
      const networkConfig = await this.networkProvider.getNetworkConfig();
      const networkStatus = await this.networkProvider.getNetworkStatus();

      return {
        chainId: networkConfig.ChainID,
        gasPerDataByte: networkConfig.GasPerDataByte,
        minGasPrice: networkConfig.MinGasPrice,
        minGasLimit: networkConfig.MinGasLimit,
        roundsPerEpoch: networkStatus.RoundsPerEpoch,
        currentRound: networkStatus.CurrentRound,
      };
    } catch (error: any) {
      logger.error('Error fetching network status', {
        error: error.message,
      });
      throw new Error(`Failed to fetch network status: ${error.message}`);
    }
  }
}

// Export singleton
export const multiversxService = new MultiversXService();
