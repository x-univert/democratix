# 📱 Guide d'Intégration xPortal - DEMOCRATIX

**Date**: 4 Novembre 2025
**Version**: v1.3.2+
**Objectif**: Intégrer DEMOCRATIX dans l'application mobile xPortal de MultiversX

---

## 🎯 Vue d'Ensemble

xPortal est le **wallet mobile officiel** de MultiversX (anciennement Maiar). Il permet aux utilisateurs de :
- Gérer leurs tokens EGLD
- Se connecter à des dApps
- Signer des transactions
- Scanner des QR codes
- Utiliser des mini-apps intégrées

**Notre objectif** : Permettre aux utilisateurs de voter depuis xPortal sans quitter l'application.

---

## 📋 Options d'Intégration

### Option 1 : **Deep Linking** (Rapide, Recommandé) ⭐
**Durée** : 1-2 jours
**Complexité** : 🟢 Faible

L'utilisateur clique sur un lien dans xPortal → Ouvre le navigateur xPortal intégré → Vote normalement

**Avantages** :
- ✅ Aucune modification code nécessaire
- ✅ Fonctionne immédiatement
- ✅ Utilise wallet xPortal automatiquement
- ✅ Compatible toutes dApps MultiversX

**Inconvénients** :
- ⚠️ Expérience "navigateur" (pas app native)
- ⚠️ Nécessite connexion internet

### Option 2 : **Mini-App xPortal** (Moyen terme)
**Durée** : 2-3 semaines
**Complexité** : 🟡 Moyenne

Créer une mini-application intégrée dans xPortal Hub

**Avantages** :
- ✅ Expérience native intégrée
- ✅ Accès direct wallet xPortal
- ✅ Notifications push natives
- ✅ Icône dans xPortal Hub

**Inconvénients** :
- ⚠️ Nécessite validation MultiversX
- ⚠️ Processus de soumission
- ⚠️ Guidelines strictes à respecter

### Option 3 : **App Native React Native** (Long terme)
**Durée** : 4-6 semaines
**Complexité** : 🔴 Élevée

Application mobile standalone avec SDK xPortal

**Avantages** :
- ✅ App totalement personnalisée
- ✅ Performance optimale
- ✅ Fonctionnalités natives (caméra, notifications)
- ✅ Store iOS/Android

**Inconvénients** :
- ⚠️ Développement long
- ⚠️ Maintenance double (web + mobile)
- ⚠️ Budget important

---

## 🚀 OPTION 1 : Deep Linking (Recommandé pour Démarrer)

### Étape 1 : Configurer Deep Links

#### 1.1 Créer les URLs universelles

```typescript
// frontend/src/config/deeplinks.ts

export const DEEPLINK_CONFIG = {
  // Production
  scheme: 'democratix',
  host: 'app.democratix.io',

  // Deep link formats
  vote: (electionId: number) =>
    `democratix://vote/${electionId}`,

  election: (electionId: number) =>
    `democratix://election/${electionId}`,

  register: (electionId: number, token: string) =>
    `democratix://register/${electionId}?token=${token}`,

  // Fallback web URLs
  webVote: (electionId: number) =>
    `https://app.democratix.io/vote/${electionId}`,

  webElection: (electionId: number) =>
    `https://app.democratix.io/elections/${electionId}`,
};
```

#### 1.2 Créer QR Codes Universels

```typescript
// frontend/src/utils/qrCodeService.ts

import { DEEPLINK_CONFIG } from '../config/deeplinks';

export const generateUniversalQRCode = (
  electionId: number,
  token: string
) => {
  // Format universel qui fonctionne web ET xPortal
  const deepLink = DEEPLINK_CONFIG.register(electionId, token);
  const webFallback = DEEPLINK_CONFIG.webElection(electionId);

  // QR code contient le deep link
  // Si xPortal : ouvre mini-browser xPortal
  // Si autre : ouvre navigateur normal
  return {
    qrData: deepLink,
    fallbackUrl: webFallback,
  };
};
```

#### 1.3 Ajouter Bouton "Ouvrir dans xPortal"

```tsx
// frontend/src/components/ElectionCard/ElectionCard.tsx

import { openInXPortal } from '../../utils/xPortalHelpers';

const ElectionCard = ({ election }) => {
  const handleOpenInXPortal = () => {
    const deepLink = `democratix://election/${election.id}`;
    const webFallback = `https://app.democratix.io/elections/${election.id}`;

    // Détection mobile
    if (isMobile()) {
      // Essayer d'ouvrir xPortal
      window.location.href = deepLink;

      // Fallback après 2s si xPortal pas installé
      setTimeout(() => {
        window.location.href = webFallback;
      }, 2000);
    } else {
      // Desktop : afficher QR code pour scan mobile
      showQRCodeModal(deepLink);
    }
  };

  return (
    <div className="election-card">
      <h3>{election.title}</h3>

      {/* Bouton xPortal */}
      <button
        onClick={handleOpenInXPortal}
        className="btn-xportal"
      >
        📱 Ouvrir dans xPortal
      </button>
    </div>
  );
};
```

### Étape 2 : Configurer le Routing Deep Link

```tsx
// frontend/src/App.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Écouter les deep links
    const handleDeepLink = (event: Event) => {
      const url = (event as any).url || window.location.href;

      // Parser le deep link
      if (url.includes('democratix://')) {
        const path = url.replace('democratix://', '');

        // Router vers la bonne page
        if (path.startsWith('vote/')) {
          const electionId = path.split('/')[1];
          navigate(`/vote/${electionId}`);
        } else if (path.startsWith('election/')) {
          const electionId = path.split('/')[1];
          navigate(`/elections/${electionId}`);
        } else if (path.startsWith('register/')) {
          const [_, electionId, query] = path.split(/[/?]/);
          const token = new URLSearchParams(query).get('token');
          navigate(`/register/${electionId}?token=${token}`);
        }
      }
    };

    // Event listener
    window.addEventListener('deeplink', handleDeepLink);

    return () => {
      window.removeEventListener('deeplink', handleDeepLink);
    };
  }, [navigate]);

  return <Routes>...</Routes>;
};
```

### Étape 3 : Optimiser pour xPortal Browser

```tsx
// frontend/src/utils/xPortalDetection.ts

export const isXPortalBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('xportal') ||
    userAgent.includes('maiar') ||
    // Détection via injected objects
    !!(window as any).elrondWallet
  );
};

export const optimizeForXPortal = () => {
  if (isXPortalBrowser()) {
    // Ajuster UI pour petit écran mobile
    document.body.classList.add('xportal-mode');

    // Désactiver certaines features desktop
    // Activer auto-connect wallet
    return {
      autoConnect: true,
      mobileOptimized: true,
      walletProvider: 'xportal',
    };
  }

  return {
    autoConnect: false,
    mobileOptimized: false,
    walletProvider: 'extension',
  };
};
```

### Étape 4 : Tester l'Intégration

```bash
# 1. Build production
cd frontend
npm run build

# 2. Déployer sur domaine HTTPS (requis pour xPortal)
# Exemple : Vercel, Netlify, AWS

# 3. Tester sur mobile avec xPortal installé
# - Créer QR code avec deep link
# - Scanner avec xPortal
# - Vérifier ouverture correcte

# 4. Tester fallback si xPortal pas installé
# - Scanner même QR avec caméra normale
# - Doit ouvrir navigateur web normal
```

---

## 🎨 OPTION 2 : Mini-App xPortal (Moyen Terme)

### Prérequis
- Application web fonctionnelle (✅ nous l'avons)
- HTTPS obligatoire (certificat SSL)
- Responsive mobile parfait
- Performance optimisée

### Étapes de Soumission

#### 1. Préparer l'Application

```json
// xportal-manifest.json

{
  "name": "DEMOCRATIX",
  "short_name": "DEMOCRATIX",
  "description": "Vote décentralisé sécurisé sur MultiversX",
  "version": "1.3.2",
  "start_url": "https://app.democratix.io",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1E40AF",
  "background_color": "#FFFFFF",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["governance", "voting", "dao"],
  "permissions": [
    "wallet.connect",
    "wallet.sign",
    "wallet.address"
  ]
}
```

#### 2. Soumettre à MultiversX

```markdown
1. Créer compte développeur MultiversX
   - https://xportal.com/developers

2. Remplir formulaire de soumission
   - Nom de l'app
   - Description détaillée
   - Screenshots (5 minimum)
   - Vidéo démo (optionnel mais recommandé)
   - URL de l'app
   - Whitepaper/Documentation

3. Review MultiversX (2-4 semaines)
   - Vérification sécurité
   - Test UX mobile
   - Validation smart contracts
   - Review code (optionnel)

4. Publication dans xPortal Hub
   - Apparaît dans section "Discover"
   - Icône dans liste apps
   - Notifications aux utilisateurs
```

#### 3. Guidelines xPortal à Respecter

```markdown
Design:
- [ ] Interface mobile-first responsive
- [ ] Boutons minimum 44x44px (touch-friendly)
- [ ] Contraste texte ≥ 4.5:1 (WCAG AA)
- [ ] Pas de scroll horizontal
- [ ] Loading states clairs

Performance:
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 500KB (gzipped)
- [ ] Images optimisées WebP

Sécurité:
- [ ] HTTPS obligatoire (TLS 1.3)
- [ ] Content Security Policy
- [ ] Pas de code malveillant
- [ ] Smart contracts audités

UX:
- [ ] Connexion wallet en 1 clic
- [ ] Confirmations transactions claires
- [ ] Messages d'erreur explicites
- [ ] Support offline (basique)
```

---

## 🔧 OPTION 3 : App Native React Native

### Architecture Recommandée

```
DEMOCRATIX-Mobile/
├── src/
│   ├── screens/
│   │   ├── ElectionsList.tsx
│   │   ├── ElectionDetail.tsx
│   │   ├── Vote.tsx
│   │   └── Results.tsx
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── ElectionCard.tsx
│   │   └── VoteButton.tsx
│   ├── services/
│   │   ├── xPortalSDK.ts      # SDK MultiversX
│   │   ├── blockchain.ts
│   │   └── notifications.ts
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   └── utils/
│       ├── qrScanner.ts        # react-native-camera
│       └── biometrics.ts       # react-native-biometrics
├── android/                    # Code Android natif
├── ios/                        # Code iOS natif
├── package.json
└── app.json
```

### Stack Technique

```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "@multiversx/sdk-react-native": "^1.0.0",
    "@react-navigation/native": "^6.1.0",
    "react-native-qrcode-scanner": "^1.5.0",
    "react-native-biometrics": "^3.0.0",
    "react-native-push-notification": "^8.1.0",
    "react-native-vector-icons": "^10.0.0"
  }
}
```

### SDK MultiversX pour React Native

```typescript
// src/services/xPortalSDK.ts

import { WalletConnectProvider } from '@multiversx/sdk-react-native';

export class XPortalWallet {
  private provider: WalletConnectProvider;

  async connect() {
    // Connexion automatique si xPortal installé
    this.provider = new WalletConnectProvider({
      bridge: 'https://bridge.walletconnect.org',
      qrcode: true, // Affiche QR si app pas installée
    });

    await this.provider.init();
    const { approval } = await this.provider.connect();

    return {
      address: approval.accounts[0],
      connected: true,
    };
  }

  async signTransaction(tx: Transaction) {
    return await this.provider.signTransaction(tx);
  }

  async disconnect() {
    await this.provider.disconnect();
  }
}
```

---

## 📊 Tableau Comparatif des Options

| Critère | Deep Linking | Mini-App xPortal | App Native |
|---------|--------------|------------------|------------|
| **Durée** | 1-2 jours | 2-3 semaines | 4-6 semaines |
| **Complexité** | 🟢 Faible | 🟡 Moyenne | 🔴 Élevée |
| **Coût** | Gratuit | Gratuit | €€€ |
| **UX** | ⭐⭐⭐ Web | ⭐⭐⭐⭐ Intégré | ⭐⭐⭐⭐⭐ Native |
| **Maintenance** | Aucune | Faible | Élevée |
| **Store** | Non | Hub xPortal | iOS + Android |
| **Notifications** | ❌ Non | ✅ Oui | ✅ Oui |
| **Offline** | ❌ Non | ⚠️ Partiel | ✅ Oui |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Recommandation DEMOCRATIX

### Phase 1 (Maintenant) : Deep Linking ⭐
**Durée** : 1-2 jours
**Impact** : Accès mobile immédiat

```bash
1. Ajouter bouton "Ouvrir dans xPortal" sur ElectionCard
2. Créer QR codes avec deep links
3. Tester sur xPortal mobile
4. Déployer sur HTTPS
```

### Phase 2 (1-2 mois) : Mini-App xPortal
**Durée** : 2-3 semaines
**Impact** : Visibilité dans xPortal Hub

```bash
1. Optimiser UI mobile
2. Créer manifest xPortal
3. Soumettre à MultiversX
4. Attendre validation
5. Publication
```

### Phase 3 (3-6 mois) : App Native (Optionnel)
**Durée** : 4-6 semaines
**Impact** : App store officielle

```bash
1. Développer avec React Native
2. Intégrer SDK MultiversX
3. Tests iOS + Android
4. Soumission App Store + Play Store
```

---

## 🚀 Actions Immédiates (Cette Semaine)

### Jour 1-2 : Deep Linking Setup

```bash
# 1. Créer fichier config
touch frontend/src/config/deeplinks.ts

# 2. Ajouter utilitaires xPortal
touch frontend/src/utils/xPortalHelpers.ts
touch frontend/src/utils/xPortalDetection.ts

# 3. Modifier composants existants
# - ElectionCard : ajouter bouton xPortal
# - QRCodeGeneratorModal : utiliser deep links
# - Vote.tsx : optimiser pour mobile

# 4. Tester localement
npm run dev

# 5. Build et déployer
npm run build
# Déployer sur Vercel/Netlify avec HTTPS

# 6. Tester avec xPortal mobile
# - Installer xPortal sur smartphone
# - Scanner QR code
# - Vérifier ouverture
```

---

## 📚 Ressources

### Documentation Officielle
- **xPortal Docs**: https://docs.multiversx.com/wallet/xportal/
- **Deep Linking**: https://docs.multiversx.com/developers/deep-links/
- **SDK React Native**: https://docs.multiversx.com/sdk-and-tools/sdk-js/

### Exemples Code
- **xPortal Examples**: https://github.com/multiversx/mx-sdk-js-examples
- **Mini-Apps**: https://github.com/multiversx/mx-mini-apps

### Support
- **Discord MultiversX**: https://discord.gg/multiversx
- **Forum Développeurs**: https://forum.multiversx.com

---

**Prochaine étape recommandée** : Implémenter Deep Linking (Option 1) cette semaine ! 🚀
