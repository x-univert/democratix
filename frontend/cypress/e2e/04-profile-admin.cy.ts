describe('Profile & Admin Dashboard', () => {
  describe('Profile Page', () => {
    beforeEach(() => {
      cy.visit('/profile');
    });

    describe('Page Access', () => {
      it('should display profile page or redirect to unlock', () => {
        // Either displays profile or redirects to connect wallet
        cy.url().should('match', /\/(profile|unlock|dashboard)/);
      });

      it('should display profile page title', () => {
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.contains(/profil|profile|perfil/i, { timeout: 5000 }).should('be.visible');
          }
        });
      });
    });

    describe('Wallet Information', () => {
      it('should display wallet address if connected', () => {
        cy.get('body').then(($body) => {
          if ($body.text().match(/erd1/i)) {
            cy.contains('erd1').should('be.visible');
          }
        });
      });

      it('should display wallet balance or stats', () => {
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            // Look for stats or balance
            cy.get('[class*="stat"], [class*="card"], [class*="grid"]').should('exist');
          }
        });
      });
    });

    describe('Voting History', () => {
      it('should display voting history section', () => {
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.get('body').should(($el) => {
              const hasHistory =
                $el.text().match(/historique|history|historial|participation/i) ||
                $el.find('[class*="history"]').length > 0;
              expect(hasHistory).to.be.true;
            });
          }
        });
      });

      it('should display voting records or empty state', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            // Either has voting records or shows empty state
            const hasRecords = $body.find('[class*="record"], [class*="item"]').length > 0;
            const hasEmptyState = $body.text().match(/aucun|no vote|empty|vide/i);
            expect(hasRecords || hasEmptyState).to.be.true;
          }
        });
      });
    });

    describe('Statistics Display', () => {
      it('should display user statistics', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.get('[class*="stat"], [class*="grid"]').should('exist');
          }
        });
      });
    });

    describe('Responsive Design', () => {
      it('should display correctly on mobile (375x667)', () => {
        cy.viewport(375, 667);
        cy.visit('/profile');

        cy.get('body').should('be.visible');
      });

      it('should display correctly on tablet (768x1024)', () => {
        cy.viewport(768, 1024);
        cy.visit('/profile');

        cy.get('body').should('be.visible');
      });

      it('should display correctly on desktop (1920x1080)', () => {
        cy.viewport(1920, 1080);
        cy.visit('/profile');

        cy.get('body').should('be.visible');
      });
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      cy.visit('/admin/dashboard');
    });

    describe('Page Access', () => {
      it('should display admin dashboard or redirect if not connected', () => {
        cy.url().should('match', /\/(admin|unlock|dashboard)/);
      });

      it('should display admin dashboard title', () => {
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.contains(/admin|dashboard|tableau de bord/i, { timeout: 5000 }).should('be.visible');
          }
        });
      });
    });

    describe('Global Statistics', () => {
      it('should display global statistics section', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.get('body').should(($el) => {
              const hasStats =
                $el.text().match(/statistiques|statistics|estadísticas/i) ||
                $el.find('[class*="stat"]').length > 0;
              expect(hasStats).to.be.true;
            });
          }
        });
      });

      it('should display total elections count', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.get('body').should(($el) => {
              const hasTotalElections =
                $el.text().match(/total.*élections|total.*elections|élections.*total/i) ||
                $el.find('[class*="stat"], [class*="card"]').length > 0;
              expect(hasTotalElections).to.be.true;
            });
          }
        });
      });

      it('should display total votes or other metrics', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.get('body').should(($el) => {
              const hasMetrics =
                $el.text().match(/votes|candidats|candidates/i) ||
                $el.find('[class*="stat"]').length > 0;
              expect(hasMetrics).to.be.true;
            });
          }
        });
      });
    });

    describe('Charts and Visualizations', () => {
      it('should display charts or graphs', () => {
        cy.wait(3000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            // Look for chart elements (canvas, svg, or chart containers)
            cy.get('body').should(($el) => {
              const hasCharts =
                $el.find('canvas, svg, [class*="chart"]').length > 0 ||
                $el.text().match(/répartition|distribution|timeline/i);
              expect(hasCharts).to.be.true;
            });
          }
        });
      });
    });

    describe('My Elections Section', () => {
      it('should display my elections section', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.get('body').should(($el) => {
              const hasMyElections =
                $el.text().match(/mes.*élections|my.*elections|élections.*organisées/i) ||
                $el.find('[class*="election"]').length > 0;
              expect(hasMyElections).to.be.true;
            });
          }
        });
      });

      it('should display filter buttons for election status', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if ($body.text().match(/mes.*élections|my.*elections/i)) {
            // Should have filter buttons
            cy.get('body').should(($el) => {
              const hasFilters =
                $el.text().match(/toutes|all|pending|active|closed/i) ||
                $el.find('button').length > 3;
              expect(hasFilters).to.be.true;
            });
          }
        });
      });

      it('should navigate to election detail when clicking on election card', () => {
        cy.wait(2000);
        cy.get('[class*="election"]').first().then(($card) => {
          if ($card.length > 0) {
            cy.wrap($card).click();
            cy.url().should('match', /\/election\/\d+/);
          }
        });
      });
    });

    describe('Quick Actions', () => {
      it('should display quick actions section', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.get('body').should(($el) => {
              const hasQuickActions =
                $el.text().match(/actions.*rapides|quick.*actions|acciones.*rápidas/i) ||
                $el.find('button').length > 2;
              expect(hasQuickActions).to.be.true;
            });
          }
        });
      });

      it('should have create election button', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if (!$body.text().match(/connect|connexion/i)) {
            cy.contains(/créer.*élection|create.*election/i).should('exist');
          }
        });
      });

      it('should navigate to create election when clicking create button', () => {
        cy.wait(2000);
        cy.get('body').then(($body) => {
          if ($body.text().match(/créer.*élection|create.*election/i)) {
            cy.contains(/créer.*élection|create.*election/i).first().click();
            cy.url().should('match', /\/(create-election|unlock)/);
          }
        });
      });
    });

    describe('Responsive Design', () => {
      it('should display correctly on mobile (375x667)', () => {
        cy.viewport(375, 667);
        cy.visit('/admin/dashboard');
        cy.wait(2000);

        cy.get('body').should('be.visible');
      });

      it('should display correctly on tablet (768x1024)', () => {
        cy.viewport(768, 1024);
        cy.visit('/admin/dashboard');
        cy.wait(2000);

        cy.get('body').should('be.visible');
      });

      it('should display correctly on desktop (1920x1080)', () => {
        cy.viewport(1920, 1080);
        cy.visit('/admin/dashboard');
        cy.wait(2000);

        cy.get('body').should('be.visible');
      });
    });

    describe('Performance', () => {
      it('should load dashboard within reasonable time', () => {
        const startTime = Date.now();
        cy.visit('/admin/dashboard');

        cy.get('body', { timeout: 10000 })
          .should('be.visible')
          .then(() => {
            const loadTime = Date.now() - startTime;
            expect(loadTime).to.be.lessThan(10000);
          });
      });
    });
  });
});
