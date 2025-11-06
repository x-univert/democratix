import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TimelineData {
  timestamp: number;
  date: string;
  hour: string;
  dayOfWeek: string;
  votes: number;
  votesThisHour: number;
  percentage: number;
  turnoutRate: string;
}

interface TimelineStats {
  peakHour: string | null;
  peakHourTimestamp: number | null;
  peakVotes: number;
  averageVotesPerHour: number;
  quietestHour: string | null;
  quietestHourTimestamp: number | null;
  quietestVotes: number;
  currentTrend: 'increasing' | 'decreasing' | 'stable' | 'not-started';
  hoursRemaining: number;
  predictedFinalTurnout: number;
  predictedFinalVotes: number;
  currentTurnout: string;
}

interface VotesTimelineChartProps {
  electionId: number;
  onError?: (error: string) => void;
}

export const VotesTimelineChart = ({ electionId, onError }: VotesTimelineChartProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');

  useEffect(() => {
    fetchTimeline();
  }, [electionId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3003'}/api/elections/${electionId}/stats/votes-timeline`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }

      const data = await response.json();

      if (data.success) {
        setTimeline(data.data.timeline || []);
        setStats(data.data.stats || null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('[VotesTimelineChart] Error fetching timeline:', error);
      if (onError) onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '⏸️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      case 'stable':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'En hausse';
      case 'decreasing':
        return 'En baisse';
      case 'stable':
        return 'Stable';
      case 'not-started':
        return 'Pas encore commencée';
      default:
        return 'Inconnue';
    }
  };

  if (loading) {
    return (
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-tertiary rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-tertiary rounded"></div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6 text-center">
        <p className="text-primary text-lg">
          📊 Aucune donnée de participation disponible pour le moment
        </p>
        <p className="text-secondary text-sm mt-2">
          Les statistiques apparaîtront dès que les votes commenceront
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec titre et sélecteur de graphique */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-1">
              📊 Évolution de la Participation
            </h2>
            <p className="text-secondary">
              Analyse heure par heure des votes reçus
            </p>
          </div>

          {/* Sélecteur type de graphique */}
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('area')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                chartType === 'area'
                  ? 'bg-accent text-white'
                  : 'bg-tertiary text-primary hover:bg-accent hover:text-white'
              }`}
            >
              📈 Aire
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                chartType === 'line'
                  ? 'bg-accent text-white'
                  : 'bg-tertiary text-primary hover:bg-accent hover:text-white'
              }`}
            >
              📉 Ligne
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                chartType === 'bar'
                  ? 'bg-accent text-white'
                  : 'bg-tertiary text-primary hover:bg-accent hover:text-white'
              }`}
            >
              📊 Barres
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques clés */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pic d'activité */}
          <div className="bg-secondary border-2 border-green-500 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔥</span>
              <h3 className="text-sm font-semibold text-primary">Pic d'Activité</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.peakHour || 'N/A'}</p>
            <p className="text-sm text-secondary">{stats.peakVotes} votes</p>
          </div>

          {/* Heure creuse */}
          <div className="bg-secondary border-2 border-blue-500 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">😴</span>
              <h3 className="text-sm font-semibold text-primary">Heure Creuse</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.quietestHour || 'N/A'}</p>
            <p className="text-sm text-secondary">{stats.quietestVotes} votes</p>
          </div>

          {/* Tendance actuelle */}
          <div className="bg-secondary border-2 border-accent rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getTrendIcon(stats.currentTrend)}</span>
              <h3 className="text-sm font-semibold text-primary">Tendance</h3>
            </div>
            <p className={`text-2xl font-bold ${getTrendColor(stats.currentTrend)}`}>
              {getTrendLabel(stats.currentTrend)}
            </p>
            <p className="text-sm text-secondary">{stats.averageVotesPerHour} votes/h</p>
          </div>

          {/* Prédiction finale */}
          <div className="bg-secondary border-2 border-purple-500 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔮</span>
              <h3 className="text-sm font-semibold text-primary">Prédiction Finale</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {stats.predictedFinalTurnout}%
            </p>
            <p className="text-sm text-secondary">
              {stats.predictedFinalVotes} votes estimés
            </p>
          </div>
        </div>
      )}

      {/* Graphique principal */}
      <div className="bg-secondary border-2 border-secondary vibe-border rounded-xl p-6">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'area' ? (
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="hour"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="votes"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorVotes)"
                name="Votes cumulés"
              />
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="hour"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="votes"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Votes cumulés"
              />
              <Line
                type="monotone"
                dataKey="votesThisHour"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Votes cette heure"
              />
            </LineChart>
          ) : (
            <BarChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="hour"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey="votesThisHour" fill="#3b82f6" name="Votes par heure" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Informations complémentaires */}
      {stats && stats.hoursRemaining > 0 && (
        <div className="bg-secondary border-2 border-accent rounded-xl p-6">
          <h3 className="text-lg font-bold text-primary mb-4">
            ⏱️ Informations en Temps Réel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-secondary mb-1">Participation Actuelle</p>
              <p className="text-2xl font-bold text-accent">{stats.currentTurnout}%</p>
            </div>
            <div>
              <p className="text-sm text-secondary mb-1">Heures Restantes</p>
              <p className="text-2xl font-bold text-primary">{stats.hoursRemaining}h</p>
            </div>
            <div>
              <p className="text-sm text-secondary mb-1">Moyenne par Heure</p>
              <p className="text-2xl font-bold text-primary">
                {stats.averageVotesPerHour} votes/h
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
