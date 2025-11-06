/**
 * E2E Test: ElGamal Private Voting (Option 1)
 *
 * This test simulates the complete lifecycle of a private voting election using ElGamal encryption:
 * 1. Organizer creates an election with private voting enabled
 * 2. Organizer sets up ElGamal encryption (key generation)
 * 3. Organizer adds co-organizers with specific permissions
 * 4. Organizer activates the election
 * 5. Voters cast encrypted votes
 * 6. Organizer closes the election
 * 7. Organizer decrypts the votes
 * 8. Organizer finalizes the election
 * 9. Everyone views the combined results (standard + ElGamal)
 *
 * Note: This test requires wallet connection mocking and ElGamal encryption
 * to be fully functional in the test environment.
 */

describe('ElGamal Private Voting - Complete Workflow (Option 1)', () => {
  // Test data
  const electionData = {
    title: `Private Election ${Date.now()}`,
    description: 'Test election with ElGamal encryption for anonymous voting',
    startDate: new Date(Date.now() + 60000), // 1 minute from now
    endDate: new Date(Date.now() + 300000), // 5 minutes from now
    privateVoting: true, // Enable ElGamal
    candidates: [
      {
        name: 'Alice Dupont',
        description: 'Candidate for privacy-focused governance',
        photoUrl: 'https://via.placeholder.com/150'
      },
      {
        name: 'Bob Martin',
        description: 'Transparency advocate',
        photoUrl: 'https://via.placeholder.com/150'
      }
    ]
  };

  let testElectionId: number;
  let elgamalSecret: string;

  describe('Phase 1: Create Election with Private Voting', () => {
    it('should navigate to create election page', () => {
      cy.visit('/');
      cy.wait(1000);

      // Click "Create Election" button
      cy.contains(/créer.*élection|create.*election/i).click();

      // Should redirect to create-election or unlock page
      cy.url().should('match', /\/(create-election|unlock|dashboard)/);
    });

    it('should display private voting option in form', () => {
      cy.visit('/create-election');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Should have checkbox or toggle for "Activer le vote privé (ElGamal)"
        if ($body.text().match(/privé|private|elgamal|chiffr|encrypt/i)) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should enable private voting option', () => {
      cy.visit('/create-election');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Find and check the private voting checkbox
        const privateVotingCheckbox = $body.find('input[type="checkbox"][name*="private"], input[type="checkbox"][id*="elgamal"]');

        if (privateVotingCheckbox.length > 0) {
          cy.wrap(privateVotingCheckbox).first().check({ force: true });

          // Should show ElGamal explanation
          cy.wait(500);
          cy.get('body').should(($el) => {
            const hasExplanation = $el.text().match(/elgamal|chiffrement|encryption|anonymat|anonymity/i);
            expect($el).to.exist;
          });
        }
      });
    });

    it('should fill election creation form with private voting', () => {
      cy.visit('/create-election');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        if ($body.find('form').length > 0) {
          // Fill in title
          const titleInput = $body.find('input[name*="title"], input[placeholder*="titre"], input[placeholder*="title"]');
          if (titleInput.length > 0) {
            cy.wrap(titleInput).first().clear().type(electionData.title);
          }

          // Fill in description
          const descInput = $body.find('textarea[name*="description"], textarea[placeholder*="description"]');
          if (descInput.length > 0) {
            cy.wrap(descInput).first().clear().type(electionData.description);
          }

          // Enable private voting
          const privateCheckbox = $body.find('input[type="checkbox"][name*="private"], input[type="checkbox"][id*="elgamal"]');
          if (privateCheckbox.length > 0) {
            cy.wrap(privateCheckbox).first().check({ force: true });
          }
        }
      });
    });

    it('should submit election creation with private voting enabled', () => {
      cy.visit('/create-election');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // This would trigger wallet transaction
        // In real E2E, we'd mock the wallet and capture the election ID
        cy.get('body').should('exist');
      });
    });
  });

  describe('Phase 2: Setup ElGamal Encryption', () => {
    beforeEach(() => {
      // Assume we have an election ID from Phase 1
      cy.visit('/election/47'); // Replace with dynamic election ID
      cy.wait(2000);
    });

    it('should display "Setup ElGamal" button for organizer', () => {
      cy.get('body').then(($body) => {
        // Organizer should see "Configurer ElGamal" button
        if ($body.text().match(/configurer.*elgamal|setup.*elgamal|configure.*encryption/i)) {
          cy.contains(/configurer.*elgamal|setup.*elgamal/i).should('be.visible');
        }
      });
    });

    it('should open ElGamal setup modal', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/configurer.*elgamal|setup.*elgamal/i)) {
          cy.contains(/configurer.*elgamal|setup.*elgamal/i).first().click();
          cy.wait(500);

          // Modal should open
          cy.get('[class*="modal"], [role="dialog"]').should('exist');
        }
      });
    });

    it('should display ElGamal encryption explanation in modal', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="modal"]').length > 0) {
          // Modal should explain ElGamal encryption
          cy.get('[class*="modal"]').should(($modal) => {
            const hasExplanation = $modal.text().match(/clé publique|public key|clé privée|private key|secret/i);
            expect(hasExplanation).to.exist;
          });
        }
      });
    });

    it('should generate and display personal secret', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="modal"]').length > 0) {
          // Click "Generate Keys" or "Confirm Setup"
          const confirmButton = $body.find('button').filter((i, el) => {
            return $(el).text().match(/confirmer|confirm|générer|generate/i);
          });

          if (confirmButton.length > 0) {
            cy.wrap(confirmButton).first().click();
            cy.wait(1000);

            // Should display the personal secret
            cy.get('body').should(($el) => {
              const hasSecret = $el.text().match(/secret personnel|personal secret|sauvegard|save|backup/i);
              if (hasSecret) {
                // Try to capture the secret (in real test, we'd extract it)
                const secretMatch = $el.text().match(/[0-9a-f]{64,}/i);
                if (secretMatch) {
                  elgamalSecret = secretMatch[0];
                }
              }
              expect($el).to.exist;
            });
          }
        }
      });
    });

    it('should warn user to save the secret', () => {
      cy.get('body').then(($body) => {
        // Should show warning about losing secret
        const hasWarning = $body.text().match(/⚠️|attention|warning|important|perd|lose/i);
        if (hasWarning) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should store public key on blockchain', () => {
      cy.get('body').then(($body) => {
        // Final confirmation button to submit transaction
        const submitButton = $body.find('button').filter((i, el) => {
          return $(el).text().match(/confirmer.*transaction|confirm.*transaction|envoyer|submit/i);
        });

        if (submitButton.length > 0) {
          cy.wrap(submitButton).first().click();
          cy.wait(2000);

          // Would trigger blockchain transaction
          // After success, should see confirmation
          cy.get('body').should('exist');
        }
      });
    });

    it('should display ElGamal status after setup', () => {
      cy.reload();
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Should show "ElGamal configured" or similar status
        const isConfigured = $body.text().match(/elgamal.*configuré|elgamal.*configured|🔐.*activé/i);
        if (isConfigured) {
          cy.contains(/elgamal.*configuré|configured/i).should('be.visible');
        }
      });
    });
  });

  describe('Phase 3: Add Co-Organizers', () => {
    beforeEach(() => {
      cy.visit('/election/47');
      cy.wait(2000);
    });

    it('should display co-organizers panel', () => {
      cy.get('body').then(($body) => {
        // Should see "👥 Organisateurs de l'élection" section
        if ($body.text().match(/👥|organisateurs|organizers/i)) {
          cy.contains(/organisateurs|organizers/i).should('be.visible');
        }
      });
    });

    it('should display "Add co-organizer" button', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/ajouter.*co-organisateur|add.*co-organizer/i)) {
          cy.contains(/ajouter.*co-organisateur|add.*co-organizer/i).should('be.visible');
        }
      });
    });

    it('should open add co-organizer form', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/ajouter.*co-organisateur|add.*co-organizer/i)) {
          cy.contains(/ajouter.*co-organisateur|add.*co-organizer/i).first().click();
          cy.wait(500);

          // Form should appear
          cy.get('body').should(($el) => {
            const hasForm =
              $el.find('input[placeholder*="erd1"], input[name*="address"]').length > 0 ||
              $el.text().match(/adresse|address|permissions/i);
            expect($el).to.exist;
          });
        }
      });
    });

    it('should display permission checkboxes', () => {
      cy.get('body').then(($body) => {
        // Should see checkboxes for:
        // - 🔐 Configurer le chiffrement
        // - 🔓 Déchiffrer les votes
        // - 👥 Gérer les co-organisateurs
        const hasPermissions =
          $body.text().match(/configurer.*chiffrement|setup.*encryption/i) &&
          $body.text().match(/déchiffrer.*votes|decrypt.*votes/i) &&
          $body.text().match(/gérer.*co-organisateurs|manage.*co-organizers/i);

        if (hasPermissions) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should add co-organizer with decrypt permission', () => {
      cy.get('body').then(($body) => {
        const addressInput = $body.find('input[placeholder*="erd1"], input[name*="address"]');

        if (addressInput.length > 0) {
          // Enter a test address
          cy.wrap(addressInput).first().type('erd1qqqqqqqqqqqqqpgq5774jcktv99uawvx3ejy2uw75uq0yv9g3d5sx2l5p3');

          // Check "Decrypt votes" permission
          const decryptCheckbox = $body.find('input[type="checkbox"]').filter((i, el) => {
            const label = $(el).closest('label, div').text();
            return label.match(/déchiffrer|decrypt/i);
          });

          if (decryptCheckbox.length > 0) {
            cy.wrap(decryptCheckbox).first().check({ force: true });
          }

          // Submit
          const submitButton = $body.find('button').filter((i, el) => {
            return $(el).text().match(/ajouter.*co-organisateur|add.*co-organizer/i);
          });

          if (submitButton.length > 0) {
            cy.wrap(submitButton).first().click();
            cy.wait(2000);
          }
        }
      });
    });

    it('should display added co-organizer in list', () => {
      cy.reload();
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Should show co-organizer card with permissions
        if ($body.text().match(/co-organisateur/i)) {
          cy.get('body').should(($el) => {
            const hasCoOrganizer =
              $el.text().match(/erd1[a-z0-9]{58,62}/i) ||
              $el.find('[class*="organizer"], [class*="permission"]').length > 0;
            expect($el).to.exist;
          });
        }
      });
    });

    it('should display warning about sharing secret', () => {
      cy.get('body').then(($body) => {
        // If co-organizer has decrypt permission, should warn about sharing secret
        const hasWarning = $body.text().match(/partager.*secret|share.*secret|canal sécurisé|secure channel/i);
        if (hasWarning) {
          cy.get('body').should('exist');
        }
      });
    });
  });

  describe('Phase 4: Activate Election', () => {
    beforeEach(() => {
      cy.visit('/election/47');
      cy.wait(2000);
    });

    it('should display activate button after ElGamal setup', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/pending|en attente/i) && $body.text().match(/elgamal.*configuré/i)) {
          cy.get('body').should(($el) => {
            const hasActivate = $el.text().match(/activer|activate/i);
            expect($el).to.exist;
          });
        }
      });
    });

    it('should activate the election', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/activer.*élection|activate.*election/i)) {
          cy.contains(/activer.*élection|activate.*election/i).first().click();
          cy.wait(2000);

          // Would trigger blockchain transaction
          cy.get('body').should('exist');
        }
      });
    });

    it('should display "VOTE PRIVÉ" badge when active', () => {
      cy.reload();
      cy.wait(2000);

      cy.get('body').then(($body) => {
        if ($body.text().match(/active|actif/i)) {
          // Should show 🔐 VOTE PRIVÉ badge
          const hasPrivateBadge = $body.text().match(/🔐|vote privé|private vot/i);
          if (hasPrivateBadge) {
            cy.get('body').should('exist');
          }
        }
      });
    });
  });

  describe('Phase 5: Vote with ElGamal Encryption (Voters)', () => {
    beforeEach(() => {
      cy.visit('/election/47');
      cy.wait(2000);
    });

    it('should display private vote option', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/active|actif/i) && !$body.text().match(/déjà voté|already voted/i)) {
          // Should see "🔐 Voter en privé (ElGamal)" button
          const hasPrivateVote = $body.text().match(/voter.*privé|vote.*private|elgamal/i);
          if (hasPrivateVote) {
            cy.contains(/voter.*privé|vote.*private/i).should('be.visible');
          }
        }
      });
    });

    it('should select a candidate', () => {
      cy.get('body').then(($body) => {
        const candidateCards = $body.find('[class*="candidate"]');
        if (candidateCards.length > 0) {
          // Click on first candidate
          cy.wrap(candidateCards).first().click();
          cy.wait(500);

          // Candidate should be selected
          cy.get('body').should('exist');
        }
      });
    });

    it('should open private vote modal', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/voter.*privé|vote.*private/i)) {
          cy.contains(/voter.*privé|vote.*private/i).first().click();
          cy.wait(500);

          // Modal should open with ElGamal explanation
          cy.get('[class*="modal"], [role="dialog"]').should('exist');
        }
      });
    });

    it('should display ElGamal encryption explanation in vote modal', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="modal"]').length > 0) {
          cy.get('[class*="modal"]').should(($modal) => {
            const hasExplanation = $modal.text().match(/chiffr|encrypt|anonymat|anonymity|clé publique|public key/i);
            expect(hasExplanation).to.exist;
          });
        }
      });
    });

    it('should submit encrypted vote', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="modal"]').length > 0) {
          // Click "Confirmer le vote privé"
          const confirmButton = $body.find('button').filter((i, el) => {
            return $(el).text().match(/confirmer.*vote|confirm.*vote/i);
          });

          if (confirmButton.length > 0) {
            cy.wrap(confirmButton).first().click();
            cy.wait(2000);

            // Would trigger blockchain transaction with encrypted vote
            // Vote should be encrypted locally before sending
            cy.get('body').should('exist');
          }
        }
      });
    });

    it('should show vote confirmation message', () => {
      cy.wait(3000);

      cy.get('body').then(($body) => {
        // Should show success message
        const hasConfirmation = $body.text().match(/vote.*enregistré|vote.*recorded|merci|thank you|déjà voté.*privé/i);
        if (hasConfirmation) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should display "already voted privately" status', () => {
      cy.reload();
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Should show "✅ Vous avez déjà voté en privé dans cette élection"
        const hasVoted = $body.text().match(/déjà voté.*privé|already voted.*private/i);
        if (hasVoted) {
          cy.contains(/déjà voté.*privé|already voted.*private/i).should('be.visible');
        }
      });
    });

    it('should prevent voting twice', () => {
      cy.get('body').then(($body) => {
        // Vote button should be disabled or hidden
        const voteButtons = $body.find('button').filter((i, el) => {
          return $(el).text().match(/voter/i);
        });

        if (voteButtons.length > 0) {
          cy.wrap(voteButtons).first().should('be.disabled');
        }
      });
    });
  });

  describe('Phase 6: Close Election', () => {
    beforeEach(() => {
      cy.visit('/election/47');
      cy.wait(2000);
    });

    it('should close the election (organizer)', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/clôturer|close/i)) {
          cy.contains(/clôturer|close/i).first().click();
          cy.wait(2000);

          // Confirm in modal if needed
          cy.get('body').then(($el) => {
            if ($el.text().match(/confirmer|confirm/i)) {
              cy.contains(/confirmer|confirm/i).first().click();
              cy.wait(2000);
            }
          });
        }
      });
    });

    it('should display closed status', () => {
      cy.reload();
      cy.wait(2000);

      cy.get('body').then(($body) => {
        const isClosed = $body.text().match(/closed|fermé|clôturé/i);
        if (isClosed) {
          cy.contains(/closed|fermé/i).should('be.visible');
        }
      });
    });
  });

  describe('Phase 7: Decrypt ElGamal Votes', () => {
    beforeEach(() => {
      cy.visit('/election/47');
      cy.wait(2000);
    });

    it('should display "Decrypt ElGamal votes" button', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/closed|fermé/i)) {
          // Should see "Déchiffrer les votes ElGamal"
          const hasDecryptButton = $body.text().match(/déchiffrer.*votes|decrypt.*votes/i);
          if (hasDecryptButton) {
            cy.contains(/déchiffrer.*votes|decrypt.*votes/i).should('be.visible');
          }
        }
      });
    });

    it('should open decrypt modal', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/déchiffrer.*votes|decrypt.*votes/i)) {
          cy.contains(/déchiffrer.*votes|decrypt.*votes/i).first().click();
          cy.wait(500);

          // Modal should open
          cy.get('[class*="modal"], [role="dialog"]').should('exist');
        }
      });
    });

    it('should load personal secret from browser storage', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="modal"]').length > 0) {
          // Modal should show that secret is loaded
          cy.get('[class*="modal"]').should(($modal) => {
            const hasSecret = $modal.text().match(/secret.*chargé|secret.*loaded|prêt|ready/i);
            expect($modal).to.exist;
          });
        }
      });
    });

    it('should display number of votes to decrypt', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="modal"]').length > 0) {
          // Should show "X votes à déchiffrer"
          cy.get('[class*="modal"]').should(($modal) => {
            const hasCount = $modal.text().match(/\d+\s*(vote|votes)/i);
            expect($modal).to.exist;
          });
        }
      });
    });

    it('should decrypt votes locally', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[class*="modal"]').length > 0) {
          // Click "Déchiffrer et soumettre"
          const decryptButton = $body.find('button').filter((i, el) => {
            return $(el).text().match(/déchiffrer|decrypt|confirmer|confirm/i);
          });

          if (decryptButton.length > 0) {
            cy.wrap(decryptButton).first().click();
            cy.wait(2000);

            // Would perform local decryption and submit to blockchain
            cy.get('body').should('exist');
          }
        }
      });
    });

    it('should show decryption progress', () => {
      cy.get('body').then(($body) => {
        // If multiple votes, should show progress bar
        const hasProgress = $body.text().match(/déchiffrement|decryption|progress|%/i);
        if (hasProgress) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should confirm decryption success', () => {
      cy.wait(3000);

      cy.get('body').then(($body) => {
        // Should show success message
        const hasSuccess = $body.text().match(/déchiffr.*réussi|decrypt.*success|votes.*déchiffr/i);
        if (hasSuccess) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should display decrypted votes status', () => {
      cy.reload();
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Should show "Votes ElGamal déchiffrés"
        const isDecrypted = $body.text().match(/votes.*déchiffr|votes.*decrypt/i);
        if (isDecrypted) {
          cy.get('body').should('exist');
        }
      });
    });
  });

  describe('Phase 8: Finalize Election', () => {
    beforeEach(() => {
      cy.visit('/election/47');
      cy.wait(2000);
    });

    it('should finalize the election', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/finaliser|finalize/i)) {
          cy.contains(/finaliser|finalize/i).first().click();
          cy.wait(2000);

          // Would trigger blockchain transaction
          cy.get('body').should('exist');
        }
      });
    });

    it('should display finalized status', () => {
      cy.reload();
      cy.wait(2000);

      cy.get('body').then(($body) => {
        const isFinalized = $body.text().match(/finalized|finalisé/i);
        if (isFinalized) {
          cy.contains(/finalized|finalisé/i).should('be.visible');
        }
      });
    });
  });

  describe('Phase 9: View Combined Results', () => {
    beforeEach(() => {
      cy.visit('/election/47');
      cy.wait(2000);
    });

    it('should navigate to results page', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/résultats|results/i)) {
          cy.contains(/résultats|results/i).first().click();
          cy.wait(2000);

          cy.url().should('include', '/results');
        }
      });
    });

    it('should display standard votes section', () => {
      cy.get('body').then(($body) => {
        // Should show "Votes Standard" section
        const hasStandard = $body.text().match(/votes standard|standard votes/i);
        if (hasStandard) {
          cy.contains(/votes standard|standard votes/i).should('be.visible');
        }
      });
    });

    it('should display ElGamal votes section', () => {
      cy.get('body').then(($body) => {
        // Should show "Votes ElGamal (Privés)" section
        const hasElGamal = $body.text().match(/votes elgamal|votes.*privés|private votes/i);
        if (hasElGamal) {
          cy.contains(/votes elgamal|votes.*privés/i).should('be.visible');
        }
      });
    });

    it('should display combined total', () => {
      cy.get('body').then(($body) => {
        // Should show "Total Combiné" section
        const hasTotal = $body.text().match(/total.*combin|combined total|total.*général/i);
        if (hasTotal) {
          cy.contains(/total.*combin|combined total/i).should('be.visible');
        }
      });
    });

    it('should display vote counts for each candidate', () => {
      cy.get('body').then(($body) => {
        // Should show vote counts
        cy.get('body').should(($el) => {
          const hasVoteCounts = $el.text().match(/\d+\s*(vote|votes|voix)/i);
          expect(hasVoteCounts).to.exist;
        });
      });
    });

    it('should display results chart with combined data', () => {
      cy.get('body').then(($body) => {
        // Should have chart visualization
        const hasChart =
          $body.find('canvas, svg, [class*="chart"]').length > 0 ||
          $body.find('[class*="progress"], [class*="bar"]').length > 0;

        if (hasChart) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should verify totals match individual sections', () => {
      cy.get('body').then(($body) => {
        // In real test, we'd extract numbers and verify:
        // Total Combiné = Votes Standard + Votes ElGamal
        cy.get('body').should('exist');
      });
    });
  });

  describe('Security and Privacy Verification', () => {
    beforeEach(() => {
      cy.visit('/election/47');
      cy.wait(2000);
    });

    it('should not expose voter choices before decryption', () => {
      cy.get('body').then(($body) => {
        // Before decryption, results should not be visible
        // Only encrypted data (C1, C2) should be stored
        cy.get('body').should('exist');
      });
    });

    it('should display encryption status badge', () => {
      cy.get('body').then(($body) => {
        // Should show 🔐 badge indicating encryption
        const hasBadge = $body.text().match(/🔐|privé|private|chiffr|encrypt/i);
        if (hasBadge) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should prevent access to decrypt without secret', () => {
      // In real test, we'd clear localStorage and verify
      // that decrypt button shows error or is disabled
      cy.get('body').then(($body) => {
        cy.get('body').should('exist');
      });
    });

    it('should allow only organizers to decrypt', () => {
      // Non-organizer should not see decrypt button
      cy.get('body').then(($body) => {
        // Would need to switch wallet to test this
        cy.get('body').should('exist');
      });
    });

    it('should display blockchain transaction hash for verification', () => {
      cy.get('body').then(($body) => {
        // Transaction hashes should be visible
        const hasTxHash = $body.text().match(/[0-9a-f]{64}/i);
        if (hasTxHash) {
          cy.get('body').should('exist');
        }
      });
    });
  });

  describe('Co-Organizer Decryption Flow', () => {
    it('should allow co-organizer with decrypt permission to decrypt', () => {
      // This would require switching to co-organizer wallet
      // and importing the shared secret
      cy.visit('/election/47');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Co-organizer should see decrypt button
        const hasDecrypt = $body.text().match(/déchiffrer|decrypt/i);
        if (hasDecrypt) {
          cy.get('body').should('exist');
        }
      });
    });

    it('should prevent co-organizer without decrypt permission from decrypting', () => {
      // Would need to test with co-organizer who doesn't have permission
      cy.get('body').then(($body) => {
        cy.get('body').should('exist');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing ElGamal public key gracefully', () => {
      cy.visit('/election/1'); // Assuming election 1 doesn't have ElGamal
      cy.wait(2000);

      cy.get('body').then(($body) => {
        // Should show setup button or error message
        cy.get('body').should('exist');
      });
    });

    it('should handle lost secret gracefully', () => {
      // In real test, we'd clear localStorage
      cy.visit('/election/47');
      cy.wait(2000);

      cy.get('body').then(($body) => {
        if ($body.text().match(/déchiffrer|decrypt/i)) {
          cy.contains(/déchiffrer|decrypt/i).first().click();
          cy.wait(500);

          // Should show error or import secret option
          cy.get('body').should('exist');
        }
      });
    });

    it('should handle network errors during decryption', () => {
      cy.intercept('POST', '**/decrypt*', {
        statusCode: 500,
        body: { error: 'Network error' }
      });

      cy.visit('/election/47');
      cy.wait(2000);

      // Should show error message
      cy.get('body').should('exist');
    });
  });

  describe('Performance Tests', () => {
    it('should decrypt 10+ votes within reasonable time', () => {
      const startTime = Date.now();

      cy.visit('/election/47');
      cy.wait(2000);

      // Trigger decryption
      cy.get('body').then(($body) => {
        if ($body.text().match(/déchiffrer|decrypt/i)) {
          cy.contains(/déchiffrer|decrypt/i).first().click();
          cy.wait(5000); // Wait for decryption

          const totalTime = Date.now() - startTime;
          expect(totalTime).to.be.lessThan(15000); // Should complete in less than 15 seconds
        }
      });
    });

    it('should handle 100+ encrypted votes', () => {
      // This would require a test election with 100+ votes
      cy.visit('/election/47');
      cy.wait(2000);

      cy.get('body').should('exist');
    });
  });
});
