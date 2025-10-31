import { votingContract } from 'config';
import { useGetNetworkConfig } from 'lib';

export const useIsVoterRegistered = () => {
  const { network } = useGetNetworkConfig();

  const isVoterRegistered = async (
    electionId: number,
    voterAddress: string
  ): Promise<boolean> => {
    try {
      const apiUrl = network.apiAddress;

      // Convertir l'ID en hex (u64 = 8 bytes = 16 caractères)
      const idHex = electionId.toString(16).padStart(16, '0');

      // Convertir l'adresse bech32 en hex
      const addressHex = convertBech32ToHex(voterAddress);

      const response = await fetch(`${apiUrl}/vm-values/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scAddress: votingContract,
          funcName: 'isVoterRegistered',
          args: [idHex, addressHex]
        })
      });

      const data = await response.json();

      if (
        !data.data?.data?.returnData ||
        data.data.data.returnData.length === 0
      ) {
        return false;
      }

      const resultBase64 = data.data.data.returnData[0];
      const resultBytes = atob(resultBase64);

      // Un bool est encodé sur 1 byte: 0x01 = true, 0x00 = false
      return resultBytes.charCodeAt(0) === 1;
    } catch (err) {
      console.error('Unable to check voter registration:', err);
      return false;
    }
  };

  return { isVoterRegistered };
};

// Helper function to convert bech32 address to hex
function convertBech32ToHex(bech32Address: string): string {
  // Si l'adresse ne commence pas par "erd1", la retourner telle quelle
  if (!bech32Address.startsWith('erd1')) {
    return bech32Address;
  }

  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  // Retirer le préfixe "erd1"
  const data = bech32Address.substring(4);

  // Convertir les caractères en valeurs 5-bit
  const values: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    const value = CHARSET.indexOf(char);
    if (value === -1) {
      throw new Error('Invalid bech32 character');
    }
    values.push(value);
  }

  // Retirer les 6 derniers caractères (checksum)
  const dataWithoutChecksum = values.slice(0, -6);

  // Convertir de 5-bit à 8-bit
  const bytes = convertBits(dataWithoutChecksum, 5, 8, false);
  if (!bytes) {
    throw new Error('Failed to convert bech32 to hex');
  }

  // Convertir en hex
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function convertBits(
  data: number[],
  fromBits: number,
  toBits: number,
  pad: boolean
): number[] | null {
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
