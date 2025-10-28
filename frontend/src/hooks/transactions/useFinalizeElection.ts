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

const FINALIZE_ELECTION_INFO = {
  processingMessage: 'Finalisation de l\'élection en cours...',
  errorMessage: 'Erreur lors de la finalisation de l\'élection',
  successMessage: 'Élection finalisée avec succès!'
};

export const useFinalizeElection = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const finalizeElection = async (electionId: number) => {
    try {
      // 1. Créer la factory avec l'ABI
      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      // 2. Créer la transaction
      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(8000000),
          function: 'finalizeElection',
          contract: new Address(votingContract),
          arguments: [electionId] // u64
        }
      );

      // 3. Signer et envoyer
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: FINALIZE_ELECTION_INFO
      });

      return sessionId;
    } catch (err) {
      console.error('Error finalizing election:', err);
      throw err;
    }
  };

  return { finalizeElection };
};
