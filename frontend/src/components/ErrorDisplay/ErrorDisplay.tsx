import { UserFriendlyError } from '../../utils/errorMessages';

interface ErrorDisplayProps {
  error: UserFriendlyError;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const ErrorDisplay = ({ error, onDismiss, onRetry }: ErrorDisplayProps) => {
  const severityColors = {
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const severityIcons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colorClass = severityColors[error.severity];
  const icon = severityIcons[error.severity];

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-3xl flex-shrink-0">{icon}</span>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{error.title}</h3>
            <p className="text-sm leading-relaxed">{error.message}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Actions */}
      {error.actions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <p className="font-semibold text-sm mb-2">Que faire ?</p>
          <ul className="space-y-1 text-sm">
            {error.actions.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="font-bold flex-shrink-0">{index + 1}.</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technical Details (collapsible) */}
      {error.technicalDetails && (
        <details className="mt-4 pt-4 border-t border-current border-opacity-20">
          <summary className="cursor-pointer text-sm font-semibold hover:underline">
            Détails techniques
          </summary>
          <pre className="mt-2 text-xs bg-black bg-opacity-10 p-3 rounded overflow-x-auto">
            {error.technicalDetails}
          </pre>
        </details>
      )}

      {/* Retry Button */}
      {onRetry && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-white border-2 border-current rounded-lg font-semibold text-sm hover:bg-opacity-90 transition-colors"
          >
            🔄 Réessayer
          </button>
        </div>
      )}
    </div>
  );
};

// Compact version for inline errors
interface ErrorBannerProps {
  error: UserFriendlyError;
  onDismiss?: () => void;
}

export const ErrorBanner = ({ error, onDismiss }: ErrorBannerProps) => {
  const severityColors = {
    error: 'bg-red-100 border-red-300 text-red-800',
    warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    info: 'bg-blue-100 border-blue-300 text-blue-800',
  };

  const severityIcons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colorClass = severityColors[error.severity];
  const icon = severityIcons[error.severity];

  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-xl flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{error.title}</p>
            <p className="text-xs mt-1 opacity-90">{error.message}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-current opacity-60 hover:opacity-100 flex-shrink-0"
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
