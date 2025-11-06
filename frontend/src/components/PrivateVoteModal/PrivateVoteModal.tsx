import { useEffect, useState } from 'react';
import { useTransactionWatcher } from '../../hooks/transactions/useTransactionWatcher';

interface PrivateVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  txHash: string | null;
  voteType?: 'zk-snark' | 'elgamal' | 'elgamal-zksnark';
}

type VoteStatus = 'pending' | 'success' | 'error';

export const PrivateVoteModal = ({ isOpen, onClose, sessionId, txHash, voteType = 'zk-snark' }: PrivateVoteModalProps) => {
  const isZkSnark = voteType === 'zk-snark';
  const isElGamal = voteType === 'elgamal';
  const isElGamalZkSnark = voteType === 'elgamal-zksnark';
  const [status, setStatus] = useState<VoteStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { result: txResult, loading: txLoading } = useTransactionWatcher(txHash);

  useEffect(() => {
    if (!txHash) {
      setStatus('pending');
      return;
    }

    // Si txHash est 'success-no-hash', on affiche directement le succès
    if (txHash === 'success-no-hash') {
      console.log('✅ Vote privé soumis avec succès (pas de txHash trouvé, mais transaction envoyée)');
      setStatus('success');
      return;
    }

    // Surveiller le résultat de la transaction avec le txHash
    console.log('👀 Surveillance de la transaction:', txHash);
    console.log('📊 Transaction result:', { isCompleted: txResult.isCompleted, isSuccess: txResult.isSuccess });

    if (txResult.isCompleted) {
      if (txResult.isSuccess) {
        console.log('✅ Transaction validée avec succès');
        setStatus('success');
      } else {
        console.error('❌ Transaction échouée:', txResult.error);
        setStatus('error');
        setErrorMessage(txResult.error || 'Une erreur inconnue est survenue lors de la validation du vote.');
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
            {/* Animated lock icon */}
            <div className="relative">
              <div className="w-24 h-24 border-4 border-secondary rounded-full animate-spin"></div>
              <div
                className="w-24 h-24 border-4 border-accent border-t-transparent rounded-full animate-spin absolute top-0 left-0"
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl animate-pulse">🔐</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="private-vote-modal-text font-bold text-2xl mb-2">
                Vote Privé en Cours
              </h3>
              <p className="private-vote-modal-text font-semibold text-lg">
                ⏳ Validation sur la blockchain...
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div className="h-full bg-accent animate-pulse" style={{ width: '100%' }}></div>
            </div>

            {/* Description */}
            <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-4 w-full">
              <p className="private-vote-modal-text text-sm text-center leading-relaxed font-medium">
                {isZkSnark && 'Votre vote privé zk-SNARK est en cours de validation sur la blockchain MultiversX.'}
                {isElGamal && 'Votre vote chiffré ElGamal est en cours de validation sur la blockchain MultiversX.'}
                {isElGamalZkSnark && 'Votre vote chiffré ElGamal + zk-SNARK (Option 2) est en cours de validation sur la blockchain MultiversX.'}
                <br />
                <span className="text-accent font-semibold">Veuillez patienter...</span>
              </p>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-2 w-full">
              <div className="flex items-center gap-2 text-xs private-vote-modal-text font-medium">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span>Signature</span>
              </div>
              <div className="flex-1 h-px bg-white opacity-30"></div>
              <div className="flex items-center gap-2 text-xs private-vote-modal-text font-medium">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <span>Validation</span>
              </div>
              <div className="flex-1 h-px bg-white opacity-30"></div>
              <div className="flex items-center gap-2 text-xs private-vote-modal-text font-medium">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>Confirmation</span>
              </div>
            </div>
          </div>
        )}

        {/* Success State - Vote validé */}
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
              <h3 className="private-vote-modal-text font-bold text-3xl mb-2">
                {isZkSnark && 'Vote Privé Enregistré avec Succès! 🔐'}
                {isElGamal && 'Vote Chiffré Enregistré avec Succès! 🔐'}
                {isElGamalZkSnark && 'Vote Option 2 Enregistré avec Succès! 🛡️'}
              </h3>
              <p className="private-vote-modal-text font-semibold text-lg">
                {isZkSnark && 'Votre vote anonyme a été validé'}
                {isElGamal && 'Votre vote chiffré a été validé'}
                {isElGamalZkSnark && 'Votre vote avec sécurité maximale a été validé'}
              </p>
            </div>

            {/* Success message */}
            <div className="bg-success bg-opacity-10 border-2 border-success rounded-lg p-4 w-full">
              <div className="space-y-3">
                <p className="private-vote-modal-text text-sm text-center leading-relaxed font-medium">
                  ✓ Vote enregistré sur la blockchain MultiversX
                </p>
                <p className="private-vote-modal-text text-sm text-center leading-relaxed font-medium">
                  {isZkSnark && '✓ Preuve zk-SNARK vérifiée'}
                  {isElGamal && '✓ Vote chiffré avec ElGamal'}
                  {isElGamalZkSnark && '✓ Vote chiffré ElGamal + Preuve zk-SNARK vérifiée'}
                </p>
                <p className="private-vote-modal-text text-sm text-center leading-relaxed font-medium">
                  {isZkSnark && '✓ Anonymat garanti à 100%'}
                  {isElGamal && '✓ Confidentialité garantie'}
                  {isElGamalZkSnark && '✓ Anonymat total avec nullifier + Validité mathématique prouvée'}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="bg-accent bg-opacity-10 border border-accent rounded-lg p-4 w-full">
              <p className="private-vote-modal-text text-xs text-center leading-relaxed">
                {isZkSnark && (
                  <>
                    🔒 Votre choix de vote reste privé et ne peut être révélé par personne.
                    <br />
                    Seul le fait que vous ayez voté est public.
                  </>
                )}
                {isElGamal && (
                  <>
                    🔒 Votre vote est chiffré avec ElGamal et ne peut être déchiffré que par l'organisateur après la clôture.
                    <br />
                    Votre choix reste confidentiel jusqu'au décompte final.
                  </>
                )}
                {isElGamalZkSnark && (
                  <>
                    🛡️ Votre vote est chiffré ElGamal (confidentialité) ET prouvé valide par zk-SNARK (sécurité maximale).
                    <br />
                    Votre identité est masquée par un nullifier unique. Aucun lien traçable avec votre wallet.
                  </>
                )}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-full bg-success private-vote-modal-button px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold uppercase tracking-wide shadow-md"
            >
              Fermer
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
              <h3 className="private-vote-modal-text font-bold text-3xl mb-2">
                Erreur lors du Vote Privé
              </h3>
              <p className="private-vote-modal-text font-semibold text-lg">
                La transaction a échoué
              </p>
            </div>

            {/* Error message */}
            <div className="bg-error bg-opacity-10 border-2 border-error rounded-lg p-4 w-full">
              <div className="space-y-3">
                <p className="private-vote-modal-text text-sm font-bold text-center">
                  Détails de l'erreur :
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
              <p className="private-vote-modal-text text-xs text-center leading-relaxed">
                💡 Suggestions :
                <br />
                • Vérifiez que vous êtes inscrit à cette élection
                <br />
                • Assurez-vous de ne pas avoir déjà voté
                <br />
                • Vérifiez votre solde de tokens EGLD
                <br />
                • Réessayez dans quelques instants
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-full bg-error text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold uppercase tracking-wide shadow-md"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
