import { EnvironmentsEnum } from '@multiversx/sdk-dapp';

export * from './sharedConfig';

// Adresses des contrats sur Mainnet (à remplir après déploiement)
export const votingContract = process.env.VITE_VOTING_CONTRACT || '';
export const voterRegistryContract = process.env.VITE_VOTER_REGISTRY_CONTRACT || '';
export const resultsContract = process.env.VITE_RESULTS_CONTRACT || '';

// Temporary ping-pong contract address for template compatibility (will be removed)
export const contractAddress = '';

// API URL pour le backend
export const API_URL = process.env.VITE_API_URL || 'https://api.democratix.app/api';
export const ID_API_URL = 'https://id-api.multiversx.com';
export const USERS_API_URL = '/users/api/v1/users/';

// Domaines authentifiés pour les requêtes API
export const sampleAuthenticatedDomains = [API_URL];

// Environnement MultiversX
export const environment = EnvironmentsEnum.mainnet;

// URLs de l'API MultiversX
export const multiversxApiUrl = 'https://api.multiversx.com';
export const multiversxGatewayUrl = 'https://gateway.multiversx.com';

// Chain ID
export const chainId = '1';

// Explorer URL
export const explorerUrl = 'https://explorer.multiversx.com';
