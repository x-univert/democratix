import { votingContract } from 'config';
import votingAbi from 'contracts/voting.abi.json';
import {
  AbiRegistry,
  Address,
  ProxyNetworkProvider,
  useGetNetworkConfig
} from 'lib';

export interface Candidate {
  id: number;
  name: string;
  description_ipfs: string;
}

export const useGetCandidates = () => {
  const { network } = useGetNetworkConfig();

  const getCandidates = async (electionId: number): Promise<Candidate[]> => {
    try {
      const apiUrl = network.apiAddress;

      // Convertir l'ID en hex
      const idHex = electionId.toString(16).padStart(2, '0');

      const candidatesResponse = await fetch(
        `${apiUrl}/vm-values/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scAddress: votingContract,
            funcName: 'getCandidates',
            args: [idHex]
          })
        }
      );

      const candidatesData = await candidatesResponse.json();

      if (!candidatesData.data?.data?.returnData || candidatesData.data.data.returnData.length === 0) {
        return [];
      }

      const candidates: Candidate[] = [];

      // Chaque candidat est retourné comme un élément séparé dans returnData
      for (let i = 0; i < candidatesData.data.data.returnData.length; i++) {
        const candidateBase64 = candidatesData.data.data.returnData[i];
        const candidateHex = base64ToHex(candidateBase64);
        const candidate = decodeCandidate(candidateHex, i); // Index commence à 0
        candidates.push(candidate);
      }

      console.log('📋 Loaded candidates:', candidates);
      return candidates;
    } catch (err) {
      console.error('Unable to fetch candidates:', err);
      return [];
    }
  };

  return { getCandidates };
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
  // Décoder correctement UTF-8
  try {
    // Convertir les bytes en Uint8Array
    const uint8Array = new Uint8Array(bytes);
    // Utiliser TextDecoder pour décoder UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array);
  } catch (err) {
    console.error('Error decoding UTF-8:', err);
    // Fallback sur l'ancienne méthode si erreur
    return String.fromCharCode(...bytes);
  }
}

function decodeDescription(text: string): string {
  // Ne plus décoder - retourner le hash IPFS tel quel
  // Le décodage des métadonnées IPFS est géré par les hooks useElectionMetadata et useCandidateMetadata
  return text;
}

function decodeCandidate(hex: string, defaultId: number): Candidate {
  try {
    const bytes = hexToBytes(hex);
    let offset = 0;

    // ID (u32 - 4 bytes)
    const decodedId = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;

    // Utiliser defaultId si l'ID décodé est 0 (fallback)
    const id = decodedId === 0 ? defaultId : decodedId;

    // Name (ManagedBuffer)
    const nameLen = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const name = bytesToString(bytes.slice(offset, offset + nameLen));
    offset += nameLen;

    // Description IPFS (ManagedBuffer)
    const descLen = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const description_ipfs = decodeDescription(bytesToString(bytes.slice(offset, offset + descLen)));

    console.log(`🔍 Decoded candidate: ID=${id} (decoded=${decodedId}, default=${defaultId}), name=${name}`);

    return {
      id,
      name,
      description_ipfs
    };
  } catch (err) {
    console.error('Error decoding candidate:', err);
    return {
      id: defaultId,
      name: 'Error loading',
      description_ipfs: ''
    };
  }
}
