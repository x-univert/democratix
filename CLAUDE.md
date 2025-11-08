# DEMOCRATIX - Plateforme de Vote Décentralisée

## Architecture du Projet

DEMOCRATIX est une plateforme de vote sécurisée construite sur MultiversX avec trois composants principaux:

### 1. Smart Contract (Rust - MultiversX)
- **Localisation**: `contracts/voting/`
- **Framework**: MultiversX SC Framework
- **Build**: `sc-meta all build` (via WSL)
- **Déploiement**: Devnet MultiversX

**Endpoints principaux**:
- `createElection` - Création d'élections
- `vote` - Vote standard (public)
- `submitPrivateVote` - Vote privé avec zk-SNARK
- `submitEncryptedVote` - Vote chiffré ElGamal (Option 1)
- `submitPrivateVoteWithProof` - Vote chiffré + zk-SNARK (Option 2)
- `finalizeElection` - Finalisation avec résultats

### 2. Backend (Node.js + TypeScript)
- **Localisation**: `backend/`
- **Framework**: Express.js
- **Base de données**: PostgreSQL (Prisma ORM)
- **Déploiement**: Railway
- **Port**: 3001

**Services clés**:
- `elgamalService.ts` - Déchiffrement ElGamal (Options 1 & 2)
- `zkVerifierService.ts` - Vérification preuves zk-SNARK
- `multiversxService.ts` - Interactions blockchain
- `websocketService.ts` - Notifications temps réel

### 3. Frontend (React + TypeScript + Vite)
- **Localisation**: `frontend/`
- **Framework**: React 18 + Vite
- **SDK**: @multiversx/sdk-dapp
- **Déploiement**: Vercel
- **i18n**: react-i18next (FR/EN)

**Pages principales**:
- `/elections` - Liste des élections
- `/create` - Création d'élection
- `/vote/:id` - Interface de vote
- `/results/:id` - Résultats

## Systèmes de Vote

### Option 0 - Vote Standard
Vote public classique, résultats visibles en temps réel.

### Option 1 - Vote Chiffré ElGamal
- **Chiffrement**: ElGamal sur secp256k1
- **Anonymat**: Vote chiffré, déchiffrement par l'organisateur
- **Performance**: Rapide (~20M gas)

### Option 2 - Vote Chiffré ElGamal + zk-SNARK
- **Chiffrement**: ElGamal (même que Option 1)
- **Preuve**: zk-SNARK (Groth16) pour validité du vote
- **Circuit**: `valid_vote_encrypted.circom`
- **Anonymat**: Vote chiffré + nullifier
- **Performance**: ~50M gas, 2-3s génération preuve

**Encodage des IDs candidats**:
- Smart contract: 1-indexed (1, 2, 3...)
- ElGamal encoding: `candidateId + 1` (évite multiplication par 0)
- Circuit zk-SNARK: 0-indexed pour `candidateId - 1` (contraintes)

## Standards de Code

### TypeScript
- **Style**: 2 espaces, single quotes
- **Imports**: Chemins absolus avec alias (`@/`, `hooks/`, etc.)
- **Types**: Préférer les interfaces explicites
- **Async**: Toujours `async/await`, jamais `.then()`

### React
- **Composants**: Fonctionnels avec hooks
- **State**: useState, custom hooks pour logique complexe
- **Hooks personnalisés**: Préfixer avec `use` (ex: `useGetElection`)

### Smart Contracts Rust
- **Style**: Conventions MultiversX
- **Sécurité**: Toujours valider `require!()` les inputs
- **Storage**: Minimiser les coûts de stockage

### Git
- **Messages**: Conventional Commits (feat:, fix:, docs:)
- **Branches**: `main` pour production
- **Co-Author**: Ajouter Claude dans les commits

## Commandes Importantes

### Frontend
```bash
npm run dev          # Dev server (port 5173)
npm run build        # Production build
npm run type-check   # Vérification TypeScript
```

### Backend
```bash
npm run dev          # Dev avec nodemon (port 3001)
npm run build        # Build TypeScript
npm start            # Production
```

### Smart Contract
```bash
wsl bash -c "cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/voting && sc-meta all build"
```

## Environnement

### Frontend (.env)
- `VITE_ENVIRONMENT`: 'devnet'
- `VITE_VOTING_CONTRACT_ADDRESS`: Adresse du contrat

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection
- `MULTIVERSX_API`: 'https://devnet-api.multiversx.com'
- `PORT`: 3001

## Problèmes Connus et Solutions

### Build Smart Contract
- **Problème**: Erreurs de permissions WSL
- **Solution**: Utiliser HOME=/home/univert explicitement

### zk-SNARK
- **Problème**: Circuit files 404
- **Solution**: Fichiers dans `frontend/public/circuits/` commitées

### ElGamal Encoding
- **Important**: Frontend encode `candidateId + 1`, backend déchiffre `m - 1`
- **Pas de double conversion**: Vote.tsx passe l'ID du smart contract directement

## Documentation Utile

- MultiversX Docs: https://docs.multiversx.com
- Circom Docs: https://docs.circom.io
- snarkjs: https://github.com/iden3/snarkjs
- ElGamal: https://en.wikipedia.org/wiki/ElGamal_encryption

## Notes de Développement

- **Toujours** tester les 3 options de vote lors d'une modification
- **Créer une nouvelle élection** après changement de code crypto
- **Vérifier les logs** backend pour le déchiffrement ElGamal
- **Railway** se redéploie automatiquement sur push main
- **Vercel** se redéploie automatiquement sur push main
