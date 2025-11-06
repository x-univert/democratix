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
  encryption_type?: number; // 0=none, 1=elgamal, 2=elgamal+zksnark
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

      // Use direct API call instead of SmartContractQuery to avoid SDK v15 bug
      const gatewayUrl = process.env.MULTIVERSX_GATEWAY_URL || 'https://devnet-gateway.multiversx.com';
      const contractAddress = this.votingContractAddress.toBech32();

      // Encode electionId as hex string for API (u64 = 8 bytes = 16 hex chars)
      const electionIdHex = electionId.toString(16).padStart(16, '0');

      const queryPayload = {
        scAddress: contractAddress,
        funcName: 'getElection',
        args: [electionIdHex]
      };

      logger.info('Query payload for getElection', { queryPayload });

      const response = await fetch(`${gatewayUrl}/vm-values/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload)
      });

      const result: any = await response.json();

      // Check if query succeeded
      if (result.data?.data?.returnCode !== 'ok') {
        logger.error('Query failed for getElection', { result });
        return null;
      }

      // Get return data
      const returnData = result.data?.data?.returnData;
      if (!returnData || returnData.length === 0) {
        logger.warn('Election not found', { electionId });
        return null;
      }

      // Parse the nested buffer - returnData[0] contains all election data
      const electionBuffer = Buffer.from(returnData[0], 'base64');
      let offset = 0;

      logger.info('Parsing election buffer', {
        electionId,
        bufferLength: electionBuffer.length,
        bufferHex: electionBuffer.toString('hex').substring(0, 100) + '...'
      });

      // Helper to read u32 (4 bytes big-endian)
      const readU32 = (): number => {
        const value = electionBuffer.readUInt32BE(offset);
        offset += 4;
        return value;
      };

      // Helper to read u64 (8 bytes big-endian)
      const readU64 = (): number => {
        const value = Number(electionBuffer.readBigUInt64BE(offset));
        offset += 8;
        return value;
      };

      // Helper to read ManagedBuffer (4-byte length + data)
      const readManagedBuffer = (): string => {
        const length = readU32();
        const data = electionBuffer.slice(offset, offset + length).toString('utf8');
        offset += length;
        return data;
      };

      // Helper to read Address (32 bytes)
      const readAddress = (): string => {
        const addressBytes = electionBuffer.slice(offset, offset + 32);
        offset += 32;
        return new Address(addressBytes).toBech32();
      };

      // Parse election structure
      // 1. ID (u64 - 8 bytes)
      const id = readU64();

      // 2. Title (ManagedBuffer)
      const title = readManagedBuffer();

      // 3. Description IPFS (ManagedBuffer)
      const description_ipfs = readManagedBuffer();

      // 4. Organizer (Address - 32 bytes)
      const organizer = readAddress();

      // 5. Start time (u64)
      const start_time = readU64();

      // 6. End time (u64)
      const end_time = readU64();

      // 7. Num candidates (u32)
      const num_candidates = readU32();

      // 8. Status (enum - 1 byte: 0=Pending, 1=Active, 2=Closed, 3=Finalized)
      const statusValue = electionBuffer[offset];
      offset += 1;
      const statusNames = ['Pending', 'Active', 'Closed', 'Finalized'];
      const status = statusNames[statusValue] || 'Pending';

      // 9. Total votes (u64)
      const total_votes = readU64();

      // 10. Requires registration (bool - 1 byte) - NOUVEAU
      let requires_registration = false;
      if (offset < electionBuffer.length) {
        requires_registration = electionBuffer[offset] === 1;
        offset += 1;
      }

      // 11. Registered voters count (u64) - NOUVEAU
      let registered_voters_count = 0;
      if (offset < electionBuffer.length) {
        registered_voters_count = readU64();
      }

      // 12. Registration deadline (Option<u64>) - NOUVEAU
      let registration_deadline: number | null = null;
      if (offset < electionBuffer.length) {
        const hasDeadline = electionBuffer[offset];
        offset += 1;
        if (hasDeadline === 1) {
          registration_deadline = readU64();
        }
      }

      // 13. Encryption type (u8 - 1 byte) - NOUVEAU
      let encryption_type = 0;
      if (offset < electionBuffer.length) {
        encryption_type = electionBuffer[offset];
        offset += 1;
      }

      logger.info('Election parsed successfully', {
        electionId,
        id,
        title,
        status,
        statusValue,
        total_votes,
        start_time,
        end_time,
        num_candidates,
        requires_registration,
        registered_voters_count,
        registration_deadline,
        encryption_type
      });

      const election: ElectionData = {
        id: id || electionId,
        title,
        description_ipfs,
        organizer,
        start_time,
        end_time,
        candidates: [], // Will be fetched separately
        status: status as 'Pending' | 'Active' | 'Closed' | 'Finalized',
        total_votes,
        encryption_type,
      };

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

  // === MÉTHODES POUR CHIFFREMENT ELGAMAL (OPTION 1) ===

  /**
   * Préparer une transaction pour définir la clé publique ElGamal d'une élection
   */
  async prepareSetElectionPublicKeyTransaction(params: {
    electionId: number;
    publicKey: string;
    sender: string;
  }): Promise<Transaction> {
    try {
      const senderAddress = Address.newFromBech32(params.sender);

      // Convertir la clé publique hex en BytesValue
      const publicKeyBytes = this.encodeHex(params.publicKey);

      const transaction = await this.transactionsFactory.createTransactionForExecute(
        senderAddress,
        {
          contract: this.votingContractAddress,
          function: 'setElectionPublicKey',
          gasLimit: 5_000_000n,
          arguments: [
            new U64Value(params.electionId),
            new BytesValue(Buffer.from(publicKeyBytes))
          ],
        }
      );

      return transaction;
    } catch (error: any) {
      logger.error('Error preparing setElectionPublicKey transaction', {
        error: error.message,
      });
      throw new Error(`Failed to prepare transaction: ${error.message}`);
    }
  }

  /**
   * Récupérer la clé publique ElGamal d'une élection depuis le smart contract
   */
  async getElectionPublicKey(electionId: number): Promise<string | null> {
    try {
      logger.info('Fetching ElGamal public key from smart contract', { electionId });

      // Use direct API call instead of SmartContractQuery to avoid SDK v15 bug
      const gatewayUrl = process.env.MULTIVERSX_GATEWAY_URL || 'https://devnet-gateway.multiversx.com';
      const contractAddress = this.votingContractAddress.toBech32();

      // Encode electionId as hex string for API
      const electionIdHex = electionId.toString(16).padStart(2, '0');

      const queryPayload = {
        scAddress: contractAddress,
        funcName: 'getElectionPublicKey',
        args: [electionIdHex]
      };

      logger.info('Query payload', { queryPayload });

      const response = await fetch(`${gatewayUrl}/vm-values/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload)
      });

      const result: any = await response.json();

      // Check if query succeeded
      if (result.data?.data?.returnCode !== 'ok') {
        logger.error('Query failed', { result });
        return null;
      }

      // Get return data
      const returnData = result.data?.data?.returnData;
      if (!returnData || returnData.length === 0) {
        logger.info('No ElGamal public key found for election', { electionId });
        return null;
      }

      // Decode the public key from base64
      // The data is stored as hex string in the blockchain, so we decode base64 to get the hex string
      const publicKeyHex = Buffer.from(returnData[0], 'base64').toString('utf8');

      if (publicKeyHex.length === 0) {
        return null;
      }

      logger.info('ElGamal public key retrieved', {
        electionId,
        publicKey: publicKeyHex.substring(0, 20) + '...'
      });

      return publicKeyHex;
    } catch (error: any) {
      logger.error('Error fetching ElGamal public key', {
        error: error.message,
        electionId
      });
      throw new Error(`Failed to fetch ElGamal public key: ${error.message}`);
    }
  }

  /**
   * Récupérer tous les votes chiffrés ElGamal d'une élection
   */
  async getEncryptedVotes(electionId: number): Promise<Array<{
    c1: string;
    c2: string;
    timestamp: number;
  }>> {
    try {
      logger.info('Fetching encrypted votes from smart contract', { electionId });

      // Use direct API call instead of SmartContractQuery to avoid SDK v15 bug
      const gatewayUrl = process.env.MULTIVERSX_GATEWAY_URL || 'https://devnet-gateway.multiversx.com';
      const contractAddress = this.votingContractAddress.toBech32();

      // Encode electionId as hex string for API (u64 = 8 bytes = 16 hex chars)
      const electionIdHex = electionId.toString(16).padStart(16, '0');

      const queryPayload = {
        scAddress: contractAddress,
        funcName: 'getEncryptedVotes',
        args: [electionIdHex]
      };

      const response = await fetch(`${gatewayUrl}/vm-values/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload)
      });

      const result: any = await response.json();

      // Check if query succeeded
      if (result.data?.data?.returnCode !== 'ok') {
        logger.error('Query failed for getEncryptedVotes', { result });
        return [];
      }

      // Get return data
      const returnData = result.data?.data?.returnData;
      if (!returnData || returnData.length === 0) {
        logger.info('No encrypted votes found for election', { electionId });
        return [];
      }

      // Log returnData structure for debugging
      logger.info('Encrypted votes returnData structure', {
        electionId,
        returnDataLength: returnData.length,
        returnDataIndexes: returnData.map((item: any, idx: number) => ({
          index: idx,
          base64Length: item ? item.length : 0,
          isUndefined: item === undefined,
          preview: item ? item.substring(0, 20) + '...' : 'undefined'
        }))
      });

      // Le smart contract retourne une MultiValueEncoded<ElGamalVote>
      // Chaque élément du returnData est un ElGamalVote complet encodé (c1 + c2 + timestamp)
      const votes: Array<{ c1: string; c2: string; timestamp: number }> = [];

      // Helper to read u32 (4 bytes big-endian)
      const readU32 = (buffer: Buffer, offset: number): number => {
        return buffer.readUInt32BE(offset);
      };

      // Helper to read u64 (8 bytes big-endian)
      const readU64 = (buffer: Buffer, offset: number): number => {
        return Number(buffer.readBigUInt64BE(offset));
      };

      // Helper to read ManagedBuffer (4-byte length + data)
      // For ElGamal votes, c1 and c2 are stored as ASCII hex strings in the smart contract
      const readManagedBuffer = (buffer: Buffer, offset: number): { data: string; nextOffset: number } => {
        const length = readU32(buffer, offset);
        // The data is stored as ASCII characters representing hex (e.g., "0365..." not raw bytes)
        // So we need to convert ASCII to string first
        const data = buffer.slice(offset + 4, offset + 4 + length).toString('utf8');
        return { data, nextOffset: offset + 4 + length };
      };

      for (let i = 0; i < returnData.length; i++) {
        try {
          const voteBuffer = Buffer.from(returnData[i], 'base64');
          let offset = 0;

          logger.info('Parsing vote buffer', {
            index: i,
            bufferLength: voteBuffer.length,
            bufferHex: voteBuffer.toString('hex').substring(0, 40) + '...'
          });

          // Parse ElGamalVote structure:
          // 1. c1 (ManagedBuffer - 4 bytes length + data)
          const c1Result = readManagedBuffer(voteBuffer, offset);
          const c1 = c1Result.data;
          offset = c1Result.nextOffset;

          // 2. c2 (ManagedBuffer - 4 bytes length + data)
          const c2Result = readManagedBuffer(voteBuffer, offset);
          const c2 = c2Result.data;
          offset = c2Result.nextOffset;

          // 3. timestamp (u64 - 8 bytes)
          const timestamp = readU64(voteBuffer, offset);

          logger.info('Vote parsed successfully', {
            index: i,
            c1Length: c1.length,
            c2Length: c2.length,
            c1Preview: c1.substring(0, 20) + '...',
            c2Preview: c2.substring(0, 20) + '...',
            timestamp
          });

          votes.push({ c1, c2, timestamp });
        } catch (error: any) {
          logger.error('Error parsing vote', {
            index: i,
            error: error.message
          });
        }
      }

      logger.info('Encrypted votes retrieved', {
        electionId,
        voteCount: votes.length
      });

      return votes;
    } catch (error: any) {
      logger.error('Error fetching encrypted votes', {
        error: error.message,
        electionId
      });
      throw new Error(`Failed to fetch encrypted votes: ${error.message}`);
    }
  }

  /**
   * Récupérer tous les votes chiffrés ElGamal avec preuve zk-SNARK d'une élection (Option 2)
   */
  async getEncryptedVotesWithProof(electionId: number): Promise<Array<{
    c1: string;
    c2: string;
    nullifier: string;
    timestamp: number;
  }>> {
    try {
      logger.info('Fetching Option 2 encrypted votes with proof from smart contract', { electionId });

      // Use direct API call instead of SmartContractQuery to avoid SDK v15 bug
      const gatewayUrl = process.env.MULTIVERSX_GATEWAY_URL || 'https://devnet-gateway.multiversx.com';
      const contractAddress = this.votingContractAddress.toBech32();

      // Encode electionId as hex string for API (u64 = 8 bytes = 16 hex chars)
      const electionIdHex = electionId.toString(16).padStart(16, '0');

      const queryPayload = {
        scAddress: contractAddress,
        funcName: 'getEncryptedVotesWithProof',
        args: [electionIdHex]
      };

      const response = await fetch(`${gatewayUrl}/vm-values/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload)
      });

      const result: any = await response.json();

      // Check if query succeeded
      if (result.data?.data?.returnCode !== 'ok') {
        logger.error('Query failed for getEncryptedVotesWithProof', { result });
        return [];
      }

      // Get return data
      const returnData = result.data?.data?.returnData;
      if (!returnData || returnData.length === 0) {
        logger.info('No Option 2 encrypted votes found for election', { electionId });
        return [];
      }

      // Log returnData structure for debugging
      logger.info('Option 2 encrypted votes returnData structure', {
        electionId,
        returnDataLength: returnData.length,
        returnDataIndexes: returnData.map((item: any, idx: number) => ({
          index: idx,
          base64Length: item ? item.length : 0,
          isUndefined: item === undefined,
          preview: item ? item.substring(0, 20) + '...' : 'undefined'
        }))
      });

      // Le smart contract retourne une MultiValueEncoded<ElGamalVoteWithProof>
      // Chaque élément du returnData est un ElGamalVoteWithProof complet encodé
      const votes: Array<{ c1: string; c2: string; nullifier: string; timestamp: number }> = [];

      // Helper to read u32 (4 bytes big-endian)
      const readU32 = (buffer: Buffer, offset: number): number => {
        return buffer.readUInt32BE(offset);
      };

      // Helper to read u64 (8 bytes big-endian)
      const readU64 = (buffer: Buffer, offset: number): number => {
        return Number(buffer.readBigUInt64BE(offset));
      };

      // Helper to read ManagedBuffer (4-byte length + data)
      const readManagedBuffer = (buffer: Buffer, offset: number): { data: string; nextOffset: number } => {
        const length = readU32(buffer, offset);
        const data = buffer.slice(offset + 4, offset + 4 + length).toString('utf8');
        return { data, nextOffset: offset + 4 + length };
      };

      for (let i = 0; i < returnData.length; i++) {
        try {
          const voteBuffer = Buffer.from(returnData[i], 'base64');
          let offset = 0;

          logger.info('Parsing Option 2 vote buffer', {
            index: i,
            bufferLength: voteBuffer.length,
            bufferHex: voteBuffer.toString('hex').substring(0, 40) + '...'
          });

          // Parse ElGamalVoteWithProof structure:
          // 1. c1 (ManagedBuffer - 4 bytes length + data)
          const c1Result = readManagedBuffer(voteBuffer, offset);
          const c1 = c1Result.data;
          offset = c1Result.nextOffset;

          logger.info('Parsed c1', { c1Length: c1.length, c1Preview: c1.substring(0, 20) });

          // 2. c2 (ManagedBuffer - 4 bytes length + data)
          const c2Result = readManagedBuffer(voteBuffer, offset);
          const c2 = c2Result.data;
          offset = c2Result.nextOffset;

          logger.info('Parsed c2', { c2Length: c2.length, c2Preview: c2.substring(0, 20) });

          // 3. nullifier (ManagedBuffer - 4 bytes length + data)
          const nullifierResult = readManagedBuffer(voteBuffer, offset);
          const nullifier = nullifierResult.data;
          offset = nullifierResult.nextOffset;

          logger.info('Parsed nullifier', { nullifierLength: nullifier.length, nullifierPreview: nullifier.substring(0, 20) });

          // 4. proof (Groth16Proof - pi_a, pi_b, pi_c)
          // pi_a: G1Point (2 ManagedBuffers: x, y)
          const pi_a_x_result = readManagedBuffer(voteBuffer, offset);
          offset = pi_a_x_result.nextOffset;
          const pi_a_y_result = readManagedBuffer(voteBuffer, offset);
          offset = pi_a_y_result.nextOffset;

          // pi_b: G2Point (4 ManagedBuffers: x1, x2, y1, y2)
          const pi_b_x1_result = readManagedBuffer(voteBuffer, offset);
          offset = pi_b_x1_result.nextOffset;
          const pi_b_x2_result = readManagedBuffer(voteBuffer, offset);
          offset = pi_b_x2_result.nextOffset;
          const pi_b_y1_result = readManagedBuffer(voteBuffer, offset);
          offset = pi_b_y1_result.nextOffset;
          const pi_b_y2_result = readManagedBuffer(voteBuffer, offset);
          offset = pi_b_y2_result.nextOffset;

          // pi_c: G1Point (2 ManagedBuffers: x, y)
          const pi_c_x_result = readManagedBuffer(voteBuffer, offset);
          offset = pi_c_x_result.nextOffset;
          const pi_c_y_result = readManagedBuffer(voteBuffer, offset);
          offset = pi_c_y_result.nextOffset;

          logger.info('Skipped Groth16 proof', { offsetAfterProof: offset, bufferLength: voteBuffer.length });

          // 5. timestamp (u64 - 8 bytes)
          const timestamp = readU64(voteBuffer, offset);

          // Les valeurs c1 et c2 sont déjà en format hexadécimal (66 caractères)
          // depuis la modification du frontend zkproofEncrypted.ts
          // Pas besoin de conversion, on les utilise directement
          logger.info('Option 2 vote parsed successfully', {
            index: i,
            c1Length: c1.length,
            c2Length: c2.length,
            c1Hex: c1.substring(0, 20) + '...',
            c2Hex: c2.substring(0, 20) + '...',
            nullifierLength: nullifier.length,
            nullifierPreview: nullifier.substring(0, 20) + '...',
            timestamp
          });

          votes.push({ c1, c2, nullifier, timestamp });
        } catch (error: any) {
          logger.error('Error parsing Option 2 vote', {
            index: i,
            error: error.message
          });
        }
      }

      logger.info('Option 2 encrypted votes retrieved', {
        electionId,
        voteCount: votes.length
      });

      return votes;
    } catch (error: any) {
      logger.error('Error fetching Option 2 encrypted votes', {
        error: error.message,
        electionId
      });
      throw new Error(`Failed to fetch Option 2 encrypted votes: ${error.message}`);
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
