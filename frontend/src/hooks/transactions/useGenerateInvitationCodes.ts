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

const GENERATE_CODES_INFO = {
  processingMessage: 'Génération des codes d\'invitation en cours...',
  errorMessage: 'Erreur lors de la génération des codes',
  successMessage: 'Codes générés avec succès!'
};

export const useGenerateInvitationCodes = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const generateCodes = async (electionId: number, count: number) => {
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
          gasLimit: BigInt(30000000 + (count * 2000000)),
          function: 'generateInvitationCodes',
          contract: new Address(votingContract),
          arguments: [
            electionId,
            count
          ]
        }
      );

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: GENERATE_CODES_INFO
      });

      return sessionId;
    } catch (err) {
      console.error('Error generating invitation codes:', err);
      throw err;
    }
  };

  return { generateCodes };
};
