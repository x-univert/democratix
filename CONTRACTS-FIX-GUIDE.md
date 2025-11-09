# Guide de Correction - Smart Contracts DEMOCRATIX

**Date**: 09 Janvier 2025
**Problème**: Structures et énumérations définies **dans** les traits au lieu d'**avant**

---

## ❌ Problème Identifié

MultiversX **interdit** de déclarer `struct` et `enum` à l'intérieur des traits `#[multiversx_sc::contract]`.

**Erreur de compilation** :
```
error: struct is not supported in `trait`s or `impl`s
error: enum is not supported in `trait`s or `impl`s
```

## ✅ Solution

Tous les types (`struct`, `enum`) doivent être déclarés **AVANT** le trait, avec l'attribut `#[type_abi]` si nécessaire.

---

## 📝 Corrections à Appliquer

### 1. Contract RIC (`contracts/ric/src/lib.rs`)

**Structure actuelle** (❌ INCORRECT) :
```rust
#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::contract]
pub trait RicContract {
    #[init]
    fn init(&self) { ... }

    // ❌ STRUCTURES DÉFINIES ICI (ERREUR !)
    pub enum RICType { ... }
    pub enum RICStatus { ... }
    pub struct RICProposal { ... }
    ...
}
```

**Structure correcte** (✅ CORRECT) :
```rust
#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

// ✅ ENUMS ET STRUCTS DÉFINIS AVANT LE TRAIT

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum RICType {
    Legislatif,
    Abrogatoire,
    Revocatoire,
    Constitutionnel,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum RICStatus {
    Draft,
    CollectingSignatures,
    SignaturesReached,
    Validated,
    Rejected,
    CampaignPeriod,
    VotingOpen,
    VotingClosed,
    Approved,
    RejectedByVote,
    Implemented,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum TerritorialScope {
    National,
    Regional { region_id: u32 },
    Departmental { department_id: u32 },
    Municipal { city_code: u32 },
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct RICProposal<M: ManagedTypeApi> {
    pub id: u64,
    pub ric_type: RICType,
    pub scope: TerritorialScope,
    pub title: ManagedBuffer<M>,
    // ... autres champs
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct RICReferendum<M: ManagedTypeApi> {
    pub id: u64,
    pub ric_proposal_id: u64,
    // ... autres champs
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum ReferendumOutcome {
    Pending,
    Approved,
    Rejected,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct CampaignArgument<M: ManagedTypeApi> {
    pub referendum_id: u64,
    pub side: ArgumentSide,
    pub author: ManagedAddress<M>,
    pub content_ipfs: ManagedBuffer<M>,
    pub timestamp: u64,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum ArgumentSide {
    For,
    Against,
}

// ✅ MAINTENANT LE TRAIT (SANS LES TYPES)
#[multiversx_sc::contract]
pub trait RicContract {
    #[init]
    fn init(&self) {
        self.next_proposal_id().set(1);
        self.next_referendum_id().set(1);
    }

    // ... endpoints, storage, events
}
```

### 2. Contract Petition (`contracts/petition/src/lib.rs`)

**Types à déplacer avant le trait** :
- `PetitionType` (enum)
- `PetitionStatus` (enum)
- `TerritorialScope` (enum)
- `Petition<M>` (struct)
- `PetitionSignature<M>` (struct)

### 3. Contract Institution Registry (`contracts/institution_registry/src/lib.rs`)

**Types à déplacer avant le trait** :
- `InstitutionLevel` (enum)
- `CommuneCategory` (enum)
- `Institution<M>` (struct)
- `InstitutionContact<M>` (struct)
- `ElectoralStats<M>` (struct)

### 4. Contract Poll (`contracts/poll/src/lib.rs`)

**Types à déplacer avant le trait** :
- `PollType` (enum)
- `PollStatus` (enum)
- `QuestionType` (enum)
- `DemographicGroup` (enum)
- `Poll<M>` (struct)
- `PollQuestion<M>` (struct)
- `PollOption<M>` (struct)
- `PollResponse<M>` (struct)
- `DemographicStats<M>` (struct)

---

## 🔧 Changements d'Attributs

**Avant** (incorrect) :
```rust
#[derive(TypeAbi, TopEncode, TopDecode, ...)]
pub enum MyEnum { ... }
```

**Après** (correct) :
```rust
#[type_abi]
#[derive(TopEncode, TopDecode, ...)]
pub enum MyEnum { ... }
```

**Note** : `TypeAbi` n'existe plus dans `multiversx-sc 0.62`. Il faut utiliser `#[type_abi]` comme attribut séparé.

---

## 📋 Checklist de Vérification

Pour chaque contract :

- [ ] **Toutes les déclarations `enum` sont AVANT le trait**
- [ ] **Toutes les déclarations `struct` sont AVANT le trait**
- [ ] **Attributs corrects** : `#[type_abi]` + `#[derive(...)]`
- [ ] **Pas de `TypeAbi` dans derive** (remplacé par `#[type_abi]`)
- [ ] **Le trait commence par** `#[multiversx_sc::contract]`
- [ ] **Le trait ne contient que** : `fn`, `#[storage_mapper]`, `#[event]`, `#[proxy]`

---

## 🚀 Test de Compilation

Après corrections, tester avec :

```bash
# Contract RIC
wsl -e bash -c "export PATH=\$HOME/.cargo/bin:\$PATH && cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/ric && sc-meta all build"

# Contract Petition
wsl -e bash -c "export PATH=\$HOME/.cargo/bin:\$PATH && cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/petition && sc-meta all build"

# Contract Institution Registry
wsl -e bash -c "export PATH=\$HOME/.cargo/bin:\$PATH && cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/institution_registry && sc-meta all build"

# Contract Poll
wsl -e bash -c "export PATH=\$HOME/.cargo/bin:\$PATH && cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/poll && sc-meta all build"
```

**Fichiers générés après succès** :
- `output/CONTRACT_NAME.wasm`
- `output/CONTRACT_NAME.abi.json`

---

## 📊 Résumé des Fichiers à Corriger

| Contract | Fichier | Lignes à déplacer | Priorité |
|----------|---------|-------------------|----------|
| **RIC** | `contracts/ric/src/lib.rs` | ~150 lignes (types) | 🔴 HAUTE |
| **Petition** | `contracts/petition/src/lib.rs` | ~100 lignes (types) | 🔴 HAUTE |
| **Institution Registry** | `contracts/institution_registry/src/lib.rs` | ~120 lignes (types) | 🔴 HAUTE |
| **Poll** | `contracts/poll/src/lib.rs` | ~130 lignes (types) | 🔴 HAUTE |

---

## ⚡ Approche Recommandée

**Option A** : Je corrige manuellement les 4 contracts
- Temps estimé : 30-40 minutes
- Avantage : Corrections garanties

**Option B** : Tu corriges avec VS Code (plus rapide)
- Copier tous les `enum` et `struct` avant le trait
- Supprimer les déclarations du trait
- Remplacer `TypeAbi` par `#[type_abi]`

**Option C** : Je crée 4 nouveaux fichiers corrects complets
- Je reécris les 4 contracts en entier
- Temps estimé : 40-60 minutes

---

**Quelle option préfères-tu ?**
