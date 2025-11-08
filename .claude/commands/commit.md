---
description: Créer un commit avec Conventional Commits
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
argument-hint: <type> <message>
---

Crée un commit suivant le format Conventional Commits.

## Format

```
<type>: <description>

[body optionnel]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Types Disponibles

- **feat**: Nouvelle fonctionnalité
- **fix**: Correction de bug
- **docs**: Documentation uniquement
- **style**: Formatage, points-virgules manquants, etc.
- **refactor**: Refactorisation (ni feat ni fix)
- **perf**: Amélioration des performances
- **test**: Ajout ou correction de tests
- **chore**: Tâches de maintenance (build, deps, etc.)

## Arguments

- `$1`: Type de commit (feat, fix, etc.)
- `$2+`: Description du commit

## Exemples

```
/commit fix Correct ElGamal decryption offset
/commit feat Add voter registration with QR codes
/commit docs Update CLAUDE.md with Option 2 details
```

## Workflow

1. Affiche `git status` pour voir les fichiers modifiés
2. Affiche `git diff` pour voir les changements
3. Demande confirmation des fichiers à inclure
4. Exécute `git add <files>`
5. Crée le commit avec le message formaté
6. Propose de push vers origin main
