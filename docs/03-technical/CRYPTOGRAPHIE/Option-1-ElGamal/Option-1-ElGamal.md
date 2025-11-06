# 🔐 Option 1 : Chiffrement ElGamal pour Votes Privés

**Date** : 1er Novembre 2025
**Version** : 1.0
**Statut** : 📋 À IMPLÉMENTER (Recommandé)
**Complexité** : ⭐⭐ Moyenne
**Durée estimée** : 2-3 semaines

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Principes du Chiffrement ElGamal](#principes-du-chiffrement-elgamal)
3. [Architecture Système](#architecture-système)
4. [Flux de Vote Complet](#flux-de-vote-complet)
5. [Implémentation Technique](#implémentation-technique)
6. [Sécurité et Garanties](#sécurité-et-garanties)
7. [Coûts et Performance](#coûts-et-performance)
8. [Comparaison avec Option 2](#comparaison-avec-option-2)

---

## Vue d'Ensemble

### Concept

L'**Option 1** utilise le **chiffrement ElGamal** seul pour garantir la confidentialité des votes privés tout en permettant leur comptage après la clôture de l'élection.

### Principe de Base

```
┌─────────────────────────────────────────────────────────────┐
│                    VOTE PRIVÉ - OPTION 1                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Électeur vote → Chiffrement ElGamal → Blockchain           │
│                                                               │
│  Vote chiffré visible publiquement (mais illisible)         │
│                                                               │
│  Élection fermée → Organisateur déchiffre → Résultats       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Garanties

✅ **Anonymat** : Impossible de savoir QUI a voté pour QUOI
✅ **Confidentialité** : Vote reste secret pendant l'élection
✅ **Comptabilité** : Résultats obtenus après déchiffrement
✅ **Vérifiabilité** : Tout le monde peut vérifier les votes chiffrés
✅ **Économique** : 2-3× moins cher que Option 2

---

## Principes du Chiffrement ElGamal

### Mathématiques de Base

ElGamal est un **système de chiffrement asymétrique** basé sur les courbes elliptiques.

#### 1. Génération des Clés

```
Setup (fait par l'organisateur au début de l'élection):

1. Choisir une courbe elliptique : secp256k1 (même que Bitcoin/Ethereum)
2. Choisir un générateur : G (point de base sur la courbe)
3. Générer une clé privée : sk = random(1, n) où n = ordre de la courbe
4. Calculer la clé publique : pk = sk × G

Résultat:
  - Clé publique (pk) : Publiée pour que les électeurs chiffrent
  - Clé privée (sk) : Gardée secrète par l'organisateur pour déchiffrer
```

#### 2. Chiffrement d'un Vote

```
Électeur veut voter pour candidateId:

1. Récupérer la clé publique pk de l'élection
2. Générer un nombre aléatoire : r = random(1, n)
3. Calculer :
   - c1 = r × G          (composante 1)
   - c2 = r × pk + m × G (composante 2)
   où m = candidateId

Vote chiffré = (c1, c2)
```

**Exemple concret** :
```
Voter pour candidat 2 :
  pk = 0x04a3f5b8... (clé publique élection)
  r = 0x7b3d9a1... (random)

  c1 = r × G = 0x3c7f2e... (32 bytes)
  c2 = r × pk + 2 × G = 0x9d4a6b... (32 bytes)

  Vote chiffré = (0x3c7f2e..., 0x9d4a6b...)
```

#### 3. Déchiffrement

```
Organisateur déchiffre après clôture :

1. Récupérer (c1, c2) de la blockchain
2. Calculer : m × G = c2 - sk × c1
3. Retrouver m (candidateId) par recherche discrète

Exemple:
  c2 - sk × c1 = (r × pk + m × G) - sk × (r × G)
                = r × (sk × G) + m × G - sk × r × G
                = m × G

  Ensuite, chercher m tel que m × G = résultat
  (Facile car m est petit : 0 à 50 candidats max)
```

### Propriété Homomorphique (Bonus)

ElGamal est **additivement homomorphique** :

```
Encrypt(m1) + Encrypt(m2) = Encrypt(m1 + m2)

Exemple pour compter votes :
  Vote Alice pour candidat 2 : Enc(2) = (c1_A, c2_A)
  Vote Bob pour candidat 2   : Enc(2) = (c1_B, c2_B)
  Vote Carol pour candidat 5 : Enc(5) = (c1_C, c2_C)

  Addition homomorphique :
  (c1_A, c2_A) + (c1_B, c2_B) + (c1_C, c2_C) = Enc(2 + 2 + 5) = Enc(9)

  Déchiffrer Enc(9) → 9 votes au total
```

**Note** : Pour DEMOCRATIX, on déchiffre vote par vote (plus simple). L'homomorphie est un bonus pour optimiser plus tard.

---

## Architecture Système

### Vue d'Ensemble

```
┌────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Page Vote                                                │  │
│  │  ├─ Récupérer clé publique élection                      │  │
│  │  ├─ Chiffrer candidateId avec ElGamal                    │  │
│  │  ├─ Envoyer (c1, c2) au backend                          │  │
│  │  └─ Afficher confirmation                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTP POST /vote
                         │
┌────────────────────────▼───────────────────────────────────────┐
│                        BACKEND                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ElGamal Service                                          │  │
│  │  ├─ Génération clés (pk, sk) pour chaque élection       │  │
│  │  ├─ Signature backend du vote chiffré                   │  │
│  │  ├─ API : /elections/:id/public-key                     │  │
│  │  └─ API : /elections/:id/decrypt-votes (après clôture)  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │ Transaction blockchain
                         │
┌────────────────────────▼───────────────────────────────────────┐
│                    SMART CONTRACT                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  submitPrivateVote(electionId, c1, c2, nullifier, sig)  │  │
│  │  ├─ Vérifier signature backend                          │  │
│  │  ├─ Vérifier nullifier non utilisé (pas de double vote) │  │
│  │  ├─ Stocker (c1, c2) on-chain                           │  │
│  │  └─ Émettre événement VoteCasted                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Storage:                                                        │
│    private_votes_elgamal[electionId] = [                       │
│      {c1: 0x3c7f..., c2: 0x9d4a..., nullifier: 0xabcd...},    │
│      {c1: 0x8b2c..., c2: 0x5e9f..., nullifier: 0xef01...},    │
│      ...                                                         │
│    ]                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Composants

#### 1. **Frontend** (`@noble/curves`)
- Bibliothèque : `@noble/curves/secp256k1`
- Chiffrement côté client (JavaScript)
- Génération de randomness sécurisée

#### 2. **Backend** (Node.js + ElGamal Service)
- Génération et stockage des clés
- Signature des votes (anti-spam)
- Déchiffrement après clôture

#### 3. **Smart Contract** (Rust)
- Stockage votes chiffrés (c1, c2)
- Vérification nullifiers (anti-double vote)
- Émission d'événements

---

## Flux de Vote Complet

### Phase 1 : Création de l'Élection (Organisateur)

```
Organisateur crée une élection avec votes privés :

1. Frontend : Formulaire création élection
   └─ Cocher : "Activer votes privés chiffrés"

2. Backend : Génération clés ElGamal
   POST /elections
   {
     "title": "Élection Présidentielle 2025",
     "enablePrivateVoting": true,
     ...
   }

   → Backend génère :
     - sk (clé privée) : 0x7b3d9a1c5f8e... (gardée secrète)
     - pk (clé publique) : 0x04a3f5b8... (publique)

   → Stocke :
     - sk dans base chiffrée (ou HSM)
     - pk dans base publique

3. Smart Contract : Enregistre élection
   createElection(...)
   → Élection créée avec ID = 42

4. Backend : Lie la clé publique à l'élection
   election_keys[42] = {
     publicKey: "0x04a3f5b8...",
     privateKeyHash: "hash(sk)"  // pour vérif intégrité
   }

✅ Élection prête avec chiffrement activé
```

### Phase 2 : Vote d'un Électeur

```
Alice veut voter pour Bob (candidateId = 2) :

1. Frontend : Page de vote
   - Alice sélectionne candidat Bob
   - Clique "🔐 Voter en Mode Privé"

2. Frontend : Récupération clé publique
   GET /elections/42/public-key
   → Retourne : pk = "0x04a3f5b8..."

3. Frontend : Chiffrement ElGamal
   import { elgamal } from '@noble/curves/secp256k1';

   const candidateId = 2;
   const randomness = crypto.getRandomValues(new Uint8Array(32));

   const encrypted = elgamal.encrypt(candidateId, pk, randomness);
   // encrypted = { c1: "0x3c7f...", c2: "0x9d4a..." }

4. Frontend : Génération nullifier
   const nullifier = poseidon(aliceSecret, electionId);
   // nullifier = "0xabcd1234..."

5. Frontend → Backend : Demande signature
   POST /elections/42/sign-vote
   {
     "c1": "0x3c7f...",
     "c2": "0x9d4a...",
     "nullifier": "0xabcd1234..."
   }

   → Backend vérifie et signe :
     signature = sign(hash(c1 + c2 + nullifier), backendPrivateKey)

6. Frontend → Blockchain : Soumettre vote
   submitPrivateVote(42, c1, c2, nullifier, signature)

7. Smart Contract : Validation et Stockage
   ✓ Signature backend valide
   ✓ Nullifier jamais vu avant
   ✓ Élection active

   → Stocke : { c1, c2, nullifier, timestamp }
   → Émet : VoteCasted(42, nullifier, now)

8. Frontend : Confirmation
   ✅ "Vote enregistré avec succès !"
   "Votre vote restera secret jusqu'à la clôture"
```

### Phase 3 : Clôture de l'Élection

```
Organisateur ferme l'élection :

1. Frontend Organisateur : Bouton "Fermer l'élection"

2. Smart Contract : closeElection(42)
   → election.status = Closed
   → Plus aucun vote accepté

✅ Élection fermée, votes figés
```

### Phase 4 : Déchiffrement et Résultats

```
Organisateur déchiffre les votes :

1. Frontend Organisateur : Page Résultats
   → Bouton "🔓 Déchiffrer les votes privés"

2. Frontend → Backend : Demande déchiffrement
   POST /elections/42/decrypt-votes
   {
     "organizerAddress": "erd1abc..."
   }

3. Backend : Vérifications
   ✓ Organisateur authentique
   ✓ Élection fermée
   ✓ Pas déjà déchiffré

4. Backend : Récupération votes chiffrés
   Query blockchain :
   votes = getPrivateVotes(42)
   // [
   //   {c1: "0x3c7f...", c2: "0x9d4a...", nullifier: "0xabcd..."},
   //   {c1: "0x8b2c...", c2: "0x5e9f...", nullifier: "0xef01..."},
   //   ...
   // ]

5. Backend : Déchiffrement avec clé privée
   const sk = getPrivateKey(42);  // Clé secrète élection

   results = {};
   for (vote of votes) {
     const candidateId = elgamal.decrypt(vote.c1, vote.c2, sk);
     results[candidateId] = (results[candidateId] || 0) + 1;
   }

   // results = {
   //   1: 234,  // Candidat 1: 234 votes
   //   2: 456,  // Candidat 2: 456 votes
   //   3: 123,  // Candidat 3: 123 votes
   // }

6. Backend → Smart Contract : Publier résultats
   publishResults(42, [234, 456, 123])

7. Frontend : Affichage résultats
   📊 Résultats Élection #42 (votes privés déchiffrés)

   - Candidat Alice : 234 votes
   - Candidat Bob   : 456 votes ⭐ GAGNANT
   - Candidat Carol : 123 votes

   Total : 813 votes privés

✅ Résultats publiés et vérifiables
```

---

## Implémentation Technique

### Backend : ElGamal Service

```typescript
// backend/src/services/elgamalService.ts

import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from 'crypto';

export class ElGamalService {

  /**
   * Génère une paire de clés pour une élection
   */
  generateKeys(): { publicKey: string; privateKey: string } {
    // Générer clé privée (256 bits random)
    const privateKeyBytes = randomBytes(32);
    const privateKey = secp256k1.utils.bytesToHex(privateKeyBytes);

    // Calculer clé publique : pk = sk × G
    const publicKeyPoint = secp256k1.ProjectivePoint.BASE.multiply(
      BigInt('0x' + privateKey)
    );
    const publicKey = publicKeyPoint.toHex(true);  // Compressed format

    return { publicKey, privateKey };
  }

  /**
   * Chiffre un candidateId avec ElGamal
   * @param candidateId - ID du candidat (0 à 50)
   * @param publicKey - Clé publique de l'élection
   * @returns {c1, c2} - Vote chiffré
   */
  encrypt(candidateId: number, publicKey: string): { c1: string; c2: string } {
    const G = secp256k1.ProjectivePoint.BASE;
    const pk = secp256k1.ProjectivePoint.fromHex(publicKey);

    // Générer r aléatoire
    const r = BigInt('0x' + secp256k1.utils.bytesToHex(randomBytes(32)));

    // c1 = r × G
    const c1Point = G.multiply(r);
    const c1 = c1Point.toHex(true);

    // c2 = r × pk + candidateId × G
    const c2Point = pk.multiply(r).add(G.multiply(BigInt(candidateId)));
    const c2 = c2Point.toHex(true);

    return { c1, c2 };
  }

  /**
   * Déchiffre un vote avec la clé privée
   * @param c1 - Composante 1 du chiffré
   * @param c2 - Composante 2 du chiffré
   * @param privateKey - Clé privée de l'élection
   * @returns candidateId - ID du candidat
   */
  decrypt(c1: string, c2: string, privateKey: string): number {
    const c1Point = secp256k1.ProjectivePoint.fromHex(c1);
    const c2Point = secp256k1.ProjectivePoint.fromHex(c2);
    const sk = BigInt('0x' + privateKey);

    // m × G = c2 - sk × c1
    const mG = c2Point.subtract(c1Point.multiply(sk));

    // Recherche discrète : trouver m tel que m × G = mG
    // (Brute force, efficace pour m petit)
    const G = secp256k1.ProjectivePoint.BASE;
    for (let m = 0; m < 100; m++) {
      if (G.multiply(BigInt(m)).equals(mG)) {
        return m;
      }
    }

    throw new Error('Failed to decrypt: candidateId > 100');
  }

  /**
   * Déchiffre tous les votes d'une élection
   * @param votes - Liste des votes chiffrés
   * @param privateKey - Clé privée de l'élection
   * @returns Résultats agrégés par candidat
   */
  tallyVotes(
    votes: Array<{ c1: string; c2: string }>,
    privateKey: string
  ): Record<number, number> {
    const results: Record<number, number> = {};

    for (const vote of votes) {
      const candidateId = this.decrypt(vote.c1, vote.c2, privateKey);
      results[candidateId] = (results[candidateId] || 0) + 1;
    }

    return results;
  }
}
```

### Frontend : Chiffrement Vote

```typescript
// frontend/src/utils/elgamal.ts

import { secp256k1 } from '@noble/curves/secp256k1';

export const encryptVote = (
  candidateId: number,
  publicKey: string
): { c1: string; c2: string } => {
  const G = secp256k1.ProjectivePoint.BASE;
  const pk = secp256k1.ProjectivePoint.fromHex(publicKey);

  // Générer r aléatoire
  const r = BigInt('0x' + secp256k1.utils.bytesToHex(crypto.getRandomValues(new Uint8Array(32))));

  // c1 = r × G
  const c1 = G.multiply(r).toHex(true);

  // c2 = r × pk + candidateId × G
  const c2 = pk.multiply(r).add(G.multiply(BigInt(candidateId))).toHex(true);

  return { c1, c2 };
};
```

### Smart Contract : Stockage

```rust
// contracts/voting/src/lib.rs

/// Vote privé avec chiffrement ElGamal
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct PrivateVoteElGamal<M: ManagedTypeApi> {
    pub c1: ManagedBuffer<M>,  // 33 bytes (compressed point)
    pub c2: ManagedBuffer<M>,  // 33 bytes (compressed point)
    pub nullifier: ManagedBuffer<M>,  // 32 bytes
    pub backend_signature: ManagedBuffer<M>,  // 64 bytes
    pub timestamp: u64,
}

#[endpoint(submitPrivateVote)]
fn submit_private_vote(
    &self,
    election_id: u64,
    c1: ManagedBuffer,
    c2: ManagedBuffer,
    nullifier: ManagedBuffer,
    backend_signature: ManagedBuffer,
) {
    // Vérifications...

    let private_vote = PrivateVoteElGamal {
        c1: c1.clone(),
        c2: c2.clone(),
        nullifier: nullifier.clone(),
        backend_signature,
        timestamp: self.blockchain().get_block_timestamp(),
    };

    self.private_votes_elgamal(election_id).push(&private_vote);
    election.total_votes += 1;
    self.elections(election_id).set(&election);
}

#[storage_mapper("privateVotesElGamal")]
fn private_votes_elgamal(&self, election_id: u64) -> VecMapper<PrivateVoteElGamal<Self::Api>>;
```

---

## Sécurité et Garanties

### Garanties Cryptographiques

#### 1. **Confidentialité (IND-CPA)**

**Propriété** : Un adversaire ne peut pas distinguer deux votes chiffrés même s'il choisit les messages.

**Preuve** :
- ElGamal est IND-CPA sous l'hypothèse DDH (Decisional Diffie-Hellman)
- DDH sur secp256k1 est considéré sûr (niveau 128 bits de sécurité)

**En pratique** : Impossible de savoir si (c1, c2) est un vote pour Alice ou Bob

#### 2. **Anonymat**

**Propriété** : Impossible de lier un vote chiffré à l'identité d'un électeur.

**Mécanisme** :
- Chaque électeur utilise un **nullifier** unique par élection
- Nullifier = Hash(identitySecret, electionId)
- Nullifier public mais ne révèle pas l'identité

**En pratique** : On sait qu'un électeur a voté, mais pas QUI a voté QUOI

#### 3. **Intégrité**

**Propriété** : Impossible de modifier un vote chiffré sans être détecté.

**Mécanisme** :
- Votes stockés on-chain (immuables)
- Signature backend vérifie l'origine
- Hash de transaction garantit non-modification

#### 4. **Non-Réutilisation (Double Voting Prevention)**

**Propriété** : Un électeur ne peut voter qu'une seule fois.

**Mécanisme** :
- Nullifier unique par électeur par élection
- Smart contract rejette si nullifier déjà vu
- Impossible de générer deux nullifiers identiques

### Limites et Risques

#### ⚠️ Risque 1 : Compromission Clé Privée

**Scénario** : Attaquant vole la clé privée `sk` de l'élection.

**Impact** :
- Peut déchiffrer tous les votes AVANT la clôture
- Brise la confidentialité

**Mitigation** :
- Stocker `sk` dans HSM (Hardware Security Module)
- Ou utiliser multi-signature (Phase 2) : 3-sur-5 organisateurs
- Ou utiliser threshold encryption : clé privée partagée entre N parties

#### ⚠️ Risque 2 : Attaque "Preuve de Vote"

**Scénario** : Un électeur prouve comment il a voté (pour vendre son vote).

**Impact** :
- Peut prouver en révélant la randomness `r` utilisée
- Si r révélé, n'importe qui peut vérifier le vote

**Mitigation** :
- Impossible à empêcher complètement avec chiffrement seul
- Nécessite des mesures sociales (sanctions légales)
- Option 2 (zk-SNARK + ElGamal) n'améliore pas ce point

#### ⚠️ Risque 3 : Attaque "Replay"

**Scénario** : Attaquant réutilise un vote chiffré dans une autre élection.

**Impact** :
- Peut voter dans élection B avec vote de élection A

**Mitigation** :
- Nullifier inclut l'electionId
- Signature backend inclut l'electionId
- Smart contract vérifie electionId

---

## Coûts et Performance

### Coûts Gas (MultiversX)

| Opération | Gas | EGLD (~) | EUR (~) |
|-----------|-----|----------|---------|
| **Submit Vote** | ~200,000 | 0.002-0.003 | 0.08-0.12€ |
| - Stockage (c1, c2) | 66 bytes | | |
| - Vérif signature | | | |
| - Check nullifier | | | |
| **Close Election** | ~50,000 | 0.0005 | 0.02€ |
| **Publish Results** | ~100,000 | 0.001 | 0.04€ |

**Pour 1000 votes** : ~2-3 EGLD (~80-120€)
**Pour 10,000 votes** : ~20-30 EGLD (~800-1200€)

### Performance Temps

| Opération | Temps | Notes |
|-----------|-------|-------|
| **Génération clés** | 10ms | Une fois par élection |
| **Chiffrement vote** (client) | 50-100ms | Côté navigateur |
| **Déchiffrement vote** (backend) | 10-20ms | Par vote |
| **Tally 1000 votes** | 10-20s | Séquentiel |
| **Tally 10,000 votes** | 100-200s | Peut être parallélisé |

### Optimisations Possibles

#### 1. **Déchiffrement Parallèle**

```typescript
// Au lieu de déchiffrer séquentiellement :
for (const vote of votes) {
  decrypt(vote);
}

// Déchiffrer en parallèle :
await Promise.all(votes.map(vote => decrypt(vote)));

// Gain : 10× plus rapide sur 10,000 votes
```

#### 2. **Homomorphic Tallying** (Phase 2)

```typescript
// Au lieu de déchiffrer chaque vote :
for (const vote of votes) {
  const candidateId = decrypt(vote);
  results[candidateId]++;
}

// Additionner d'abord, déchiffrer ensuite :
const encryptedSum = votes.reduce((sum, vote) => add(sum, vote));
const totalVotes = decrypt(encryptedSum);

// Gain : 1000× plus rapide !
// Mais ne donne que le total, pas la répartition par candidat
```

#### 3. **Batch Decryption**

```typescript
// Déchiffrer par lots de 100 votes
const BATCH_SIZE = 100;
for (let i = 0; i < votes.length; i += BATCH_SIZE) {
  const batch = votes.slice(i, i + BATCH_SIZE);
  await decryptBatch(batch);
}

// Gain : Meilleure gestion mémoire
```

---

## Comparaison avec Option 2

| Critère | **Option 1 (ElGamal seul)** | **Option 2 (zk-SNARK + ElGamal)** |
|---------|----------------------------|----------------------------------|
| **Coût par vote** | 0.002-0.003 EGLD | 0.005-0.007 EGLD |
| **Stockage par vote** | 66 bytes | 192 bytes |
| **Anonymat** | ✅ Garanti | ✅ Garanti |
| **Comptabilité** | ✅ Après déchiffrement | ✅ Après déchiffrement |
| **Vérifiabilité** | ✅ Publique | ✅ Publique + Preuve mathématique |
| **Complexité** | ⭐⭐ Moyenne | ⭐⭐⭐⭐ Élevée |
| **Temps implémentation** | 2-3 semaines | 3-4 semaines |
| **Performance vote** | 50-100ms | 150-250ms (+ génération preuve) |
| **Protection manipulation** | ⚠️ Moyenne | ✅ Excellente (preuve math) |
| **Cas d'usage** | Élections standard | Élections critiques haute sécurité |

### Quand Choisir Option 1 ?

✅ **Choisir Option 1 si** :
- Budget gas limité (2-3× moins cher)
- Besoin de simplicité d'implémentation
- Élections communautaires, associatives, d'entreprise
- Organisateur de confiance
- Performance importante (vote rapide < 1s)

### Quand Passer à Option 2 ?

🔮 **Passer à Option 2 si** :
- Élections nationales critiques (présidentielles)
- Besoin de certification mathématique
- Budget gas illimité
- Exigence de sécurité maximale
- Audit cryptographique obligatoire

**Recommandation** : Commencer avec Option 1, migrer vers Option 2 si nécessaire.

---

## Ressources

### Documentation Connexe
- `docs-dev/APPRENTISSAGE/05-CRYPTOGRAPHIE/` - Concepts cryptographiques
- `docs/03-technical/CRYPTOGRAPHIE/CRYPTO_ARCHITECTURE.md` - Architecture actuelle
- `docs/03-technical/CRYPTOGRAPHIE/Option-2-zk-SNARK-et-ElGamal.md` - Option alternative

### Bibliothèques
- [@noble/curves](https://github.com/paulmillr/noble-curves) - ElGamal sur secp256k1
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) - Fonctions de hachage

### Références Académiques
- [ElGamal Encryption](https://en.wikipedia.org/wiki/ElGamal_encryption) - Wikipédia
- [Taher Elgamal, "A Public Key Cryptosystem and a Signature Scheme Based on Discrete Logarithms", 1985](https://caislab.kaist.ac.kr/lecture/2010/spring/cs548/basic/B02.pdf)
- [Dan Boneh, "Twenty Years of Attacks on the RSA Cryptosystem"](https://crypto.stanford.edu/~dabo/papers/RSA-survey.pdf)

### Exemples de Systèmes Existants
- [Helios Voting](https://heliosvoting.org/) - Système de vote avec chiffrement homomorphique
- [ElectionGuard](https://www.electionguard.vote/) - Microsoft - Chiffrement pour élections

---

## Prochaines Étapes

**Pour implémenter Option 1** :
1. Lire TODO : `docs-dev/ORGANISATION/TODO/A-FAIRE/IMPLEMENTATION-CHIFFREMENT-VOTES-PRIVES.md`
2. Commencer Phase 1 : Backend ElGamal Service
3. Tests unitaires : Chiffrement/Déchiffrement
4. Phase 2 : Smart Contract
5. Phase 3 : Frontend
6. Tests E2E complets

**Durée estimée** : 2-3 semaines

---

**Créé par** : Claude Code
**Date** : 1er Novembre 2025
**Version** : 1.0
**Statut** : Documentation Complète - Prêt pour Implémentation
