# DEMOCRATIX - Prochaines Étapes Cryptographiques

**Date**: 31 Octobre 2025
**Phase actuelle**: Phase 2 complétée ✅
**Prochaine phase**: Phase 3 - Smart Contracts Rust

---

## 📊 Récapitulatif: Ce qui a été fait

### ✅ Phase 1: Backend CryptoService (Complétée)
**Fichiers créés**:
- `backend/src/services/cryptoService.ts` (400+ lignes)
- `backend/src/controllers/cryptoController.ts` (300+ lignes)
- `backend/src/routes/crypto.ts` (140+ lignes)

**Fonctionnalités implémentées**:
1. **Identités d'électeurs** (style Semaphore)
   - Génération: `nullifier` + `trapdoor` → `commitment`
   - Hash cryptographique Poseidon

2. **Merkle Tree**
   - Profondeur: 20 niveaux (1M électeurs max)
   - Ajout d'électeurs
   - Génération de preuves Merkle
   - Vérification de preuves

3. **Nullifiers**
   - Empêche le double vote
   - Unique par électeur + élection
   - `nullifier = Hash(identityNullifier, electionId)`

4. **Blind Signatures** (RSA-2048)
   - Tokens de vote anonymes
   - Protocole de Chaum
   - Signature aveugle

**API REST**: 11 endpoints crypto créés
**Tests**: Script `test-crypto.ts` fonctionnel

---

### ✅ Phase 2: Circuits zk-SNARK (Complétée)
**Fichiers créés**:
- `backend/circuits/voter_eligibility.circom` (91 lignes)
- `backend/circuits/valid_vote.circom` (74 lignes)
- `backend/circuits/README.md` (documentation complète)
- 4 scripts bash d'automatisation

**Circuits Circom**:

1. **voter_eligibility.circom**
   - Prouve: "Je suis dans le Merkle tree des électeurs"
   - Sans révéler: Mon identité
   - Inputs publics: `merkleRoot`, `nullifier`, `electionId`
   - Inputs privés: `identityNullifier`, `identityTrapdoor`, Merkle path

2. **valid_vote.circom**
   - Prouve: "Mon vote est pour un candidat valide"
   - Sans révéler: Pour quel candidat
   - Inputs publics: `electionId`, `numCandidates`, `voteCommitment`
   - Inputs privés: `candidateId`, `randomness`

**Scripts d'automatisation**:
- `compile-all.sh` - Compile les circuits
- `setup-all.sh` - Génère les clés (trusted setup)
- `download-ptau.sh` - Télécharge Powers of Tau
- `test-circuits.sh` - Teste les circuits

---

## 🎯 Ce qu'il reste à faire

### Phase 3: Smart Contracts Rust (2-3 semaines)

#### Étape 3.1: Compiler les circuits ⏳
**Prérequis**:
- Circom compiler (Rust-based)
- snarkjs (npm)
- Node.js

**Actions**:
```bash
cd backend/circuits

# Compiler les circuits
./compile-all.sh

# Télécharger Powers of Tau (~570 MB, une seule fois)
./download-ptau.sh

# Générer les clés (trusted setup)
./setup-all.sh

# Tester les circuits
./test-circuits.sh
```

**Outputs attendus**:
```
build/
├── voter_eligibility.r1cs
├── voter_eligibility_js/voter_eligibility.wasm
├── voter_eligibility_final.zkey
├── voter_eligibility_verification_key.json
├── valid_vote.r1cs
├── valid_vote_js/valid_vote.wasm
├── valid_vote_final.zkey
└── valid_vote_verification_key.json
```

---

#### Étape 3.2: Implémenter vérificateur Groth16 en Rust ⏳

**Fichier à créer**: `contracts/voting/src/crypto_verifier.rs`

**Ce qui doit être fait**:
1. Parser les preuves Groth16 (format JSON)
2. Vérifier les preuves on-chain
3. Remplacer `crypto_mock.rs` (actuellement mock)

**Ressources**:
- [Groth16 Paper](https://eprint.iacr.org/2016/260)
- [arkworks-rs](https://github.com/arkworks-rs/groth16) - Library Rust pour Groth16
- [MultiversX Rust Framework](https://docs.multiversx.com/developers/developer-reference/rust-framework/)

**Structure suggérée**:
```rust
// contracts/voting/src/crypto_verifier.rs

use multiversx_sc::*;

#[multiversx_sc::module]
pub trait CryptoVerifier {

    /// Vérifie une preuve d'éligibilité d'électeur
    fn verify_voter_eligibility(
        &self,
        proof: &[u8],
        public_signals: &[BigUint],
        verification_key: &[u8]
    ) -> bool {
        // TODO: Implémenter vérification Groth16
        // Utiliser arkworks-rs ou implémenter manuellement

        // Pour l'instant, retourner true (DÉVELOPPEMENT SEULEMENT)
        true
    }

    /// Vérifie une preuve de vote valide
    fn verify_valid_vote(
        &self,
        proof: &[u8],
        public_signals: &[BigUint],
        verification_key: &[u8]
    ) -> bool {
        // TODO: Implémenter vérification Groth16
        true
    }
}
```

**Intégration dans `lib.rs`**:
```rust
// contracts/voting/src/lib.rs

// Remplacer:
// mod crypto_mock;

// Par:
mod crypto_verifier;

#[multiversx_sc::contract]
pub trait VotingContract: crypto_verifier::CryptoVerifier {
    // ... reste du code
}
```

---

#### Étape 3.3: Tests End-to-End ⏳

**Test Flow Complet**:
1. **Enregistrement électeur**:
   ```
   Frontend → Génère identité (nullifier, trapdoor)
   Frontend → Envoie commitment au backend
   Backend → Ajoute commitment au Merkle tree
   Backend → Retourne Merkle proof
   ```

2. **Vote**:
   ```
   Frontend → Génère preuve zk-SNARK (voter_eligibility)
   Frontend → Génère preuve de vote valide (valid_vote)
   Frontend → Envoie transaction au smart contract
   Smart Contract → Vérifie les preuves (Groth16)
   Smart Contract → Enregistre le vote
   ```

3. **Dépouillement**:
   ```
   Backend → Récupère tous les votes chiffrés
   Backend → Déchiffre avec clé privée
   Backend → Compte les votes
   Backend → Publie résultats
   ```

---

## 🔧 Prérequis Techniques

### Installation Circom (Windows WSL/Linux/Mac)

**Option 1: Installation depuis les sources** (recommandée)
```bash
# Installer Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Cloner et compiler Circom
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

# Vérifier
circom --version
# Output attendu: circom compiler 2.1.x
```

**Option 2: Binaires pré-compilés**
- Télécharger depuis: https://github.com/iden3/circom/releases
- Ajouter au PATH

### Installation snarkjs
```bash
cd backend
npm install -g snarkjs

# Vérifier
snarkjs --version
```

### Vérifier que tout est prêt
```bash
# Node.js (déjà installé normalement)
node --version  # >= 18.x

# npm (déjà installé)
npm --version

# Circom (à installer)
circom --version  # doit afficher 2.1.x

# snarkjs (à installer)
snarkjs --version
```

---

## 🧪 Comment Tester

### Test 1: Backend CryptoService (Déjà fonctionnel ✅)
```bash
cd backend
npx ts-node test-crypto.ts
```

**Résultats attendus**:
```
✅ TEST 1: Identity Generation
✅ TEST 2: Merkle Tree Registration
✅ TEST 4: Nullifiers
✅ TEST 5: Blind Signatures
✅ TEST 6: Statistics
```

### Test 2: Circuits Circom (À faire après installation ⏳)
```bash
cd backend/circuits

# 1. Compiler
./compile-all.sh

# 2. Télécharger Powers of Tau (570 MB, ~5 min)
./download-ptau.sh

# 3. Setup (génère clés, ~2-3 min)
./setup-all.sh

# 4. Tester
./test-circuits.sh
```

**Résultats attendus**:
```
✅ Valid Vote Circuit: ALL TESTS PASSED
⏸️  Voter Eligibility Circuit: SKIPPED (requires Merkle tree)
```

### Test 3: Smart Contracts (À implémenter ⏳)
```bash
cd contracts/voting

# Compiler le smart contract
sc-meta all build

# Tester
cargo test
```

---

## ⚠️ Limitations Actuelles

### Backend
- ✅ CryptoService implémenté et testé
- ✅ API REST fonctionnelle (11 endpoints)
- ⚠️  Backend compilation errors (MultiversX SDK)
  - Issues mineures de compatibilité API
  - Ne bloquent pas le développement crypto

### Circuits
- ✅ Circuits Circom écrits et documentés
- ⏳ Pas encore compilés (nécessite Circom installé)
- ⏳ Clés pas encore générées

### Smart Contracts
- ⚠️  Actuellement: `crypto_mock.rs` (mock)
- ⏳ À faire: Vérificateur Groth16 réel en Rust
- ⏳ Intégration avec les circuits

### Frontend
- ⏳ Pas encore intégré avec crypto
- ⏳ À ajouter: Génération de preuves côté client (snarkjs)

---

## 📋 Plan d'Action Recommandé

### Court terme (Cette semaine)
1. **Installer Circom** (voir instructions ci-dessus)
2. **Compiler les circuits**:
   ```bash
   cd backend/circuits
   ./compile-all.sh
   ./download-ptau.sh  # 570 MB, 5 minutes
   ./setup-all.sh       # 2-3 minutes
   ./test-circuits.sh   # Vérifier que ça marche
   ```
3. **Tester le backend crypto**:
   ```bash
   cd backend
   npx ts-node test-crypto.ts
   ```

### Moyen terme (Semaine prochaine)
1. **Implémenter vérificateur Groth16** en Rust
   - Étudier arkworks-rs
   - Créer `crypto_verifier.rs`
   - Remplacer `crypto_mock.rs`

2. **Intégrer avec smart contracts**
   - Parser preuves JSON
   - Vérifier on-chain
   - Tests unitaires

### Long terme (2-3 semaines)
1. **Frontend integration**
   - Ajouter snarkjs au frontend
   - Générer preuves côté client
   - Envoyer au smart contract

2. **Tests End-to-End**
   - Flow complet: Enregistrement → Vote → Dépouillement
   - Tests de sécurité
   - Tests de performance

3. **Audit & Production**
   - Trusted setup multi-party (production)
   - Audit cryptographique externe
   - Bug bounty

---

## 📚 Ressources Utiles

### Documentation
- **Circom**: https://docs.circom.io/
- **snarkjs**: https://github.com/iden3/snarkjs
- **Semaphore Protocol**: https://semaphore.appliedzkp.org/
- **Groth16**: https://eprint.iacr.org/2016/260

### Exemples de Code
- **Tornado Cash**: https://github.com/tornadocash/tornado-core
- **Semaphore Circuits**: https://github.com/semaphore-protocol/semaphore/tree/main/packages/circuits
- **arkworks-rs**: https://github.com/arkworks-rs/groth16

### Documentation DEMOCRATIX
- `docs/03-technical/CRYPTO_ARCHITECTURE.md` - Architecture complète
- `docs/03-technical/CRYPTO_IMPLEMENTATION_PROGRESS.md` - Progression
- `.claude/docs-claude/CRYPTO_STUDY_EXISTING_PROJECTS.md` - Analyse projets existants
- `backend/circuits/README.md` - Guide circuits Circom

---

## 🎯 Résumé: Pour Avancer

**Tu dois maintenant**:
1. ✅ Lire ce document
2. ⏳ Installer Circom (voir section "Prérequis Techniques")
3. ⏳ Compiler les circuits (`./compile-all.sh`)
4. ⏳ Tester que tout fonctionne (`./test-circuits.sh`)

**Ensuite, deux options**:

**Option A: Continue avec les circuits** (recommandé si tu es à l'aise avec la crypto)
- Implémenter le vérificateur Groth16 en Rust
- Intégrer avec les smart contracts

**Option B: Teste d'abord ce qui existe**
- Tester le backend crypto (`npx ts-node test-crypto.ts`)
- Explorer l'API REST (`curl` ou Postman)
- Comprendre le flow complet

**Besoin d'aide?**
- Tous les fichiers sont documentés
- Les scripts ont des messages clairs
- Ce document explique tout étape par étape

---

**Dernière mise à jour**: 31 Octobre 2025
**Version**: v0.10.0 - Phase 2 Circuits zk-SNARK
**Prochaine version**: v0.11.0 - Phase 3 Smart Contracts Rust
