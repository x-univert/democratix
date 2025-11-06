# ⚡ Vercel Deploy - Aide-Mémoire Rapide

## 🔗 Liens Importants

- **Repository GitHub** : https://github.com/x-univert/democratix
- **Vercel Dashboard** : https://vercel.com/dashboard
- **Guide Complet** : `docs/DEPLOIEMENT-VERCEL-STEPS.md`

---

## 📦 Configuration Projet

```
Project Name:      democratix-frontend
Framework:         Vite
Root Directory:    frontend  ⬅️ IMPORTANT
Build Command:     npm run build
Output Directory:  dist
```

---

## 🔑 Variables d'Environnement (copier-coller)

**Smart Contracts (Devnet)**
```
VITE_VOTING_CONTRACT=erd1qqqqqqqqqqqqqpgq3rdh76wraer3vd36awamzfe0f8cxs0s8d3qqf5h6tl
VITE_VOTER_REGISTRY_CONTRACT=erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu
VITE_RESULTS_CONTRACT=erd1qqqqqqqqqqqqqpgqk3pxj5l8px3cvv8a26jh0fwtw4mqh7u0d3qq8p9pnr
```

**Network (Devnet)**
```
VITE_NETWORK=devnet
VITE_API_URL=https://devnet-api.multiversx.com
VITE_GATEWAY_URL=https://devnet-gateway.multiversx.com
VITE_EXPLORER_URL=https://devnet-explorer.multiversx.com
```

**Backend (temporaire)**
```
VITE_BACKEND_API_URL=http://localhost:3003
```

**Pinata IPFS**
```
VITE_PINATA_API_KEY=582556ecae27aec7767f
VITE_PINATA_SECRET_API_KEY=a269c8791384c64e19ba45451bec2b76d17c5ce39af798a550e82aefdd7e4cb6
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwNTllZTNkMi0yM2YxLTRhZDctODliYi0zOGY2OWE4MzIzZDAiLCJlbWFpbCI6IngtdW5pdmVydEBwcm90b25tYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODI1NTZlY2FlMjdhZWM3NzY3ZiIsInNjb3BlZEtleVNlY3JldCI6ImEyNjljODc5MTM4NGM2NGUxOWJhNDU0NTFiZWMyYjc2ZDE3YzVjZTM5YWY3OThhNTUwZTgyYWVmZGQ3ZTRjYjYiLCJleHAiOjE3OTMwMjY1MzZ9.Pdu2DApzT4-cax_AEc86QN2hIHkf-dZbJh6NqTU8cLM
```

⚠️ **Pour CHAQUE variable** :
- Cochez : Production, Preview, Development (les 3)

---

## ✅ Checklist Post-Déploiement

Testez sur votre URL Vercel :

- [ ] Site s'affiche
- [ ] Thèmes fonctionnent (Dark/Light/Vibe)
- [ ] Langues fonctionnent (FR/EN/ES)
- [ ] Réseau fonctionne (Devnet/Testnet/Mainnet)
- [ ] Connexion wallet fonctionne

---

## 🆘 En Cas de Problème

1. **Build Failed** → Vérifier les variables d'env
2. **404 Error** → Vérifier `Root Directory: frontend`
3. **Blank Page** → Ouvrir la console navigateur (F12)

Redéployer : Vercel Dashboard → Deployments → ... → Redeploy

---

**Version** : v1.3.7 | **Date** : 5 Nov 2025
