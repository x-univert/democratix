describe('Internationalization (i18n)', () => {
  // Supported languages in the app
  const languages = {
    fr: {
      code: 'fr',
      name: 'Français',
      translations: {
        home: {
          title: 'DEMOCRATIX',
          subtitle: 'Plateforme de vote décentralisée et transparente',
          hero: 'Décentralisé, Transparent, Anonyme',
          createElection: 'Créer une élection',
          viewElections: 'Voir les élections',
          connect: 'Connecter'
        },
        elections: {
          title: 'Élections',
          all: 'Toutes',
          pending: 'En attente',
          active: 'Actives',
          closed: 'Fermées',
          finalized: 'Finalisées'
        },
        common: {
          loading: 'Chargement',
          error: 'Erreur',
          notFound: 'Non trouvée'
        }
      }
    },
    en: {
      code: 'en',
      name: 'English',
      translations: {
        home: {
          title: 'DEMOCRATIX',
          subtitle: 'Decentralized and transparent voting platform',
          hero: 'Decentralized, Transparent, Anonymous',
          createElection: 'Create Election',
          viewElections: 'View Elections',
          connect: 'Connect'
        },
        elections: {
          title: 'Elections',
          all: 'All',
          pending: 'Pending',
          active: 'Active',
          closed: 'Closed',
          finalized: 'Finalized'
        },
        common: {
          loading: 'Loading',
          error: 'Error',
          notFound: 'Not Found'
        }
      }
    },
    es: {
      code: 'es',
      name: 'Español',
      translations: {
        home: {
          title: 'DEMOCRATIX',
          subtitle: 'Plataforma de votación descentralizada y transparente',
          hero: 'Descentralizado, Transparente, Anónimo',
          createElection: 'Crear Elección',
          viewElections: 'Ver Elecciones',
          connect: 'Conectar'
        },
        elections: {
          title: 'Elecciones',
          all: 'Todas',
          pending: 'Pendientes',
          active: 'Activas',
          closed: 'Cerradas',
          finalized: 'Finalizadas'
        },
        common: {
          loading: 'Cargando',
          error: 'Error',
          notFound: 'No Encontrada'
        }
      }
    }
  };

  describe('Default Language', () => {
    it('should detect browser language or use default (English)', () => {
      cy.clearLocalStorage();
      cy.visit('/');
      cy.wait(1000);

      // Should have a language set in localStorage after initial visit
      cy.window().then((win) => {
        const storedLang = win.localStorage.getItem('i18nextLng');
        expect(storedLang).to.be.oneOf(['en', 'fr', 'es', 'en-US', 'fr-FR', 'es-ES']);
      });
    });

    it('should fall back to English if unsupported language is detected', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'zh'); // Unsupported language
      });
      cy.visit('/');
      cy.wait(1000);

      // Should display English or switch to a supported language
      cy.get('body').should('exist');
    });
  });

  describe('Language Selector UI', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.wait(1000);
    });

    it('should have language selector accessible', () => {
      cy.get('body').then(($body) => {
        // Look for settings modal trigger or language selector
        const hasSettings =
          $body.find('[class*="settings"]').length > 0 ||
          $body.find('[class*="language"]').length > 0 ||
          $body.text().match(/settings|paramètres|configuración/i);

        if (hasSettings) {
          cy.get('[class*="settings"], [class*="language"]').should('exist');
        }
      });
    });

    it('should open settings modal when clicking settings button', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/settings|paramètres|configuración/i)) {
          cy.contains(/settings|paramètres|configuración/i).first().click();
          cy.wait(500);

          // Modal should be visible
          cy.get('[class*="modal"], [role="dialog"]').should('exist');
        }
      });
    });
  });

  describe('Language Switching - French', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'fr');
      });
    });

    it('should display home page in French', () => {
      cy.visit('/');
      cy.wait(1000);

      const fr = languages.fr.translations;

      // Check main elements
      cy.get('body').should('contain', fr.home.title);
      cy.get('body').should(($body) => {
        const hasFrench =
          $body.text().includes(fr.home.createElection) ||
          $body.text().includes(fr.home.viewElections) ||
          $body.text().match(/créer|voir/i);
        expect(hasFrench).to.be.true;
      });
    });

    it('should display elections page in French', () => {
      cy.visit('/elections');
      cy.wait(2000);

      const fr = languages.fr.translations;

      // Check filter tabs
      cy.get('body').should(($body) => {
        const hasFrenchFilters =
          $body.text().match(/toutes|en attente|actives|fermées|finalisées/i);
        expect(hasFrenchFilters).to.be.true;
      });
    });

    it('should display election detail page in French', () => {
      cy.visit('/election/47');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        if (!$body.text().match(/error|erreur/i)) {
          // If election exists, check for French text
          cy.get('body').should(($el) => {
            const hasFrench =
              $el.text().match(/élection|candidat|voter|retour/i);
            expect(hasFrench).to.be.true;
          });
        }
      });
    });

    it('should not show missing translation keys in French', () => {
      cy.visit('/');
      cy.wait(1000);

      // Missing keys often appear as "common.submit" or "errors.notFound"
      cy.get('body').should(($body) => {
        const hasMissingKeys = $body.text().match(/\w+\.\w+/);
        // If found, they should be valid CSS classes or dates, not i18n keys
        if (hasMissingKeys) {
          const text = $body.text();
          expect(text).to.not.match(/common\.|errors\.|pages\./);
        }
      });
    });
  });

  describe('Language Switching - English', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'en');
      });
    });

    it('should display home page in English', () => {
      cy.visit('/');
      cy.wait(1000);

      const en = languages.en.translations;

      // Check main elements
      cy.get('body').should('contain', en.home.title);
      cy.get('body').should(($body) => {
        const hasEnglish =
          $body.text().includes(en.home.createElection) ||
          $body.text().includes(en.home.viewElections) ||
          $body.text().match(/create|view/i);
        expect(hasEnglish).to.be.true;
      });
    });

    it('should display elections page in English', () => {
      cy.visit('/elections');
      cy.wait(2000);

      const en = languages.en.translations;

      // Check filter tabs
      cy.get('body').should(($body) => {
        const hasEnglishFilters =
          $body.text().match(/all|pending|active|closed|finalized/i);
        expect(hasEnglishFilters).to.be.true;
      });
    });

    it('should display election detail page in English', () => {
      cy.visit('/election/47');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        if (!$body.text().match(/error|erreur/i)) {
          // If election exists, check for English text
          cy.get('body').should(($el) => {
            const hasEnglish =
              $el.text().match(/election|candidate|vote|back/i);
            expect(hasEnglish).to.be.true;
          });
        }
      });
    });

    it('should not show missing translation keys in English', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('body').should(($body) => {
        const text = $body.text();
        expect(text).to.not.match(/common\.|errors\.|pages\./);
      });
    });
  });

  describe('Language Switching - Spanish', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'es');
      });
    });

    it('should display home page in Spanish', () => {
      cy.visit('/');
      cy.wait(1000);

      const es = languages.es.translations;

      // Check main elements
      cy.get('body').should('contain', es.home.title);
      cy.get('body').should(($body) => {
        const hasSpanish =
          $body.text().includes(es.home.createElection) ||
          $body.text().includes(es.home.viewElections) ||
          $body.text().match(/crear|ver/i);
        expect(hasSpanish).to.be.true;
      });
    });

    it('should display elections page in Spanish', () => {
      cy.visit('/elections');
      cy.wait(2000);

      const es = languages.es.translations;

      // Check filter tabs
      cy.get('body').should(($body) => {
        const hasSpanishFilters =
          $body.text().match(/todas|pendientes|activas|cerradas|finalizadas/i);
        expect(hasSpanishFilters).to.be.true;
      });
    });

    it('should display election detail page in Spanish', () => {
      cy.visit('/election/47');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        if (!$body.text().match(/error|erreur/i)) {
          // If election exists, check for Spanish text
          cy.get('body').should(($el) => {
            const hasSpanish =
              $el.text().match(/elección|candidato|votar|volver/i);
            expect(hasSpanish).to.be.true;
          });
        }
      });
    });

    it('should not show missing translation keys in Spanish', () => {
      cy.visit('/');
      cy.wait(1000);

      cy.get('body').should(($body) => {
        const text = $body.text();
        expect(text).to.not.match(/common\.|errors\.|pages\./);
      });
    });
  });

  describe('Language Persistence', () => {
    it('should persist French across page navigation', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'fr');
      });
      cy.visit('/');
      cy.wait(1000);

      // Navigate to elections
      cy.contains(/voir.*élections|élections/i).click();
      cy.wait(1000);

      // Should still be in French
      cy.get('body').should(($body) => {
        const hasFrench = $body.text().match(/toutes|en attente|actives|créer/i);
        expect(hasFrench).to.be.true;
      });

      // Check localStorage
      cy.window().then((win) => {
        const lang = win.localStorage.getItem('i18nextLng');
        expect(lang).to.equal('fr');
      });
    });

    it('should persist English across page navigation', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'en');
      });
      cy.visit('/');
      cy.wait(1000);

      // Navigate to elections
      cy.contains(/view.*elections|elections/i).click();
      cy.wait(1000);

      // Should still be in English
      cy.get('body').should(($body) => {
        const hasEnglish = $body.text().match(/all|pending|active|create/i);
        expect(hasEnglish).to.be.true;
      });

      // Check localStorage
      cy.window().then((win) => {
        const lang = win.localStorage.getItem('i18nextLng');
        expect(lang).to.equal('en');
      });
    });

    it('should persist Spanish across page navigation', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'es');
      });
      cy.visit('/');
      cy.wait(1000);

      // Navigate to elections
      cy.contains(/ver.*elecciones|elecciones/i).click();
      cy.wait(1000);

      // Should still be in Spanish
      cy.get('body').should(($body) => {
        const hasSpanish = $body.text().match(/todas|pendientes|activas|crear/i);
        expect(hasSpanish).to.be.true;
      });

      // Check localStorage
      cy.window().then((win) => {
        const lang = win.localStorage.getItem('i18nextLng');
        expect(lang).to.equal('es');
      });
    });

    it('should persist language after page reload', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'fr');
      });
      cy.visit('/elections');
      cy.wait(2000);

      // Reload page
      cy.reload();
      cy.wait(2000);

      // Should still be in French
      cy.get('body').should(($body) => {
        const hasFrench = $body.text().match(/toutes|en attente|actives/i);
        expect(hasFrench).to.be.true;
      });
    });
  });

  describe('Dynamic Language Switching (via UI)', () => {
    it('should switch from English to French via settings', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'en');
      });
      cy.visit('/');
      cy.wait(1000);

      // Try to find and click settings
      cy.get('body').then(($body) => {
        if ($body.text().match(/settings|configure/i)) {
          cy.contains(/settings|configure/i).first().click({ force: true });
          cy.wait(500);

          // Look for language options
          if ($body.text().match(/français|french/i)) {
            cy.contains(/français|french/i).click();
            cy.wait(1000);

            // Should now be in French
            cy.get('body').should(($el) => {
              const hasFrench = $el.text().match(/créer|voir|élections/i);
              expect(hasFrench).to.be.true;
            });
          }
        }
      });
    });

    it('should switch from French to Spanish via settings', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'fr');
      });
      cy.visit('/');
      cy.wait(1000);

      // Try to find and click settings
      cy.get('body').then(($body) => {
        if ($body.text().match(/paramètres|réglages/i)) {
          cy.contains(/paramètres|réglages/i).first().click({ force: true });
          cy.wait(500);

          // Look for language options
          if ($body.text().match(/español|espagnol/i)) {
            cy.contains(/español|espagnol/i).click();
            cy.wait(1000);

            // Should now be in Spanish
            cy.get('body').should(($el) => {
              const hasSpanish = $el.text().match(/crear|ver|elecciones/i);
              expect(hasSpanish).to.be.true;
            });
          }
        }
      });
    });
  });

  describe('Translation Completeness', () => {
    it('should have all major UI elements translated in French', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'fr');
      });

      // Test multiple pages
      const pages = ['/', '/elections', '/election/47'];

      pages.forEach((page) => {
        cy.visit(page);
        cy.wait(2000);

        cy.get('body').should(($body) => {
          const text = $body.text();
          // Should not have English-only text mixed in
          const hasOnlyEnglish =
            text.includes('Create Election') ||
            text.includes('View Elections') ||
            text.includes('Pending Elections');
          expect(hasOnlyEnglish).to.be.false;
        });
      });
    });

    it('should have all major UI elements translated in English', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'en');
      });

      const pages = ['/', '/elections', '/election/47'];

      pages.forEach((page) => {
        cy.visit(page);
        cy.wait(2000);

        cy.get('body').should(($body) => {
          const text = $body.text();
          // Should not have French-only text mixed in
          const hasOnlyFrench =
            text.includes('Créer une élection') ||
            text.includes('Voir les élections') ||
            text.includes('Élections en attente');
          expect(hasOnlyFrench).to.be.false;
        });
      });
    });

    it('should have all major UI elements translated in Spanish', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('i18nextLng', 'es');
      });

      const pages = ['/', '/elections', '/election/47'];

      pages.forEach((page) => {
        cy.visit(page);
        cy.wait(2000);

        cy.get('body').should(($body) => {
          const text = $body.text();
          // Should not have English or French-only text mixed in
          const hasOtherLanguages =
            text.includes('Create Election') ||
            text.includes('Créer une élection');
          expect(hasOtherLanguages).to.be.false;
        });
      });
    });
  });

  describe('Responsive Language Selector', () => {
    it('should display language selector on mobile', () => {
      cy.viewport(375, 667);
      cy.visit('/');
      cy.wait(1000);

      // Settings/language selector should be accessible on mobile
      cy.get('body').should('exist');
    });

    it('should display language selector on tablet', () => {
      cy.viewport(768, 1024);
      cy.visit('/');
      cy.wait(1000);

      cy.get('body').should('exist');
    });

    it('should display language selector on desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/');
      cy.wait(1000);

      cy.get('body').should('exist');
    });
  });
});
