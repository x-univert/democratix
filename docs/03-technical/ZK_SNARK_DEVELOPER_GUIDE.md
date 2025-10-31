# 🔧 Guide Développeur - Système zk-SNARK DEMOCRATIX

**Audience**: Développeurs souhaitant comprendre, maintenir ou étendre le système
**Prérequis**: Connaissance JavaScript/TypeScript, bases de cryptographie
**Date**: 31 Octobre 2025
**Version**: v1.0.0

---

## 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation & Configuration](#installation--configuration)
3. [Architecture Détaillée](#architecture-détaillée)
4. [Workflows](#workflows)
5. [API Reference](#api-reference)
6. [Debugging](#debugging)
7. [Tests](#tests)
8. [Sécurité](#sécurité)
9. [FAQ Développeur](#faq-développeur)

---

## 🎯 Vue d'ensemble

### Qu'est-ce que le système fait?

Le système permet aux électeurs de voter de manière **complètement anonyme** tout en garantissant:
- ✅ Un vote par personne (anti-double vote)
- ✅ Vote valide (candidat existe)
- ✅ Résultats vérifiables
- ❌ **SANS** révéler qui a voté pour qui

### Comment ça marche en 3 étapes?

```
1. FRONTEND génère preuve zk-SNARK
   "Je vote pour un candidat valide, mais je ne dis pas lequel"

2. BACKEND vérifie la preuve
   "Ok, la preuve est mathématiquement correcte"

3. BLOCKCHAIN stocke le commitment
   "Vote enregistré, comptabilisé, mais anonyme"
```

### Technologies Clés

| Technologie | Rôle | Où? |
|-------------|------|-----|
| **Circom** | Langage pour écrire circuits cryptographiques | `backend/circuits/*.circom` |
| **snarkjs** | Génération & vérification preuves Groth16 | Frontend + Backend |
| **Poseidon** | Hash function ZK-friendly | `circomlibjs` |
| **Groth16** | Protocole de preuve zk-SNARK | Implicite dans snarkjs |

---

## 🛠️ Installation & Configuration

### Prérequis Système

```bash
# Node.js 18+
node --version  # v18.x.x ou supérieur

# npm 9+
npm --version

# Circom (pour compiler circuits)
circom --version  # 2.1.6 ou supérieur

# snarkjs CLI (pour setup)
snarkjs --version
```

### Installation Circom (si pas installé)

**Linux/macOS**:
```bash
# Installer Rust
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh

# Installer Circom
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

**Windows** (WSL recommandé):
```bash
wsl
# Puis suivre instructions Linux
```

### Installation Projet

```bash
# 1. Cloner le repo
git clone https://github.com/x-univert/DEMOCRATIX.git
cd DEMOCRATIX

# 2. Installer dépendances Backend
cd backend
npm install
# Packages clés: express, snarkjs, circomlibjs

# 3. Installer dépendances Frontend
cd ../frontend
npm install
# Packages clés: snarkjs, circomlibjs, @multiversx/sdk-dapp

# 4. Vérifier circuits (déjà compilés)
ls backend/circuits/*.circom
ls frontend/public/circuits/*.zkey
```

### Configuration Environnement

**Backend (.env)**:
```env
# Port API
API_PORT=3001

# MultiversX
MULTIVERSX_NETWORK=devnet
VOTING_CONTRACT_ADDRESS=erd1qqqq...f5h6tl

# JWT pour signatures backend
JWT_SECRET=your-secret-key-here-change-in-production

# Logging
LOG_LEVEL=debug
```

**Frontend (.env)**:
```env
# Backend API
VITE_BACKEND_API_URL=http://localhost:3001

# MultiversX
VITE_NETWORK=devnet
VITE_VOTING_CONTRACT=erd1qqqq...f5h6tl
```

### Démarrage Rapide

```bash
# Terminal 1: Backend
cd backend
npm run dev
# → Backend sur http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# → Frontend sur https://localhost:3004

# Test zk-SNARK
curl http://localhost:3001/api/zk/health
```

---

## 🏗️ Architecture Détaillée

### Diagramme de Séquence Complet

```
┌─────────┐         ┌─────────┐        ┌─────────┐        ┌──────────┐
│  User   │         │Frontend │        │ Backend │        │Blockchain│
│ (Vote)  │         │ Browser │        │ Node.js │        │MultiversX│
└────┬────┘         └────┬────┘        └────┬────┘        └────┬─────┘
     │                   │                  │                  │
     │ 1. Click "Vote"   │                  │                  │
     ├──────────────────>│                  │                  │
     │                   │                  │                  │
     │                   │ 2. Generate      │                  │
     │                   │    randomness    │                  │
     │                   │    (32 bytes)    │                  │
     │                   ├──────────────┐   │                  │
     │                   │              │   │                  │
     │                   │<─────────────┘   │                  │
     │                   │                  │                  │
     │                   │ 3. Poseidon hash │                  │
     │                   │    (commitment)  │                  │
     │                   ├──────────────┐   │                  │
     │                   │              │   │                  │
     │                   │<─────────────┘   │                  │
     │                   │                  │                  │
     │                   │ 4. Groth16 proof │                  │
     │                   │    (~1-2s WASM)  │                  │
     │                   ├──────────────┐   │                  │
     │                   │              │   │                  │
     │                   │<─────────────┘   │                  │
     │                   │                  │                  │
     │                   │ 5. POST /verify  │                  │
     │                   ├─────────────────>│                  │
     │                   │    {proof, sigs} │                  │
     │                   │                  │                  │
     │                   │                  │ 6. Verify proof  │
     │                   │                  │    (snarkjs)     │
     │                   │                  ├──────────────┐   │
     │                   │                  │              │   │
     │                   │                  │<─────────────┘   │
     │                   │                  │                  │
     │                   │ 7. Return sig    │                  │
     │                   │<─────────────────┤                  │
     │                   │    {verified,sig}│                  │
     │                   │                  │                  │
     │                   │ 8. Build TX      │                  │
     │                   │    (commitment   │                  │
     │                   │     +nullifier   │                  │
     │                   │     +signature)  │                  │
     │                   ├──────────────┐   │                  │
     │                   │              │   │                  │
     │                   │<─────────────┘   │                  │
     │                   │                  │                  │
     │                   │ 9. Send TX       │                  │
     │                   ├─────────────────────────────────────>│
     │                   │                  │                  │
     │                   │                  │                  │ 10. Verify sig
     │                   │                  │                  ├──────────┐
     │                   │                  │                  │          │
     │                   │                  │                  │<─────────┘
     │                   │                  │                  │
     │                   │                  │                  │ 11. Check
     │                   │                  │                  │     nullifier
     │                   │                  │                  ├──────────┐
     │                   │                  │                  │          │
     │                   │                  │                  │<─────────┘
     │                   │                  │                  │
     │                   │                  │                  │ 12. Store
     │                   │                  │                  │     vote
     │                   │                  │                  ├──────────┐
     │                   │                  │                  │          │
     │                   │                  │                  │<─────────┘
     │                   │                  │                  │
     │                   │ 13. Event        │                  │
     │                   │<─────────────────────────────────────┤
     │                   │    "voteSubmitted"                  │
     │ 14. Success!      │                  │                  │
     │<──────────────────┤                  │                  │
     │                   │                  │                  │
```

### Composants Principaux

#### 1. Frontend - zkProofService

**Fichier**: `frontend/src/services/zkProofService.ts`

**Responsabilités**:
- Génération randomness
- Calcul Poseidon hash (commitment + nullifier)
- Génération preuve Groth16 via snarkjs
- Communication avec backend
- Gestion secrets électeur (localStorage)

**Méthodes publiques**:
```typescript
class ZKProofService {
  // Hash functions
  async generateVoteCommitment(electionId, candidateId, randomness): Promise<string>
  async generateNullifier(electionId, identityNullifier): Promise<string>

  // Proof generation
  async generateVoteProof(electionId, candidateId, numCandidates, randomness): Promise<{proof, publicSignals}>

  // Backend communication
  async verifyVoteProof(proof, publicSignals): Promise<VerificationResponse>

  // High-level
  async preparePrivateVote(electionId, candidateId, numCandidates, voterSecret?): Promise<PrivateVoteData>

  // Secret management
  generateVoterSecret(): string
  saveVoterSecret(secret): void
  loadVoterSecret(): string | null
}
```

#### 2. Backend - zkVerifierService

**Fichier**: `backend/src/services/zkVerifierService.ts`

**Responsabilités**:
- Chargement verification keys au démarrage
- Vérification cryptographique preuves
- Génération signatures HMAC-SHA256
- Logging détaillé

**Méthodes publiques**:
```typescript
class ZKVerifierService {
  // Lifecycle
  async initializeVerificationKeys(): Promise<void>

  // Verification
  async verifyVoteProof(proof: ZKProof, publicSignals: VotePublicSignals): Promise<boolean>
  async verifyEligibilityProof(proof: ZKProof, publicSignals: EligibilityPublicSignals): Promise<boolean>

  // Signing
  signProofVerification(verified: boolean, publicSignals: any, timestamp: number): string

  // Health
  getHealthStatus(): { initialized, verificationKeysLoaded }
}
```

#### 3. Smart Contract - Rust

**Fichier**: `contracts/voting/src/lib.rs`

**Structures**:
```rust
pub struct PrivateVote<M: ManagedTypeApi> {
    pub vote_commitment: ManagedBuffer<M>,  // Poseidon hash (decimal)
    pub nullifier: ManagedBuffer<M>,         // Unique ID
    pub backend_signature: ManagedBuffer<M>, // HMAC from backend
    pub timestamp: u64,
}
```

**Endpoints**:
```rust
#[endpoint(submitPrivateVote)]
fn submit_private_vote(
    &self,
    election_id: u64,
    vote_commitment: ManagedBuffer,
    nullifier: ManagedBuffer,
    backend_signature: ManagedBuffer
) {
    // 1. Verify election active
    // 2. Verify backend signature
    // 3. Check nullifier not used
    // 4. Store vote
    // 5. Mark nullifier as used
    // 6. Emit event
}
```

---

## 🔄 Workflows

### Workflow 1: Premier Vote (Nouvel Électeur)

```typescript
// 1. Utilisateur clique "Vote Privé"
// Frontend: pages/Vote/Vote.tsx

// 2. Génération secret électeur
const voterSecret = zkProofService.generateVoterSecret();
// → "3a7f9b2e4c8d1f6a..." (32 bytes hex)

// 3. Sauvegarde localStorage
zkProofService.saveVoterSecret(voterSecret);

// 4. Préparation vote
const privateVoteData = await zkProofService.preparePrivateVote(
  electionId,      // 1
  candidateId,     // 2
  numCandidates,   // 5
  voterSecret      // Secret sauvegardé
);
// Retourne:
// {
//   electionId: 1,
//   voteCommitment: "16819160767...",
//   nullifier: "8234567891...",
//   backendSignature: "a1b2c3..."
// }

// 5. Transaction blockchain
const tx = await useSubmitPrivateVote(privateVoteData);
```

### Workflow 2: Vote Suivant (Électeur Existant)

```typescript
// 1. Charger secret sauvegardé
const voterSecret = zkProofService.loadVoterSecret();

if (!voterSecret) {
  // Erreur: secret perdu, générer nouveau
  // ATTENTION: Nouveau secret = peut re-voter!
}

// 2. Utiliser même secret
const privateVoteData = await zkProofService.preparePrivateVote(
  electionId,
  candidateId,
  numCandidates,
  voterSecret  // ← Même secret = même nullifier
);

// 3. Si même élection → Nullifier identique → Transaction rejetée ✅
// 4. Si autre élection → Nullifier différent → Vote accepté ✅
```

### Workflow 3: Compilation Nouveau Circuit

```bash
# 1. Écrire circuit
cd backend/circuits
nano my_new_circuit.circom

# 2. Compiler
circom my_new_circuit.circom --r1cs --wasm --sym --c

# 3. Télécharger Powers of Tau (si pas fait)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau

# 4. Generate zkey
snarkjs groth16 setup my_new_circuit.r1cs powersOfTau28_hez_final_15.ptau my_new_circuit_0000.zkey

# 5. Contribute to ceremony (production)
snarkjs zkey contribute my_new_circuit_0000.zkey my_new_circuit_final.zkey \
  --name="Your Name" -v

# 6. Export verification key
snarkjs zkey export verificationkey my_new_circuit_final.zkey my_new_circuit_vkey.json

# 7. Copier fichiers
cp my_new_circuit.wasm ../src/circuits/
cp my_new_circuit_final.zkey ../src/circuits/
cp my_new_circuit_vkey.json ../src/circuits/

# 8. Copier pour frontend
cp my_new_circuit.wasm ../../frontend/public/circuits/
cp my_new_circuit_final.zkey ../../frontend/public/circuits/
```

---

## 📖 API Reference

### Frontend API

#### zkProofService.generateVoteCommitment()

```typescript
async generateVoteCommitment(
  electionId: number,
  candidateId: number,
  randomness: string  // 64 char hex string
): Promise<string>    // Decimal string
```

**Exemple**:
```typescript
const commitment = await zkProofService.generateVoteCommitment(
  1,    // electionId
  2,    // candidateId
  '3a7f9b2e4c8d1f6a9e5b3c7d0f2a4e8b1d9c5a7f3e6b8d0c2f4a6e8b1d3c5a7f'
);
// → "16819160767116598339437546008197548054806700693173916401560269033225931530865"
```

**Erreurs**:
- Si randomness invalide → `Error: Invalid randomness format`
- Si Poseidon pas initialisé → `Error: Poseidon not initialized`

#### zkProofService.generateVoteProof()

```typescript
async generateVoteProof(
  electionId: number,
  candidateId: number,
  numCandidates: number,
  randomness: string
): Promise<{
  proof: ZKProof;
  publicSignals: VotePublicSignals;
}>
```

**Exemple**:
```typescript
const { proof, publicSignals } = await zkProofService.generateVoteProof(
  1,   // electionId
  2,   // candidateId
  5,   // numCandidates
  '3a7f...'
);

console.log(proof);
// {
//   pi_a: ['123...', '456...', '789...'],
//   pi_b: [['111...', '222...'], ...],
//   pi_c: ['333...', '444...', '555...'],
//   protocol: 'groth16',
//   curve: 'bn128'
// }

console.log(publicSignals);
// ['1', '5', '16819160767...']  // [electionId, numCandidates, commitment]
```

**Temps**: ~1-2 secondes

**Erreurs**:
- Si candidateId >= numCandidates → Circuit constraint fail
- Si circuit files manquants → `Error: Cannot load WASM`

### Backend API

#### POST /api/zk/verify-vote

**Request**:
```json
{
  "proof": {
    "pi_a": ["...", "...", "..."],
    "pi_b": [["...", "..."], ...],
    "pi_c": ["...", "...", "..."],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": ["1", "5", "16819160767..."]
}
```

**Response 200**:
```json
{
  "verified": true,
  "voteInfo": {
    "electionId": "1",
    "numCandidates": "5",
    "voteCommitment": "16819160767..."
  },
  "signature": "a1b2c3d4e5f6...",
  "timestamp": "2025-10-31T14:30:00.000Z"
}
```

**Response 400** (Invalid proof):
```json
{
  "verified": false,
  "error": "Invalid proof: Verification failed",
  "timestamp": "2025-10-31T14:30:00.000Z"
}
```

#### GET /api/zk/health

**Response 200**:
```json
{
  "status": "healthy",
  "initialized": true,
  "verificationKeys": {
    "valid_vote": true,
    "voter_eligibility": true
  },
  "timestamp": "2025-10-31T14:30:00.000Z"
}
```

---

## 🐛 Debugging

### Problèmes Courants

#### 1. "Cannot convert to BigInt"

**Erreur**:
```
Cannot convert 3a7f9b2e... to a BigInt
```

**Cause**: Valeur en hexadécimal passée à snarkjs (attend décimal)

**Solution**:
```typescript
// ❌ Mauvais
const value = '0x3a7f9b2e...';
snarkjs.groth16.verify(vkey, [value], proof);

// ✅ Correct
const value = BigInt('0x3a7f9b2e...').toString();
snarkjs.groth16.verify(vkey, [value], proof);
```

#### 2. "Proof verification failed"

**Causes possibles**:
1. Proof générée avec mauvais inputs
2. PublicSignals ne correspondent pas
3. Wrong verification key

**Debug**:
```typescript
// Vérifier inputs circuit
console.log('Circuit inputs:', {
  electionId,
  numCandidates,
  voteCommitment,
  candidateId,
  randomness: BigInt('0x' + randomness).toString()
});

// Vérifier publicSignals
console.log('Public signals:', publicSignals);
// Doivent être: [electionId, numCandidates, voteCommitment]

// Recalculer commitment manuellement
const expectedCommitment = await generateVoteCommitment(electionId, candidateId, randomness);
console.log('Expected commitment:', expectedCommitment);
console.log('Actual commitment:', publicSignals[2]);
// Doivent être identiques!
```

#### 3. "WASM file not found"

**Erreur**:
```
Error: Cannot load /circuits/valid_vote.wasm
```

**Solution**:
```bash
# Vérifier fichiers présents
ls frontend/public/circuits/
# Doit contenir:
# - valid_vote.wasm
# - valid_vote_final.zkey
# - voter_eligibility_simple.wasm
# - voter_eligibility_simple_final.zkey

# Si manquants, copier depuis backend
cp backend/circuits/valid_vote.wasm frontend/public/circuits/
cp backend/circuits/valid_vote_final.zkey frontend/public/circuits/
```

#### 4. "Backend signature invalid"

**Erreur blockchain**:
```
runtime error: Invalid backend signature
```

**Causes**:
1. Backend verifier address pas configurée dans SC
2. Mauvaise signature du backend

**Debug**:
```bash
# Vérifier adresse backend configurée
mxpy contract query <contract-address> \
  --function=getBackendVerifier \
  --proxy=https://devnet-gateway.multiversx.com

# Si vide, configurer:
mxpy contract call <contract-address> \
  --function=setBackendVerifier \
  --arguments=<backend-wallet-address> \
  --pem=wallet-deployer.pem \
  --gas-limit=10000000 \
  --send
```

### Logs Utiles

**Frontend (zkProofService)**:
```typescript
// Activer logs détaillés
localStorage.setItem('ZK_DEBUG', 'true');

// Dans zkProofService.ts
if (localStorage.getItem('ZK_DEBUG')) {
  console.log('🔐 Vote commitment:', commitment);
  console.log('🔒 Nullifier:', nullifier);
  console.log('📊 Circuit inputs:', circuitInputs);
}
```

**Backend (zkVerifierService)**:
```typescript
// Dans .env
LOG_LEVEL=debug

// Logs automatiques:
// info: ✅ valid_vote proof is VALID
// warn: ❌ valid_vote proof is INVALID
// debug: 🔍 Public signals: [1, 5, 16819...]
```

---

## 🧪 Tests

### Tests Unitaires Backend

```bash
cd backend
npm test

# Tests spécifiques zk-SNARK
npm test -- zkVerifierService.test.ts
```

**Exemple test**:
```typescript
describe('zkVerifierService', () => {
  it('should verify valid vote proof', async () => {
    const proof = {
      pi_a: ['123...', '456...', '789...'],
      pi_b: [['111...', '222...'], ...],
      pi_c: ['333...', '444...', '555...'],
      protocol: 'groth16',
      curve: 'bn128'
    };

    const publicSignals = ['1', '5', '16819160767...'];

    const result = await zkVerifierService.verifyVoteProof(proof, publicSignals);

    expect(result).toBe(true);
  });
});
```

### Tests E2E Frontend

```bash
cd frontend
npm run test:e2e

# Ou avec Cypress UI
npx cypress open
```

**Exemple test Cypress**:
```typescript
describe('Private Vote Flow', () => {
  it('should complete private vote successfully', () => {
    cy.visit('/elections/1');

    cy.get('[data-testid="vote-button"]').click();
    cy.get('[data-testid="candidate-2"]').click();
    cy.get('[data-testid="submit-private-vote"]').click();

    // Wait for proof generation (~2s)
    cy.contains('Génération de la preuve zk-SNARK', { timeout: 10000 });

    // Wait for backend verification
    cy.contains('Vérification de la preuve', { timeout: 10000 });

    // Wait for blockchain transaction
    cy.contains('Transaction envoyée', { timeout: 10000 });

    // Success
    cy.contains('Vote privé enregistré!').should('be.visible');
  });
});
```

---

## 🔒 Sécurité

### Checklist Sécurité

#### Avant Production

- [ ] **Trusted Setup Ceremony**: Générer nouveaux zkeys avec ceremony multi-parties
- [ ] **Hardware Wallet**: Implémenter storage secrets dans hardware wallet (pas localStorage)
- [ ] **Rate Limiting**: Limiter requêtes /api/zk/verify-vote (anti-spam)
- [ ] **Backend Authentication**: Ajouter authentification JWT pour backend API
- [ ] **HTTPS Only**: Forcer HTTPS en production
- [ ] **Audit Smart Contract**: Audit externe du smart contract
- [ ] **Audit Circuits**: Review circuits par expert crypto
- [ ] **Monitoring**: Alertes si preuves invalides en masse
- [ ] **Secret Rotation**: Rotation clé JWT_SECRET régulière

### Attaques Potentielles & Mitigations

#### 1. Replay Attack

**Attaque**: Réutiliser même preuve pour voter plusieurs fois

**Mitigation**: ✅ Nullifier unique par (identityNullifier, electionId)
- Smart contract vérifie nullifier pas déjà utilisé
- Impossible de réutiliser même nullifier

#### 2. Front-running

**Attaque**: Intercepter transaction et voter avant

**Mitigation**: ⚠️ Partiellement mitigé
- Blockchain publique → transactions visibles
- Commitment cache le vote → front-runner ne sait pas pour qui
- Peut empêcher vote mais pas voler le choix

#### 3. Malicious Backend

**Attaque**: Backend génère fausses signatures

**Mitigation**: ✅ Smart contract vérifie signature
- Seule adresse backend autorisée peut signer
- Adresse configurée on-chain par owner
- Logs auditables

#### 4. Secret Storage Compromise

**Attaque**: Voler identityNullifier du localStorage

**Mitigation**: ⚠️ À améliorer
- Actuellement: localStorage (vulnérable XSS)
- Production: Hardware wallet ou secure enclave requis

---

## ❓ FAQ Développeur

### Q1: Pourquoi Poseidon et pas SHA-256?

**R**: Poseidon est optimisé pour circuits zk-SNARK:
- SHA-256: ~25,000 contraintes dans circuit
- Poseidon: ~150 contraintes
- Résultat: Proof generation 100x plus rapide!

### Q2: Peut-on réduire la taille des circuits (4.6 MB)?

**R**: Options:
1. **Compression**: gzip les fichiers WASM (gain ~50%)
2. **Lazy loading**: Charger seulement au moment du vote
3. **CDN**: Servir depuis CDN pour caching
4. **Circuits plus petits**: Simplifier contraintes (trade-off sécurité)

### Q3: Comment débugger un circuit Circom?

**R**:
```bash
# 1. Compiler avec --debug
circom my_circuit.circom --r1cs --wasm --sym --debug

# 2. Créer witness avec inputs
node my_circuit_js/generate_witness.js \
  my_circuit_js/my_circuit.wasm \
  input.json \
  witness.wtns

# 3. Afficher witness
snarkjs wtns export json witness.wtns witness.json
cat witness.json  # Voir toutes les valeurs intermédiaires
```

### Q4: Peut-on changer de système de preuve (Groth16 → PLONK)?

**R**: Oui, mais:
- PLONK: Universal setup (pas de ceremony par circuit)
- PLONK: Preuves plus grandes (~500 bytes vs ~200)
- PLONK: Vérification plus lente (~300ms vs ~100ms)
- Modifier zkVerifierService pour utiliser snarkjs.plonk.*

### Q5: Comment gérer migration vers nouveaux circuits?

**R**: Versioning:
```typescript
// Smart contract
struct PrivateVote {
  vote_commitment: ManagedBuffer,
  nullifier: ManagedBuffer,
  backend_signature: ManagedBuffer,
  circuit_version: u32,  // ← Ajouter version
  timestamp: u64
}

// Backend
const CIRCUIT_VERSIONS = {
  'valid_vote_v1': { wasm: '...', vkey: '...' },
  'valid_vote_v2': { wasm: '...', vkey: '...' }
};
```

---

## 📚 Ressources Additionnelles

### Documentation Officielle

- **Circom**: https://docs.circom.io/
- **snarkjs**: https://github.com/iden3/snarkjs
- **Poseidon**: https://www.poseidon-hash.info/
- **Groth16 Paper**: https://eprint.iacr.org/2016/260.pdf

### Tutoriels Recommandés

- **ZK-SNARKs for Developers**: https://zcash.readthedocs.io/
- **Circom Workshop**: https://github.com/iden3/circom-workshop
- **zkREPL**: https://zkrepl.dev/ (tester circuits en ligne)

### Communauté

- **0xPARC**: https://0xparc.org/ (Learning group)
- **ZK Hack**: https://zkhack.dev/ (Hackathons)
- **PSE**: https://pse.dev/ (Privacy & Scaling Explorations)

---

## 🔄 Changelog Documentation

| Date | Version | Changements |
|------|---------|-------------|
| 31 Oct 2025 | 1.0.0 | Version initiale |

---

**Auteur**: Claude + Développeur
**Maintenu par**: Équipe DEMOCRATIX
**Feedback**: Ouvrir issue sur GitHub
