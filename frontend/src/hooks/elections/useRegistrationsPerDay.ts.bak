import { useState, useEffect } from 'react';
import { votingContract } from 'config';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';

export const useRegistrationsPerDay = (electionId: number, daysBack: number = 30) => {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!electionId) {
        setLoading(false);
        return;
      }

      try {
        const provider = new ProxyNetworkProvider(votingContract.apiUrl);
        const results: { date: string; count: number }[] = [];

        // Récupérer les données des N derniers jours
        const now = Math.floor(Date.now() / 1000);
        const dayInSeconds = 86400;

        for (let i = 0; i < daysBack; i++) {
          const dayStart = Math.floor((now - (i * dayInSeconds)) / dayInSeconds) * dayInSeconds;

          const query = votingContract.contract.methods
            .getRegistrationsPerDay([electionId, dayStart])
            .buildQuery();

          const response = await provider.queryContract(query);
          const [result] = votingContract.contract.getEndpoint('getRegistrationsPerDay')
            .decodeOutput(response.returnData);

          const count = result.valueOf() as number;

          results.unshift({
            date: new Date(dayStart * 1000).toLocaleDateString('fr-FR'),
            count,
          });
        }

        setData(results);
      } catch (error) {
        console.error('Erreur lors de la récupération des inscriptions par jour:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [electionId, daysBack]);

  return { data, loading };
};
