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

const ACTIVATE_ELECTION_INFO = {
  processingMessage: 'Activation de l\'élection en cours...',
  errorMessage: 'Erreur lors de l\'activation de l\'élection',
  successMessage: 'Élection activée avec succès!'
};

export const useActivateElection = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const activateElection = async (electionId: number) => {
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
          function: 'activateElection',
          contract: new Address(votingContract),
          arguments: [electionId] // u64
        }
      );

      // 3. Signer et envoyer
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: ACTIVATE_ELECTION_INFO
      });

      return sessionId;
    } catch (err) {
      console.error('Error activating election:', err);
      throw err;
    }
  };

  return { activateElection };
};
