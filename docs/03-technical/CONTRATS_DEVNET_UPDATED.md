# Adresses des Contrats Devnet - Mis à jour

**Date** : 31 Octobre 2025
**Statut** : ✅ Synchronisé Backend/Frontend

---

## 📍 Adresses Officielles (Devnet)

### Voting Contract
```
erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl
```

### Voter Registry Contract
```
erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu
```

### Results Contract
```
erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr
```

---

## ✅ Fichiers Mis à Jour

### Backend (.env)
**Fichier** : `backend/.env`
**Lignes 11-13** :

```env
VOTING_CONTRACT_ADDRESS=erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl
VOTER_REGISTRY_CONTRACT_ADDRESS=erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu
RESULTS_CONTRACT_ADDRESS=erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr
```

**Statut** : ✅ Mis à jour le 31 Octobre 2025

---

### Frontend (config.devnet.ts)
**Fichier** : `frontend/src/config/config.devnet.ts`
**Lignes 6-8** :

```typescript
export const votingContract = process.env.VITE_VOTING_CONTRACT || 'erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl';
export const voterRegistryContract = process.env.VITE_VOTER_REGISTRY_CONTRACT || 'erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu';
export const resultsContract = process.env.VITE_RESULTS_CONTRACT || 'erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr';
```

**Statut** : ✅ Déjà à jour

---

## 🔄 Redémarrage Requis

### Pour appliquer les nouvelles adresses dans le backend

Le fichier `backend/.env` a été mis à jour, mais le backend doit être redémarré pour charger les nouvelles valeurs.

#### Option 1 : Redémarrage Manuel (RECOMMANDÉ)

**Windows** :
```bash
# 1. Arrêter le backend actuel (Ctrl+C dans le terminal backend)

# 2. Redémarrer
cd backend
npm run dev
```

#### Option 2 : Tuer le processus Node

**Windows** :
```bash
# Trouver le processus utilisant le port 3001
netstat -ano | findstr :3001

# Tuer le processus (remplacer PID par le numéro trouvé)
taskkill /PID <PID> /F

# Redémarrer
cd backend
npm run dev
```

---

## 🔍 Vérification

### Backend

Après redémarrage, vérifier les logs :

```bash
cd backend
npm run dev
```

Vous devriez voir :
```
info: MultiversXService initialized (SDK v15) {
  "votingContract": "erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl",
  "voterRegistry": "erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu",
  ...
}
```

### Frontend

Le frontend charge déjà les bonnes adresses (aucun redémarrage nécessaire si déjà en cours).

**Test** : https://localhost:3004/elections

---

## 🎯 Fonctionnalités par Contrat

### Voting Contract (`...f5h6tl`)

**Endpoints disponibles** :
- `createElection` - Créer une élection
- `addCandidate` - Ajouter un candidat
- `activateElection` - Activer une élection
- `closeElection` - Fermer une élection
- `finalizeElection` - Finaliser une élection
- `castVote` - Voter (standard)
- **`submitPrivateVote`** - ✨ Voter en mode privé zk-SNARK ✨

**Queries disponibles** :
- `getElection` - Récupérer une élection
- `getElections` - Liste des élections
- `getCandidates` - Candidats d'une élection
- `getTotalVotes` - Nombre total de votes
- `getPrivateVotes` - Votes privés (nouveauté zk-SNARK)
- `isNullifierUsed` - Vérifier nullifier (anti-double vote)

---

### Voter Registry Contract (`...ce2mtu`)

**Endpoints disponibles** :
- `registerToVote` - S'inscrire pour voter
- `registerWithCode` - S'inscrire avec code d'invitation
- `addToWhitelist` - Ajouter à la whitelist (admin)
- `generateInvitationCodes` - Générer codes d'invitation

**Queries disponibles** :
- `isVoterRegistered` - Vérifier si inscrit
- `getRegisteredVoters` - Liste des votants inscrits
- `getRegistrationStats` - Statistiques d'inscription

---

### Results Contract (`...8p9pnr`)

**Endpoints disponibles** :
- `publishResults` - Publier les résultats
- `certifyResults` - Certifier les résultats

**Queries disponibles** :
- `getResults` - Récupérer les résultats
- `getWinner` - Récupérer le gagnant
- `getResultDetails` - Détails complets

---

## 🔐 Smart Contract avec zk-SNARK

Le contrat **Voting** (`...f5h6tl`) supporte maintenant le vote privé avec zk-SNARK.

### Nouvelle Structure : PrivateVote

```rust
pub struct PrivateVote<M: ManagedTypeApi> {
    pub vote_commitment: ManagedBuffer<M>,  // Hash Poseidon du vote
    pub nullifier: ManagedBuffer<M>,         // Identifiant unique (anti-double vote)
    pub backend_signature: ManagedBuffer<M>, // Signature backend (preuve vérifiée)
    pub timestamp: u64,
}
```

### Configuration Backend Verifier

⚠️ **IMPORTANT** : Pour activer le vote privé, il faut configurer l'adresse du backend autorisé :

```bash
mxpy contract call erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl \
  --function setBackendVerifier \
  --arguments 0x<BACKEND_WALLET_ADDRESS_HEX> \
  --pem ~/wallet-owner.pem \
  --gas-limit 5000000 \
  --recall-nonce \
  --send \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D
```

### Vérifier la Configuration

```bash
mxpy contract query erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl \
  --function getBackendVerifier \
  --proxy https://devnet-gateway.multiversx.com
```

---

## 🧪 Tests

### Test 1 : Vérifier Backend Charges les Bonnes Adresses

```bash
# Après redémarrage du backend
curl http://localhost:3001/api/elections/list
```

### Test 2 : Vérifier Frontend Utilise les Bonnes Adresses

```bash
# Ouvrir la console du navigateur sur https://localhost:3004
# Vérifier les logs de transaction
```

### Test 3 : Test E2E Complet

1. Créer une élection
2. Ajouter des candidats
3. Activer l'élection
4. Voter (standard ou privé)
5. Vérifier les résultats

---

## 🔗 Liens Utiles

### Explorateur Devnet

- **Voting Contract** :
  https://devnet-explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl

- **Voter Registry Contract** :
  https://devnet-explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu

- **Results Contract** :
  https://devnet-explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr

### API Endpoints

- **Backend** : http://localhost:3001/
- **Frontend** : https://localhost:3004/
- **zk-SNARK Health** : http://localhost:3001/api/zk/health

---

## 📝 Historique des Modifications

| Date | Contrat | Ancienne Adresse | Nouvelle Adresse | Statut |
|------|---------|------------------|------------------|--------|
| 31 Oct 2025 | Voting | `...ycd3qqxgyzz7` | `...s8d3qqf5h6tl` | ✅ Mis à jour |
| 31 Oct 2025 | Results | `...p52d3qqe0vp9u` | `...u0d3qq8p9pnr` | ✅ Mis à jour |
| - | Voter Registry | `...v6d3qqce2mtu` | `...v6d3qqce2mtu` | ✅ Inchangé |

---

## ⚡ Actions Rapides

### Redémarrer tout

```bash
# Terminal 1 : Backend
cd backend
# Ctrl+C puis
npm run dev

# Terminal 2 : Frontend (optionnel si déjà actif)
cd frontend
npm run dev
```

### Tester tout

```bash
# Backend health
curl http://localhost:3001/health

# zk-SNARK health
curl http://localhost:3001/api/zk/health

# Frontend
# Ouvrir https://localhost:3004/elections
```

---

**Auteur** : Claude
**Date** : 31 Octobre 2025
**Statut** : ✅ Backend .env mis à jour, redémarrage requis
