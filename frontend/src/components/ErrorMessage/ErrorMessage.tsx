import { useTranslation } from 'react-i18next';

/**
 * Types d'erreurs supportées
 */
export type ErrorType = 'notFound' | 'loadError' | 'networkError' | 'permissionDenied' | 'generic';

export interface ErrorMessageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  icon?: string;
  showRetry?: boolean;
  retryLabel?: string;
  onRetry?: () => void;
  showBackButton?: boolean;
  backLabel?: string;
  onBack?: () => void;
}

/**
 * Composant pour afficher des messages d'erreur clairs et utiles
 */
export const ErrorMessage = ({
  type = 'generic',
  title,
  message,
  icon,
  showRetry = false,
  retryLabel,
  onRetry,
  showBackButton = false,
  backLabel,
  onBack
}: ErrorMessageProps) => {
  const { t } = useTranslation();

  // Configurations par défaut selon le type d'erreur
  const errorConfigs: Record<ErrorType, { icon: string; title: string; message: string; showRetry: boolean }> = {
    notFound: {
      icon: '🔍',
      title: t('common.error'),
      message: t('common.notFound', 'The resource was not found.'),
      showRetry: false
    },
    loadError: {
      icon: '⚠️',
      title: t('common.error'),
      message: t('common.loadError', 'Error loading data. Please try again.'),
      showRetry: true
    },
    networkError: {
      icon: '📡',
      title: t('common.error'),
      message: t('common.networkError', 'Network error. Check your internet connection.'),
      showRetry: true
    },
    permissionDenied: {
      icon: '🔒',
      title: t('common.error'),
      message: t('common.permissionDenied', 'Permission denied. You do not have access to this resource.'),
      showRetry: false
    },
    generic: {
      icon: '❌',
      title: t('common.error'),
      message: t('common.genericError', 'An error occurred. Please try again.'),
      showRetry: true
    }
  };

  const config = errorConfigs[type];
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;
  const shouldShowRetry = showRetry !== undefined ? showRetry : config.showRetry;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 py-8">
      <div className="max-w-md w-full bg-secondary border-2 border-error rounded-xl p-8 text-center shadow-lg">
        {/* Icon */}
        <div className="text-6xl mb-4">{displayIcon}</div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-primary mb-3">
          {displayTitle}
        </h2>

        {/* Message */}
        <p className="text-secondary text-lg mb-6 leading-relaxed">
          {displayMessage}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {shouldShowRetry && onRetry && (
            <button
              onClick={onRetry}
              className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              {retryLabel || t('common.retry', 'Retry')}
            </button>
          )}

          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="bg-secondary text-secondary border-2 border-secondary px-6 py-3 rounded-lg hover:bg-tertiary transition-colors font-semibold"
            >
              {backLabel || t('common.goBack', 'Go Back')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
