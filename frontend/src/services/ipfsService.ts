import axios from 'axios';
import { retryIPFSOperation } from '../utils/retryWithBackoff';

// ⚠️ IMPORTANT: Les clés API doivent être configurées dans le fichier .env
// Ne JAMAIS commiter les clés API dans le code source!
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

// Gateways IPFS publiques avec support CORS (en ordre de préférence)
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'
];

// Cache simple en mémoire pour éviter trop de requêtes
const ipfsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
   * Upload un fichier JSON sur IPFS via Pinata with automatic retry
   */
  async uploadJSON<T = any>(data: T, name?: string): Promise<string> {
    const fileName = name || `democratix_${Date.now()}.json`;

    return retryIPFSOperation(
      async () => {
        const response = await axios.post(
          'https://api.pinata.cloud/pinning/pinJSONToIPFS',
          {
            pinataContent: data,
            pinataMetadata: {
              name: fileName,
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${PINATA_JWT}`,
            },
            timeout: 30000, // 30 seconds timeout
          }
        );

        return response.data.IpfsHash;
      },
      `Upload JSON (${fileName})`
    );
  }

  /**
   * Upload un fichier (image, document, etc.) sur IPFS via Pinata with automatic retry
   */
  async uploadFile(file: File): Promise<string> {
    return retryIPFSOperation(
      async () => {
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
            timeout: 60000, // 60 seconds timeout for file uploads
          }
        );

        return response.data.IpfsHash;
      },
      `Upload file (${file.name})`
    );
  }

  /**
   * Récupère un fichier JSON depuis IPFS avec fallback et cache
   */
  async fetchJSON<T = any>(ipfsHash: string): Promise<T> {
    // Nettoyer le hash IPFS (enlever les préfixes ipfs:// ou https://...)
    const cleanHash = this.cleanIPFSHash(ipfsHash);

    // Vérifier le cache
    const cached = ipfsCache.get(cleanHash);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Cache hit pour', cleanHash);
      return cached.data;
    }

    // Essayer chaque gateway jusqu'à ce qu'une fonctionne
    let lastError: any;
    for (const gateway of IPFS_GATEWAYS) {
      try {
        console.log(`🔄 Tentative de récupération depuis ${gateway}`);
        const response = await axios.get(`${gateway}${cleanHash}`, {
          timeout: 10000, // 10 secondes de timeout
          headers: {
            'Accept': 'application/json'
          }
        });

        // Mettre en cache le résultat
        ipfsCache.set(cleanHash, {
          data: response.data,
          timestamp: Date.now()
        });

        console.log(`✅ Récupération réussie depuis ${gateway}`);
        return response.data;
      } catch (error: any) {
        console.warn(`❌ Échec avec ${gateway}:`, error.message);
        lastError = error;
        // Continuer avec la gateway suivante
        continue;
      }
    }

    // Si toutes les gateways ont échoué
    console.error('❌ Toutes les gateways IPFS ont échoué pour', cleanHash);
    throw new Error(`Impossible de récupérer les données depuis IPFS: ${lastError?.message || 'Toutes les gateways ont échoué'}`);
  }

  /**
   * Récupère l'URL complète d'un fichier IPFS (utilise la première gateway disponible)
   */
  getIPFSUrl(ipfsHash: string): string {
    const cleanHash = this.cleanIPFSHash(ipfsHash);
    return `${IPFS_GATEWAYS[0]}${cleanHash}`;
  }

  /**
   * Nettoie un hash IPFS en enlevant les préfixes
   */
  private cleanIPFSHash(ipfsHash: string): string {
    if (!ipfsHash) return '';

    // Enlever les préfixes communs de toutes les gateways
    let cleanedHash = ipfsHash.replace('ipfs://', '');

    // Enlever les préfixes de toutes les gateways connues
    for (const gateway of IPFS_GATEWAYS) {
      cleanedHash = cleanedHash.replace(gateway, '');
    }

    // Enlever d'autres préfixes communs
    cleanedHash = cleanedHash
      .replace('https://ipfs.io/ipfs/', '')
      .replace('https://gateway.pinata.cloud/ipfs/', '')
      .replace('https://dweb.link/ipfs/', '')
      .replace('https://cloudflare-ipfs.com/ipfs/', '')
      .trim();

    return cleanedHash;
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
