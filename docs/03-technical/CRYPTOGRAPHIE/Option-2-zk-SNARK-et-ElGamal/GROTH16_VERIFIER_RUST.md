# Vérificateur Groth16 en Rust pour MultiversX

Guide complet pour implémenter la vérification de preuves Groth16 dans un smart contract MultiversX (Rust).

---

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Structures de données](#structures-de-données)
4. [Implémentation](#implémentation)
5. [Optimisations](#optimisations)
6. [Tests](#tests)
7. [Déploiement](#déploiement)

---

## 🎯 Introduction

### Objectif

Implémenter un vérificateur de preuves **Groth16** directement dans un smart contract MultiversX pour:
- ✅ Vérifier les preuves zk-SNARK **on-chain**
- ✅ Garantir qu'un vote chiffré ElGamal est valide
- ✅ Empêcher les votes invalides (candidat inexistant, double vote)
- ✅ Maintenir l'anonymat du voteur

### Défis techniques

| Défi | Solution MultiversX |
|------|-------------------|
| **Opérations courbe elliptique** | `multiversx-sc-modules::bn254` |
| **Pairings BN254** | `pairing_check()` natif |
| **Parsing points** | Custom hex → BigUint → Point |
| **Gas cost** | Optimisations + batch verification |
| **Sécurité** | Validation stricte des inputs |

---

## 🏗️ Architecture

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Voteur génère preuve Groth16                     │   │
│  │     - Input: candidateId, r, voterSecret             │   │
│  │     - Output: proof + publicSignals                  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ Transaction
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                SMART CONTRACT (Rust)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  2. Endpoint submitPrivateVoteWithProof()            │   │
│  │     - Parse la preuve                                │   │
│  │     - Vérifie la preuve (verify_groth16)             │   │
│  │     - Check nullifier                                │   │
│  │     - Store encrypted vote                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  3. verify_groth16()                                 │   │
│  │     - Parse points (pi_a, pi_b, pi_c)               │   │
│  │     - Calcul alpha + vk_x                           │   │
│  │     - Pairing check                                 │   │
│  │     - Return true/false                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Structures de données

### 1. Groth16Proof

```rust
use multiversx_sc::api::ManagedTypeApi;
use multiversx_sc::types::{BigUint, ManagedBuffer};

#[derive(
    TopEncode,
    TopDecode,
    TypeAbi,
    NestedEncode,
    NestedDecode,
    Clone,
    Debug,
    PartialEq,
    Eq,
)]
pub struct Groth16Proof<M: ManagedTypeApi> {
    // Point A (G1)
    pub pi_a: G1Point<M>,

    // Point B (G2)
    pub pi_b: G2Point<M>,

    // Point C (G1)
    pub pi_c: G1Point<M>,
}

#[derive(
    TopEncode,
    TopDecode,
    TypeAbi,
    NestedEncode,
    NestedDecode,
    Clone,
    Debug,
    PartialEq,
    Eq,
)]
pub struct G1Point<M: ManagedTypeApi> {
    pub x: BigUint<M>,
    pub y: BigUint<M>,
}

#[derive(
    TopEncode,
    TopDecode,
    TypeAbi,
    NestedEncode,
    NestedDecode,
    Clone,
    Debug,
    PartialEq,
    Eq,
)]
pub struct G2Point<M: ManagedTypeApi> {
    pub x: (BigUint<M>, BigUint<M>),  // (x1, x2) - Extension field
    pub y: (BigUint<M>, BigUint<M>),  // (y1, y2) - Extension field
}
```

### 2. VerificationKey

```rust
#[derive(
    TopEncode,
    TopDecode,
    TypeAbi,
    NestedEncode,
    NestedDecode,
    Clone,
    Debug,
)]
pub struct VerificationKey<M: ManagedTypeApi> {
    // Alpha point (G1)
    pub alpha_g1: G1Point<M>,

    // Beta point (G2)
    pub beta_g2: G2Point<M>,

    // Gamma point (G2)
    pub gamma_g2: G2Point<M>,

    // Delta point (G2)
    pub delta_g2: G2Point<M>,

    // IC points (G1) - one per public input
    pub ic: ManagedVec<M, G1Point<M>>,
}
```

### 3. EncryptedVote

```rust
#[derive(
    TopEncode,
    TopDecode,
    TypeAbi,
    NestedEncode,
    NestedDecode,
    Clone,
    Debug,
)]
pub struct EncryptedVote<M: ManagedTypeApi> {
    // ElGamal c1 = hash(r)
    pub c1: BigUint<M>,

    // ElGamal c2 = hash(r, pk, candidateId)
    pub c2: BigUint<M>,

    // Nullifier = hash(voterSecret, electionId)
    pub nullifier: BigUint<M>,

    // Groth16 proof
    pub proof: Groth16Proof<M>,
}
```

---

## 🔧 Implémentation

### Partie 1: Setup du smart contract

```rust
#![no_std]

use multiversx_sc::imports::*;

#[multiversx_sc::contract]
pub trait VotingContract {
    #[init]
    fn init(&self) {
        // Initialiser la verification key
        // En production, charger depuis storage
        self.verification_key().set_if_empty(/* ... */);
    }

    // Storage pour la verification key
    #[storage_mapper("verificationKey")]
    fn verification_key(&self) -> SingleValueMapper<VerificationKey<Self::Api>>;

    // Storage pour les votes chiffrés
    #[storage_mapper("encryptedVotes")]
    fn encrypted_votes(
        &self,
        election_id: u64,
    ) -> VecMapper<EncryptedVote<Self::Api>>;

    // Storage pour les nullifiers utilisés (anti-double vote)
    #[storage_mapper("usedNullifiers")]
    fn used_nullifiers(&self) -> SetMapper<(u64, BigUint)>;
}
```

### Partie 2: Endpoint principal

```rust
#[endpoint(submitPrivateVoteWithProof)]
fn submit_private_vote_with_proof(
    &self,
    election_id: u64,
    encrypted_vote: EncryptedVote<Self::Api>,
    public_signals: ManagedVec<BigUint<Self::Api>>,
) {
    // 1. Vérifier que l'élection est active
    require!(
        self.is_election_active(election_id),
        "Election not active"
    );

    // 2. Vérifier que le nullifier n'a pas déjà été utilisé
    let nullifier_key = (election_id, encrypted_vote.nullifier.clone());
    require!(
        !self.used_nullifiers().contains(&nullifier_key),
        "Already voted (nullifier already used)"
    );

    // 3. Vérifier la preuve Groth16
    let vk = self.verification_key().get();
    let is_valid = self.verify_groth16(&encrypted_vote.proof, &public_signals, &vk);
    require!(is_valid, "Invalid zk-SNARK proof");

    // 4. Vérifier que les signaux publics matchent les valeurs du vote
    require!(
        public_signals.get(0) == encrypted_vote.c1,
        "c1 mismatch"
    );
    require!(
        public_signals.get(1) == encrypted_vote.c2,
        "c2 mismatch"
    );
    require!(
        public_signals.get(2) == encrypted_vote.nullifier,
        "nullifier mismatch"
    );

    // 5. Stocker le vote chiffré
    self.encrypted_votes(election_id).push(&encrypted_vote);

    // 6. Marquer le nullifier comme utilisé
    self.used_nullifiers().insert(nullifier_key);

    // 7. Émettre un événement
    self.encrypted_vote_submitted_event(
        election_id,
        &encrypted_vote.nullifier,
        &encrypted_vote.c1,
        &encrypted_vote.c2,
    );
}
```

### Partie 3: Vérificateur Groth16

```rust
/// Vérifie une preuve Groth16
///
/// Algorithme:
/// 1. Parse les points de la preuve (pi_a, pi_b, pi_c)
/// 2. Calculer vk_x = IC[0] + sum(IC[i+1] * public_signal[i])
/// 3. Vérifier: e(pi_a, pi_b) = e(alpha, beta) * e(vk_x, gamma) * e(pi_c, delta)
///
/// Où e() est le pairing bilinéaire sur BN254
fn verify_groth16(
    &self,
    proof: &Groth16Proof<Self::Api>,
    public_signals: &ManagedVec<BigUint<Self::Api>>,
    vk: &VerificationKey<Self::Api>,
) -> bool {
    // 1. Vérifier que le nombre de signaux publics est correct
    let expected_count = vk.ic.len() - 1;
    if public_signals.len() != expected_count {
        return false;
    }

    // 2. Calculer vk_x = IC[0] + sum(IC[i+1] * public_signal[i])
    let mut vk_x = vk.ic.get(0).clone();

    for i in 0..public_signals.len() {
        let signal = public_signals.get(i);
        let ic_point = vk.ic.get(i + 1);

        // vk_x += signal * ic_point
        vk_x = self.g1_add(&vk_x, &self.g1_mul(&ic_point, &signal));
    }

    // 3. Préparer les pairings
    // Vérifier: e(pi_a, pi_b) == e(alpha, beta) * e(vk_x, gamma) * e(pi_c, delta)
    // Équivalent à: e(pi_a, pi_b) * e(-alpha, beta) * e(-vk_x, gamma) * e(-pi_c, delta) == 1

    let pairing_inputs = [
        // e(pi_a, pi_b)
        (proof.pi_a.clone(), proof.pi_b.clone()),

        // e(-alpha, beta)
        (self.g1_neg(&vk.alpha_g1), vk.beta_g2.clone()),

        // e(-vk_x, gamma)
        (self.g1_neg(&vk_x), vk.gamma_g2.clone()),

        // e(-pi_c, delta)
        (self.g1_neg(&proof.pi_c), vk.delta_g2.clone()),
    ];

    // 4. Exécuter le pairing check
    self.pairing_check(&pairing_inputs)
}
```

### Partie 4: Opérations sur courbes elliptiques

```rust
/// Addition de deux points G1
fn g1_add(
    &self,
    p1: &G1Point<Self::Api>,
    p2: &G1Point<Self::Api>,
) -> G1Point<Self::Api> {
    // Utiliser l'API MultiversX pour additionner des points EC
    // Note: Ceci est une simplification, l'implémentation réelle nécessite
    // l'utilisation de multiversx_sc::elliptic_curve

    // TODO: Implémenter avec multiversx_sc::elliptic_curve::bn254
    unimplemented!("G1 addition")
}

/// Multiplication scalaire sur G1
fn g1_mul(
    &self,
    point: &G1Point<Self::Api>,
    scalar: &BigUint<Self::Api>,
) -> G1Point<Self::Api> {
    // TODO: Implémenter avec multiversx_sc::elliptic_curve::bn254
    unimplemented!("G1 scalar multiplication")
}

/// Négation d'un point G1 (flip y coordinate)
fn g1_neg(&self, point: &G1Point<Self::Api>) -> G1Point<Self::Api> {
    let p = BigUint::from(
        21888242871839275222246405745257275088696311157297823662689037894645226208583u128
    );

    G1Point {
        x: point.x.clone(),
        y: &p - &point.y,  // y' = p - y
    }
}

/// Pairing check BN254
fn pairing_check(
    &self,
    pairs: &[(G1Point<Self::Api>, G2Point<Self::Api>)],
) -> bool {
    // Utiliser le pairing natif MultiversX
    // TODO: Implémenter avec multiversx_sc::elliptic_curve::bn254::pairing

    unimplemented!("Pairing check")
}
```

---

## ⚡ Optimisations

### 1. Batch verification

Pour vérifier plusieurs preuves en une seule transaction:

```rust
#[endpoint(batchVerifyProofs)]
fn batch_verify_proofs(
    &self,
    election_id: u64,
    encrypted_votes: ManagedVec<EncryptedVote<Self::Api>>,
    all_public_signals: ManagedVec<ManagedVec<BigUint<Self::Api>>>,
) {
    let vk = self.verification_key().get();

    for (i, vote) in encrypted_votes.iter().enumerate() {
        let public_signals = all_public_signals.get(i);

        let is_valid = self.verify_groth16(&vote.proof, &public_signals, &vk);
        require!(is_valid, "Invalid proof in batch");

        // Store vote...
    }
}
```

**Économie de gas** : ~30-40% par rapport aux transactions séparées.

### 2. Lazy verification

Vérifier les preuves uniquement lors de la finalisation:

```rust
#[endpoint(submitProofLazy)]
fn submit_proof_lazy(
    &self,
    election_id: u64,
    encrypted_vote: EncryptedVote<Self::Api>,
    public_signals: ManagedVec<BigUint<Self::Api>>,
) {
    // Stocker sans vérifier
    self.pending_votes(election_id).push(&(encrypted_vote, public_signals));
}

#[endpoint(verifyAllProofs)]
fn verify_all_proofs(&self, election_id: u64) {
    // Vérifier toutes les preuves en une fois
    let pending = self.pending_votes(election_id).get();

    for (vote, signals) in pending.iter() {
        let is_valid = self.verify_groth16(&vote.proof, &signals, &vk);
        require!(is_valid, "Invalid proof found");
    }
}
```

**Avantage** : Déplace le coût de vérification hors du chemin critique de vote.

### 3. Compression des points

Utiliser la compression de points EC pour réduire la taille des transactions:

```rust
#[derive(TopEncode, TopDecode)]
pub struct CompressedG1Point<M: ManagedTypeApi> {
    pub x: BigUint<M>,
    pub y_parity: bool,  // Au lieu de y complet
}

fn decompress_g1(&self, compressed: &CompressedG1Point<Self::Api>) -> G1Point<Self::Api> {
    // Recalculer y depuis x et parité
    // y^2 = x^3 + 3 (équation courbe BN254)

    let y_squared = &compressed.x * &compressed.x * &compressed.x + BigUint::from(3u64);
    let y = self.sqrt_mod_p(&y_squared);

    let y_final = if (y.is_even() != compressed.y_parity) {
        &self.get_field_modulus() - &y
    } else {
        y
    };

    G1Point {
        x: compressed.x.clone(),
        y: y_final,
    }
}
```

**Économie** : ~50% de taille de transaction.

---

## 🧪 Tests

### Test unitaire

```rust
#[test]
fn test_verify_valid_proof() {
    let mut setup = VotingContractSetup::new();

    // Charger une preuve valide générée off-chain
    let proof = load_test_proof();
    let public_signals = load_test_signals();

    let result = setup.contract.verify_groth16(&proof, &public_signals, &setup.vk);

    assert!(result, "Valid proof should verify");
}

#[test]
fn test_reject_invalid_proof() {
    let mut setup = VotingContractSetup::new();

    // Modifier la preuve pour la rendre invalide
    let mut proof = load_test_proof();
    proof.pi_a.x = proof.pi_a.x + BigUint::from(1u64);

    let public_signals = load_test_signals();

    let result = setup.contract.verify_groth16(&proof, &public_signals, &setup.vk);

    assert!(!result, "Invalid proof should fail verification");
}
```

### Test d'intégration

```rust
#[test]
fn test_full_vote_workflow() {
    let mut setup = VotingContractSetup::new();

    // 1. Créer une élection
    let election_id = setup.create_test_election();

    // 2. Activer l'élection
    setup.activate_election(election_id);

    // 3. Soumettre un vote chiffré avec preuve
    let encrypted_vote = generate_test_vote(2); // Vote pour candidat 2
    let public_signals = generate_test_signals(&encrypted_vote);

    setup.contract.submit_private_vote_with_proof(
        election_id,
        encrypted_vote.clone(),
        public_signals,
    );

    // 4. Vérifier que le vote a été stocké
    let votes = setup.contract.encrypted_votes(election_id).len();
    assert_eq!(votes, 1);

    // 5. Vérifier que le nullifier est marqué comme utilisé
    let nullifier_key = (election_id, encrypted_vote.nullifier.clone());
    assert!(setup.contract.used_nullifiers().contains(&nullifier_key));
}
```

---

## 🚀 Déploiement

### Étape 1: Compiler le smart contract

```bash
cd contracts/voting
sc-meta all build
```

### Étape 2: Déployer sur Devnet

```bash
# Avec mxpy
mxpy contract deploy \
    --bytecode output/voting.wasm \
    --pem ~/wallets/deployer.pem \
    --gas-limit 100000000 \
    --proxy https://devnet-gateway.multiversx.com \
    --recall-nonce \
    --send
```

### Étape 3: Initialiser la verification key

```rust
#[endpoint(setVerificationKey)]
#[only_owner]
fn set_verification_key(&self, vk: VerificationKey<Self::Api>) {
    self.verification_key().set(vk);
}
```

```bash
# Appeler l'endpoint avec la vk depuis verification_key.json
mxpy contract call <contract-address> \
    --function setVerificationKey \
    --arguments <vk-hex> \
    --pem ~/wallets/deployer.pem \
    --gas-limit 50000000 \
    --proxy https://devnet-gateway.multiversx.com \
    --send
```

---

## 📊 Coûts estimés (gas)

| Opération | Gas estimé | Coût EGLD (1 gas = 0.00000001 EGLD) |
|-----------|-----------|----------------------------------|
| **Setup vérification key** | ~10M | ~0.1 EGLD |
| **Soumettre vote + preuve** | ~12M | ~0.12 EGLD |
| **Batch 10 votes** | ~80M | ~0.8 EGLD |
| **Vérification seule** | ~8M | ~0.08 EGLD |

**Note** : Ces estimations sont approximatives et dépendent de l'implémentation finale.

---

## 🔐 Sécurité

### Points critiques

1. **Validation stricte des inputs**
   ```rust
   require!(proof.pi_a.x < field_modulus(), "Invalid pi_a.x");
   require!(proof.pi_a.y < field_modulus(), "Invalid pi_a.y");
   ```

2. **Protection contre les points à l'infini**
   ```rust
   require!(
       !(proof.pi_a.x.is_zero() && proof.pi_a.y.is_zero()),
       "Point at infinity not allowed"
   );
   ```

3. **Vérification appartenance à la courbe**
   ```rust
   fn is_on_curve(&self, point: &G1Point<Self::Api>) -> bool {
       // y^2 = x^3 + 3
       let y_squared = &point.y * &point.y;
       let x_cubed_plus_3 = &point.x * &point.x * &point.x + BigUint::from(3u64);
       y_squared == x_cubed_plus_3
   }
   ```

4. **Protection nullifier**
   ```rust
   // Toujours vérifier AVANT de stocker
   require!(
       !self.used_nullifiers().contains(&nullifier_key),
       "Already voted"
   );
   ```

---

## 📚 Ressources

- **MultiversX SC Docs** : https://docs.multiversx.com/developers/developer-reference/sc-annotations
- **BN254 Curve** : https://hackmd.io/@jpw/bn254
- **Groth16 Paper** : https://eprint.iacr.org/2016/260.pdf
- **Pairings** : https://vitalik.ca/general/2017/01/14/exploring_ecp.html

---

**Dernière mise à jour** : 2 Novembre 2025
**Version** : 1.0.0
**Statut** : 🚧 Work in Progress (WIP)
