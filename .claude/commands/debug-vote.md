---
description: Déboguer un problème de vote
---

Diagnostique les problèmes de vote DEMOCRATIX:

## Informations Requises

Quel est le problème rencontré avec le vote?
- Élection ID: $1
- Type de vote: $2 (standard/elgamal/zksnark)
- Message d'erreur: $ARGUMENTS

## Diagnostics

### 1. Vérifier les Logs Console

Demande à l'utilisateur de:
1. Ouvrir DevTools (F12)
2. Aller dans l'onglet Console
3. Copier les logs d'erreur

### 2. Vérifier l'État de l'Élection

Pour l'élection $1:
- Statut actuel (active/finalized)
- Option de chiffrement (0/1/2)
- Clé publique ElGamal disponible (si Options 1/2)
- Nombre de candidats

### 3. Problèmes Courants

**"invalid scalar: out of range"** (Option 2)
- Cause: Frontend envoie candidateId incorrect
- Solution: Vérifier que Vote.tsx passe l'ID 1-indexed
- Fichier: `frontend/src/pages/Vote/Vote.tsx:479`

**IDs candidats inversés après déchiffrement**
- Cause: Backend utilise mauvais offset de décodage
- Solution: Vérifier `elgamalService.ts` ligne 144
- Décodage doit être: `candidateId = m - 1`

**"Clé publique ElGamal non disponible"**
- Cause: Élection sans clé publique pour Options 1/2
- Solution: Créer nouvelle élection avec clé ElGamal

**Preuve zk-SNARK ne se génère pas**
- Cause: Fichiers .wasm ou .zkey manquants
- Solution: Vérifier `frontend/public/circuits/`
- Fichiers requis: `valid_vote_encrypted.wasm`, `valid_vote_encrypted_final.zkey`

### 4. Vérifications Techniques

Vérifie:
- [ ] Railway backend est up (dernier déploiement)
- [ ] Vercel frontend est up
- [ ] Version du code correspond au dernier commit
- [ ] Nouvelle élection créée après les derniers fixes

### 5. Solution Recommandée

Basé sur le problème, propose:
1. Actions immédiates à prendre
2. Fichiers à vérifier
3. Logs à consulter
4. Test à effectuer

Si nécessaire, propose de créer une nouvelle élection de test avec `/new-election`.
