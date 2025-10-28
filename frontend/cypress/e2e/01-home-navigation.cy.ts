describe('Home & Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the home page', () => {
    cy.contains('DEMOCRATIX').should('be.visible');
    cy.contains('Decentralized and transparent voting platform').should('be.visible');
  });

  it('should have header navigation', () => {
    cy.get('header').should('exist');
    cy.get('header').contains('DEMOCRATIX').should('be.visible');
  });

  it('should have footer', () => {
    cy.get('footer').should('exist');
  });

  it('should have Connect Wallet button', () => {
    cy.contains('Connect Wallet').should('be.visible');
  });

  it('should display See Documentation button', () => {
    cy.contains('See Documentation').should('be.visible');
  });

  it('should have theme switcher', () => {
    // Check if theme options are displayed
    cy.get('[class*="heroSectionBottom"]').should('exist');
  });
});
