# Intégration zk-SNARK dans le Smart Contract Voting

**Date**: 31 Octobre 2025
**Status**: 📋 Guide d'implémentation

---

## État Actuel

Le smart contract `voting` contient déjà :

### ✅ Ce qui existe
```rust
// Structure pour votes chiffrés avec preuve
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct EncryptedVote<M: ManagedTypeApi> {
    pub encrypted_choice: ManagedBuffer<M>,
    pub proof: ManagedBuffer<M>,  // ✅ Déjà prévu!
    pub timestamp: u64,
}

// Endpoint de vote
#[endpoint(castVote)]
fn cast_vote(
    &self,
    election_id: u64,
    _voting_token: ManagedBuffer,
    encrypted_vote: EncryptedVote<Self::Api>,
) {
    // ✅ Vérification mock existante (ligne 445-451)
    require!(
        crypto_mock::crypto_verification::verify_encrypted_vote(
            &encrypted_vote.encrypted_choice,
            &encrypted_vote.proof
        ),
        "Preuve de vote invalide"
    );
}
```

---

## Modifications Requises

### 1. Nouvelle Structure de Vote Privé

Ajoutons une structure spécifique pour les votes avec zk-SNARK :

```rust
/// Vote privé avec preuve zk-SNARK vérifiée off-chain
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct PrivateVote<M: ManagedTypeApi> {
    pub vote_commitment: ManagedBuffer<M>,  // Hash Poseidon du vote
    pub nullifier: ManagedBuffer<M>,         // Empêche le double vote
    pub backend_signature: ManagedBuffer<M>, // Signature du backend (preuve vérifiée)
    pub timestamp: u64,
}
```

### 2. Nouveau Storage pour Nullifiers

```rust
/// Storage mapper pour les nullifiers utilisés (empêche double vote)
#[storage_mapper("usedNullifiers")]
fn used_nullifiers(&self, election_id: u64) -> UnorderedSetMapper<ManagedBuffer>;

/// Adresse du backend autorisé à vérifier les preuves
#[storage_mapper("backendVerifierAddress")]
fn backend_verifier_address(&self) -> SingleValueMapper<ManagedAddress>;
```

### 3. Nouvel Endpoint pour Votes Privés

```rust
/// Soumet un vote privé avec preuve zk-SNARK vérifiée off-chain
///
/// # Arguments
/// * `election_id` - ID de l'élection
/// * `vote_commitment` - Commitment Poseidon du vote
/// * `nullifier` - Nullifier unique pour empêcher le double vote
/// * `backend_signature` - Signature du backend après vérification de la preuve
///
/// # Sécurité
/// - La preuve zk-SNARK est vérifiée off-chain par le backend
/// - Le backend signe les données pour autoriser la transaction
/// - Le nullifier empêche tout double vote
#[endpoint(submitPrivateVote)]
fn submit_private_vote(
    &self,
    election_id: u64,
    vote_commitment: ManagedBuffer,
    nullifier: ManagedBuffer,
    backend_signature: ManagedBuffer,
) {
    // 1. Vérifier que l'élection existe et est active
    require!(
        !self.elections(election_id).is_empty(),
        "Élection inexistante"
    );

    let mut election = self.elections(election_id).get();
    let current_time = self.blockchain().get_block_timestamp();

    require!(
        current_time >= election.start_time && current_time <= election.end_time,
        "Élection non active"
    );

    require!(
        election.status == ElectionStatus::Active,
        "Élection non active"
    );

    // 2. Vérifier la signature du backend
    let backend_address = self.backend_verifier_address().get();
    let message = self.hash_vote_data(&election_id, &vote_commitment, &nullifier);

    // Vérification Ed25519 (si le backend utilise Ed25519)
    let is_valid = self.crypto().verify_ed25519(
        backend_address.as_managed_buffer(),
        &message,
        &backend_signature
    );

    require!(is_valid, "Signature backend invalide");

    // 3. Vérifier que le nullifier n'est pas déjà utilisé (double vote)
    require!(
        !self.used_nullifiers(election_id).contains(&nullifier),
        "Nullifier déjà utilisé - double vote détecté"
    );

    // 4. Stocker le vote privé
    let private_vote = PrivateVote {
        vote_commitment: vote_commitment.clone(),
        nullifier: nullifier.clone(),
        backend_signature: backend_signature.clone(),
        timestamp: current_time,
    };

    // Marquer le nullifier comme utilisé
    self.used_nullifiers(election_id).insert(nullifier);

    // Stocker le vote
    self.private_votes(election_id).push(&private_vote);
    election.total_votes += 1;
    self.elections(election_id).set(&election);

    // 5. Émettre événement
    self.private_vote_submitted_event(election_id, vote_commitment);
}

/// Helper pour hasher les données du vote
fn hash_vote_data(
    &self,
    election_id: &u64,
    vote_commitment: &ManagedBuffer,
    nullifier: &ManagedBuffer
) -> ManagedBuffer {
    let mut data = ManagedBuffer::new();
    data.append_bytes(&election_id.to_be_bytes()[..]);
    data.append(vote_commitment.as_ref());
    data.append(nullifier.as_ref());
    self.crypto().keccak256(&data)
}
```

### 4. Nouvel Event

```rust
#[event("privateVoteSubmitted")]
fn private_vote_submitted_event(
    &self,
    #[indexed] election_id: u64,
    vote_commitment: ManagedBuffer,
);
```

### 5. Endpoint de Configuration

```rust
/// Configure l'adresse du backend autorisé (admin seulement)
#[only_owner]
#[endpoint(setBackendVerifier)]
fn set_backend_verifier(&self, address: ManagedAddress) {
    self.backend_verifier_address().set(address);
}

/// Obtenir l'adresse du backend vérificateur
#[view(getBackendVerifier)]
fn get_backend_verifier(&self) -> ManagedAddress {
    self.backend_verifier_address().get()
}
```

### 6. Nouveau Storage Mapper

```rust
/// Storage pour les votes privés
#[storage_mapper("privateVotes")]
fn private_votes(&self, election_id: u64) -> VecMapper<PrivateVote<Self::Api>>;
```

---

## Plan de Migration

### Option A : Nouveau Endpoint (Recommandé pour POC)

1. ✅ **Garder** `castVote` existant (votes standards)
2. ✅ **Ajouter** `submitPrivateVote` (votes zk-SNARK)
3. ✅ Les deux types de votes coexistent

**Avantages** :
- Pas de breaking change
- Support progressif du zk-SNARK
- Fallback possible

### Option B : Remplacement Complet

1. ❌ **Supprimer** `castVote`
2. ✅ **Remplacer** par `submitPrivateVote` uniquement
3. ❌ Tous les votes doivent être avec zk-SNARK

**Inconvénients** :
- Breaking change
- Plus complexe à déployer
- Pas de fallback

**→ Recommandation : Option A pour la version POC**

---

## Implémentation Step-by-Step

### Étape 1 : Ajouter les structures

```rust
// À ajouter après la structure EncryptedVote (ligne ~68)

/// Vote privé avec preuve zk-SNARK
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct PrivateVote<M: ManagedTypeApi> {
    pub vote_commitment: ManagedBuffer<M>,
    pub nullifier: ManagedBuffer<M>,
    pub backend_signature: ManagedBuffer<M>,
    pub timestamp: u64,
}
```

### Étape 2 : Ajouter les storage mappers

```rust
// À ajouter vers la fin du trait, avant les events (ligne ~690)

#[storage_mapper("privateVotes")]
fn private_votes(&self, election_id: u64) -> VecMapper<PrivateVote<Self::Api>>;

#[storage_mapper("usedNullifiers")]
fn used_nullifiers(&self, election_id: u64) -> UnorderedSetMapper<ManagedBuffer>;

#[storage_mapper("backendVerifierAddress")]
fn backend_verifier_address(&self) -> SingleValueMapper<ManagedAddress>;
```

### Étape 3 : Ajouter les endpoints

```rust
// À ajouter après castVote (ligne ~465)

#[endpoint(submitPrivateVote)]
fn submit_private_vote(...) { ... }

#[only_owner]
#[endpoint(setBackendVerifier)]
fn set_backend_verifier(...) { ... }

#[view(getBackendVerifier)]
fn get_backend_verifier(...) { ... }
```

### Étape 4 : Ajouter les helpers

```rust
// À ajouter dans une section privée

fn hash_vote_data(...) { ... }
```

### Étape 5 : Ajouter les events

```rust
// À ajouter après vote_cast_event (ligne ~704)

#[event("privateVoteSubmitted")]
fn private_vote_submitted_event(...);
```

### Étape 6 : Compiler et tester

```bash
cd contracts/voting
wsl --exec bash -l -c "cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/voting && sc-meta all build"
```

---

## Tests à Effectuer

### 1. Test Unitaire : Nullifier Unique

```rust
#[test]
fn test_double_vote_prevention() {
    // 1. Soumettre un vote avec nullifier A
    // 2. Tenter de resoumettre avec même nullifier A
    // 3. Vérifier que la transaction échoue
}
```

### 2. Test Unitaire : Signature Invalide

```rust
#[test]
fn test_invalid_backend_signature() {
    // 1. Créer un vote avec mauvaise signature
    // 2. Soumettre le vote
    // 3. Vérifier que la transaction échoue
}
```

### 3. Test Intégration : Flux Complet

```typescript
// Test E2E
describe('Private Vote Flow', () => {
  it('should submit a valid private vote', async () => {
    // 1. Générer preuve côté client
    // 2. Vérifier preuve côté backend
    // 3. Obtenir signature backend
    // 4. Soumettre transaction blockchain
    // 5. Vérifier vote stocké
    // 6. Vérifier nullifier enregistré
  });
});
```

---

## Sécurité

### ✅ Protections Implémentées

1. **Double Vote** : Nullifier unique par électeur/élection
2. **Proof Validity** : Vérification backend off-chain
3. **Authorization** : Signature backend obligatoire
4. **Timing** : Vérification période de vote
5. **Election Status** : Seulement si active

### ⚠️ Points d'Attention

1. **Clé Privée Backend** : Doit être sécurisée (HSM/KMS)
2. **Rate Limiting** : Éviter spam sur backend
3. **Monitoring** : Logs et alertes
4. **Backup Backend** : Redondance recommandée

---

## Migration Production

### Phase 1 : Déploiement

```bash
# 1. Compiler le nouveau contrat
sc-meta all build

# 2. Upgrade du contrat sur devnet
mxpy contract upgrade ...

# 3. Configurer backend verifier address
mxpy contract call ... --function=setBackendVerifier --arguments <address>
```

### Phase 2 : Activation Progressive

```
Semaine 1: Vote standard uniquement (test)
Semaine 2: Vote zk-SNARK optionnel (beta)
Semaine 3: Vote zk-SNARK par défaut
Semaine 4: Vote zk-SNARK obligatoire
```

---

## Prochaines Étapes

1. ✅ Backend API implémenté
2. 🔄 **[CURRENT]** Modifier smart contract
3. ⏳ Créer service frontend
4. ⏳ Tests E2E complets
5. ⏳ Documentation utilisateur

---

**Fichier**: `contracts/voting/src/lib.rs`
**Dernière mise à jour**: 31 Octobre 2025
**Auteur**: Claude
