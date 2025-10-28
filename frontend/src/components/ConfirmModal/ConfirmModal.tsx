import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  confirmButtonClass?: string;
}

export const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning',
  confirmButtonClass
}: ConfirmModalProps) => {
  const { t } = useTranslation();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus sur le bouton annuler par défaut (sécurité)
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: '🚨',
      iconBg: 'bg-red-500 bg-opacity-20',
      iconColor: 'text-red-500',
      border: 'border-red-500'
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-warning bg-opacity-20',
      iconColor: 'text-warning',
      border: 'border-warning'
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-accent bg-opacity-20',
      iconColor: 'text-accent',
      border: 'border-accent'
    }
  };

  const style = typeStyles[type];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-50 animate-fadeIn"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
      >
        <div
          className="bg-primary border-2 border-secondary vibe-border rounded-xl shadow-2xl max-w-md w-full pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec icône */}
          <div className={`flex items-center gap-4 p-6 border-b-2 ${style.border}`}>
            <div className={`${style.iconBg} p-3 rounded-full flex-shrink-0`}>
              <span className="text-3xl" role="img" aria-label={type}>
                {style.icon}
              </span>
            </div>
            <h2
              id="confirm-modal-title"
              className={`text-2xl font-bold ${style.iconColor}`}
            >
              {title}
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <p
              id="confirm-modal-description"
              className="text-secondary text-lg leading-relaxed"
            >
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t-2 border-secondary">
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-secondary text-primary border-2 border-secondary vibe-border rounded-lg hover:bg-tertiary transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label={cancelText || t('common.cancel')}
            >
              {cancelText || t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className={
                confirmButtonClass ||
                `flex-1 px-6 py-3 bg-btn-primary text-btn-primary rounded-lg hover:bg-btn-hover transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-accent shadow-md`
              }
              aria-label={confirmText || t('common.confirm')}
            >
              {confirmText || t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
