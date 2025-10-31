# Circuits zk-SNARK - DEMOCRATIX

Ce dossier contient les circuits **Circom** pour les preuves cryptographiques de DEMOCRATIX.

---

## 📁 Circuits Disponibles

### 1. `voter_eligibility.circom`
**Prouve** : "Je suis un électeur éligible dans le Merkle tree"
**Sans révéler** : Qui je suis

**Inputs Publics** :
- `merkleRoot` : Root du Merkle tree des électeurs
- `nullifier` : Nullifier unique (empêche double vote)
- `electionId` : ID de l'élection

**Inputs Privés** :
- `identityNullifier` : Nullifier secret de l'identité
- `identityTrapdoor` : Trapdoor secret
- `merklePathIndices` : Chemin dans le tree
- `merklePathElements` : Siblings

**Contraintes** :
```
commitment = Poseidon(nullifier, trapdoor)
MerkleVerify(commitment, root, path)
nullifier === Poseidon(identityNullifier, electionId)
```

### 2. `valid_vote.circom`
**Prouve** : "Mon vote est pour un candidat valide"
**Sans révéler** : Pour quel candidat

**Inputs Publics** :
- `electionId` : ID de l'élection
- `numCandidates` : Nombre de candidats
- `voteCommitment` : Commitment du vote

**Inputs Privés** :
- `candidateId` : ID du candidat choisi
- `randomness` : Sel aléatoire

**Contraintes** :
```
candidateId < numCandidates
voteCommitment === Poseidon(electionId, candidateId, randomness)
```

---

## 🔧 Installation

### Prérequis

1. **Circom Compiler** (Rust-based)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

2. **circoml** (Node.js libraries)
```bash
npm install -g circomlib
```

3. **snarkjs** (déjà installé dans package.json)
```bash
npm install
```

---

## 🚀 Compilation des Circuits

### Étape 1 : Compiler le circuit
```bash
cd backend/circuits

# Compiler voter_eligibility.circom
circom voter_eligibility.circom --r1cs --wasm --sym --c

# Compiler valid_vote.circom
circom valid_vote.circom --r1cs --wasm --sym --c
```

**Output** :
- `*.r1cs` : Représentation R1CS du circuit
- `*.wasm` : Circuit compilé pour génération de preuves
- `*.sym` : Fichier de symboles pour debugging

### Étape 2 : Setup (Powers of Tau)
```bash
# Télécharger Powers of Tau (une fois pour tous)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau

# Ou générer localement (très long!)
snarkjs powersoftau new bn128 20 pot20_0000.ptau -v
snarkjs powersoftau contribute pot20_0000.ptau pot20_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot20_0001.ptau pot20_final.ptau -v
```

### Étape 3 : Setup Phase 2 (Par circuit)
```bash
# Voter Eligibility
snarkjs groth16 setup voter_eligibility.r1cs powersOfTau28_hez_final_20.ptau voter_eligibility_0000.zkey
snarkjs zkey contribute voter_eligibility_0000.zkey voter_eligibility_final.zkey --name="1st Contributor" -v
snarkjs zkey export verificationkey voter_eligibility_final.zkey voter_eligibility_verification_key.json

# Valid Vote
snarkjs groth16 setup valid_vote.r1cs powersOfTau28_hez_final_20.ptau valid_vote_0000.zkey
snarkjs zkey contribute valid_vote_0000.zkey valid_vote_final.zkey --name="1st Contributor" -v
snarkjs zkey export verificationkey valid_vote_final.zkey valid_vote_verification_key.json
```

---

## 🧪 Tests des Circuits

### Test Voter Eligibility
```bash
# Créer input de test
cat > voter_eligibility_input.json <<EOF
{
  "merkleRoot": "12345...",
  "nullifier": "67890...",
  "electionId": "1",
  "identityNullifier": "secret123",
  "identityTrapdoor": "secret456",
  "merklePathIndices": [0, 1, 0, ...],
  "merklePathElements": ["111...", "222...", ...]
}
EOF

# Générer witness
node voter_eligibility_js/generate_witness.js voter_eligibility_js/voter_eligibility.wasm voter_eligibility_input.json witness.wtns

# Générer preuve
snarkjs groth16 prove voter_eligibility_final.zkey witness.wtns proof.json public.json

# Vérifier preuve
snarkjs groth16 verify voter_eligibility_verification_key.json public.json proof.json
```

### Test Valid Vote
```bash
# Créer input de test
cat > valid_vote_input.json <<EOF
{
  "electionId": "1",
  "numCandidates": "5",
  "voteCommitment": "789...",
  "candidateId": "2",
  "randomness": "random123"
}
EOF

# Même processus
node valid_vote_js/generate_witness.js valid_vote_js/valid_vote.wasm valid_vote_input.json witness.wtns
snarkjs groth16 prove valid_vote_final.zkey witness.wtns proof.json public.json
snarkjs groth16 verify valid_vote_verification_key.json public.json proof.json
```

---

## 📊 Statistiques des Circuits

### Voter Eligibility (depth 20)
- **Contraintes R1CS** : ~30,000
- **Taille preuve** : 192 bytes (Groth16)
- **Temps génération preuve** : ~2-5 secondes
- **Temps vérification** : ~2ms

### Valid Vote
- **Contraintes R1CS** : ~500
- **Taille preuve** : 192 bytes (Groth16)
- **Temps génération preuve** : ~100ms
- **Temps vérification** : ~2ms

---

## 🔗 Intégration

### Backend (Node.js)
```typescript
import { groth16 } from 'snarkjs';

// Générer preuve
const { proof, publicSignals } = await groth16.fullProve(
  input,
  'voter_eligibility_js/voter_eligibility.wasm',
  'voter_eligibility_final.zkey'
);

// Vérifier preuve
const vkey = JSON.parse(fs.readFileSync('voter_eligibility_verification_key.json'));
const isValid = await groth16.verify(vkey, publicSignals, proof);
```

### Frontend (React)
```typescript
import { groth16 } from 'snarkjs';

// Générer preuve côté client
const { proof, publicSignals } = await groth16.fullProve(
  input,
  '/circuits/voter_eligibility.wasm',
  '/circuits/voter_eligibility_final.zkey'
);

// Envoyer au backend pour vérification + soumission blockchain
```

### Smart Contract (Rust)
```rust
// Vérifier preuve on-chain
pub fn verify_eligibility_proof(
    proof: &Proof,
    public_signals: &[BigUint],
    vkey: &VerificationKey
) -> bool {
    groth16_verify(proof, public_signals, vkey)
}
```

---

## 🛠️ Scripts Utilitaires

### `compile-all.sh`
Compile tous les circuits automatiquement.

### `setup-all.sh`
Fait le setup (Phase 1 + Phase 2) pour tous les circuits.

### `test-circuits.sh`
Teste tous les circuits avec des inputs de test.

---

## 📚 Ressources

- **Circom Documentation** : https://docs.circom.io/
- **snarkjs** : https://github.com/iden3/snarkjs
- **circomlib** : https://github.com/iden3/circomlib
- **Groth16 Paper** : https://eprint.iacr.org/2016/260
- **Semaphore Circuits** : https://github.com/semaphore-protocol/semaphore/tree/main/packages/circuits

---

## ⚠️ Sécurité

### Trusted Setup
- **CRITIQUE** : Les zkeys doivent être générés via une ceremony multi-party
- **POC** : Setup local OK
- **Production** : Ceremony publique obligatoire (voir Powers of Tau)

### Vérification
- Toujours vérifier les preuves on-chain (smart contracts)
- Ne jamais faire confiance aux preuves client-side uniquement

---

**Dernière mise à jour** : 30 Octobre 2025
**Version** : v1.0
