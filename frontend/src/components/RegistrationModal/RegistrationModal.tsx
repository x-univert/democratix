import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactionWatcher } from '../../hooks/transactions/useTransactionWatcher';

interface RegistrationModalProps {
  isOpen: boolean;
  transactionHash?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrationModal = ({
  isOpen,
  transactionHash,
  onClose,
  onSuccess
}: RegistrationModalProps) => {
  const { t } = useTranslation();
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);

  // Watch transaction
  const { isCompleted, isSuccess } = useTransactionWatcher(transactionHash || '');

  useEffect(() => {
    setLocalIsOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isCompleted && isSuccess) {
      onSuccess();
    }
  }, [isCompleted, isSuccess, onSuccess]);

  const handleClose = () => {
    setLocalIsOpen(false);
    setTimeout(onClose, 300);
  };

  if (!localIsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-secondary border-2 border-accent rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            🎫 {t('registrationModal.title', 'Inscription en cours')}
          </h2>
          {isCompleted && (
            <button
              onClick={handleClose}
              className="text-secondary hover:text-primary transition-colors text-2xl leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          )}
        </div>

        {/* Status */}
        <div className="space-y-4">
          {!isCompleted && (
            <>
              {/* Loading animation */}
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-4 border-accent border-t-transparent rounded-full animate-spin-reverse"></div>
                  <div className="absolute inset-4 flex items-center justify-center">
                    <span className="text-2xl">🎫</span>
                  </div>
                </div>
                <p className="text-center text-primary font-medium">
                  {t('registrationModal.processing', 'Traitement de votre inscription...')}
                </p>
                <p className="text-center text-secondary text-sm">
                  {t('registrationModal.pleaseWait', 'Veuillez patienter pendant que la transaction est validée sur la blockchain.')}
                </p>
              </div>

              {/* Transaction hash */}
              {transactionHash && (
                <div className="bg-primary rounded-lg p-3">
                  <p className="text-xs text-secondary mb-1">
                    {t('registrationModal.transactionHash', 'Hash de transaction :')}
                  </p>
                  <p className="text-xs font-mono text-primary break-all">
                    {transactionHash}
                  </p>
                </div>
              )}
            </>
          )}

          {isCompleted && isSuccess && (
            <>
              {/* Success animation */}
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center animate-scaleIn">
                  <span className="text-4xl">✓</span>
                </div>
                <h3 className="text-xl font-bold text-success">
                  {t('registrationModal.success', 'Inscription réussie !')}
                </h3>
                <p className="text-center text-primary">
                  {t('registrationModal.successMessage', 'Vous êtes maintenant inscrit à cette élection. Vous pouvez voter !')}
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={handleClose}
                className="w-full bg-success text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold"
              >
                {t('registrationModal.close', 'Continuer')}
              </button>
            </>
          )}

          {isCompleted && !isSuccess && (
            <>
              {/* Error animation */}
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 bg-error rounded-full flex items-center justify-center animate-scaleIn">
                  <span className="text-4xl">✗</span>
                </div>
                <h3 className="text-xl font-bold text-error">
                  {t('registrationModal.error', 'Échec de l\'inscription')}
                </h3>
                <p className="text-center text-secondary text-sm">
                  {t('registrationModal.errorMessage', 'La transaction a échoué. Veuillez vérifier votre code d\'invitation et réessayer.')}
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={handleClose}
                className="w-full bg-secondary text-primary border-2 border-secondary px-6 py-3 rounded-lg hover:bg-tertiary transition-all font-semibold"
              >
                {t('registrationModal.retry', 'Fermer')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
