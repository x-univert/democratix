import { useState, useEffect } from 'react';
import { votingContract } from 'config';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';

export interface RegistrationStats {
  total_registered: number;
  last_registration_timestamp: number;
}

export const useRegistrationStats = (electionId: number) => {
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!electionId) {
        setLoading(false);
        return;
      }

      try {
        const provider = new ProxyNetworkProvider(votingContract.apiUrl);

        const query = votingContract.contract.methods
          .getRegistrationStats([electionId])
          .buildQuery();

        const response = await provider.queryContract(query);
        const [result] = votingContract.contract.getEndpoint('getRegistrationStats')
          .decodeOutput(response.returnData);

        setStats(result.valueOf());
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [electionId]);

  return { stats, loading };
};
