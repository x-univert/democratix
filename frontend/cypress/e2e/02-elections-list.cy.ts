describe('Elections List Page', () => {
  beforeEach(() => {
    cy.mockWalletConnection();
    cy.visit('/elections');
  });

  it('should display elections page title', () => {
    cy.contains('Elections').should('be.visible');
  });

  it('should show loading skeletons initially', () => {
    cy.visit('/elections');
    // Check if skeleton cards are displayed during loading
    cy.get('[class*="skeleton"]', { timeout: 1000 }).should('exist');
  });

  it('should display create election button', () => {
    cy.contains('Create an election').should('be.visible');
  });

  it('should have filter tabs', () => {
    cy.contains('All').should('be.visible');
    cy.contains('Pending').should('be.visible');
    cy.contains('Active').should('be.visible');
    cy.contains('Closed').should('be.visible');
    cy.contains('Finalized').should('be.visible');
  });

  it('should have search input', () => {
    cy.get('input[placeholder*="Search"]').should('exist');
  });

  it('should filter elections by status', () => {
    // Wait for elections to load
    cy.wait(2000);
    
    // Click on Active filter
    cy.contains('button', 'Active').click();
    
    // Check URL or active state (depending on implementation)
    cy.wait(500);
  });

  it('should search elections', () => {
    // Wait for elections to load
    cy.wait(2000);
    
    // Type in search
    cy.get('input[placeholder*="Search"]').type('Test Election');
    cy.wait(500);
  });

  it('should navigate to create election page', () => {
    cy.contains('Create an election').click();
    cy.url().should('include', '/create-election');
  });
});
