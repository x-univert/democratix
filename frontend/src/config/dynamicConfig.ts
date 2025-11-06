/**
 * Dynamic Network Configuration Loader
 * Loads the appropriate configuration based on the selected network in localStorage
 */

import { EnvironmentsEnum } from '@multiversx/sdk-dapp';

// Import all network configurations
import * as devnetConfig from './config.devnet';
import * as testnetConfig from './config.testnet';
import * as mainnetConfig from './config.mainnet';

export type NetworkConfig = {
  votingContract: string;
  voterRegistryContract: string;
  resultsContract: string;
  contractAddress: string;
  API_URL: string;
  sampleAuthenticatedDomains: string[];
  environment: EnvironmentsEnum;
  multiversxApiUrl: string;
  multiversxGatewayUrl: string;
  chainId: string;
  explorerUrl: string;
};

/**
 * Get the current network from localStorage
 * Defaults to 'devnet' if not set
 */
export const getCurrentNetwork = (): 'devnet' | 'testnet' | 'mainnet' => {
  const savedNetwork = localStorage.getItem('selectedNetwork');

  switch (savedNetwork) {
    case 'testnet':
    case 'mainnet':
      return savedNetwork;
    case 'devnet':
    default:
      return 'devnet';
  }
};

/**
 * Load configuration for the specified network
 */
export const loadNetworkConfig = (network: 'devnet' | 'testnet' | 'mainnet'): NetworkConfig => {
  switch (network) {
    case 'testnet':
      return {
        votingContract: testnetConfig.votingContract,
        voterRegistryContract: testnetConfig.voterRegistryContract,
        resultsContract: testnetConfig.resultsContract,
        contractAddress: testnetConfig.contractAddress || '',
        API_URL: testnetConfig.API_URL,
        sampleAuthenticatedDomains: testnetConfig.sampleAuthenticatedDomains,
        environment: testnetConfig.environment,
        multiversxApiUrl: testnetConfig.multiversxApiUrl,
        multiversxGatewayUrl: testnetConfig.multiversxGatewayUrl,
        chainId: testnetConfig.chainId,
        explorerUrl: testnetConfig.explorerUrl,
      };
    case 'mainnet':
      return {
        votingContract: mainnetConfig.votingContract,
        voterRegistryContract: mainnetConfig.voterRegistryContract,
        resultsContract: mainnetConfig.resultsContract,
        contractAddress: mainnetConfig.contractAddress,
        API_URL: mainnetConfig.API_URL,
        sampleAuthenticatedDomains: mainnetConfig.sampleAuthenticatedDomains,
        environment: mainnetConfig.environment,
        multiversxApiUrl: mainnetConfig.multiversxApiUrl,
        multiversxGatewayUrl: mainnetConfig.multiversxGatewayUrl,
        chainId: mainnetConfig.chainId,
        explorerUrl: mainnetConfig.explorerUrl,
      };
    case 'devnet':
    default:
      return {
        votingContract: devnetConfig.votingContract,
        voterRegistryContract: devnetConfig.voterRegistryContract,
        resultsContract: devnetConfig.resultsContract,
        contractAddress: devnetConfig.contractAddress,
        API_URL: devnetConfig.API_URL,
        sampleAuthenticatedDomains: devnetConfig.sampleAuthenticatedDomains,
        environment: devnetConfig.environment,
        multiversxApiUrl: devnetConfig.multiversxApiUrl,
        multiversxGatewayUrl: devnetConfig.multiversxGatewayUrl,
        chainId: devnetConfig.chainId,
        explorerUrl: devnetConfig.explorerUrl,
      };
  }
};

/**
 * Get the active network configuration
 */
export const getActiveConfig = (): NetworkConfig => {
  const currentNetwork = getCurrentNetwork();
  return loadNetworkConfig(currentNetwork);
};

// Export the active configuration as default
const activeConfig = getActiveConfig();

export const {
  votingContract,
  voterRegistryContract,
  resultsContract,
  contractAddress,
  API_URL,
  sampleAuthenticatedDomains,
  environment,
  multiversxApiUrl,
  multiversxGatewayUrl,
  chainId,
  explorerUrl,
} = activeConfig;
