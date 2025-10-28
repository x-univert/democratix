import { useState, useEffect } from 'react';
import { ipfsService, type ElectionMetadata, type CandidateMetadata } from '../../services/ipfsService';

/**
 * Hook pour récupérer les métadonnées d'une élection depuis IPFS
 */
export const useElectionMetadata = (ipfsHash: string | null | undefined) => {
  const [metadata, setMetadata] = useState<ElectionMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!ipfsHash) {
        setMetadata(null);
        return;
      }

      // Vérifier si c'est un vrai hash IPFS ou juste une description en texte
      if (!ipfsService.isValidIPFSHash(ipfsHash)) {
        // C'est probablement une ancienne élection avec description directe
        // On crée des métadonnées fictives
        setMetadata({
          title: '',
          description: ipfsHash,
          organizer: '',
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await ipfsService.fetchElectionMetadata(ipfsHash);
        setMetadata(data);
      } catch (err) {
        console.error('Erreur lors de la récupération des métadonnées IPFS:', err);
        setError('Impossible de récupérer les données IPFS');
        // En cas d'erreur, on met le hash comme description
        setMetadata({
          title: '',
          description: ipfsHash,
          organizer: '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [ipfsHash]);

  return { metadata, loading, error };
};

/**
 * Hook pour récupérer les métadonnées d'un candidat depuis IPFS
 */
export const useCandidateMetadata = (ipfsHash: string | null | undefined) => {
  const [metadata, setMetadata] = useState<CandidateMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!ipfsHash) {
        setMetadata(null);
        return;
      }

      // Vérifier si c'est un vrai hash IPFS
      if (!ipfsService.isValidIPFSHash(ipfsHash)) {
        // Description directe (ancienne version)
        setMetadata({
          name: '',
          biography: ipfsHash,
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await ipfsService.fetchCandidateMetadata(ipfsHash);
        setMetadata(data);
      } catch (err) {
        console.error('Erreur lors de la récupération des métadonnées du candidat:', err);
        setError('Impossible de récupérer les données IPFS');
        setMetadata({
          name: '',
          biography: ipfsHash,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [ipfsHash]);

  return { metadata, loading, error };
};

/**
 * Hook pour obtenir l'URL d'une image IPFS
 */
export const useIPFSImage = (ipfsHash: string | null | undefined) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ipfsHash) {
      setImageUrl(null);
      return;
    }

    // Si c'est déjà une URL complète, on la garde
    if (ipfsHash.startsWith('http')) {
      setImageUrl(ipfsHash);
      return;
    }

    // Sinon, on construit l'URL IPFS
    if (ipfsService.isValidIPFSHash(ipfsHash)) {
      setImageUrl(ipfsService.getIPFSUrl(ipfsHash));
    } else {
      setImageUrl(null);
    }
  }, [ipfsHash]);

  return imageUrl;
};
