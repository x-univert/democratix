/**
 * Hook pour récupérer la clé publique ElGamal d'une élection
 * Nécessaire pour chiffrer les votes avec l'Option 1
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3003';

interface ElGamalPublicKeyData {
  electionId: number;
  publicKey: string;
  algorithm: string;
  keyLength: number;
}

interface UseGetElectionPublicKeyResult {
  publicKey: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Récupère la clé publique ElGamal pour une élection
 *
 * @param electionId - ID de l'élection
 * @returns Clé publique et état du chargement
 */
export const useGetElectionPublicKey = (
  electionId: number | null
): UseGetElectionPublicKeyResult => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicKey = async () => {
    if (!electionId) {
      setPublicKey(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching ElGamal public key for election:', electionId);

      const response = await axios.get<{
        success: boolean;
        data: ElGamalPublicKeyData;
        error?: string;
      }>(`${BACKEND_API_URL}/api/elections/${electionId}/public-key`);

      if (response.data.success && response.data.data) {
        console.log('✅ Public key fetched:', {
          electionId: response.data.data.electionId,
          publicKey: response.data.data.publicKey.substring(0, 20) + '...',
          algorithm: response.data.data.algorithm,
          keyLength: response.data.data.keyLength
        });

        setPublicKey(response.data.data.publicKey);
        setError(null);
      } else {
        const errorMsg = response.data.error || 'Failed to fetch public key';
        console.error('❌ Failed to fetch public key:', errorMsg);
        setError(errorMsg);
        setPublicKey(null);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Network error';
      console.error('❌ Error fetching public key:', errorMsg);
      setError(errorMsg);
      setPublicKey(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicKey();
  }, [electionId]);

  return {
    publicKey,
    loading,
    error,
    refetch: fetchPublicKey
  };
};
