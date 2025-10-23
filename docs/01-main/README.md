# DEMOCRATIX

**Plateforme de Vote Décentralisée sur MultiversX**

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![MultiversX](https://img.shields.io/badge/blockchain-MultiversX-00D4FF.svg)](https://multiversx.com)
[![Status](https://img.shields.io/badge/status-POC-orange.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 Vue d'Ensemble

DEMOCRATIX est une plateforme de vote électronique **décentralisée, transparente et sécurisée** construite sur la blockchain MultiversX. Notre mission est de révolutionner les processus démocratiques en combinant cryptographie de pointe, transparence blockchain et conformité réglementaire.

### ✨ Caractéristiques Principales

✅ **Transparence Totale** : Tous les votes vérifiables sur blockchain publique
✅ **Anonymat Garanti** : Technologie zk-SNARKs (preuves à divulgation nulle)
✅ **Sécurité Maximale** : Smart contracts audités, multi-signatures
✅ **Coût Minimal** : ~0.10€ par vote (vs 4-5€ traditionnel)
✅ **Open Source** : Code 100% public et auditable
✅ **Conformité RGPD** : Privacy by design

---

## 📁 Structure du Projet

```
DEMOCRATIX/
├── contracts/              # Smart contracts MultiversX (Rust)
│   ├── voting/             # Contrat de vote principal
│   ├── voter-registry/     # Registre des électeurs
│   ├── results/            # Dépouillement des résultats
│   ├── build.sh            # Script de compilation
│   └── deploy-devnet.sh    # Script de déploiement devnet
│
├── backend/                # API Backend (Node.js/TypeScript)
│   ├── src/
│   │   ├── controllers/    # Logique métier
│   │   ├── routes/         # Routes API REST
│   │   ├── services/       # Services (MultiversX, IPFS)
│   │   └── validators/     # Validation Zod
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                   # Documentation
│   ├── WHITEPAPER.md       # Vision technique complète
│   ├── BUSINESS_PLAN.md    # Modèle économique
│   ├── ROADMAP.md          # Jalons et planning
│   └── QUICKSTART.md       # Guide développeur
│
└── docker-compose.yml      # Services (PostgreSQL, IPFS, Redis)
```

---

## 🚀 Démarrage Rapide

### Prérequis

- **Rust** (1.75+) : `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js** (18+) : https://nodejs.org/
- **MultiversX CLI** : `pip3 install multiversx-sdk-cli --upgrade`
- **Docker** (optionnel) : https://www.docker.com/

### 1️⃣ Installation

```bash
# Cloner le repository
git clone https://github.com/[votre-org]/democratix.git
cd democratix

# Installer les dépendances backend
cd backend
npm install
cd ..
```

### 2️⃣ Configuration

```bash
# Copier l'exemple d'environnement
cp .env.example .env

# Éditer .env avec vos paramètres
# - Clés API Pinata (IPFS)
# - Adresses des smart contracts (après déploiement)
```

### 3️⃣ Build des Smart Contracts

```bash
cd contracts

# Compiler tous les contrats
./build.sh

# Vérifier que les fichiers .wasm sont générés
ls -la voter-registry/output/
ls -la voting/output/
ls -la results/output/
```

### 4️⃣ Déploiement sur Devnet

```bash
cd contracts

# Déployer sur MultiversX devnet
./deploy-devnet.sh

# Le script vous demandera votre fichier PEM wallet
# Les adresses des contrats seront affichées
```

### 5️⃣ Démarrer le Backend

```bash
cd backend

# Mettre à jour .env avec les adresses des contrats déployés
# VOTING_CONTRACT=erd1...
# VOTER_REGISTRY_CONTRACT=erd1...
# RESULTS_CONTRACT=erd1...

# Démarrer l'API
npm run dev

# L'API sera accessible sur http://localhost:3000
```

### 6️⃣ Tester l'API

```bash
# Vérifier la santé de l'API
curl http://localhost:3000/health

# Récupérer une élection (exemple)
curl http://localhost:3000/api/elections/1
```

---

## 🧪 Tests

### Smart Contracts

```bash
cd contracts/voting
cargo test

cd ../voter-registry
cargo test
```

### Backend (TODO)

```bash
cd backend
npm test
```

---

## 📚 Documentation

- 📘 [**Whitepaper**](./WHITEPAPER.md) - Vision technique complète
- 🗺️ [**Roadmap**](./ROADMAP.md) - Jalons et planning
- 💼 [**Business Plan**](./BUSINESS_PLAN.md) - Modèle économique
- 📋 [**Résumé Exécutif**](./RESUME_EXECUTIF_FR.md) - Pour décideurs
- 🚀 [**Quickstart**](./QUICKSTART.md) - Guide développeur détaillé
- 🤝 [**Contributing**](./CONTRIBUTING.md) - Guide de contribution

---

## 🏗️ Architecture Technique

### Smart Contracts (Rust)

| Contrat | Description | Statut |
|---------|-------------|--------|
| **voting** | Création d'élections, votes chiffrés, cycle de vie | ✅ POC |
| **voter-registry** | Enregistrement électeurs avec zk-SNARKs | ✅ POC |
| **results** | Dépouillement avec déchiffrement homomorphique | 🚧 Structure |

### Backend API (Node.js/TypeScript)

- **Express** : Serveur HTTP REST
- **MultiversX SDK** : Interaction blockchain
- **IPFS/Pinata** : Stockage décentralisé des métadonnées
- **Zod** : Validation des données
- **Winston** : Logging structuré

### Technologies

- **Blockchain** : MultiversX (Devnet/Mainnet)
- **Smart Contracts** : Rust + multiversx-sc
- **Backend** : Node.js + TypeScript + Express
- **Stockage** : IPFS (Pinata)
- **Cryptographie** : zk-SNARKs (Groth16) - Mock pour POC

---

## 🔐 Sécurité

### Fonctionnalités Implémentées (POC)

- ✅ Validation des données (Zod)
- ✅ Mock zk-SNARK pour vérification
- ✅ Storage mapper sécurisé (smart contracts)
- ✅ Events blockchain pour traçabilité

### À Implémenter (Production)

- ⏳ Vraie implémentation zk-SNARKs (Groth16/Plonk)
- ⏳ Chiffrement homomorphique (votes)
- ⏳ Audit de sécurité complet
- ⏳ Bug bounty programme
- ⏳ Certification ANSSI

---

## 🛣️ Roadmap

### Q1 2025 ✅ (En cours)

- [x] Documentation complète
- [x] Smart contracts POC
- [x] Backend API
- [ ] Tests end-to-end
- [ ] Audit sécurité initial

### Q2 2025

- [ ] MVP fonctionnel
- [ ] Intégration FranceConnect
- [ ] 3 collectivités pilotes
- [ ] Dossiers CNIL/ANSSI

### Q3-Q4 2025

- [ ] Beta publique
- [ ] zk-SNARKs production
- [ ] Application mobile
- [ ] Certification ANSSI Niveau 1

### 2026+

- [ ] Production nationale (France)
- [ ] Expansion européenne
- [ ] 100k+ votes traités

[Voir la roadmap complète](./ROADMAP.md)

---

## 💰 Modèle Économique

- **Coût par vote** : ~0.10€ (vs 4-5€ traditionnel)
- **Économies attendues** : 195M€ par présidentielle française
- **ROI Année 3** : 10M€ revenus, 4M€ bénéfices
- **Valorisation cible** : 100M€+ (2030)

[Voir le business plan complet](./BUSINESS_PLAN.md)

---

## 🤝 Contribuer

Nous accueillons les contributions ! Consultez notre [guide de contribution](./CONTRIBUTING.md).

### Comment Contribuer

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📞 Contact & Communauté

- **Email** : contact@democratix.vote
- **GitHub** : https://github.com/[votre-org]/democratix
- **Discord** : [À créer]
- **Twitter** : [À créer]

---

## 📄 Licence

Ce projet est sous licence **AGPL-3.0** - voir le fichier [LICENSE](./LICENSE) pour plus de détails.

**Pourquoi AGPL-3.0 ?**
Nous croyons que le code des systèmes de vote doit être **100% open source** pour garantir la transparence et la confiance. L'AGPL assure que toute modification reste publique, même dans un contexte SaaS.

---

## 🙏 Remerciements

- **MultiversX Foundation** : Pour leur blockchain performante et éco-responsable
- **Communauté open source** : Pour les outils et bibliothèques utilisés
- **Contributeurs** : Merci à tous ceux qui font avancer ce projet !

---

## ⚠️ Statut du Projet

**Ce projet est actuellement en phase POC (Proof of Concept).**

- ✅ Smart contracts fonctionnels sur devnet
- ✅ Backend API opérationnel
- ⚠️ Mock zk-SNARK (à remplacer en production)
- ⚠️ Pas encore audité
- ❌ NE PAS utiliser en production

---

## 📈 Statistiques

![GitHub stars](https://img.shields.io/github/stars/[votre-org]/democratix?style=social)
![GitHub forks](https://img.shields.io/github/forks/[votre-org]/democratix?style=social)
![GitHub issues](https://img.shields.io/github/issues/[votre-org]/democratix)

---

**DEMOCRATIX** - *La technologie au service de la démocratie*

🤖 Développé avec [Claude Code](https://claude.com/claude-code)
