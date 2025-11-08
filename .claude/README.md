# Configuration Claude Code pour DEMOCRATIX

Ce répertoire contient la configuration Claude Code optimisée pour le développement de DEMOCRATIX.

## 📁 Structure

```
.claude/
├── README.md                    # Ce fichier
├── GUIDE_CLAUDE_CODE.md        # Guide complet d'utilisation
├── settings.json               # Configuration du projet
├── settings.local.json         # Overrides personnels (git-ignored)
└── commands/                   # Commandes slash personnalisées
    ├── build-contract.md       # Build smart contract
    ├── test-vote.md           # Guide de test votes
    ├── deploy-check.md        # Vérifier déploiements
    ├── fix-types.md           # Corriger erreurs TS
    ├── commit.md              # Conventional commits
    ├── new-election.md        # Créer élection test
    └── debug-vote.md          # Diagnostiquer bugs vote
```

## 🚀 Démarrage Rapide

### 1. Lire le Guide

```bash
/help
```

Puis consultez `.claude/GUIDE_CLAUDE_CODE.md` pour le guide complet.

### 2. Utiliser les Commandes

```bash
/build-contract      # Build le smart contract
/deploy-check        # Vérifier les déploiements
/test-vote 2         # Tester Option 2
/new-election        # Créer une élection de test
```

### 3. Personnaliser

Éditez `.claude/settings.local.json` pour vos préférences personnelles (non committé).

## 📚 Mémoire Projet

Le fichier `CLAUDE.md` à la racine contient:
- Architecture DEMOCRATIX
- Standards de code
- Systèmes de vote (Options 0, 1, 2)
- Commandes importantes
- Problèmes connus et solutions

## 🔒 Sécurité

Les fichiers suivants sont **bloqués** par défaut:
- `.env` et `.env.*`
- `backend/.secure-keys/**`
- Tout fichier contenant des secrets

Pour modifier: éditez `.claude/settings.json` → `permissions.deny`

## 🎯 Workflows Recommandés

### Nouvelle Fonctionnalité
1. `/deploy-check` - Vérifier l'état
2. Développer avec Claude
3. `/fix-types` - Vérifier TypeScript
4. `/commit feat Add feature` - Commit
5. `/deploy-check` - Revérifier

### Debug
1. `/debug-vote <id> <type> "error"` - Diagnostiquer
2. Appliquer les corrections suggérées
3. `/test-vote` - Retester
4. `/commit fix Resolve issue` - Commit

### Smart Contract
1. Modifier `contracts/voting/src/lib.rs`
2. `/build-contract` - Build
3. Corriger erreurs si nécessaire
4. Déployer manuellement
5. `/new-election` - Tester

## 💡 Astuces

### Ajouter à la Mémoire Rapidement
```
# Toujours valider les inputs avec require!()
```

Claude demande où sauvegarder (Project/User).

### Éditer la Mémoire
```
/memory
```

Ouvre CLAUDE.md dans l'éditeur.

### Voir l'Utilisation des Tokens
```
/cost
```

### Exporter la Conversation
```
/export session.md
```

## 🔧 Créer Vos Commandes

Ajoutez un fichier `.claude/commands/ma-commande.md`:

```markdown
---
description: Description courte
allowed-tools: Bash(commande:*)
argument-hint: <arg1> <arg2>
---

Instructions pour Claude...

Utiliser $1 pour le premier argument.
Utiliser $ARGUMENTS pour tous les arguments.
```

Usage: `/ma-commande arg1 arg2`

## 📖 Documentation

- Guide complet: `.claude/GUIDE_CLAUDE_CODE.md`
- Docs officielles: https://code.claude.com/docs
- CLAUDE.md: Mémoire du projet DEMOCRATIX

## 🆘 Support

Posez vos questions directement à Claude:
```
Comment utiliser la commande /test-vote ?
Comment fonctionne le système de mémoire ?
Peux-tu m'expliquer Option 2 ?
```

Claude a accès à tout le contexte du projet !

---

**Mis à jour**: 2025-01-08
**Version Claude Code**: Compatible avec toutes versions
