import axios from 'axios';
import { votingContract } from 'config';
import votingAbi from 'contracts/voting.abi.json';
import { signAndSendTransactionsWithHash } from 'helpers';
import {
  AbiRegistry,
  Address,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig,
  U32Value,
  U64Value,
  BytesValue,
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

  const finalizeElection = async (
    electionId: number,
    elgamalDecryptedVotes?: Record<number, number>
  ) => {
    try {
      console.log('🔍 Starting finalization process...', { electionId, elgamalDecryptedVotes });

      // 1. Préparer les résultats (backend calcule totaux + upload IPFS)
      const prepareResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URL}/api/elections/${electionId}/prepare-final-results`,
        {
          elgamalDecryptedVotes: elgamalDecryptedVotes || {}
        }
      );

      if (!prepareResponse.data.success) {
        throw new Error(prepareResponse.data.error || 'Failed to prepare results');
      }

      const { results, ipfsHash } = prepareResponse.data.data;
      console.log('✅ Results prepared', { results, ipfsHash });

      // 2. Créer la factory avec l'ABI
      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      // 3. Construire les arguments pour la transaction
      // Signature: finalizeElection(election_id: u64, results_ipfs_hash: ManagedBuffer, results: MultiValueEncoded<(u32, u64)>)
      const args: any[] = [
        electionId, // u64
        ipfsHash || '', // ManagedBuffer (peut être vide)
      ];

      // Ajouter chaque résultat comme paire (candidate_id, vote_count)
      for (const result of results) {
        args.push(result.candidate_id); // u32
        args.push(result.votes); // u64
      }

      console.log('📝 Transaction arguments:', args);

      // 4. Créer la transaction
      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(15000000), // Augmenté car on stocke plus de données
          function: 'finalizeElection',
          contract: new Address(votingContract),
          arguments: args
        }
      );

      // 5. Signer et envoyer avec hash de transaction
      const result = await signAndSendTransactionsWithHash({
        transactions: [transaction],
        transactionsDisplayInfo: FINALIZE_ELECTION_INFO
      });

      console.log('✅ Transaction sent', result);

      return {
        sessionId: result.sessionId,
        transactionHash: result.transactionHashes[0],
        ipfsHash,
        ipfsUrl: ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : undefined
      };
    } catch (err: any) {
      console.error('❌ Error finalizing election:', err);
      throw new Error(err.response?.data?.error || err.message || 'Failed to finalize election');
    }
  };

  return { finalizeElection };
};
