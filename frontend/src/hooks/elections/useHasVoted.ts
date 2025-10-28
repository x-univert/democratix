import { votingContract } from 'config';
import votingAbi from 'contracts/voting.abi.json';
import {
  AbiRegistry,
  Address,
  ProxyNetworkProvider,
  useGetAccount,
  useGetNetworkConfig
} from 'lib';

export const useHasVoted = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const hasVoted = async (electionId: number): Promise<boolean> => {
    try {
      if (!address) {
        return false;
      }

      const apiUrl = network.apiAddress;

      // Convertir l'ID en hex
      const idHex = electionId.toString(16).padStart(2, '0');

      // Convertir l'adresse bech32 en hex (retirer 'erd1' et décoder)
      const addressHex = addressToHex(address);

      const response = await fetch(
        `${apiUrl}/vm-values/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scAddress: votingContract,
            funcName: 'hasVoted',
            args: [idHex, addressHex]
          })
        }
      );

      const data = await response.json();

      if (!data.data?.data?.returnData || data.data.data.returnData.length === 0) {
        return false;
      }

      // Le résultat est un booléen encodé en base64
      const resultBase64 = data.data.data.returnData[0];
      const resultHex = base64ToHex(resultBase64);

      // Un booléen est 1 byte: 00 = false, 01 = true
      const hasVotedResult = resultHex === '01' || resultHex === '1';

      console.log(`✅ hasVoted check: election=${electionId}, user=${address}, result=${hasVotedResult}`);

      return hasVotedResult;
    } catch (err) {
      console.error('Unable to check if user has voted:', err);
      return false;
    }
  };

  return { hasVoted };
};

// Helper functions
function addressToHex(bech32Address: string): string {
  // Enlever le préfixe 'erd1'
  const withoutPrefix = bech32Address.replace('erd1', '');

  // Décoder bech32 en bytes
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const values: number[] = [];

  for (let i = 0; i < withoutPrefix.length; i++) {
    const char = withoutPrefix[i];
    const value = CHARSET.indexOf(char);
    if (value === -1) continue;
    values.push(value);
  }

  // Enlever le checksum (derniers 6 caractères)
  const dataValues = values.slice(0, -6);

  // Convertir de 5-bit à 8-bit
  const bytes = convertBits(dataValues, 5, 8, false);
  if (!bytes) return '';

  // Convertir en hex
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
