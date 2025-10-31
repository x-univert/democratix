interface TransactionSentModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
}

export const TransactionSentModal = ({
  isOpen,
  onClose,
  count
}: TransactionSentModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-primary via-secondary to-primary border-2 border-success vibe-border rounded-2xl p-8 shadow-2xl max-w-md w-full animate-slideUp">
        <div className="flex flex-col items-center gap-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-24 h-24 bg-success bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-20 h-20 bg-success bg-opacity-30 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Sparkles */}
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
            <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-success font-bold text-2xl mb-2">
              ✅ Transaction envoyée !
            </h3>
            <p className="text-primary font-semibold text-lg">
              {count} code{count > 1 ? 's' : ''} en cours de génération
            </p>
          </div>

          {/* Progress indicator */}
          <div className="w-full space-y-3">
            {/* Animated progress bar */}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-success via-accent to-success animate-pulse"
                style={{
                  width: '100%',
                  animation: 'shimmer 2s infinite'
                }}
              ></div>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-success">
                <div className="w-2 h-2 bg-success rounded-full animate-ping"></div>
                <span className="font-semibold">Envoi</span>
              </div>
              <div className="flex-1 h-px bg-secondary mx-2"></div>
              <div className="flex items-center gap-2 text-accent">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <span className="font-semibold">Traitement</span>
              </div>
              <div className="flex-1 h-px bg-secondary mx-2"></div>
              <div className="flex items-center gap-2 text-secondary">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>Récupération</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-success bg-opacity-10 border border-success rounded-xl p-4 w-full">
            <p className="text-gray-900 text-sm text-center leading-relaxed font-medium">
              <span className="text-success font-semibold block mb-2">
                ⏳ Récupération automatique en cours...
              </span>
              La transaction est en cours de finalisation sur la blockchain.
              <br />
              <span className="text-accent font-semibold">Les codes s'afficheront automatiquement</span> dans quelques secondes.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-accent bg-opacity-5 border border-accent rounded-lg p-3 w-full">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">💡</span>
              <p className="text-xs text-white leading-relaxed font-medium">
                <span className="font-semibold text-accent">Astuce :</span> Vous pouvez fermer cette fenêtre.
                Les codes apparaîtront dans la section "Codes d'Invitation" une fois la transaction finalisée.
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-all font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};
