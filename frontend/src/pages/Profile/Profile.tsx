import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetAccount } from 'lib';
import { useGetUserVotingHistory, useElectionMetadata, useIPFSImage } from 'hooks/elections';
import { RouteNamesEnum } from 'localConstants';
import { SkeletonProfile } from '../../components/Skeleton';

export const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { address } = useGetAccount();
  const { votingHistory, loading } = useGetUserVotingHistory();

  // Calculer les statistiques
  const stats = {
    totalVotes: votingHistory.length,
    activeElections: votingHistory.filter(e => {
      const now = Date.now() / 1000;
      return e.status === 'Active' && e.start_time <= now && e.end_time > now;
    }).length,
    closedElections: votingHistory.filter(e => {
      const now = Date.now() / 1000;
      return e.status === 'Closed' || e.end_time < now;
    }).length,
    finalizedElections: votingHistory.filter(e => e.status === 'Finalized').length
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 20) return addr;
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
          <svg className="w-20 h-20 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">
              {t('profile.auth.title')}
            </h2>
            <p className="text-secondary mb-6">
              {t('profile.auth.message')}
            </p>
            <button
              onClick={() => navigate(RouteNamesEnum.unlock)}
              className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold"
            >
              {t('profile.auth.connect')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <SkeletonProfile />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">{t('profile.title')}</h1>
        <p className="text-secondary text-lg">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Informations du compte */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 mb-8 shadow-md">
        <h2 className="text-xl font-bold text-primary mb-4">👤 {t('profile.account.title')}</h2>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-accent bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-secondary font-medium mb-1">{t('profile.account.address')}</p>
            <p className="text-primary font-mono text-sm break-all">{address}</p>
            <p className="text-xs text-tertiary mt-1">{formatAddress(address)}</p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-accent mb-2">{stats.totalVotes}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">
            {stats.totalVotes > 1 ? t('profile.stats.totalVotes') : t('profile.stats.totalVote')}
          </span>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-success mb-2">{stats.activeElections}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">{t('profile.stats.active')}</span>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-secondary mb-2">{stats.closedElections}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">{stats.closedElections > 1 ? t('profile.stats.closed_plural') : t('profile.stats.closed')}</span>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
          <span className="block text-4xl font-bold text-accent mb-2">{stats.finalizedElections}</span>
          <span className="text-sm text-secondary font-medium uppercase tracking-wide">{stats.finalizedElections > 1 ? t('profile.stats.finalized_plural') : t('profile.stats.finalized')}</span>
        </div>
      </div>

      {/* Historique des votes */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-primary mb-4">📊 {t('profile.history.title')}</h2>

        {votingHistory.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-secondary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-semibold text-primary mb-2">
              {t('profile.history.noVotes.title')}
            </h3>
            <p className="text-secondary mb-6">
              {t('profile.history.noVotes.message')}
            </p>
            <button
              onClick={() => navigate(RouteNamesEnum.elections)}
              className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold"
            >
              {t('profile.history.noVotes.action')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {votingHistory.map((election) => (
              <VotedElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour afficher une élection votée
const VotedElectionCard = ({ election }: { election: any }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { metadata } = useElectionMetadata(election.description_ipfs);
  const imageUrl = useIPFSImage(metadata?.image);

  const now = Date.now() / 1000;
  const isActive = election.status === 'Active' && election.start_time <= now && election.end_time > now;
  const isClosed = election.status === 'Closed' || election.end_time < now;
  const isFinalized = election.status === 'Finalized';

  const getBadge = () => {
    if (isFinalized) return { text: t('electionCard.status.finalized'), className: 'bg-accent text-primary' };
    if (isClosed) return { text: t('electionCard.status.closed'), className: 'bg-secondary text-secondary' };
    if (isActive) return { text: t('electionCard.status.active'), className: 'bg-success text-white' };
    return { text: t('electionCard.status.pending'), className: 'bg-warning text-white' };
  };

  const badge = getBadge();

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div
      onClick={() => navigate(RouteNamesEnum.electionDetail.replace(':id', election.id.toString()))}
      className="bg-primary border-2 border-secondary vibe-border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        {imageUrl && (
          <div className="w-full sm:w-32 h-32 bg-tertiary flex-shrink-0 relative">
            <img
              src={imageUrl}
              alt={election.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
            <div className={`absolute top-2 right-2 ${badge.className} px-2 py-0.5 rounded-full text-xs font-semibold`}>
              {badge.text}
            </div>
          </div>
        )}

        {/* Contenu */}
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary mb-1">{election.title}</h3>
              {metadata?.description && (
                <p className="text-sm text-secondary line-clamp-1">
                  {metadata.description}
                </p>
              )}
            </div>
            {!imageUrl && (
              <span className={`${badge.className} px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap`}>
                {badge.text}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary mt-3">
            <div className="flex items-center gap-1">
              <span>✅</span>
              <span className="font-semibold text-success">{t('profile.card.youVoted')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>{t('profile.card.end')}: {formatDateTime(election.end_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🗳️</span>
              <span>{election.total_votes} {election.total_votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
