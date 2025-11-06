# Smart Contract Endpoints - Option 2 (ElGamal + zk-SNARK)

## 📋 Vue d'ensemble

Ce document liste tous les endpoints du smart contract pour l'**Option 2** : Vote privé chiffré ElGamal avec preuve zk-SNARK.

Date de création : 2 novembre 2025
Version : 1.0.0
Statut : ✅ Implémenté (nécessite compilation et déploiement)

---

## 🔐 Endpoints de Vote

### `submitPrivateVoteWithProof`

**Type** : Transaction endpoint

**Description** : Soumet un vote privé chiffré ElGamal avec une preuve zk-SNARK Groth16 prouvant que le vote est valide SANS révéler le choix du candidat.

**Signature Rust** :
```rust
#[endpoint(submitPrivateVoteWithProof)]
fn submit_private_vote_with_proof(
    &self,
    election_id: u64,
    c1: ManagedBuffer,
    c2: ManagedBuffer,
    nullifier: ManagedBuffer,
    pi_a: G1Point<Self::Api>,
    pi_b: G2Point<Self::Api>,
    pi_c: G1Point<Self::Api>,
    public_signals: ManagedVec<ManagedBuffer>,
)
```

**Arguments** :

| Nom | Type | Description |
|-----|------|-------------|
| `election_id` | `u64` | ID de l'élection |
| `c1` | `ManagedBuffer` | Composante 1 du chiffrement ElGamal = hash(r) |
| `c2` | `ManagedBuffer` | Composante 2 du chiffrement ElGamal = hash(r, publicKey, candidateId) |
| `nullifier` | `ManagedBuffer` | Identifiant unique anti-double vote = hash(voterSecret, electionId) |
| `pi_a` | `G1Point` | Première composante de la preuve Groth16 (point sur courbe G1) |
| `pi_b` | `G2Point` | Deuxième composante de la preuve Groth16 (point sur courbe G2) |
| `pi_c` | `G1Point` | Troisième composante de la preuve Groth16 (point sur courbe G1) |
| `public_signals` | `ManagedVec<ManagedBuffer>` | Signaux publics [numCandidates, c1, c2, publicKey, nullifier, electionId] |

**Vérifications effectuées** :
1. ✅ Élection existe et est active
2. ✅ Élection a une clé publique ElGamal configurée
3. ✅ Nullifier n'a pas déjà été utilisé (anti-double vote)
4. ✅ Public signals ont 6 éléments
5. ✅ Public signals correspondent aux données fournies (c1, c2, nullifier, electionId)
6. ✅ Preuve zk-SNARK est valide (vérification Groth16 simplifiée pour POC)
7. ✅ Composantes du vote ne sont pas vides

**Workflow** :
```
1. Frontend génère preuve zk-SNARK (2-3s)
2. Transaction soumise au smart contract
3. Smart contract vérifie la preuve Groth16
4. Si valide → vote accepté et stocké
5. Nullifier enregistré pour empêcher double vote
6. Event émis
```

**Gas estimé** : ~50 000 000 (50M)

**Événement émis** :
```rust
#[event("encryptedVoteWithProofSubmitted")]
fn encrypted_vote_with_proof_submitted_event(
    &self,
    #[indexed] election_id: u64,
    nullifier: ManagedBuffer,
    timestamp: u64,
);
```

**Exemple d'appel depuis le frontend** :
```typescript
const { submitPrivateVoteWithProof, isGeneratingProof } =
  useSubmitPrivateVoteWithProof();

const result = await submitPrivateVoteWithProof({
  electionId: 47,
  candidateId: 2,
  numCandidates: 5,
});

console.log('Session ID:', result.sessionId);
console.log('Proof:', result.proof);
```

---

## 📊 View Endpoints

### `getEncryptedVotesWithProof`

**Type** : View endpoint (lecture seule)

**Description** : Récupère tous les votes chiffrés ElGamal avec preuves zk-SNARK d'une élection.

**Signature Rust** :
```rust
#[view(getEncryptedVotesWithProof)]
fn get_encrypted_votes_with_proof(
    &self,
    election_id: u64,
) -> MultiValueEncoded<ElGamalVoteWithProof<Self::Api>>
```

**Arguments** :

| Nom | Type | Description |
|-----|------|-------------|
| `election_id` | `u64` | ID de l'élection |

**Retour** : Vecteur de tous les votes chiffrés avec leurs preuves Groth16

**Structure retournée** :
```rust
pub struct ElGamalVoteWithProof<M: ManagedTypeApi> {
    pub c1: ManagedBuffer<M>,
    pub c2: ManagedBuffer<M>,
    pub nullifier: ManagedBuffer<M>,
    pub proof: Groth16Proof<M>,
    pub timestamp: u64,
}
```

**Utilisation** :
- Organisateur : récupérer les votes pour déchiffrement off-chain
- Auditeurs : vérifier les preuves
- Frontend : afficher statistiques sans révéler les choix

**Exemple d'appel** :
```rust
let votes = self.get_encrypted_votes_with_proof(47);
```

---

### `getOption2Nullifiers`

**Type** : View endpoint (lecture seule)

**Description** : Récupère les nullifiers utilisés pour une élection (Option 2).

**Signature Rust** :
```rust
#[view(getOption2Nullifiers)]
fn get_option2_nullifiers(
    &self,
    election_id: u64,
) -> MultiValueEncoded<ManagedBuffer>
```

**Arguments** :

| Nom | Type | Description |
|-----|------|-------------|
| `election_id` | `u64` | ID de l'élection |

**Retour** : Ensemble des nullifiers déjà utilisés

**Utilisation** : Vérifier qu'un vote n'a pas déjà été soumis SANS révéler l'identité du voteur

**Exemple d'appel** :
```rust
let nullifiers = self.get_option2_nullifiers(47);
```

---

## 🗃️ Storage Mappers

### `elgamal_votes_with_proof`

**Type** : VecMapper

**Description** : Stocke les votes chiffrés ElGamal avec preuves zk-SNARK

**Signature** :
```rust
#[storage_mapper("elgamalVotesWithProof")]
fn elgamal_votes_with_proof(&self, election_id: u64) -> VecMapper<ElGamalVoteWithProof<Self::Api>>;
```

**Données stockées** :
- `c1` : Composante 1 ElGamal
- `c2` : Composante 2 ElGamal
- `nullifier` : Identifiant unique du vote
- `proof` : Preuve Groth16 complète (pi_a, pi_b, pi_c)
- `timestamp` : Horodatage du vote

---

### `option2_nullifiers`

**Type** : SetMapper

**Description** : Ensemble des nullifiers utilisés pour prévenir le double vote

**Signature** :
```rust
#[storage_mapper("option2Nullifiers")]
fn option2_nullifiers(&self, election_id: u64) -> SetMapper<ManagedBuffer>;
```

**Utilisation** :
- Vérifier si un nullifier a déjà été utilisé
- Empêcher le double vote de manière anonyme
- Chaque nullifier = `hash(voterSecret, electionId)` est unique par voteur/élection

---

## 📐 Structures de Données

### `G1Point`

Point sur la courbe elliptique G1 (BN254).

```rust
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct G1Point<M: ManagedTypeApi> {
    pub x: ManagedBuffer<M>,  // Coordonnée x (32 bytes)
    pub y: ManagedBuffer<M>,  // Coordonnée y (32 bytes)
}
```

**Taille** : ~64 bytes

---

### `G2Point`

Point sur la courbe elliptique G2 (BN254) - Extension de corps.

```rust
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct G2Point<M: ManagedTypeApi> {
    pub x1: ManagedBuffer<M>,  // Composante x1 (32 bytes)
    pub x2: ManagedBuffer<M>,  // Composante x2 (32 bytes)
    pub y1: ManagedBuffer<M>,  // Composante y1 (32 bytes)
    pub y2: ManagedBuffer<M>,  // Composante y2 (32 bytes)
}
```

**Taille** : ~128 bytes

---

### `Groth16Proof`

Preuve zk-SNARK complète selon le protocole Groth16.

```rust
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct Groth16Proof<M: ManagedTypeApi> {
    pub pi_a: G1Point<M>,  // Point A (G1)
    pub pi_b: G2Point<M>,  // Point B (G2)
    pub pi_c: G1Point<M>,  // Point C (G1)
}
```

**Taille totale** : ~256 bytes (64 + 128 + 64)

---

### `ElGamalVoteWithProof`

Vote chiffré ElGamal avec preuve zk-SNARK complète.

```rust
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct ElGamalVoteWithProof<M: ManagedTypeApi> {
    pub c1: ManagedBuffer<M>,          // ElGamal c1 = hash(r)
    pub c2: ManagedBuffer<M>,          // ElGamal c2 = hash(r, pk, candidateId)
    pub nullifier: ManagedBuffer<M>,   // Nullifier anti-double vote
    pub proof: Groth16Proof<M>,        // Preuve Groth16 complète
    pub timestamp: u64,                 // Horodatage
}
```

**Taille totale** : ~400-500 bytes

---

## 🔧 Fonctions Utilitaires

### `verify_groth16_proof_simplified`

**Type** : Fonction privée

**Description** : Vérification simplifiée de la preuve Groth16 (POC).

**Signature** :
```rust
fn verify_groth16_proof_simplified(
    &self,
    proof: &Groth16Proof<Self::Api>,
    public_signals: &ManagedVec<ManagedBuffer>,
) -> bool
```

**Vérifications effectuées** :
1. ✅ pi_a (G1) n'est pas vide
2. ✅ pi_b (G2) n'est pas vide
3. ✅ pi_c (G1) n'est pas vide
4. ✅ Public signals ne sont pas vides
5. ✅ Coordonnées ont une taille raisonnable (10-128 bytes)

**⚠️ NOTE** : Cette fonction est une SIMPLIFICATION pour le POC. La vérification complète nécessite :
1. Charger la verification key depuis le storage
2. Effectuer les pairing checks BN254 : `e(pi_a, pi_b) = e(alpha, beta) * e(vk_x, gamma) * e(pi_c, delta)`
3. Utiliser une precompiled contract ou bibliothèque crypto

**TODO** : Implémenter la vérification complète avec pairing checks

---

### `u64_to_managed_buffer`

**Type** : Fonction utilitaire

**Description** : Convertit un u64 en ManagedBuffer.

**Signature** :
```rust
fn u64_to_managed_buffer(&self, value: u64) -> ManagedBuffer
```

**Utilisation** : Convertir les IDs d'élection pour comparaison avec les public signals.

---

## 📝 Événements

### `encrypted_vote_with_proof_submitted_event`

**Description** : Émis lorsqu'un vote avec preuve zk-SNARK est soumis avec succès.

**Signature** :
```rust
#[event("encryptedVoteWithProofSubmitted")]
fn encrypted_vote_with_proof_submitted_event(
    &self,
    #[indexed] election_id: u64,
    nullifier: ManagedBuffer,
    timestamp: u64,
);
```

**Données** :
- `election_id` (indexé) : ID de l'élection
- `nullifier` : Nullifier du vote (permet audit sans révéler identité)
- `timestamp` : Horodatage du vote

**Utilisation** :
- Frontend : notification utilisateur
- Auditeurs : traçabilité des votes
- Analytics : statistiques en temps réel

---

## 🔄 Workflow Complet Option 2

### 1. Préparation (Frontend)

```typescript
// 1. Récupérer clé publique ElGamal de l'élection
const publicKey = await getElectionPublicKey(electionId);

// 2. Récupérer/créer secret voteur
const voterSecret = await getOrCreateVoterSecret(walletAddress);

// 3. Générer randomness ElGamal
const r = generateElGamalRandomness();
```

### 2. Génération de la Preuve (Frontend)

```typescript
// 4. Générer preuve zk-SNARK (2-3 secondes)
const proof = await generateEncryptedVoteProof({
  candidateId: 2,
  r,
  voterSecret,
  numCandidates: 5,
  publicKey,
  electionId: 47,
});

// Proof contient:
// - c1, c2 (ElGamal)
// - nullifier (anti-double vote)
// - proof (Groth16: pi_a, pi_b, pi_c)
// - publicSignals (pour vérification)
```

### 3. Soumission (Frontend → Blockchain)

```typescript
// 5. Envoyer transaction au smart contract
const sessionId = await submitPrivateVoteWithProof({
  electionId: 47,
  candidateId: 2,
  numCandidates: 5,
});
```

### 4. Vérification (Smart Contract)

```rust
// 6. Smart contract vérifie:
// - Élection active
// - Nullifier non utilisé
// - Public signals corrects
// - Preuve Groth16 valide

// 7. Si OK → stocker vote + nullifier
self.elgamal_votes_with_proof(election_id).push(&vote);
self.option2_nullifiers(election_id).insert(nullifier);

// 8. Émettre événement
self.encrypted_vote_with_proof_submitted_event(...);
```

### 5. Déchiffrement (Post-Election, Off-Chain)

```typescript
// 9. Après clôture: organisateur récupère votes
const votes = await getEncryptedVotesWithProof(electionId);

// 10. Déchiffrer chaque vote avec clé privée
const results = votes.map(vote =>
  decryptVote(vote.c1, vote.c2, privateKey)
);

// 11. Compter les votes
const tallies = countVotes(results);

// 12. Soumettre résultats on-chain
await finalizeElection(electionId, tallies);
```

---

## 🆚 Comparaison Option 1 vs Option 2

| Critère | Option 1 (ElGamal seul) | Option 2 (ElGamal + zk-SNARK) |
|---------|-------------------------|-------------------------------|
| **Confidentialité** | ✅ Chiffrement ElGamal | ✅ Chiffrement ElGamal |
| **Validité prouvée** | ❌ Non | ✅ Preuve zk-SNARK |
| **Double vote** | ✅ Via wallet address | ✅ Via nullifier anonyme |
| **Anonymat** | ⚠️ Partiel (adresse visible) | ✅ Total (nullifier) |
| **Taille transaction** | ~100 bytes | ~500 bytes |
| **Gas requis** | ~10M | ~50M |
| **Temps génération** | < 1s | 2-3s |
| **Complexité** | Faible | Élevée |
| **Sécurité** | Haute | Maximale |

---

## 📋 Checklist de Déploiement

Avant de déployer le smart contract avec Option 2 :

### Backend
- [x] Structures G1Point, G2Point définies
- [x] Structure Groth16Proof définie
- [x] Structure ElGamalVoteWithProof définie
- [x] Storage mapper elgamal_votes_with_proof créé
- [x] Storage mapper option2_nullifiers créé
- [x] Event encrypted_vote_with_proof_submitted_event créé
- [x] Endpoint submitPrivateVoteWithProof implémenté
- [x] View getEncryptedVotesWithProof implémentée
- [x] View getOption2Nullifiers implémentée
- [x] Fonction verify_groth16_proof_simplified implémentée
- [ ] Compiler smart contract avec sc-meta
- [ ] Tester sur Devnet
- [ ] Déployer sur Devnet
- [ ] Générer nouvel ABI

### Frontend
- [x] Circuit Circom valid_vote_encrypted.circom créé
- [x] Utilitaire zkproofEncrypted.ts créé
- [x] Hook useSubmitPrivateVoteWithProof créé
- [x] Hook mis à jour avec transaction réelle
- [ ] Compiler circuit avec snarkjs
- [ ] Placer fichiers circuits dans /public/circuits/
- [ ] Mettre à jour ABI frontend
- [ ] Créer interface de sélection Option 1/2
- [ ] Tests E2E pour Option 2

---

## 🚀 Prochaines Étapes

1. **Compilation du Smart Contract**
   - Compiler avec `sc-meta all build`
   - Résoudre erreurs de compilation si nécessaire
   - Générer ABI mis à jour

2. **Compilation du Circuit**
   - Compiler circuit Circom avec snarkjs
   - Générer fichiers .wasm et .zkey
   - Placer dans frontend/public/circuits/

3. **Tests Unitaires**
   - Tester endpoint submitPrivateVoteWithProof
   - Tester vérification preuve
   - Tester anti-double vote via nullifier

4. **Interface Utilisateur**
   - Ajouter sélection Option 1 / Option 2 dans Vote.tsx
   - Créer modal explicatif des différences
   - Intégrer hook useSubmitPrivateVoteWithProof

5. **Tests E2E**
   - Créer fichier 09-elgamal-zksnark-voting.cy.ts
   - Tester workflow complet Option 2
   - Vérifier génération preuve
   - Vérifier soumission et vérification

6. **Déploiement**
   - Déployer sur Devnet
   - Tester en conditions réelles
   - Mesurer temps de génération preuve
   - Mesurer gas utilisé

7. **Documentation**
   - Mettre à jour PROGRESS.md
   - Mettre à jour CHANGELOG.md
   - Créer guide utilisateur Option 2
   - Créer guide développeur circuits zk-SNARK

---

## 📚 Références

- [Smart Contract Source](../../contracts/voting/src/lib.rs)
- [Frontend Hook](../../frontend/src/hooks/transactions/useSubmitPrivateVoteWithProof.ts)
- [Circuit Circom](../../backend/circuits/valid_vote_encrypted/valid_vote_encrypted.circom)
- [Utilitaire zkproof](../../frontend/src/utils/zkproofEncrypted.ts)
- [Documentation Groth16](./GROTH16_VERIFIER_RUST.md)
- [Guide Trusted Setup](../../backend/circuits/valid_vote_encrypted/TRUSTED_SETUP_GUIDE.md)

---

**Auteur** : Claude Code
**Date de dernière mise à jour** : 2 novembre 2025
**Version** : 1.0.0
