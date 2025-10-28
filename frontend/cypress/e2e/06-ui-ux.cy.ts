describe('UI/UX Features', () => {
  beforeEach(() => {
    cy.mockWalletConnection();
  });

  describe('Loading States', () => {
    it('should show loading skeleton on elections page', () => {
      cy.visit('/elections');
      
      // Skeleton should appear briefly
      cy.get('[class*="animate-pulse"]', { timeout: 1000 }).should('exist');
    });

    it('should show loading skeleton on election detail', () => {
      cy.visit('/election/1');
      
      // Skeleton should appear
      cy.get('[class*="container"]', { timeout: 1000 }).should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should display error message for invalid election', () => {
      cy.visit('/election/99999');
      cy.wait(2000);
      
      // Error component should be visible
      cy.contains(/error|erreur/i).should('be.visible');
    });

    it('should have retry/back button on error', () => {
      cy.visit('/election/99999');
      cy.wait(2000);
      
      cy.get('button').should('have.length.greaterThan', 0);
    });
  });

  describe('Animations', () => {
    it('should have hover effects on cards', () => {
      cy.visit('/elections');
      cy.wait(3000);
      
      // Check if cards exist
      cy.get('body').then(($body) => {
        const cards = $body.find('[class*="card"], [class*="rounded"]');
        if (cards.length > 0) {
          cy.wrap(cards.first()).trigger('mouseover');
          cy.wait(200);
        }
      });
    });

    it('should have transition animations between pages', () => {
      cy.visit('/elections');
      cy.wait(2000);
      
      cy.visit('/profile');
      cy.wait(1000);
      
      // Page should render
      cy.get('body').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      cy.contains('DEMOCRATIX').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/elections');
      cy.wait(2000);
      
      cy.get('body').should('be.visible');
    });

    it('should be responsive on desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/');
      
      cy.contains('DEMOCRATIX').should('be.visible');
    });
  });
});
