// Hook pour soumettre un vote chiffré avec ElGamal (Option 1)
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
import { encryptVote } from '../../utils/elgamal';
import { markPrivateVoteAsSubmitted } from '../elections/useHasVotedPrivately';

const ENCRYPTED_VOTE_INFO = {
  processingMessage: 'Vote chiffré ElGamal en cours...',
  errorMessage: 'Erreur lors du vote chiffré',
  successMessage: 'Vote chiffré enregistré avec succès!'
};

export const useSubmitEncryptedVote = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  /**
   * Soumet un vote chiffré avec ElGamal (Option 1)
   *
   * @param electionId - ID de l'élection
   * @param candidateId - ID du candidat choisi
   * @param publicKey - Clé publique ElGamal de l'élection
   * @param onProgress - Callback pour le suivi de progression (optionnel)
   */
  const submitEncryptedVote = async (
    electionId: number,
    candidateId: number,
    publicKey: string,
    onProgress?: (step: string, progress: number) => void
  ) => {
    console.log('🔐 ========== START ENCRYPTED VOTE (ElGamal) ==========');
    console.log('🔐 Election ID:', electionId);
    console.log('🔐 Candidate ID:', candidateId);
    console.log('🔐 Public Key:', publicKey.substring(0, 20) + '...');
    console.log('🔐 Voter address:', address);
    console.log('🔐 Network:', network.chainId);
    console.log('🔐 Voting contract:', votingContract);

    try {
      // Étape 1: Chiffrement du vote avec ElGamal
      onProgress?.('Chiffrement du vote avec ElGamal...', 30);
      console.log('🔐 Step 1: Encrypting vote with ElGamal...');

      const { c1, c2 } = encryptVote(candidateId, publicKey);

      console.log('✅ Vote encrypted:', {
        c1: c1.substring(0, 20) + '...',
        c2: c2.substring(0, 20) + '...'
      });

      // Étape 2: Créer la transaction blockchain
      onProgress?.('Préparation de la transaction blockchain...', 60);
      console.log('🔨 Step 2: Creating blockchain transaction...');

      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      console.log('📦 Transaction arguments:', {
        electionId,
        c1: c1.substring(0, 20) + '...',
        c2: c2.substring(0, 20) + '...'
      });

      // TODO: Adapter selon l'interface du smart contract une fois implémentée
      // Pour l'instant, on utilise la structure prévue
      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(10000000), // 10M gas pour submitEncryptedVote (moins que zk-SNARK)
          function: 'submitEncryptedVote',
          contract: new Address(votingContract),
          arguments: [
            electionId,
            c1, // Composante c1 du chiffrement ElGamal
            c2  // Composante c2 du chiffrement ElGamal
          ]
        }
      );

      console.log('✅ Transaction created:', transaction);
      console.log('📄 Transaction data:', transaction.data ? transaction.data.toString() : 'N/A');
      console.log('⛽ Transaction gas limit:', transaction.gasLimit ? transaction.gasLimit.toString() : 'N/A');

      // Étape 3: Signer et envoyer la transaction
      onProgress?.('Signature et envoi de la transaction...', 90);
      console.log('✍️ Step 3: Signing and sending transaction...');

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: ENCRYPTED_VOTE_INFO
      });

      // Marquer le vote comme soumis dans localStorage
      markPrivateVoteAsSubmitted(electionId, address);

      onProgress?.('Vote chiffré soumis avec succès!', 100);
      console.log('✅ Encrypted vote transaction sent! Session ID:', sessionId);
      console.log('🔐 ========== END ENCRYPTED VOTE (ElGamal) ==========');

      return sessionId;
    } catch (err: any) {
      console.error('❌ ========== ENCRYPTED VOTE ERROR ==========');
      console.error('❌ Error type:', err?.constructor?.name);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Full error:', err);
      console.error('❌ Stack trace:', err?.stack);
      console.error('❌ ========== END ERROR ==========');
      throw err;
    }
  };

  return { submitEncryptedVote };
};
