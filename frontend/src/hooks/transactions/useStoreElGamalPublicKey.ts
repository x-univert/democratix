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

const STORE_ELGAMAL_KEY_INFO = {
  processingMessage: 'Stockage de la clé publique ElGamal en cours...',
  errorMessage: 'Erreur lors du stockage de la clé publique',
  successMessage: 'Clé publique ElGamal stockée avec succès!'
};

export const useStoreElGamalPublicKey = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const storePublicKey = async (electionId: number, publicKey: string) => {
    try {
      // 1. Créer la factory avec l'ABI
      const abi = AbiRegistry.create(votingAbi);
      const scFactory = new SmartContractTransactionsFactory({
        config: new TransactionsFactoryConfig({
          chainID: network.chainId
        }),
        abi
      });

      // 2. Créer la transaction pour setElectionPublicKey
      const transaction = await scFactory.createTransactionForExecute(
        new Address(address),
        {
          gasLimit: BigInt(10000000),
          function: 'setElectionPublicKey',
          contract: new Address(votingContract),
          arguments: [
            electionId,  // u64
            publicKey    // ManagedBuffer
          ]
        }
      );

      // 3. Signer et envoyer
      const result = await signAndSendTransactionsWithHash({
        transactions: [transaction],
        transactionsDisplayInfo: STORE_ELGAMAL_KEY_INFO
      });

      return {
        sessionId: result.sessionId,
        transactionHash: result.transactionHashes[0]
      };
    } catch (err) {
      console.error('Error storing ElGamal public key:', err);
      throw err;
    }
  };

  return { storePublicKey };
};
