# Tests End-to-End - Vote Privé zk-SNARK

**Date**: 31 Octobre 2025
**Version**: v0.8.0
**Status**: 📝 **EN COURS**

---

## 📊 Vue d'Ensemble

Ce document décrit le plan de tests complets pour valider l'implémentation du vote privé avec zk-SNARK dans DEMOCRATIX.

---

## 🎯 Objectifs des Tests

### Tests Backend API
1. Vérifier que le service zkVerifier s'initialise correctement
2. Valider la vérification des preuves zk-SNARK
3. Tester la génération de signatures backend
4. Valider les endpoints API

### Tests Smart Contract
1. Vérifier l'acceptation des votes privés
2. Tester la prévention du double vote (nullifiers)
3. Valider la vérification des signatures backend
4. Tester les événements émis

### Tests Frontend
1. Vérifier la génération de preuves côté client
2. Tester le flux complet de soumission
3. Valider les mises à jour UI (modal de progression)
4. Tester la gestion des erreurs

### Tests d'Intégration
1. Flux complet: Frontend → Backend → Blockchain
2. Scénarios d'erreur et récupération
3. Tests de charge (multiple votes simultanés)

---

## 🧪 Plan de Tests Backend API

### Test 1: Santé du Service zk-SNARK

**Endpoint**: `GET /api/zk/health`

**Commande curl**:
```bash
curl http://localhost:5000/api/zk/health
```

**Réponse attendue**:
```json
{
  "status": "healthy",
  "initialized": true,
  "verificationKeys": {
    "validVote": true,
    "voterEligibility": true
  },
  "timestamp": "2025-10-31T..."
}
```

**Critères de succès**:
- ✅ Status HTTP 200
- ✅ `initialized: true`
- ✅ Les deux verification keys chargées

---

### Test 2: Vérification d'une Preuve de Vote

**Endpoint**: `POST /api/zk/verify-vote`

**Fichier de test**: `backend/tests/fixtures/valid_vote_proof.json`

**Commande curl**:
```bash
curl -X POST http://localhost:5000/api/zk/verify-vote \
  -H "Content-Type: application/json" \
  -d @backend/tests/fixtures/valid_vote_proof.json
```

**Corps de la requête** (exemple):
```json
{
  "proof": {
    "pi_a": ["0x1234...", "0x5678...", "1"],
    "pi_b": [
      ["0xabcd...", "0xef01..."],
      ["0x2345...", "0x6789..."],
      ["1", "0"]
    ],
    "pi_c": ["0x9abc...", "0xdef0...", "1"],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": [
    "1",  // electionId
    "5",  // numCandidates
    "0x7a3f2c1b8d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b" // voteCommitment
  ]
}
```

**Réponse attendue**:
```json
{
  "verified": true,
  "voteInfo": {
    "electionId": 1,
    "numCandidates": 5,
    "voteCommitment": "0x7a3f2c1b8d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
  },
  "signature": "a1b2c3d4e5f6...89abcdef",
  "timestamp": "2025-10-31T..."
}
```

**Critères de succès**:
- ✅ Status HTTP 200
- ✅ `verified: true`
- ✅ `voteInfo` parsé correctement
- ✅ `signature` généré (longueur >= 64)

**Test d'échec** (preuve invalide):
```bash
curl -X POST http://localhost:5000/api/zk/verify-vote \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {"pi_a": ["0", "0", "1"], "pi_b": [[...]], "pi_c": ["0", "0", "1"]},
    "publicSignals": ["1", "5", "0x00"]
  }'
```

**Réponse attendue**:
```json
{
  "verified": false,
  "error": "Invalid proof"
}
```

---

### Test 3: Vérification d'une Preuve d'Éligibilité

**Endpoint**: `POST /api/zk/verify-eligibility`

**Commande curl**:
```bash
curl -X POST http://localhost:5000/api/zk/verify-eligibility \
  -H "Content-Type: application/json" \
  -d @backend/tests/fixtures/eligibility_proof.json
```

**Réponse attendue**:
```json
{
  "verified": true,
  "eligibilityInfo": {
    "merkleRoot": "0xabcdef...",
    "electionId": 1
  },
  "signature": "...",
  "timestamp": "..."
}
```

---

### Test 4: Vérification Complète

**Endpoint**: `POST /api/zk/verify-complete`

**Description**: Vérifie à la fois l'éligibilité ET la validité du vote

**Réponse attendue**:
```json
{
  "verified": true,
  "eligibilityValid": true,
  "voteValid": true,
  "signature": "...",
  "timestamp": "..."
}
```

---

## ⛓️ Plan de Tests Smart Contract

### Setup de Test

**Prérequis**:
1. Smart contract déployé sur devnet
2. Adresse backend verifier configurée
3. Élection active créée

**Configuration**:
```bash
# 1. Déployer le contract
mxpy contract deploy ...

# 2. Configurer le backend verifier
mxpy contract call $CONTRACT_ADDRESS \
  --function setBackendVerifier \
  --arguments $BACKEND_ADDRESS \
  --pem wallet-owner.pem \
  --gas-limit 5000000

# 3. Créer une élection de test
mxpy contract call $CONTRACT_ADDRESS \
  --function createElection \
  ...
```

---

### Test 5: Soumettre un Vote Privé Valide

**Endpoint SC**: `submitPrivateVote`

**Commande**:
```bash
mxpy contract call $CONTRACT_ADDRESS \
  --function submitPrivateVote \
  --arguments \
    1 \
    0x7a3f2c1b8d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b \
    0x9f8e7d6c5b4a3928170615140312110009080706050403020100a1b2c3d4e5f6 \
    "validBackendSignature123456789012345678901234567890123456789012345678901234567890" \
  --pem wallet-voter.pem \
  --gas-limit 20000000 \
  --recall-nonce
```

**Vérifications**:
```bash
# 1. Vérifier que le vote est stocké
mxpy contract query $CONTRACT_ADDRESS \
  --function getPrivateVotes \
  --arguments 1

# 2. Vérifier que le nullifier est marqué comme utilisé
# (pas d'endpoint direct, mais le prochain test le validera)

# 3. Vérifier l'événement émis
mxpy contract query $CONTRACT_ADDRESS \
  --function getElection \
  --arguments 1
# Devrait montrer total_votes += 1
```

**Critères de succès**:
- ✅ Transaction réussie (status: success)
- ✅ Event `privateVoteSubmitted` émis
- ✅ `total_votes` incrémenté de 1
- ✅ Nullifier ajouté au set

---

### Test 6: Prévention du Double Vote

**Description**: Essayer de soumettre le même vote deux fois (même nullifier)

**Commande**:
```bash
# Même commande que Test 5, mais exécutée une 2ème fois
mxpy contract call $CONTRACT_ADDRESS \
  --function submitPrivateVote \
  --arguments \
    1 \
    0x7a3f2c1b8d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b \
    0x9f8e7d6c5b4a3928170615140312110009080706050403020100a1b2c3d4e5f6 \
    "validBackendSignature123456789012345678901234567890123456789012345678901234567890" \
  --pem wallet-voter.pem \
  --gas-limit 20000000
```

**Réponse attendue**: ❌ Transaction échouée

**Message d'erreur attendu**: `"Nullifier déjà utilisé"`

**Critères de succès**:
- ✅ Transaction échouée (status: fail)
- ✅ Message d'erreur correct
- ✅ `total_votes` inchangé

---

### Test 7: Signature Backend Invalide

**Description**: Essayer de soumettre un vote avec une signature backend trop courte

**Commande**:
```bash
mxpy contract call $CONTRACT_ADDRESS \
  --function submitPrivateVote \
  --arguments \
    1 \
    0x7a3f2c1b8d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b \
    0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \
    "shortSignature" \
  --pem wallet-voter.pem \
  --gas-limit 20000000
```

**Réponse attendue**: ❌ Transaction échouée

**Message d'erreur attendu**: `"Signature backend invalide (longueur)"`

---

### Test 8: Vote Hors Période

**Description**: Essayer de voter avant le début ou après la fin de l'élection

**Setup**:
```bash
# Créer une élection qui n'a pas encore commencé
mxpy contract call $CONTRACT_ADDRESS \
  --function createElection \
  --arguments \
    "Test Election" \
    9999999999 \  # startTime dans le futur
    9999999999 \  # endTime dans le futur
    ...
```

**Commande**:
```bash
mxpy contract call $CONTRACT_ADDRESS \
  --function submitPrivateVote \
  --arguments 2 0x... 0x... "signature..." \
  --pem wallet-voter.pem \
  --gas-limit 20000000
```

**Réponse attendue**: ❌ Transaction échouée

**Message d'erreur attendu**: `"Élection non active"`

---

## 🖥️ Plan de Tests Frontend

### Test 9: Flux Complet UI - Vote Privé

**Prérequis**:
1. Frontend démarré (`npm run dev`)
2. Backend API en cours d'exécution
3. Smart contract déployé
4. Élection active disponible

**Étapes manuelles**:

1. **Navigation**:
   - Aller sur `http://localhost:5173`
   - Se connecter avec un wallet de test
   - Naviguer vers une élection active

2. **Sélection**:
   - Sélectionner un candidat
   - Vérifier que le bouton "Vote Privé zk-SNARK" est activé

3. **Soumission**:
   - Cliquer sur "Vote Privé zk-SNARK"
   - Observer le modal de progression s'afficher

4. **Vérification du Modal**:
   - ✅ Étape 1 (10%): "Vérification service zk-SNARK" → icône ⏳ puis ✅
   - ✅ Étape 2 (20%): "Préparation clés cryptographiques" → icône ⏳ puis ✅
   - ✅ Étape 3 (40%): "Génération preuve zk-SNARK" → icône ⏳ puis ✅
   - ✅ Étape 4 (70%): "Préparation transaction blockchain" → icône ⏳ puis ✅
   - ✅ Étape 5 (90%): "Signature et envoi transaction" → icône ⏳ puis ✅
   - ✅ Barre de progression atteint 100%

5. **Signature Wallet**:
   - Modal de signature MultiversX apparaît
   - Signer la transaction
   - Attendre la confirmation

6. **Vérification**:
   - ✅ Message de succès: "Vote privé enregistré avec succès! 🔐"
   - ✅ Redirection vers `/election/:id`
   - ✅ Vote count incrémenté

**Console Logs Attendus**:
```
🔐 ========== START PRIVATE VOTE (zk-SNARK) ==========
🔐 Election ID: 1
🔐 Candidate ID: 2
🔐 Number of candidates: 5
🔐 Voter address: erd1...
📡 Step 1: Checking zk-SNARK service health...
✅ zk-SNARK service is healthy
🔑 Step 2: Loading/generating voter secret...
🔑 Existing voter secret loaded
⏳ Step 3: Preparing private vote (proof generation + verification)...
✅ Private vote prepared: { electionId: 1, commitment: "7a3f2c1b8d9e4f5a...", ... }
🔨 Step 4: Creating blockchain transaction...
✅ Transaction created
✍️ Step 5: Signing and sending transaction...
✅ Private vote transaction sent! Session ID: ...
🔐 ========== END PRIVATE VOTE (zk-SNARK) ==========
```

---

### Test 10: Gestion d'Erreur - Backend Indisponible

**Setup**:
1. Arrêter le backend API
2. Ouvrir le frontend

**Étapes**:
1. Sélectionner un candidat
2. Cliquer sur "Vote Privé zk-SNARK"
3. Observer l'erreur à l'Étape 1 (10%)

**Résultat attendu**:
- ❌ Modal affiche une erreur
- ❌ Message: "Erreur lors du vote privé. Veuillez réessayer."
- ✅ Modal se ferme
- ✅ Console affiche l'erreur complète

---

### Test 11: Gestion d'Erreur - Preuve Invalide

**Setup**:
1. Modifier `zkProofService.generateVoteProof()` pour retourner une preuve invalide
2. Tester le flux complet

**Résultat attendu**:
- ❌ Erreur à l'Étape 3 (40%)
- ❌ Message: "Proof verification failed"

---

## 🔄 Tests d'Intégration Complets

### Test 12: Flux E2E - Multiple Votes

**Description**: Tester plusieurs votes privés simultanés pour vérifier la robustesse

**Setup**:
1. Créer 5 wallets de test
2. Backend et frontend en cours d'exécution
3. Élection active avec 3 candidats

**Étapes**:
1. Ouvrir 5 onglets de navigateur
2. Se connecter avec un wallet différent dans chaque onglet
3. Soumettre un vote privé simultanément depuis les 5 onglets
4. Vérifier que tous les votes sont acceptés

**Vérifications**:
- ✅ 5 transactions réussies
- ✅ `total_votes` = 5
- ✅ 5 nullifiers uniques stockés
- ✅ 5 événements `privateVoteSubmitted` émis
- ✅ Aucune collision de nullifiers

---

### Test 13: Comparaison Standard vs Privé

**Description**: Tester que les deux modes de vote coexistent correctement

**Étapes**:
1. Voter en mode standard avec Wallet A
2. Voter en mode privé avec Wallet B
3. Vérifier les résultats

**Vérifications**:
- ✅ Vote standard stocké dans `votes(electionId)`
- ✅ Vote privé stocké dans `private_votes(electionId)`
- ✅ `total_votes` = 2
- ✅ Les deux comptent dans les résultats finaux

---

## 📊 Résultats Attendus

### Backend API
| Test | Endpoint | Status | Notes |
|------|----------|--------|-------|
| 1 | GET /api/zk/health | ⏳ Pending | Service initialization |
| 2 | POST /api/zk/verify-vote | ⏳ Pending | Valid proof verification |
| 2b | POST /api/zk/verify-vote | ⏳ Pending | Invalid proof rejection |
| 3 | POST /api/zk/verify-eligibility | ⏳ Pending | Eligibility check |
| 4 | POST /api/zk/verify-complete | ⏳ Pending | Complete verification |

### Smart Contract
| Test | Function | Status | Notes |
|------|----------|--------|-------|
| 5 | submitPrivateVote | ⏳ Pending | Valid vote acceptance |
| 6 | submitPrivateVote | ⏳ Pending | Double vote prevention |
| 7 | submitPrivateVote | ⏳ Pending | Invalid signature rejection |
| 8 | submitPrivateVote | ⏳ Pending | Time window validation |

### Frontend
| Test | Feature | Status | Notes |
|------|---------|--------|-------|
| 9 | Vote Privé UI | ⏳ Pending | Complete flow |
| 10 | Error Handling | ⏳ Pending | Backend unavailable |
| 11 | Error Handling | ⏳ Pending | Invalid proof |

### Intégration
| Test | Scenario | Status | Notes |
|------|----------|--------|-------|
| 12 | Multiple simultaneous votes | ⏳ Pending | Concurrency test |
| 13 | Standard + Private coexistence | ⏳ Pending | Hybrid mode test |

---

## 🚧 Problèmes Bloquants Actuels

### Backend Compilation Errors

**Fichier**: `backend/src/services/multiversxService.ts`

**Erreurs**:
```typescript
// Ligne 101 & 284: Struct.fromJSON does not exist
const result = Struct.fromJSON(rawData);
// Error: Property 'fromJSON' does not exist on type 'typeof Struct'

// Ligne 118, 226, 298, 322, 346: IChainID type mismatch
new Transaction({ chainID: process.env.CHAIN_ID })
// Error: Argument of type 'string | number' is not assignable to parameter of type 'IChainID'

// Ligne 366: Expected 1 arguments, but got 2
someFunction(arg1, arg2);
// Error: Expected 1 arguments, but got 2
```

**Fichier**: `backend/src/routes/elections.ts`

**Erreurs**:
```typescript
// Ligne 14: ZodEffects does not have .extend()
const schema = zodSchema.extend({ ... });
// Error: Property 'extend' does not exist on type 'ZodEffects<...>'
```

**Impact**: 🔴 **Bloque tous les tests backend et E2E**

**Solution requise**: Corriger ces erreurs avant de pouvoir exécuter les tests

---

## 📝 Procédure de Test

### Phase 1: Correction des Erreurs Backend ⏳
1. Fixer les erreurs de compilation TypeScript
2. Vérifier que le backend démarre correctement
3. Valider l'initialisation du zkVerifier

### Phase 2: Tests Unitaires Backend ⏳
1. Exécuter Tests 1-4 (API endpoints)
2. Documenter les résultats
3. Créer des fixtures de test réutilisables

### Phase 3: Tests Smart Contract ⏳
1. Déployer le contract sur devnet
2. Exécuter Tests 5-8
3. Documenter les résultats

### Phase 4: Tests Frontend ⏳
1. Exécuter Tests 9-11
2. Capturer des screenshots
3. Documenter le comportement

### Phase 5: Tests d'Intégration ⏳
1. Exécuter Tests 12-13
2. Analyser les performances
3. Documenter les résultats

---

## 📈 Métriques de Succès

### Fonctionnalité
- ✅ 100% des tests backend passent
- ✅ 100% des tests smart contract passent
- ✅ 100% des tests frontend passent
- ✅ Flux E2E complet fonctionne sans erreur

### Performance
- ⏱️ Génération de preuve < 5 secondes
- ⏱️ Vérification backend < 1 seconde
- ⏱️ Transaction blockchain < 10 secondes
- ⏱️ Flux complet < 30 secondes

### Sécurité
- 🔒 Nullifiers uniques garantis
- 🔒 Double vote impossible
- 🔒 Signature backend obligatoire
- 🔒 Preuves invalides rejetées

---

**Dernière mise à jour**: 31 Octobre 2025
**Auteur**: Claude
**Version**: v0.8.0
**Status**: 📝 Documentation complète, tests en attente de correction backend
