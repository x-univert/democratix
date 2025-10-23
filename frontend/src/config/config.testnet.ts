import { EnvironmentsEnum } from '@multiversx/sdk-dapp/types';

export * from './sharedConfig';

// Adresses des contrats sur Testnet (à remplir après déploiement)
export const votingContract = process.env.VITE_VOTING_CONTRACT || '';
export const voterRegistryContract = process.env.VITE_VOTER_REGISTRY_CONTRACT || '';
export const resultsContract = process.env.VITE_RESULTS_CONTRACT || '';

// API URL pour le backend
export const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

// Domaines authentifiés pour les requêtes API
export const sampleAuthenticatedDomains = [API_URL];

// Environnement MultiversX
export const environment = EnvironmentsEnum.testnet;

// URLs de l'API MultiversX
export const multiversxApiUrl = 'https://testnet-api.multiversx.com';
export const multiversxGatewayUrl = 'https://testnet-gateway.multiversx.com';

// Chain ID
export const chainId = 'T';

// Explorer URL
export const explorerUrl = 'https://testnet-explorer.multiversx.com';
