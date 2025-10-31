import { useState, useEffect } from 'react';
import { votingContract } from 'config';
import { useGetNetworkConfig } from 'lib';

// Fonction helper pour convertir base64 en hex
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

// Fonction helper pour décoder une adresse MultiversX
function decodeAddress(hex: string): string {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  // Convertir hex en bytes
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }

  // Convertir bits 8->5
  const converted = convertBits(bytes, 8, 5, true);
  if (!converted) return hex;

  // Créer checksum
  const checksum = createChecksum('erd', converted);
  const combined = converted.concat(checksum);

  // Encoder en bech32
  let result = 'erd1';
  for (const value of combined) {
    result += CHARSET[value];
  }
  return result;
}

function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (const value of data) {
    if (value < 0 || (value >> fromBits) !== 0) return null;
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad && bits > 0) {
    result.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
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

function polymod(values: number[]): number {
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

function createChecksum(hrp: string, data: number[]): number[] {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(values) ^ 1;
  const result: number[] = [];
  for (let i = 0; i < 6; i++) {
    result.push((mod >> (5 * (5 - i))) & 31);
  }
  return result;
}

export const useGetRegisteredVoters = (electionId: number) => {
  const [voters, setVoters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { network } = useGetNetworkConfig();

  useEffect(() => {
    const fetchVoters = async () => {
      if (!electionId) {
        setLoading(false);
        return;
      }

      try {
        const apiUrl = network.apiAddress;
        const allVoters: string[] = [];
        let offset = 0;
        const limit = 100;

        // Pagination pour récupérer tous les inscrits
        while (true) {
          const response = await fetch(
            `${apiUrl}/vm-values/query`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scAddress: votingContract,
                funcName: 'getRegisteredVoters',
                args: [
                  electionId.toString(16).padStart(16, '0'),  // election_id en hex
                  offset.toString(16).padStart(8, '0'),        // offset en hex
                  limit.toString(16).padStart(8, '0')          // limit en hex
                ]
              })
            }
          );

          const data = await response.json();
          const returnData = data.data?.data?.returnData || [];

          if (returnData.length === 0) break;

          // Décoder chaque adresse (base64 -> hex -> bech32)
          for (const addressBase64 of returnData) {
            const hex = base64ToHex(addressBase64);
            if (hex.length === 64) {  // 32 bytes = 64 hex chars
              const bech32 = decodeAddress(hex);
              allVoters.push(bech32);
            }
          }

          offset += limit;

          // Si moins de `limit` résultats, on a tout récupéré
          if (returnData.length < limit) break;
        }

        console.log(`✅ ${allVoters.length} adresses récupérées pour l'élection ${electionId}`);
        setVoters(allVoters);
      } catch (err) {
        console.error('Erreur lors de la récupération des inscrits:', err);
        setError('Impossible de récupérer la liste des inscrits');
      } finally {
        setLoading(false);
      }
    };

    fetchVoters();
  }, [electionId, network.apiAddress]);

  return { voters, loading, error };
};
