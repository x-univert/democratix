import { votingContract } from 'config';
import { useGetNetworkConfig } from 'lib';
import type { Election } from './useGetElection';

export const useGetElections = () => {
  const { network } = useGetNetworkConfig();

  const getElections = async (): Promise<Election[]> => {
    try {
      // Utiliser l'API HTTP directement (plus simple et plus fiable)
      const apiUrl = network.apiAddress;

      // 1. Obtenir le nombre total d'élections
      console.log('🔍 Calling getTotalElections on contract:', votingContract);
      console.log('🔍 API URL:', apiUrl);

      const totalResponse = await fetch(
        `${apiUrl}/vm-values/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scAddress: votingContract,
            funcName: 'getTotalElections',
            args: []
          })
        }
      );

      const totalData = await totalResponse.json();
      console.log('🔍 Raw API response:', JSON.stringify(totalData, null, 2));

      if (!totalData.data?.data?.returnData || totalData.data.data.returnData.length === 0) {
        console.log('No elections found');
        return [];
      }

      // Décoder le résultat (base64 -> bytes -> number)
      const totalBase64 = totalData.data.data.returnData[0];
      console.log('🔍 Total base64 from API:', totalBase64);

      // Décoder base64 en bytes puis convertir en nombre
      const totalBytes = atob(totalBase64);
      console.log('🔍 Total bytes:', totalBytes);

      // Convertir les bytes en nombre (big-endian)
      let totalElections = 0;
      for (let i = 0; i < totalBytes.length; i++) {
        totalElections = totalElections * 256 + totalBytes.charCodeAt(i);
      }
      console.log('🔍 Total elections decoded:', totalElections);

      console.log(`Total elections found: ${totalElections}`);

      if (totalElections === 0) {
        return [];
      }

      // 2. Récupérer chaque élection (les IDs commencent à 1)
      // Optimisation: requêtes parallèles par batches de 20
      const elections: Election[] = [];
      const BATCH_SIZE = 20;

      console.log(`Fetching ${totalElections} elections in batches of ${BATCH_SIZE}...`);

      for (let batchStart = 1; batchStart <= totalElections; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalElections);
        console.log(`Fetching batch: elections ${batchStart}-${batchEnd}`);

        const batchPromises = [];

        for (let i = batchStart; i <= batchEnd; i++) {
          // u64 = 8 bytes = 16 caractères hex
          const idHex = i.toString(16).padStart(16, '0');

          const promise = fetch(
            `${apiUrl}/vm-values/query`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scAddress: votingContract,
                funcName: 'getElection',
                args: [idHex]
              })
            }
          )
            .then(response => response.json())
            .then(electionData => {
              if (electionData.data?.data?.returnData && electionData.data.data.returnData.length > 0) {
                const electionBase64 = electionData.data.data.returnData[0];
                const electionHex = base64ToHex(electionBase64);
                return decodeElection(electionHex, i);
              }
              return null;
            })
            .catch(err => {
              console.error(`Error fetching election ${i}:`, err);
              return null;
            });

          batchPromises.push(promise);
        }

        // Attendre que tout le batch soit terminé
        const batchResults = await Promise.all(batchPromises);

        // Ajouter les élections valides
        for (const election of batchResults) {
          if (election !== null) {
            elections.push(election);
          }
        }

        console.log(`Batch complete. Total elections loaded: ${elections.length}`);
      }

      console.log(`✅ Finished loading ${elections.length} elections`);
      return elections;
    } catch (err) {
      console.error('Unable to fetch elections:', err);
      return [];
    }
  };

  return { getElections };
};

// Fonction helper pour décoder une élection depuis hex
function decodeElection(hex: string, defaultId: number): Election {
  try {
    const bytes = hexToBytes(hex);
    let offset = 0;

    // ID (u64 - 8 bytes)
    const id = bytesToNumber(bytes.slice(offset, offset + 8));
    offset += 8;

    // Title (ManagedBuffer)
    const titleLen = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const title = bytesToString(bytes.slice(offset, offset + titleLen));
    offset += titleLen;

    // Description IPFS (ManagedBuffer)
    const descLen = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;
    const description_ipfs = bytesToString(bytes.slice(offset, offset + descLen));
    offset += descLen;

    // Organizer (32 bytes address)
    const organizerBytes = bytes.slice(offset, offset + 32);
    const organizer = bech32Encode(organizerBytes);
    offset += 32;

    // Start time (u64)
    const start_time = bytesToNumber(bytes.slice(offset, offset + 8));
    offset += 8;

    // End time (u64)
    const end_time = bytesToNumber(bytes.slice(offset, offset + 8));
    offset += 8;

    // Num candidates (u32)
    const num_candidates = bytesToNumber(bytes.slice(offset, offset + 4));
    offset += 4;

    // Status (enum - 1 byte)
    const statusValue = bytes[offset];
    const statusNames: ('Pending' | 'Active' | 'Closed' | 'Finalized')[] = ['Pending', 'Active', 'Closed', 'Finalized'];
    const status = statusNames[statusValue] || 'Pending';
    offset += 1;

    // Total votes (u64)
    const total_votes = bytesToNumber(bytes.slice(offset, offset + 8));

    return {
      id: id || defaultId,
      title,
      description_ipfs,
      organizer,
      start_time,
      end_time,
      num_candidates,
      status,
      total_votes
    };
  } catch (err) {
    console.error('Error decoding election:', err);
    return {
      id: defaultId,
      title: 'Error loading',
      description_ipfs: '',
      organizer: '',
      start_time: 0,
      end_time: 0,
      num_candidates: 0,
      status: 'Pending',
      total_votes: 0
    };
  }
}

// Helpers
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

function bech32Encode(bytes: number[]): string {
  // Utiliser la conversion bech32 correcte
  // Pour l'instant, on utilise la bibliothèque bech32 de MultiversX
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');

  // Si on a exactement 32 bytes (64 caractères hex), c'est une adresse
  if (hex.length === 64) {
    try {
      // Utiliser la fonction de conversion bech32 native du navigateur
      const bech32 = convertHexToBech32(hex);
      return bech32;
    } catch (e) {
      console.error('Error converting to bech32:', e);
      return hex; // Fallback sur hex
    }
  }

  return hex;
}

// Fonction helper pour convertir hex en bech32
function convertHexToBech32(hex: string): string {
  // Alphabet bech32
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  // Convertir hex en bytes
  const data: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    data.push(parseInt(hex.substr(i, 2), 16));
  }

  // Convertir en format 5-bit pour bech32
  const converted = convertBits(data, 8, 5, true);
  if (!converted) return hex;

  // Calculer le checksum
  const checksum = createChecksum('erd', converted);
  const combined = converted.concat(checksum);

  // Encoder en bech32
  let result = 'erd1';
  for (const value of combined) {
    result += CHARSET[value];
  }

  return result;
}

// Convertir entre différentes tailles de bits
function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (const value of data) {
    if (value < 0 || (value >> fromBits) !== 0) {
      return null;
    }
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((acc << (toBits - bits)) & maxv);
    }
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }

  return result;
}

// Créer le checksum bech32
function createChecksum(hrp: string, data: number[]): number[] {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const polymod = polymodCalculation(values) ^ 1;
  const result: number[] = [];
  for (let i = 0; i < 6; i++) {
    result.push((polymod >> (5 * (5 - i))) & 31);
  }
  return result;
}

function hrpExpand(hrp: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < hrp.length; i++) {
    result.push(hrp.charCodeAt(i) >> 5);
  }
  result.push(0);
  for (let i = 0; i < hrp.length; i++) {
    result.push(hrp.charCodeAt(i) & 31);
  }
  return result;
}

function polymodCalculation(values: number[]): number {
  const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) {
        chk ^= GENERATOR[i];
      }
    }
  }
  return chk;
}

function base64ToHex(base64: string): string {
  try {
    // Décoder base64 en bytes
    const binaryString = atob(base64);
    const bytes: number[] = [];
    for (let i = 0; i < binaryString.length; i++) {
      bytes.push(binaryString.charCodeAt(i));
    }
    // Convertir bytes en hex
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Error converting base64 to hex:', err);
    return '';
  }
}
