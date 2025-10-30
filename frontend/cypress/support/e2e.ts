// ***********************************************************
// This file is processed and loaded automatically before test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log to reduce noise
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Override cy.visit() to automatically mock wallet connection
// This ensures all page visits have the wallet already connected
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  const opts = options || {};

  // Skip auto-mock if explicitly disabled via env or options
  if (Cypress.env('SKIP_WALLET_MOCK') || opts.skipWalletMock) {
    return originalFn(url, opts);
  }

  // Merge our onBeforeLoad with any existing one
  const originalOnBeforeLoad = opts.onBeforeLoad;

  opts.onBeforeLoad = (win) => {
    // Apply wallet mock
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

    // Call original onBeforeLoad if it exists
    if (originalOnBeforeLoad) {
      originalOnBeforeLoad(win);
    }
  };

  return originalFn(url, opts);
});
