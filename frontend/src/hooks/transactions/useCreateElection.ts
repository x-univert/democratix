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

const CREATE_ELECTION_INFO = {
  processingMessage: 'Création de l\'élection en cours...',
  errorMessage: 'Erreur lors de la création de l\'élection',
  successMessage: 'Élection créée avec succès!'
};

export const useCreateElection = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const createElection = async (
    title: string,
    description_ipfs: string,
    start_time: number,
    end_time: number,
    requires_registration: boolean = false,
    registration_deadline: number | null = null
  ) => {
    try {
      // 1. Créer la factory avec l'ABI
      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      // 2. Créer la transaction avec arguments (inclut OptionalValue)
      const args = [
        title,                  // bytes
        description_ipfs,       // bytes
        start_time,             // u64
        end_time,               // u64
        requires_registration   // bool
      ];

      // Ajouter registration_deadline si présent (OptionalValue<u64>)
      if (registration_deadline !== null) {
        args.push(registration_deadline);
      }

      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(15000000), // Plus de gas car fonction complexe
          function: 'createElection',
          contract: new Address(votingContract),
          arguments: args
        }
      );

      // 3. Signer et envoyer
      const result = await signAndSendTransactionsWithHash({
        transactions: [transaction],
        transactionsDisplayInfo: CREATE_ELECTION_INFO
      });

      console.log('Transaction result:', result);
      console.log('Transaction hash:', result.transactionHashes[0]);

      // Retourner le sessionId et le hash de la transaction
      return {
        sessionId: result.sessionId,
        transactionHash: result.transactionHashes[0]
      };
    } catch (err) {
      console.error('Error creating election:', err);
      throw err;
    }
  };

  return { createElection };
};
