# 📧 Guide de Configuration SendGrid - DEMOCRATIX

**Date** : 4 Novembre 2025
**Version** : v1.3.3
**Objectif** : Configurer SendGrid pour l'envoi automatique d'emails d'invitation

---

## 🎯 Vue d'Ensemble

SendGrid permet d'envoyer des emails transactionnels professionnels avec :
- Templates HTML personnalisables
- Statistiques d'envoi (taux d'ouverture, clics)
- Gestion des bounces et spam
- API simple et fiable
- **Plan gratuit** : 100 emails/jour (suffisant pour tester)

---

## 📋 Étapes de Configuration

### Étape 1 : Créer un Compte SendGrid

1. **Aller sur** : https://signup.sendgrid.com/
2. **Créer un compte gratuit** (Free tier : 100 emails/jour)
3. **Vérifier votre email** de confirmation
4. **Compléter le questionnaire** initial

---

### Étape 2 : Créer une API Key

1. **Se connecter** à SendGrid : https://app.sendgrid.com/
2. **Aller dans** : Settings → API Keys
3. **Cliquer** : "Create API Key"
4. **Configurer** :
   - Name : `DEMOCRATIX Production` (ou `DEMOCRATIX Dev`)
   - API Key Permissions : **Full Access** (ou au minimum "Mail Send")
5. **Copier la clé** (elle ne sera affichée qu'une seule fois !)
6. **Coller dans** `backend/.env` :
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

⚠️ **Important** : Ne commitez JAMAIS cette clé dans Git !

---

### Étape 3 : Vérifier l'Email d'Envoi (Sender Authentication)

Pour que vos emails ne soient pas marqués comme spam, vous devez vérifier votre adresse d'envoi.

#### Option A : Single Sender Verification (Rapide - 5 min)

**Pour tester rapidement** :

1. **Aller dans** : Settings → Sender Authentication → Single Sender Verification
2. **Cliquer** : "Create New Sender"
3. **Remplir le formulaire** :
   ```
   From Name: DEMOCRATIX
   From Email Address: votre-email@gmail.com (ou autre)
   Reply To: votre-email@gmail.com
   Address: Votre adresse
   City: Votre ville
   Country: France
   ```
4. **Cliquer** : "Create"
5. **Vérifier votre email** → Cliquer sur le lien de confirmation
6. **Mettre à jour** `backend/.env` :
   ```bash
   SENDGRID_FROM_EMAIL=votre-email@gmail.com
   SENDGRID_FROM_NAME=DEMOCRATIX
   ```

#### Option B : Domain Authentication (Production - 30 min)

**Pour la production avec domaine personnalisé** :

1. **Aller dans** : Settings → Sender Authentication → Domain Authentication
2. **Cliquer** : "Authenticate Your Domain"
3. **Entrer votre domaine** : `democratix.io`
4. **Choisir** : "Use Cloudflare" (si applicable)
5. **Ajouter les DNS records** fournis par SendGrid dans votre registrar :
   ```
   Type: CNAME
   Name: em1234.democratix.io
   Value: u1234567.wl123.sendgrid.net

   Type: CNAME
   Name: s1._domainkey.democratix.io
   Value: s1.domainkey.u1234567.wl123.sendgrid.net

   Type: CNAME
   Name: s2._domainkey.democratix.io
   Value: s2.domainkey.u1234567.wl123.sendgrid.net
   ```
6. **Attendre** propagation DNS (5-30 min)
7. **Cliquer** : "Verify" dans SendGrid
8. **Mettre à jour** `backend/.env` :
   ```bash
   SENDGRID_FROM_EMAIL=noreply@democratix.io
   SENDGRID_FROM_NAME=DEMOCRATIX
   ```

---

### Étape 4 : Créer le Template Email HTML

1. **Aller dans** : Email API → Dynamic Templates
2. **Cliquer** : "Create a Dynamic Template"
3. **Nom** : `DEMOCRATIX - Invitation à Voter`
4. **Cliquer sur le template** créé → "Add Version"
5. **Choisir** : "Blank Template" → "Code Editor"
6. **Coller ce code HTML** :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation à Voter - DEMOCRATIX</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #1E40AF;
      font-size: 22px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      margin: 15px 0;
      color: #555;
    }
    .info-box {
      background: #F0F9FF;
      border-left: 4px solid #3B82F6;
      padding: 20px;
      margin: 25px 0;
      border-radius: 6px;
    }
    .info-box strong {
      color: #1E40AF;
      font-size: 16px;
      display: block;
      margin-bottom: 8px;
    }
    .code-box {
      background: #F9FAFB;
      border: 2px dashed #3B82F6;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
      text-align: center;
    }
    .code-box .label {
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .code-box .code {
      font-family: 'Courier New', monospace;
      font-size: 20px;
      font-weight: 700;
      color: #1E40AF;
      letter-spacing: 2px;
      word-break: break-all;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      box-shadow: 0 6px 16px rgba(30, 64, 175, 0.4);
      transform: translateY(-2px);
    }
    .steps {
      background: #F9FAFB;
      padding: 25px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .steps h3 {
      color: #1E40AF;
      font-size: 18px;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .steps ol {
      margin: 0;
      padding-left: 20px;
    }
    .steps li {
      margin: 10px 0;
      color: #555;
    }
    .footer {
      background: #F9FAFB;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #E5E7EB;
    }
    .footer p {
      margin: 8px 0;
    }
    .footer a {
      color: #3B82F6;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 20px 10px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 30px 20px;
      }
      .cta-button {
        display: block;
        padding: 14px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🗳️ DEMOCRATIX</h1>
      <p>Plateforme de Vote Décentralisé</p>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>Vous êtes invité(e) à voter !</h2>

      <p>Bonjour,</p>

      <p>{{organizerName}} vous invite à participer à l'élection suivante :</p>

      <div class="info-box">
        <strong>📋 {{electionTitle}}</strong>
        <p style="margin: 10px 0 0; color: #666;">
          📅 Date limite : {{expirationDate}}
        </p>
      </div>

      <p>
        Vous avez reçu un <strong>code d'invitation unique</strong> pour participer à ce vote sécurisé
        sur la blockchain MultiversX.
      </p>

      <!-- Code Box -->
      <div class="code-box">
        <div class="label">🎫 Votre Code d'Invitation</div>
        <div class="code">{{invitationCode}}</div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="{{voteUrl}}" class="cta-button">
          🗳️ Voter Maintenant
        </a>
      </div>

      <!-- Instructions -->
      <div class="steps">
        <h3>📝 Comment voter ?</h3>
        <ol>
          <li>Cliquez sur le bouton "Voter Maintenant" ci-dessus</li>
          <li>Connectez votre wallet MultiversX (xPortal, DeFi Wallet, etc.)</li>
          <li>Utilisez votre code d'invitation pour vous inscrire</li>
          <li>Consultez les candidats et votez pour votre choix</li>
          <li>Signez la transaction blockchain</li>
        </ol>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        ⚠️ <strong>Important</strong> : Ce code ne peut être utilisé qu'une seule fois.
        Ne le partagez avec personne.
      </p>

      <p style="color: #666; font-size: 14px;">
        🔒 <strong>Sécurité</strong> : Votre vote est crypté et enregistré de manière immuable
        sur la blockchain MultiversX. Personne, pas même les organisateurs, ne peut voir votre choix.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>DEMOCRATIX</strong> - Vote Décentralisé Sécurisé</p>
      <p>
        Propulsé par la blockchain <a href="https://multiversx.com" target="_blank">MultiversX</a>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">
        © {{currentYear}} DEMOCRATIX. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
```

7. **Ajouter les variables dynamiques** dans le Test Data (JSON) :
```json
{
  "electionTitle": "Élection du Président 2025",
  "organizerName": "Commission Électorale",
  "invitationCode": "abc123def456ghi789",
  "voteUrl": "https://app.democratix.io/register/1?token=abc123def456ghi789",
  "expirationDate": "31/12/2025",
  "currentYear": 2025
}
```

8. **Cliquer** : "Preview" pour voir le rendu
9. **Cliquer** : "Save Template"
10. **Copier le Template ID** (format : `d-xxxxxxxxxxxxxxxxxxxxxxxx`)
11. **Coller dans** `backend/.env` :
```bash
SENDGRID_INVITATION_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🧪 Tests

### Test 1 : Vérifier la Configuration Backend

```bash
cd backend
npm run dev
```

Vérifiez les logs :
```
✅ SendGrid API initialized
```

Si vous voyez :
```
⚠️ SendGrid API key not configured - email service disabled
```

→ Vérifiez que `SENDGRID_API_KEY` est bien dans `.env`

### Test 2 : Test Email Simple (API Direct)

Créez un fichier de test :

```bash
# backend/test-email.js
```

```javascript
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'votre-email-test@gmail.com', // CHANGEZ ICI
  from: {
    email: process.env.SENDGRID_FROM_EMAIL,
    name: process.env.SENDGRID_FROM_NAME
  },
  subject: 'Test DEMOCRATIX',
  text: 'Ceci est un email de test.',
  html: '<strong>Ceci est un email de test.</strong>',
};

sgMail.send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!');
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
  });
```

Exécuter :
```bash
node test-email.js
```

### Test 3 : Test Email avec Template via API Backend

Utilisez curl ou Postman :

```bash
curl -X POST http://localhost:3001/api/elections/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email-test@gmail.com"
  }'
```

Réponse attendue :
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "data": {
    "email": "votre-email-test@gmail.com",
    "messageId": "..."
  }
}
```

### Test 4 : Test Complet Frontend + Backend

1. **Lancer le backend** :
```bash
cd backend
npm run dev
```

2. **Lancer le frontend** :
```bash
cd frontend
npm run dev
```

3. **Aller sur** : http://localhost:3000
4. **Créer/Ouvrir une élection**
5. **Générer des codes d'invitation** (ex: 10 codes)
6. **Dans la section "📧 Envoyer par Email"** :
   - Entrer **votre email de test**
   - Cliquer **"Envoyer les Emails"**
7. **Vérifier votre boîte mail** (peut prendre 10-30 secondes)

---

## 🔍 Dépannage

### Problème 1 : "SendGrid not configured"

**Solution** :
- Vérifier que `SENDGRID_API_KEY` est dans `backend/.env`
- Redémarrer le serveur backend
- Vérifier les logs : `✅ SendGrid API initialized`

### Problème 2 : "Invalid API Key"

**Solution** :
- Vérifier que la clé commence par `SG.`
- Re-générer une nouvelle API Key dans SendGrid
- Vérifier qu'elle a les permissions "Mail Send"

### Problème 3 : "From email not verified"

**Solution** :
- Aller dans Settings → Sender Authentication
- Vérifier que l'email `SENDGRID_FROM_EMAIL` est vérifié
- Cliquer sur le lien dans l'email de vérification

### Problème 4 : Email dans Spam

**Solutions** :
1. **Faire Domain Authentication** (Option B ci-dessus)
2. **Ajouter l'expéditeur** à vos contacts
3. **Vérifier SPF/DKIM** : https://mxtoolbox.com/spf.aspx
4. **Réchauffer votre domaine** : augmenter progressivement le volume d'envois

### Problème 5 : Template ID invalide

**Solution** :
- Vérifier que le Template ID commence par `d-`
- Copier l'ID depuis SendGrid Dashboard → Dynamic Templates
- S'assurer que le template est publié (pas en draft)

---

## 📊 Monitoring SendGrid

### Dashboard SendGrid

1. **Activity Feed** : https://app.sendgrid.com/email_activity
   - Voir tous les emails envoyés
   - Statut : Delivered, Opened, Clicked, Bounced

2. **Statistics** : https://app.sendgrid.com/statistics
   - Graphiques d'envoi
   - Taux d'ouverture
   - Taux de clics

3. **Suppressions** : https://app.sendgrid.com/suppressions
   - Bounces (emails invalides)
   - Spam reports
   - Unsubscribes

### Logs Backend

Le service email log toutes les actions :

```bash
✅ Email sent to user@example.com - Status: 202
❌ Error sending email to invalid@email: Invalid email format
📧 Starting bulk email send: 10 emails
📤 Sending email 1/10 to user1@example.com
✅ Bulk email send completed: 9 success, 1 failures
```

---

## 🎯 Limites et Quotas

### Plan Gratuit SendGrid
- **100 emails/jour**
- Statistiques 7 jours
- Single sender verification uniquement
- Support communautaire

### Plan Essentials (15$/mois)
- **40,000 emails/mois** (+ 100 emails/jour)
- Statistiques 30 jours
- Domain authentication
- Support email

### Plan Pro (60$/mois)
- **100,000 emails/mois**
- Statistiques illimitées
- Domain authentication + dédiée IP
- Support prioritaire

**Recommandation** : Commencer avec plan gratuit pour tester, puis passer à Essentials en production.

---

## 📝 Checklist de Configuration Finale

Avant de passer en production :

- [ ] Compte SendGrid créé
- [ ] API Key générée avec permissions "Mail Send"
- [ ] API Key ajoutée dans `backend/.env`
- [ ] Sender Authentication complétée (Single Sender OU Domain)
- [ ] Email vérifié dans SendGrid
- [ ] Template HTML créé et publié
- [ ] Template ID copié dans `backend/.env`
- [ ] Test email simple réussi
- [ ] Test avec template réussi
- [ ] Test complet frontend+backend réussi
- [ ] Email reçu (pas en spam)
- [ ] Variables dynamiques correctes dans l'email
- [ ] Lien "Voter Maintenant" fonctionnel
- [ ] Code d'invitation affiché correctement

---

## 🚀 Prochaines Étapes

1. ✅ **Emails configurés**
2. ⏳ **SMS avec Twilio** (prochaine fonctionnalité)
3. ⏳ **Dashboard Analytics avancé**
4. ⏳ **Deep linking xPortal**

---

**Besoin d'aide ?**
- Documentation SendGrid : https://docs.sendgrid.com/
- Support SendGrid : https://support.sendgrid.com/
- Discord DEMOCRATIX : [lien à ajouter]
