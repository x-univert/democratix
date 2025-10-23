import { EnvironmentsEnum } from '@multiversx/sdk-dapp';

export * from './sharedConfig';

// Adresses des contrats sur Devnet (à remplir après déploiement)
export const votingContract = process.env.VITE_VOTING_CONTRACT || '';
export const voterRegistryContract = process.env.VITE_VOTER_REGISTRY_CONTRACT || '';
export const resultsContract = process.env.VITE_RESULTS_CONTRACT || '';

// Temporary ping-pong contract address for template compatibility (will be removed)
export const contractAddress = '';

// API URL pour le backend
export const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

// Domaines authentifiés pour les requêtes API
export const sampleAuthenticatedDomains = [API_URL];

// Environnement MultiversX
export const environment = EnvironmentsEnum.devnet;

// URLs de l'API MultiversX
export const multiversxApiUrl = 'https://devnet-api.multiversx.com';
export const multiversxGatewayUrl = 'https://devnet-gateway.multiversx.com';

// Chain ID
export const chainId = 'D';

// Explorer URL
export const explorerUrl = 'https://devnet-explorer.multiversx.com';

// GitHub Repository URL
export const GITHUB_REPO_URL = 'https://github.com/YOUR_USERNAME/DEMOCRATIX';
