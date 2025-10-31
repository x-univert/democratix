import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetAccount } from 'lib';
import { useGetElections, type Election } from 'hooks/elections';
import { RouteNamesEnum } from 'localConstants';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { address } = useGetAccount();
  const { getElections } = useGetElections();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [myElections, setMyElections] = useState<Election[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Active' | 'Closed' | 'Finalized'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allElections = await getElections();
        setElections(allElections);

        // Filtrer les élections dont l'utilisateur est l'organisateur
        if (address) {
          const organized = allElections.filter(
            e => e.organizer.toLowerCase() === address.toLowerCase()
          );
          setMyElections(organized);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  // Calculer les statistiques générales
  const globalStats = useMemo(() => {
    return {
      total: elections.length,
      pending: elections.filter(e => e.status === 'Pending').length,
      active: elections.filter(e => e.status === 'Active').length,
      closed: elections.filter(e => e.status === 'Closed').length,
      finalized: elections.filter(e => e.status === 'Finalized').length,
      totalVotes: elections.reduce((sum, e) => sum + e.total_votes, 0),
      totalCandidates: elections.reduce((sum, e) => sum + e.num_candidates, 0)
    };
  }, [elections]);

  // Statistiques pour mes élections
  const myStats = useMemo(() => {
    return {
      total: myElections.length,
      pending: myElections.filter(e => e.status === 'Pending').length,
      active: myElections.filter(e => e.status === 'Active').length,
      closed: myElections.filter(e => e.status === 'Closed').length,
      finalized: myElections.filter(e => e.status === 'Finalized').length,
      totalVotes: myElections.reduce((sum, e) => sum + e.total_votes, 0),
      totalCandidates: myElections.reduce((sum, e) => sum + e.num_candidates, 0)
    };
  }, [myElections]);

  // Données pour le graphique en camembert (statuts)
  const statusPieData = [
    { name: t('admin.charts.pending'), value: globalStats.pending, color: '#fbbf24' },
    { name: t('admin.charts.active'), value: globalStats.active, color: '#10b981' },
    { name: t('admin.charts.closed'), value: globalStats.closed, color: '#6b7280' },
    { name: t('admin.charts.finalized'), value: globalStats.finalized, color: '#8b5cf6' }
  ];

  // Données pour le graphique en barres (participation)
  const participationData = myElections
    .sort((a, b) => b.total_votes - a.total_votes)
    .slice(0, 5)
    .map(e => ({
      name: e.title.length > 20 ? e.title.substring(0, 20) + '...' : e.title,
      votes: e.total_votes,
      candidats: e.num_candidates
    }));

  // Données pour la timeline (élections par date)
  const timelineData = useMemo(() => {
    const grouped: { [key: string]: number } = {};

    elections.forEach(election => {
      const date = new Date(election.start_time * 1000);
      const monthYear = `${date.toLocaleString('fr-FR', { month: 'short' })} ${date.getFullYear()}`;
      grouped[monthYear] = (grouped[monthYear] || 0) + 1;
    });

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-6)
      .map(([date, count]) => ({ date, count }));
  }, [elections]);

  // Filtrer mes élections selon le statut
  const filteredMyElections = useMemo(() => {
    if (filterStatus === 'all') return myElections;
    return myElections.filter(e => e.status === filterStatus);
  }, [myElections, filterStatus]);

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return { text: t('electionCard.status.pending'), bgClass: 'bg-warning', textClass: 'text-white' };
      case 'Active':
        return { text: t('electionCard.status.active'), bgClass: 'bg-success', textClass: 'text-white' };
      case 'Closed':
        return { text: t('electionCard.status.closed'), bgClass: 'bg-tertiary', textClass: 'text-secondary' };
      case 'Finalized':
        return { text: t('electionCard.status.finalized'), bgClass: 'bg-accent', textClass: 'text-primary' };
      default:
        return { text: status, bgClass: 'bg-secondary', textClass: 'text-primary' };
    }
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
              {t('admin.auth.title')}
            </h2>
            <p className="text-secondary mb-6">
              {t('admin.auth.message')}
            </p>
            <button
              onClick={() => navigate(RouteNamesEnum.unlock)}
              className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold"
            >
              {t('admin.auth.connect')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 border-4 border-secondary border-t-accent rounded-full animate-spin"></div>
          <p className="text-secondary">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">📊 {t('admin.title')}</h1>
        <p className="text-secondary text-lg">
          {t('admin.subtitle')}
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-4">{t('admin.globalStats.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
            <span className="block text-3xl font-bold text-primary mb-1">{globalStats.total}</span>
            <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.globalStats.total')}</span>
          </div>
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
            <span className="block text-3xl font-bold text-warning mb-1">{globalStats.pending}</span>
            <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.globalStats.pending')}</span>
          </div>
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
            <span className="block text-3xl font-bold text-success mb-1">{globalStats.active}</span>
            <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.globalStats.active')}</span>
          </div>
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
            <span className="block text-3xl font-bold text-secondary mb-1">{globalStats.closed}</span>
            <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.globalStats.closed')}</span>
          </div>
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
            <span className="block text-3xl font-bold text-accent mb-1">{globalStats.finalized}</span>
            <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.globalStats.finalized')}</span>
          </div>
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
            <span className="block text-3xl font-bold text-accent mb-1">{globalStats.totalVotes}</span>
            <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.globalStats.totalVotes')}</span>
          </div>
          <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
            <span className="block text-3xl font-bold text-accent mb-1">{globalStats.totalCandidates}</span>
            <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.globalStats.candidates')}</span>
          </div>
        </div>
      </div>

      {/* Mes élections - Statistiques */}
      {myElections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">{t('admin.myElections.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
              <span className="block text-3xl font-bold text-primary mb-1">{myStats.total}</span>
              <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.myElections.total')}</span>
            </div>
            <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
              <span className="block text-3xl font-bold text-success mb-1">{myStats.active}</span>
              <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.myElections.active')}</span>
            </div>
            <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
              <span className="block text-3xl font-bold text-accent mb-1">{myStats.totalVotes}</span>
              <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.myElections.votesReceived')}</span>
            </div>
            <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
              <span className="block text-3xl font-bold text-accent mb-1">{myStats.totalCandidates}</span>
              <span className="text-xs text-secondary font-medium uppercase tracking-wide">{t('admin.myElections.candidates')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Liste de mes élections avec filtres */}
      {myElections.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-primary">
              📋 {t('admin.myElectionsList.title') || 'Mes Élections Organisées'}
            </h2>

            {/* Filtres de statut */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === 'all'
                    ? 'bg-accent text-white'
                    : 'bg-secondary text-secondary border border-secondary hover:bg-tertiary'
                }`}
              >
                {t('admin.filters.all') || 'Toutes'} ({myElections.length})
              </button>
              <button
                onClick={() => setFilterStatus('Pending')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === 'Pending'
                    ? 'bg-warning text-white'
                    : 'bg-secondary text-secondary border border-secondary hover:bg-tertiary'
                }`}
              >
                {t('admin.filters.pending') || 'En attente'} ({myStats.pending})
              </button>
              <button
                onClick={() => setFilterStatus('Active')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === 'Active'
                    ? 'bg-success text-white'
                    : 'bg-secondary text-secondary border border-secondary hover:bg-tertiary'
                }`}
              >
                {t('admin.filters.active') || 'Actives'} ({myStats.active})
              </button>
              <button
                onClick={() => setFilterStatus('Closed')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === 'Closed'
                    ? 'bg-tertiary text-white'
                    : 'bg-secondary text-secondary border border-secondary hover:bg-tertiary'
                }`}
              >
                {t('admin.filters.closed') || 'Fermées'} ({myStats.closed})
              </button>
              <button
                onClick={() => setFilterStatus('Finalized')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filterStatus === 'Finalized'
                    ? 'bg-accent text-white'
                    : 'bg-secondary text-secondary border border-secondary hover:bg-tertiary'
                }`}
              >
                {t('admin.filters.finalized') || 'Finalisées'} ({myStats.finalized})
              </button>
            </div>
          </div>

          {/* Liste des élections filtrées */}
          {filteredMyElections.length === 0 ? (
            <div className="bg-secondary border-2 border-secondary rounded-xl p-8 text-center">
              <p className="text-secondary">
                {t('admin.myElectionsList.noResults') || 'Aucune élection trouvée avec ce filtre'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMyElections.map((election) => {
                const badge = getStatusBadge(election.status);
                const now = Date.now() / 1000;
                const hasRegistration = election.requires_registration;

                return (
                  <div
                    key={election.id}
                    className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                    onClick={() => navigate(`/election/${election.id}`)}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-primary flex-1 pr-2">
                        {election.title}
                      </h3>
                      <span className={`${badge.bgClass} ${badge.textClass} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide whitespace-nowrap`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="space-y-1 mb-3 text-sm">
                      <div className="flex items-center gap-2 text-secondary">
                        <span className="font-semibold">Début:</span>
                        <span>{formatDateTime(election.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-secondary">
                        <span className="font-semibold">Fin:</span>
                        <span>{formatDateTime(election.end_time)}</span>
                      </div>
                      {hasRegistration && election.registration_deadline && (
                        <div className="flex items-center gap-2 text-accent">
                          <span className="font-semibold">⏰ Deadline inscription:</span>
                          <span>{formatDateTime(election.registration_deadline)}</span>
                        </div>
                      )}
                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-tertiary">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👥</span>
                        <div>
                          <div className="text-lg font-bold text-primary">{election.num_candidates}</div>
                          <div className="text-xs text-secondary">Candidats</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🗳️</span>
                        <div>
                          <div className="text-lg font-bold text-primary">{election.total_votes}</div>
                          <div className="text-xs text-secondary">Votes</div>
                        </div>
                      </div>
                      {hasRegistration && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">✅</span>
                            <div>
                              <div className="text-lg font-bold text-success">{election.registered_voters_count}</div>
                              <div className="text-xs text-secondary">Inscrits</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            <div>
                              <div className="text-lg font-bold text-accent">
                                {election.registered_voters_count > 0
                                  ? Math.round((election.total_votes / election.registered_voters_count) * 100)
                                  : 0}%
                              </div>
                              <div className="text-xs text-secondary">Participation</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Répartition par statut */}
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-primary mb-4">{t('admin.charts.statusDistribution')}</h3>
          {globalStats.total > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-secondary">
              {t('admin.charts.noData')}
            </div>
          )}
        </div>

        {/* Timeline des élections */}
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-primary mb-4">{t('admin.charts.timeline')}</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name={t('admin.charts.elections')}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-secondary">
              {t('admin.charts.noData')}
            </div>
          )}
        </div>
      </div>

      {/* Participation */}
      {myElections.length > 0 && participationData.length > 0 && (
        <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md mb-8">
          <h3 className="text-xl font-bold text-primary mb-4">
            {t('admin.charts.topParticipation')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={participationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" angle={-15} textAnchor="end" height={100} />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey="votes" fill="#10b981" name={t('admin.charts.votes')} />
              <Bar dataKey="candidats" fill="#8b5cf6" name={t('admin.charts.candidates')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-bold text-primary mb-4">{t('admin.quickActions.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(RouteNamesEnum.createElection)}
            className="p-6 bg-primary border-2 border-accent rounded-lg hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-2">➕</div>
            <h4 className="font-bold text-primary mb-1">{t('admin.quickActions.createElection')}</h4>
            <p className="text-sm text-secondary">{t('admin.quickActions.createElectionDesc')}</p>
          </button>

          <button
            onClick={() => navigate(RouteNamesEnum.elections)}
            className="p-6 bg-primary border-2 border-accent rounded-lg hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-2">📋</div>
            <h4 className="font-bold text-primary mb-1">{t('admin.quickActions.viewAll')}</h4>
            <p className="text-sm text-secondary">{t('admin.quickActions.viewAllDesc')}</p>
          </button>

          <button
            onClick={() => navigate(RouteNamesEnum.profile)}
            className="p-6 bg-primary border-2 border-accent rounded-lg hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-2">👤</div>
            <h4 className="font-bold text-primary mb-1">{t('admin.quickActions.myProfile')}</h4>
            <p className="text-sm text-secondary">{t('admin.quickActions.myProfileDesc')}</p>
          </button>
        </div>
      </div>

      {/* Message si pas d'élections organisées */}
      {myElections.length === 0 && (
        <div className="bg-accent bg-opacity-10 border-2 border-accent rounded-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-primary mb-2">{t('admin.noElections.title')}</h3>
          <p className="text-secondary mb-4">
            {t('admin.noElections.message')}
          </p>
          <button
            onClick={() => navigate(RouteNamesEnum.createElection)}
            className="bg-btn-primary text-btn-primary px-6 py-3 rounded-lg hover:bg-btn-hover transition-colors font-semibold"
          >
            {t('admin.noElections.action')}
          </button>
        </div>
      )}
    </div>
  );
};
