import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RouteNamesEnum } from 'localConstants';
import { useGetElection, useGetCandidates, useCandidateMetadata, useIPFSImage, type Election, type Candidate } from 'hooks/elections';
import { useGetCandidateVotes } from 'hooks/elections/useGetCandidateVotes';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CandidateWithVotes extends Candidate {
  votes: number;
  percentage: number;
}

// Composant pour afficher un candidat avec image IPFS
const CandidateResultCard = ({ candidate, index, hasVotes }: { candidate: CandidateWithVotes; index: number; hasVotes: boolean }) => {
  const { t } = useTranslation();
  const { metadata } = useCandidateMetadata(candidate.description_ipfs);
  const imageUrl = useIPFSImage(metadata?.image);

  return (
    <div
      className={`bg-primary border-2 ${index === 0 ? 'border-warning' : 'border-secondary'} vibe-border rounded-xl overflow-hidden hover:shadow-lg transition-all`}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        {imageUrl && (
          <div className="w-full md:w-48 h-48 md:h-auto bg-tertiary flex-shrink-0 relative overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
            <img
              src={imageUrl}
              alt={candidate.name}
              className="w-full h-full object-cover block"
              onError={(e) => {
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
            {index === 0 && hasVotes && (
              <div className="absolute top-2 right-2 bg-warning text-primary px-3 py-1 rounded-full text-xs font-bold">
                🏆 {t('results.winner').toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Contenu */}
        <div className="p-6 flex-1">
          <div className="flex items-start gap-6 mb-4">
            {/* Rank */}
            <div className="text-center min-w-[60px]">
              <div className={`text-4xl font-bold ${index === 0 ? 'text-warning' : 'text-secondary'} leading-none`}>
                #{index + 1}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <h4 className="text-2xl font-bold text-primary mb-1">
                    {metadata?.name || candidate.name}
                  </h4>
                  {metadata?.metadata?.party && (
                    <span className="inline-block px-3 py-1 bg-accent bg-opacity-20 text-accent rounded-full text-xs font-semibold">
                      {metadata.metadata.party}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${index === 0 ? 'text-warning' : 'text-primary'}`}>
                    {candidate.percentage}%
                  </div>
                  <div className="text-sm text-secondary font-semibold">
                    {candidate.votes} {candidate.votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')}
                  </div>
                </div>
              </div>

              {metadata?.biography && (
                <p className="text-sm text-secondary mb-4 line-clamp-2">
                  {metadata.biography}
                </p>
              )}

              {/* Progress bar */}
              <div>
                <div className="h-3 bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${index === 0 ? 'bg-warning' : 'bg-accent'} transition-all duration-500`}
                    style={{ width: `${candidate.percentage}%` }}
                  />
                </div>
                <div className="text-right text-xs text-secondary font-semibold mt-1">
                  {candidate.percentage}% {t('results.ofVotes')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Results = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getElection } = useGetElection();
  const { getCandidates } = useGetCandidates();
  const { getCandidateVotes } = useGetCandidateVotes();

  const [election, setElection] = useState<Election | null>(null);
  const [candidatesWithVotes, setCandidatesWithVotes] = useState<CandidateWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const electionId = parseInt(id);
        const electionData = await getElection(electionId);

        if (!electionData) {
          setError(t('results.errors.notFound'));
          setLoading(false);
          return;
        }

        const now = Date.now() / 1000;
        const isClosedByTime = electionData.end_time < now;
        const isClosedByStatus = electionData.status === 'Closed' || electionData.status === 'Finalized';

        if (!isClosedByTime && !isClosedByStatus) {
          setError(t('results.errors.notAvailable'));
          setLoading(false);
          return;
        }

        setElection(electionData);

        const candidates = await getCandidates(electionId);

        if (candidates.length === 0) {
          setCandidatesWithVotes([]);
          setLoading(false);
          return;
        }

        const votesPromises = candidates.map(async (candidate) => {
          const votes = await getCandidateVotes(electionId, candidate.id);
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
        setError(t('results.errors.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    if (!election) return;

    const url = window.location.href;
    const winner = candidatesWithVotes[0];
    const text = winner
      ? t('results.shareText', { title: election.title, name: winner.name, percentage: winner.percentage })
      : t('results.shareTextNoWinner', { title: election.title });

    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleExportTxt = () => {
    if (!election || candidatesWithVotes.length === 0) return;

    const totalVotes = candidatesWithVotes.reduce((sum, c) => sum + c.votes, 0);

    let content = '';
    content += '═══════════════════════════════════════════════════════════\n';
    content += '                   RÉSULTATS DE L\'ÉLECTION                 \n';
    content += '═══════════════════════════════════════════════════════════\n\n';
    content += `Titre: ${election.title}\n`;
    content += `ID: ${election.id}\n`;
    content += `Organisateur: ${election.organizer}\n`;
    content += `Date de début: ${new Date(election.start_time * 1000).toLocaleString('fr-FR')}\n`;
    content += `Date de fin: ${new Date(election.end_time * 1000).toLocaleString('fr-FR')}\n`;
    content += `Statut: ${election.status}\n\n`;

    content += '───────────────────────────────────────────────────────────\n';
    content += '                      STATISTIQUES                          \n';
    content += '───────────────────────────────────────────────────────────\n\n';
    content += `Total des votes: ${totalVotes}\n`;
    content += `Nombre de candidats: ${candidatesWithVotes.length}\n\n`;

    if (candidatesWithVotes[0] && candidatesWithVotes[0].votes > 0) {
      content += '───────────────────────────────────────────────────────────\n';
      content += '                        GAGNANT                            \n';
      content += '───────────────────────────────────────────────────────────\n\n';
      content += `🏆 ${candidatesWithVotes[0].name}\n`;
      content += `   ${candidatesWithVotes[0].votes} vote(s) - ${candidatesWithVotes[0].percentage}%\n\n`;
    }

    content += '───────────────────────────────────────────────────────────\n';
    content += '                  RÉSULTATS DÉTAILLÉS                      \n';
    content += '───────────────────────────────────────────────────────────\n\n';

    candidatesWithVotes.forEach((candidate, index) => {
      content += `#${index + 1} - ${candidate.name}\n`;
      if (candidate.description_ipfs) {
        content += `    Description: ${candidate.description_ipfs}\n`;
      }
      content += `    Votes: ${candidate.votes}\n`;
      content += `    Pourcentage: ${candidate.percentage}%\n`;
      content += `    Barre: `;
      const barLength = Math.round(candidate.percentage / 2);
      content += '█'.repeat(barLength) + '░'.repeat(50 - barLength);
      content += '\n\n';
    });

    content += '═══════════════════════════════════════════════════════════\n';
    content += `Généré le ${new Date().toLocaleString('fr-FR')}\n`;
    content += '═══════════════════════════════════════════════════════════\n';

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultats_election_${election.id}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 border-4 border-secondary border-t-accent rounded-full animate-spin"></div>
          <p className="text-secondary">{t('results.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !election) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <h2 className="text-2xl font-bold text-primary">{error || t('results.errors.notFound')}</h2>
          <button
            onClick={() => navigate(RouteNamesEnum.elections)}
            className="px-6 py-3 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold"
          >
            ← {t('electionDetail.backToElections')}
          </button>
        </div>
      </div>
    );
  }

  const totalVotes = candidatesWithVotes.reduce((sum, c) => sum + c.votes, 0);
  const hasVotes = totalVotes > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/election/${id}`)}
          className="mb-6 px-6 py-2 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-all hover:-translate-x-1 font-semibold"
        >
          ← {t('vote.backToDetails')}
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">📊 {t('results.title')}</h1>
            <h2 className="text-2xl text-secondary">{election.title}</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Boutons de partage */}
            <button
              onClick={() => handleShare('twitter')}
              className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-opacity-80 transition-all font-semibold flex items-center gap-2 shadow-md"
              title={t('results.shareOn', { platform: 'Twitter' })}
            >
              <span>𝕏</span>
              Twitter
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-opacity-80 transition-all font-semibold flex items-center gap-2 shadow-md"
              title={t('results.shareOn', { platform: 'Facebook' })}
            >
              <span>f</span>
              Facebook
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-opacity-80 transition-all font-semibold flex items-center gap-2 shadow-md"
              title={t('results.shareOn', { platform: 'LinkedIn' })}
            >
              <span>in</span>
              LinkedIn
            </button>
            {/* Bouton d'export */}
            <button
              onClick={handleExportTxt}
              className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-all font-semibold flex items-center gap-2 shadow-md whitespace-nowrap"
            >
              <span>📥</span>
              {t('results.export')}
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 grid md:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs text-secondary font-semibold uppercase tracking-wide mb-1">{t('electionDetail.votingPeriod')}</span>
            <span className="text-sm text-primary">
              {formatDateTime(election.start_time)} - {formatDateTime(election.end_time)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-secondary font-semibold uppercase tracking-wide mb-1">{t('electionDetail.organizer')}</span>
            <span className="text-sm text-primary font-mono break-all">{election.organizer}</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-8 text-center hover:shadow-xl transition-all">
          <div className="text-5xl font-bold text-primary mb-2">{totalVotes}</div>
          <div className="text-sm text-secondary uppercase tracking-wide font-semibold">{totalVotes > 1 ? t('results.stats.totalVotes') : t('results.stats.totalVote')}</div>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-8 text-center hover:shadow-xl transition-all">
          <div className="text-5xl font-bold text-primary mb-2">{candidatesWithVotes.length}</div>
          <div className="text-sm text-secondary uppercase tracking-wide font-semibold">{candidatesWithVotes.length > 1 ? t('electionCard.candidates_plural') : t('electionCard.candidates')}</div>
        </div>
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-8 text-center hover:shadow-xl transition-all">
          <div className="text-5xl font-bold text-primary mb-2">
            {hasVotes && candidatesWithVotes[0] ? candidatesWithVotes[0].percentage : 0}%
          </div>
          <div className="text-sm text-secondary uppercase tracking-wide font-semibold">{t('results.stats.winnerScore')}</div>
        </div>
      </div>

      {/* Graphiques */}
      {hasVotes && candidatesWithVotes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Graphique en barres */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold text-primary mb-4">{t('results.charts.votesByCandidate')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={candidatesWithVotes.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  angle={-15}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="votes" fill="#8b5cf6" name="Votes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique en camembert */}
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold text-primary mb-4">{t('results.charts.voteDistribution')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={candidatesWithVotes.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.length > 15 ? name.substring(0, 15) + '...' : name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="votes"
                >
                  {candidatesWithVotes.slice(0, 6).map((entry, index) => {
                    const colors = ['#fbbf24', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#6b7280'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Winner section */}
      {hasVotes && candidatesWithVotes[0] && candidatesWithVotes[0].votes > 0 && (
        <div className="bg-warning bg-opacity-10 border-3 border-warning rounded-2xl p-8 mb-8 flex items-center gap-6 shadow-xl">
          <div className="text-6xl animate-bounce">🏆</div>
          <div className="flex-1">
            <div className="text-sm text-white font-semibold uppercase tracking-wide mb-1">{t('results.electionWinner')}</div>
            <div className="text-3xl font-bold text-white mb-2">{candidatesWithVotes[0].name}</div>
            <div className="text-lg text-white font-semibold">
              {candidatesWithVotes[0].votes} {candidatesWithVotes[0].votes > 1 ? t('electionCard.votes_plural') : t('electionCard.votes')} • {candidatesWithVotes[0].percentage}% {t('results.ofVotes')}
            </div>
          </div>
        </div>
      )}

      {/* Results list */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-lg mb-8">
        <h3 className="text-2xl font-bold text-primary mb-6">{t('results.detailedResults')}</h3>

        {candidatesWithVotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary">{t('results.noCandidates')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {candidatesWithVotes.map((candidate, index) => (
              <CandidateResultCard
                key={`result-${candidate.id}-${index}`}
                candidate={candidate}
                index={index}
                hasVotes={hasVotes}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center">
        <p className="text-sm text-secondary mb-4">
          {t('results.blockchainNotice')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate(RouteNamesEnum.elections)}
            className="px-6 py-3 bg-secondary text-accent border-2 border-accent rounded-lg hover:bg-tertiary transition-colors font-semibold"
          >
            {t('results.viewAllElections')}
          </button>
          <button
            onClick={() => navigate(`/election/${id}`)}
            className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold"
          >
            {t('results.electionDetails')}
          </button>
        </div>
      </div>
    </div>
  );
};
