/**
 * useSubmitPrivateVoteWithProof.ts
 *
 * Hook pour soumettre un vote privé chiffré ElGamal avec preuve zk-SNARK (Option 2)
 *
 * OPTION 2 = ElGamal (chiffrement) + zk-SNARK (preuve mathématique)
 *
 * Ce hook:
 * 1. Génère la preuve zk-SNARK que le vote est valide
 * 2. Soumet la preuve + vote chiffré au smart contract
 * 3. Le smart contract vérifie la preuve ON-CHAIN
 * 4. Si valide, le vote est accepté et stocké
 */

import { useState } from 'react';
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
import {
  generateEncryptedVoteProof,
  getOrCreateVoterSecret,
  generateElGamalRandomness,
  type EncryptedVoteProof,
} from '../../utils/zkproofEncrypted';
import { markPrivateVoteAsSubmitted } from '../elections/useHasVotedPrivately';
import { useGetElectionPublicKey } from '../elections/useGetElectionPublicKey';

export interface SubmitPrivateVoteWithProofParams {
  electionId: number;
  candidateId: number;
  numCandidates: number;
}

export interface SubmitPrivateVoteWithProofResult {
  sessionId: string;
  proof: EncryptedVoteProof;
}

const VOTE_WITH_PROOF_INFO = {
  processingMessage: 'Vote chiffré avec preuve zk-SNARK en cours...',
  errorMessage: 'Erreur lors du vote avec preuve',
  successMessage: 'Vote avec preuve zk-SNARK enregistré avec succès!'
};

export function useSubmitPrivateVoteWithProof(electionId: number | null) {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la vraie clé publique ElGamal de l'élection
  const { publicKey: elgamalPublicKey, loading: loadingPublicKey, error: publicKeyError } = useGetElectionPublicKey(electionId);

  /**
   * Soumettre un vote privé chiffré avec preuve zk-SNARK
   */
  const submitPrivateVoteWithProof = async (
    params: SubmitPrivateVoteWithProofParams
  ): Promise<SubmitPrivateVoteWithProofResult> => {
    try {
      setIsGeneratingProof(true);
      setError(null);

      console.log('🔐 [Option 2] Soumission vote privé avec preuve zk-SNARK...');
      console.log('📊 Params:', params);

      // 1. Vérifier que l'utilisateur est connecté
      if (!address) {
        throw new Error('Wallet non connecté');
      }

      // 2. Vérifier que la clé publique ElGamal est disponible
      if (!elgamalPublicKey) {
        throw new Error('Clé publique ElGamal non disponible. Veuillez configurer l\'encryption pour cette élection.');
      }

      console.log('✅ Clé publique ElGamal récupérée:', elgamalPublicKey.substring(0, 20) + '...');

      // 3. Récupérer ou créer le secret du voteur
      const voterSecret = await getOrCreateVoterSecret(address);
      console.log('✅ Secret voteur récupéré/créé');

      // 4. Générer la randomness ElGamal
      const r = generateElGamalRandomness();
      console.log('✅ Randomness ElGamal générée');

      // 5. Générer la preuve zk-SNARK
      console.log('⏳ Génération de la preuve zk-SNARK (peut prendre 2-3 secondes)...');

      const proof = await generateEncryptedVoteProof({
        candidateId: params.candidateId,
        r,
        voterSecret,
        numCandidates: params.numCandidates,
        publicKey: elgamalPublicKey, // Utiliser la vraie clé publique (format hex string)
        electionId: params.electionId,
      });

      console.log('✅ Preuve zk-SNARK générée avec succès!');
      console.log('📊 Proof:', {
        c1: proof.c1.substring(0, 20) + '...',
        c2: proof.c2.substring(0, 20) + '...',
        nullifier: proof.nullifier.substring(0, 20) + '...',
        hasProof: !!proof.proof,
      });

      // 6. Créer la transaction blockchain
      console.log('🔨 Préparation de la transaction blockchain...');

      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      console.log('📦 Arguments de la transaction:', {
        electionId: params.electionId,
        c1: proof.c1.substring(0, 20) + '...',
        c2: proof.c2.substring(0, 20) + '...',
        nullifier: proof.nullifier.substring(0, 20) + '...',
        proof: 'Groth16 proof (pi_a, pi_b, pi_c)',
        publicSignalsCount: proof.publicSignals.length,
      });

      // Encoder les points de la preuve Groth16
      const { pi_a, pi_b, pi_c } = proof.proof;

      // Structure G1Point pour pi_a et pi_c
      const pi_a_encoded = {
        x: pi_a[0],
        y: pi_a[1],
      };

      const pi_c_encoded = {
        x: pi_c[0],
        y: pi_c[1],
      };

      // Structure G2Point pour pi_b
      const pi_b_encoded = {
        x1: pi_b[0][0],
        x2: pi_b[0][1],
        y1: pi_b[1][0],
        y2: pi_b[1][1],
      };

      // 7. Créer la transaction
      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(50000000), // 50M gas pour submitPrivateVoteWithProof (plus que ElGamal seul car vérification preuve)
          function: 'submitPrivateVoteWithProof',
          contract: new Address(votingContract),
          arguments: [
            params.electionId,
            proof.c1,
            proof.c2,
            proof.nullifier,
            pi_a_encoded,
            pi_b_encoded,
            pi_c_encoded,
            proof.publicSignals,
          ]
        }
      );

      console.log('✅ Transaction créée:', transaction);
      console.log('📄 Transaction data:', transaction.data ? transaction.data.toString() : 'N/A');
      console.log('⛽ Transaction gas limit:', transaction.gasLimit ? transaction.gasLimit.toString() : 'N/A');

      // 8. Signer et envoyer la transaction
      console.log('✍️ Signature et envoi de la transaction...');

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: VOTE_WITH_PROOF_INFO
      });

      // Marquer le vote comme soumis dans localStorage
      markPrivateVoteAsSubmitted(params.electionId, address);

      setIsGeneratingProof(false);

      console.log('✅ Vote avec preuve zk-SNARK soumis! Session ID:', sessionId);
      console.log('🔐 ========== END VOTE WITH PROOF (ElGamal + zk-SNARK) ==========');

      return {
        sessionId,
        proof,
      };
    } catch (err) {
      console.error('❌ Erreur soumission vote avec preuve:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setIsGeneratingProof(false);
      throw err;
    }
  }; // Updated 2025-11-03

  return {
    submitPrivateVoteWithProof,
    isGeneratingProof,
    error,
  };
}

/**
 * Exemple d'utilisation du hook
 *
 * ```typescript
 * const { submitPrivateVoteWithProof, isGeneratingProof, error } =
 *   useSubmitPrivateVoteWithProof();
 *
 * const handleVote = async () => {
 *   try {
 *     const result = await submitPrivateVoteWithProof({
 *       electionId: 47,
 *       candidateId: 2, // Vote pour le candidat 2
 *       numCandidates: 5,
 *     });
 *     console.log('✅ Vote soumis avec succès!', result);
 *   } catch (err) {
 *     console.error('❌ Erreur:', err);
 *   }
 * };
 * ```
 */

export default useSubmitPrivateVoteWithProof;
