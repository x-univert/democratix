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

const ADD_CANDIDATE_INFO = {
  processingMessage: 'Ajout du candidat en cours...',
  errorMessage: 'Erreur lors de l\'ajout du candidat',
  successMessage: 'Candidat ajouté avec succès!'
};

export const useAddCandidate = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const addCandidate = async (
    electionId: number,
    candidateId: number,
    candidateName: string,
    candidateDescriptionIPFS: string
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

      // 2. Créer la transaction
      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(8000000),
          function: 'addCandidate',
          contract: new Address(votingContract),
          arguments: [
            electionId,                 // u64
            candidateId,                // u32 - AJOUTÉ
            candidateName,              // bytes
            candidateDescriptionIPFS    // bytes
          ]
        }
      );

      // 3. Signer et envoyer
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: ADD_CANDIDATE_INFO
      });

      return sessionId;
    } catch (err) {
      console.error('Error adding candidate:', err);
      throw err;
    }
  };

  return { addCandidate };
};
