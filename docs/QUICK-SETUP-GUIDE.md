# Guide Rapide de Configuration - DEMOCRATIX

## ✅ Ce qui est déjà fait

- ✅ Frontend déployé sur Vercel: https://democratix-frontend.vercel.app
- ✅ Backend déployé sur Railway: https://democratix-backend-production.up.railway.app
- ✅ Génération de clés ElGamal fonctionne
- ✅ Système de backup IPFS implémenté
- ✅ CORS configuré correctement
- ✅ Port Railway configuré (8080)

## 🔧 Configuration Requise (À FAIRE)

### 1. Ajouter MASTER_KEY_PASSWORD sur Railway

**C'est CRITIQUE!** Actuellement, un mot de passe aléatoire est généré à chaque démarrage.

**Étapes:**

```bash
# 1. Allez sur Railway Dashboard
https://railway.app

# 2. Sélectionnez votre backend → Variables → New Variable

# 3. Ajoutez:
Name: MASTER_KEY_PASSWORD
Value: 4a4212cdb17128205ad1dd65fbc41643c55c242a1cf1e60f977b8c3482a9bd00

# 4. Railway va automatiquement redéployer
```

**⚠️ IMPORTANT:**
- Sauvegardez ce mot de passe dans un gestionnaire (1Password, Bitwarden)
- Si perdu = impossible de déchiffrer les votes
- Ne le commitez JAMAIS dans Git

### 2. Vérifier le Volume Railway

Votre volume `/app/.secure-keys` devrait déjà être configuré.

**Vérification:**
```bash
Railway Dashboard → Votre backend → Settings → Volumes
→ Devrait afficher: /app/.secure-keys
```

Si absent:
```bash
→ New Volume
→ Mount Path: /app/.secure-keys
→ Create
```

### 3. Activer zk-SNARK (Optionnel)

Les circuits zk-SNARK ne sont pas sur Railway. Vous avez 2 options:

#### Option A: Laisser désactivé (Recommandé pour l'instant)
- ✅ Options 0 (public) et 1 (ElGamal) fonctionnent parfaitement
- ✅ Option 2 (zk-SNARK) affichée comme "indisponible"
- ✅ Pas de complexité additionnelle

#### Option B: Activer zk-SNARK
Suivez: `docs/RAILWAY-VOLUME-UPLOAD.md`

**Résumé rapide:**
```bash
# 1. Compresser les circuits
cd backend\circuits
tar -czf circuits.tar.gz build/

# 2. Upload sur GitHub Release
# (Interface web GitHub)

# 3. Ajouter variable Railway:
CIRCUITS_DOWNLOAD_URL=https://github.com/.../circuits.tar.gz
```

## 🧪 Tests à Effectuer

### Test 1: Génération de Clés ElGamal

```
1. Allez sur https://democratix-frontend.vercel.app
2. Créez une nouvelle élection (Option 1: ElGamal)
3. Cliquez "Générer les clés ElGamal"
4. Vérifiez dans les logs Railway:
   ✅ "Encrypted private key stored locally"
   ✅ "Encrypted key backed up to IPFS"
   ✅ "IPFS backup hash saved to metadata"
```

**Résultat attendu dans la réponse API:**
```json
{
  "success": true,
  "message": "ElGamal encryption setup successfully. Private key stored locally AND backed up on IPFS.",
  "data": {
    "publicKey": "037...",
    "privateKey": "a3b...",
    "backup": {
      "local": true,
      "ipfs": true,
      "ipfsHash": "QmXxx...",
      "ipfsUrl": "https://gateway.pinata.cloud/ipfs/QmXxx..."
    }
  }
}
```

### Test 2: Vérifier le Backup IPFS

```
# Si vous avez généré des clés pour l'élection ID 80:
1. Ouvrez: https://gateway.pinata.cloud/ipfs/{ipfsHash}
2. Vous devriez voir un JSON chiffré:
   {
     "encryptedKey": "abcd1234...",
     "iv": "...",
     "authTag": "...",
     "salt": "...",
     "algorithm": "aes-256-gcm",
     "createdAt": 1699123456789
   }
```

### Test 3: Récupération depuis IPFS (Simulation de perte)

Pour tester la récupération automatique depuis IPFS:

```bash
# 1. Via Railway CLI (si installé):
railway shell
rm .secure-keys/election-80-key.json
exit

# 2. Essayez de déchiffrer les votes de l'élection 80
# Le système devrait automatiquement:
# - Détecter l'absence de la clé locale
# - Lire le hash IPFS depuis .secure-keys/ipfs-metadata.json
# - Télécharger depuis IPFS
# - Cacher localement
# - Déchiffrer avec succès

# Logs attendus:
⚠️  Local key not found, trying IPFS backup...
🔄 Restoring key from IPFS backup...
✅ Key restored from IPFS backup and cached locally
```

### Test 4: Vote Complet (End-to-End)

```
1. Créer une élection (Option 1: ElGamal)
2. Générer les clés ElGamal
3. Activer l'élection (transaction blockchain)
4. Ajouter des votants
5. Voter (plusieurs personnes)
6. Fermer l'élection
7. Déchiffrer les votes
8. Vérifier les résultats
```

## 📊 Monitoring

### Logs Railway

**Logs importants à surveiller:**

```bash
# Démarrage réussi:
✅ Blind signature key generated (RSA-2048)
✅ MultiversX SDK initialized
⛓️  Réseau MultiversX: devnet
🔒 CORS enabled for origins: https://democratix-frontend.vercel.app
🚀 DEMOCRATIX Backend démarré sur le port 8080

# Génération de clés:
✅ Private key encrypted successfully
✅ Encrypted private key stored locally
✅ Encrypted key backed up to IPFS
✅ IPFS backup hash saved to metadata

# Récupération IPFS:
⚠️  Local key not found, trying IPFS backup...
🔄 Restoring key from IPFS backup...
✅ Key restored from IPFS backup
```

**Erreurs à surveiller:**

```bash
# Critique (nécessite action):
❌ Failed to store encrypted key
❌ Failed to retrieve encrypted key
❌ Failed to decrypt private key

# Warnings (non-bloquants):
⚠️  IPFS backup failed (continuing without backup)
⚠️  No IPFS backup hash found for election
```

### Santé du Backend

```bash
# Test rapide:
curl https://democratix-backend-production.up.railway.app/health

# Attendu:
{"status":"ok","timestamp":"2025-11-06T14:30:00.000Z"}
```

## 🆘 Troubleshooting

### Problème 1: "IPFS backup failed"

**Causes possibles:**
1. Pinata credentials invalides
2. Quota Pinata dépassé
3. Réseau temporairement indisponible

**Impact:**
- ⚠️ Clé sauvegardée uniquement localement
- ⚠️ Pas de backup décentralisé
- ✅ Fonctionnalité principale non affectée

**Solution:**
- Vérifiez `PINATA_API_KEY` et `PINATA_JWT` sur Railway
- Vérifiez quota sur https://app.pinata.cloud

### Problème 2: "Failed to decrypt private key"

**Causes:**
1. `MASTER_KEY_PASSWORD` changé ou absent
2. Fichier de clé corrompu
3. Mauvais mot de passe fourni

**Solution:**
1. Vérifiez `MASTER_KEY_PASSWORD` sur Railway
2. Essayez de restaurer depuis IPFS
3. Si backup IPFS aussi échoue → clé perdue définitivement

### Problème 3: Volume Railway plein

**Symptômes:**
```bash
❌ Failed to store encrypted key
ENOSPC: no space left on device
```

**Solution:**
```bash
# Railway Free: 1GB max
# Upgrade: $5/mois pour 2GB

# Nettoyage (si nécessaire):
railway shell
cd .secure-keys
ls -lh  # Vérifier taille
# Supprimer anciennes élections si nécessaire
```

## 📈 Prochaines Étapes Recommandées

### Court Terme (Cette semaine)

1. ✅ Ajouter `MASTER_KEY_PASSWORD` sur Railway
2. ✅ Tester génération de clés ElGamal
3. ✅ Vérifier backup IPFS fonctionne
4. ✅ Tester un vote end-to-end

### Moyen Terme (2-4 semaines)

5. 📊 Implémenter le système de sondages (docs/POLLS-FEATURE-SPEC.md)
6. 🔐 Ajouter authentification wallet obligatoire
7. 🛡️ Implémenter rate limiting (express-rate-limit)
8. 📧 Configurer SendGrid templates pour notifications

### Long Terme (1-3 mois)

9. 🧪 Activer zk-SNARK sur Railway (Option 2)
10. 📱 Application mobile (React Native)
11. 🎨 Dashboard organisateur amélioré
12. 💰 Système de monétisation (freemium)

## 🔐 Sécurité - Checklist

- ✅ MASTER_KEY_PASSWORD configuré sur Railway
- ✅ MASTER_KEY_PASSWORD sauvegardé dans gestionnaire de mots de passe
- ✅ Volume Railway configuré pour persistence
- ✅ Backup IPFS activé
- ✅ CORS configuré correctement
- ❌ Rate limiting (à implémenter)
- ❌ Authentification wallet (à implémenter)
- ❌ Monitoring/alertes (à implémenter)

## 📚 Documentation

- `docs/ELGAMAL-KEY-BACKUP-SPEC.md` - Spécification complète du backup
- `docs/POLLS-FEATURE-SPEC.md` - Système de sondages
- `docs/RAILWAY-VOLUME-UPLOAD.md` - Gestion des volumes
- `docs/DEPLOIEMENT-RAILWAY-BACKEND.md` - Guide Railway complet
- `docs/RAILWAY-QUICK-START.md` - Quick start Railway

## 💡 Conseils

1. **Testez localement d'abord**: `npm run dev` dans backend/
2. **Surveillez les logs Railway** après chaque déploiement
3. **Testez le backup IPFS** dès la première clé générée
4. **Documentez vos tests** (screenshots, logs)
5. **Backup du MASTER_KEY_PASSWORD**: Imprimez-le et stockez-le en lieu sûr

## ✅ Checklist de Déploiement Final

Avant de considérer le système "production-ready":

- [ ] MASTER_KEY_PASSWORD configuré et sauvegardé
- [ ] Volume Railway fonctionnel
- [ ] Backup IPFS testé et validé
- [ ] Vote end-to-end réussi (au moins 3 votants)
- [ ] Déchiffrement testé et validé
- [ ] Récupération IPFS testée (simulation de perte)
- [ ] Logs Railway propres (pas d'erreurs critiques)
- [ ] Documentation utilisateur créée
- [ ] Plan de monitoring défini
- [ ] Procédure de récupération d'urgence documentée

---

**Besoin d'aide?**
- GitHub Issues: https://github.com/x-univert/democratix/issues
- Ou me contacter directement via Claude Code
