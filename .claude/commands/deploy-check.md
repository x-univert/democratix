---
description: Vérifier l'état des déploiements
allowed-tools: Bash(curl:*), Bash(git log:*)
---

Vérifie l'état des déploiements DEMOCRATIX:

## 1. Vérifier le dernier commit

Affiche les 3 derniers commits avec:
```bash
git log --oneline -3
```

## 2. Vérifier le Backend Railway

Teste la santé du backend:
```bash
curl -s https://democratix-backend-production.up.railway.app/api/health
```

Vérifie que le backend retourne un statut 200.

## 3. Vérifier le Frontend Vercel

Teste que le frontend est accessible:
```bash
curl -I https://democratix-frontend.vercel.app
```

## 4. Vérifier la Version du Smart Contract

Affiche l'adresse du contrat déployé:
- Devnet: `erd1qqqqqqqqqqqqqpgq...`
- Explorer: https://devnet-explorer.multiversx.com

## 5. Résumé

Affiche un tableau récapitulatif:
| Service | Status | URL |
|---------|--------|-----|
| Frontend | ✅/❌ | Vercel |
| Backend | ✅/❌ | Railway |
| Contract | ✅/❌ | Devnet |

Si un service est down, suggère des actions pour investiguer.
