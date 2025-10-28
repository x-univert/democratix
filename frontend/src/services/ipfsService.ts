import axios from 'axios';

// ⚠️ IMPORTANT: Les clés API doivent être configurées dans le fichier .env
// Ne JAMAIS commiter les clés API dans le code source!
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

// Gateway IPFS pour récupérer les fichiers
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

/**
 * Structure des métadonnées d'une élection sur IPFS
 */
export interface ElectionMetadata {
  title: string;
  description: string;
  image?: string; // URL ou hash IPFS de l'image
  organizer: string;
  metadata?: {
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
}

/**
 * Structure des métadonnées d'un candidat sur IPFS
 */
export interface CandidateMetadata {
  name: string;
  biography: string;
  image?: string; // URL ou hash IPFS de l'image
  links?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
  metadata?: {
    party?: string;
    position?: string;
    [key: string]: any;
  };
}

/**
 * Service IPFS utilisant Pinata pour l'upload et la récupération de fichiers
 */
export class IPFSService {
  /**
   * Upload un fichier JSON sur IPFS via Pinata
   */
  async uploadJSON<T = any>(data: T, name?: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: data,
          pinataMetadata: {
            name: name || `democratix_${Date.now()}.json`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PINATA_JWT}`,
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Erreur lors de l\'upload JSON sur IPFS:', error);
      throw new Error('Impossible d\'uploader les données sur IPFS');
    }
  }

  /**
   * Upload un fichier (image, document, etc.) sur IPFS via Pinata
   */
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const metadata = JSON.stringify({
        name: file.name,
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${PINATA_JWT}`,
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier sur IPFS:', error);
      throw new Error('Impossible d\'uploader le fichier sur IPFS');
    }
  }

  /**
   * Récupère un fichier JSON depuis IPFS
   */
  async fetchJSON<T = any>(ipfsHash: string): Promise<T> {
    try {
      // Nettoyer le hash IPFS (enlever les préfixes ipfs:// ou https://...)
      const cleanHash = this.cleanIPFSHash(ipfsHash);

      const response = await axios.get(`${IPFS_GATEWAY}${cleanHash}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération depuis IPFS:', error);
      throw new Error('Impossible de récupérer les données depuis IPFS');
    }
  }

  /**
   * Récupère l'URL complète d'un fichier IPFS
   */
  getIPFSUrl(ipfsHash: string): string {
    const cleanHash = this.cleanIPFSHash(ipfsHash);
    return `${IPFS_GATEWAY}${cleanHash}`;
  }

  /**
   * Nettoie un hash IPFS en enlevant les préfixes
   */
  private cleanIPFSHash(ipfsHash: string): string {
    if (!ipfsHash) return '';

    // Enlever les préfixes communs
    return ipfsHash
      .replace('ipfs://', '')
      .replace('https://ipfs.io/ipfs/', '')
      .replace('https://gateway.pinata.cloud/ipfs/', '')
      .replace(IPFS_GATEWAY, '')
      .trim();
  }

  /**
   * Upload les métadonnées d'une élection
   */
  async uploadElectionMetadata(metadata: ElectionMetadata): Promise<string> {
    return this.uploadJSON(metadata, `election_${metadata.title}_${Date.now()}`);
  }

  /**
   * Récupère les métadonnées d'une élection
   */
  async fetchElectionMetadata(ipfsHash: string): Promise<ElectionMetadata> {
    return this.fetchJSON<ElectionMetadata>(ipfsHash);
  }

  /**
   * Upload les métadonnées d'un candidat
   */
  async uploadCandidateMetadata(metadata: CandidateMetadata): Promise<string> {
    return this.uploadJSON(metadata, `candidate_${metadata.name}_${Date.now()}`);
  }

  /**
   * Récupère les métadonnées d'un candidat
   */
  async fetchCandidateMetadata(ipfsHash: string): Promise<CandidateMetadata> {
    return this.fetchJSON<CandidateMetadata>(ipfsHash);
  }

  /**
   * Vérifie si une chaîne est un hash IPFS valide
   */
  isValidIPFSHash(hash: string): boolean {
    if (!hash) return false;
    const cleanHash = this.cleanIPFSHash(hash);
    // Un hash IPFS CIDv0 commence par "Qm" et fait 46 caractères
    // Un hash IPFS CIDv1 commence par "bafy" ou "bafk"
    return (
      (cleanHash.startsWith('Qm') && cleanHash.length === 46) ||
      cleanHash.startsWith('bafy') ||
      cleanHash.startsWith('bafk')
    );
  }

  /**
   * Teste la connexion à Pinata
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        'https://api.pinata.cloud/data/testAuthentication',
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
          },
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Erreur de connexion à Pinata:', error);
      return false;
    }
  }
}

// Export de l'instance singleton
export const ipfsService = new IPFSService();
