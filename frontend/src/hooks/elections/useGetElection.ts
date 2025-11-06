import { votingContract } from 'config';
import votingAbi from 'contracts/voting.abi.json';
import {
  AbiRegistry,
  Address,
  ProxyNetworkProvider,
  useGetNetworkConfig
} from 'lib';

export interface Election {
  id: number;
  title: string;
  description_ipfs: string;
  organizer: string;
  start_time: number;
  end_time: number;
  num_candidates: number;
  status: 'Pending' | 'Active' | 'Closed' | 'Finalized';
  total_votes: number;
  requires_registration: boolean;
  registered_voters_count: number;
  registration_deadline?: number | null; // Date limite d'inscription (optionnel)
  encryption_type?: number; // Type de chiffrement: 0=none, 1=elgamal, 2=elgamal+zksnark
}

export const useGetElection = () => {
  const { network } = useGetNetworkConfig();

  const getElection = async (electionId: number): Promise<Election | null> => {
    try {
      const apiUrl = network.apiAddress;

      // Convertir l'ID en hex (u64 = 8 bytes = 16 caractères)
      const idHex = electionId.toString(16).padStart(16, '0');

      const electionResponse = await fetch(
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
      );

      const electionData = await electionResponse.json();

      if (!electionData.data?.data?.returnData || electionData.data.data.returnData.length === 0) {
        return null;
      }

      const electionBase64 = electionData.data.data.returnData[0];
      const electionHex = base64ToHex(electionBase64);
      return decodeElection(electionHex, electionId);
    } catch (err) {
      console.error('Unable to fetch election:', err);
      return null;
    }
  };

  return { getElection };
};

// Helper functions (mêmes que dans useGetElections)
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

function bech32Encode(bytes: number[]): string {
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  if (hex.length === 64) {
    try {
      const bech32 = convertHexToBech32(hex);
      return bech32;
    } catch (e) {
      console.error('Error converting to bech32:', e);
      return hex;
    }
  }
  return hex;
}

function convertHexToBech32(hex: string): string {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const data: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    data.push(parseInt(hex.substr(i, 2), 16));
  }
  const converted = convertBits(data, 8, 5, true);
  if (!converted) return hex;
  const checksum = createChecksum('erd', converted);
  const combined = converted.concat(checksum);
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
    offset += 8;

    // Nouveaux champs (pour compatibilité avec les anciennes élections)
    let requires_registration = false;
    let registered_voters_count = 0;
    let registration_deadline: number | null = null;
    let encryption_type = 0; // Par défaut: pas de chiffrement

    // Vérifier s'il reste des bytes à lire (nouvelle structure)
    if (offset < bytes.length) {
      // Requires registration (bool - 1 byte)
      requires_registration = bytes[offset] === 1;
      offset += 1;

      // Registered voters count (u64)
      if (offset + 8 <= bytes.length) {
        registered_voters_count = bytesToNumber(bytes.slice(offset, offset + 8));
        offset += 8;
      }

      // Registration deadline (Option<u64> - 1 byte tag + optional 8 bytes)
      if (offset < bytes.length) {
        const hasDeadline = bytes[offset] === 1;
        offset += 1;

        if (hasDeadline && offset + 8 <= bytes.length) {
          registration_deadline = bytesToNumber(bytes.slice(offset, offset + 8));
          offset += 8;
        }
      }

      // Encryption type (u8 - 1 byte) - NOUVEAU
      if (offset < bytes.length) {
        encryption_type = bytes[offset];
        offset += 1;
      }
    }

    return {
      id: id || defaultId,
      title,
      description_ipfs,
      organizer,
      start_time,
      end_time,
      num_candidates,
      status,
      total_votes,
      requires_registration,
      registered_voters_count,
      registration_deadline,
      encryption_type
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
      total_votes: 0,
      requires_registration: false,
      registered_voters_count: 0,
      registration_deadline: null,
      encryption_type: 0
    };
  }
}
