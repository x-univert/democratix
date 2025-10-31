# Étude des Projets Existants - Cryptographie Vote/Privacy

**Date**: 30 Octobre 2025
**Objectif**: Analyser les meilleures pratiques crypto des projets leaders

---

## 🎯 Projets Analysés

1. **Tornado Cash** - Privacy transactions (ETH)
2. **Semaphore** - Anonymous signaling
3. **MACI** - Minimal Anti-Collusion Infrastructure
4. **Vocdoni** - Decentralized voting platform
5. **Snapshot** - Off-chain voting with crypto proofs

---

## 1. Tornado Cash

**Repository**: https://github.com/tornadocash/tornado-core
**Stack**: Solidity + Circom + snarkjs

### Architecture Crypto

#### Merkle Tree pour Anonymity Set
```javascript
// Utilise MerkleTreeWithHistory.sol
contract MerkleTreeWithHistory {
  uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
  uint32 public levels;
  bytes32[] public filledSubtrees;
  bytes32[] public zeros;
  uint32 public currentRootIndex = 0;
  uint32 public nextIndex = 0;
  uint32 public constant ROOT_HISTORY_SIZE = 100;
  bytes32[ROOT_HISTORY_SIZE] public roots;

  function insert(bytes32 _leaf) internal returns (uint32 index) {
    // Insert leaf and update Merkle tree
  }
}
```

**📝 Ce qu'on apprend** :
- Merkle tree de profondeur 20 (1 million de leaves)
- Historique des 100 derniers roots (pour preuves anciennes)
- Hash fonction: Poseidon (optimisé pour zk-SNARK)

#### Circuit zk-SNARK (withdraw.circom)
```javascript
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pedersen.circom";
include "merkleTree.circom";

template Withdraw(levels) {
    signal input root;
    signal input nullifierHash;
    signal input recipient;
    signal input relayer;
    signal input fee;
    signal input refund;

    signal input nullifier;
    signal input secret;
    signal private input pathElements[levels];
    signal private input pathIndices[levels];

    component hasher = CommitmentHasher();
    hasher.nullifier <== nullifier;
    hasher.secret <== secret;
    signal commitment <== hasher.commitment;

    component tree = MerkleTreeChecker(levels);
    tree.leaf <== commitment;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    component nullifierHasher = Pedersen(248);
    nullifierHasher.in <== nullifier;
    nullifierHasher.out[0] === nullifierHash;
}
```

**📝 Ce qu'on apprend** :
- **Commitment scheme**: `commitment = Hash(nullifier, secret)`
- **Nullifier** empêche double-dépense (comme double vote)
- **Merkle proof** prouve appartenance sans révéler quelle feuille
- Pedersen hash (plus rapide que Poseidon pour certaines ops)

#### Smart Contract Vérification
```solidity
function withdraw(
    bytes calldata _proof,
    bytes32 _root,
    bytes32 _nullifierHash,
    address payable _recipient,
    address payable _relayer,
    uint256 _fee,
    uint256 _refund
) external payable nonReentrant {
    require(!nullifierHashes[_nullifierHash], "The note has been already spent");
    require(isKnownRoot(_root), "Cannot find your merkle root");

    // Verify zk-SNARK proof
    require(
        verifier.verifyProof(
            _proof,
            [uint256(_root), uint256(_nullifierHash), /* ... */]
        ),
        "Invalid withdraw proof"
    );

    nullifierHashes[_nullifierHash] = true;
    // Process withdrawal
}
```

**📝 Ce qu'on apprend** :
- Vérification Groth16 via contrat externe `verifier`
- Nullifier hashmap pour éviter réutilisation
- Root history pour preuves anciennes

---

## 2. Semaphore (Ethereum Foundation)

**Repository**: https://github.com/semaphore-protocol/semaphore
**Stack**: Solidity + Circom + TypeScript SDK

### Architecture Crypto

#### Concept: Anonymous Group Membership
```
1. Créer une identité: identity = Hash(secret)
2. Rejoindre un groupe: groupe.addMember(identity)
3. Signaler anonymement: prouver "je suis dans le groupe" sans révéler qui
4. Nullifier empêche double signaling
```

#### Circuit semaphore.circom
```javascript
template Semaphore(nLevels) {
    // Public inputs
    signal input merkleTreeRoot;
    signal input signalHash;
    signal input nullifierHash;
    signal input externalNullifier;

    // Private inputs
    signal input identityNullifier;
    signal input identityTrapdoor;
    signal input merkleTreePathIndices[nLevels];
    signal input merkleTreeSiblings[nLevels];

    // Calculate identity commitment
    component identityCommitment = CalculateIdentityCommitment();
    identityCommitment.identityNullifier <== identityNullifier;
    identityCommitment.identityTrapdoor <== identityTrapdoor;

    // Verify Merkle proof
    component merkleTreeInclusionProof = MerkleTreeInclusionProof(nLevels);
    merkleTreeInclusionProof.leaf <== identityCommitment.out;
    merkleTreeInclusionProof.root <== merkleTreeRoot;

    // Calculate nullifier
    component calculateNullifierHash = CalculateNullifierHash();
    calculateNullifierHash.externalNullifier <== externalNullifier;
    calculateNullifierHash.identityNullifier <== identityNullifier;
    calculateNullifierHash.out === nullifierHash;

    // Verify signal
    signal signalHashSquared <== signalHash * signalHash;
}
```

**📝 Ce qu'on apprend** :
- **Identity commitment** = Hash(nullifier, trapdoor)
- **External nullifier** pour scope (1 vote par élection)
- **Signal** peut être n'importe quoi (vote, message, etc.)
- Utilise Poseidon pour tous les hash

#### SDK TypeScript (Frontend)
```typescript
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof } from "@semaphore-protocol/proof"

// 1. Créer identité
const identity = new Identity("secret-value")

// 2. Créer groupe
const group = new Group(1, 20) // groupId=1, depth=20
group.addMember(identity.commitment)

// 3. Générer preuve
const signal = "I vote for candidate #5"
const externalNullifier = "election-2024-president"
const proof = await generateProof(identity, group, externalNullifier, signal)

// 4. Vérifier on-chain
await contract.verifyProof(
    group.root,
    proof.merkleTreeRoot,
    proof.signal,
    proof.nullifierHash,
    proof.externalNullifier,
    proof.proof
)
```

**📝 Ce qu'on apprend** :
- SDK très simple côté client
- Génération preuve en ~2-5 secondes
- Pas besoin de serveur pour preuves (tout client-side)

---

## 3. MACI (Minimal Anti-Collusion Infrastructure)

**Repository**: https://github.com/privacy-scaling-explorations/maci
**Stack**: Solidity + Circom + TypeScript

### Architecture Crypto

#### Concept: Vote Resistant to Bribery
```
Problème: Avec votes publics, quelqu'un peut me payer pour voter X
Solution MACI:
1. Votes chiffrés avec clé de l'organisateur
2. Organisateur déchiffre ET compte en privé
3. Publie preuve zk-SNARK que comptage est correct
4. Personne ne peut prouver comment il a voté (anti-coercition)
```

#### Flow de Vote
```
1. User génère keypair (privKey, pubKey)
2. User s'enregistre: envoie pubKey à MACI contract
3. User vote: message chiffré avec clé de l'organisateur
   Enc(vote) = ElGamal(candidateId, timestamp, nonce)
4. Fin vote: organisateur déchiffre TOUS les votes
5. Organisateur compte + génère zk-SNARK proof "j'ai compté correctement"
6. Contract vérifie proof et publie résultats
```

#### Circuit ProcessMessages
```javascript
template ProcessMessages(voteOptionTreeDepth) {
    // Coordinator's private inputs
    signal input encPubKey;  // Coordinator's encryption key
    signal input coordPrivKey;  // Coordinator's private key

    // Public inputs
    signal input inputHash;  // Hash of all inputs
    signal input packedVals;  // Number of messages, etc.

    // Process each message
    for (var i = 0; i < batchSize; i++) {
        // Decrypt message
        component decrypter = MessageDecrypter();
        decrypter.encPrivKey <== coordPrivKey;
        decrypter.message <== messages[i];

        // Verify signature
        component sigVerifier = EdDSAMiMCVerifier();
        sigVerifier.pubKey <== senderPubKey;

        // Update state tree with vote
        component stateTreeUpdater = StateTreeUpdater();
    }

    // Output new state root
    signal output newStateRoot;
}
```

**📝 Ce qu'on apprend** :
- **Coordinateur déchiffre off-chain** pour privacy
- **Preuve zk-SNARK** que déchiffrement + comptage corrects
- Permet **re-vote** (dernier vote compte) → anti-coercition
- EdDSA signatures pour authentifier votants

---

## 4. Vocdoni

**Repository**: https://github.com/vocdoni/vocdoni-node
**Stack**: Go + zkSNARK + IPFS

### Architecture Crypto

#### Concept: Census Merkle Tree + Franchise Proof
```
1. Census (liste électeurs) stocké en Merkle tree
2. Chaque électeur a un zkProof "je suis dans le census"
3. Votes chiffrés stockés sur IPFS
4. Dépouillement avec clés distribuées (threshold encryption)
```

#### Franchise Proof (Simplified)
```go
type FranchiseProof struct {
    Type            string  // "zk-census" or "blind-signature"
    MerkleRoot      []byte
    MerkleProof     [][]byte  // Merkle siblings
    LeafIndex       uint32
    EncryptedVote   []byte
    ZKProof         []byte    // zk-SNARK proof
}

func VerifyFranchiseProof(proof *FranchiseProof, censusRoot []byte) bool {
    // 1. Verify Merkle proof
    if !VerifyMerkleProof(proof.MerkleProof, proof.LeafIndex, censusRoot) {
        return false
    }

    // 2. Verify zk-SNARK proof
    if !VerifyZKProof(proof.ZKProof, proof.MerkleRoot) {
        return false
    }

    return true
}
```

**📝 Ce qu'on apprend** :
- **Census Merkle tree** IPFS (off-chain pour scalabilité)
- **Threshold encryption** : N autorités, besoin K pour déchiffrer
- **Rolling census** : Merkle tree peut être updaté
- Votes stockés encrypted sur IPFS, pas blockchain

---

## 5. Snapshot (Off-chain Voting)

**Repository**: https://github.com/snapshot-labs/snapshot
**Stack**: IPFS + TypeScript + EIP-712 Signatures

### Architecture (Pas de zk-SNARK!)

#### Concept: Off-chain Voting avec Crypto Signatures
```
1. User signe son vote avec MetaMask (EIP-712)
2. Vote stocké sur IPFS
3. Backend agrège tous les votes
4. Résultats publiés (pas on-chain)
```

#### Vote Signature (EIP-712)
```typescript
const domain = {
    name: 'snapshot',
    version: '0.1.4'
};

const types = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'bytes32' },
        { name: 'choice', type: 'uint32' },
        { name: 'metadata', type: 'string' }
    ]
};

const message = {
    from: '0x...',
    space: 'my-dao.eth',
    timestamp: 1234567890,
    proposal: '0xabc...',
    choice: 2,
    metadata: '{}'
};

const signature = await signer._signTypedData(domain, types, message);
```

**📝 Ce qu'on apprend** :
- **Plus simple** : Pas de zk-SNARK, juste signatures
- **Off-chain** : Pas de gas fees
- **Vérifiable** : Signature EIP-712 prouve identité
- **Trade-off** : Moins d'anonymat, mais très scalable

---

## 📊 Comparaison des Approches

| Projet | Anonymat | Scalabilité | Complexité | Coût Gas | Anti-Coercition |
|--------|----------|-------------|------------|----------|-----------------|
| **Tornado Cash** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Élevé | ⭐⭐⭐ |
| **Semaphore** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Moyen | ⭐⭐⭐ |
| **MACI** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Très élevé | ⭐⭐⭐⭐⭐ |
| **Vocdoni** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Faible | ⭐⭐⭐⭐ |
| **Snapshot** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐ | Aucun | ⭐ |

---

## 🎯 Ce qu'on va implémenter pour DEMOCRATIX

### Phase 1 (Cette semaine) - Semaphore-like
```
✅ Merkle tree des électeurs (comme Semaphore)
✅ Identity commitments
✅ Nullifiers pour éviter double vote
✅ Backend service pour gérer le tree
❌ Pas encore de zk-SNARK (on garde crypto_mock.rs)
```

**Pourquoi Semaphore-like** :
- Architecture simple et prouvée
- SDK client excellent
- Documentation complète
- Communauté active

### Phase 2 (Semaine prochaine) - Circuits zk-SNARK
```
✅ Circuit voter_eligibility.circom (inspiré Semaphore)
✅ Circuit valid_vote.circom (custom pour nous)
✅ Génération preuves côté client
✅ Tests avec snarkjs
```

### Phase 3 (Mois prochain) - Smart Contracts
```
✅ Vérificateur Groth16 en Rust
✅ Remplacer crypto_mock.rs
✅ Tests on-chain
```

### Phase 4 (Optionnel) - MACI-like Features
```
⏳ Vote re-casting (anti-coercition)
⏳ Encrypted messages to coordinator
⏳ Batch processing avec zk-SNARK
```

---

## 📚 Ressources Utiles

### Documentation
- Tornado Cash: https://docs.tornado.cash/
- Semaphore: https://semaphore.appliedzkp.org/
- MACI: https://maci.pse.dev/
- Vocdoni: https://developer.vocdoni.io/
- Circomlib: https://github.com/iden3/circomlib

### Tutoriels
- zk-SNARK Tutorial: https://www.youtube.com/watch?v=fOGdb1CTu5c
- Semaphore Workshop: https://github.com/semaphore-protocol/workshop
- Circom Workshop: https://learn.0xparc.org/

### Bibliothèques
```json
{
  "@semaphore-protocol/identity": "^3.15.0",
  "@semaphore-protocol/group": "^3.15.0",
  "@semaphore-protocol/proof": "^3.15.0",
  "snarkjs": "^0.7.0",
  "circomlibjs": "^0.1.7",
  "ffjavascript": "^0.2.60"
}
```

---

## ✅ Conclusion

**Approche recommandée pour DEMOCRATIX** :

1. **Base: Semaphore** (merkle tree + identity commitments)
2. **Features MACI** (vote re-casting si budget le permet)
3. **Scalability Vocdoni** (IPFS pour census si >100k votants)
4. **Simplicité Snapshot** (fallback si zk-SNARK trop complexe)

**Prochaine étape** : Implémenter le `CryptoService` backend avec Merkle tree (style Semaphore).

---

**Document par**: Claude Code
**Dernière mise à jour**: 30 Octobre 2025
