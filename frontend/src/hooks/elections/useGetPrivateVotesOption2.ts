import { useState, useEffect } from 'react';
import { votingContract } from 'config';
import { useGetNetworkConfig } from 'lib';

interface PrivateVoteOption2 {
  c1: string;
  c2: string;
  nullifier: string;
  timestamp: number;
}

/**
 * Hook pour récupérer les votes privés Option 2 (ElGamal + zk-SNARK) d'une élection
 *
 * @param electionId - ID de l'élection
 * @returns Les votes chiffrés Option 2 et le statut de chargement
 */
export const useGetPrivateVotesOption2 = (electionId: number | null) => {
  const { network } = useGetNetworkConfig();
  const [privateVotesOption2, setPrivateVotesOption2] = useState<PrivateVoteOption2[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivateVotesOption2 = async () => {
      if (electionId === null || electionId === undefined) {
        setPrivateVotesOption2([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔐 Fetching Option 2 private votes for election:', electionId);

        const apiUrl = network.apiAddress;

        // Convertir l'ID en hex (u64 = 8 bytes = 16 caractères)
        const idHex = electionId.toString(16).padStart(16, '0');

        const response = await fetch(`${apiUrl}/vm-values/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scAddress: votingContract,
            funcName: 'getEncryptedVotesWithProof',
            args: [idHex]
          })
        });

        const data = await response.json();

        if (!data.data?.data?.returnData || data.data.data.returnData.length === 0) {
          console.log('✅ No Option 2 private votes found for election:', electionId);
          setPrivateVotesOption2([]);
          setIsLoading(false);
          return;
        }

        // Parser les votes Option 2
        const votes: PrivateVoteOption2[] = [];

        for (let i = 0; i < data.data.data.returnData.length; i++) {
          try {
            const voteBase64 = data.data.data.returnData[i];
            const voteHex = base64ToHex(voteBase64);

            if (voteHex.length > 0) {
              const vote = decodePrivateVoteOption2(voteHex);
              if (vote) {
                votes.push(vote);
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Error parsing Option 2 private vote:', parseError);
          }
        }

        console.log(`✅ Fetched ${votes.length} Option 2 private votes`);
        setPrivateVotesOption2(votes);
      } catch (err: any) {
        console.error('❌ Error fetching Option 2 private votes:', err);
        setError(err.message || 'Failed to fetch Option 2 private votes');
        setPrivateVotesOption2([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivateVotesOption2();
  }, [electionId, network.apiAddress]);

  return {
    privateVotesOption2,
    totalPrivateVotesOption2: privateVotesOption2.length,
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
  try {
    const uint8Array = new Uint8Array(bytes);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array);
  } catch (err) {
    console.error('Error decoding UTF-8 string:', err);
    return String.fromCharCode(...bytes);
  }
}

/**
 * Décode un vote Option 2 depuis son encodage hex
 *
 * Structure ElGamalVoteWithProof:
 * - c1: ManagedBuffer (4 bytes length + data)
 * - c2: ManagedBuffer (4 bytes length + data)
 * - nullifier: ManagedBuffer (4 bytes length + data)
 * - proof: Groth16Proof (pi_a, pi_b, pi_c) - ignoré pour le déchiffrement
 * - timestamp: u64 (8 bytes)
 */
function decodePrivateVoteOption2(hex: string): PrivateVoteOption2 | null {
  try {
    const bytes = hexToBytes(hex);
    let offset = 0;

    // c1 (ManagedBuffer - 4 bytes length + data)
    const c1Len = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const c1 = bytesToString(bytes.slice(offset, offset + c1Len));
    offset += c1Len;

    // c2 (ManagedBuffer - 4 bytes length + data)
    const c2Len = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const c2 = bytesToString(bytes.slice(offset, offset + c2Len));
    offset += c2Len;

    // nullifier (ManagedBuffer - 4 bytes length + data)
    const nullifierLen = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const nullifier = bytesToString(bytes.slice(offset, offset + nullifierLen));
    offset += nullifierLen;

    // On pourrait décoder la preuve Groth16 ici si nécessaire
    // Mais pour le déchiffrement, on n'en a pas besoin
    // La preuve contient: pi_a (G1Point), pi_b (G2Point), pi_c (G1Point)
    // Pour l'instant, on cherche juste le timestamp à la fin

    // On cherche le timestamp (u64 - 8 bytes) à la fin du buffer
    // Le timestamp est après la preuve, qui a une longueur variable
    // Pour simplifier, on le lit depuis la fin
    const timestamp = bytesToNumber(bytes.slice(bytes.length - 8, bytes.length));

    return {
      c1,
      c2,
      nullifier,
      timestamp
    };
  } catch (err) {
    console.error('Error decoding Option 2 private vote:', err);
    return null;
  }
}
