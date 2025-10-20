# Guide de Contribution - DEMOCRATIX

Merci de votre intérêt pour contribuer à DEMOCRATIX ! Ce guide vous aidera à démarrer.

## Code de Conduite

En participant à ce projet, vous acceptez de respecter notre [Code de Conduite](CODE_OF_CONDUCT.md).

## Comment Contribuer ?

### 1. Signaler un Bug

- Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/[org]/democratix/issues)
- Créez une nouvelle issue avec le template "Bug Report"
- Incluez des détails : OS, version, logs, étapes de reproduction

### 2. Proposer une Fonctionnalité

- Créez une issue avec le template "Feature Request"
- Expliquez le cas d'usage et la valeur ajoutée
- Attendez validation de l'équipe core avant de coder

### 3. Soumettre du Code

#### Fork & Clone

```bash
# Forker sur GitHub puis :
git clone https://github.com/votre-username/democratix.git
cd democratix
git remote add upstream https://github.com/[org]/democratix.git
```

#### Créer une Branche

```bash
git checkout -b feature/ma-feature
# ou
git checkout -b fix/mon-bug
```

#### Coder

- Suivez les conventions de code (voir ci-dessous)
- Ajoutez des tests
- Mettez à jour la documentation si nécessaire

#### Tester

```bash
# Backend
cd backend && npm test

# Smart contracts
cd contracts && cargo test

# Frontend
cd frontend && npm test
```

#### Committer

Utilisez [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat(voting): add homomorphic tallying
fix(api): resolve race condition
docs(readme): update installation steps
```

Types :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage
- `refactor`: Refactorisation
- `test`: Tests
- `chore`: Maintenance

#### Pousser & Pull Request

```bash
git push origin feature/ma-feature
```

Puis créez une Pull Request sur GitHub.

## Standards de Code

### Rust (Smart Contracts)

```rust
// Utilisez cargo fmt
cargo fmt

// Vérifiez avec clippy
cargo clippy -- -D warnings

// Tests obligatoires
#[test]
fn test_create_election() {
    // ...
}
```

### TypeScript (Backend/Frontend)

```typescript
// ESLint + Prettier
npm run lint
npm run format

// Tests obligatoires
describe('Election API', () => {
  it('should create election', async () => {
    // ...
  });
});
```

## Revue de Code

Toute PR doit :
- ✅ Passer tous les tests CI
- ✅ Avoir >80% de couverture (nouveau code)
- ✅ Être approuvée par 2 mainteneurs
- ✅ Respecter les conventions

## Licence

En contribuant, vous acceptez que vos contributions soient sous licence AGPL-3.0.

## Questions ?

Rejoignez notre [Discord](https://discord.gg/democratix) ou ouvrez une issue.
