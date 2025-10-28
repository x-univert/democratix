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
 */
Cypress.Commands.add('mockWalletConnection', () => {
  // Mock MultiversX wallet connection
  cy.window().then((win) => {
    win.localStorage.setItem('isLoggedIn', 'true');
    win.localStorage.setItem('walletConnectDeepLink', 'https://maiar.page.link/');
    // Add mock address
    win.localStorage.setItem('address', 'erd1qqqqqqqqqqqqqpgq...');
  });
});

/**
 * Visit an authenticated page with mocked wallet
 */
Cypress.Commands.add('visitAuthenticated', (url: string) => {
  cy.mockWalletConnection();
  cy.visit(url);
});

// Prevent TypeScript errors
export {};
