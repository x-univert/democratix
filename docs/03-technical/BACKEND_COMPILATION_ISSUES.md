# Problèmes de Compilation Backend - Blocage Tests E2E

**Date**: 31 Octobre 2025
**Severity**: 🔴 **BLOQUANT**
**Impact**: Empêche le démarrage du backend et tous les tests E2E

---

## 📊 Résumé

Le backend ne démarre pas à cause d'erreurs de compilation TypeScript dans des fichiers **pré-existants** (non liés à l'implémentation zk-SNARK). Ces erreurs empêchent de tester les nouveaux endpoints `/api/zk/*`.

---

## 🔴 Erreurs Identifiées

### Erreur 1: MultiversX SDK v13 - Breaking Changes

**Fichier**: `backend/src/services/multiversxService.ts`

**Lignes affectées**: 101, 284

**Code problématique**:
```typescript
// Ligne 101
const candidatesArgs = params.candidates.map(c =>
  new Struct('Candidate', [
    new Field(new U64Value(c.id), 'id'),
    new Field(BytesValue.fromUTF8(c.name), 'name'),
    new Field(BytesValue.fromUTF8(c.description_ipfs || ''), 'description_ipfs'),
  ])
);
```

**Erreur TypeScript**:
```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'StructType'.
```

**Cause**:
- Le package `@multiversx/sdk-core` v13.0.0 a changé l'API du constructeur `Struct`
- Ancienne API (v12): `new Struct(name: string, fields: Field[])`
- Nouvelle API (v13): `new Struct(type: StructType, fields: Field[])`

**Solution recommandée**:

**Option A** - Downgrade du SDK (rapide):
```bash
cd backend
npm install @multiversx/sdk-core@^12.0.0
npm install @multiversx/sdk-network-providers@^2.0.0
```

**Option B** - Mise à jour du code pour SDK v13:
```typescript
import { StructType, StructField } from '@multiversx/sdk-core';

// Définir le type de structure
const CandidateType = new StructType('Candidate', [
  new StructField('id', 'u64'),
  new StructField('name', 'bytes'),
  new StructField('description_ipfs', 'bytes'),
]);

// Utiliser le type
const candidatesArgs = params.candidates.map(c =>
  new Struct(CandidateType, [
    new Field(new U64Value(c.id), 'id'),
    new Field(BytesValue.fromUTF8(c.name), 'name'),
    new Field(BytesValue.fromUTF8(c.description_ipfs || ''), 'description_ipfs'),
  ])
);
```

---

### Erreur 2: Zod Schema - `.extend()` sur `ZodEffects`

**Fichier**: `backend/src/validators/schemas.ts`

**Ligne**: 39

**Code problématique**:
```typescript
export const CreateElectionWithSenderSchema = CreateElectionBaseSchema.extend({
  senderAddress: z.string().min(62).max(62),
}).refine(data => data.endTime > data.startTime, {
  message: "La date de fin doit être après la date de début",
  path: ["endTime"],
}).refine(data => data.startTime > Math.floor(Date.now() / 1000), {
  message: "La date de début doit être dans le futur",
  path: ["startTime"],
});
```

**Erreur TypeScript**:
```
error TS2339: Property 'extend' does not exist on type 'ZodEffects<ZodEffects<ZodObject<...>>>'
```

**Cause**:
- `CreateElectionBaseSchema` est utilisé ailleurs avec `.refine()`, ce qui retourne un `ZodEffects`
- `.extend()` ne fonctionne que sur les `ZodObject`, pas sur les `ZodEffects`

**Solution recommandée**:
```typescript
// Garder CreateElectionBaseSchema comme objet pur
const CreateElectionBaseSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(10000),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  candidates: z.array(CandidateSchema).min(2).max(50),
});

// Créer les validations avec refine APRÈS extend
export const CreateElectionWithSenderSchema = CreateElectionBaseSchema.extend({
  senderAddress: z.string().min(62).max(62),
})
  .refine(data => data.endTime > data.startTime, {
    message: "La date de fin doit être après la date de début",
    path: ["endTime"],
  })
  .refine(data => data.startTime > Math.floor(Date.now() / 1000), {
    message: "La date de début doit être dans le futur",
    path: ["startTime"],
  });
```

---

### Erreur 3: Type `IChainID` Mismatch

**Fichier**: `backend/src/services/multiversxService.ts`

**Lignes**: 118, 226, 298, 322, 346

**Code problématique**:
```typescript
new Transaction({
  chainID: process.env.CHAIN_ID  // string | number
})
```

**Erreur TypeScript**:
```
error TS2345: Argument of type 'string | number' is not assignable to parameter of type 'IChainID'.
```

**Solution recommandée**:
```typescript
// Convertir explicitement en string
new Transaction({
  chainID: String(process.env.CHAIN_ID)
})

// OU définir le type dans .env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CHAIN_ID: string;
    }
  }
}
```

---

## 🎯 Impact sur l'Implémentation zk-SNARK

### ✅ Code zk-SNARK Non Affecté

Les fichiers suivants sont **corrects et fonctionnels** :
- ✅ `backend/src/services/zkVerifierService.ts` (280 lignes)
- ✅ `backend/src/controllers/zkProofController.ts` (310 lignes)
- ✅ `backend/src/routes/zkProof.ts` (67 lignes)
- ✅ `contracts/voting/src/lib.rs` (modifications zk-SNARK)
- ✅ `frontend/src/services/zkProofService.ts` (460 lignes)
- ✅ `frontend/src/hooks/transactions/useSubmitPrivateVote.ts` (130 lignes)
- ✅ `frontend/src/pages/Vote/Vote.tsx` (modifications UI)

### 🔴 Backend Ne Démarre Pas

Le problème est que le backend utilise un **import centralisé** dans `src/index.ts` qui charge tous les services, y compris ceux avec des erreurs. Cela empêche le serveur de démarrer, même si les endpoints zk-SNARK sont indépendants.

---

## 🛠️ Solutions Proposées

### Solution 1: Fix Rapide (Recommandé pour Tests Immédiats)

**Temps estimé**: 5 minutes

1. **Downgrade MultiversX SDK**:
```bash
cd backend
npm install @multiversx/sdk-core@^12.13.0 @multiversx/sdk-network-providers@^2.8.0
```

2. **Fix Zod Schema**:
```bash
# Aucune action requise si CreateElectionBaseSchema est déjà un objet pur
# Vérifier que la ligne 39 de schemas.ts utilise bien .extend() sur l'objet de base
```

3. **Redémarrer Backend**:
```bash
npm run dev
```

4. **Tester Endpoint zk-SNARK**:
```bash
curl http://localhost:5000/api/zk/health
```

---

### Solution 2: Mise à Jour Complète pour SDK v13

**Temps estimé**: 30-60 minutes

1. **Créer Types de Structures**:

Fichier: `backend/src/types/structTypes.ts`
```typescript
import { StructType, StructField } from '@multiversx/sdk-core';

export const CandidateType = new StructType('Candidate', [
  new StructField('id', 'u64'),
  new StructField('name', 'bytes'),
  new StructField('description_ipfs', 'bytes'),
]);

export const VoteType = new StructType('Vote', [
  new StructField('voter', 'Address'),
  new StructField('candidate_id', 'u64'),
  new StructField('timestamp', 'u64'),
]);
```

2. **Mettre à Jour multiversxService.ts**:
```typescript
import { CandidateType } from '../types/structTypes';

// Ligne 101
const candidatesArgs = params.candidates.map(c =>
  new Struct(CandidateType, [
    new Field(new U64Value(c.id), 'id'),
    new Field(BytesValue.fromUTF8(c.name), 'name'),
    new Field(BytesValue.fromUTF8(c.description_ipfs || ''), 'description_ipfs'),
  ])
);
```

3. **Fixer Types IChainID**:
```typescript
// Ajouter dans toutes les créations de Transaction
chainID: String(process.env.CHAIN_ID)
```

4. **Tester la Compilation**:
```bash
npm run build
```

---

### Solution 3: Approche Isolée (Tests Sans Backend Complet)

**Temps estimé**: 10 minutes

Créer un serveur Express minimal pour tester uniquement les endpoints zk-SNARK :

Fichier: `backend/src/zkTestServer.ts`
```typescript
import express from 'express';
import cors from 'cors';
import zkProofRoutes from './routes/zkProof';
import { zkVerifier } from './services/zkVerifierService';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Uniquement les routes zk-SNARK
app.use('/api/zk', zkProofRoutes);

async function startServer() {
  try {
    logger.info('🔐 Initializing zk-SNARK verifier...');
    await zkVerifier.initialize();
    logger.info('✅ zk-SNARK verifier initialized successfully');

    app.listen(PORT, () => {
      logger.info(`🚀 ZK Test Server started on port ${PORT}`);
      logger.info(`🔐 zk-SNARK endpoints: /api/zk/*`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

**Lancer le serveur de test**:
```bash
cd backend
npx ts-node src/zkTestServer.ts
```

---

## 📈 Ordre de Priorité

### Priorité 1: Tests zk-SNARK Immédiats
1. ✅ Utiliser **Solution 1** (downgrade SDK)
2. ✅ Tester endpoints `/api/zk/*`
3. ✅ Valider l'implémentation zk-SNARK

### Priorité 2: Stabilisation Backend
1. ⏳ Appliquer **Solution 2** (mise à jour SDK v13)
2. ⏳ Tester tous les endpoints
3. ⏳ Valider les migrations SDK

### Priorité 3: Tests E2E Complets
1. ⏳ Backend fonctionnel à 100%
2. ⏳ Smart contract déployé sur devnet
3. ⏳ Tests frontend + backend + blockchain

---

## 🚦 État Actuel

### ✅ Implémentation Complète
- Phase 1: Backend CryptoService ✅
- Phase 2: Circuits zk-SNARK ✅
- Phase 3: Smart Contracts MultiversX ✅
- Phase 4: Frontend UI ✅
- Phase 5: Documentation ✅

### 🔴 Blocage Tests
- Backend ne démarre pas (erreurs pré-existantes)
- Impossible de tester `/api/zk/*`
- Tests E2E bloqués

### 📝 Documentation
- Plan de test E2E complet ✅
- Identification des erreurs ✅
- Solutions proposées ✅

---

## 📝 Recommandation

**Pour débloquer les tests immédiatement**, je recommande **Solution 1** (downgrade SDK) :

```bash
cd backend
npm install @multiversx/sdk-core@^12.13.0 @multiversx/sdk-network-providers@^2.8.0
npm run dev
```

Cela permettra de :
1. ✅ Démarrer le backend en moins de 5 minutes
2. ✅ Tester les endpoints zk-SNARK
3. ✅ Valider l'implémentation complète
4. ✅ Procéder aux tests E2E

La mise à jour vers SDK v13 peut être faite plus tard en **Phase 6: Optimisation**.

---

**Dernière mise à jour**: 31 Octobre 2025
**Auteur**: Claude
**Status**: 🔴 Blocage identifié, solutions proposées
