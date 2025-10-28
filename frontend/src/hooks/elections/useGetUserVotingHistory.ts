import { useState, useEffect } from 'react';
import { useGetAccount } from 'lib';
import { useGetElections, type Election } from './useGetElections';
import { useHasVoted } from './useHasVoted';

export interface VotedElection extends Election {
  votedAt?: number; // Timestamp du vote (si disponible)
}

/**
 * Hook pour récupérer l'historique des votes d'un utilisateur
 */
export const useGetUserVotingHistory = () => {
  const { address } = useGetAccount();
  const { getElections } = useGetElections();
  const { hasVoted } = useHasVoted();
  const [votingHistory, setVotingHistory] = useState<VotedElection[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVotingHistory = async () => {
    if (!address) {
      setVotingHistory([]);
      return;
    }

    setLoading(true);
    try {
      // 1. Récupérer toutes les élections
      const allElections = await getElections();

      // 2. Pour chaque élection, vérifier si l'utilisateur a voté
      const votedElections: VotedElection[] = [];

      for (const election of allElections) {
        const voted = await hasVoted(election.id);
        if (voted) {
          votedElections.push(election);
        }
      }

      // 3. Trier par date de fin (les plus récentes en premier)
      votedElections.sort((a, b) => b.end_time - a.end_time);

      setVotingHistory(votedElections);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      setVotingHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotingHistory();
  }, [address]);

  return {
    votingHistory,
    loading,
    refetch: fetchVotingHistory
  };
};
