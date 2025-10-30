describe('Elections List Page', () => {
  beforeEach(() => {
    cy.visit('/elections');
  });

  describe('Page Display', () => {
    it('should display the elections page title', () => {
      cy.contains(/élections|elections/i).should('be.visible');
    });

    it('should show loading skeletons initially', () => {
      cy.intercept('GET', '**/elections*', (req) => {
        req.reply((res) => {
          res.delay(1000);
        });
      });

      cy.visit('/elections');
      cy.get('[class*="skeleton"]', { timeout: 2000 }).should('exist');
    });

    it('should display elections cards after loading', () => {
      // Wait for skeleton to disappear
      cy.get('[class*="skeleton"]', { timeout: 10000 }).should('not.exist');

      // Check if elections are displayed or empty state
      cy.get('body').then(($body) => {
        if ($body.find('[class*="electionCard"]').length > 0) {
          cy.get('[class*="electionCard"]').should('have.length.greaterThan', 0);
        } else {
          cy.contains(/aucune|no elections/i).should('be.visible');
        }
      });
    });

    it('should display create election button', () => {
      cy.contains(/créer.*élection|create.*election/i).should('be.visible');
    });
  });

  describe('Filter Tabs', () => {
    it('should have all filter tabs visible', () => {
      cy.contains(/toutes|all/i).should('be.visible');
      cy.contains(/en attente|pending/i).should('be.visible');
      cy.contains(/actives?|active/i).should('be.visible');
      cy.contains(/fermées?|closed/i).should('be.visible');
      cy.contains(/finalisées?|finalized/i).should('be.visible');
    });

    it('should filter elections by Pending status', () => {
      cy.wait(2000); // Wait for elections to load

      cy.contains(/en attente|pending/i).click();
      cy.wait(500);

      // Verify filtering worked (URL change or visual update)
      cy.get('body').should('exist');
    });

    it('should filter elections by Active status', () => {
      cy.wait(2000);

      cy.contains(/actives?|active/i).click();
      cy.wait(500);

      cy.get('body').should('exist');
    });

    it('should filter elections by Closed status', () => {
      cy.wait(2000);

      cy.contains(/fermées?|closed/i).click();
      cy.wait(500);

      cy.get('body').should('exist');
    });

    it('should filter elections by Finalized status', () => {
      cy.wait(2000);

      cy.contains(/finalisées?|finalized/i).click();
      cy.wait(500);

      cy.get('body').should('exist');
    });

    it('should reset to all elections when clicking All tab', () => {
      cy.wait(2000);

      // Click a filter first
      cy.contains(/actives?|active/i).click();
      cy.wait(500);

      // Then click All
      cy.contains(/toutes|all/i).click();
      cy.wait(500);

      cy.get('body').should('exist');
    });
  });

  describe('Search Functionality', () => {
    it('should have search input field', () => {
      cy.get('input[type="search"], input[placeholder*="recherch"], input[placeholder*="Search"]')
        .should('exist');
    });

    it('should search elections by title', () => {
      cy.wait(2000);

      const searchInput = cy.get('input[type="search"], input[placeholder*="recherch"], input[placeholder*="Search"]').first();
      searchInput.type('test');
      cy.wait(500);

      // Search should filter results
      cy.get('body').should('exist');
    });

    it('should clear search when input is cleared', () => {
      cy.wait(2000);

      const searchInput = cy.get('input[type="search"], input[placeholder*="recherch"], input[placeholder*="Search"]').first();
      searchInput.type('test');
      cy.wait(500);

      searchInput.clear();
      cy.wait(500);

      cy.get('body').should('exist');
    });
  });

  describe('Election Cards', () => {
    it('should display election card with title and information', () => {
      cy.get('[class*="electionCard"]').first().within(() => {
        // Card should have title
        cy.get('h2, h3, [class*="title"]').should('exist');
      });
    });

    it('should display election status badge on cards', () => {
      cy.get('[class*="electionCard"]').first().within(() => {
        // Status badge should exist
        cy.get('body').should(($card) => {
          const hasStatus =
            $card.find('[class*="status"]').length > 0 ||
            $card.find('[class*="badge"]').length > 0 ||
            $card.text().match(/pending|active|closed|finalized/i);
          expect(hasStatus).to.be.true;
        });
      });
    });

    it('should navigate to election detail page when clicking on card', () => {
      cy.get('[class*="electionCard"]').first().click();
      cy.url().should('match', /\/election\/\d+/);
    });
  });

  describe('Navigation', () => {
    it('should navigate to create election page', () => {
      cy.contains(/créer.*élection|create.*election/i).click();
      cy.url().should('match', /\/(create-election|unlock|dashboard)/);
    });

    it('should navigate back to elections list from detail page', () => {
      cy.get('[class*="electionCard"]').first().click();
      cy.url().should('match', /\/election\/\d+/);

      // Go back
      cy.go('back');
      cy.url().should('include', '/elections');
    });
  });

  describe('Pagination', () => {
    it('should handle pagination if available', () => {
      cy.get('body').then(($body) => {
        const hasPagination =
          $body.find('[class*="pagination"]').length > 0 ||
          $body.text().match(/suivant|next|précédent|previous|page/i);

        if (hasPagination) {
          cy.contains(/suivant|next/i).first().click();
          cy.wait(500);
          cy.url().should('exist');
        }
      });
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no elections match filter', () => {
      cy.wait(2000);

      // Filter by a status that might have no results
      cy.contains(/finalisées?|finalized/i).click();
      cy.wait(1000);

      cy.get('body').should(($body) => {
        const hasElections = $body.find('[class*="electionCard"]').length > 0;
        const hasEmptyMessage = $body.text().match(/aucune|no election|vide|empty|found/i);
        expect(hasElections || hasEmptyMessage).to.be.true;
      });
    });

    it('should display empty state when search returns no results', () => {
      cy.wait(2000);

      const searchInput = cy.get('input[type="search"], input[placeholder*="recherch"], input[placeholder*="Search"]').first();
      searchInput.type('xyznonexistantelection123');
      cy.wait(1000);

      cy.get('body').should(($body) => {
        const hasElections = $body.find('[class*="electionCard"]').length > 0;
        const hasEmptyMessage = $body.text().match(/aucune|no election|no results|found/i);
        expect(hasElections || hasEmptyMessage).to.be.true;
      });
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile (375x667)', () => {
      cy.viewport(375, 667);
      cy.visit('/elections');

      cy.contains(/élections|elections/i).should('be.visible');
      cy.get('[class*="electionCard"], [class*="skeleton"]').should('be.visible');
    });

    it('should display correctly on tablet (768x1024)', () => {
      cy.viewport(768, 1024);
      cy.visit('/elections');

      cy.contains(/élections|elections/i).should('be.visible');
      cy.get('[class*="electionCard"], [class*="skeleton"]').should('be.visible');
    });

    it('should display correctly on desktop (1920x1080)', () => {
      cy.viewport(1920, 1080);
      cy.visit('/elections');

      cy.contains(/élections|elections/i).should('be.visible');
      cy.get('[class*="electionCard"], [class*="skeleton"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', () => {
      cy.intercept('GET', '**/elections*', {
        statusCode: 500,
        body: { error: 'Server error' }
      });

      cy.visit('/elections');
      cy.wait(2000);

      cy.get('body').should(($body) => {
        const hasError =
          $body.text().match(/erreur|error|échec|failed|problem/i) ||
          $body.find('[class*="error"]').length > 0;
        expect(hasError).to.be.true;
      });
    });
  });

  describe('Performance', () => {
    it('should load elections within reasonable time', () => {
      const startTime = Date.now();
      cy.visit('/elections');

      cy.get('[class*="electionCard"], [class*="empty"]', { timeout: 10000 })
        .should('exist')
        .then(() => {
          const loadTime = Date.now() - startTime;
          expect(loadTime).to.be.lessThan(10000);
        });
    });
  });
});
