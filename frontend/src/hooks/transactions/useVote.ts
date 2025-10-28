import { votingContract } from 'config';
import votingAbi from 'contracts/voting.abi.json';
import { signAndSendTransactions } from 'helpers';
import {
  AbiRegistry,
  Address,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig,
  useGetAccount,
  useGetNetworkConfig
} from 'lib';

const VOTE_INFO = {
  processingMessage: 'Vote en cours...',
  errorMessage: 'Erreur lors du vote',
  successMessage: 'Vote enregistré avec succès!'
};

export const useVote = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const castVote = async (
    electionId: number,
    candidateId: number
  ) => {
    console.log('🗳️ ========== START VOTING ==========');
    console.log('🗳️ Election ID:', electionId);
    console.log('🗳️ Candidate ID:', candidateId);
    console.log('🗳️ Voter address:', address);
    console.log('🗳️ Network:', network.chainId);
    console.log('🗳️ Voting contract:', votingContract);

    try {
      // 1. Créer la factory avec l'ABI
      console.log('📋 Step 1: Creating ABI Registry and Factory');
      const abi = AbiRegistry.create(votingAbi);
      console.log('📋 ABI loaded:', abi);

      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });
      console.log('✅ Factory created');

      // 2. Préparer les arguments pour castVote
      console.log('📦 Step 2: Preparing arguments');
      const votingToken = 'mock_token_' + Date.now();
      console.log('🎫 Voting token:', votingToken);

      // Encoder le candidateId en 4 bytes (u32 big-endian) pour correspondre au format attendu par le SC
      const candidateIdBytes = new Uint8Array(4);
      candidateIdBytes[0] = (candidateId >> 24) & 0xFF;
      candidateIdBytes[1] = (candidateId >> 16) & 0xFF;
      candidateIdBytes[2] = (candidateId >> 8) & 0xFF;
      candidateIdBytes[3] = candidateId & 0xFF;

      console.log('🔐 Candidate ID bytes (u32 big-endian):', Array.from(candidateIdBytes));
      console.log('🔐 Candidate ID bytes (hex):', Array.from(candidateIdBytes).map(b => b.toString(16).padStart(2, '0')).join(''));

      // Convertir Uint8Array en Buffer pour le SDK
      const candidateIdBuffer = Buffer.from(candidateIdBytes);
      console.log('🔐 Candidate ID Buffer:', candidateIdBuffer);
      console.log('🔐 Buffer type:', typeof candidateIdBuffer);
      console.log('🔐 Buffer instanceof Buffer:', Buffer.isBuffer(candidateIdBuffer));

      const timestamp = Math.floor(Date.now() / 1000);
      const proof = 'mock_proof_' + Date.now();

      console.log('⏰ Timestamp:', timestamp);
      console.log('🔏 Proof:', proof);

      // Créer l'EncryptedVote avec Buffer au lieu de Uint8Array
      const encryptedVote = {
        encrypted_choice: candidateIdBuffer,
        proof: proof,
        timestamp: timestamp
      };

      console.log('📦 EncryptedVote object:', encryptedVote);
      console.log('📦 EncryptedVote.encrypted_choice type:', typeof encryptedVote.encrypted_choice);
      console.log('📦 EncryptedVote.encrypted_choice instanceof Buffer:', Buffer.isBuffer(encryptedVote.encrypted_choice));

      // 3. Créer la transaction
      console.log('🔨 Step 3: Creating transaction');
      console.log('🔨 Arguments array:', [electionId, votingToken, encryptedVote]);

      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(15000000),
          function: 'castVote',
          contract: new Address(votingContract),
          arguments: [
            electionId,      // u64
            votingToken,     // ManagedBuffer (voting_token)
            encryptedVote    // EncryptedVote (structure avec champs nommés)
          ]
        }
      );

      console.log('✅ Transaction created:', transaction);
      console.log('📄 Transaction data:', transaction.data ? transaction.data.toString() : 'N/A');
      console.log('⛽ Transaction gas limit:', transaction.gasLimit ? transaction.gasLimit.toString() : 'N/A');

      // 4. Signer et envoyer
      console.log('✍️ Step 4: Signing and sending transaction');
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: VOTE_INFO
      });

      console.log('✅ Transaction sent! Session ID:', sessionId);
      console.log('🗳️ ========== END VOTING ==========');
      return sessionId;
    } catch (err) {
      console.error('❌ ========== VOTING ERROR ==========');
      console.error('❌ Error type:', err?.constructor?.name);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Full error:', err);
      console.error('❌ Stack trace:', err?.stack);
      console.error('❌ ========== END ERROR ==========');
      throw err;
    }
  };

  return { castVote };
};
