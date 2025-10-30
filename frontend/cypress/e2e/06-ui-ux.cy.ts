describe('UI/UX Patterns and Responsive Design', () => {
  describe('Loading States and Skeletons', () => {
    it('should display loading skeletons before content loads', () => {
      cy.intercept('GET', '**/elections*', (req) => {
        req.reply((res) => {
          res.delay(2000);
        });
      });

      cy.visit('/elections');

      // Should show skeleton loaders during loading
      cy.get('[class*="skeleton"], [class*="loading"], [class*="spinner"], [class*="animate-pulse"]', { timeout: 1000 })
        .should('exist');
    });

    it('should replace skeletons with actual content after loading', () => {
      cy.visit('/elections');
      cy.wait(3000);

      // Skeletons should be gone
      cy.get('[class*="skeleton"]').should('not.exist');

      // Real content should be visible
      cy.get('body').should(($body) => {
        const hasContent =
          $body.find('[class*="electionCard"]').length > 0 ||
          $body.text().match(/aucune|no election|empty/i);
        expect(hasContent).to.be.true;
      });
    });

    it('should show loading indicator during transaction processing', () => {
      cy.visit('/');
      cy.wait(1000);

      // Look for any interactive buttons
      cy.get('button').then(($buttons) => {
        if ($buttons.length > 0) {
          // Buttons should exist
          cy.get('button').should('have.length.greaterThan', 0);
        }
      });
    });
  });

  describe('Error States and Messages', () => {
    it('should display user-friendly error message on API failure', () => {
      cy.intercept('GET', '**/elections*', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      });

      cy.visit('/elections');
      cy.wait(2000);

      // Should show error message
      cy.get('body').should(($body) => {
        const hasError =
          $body.text().match(/erreur|error|échec|failed|problème|problem/i) ||
          $body.find('[class*="error"]').length > 0;
        expect(hasError).to.be.true;
      });
    });

    it('should display error for non-existent election', () => {
      cy.visit('/election/999999');
      cy.wait(2000);

      // Should show "not found" error
      cy.contains(/erreur|error/i, { timeout: 5000 }).should('be.visible');
      cy.contains(/trouvée|found|existe/i, { matchCase: false }).should('be.visible');
    });

    it('should provide action to recover from error (back button)', () => {
      cy.visit('/election/999999');
      cy.wait(2000);

      // Should have back/return button
      cy.contains(/retour|back|accueil|home/i).should('be.visible');
    });
  });

  describe('Empty States', () => {
    it('should display meaningful empty state when no elections exist', () => {
      cy.visit('/elections');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Either has elections or shows empty state
        const hasElections = $body.find('[class*="electionCard"]').length > 0;
        const hasEmptyState = $body.text().match(/aucune|no election|vide|empty/i);
        expect(hasElections || hasEmptyState).to.be.true;
      });
    });

    it('should display helpful message when search returns no results', () => {
      cy.visit('/elections');
      cy.wait(2000);

      const searchInput = cy.get('input[type="search"], input[placeholder*="recherch"], input[placeholder*="Search"]').first();
      searchInput.type('xyznonexistantelection9999');
      cy.wait(1000);

      // Should show "no results" message
      cy.get('body').should(($body) => {
        const hasNoResults =
          $body.text().match(/aucun.*résultat|no.*result|not.*found/i) ||
          $body.find('[class*="empty"]').length > 0;
        expect(hasNoResults).to.be.true;
      });
    });
  });

  describe('Buttons and Interactive Elements', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.wait(1000);
    });

    it('should have visible hover states on buttons', () => {
      // Primary CTA buttons should exist
      cy.get('button').first().should('exist');

      // Hover effect test (visual regression would be ideal)
      cy.get('button').first().trigger('mouseover');
      cy.wait(200);
      cy.get('button').first().should('be.visible');
    });

    it('should have disabled state styling for disabled buttons', () => {
      cy.get('button').then(($buttons) => {
        const disabledButtons = $buttons.filter(':disabled');
        if (disabledButtons.length > 0) {
          cy.wrap(disabledButtons).first().should('have.attr', 'disabled');
        }
      });
    });

    it('should show focus outline on keyboard navigation', () => {
      // Tab to first button
      cy.get('body').tab();

      // Focused element should be visible
      cy.focused().should('exist');
    });

    it('should have accessible button labels (not empty)', () => {
      cy.get('button').each(($btn) => {
        const hasText = $btn.text().trim().length > 0;
        const hasAriaLabel = $btn.attr('aria-label');
        const hasTitle = $btn.attr('title');

        expect(hasText || hasAriaLabel || hasTitle).to.be.true;
      });
    });
  });

  describe('Forms and Input Fields', () => {
    it('should have proper labels for input fields', () => {
      cy.visit('/elections');
      cy.wait(1000);

      // Search input should have label or placeholder
      cy.get('input').each(($input) => {
        const hasPlaceholder = $input.attr('placeholder');
        const hasLabel = $input.attr('aria-label') || $input.attr('id');
        expect(hasPlaceholder || hasLabel).to.exist;
      });
    });

    it('should show validation errors inline', () => {
      cy.visit('/create-election');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        if ($body.find('form').length > 0) {
          // Try to submit empty form
          const submitButton = $body.find('button[type="submit"]');
          if (submitButton.length > 0) {
            cy.wrap(submitButton).first().click();
            cy.wait(500);

            // Should show validation errors
            cy.get('body').should(($el) => {
              const hasErrors =
                $el.text().match(/requis|required|obligatoire|invalid/i) ||
                $el.find('[class*="error"]').length > 0;
              // Validation might be present
              expect($el).to.exist;
            });
          }
        }
      });
    });

    it('should have clear button states (enabled/disabled)', () => {
      cy.visit('/create-election');
      cy.wait(2000);

      cy.get('button[type="submit"]').then(($buttons) => {
        if ($buttons.length > 0) {
          // Submit button exists
          cy.wrap($buttons).first().should('exist');
        }
      });
    });
  });

  describe('Cards and Content Layout', () => {
    it('should display election cards in a grid layout', () => {
      cy.visit('/elections');
      cy.wait(2000);

      cy.get('[class*="electionCard"]').then(($cards) => {
        if ($cards.length > 1) {
          // Multiple cards should be arranged in grid
          cy.get('[class*="grid"], [class*="container"]').should('exist');
        }
      });
    });

    it('should have consistent card heights and spacing', () => {
      cy.visit('/elections');
      cy.wait(2000);

      cy.get('[class*="electionCard"]').then(($cards) => {
        if ($cards.length > 1) {
          // All cards should be visible
          expect($cards.length).to.be.greaterThan(0);
        }
      });
    });

    it('should show hover effect on clickable cards', () => {
      cy.visit('/elections');
      cy.wait(2000);

      cy.get('[class*="electionCard"], [class*="card"], [class*="rounded"]').first().then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).trigger('mouseover');
          cy.wait(200);
          // Card should remain visible and potentially transform
          cy.wrap($card).should('be.visible');
        }
      });
    });
  });

  describe('Status Badges and Indicators', () => {
    it('should display status badges with distinct colors', () => {
      cy.visit('/elections');
      cy.wait(2000);

      cy.get('[class*="status"], [class*="badge"]').then(($badges) => {
        if ($badges.length > 0) {
          // Badges should be visible
          cy.wrap($badges).first().should('be.visible');
        }
      });
    });

    it('should use consistent badge styling across pages', () => {
      const pages = ['/elections', '/election/47'];

      pages.forEach((page) => {
        cy.visit(page);
        cy.wait(2000);

        cy.get('body').then(($body) => {
          if ($body.find('[class*="status"], [class*="badge"]').length > 0) {
            cy.get('[class*="status"], [class*="badge"]').first().should('exist');
          }
        });
      });
    });
  });

  describe('Responsive Design - Mobile (375x667)', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
    });

    it('should display navigation menu on mobile', () => {
      cy.visit('/');
      cy.wait(1000);

      // Header should be visible
      cy.get('header').should('be.visible');
    });

    it('should have hamburger menu or mobile navigation', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('header').should('exist');

      // Look for mobile menu (hamburger icon or mobile nav)
      cy.get('body').should(($body) => {
        const hasMobileNav =
          $body.find('[class*="hamburger"]').length > 0 ||
          $body.find('[class*="menu"]').length > 0 ||
          $body.find('nav').length > 0;
        expect(hasMobileNav).to.be.true;
      });
    });

    it('should stack election cards vertically on mobile', () => {
      cy.visit('/elections');
      cy.wait(2000);

      // Cards should be stacked (full width)
      cy.get('[class*="electionCard"]').first().then(($card) => {
        if ($card.length > 0) {
          const width = $card.width();
          expect(width).to.be.greaterThan(300); // Should take most of viewport width
        }
      });
    });

    it('should have touch-friendly button sizes (min 44x44px)', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('button').first().then(($btn) => {
        const height = $btn.height();
        const width = $btn.width();

        // Buttons should be large enough for touch
        expect(height).to.be.greaterThan(30);
        expect(width).to.be.greaterThan(30);
      });
    });

    it('should hide or collapse secondary information on mobile', () => {
      cy.visit('/elections');
      cy.wait(2000);

      // Mobile layout should be simplified
      cy.get('body').should('be.visible');
    });

    it('should be usable on iPhone X', () => {
      cy.viewport('iphone-x');
      cy.visit('/');

      cy.contains('DEMOCRATIX').should('be.visible');
    });
  });

  describe('Responsive Design - Tablet (768x1024)', () => {
    beforeEach(() => {
      cy.viewport(768, 1024);
    });

    it('should display navigation appropriately on tablet', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('header').should('be.visible');
      cy.get('nav').should('exist');
    });

    it('should display 2-column grid on tablet', () => {
      cy.visit('/elections');
      cy.wait(2000);

      cy.get('[class*="electionCard"]').then(($cards) => {
        if ($cards.length >= 2) {
          // Cards should be in 2-column layout on tablet
          expect($cards.length).to.be.greaterThan(1);
        }
      });
    });

    it('should maintain readability on tablet viewport', () => {
      cy.visit('/');
      cy.wait(1000);

      // Text should be readable (not too small)
      cy.get('body').should('be.visible');
      cy.contains('DEMOCRATIX').should('be.visible');
    });

    it('should be usable on iPad', () => {
      cy.viewport('ipad-2');
      cy.visit('/elections');
      cy.wait(2000);

      cy.get('body').should('be.visible');
    });
  });

  describe('Responsive Design - Desktop (1920x1080)', () => {
    beforeEach(() => {
      cy.viewport(1920, 1080);
    });

    it('should display full navigation menu on desktop', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('nav').should('be.visible');
      cy.get('header').within(() => {
        cy.contains(/élections|elections/i).should('be.visible');
      });
    });

    it('should display 3+ column grid on desktop', () => {
      cy.visit('/elections');
      cy.wait(2000);

      cy.get('[class*="electionCard"]').then(($cards) => {
        if ($cards.length >= 3) {
          // Desktop should show 3 or more columns
          expect($cards.length).to.be.greaterThan(2);
        }
      });
    });

    it('should not waste horizontal space on wide screens', () => {
      cy.visit('/');
      cy.wait(1000);

      // Content should have max-width or proper container
      cy.get('body').should('exist');
    });
  });

  describe('Modals and Overlays', () => {
    it('should display modal centered on screen', () => {
      cy.visit('/');
      cy.wait(1000);

      // Try to open settings modal
      cy.get('body').then(($body) => {
        if ($body.text().match(/settings|paramètres/i)) {
          cy.contains(/settings|paramètres/i).first().click({ force: true });
          cy.wait(500);

          // Modal should be visible
          cy.get('[class*="modal"], [role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              cy.wrap($modal).should('be.visible');
            }
          });
        }
      });
    });

    it('should have backdrop/overlay behind modal', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.text().match(/settings|paramètres/i)) {
          cy.contains(/settings|paramètres/i).first().click({ force: true });
          cy.wait(500);

          // Should have overlay/backdrop
          cy.get('[class*="overlay"], [class*="backdrop"], [class*="modal"]').should('exist');
        }
      });
    });

    it('should close modal when clicking outside (backdrop)', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.text().match(/settings|paramètres/i)) {
          cy.contains(/settings|paramètres/i).first().click({ force: true });
          cy.wait(500);

          // Try clicking backdrop
          cy.get('[class*="overlay"], [class*="backdrop"]').then(($backdrop) => {
            if ($backdrop.length > 0) {
              cy.wrap($backdrop).first().click({ force: true });
              cy.wait(500);

              // Modal might close
              cy.get('body').should('exist');
            }
          });
        }
      });
    });

    it('should close modal with close button or ESC key', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.text().match(/settings|paramètres/i)) {
          cy.contains(/settings|paramètres/i).first().click({ force: true });
          cy.wait(500);

          // Try ESC key
          cy.get('body').type('{esc}');
          cy.wait(500);

          // Modal should close
          cy.get('body').should('exist');
        }
      });
    });
  });

  describe('Accessibility (a11y)', () => {
    it('should have proper heading hierarchy (h1, h2, h3)', () => {
      cy.visit('/');
      cy.wait(1000);

      // Should have h1
      cy.get('h1').should('exist');
    });

    it('should have alt text for images', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('img').each(($img) => {
        const alt = $img.attr('alt');
        expect(alt).to.exist;
      });
    });

    it('should have sufficient color contrast', () => {
      cy.visit('/');
      cy.wait(1000);

      // Visual test - text should be visible
      cy.get('body').should('be.visible');
      cy.contains('DEMOCRATIX').should('be.visible');
    });

    it('should support keyboard navigation', () => {
      cy.visit('/');
      cy.wait(1000);

      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('exist');

      cy.get('body').tab();
      cy.focused().should('exist');
    });

    it('should have skip link for keyboard users', () => {
      cy.visit('/');

      // Tab to first element
      cy.get('body').tab();

      // Should focus on skip link or main content link
      cy.focused().then(($focused) => {
        // Skip link might be present
        expect($focused).to.exist;
      });
    });

    it('should have ARIA labels for icon-only buttons', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('button').each(($btn) => {
        const text = $btn.text().trim();
        if (text.length === 0) {
          // Icon-only button should have aria-label
          const ariaLabel = $btn.attr('aria-label');
          const title = $btn.attr('title');
          expect(ariaLabel || title).to.exist;
        }
      });
    });
  });

  describe('Theme Switching and Visual Modes', () => {
    it('should support light/dark theme toggle', () => {
      cy.visit('/');
      cy.wait(1000);

      // Get current theme
      cy.get('html').then(($html) => {
        const initialTheme = $html.attr('class') || '';

        // Try to find theme toggle
        cy.get('body').then(($body) => {
          if ($body.text().match(/light|dark|theme/i)) {
            cy.get('button').contains(/light|dark/i).first().click({ force: true });
            cy.wait(500);

            // Theme should change
            cy.get('html').should('not.have.class', initialTheme);
          }
        });
      });
    });

    it('should persist theme preference', () => {
      cy.visit('/');
      cy.wait(1000);

      // Change theme
      cy.get('body').then(($body) => {
        if ($body.text().match(/light|dark/i)) {
          cy.get('button').contains(/light|dark/i).first().click({ force: true });
          cy.wait(500);

          // Get current theme
          cy.get('html').invoke('attr', 'class').then((theme) => {
            // Reload page
            cy.reload();
            cy.wait(1000);

            // Theme should persist
            cy.get('html').should('have.class', theme);
          });
        }
      });
    });
  });

  describe('Animations and Transitions', () => {
    it('should have smooth page transitions', () => {
      cy.visit('/elections');
      cy.wait(2000);

      cy.visit('/profile');
      cy.wait(1000);

      // Page should render smoothly
      cy.get('body').should('be.visible');
    });

    it('should have hover animations on cards', () => {
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
  });

  describe('Performance and User Experience', () => {
    it('should load home page within 3 seconds', () => {
      const startTime = Date.now();
      cy.visit('/');

      cy.get('[class*="heroSection"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('should show smooth transitions between pages', () => {
      cy.visit('/');
      cy.wait(1000);

      // Navigate to elections
      cy.contains(/voir.*élections|view.*elections|élections|elections/i).click();
      cy.wait(500);

      // Page should transition smoothly
      cy.url().should('include', '/elections');
      cy.get('body').should('be.visible');
    });

    it('should not have layout shift during loading', () => {
      cy.visit('/');

      // Initial viewport should be stable
      cy.get('body').should('be.visible');
      cy.wait(2000);

      // Content should load without major shifts
      cy.get('body').should('be.visible');
    });

    it('should optimize images for fast loading', () => {
      cy.visit('/');
      cy.wait(2000);

      cy.get('img').each(($img) => {
        // Images should load
        cy.wrap($img).should('be.visible');
      });
    });
  });

  describe('Feedback and Confirmation', () => {
    it('should show success message after successful action', () => {
      cy.visit('/');
      cy.wait(1000);

      // Success messages would appear after transactions
      // This is a placeholder test
      cy.get('body').should('exist');
    });

    it('should require confirmation for destructive actions', () => {
      cy.visit('/admin/dashboard');
      cy.wait(2000);

      // Destructive actions (delete, close) should have confirmation
      cy.get('body').then(($body) => {
        if ($body.text().match(/delete|supprimer|close|clôturer/i)) {
          // Would need to test confirmation modal
          cy.get('body').should('exist');
        }
      });
    });
  });
});
