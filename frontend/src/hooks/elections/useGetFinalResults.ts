import { votingContract } from 'config';
import { useGetNetworkConfig } from 'lib';

export interface FinalResult {
  candidate_id: number;
  vote_count: number;
}

export interface FinalResultsData {
  results: FinalResult[];
  ipfsHash: string | null;
  ipfsUrl: string | null;
}

export const useGetFinalResults = () => {
  const { network } = useGetNetworkConfig();

  const getFinalResults = async (electionId: number): Promise<FinalResultsData | null> => {
    try {
      const apiUrl = network.apiAddress;
      const electionIdHex = electionId.toString(16).padStart(16, '0');

      // 1. Récupérer les résultats finaux
      const resultsResponse = await fetch(
        `${apiUrl}/vm-values/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scAddress: votingContract,
            funcName: 'getFinalResults',
            args: [electionIdHex]
          })
        }
      );

      const resultsData = await resultsResponse.json();

      if (!resultsData.data?.data?.returnData || resultsData.data.data.returnData.length === 0) {
        console.log('⚠️ No final results found on blockchain');
        return null;
      }

      // Décoder les résultats (chaque élément est un tuple (u32, u64))
      const results: FinalResult[] = [];
      for (const resultBase64 of resultsData.data.data.returnData) {
        const resultHex = base64ToHex(resultBase64);
        const result = decodeResult(resultHex);
        results.push(result);
      }

      // 2. Récupérer le hash IPFS si disponible
      const ipfsResponse = await fetch(
        `${apiUrl}/vm-values/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scAddress: votingContract,
            funcName: 'getResultsIpfsHash',
            args: [electionIdHex]
          })
        }
      );

      const ipfsData = await ipfsResponse.json();
      let ipfsHash: string | null = null;

      if (ipfsData.data?.data?.returnData && ipfsData.data.data.returnData.length > 0) {
        // returnData[0] contient l'OptionalValue (0x01 + hash ou 0x00)
        const optionalHex = base64ToHex(ipfsData.data.data.returnData[0]);
        if (optionalHex.startsWith('01')) {
          // Option::Some - décoder le ManagedBuffer qui suit
          const hashBytes = hexToBytes(optionalHex.substring(2));
          if (hashBytes.length >= 4) {
            const length = bytesToNumber(hashBytes.slice(0, 4));
            ipfsHash = bytesToString(hashBytes.slice(4, 4 + length));
          }
        }
      }

      console.log('✅ Final results loaded from blockchain:', {
        results,
        ipfsHash
      });

      return {
        results,
        ipfsHash,
        ipfsUrl: ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : null
      };
    } catch (err) {
      console.error('❌ Unable to fetch final results:', err);
      return null;
    }
  };

  return { getFinalResults };
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
    console.error('Error decoding UTF-8:', err);
    return String.fromCharCode(...bytes);
  }
}

function decodeResult(hex: string): FinalResult {
  try {
    const bytes = hexToBytes(hex);
    let offset = 0;

    // candidate_id (u32 - 4 bytes)
    const candidate_id = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;

    // vote_count (u64 - 8 bytes)
    const voteCountBytes = bytes.slice(offset, offset + 8);
    let vote_count = 0;
    for (let i = 0; i < voteCountBytes.length; i++) {
      vote_count = vote_count * 256 + voteCountBytes[i];
    }

    return { candidate_id, vote_count };
  } catch (err) {
    console.error('Error decoding result:', err);
    return { candidate_id: 0, vote_count: 0 };
  }
}
