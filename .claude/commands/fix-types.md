---
description: Corriger les erreurs TypeScript du projet
allowed-tools: Bash(npm run type-check:*), Bash(npx tsc:*)
---

Analyse et corrige les erreurs TypeScript dans DEMOCRATIX:

## 1. Frontend Type Check

Exécute:
```bash
cd frontend && npm run type-check
```

## 2. Backend Type Check

Exécute:
```bash
cd backend && npx tsc --noEmit
```

## 3. Analyse des Erreurs

Pour chaque erreur TypeScript trouvée:
- Identifie le fichier et la ligne
- Explique la cause de l'erreur
- Propose une correction

## 4. Erreurs Courantes DEMOCRATIX

**Frontend**:
- Types manquants pour les hooks MultiversX
- Props non définies dans les composants React
- Imports manquants depuis `@multiversx/sdk-core`

**Backend**:
- Types Prisma non régénérés après changement schema
- Types secp256k1 manquants
- Promesses non awaited

## 5. Corrections Automatiques

Applique les corrections simples:
- Ajouter les imports manquants
- Définir les types explicites
- Ajouter les assertions de type si nécessaire

Demande confirmation avant les corrections complexes.
