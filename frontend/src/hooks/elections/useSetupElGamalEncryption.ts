import { useState } from 'react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3003';

interface ElGamalKeys {
  electionId: number;
  publicKey: string;
  privateKey: string;
  metadata: {
    electionId: number;
    algorithm: string;
    curve: string;
    keyLength: number;
    generatedAt: string;
  };
  transaction: {
    sender: string;
    receiver: string;
    data: string;
    gasLimit: number;
    value: string;
    chainID: string;
  };
}

interface SetupElGamalResult {
  success: boolean;
  data?: ElGamalKeys;
  error?: string;
}

export const useSetupElGamalEncryption = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<ElGamalKeys | null>(null);

  const setupEncryption = async (
    electionId: number,
    organizerAddress: string
  ): Promise<SetupElGamalResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/elections/${electionId}/setup-encryption`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizerAddress }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to setup encryption');
      }

      setKeys(result.data);
      return { success: true, data: result.data };
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const downloadPrivateKey = (privateKey: string, electionId: number) => {
    const blob = new Blob([privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `election-${electionId}-private-key.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    setupEncryption,
    downloadPrivateKey,
    loading,
    error,
    keys,
  };
};
