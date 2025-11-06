import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetAccount } from 'lib';
import { useSetupElGamalEncryption } from 'hooks/elections';
import { useStoreElGamalPublicKey } from 'hooks/transactions';
import { TransactionProgressModal } from '../TransactionProgressModal';

interface SetupElGamalModalProps {
  isOpen: boolean;
  onClose: () => void;
  electionId: number;
  onSuccess?: () => void;
}

export const SetupElGamalModal = ({
  isOpen,
  onClose,
  electionId,
  onSuccess,
}: SetupElGamalModalProps) => {
  const { t } = useTranslation();
  const { address } = useGetAccount();
  const { setupEncryption, downloadPrivateKey, loading, error } = useSetupElGamalEncryption();
  const { storePublicKey } = useStoreElGamalPublicKey();

  const [step, setStep] = useState<'generate' | 'display' | 'complete'>('generate');
  const [publicKey, setPublicKey] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [privateKeyDownloaded, setPrivateKeyDownloaded] = useState(false);
  const [publicKeyDownloaded, setPublicKeyDownloaded] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | undefined>();

  // Vérifier si des clés existent déjà dans le localStorage au chargement de la modal
  useEffect(() => {
    if (!isOpen || !address) {
      setCheckingExisting(false);
      return;
    }

    const storageKey = `elgamal_keys_election_${electionId}_${address}`;
    const existingKeys = localStorage.getItem(storageKey);

    if (existingKeys) {
      try {
        const parsed = JSON.parse(existingKeys);
        setPublicKey(parsed.publicKey);
        setPrivateKey(parsed.privateKey);
        setStep('display');
        console.log('✅ Clés ElGamal existantes trouvées pour cette élection');
      } catch (err) {
        console.error('Erreur lors de la lecture des clés stockées:', err);
      }
    }
    setCheckingExisting(false);
  }, [isOpen, electionId, address]);

  const handleGenerateKeys = async () => {
    if (!address) {
      alert(t('elgamal.errors.noWallet') || 'Veuillez connecter votre wallet');
      return;
    }

    const result = await setupEncryption(electionId, address);

    if (result.success && result.data) {
      setPublicKey(result.data.publicKey);
      setPrivateKey(result.data.privateKey);

      // Stocker les clés dans le localStorage
      const storageKey = `elgamal_keys_election_${electionId}_${address}`;
      localStorage.setItem(storageKey, JSON.stringify({
        publicKey: result.data.publicKey,
        privateKey: result.data.privateKey,
        generatedAt: new Date().toISOString()
      }));

      setStep('display');
    }
  };

  const handleDownloadPrivateKey = () => {
    downloadPrivateKey(privateKey, electionId);
    setPrivateKeyDownloaded(true);
  };

  const handleDownloadPublicKey = () => {
    const blob = new Blob([publicKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `election-${electionId}-public-key.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setPublicKeyDownloaded(true);
  };

  const handleCopyToClipboard = (text: string, type: 'public' | 'private') => {
    navigator.clipboard.writeText(text);
    alert(
      type === 'public'
        ? t('elgamal.copied.public') || 'Clé publique copiée'
        : t('elgamal.copied.private') || 'Clé privée copiée'
    );
  };

  const handleSignTransaction = async () => {
    if (!publicKey || !address) return;

    try {
      // Utiliser le hook pour envoyer la transaction via l'extension
      const result = await storePublicKey(electionId, publicKey);

      console.log('Transaction result:', result);

      if (result && result.transactionHash) {
        // Afficher la modal de progression de transaction
        setTransactionHash(result.transactionHash);
        setShowTransactionModal(true);
      } else {
        // Fallback si pas de hash (ne devrait pas arriver)
        setStep('complete');
      }
    } catch (err) {
      console.error('Erreur lors de la signature:', err);
      alert(t('elgamal.errors.signFailed') || 'Échec de la signature de la transaction');
    }
  };

  const handleTransactionSuccess = () => {
    setShowTransactionModal(false);
    setStep('complete');
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleTransactionClose = () => {
    setShowTransactionModal(false);
  };

  const handleComplete = () => {
    setStep('complete');
    if (onSuccess) {
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">🔐</span>
            {t('elgamal.title') || 'Configuration du Chiffrement ElGamal'}
          </h2>
          <p className="text-teal-100 mt-2 text-sm">
            {t('elgamal.subtitle') || 'Option 1 - Vote privé avec comptage des résultats'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: Generate */}
          {step === 'generate' && (
            <div className="space-y-4">
              {checkingExisting ? (
                <div className="text-center py-8">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <p className="text-gray-600">{t('elgamal.checking') || 'Vérification des clés existantes...'}</p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      {t('elgamal.generate.title') || 'Génération des clés de chiffrement'}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      {t('elgamal.generate.description') ||
                        'Cette opération va générer une paire de clés ElGamal pour votre élection. La clé publique sera stockée sur la blockchain et permettra aux électeurs de chiffrer leurs votes. La clé privée doit être sauvegardée de manière sécurisée par vous, l\'organisateur.'}
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-yellow-900">
                          {t('elgamal.warning.title') || 'Important'}
                        </h4>
                        <p className="text-yellow-700 text-sm">
                          {t('elgamal.warning.message') ||
                            'Vous devrez télécharger et sauvegarder votre clé privée. Sans elle, vous ne pourrez pas déchiffrer les votes après la clôture de l\'élection.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateKeys}
                    disabled={loading}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? t('elgamal.generating') || 'Génération en cours...'
                      : t('elgamal.generateButton') || 'Générer les clés ElGamal'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step: Display Keys */}
          {step === 'display' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h4 className="font-semibold text-green-900">
                      {t('elgamal.success.title') || 'Clés générées avec succès'}
                    </h4>
                    <p className="text-green-700 text-sm">
                      {t('elgamal.success.message') ||
                        'Vos clés ElGamal ont été générées. Veuillez les sauvegarder maintenant.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Public Key */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {t('elgamal.publicKey.title') || 'Clé Publique'}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyToClipboard(publicKey, 'public')}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      📋 {t('elgamal.copy') || 'Copier'}
                    </button>
                    <button
                      onClick={handleDownloadPublicKey}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      💾 {t('elgamal.download') || 'Télécharger'}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded font-mono text-xs break-all text-gray-700">
                  {publicKey}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('elgamal.publicKey.description') ||
                    'Cette clé sera stockée sur la blockchain et utilisée par les électeurs'}
                </p>
              </div>

              {/* Private Key */}
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-red-900 flex items-center gap-2">
                    <span>🔑</span>
                    {t('elgamal.privateKey.title') || 'Clé Privée'}
                  </h4>
                  <button
                    onClick={() => handleCopyToClipboard(privateKey, 'private')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    📋 {t('elgamal.copy') || 'Copier'}
                  </button>
                </div>
                <div className="bg-white border border-red-300 p-3 rounded font-mono text-xs break-all text-gray-700">
                  {privateKey}
                </div>
                <p className="text-xs text-red-700 mt-2 font-semibold">
                  ⚠️{' '}
                  {t('elgamal.privateKey.warning') ||
                    'ATTENTION : Cette clé ne sera plus affichée. Téléchargez-la maintenant !'}
                </p>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownloadPrivateKey}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition ${
                  privateKeyDownloaded
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {privateKeyDownloaded ? (
                  <span className="flex items-center justify-center gap-2">
                    ✅ {t('elgamal.downloaded') || 'Clé privée téléchargée'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    💾 {t('elgamal.downloadButton') || 'Télécharger la clé privée'}
                  </span>
                )}
              </button>

              {/* Transaction Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span>🔐</span>
                  {t('elgamal.transaction.title') || 'Prochaine étape : Stocker la clé publique'}
                </h4>
                <p className="text-blue-700 text-sm mb-3">
                  {t('elgamal.transaction.message') ||
                    'Signez la transaction pour stocker la clé publique sur la blockchain. Cela permettra aux électeurs de chiffrer leurs votes.'}
                </p>
                <button
                  onClick={handleSignTransaction}
                  disabled={!privateKeyDownloaded}
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition ${
                    !privateKeyDownloaded
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {!privateKeyDownloaded ? (
                    'Téléchargez d\'abord la clé privée'
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      🔐 {t('elgamal.signAndStore') || 'Signer et stocker la clé publique'}
                    </span>
                  )}
                </button>
                {privateKeyDownloaded && (
                  <p className="text-xs text-blue-600 text-center mt-2">
                    💡 {t('elgamal.extensionWillOpen') || 'L\'extension MultiversX s\'ouvrira pour signer la transaction'}
                  </p>
                )}
              </div>

              {/* Continue Button */}
              <button
                onClick={handleComplete}
                disabled={!privateKeyDownloaded}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('elgamal.continueButton') || 'Continuer'}
              </button>

              {!privateKeyDownloaded && (
                <p className="text-center text-sm text-gray-500">
                  {t('elgamal.downloadFirst') ||
                    'Vous devez d\'abord télécharger la clé privée'}
                </p>
              )}
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="space-y-4 text-center py-8">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-2xl font-bold text-green-600">
                Configuration réussie !
              </h3>
              <p className="text-lg text-gray-700">
                Le chiffrement ElGamal a été configuré avec succès pour votre élection.
              </p>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h4 className="font-semibold text-green-900">Clés ElGamal générées</h4>
                    <p className="text-sm text-green-700">Vos clés de chiffrement ont été créées et sauvegardées</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <h4 className="font-semibold text-green-900">Clé publique stockée on-chain</h4>
                    <p className="text-sm text-green-700">La transaction a été confirmée sur la blockchain</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🗳️</span>
                  <div>
                    <h4 className="font-semibold text-green-900">Vote privé activé</h4>
                    <p className="text-sm text-green-700">Les électeurs pourront maintenant voter de manière chiffrée</p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <div className="flex gap-2">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Rappel important</h4>
                    <p className="text-sm text-yellow-700">
                      Conservez précieusement votre clé privée téléchargée. Vous en aurez besoin pour déchiffrer les votes après la clôture de l'élection.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md"
              >
                ✓ Terminer
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-2">
          {step !== 'complete' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              {t('elgamal.cancel') || 'Annuler'}
            </button>
          )}
        </div>
      </div>

      {/* Modal de progression de transaction */}
      <TransactionProgressModal
        isOpen={showTransactionModal}
        transactionHash={transactionHash}
        title="Stockage de la clé publique"
        onClose={handleTransactionClose}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
};
