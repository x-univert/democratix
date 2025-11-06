# 📱 Guide de Configuration Twilio SMS pour DEMOCRATIX

**Date**: 5 Novembre 2025
**Version**: 1.0.0
**Prérequis**: Compte Twilio (gratuit ou payant)

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Création compte Twilio](#création-compte-twilio)
3. [Configuration du compte](#configuration-du-compte)
4. [Obtention des credentials](#obtention-des-credentials)
5. [Configuration DEMOCRATIX](#configuration-democratix)
6. [Tests](#tests)
7. [Utilisation](#utilisation)
8. [Dépannage](#dépannage)
9. [Tarification](#tarification)
10. [Checklist finale](#checklist-finale)

---

## 🎯 Vue d'ensemble

Le service SMS de DEMOCRATIX utilise **Twilio** pour envoyer des codes OTP (One-Time Password) par SMS aux électeurs.

### Fonctionnalités

- ✅ **Codes OTP 6 chiffres** aléatoires
- ✅ **Expiration automatique** après 15 minutes
- ✅ **Rate limiting** (1 minute entre deux envois)
- ✅ **3 tentatives maximum** de vérification
- ✅ **Envoi en masse** (jusqu'à 1000 SMS)
- ✅ **Support international** (190+ pays)
- ✅ **Détection erreurs** (numéro invalide, non autorisé, etc.)

### Architecture

```
Frontend → Backend API → Twilio SMS → Électeur mobile
                ↓
         OTP Store (Map)
                ↓
     Vérification + Cleanup
```

---

## 🆕 Création compte Twilio

### Étape 1 : S'inscrire sur Twilio

1. Aller sur [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Cliquer sur **"Sign up"**
3. Remplir le formulaire :
   - Email
   - Mot de passe fort
   - Cochez "I'm not a robot"
4. Cliquer sur **"Start your free trial"**

### Étape 2 : Vérification email

1. Ouvrir votre boîte email
2. Cliquer sur le lien de vérification Twilio
3. Vous serez redirigé vers la console Twilio

### Étape 3 : Vérification téléphone

1. Entrer votre numéro de téléphone
2. Choisir la méthode de vérification : **SMS** ou **Call**
3. Entrer le code reçu

### Étape 4 : Questionnaire d'utilisation

Répondre aux questions suivantes :

- **What do you plan to build?**: Voting Application
- **How do you want to build?**: With code
- **What's your preferred language?**: JavaScript / Node.js
- **What do you need for your app?**: SMS

---

## ⚙️ Configuration du compte

### Obtenir un numéro de téléphone Twilio

#### Option 1 : Compte gratuit (Trial)

Le compte gratuit Twilio vous donne :
- ✅ **$15.50 de crédit** gratuit
- ✅ **1 numéro de téléphone** gratuit
- ⚠️ **Limitation** : Envoyer SMS uniquement aux numéros vérifiés

**Obtenir un numéro :**

1. Dans la console Twilio, aller à **"Phone Numbers"** → **"Manage"** → **"Buy a number"**
2. Choisir le pays : **France** (+33) ou autre
3. Cocher **"SMS"** dans les capacités
4. Cliquer sur **"Search"**
5. Choisir un numéro disponible
6. Cliquer sur **"Buy"**
7. Confirmer

Votre numéro apparaît maintenant dans **"Active Numbers"**.

#### Option 2 : Compte payant (Recommended pour production)

**Upgrader le compte :**

1. Aller à **"Console"** → **"Billing"**
2. Cliquer sur **"Upgrade account"**
3. Entrer les informations de paiement
4. Choisir un plan (Pay-as-you-go recommandé)

**Avantages compte payant :**
- ✅ Envoyer SMS à **tous les numéros** (pas seulement vérifiés)
- ✅ **Pas de watermark** "Sent from your Twilio trial account"
- ✅ **Support prioritaire**
- ✅ **Fonctionnalités avancées** (Messaging Services, etc.)

### Vérifier des numéros (compte gratuit uniquement)

Si vous utilisez un compte gratuit, vous devez vérifier chaque numéro qui recevra des SMS :

1. Console Twilio → **"Phone Numbers"** → **"Manage"** → **"Verified Caller IDs"**
2. Cliquer sur **"Add a new number"**
3. Entrer le numéro au format international : `+33612345678`
4. Choisir **SMS** comme méthode de vérification
5. Entrer le code reçu

---

## 🔑 Obtention des credentials

Vous aurez besoin de **3 informations** pour configurer DEMOCRATIX :

### 1. Account SID

1. Aller sur [https://console.twilio.com/](https://console.twilio.com/)
2. Dans le **Dashboard**, section **"Account Info"**
3. Copier **"Account SID"** (commence par `AC...`)

**Exemple :** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Auth Token

1. Même section **"Account Info"**
2. Copier **"Auth Token"** (cliquer sur l'œil pour révéler)

**⚠️ IMPORTANT** : Gardez ce token **SECRET**. Ne le partagez jamais publiquement.

**Exemple :** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Phone Number

1. Aller à **"Phone Numbers"** → **"Manage"** → **"Active numbers"**
2. Cliquer sur votre numéro
3. Copier le numéro au format international

**Exemple :** `+33700000000` (France) ou `+1234567890` (USA)

---

## 🔧 Configuration DEMOCRATIX

### Étape 1 : Variables d'environnement

Ouvrir le fichier `backend/.env` et ajouter :

```env
# Twilio SMS Service
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33700000000
```

**Remplacer** les valeurs par vos propres credentials Twilio.

### Étape 2 : Vérifier l'installation

Le package `twilio` doit déjà être installé. Si ce n'est pas le cas :

```bash
cd backend
npm install twilio
```

### Étape 3 : Redémarrer le backend

```bash
cd backend
npm run dev
```

Vous devriez voir dans les logs :

```
✅ Twilio SMS service initialized
```

Si vous voyez :

```
⚠️ Twilio credentials not configured - SMS service disabled
```

Cela signifie que les variables d'environnement ne sont pas correctement configurées.

---

## 🧪 Tests

### Test 1 : Santé du service

Vérifier que le backend démarre sans erreur et affiche :

```
✅ Twilio SMS service initialized
```

### Test 2 : Test SMS simple

**Endpoint :** `POST /api/elections/test-sms`

**Requête cURL :**

```bash
curl -X POST http://localhost:3001/api/elections/test-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+33612345678"
  }'
```

**Réponse attendue (succès) :**

```json
{
  "success": true,
  "message": "Test SMS sent successfully",
  "data": {
    "phoneNumber": "+33612345678",
    "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

**Réponse attendue (erreur - numéro non vérifié en mode trial) :**

```json
{
  "success": false,
  "error": "Le numéro de téléphone n'est pas autorisé à recevoir des SMS."
}
```

### Test 3 : Envoi + Vérification OTP

**3.1 Envoyer un OTP :**

```bash
curl -X POST http://localhost:3001/api/elections/1/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+33612345678"
  }'
```

**3.2 Noter le code reçu par SMS** (ex : `123456`)

**3.3 Vérifier le code :**

```bash
curl -X POST http://localhost:3001/api/elections/1/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+33612345678",
    "code": "123456"
  }'
```

**Réponse attendue (succès) :**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "phoneNumber": "+33612345678"
  }
}
```

### Test 4 : Envoi en masse

**Requête :**

```bash
curl -X POST http://localhost:3001/api/elections/1/send-invitations-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": [
      "+33612345678",
      "+33687654321",
      "+33600000000"
    ]
  }'
```

**Réponse attendue :**

```json
{
  "success": true,
  "message": "SMS invitations sent: 3 success, 0 failed",
  "data": {
    "total": 3,
    "success": 3,
    "failed": 0,
    "results": [...]
  }
}
```

---

## 📱 Utilisation

### Workflow complet

```
1. Organisateur génère des codes d'invitation
                 ↓
2. Système envoie SMS avec OTP à chaque électeur
                 ↓
3. Électeur reçoit SMS : "Votre code : 123456"
                 ↓
4. Électeur entre le code sur l'app
                 ↓
5. Backend vérifie le code (3 tentatives max)
                 ↓
6. Si valide → Électeur peut voter
   Si invalide/expiré → Demander nouveau code
```

### Fonctionnement OTP

**Génération :**
- Code aléatoire 6 chiffres (100000-999999)
- Associé à : phoneNumber + electionId
- Stocké en mémoire (Map) avec expiration

**Expiration :**
- **Durée de vie :** 15 minutes
- **Cleanup automatique** : Toutes les 5 minutes
- **Message SMS :** "Ce code expire dans 15 minutes"

**Rate Limiting :**
- **1 SMS par minute** par numéro
- Si trop rapide → Erreur 429 avec `retryAfter` en secondes

**Vérification :**
- **3 tentatives maximum**
- Chaque échec décrémente le compteur
- Après 3 échecs → OTP supprimé, demander nouveau code

### Formats de numéros supportés

Le service normalise automatiquement les numéros :

| Format entré | Format normalisé |
|--------------|------------------|
| `0612345678` | `+33612345678` (France) |
| `+33612345678` | `+33612345678` |
| `06 12 34 56 78` | `+33612345678` |
| `06-12-34-56-78` | `+33612345678` |
| `(06) 12 34 56 78` | `+33612345678` |

**Note :** Par défaut, indicatif France (+33). Configurable dans `smsService.ts` ligne 96.

---

## 🛠️ Dépannage

### Problème 1 : "SMS service not configured"

**Cause :** Variables d'environnement manquantes ou incorrectes

**Solution :**
1. Vérifier que `backend/.env` contient bien :
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+33...
   ```
2. Redémarrer le backend : `npm run dev`
3. Vérifier les logs : `✅ Twilio SMS service initialized`

### Problème 2 : "Phone number not authorized" (Code 21608)

**Cause :** Compte gratuit (trial) + numéro non vérifié

**Solution :**
- **Option A :** Vérifier le numéro dans Console Twilio → Verified Caller IDs
- **Option B :** Upgrader vers compte payant ($20 minimum)

### Problème 3 : "Invalid phone number" (Code 21614)

**Cause :** Format de numéro incorrect

**Solution :**
- Utiliser format international : `+33612345678`
- Vérifier l'indicatif pays (FR: +33, US: +1, UK: +44, etc.)
- Supprimer espaces/tirets : `+33 6 12 34 56 78` → `+33612345678`

### Problème 4 : SMS non reçus

**Vérifications :**
1. **Numéro correct** : Vérifier indicatif pays
2. **Réseau mobile** : Vérifier signal téléphone
3. **Twilio Dashboard** : Console → Monitor → Logs → Messages
   - Si statut `delivered` → SMS envoyé avec succès
   - Si statut `failed` → Voir raison d'erreur
4. **Opérateur bloque SMS** : Certains opérateurs bloquent SMS courts (contacter support)
5. **Filtre anti-spam** : SMS peut arriver en spam

### Problème 5 : Rate limiting trop strict

**Symptôme :** "Trop de tentatives. Réessayez dans X secondes"

**Cause :** Protection anti-spam (1 SMS/minute/numéro)

**Solution :**
- Attendre le délai indiqué (généralement < 60 secondes)
- Si besoin modifier : `smsService.ts` ligne 22 (RATE_LIMIT_MINUTES)

### Problème 6 : OTP expiré

**Symptôme :** "Code expiré. Demandez un nouveau code"

**Cause :** Plus de 15 minutes depuis l'envoi

**Solution :**
- Demander un nouveau code (bouton "Renvoyer le code")
- Si besoin modifier durée : `smsService.ts` ligne 21 (OTP_EXPIRATION_MINUTES)

### Problème 7 : Échecs multiples vérification

**Symptôme :** "Trop de tentatives échouées (3 max)"

**Cause :** 3 codes incorrects entrés

**Solution :**
- Demander un nouveau code
- Vérifier que l'électeur entre le BON code (6 chiffres)
- Si besoin modifier max attempts : `smsService.ts` ligne 20 (MAX_ATTEMPTS)

---

## 💰 Tarification

### Compte Gratuit (Trial)

- ✅ **$15.50 de crédit** offert
- ✅ **1 numéro** Twilio gratuit
- ⚠️ SMS uniquement aux **numéros vérifiés**
- ⚠️ Watermark "Sent from your Twilio trial account"
- 📱 ~500 SMS gratuits (selon pays)

### Compte Payant

#### Prix par SMS (Pay-as-you-go)

| Pays | Prix/SMS envoyé | Prix/SMS reçu |
|------|----------------|---------------|
| 🇫🇷 **France** | **$0.0650** | $0.0075 |
| 🇬🇧 UK | $0.0400 | $0.0060 |
| 🇺🇸 USA | $0.0079 | $0.0075 |
| 🇩🇪 Allemagne | $0.0750 | $0.0075 |
| 🇪🇸 Espagne | $0.0760 | $0.0075 |

#### Prix par numéro

- 🇫🇷 **France** : ~**$2/mois**
- 🇺🇸 USA : ~$1.15/mois

#### Exemples de coûts

**Élection de 100 électeurs (France) :**
- 100 SMS OTP : 100 × $0.065 = **$6.50**
- Numéro Twilio : **$2/mois**
- **Total :** ~$8.50

**Élection de 1000 électeurs (France) :**
- 1000 SMS OTP : 1000 × $0.065 = **$65**
- Numéro Twilio : **$2/mois**
- **Total :** ~$67

**Élection de 10,000 électeurs (France) :**
- 10,000 SMS OTP : 10,000 × $0.065 = **$650**
- Numéro Twilio : **$2/mois**
- **Total :** ~$652

### Optimisations coûts

1. **Combiner Email + SMS** : Envoyer email par défaut, SMS seulement si nécessaire
2. **Réutiliser codes** : 1 code par électeur (pas 1 code par tentative)
3. **Pays moins chers** : USA moins cher que France ($0.0079 vs $0.065)
4. **Alertes budget** : Configurer alertes Twilio à $50, $100, $200
5. **Monitoring** : Surveiller consommation dans Twilio Console

---

## ✅ Checklist finale

Avant de mettre en production, vérifier :

### Configuration

- [ ] Variables d'environnement `.env` remplies
  - [ ] `TWILIO_ACCOUNT_SID` correct (commence par `AC`)
  - [ ] `TWILIO_AUTH_TOKEN` correct (32 caractères)
  - [ ] `TWILIO_PHONE_NUMBER` format international (`+33...`)

### Tests

- [ ] Test SMS simple réussi (`/test-sms`)
- [ ] Test envoi OTP réussi (`/send-otp`)
- [ ] Test vérification OTP réussi (`/verify-otp`)
- [ ] Test envoi en masse réussi (`/send-invitations-sms`)
- [ ] Test rate limiting (2 SMS < 1 min → Erreur 429)
- [ ] Test expiration (code après 15 min → Erreur expiré)
- [ ] Test tentatives (3 codes faux → Erreur max attempts)

### Compte Twilio

- [ ] Compte Twilio vérifié (email + téléphone)
- [ ] Numéro Twilio actif et SMS capable
- [ ] Si compte gratuit : Numéros de test vérifiés
- [ ] Si compte payant : Moyen de paiement ajouté
- [ ] Alertes budget configurées

### Sécurité

- [ ] `.env` dans `.gitignore` (ne JAMAIS commit)
- [ ] Auth Token gardé SECRET
- [ ] Logs backend ne contiennent PAS les tokens
- [ ] Rate limiting activé (anti-spam)

### Monitoring

- [ ] Logs backend activés (`LOG_LEVEL=info`)
- [ ] Twilio Console Logs activés (Monitor → Logs)
- [ ] Alertes email Twilio configurées (échecs, quotas)

### Documentation

- [ ] Guide Twilio lu et compris
- [ ] Variables d'environnement documentées
- [ ] Procédure dépannage connue

---

## 📞 Support

### Support DEMOCRATIX

- 📧 **Email :** support@democratix.io
- 💬 **Discord :** [democratix.io/discord](https://democratix.io/discord)
- 📖 **Documentation :** [docs.democratix.io](https://docs.democratix.io)

### Support Twilio

- 📖 **Documentation :** [https://www.twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- 💬 **Support :** [https://support.twilio.com/](https://support.twilio.com/)
- 📱 **Console :** [https://console.twilio.com/](https://console.twilio.com/)
- 🎓 **Tutorials :** [https://www.twilio.com/docs/tutorials](https://www.twilio.com/docs/tutorials)

---

## 🎯 Prochaines Étapes

1. ✅ Configurer Twilio (ce guide)
2. ⏭️ Tester l'envoi SMS en développement
3. ⏭️ Intégrer l'interface frontend (modal SMS)
4. ⏭️ Tester en conditions réelles avec utilisateurs
5. ⏭️ Déployer en production

---

**Dernière mise à jour** : 5 Novembre 2025
**Auteur** : Équipe DEMOCRATIX
**Version** : 1.0.0
