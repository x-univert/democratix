import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetNetworkConfig } from 'lib';

interface TransactionProgressModalProps {
  isOpen: boolean;
  transactionHash?: string;
  title: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type TransactionStatus = 'pending' | 'processing' | 'success' | 'fail' | 'invalid';

export const TransactionProgressModal = ({
  isOpen,
  transactionHash,
  title,
  onClose,
  onSuccess
}: TransactionProgressModalProps) => {
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retries, setRetries] = useState(0);
  const maxRetries = 10; // 30 secondes max (3s x 10)

  useEffect(() => {
    if (!isOpen || !transactionHash) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkTransactionStatus = async () => {
      try {
        const txUrl = `${network.apiAddress}/transactions/${transactionHash}?withResults=true`;
        const response = await fetch(txUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const txData = await response.json();
        console.log(`Transaction status check (${retries + 1}/${maxRetries}):`, txData.status);

        if (!isMounted) return;

        if (txData.status === 'success' || txData.status === 'executed') {
          setStatus('success');
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
          return;
        } else if (txData.status === 'fail') {
          setStatus('fail');
          setErrorMessage(t('common.transactionFailed') || 'La transaction a échoué');
          return;
        } else if (txData.status === 'invalid') {
          setStatus('invalid');
          setErrorMessage(t('common.transactionInvalid') || 'Transaction invalide');
          return;
        }

        // Si encore pending et pas de timeout
        if (retries < maxRetries - 1) {
          setRetries(prev => prev + 1);
          setStatus('processing');
          timeoutId = setTimeout(checkTransactionStatus, 3000);
        } else {
          setStatus('fail');
          setErrorMessage(t('common.transactionTimeout') || 'Délai d\'attente dépassé');
        }
      } catch (error) {
        console.error('Error checking transaction:', error);
        if (!isMounted) return;

        if (retries < maxRetries - 1) {
          setRetries(prev => prev + 1);
          timeoutId = setTimeout(checkTransactionStatus, 3000);
        } else {
          setStatus('fail');
          setErrorMessage(t('common.networkError') || 'Erreur réseau');
        }
      }
    };

    // Démarrer la vérification
    setStatus('processing');
    setRetries(0);
    checkTransactionStatus();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, transactionHash, network.apiAddress, onSuccess, t]);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <div className="w-20 h-20 mx-auto mb-4 bg-success rounded-full flex items-center justify-center animate-scaleIn">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'fail':
      case 'invalid':
        return (
          <div className="w-20 h-20 mx-auto mb-4 bg-error rounded-full flex items-center justify-center animate-shake">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-20 h-20 mx-auto mb-4">
            <div className="w-20 h-20 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return t('common.pleaseWait');
      case 'processing':
        return `${t('common.validation')} (${retries + 1}/${maxRetries})...`;
      case 'success':
        return t('common.success');
      case 'fail':
      case 'invalid':
        return t('common.error');
      default:
        return '';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return t('electionDetail.activationConfirmed') || 'L\'élection a été activée sur la blockchain';
      case 'fail':
      case 'invalid':
        return errorMessage;
      default:
        return t('electionDetail.activatingMessage') || 'L\'élection est en cours d\'activation sur la blockchain MultiversX.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-secondary rounded-xl shadow-2xl p-8 max-w-md w-full border-2 border-secondary animate-slideUp">
        {/* Icon */}
        {getStatusIcon()}

        {/* Title */}
        <h2 className="text-2xl font-bold text-primary text-center mb-2">
          {status === 'success' ? t('electionDetail.activationSuccess') : title}
        </h2>

        {/* Status */}
        <p className="text-sm text-secondary text-center mb-4 font-medium">
          {getStatusText()}
        </p>

        {/* Message */}
        <p className="text-primary text-center mb-6">
          {getStatusMessage()}
        </p>

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="mb-6 p-3 bg-primary bg-opacity-10 rounded-lg border border-secondary">
            <p className="text-xs text-secondary mb-1">{t('common.transaction')}:</p>
            <p className="text-xs text-primary font-mono break-all">
              {transactionHash.substring(0, 10)}...{transactionHash.substring(transactionHash.length - 10)}
            </p>
          </div>
        )}

        {/* Additional info for success */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-success bg-opacity-10 border border-success rounded-lg">
            <p className="text-sm text-primary text-center">
              ✅ {t('electionDetail.votersCanVote') || 'Les électeurs peuvent maintenant voter'}
            </p>
          </div>
        )}

        {/* Error suggestions */}
        {(status === 'fail' || status === 'invalid') && (
          <div className="mb-6 p-4 bg-error bg-opacity-10 border border-error rounded-lg">
            <p className="text-sm text-primary font-semibold mb-2">
              {t('electionDetail.activationSuggestions') || 'Suggestions :'}
            </p>
            <ul className="text-xs text-primary space-y-1 list-disc list-inside">
              <li>{t('electionDetail.checkCandidates')}</li>
              <li>{t('electionDetail.checkDates')}</li>
              <li>{t('electionDetail.checkBalance')}</li>
              <li>{t('electionDetail.retryLater')}</li>
            </ul>
          </div>
        )}

        {/* Close button (only show when done) */}
        {(status === 'success' || status === 'fail' || status === 'invalid') && (
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-btn-primary text-btn-primary rounded-lg hover:bg-btn-hover transition-colors font-semibold"
          >
            {t('common.close')}
          </button>
        )}

        {/* Processing indicator */}
        {status === 'processing' && (
          <div className="text-center">
            <p className="text-xs text-secondary">
              {t('common.pleaseWait')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
