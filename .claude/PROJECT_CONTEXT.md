# 🎯 DEMOCRATIX - Contexte Projet pour Claude

**Date**: 28 Octobre 2025 | **Version**: v0.6.0 | **Phase**: MVP (98%)

---

## 📝 RÉSUMÉ EXPRESS

### ✅ DÉJÀ FAIT (NE PAS REFAIRE!)
1. ✅ **Smart contracts**: Déployés Devnet + testés
2. ✅ **IPFS**: Service Pinata complet (testé 26 oct)
3. ✅ **i18n**: FR/EN/ES complet, 430 lignes/langue (27 oct)
4. ✅ **11 pages frontend**: Elections, Vote, Results, Profile, etc.
5. ✅ **Hooks**: useCreateElection, useVote, useAddCandidate, etc.
6. ✅ **Thèmes**: Dark/Light/Vibe
7. ✅ **Sécurité**: Clés API dans .env
8. ✅ **Vote 100% fonctionnel**: Bug encoding résolu (28 oct)
9. ✅ **UI/UX polish**: Loading, errors, animations, colors
10. ✅ **Finalisation workflow**: Smart contract + UI (28 oct)
11. ✅ **Encodage UTF-8**: TextDecoder pour accents (28 oct)
12. ✅ **Modales de confirmation**: Toutes actions critiques (28 oct)

### 🎯 À FAIRE MAINTENANT
1. 🔴 Tests E2E Cypress (semaine prochaine)
2. 🔴 Page About + FAQ (semaine prochaine)
3. 🟡 Backend Node.js (Phase 3)
4. 🟡 zk-SNARKs (Phase 3)

---

## 📂 FICHIERS À LIRE À CHAQUE SESSION

1. **Ce fichier** (.claude/PROJECT_CONTEXT.md) - Vue globale
2. **docs/PROGRESS.md** - État détaillé (PRINCIPAL)
3. **CHANGELOG.md** - Derniers changements
4. **docs/RECOMMANDATIONS_PROCHAINES_ETAPES.md** - Roadmap
5. **.claude/docs-claude/VOTE_ENCODING_RESOLUTION.md** - Résolution bug vote

---

## 🛠 Stack Technique

**Backend**: Rust (MultiversX VM)
**Frontend**: React + TypeScript + Vite + Tailwind
**IPFS**: Pinata (axios)
**i18n**: react-i18next
**Charts**: Recharts
**SDK**: @multiversx/sdk-dapp v15

---

## 📁 Structure Clé

```
contracts/          # Smart contracts Rust (voting, voter-registry, results)
frontend/src/
  pages/          # 11 pages (Elections, Vote, Results, etc.)
  hooks/
    elections/    # useGetElections, useGetElection, etc.
    transactions/ # useVote, useCreateElection, etc.
  services/       # ipfsService.ts (Pinata)
  locales/        # i18n (fr/en/es)
docs/
  PROGRESS.md     # ⚠️ LIRE EN PREMIER!
  RECOMMANDATIONS_PROCHAINES_ETAPES.md
.claude/
  PROJECT_CONTEXT.md  # Ce fichier
  docs-claude/
    VOTE_ENCODING_RESOLUTION.md  # Bug fix documentation
CHANGELOG.md       # Historique
```

---

## 🔄 Workflow Claude

### DÉBUT DE SESSION:
1. Lire docs/PROGRESS.md (état actuel)
2. Vérifier si tâche déjà faite (chercher "✅")
3. TodoWrite pour tracker

### APRÈS AVOIR CODÉ:
1. Mettre à jour docs/PROGRESS.md
2. Ajouter entrée CHANGELOG.md
3. Mettre à jour ce fichier si nécessaire

### RÈGLES:
- ⚠️ NE PAS recoder ce qui existe
- ⚠️ NE JAMAIS commiter .env
- ✅ TOUJOURS vérifier PROGRESS.md avant
- ✅ TOUJOURS documenter après

---

## ⚠️ Limitations Connues

1. ⚠️ Crypto basique (crypto_mock.rs) - Pas d'anonymat réel
2. ⚠️ Pas de tests E2E automatisés
3. ⚠️ Pas de backend Node.js
4. ⚠️ Pas de zk-SNARKs (Phase 3)

---

## 🎯 État Fonctionnel

### Smart Contracts (100%)
- create_election, add_candidate, activate_election
- **castVote** ✅ (bug résolu 28 oct)
- close_election, get_results
- Statuts: Pending, Active, Closed, Finalized

### IPFS Service (100%)
```typescript
uploadJSON(data) → hash
uploadFile(file) → hash
fetchJSON(hash) → data
getIPFSUrl(hash) → url
```

### Pages Frontend
| Page | État | Notes |
|------|------|-------|
| Elections | 95% | Filtres, pagination ✅ |
| ElectionDetail | 98% | Skeleton, errors ✅ |
| CreateElection | 90% | Upload IPFS ✅ |
| Vote | 100% | ✅ BUG RÉSOLU 28 OCT |
| Results | 95% | Colors fix ✅ |
| AdminDashboard | 85% | Stats ✅ |
| Profile | 85% | Historique ✅ |
| About | 0% | 🔴 À FAIRE |

---

## 🐛 Bug Critique Résolu: Vote Encoding

### Problème
```
ErrInvalidArgument: Can't convert argument (type object), wanted type: BytesValue
```

### Solution
```typescript
// ❌ AVANT
const candidateIdBytes = new Uint8Array(4);
const encryptedVote = { encrypted_choice: candidateIdBytes };

// ✅ APRÈS
const candidateIdBytes = new Uint8Array(4);
const candidateIdBuffer = Buffer.from(candidateIdBytes);  // ← FIX
const encryptedVote = { encrypted_choice: candidateIdBuffer };
```

### Tests
- ✅ 5 votes sur 2 élections (100% réussite)
- ✅ Comptage exact: 75%/25% confirmé blockchain
- ✅ Affichage cohérent frontend ↔ blockchain

**Documentation complète**: `.claude/docs-claude/VOTE_ENCODING_RESOLUTION.md`

---

## 🔧 Priorités

**Cette Semaine (28 Oct - 1 Nov)**:
- ✅ Vote encoding fix (TERMINÉ)
- ✅ UI polish (TERMINÉ)

**Semaine Prochaine (4-8 Nov)**:
- 🔴 Tests E2E Cypress
- 🔴 Page About + FAQ

**Phase 3** (3-6 mois):
- 🟡 zk-SNARKs (anonymat réel)
- 🟡 Backend Node.js (génération preuves)
- 🟡 NFC Verification

---

## 💻 Commandes Utiles

```bash
# Frontend
cd frontend && npm run dev

# Smart Contracts (WSL)
wsl --exec bash -l -c "cd /mnt/c/.../contracts/voting && sc-meta all build"

# Git
git status
git add . && git commit -m "feat: description"
git push
```

---

## 📊 Sessions Récentes

**28 Oct 2025**:
- ✅ **BUG CRITIQUE RÉSOLU**: Vote encoding (Uint8Array → Buffer)
- ✅ Tests: 5 votes, 2 élections, 100% succès
- ✅ UI polish: Header text, Results colors, Images alignment
- ✅ Pagination fix (useRef)
- 📝 Documentation: VOTE_ENCODING_RESOLUTION.md
- 🎯 Next: Tests E2E, Page About

**27 Oct 2025**:
- ✅ i18n complet (FR/EN/ES)
- ✅ Sécurité clés API
- ✅ Docs: CHANGELOG, PROGRESS, RECOMMANDATIONS
- 🎯 Next: UI/UX improvements

**26 Oct 2025**:
- ✅ IPFS integration
- ✅ Tests validés

---

## 🎯 Prochaines Étapes

### Semaine Prochaine
1. **Tests E2E avec Cypress** (3-4 jours)
   - Flow complet: Créer élection → Voter → Voir résultats
   - Tests de régression
   - CI/CD GitHub Actions

2. **Documentation Utilisateur** (2-3 jours)
   - Page About
   - FAQ (10-15 questions)
   - Vidéo démo
   - Guide d'utilisation

### Fin Novembre
- MVP 100% fonctionnel
- Tests complets
- Prêt pour pilote (10-20 utilisateurs)

### Phase 3 (ultérieure)
- zk-SNARKs pour anonymat réel
- Backend Node.js pour preuves
- NFC Verification
- Audit de sécurité

---

**Ce fichier est lu automatiquement par Claude**
**Mettre à jour après chaque session majeure!**
**Version actuelle: v0.5.0 (Vote Fix Release)**
