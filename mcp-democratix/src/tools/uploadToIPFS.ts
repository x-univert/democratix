/**
 * Upload to IPFS Tool
 * Upload métadonnées sur IPFS via Pinata
 */

import axios from 'axios';

const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET = process.env.PINATA_SECRET_API_KEY || '';

export async function uploadToIPFSTool(args: any) {
  const { metadata, name } = args;

  if (!PINATA_API_KEY || !PINATA_SECRET) {
    throw new Error('Pinata API credentials not configured. Set PINATA_API_KEY and PINATA_SECRET_API_KEY env variables.');
  }

  try {
    // Upload JSON to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: metadata,
        pinataMetadata: {
          name: name || 'democratix-metadata'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET
        }
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return {
      content: [
        {
          type: 'text',
          text: `✅ **Upload IPFS Réussi**\n\n` +
                `**Hash IPFS**: \`${ipfsHash}\`\n\n` +
                `**URL**: ${ipfsUrl}\n\n` +
                `**Métadonnées**:\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\`\n\n` +
                `💡 Utilisez ce hash IPFS lors de la création de l'élection`
        }
      ]
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Pinata API error: ${error.response?.data?.error || error.message}`);
    }
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : String(error)}`);
  }
}
