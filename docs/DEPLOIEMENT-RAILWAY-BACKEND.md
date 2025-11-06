# 🚂 Guide de Déploiement Backend DEMOCRATIX sur Railway

Ce guide vous accompagne étape par étape pour déployer le backend DEMOCRATIX sur Railway.

## 📋 Prérequis

- ✅ Compte Railway créé sur [railway.app](https://railway.app)
- ✅ Compte GitHub connecté à Railway
- ✅ Repository GitHub: `https://github.com/x-univert/democratix`
- ✅ Compte SendGrid avec clé API (pour les emails)
- ✅ Frontend déployé sur Vercel

---

## 🎯 Étape 1: Créer votre compte Railway

1. Allez sur **[railway.app](https://railway.app)**
2. Cliquez sur **"Start a New Project"** ou **"Login with GitHub"**
3. Autorisez Railway à accéder à votre compte GitHub
4. Vous recevez **$5 de crédit gratuit par mois**

---

## 🚀 Étape 2: Créer un nouveau projet

### 2.1 Depuis le Dashboard Railway

1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Choisissez le repository **`x-univert/democratix`**

### 2.2 Configuration du service

Railway va automatiquement détecter votre projet Node.js.

**Important**: Railway va essayer de déployer depuis la racine. On doit lui dire d'utiliser le dossier `backend/`.

---

## ⚙️ Étape 3: Configurer le Build

### 3.1 Paramètres de Build (Build Settings)

Dans votre projet Railway, allez dans **Settings** → **General**:

1. **Root Directory**: `backend`
   - Indique à Railway où se trouve le code backend

2. **Build Command**: `npm install`
   - Railway installe automatiquement les dépendances

3. **Start Command**: `npm start`
   - Commande pour démarrer le serveur

4. **Watch Paths**: `backend/**`
   - Railway redéploiera automatiquement si des fichiers dans `backend/` changent

### 3.2 Configuration Node.js

Railway détecte automatiquement Node.js grâce à `package.json`.

**Version Node.js**: Railway utilise la version spécifiée dans `package.json` ou la dernière LTS.

Vérifiez que votre `backend/package.json` contient:
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## 🔐 Étape 4: Variables d'Environnement

### 4.1 Accéder aux Variables

Dans votre projet Railway:
1. Cliquez sur votre service **"backend"**
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"New Variable"**

### 4.2 Variables Essentielles

Ajoutez les variables suivantes une par une:

#### Variables MultiversX (Blockchain)

```bash
MULTIVERSX_API_URL=https://devnet-api.multiversx.com
MULTIVERSX_GATEWAY_URL=https://devnet-gateway.multiversx.com
VOTING_CONTRACT=erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl
VOTER_REGISTRY_CONTRACT=erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu
RESULTS_CONTRACT=erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr
```

#### Variables IPFS (Pinata)

```bash
PINATA_API_KEY=582556ecae27aec7767f
PINATA_SECRET_API_KEY=a269c8791384c64e19ba45451bec2b76d17c5ce39af798a550e82aefdd7e4cb6
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwNTllZTNkMi0yM2YxLTRhZDctODliYi0zOGY2OWE4MzIzZDAiLCJlbWFpbCI6IngtdW5pdmVydEBwcm90b25tYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODI1NTZlY2FlMjdhZWM3NzY3ZiIsInNjb3BlZEtleVNlY3JldCI6ImEyNjljODc5MTM4NGM2NGUxOWJhNDU0NTFiZWMyYjc2ZDE3YzVjZTM5YWY3OThhNTUwZTgyYWVmZGQ3ZTRjYjYiLCJleHAiOjE3OTMwMjY1MzZ9.Pdu2DApzT4-cax_AEc86QN2hIHkf-dZbJh6NqTU8cLM
```

#### Variables Serveur

```bash
PORT=3003
NODE_ENV=production
```

#### Variables CORS (Frontend Vercel)

**IMPORTANT**: Remplacez `<VOTRE-URL-VERCEL>` par votre vraie URL Vercel!

```bash
CORS_ORIGIN=https://<VOTRE-URL-VERCEL>.vercel.app
FRONTEND_URL=https://<VOTRE-URL-VERCEL>.vercel.app
```

Exemple:
```bash
CORS_ORIGIN=https://democratix-xyz123.vercel.app
FRONTEND_URL=https://democratix-xyz123.vercel.app
```

#### Variables SendGrid (Email - OPTIONNEL)

Si vous voulez activer les notifications email:

```bash
SENDGRID_API_KEY=<VOTRE_CLE_SENDGRID>
SENDGRID_FROM_EMAIL=<VOTRE_EMAIL_VERIFIE>
SENDGRID_TEMPLATE_ID=<ID_TEMPLATE_SENDGRID>
```

⚠️ **Note**: Sans SendGrid, les emails ne seront pas envoyés mais l'application fonctionnera normalement.

---

## 🌐 Étape 5: Obtenir l'URL du Backend

### 5.1 URL Publique Railway

Une fois déployé, Railway vous donne une URL publique:

1. Dans votre service backend, allez dans **"Settings"**
2. Section **"Networking"** → **"Public Networking"**
3. Cliquez sur **"Generate Domain"**

Vous obtiendrez une URL du type:
```
https://democratix-backend-production.up.railway.app
```

### 5.2 Copier l'URL

**Copiez cette URL**, vous en aurez besoin pour configurer le frontend!

---

## 🔗 Étape 6: Connecter Frontend et Backend

### 6.1 Mettre à jour Vercel

Retournez sur **Vercel Dashboard**:

1. Allez dans votre projet frontend
2. **Settings** → **Environment Variables**
3. Trouvez la variable `VITE_BACKEND_API_URL`
4. Changez sa valeur de `http://localhost:3003` vers votre URL Railway:
   ```
   https://democratix-backend-production.up.railway.app
   ```
5. Cliquez **"Save"**

### 6.2 Redéployer le Frontend

Après avoir changé la variable:
1. Allez dans **Deployments**
2. Cliquez sur **"..."** du dernier déploiement
3. Cliquez **"Redeploy"**

Le frontend va maintenant communiquer avec le backend sur Railway!

---

## 🔍 Étape 7: Vérifier le Déploiement

### 7.1 Vérifier les Logs

Dans Railway:
1. Cliquez sur votre service backend
2. Allez dans l'onglet **"Deployments"**
3. Cliquez sur le dernier déploiement
4. Regardez les **logs en temps réel**

Vous devriez voir:
```
✅ Server running on port 3003
✅ WebSocket server initialized
✅ Connected to MultiversX devnet
```

### 7.2 Tester l'API

Testez que votre backend répond:

```bash
curl https://VOTRE-URL-RAILWAY.up.railway.app/health
```

Vous devriez recevoir:
```json
{
  "status": "ok",
  "timestamp": "2025-11-06T10:00:00.000Z"
}
```

### 7.3 Tester depuis le Frontend

Allez sur votre frontend Vercel:
1. Ouvrez la console du navigateur (F12)
2. Vérifiez qu'il n'y a pas d'erreurs CORS
3. Testez de créer une élection ou de charger des données

---

## 🐛 Résolution de Problèmes

### Erreur: "Application failed to respond"

**Cause**: Le serveur ne démarre pas correctement.

**Solution**:
1. Vérifiez les logs Railway
2. Vérifiez que `PORT` est bien configuré
3. Vérifiez que toutes les variables d'environnement sont présentes

### Erreur CORS

**Cause**: `CORS_ORIGIN` mal configuré.

**Solution**:
1. Vérifiez que `CORS_ORIGIN` contient l'URL Vercel EXACTE
2. Pas d'espace, pas de slash final
3. Exemple correct: `https://democratix-xyz.vercel.app`

### WebSocket ne fonctionne pas

**Cause**: Railway nécessite une configuration spéciale.

**Solution**: Railway supporte WebSocket nativement, mais vérifiez:
1. Que le client utilise `wss://` (pas `ws://`)
2. Que l'URL backend est correcte dans le frontend

### Build échoue

**Cause**: Dépendances manquantes ou erreurs TypeScript.

**Solution**:
1. Vérifiez que `backend/package.json` est complet
2. Testez localement: `cd backend && npm install && npm start`
3. Regardez les logs Railway pour l'erreur exacte

---

## 💰 Gestion des Coûts

### Plan Gratuit Railway

- **$5 de crédit/mois GRATUIT**
- Amplement suffisant pour:
  - Tests et développement
  - Démos
  - Petit volume d'utilisateurs

### Surveillance de l'utilisation

Dans Railway Dashboard:
1. Allez dans **"Account Settings"**
2. Section **"Usage"**
3. Surveillez votre crédit restant

### Optimisation

Pour économiser le crédit:
- Dormez le service quand vous ne l'utilisez pas (pas de requêtes = pas de coût)
- Passez en mode "hobby" si nécessaire

---

## 🔄 Déploiement Automatique

### Configuration CI/CD

Railway est déjà configuré pour le déploiement automatique:

1. **Push sur GitHub** → Railway détecte automatiquement
2. **Build automatique** → Tests et installation
3. **Déploiement** → Mise en production
4. **Health check** → Vérification automatique

Chaque fois que vous push sur `main`, Railway redéploie!

---

## 📊 Monitoring et Logs

### Voir les Logs en Temps Réel

1. Railway Dashboard → Votre service
2. Onglet **"Deployments"**
3. Cliquez sur un déploiement
4. Logs en direct!

### Métriques

Railway fournit:
- CPU usage
- Memory usage
- Network traffic
- Request count

---

## 🎉 Checklist Finale

Avant de dire que c'est terminé, vérifiez:

- [ ] Backend déployé sur Railway
- [ ] URL Railway générée et copiée
- [ ] Variables d'environnement configurées (au moins 10)
- [ ] `CORS_ORIGIN` pointe vers Vercel
- [ ] Frontend Vercel mis à jour avec URL Railway
- [ ] Frontend redéployé
- [ ] Test: Frontend peut communiquer avec backend
- [ ] Test: Créer une élection fonctionne
- [ ] Test: WebSocket notifications fonctionnent
- [ ] Logs Railway ne montrent pas d'erreurs

---

## 📚 Ressources

- Documentation Railway: https://docs.railway.app
- Support Railway: https://help.railway.app
- Guide MultiversX: https://docs.multiversx.com
- Guide WebSocket: https://socket.io/docs/v4/

---

## 🆘 Besoin d'Aide?

Si vous rencontrez des problèmes:
1. Consultez les logs Railway (90% des problèmes sont visibles là)
2. Vérifiez la console du navigateur pour les erreurs CORS
3. Testez l'API avec `curl` ou Postman
4. Vérifiez que toutes les variables sont présentes

Bonne chance avec votre déploiement! 🚀
