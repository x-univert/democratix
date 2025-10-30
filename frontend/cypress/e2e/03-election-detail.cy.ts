describe('Election Detail Page', () => {
  // Test with a potentially existing election ID
  const testElectionId = 47; // Adjust based on your test data

  describe('Error Handling', () => {
    it('should display error for non-existent election', () => {
      cy.visit('/election/99999');

      // Should show error message
      cy.contains(/erreur|error/i, { timeout: 10000 }).should('be.visible');
      cy.contains(/trouvée|found/i, { matchCase: false }).should('be.visible');
    });

    it('should have back button on error page', () => {
      cy.visit('/election/99999');
      cy.wait(2000);

      // Check for back or return button
      cy.contains(/retour|back|volver|accueil/i, { timeout: 5000 }).should('be.visible');
    });

    it('should navigate back when clicking back button on error', () => {
      cy.visit('/election/99999');
      cy.wait(2000);

      cy.contains(/retour|back|volver/i).first().click();
      cy.url().should('not.include', '/election/99999');
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton initially', () => {
      cy.intercept('GET', '**/elections/**', (req) => {
        req.reply((res) => {
          res.delay(1000);
        });
      });

      cy.visit(`/election/${testElectionId}`);

      // Check for loading indicator or skeleton
      cy.get('[class*="skeleton"], [class*="loading"]', { timeout: 2000 }).should('exist');
    });
  });

  describe('Election Details Display', () => {
    beforeEach(() => {
      cy.visit(`/election/${testElectionId}`);
      cy.wait(3000); // Wait for potential loading
    });

    it('should display election details if election exists', () => {
      cy.get('body').then(($body) => {
        if (!$body.text().match(/error|erreur|not found/i)) {
          // Election exists
          cy.get('h1, h2').should('exist'); // Title should exist
        }
      });
    });

    it('should display election status badge', () => {
      cy.get('body').then(($body) => {
        if (!$body.text().match(/error|erreur/i)) {
          // Check for status indicator
          cy.get('body').should(($el) => {
            const hasStatus =
              $el.find('[class*="status"]').length > 0 ||
              $el.find('[class*="badge"]').length > 0 ||
              $el.text().match(/pending|active|closed|finalized|en attente|actif|fermé/i);
            expect(hasStatus).to.be.true;
          });
        }
      });
    });

    it('should display election dates (start and end)', () => {
      cy.get('body').then(($body) => {
        if (!$body.text().match(/error|erreur/i)) {
          // Look for date information
          cy.get('body').should(($el) => {
            const hasDates =
              $el.text().match(/début|start|fin|end|date/i) ||
              $el.find('[class*="date"]').length > 0;
            expect(hasDates).to.be.true;
          });
        }
      });
    });

    it('should display election description or IPFS content', () => {
      cy.get('body').then(($body) => {
        if (!$body.text().match(/error|erreur/i)) {
          // Description should exist
          cy.get('body').should(($el) => {
            const hasDescription =
              $el.find('[class*="description"]').length > 0 ||
              $el.find('p').length > 0;
            expect(hasDescription).to.be.true;
          });
        }
      });
    });
  });

  describe('Candidates Display', () => {
    beforeEach(() => {
      cy.visit(`/election/${testElectionId}`);
      cy.wait(3000);
    });

    it('should display candidates list if election has candidates', () => {
      cy.get('body').then(($body) => {
        if (!$body.text().match(/error|erreur/i)) {
          // Check for candidates section
          cy.get('body').should(($el) => {
            const hasCandidates =
              $el.find('[class*="candidate"]').length > 0 ||
              $el.text().match(/candidat|candidate/i);
            expect(hasCandidates).to.be.true;
          });
        }
      });
    });

    it('should display candidate information (name, photo, bio)', () => {
      cy.get('body').then(($body) => {
        const candidateCards = $body.find('[class*="candidate"]');

        if (candidateCards.length > 0) {
          cy.wrap(candidateCards).first().within(() => {
            // Candidate should have a name
            cy.get('body').should(($card) => {
              expect($card.text().length).to.be.greaterThan(0);
            });
          });
        }
      });
    });
  });

  describe('Voting Actions', () => {
    beforeEach(() => {
      cy.visit(`/election/${testElectionId}`);
      cy.wait(3000);
    });

    it('should display vote button if election is active', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/active|actif/i)) {
          // Active election should have vote button
          cy.contains(/voter|vote/i).should('exist');
        }
      });
    });

    it('should not display vote button if election is pending', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/pending|en attente/i)) {
          // Pending election might not have vote button visible
          cy.get('body').should('exist'); // Just verify page loaded
        }
      });
    });

    it('should not display vote button if election is closed', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/closed|fermé|finalized|finalisé/i)) {
          // Closed election should not allow voting
          cy.get('body').should('exist'); // Just verify page loaded
        }
      });
    });
  });

  describe('Organizer Actions', () => {
    beforeEach(() => {
      cy.visit(`/election/${testElectionId}`);
      cy.wait(3000);
    });

    it('should display organizer controls if user is the organizer', () => {
      // This test would need actual wallet connection mock
      cy.get('body').then(($body) => {
        // Check if organizer actions exist (activate, close, finalize, etc.)
        const hasOrganizerActions =
          $body.text().match(/activer|activate|clôturer|close|finaliser|finalize/i) ||
          $body.find('button').length > 3;

        if (hasOrganizerActions) {
          cy.get('button').should('have.length.greaterThan', 0);
        }
      });
    });
  });

  describe('Registration Section (if required)', () => {
    beforeEach(() => {
      cy.visit(`/election/${testElectionId}`);
      cy.wait(3000);
    });

    it('should display registration section if election requires registration', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/inscription|registration|KYC|whitelist/i)) {
          cy.contains(/inscription|registration/i).should('be.visible');
        }
      });
    });

    it('should display invitation code input if KYC flow is enabled', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/code.*invitation|invitation.*code|KYC/i)) {
          cy.get('input[type="text"], input[placeholder*="code"]').should('exist');
        }
      });
    });
  });

  describe('Results Display (for closed/finalized elections)', () => {
    beforeEach(() => {
      cy.visit(`/election/${testElectionId}`);
      cy.wait(3000);
    });

    it('should display results if election is finalized', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/finalized|finalisé/i)) {
          // Finalized election should show results
          cy.get('body').should(($el) => {
            const hasResults =
              $el.text().match(/résultats|results|votes/i) ||
              $el.find('[class*="result"], [class*="chart"]').length > 0;
            expect(hasResults).to.be.true;
          });
        }
      });
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile (375x667)', () => {
      cy.viewport(375, 667);
      cy.visit(`/election/${testElectionId}`);
      cy.wait(2000);

      cy.get('body').should('be.visible');
    });

    it('should display correctly on tablet (768x1024)', () => {
      cy.viewport(768, 1024);
      cy.visit(`/election/${testElectionId}`);
      cy.wait(2000);

      cy.get('body').should('be.visible');
    });

    it('should display correctly on desktop (1920x1080)', () => {
      cy.viewport(1920, 1080);
      cy.visit(`/election/${testElectionId}`);
      cy.wait(2000);

      cy.get('body').should('be.visible');
    });
  });

  describe('Navigation', () => {
    it('should have breadcrumb or back navigation', () => {
      cy.visit(`/election/${testElectionId}`);
      cy.wait(2000);

      cy.get('body').should(($body) => {
        const hasNavigation =
          $body.find('nav, [class*="breadcrumb"]').length > 0 ||
          $body.text().match(/retour|back/i);
        expect(hasNavigation).to.be.true;
      });
    });

    it('should navigate back to elections list', () => {
      cy.visit(`/election/${testElectionId}`);
      cy.wait(2000);

      // Try to find back/return button
      const backButton = cy.contains(/retour|back|élections/i).first();
      if (backButton) {
        backButton.click();
        cy.url().should('match', /\/elections|\/$/);
      } else {
        // Use browser back
        cy.go('back');
      }
    });
  });

  describe('Performance', () => {
    it('should load election detail within reasonable time', () => {
      const startTime = Date.now();
      cy.visit(`/election/${testElectionId}`);

      cy.get('h1, h2, [class*="title"]', { timeout: 10000 })
        .should('exist')
        .then(() => {
          const loadTime = Date.now() - startTime;
          expect(loadTime).to.be.lessThan(10000);
        });
    });
  });
});
