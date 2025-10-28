# Testing Guide - DEMOCRATIX Frontend

## E2E Tests with Cypress

DEMOCRATIX uses Cypress for end-to-end testing of the frontend application.

### Prerequisites

- Node.js and npm installed
- Frontend dependencies installed (`npm install`)
- Application running on `http://localhost:3000` (for interactive mode)

### Running Tests

#### Interactive Mode (Recommended for Development)

```bash
npm run test:e2e:open
```

This opens the Cypress Test Runner where you can:
- Select and run individual test files
- Watch tests run in a real browser
- Debug failed tests with DevTools
- See test execution in real-time

#### Headless Mode (CI/CD)

```bash
npm run test:e2e
```

Runs all tests in headless mode (no browser UI). Useful for:
- CI/CD pipelines
- Quick validation before commits
- Automated testing

#### Headed Mode (Debugging)

```bash
npm run test:e2e:headed
```

Runs tests in headed mode - you can see the browser while tests run. Useful for debugging test failures.

### Test Structure

Tests are organized in `frontend/cypress/e2e/`:

```
cypress/
├── e2e/
│   ├── 01-home-navigation.cy.ts      # Home page, header, footer navigation
│   ├── 02-elections-list.cy.ts       # Elections list, filters, search
│   ├── 03-election-detail.cy.ts      # Election detail page, error handling
│   ├── 04-profile-admin.cy.ts        # Profile and admin dashboard
│   ├── 05-internationalization.cy.ts # Language switching (FR/EN/ES)
│   └── 06-ui-ux.cy.ts                # Loading states, animations, responsive
├── support/
│   ├── commands.ts                    # Custom Cypress commands
│   └── e2e.ts                        # Global configuration
└── fixtures/                          # Test data (if needed)
```

### Test Coverage

The test suite covers:

#### 1. Navigation & Routing
- Home page display
- Header and footer links
- Navigation between pages
- Wallet connection button

#### 2. Elections Features
- Elections list display
- Filter tabs (All, Pending, Active, Closed, Finalized)
- Search functionality
- Election cards display
- Election detail page
- Error handling for non-existent elections

#### 3. Loading States
- Skeleton loaders on elections page
- Skeleton loaders on detail page
- Loading animations

#### 4. Error Handling
- 404 error pages
- Error messages display
- Back button functionality
- Retry button functionality

#### 5. Internationalization (i18n)
- Language switching (French, English, Spanish)
- Language persistence across navigation
- Translated content display

#### 6. Responsive Design
- Mobile viewport (iPhone X)
- Tablet viewport (iPad)
- Desktop viewport (1920x1080)

#### 7. UI/UX Features
- Hover effects on cards
- Page transitions
- Animation effects

### Custom Commands

Two custom Cypress commands are available:

#### `cy.mockWalletConnection()`
Mocks a MultiversX wallet connection by setting localStorage values.

```typescript
cy.mockWalletConnection();
cy.visit('/elections'); // Now authenticated
```

#### `cy.visitAuthenticated(url)`
Visits a URL with mocked wallet authentication.

```typescript
cy.visitAuthenticated('/profile'); // Mocks wallet and visits
```

### Writing New Tests

1. Create a new test file in `cypress/e2e/` with the `.cy.ts` extension
2. Use descriptive test names that explain what is being tested
3. Use the custom commands for authentication when needed
4. Follow the existing test structure

Example:

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.mockWalletConnection(); // If authentication needed
    cy.visit('/your-page');
  });

  it('should display expected content', () => {
    cy.contains('Expected Text').should('be.visible');
  });

  it('should handle user interaction', () => {
    cy.get('button').click();
    cy.url().should('include', '/expected-route');
  });
});
```

### Test Configuration

Cypress configuration is in `cypress.config.ts`:

```typescript
{
  baseUrl: 'http://localhost:3000',
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,                    // Disable video recording
  screenshotOnRunFailure: true     // Take screenshots on failure
}
```

### Troubleshooting

#### Tests failing with "baseUrl" error
Make sure the development server is running on `http://localhost:3000`:
```bash
npm run dev
```

#### Tests timing out
Some tests wait for API responses. Increase timeout if needed:
```typescript
cy.get('[data-testid="element"]', { timeout: 10000 }).should('exist');
```

#### Authentication issues
Use `cy.mockWalletConnection()` in `beforeEach()` for pages requiring authentication.

### CI/CD Integration

For GitHub Actions or other CI platforms:

```yaml
- name: Run Cypress tests
  run: |
    npm run dev &
    npm run test:e2e
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Mock external dependencies** (wallet, blockchain calls)
3. **Test user flows**, not implementation details
4. **Keep tests independent** - each test should run in isolation
5. **Use descriptive assertions** that explain what is expected
6. **Avoid hardcoded waits** - use Cypress's built-in retry logic

### Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library with Cypress](https://testing-library.com/docs/cypress-testing-library/intro)
