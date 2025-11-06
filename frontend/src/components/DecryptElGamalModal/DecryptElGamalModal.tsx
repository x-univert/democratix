import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3003';

interface DecryptElGamalModalProps {
  isOpen: boolean;
  onClose: () => void;
  electionId: number;
  onSuccess?: (decryptedVotes: any) => void;
}

export const DecryptElGamalModal = ({
  isOpen,
  onClose,
  electionId,
  onSuccess,
}: DecryptElGamalModalProps) => {
  const { t } = useTranslation();

  const [step, setStep] = useState<'upload' | 'decrypting' | 'complete' | 'error'>('upload');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [decryptedVotes, setDecryptedVotes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPrivateKey(content.trim());
    };
    reader.readAsText(file);
  };

  const handleDecrypt = async () => {
    if (!privateKey.trim()) {
      alert(t('elgamal.decrypt.errors.noPrivateKey') || 'Veuillez charger votre clé privée');
      return;
    }

    setLoading(true);
    setStep('decrypting');
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/elections/${electionId}/decrypt-votes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ privateKey }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to decrypt votes');
      }

      setDecryptedVotes(result.data);
      setStep('complete');
      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResults = () => {
    if (!decryptedVotes) return;

    const json = JSON.stringify(decryptedVotes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `election-${electionId}-decrypted-results.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setStep('upload');
    setPrivateKey('');
    setDecryptedVotes(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">🔓</span>
            {t('elgamal.decrypt.title') || 'Déchiffrement des Votes ElGamal'}
          </h2>
          <p className="text-teal-100 mt-2 text-sm">
            {t('elgamal.decrypt.subtitle') || 'Utilisez votre clé privée pour déchiffrer les votes'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: Upload Private Key */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {t('elgamal.decrypt.upload.title') || 'Charger votre clé privée'}
                </h3>
                <p className="text-blue-700 text-sm">
                  {t('elgamal.decrypt.upload.description') ||
                    'Chargez le fichier contenant votre clé privée ElGamal que vous avez téléchargée lors de la configuration de l\'élection.'}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-yellow-900">
                      {t('elgamal.decrypt.warning.title') || 'Sécurité'}
                    </h4>
                    <p className="text-yellow-700 text-sm">
                      {t('elgamal.decrypt.warning.message') ||
                        'Votre clé privée ne sera jamais envoyée au serveur. Le déchiffrement est effectué de manière sécurisée côté serveur.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="private-key-upload"
                />
                <label
                  htmlFor="private-key-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <span className="text-4xl">📄</span>
                  <span className="text-sm text-gray-700 font-medium">
                    {privateKey
                      ? '✅ Clé privée chargée'
                      : t('elgamal.decrypt.upload.clickToUpload') ||
                        'Cliquez pour charger votre clé privée'}
                  </span>
                  {privateKey && (
                    <span className="text-xs text-gray-500 font-mono truncate max-w-full px-4">
                      {privateKey.substring(0, 32)}...
                    </span>
                  )}
                </label>
              </div>

              {/* Manual Input (alternative) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('elgamal.decrypt.upload.manualInput') || 'Ou collez votre clé privée manuellement :'}
                </label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder={t('elgamal.decrypt.upload.placeholder') || 'Collez votre clé privée ici...'}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Decrypt Button */}
              <button
                onClick={handleDecrypt}
                disabled={!privateKey.trim() || loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? t('elgamal.decrypt.decrypting') || 'Déchiffrement en cours...'
                  : t('elgamal.decrypt.decryptButton') || '🔓 Déchiffrer les votes'}
              </button>
            </div>
          )}

          {/* Step: Decrypting */}
          {step === 'decrypting' && (
            <div className="space-y-4 text-center py-8">
              <div className="text-6xl mb-4 animate-bounce">🔓</div>
              <h3 className="text-xl font-semibold text-teal-900">
                {t('elgamal.decrypt.progress.title') || 'Déchiffrement en cours...'}
              </h3>
              <p className="text-gray-600">
                {t('elgamal.decrypt.progress.message') ||
                  'Veuillez patienter pendant que nous déchiffrons les votes'}
              </p>
              <div className="flex justify-center">
                <div className="animate-spin text-4xl">⏳</div>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && decryptedVotes && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h4 className="font-semibold text-green-900">
                      {t('elgamal.decrypt.success.title') || 'Déchiffrement réussi !'}
                    </h4>
                    <p className="text-green-700 text-sm">
                      {t('elgamal.decrypt.success.message') ||
                        'Les votes ont été déchiffrés avec succès.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {t('elgamal.decrypt.results.title') || 'Résultats déchiffrés'}
                </h4>
                <div className="space-y-2">
                  {decryptedVotes.results?.map((result: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-white rounded-lg"
                    >
                      <span className="font-medium text-gray-900">
                        {t('elgamal.decrypt.results.candidate') || 'Candidat'} #{result.candidateId}
                      </span>
                      <span className="text-lg font-bold text-teal-600">
                        {result.votes} {result.votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                      <span className="font-bold text-gray-900">
                        {t('elgamal.decrypt.results.total') || 'Total'}
                      </span>
                      <span className="text-xl font-bold text-teal-600">
                        {decryptedVotes.totalVotes || 0} {t('electionCard.votes_plural')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownloadResults}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                💾 {t('elgamal.decrypt.downloadResults') || 'Télécharger les résultats (JSON)'}
              </button>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {t('elgamal.close') || 'Fermer'}
              </button>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <span className="text-2xl">❌</span>
                  <div>
                    <h4 className="font-semibold text-red-900">
                      {t('elgamal.decrypt.error.title') || 'Erreur de déchiffrement'}
                    </h4>
                    <p className="text-red-700 text-sm">
                      {error || t('elgamal.decrypt.error.message') || 'Une erreur est survenue lors du déchiffrement.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('upload')}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                {t('elgamal.decrypt.retry') || 'Réessayer'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-2">
          {step !== 'complete' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              {t('elgamal.cancel') || 'Annuler'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
