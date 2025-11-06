import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface VotesTimelineData {
  timestamp: number;
  date: string;
  votes: number;
  percentage: number;
}

interface VotesProgressChartProps {
  electionId: number;
  height?: number;
}

export const VotesProgressChart = ({ electionId, height = 300 }: VotesProgressChartProps) => {
  const [data, setData] = useState<VotesTimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3003'}/api/elections/${electionId}/stats/votes-timeline`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch votes timeline');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Invalid response format');
        }
      } catch (err: any) {
        console.error('Error fetching votes timeline:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (electionId) {
      fetchTimeline();
    }
  }, [electionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="w-8 h-8 border-4 border-secondary border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-secondary" style={{ height }}>
        <p>Erreur: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-secondary" style={{ height }}>
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  // Formatter pour afficher date/heure courte
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="timestamp"
          stroke="#9ca3af"
          tickFormatter={formatXAxis}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#9ca3af" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#f3f4f6' }}
          labelFormatter={(timestamp: number) => new Date(timestamp).toLocaleString('fr-FR')}
          formatter={(value: number, name: string) => {
            if (name === 'votes') return [value, 'Votes'];
            if (name === 'percentage') return [`${value}%`, 'Participation'];
            return [value, name];
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="votes"
          stroke="#8b5cf6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorVotes)"
          name="Votes"
        />
        <Area
          type="monotone"
          dataKey="percentage"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPercentage)"
          name="Participation %"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
