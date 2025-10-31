import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentStep?: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, currentStep }) => {
  const { t } = useTranslation();

  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <div className="w-6 h-6 border-4 border-gray-300 rounded-full"></div>
        );
    }
  };

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'in_progress':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('createElection.progressTitle', 'Creation Progress')}
      </h3>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-3 top-10 w-0.5 h-8 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}

            {/* Étape */}
            <div className={`flex items-start gap-4 p-4 border-2 rounded-lg transition-all ${getStatusColor(step.status)}`}>
              {/* Icône de statut */}
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(step.status)}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {step.label}
                  </h4>
                  {step.status === 'in_progress' && (
                    <span className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                      {t('common.inProgress', 'In progress...')}
                    </span>
                  )}
                </div>

                {step.message && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {step.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barre de progression globale */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{t('common.progress', 'Progress')}</span>
          <span>
            {steps.filter(s => s.status === 'completed').length} / {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
            style={{
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};
