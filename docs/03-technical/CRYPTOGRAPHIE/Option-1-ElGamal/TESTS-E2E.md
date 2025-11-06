# Tests E2E - Option 1 ElGamal

Guide complet pour exécuter et comprendre les tests End-to-End de l'Option 1 (Vote privé avec chiffrement ElGamal).

---

## Table des matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Exécution des tests](#exécution-des-tests)
5. [Structure des tests](#structure-des-tests)
6. [Couverture des tests](#couverture-des-tests)
7. [Dépannage](#dépannage)

---

## Introduction

Le fichier `frontend/cypress/e2e/08-elgamal-private-voting.cy.ts` contient les tests E2E complets pour valider le flux de vote privé avec chiffrement ElGamal.

**Ce qui est testé** :
- ✅ Création d'élection avec vote privé activé
- ✅ Configuration du chiffrement ElGamal (génération de clés)
- ✅ Ajout de co-organisateurs avec permissions spécifiques
- ✅ Activation de l'élection
- ✅ Vote avec chiffrement ElGamal
- ✅ Clôture de l'élection
- ✅ Déchiffrement des votes
- ✅ Finalisation et affichage des résultats combinés
- ✅ Gestion des erreurs et cas limites

---

## Prérequis

### 1. Node.js et npm
```bash
node --version  # v18.0.0 ou supérieur
npm --version   # v9.0.0 ou supérieur
```

### 2. Cypress
```bash
cd frontend
npm install --save-dev cypress
```

### 3. Backend et Smart Contract
- Backend DEMOCRATIX en cours d'exécution sur `http://localhost:3000`
- Smart contract déployé sur MultiversX Devnet
- Base de données PostgreSQL accessible

### 4. Wallet MultiversX (pour tests manuels)
- Extension xPortal ou Defi Wallet
- Compte avec EGLD pour les transactions
- Adresse wallet configurée dans Cypress

---

## Installation

### Étape 1 : Installer les dépendances

```bash
cd frontend
npm install
```

### Étape 2 : Configurer Cypress

Créez ou vérifiez le fichier `frontend/cypress.config.ts` :

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // Configuration des événements
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
  },
});
```

### Étape 3 : Configurer le support Cypress

Créez `frontend/cypress/support/e2e.ts` :

```typescript
// Import commands
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on React errors
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});

// Before each test
beforeEach(() => {
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();
});
```

### Étape 4 : Créer les commandes custom (optionnel)

Créez `frontend/cypress/support/commands.ts` :

```typescript
// Custom command to mock wallet connection
Cypress.Commands.add('mockWalletConnection', (address: string) => {
  cy.window().then((win) => {
    // Mock MultiversX wallet
    win.localStorage.setItem('walletAddress', address);
    win.localStorage.setItem('walletProvider', 'extension');
  });
});

// Custom command to wait for blockchain transaction
Cypress.Commands.add('waitForTransaction', () => {
  cy.wait(3000); // Wait for transaction to be processed
});

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      mockWalletConnection(address: string): Chainable<void>;
      waitForTransaction(): Chainable<void>;
    }
  }
}

export {};
```

---

## Exécution des tests

### Mode Interactif (Recommandé pour développement)

```bash
cd frontend
npm run test:e2e
```

Ou directement avec Cypress :

```bash
npx cypress open
```

**Ensuite** :
1. Sélectionnez "E2E Testing"
2. Choisissez un navigateur (Chrome recommandé)
3. Cliquez sur `08-elgamal-private-voting.cy.ts`
4. Les tests s'exécutent avec interface visuelle

**Avantages** :
- ✅ Voir l'exécution en temps réel
- ✅ Debugger facilement
- ✅ Rejouer les étapes
- ✅ Inspecter le DOM à chaque étape

---

### Mode Headless (CI/CD)

```bash
cd frontend
npx cypress run --spec "cypress/e2e/08-elgamal-private-voting.cy.ts"
```

**Options utiles** :

```bash
# Exécuter tous les tests E2E
npx cypress run

# Exécuter avec un navigateur spécifique
npx cypress run --browser chrome

# Générer une vidéo
npx cypress run --video

# Exécuter en parallèle (Cypress Cloud)
npx cypress run --record --parallel
```

---

### Mode Spécifique (Un seul describe block)

```bash
# Exécuter seulement la Phase 1
npx cypress run --spec "cypress/e2e/08-elgamal-private-voting.cy.ts" --grep "Phase 1"
```

---

## Structure des tests

Le fichier `08-elgamal-private-voting.cy.ts` est organisé en **9 phases** principales :

### Phase 1 : Create Election with Private Voting
```
✅ Navigate to create election page
✅ Display private voting option in form
✅ Enable private voting option
✅ Fill election creation form with private voting
✅ Submit election creation with private voting enabled
```

### Phase 2 : Setup ElGamal Encryption
```
✅ Display "Setup ElGamal" button for organizer
✅ Open ElGamal setup modal
✅ Display ElGamal encryption explanation in modal
✅ Generate and display personal secret
✅ Warn user to save the secret
✅ Store public key on blockchain
✅ Display ElGamal status after setup
```

### Phase 3 : Add Co-Organizers
```
✅ Display co-organizers panel
✅ Display "Add co-organizer" button
✅ Open add co-organizer form
✅ Display permission checkboxes
✅ Add co-organizer with decrypt permission
✅ Display added co-organizer in list
✅ Display warning about sharing secret
```

### Phase 4 : Activate Election
```
✅ Display activate button after ElGamal setup
✅ Activate the election
✅ Display "VOTE PRIVÉ" badge when active
```

### Phase 5 : Vote with ElGamal Encryption
```
✅ Display private vote option
✅ Select a candidate
✅ Open private vote modal
✅ Display ElGamal encryption explanation in vote modal
✅ Submit encrypted vote
✅ Show vote confirmation message
✅ Display "already voted privately" status
✅ Prevent voting twice
```

### Phase 6 : Close Election
```
✅ Close the election (organizer)
✅ Display closed status
```

### Phase 7 : Decrypt ElGamal Votes
```
✅ Display "Decrypt ElGamal votes" button
✅ Open decrypt modal
✅ Load personal secret from browser storage
✅ Display number of votes to decrypt
✅ Decrypt votes locally
✅ Show decryption progress
✅ Confirm decryption success
✅ Display decrypted votes status
```

### Phase 8 : Finalize Election
```
✅ Finalize the election
✅ Display finalized status
```

### Phase 9 : View Combined Results
```
✅ Navigate to results page
✅ Display standard votes section
✅ Display ElGamal votes section
✅ Display combined total
✅ Display vote counts for each candidate
✅ Display results chart with combined data
✅ Verify totals match individual sections
```

---

## Couverture des tests

### Tests de Sécurité

```
✅ Should not expose voter choices before decryption
✅ Should display encryption status badge
✅ Should prevent access to decrypt without secret
✅ Should allow only organizers to decrypt
✅ Should display blockchain transaction hash for verification
```

### Tests de Permissions (Co-Organizers)

```
✅ Should allow co-organizer with decrypt permission to decrypt
✅ Should prevent co-organizer without decrypt permission from decrypting
```

### Tests de Gestion d'Erreurs

```
✅ Should handle missing ElGamal public key gracefully
✅ Should handle lost secret gracefully
✅ Should handle network errors during decryption
```

### Tests de Performance

```
✅ Should decrypt 10+ votes within reasonable time
✅ Should handle 100+ encrypted votes
```

---

## Métriques de Succès

Les tests sont considérés comme réussis si :

| Métrique | Critère |
|----------|---------|
| **Taux de réussite** | 100% des tests passent |
| **Temps d'exécution** | < 5 minutes pour la suite complète |
| **Couverture fonctionnelle** | Toutes les phases du workflow ElGamal |
| **Couverture des erreurs** | Tous les cas d'erreur gérés |
| **Performance** | Déchiffrement de 10 votes < 15 secondes |

---

## Configuration Backend pour Tests

Pour exécuter les tests E2E avec succès, le backend doit être configuré :

### 1. Base de données de test

```bash
# Créer une DB de test
createdb democratix_test

# Exécuter les migrations
cd backend
npm run db:migrate:test
```

### 2. Variables d'environnement

Créez `backend/.env.test` :

```env
NODE_ENV=test
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/democratix_test
MULTIVERSX_NETWORK=devnet
MULTIVERSX_API_URL=https://devnet-api.multiversx.com
```

### 3. Démarrer le backend en mode test

```bash
cd backend
npm run start:test
```

---

## Mocking du Wallet

Pour les tests automatisés, il est recommandé de mocker les interactions wallet :

### Option 1 : Cypress Intercept

```typescript
// Dans cypress/support/e2e.ts
beforeEach(() => {
  // Mock wallet provider
  cy.intercept('POST', '**/transactions', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        txHash: '0x' + '0'.repeat(64),
        status: 'success'
      }
    });
  });
});
```

### Option 2 : Custom Command

```typescript
// Dans cypress/support/commands.ts
Cypress.Commands.add('loginAsOrganizer', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('walletAddress', 'erd1qqqqqqqqqqqqqpgq5774jcktv99uawvx3ejy2uw75uq0yv9g3d5sx2l5p3');
    win.localStorage.setItem('walletProvider', 'extension');
    win.localStorage.setItem('isLoggedIn', 'true');
  });
});

Cypress.Commands.add('loginAsVoter', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('walletAddress', 'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx');
    win.localStorage.setItem('walletProvider', 'extension');
    win.localStorage.setItem('isLoggedIn', 'true');
  });
});
```

**Utilisation** :

```typescript
it('should allow organizer to setup ElGamal', () => {
  cy.loginAsOrganizer();
  cy.visit('/election/47');
  // ... rest of test
});
```

---

## Dépannage

### Problème 1 : "Wallet not connected"

**Solution** :
```typescript
// Ajouter avant le test
cy.window().then((win) => {
  win.localStorage.setItem('walletAddress', 'erd1...');
  win.localStorage.setItem('walletProvider', 'extension');
});
```

### Problème 2 : "Transaction failed"

**Cause** : Backend non démarré ou smart contract non déployé

**Solution** :
```bash
# Vérifier le backend
curl http://localhost:3000/api/health

# Vérifier le smart contract
curl https://devnet-api.multiversx.com/accounts/{contract-address}
```

### Problème 3 : "Secret not found"

**Cause** : Le secret ElGamal n'est pas dans le localStorage

**Solution** :
```typescript
// Mock le secret avant le test de déchiffrement
cy.window().then((win) => {
  const mockSecret = 'a'.repeat(64); // 64 hex chars
  win.localStorage.setItem('elgamal_secret_47', mockSecret);
});
```

### Problème 4 : Tests timeout

**Solution** :
```typescript
// Augmenter le timeout dans cypress.config.ts
defaultCommandTimeout: 15000,
requestTimeout: 20000,
responseTimeout: 20000,
```

### Problème 5 : "Element not found"

**Cause** : Sélecteurs CSS incorrects ou éléments chargés après le test

**Solution** :
```typescript
// Utiliser cy.wait() ou cy.get() avec retry
cy.get('[data-testid="setup-elgamal-button"]', { timeout: 10000 })
  .should('be.visible')
  .click();
```

---

## Intégration CI/CD

### GitHub Actions

Créez `.github/workflows/e2e-tests.yml` :

```yaml
name: E2E Tests - ElGamal

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  cypress-run:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Start backend
        run: |
          cd backend
          npm ci
          npm run db:migrate
          npm run start &
          sleep 10

      - name: Start frontend
        run: |
          cd frontend
          npm ci
          npm run build
          npm run preview &
          sleep 5

      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          working-directory: frontend
          spec: cypress/e2e/08-elgamal-private-voting.cy.ts
          browser: chrome
          headless: true

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: frontend/cypress/screenshots

      - name: Upload videos
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: cypress-videos
          path: frontend/cypress/videos
```

---

## Amélioration Future

### Tests à ajouter :

1. **Tests de charge** :
   - 1000+ votes chiffrés
   - 10+ co-organisateurs
   - Déchiffrement parallèle

2. **Tests de sécurité avancés** :
   - Tentative de déchiffrement sans permission
   - Injection de votes chiffrés invalides
   - Attaques de replay

3. **Tests d'intégration MultiversX** :
   - Vérification on-chain des votes chiffrés
   - Validation des transactions
   - Vérification des événements blockchain

4. **Tests d'accessibilité** :
   - Conformité WCAG 2.1
   - Navigation au clavier
   - Support des lecteurs d'écran

---

## Ressources

- 📖 **Documentation Cypress** : https://docs.cypress.io
- 🔐 **ElGamal Encryption** : https://en.wikipedia.org/wiki/ElGamal_encryption
- 🌐 **MultiversX Devnet** : https://devnet-explorer.multiversx.com
- 💬 **Support DEMOCRATIX** : support@democratix.io

---

**Dernière mise à jour** : Janvier 2025
**Version** : 1.0.0
