import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PrivateVote {
  vote_commitment: string;
  nullifier: string;
  timestamp: number;
}

interface AnonymousVotesPanelProps {
  electionId: number;
  privateVotes: PrivateVote[];
  totalPrivateVotes: number;
  isLoading?: boolean;
}

/**
 * Composant pour visualiser les votes privés anonymes
 * Affiche les commitments et nullifiers sans révéler l'identité des votants
 */
export const AnonymousVotesPanel = ({
  electionId,
  privateVotes,
  totalPrivateVotes,
  isLoading = false
}: AnonymousVotesPanelProps) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVote, setSelectedVote] = useState<PrivateVote | null>(null);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatHash = (hash: string, short = true) => {
    if (short) {
      return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
    }
    return hash;
  };

  if (isLoading) {
    return (
      <div className="bg-primary border-2 border-secondary vibe-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-accent text-2xl">🔐</span>
          <h3 className="text-xl font-bold text-primary">
            {t('results.anonymousVotes', 'Votes Anonymes (zk-SNARK)')}
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-secondary mt-4">{t('common.loading', 'Chargement')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary border-2 border-secondary vibe-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-accent bg-opacity-20 p-3 rounded-xl">
            <span className="text-accent text-2xl">🔐</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">
              {t('results.anonymousVotes', 'Votes Anonymes (zk-SNARK)')}
            </h3>
            <p className="text-sm text-secondary">
              {t('results.anonymousVotesDesc', 'Votes cryptographiquement privés - Identité protégée')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-accent">{totalPrivateVotes}</div>
          <div className="text-xs text-secondary uppercase">
            {t('results.privateVotesCount', 'Votes privés')}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-tertiary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-success">✅</span>
            <span className="text-xs text-secondary uppercase">{t('results.verified', 'Vérifiés')}</span>
          </div>
          <div className="text-2xl font-bold text-primary">{totalPrivateVotes}</div>
          <div className="text-xs text-secondary mt-1">
            {t('results.cryptographicallyVerified', 'Preuves zk-SNARK validées')}
          </div>
        </div>

        <div className="bg-tertiary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-accent">🔒</span>
            <span className="text-xs text-secondary uppercase">{t('results.anonymous', 'Anonymat')}</span>
          </div>
          <div className="text-2xl font-bold text-primary">100%</div>
          <div className="text-xs text-secondary mt-1">
            {t('results.identityProtected', 'Identité protégée')}
          </div>
        </div>

        <div className="bg-tertiary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-warning">✅</span>
            <span className="text-xs text-secondary uppercase">{t('results.uniqueness', 'Unicité')}</span>
          </div>
          <div className="text-2xl font-bold text-primary">{totalPrivateVotes}</div>
          <div className="text-xs text-secondary mt-1">
            {t('results.uniqueNullifiers', 'Nullifiers uniques')}
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-accent bg-opacity-10 border-l-4 border-accent rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <span className="text-accent flex-shrink-0 mt-1">🔐</span>
          <div className="text-sm">
            <p className="font-semibold text-primary mb-2">
              {t('results.privacyGuarantee', 'Garantie de Confidentialité')}
            </p>
            <ul className="text-secondary space-y-1 text-xs">
              <li>✅ {t('results.privacyPoint1', 'Le choix du candidat n\'est jamais révélé')}</li>
              <li>✅ {t('results.privacyPoint2', 'Seul le commitment (hash cryptographique) est visible')}</li>
              <li>✅ {t('results.privacyPoint3', 'Nullifiers empêchent le double vote sans révéler l\'identité')}</li>
              <li>✅ {t('results.privacyPoint4', 'Preuves zk-SNARK garantissent la validité mathématique')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toggle Details */}
      {privateVotes.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 bg-tertiary hover:bg-accent hover:text-primary rounded-lg transition-all text-secondary text-sm font-semibold"
          >
            {showDetails ? (
              <>
                <span>👁️‍🗨️</span> {t('results.hideDetails', 'Masquer les détails')}
              </>
            ) : (
              <>
                <span>👁️</span> {t('results.showDetails', 'Afficher les détails')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Votes List */}
      {showDetails && privateVotes.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-secondary uppercase font-semibold mb-2">
            {t('results.voteCommitments', 'Commitments de Vote')} ({privateVotes.length})
          </div>

          {privateVotes.map((vote, index) => (
            <div
              key={index}
              className={`bg-tertiary rounded-lg p-4 cursor-pointer hover:bg-accent hover:bg-opacity-20 transition-all ${
                selectedVote === vote ? 'ring-2 ring-accent' : ''
              }`}
              onClick={() => setSelectedVote(selectedVote === vote ? null : vote)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-primary px-2 py-1 rounded text-accent">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-secondary">
                      {formatTimestamp(vote.timestamp)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Commitment */}
                    <div>
                      <div className="text-xs text-secondary mb-1">
                        🔐 {t('results.voteCommitment', 'Commitment')}:
                      </div>
                      <div className="font-mono text-xs text-primary bg-primary bg-opacity-50 p-2 rounded break-all">
                        {selectedVote === vote
                          ? vote.vote_commitment
                          : formatHash(vote.vote_commitment)}
                      </div>
                    </div>

                    {/* Nullifier */}
                    {selectedVote === vote && (
                      <div>
                        <div className="text-xs text-secondary mb-1">
                          🔒 {t('results.nullifier', 'Nullifier')}:
                        </div>
                        <div className="font-mono text-xs text-accent bg-primary bg-opacity-50 p-2 rounded break-all">
                          {vote.nullifier}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span className="text-success text-lg">✅</span>
                </div>
              </div>

              {selectedVote === vote && (
                <div className="mt-3 pt-3 border-t border-secondary border-opacity-30">
                  <div className="text-xs text-secondary space-y-1">
                    <p>💡 <strong>{t('results.whatIsCommitment', 'Qu\'est-ce qu\'un commitment?')}</strong></p>
                    <p>{t('results.commitmentExplanation', 'Hash cryptographique qui cache le vote mais permet de le vérifier plus tard.')}</p>
                    <p className="mt-2">💡 <strong>{t('results.whatIsNullifier', 'Qu\'est-ce qu\'un nullifier?')}</strong></p>
                    <p>{t('results.nullifierExplanation', 'Identifiant unique qui empêche le double vote sans révéler l\'identité de l\'électeur.')}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {privateVotes.length === 0 && (
        <div className="text-center py-12">
          <span className="text-tertiary text-6xl mx-auto mb-4 opacity-50 block">🔐</span>
          <p className="text-secondary">
            {t('results.noPrivateVotes', 'Aucun vote privé pour cette élection')}
          </p>
          <p className="text-xs text-secondary mt-2">
            {t('results.privateVotesAppearHere', 'Les votes zk-SNARK apparaîtront ici')}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnonymousVotesPanel;
