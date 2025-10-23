# Guide de Publication sur GitHub

Ce guide explique comment publier le projet DEMOCRATIX sur GitHub en open source.

## 📋 Préparation

### 1. Vérifier l'État du Repository Local

```bash
# Vérifier que tous les fichiers sont bien committés
git status

# Vérifier l'historique des commits
git log --oneline

# Vous devriez voir :
# 7dc6c0d docs: Complete README with deployment instructions...
# 82e4340 feat: Initial commit - DEMOCRATIX decentralized voting platform
```

### 2. Créer le Repository sur GitHub

1. Aller sur https://github.com
2. Cliquer sur **"New repository"** (bouton vert)
3. Remplir les informations :
   - **Repository name** : `democratix` (ou `DEMOCRATIX`)
   - **Description** : `Decentralized voting platform on MultiversX blockchain`
   - **Public** : ✅ Cocher (pour open source)
   - **Add a README** : ❌ Ne pas cocher (on a déjà un README)
   - **Add .gitignore** : ❌ Ne pas cocher (on a déjà un .gitignore)
   - **Choose a license** : ❌ Ne pas cocher (on a déjà LICENSE)
4. Cliquer sur **"Create repository"**

## 🚀 Publication

### 3. Connecter le Repository Local à GitHub

```bash
# Remplacer [votre-username] par votre nom d'utilisateur GitHub
git remote add origin https://github.com/[votre-username]/democratix.git

# Vérifier que le remote est bien ajouté
git remote -v
```

### 4. Pousser le Code vers GitHub

```bash
# Pousser la branche master vers GitHub
git push -u origin master

# Entrer vos identifiants GitHub si demandé
# (utilisez un Personal Access Token si 2FA est activé)
```

### 5. Vérifier sur GitHub

1. Aller sur https://github.com/[votre-username]/democratix
2. Vérifier que tous les fichiers sont présents
3. Vérifier que le README s'affiche correctement

## 🏷️ Créer une Release (Optionnel)

### 6. Créer une Tag pour la Version POC

```bash
# Créer un tag pour la version POC v0.1.0
git tag -a v0.1.0 -m "POC Release - DEMOCRATIX v0.1.0

- Smart contracts fonctionnels (voting, voter-registry, results)
- Backend API complet
- Tests unitaires
- Scripts de déploiement devnet
- Documentation complète"

# Pousser le tag vers GitHub
git push origin v0.1.0
```

### 7. Créer une Release sur GitHub

1. Aller sur https://github.com/[votre-username]/democratix/releases
2. Cliquer sur **"Create a new release"**
3. Sélectionner le tag `v0.1.0`
4. **Release title** : `v0.1.0 - POC Release`
5. **Description** :

```markdown
# DEMOCRATIX v0.1.0 - POC Release

This is the first public release of DEMOCRATIX, a decentralized voting platform built on MultiversX blockchain.

## ✨ Features

- ✅ Smart contracts (voting, voter-registry, results) with unit tests
- ✅ Backend API (Node.js/TypeScript)
- ✅ IPFS integration (Pinata)
- ✅ Mock zk-SNARK for POC
- ✅ Deployment scripts for devnet
- ✅ Complete documentation

## ⚠️ Important Notes

- **This is a POC (Proof of Concept)** - NOT ready for production
- Mock zk-SNARK implementation (to be replaced)
- No security audit yet
- Use on devnet only

## 📚 Documentation

- [README](./README.md) - Getting started
- [Whitepaper](./WHITEPAPER.md) - Technical vision
- [Roadmap](./ROADMAP.md) - Project timeline

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/[votre-username]/democratix.git
cd democratix

# Build smart contracts
cd contracts
./build.sh

# Deploy on devnet
./deploy-devnet.sh

# Start backend
cd ../backend
npm install
npm run dev
```

## 📞 Contact

- GitHub: https://github.com/[votre-username]/democratix
- Email: contact@democratix.vote

---

**DEMOCRATIX** - *Technology serving democracy*

🤖 Developed with Claude Code
```

6. Cocher **"Set as a pre-release"** (car c'est un POC)
7. Cliquer sur **"Publish release"**

## 📣 Promotion (Optionnel)

### 8. Ajouter des Topics sur GitHub

1. Aller sur la page principale du repo
2. Cliquer sur l'icône "⚙️" à côté de "About"
3. Ajouter les topics :
   - `blockchain`
   - `multiversx`
   - `voting`
   - `decentralized`
   - `zk-snarks`
   - `rust`
   - `typescript`
   - `smart-contracts`
   - `open-source`
   - `democracy`

### 9. Partager le Projet

- **Twitter/X** : Annoncer le lancement
- **Reddit** : r/MultiversX, r/blockchain, r/opensource
- **Discord MultiversX** : Partager dans #showcase
- **LinkedIn** : Post professionnel
- **Hacker News** : https://news.ycombinator.com/submit

### 10. Demander un Grant MultiversX (Optionnel)

1. Aller sur https://multiversx.com/builders
2. Remplir le formulaire de demande de grant
3. Mentionner :
   - Projet open source
   - Cas d'usage gouvernemental
   - Impact social positif
   - Grant demandé : 50k€

## 🔄 Workflow de Développement Futur

### Branches

```bash
# Créer une branche pour une nouvelle fonctionnalité
git checkout -b feature/nom-fonctionnalite

# Faire vos modifications
# ...

# Committer
git add .
git commit -m "feat: description"

# Pousser vers GitHub
git push origin feature/nom-fonctionnalite

# Créer une Pull Request sur GitHub
```

### Convention de Commits

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Refactoring
- `chore:` - Tâches de maintenance

## 📝 Mise à Jour du README

N'oubliez pas de remplacer `[votre-org]` et `[votre-username]` dans le README principal par vos vraies informations GitHub !

```bash
# Éditer README.md
# Remplacer tous les [votre-org] par votre organisation
# Remplacer tous les [votre-username] par votre username

# Committer les changements
git add README.md
git commit -m "docs: Update GitHub links in README"
git push origin master
```

## ✅ Checklist Finale

Avant de rendre le projet public, vérifier :

- [ ] Tous les fichiers sensibles sont dans .gitignore (*.pem, .env, etc.)
- [ ] Le README est à jour avec les bonnes URLs
- [ ] Les licences sont correctes (AGPL-3.0)
- [ ] Pas de secrets/clés API dans le code
- [ ] La documentation est complète
- [ ] Les scripts de build fonctionnent
- [ ] Les tests passent
- [ ] Le .gitignore est complet

## 🎉 Félicitations !

Votre projet DEMOCRATIX est maintenant open source sur GitHub !

---

Pour toute question, consultez :
- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
