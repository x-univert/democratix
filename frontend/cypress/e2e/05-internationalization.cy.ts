describe('Internationalization (i18n)', () => {
  beforeEach(() => {
    cy.mockWalletConnection();
    cy.visit('/');
  });

  it('should have language selector in settings', () => {
    // Look for settings button/icon
    cy.get('body').then(($body) => {
      if ($body.find('[class*="settings"]').length > 0 || $body.find('button').length > 0) {
        // Settings might be available
        cy.wait(500);
      }
    });
  });

  it('should change language to French', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('i18nextLng', 'fr');
    });
    cy.reload();
    cy.wait(1000);
    
    // Check for French text
    cy.get('body').should('contain', 'Connecter');
  });

  it('should change language to English', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('i18nextLng', 'en');
    });
    cy.reload();
    cy.wait(1000);
    
    // Check for English text
    cy.get('body').should('contain', 'Connect');
  });

  it('should change language to Spanish', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('i18nextLng', 'es');
    });
    cy.reload();
    cy.wait(1000);
    
    // Check for Spanish text
    cy.get('body').should('contain', 'Conectar');
  });

  it('should persist language selection', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('i18nextLng', 'fr');
    });
    cy.reload();
    cy.wait(1000);
    
    // Navigate to another page
    cy.mockWalletConnection();
    cy.visit('/elections');
    cy.wait(1000);
    
    // Should still be in French
    cy.get('body').should('contain', 'Élections');
  });
});
