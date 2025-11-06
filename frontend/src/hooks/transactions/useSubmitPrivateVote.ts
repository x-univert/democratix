// Hook pour soumettre un vote privé avec zk-SNARK
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
import { zkProofService } from '../../services/zkProofService';
import { markPrivateVoteAsSubmitted } from '../elections/useHasVotedPrivately';

const PRIVATE_VOTE_INFO = {
  processingMessage: 'Vote privé zk-SNARK en cours...',
  errorMessage: 'Erreur lors du vote privé',
  successMessage: 'Vote privé enregistré avec succès!'
};

export const useSubmitPrivateVote = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  /**
   * Soumet un vote privé avec preuve zk-SNARK
   *
   * @param electionId - ID de l'élection
   * @param candidateId - ID du candidat choisi
   * @param numCandidates - Nombre total de candidats
   * @param onProgress - Callback pour le suivi de progression (optionnel)
   */
  const submitPrivateVote = async (
    electionId: number,
    candidateId: number,
    numCandidates: number,
    onProgress?: (step: string, progress: number) => void
  ) => {
    console.log('🔐 ========== START PRIVATE VOTE (zk-SNARK) ==========');
    console.log('🔐 Election ID:', electionId);
    console.log('🔐 Candidate ID:', candidateId);
    console.log('🔐 Number of candidates:', numCandidates);
    console.log('🔐 Voter address:', address);
    console.log('🔐 Network:', network.chainId);
    console.log('🔐 Voting contract:', votingContract);

    try {
      // Étape 1: Vérifier la santé du service zk-SNARK
      onProgress?.('Vérification du service zk-SNARK...', 10);
      console.log('📡 Step 1: Checking zk-SNARK service health...');

      const health = await zkProofService.checkHealth();
      if (!health.initialized) {
        throw new Error('Service zk-SNARK non initialisé');
      }
      console.log('✅ zk-SNARK service is healthy');

      // Étape 2: Récupérer ou générer le secret de l'électeur (PAR WALLET)
      onProgress?.('Préparation des clés cryptographiques...', 20);
      console.log('🔑 Step 2: Loading/generating voter secret...');
      console.log('🔑 Wallet address:', address);

      // IMPORTANT: Secret unique par adresse de wallet
      let voterSecret = zkProofService.loadVoterSecret(address);
      if (!voterSecret) {
        voterSecret = zkProofService.generateVoterSecret();
        zkProofService.saveVoterSecret(voterSecret, address);
        console.log('🔑 New voter secret generated and saved for wallet:', address.substring(0, 10) + '...');
      } else {
        console.log('🔑 Existing voter secret loaded for wallet:', address.substring(0, 10) + '...');
      }

      // Étape 3: Préparer le vote privé (génération + vérification de preuve)
      onProgress?.('Génération de la preuve zk-SNARK...', 40);
      console.log('⏳ Step 3: Preparing private vote (proof generation + verification)...');

      const privateVoteData = await zkProofService.preparePrivateVote(
        electionId,
        candidateId,
        numCandidates,
        voterSecret
      );

      console.log('✅ Private vote prepared:', {
        electionId: privateVoteData.electionId,
        commitment: privateVoteData.voteCommitment.substring(0, 16) + '...',
        nullifier: privateVoteData.nullifier.substring(0, 16) + '...',
        signatureLength: privateVoteData.backendSignature.length
      });

      // Étape 4: Créer la transaction blockchain
      onProgress?.('Préparation de la transaction blockchain...', 70);
      console.log('🔨 Step 4: Creating blockchain transaction...');

      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      console.log('📦 Transaction arguments:', {
        electionId: privateVoteData.electionId,
        voteCommitment: privateVoteData.voteCommitment,
        nullifier: privateVoteData.nullifier,
        backendSignature: privateVoteData.backendSignature
      });

      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(20000000), // 20M gas pour submitPrivateVote
          function: 'submitPrivateVote',
          contract: new Address(votingContract),
          arguments: [
            privateVoteData.electionId,
            privateVoteData.voteCommitment,
            privateVoteData.nullifier,
            privateVoteData.backendSignature
          ]
        }
      );

      console.log('✅ Transaction created:', transaction);
      console.log('📄 Transaction data:', transaction.data ? transaction.data.toString() : 'N/A');
      console.log('⛽ Transaction gas limit:', transaction.gasLimit ? transaction.gasLimit.toString() : 'N/A');

      // Étape 5: Signer et envoyer la transaction
      onProgress?.('Signature et envoi de la transaction...', 90);
      console.log('✍️ Step 5: Signing and sending transaction...');

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: PRIVATE_VOTE_INFO
      });

      // Marquer le vote comme soumis dans localStorage
      markPrivateVoteAsSubmitted(electionId, address);

      onProgress?.('Vote privé soumis avec succès!', 100);
      console.log('✅ Private vote transaction sent! Session ID:', sessionId);
      console.log('🔐 ========== END PRIVATE VOTE (zk-SNARK) ==========');

      return sessionId;
    } catch (err: any) {
      console.error('❌ ========== PRIVATE VOTE ERROR ==========');
      console.error('❌ Error type:', err?.constructor?.name);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Full error:', err);
      console.error('❌ Stack trace:', err?.stack);
      console.error('❌ ========== END ERROR ==========');
      throw err;
    }
  };

  return { submitPrivateVote };
};
