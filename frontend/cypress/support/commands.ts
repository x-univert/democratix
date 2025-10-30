/// <reference types="cypress" />

// ***********************************************
// Custom commands for DEMOCRATIX E2E tests
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to mock wallet connection
       * @example cy.mockWalletConnection()
       */
      mockWalletConnection(): Chainable<void>;
      
      /**
       * Custom command to visit authenticated page
       * @example cy.visitAuthenticated('/elections')
       */
      visitAuthenticated(url: string): Chainable<void>;
    }
  }
}

/**
 * Mock wallet connection by setting localStorage items
 * This mocks the MultiversX SDK dapp authentication state
 */
Cypress.Commands.add('mockWalletConnection', () => {
  const mockAddress = 'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx';
  const mockLoginInfo = {
    isLoggedIn: true,
    loginMethod: 'wallet',
    walletConnectV2: false,
    tokenLogin: {
      nativeAuthToken: '',
      nativeAuthTokenExpiry: 0
    }
  };

  const mockAccount = {
    address: mockAddress,
    balance: '100000000000000000000', // 100 EGLD
    nonce: 1
  };

  // Mock MultiversX wallet connection
  cy.window().then((win) => {
    // Core authentication state
    win.localStorage.setItem('loginInfo', JSON.stringify(mockLoginInfo));
    win.localStorage.setItem('account', JSON.stringify(mockAccount));
    win.localStorage.setItem('address', mockAddress);
    win.localStorage.setItem('isLoggedIn', 'true');

    // Wallet provider details
    win.localStorage.setItem('walletConnectDeepLink', 'https://maiar.page.link/');
    win.localStorage.setItem('loginMethod', 'wallet');

    // Network configuration (devnet)
    win.localStorage.setItem('networkConfig', JSON.stringify({
      id: 'devnet',
      name: 'Devnet',
      egldLabel: 'xEGLD',
      walletAddress: 'https://devnet-wallet.multiversx.com',
      apiAddress: 'https://devnet-api.multiversx.com',
      gatewayAddress: 'https://devnet-gateway.multiversx.com',
      explorerAddress: 'https://devnet-explorer.multiversx.com'
    }));

    console.log('✅ Wallet connection mocked for Cypress E2E tests');
  });
});

/**
 * Visit an authenticated page with mocked wallet
 * This sets up localStorage before visiting the page
 */
Cypress.Commands.add('visitAuthenticated', (url: string) => {
  // Set up localStorage before navigating
  cy.visit(url, {
    onBeforeLoad: (win) => {
      const mockAddress = 'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx';
      const mockLoginInfo = {
        isLoggedIn: true,
        loginMethod: 'wallet',
        walletConnectV2: false,
        tokenLogin: {
          nativeAuthToken: '',
          nativeAuthTokenExpiry: 0
        }
      };

      const mockAccount = {
        address: mockAddress,
        balance: '100000000000000000000',
        nonce: 1
      };

      // Set all authentication state before page loads
      win.localStorage.setItem('loginInfo', JSON.stringify(mockLoginInfo));
      win.localStorage.setItem('account', JSON.stringify(mockAccount));
      win.localStorage.setItem('address', mockAddress);
      win.localStorage.setItem('isLoggedIn', 'true');
      win.localStorage.setItem('walletConnectDeepLink', 'https://maiar.page.link/');
      win.localStorage.setItem('loginMethod', 'wallet');
      win.localStorage.setItem('networkConfig', JSON.stringify({
        id: 'devnet',
        name: 'Devnet',
        egldLabel: 'xEGLD',
        walletAddress: 'https://devnet-wallet.multiversx.com',
        apiAddress: 'https://devnet-api.multiversx.com',
        gatewayAddress: 'https://devnet-gateway.multiversx.com',
        explorerAddress: 'https://devnet-explorer.multiversx.com'
      }));
    }
  });
});

// Prevent TypeScript errors
export {};
