import { votingContract } from 'config';
import votingAbi from 'contracts/voting.abi.json';
import { signAndSendTransactionsWithHash } from 'helpers';
import {
  AbiRegistry,
  Address,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig,
  useGetAccount,
  useGetNetworkConfig
} from 'lib';

const CLOSE_ELECTION_INFO = {
  processingMessage: 'Fermeture de l\'élection en cours...',
  errorMessage: 'Erreur lors de la fermeture de l\'élection',
  successMessage: 'Élection fermée avec succès!'
};

export const useCloseElection = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const closeElection = async (electionId: number) => {
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
          function: 'closeElection',
          contract: new Address(votingContract),
          arguments: [electionId] // u64
        }
      );

      // 3. Signer et envoyer avec hash de transaction
      const result = await signAndSendTransactionsWithHash({
        transactions: [transaction],
        transactionsDisplayInfo: CLOSE_ELECTION_INFO
      });

      return {
        sessionId: result.sessionId,
        transactionHash: result.transactionHashes[0]
      };
    } catch (err) {
      console.error('Error closing election:', err);
      throw err;
    }
  };

  return { closeElection };
};
