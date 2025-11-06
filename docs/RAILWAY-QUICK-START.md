# 🚂 Railway - Quick Start Guide

Guide ultra-rapide pour déployer DEMOCRATIX Backend sur Railway en 5 minutes.

---

## 📋 Checklist Rapide

### 1️⃣ Compte Railway (1 min)

- [ ] Allez sur [railway.app](https://railway.app)
- [ ] Cliquez **"Login with GitHub"**
- [ ] Autorisez l'accès
- [ ] ✅ Vous avez $5 de crédit gratuit/mois

---

### 2️⃣ Créer le Projet (1 min)

- [ ] Cliquez **"New Project"**
- [ ] Sélectionnez **"Deploy from GitHub repo"**
- [ ] Choisissez **`x-univert/democratix`**
- [ ] Railway détecte automatiquement Node.js

---

### 3️⃣ Configuration Build (30 secondes)

Dans **Settings** → **General**:

- [ ] **Root Directory**: `backend`
- [ ] **Build Command**: `npm install && npm run build`
- [ ] **Start Command**: `npm start`
- [ ] **Watch Paths**: `backend/**`

---

### 4️⃣ Variables d'Environnement (2 min)

Dans l'onglet **Variables**, cliquez **"Raw Editor"** et collez:

```bash
MULTIVERSX_API_URL=https://devnet-api.multiversx.com
MULTIVERSX_GATEWAY_URL=https://devnet-gateway.multiversx.com
VOTING_CONTRACT=erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl
VOTER_REGISTRY_CONTRACT=erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu
RESULTS_CONTRACT=erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr
PINATA_API_KEY=582556ecae27aec7767f
PINATA_SECRET_API_KEY=a269c8791384c64e19ba45451bec2b76d17c5ce39af798a550e82aefdd7e4cb6
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwNTllZTNkMi0yM2YxLTRhZDctODliYi0zOGY2OWE4MzIzZDAiLCJlbWFpbCI6IngtdW5pdmVydEBwcm90b25tYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODI1NTZlY2FlMjdhZWM3NzY3ZiIsInNjb3BlZEtleVNlY3JldCI6ImEyNjljODc5MTM4NGM2NGUxOWJhNDU0NTFiZWMyYjc2ZDE3YzVjZTM5YWY3OThhNTUwZTgyYWVmZGQ3ZTRjYjYiLCJleHAiOjE3OTMwMjY1MzZ9.Pdu2DApzT4-cax_AEc86QN2hIHkf-dZbJh6NqTU8cLM
PORT=3003
NODE_ENV=production
```

⚠️ **IMPORTANT**: Ajoutez aussi ces 2 variables (remplacez l'URL):

```bash
CORS_ORIGIN=https://VOTRE-APP.vercel.app
FRONTEND_URL=https://VOTRE-APP.vercel.app
```

---

### 5️⃣ Générer le Domaine (30 secondes)

- [ ] **Settings** → **Networking** → **Generate Domain**
- [ ] Copiez l'URL: `https://democratix-backend-xyz.up.railway.app`

---

### 6️⃣ Connecter Frontend (1 min)

Sur **Vercel**:

- [ ] Projet frontend → **Settings** → **Environment Variables**
- [ ] Trouvez `VITE_BACKEND_API_URL`
- [ ] Changez vers votre URL Railway
- [ ] **Save** → **Redeploy**

---

### 7️⃣ Vérifier (30 secondes)

- [ ] **Railway** → **Deployments** → Voir les logs
- [ ] Cherchez: `✅ Server running on port 3003`
- [ ] Testez: `curl https://VOTRE-URL-RAILWAY/health`
- [ ] Ouvrez le frontend Vercel et testez!

---

## 🎉 C'est Fini!

Votre stack complète est déployée:

✅ Frontend → Vercel
✅ Backend → Railway
✅ Blockchain → MultiversX Devnet
✅ Storage → IPFS/Pinata

---

## 🆘 Problèmes Courants

### ❌ Build échoue

```bash
# Dans Railway Settings:
Root Directory = backend
Build Command = npm install && npm run build
Start Command = npm start
```

### ❌ Erreur CORS

```bash
# Vérifiez que CORS_ORIGIN = URL Vercel EXACTE
# Pas d'espace, pas de slash final
CORS_ORIGIN=https://democratix.vercel.app
```

### ❌ "Application failed to respond"

```bash
# Vérifiez les variables sont toutes présentes
# Regardez les logs Railway pour l'erreur
```

---

## 📚 Fichiers de Référence

- 📖 Guide complet: `docs/DEPLOIEMENT-RAILWAY-BACKEND.md`
- 📋 Variables: `RAILWAY-ENV-VARS.txt`
- ⚙️ Config: `railway.json`

---

**Temps total: ~5 minutes** ⏱️

Bonne chance! 🚀
