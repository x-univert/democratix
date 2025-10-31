# Phase 3 : Plan Technique - Intégration zk-SNARK avec MultiversX

**Date**: 31 Octobre 2025
**Statut**: 🔄 En cours
**Approche**: Hybride (Vérification off-chain + Storage on-chain)

---

## 🎯 Objectif

Intégrer les circuits zk-SNARK avec l'écosystème DEMOCRATIX (MultiversX blockchain + Backend Node.js + Frontend React).

## ⚠️ Défi Identifié

**Problème** : MultiversX ne dispose pas (encore) de :
- ✗ Support natif pour courbe elliptique BN254
- ✗ Opérations de pairing pour Groth16
- ✗ Précompiles pour vérification zk-SNARK

**Impact** : Impossible de vérifier des preuves Groth16 directement on-chain sans implémentation custom complexe.

---

## 🔀 Approche Choisie : Architecture Hybride

### Principe

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Frontend  │────1───▶│   Backend    │────3───▶│  Smart Contract │
│   (React)   │         │  (Node.js)   │         │  (MultiversX)   │
└─────────────┘         └──────────────┘         └─────────────────┘
       │                        │
       │                        │
       │                   2. Vérifie
       │                   zk-SNARK
       │                   (snarkjs)
       │                        │
       └────────────────────────┘
       Génère preuve
       (circom + snarkjs)
```

### Flux de Données

**1. Frontend** (Génération de preuve côté client)
```javascript
// L'électeur génère sa preuve localement
const proof = await generateProof({
  candidateId: 2,
  randomness: random(),
  electionId: 1,
  numCandidates: 5,
  voteCommitment: commitment
});

// Envoie au backend
await fetch('/api/vote', {
  method: 'POST',
  body: JSON.stringify({
    proof: proof,
    publicSignals: publicSignals
  })
});
```

**2. Backend** (Vérification off-chain)
```javascript
// backend/src/services/zkVerifier.ts
export async function verifyVoteProof(proof, publicSignals) {
  // Vérification avec snarkjs
  const verificationKey = loadVerificationKey('valid_vote');

  const isValid = await snarkjs.groth16.verify(
    verificationKey,
    publicSignals,
    proof
  );

  if (!isValid) {
    throw new Error('Invalid proof');
  }

  // Si valide, signer et autoriser la transaction blockchain
  return {
    verified: true,
    signature: sign(publicSignals)
  };
}
```

**3. Smart Contract** (Storage on-chain)
```rust
// contracts/voting/src/lib.rs
#[endpoint(submitVote)]
fn submit_vote(
    &self,
    election_id: u64,
    vote_commitment: ManagedBuffer,
    nullifier: ManagedBuffer,
    backend_signature: ManagedBuffer
) {
    // Vérifier signature du backend (proof vérifié off-chain)
    self.verify_backend_signature(&backend_signature);

    // Vérifier que nullifier n'est pas déjà utilisé
    require!(
        !self.used_nullifiers().contains(&nullifier),
        "Double vote detected"
    );

    // Stocker le vote
    self.used_nullifiers().insert(nullifier);
    self.vote_commitments(election_id).push(&vote_commitment);

    // Incrémenter compteur
    self.vote_count(election_id).update(|c| *c += 1);
}
```

---

## 📋 Tâches Phase 3

### ✅ Déjà Complété (Phase 2)
- [x] Circuits zk-SNARK compilés
- [x] Clés cryptographiques générées
- [x] Tests de preuves validés

### 🔄 En Cours

#### 1. Backend - Service de Vérification zk-SNARK

**Fichier**: `backend/src/services/zkVerifier.ts`

```typescript
import * as snarkjs from 'snarkjs';
import { readFileSync } from 'fs';
import { join } from 'path';

export class ZKVerifier {
  private validVoteVKey: any;
  private voterEligibilityVKey: any;

  constructor() {
    // Charger les verification keys
    this.validVoteVKey = JSON.parse(
      readFileSync(
        join(__dirname, '../../circuits/build/valid_vote_verification_key.json'),
        'utf-8'
      )
    );

    this.voterEligibilityVKey = JSON.parse(
      readFileSync(
        join(__dirname, '../../circuits/build/voter_eligibility_simple_verification_key.json'),
        'utf-8'
      )
    );
  }

  async verifyValidVoteProof(proof: any, publicSignals: string[]): Promise<boolean> {
    return await snarkjs.groth16.verify(
      this.validVoteVKey,
      publicSignals,
      proof
    );
  }

  async verifyVoterEligibilityProof(proof: any, publicSignals: string[]): Promise<boolean> {
    return await snarkjs.groth16.verify(
      this.voterEligibilityVKey,
      publicSignals,
      proof
    );
  }
}
```

#### 2. Backend - Endpoints API

**Fichier**: `backend/src/routes/zkProof.routes.ts`

```typescript
import { Router } from 'express';
import { ZKVerifier } from '../services/zkVerifier';
import { sign } from '../utils/crypto';

const router = Router();
const zkVerifier = new ZKVerifier();

// Vérifier et autoriser un vote
router.post('/verify-vote', async (req, res) => {
  const { proof, publicSignals } = req.body;

  try {
    // Vérifier la preuve
    const isValid = await zkVerifier.verifyValidVoteProof(proof, publicSignals);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid proof' });
    }

    // Générer signature pour autoriser la transaction blockchain
    const signature = sign(publicSignals);

    res.json({
      verified: true,
      signature,
      publicSignals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### 3. Smart Contract - Ajout Vérification Signature

**Fichier**: `contracts/voting/src/lib.rs`

```rust
use multiversx_sc::imports::*;

#[multiversx_sc::contract]
pub trait VotingContract {
    // Adresse du backend autorisé à vérifier les preuves
    #[view(getBackendAddress)]
    #[storage_mapper("backendAddress")]
    fn backend_address(&self) -> SingleValueMapper<ManagedAddress>;

    // Nullifiers utilisés (pour empêcher double vote)
    #[view(getUsedNullifiers)]
    #[storage_mapper("usedNullifiers")]
    fn used_nullifiers(&self) -> UnorderedSetMapper<ManagedBuffer>;

    // Vote commitments par élection
    #[view(getVoteCommitments)]
    #[storage_mapper("voteCommitments")]
    fn vote_commitments(&self, election_id: u64) -> VecMapper<ManagedBuffer>;

    #[endpoint(submitPrivateVote)]
    fn submit_private_vote(
        &self,
        election_id: u64,
        vote_commitment: ManagedBuffer,
        nullifier: ManagedBuffer,
        backend_signature: ManagedBuffer
    ) {
        // 1. Vérifier que l'élection existe et est active
        require!(
            self.is_election_active(election_id),
            "Election not active"
        );

        // 2. Vérifier signature du backend (qui a vérifié la preuve)
        let message = self.hash_vote_data(&election_id, &vote_commitment, &nullifier);
        self.crypto().verify_ed25519(
            self.backend_address().get().as_managed_buffer(),
            &message,
            &backend_signature
        );

        // 3. Vérifier que nullifier n'est pas déjà utilisé
        require!(
            !self.used_nullifiers().contains(&nullifier),
            "Nullifier already used - double vote detected"
        );

        // 4. Stocker le vote
        self.used_nullifiers().insert(nullifier);
        self.vote_commitments(election_id).push(&vote_commitment);

        // 5. Incrémenter compteur
        self.election_vote_count(election_id).update(|count| *count += 1);

        // 6. Émettre événement
        self.private_vote_submitted_event(election_id, vote_commitment);
    }

    // Helper pour vérifier si élection active
    fn is_election_active(&self, election_id: u64) -> bool {
        let election = self.elections(election_id).get();
        let current_time = self.blockchain().get_block_timestamp();
        election.start_time <= current_time && current_time <= election.end_time
    }

    // Helper pour hasher les données du vote
    fn hash_vote_data(
        &self,
        election_id: &u64,
        vote_commitment: &ManagedBuffer,
        nullifier: &ManagedBuffer
    ) -> ManagedBuffer {
        let mut data = ManagedBuffer::new();
        data.append(&election_id.to_be_bytes()[..]);
        data.append(vote_commitment.as_ref());
        data.append(nullifier.as_ref());
        self.crypto().keccak256(data)
    }

    #[event("privateVoteSubmitted")]
    fn private_vote_submitted_event(
        &self,
        #[indexed] election_id: u64,
        vote_commitment: ManagedBuffer
    );
}
```

#### 4. Frontend - Génération et Soumission de Preuves

**Fichier**: `frontend/src/services/zkProofService.ts`

```typescript
import { buildPoseidon } from 'circomlibjs';
import * as snarkjs from 'snarkjs';

export class ZKProofService {
  private poseidon: any;

  async initialize() {
    this.poseidon = await buildPoseidon();
  }

  // Générer une preuve de vote valide
  async generateVoteProof(
    electionId: number,
    candidateId: number,
    numCandidates: number
  ) {
    // 1. Générer randomness
    const randomness = this.generateRandom();

    // 2. Calculer voteCommitment
    const voteCommitment = this.poseidon.F.toString(
      this.poseidon([
        BigInt(electionId),
        BigInt(candidateId),
        BigInt(randomness)
      ])
    );

    // 3. Préparer inputs
    const inputs = {
      electionId: electionId.toString(),
      numCandidates: numCandidates.toString(),
      voteCommitment,
      candidateId: candidateId.toString(),
      randomness: randomness.toString()
    };

    // 4. Générer preuve
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      '/circuits/valid_vote_js/valid_vote.wasm',
      '/circuits/valid_vote_final.zkey'
    );

    return { proof, publicSignals, voteCommitment };
  }

  // Soumettre le vote avec preuve
  async submitPrivateVote(
    electionId: number,
    candidateId: number,
    numCandidates: number
  ) {
    // 1. Générer preuve
    const { proof, publicSignals, voteCommitment } =
      await this.generateVoteProof(electionId, candidateId, numCandidates);

    // 2. Envoyer au backend pour vérification
    const response = await fetch('/api/zk/verify-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof, publicSignals })
    });

    if (!response.ok) {
      throw new Error('Proof verification failed');
    }

    const { signature } = await response.json();

    // 3. Soumettre sur blockchain avec signature
    // TODO: Intégrer avec MultiversX SDK

    return { voteCommitment, signature };
  }

  private generateRandom(): bigint {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return BigInt('0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(''));
  }
}
```

---

## 🔒 Sécurité

### Avantages de l'Approche Hybride

✅ **Zero-Knowledge Préservé**
- Les preuves sont générées côté client
- Le candidateId reste secret (jamais envoyé)
- Backend ne voit que la preuve cryptographique

✅ **Vérification Cryptographique**
- snarkjs vérifie mathématiquement la validité
- Impossible de forger une preuve sans les secrets

✅ **Protection Double Vote**
- Nullifier unique par électeur/élection
- Vérifié on-chain (impossible de réutiliser)

✅ **Signature Backend**
- Seules les preuves valides sont autorisées on-chain
- Protection contre replay attacks

### Risques et Mitigation

⚠️ **Risque 1: Backend Compromis**
```
Risque: Si le backend est hacké, il pourrait signer des votes invalides

Mitigation:
- ✅ Clé de signature stockée dans HSM/KMS
- ✅ Rate limiting sur les endpoints
- ✅ Monitoring et alertes
- ✅ Multi-signature (plusieurs backends)
```

⚠️ **Risque 2: Centralisation**
```
Risque: Le backend est un point centralisé

Mitigation (futures versions):
- 🔄 Implémenter vérificateur Groth16 natif MultiversX
- 🔄 Utiliser réseau d'oracles décentralisés
- 🔄 Migration vers STARKs (transparent, pas de setup)
```

---

## 📊 Performance Estimée

| Opération | Temps | Coût Gas | Notes |
|-----------|-------|----------|-------|
| Génération preuve (frontend) | ~100ms | 0 | Côté client |
| Vérification proof (backend) | ~5ms | 0 | Off-chain |
| Soumission blockchain | ~1s | ~10M gas | Transaction MultiversX |
| **Total par vote** | **~1.1s** | **~10M gas** | Comparable au vote standard |

---

## 🛠️ Outils et Dépendances

### Backend
```json
{
  "dependencies": {
    "snarkjs": "^0.7.5",
    "circomlibjs": "^0.1.7",
    "@multiversx/sdk-core": "latest",
    "express": "^4.18.0"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "snarkjs": "^0.7.5",
    "circomlibjs": "^0.1.7",
    "@multiversx/sdk-dapp": "latest"
  }
}
```

### Smart Contract
```toml
[dependencies]
multiversx-sc = "0.47.0"
```

---

## 📅 Timeline

| Phase | Durée | Status |
|-------|-------|--------|
| ✅ Phase 2: Circuits zk-SNARK | 2 jours | Complété |
| 🔄 Phase 3.1: Backend verifier | 1 jour | En cours |
| ⏳ Phase 3.2: Smart contract updates | 1 jour | À faire |
| ⏳ Phase 3.3: Frontend integration | 1 jour | À faire |
| ⏳ Phase 3.4: Tests end-to-end | 1 jour | À faire |

**Total Phase 3**: 4 jours

---

## 🚀 Prochaines Étapes Immédiates

1. **[IN PROGRESS]** Créer `backend/src/services/zkVerifier.ts`
2. **[NEXT]** Créer endpoints API `/api/zk/verify-vote`
3. **[NEXT]** Modifier smart contract `voting` pour accepter signatures
4. **[NEXT]** Créer `frontend/src/services/zkProofService.ts`
5. **[NEXT]** Tests end-to-end complets

---

## 📚 Références

- [snarkjs Documentation](https://github.com/iden3/snarkjs)
- [MultiversX Smart Contracts](https://docs.multiversx.com/developers/developer-reference/)
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)

---

**Dernière mise à jour**: 31 Octobre 2025, 12:30
**Responsable**: Claude + Développeur DEMOCRATIX
