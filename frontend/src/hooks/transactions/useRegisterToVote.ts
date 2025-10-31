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

const REGISTER_INFO = {
  processingMessage: 'Inscription en cours...',
  errorMessage: 'Erreur lors de l\'inscription',
  successMessage: 'Inscription réussie!'
};

export const useRegisterToVote = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const registerToVote = async (electionId: number) => {
    console.log('📝 ========== START REGISTRATION ==========');
    console.log('📝 Election ID:', electionId);
    console.log('📝 Voter address:', address);
    console.log('📝 Network:', network.chainId);
    console.log('📝 Voting contract:', votingContract);

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

      // 2. Créer la transaction
      console.log('🔨 Step 2: Creating transaction');
      console.log('🔨 Arguments:', [electionId]);

      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(10000000),
          function: 'registerToVote',
          contract: new Address(votingContract),
          arguments: [electionId]
        }
      );

      console.log('✅ Transaction created:', transaction);
      console.log('📄 Transaction data:', transaction.data ? transaction.data.toString() : 'N/A');
      console.log('⛽ Transaction gas limit:', transaction.gasLimit ? transaction.gasLimit.toString() : 'N/A');

      // 3. Signer et envoyer
      console.log('✍️ Step 3: Signing and sending transaction');
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: REGISTER_INFO
      });

      console.log('✅ Transaction sent! Session ID:', sessionId);
      console.log('📝 ========== END REGISTRATION ==========');
      return sessionId;
    } catch (err) {
      console.error('❌ ========== REGISTRATION ERROR ==========');
      console.error('❌ Error type:', err?.constructor?.name);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Full error:', err);
      console.error('❌ Stack trace:', err?.stack);
      console.error('❌ ========== END ERROR ==========');
      throw err;
    }
  };

  return { registerToVote };
};
