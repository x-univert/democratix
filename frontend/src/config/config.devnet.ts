import { EnvironmentsEnum } from '@multiversx/sdk-dapp';

export * from './sharedConfig';

// Adresses des contrats sur Devnet - DEMOCRATIX V2.0 (09 Janvier 2025)
// Tous les contrats ont été déployés avec WSL2 + sc-meta 0.62.0 et fonctionnalité #[upgrade]

// === Contrats V1.0 (Système d'élections) ===
export const votingContract = process.env.VITE_VOTING_CONTRACT || 'erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl';
export const voterRegistryContract = process.env.VITE_VOTER_REGISTRY_CONTRACT || 'erd1qqqqqqqqqqqqqpgq4w3pgv6aehw3ptxy025m50rtx5yxaeaud3qq342g3y';
export const resultsContract = process.env.VITE_RESULTS_CONTRACT || 'erd1qqqqqqqqqqqqqpgqsmzyflvv8u2yx2xhtq5cv2746j4k6damd3qqqhtzxz';

// === Contrats V2.0 (Participation citoyenne) ===
export const ricContract = process.env.VITE_RIC_CONTRACT || 'erd1qqqqqqqqqqqqqpgq3lqwu9v2r0u04dy876rp9r8n7cgmsgfkd3qq6qzpq8';
export const petitionContract = process.env.VITE_PETITION_CONTRACT || 'erd1qqqqqqqqqqqqqpgqrgwyu0vgmnel0zw9caecxgw4d90yt64jd3qqu53hnz';
export const institutionRegistryContract = process.env.VITE_INSTITUTION_REGISTRY_CONTRACT || 'erd1qqqqqqqqqqqqqpgqfes5tqx9pc99n8zaddzvamfq7e5zmk6zd3qqu7kvxg';
export const pollContract = process.env.VITE_POLL_CONTRACT || 'erd1qqqqqqqqqqqqqpgqzkalzj54qjdd547yphz6tkzjky55qnmad3qq8zmk57';

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
