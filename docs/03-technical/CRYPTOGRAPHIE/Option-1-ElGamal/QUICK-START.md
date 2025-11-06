# Quick Start - Vote Privé ElGamal (Option 1)

Guide rapide pour démarrer avec le vote privé ElGamal en 5 minutes.

---

## Pour les Organisateurs

### 1️⃣ Créer une élection avec vote privé (2 min)

```
1. Page "Créer une élection"
2. Remplir : titre, description, candidats
3. ✅ Cocher "Activer le vote privé (ElGamal)"
4. Créer l'élection
```

---

### 2️⃣ Configurer le chiffrement ElGamal (1 min)

```
1. Sur la page de l'élection, clic "Configurer ElGamal"
2. ⚠️ SAUVEGARDER votre secret personnel (affiché à l'écran)
3. Confirmer la transaction
```

**💾 Où sauvegarder le secret ?**
- Gestionnaire de mots de passe (1Password, Bitwarden)
- Fichier texte chiffré
- Copie papier dans un coffre

---

### 3️⃣ Activer l'élection (30 sec)

```
1. Clic "Activer l'élection"
2. Confirmer la transaction
✅ L'élection est maintenant active !
```

---

### 4️⃣ Attendre les votes... ⏳

Les électeurs peuvent maintenant voter en privé.

---

### 5️⃣ Clôturer l'élection (30 sec)

```
1. À la fin de la période de vote, clic "Clôturer l'élection"
2. Confirmer la transaction
```

---

### 6️⃣ Déchiffrer les votes (1 min)

```
1. Clic "Déchiffrer les votes ElGamal"
2. Le système charge automatiquement votre secret
3. Confirmer la transaction
✅ Les votes sont déchiffrés et comptés !
```

---

### 7️⃣ Finaliser l'élection (30 sec)

```
1. Clic "Finaliser l'élection"
2. Confirmer la transaction
✅ Les résultats sont définitifs !
```

---

## Pour les Électeurs

### 1️⃣ Trouver une élection (30 sec)

```
1. Parcourir la liste des élections
2. Chercher le badge "🔐 VOTE PRIVÉ"
3. Cliquer sur l'élection
```

---

### 2️⃣ Voter en privé (1 min)

```
1. Choisir votre candidat
2. Clic "🔐 Voter en privé (ElGamal)"
3. Confirmer dans la modale
4. Confirmer la transaction dans votre wallet
✅ Votre vote est chiffré et anonyme !
```

---

### 3️⃣ Vérifier votre vote (optionnel)

```
Sur la page de l'élection, vous verrez :
"✅ Vous avez déjà voté en privé dans cette élection"
```

---

### 4️⃣ Consulter les résultats (après finalisation)

```
1. Page "Résultats"
2. Voir les votes standard + ElGamal combinés
```

---

## Ajouter des Co-Organisateurs

### Scénario : Déléguer la gestion à plusieurs personnes

```
1. Page de détail de l'élection
2. Section "👥 Organisateurs de l'élection"
3. Clic "➕ Ajouter un co-organisateur"
4. Entrer l'adresse (erd1...)
5. Sélectionner les permissions :
   - 🔐 Configurer le chiffrement
   - 🔓 Déchiffrer les votes
   - 👥 Gérer les co-organisateurs
6. Clic "Ajouter le co-organisateur"
```

**⚠️ IMPORTANT** : Si vous accordez la permission "Déchiffrer les votes", vous devez **partager votre secret** avec le co-organisateur via un canal sécurisé.

---

## Checklist Sécurité

Avant de lancer votre première élection :

- [ ] ✅ Secret personnel sauvegardé dans un gestionnaire de mots de passe
- [ ] ✅ Copie de backup du secret (papier ou fichier chiffré)
- [ ] ✅ Co-organisateurs ajoutés avec permissions appropriées
- [ ] ✅ Secret partagé avec co-organisateurs (si permission "Déchiffrer")
- [ ] ✅ Ordinateur sécurisé (antivirus, pas de malware)
- [ ] ✅ Connexion réseau sécurisée (pas de Wi-Fi public)

---

## Dépannage Rapide

### ❌ "Impossible de déchiffrer les votes"

**Causes possibles** :
- Secret perdu ou incorrect
- Secret non importé dans le navigateur
- Élection non clôturée

**Solution** :
1. Vérifier que l'élection est en statut "Closed"
2. Vérifier que le secret est bien chargé dans le navigateur
3. Si secret perdu, demander à un co-organisateur de déchiffrer

---

### ❌ "Vous avez déjà voté"

**Cause** : Vous avez déjà voté dans cette élection (un seul vote par wallet).

**Solution** : Impossible de changer votre vote. Utilisez un autre wallet si nécessaire.

---

### ❌ "Clé publique ElGamal manquante"

**Cause** : Le chiffrement ElGamal n'a pas été configuré.

**Solution** :
1. Page de détail de l'élection
2. Clic "Configurer ElGamal"
3. Sauvegarder le secret
4. Confirmer la transaction

---

### ❌ "Transaction failed"

**Causes possibles** :
- Gas insuffisant
- Smart contract non déployé
- Réseau MultiversX congestionné

**Solution** :
1. Vérifier votre solde EGLD
2. Réessayer dans quelques secondes
3. Augmenter le gas limit dans votre wallet

---

## Exemples d'Utilisation

### Exemple 1 : Élection de délégués de classe (50 étudiants)

```
✅ Option 1 ElGamal recommandée
📊 Résultats attendus : 5 minutes après la clôture
💰 Coût total : ~0.35 EGLD (50 votes × ~0.007 EGLD)
```

---

### Exemple 2 : Référendum d'association (500 membres)

```
✅ Option 1 ElGamal recommandée
📊 Résultats attendus : 15 minutes après la clôture
💰 Coût total : ~3.5 EGLD (500 votes × ~0.007 EGLD)
👥 Recommandation : 3 co-organisateurs pour la redondance
```

---

### Exemple 3 : Élection syndicale (5000 employés)

```
⚠️ Option 2 ElGamal + zk-SNARK recommandée (vérification maximale)
📊 Résultats attendus : 2 heures après la clôture
💰 Coût total : ~35 EGLD (5000 votes × ~0.007 EGLD)
👥 Recommandation : 5 co-organisateurs + Shamir Secret Sharing
```

---

## Ressources

- 📖 **Guide complet** : `docs/03-technical/CRYPTOGRAPHIE/Option-1-ElGamal/GUIDE-UTILISATEUR.md`
- 🔧 **Guide technique** : `docs/03-technical/CRYPTOGRAPHIE/Option-1-ElGamal/README-CHIFFREMENT-VOTES.md`
- 💬 **Support** : support@democratix.io
- 🐛 **Signaler un bug** : github.com/your-org/democratix/issues

---

**Temps total** : ~10 minutes pour votre première élection ! 🚀
