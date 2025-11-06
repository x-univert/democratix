import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactionWatcher } from '../../hooks/transactions/useTransactionWatcher';

interface ActivateElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  txHash: string | null;
  electionTitle?: string;
}

type ActivationStatus = 'pending' | 'success' | 'error';

export const ActivateElectionModal = ({
  isOpen,
  onClose,
  sessionId,
  txHash,
  electionTitle = ''
}: ActivateElectionModalProps) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ActivationStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { result: txResult, loading: txLoading } = useTransactionWatcher(txHash);

  useEffect(() => {
    if (!txHash) {
      setStatus('pending');
      return;
    }

    // Si txHash est 'success-no-hash', on affiche directement le succès
    if (txHash === 'success-no-hash') {
      console.log('✅ Élection activée avec succès (pas de txHash trouvé, mais transaction envoyée)');
      setStatus('success');
      return;
    }

    // Surveiller le résultat de la transaction avec le txHash
    console.log('👀 Surveillance de la transaction d\'activation:', txHash);
    console.log('📊 Transaction result:', { isCompleted: txResult.isCompleted, isSuccess: txResult.isSuccess });

    if (txResult.isCompleted) {
      if (txResult.isSuccess) {
        console.log('✅ Élection activée avec succès');
        setStatus('success');
      } else {
        console.error('❌ Échec de l\'activation:', txResult.error);
        setStatus('error');
        setErrorMessage(txResult.error || 'Une erreur inconnue est survenue lors de l\'activation de l\'élection.');
      }
    }
  }, [txResult, txHash]);

  const handleClose = () => {
    if (status !== 'pending') {
      onClose();
      // Reset state after closing
      setTimeout(() => {
        setStatus('pending');
        setErrorMessage('');
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-primary via-secondary to-primary border-2 border-accent vibe-border rounded-2xl p-8 shadow-2xl max-w-lg w-full">
        {/* Pending State - Transaction en cours */}
        {status === 'pending' && (
          <div className="flex flex-col items-center gap-6">
            {/* Animated icon */}
            <div className="relative">
              <div className="w-24 h-24 border-4 border-secondary rounded-full animate-spin"></div>
              <div
                className="w-24 h-24 border-4 border-accent border-t-transparent rounded-full animate-spin absolute top-0 left-0"
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl animate-pulse">⚡</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-white font-bold text-2xl mb-2">
                {t('electionDetail.activating', 'Activation en cours')}
              </h3>
              <p className="text-white font-semibold text-lg">
                ⏳ {t('common.pleaseWait', 'Validation sur la blockchain...')}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div className="h-full bg-accent animate-pulse" style={{ width: '100%' }}></div>
            </div>

            {/* Description */}
            <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-4 w-full">
              <p className="text-white text-sm text-center leading-relaxed font-medium">
                {t('electionDetail.activatingMessage', 'L\'élection est en cours d\'activation sur la blockchain MultiversX.')}
                <br />
                <span className="text-accent font-semibold">
                  {t('common.pleaseWait', 'Veuillez patienter...')}
                </span>
              </p>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-2 w-full">
              <div className="flex items-center gap-2 text-xs text-white font-medium">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span>{t('common.transaction', 'Transaction')}</span>
              </div>
              <div className="flex-1 h-px bg-white opacity-30"></div>
              <div className="flex items-center gap-2 text-xs text-white font-medium">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <span>{t('common.validation', 'Validation')}</span>
              </div>
              <div className="flex-1 h-px bg-white opacity-30"></div>
              <div className="flex items-center gap-2 text-xs text-white font-medium">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>{t('common.confirmation', 'Confirmation')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Success State - Élection activée */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-6 animate-scaleIn">
            {/* Success icon */}
            <div className="relative">
              <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center shadow-lg">
                <span className="text-5xl">✅</span>
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-success rounded-full animate-ping opacity-20"></div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-white font-bold text-3xl mb-2">
                {t('electionDetail.activationSuccess', 'Élection activée avec succès!')} 🎉
              </h3>
              {electionTitle && (
                <p className="text-white font-semibold text-lg">
                  {electionTitle}
                </p>
              )}
            </div>

            {/* Success message */}
            <div className="bg-success bg-opacity-10 border-2 border-success rounded-lg p-4 w-full">
              <div className="space-y-3">
                <p className="text-white text-sm text-center leading-relaxed font-medium">
                  ✓ {t('electionDetail.activationConfirmed', 'L\'élection a été activée sur la blockchain')}
                </p>
                <p className="text-white text-sm text-center leading-relaxed font-medium">
                  ✓ {t('electionDetail.votersCanVote', 'Les électeurs peuvent maintenant voter')}
                </p>
                <p className="text-white text-sm text-center leading-relaxed font-medium">
                  ✓ {t('electionDetail.electionLive', 'L\'élection est maintenant en cours')}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-4 w-full">
              <p className="text-white text-xs text-center leading-relaxed">
                🔔 {t('electionDetail.activationInfo', 'La page va se recharger automatiquement pour afficher le statut mis à jour.')}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-full bg-success text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold uppercase tracking-wide shadow-md"
            >
              {t('common.close', 'Fermer')}
            </button>
          </div>
        )}

        {/* Error State - Échec */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-6 animate-scaleIn">
            {/* Error icon */}
            <div className="relative">
              <div className="w-24 h-24 bg-error rounded-full flex items-center justify-center shadow-lg">
                <span className="text-5xl">❌</span>
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-error rounded-full animate-ping opacity-20"></div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-white font-bold text-3xl mb-2">
                {t('electionDetail.activationError', 'Erreur lors de l\'activation')}
              </h3>
              <p className="text-white font-semibold text-lg">
                {t('electionDetail.transactionFailed', 'La transaction a échoué')}
              </p>
            </div>

            {/* Error message */}
            <div className="bg-error bg-opacity-10 border-2 border-error rounded-lg p-4 w-full">
              <div className="space-y-3">
                <p className="text-white text-sm font-bold text-center">
                  {t('common.errorDetails', 'Détails de l\'erreur :')}
                </p>
                <div className="bg-primary bg-opacity-50 rounded-lg p-3">
                  <p className="text-error text-xs text-center font-mono leading-relaxed break-words">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* Help message */}
            <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-4 w-full">
              <p className="text-white text-xs text-center leading-relaxed">
                💡 {t('electionDetail.activationSuggestions', 'Suggestions :')}
                <br />
                • {t('electionDetail.checkCandidates', 'Vérifiez qu\'il y a au moins 2 candidats')}
                <br />
                • {t('electionDetail.checkDates', 'Vérifiez que les dates sont correctes')}
                <br />
                • {t('electionDetail.checkBalance', 'Vérifiez votre solde de tokens EGLD')}
                <br />
                • {t('electionDetail.retryLater', 'Réessayez dans quelques instants')}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-full bg-error text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold uppercase tracking-wide shadow-md"
            >
              {t('common.close', 'Fermer')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
