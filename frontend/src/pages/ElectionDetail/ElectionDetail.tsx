import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetAccount } from 'lib';
import { useGetElection, type Election, useElectionMetadata, useIPFSImage, useCandidateMetadata } from '../../hooks/elections';
import { useGetCandidates, type Candidate } from '../../hooks/elections/useGetCandidates';
import { useGetCandidateVotes } from '../../hooks/elections/useGetCandidateVotes';
import { useActivateElection } from '../../hooks/transactions/useActivateElection';
import { useCloseElection } from '../../hooks/transactions/useCloseElection';
import { useFinalizeElection } from '../../hooks/transactions/useFinalizeElection';
import { RouteNamesEnum } from '../../localConstants';
import { SkeletonDetail } from '../../components/Skeleton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { ConfirmModal } from '../../components';

interface CandidateWithVotes extends Candidate {
  votes: number;
  percentage: number;
}

// Composant pour afficher un candidat avec image et biographie IPFS
const CandidateListItem = ({ candidate }: { candidate: Candidate }) => {
  const { metadata } = useCandidateMetadata(candidate.description_ipfs);
  const imageUrl = useIPFSImage(metadata?.image);

  return (
    <div className="bg-primary border-2 border-secondary vibe-border rounded-lg overflow-hidden hover:shadow-md transition-all hover:translate-x-1">
      <div className="flex flex-col sm:flex-row">
        {/* Image du candidat */}
        {imageUrl && (
          <div className="w-full sm:w-32 h-32 bg-tertiary flex-shrink-0">
            <img
              src={imageUrl}
              alt={candidate.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Informations */}
        <div className="p-4 flex-1">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <h3 className="text-lg font-bold text-primary">
              {metadata?.name || candidate.name}
            </h3>
            {metadata?.metadata?.party && (
              <span className="px-2 py-0.5 bg-accent bg-opacity-20 text-accent rounded-full text-xs font-semibold">
                {metadata.metadata.party}
              </span>
            )}
          </div>

          {/* Biographie courte */}
          {metadata?.biography && (
            <p className="text-sm text-secondary line-clamp-2 mb-2">
              {metadata.biography}
            </p>
          )}

          {/* Liens */}
          {(metadata?.links?.website || metadata?.links?.twitter) && (
            <div className="flex flex-wrap gap-2">
              {metadata.links.website && (
                <a
                  href={metadata.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-link"
                >
                  🌐 Site
                </a>
              )}
              {metadata.links.twitter && (
                <a
                  href={`https://twitter.com/${metadata.links.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-link"
                >
                  𝕏 {metadata.links.twitter}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ElectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { address } = useGetAccount();
  const { getElection } = useGetElection();
  const { getCandidates } = useGetCandidates();
  const { getCandidateVotes } = useGetCandidateVotes();
  const { activateElection } = useActivateElection();
  const { closeElection } = useCloseElection();
  const { finalizeElection } = useFinalizeElection();

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesWithVotes, setCandidatesWithVotes] = useState<CandidateWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  // Récupérer les métadonnées IPFS de l'élection
  const { metadata: electionMetadata, loading: metadataLoading } = useElectionMetadata(election?.description_ipfs);
  const electionImageUrl = useIPFSImage(electionMetadata?.image);

  useEffect(() => {
    const fetchElectionAndCandidates = async () => {
      if (!id) {
        setError('ID d\'élection manquant');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getElection(parseInt(id));
        if (!data) {
          setError(t('electionDetail.errors.notFound'));
        } else {
          setElection(data);
          const candidatesData = await getCandidates(parseInt(id));
          setCandidates(candidatesData);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'élection:', err);
        setError(t('electionDetail.errors.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchElectionAndCandidates();
  }, [id]);

  // Fetch votes for closed or finalized elections
  useEffect(() => {
    const fetchVotes = async () => {
      if (!election || candidates.length === 0) return;

      const now = Date.now() / 1000;
      const isClosedByTime = election.end_time < now;
      const isClosedByStatus = election.status === 'Closed' || election.status === 'Finalized';
      const canShowResults = isClosedByStatus || isClosedByTime;

      if (!canShowResults) return;

      setLoadingResults(true);
      try {
        const votesPromises = candidates.map(async (candidate) => {
          const votes = await getCandidateVotes(election.id, candidate.id);
          return { ...candidate, votes, percentage: 0 };
        });

        const results = await Promise.all(votesPromises);
        const totalVotes = results.reduce((sum, c) => sum + c.votes, 0);
        const withPercentages = results.map(c => ({
          ...c,
          percentage: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0
        }));

        withPercentages.sort((a, b) => b.votes - a.votes);
        setCandidatesWithVotes(withPercentages);
      } catch (err) {
        console.error('Erreur lors du chargement des résultats:', err);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchVotes();
  }, [election, candidates]);

  if (loading) {
    return <SkeletonDetail />;
  }

  if (error || !election) {
    return (
      <ErrorMessage
        type="notFound"
        title={error || t('electionDetail.errors.notFound')}
        message={t('electionDetail.errors.notFoundDescription')}
        showBackButton
        backLabel={t('electionDetail.backToElections')}
        onBack={() => navigate(RouteNamesEnum.elections)}
      />
    );
  }

  const now = Date.now() / 1000;
  const isUpcoming = election.start_time > now;
  // Utiliser directement le statut blockchain
  const isActive = election.status === 'Active';
  const isClosed = election.status === 'Closed';
  const isFinalized = election.status === 'Finalized';
  const isPending = election.status === 'Pending';

  // Pour les actions de l'organisateur, vérifier aussi les dates
  const canActivate = isPending && election.start_time <= now && election.end_time > now;
  const shouldClose = (isActive || isPending) && election.end_time < now;
  const canAddCandidates = isPending && election.end_time > now;

  const isOrganizer = address && election.organizer &&
    address.toLowerCase() === election.organizer.toLowerCase();

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 20) return addr;
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 6)}`;
  };

  const getBadge = () => {
    if (isFinalized) return { text: t('electionCard.status.finalized'), bgClass: 'bg-accent', textClass: 'text-primary' };
    if (isClosed) return { text: t('electionCard.status.closed'), bgClass: 'bg-tertiary', textClass: 'text-secondary' };
    if (isActive) return { text: t('electionCard.status.active'), bgClass: 'bg-success', textClass: 'text-white' };
    if (isUpcoming) return { text: t('electionCard.status.upcoming'), bgClass: 'bg-btn-primary', textClass: 'text-btn-primary' };
    return { text: t('electionCard.status.pending'), bgClass: 'bg-warning', textClass: 'text-white' };
  };

  const badge = getBadge();

  const handleAddCandidate = () => {
    navigate(RouteNamesEnum.addCandidate.replace(':electionId', election.id.toString()));
  };

  const handleActivate = () => {
    setShowActivateModal(true);
  };

  const handleConfirmActivate = async () => {
    if (!election) return;
    setShowActivateModal(false);
    try {
      await activateElection(election.id);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Erreur lors de l\'activation:', err);
    }
  };

  const handleVote = () => {
    navigate(RouteNamesEnum.vote.replace(':id', election.id.toString()));
  };

  const handleClose = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = async () => {
    if (!election) return;
    setShowCloseModal(false);
    try {
      await closeElection(election.id);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Erreur lors de la fermeture:', err);
      alert(t('electionDetail.errors.closeError'));
    }
  };

  const handleFinalize = () => {
    setShowFinalizeModal(true);
  };

  const handleConfirmFinalize = async () => {
    if (!election) return;
    setShowFinalizeModal(false);
    try {
      await finalizeElection(election.id);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Erreur lors de la finalisation:', err);
      alert(t('electionDetail.errors.finalizeError'));
    }
  };

  const timeRemaining = () => {
    if (isActive) {
      const remaining = election.end_time - now;
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);

      if (days > 0) return `${days} ${days > 1 ? t('electionDetail.time.days') : t('electionDetail.time.day')} ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}min`;
      return `${minutes} ${minutes > 1 ? t('electionDetail.time.minutes') : t('electionDetail.time.minute')}`;
    }
    if (isUpcoming) {
      const remaining = election.start_time - now;
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);

      if (days > 0) return t('electionDetail.time.startsIn', { days, unit: days > 1 ? t('electionDetail.time.days') : t('electionDetail.time.day') });
      return t('electionDetail.time.startsInHours', { hours });
    }
    return null;
  };

  const progressPercent = isActive
    ? Math.min(100, ((now - election.start_time) / (election.end_time - election.start_time)) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back button */}
      <button
        onClick={() => navigate(RouteNamesEnum.elections)}
        className="mb-6 px-6 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-all hover:-translate-x-1 font-semibold"
      >
        ← {t('electionDetail.backToElections')}
      </button>

      {/* Header */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-8 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
          <h1 className="text-4xl font-bold text-primary flex-1">{election.title}</h1>
          <div className={`${badge.bgClass} ${badge.textClass} px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-md`}>
            {badge.text}
          </div>
        </div>

        {isOrganizer && (
          <div className="bg-accent bg-opacity-10 border-2 border-accent rounded-lg px-4 py-2 inline-block">
            <span className="text-accent font-semibold">{t('electionDetail.youAreOrganizer')}</span>
          </div>
        )}
      </div>

      {/* Time remaining banner */}
      {(isActive || isUpcoming) && (
        <div className={`${isActive ? 'bg-success' : 'bg-accent'} bg-opacity-10 border-2 ${isActive ? 'border-success' : 'border-accent'} rounded-xl p-6 mb-6 shadow-lg`}>
          <div className="flex items-center gap-4 mb-4">
            <svg className={`w-10 h-10 ${isActive ? 'text-success' : 'text-accent'} animate-pulse`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-bold text-primary uppercase tracking-wide mb-1">
                {isActive ? `⏰ ${t('electionDetail.time.timeRemaining')}` : `🗓️ ${t('electionDetail.time.electionStart')}`}
              </div>
              <span className="text-2xl font-bold text-primary">{timeRemaining()}</span>
            </div>
          </div>
          {isActive && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-primary font-bold">{t('electionDetail.progress')}</span>
                <span className="text-primary font-bold text-lg">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-3 bg-secondary border-2 border-secondary vibe-border rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-success to-accent transition-all duration-500 shadow-md"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-primary font-semibold pt-1">
                <span>{t('electionDetail.start')}: {formatDateTime(election.start_time)}</span>
                <span>{t('electionDetail.end')}: {formatDateTime(election.end_time)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image de l'élection */}
          {electionImageUrl && (
            <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl overflow-hidden shadow-md">
              <img
                src={electionImageUrl}
                alt={election.title}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  // En cas d'erreur de chargement, on cache l'image
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Description */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4">{t('electionDetail.description')}</h2>
            {metadataLoading ? (
              <div className="flex items-center gap-2 text-secondary">
                <div className="w-5 h-5 border-2 border-secondary border-t-accent rounded-full animate-spin"></div>
                {t('electionDetail.loadingMetadata')}
              </div>
            ) : electionMetadata?.description ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-primary whitespace-pre-wrap">{electionMetadata.description}</p>
                {electionMetadata.metadata?.category && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-accent bg-opacity-20 text-accent rounded-full text-sm font-semibold">
                      {electionMetadata.metadata.category === 'presidential' && `🏛️ ${t('createElection.form.categories.presidential')}`}
                      {electionMetadata.metadata.category === 'legislative' && `📜 ${t('createElection.form.categories.legislative')}`}
                      {electionMetadata.metadata.category === 'local' && `🏘️ ${t('createElection.form.categories.local')}`}
                      {electionMetadata.metadata.category === 'referendum' && `🗳️ ${t('createElection.form.categories.referendum')}`}
                      {electionMetadata.metadata.category === 'association' && `🤝 ${t('createElection.form.categories.association')}`}
                      {electionMetadata.metadata.category === 'other' && `📋 ${t('createElection.form.categories.other')}`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-secondary italic">{t('electionDetail.noDescription')}</p>
            )}
          </div>

          {/* Candidates section */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">
                {t('electionDetail.candidates')} ({candidates.length})
              </h2>
              {isOrganizer && canAddCandidates && (
                <button
                  onClick={handleAddCandidate}
                  className="px-4 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold text-sm"
                >
                  + {t('electionDetail.addButton')}
                </button>
              )}
            </div>

            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary mb-4">{t('electionDetail.noCandidates')}</p>
                {isOrganizer && canAddCandidates && (
                  <button
                    onClick={handleAddCandidate}
                    className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold"
                  >
                    {t('electionDetail.addFirstCandidate')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate, index) => (
                  <CandidateListItem key={`${election.id}-${candidate.id}-${index}`} candidate={candidate} />
                ))}
              </div>
            )}
          </div>

          {/* Results section (for closed or finalized elections) */}
          {(isFinalized || isClosed) && (
            <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-primary mb-4">📊 {t('electionDetail.resultsPreview')}</h2>

              {loadingResults ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-12 h-12 border-4 border-secondary border-t-accent rounded-full animate-spin"></div>
                  <p className="text-secondary">{t('electionDetail.loadingResults')}</p>
                </div>
              ) : candidatesWithVotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary">{t('electionDetail.noResults')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidatesWithVotes.slice(0, 3).map((candidate, index) => (
                    <div key={`result-${election.id}-${candidate.id}-${index}`} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold ${index === 0 ? 'text-warning' : 'text-secondary'}`}>
                            #{index + 1}
                          </span>
                          <span className="text-primary font-semibold">{candidate.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{candidate.percentage}%</div>
                          <div className="text-xs text-secondary">{candidate.votes} {candidate.votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}</div>
                        </div>
                      </div>
                      <div className="h-2 bg-tertiary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${index === 0 ? 'bg-warning' : 'bg-accent'} transition-all duration-500`}
                          style={{ width: `${candidate.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4">{t('electionDetail.statistics')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary rounded-lg">
                <span className="block text-3xl font-bold text-primary mb-1">{election.num_candidates}</span>
                <span className="text-xs text-secondary uppercase tracking-wide">{election.num_candidates > 1 ? t('electionCard.candidates_plural') : t('electionCard.candidates')}</span>
              </div>
              <div className="text-center p-4 bg-primary rounded-lg">
                <span className="block text-3xl font-bold text-primary mb-1">{election.total_votes}</span>
                <span className="text-xs text-secondary uppercase tracking-wide">{election.total_votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4">{t('electionDetail.votingPeriod')}</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-secondary font-semibold uppercase tracking-wide mb-1">{t('electionDetail.start')}</span>
                <span className="text-sm text-primary font-medium">{formatDateTime(election.start_time)}</span>
              </div>
              <div>
                <span className="block text-xs text-secondary font-semibold uppercase tracking-wide mb-1">{t('electionDetail.end')}</span>
                <span className="text-sm text-primary font-medium">{formatDateTime(election.end_time)}</span>
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4">{t('electionDetail.organizer')}</h2>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-primary border-2 border-secondary vibe-border rounded-lg px-3 py-2 text-xs text-primary font-mono break-all" title={election.organizer}>
                {formatAddress(election.organizer)}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(election.organizer)}
                className="w-10 h-10 flex items-center justify-center bg-secondary border-2 border-secondary vibe-border rounded-lg hover:bg-tertiary transition-colors"
                title={t('electionDetail.copyAddress')}
              >
                📋
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Organizer actions (pending) - Activer */}
            {isOrganizer && canActivate && (
              <button
                onClick={handleActivate}
                className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                disabled={election.num_candidates < 2}
                title={election.num_candidates < 2 ? t('electionDetail.activateTooltip') : ''}
              >
                {t('electionDetail.activateButton')}
                {election.num_candidates < 2 && ` (${election.num_candidates}/2)`}
              </button>
            )}

            {/* Organizer actions (active expired) - Fermer sur blockchain */}
            {isOrganizer && shouldClose && (
              <div className="space-y-2">
                <div className="bg-orange-500 bg-opacity-20 border-2 border-orange-500 rounded-lg p-3 text-sm text-primary font-bold">
                  ⚠️ {t('electionDetail.expiredWarning')}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full bg-error text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all font-semibold uppercase tracking-wide shadow-md"
                >
                  {t('electionDetail.closeButton')}
                </button>
              </div>
            )}

            {/* Vote button (active elections not expired) */}
            {isActive && !shouldClose && (
              <button
                onClick={handleVote}
                className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold uppercase tracking-wide shadow-md btn-vote"
              >
                {t('electionDetail.voteNow')}
              </button>
            )}

            {/* Finalize button (closed elections, organizer only) */}
            {isOrganizer && isClosed && !isFinalized && (
              <div className="space-y-2">
                <div className="bg-accent bg-opacity-10 border-2 border-accent rounded-lg p-3 text-sm">
                  <span className="text-accent font-bold">ℹ️ {t('electionDetail.finalizeInfo')}</span>
                </div>
                <button
                  onClick={handleFinalize}
                  className="w-full bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold uppercase tracking-wide shadow-md"
                >
                  ✅ {t('electionDetail.finalizeButton')}
                </button>
              </div>
            )}

            {/* View results (closed or finalized) */}
            {(isFinalized || isClosed) && (
              <button
                onClick={() => navigate(RouteNamesEnum.results.replace(':id', election.id.toString()))}
                className="w-full px-6 py-3 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold btn-results"
              >
                📊 {t('electionDetail.viewResults')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modales de confirmation */}
      <ConfirmModal
        isOpen={showCloseModal}
        onConfirm={handleConfirmClose}
        onCancel={() => setShowCloseModal(false)}
        title={t('electionDetail.confirmModal.close.title')}
        message={t('electionDetail.confirmModal.close.message', { electionTitle: election?.title || '' })}
        confirmText={t('electionDetail.confirmModal.close.confirm')}
        cancelText={t('electionDetail.confirmModal.close.cancel')}
        type="danger"
      />

      <ConfirmModal
        isOpen={showActivateModal}
        onConfirm={handleConfirmActivate}
        onCancel={() => setShowActivateModal(false)}
        title={t('electionDetail.confirmModal.activate.title')}
        message={t('electionDetail.confirmModal.activate.message', { electionTitle: election?.title || '' })}
        confirmText={t('electionDetail.confirmModal.activate.confirm')}
        cancelText={t('electionDetail.confirmModal.activate.cancel')}
        type="info"
      />

      <ConfirmModal
        isOpen={showFinalizeModal}
        onConfirm={handleConfirmFinalize}
        onCancel={() => setShowFinalizeModal(false)}
        title={t('electionDetail.confirmModal.finalize.title')}
        message={t('electionDetail.confirmModal.finalize.message', { electionTitle: election?.title || '' })}
        confirmText={t('electionDetail.confirmModal.finalize.confirm')}
        cancelText={t('electionDetail.confirmModal.finalize.cancel')}
        type="info"
      />
    </div>
  );
};
