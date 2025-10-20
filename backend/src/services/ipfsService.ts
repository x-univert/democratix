import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Service IPFS utilisant Pinata pour le stockage décentralisé
 */
export class IPFSService {
  private pinataApiKey: string;
  private pinataSecretKey: string;
  private pinataBaseUrl = 'https://api.pinata.cloud';

  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY || '';

    if (!this.pinataApiKey || !this.pinataSecretKey) {
      logger.warn('Pinata credentials not configured. IPFS uploads will fail.');
    }
  }

  /**
   * Upload du contenu JSON sur IPFS via Pinata
   */
  async uploadJSON(data: any, name: string): Promise<string> {
    try {
      logger.info('Uploading to IPFS', { name });

      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`,
        {
          pinataContent: data,
          pinataMetadata: {
            name,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      logger.info('Upload successful', { ipfsHash, name });

      return ipfsHash;
    } catch (error: any) {
      logger.error('Error uploading to IPFS', {
        error: error.message,
        name,
      });
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  /**
   * Télécharger du contenu depuis IPFS
   */
  async downloadJSON(ipfsHash: string): Promise<any> {
    try {
      logger.info('Downloading from IPFS', { ipfsHash });

      const response = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        {
          timeout: 10000, // 10 secondes
        }
      );

      logger.info('Download successful', { ipfsHash });

      return response.data;
    } catch (error: any) {
      logger.error('Error downloading from IPFS', {
        error: error.message,
        ipfsHash,
      });
      throw new Error(`Failed to download from IPFS: ${error.message}`);
    }
  }

  /**
   * Vérifier si Pinata est correctement configuré
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.pinataBaseUrl}/data/testAuthentication`,
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      logger.info('Pinata connection test successful', response.data);
      return true;
    } catch (error: any) {
      logger.error('Pinata connection test failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Lister les fichiers épinglés
   */
  async listPinnedFiles(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.pinataBaseUrl}/data/pinList?status=pinned`,
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      return response.data.rows || [];
    } catch (error: any) {
      logger.error('Error listing pinned files', {
        error: error.message,
      });
      throw new Error(`Failed to list pinned files: ${error.message}`);
    }
  }

  /**
   * Désépingler un fichier (libérer l'espace)
   */
  async unpinFile(ipfsHash: string): Promise<void> {
    try {
      await axios.delete(
        `${this.pinataBaseUrl}/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      logger.info('File unpinned successfully', { ipfsHash });
    } catch (error: any) {
      logger.error('Error unpinning file', {
        error: error.message,
        ipfsHash,
      });
      throw new Error(`Failed to unpin file: ${error.message}`);
    }
  }

  /**
   * Upload d'une description d'élection sur IPFS
   */
  async uploadElectionMetadata(metadata: {
    title: string;
    description: string;
    organizer: string;
    candidates: any[];
  }): Promise<string> {
    const name = `election_${metadata.title}_${Date.now()}`;
    return this.uploadJSON(metadata, name);
  }

  /**
   * Upload des détails d'un candidat sur IPFS
   */
  async uploadCandidateMetadata(metadata: {
    name: string;
    biography: string;
    program: string;
    photo?: string;
  }): Promise<string> {
    const name = `candidate_${metadata.name}_${Date.now()}`;
    return this.uploadJSON(metadata, name);
  }
}

// Export singleton
export const ipfsService = new IPFSService();
