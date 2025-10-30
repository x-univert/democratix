describe('Home Page & Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Home Page Display', () => {
    it('should display the DEMOCRATIX logo and branding', () => {
      cy.contains('DEMOCRATIX').should('be.visible');
      cy.contains('Decentralized and transparent voting platform').should('be.visible');
    });

    it('should display the main hero section', () => {
      cy.get('[class*="heroSection"]').should('be.visible');
      cy.contains('Décentralisé, Transparent, Anonyme').should('be.visible');
    });

    it('should display call-to-action buttons', () => {
      // Check for main CTA buttons
      cy.contains('Créer une élection').should('be.visible');
      cy.contains('Voir les élections').should('be.visible');
    });

    it('should have a visible header with navigation', () => {
      cy.get('header').should('exist').and('be.visible');
      cy.get('header').within(() => {
        cy.contains('DEMOCRATIX').should('be.visible');
      });
    });

    it('should have a footer', () => {
      cy.get('footer').should('exist').and('be.visible');
    });
  });

  describe('Navigation', () => {
    it('should navigate to Elections page when clicking "Voir les élections"', () => {
      cy.contains('Voir les élections').click();
      cy.url().should('include', '/elections');
      cy.go('back');
    });

    it('should have working header navigation links', () => {
      // Test navigation menu items
      cy.get('header').within(() => {
        // Check if elections link exists and is clickable
        const electionsLink = cy.contains('Élections').should('exist');
        electionsLink.click();
      });
      cy.url().should('include', '/elections');
    });

    it('should redirect to unlock page when trying to create election without wallet', () => {
      cy.contains('Créer une élection').click();
      // Should redirect to connect wallet page
      cy.url().should('match', /\/(unlock|dashboard)/);
    });
  });

  describe('Theme Switcher', () => {
    it('should have theme switcher options', () => {
      cy.get('[class*="heroSectionBottom"]').should('exist');
    });

    it('should toggle between light and dark themes', () => {
      // Get current theme
      cy.get('html').then(($html) => {
        const currentTheme = $html.attr('class') || 'dark';

        // Find and click theme toggle button (adjust selector as needed)
        cy.get('button').contains(/light|dark/i).first().click({ force: true });

        // Verify theme changed
        cy.get('html').should('not.have.class', currentTheme);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on desktop (1920x1080)', () => {
      cy.viewport(1920, 1080);
      cy.visit('/');

      cy.get('[class*="heroSection"]').should('be.visible');
      cy.contains('DEMOCRATIX').should('be.visible');
    });

    it('should display correctly on tablet (768x1024)', () => {
      cy.viewport(768, 1024);
      cy.visit('/');

      cy.get('[class*="heroSection"]').should('be.visible');
      cy.contains('DEMOCRATIX').should('be.visible');
    });

    it('should display correctly on mobile (375x667)', () => {
      cy.viewport(375, 667);
      cy.visit('/');

      cy.get('[class*="heroSection"]').should('be.visible');
      cy.contains('DEMOCRATIX').should('be.visible');
    });
  });

  describe('Wallet Connection', () => {
    it('should display Connect Wallet button when not connected', () => {
      cy.contains('Connect Wallet').should('be.visible');
    });

    it('should have See Documentation link', () => {
      cy.contains('See Documentation').should('be.visible');
    });
  });

  describe('Page Performance', () => {
    it('should load the page within reasonable time', () => {
      const startTime = Date.now();
      cy.visit('/');
      cy.get('[class*="heroSection"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Should load in less than 3 seconds
      });
    });

    it('should not have console errors', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win.console, 'error').as('consoleError');
        }
      });
      cy.get('@consoleError').should('not.be.called');
    });
  });
});
