import { useState, useEffect } from 'react';
import { useGetAccount } from 'lib';

/**
 * Hook pour vérifier si l'utilisateur a déjà voté en mode privé (zk-SNARK)
 *
 * Vérifie dans localStorage si un vote privé a été enregistré pour cette élection et ce wallet
 *
 * @param electionId - ID de l'élection
 * @returns true si l'utilisateur a déjà voté en privé, false sinon
 */
export const useHasVotedPrivately = (electionId: number | null): boolean => {
  const { address } = useGetAccount();
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!address || electionId === null || electionId === undefined) {
      setHasVoted(false);
      return;
    }

    try {
      // Clé localStorage pour les votes privés de ce wallet
      const storageKey = `democratix_private_votes_${address}`;
      const storedVotes = localStorage.getItem(storageKey);

      if (storedVotes) {
        const votedElections: number[] = JSON.parse(storedVotes);
        setHasVoted(votedElections.includes(electionId));
      } else {
        setHasVoted(false);
      }
    } catch (error) {
      console.error('Error checking private vote status:', error);
      setHasVoted(false);
    }
  }, [address, electionId]);

  return hasVoted;
};

/**
 * Fonction utilitaire pour enregistrer un vote privé dans localStorage
 * À appeler après une transaction de vote privé réussie
 *
 * @param electionId - ID de l'élection
 * @param walletAddress - Adresse du wallet
 */
export const markPrivateVoteAsSubmitted = (electionId: number, walletAddress: string): void => {
  try {
    const storageKey = `democratix_private_votes_${walletAddress}`;
    const storedVotes = localStorage.getItem(storageKey);

    let votedElections: number[] = [];
    if (storedVotes) {
      votedElections = JSON.parse(storedVotes);
    }

    // Ajouter l'élection si pas déjà présente
    if (!votedElections.includes(electionId)) {
      votedElections.push(electionId);
      localStorage.setItem(storageKey, JSON.stringify(votedElections));
      console.log(`✅ Private vote marked for election ${electionId} for wallet ${walletAddress.substring(0, 10)}...`);
    }
  } catch (error) {
    console.error('Error marking private vote as submitted:', error);
  }
};
