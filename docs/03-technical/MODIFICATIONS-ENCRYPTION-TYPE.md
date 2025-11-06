# 🔧 Modifications pour encryption_type

**Date**: 2 Novembre 2025
**Objectif**: Permettre à l'organisateur de choisir le type de chiffrement lors de la création d'élection

---

## 📋 Vue d'Ensemble

Actuellement, les élections ont un champ `requires_private_vote` (booléen) qui active ou désactive le vote privé de manière générale. Nous devons le remplacer par un système plus granulaire avec `encryption_type` qui permet de choisir entre:

- **0**: Pas de chiffrement (vote standard public)
- **1**: Option 1 - ElGamal seul
- **2**: Option 2 - ElGamal + zk-SNARK

---

## 🔨 Modifications Smart Contract

### 1. Structure Election

**Fichier**: `contracts/voting/src/lib.rs`
**Ligne**: ~32-45

**Modification**:
```rust
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Eq, Clone, Debug)]
pub struct Election<M: ManagedTypeApi> {
    pub id: u64,
    pub title: ManagedBuffer<M>,
    pub description_ipfs: ManagedBuffer<M>,
    pub organizer: ManagedAddress<M>,
    pub start_time: u64,
    pub end_time: u64,
    pub num_candidates: u32,
    pub status: ElectionStatus,
    pub total_votes: u64,
    pub requires_registration: bool,
    pub registered_voters_count: u64,
    pub registration_deadline: Option<u64>,
    pub encryption_type: u8,  // ← AJOUTÉ: 0=none, 1=elgamal, 2=elgamal+zksnark
}
```

### 2. Endpoint createElection

**Fichier**: `contracts/voting/src/lib.rs`
**Ligne**: ~150-160

**Modification**:
```rust
#[endpoint(createElection)]
fn create_election(
    &self,
    title: ManagedBuffer,
    description_ipfs: ManagedBuffer,
    start_time: u64,
    end_time: u64,
    requires_registration: bool,
    registration_deadline: OptionalValue<u64>,
    encryption_type: u8,  // ← AJOUTÉ: Type de chiffrement
) -> u64 {
    // Validation encryption_type
    require!(
        encryption_type <= 2,
        "Type de chiffrement invalide (doit être 0, 1 ou 2)"
    );

    // ... reste du code ...

    let election = Election {
        id: election_id,
        title,
        description_ipfs,
        organizer: caller.clone(),
        start_time,
        end_time,
        num_candidates: 0,
        status: ElectionStatus::Pending,
        total_votes: 0,
        requires_registration,
        registered_voters_count: 0,
        registration_deadline: deadline,
        encryption_type,  // ← AJOUTÉ
    };

    // ... reste du code ...
}
```

### 3. View getElection

Le view `getElection` retournera automatiquement le nouveau champ `encryption_type` car il retourne la structure complète `Election`.

Aucune modification nécessaire.

---

## 🎨 Modifications Frontend

### 1. CreateElection.tsx

**Fichier**: `frontend/src/pages/CreateElection/CreateElection.tsx`

#### A. State pour encryption_type

```typescript
// Remplacer:
const [requiresPrivateVote, setRequiresPrivateVote] = useState(false);

// Par:
const [encryptionType, setEncryptionType] = useState<0 | 1 | 2>(0);
```

#### B. Interface Radio Buttons

```tsx
{/* Section Chiffrement des Votes */}
<div className="bg-secondary rounded-lg p-6 border-2 border-accent">
  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
    <span>🔐</span>
    Chiffrement des Votes Privés
  </h3>

  <div className="space-y-4">
    {/* Option 0: Pas de chiffrement */}
    <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border-2 hover:border-accent transition-colors">
      <input
        type="radio"
        name="encryption"
        value="0"
        checked={encryptionType === 0}
        onChange={() => setEncryptionType(0)}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="font-bold text-lg">Aucun chiffrement (Standard)</div>
        <p className="text-sm text-gray-400 mt-1">
          Votes publics, résultats visibles en temps réel. Idéal pour sondages et votes transparents.
        </p>
        <div className="flex gap-2 mt-2 text-xs text-gray-500">
          <span>⚡ Rapide (~1s)</span>
          <span>•</span>
          <span>💰 Gas: ~5M</span>
        </div>
      </div>
    </label>

    {/* Option 1: ElGamal */}
    <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border-2 hover:border-green-500 transition-colors">
      <input
        type="radio"
        name="encryption"
        value="1"
        checked={encryptionType === 1}
        onChange={() => setEncryptionType(1)}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="font-bold text-lg flex items-center gap-2">
          🔐 Option 1: ElGamal
          <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">RECOMMANDÉ</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Vote chiffré avec déchiffrement après clôture. Confidentialité + comptage des résultats.
        </p>
        <div className="flex gap-2 mt-2 text-xs text-gray-500">
          <span>⚡ Rapide (~1s)</span>
          <span>•</span>
          <span>💰 Gas: ~10M</span>
          <span>•</span>
          <span>✓ Comptage possible</span>
        </div>
      </div>
    </label>

    {/* Option 2: ElGamal + zk-SNARK */}
    <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border-2 hover:border-purple-500 transition-colors">
      <input
        type="radio"
        name="encryption"
        value="2"
        checked={encryptionType === 2}
        onChange={() => setEncryptionType(2)}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="font-bold text-lg flex items-center gap-2">
          🛡️ Option 2: ElGamal + zk-SNARK
          <span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded-full">SÉCURITÉ MAX</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Chiffrement + preuve mathématique de validité. Anonymat total avec nullifier.
        </p>
        <div className="flex gap-2 mt-2 text-xs text-gray-500">
          <span>⏱️ Plus lent (~3-4s)</span>
          <span>•</span>
          <span>💰 Gas: ~50M</span>
          <span>•</span>
          <span>✓ Preuve validité</span>
          <span>•</span>
          <span>✓ Anonymat total</span>
        </div>
      </div>
    </label>
  </div>

  {/* Lien vers page explicative */}
  <div className="mt-4 text-center">
    <Link
      to="/encryption-options"
      target="_blank"
      className="text-accent hover:underline text-sm"
    >
      ℹ️ Comparer les options en détail →
    </Link>
  </div>
</div>
```

#### C. Transaction createElection

```typescript
const transaction = factory.createTransactionForExecute({
  sender: Address.fromBech32(address),
  contract: Address.fromBech32(votingContract),
  function: 'createElection',
  gasLimit: BigInt(20_000_000),
  arguments: [
    BytesValue.fromUTF8(formData.title),
    BytesValue.fromUTF8(cidElection),
    new U64Value(BigInt(startTimestamp)),
    new U64Value(BigInt(endTimestamp)),
    new BooleanValue(formData.requiresRegistration),
    registrationDeadlineArg,
    new U8Value(encryptionType),  // ← AJOUTÉ
  ],
});
```

### 2. Vote.tsx

**Fichier**: `frontend/src/pages/Vote/Vote.tsx`

#### Récupérer encryption_type de l'élection

```typescript
const election = useGetElectionDetail(id);
const encryptionType = election?.encryption_type || 0;
```

#### Affichage conditionnel des boutons

```typescript
{/* Bouton Standard - Toujours affiché */}
<button onClick={() => handleSubmit('standard')}>
  Voter (Standard)
</button>

{/* Bouton Option 1 - Affiché si encryption_type >= 1 */}
{encryptionType >= 1 && elgamalPublicKey && (
  <button onClick={() => handleSubmit('encrypted')}>
    🔐 Voter avec ElGamal (Option 1)
  </button>
)}

{/* Bouton Option 2 - Affiché uniquement si encryption_type === 2 */}
{encryptionType === 2 && elgamalPublicKey && (
  <button onClick={() => handleSubmit('encrypted_with_proof')}>
    🛡️ Voter avec ElGamal + zk-SNARK (Option 2)
  </button>
)}
```

### 3. Hooks useGetElectionDetail

**Fichier**: `frontend/src/hooks/elections/useGetElectionDetail.ts`

Le hook doit parser le nouveau champ `encryption_type`:

```typescript
interface Election {
  id: number;
  title: string;
  // ... autres champs ...
  encryption_type: number;  // ← AJOUTÉ
}

// Dans la fonction de parsing:
encryption_type: parseInt(result[14]) || 0,  // Index à ajuster selon la structure
```

---

## 📊 Matrice de Décision

| encryption_type | Valeur | Boutons Vote Affichés | Setup ElGamal Requis |
|----------------|--------|----------------------|---------------------|
| Standard | 0 | Standard uniquement | Non |
| Option 1 | 1 | Standard + Option 1 | Oui |
| Option 2 | 2 | Standard + Option 1 + Option 2 | Oui |

---

## ✅ Checklist d'Implémentation

### Smart Contract
- [ ] Ajouter champ `encryption_type: u8` dans struct `Election`
- [ ] Ajouter paramètre `encryption_type` dans `createElection`
- [ ] Ajouter validation `require!(encryption_type <= 2)`
- [ ] Recompiler le smart contract
- [ ] Déployer/Upgrade sur Devnet
- [ ] Mettre à jour l'ABI dans le frontend

### Frontend CreateElection
- [ ] Remplacer state `requiresPrivateVote` par `encryptionType`
- [ ] Créer interface radio buttons (3 options)
- [ ] Ajouter lien vers `/encryption-options`
- [ ] Passer `encryption_type` à la transaction

### Frontend Vote
- [ ] Récupérer `encryption_type` de l'élection
- [ ] Affichage conditionnel bouton Option 1 (`encryptionType >= 1`)
- [ ] Affichage conditionnel bouton Option 2 (`encryptionType === 2`)

### Frontend Hooks
- [ ] Mettre à jour `useGetElectionDetail` pour parser `encryption_type`
- [ ] Mettre à jour interface TypeScript `Election`

### Tests
- [ ] Tester création élection avec chaque type (0, 1, 2)
- [ ] Vérifier affichage boutons selon type
- [ ] Tester vote avec chaque option
- [ ] Tests E2E Cypress

---

## 🎯 Impact

Cette modification permet:

1. **Flexibilité**: L'organisateur choisit le niveau de sécurité adapté à son cas d'usage
2. **UX améliorée**: Interface claire avec explications pour chaque option
3. **Optimisation coûts**: Pas de gas gaspillé si Option 2 pas nécessaire
4. **Rétrocompatibilité**: Les élections existantes peuvent garder `encryption_type = 0`

---

**Dernière mise à jour**: 2 Novembre 2025
**Statut**: Document de spécification - Implémentation requise
