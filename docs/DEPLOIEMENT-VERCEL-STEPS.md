# 🚀 Guide Étape par Étape - Déploiement Vercel DEMOCRATIX

**Repository GitHub** : https://github.com/x-univert/democratix
**Date** : 5 Novembre 2025

---

## 📋 Étape 1 : Se Connecter à Vercel

1. ✅ Allez sur **https://vercel.com**
2. ✅ Cliquez sur **"Sign Up"** (ou **"Log In"**)
3. ✅ Choisissez **"Continue with GitHub"**
4. ✅ Autorisez Vercel à accéder à vos repos

---

## 📦 Étape 2 : Importer le Projet

1. ✅ Sur le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
2. ✅ Dans la liste, cherchez : **"democratix"** (en minuscules)
3. ✅ Cliquez sur **"Import"** à côté du repo

---

## ⚙️ Étape 3 : Configuration du Projet Frontend

**IMPORTANT** : Configurez exactement comme ci-dessous

### Configuration Générale

```
┌─────────────────────────────────────────────────────┐
│ Project Settings                                     │
├─────────────────────────────────────────────────────┤
│ Project Name:      democratix-frontend              │
│ Framework Preset:  Vite                             │
│ Root Directory:    frontend  ⬅️ CLIQUEZ "Edit"      │
│ Build Command:     npm run build                    │
│ Output Directory:  dist                             │
│ Install Command:   npm install                      │
│ Node.js Version:   18.x (auto-detect)               │
└─────────────────────────────────────────────────────┘
```

### 🔑 Variables d'Environnement

**Section "Environment Variables"** → Cliquez sur "Add" pour chaque variable

#### Groupe 1 : Smart Contracts (Devnet)

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `VITE_VOTING_CONTRACT` | `erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl` | Production, Preview, Development |
| `VITE_VOTER_REGISTRY_CONTRACT` | `erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu` | Production, Preview, Development |
| `VITE_RESULTS_CONTRACT` | `erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr` | Production, Preview, Development |

#### Groupe 2 : Network Configuration (Devnet pour test)

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `VITE_NETWORK` | `devnet` | Production, Preview, Development |
| `VITE_API_URL` | `https://devnet-api.multiversx.com` | Production, Preview, Development |
| `VITE_GATEWAY_URL` | `https://devnet-gateway.multiversx.com` | Production, Preview, Development |
| `VITE_EXPLORER_URL` | `https://devnet-explorer.multiversx.com` | Production, Preview, Development |

#### Groupe 3 : Backend API (temporaire)

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `VITE_BACKEND_API_URL` | `http://localhost:3003` | Development only |

⚠️ **Note** : On mettra à jour `VITE_BACKEND_API_URL` après avoir déployé le backend sur Railway

#### Groupe 4 : IPFS Pinata

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `VITE_PINATA_API_KEY` | `582556ecae27aec7767f` | Production, Preview, Development |
| `VITE_PINATA_SECRET_API_KEY` | `a269c8791384c64e19ba45451bec2b76d17c5ce39af798a550e82aefdd7e4cb6` | Production, Preview, Development |
| `VITE_PINATA_JWT` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (voir fichier .env) | Production, Preview, Development |

---

## 🚀 Étape 4 : Lancer le Déploiement

1. ✅ Vérifiez que toutes les variables sont bien renseignées
2. ✅ Cliquez sur le gros bouton bleu **"Deploy"**
3. ✅ Attendez 2-5 minutes pendant le build

### Logs du Build

Vous verrez quelque chose comme :

```bash
[00:00:12] Cloning github.com/x-univert/democratix...
[00:00:15] Installing dependencies...
[00:00:45] Running build command: npm run build
[00:01:30] Building production bundle...
[00:02:15] Optimizing assets...
[00:02:30] ✓ Build completed successfully
[00:02:35] Uploading build outputs...
[00:02:45] Deployment ready!
```

---

## ✅ Étape 5 : Vérifier le Déploiement

### URL du Projet

Votre site sera accessible à :

```
https://democratix-frontend.vercel.app
```

Ou une URL générée automatiquement comme :

```
https://democratix-frontend-<random>.vercel.app
```

### Checklist de Vérification

Testez les fonctionnalités suivantes :

#### ✅ Interface & Navigation
- [ ] La page d'accueil s'affiche correctement
- [ ] Le header avec logo DEMOCRATIX est visible
- [ ] Le footer est présent
- [ ] Les animations et transitions fonctionnent
- [ ] Navigation entre les pages (Élections, Profil, etc.)

#### ✅ Paramètres & Thèmes
- [ ] Ouvrir les Paramètres (⚙️ en haut à droite)
- [ ] Tester le changement de thème :
  - [ ] Dark Mode (TealLab)
  - [ ] Light Mode (BrightLight)
  - [ ] VibeMode
- [ ] Tester le changement de langue :
  - [ ] Français 🇫🇷
  - [ ] English 🇬🇧
  - [ ] Español 🇪🇸
- [ ] Tester le sélecteur de réseau :
  - [ ] Devnet 🔧
  - [ ] Testnet 🧪
  - [ ] Mainnet 🌐

#### ✅ Connexion Wallet
- [ ] Cliquer sur "Se connecter"
- [ ] Choisir xPortal Mobile/Extension ou Web Wallet
- [ ] Scanner le QR code ou se connecter
- [ ] Vérifier que l'adresse s'affiche

#### ✅ Pages Principales
- [ ] Page Élections : affiche la liste
- [ ] Page Profil : affiche les infos utilisateur
- [ ] Page Admin Dashboard (si admin)

#### ❌ Fonctionnalités Attendues comme NON Fonctionnelles

**Ces fonctionnalités ne marcheront PAS tant que le backend n'est pas déployé :**

- ❌ Statistiques de participation détaillées (graphiques horaires)
- ❌ Notifications temps réel (WebSocket)
- ❌ Envoi d'emails
- ❌ Envoi de SMS
- ❌ API calls vers le backend custom

**C'est NORMAL** ! On déploiera le backend à l'étape suivante.

---

## 🔧 Étape 6 : Configurer un Domaine Personnalisé (Optionnel)

Si vous voulez utiliser votre propre domaine (ex: `democratix.app`) :

1. Dans Vercel Dashboard → **Settings** → **Domains**
2. Cliquez sur **"Add"**
3. Entrez votre domaine : `democratix.app`
4. Vercel vous donne des instructions DNS
5. Configurez les DNS chez votre registrar (Namecheap, Google Domains, etc.)
6. Attendez la propagation (5-60 minutes)
7. SSL sera activé automatiquement

---

## 📊 Étape 7 : Tableau de Bord Vercel

### Analytics

Dans le dashboard Vercel, vous pouvez voir :

- **Analytics** : Visiteurs, pages vues, Core Web Vitals
- **Deployments** : Historique de tous les déploiements
- **Logs** : Logs du runtime et du build
- **Settings** : Variables d'env, domaines, intégrations

### Fonctionnalités Utiles

**Preview Deployments** :
- Chaque push sur une branche crée un déploiement de prévisualisation
- URL unique pour tester avant de merge sur main

**Rollback** :
- Si un déploiement casse quelque chose
- Allez dans Deployments → Sélectionnez une version précédente
- Cliquez sur **"Promote to Production"**

---

## 🐛 Dépannage

### Erreur : "Build Failed"

**Cause commune** : Variable d'environnement manquante

**Solution** :
1. Allez dans **Settings** → **Environment Variables**
2. Vérifiez que toutes les variables sont présentes
3. Cliquez sur **Deployments** → **Redeploy**

### Erreur : "404 Page Not Found"

**Cause** : Problème de routing React

**Solution** :
- Vérifiez que `vercel.json` contient bien :
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Erreur : "Module not found"

**Cause** : Problème de dépendances

**Solution** :
1. Localement, supprimez `node_modules` et `package-lock.json`
2. Réinstallez : `npm install`
3. Commitez le nouveau `package-lock.json`
4. Pushez vers GitHub
5. Vercel redéploiera automatiquement

---

## 📱 Prochaines Étapes

Une fois que le frontend est déployé et fonctionne :

### Étape A : Déployer le Backend sur Railway

Le backend contient :
- API REST (élections, votes, statistiques)
- WebSocket (notifications temps réel)
- Services (SendGrid email, Twilio SMS)
- ElGamal encryption/decryption

### Étape B : Connecter Frontend ↔ Backend

Mettre à jour la variable `VITE_BACKEND_API_URL` dans Vercel avec l'URL Railway.

### Étape C : Tests End-to-End

Tester tout le workflow :
1. Créer une élection
2. Ajouter des candidats
3. Activer l'élection
4. Voter
5. Clôturer
6. Voir les résultats

---

## 📝 Notes Importantes

### Sécurité

⚠️ **Variables Sensibles** :
- Ne JAMAIS committer les fichiers `.env`
- Les clés Pinata sont exposées côté client (normal pour l'upload)
- Pour production, utilisez un backend proxy pour IPFS

### Performance

🚀 **Optimisations Vercel** :
- CDN global automatique
- HTTP/2 et HTTP/3
- Compression Brotli automatique
- Image optimization (si utilisé)

### Coûts

💰 **Plan Hobby (Gratuit)** :
- 100 GB bandwidth/mois
- 100 heures build/mois
- Deployments illimités
- SSL gratuit
- Suffisant pour développement et MVP

---

## ✅ Checklist Finale

Avant de passer au backend, assurez-vous que :

- [x] Le frontend est déployé sur Vercel
- [x] L'URL fonctionne et le site s'affiche
- [x] Les thèmes fonctionnent
- [x] Les langues fonctionnent
- [x] Le sélecteur de réseau fonctionne
- [x] La connexion wallet fonctionne
- [ ] **PRÊT POUR LE BACKEND !** 🚀

---

**Dernière mise à jour** : 5 Novembre 2025
**Version DEMOCRATIX** : v1.3.7
**Documentation complète** : `docs/GUIDE-DEPLOIEMENT-VERCEL.md`
