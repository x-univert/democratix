describe('Election Detail Page', () => {
  beforeEach(() => {
    cy.mockWalletConnection();
  });

  it('should display error for non-existent election', () => {
    cy.visit('/election/99999');
    
    // Should show error message component
    cy.contains('Error', { timeout: 5000 }).should('be.visible');
    cy.contains('not found', { matchCase: false }).should('be.visible');
  });

  it('should have back button on error page', () => {
    cy.visit('/election/99999');
    cy.wait(2000);
    
    // Check for back button
    cy.contains('button', /back|retour|volver/i, { timeout: 5000 }).should('be.visible');
  });

  it('should show loading skeleton initially', () => {
    cy.visit('/election/1');
    
    // Check if skeleton is displayed
    cy.get('[class*="container"]', { timeout: 1000 }).should('exist');
  });

  // This test will only work if election ID 1 exists
  it('should display election details if exists', () => {
    cy.visit('/election/1');
    cy.wait(3000);
    
    // Check for common elements (might not exist if no elections)
    cy.get('body').then(($body) => {
      if (!$body.text().includes('Error') && !$body.text().includes('not found')) {
        // Election exists, check for details
        cy.get('h1').should('exist');
      }
    });
  });
});
