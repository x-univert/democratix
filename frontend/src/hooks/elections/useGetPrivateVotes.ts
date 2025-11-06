import { useState, useEffect } from 'react';
import { votingContract } from 'config';
import { useGetNetworkConfig } from 'lib';

interface PrivateVote {
  vote_commitment: string;
  nullifier: string;
  backend_signature: string;
  timestamp: number;
}

/**
 * Hook pour récupérer les votes privés d'une élection
 *
 * @param electionId - ID de l'élection
 * @returns Les votes privés et le statut de chargement
 */
export const useGetPrivateVotes = (electionId: number | null) => {
  const { network } = useGetNetworkConfig();
  const [privateVotes, setPrivateVotes] = useState<PrivateVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivateVotes = async () => {
      if (electionId === null || electionId === undefined) {
        setPrivateVotes([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔐 Fetching private votes for election:', electionId);

        const apiUrl = network.apiAddress;

        // Convertir l'ID en hex (u64 = 8 bytes = 16 caractères)
        const idHex = electionId.toString(16).padStart(16, '0');

        const response = await fetch(`${apiUrl}/vm-values/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scAddress: votingContract,
            funcName: 'getPrivateVotes',
            args: [idHex]
          })
        });

        const data = await response.json();

        if (!data.data?.data?.returnData || data.data.data.returnData.length === 0) {
          console.log('✅ No private votes found for election:', electionId);
          setPrivateVotes([]);
          setIsLoading(false);
          return;
        }

        // Parser les votes privés
        const votes: PrivateVote[] = [];

        // Le premier élément contient le nombre de votes (si présent)
        // Les éléments suivants contiennent les données des votes
        for (let i = 0; i < data.data.data.returnData.length; i++) {
          try {
            const voteBase64 = data.data.data.returnData[i];
            const voteHex = base64ToHex(voteBase64);

            if (voteHex.length > 0) {
              const vote = decodePrivateVote(voteHex);
              if (vote) {
                votes.push(vote);
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Error parsing private vote:', parseError);
          }
        }

        console.log(`✅ Fetched ${votes.length} private votes`);
        setPrivateVotes(votes);
      } catch (err: any) {
        console.error('❌ Error fetching private votes:', err);
        setError(err.message || 'Failed to fetch private votes');
        setPrivateVotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivateVotes();
  }, [electionId, network.apiAddress]);

  return {
    privateVotes,
    totalPrivateVotes: privateVotes.length,
    isLoading,
    error
  };
};

// Helper functions
function base64ToHex(base64: string): string {
  try {
    const binaryString = atob(base64);
    const bytes: number[] = [];
    for (let i = 0; i < binaryString.length; i++) {
      bytes.push(binaryString.charCodeAt(i));
    }
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Error converting base64 to hex:', err);
    return '';
  }
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

function bytesToNumber(bytes: number[]): number {
  let num = 0;
  for (let i = 0; i < bytes.length; i++) {
    num = num * 256 + bytes[i];
  }
  return num;
}

function bytesToString(bytes: number[]): string {
  // Use TextDecoder to properly decode UTF-8 encoded strings
  // This fixes encoding issues with accented characters (é, è, à, etc.)
  try {
    const uint8Array = new Uint8Array(bytes);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array);
  } catch (err) {
    console.error('Error decoding UTF-8 string:', err);
    // Fallback to String.fromCharCode (may have encoding issues)
    return String.fromCharCode(...bytes);
  }
}

function decodePrivateVote(hex: string): PrivateVote | null {
  try {
    const bytes = hexToBytes(hex);
    let offset = 0;

    // Vote commitment (ManagedBuffer - 4 bytes length + data)
    const commitmentLen = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const vote_commitment = bytesToString(bytes.slice(offset, offset + commitmentLen));
    offset += commitmentLen;

    // Nullifier (ManagedBuffer - 4 bytes length + data)
    const nullifierLen = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const nullifier = bytesToString(bytes.slice(offset, offset + nullifierLen));
    offset += nullifierLen;

    // Backend signature (ManagedBuffer - 4 bytes length + data)
    const signatureLen = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const backend_signature = bytesToString(bytes.slice(offset, offset + signatureLen));
    offset += signatureLen;

    // Timestamp (u64 - 8 bytes)
    const timestamp = bytesToNumber(bytes.slice(offset, offset + 8));

    return {
      vote_commitment,
      nullifier,
      backend_signature,
      timestamp
    };
  } catch (err) {
    console.error('Error decoding private vote:', err);
    return null;
  }
}
