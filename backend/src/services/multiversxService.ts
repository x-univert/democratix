import {
  ApiNetworkProvider,
  ProxyNetworkProvider,
} from '@multiversx/sdk-network-providers';
import {
  Address,
  Transaction,
  TransactionWatcher,
  U64Value,
  BytesValue,
  VariadicValue,
  Struct,
  Field,
  SmartContractTransactionsFactory,
  SmartContractQuery,
  SmartContractTransactionsOutcomeParser,
  TransactionsFactoryConfig,
  TokenTransfer,
} from '@multiversx/sdk-core';
import { logger } from '../utils/logger';
import { CandidateType, EncryptedVoteType } from '../types/multiversxTypes';

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
 * Service pour interagir avec les smart contracts MultiversX (SDK v15)
 */
export class MultiversXService {
  private apiProvider: ApiNetworkProvider;
  private proxyProvider: ProxyNetworkProvider;
  private transactionsFactory: SmartContractTransactionsFactory;
  private outcomeParser: SmartContractTransactionsOutcomeParser;
  private votingContractAddress: Address;
  private voterRegistryAddress: Address;
  private chainID: string;

  /**
   * Helper: Encode u64 value to Uint8Array for queries
   */
  private encodeU64(value: number): Uint8Array {
    const hex = value.toString(16).padStart(16, '0');
    return this.hexToUint8Array(hex);
  }

  /**
   * Helper: Encode hex string to Uint8Array for queries
   */
  private encodeHex(hexValue: string): Uint8Array {
    // Remove '0x' prefix if present
    const hex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue;
    return this.hexToUint8Array(hex);
  }

  /**
   * Helper: Convert hex string to Uint8Array
   */
  private hexToUint8Array(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  constructor() {
    const apiUrl = process.env.MULTIVERSX_API_URL || 'https://devnet-api.multiversx.com';
    const gatewayUrl = process.env.MULTIVERSX_GATEWAY_URL || 'https://devnet-gateway.multiversx.com';

    this.apiProvider = new ApiNetworkProvider(apiUrl);
    this.proxyProvider = new ProxyNetworkProvider(gatewayUrl);

    const votingContract = process.env.VOTING_CONTRACT_ADDRESS || '';
    const voterRegistry = process.env.VOTER_REGISTRY_CONTRACT_ADDRESS || '';

    // Only create addresses if they are provided
    if (!votingContract || !voterRegistry) {
      logger.warn('Smart contract addresses not configured. Please set VOTING_CONTRACT_ADDRESS and VOTER_REGISTRY_CONTRACT_ADDRESS in .env');
      // Use placeholder addresses to avoid crashes
      this.votingContractAddress = Address.newFromBech32('erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu');
      this.voterRegistryAddress = Address.newFromBech32('erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu');
    } else {
      this.votingContractAddress = Address.newFromBech32(votingContract);
      this.voterRegistryAddress = Address.newFromBech32(voterRegistry);
    }

    this.chainID = process.env.MULTIVERSX_NETWORK === 'mainnet' ? '1' : 'D';

    // Initialize SDK v15 components
    const factoryConfig = new TransactionsFactoryConfig({ chainID: this.chainID });
    this.transactionsFactory = new SmartContractTransactionsFactory({
      config: factoryConfig,
    });

    this.outcomeParser = new SmartContractTransactionsOutcomeParser();

    logger.info('MultiversXService initialized (SDK v15)', {
      network: process.env.MULTIVERSX_NETWORK,
      votingContract,
      voterRegistry,
      chainID: this.chainID,
    });
  }

  /**
   * Créer une élection sur la blockchain
   *
   * NOTE: Cette fonction prépare la transaction mais ne la signe pas.
   * La signature doit être faite côté frontend avec le wallet de l'utilisateur.
   */
  async prepareCreateElectionTransaction(params: {
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
  }): Promise<Transaction> {
    try {
      logger.info('Preparing create election transaction', {
        title: params.title,
        candidatesCount: params.candidates.length,
      });

      // Convertir les candidats en format attendu par le smart contract
      const candidatesArgs = params.candidates.map(c =>
        new Struct(CandidateType, [
          new Field(new U64Value(c.id), 'id'),
          new Field(BytesValue.fromUTF8(c.name), 'name'),
          new Field(BytesValue.fromUTF8(c.description_ipfs || ''), 'description_ipfs'),
        ])
      );

      const senderAddress = Address.newFromBech32(params.sender);

      // Créer la transaction avec la nouvelle API v15
      const transaction = await this.transactionsFactory.createTransactionForExecute(
        senderAddress,
        {
          contract: this.votingContractAddress,
          function: 'createElection',
          gasLimit: 20_000_000n,
          arguments: [
            BytesValue.fromUTF8(params.title),
            BytesValue.fromUTF8(params.descriptionIpfs),
            new U64Value(params.startTime),
            new U64Value(params.endTime),
            VariadicValue.fromItems(...candidatesArgs),
          ],
        }
      );

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

      const query = new SmartContractQuery({
        contract: this.votingContractAddress,
        function: 'getElection',
        arguments: [this.encodeU64(electionId)],
      });

      const queryResponse = await this.proxyProvider.queryContract(query as any);

      if (!queryResponse.returnData || queryResponse.returnData.length === 0) {
        logger.warn('Election not found', { electionId });
        return null;
      }

      // Parser la réponse manuellement (sans ABI dans cette version)
      // Note: Avec ABI, on pourrait utiliser parsedResponse = controller.parseQueryResponse(response)
      const returnData = queryResponse.returnData;

      // Convertir en ElectionData (à adapter selon la structure exacte du smart contract)
      const election: ElectionData = {
        id: electionId,
        title: Buffer.from(returnData[0], 'base64').toString('utf8'),
        description_ipfs: Buffer.from(returnData[1], 'base64').toString('utf8'),
        organizer: new Address(Buffer.from(returnData[2], 'base64')).toBech32(),
        start_time: Number(Buffer.from(returnData[3], 'base64').readBigUInt64BE()),
        end_time: Number(Buffer.from(returnData[4], 'base64').readBigUInt64BE()),
        candidates: [], // À parser selon structure
        status: Buffer.from(returnData[6], 'base64').toString('utf8'),
        total_votes: Number(Buffer.from(returnData[7], 'base64').readBigUInt64BE()),
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
      const query = new SmartContractQuery({
        contract: this.votingContractAddress,
        function: 'getTotalVotes',
        arguments: [this.encodeU64(electionId)],
      });

      const queryResponse = await this.proxyProvider.queryContract(query as any);

      const totalVotes = Number(
        Buffer.from(queryResponse.returnData[0], 'base64').readBigUInt64BE()
      );

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
  async prepareRegisterVoterTransaction(params: {
    electionId: number;
    credentialProof: string;
    sender: string;
  }): Promise<Transaction> {
    try {
      logger.info('Preparing register voter transaction', {
        electionId: params.electionId,
      });

      const senderAddress = Address.newFromBech32(params.sender);

      const transaction = await this.transactionsFactory.createTransactionForExecute(
        senderAddress,
        {
          contract: this.voterRegistryAddress,
          function: 'registerVoter',
          gasLimit: 10_000_000n,
          arguments: [
            new U64Value(params.electionId),
            BytesValue.fromHex(params.credentialProof),
          ],
        }
      );

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
      const query = new SmartContractQuery({
        contract: this.voterRegistryAddress,
        function: 'isTokenValid',
        arguments: [
          this.encodeU64(electionId),
          this.encodeHex(token),
        ],
      });

      const queryResponse = await this.proxyProvider.queryContract(query as any);

      const isValid = Buffer.from(queryResponse.returnData[0], 'base64').readUInt8() === 1;

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
  async prepareCastVoteTransaction(params: {
    electionId: number;
    votingToken: string;
    encryptedVote: string;
    proof: string;
    sender: string;
  }): Promise<Transaction> {
    try {
      logger.info('Preparing cast vote transaction', {
        electionId: params.electionId,
      });

      const encryptedVoteStruct = new Struct(EncryptedVoteType, [
        new Field(BytesValue.fromHex(params.encryptedVote), 'encrypted_choice'),
        new Field(BytesValue.fromHex(params.proof), 'proof'),
        new Field(new U64Value(Math.floor(Date.now() / 1000)), 'timestamp'),
      ]);

      const senderAddress = Address.newFromBech32(params.sender);

      const transaction = await this.transactionsFactory.createTransactionForExecute(
        senderAddress,
        {
          contract: this.votingContractAddress,
          function: 'castVote',
          gasLimit: 15_000_000n,
          arguments: [
            new U64Value(params.electionId),
            BytesValue.fromHex(params.votingToken),
            encryptedVoteStruct,
          ],
        }
      );

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
  async prepareActivateElectionTransaction(params: {
    electionId: number;
    sender: string;
  }): Promise<Transaction> {
    try {
      const senderAddress = Address.newFromBech32(params.sender);

      const transaction = await this.transactionsFactory.createTransactionForExecute(
        senderAddress,
        {
          contract: this.votingContractAddress,
          function: 'activateElection',
          gasLimit: 5_000_000n,
          arguments: [new U64Value(params.electionId)],
        }
      );

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
  async prepareCloseElectionTransaction(params: {
    electionId: number;
    sender: string;
  }): Promise<Transaction> {
    try {
      const senderAddress = Address.newFromBech32(params.sender);

      const transaction = await this.transactionsFactory.createTransactionForExecute(
        senderAddress,
        {
          contract: this.votingContractAddress,
          function: 'closeElection',
          gasLimit: 5_000_000n,
          arguments: [new U64Value(params.electionId)],
        }
      );

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

      // En v15, TransactionWatcher utilise apiProvider comme fetcher
      const watcher = new TransactionWatcher(this.apiProvider as any);
      const transactionOnNetwork = await watcher.awaitCompleted(txHash);

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
      const networkConfig = await this.apiProvider.getNetworkConfig();
      const networkStatus = await this.apiProvider.getNetworkStatus();

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
