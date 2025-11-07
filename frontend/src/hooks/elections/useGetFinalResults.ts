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

      console.log('🔍 Raw results response:', resultsData);

      if (!resultsData.data?.data?.returnData || resultsData.data.data.returnData.length === 0) {
        console.log('⚠️ No final results found on blockchain');
        return null;
      }

      console.log('📊 returnData length:', resultsData.data.data.returnData.length);
      console.log('📊 returnData:', resultsData.data.data.returnData);

      // MultiversX flattens MultiValueEncoded<MultiValue2<u32, u64>> into separate elements:
      // [candidate_id_1, vote_count_1, candidate_id_2, vote_count_2, ...]
      // We need to read them in pairs
      const results: FinalResult[] = [];
      const returnData = resultsData.data.data.returnData;

      if (returnData.length % 2 !== 0) {
        console.error('⚠️ Odd number of return values - expected pairs of (candidate_id, vote_count)');
      }

      for (let i = 0; i < returnData.length; i += 2) {
        if (i + 1 < returnData.length) {
          const candidateIdBase64 = returnData[i];
          const voteCountBase64 = returnData[i + 1];

          const candidateIdHex = base64ToHex(candidateIdBase64);
          const voteCountHex = base64ToHex(voteCountBase64);

          console.log(`🔍 Result ${i/2}: candidateId="${candidateIdBase64}" (${candidateIdHex}), voteCount="${voteCountBase64}" (${voteCountHex})`);

          const candidate_id = parseInt(candidateIdHex, 16);
          const vote_count = parseInt(voteCountHex, 16);

          console.log(`✅ Decoded result ${i/2}: candidate_id=${candidate_id}, vote_count=${vote_count}`);

          results.push({ candidate_id, vote_count });
        }
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

