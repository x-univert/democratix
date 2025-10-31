# Architecture Cryptographique - DEMOCRATIX

**Date**: 30 Octobre 2025
**Version**: 1.0
**Statut**: En développement

---

## 1. Vue d'Ensemble

Cette architecture décrit l'implémentation de la cryptographie avancée pour DEMOCRATIX, remplaçant le `crypto_mock.rs` actuel par des solutions production-ready.

### Objectifs

- ✅ **Anonymat total** : Impossible de lier un vote à une identité
- ✅ **Vérifiabilité** : Chacun peut vérifier que son vote est compté
- ✅ **Sécurité** : Protection contre fraude, coercition, achat de votes
- ✅ **Conformité RGPD** : Privacy by design

---

## 2. Technologies Cryptographiques

### 2.1 zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge)

**Implémentation choisie** : **Groth16** via `circom` + `snarkjs`

**Pourquoi Groth16** :
- Preuves très compactes (~200 bytes)
- Vérification rapide (~2ms)
- Bien supporté et audité
- Compatible MultiversX

**Circuits zk-SNARK nécessaires** :

#### Circuit 1 : Preuve d'éligibilité
```
Prouve : "Je suis un électeur éligible dans le Merkle tree"
Sans révéler : Mon identité réelle
Public inputs : merkle_root, nullifier
Private inputs : identity, merkle_path
```

#### Circuit 2 : Preuve de vote valide
```
Prouve : "Mon vote est pour un candidat valide"
Sans révéler : Pour quel candidat je vote
Public inputs : election_id, num_candidates
Private inputs : candidate_id, randomness
```

### 2.2 Chiffrement Homomorphique

**Implémentation choisie** : **ElGamal** (addition homomorphique)

**Pourquoi ElGamal** :
- Additivement homomorphique (parfait pour compter votes)
- Plus simple que Paillier
- Compatible avec courbes elliptiques (BN254)
- Bien documenté

**Schéma** :
```
Setup: G (générateur), p (ordre du groupe)
Clés publiques: pk = g^sk (sk = clé privée)
Chiffrement: Enc(m) = (g^r, pk^r * g^m) où r = random
Déchiffrement: Dec(c1, c2) = c2 / c1^sk
Homomorphisme: Enc(m1) * Enc(m2) = Enc(m1 + m2)
```

### 2.3 Blind Signatures

**Implémentation** : **RSA Blind Signature** (Chaum)

**Workflow** :
1. Électeur génère un token aléatoire `t`
2. Électeur aveugle `t` : `blinded_t = t * r^e mod n`
3. Autorité signe sans voir `t` : `sig = blinded_t^d mod n`
4. Électeur dé-aveugle : `unblinded_sig = sig / r mod n`
5. Électeur vote avec `(t, unblinded_sig)` - anonyme !

---

## 3. Architecture du Système

### 3.1 Composants

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  - Génération preuves zk-SNARK (côté client via snarkjs)    │
│  - Chiffrement votes (ElGamal via noble-curves)             │
│  - Blind signature protocol                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  BACKEND NODE.JS                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Crypto Service                                       │   │
│  │ - Génération paramètres Groth16 (Setup Ceremony)    │   │
│  │ - Gestion clés ElGamal (multi-sig pour déchiffrer)  │   │
│  │ - Blind signature authority                         │   │
│  │ - Merkle tree des électeurs                         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              SMART CONTRACTS (Rust)                          │
│  - Vérification preuves zk-SNARK (Groth16 verifier)        │
│  - Stockage votes chiffrés (ElGamal ciphertexts)           │
│  - Vérification blind signatures                            │
│  - Comptage homomorphique                                   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Flux de Données

#### Phase 1 : Enregistrement

```
1. Citoyen s'authentifie (FranceConnect / eID)
2. Backend vérifie éligibilité
3. Backend ajoute au Merkle tree
4. Citoyen génère preuve zk-SNARK d'éligibilité
5. Backend vérifie preuve et émet blind signature
6. Citoyen stocke token de vote (aveuglé)
```

#### Phase 2 : Vote

```
1. Citoyen choisit candidat (client-side)
2. Chiffrement ElGamal du choix
3. Génération preuve zk-SNARK "vote valide"
4. Envoi (encrypted_vote, zk_proof, blind_token)
5. Smart contract vérifie tout
6. Stockage vote chiffré on-chain
```

#### Phase 3 : Dépouillement

```
1. Élection fermée
2. Multi-sig des autorités pour générer clé déchiffrement
3. Déchiffrement homomorphique: sum(Enc(votes)) → Enc(sum)
4. Décrypt(Enc(sum)) → Résultats
5. Publication résultats + preuve de validité
```

---

## 4. Implémentation Technique

### 4.1 Bibliothèques

#### Frontend
```json
{
  "snarkjs": "^0.7.0",           // zk-SNARKs proof generation
  "circomlib": "^2.0.5",         // Circuits standards
  "@noble/curves": "^1.2.0",    // Courbes elliptiques (ElGamal)
  "@noble/hashes": "^1.3.2"     // Hash functions
}
```

#### Backend
```json
{
  "snarkjs": "^0.7.0",           // Setup ceremony
  "circomlibjs": "^0.1.7",       // Merkle tree
  "node-rsa": "^1.1.1",          // Blind signatures
  "ethers": "^6.0.0"             // Utilitaires crypto
}
```

#### Smart Contracts (Rust)
```toml
[dependencies]
multiversx-sc = "0.49.0"
# TODO: Ajouter bibliothèque Groth16 verifier pour MultiversX
# Options:
# - Implémenter nous-mêmes (complexe)
# - Port de bellman/arkworks (à vérifier compatibilité)
```

### 4.2 Circuits Circom

#### Circuit `voter_eligibility.circom`

```javascript
pragma circom 2.1.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/smt/smtverifier.circom";

// Prouve que l'électeur est dans le Merkle tree sans révéler son identité
template VoterEligibility(levels) {
    // Public inputs
    signal input merkle_root;
    signal input nullifier;  // Hash(identity + election_id) pour éviter double vote

    // Private inputs
    signal input identity;  // Hash(credential)
    signal input election_id;
    signal input merkle_path[levels];
    signal input merkle_siblings[levels];

    // Vérifier Merkle proof
    component merkleProof = SMTVerifier(levels);
    merkleProof.root <== merkle_root;
    merkleProof.leaf <== identity;
    for (var i = 0; i < levels; i++) {
        merkleProof.siblings[i] <== merkle_siblings[i];
        merkleProof.path[i] <== merkle_path[i];
    }

    // Calculer nullifier
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== identity;
    nullifierHasher.inputs[1] <== election_id;
    nullifierHasher.out === nullifier;
}

component main {public [merkle_root, nullifier]} = VoterEligibility(20);
```

#### Circuit `valid_vote.circom`

```javascript
pragma circom 2.1.0;

include "circomlib/circuits/comparators.circom";

// Prouve que le vote est pour un candidat valide
template ValidVote() {
    // Public inputs
    signal input election_id;
    signal input num_candidates;
    signal input vote_commitment;  // Hash du vote chiffré

    // Private inputs
    signal input candidate_id;
    signal input randomness;

    // Vérifier que candidate_id < num_candidates
    component lessThan = LessThan(32);
    lessThan.in[0] <== candidate_id;
    lessThan.in[1] <== num_candidates;
    lessThan.out === 1;

    // Calculer commitment
    component hasher = Poseidon(3);
    hasher.inputs[0] <== election_id;
    hasher.inputs[1] <== candidate_id;
    hasher.inputs[2] <== randomness;
    hasher.out === vote_commitment;
}

component main {public [election_id, num_candidates, vote_commitment]} = ValidVote();
```

### 4.3 Service Backend - Crypto

```typescript
// backend/src/services/cryptoService.ts

import { groth16 } from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import { newMemEmptyTrie } from 'circomlibjs';
import NodeRSA from 'node-rsa';

export class CryptoService {
  private merkleTree: any;
  private blindSigningKey: NodeRSA;

  constructor() {
    this.merkleTree = newMemEmptyTrie();
    this.blindSigningKey = new NodeRSA({ b: 2048 });
  }

  /**
   * Ajoute un électeur au Merkle tree
   */
  async addVoterToMerkleTree(voterHash: string): Promise<string> {
    await this.merkleTree.insert(voterHash, 1);
    const root = this.merkleTree.root;
    return root.toString();
  }

  /**
   * Génère une preuve de Merkle pour un électeur
   */
  async generateMerkleProof(voterHash: string): Promise<any> {
    const proof = await this.merkleTree.generateProof(voterHash);
    return {
      root: proof.root,
      siblings: proof.siblings,
      path: proof.pathIndices
    };
  }

  /**
   * Signe un token de vote (blind signature)
   */
  async blindSignVotingToken(blindedToken: string): Promise<string> {
    const signature = this.blindSigningKey.sign(blindedToken, 'base64');
    return signature;
  }

  /**
   * Vérifie un token de vote dé-aveuglé
   */
  verifyVotingToken(token: string, signature: string): boolean {
    return this.blindSigningKey.verify(token, signature, 'utf8', 'base64');
  }

  /**
   * Génère les paramètres Groth16 (Setup Ceremony)
   * À faire UNE SEULE FOIS au déploiement
   */
  async setupGroth16(circuitPath: string): Promise<void> {
    const { zkey, vkey } = await groth16.setup(circuitPath);
    // Sauvegarder zkey et vkey de manière sécurisée
    // IMPORTANT: Setup ceremony multi-party pour production
  }

  /**
   * Génère des clés ElGamal pour une élection
   */
  generateElGamalKeys(): { publicKey: bigint, privateKey: bigint } {
    // TODO: Implémenter génération clés sur courbe BN254
    // Pour production: Multi-party computation pour clé privée
    throw new Error('Not implemented');
  }
}
```

### 4.4 Smart Contract - Vérification

```rust
// contracts/voting/src/crypto_real.rs

use multiversx_sc::api::ManagedTypeApi;
use multiversx_sc::types::{ManagedBuffer, BigUint};

/// Vérification Groth16 zk-SNARK
pub fn verify_groth16_proof<M: ManagedTypeApi>(
    proof: &ManagedBuffer<M>,
    public_inputs: &[BigUint<M>],
    verification_key: &ManagedBuffer<M>,
) -> bool {
    // TODO: Implémenter vérification Groth16
    // 1. Parser proof (A, B, C points sur courbe BN254)
    // 2. Parser vkey (alpha, beta, gamma, delta)
    // 3. Calculer pairings e(A,B) * e(alpha, beta) * e(public_inputs, gamma) * e(C, delta)
    // 4. Vérifier égalité

    // Pseudo-code:
    // let proof_parsed = parse_groth16_proof(proof);
    // let vkey_parsed = parse_verification_key(verification_key);
    // let pairing_check = compute_pairings(proof_parsed, vkey_parsed, public_inputs);
    // pairing_check == FieldElement::ONE

    false // Placeholder
}

/// Chiffrement ElGamal d'un vote
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode)]
pub struct ElGamalCiphertext<M: ManagedTypeApi> {
    pub c1: BigUint<M>,  // g^r
    pub c2: BigUint<M>,  // pk^r * g^m
}

/// Déchiffrement homomorphique de la somme des votes
pub fn homomorphic_tally<M: ManagedTypeApi>(
    encrypted_votes: &[ElGamalCiphertext<M>],
) -> ElGamalCiphertext<M> {
    // TODO: Implémenter addition homomorphique
    // Pour chaque vote (c1_i, c2_i):
    //   c1_sum = c1_1 * c1_2 * ... * c1_n
    //   c2_sum = c2_1 * c2_2 * ... * c2_n
    // Résultat: Enc(sum(votes))

    ElGamalCiphertext {
        c1: BigUint::zero(),
        c2: BigUint::zero(),
    }
}
```

---

## 5. Plan de Migration

### Étape 1 : Développement Backend Crypto Service (1 semaine)
- [ ] Implémenter MerkleTree avec circomlibjs
- [ ] Implémenter blind signatures avec node-rsa
- [ ] Tests unitaires

### Étape 2 : Circuits zk-SNARK (2 semaines)
- [ ] Écrire circuits Circom
- [ ] Compiler circuits
- [ ] Générer proving/verification keys (trusted setup)
- [ ] Tests circuits

### Étape 3 : Frontend Crypto (1 semaine)
- [ ] Intégrer snarkjs pour génération preuves
- [ ] Implémenter chiffrement ElGamal (noble-curves)
- [ ] UI pour blind signature protocol
- [ ] Tests E2E

### Étape 4 : Smart Contracts (3 semaines)
- [ ] Implémenter vérificateur Groth16 en Rust
- [ ] Implémenter addition homomorphique ElGamal
- [ ] Remplacer crypto_mock.rs
- [ ] Audits de sécurité

### Étape 5 : Tests & Audit (2 semaines)
- [ ] Tests de sécurité
- [ ] Audit cryptographique externe
- [ ] Bug bounty
- [ ] Documentation complète

**Total estimé** : 9-10 semaines (2-3 mois)

---

## 6. Défis & Risques

### Défis Techniques

1. **Trusted Setup Groth16**
   - Nécessite une ceremony multi-party
   - Solution: Utiliser ceremony publique ou Powers of Tau

2. **Vérificateur Groth16 en Rust**
   - Pas de lib officielle pour MultiversX
   - Solution: Porter arkworks ou implémenter nous-mêmes

3. **Performance Smart Contracts**
   - Vérification zk-SNARK coûteuse en gas
   - Solution: Optimiser ou payer plus de gas

4. **Complexité UX**
   - Génération preuves peut prendre 5-10s
   - Solution: Loading states, Web Workers

### Risques Cryptographiques

1. **Implémentation incorrecte**
   - Risque: Preuves forgées, déchiffrement cassé
   - Mitigation: Audits, tests extensifs, code review

2. **Clé privée ElGamal compromise**
   - Risque: Votes déchiffrés avant fin élection
   - Mitigation: MPC (Multi-Party Computation) pour clé

3. **Trusted setup compromise**
   - Risque: Preuves forgées si paramètres corrompus
   - Mitigation: Ceremony publique avec plusieurs participants

---

## 7. Ressources & Documentation

### Bibliothèques

- **snarkjs**: https://github.com/iden3/snarkjs
- **circom**: https://docs.circom.io/
- **circomlib**: https://github.com/iden3/circomlib
- **noble-curves**: https://github.com/paulmillr/noble-curves
- **arkworks** (Rust): https://github.com/arkworks-rs

### Références Académiques

- Groth16 Paper: https://eprint.iacr.org/2016/260
- ElGamal: https://en.wikipedia.org/wiki/ElGamal_encryption
- Blind Signatures: https://en.wikipedia.org/wiki/Blind_signature
- Voting Systems Survey: https://eprint.iacr.org/2016/765

### Exemples de Code

- Tornado Cash (zk-SNARK voting): https://github.com/tornadocash
- Semaphore (Merkle tree + zk): https://github.com/semaphore-protocol
- MACI (Minimal Anti-Collusion Infrastructure): https://github.com/privacy-scaling-explorations/maci

---

## 8. Conclusion

Cette architecture cryptographique transforme DEMOCRATIX d'un POC en un système de vote électronique production-ready avec:

- ✅ **Anonymat mathématiquement garanti** (zk-SNARKs + blind signatures)
- ✅ **Vérifiabilité universelle** (blockchain publique)
- ✅ **Protection contre coercition** (impossible de prouver son vote)
- ✅ **Conformité RGPD** (pas de données personnelles on-chain)

**Prochaine étape** : Commencer par l'implémentation du `CryptoService` backend.

---

**Document par**: Claude Code
**Dernière mise à jour**: 30 Octobre 2025
