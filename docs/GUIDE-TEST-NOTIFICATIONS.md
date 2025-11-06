# 🔔 Guide de Test des Notifications WebSocket

## 📍 Où apparaissent les notifications ?

Les notifications apparaissent **en haut à droite de l'écran** sous forme de toasts animés :

```
┌─────────────────────────────────────┐
│  ✅  Élection activée               │
│  Les électeurs peuvent maintenant   │
│  voter                              │
│  Il y a quelques secondes      [X]  │
└─────────────────────────────────────┘
```

### Style des notifications

- **Success** (Vert) : ✅ Élection finalisée, Votes déchiffrés
- **Info** (Bleu) : ℹ️ Nouveau vote, Nouveau candidat, Nouveau co-organisateur
- **Warning** (Jaune) : ⚠️ Élection clôturée, Co-organisateur retiré
- **Error** (Rouge) : ❌ Erreurs

## 🧪 Méthodes de Test

### Méthode 1 : Script de Démo Automatique (Le plus simple)

1. **Ouvrez votre navigateur** sur `https://localhost:3000`
2. **Naviguez** vers une page d'élection (ex: `/elections/75`)
3. **Exécutez** le script de test :
   ```bash
   test-notifications-demo.bat
   ```
4. **Observez** les 5 notifications apparaître successivement !

### Méthode 2 : Test Manuel avec Curl

Ouvrez la page d'élection dans votre navigateur, puis exécutez :

```bash
# Notification de vote reçu
curl -X POST http://localhost:3003/api/elections/75/notify \
  -H "Content-Type: application/json" \
  -d "{\"eventType\":\"vote:received\",\"txHash\":\"test123\"}"

# Notification d'élection activée
curl -X POST http://localhost:3003/api/elections/75/notify \
  -H "Content-Type: application/json" \
  -d "{\"eventType\":\"election:activated\",\"txHash\":\"test456\"}"

# Notification d'élection clôturée
curl -X POST http://localhost:3003/api/elections/75/notify \
  -H "Content-Type: application/json" \
  -d "{\"eventType\":\"election:closed\",\"txHash\":\"test789\"}"

# Notification d'élection finalisée
curl -X POST http://localhost:3003/api/elections/75/notify \
  -H "Content-Type: application/json" \
  -d "{\"eventType\":\"election:finalized\",\"txHash\":\"test101\"}"

# Notification de candidat ajouté
curl -X POST http://localhost:3003/api/elections/75/notify \
  -H "Content-Type: application/json" \
  -d "{\"eventType\":\"candidate:added\",\"txHash\":\"test202\",\"data\":{\"candidateName\":\"Alice\"}}"
```

### Méthode 3 : Test Multi-utilisateurs (Réaliste)

**Simulation de notifications temps réel entre utilisateurs :**

1. **Ouvrir 2 onglets** du même navigateur (ou 2 navigateurs différents)
   - Onglet A : `https://localhost:3000/elections/75`
   - Onglet B : `https://localhost:3000/elections/75`

2. **Dans l'onglet A**, effectuer une action (ex: ajouter un co-organisateur)

3. **Observer l'onglet B** : La notification apparaît automatiquement !

### Méthode 4 : Test avec Actions Réelles

**Test le plus réaliste avec vraies transactions :**

1. **Créer une élection** avec vote privé (ElGamal)
2. **Faire voter** quelques électeurs
3. **Clôturer** l'élection
4. **Ouvrir 2 onglets** sur la page Résultats
5. **Dans l'onglet 1**, cliquer sur "Déchiffrer les votes"
6. **Observer l'onglet 2** : Notification "🔓 Votes déchiffrés" apparaît !

## 🎯 Types d'événements supportés

| Événement | Type | Icône | Message |
|-----------|------|-------|---------|
| `vote:received` | info | 🗳️ | "Nouveau vote - Un électeur vient de voter" |
| `election:activated` | success | ✅ | "Élection activée - Les électeurs peuvent maintenant voter" |
| `election:closed` | warning | 🔒 | "Élection clôturée - Le vote est maintenant fermé" |
| `election:finalized` | success | 🎉 | "Élection finalisée - Les résultats sont maintenant officiels" |
| `vote:decrypted` | success | 🔓 | "Votes déchiffrés - Les résultats sont maintenant disponibles" |
| `candidate:added` | info | 👤 | "Nouveau candidat - [Nom du candidat]" |
| `coorganizer:added` | info | 👥 | "Nouveau co-organisateur - [Adresse]" |
| `coorganizer:removed` | warning | 👥 | "Co-organisateur retiré - [Adresse]" |

## 🔧 Dépannage

### Les notifications n'apparaissent pas

1. **Vérifier la console du navigateur** (F12)
   - Chercher des erreurs WebSocket
   - Vérifier que la connexion est établie

2. **Vérifier le backend**
   - Backend doit tourner sur port 3003
   - Chercher dans les logs : `WebSocket service initialized`

3. **Vérifier le frontend**
   - Frontend doit tourner sur port 3000
   - Vérifier que socket.io-client est installé

### La connexion WebSocket échoue

- **Problème CORS** : Vérifier que le frontend URL est autorisé dans `websocketService.ts`
- **Port bloqué** : Vérifier que le port 3003 n'est pas bloqué par un firewall

### Les toasts ne se ferment pas

- Vérifier le paramètre `duration` dans `ToastContext.tsx`
- Par défaut : 4-6 secondes selon le type d'événement

## 📊 Vérification de l'état du système

Pour vérifier que tout fonctionne :

```bash
# Backend doit afficher :
✅ WebSocket service initialized successfully
🔌 WebSocket available on ws://localhost:3003

# Frontend (console navigateur) doit afficher :
Socket.io connected
WebSocket notifications ready
```

## 🎨 Personnalisation

Les notifications peuvent être personnalisées dans :
- **Style** : `frontend/src/components/Toast/Toast.tsx`
- **Messages** : `frontend/src/hooks/useWebSocketNotifications.ts`
- **Durée** : `frontend/src/contexts/ToastContext.tsx`
- **Position** : `frontend/src/components/Toast/ToastContainer.tsx` (actuellement : top-right)

---

**Créé le** : 3 novembre 2025
**Version** : 1.0.0
