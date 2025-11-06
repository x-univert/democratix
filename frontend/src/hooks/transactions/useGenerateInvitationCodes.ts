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
            count,
            0  // batch_offset = 0 pour une génération en un seul batch
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

  const generateCodesBatch = async (electionId: number, batchSizes: number[]) => {
    try {
      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      // Créer toutes les transactions pour tous les batches
      const transactions = [];
      let cumulativeOffset = 0;

      for (const batchSize of batchSizes) {
        console.log(`🔍 Creating transaction with offset=${cumulativeOffset}, batchSize=${batchSize}`);
        const transaction = await scFactory.createTransactionForExecute(
          new Address(address),
          {
            gasLimit: BigInt(30000000 + (batchSize * 2000000)),
            function: 'generateInvitationCodes',
            contract: new Address(votingContract),
            arguments: [
              electionId,
              batchSize,
              cumulativeOffset  // Passer l'offset pour éviter les doublons
            ]
          }
        );
        console.log(`✅ Transaction created with data: ${transaction.data}`);
        transactions.push(transaction);
        // Incrémenter l'offset pour le prochain batch
        cumulativeOffset += batchSize;
      }

      console.log(`📦 Creating ${transactions.length} transactions for batch signing`);

      // Signer et envoyer toutes les transactions ensemble
      const sessionId = await signAndSendTransactions({
        transactions,
        transactionsDisplayInfo: {
          ...GENERATE_CODES_INFO,
          processingMessage: `Génération de ${batchSizes.length} lots de codes en cours...`
        }
      });

      return sessionId;
    } catch (err) {
      console.error('Error generating invitation codes in batch:', err);
      throw err;
    }
  };

  return { generateCodes, generateCodesBatch };
};
