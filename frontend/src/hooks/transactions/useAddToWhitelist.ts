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

const ADD_TO_WHITELIST_INFO = {
  processingMessage: 'Ajout à la liste blanche en cours...',
  errorMessage: 'Erreur lors de l\'ajout à la liste blanche',
  successMessage: 'Adresses ajoutées avec succès!'
};

export const useAddToWhitelist = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const addToWhitelist = async (electionId: number, addresses: string[]) => {
    try {
      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(10000000 + (addresses.length * 1000000)),
          function: 'addToWhitelist',
          contract: new Address(votingContract),
          arguments: [
            electionId,
            ...addresses  // Spread operator pour variadic<Address>
          ]
        }
      );

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: ADD_TO_WHITELIST_INFO
      });

      return sessionId;
    } catch (err) {
      console.error('Error adding to whitelist:', err);
      throw err;
    }
  };

  return { addToWhitelist };
};
