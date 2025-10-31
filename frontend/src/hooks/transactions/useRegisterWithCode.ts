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

const REGISTER_WITH_CODE_INFO = {
  processingMessage: 'Inscription avec code d\'invitation en cours...',
  errorMessage: 'Erreur lors de l\'inscription',
  successMessage: 'Inscription réussie!'
};

export const useRegisterWithCode = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const registerWithCode = async (electionId: number, invitationCode: string) => {
    try {
      console.log('🔐 Code reçu (hex string):', invitationCode);
      console.log('🔐 Code length:', invitationCode.length);

      // Nettoyer le code: enlever espaces, tirets, etc.
      const cleanCode = invitationCode.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
      console.log('🔐 Code nettoyé:', cleanCode);
      console.log('🔐 Code nettoyé length:', cleanCode.length);

      // Vérifier que c'est bien un hash de 32 bytes (64 caractères hex)
      if (cleanCode.length !== 64) {
        throw new Error(`Code invalide: attendu 64 caractères hex, reçu ${cleanCode.length}`);
      }

      // Convertir en bytes en utilisant Uint8Array au lieu de Buffer
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(cleanCode.substr(i * 2, 2), 16);
      }

      const codeBuffer = Buffer.from(bytes);
      console.log('🔐 Code Buffer:', codeBuffer);
      console.log('🔐 Code Buffer hex:', Buffer.from(codeBuffer).toString('hex'));
      console.log('🔐 Code Buffer is Buffer?:', Buffer.isBuffer(codeBuffer));

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
          gasLimit: BigInt(12000000),
          function: 'registerWithInvitationCode',
          contract: new Address(votingContract),
          arguments: [
            electionId,
            codeBuffer
          ]
        }
      );

      console.log('🔐 Transaction créée, data:', transaction.data ? transaction.data.toString() : 'N/A');

      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: REGISTER_WITH_CODE_INFO
      });

      return sessionId;
    } catch (err) {
      console.error('Error registering with invitation code:', err);
      throw err;
    }
  };

  return { registerWithCode };
};
