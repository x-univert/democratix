import { EnvironmentsEnum } from '@multiversx/sdk-dapp';

export * from './sharedConfig';

// Adresses des contrats sur Devnet (Déployés le 26 Octobre 2025 - Recompilés avec WSL2 + sc-meta 0.62)
// V4: Fix compilation error get_candidate_votes + unused variable warning ✅
export const votingContract = process.env.VITE_VOTING_CONTRACT || 'erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl';
export const voterRegistryContract = process.env.VITE_VOTER_REGISTRY_CONTRACT || 'erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu';
export const resultsContract = process.env.VITE_RESULTS_CONTRACT || 'erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr';

// Temporary ping-pong contract address for template compatibility (will be removed)
export const contractAddress = 'erd1qqqqqqqqqqqqqpgqm6ad6xrsjvxlcdcffqe8w58trpec09ug9l5qde96pq';

// API URL pour le backend
// Utiliser l'API du template MultiversX pour les tests PingPong
export const API_URL = process.env.VITE_API_URL || 'https://devnet-template-api.multiversx.com';

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
export const GITHUB_REPO_URL = 'https://github.com/x-univert/DEMOCRATIX';
