# DEMOCRATIX - Guide de Démarrage Rapide (Quickstart)

**Version** : 1.0
**Public** : Développeurs souhaitant contribuer au projet

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 18+ et npm
- **Rust** 1.70+ (pour les smart contracts)
- **Git**
- **mxpy** (MultiversX CLI)
- **Docker** (optionnel, pour l'environnement local)

---

## Installation Rapide

### 1. Cloner le Repository

```bash
git clone https://github.com/[votre-org]/democratix.git
cd democratix
```

### 2. Installer les Dépendances

#### Backend
```bash
cd backend
npm install
# ou
yarn install
```

#### Frontend
```bash
cd frontend
npm install
```

#### Smart Contracts
```bash
cd contracts
# Les dépendances Rust sont gérées par Cargo
cargo build
```

### 3. Configuration Environnement

Copiez le fichier d'exemple et configurez :

```bash
cp .env.example .env
```

Éditez `.env` :
```bash
# Blockchain
MULTIVERSX_NETWORK=devnet
MULTIVERSX_GATEWAY_URL=https://devnet-gateway.multiversx.com
MULTIVERSX_API_URL=https://devnet-api.multiversx.com

# Smart Contracts
VOTER_REGISTRY_CONTRACT=erd1...
VOTING_CONTRACT=erd1...
RESULTS_CONTRACT=erd1...

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/democratix

# API
API_PORT=3000
API_SECRET=your-secret-key-change-me

# IPFS
IPFS_GATEWAY=https://ipfs.io/ipfs/
IPFS_API=http://localhost:5001
```

### 4. Lancer la Base de Données

#### Avec Docker (recommandé)
```bash
docker-compose up -d postgres
```

#### Sans Docker
Installez PostgreSQL et créez la base :
```sql
CREATE DATABASE democratix;
```

Puis appliquez les migrations :
```bash
cd backend
npm run migrate
```

### 5. Déployer les Smart Contracts (Devnet)

```bash
cd contracts

# Compiler
mxpy contract build

# Déployer le registre des électeurs
mxpy contract deploy \
  --project=voter-registry \
  --pem=wallet.pem \
  --gas-limit=60000000 \
  --proxy=https://devnet-gateway.multiversx.com \
  --recall-nonce \
  --send

# Déployer le contrat de vote
mxpy contract deploy \
  --project=voting \
  --pem=wallet.pem \
  --gas-limit=60000000 \
  --proxy=https://devnet-gateway.multiversx.com \
  --recall-nonce \
  --send
```

**Note** : Sauvegardez les adresses de contrats retournées et mettez à jour `.env`.

### 6. Lancer le Backend

```bash
cd backend
npm run dev
```

API disponible sur : `http://localhost:3000`

### 7. Lancer le Frontend

```bash
cd frontend
npm run dev
```

Interface disponible sur : `http://localhost:5173` (Vite) ou `http://localhost:3001`

---

## Première Utilisation

### Créer une Élection de Test

#### Via l'API

```bash
curl -X POST http://localhost:3000/api/elections \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Election",
    "description": "My first test election",
    "startTime": "2025-02-01T08:00:00Z",
    "endTime": "2025-02-01T20:00:00Z",
    "candidates": [
      {"name": "Candidate A", "description": "Description A"},
      {"name": "Candidate B", "description": "Description B"}
    ]
  }'
```

#### Via l'Interface Web

1. Ouvrez `http://localhost:5173`
2. Connectez votre wallet MultiversX (extension navigateur)
3. Cliquez sur "Créer une élection"
4. Remplissez le formulaire
5. Signez la transaction

### S'Enregistrer comme Électeur

```bash
curl -X POST http://localhost:3000/api/voters/register \
  -H "Content-Type: application/json" \
  -d '{
    "electionId": "1",
    "credentialProof": "zk-proof-here"
  }'
```

**Note** : En mode dev, la vérification zk-SNARK est désactivée pour simplifier les tests.

### Voter

```bash
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "electionId": "1",
    "votingToken": "token-here",
    "encryptedVote": "encrypted-choice-here",
    "proof": "zk-proof-here"
  }'
```

### Consulter les Résultats

```bash
curl http://localhost:3000/api/elections/1/results
```

---

## Structure du Projet

```
democratix/
├── contracts/              # Smart contracts Rust
│   ├── voter-registry/    # Enregistrement électeurs
│   ├── voting/            # Contrat de vote
│   └── results/           # Dépouillement
│
├── backend/               # API Node.js/TypeScript
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── models/       # Modèles de données
│   │   ├── routes/       # Routes API
│   │   ├── services/     # Services (blockchain, crypto)
│   │   └── utils/        # Utilitaires
│   ├── tests/
│   └── package.json
│
├── frontend/              # Interface React/Vue
│   ├── src/
│   │   ├── components/   # Composants UI
│   │   ├── pages/        # Pages
│   │   ├── hooks/        # Hooks React
│   │   ├── services/     # API clients
│   │   └── utils/
│   └── package.json
│
├── crypto/                # Bibliothèque cryptographie
│   ├── zk-snarks/        # Circuits zk-SNARKs
│   ├── blind-sig/        # Blind signatures
│   └── homomorphic/      # Chiffrement homomorphique
│
├── docs/                  # Documentation
│   ├── WHITEPAPER.md
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── scripts/               # Scripts utilitaires
│   ├── deploy.sh         # Déploiement
│   ├── setup-dev.sh      # Setup environnement dev
│   └── tests.sh          # Lancer tous les tests
│
├── docker-compose.yml     # Services (DB, IPFS, etc.)
├── .env.example           # Variables d'environnement
├── LICENSE                # AGPL-3.0
└── README.md              # Documentation principale
```

---

## Tests

### Tests Smart Contracts

```bash
cd contracts/voter-registry
cargo test

cd ../voting
cargo test
```

### Tests Backend

```bash
cd backend
npm run test           # Tests unitaires
npm run test:e2e       # Tests end-to-end
npm run test:coverage  # Couverture de code
```

### Tests Frontend

```bash
cd frontend
npm run test           # Jest + React Testing Library
npm run test:e2e       # Cypress/Playwright
```

### Tests d'Intégration Complète

```bash
# Depuis la racine du projet
./scripts/tests.sh
```

---

## Développement

### Linter & Formatage

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
npm run format

# Smart Contracts
cd contracts
cargo clippy
cargo fmt
```

### Pre-commit Hooks

Nous utilisons Husky pour les pre-commit hooks :

```bash
npm install -g husky
husky install
```

Les hooks vérifient automatiquement :
- Formatage du code
- Tests unitaires
- Linting

### Hot Reload

Tous les environnements supportent le hot reload :
- Backend : `nodemon` relance automatiquement
- Frontend : `Vite` met à jour instantanément
- Contracts : Recompilation manuelle nécessaire

---

## Contribution

### Workflow Git

1. **Forkez** le repository
2. **Créez une branche** : `git checkout -b feature/ma-feature`
3. **Committez** : `git commit -m "feat: ajout de ma feature"`
4. **Pushez** : `git push origin feature/ma-feature`
5. **Ouvrez une Pull Request**

### Convention de Commits

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage
- `refactor:` Refactorisation
- `test:` Ajout de tests
- `chore:` Tâches de maintenance

**Exemples** :
```
feat(voting): add homomorphic tallying
fix(api): resolve race condition in vote submission
docs(readme): update installation steps
```

### Code Review

Toute PR doit :
- ✅ Passer tous les tests
- ✅ Avoir >80% de couverture de code (nouveaux fichiers)
- ✅ Être approuvée par 2 mainteneurs
- ✅ Respecter le style guide
- ✅ Inclure des tests

---

## Déploiement

### Environnements

| Environnement | Blockchain | URL | Usage |
|---------------|------------|-----|-------|
| **Development** | Localnet | localhost | Dev local |
| **Devnet** | MultiversX Devnet | devnet.democratix.vote | Tests internes |
| **Testnet** | MultiversX Testnet | testnet.democratix.vote | Tests publics |
| **Mainnet** | MultiversX Mainnet | democratix.vote | Production |

### Déployer sur Devnet

```bash
# Vérifier que .env pointe sur devnet
export MULTIVERSX_NETWORK=devnet

# Déployer les contrats
cd contracts
./scripts/deploy-devnet.sh

# Déployer le backend (Heroku/Railway)
cd backend
git push devnet main

# Déployer le frontend (Vercel/Netlify)
cd frontend
npm run build
vercel --prod
```

### Déployer sur Mainnet

⚠️ **Nécessite une revue de sécurité complète**

```bash
# Audit de sécurité obligatoire
npm run audit

# Déployer les contrats (nécessite multi-sig)
cd contracts
./scripts/deploy-mainnet.sh --multi-sig

# Déployer l'infrastructure
terraform apply -var-file=mainnet.tfvars
```

---

## Dépannage

### Problème : "Cannot connect to MultiversX Gateway"

**Solution** :
```bash
# Vérifiez la connexion réseau
curl https://devnet-gateway.multiversx.com/network/config

# Vérifiez votre .env
cat .env | grep MULTIVERSX_GATEWAY_URL
```

### Problème : "Contract deployment failed"

**Solution** :
```bash
# Vérifiez votre wallet PEM
mxpy wallet pem-address wallet.pem

# Vérifiez le solde (besoin de EGLD pour le gas)
mxpy account get --address=erd1... --proxy=https://devnet-gateway.multiversx.com

# Obtenez des EGLD de test
# Visitez : https://devnet-wallet.multiversx.com/faucet
```

### Problème : "Database connection refused"

**Solution** :
```bash
# Si vous utilisez Docker
docker-compose ps
docker-compose logs postgres

# Vérifiez que PostgreSQL écoute
netstat -an | grep 5432

# Testez la connexion
psql -h localhost -U user -d democratix
```

### Problème : "zk-SNARK proof generation failed"

**Solution** :
```bash
# En dev, désactivez la vérification zk-SNARK
export SKIP_ZK_VERIFICATION=true

# Vérifiez que les circuits sont compilés
cd crypto/zk-snarks
npm run compile-circuits
```

---

## Ressources Utiles

### Documentation
- [Whitepaper DEMOCRATIX](./WHITEPAPER.md)
- [Architecture Technique](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [MultiversX Docs](https://docs.multiversx.com)

### Communauté
- **Discord** : [discord.gg/democratix](https://discord.gg/democratix)
- **Forum** : [forum.democratix.vote](https://forum.democratix.vote)
- **Twitter** : [@democratix_vote](https://twitter.com/democratix_vote)

### Tutoriels
- [Créer votre première élection](./docs/tutorials/first-election.md)
- [Implémenter un nouveau type de vote](./docs/tutorials/custom-vote-type.md)
- [Contribuer aux smart contracts](./docs/tutorials/contributing-contracts.md)

---

## FAQ

**Q : Puis-je utiliser DEMOCRATIX pour une vraie élection ?**
R : Pas encore. Le projet est en développement actif. Attendez la certification ANSSI (prévue Q4 2026).

**Q : Quelle blockchain utilise DEMOCRATIX ?**
R : MultiversX (anciennement Elrond), choisie pour sa vitesse, son faible coût et sa sécurité.

**Q : Le projet est-il vraiment open source ?**
R : Oui, 100% open source sous licence AGPL-3.0. Tout le code est public et auditable.

**Q : Comment puis-je contribuer ?**
R : Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines détaillées.

**Q : Où sont stockées les données personnelles ?**
R : Aucune donnée personnelle n'est stockée on-chain. L'identité est vérifiée hors-chaîne avec des credentials vérifiables.

---

## Support

**Problème technique ?** Ouvrez une issue : [GitHub Issues](https://github.com/[org]/democratix/issues)

**Question générale ?** Rejoignez notre Discord : [discord.gg/democratix](https://discord.gg/democratix)

**Partenariat/Business ?** contact@democratix.vote

---

Bon développement ! 🗳️✨

*"Code is law, but democracy is code."*
