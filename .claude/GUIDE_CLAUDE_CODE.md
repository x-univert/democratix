# 🎓 Guide d'Utilisation Claude Code pour DEMOCRATIX

## 📚 1. Comprendre la Mémoire de Claude Code

### Les 4 Niveaux de Mémoire

```
┌─────────────────────────────────────┐
│  1. Enterprise Policy (IT)          │  ← Priorité la plus haute
├─────────────────────────────────────┤
│  2. Project Memory (CLAUDE.md)      │  ← Partagé avec l'équipe (git)
├─────────────────────────────────────┤
│  3. User Memory (~/.claude/)        │  ← Personnel (tous projets)
├─────────────────────────────────────┤
│  4. Project Local (déprécié)        │  ← Ne plus utiliser
└─────────────────────────────────────┘
```

### Utilisation Pratique

#### Ajouter Rapidement à la Mémoire

Commencez votre message par `#`:

```
# Toujours utiliser 2 espaces pour l'indentation
```

Claude vous demandera où sauvegarder (Project ou User).

#### Éditer la Mémoire

```bash
/memory
```

Ouvre les fichiers CLAUDE.md dans votre éditeur.

#### Initialiser un Nouveau Projet

```bash
/init
```

Crée un fichier CLAUDE.md de base.

### Exemples pour DEMOCRATIX

**Mémoire Projet** (`CLAUDE.md` - déjà créé ✅):
- Architecture du projet
- Standards de code
- Commandes importantes
- Problèmes connus

**Mémoire Utilisateur** (`~/.claude/CLAUDE.md`):
- Vos préférences de style personnelles
- Raccourcis que vous utilisez souvent
- Workflows personnalisés

## ⚙️ 2. Configuration (Settings)

Vous avez maintenant `.claude/settings.json` configuré avec:

### Permissions

**Autorisées automatiquement**:
- `npm run dev/build/type-check`
- `git status/diff/log/add/commit/push`
- `wsl bash` (pour build contract)

**Demandent confirmation**:
- Commandes destructives (`rm`, `git reset`)

**Bloquées**:
- Lecture/écriture des fichiers `.env`
- Accès aux secrets dans `backend/.secure-keys/`

### Modifier les Permissions

Éditez `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(nouvelle-commande:*)"
    ]
  }
}
```

## 🚀 3. Commandes Slash Personnalisées

Vous avez maintenant 7 commandes slash prêtes:

### Commandes Disponibles

| Commande | Description | Usage |
|----------|-------------|-------|
| `/build-contract` | Build le smart contract | `/build-contract` |
| `/test-vote` | Guide de test des votes | `/test-vote 2` (pour Option 2) |
| `/deploy-check` | Vérifie les déploiements | `/deploy-check` |
| `/fix-types` | Corrige erreurs TypeScript | `/fix-types` |
| `/commit` | Commit avec Conventional Commits | `/commit fix Correct bug` |
| `/new-election` | Guide création élection | `/new-election "Test zkSNARK"` |
| `/debug-vote` | Diagnostique problème vote | `/debug-vote 90 zksnark` |

### Exemples d'Utilisation

#### Build le Smart Contract

```
/build-contract
```

Claude va:
1. Exécuter la commande WSL pour build
2. Vérifier que les fichiers sont générés
3. Afficher un résumé

#### Tester le Vote Option 2

```
/test-vote 2
```

Claude affiche une checklist complète pour tester Option 2.

#### Créer un Commit

```
/commit fix Correct ElGamal decryption offset in backend
```

Claude va:
1. Montrer `git status` et `git diff`
2. Demander quels fichiers inclure
3. Créer le commit avec format Conventional Commits
4. Proposer de push

#### Diagnostiquer un Bug

```
/debug-vote 90 zksnark "invalid scalar error"
```

Claude va analyser le problème et proposer des solutions.

### Créer Vos Propres Commandes

#### Structure

```
.claude/commands/
├── ma-commande.md          # → /ma-commande
└── backend/
    └── test-api.md         # → /test-api (backend)
```

#### Exemple Simple

Créez `.claude/commands/logs.md`:

```markdown
---
description: Affiche les logs Railway backend
---

Consulte les logs du backend DEMOCRATIX sur Railway:

1. Va sur https://railway.app
2. Sélectionne le projet DEMOCRATIX
3. Clique sur "backend" service
4. Onglet "Deployments" → dernier déploiement → "View Logs"

Recherche dans les logs:
- Erreurs: filtre par "ERROR" ou "❌"
- Déchiffrement: filtre par "Vote decrypted"
- API calls: filtre par méthode HTTP (POST, GET)
```

Maintenant vous pouvez utiliser `/logs` !

#### Avec Arguments

`.claude/commands/test-candidate.md`:

```markdown
---
description: Test un vote pour un candidat spécifique
argument-hint: <election-id> <candidate-id>
---

Test un vote pour le candidat $2 dans l'élection $1:

1. Ouvrir https://democratix-frontend.vercel.app/vote/$1
2. Sélectionner le candidat $2
3. Voter avec les 3 options si disponibles
4. Vérifier les logs console
```

Usage: `/test-candidate 90 1`

#### Avec Bash

`.claude/commands/restart-dev.md`:

```markdown
---
description: Redémarre les serveurs de dev
allowed-tools: Bash(npm run:*), Bash(timeout:*)
---

Redémarre frontend et backend:

```bash
# Tuer les processus Node existants (si nécessaire)
taskkill /F /IM node.exe

# Frontend
cd frontend && npm run dev &

# Backend
cd backend && npm run dev &
```

Attendre 5 secondes puis vérifier:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001/api/health
```

## 🎯 4. Workflows Recommandés pour DEMOCRATIX

### Workflow 1: Nouvelle Fonctionnalité

```bash
# 1. Vérifier l'état actuel
/deploy-check

# 2. Développer la fonctionnalité
# ... Claude vous aide avec le code ...

# 3. Vérifier les types
/fix-types

# 4. Tester localement
npm run dev  # (Claude peut le faire pour vous)

# 5. Commit
/commit feat Add new voting option with ZK proof

# 6. Vérifier après déploiement
/deploy-check
```

### Workflow 2: Debug d'un Bug

```bash
# 1. Diagnostiquer
/debug-vote <election-id> <vote-type> "message d'erreur"

# 2. Claude analyse et propose des solutions

# 3. Appliquer le fix
# ... modifications de code ...

# 4. Tester
/test-vote <option>

# 5. Commit
/commit fix Resolve voting error for Option 2

# 6. Créer nouvelle élection de test
/new-election "Test Fix Option 2"
```

### Workflow 3: Développement Smart Contract

```bash
# 1. Modifier le contrat Rust
# ... édition dans contracts/voting/src/lib.rs ...

# 2. Build
/build-contract

# 3. Si erreurs, Claude vous aide à corriger

# 4. Déployer (manuellement via mxpy)

# 5. Tester sur devnet
/new-election "Test New Contract"
/test-vote
```

## 💡 5. Astuces Avancées

### Raccourcis Clavier

Dans le terminal Claude Code:

- **Ctrl+C** : Annuler la génération en cours
- **↑/↓** : Naviguer dans l'historique des commandes
- **Tab** : Auto-complétion des commandes slash
- **/help** : Voir toutes les commandes disponibles

### Commandes Built-in Utiles

| Commande | Description |
|----------|-------------|
| `/help` | Liste toutes les commandes |
| `/clear` | Efface la conversation |
| `/cost` | Voir l'utilisation des tokens |
| `/model` | Changer de modèle Claude |
| `/export conversation.md` | Exporter la conversation |
| `/compact` | Compresser l'historique |

### Utiliser les Imports dans CLAUDE.md

`CLAUDE.md` peut importer d'autres fichiers:

```markdown
# DEMOCRATIX

## Architecture
@docs/ARCHITECTURE.md

## Standards de Code
@docs/CODING_STANDARDS.md

## Crypto
@docs/03-technical/CRYPTOGRAPHIE/ELGAMAL.md
```

Maximum 5 niveaux d'import récursifs.

### Ajouter du Contexte Temporaire

Si vous voulez donner un contexte juste pour cette session:

```
Voici le fichier de config:
@backend/config/database.ts

Peux-tu optimiser les requêtes ?
```

Le `@` charge le fichier dans le contexte.

### Mode Vim (Optionnel)

Si vous aimez Vim:

```bash
/settings
```

Ajoutez:
```json
{
  "vimMode": true
}
```

### Compacter la Conversation

Quand la conversation devient longue:

```bash
/compact Focus sur les problèmes de vote Option 2
```

Claude va compresser l'historique en gardant l'essentiel.

## 📖 6. Documentation Officielle

Pour aller plus loin:

- **Setup**: https://code.claude.com/docs/en/setup.md
- **Commandes Slash**: https://code.claude.com/docs/en/slash-commands.md
- **Mémoire**: https://code.claude.com/docs/en/memory.md
- **Settings**: https://code.claude.com/docs/en/settings.md
- **Workflows**: https://code.claude.com/docs/en/common-workflows.md

## 🎓 7. Exercices Pratiques

Essayez ces exercices pour maîtriser Claude Code:

### Exercice 1: Ajouter à la Mémoire

1. Tapez: `# Les messages de commit doivent être en anglais`
2. Choisissez "Project" quand demandé
3. Vérifiez avec `/memory`

### Exercice 2: Créer une Commande

1. Créez `.claude/commands/check-gas.md`
2. La commande doit afficher les coûts gas pour chaque option de vote
3. Testez avec `/check-gas`

### Exercice 3: Workflow Complet

1. `/deploy-check` - Vérifier l'état
2. Demandez à Claude de créer une nouvelle page React
3. `/fix-types` - Corriger les erreurs
4. `/commit feat Add new feature page`
5. `/deploy-check` - Revérifier

## 🆘 Besoin d'Aide ?

### Dans Claude Code

```
/help
```

### Problème avec une Commande

```
J'ai un problème avec la commande /build-contract, peux-tu m'aider ?
```

Claude va diagnostiquer et corriger.

### Questions sur le Projet

Demandez directement:
```
Comment fonctionne le système de vote Option 2 ?
Où sont stockées les clés ElGamal ?
Quelle est la différence entre Option 1 et Option 2 ?
```

Claude a tout le contexte dans CLAUDE.md !

## 🎉 Félicitations !

Vous êtes maintenant prêt à utiliser Claude Code efficacement pour DEMOCRATIX !

**Prochaines étapes**:
1. Essayez `/deploy-check` pour vérifier l'état actuel
2. Créez une nouvelle élection de test avec `/new-election`
3. Testez les commandes slash
4. Personnalisez votre mémoire utilisateur dans `~/.claude/CLAUDE.md`

Bon développement ! 🚀
