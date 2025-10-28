describe('Profile & Admin Pages', () => {
  beforeEach(() => {
    cy.mockWalletConnection();
  });

  describe('Profile Page', () => {
    it('should display profile page', () => {
      cy.visit('/profile');
      cy.contains(/my profile|mon profil|mi perfil/i, { timeout: 5000 }).should('be.visible');
    });

    it('should show wallet address', () => {
      cy.visit('/profile');
      cy.wait(2000);
      
      // Check for address display
      cy.get('body').should('contain', 'erd1');
    });

    it('should display voting statistics', () => {
      cy.visit('/profile');
      cy.wait(2000);
      
      // Check for stats cards
      cy.get('[class*="grid"]').should('exist');
    });

    it('should show voting history section', () => {
      cy.visit('/profile');
      cy.wait(2000);
      
      cy.contains(/participation history|historique|historial/i).should('be.visible');
    });
  });

  describe('Admin Dashboard', () => {
    it('should display admin dashboard', () => {
      cy.visit('/admin');
      cy.contains(/admin|dashboard/i, { timeout: 5000 }).should('be.visible');
    });

    it('should show global statistics', () => {
      cy.visit('/admin');
      cy.wait(2000);
      
      cy.contains(/global statistics|statistiques globales|estadísticas globales/i).should('be.visible');
    });

    it('should have quick actions', () => {
      cy.visit('/admin');
      cy.wait(2000);
      
      cy.contains(/quick actions|actions rapides|acciones rápidas/i).should('be.visible');
    });
  });
});
