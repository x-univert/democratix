# Guide Utilisateur - Option 1 : Vote Privé avec Chiffrement ElGamal

## Table des matières

1. [Introduction](#introduction)
2. [Guide Organisateur](#guide-organisateur)
3. [Guide Électeur](#guide-électeur)
4. [FAQ ElGamal](#faq-elgamal)

---

## Introduction

L'Option 1 de DEMOCRATIX permet aux organisateurs de proposer un **vote privé** en utilisant le chiffrement **ElGamal**. Cette option garantit que :

- ✅ Les votes sont **chiffrés** avant d'être envoyés sur la blockchain
- ✅ L'**anonymat** des électeurs est préservé
- ✅ Les résultats sont **vérifiables** et **transparents**
- ✅ Plusieurs **co-organisateurs** peuvent gérer l'élection

---

## Guide Organisateur

### 1. Créer une élection avec vote privé

#### Étape 1 : Créer l'élection
1. Accédez à la page **"Créer une élection"**
2. Remplissez les informations de base (titre, description, candidats)
3. Cochez l'option **"Activer le vote privé (ElGamal)"**
4. Créez l'élection

#### Étape 2 : Configurer le chiffrement ElGamal
Après la création de l'élection, vous verrez un bouton **"Configurer ElGamal"** :

1. Cliquez sur **"Configurer ElGamal"**
2. Le système génère automatiquement :
   - Une **clé publique** (pour chiffrer les votes)
   - Une **clé privée secrète** (pour déchiffrer les votes)
3. **⚠️ IMPORTANT** : Sauvegardez votre **secret personnel** en toute sécurité
   - Ce secret est stocké localement dans votre navigateur
   - Vous en aurez besoin pour déchiffrer les votes
   - Si vous perdez ce secret, vous ne pourrez plus déchiffrer les votes
4. Confirmez la transaction sur la blockchain

**Résultat** : La clé publique est stockée sur la blockchain, permettant aux électeurs de chiffrer leurs votes.

---

### 2. Ajouter des co-organisateurs

Vous pouvez déléguer certaines permissions à d'autres organisateurs.

#### Étape 1 : Accéder au panneau des organisateurs
1. Ouvrez la page de détail de votre élection
2. Descendez jusqu'à la section **"👥 Organisateurs de l'élection"**

#### Étape 2 : Ajouter un co-organisateur
1. Cliquez sur **"➕ Ajouter un co-organisateur"**
2. Entrez l'**adresse MultiversX** du co-organisateur (erd1...)
3. Sélectionnez les **permissions** à accorder :
   - **🔐 Configurer le chiffrement** : Permet de générer et stocker la clé publique ElGamal
   - **🔓 Déchiffrer les votes** : Permet de déchiffrer les votes après la clôture
   - **👥 Gérer les co-organisateurs** : Permet d'ajouter/retirer d'autres co-organisateurs
4. Cliquez sur **"Ajouter le co-organisateur"**

#### Étape 3 : Partager le secret de déchiffrement (si nécessaire)
Si vous accordez la permission **"Déchiffrer les votes"** à un co-organisateur :

1. **⚠️ IMPORTANT** : Vous devez **partager votre secret personnel** avec ce co-organisateur via un canal sécurisé (Signal, ProtonMail, rencontre physique, etc.)
2. Le co-organisateur devra **importer ce secret** dans son navigateur pour pouvoir déchiffrer les votes

**💡 Conseil de sécurité** : Utilisez un système de partage de secret comme **Shamir Secret Sharing** pour diviser le secret entre plusieurs co-organisateurs.

---

### 3. Activer l'élection

Une fois le chiffrement configuré :

1. Cliquez sur **"Activer l'élection"**
2. Confirmez la transaction
3. L'élection passe en statut **"Active"**
4. Les électeurs peuvent maintenant voter

---

### 4. Déchiffrer les votes

Après la clôture de l'élection :

#### Étape 1 : Vérifier que l'élection est clôturée
- L'élection doit être en statut **"Closed"**

#### Étape 2 : Lancer le déchiffrement
1. Sur la page de détail de l'élection, cliquez sur **"Déchiffrer les votes ElGamal"**
2. Le système charge automatiquement votre **secret personnel** depuis le navigateur
3. Le déchiffrement se fait **localement** dans votre navigateur
4. Les votes déchiffrés sont ensuite **soumis à la blockchain**

#### Étape 3 : Vérifier les résultats
1. Accédez à la page **"Résultats"**
2. Vous verrez :
   - **Votes standard** (votes publics)
   - **Votes ElGamal** (votes privés déchiffrés)
   - **Total combiné**

---

### 5. Finaliser l'élection

Une fois les votes déchiffrés :

1. Cliquez sur **"Finaliser l'élection"**
2. Les résultats deviennent **définitifs** et **immuables**
3. L'élection passe en statut **"Finalized"**

---

## Guide Électeur

### 1. Voter avec ElGamal (vote privé)

#### Étape 1 : Accéder à l'élection
1. Parcourez la liste des élections actives
2. Cliquez sur une élection avec le badge **"🔐 VOTE PRIVÉ"**

#### Étape 2 : Choisir votre candidat
1. Sur la page de vote, sélectionnez votre candidat
2. Cliquez sur **"🔐 Voter en privé (ElGamal)"**

#### Étape 3 : Confirmer le vote
1. Une modale s'affiche avec :
   - Votre choix de candidat
   - Une explication du chiffrement ElGamal
2. Cliquez sur **"Confirmer le vote privé"**
3. Le système :
   - Chiffre votre vote **localement** dans votre navigateur
   - Envoie le vote chiffré sur la blockchain
4. Confirmez la transaction dans votre wallet MultiversX

**Résultat** : Votre vote est stocké **chiffré** sur la blockchain. Personne ne peut savoir pour qui vous avez voté avant le déchiffrement.

---

### 2. Vérifier que votre vote a été pris en compte

#### Option 1 : Vérifier sur la blockchain
1. Accédez à l'explorateur MultiversX (explorer.multiversx.com)
2. Recherchez la transaction de votre vote
3. Vous verrez les **valeurs chiffrées** (C1 et C2) mais pas votre choix

#### Option 2 : Vérifier dans l'interface
1. Sur la page de détail de l'élection, vous verrez une notification :
   - **"✅ Vous avez déjà voté en privé dans cette élection"**

---

### 3. Que se passe-t-il après le vote ?

1. **Pendant l'élection** :
   - Votre vote reste **chiffré** sur la blockchain
   - Personne ne peut voir votre choix
   - Même les organisateurs ne peuvent pas déchiffrer les votes tant que l'élection est active

2. **Après la clôture** :
   - Les organisateurs **déchiffrent** les votes
   - Les votes déchiffrés sont **agrégés** avec les votes publics
   - Les résultats deviennent visibles sur la page **"Résultats"**

3. **Après la finalisation** :
   - Les résultats sont **définitifs** et **immuables**
   - Vous pouvez vérifier que votre vote a bien été compté dans le total

---

## FAQ ElGamal

### Qu'est-ce que le chiffrement ElGamal ?

**ElGamal** est un algorithme de chiffrement asymétrique basé sur le problème du logarithme discret. Il permet de :

- Chiffrer un message avec une **clé publique**
- Déchiffrer le message avec une **clé privée** correspondante
- Garantir que personne ne peut lire le message sans la clé privée

Dans DEMOCRATIX, chaque vote est chiffré avec la clé publique de l'élection, et seuls les organisateurs possédant le secret peuvent déchiffrer les votes.

---

### Pourquoi utiliser le vote chiffré ?

Le vote chiffré (Option 1) offre plusieurs avantages :

✅ **Anonymat renforcé** : Votre vote est illisible sur la blockchain

✅ **Protection contre la coercition** : Personne ne peut vérifier pour qui vous avez voté (même avec votre wallet)

✅ **Transparence** : Les votes chiffrés sont publics sur la blockchain, mais leur contenu reste secret

✅ **Vérifiabilité** : Après déchiffrement, tout le monde peut vérifier que les résultats correspondent aux votes stockés

---

### Mon vote est-il vraiment anonyme ?

**OUI**, avec quelques précautions :

✅ **Anonymat cryptographique** :
- Votre vote est chiffré avant d'être envoyé sur la blockchain
- Le chiffrement ElGamal ne permet pas de retrouver le vote original sans la clé privée
- Même en analysant la blockchain, impossible de savoir pour qui vous avez voté

⚠️ **Mais attention** :
- Votre **adresse wallet** est visible sur la blockchain (on sait QUE vous avez voté)
- Si vous utilisez toujours le même wallet, on peut lier vos votes entre différentes élections
- Pour un anonymat maximal, utilisez un **wallet différent** pour chaque élection

---

### Quelle est la différence entre Option 1 et Option 2 ?

| Caractéristique | Option 1 : ElGamal | Option 2 : ElGamal + zk-SNARK |
|-----------------|-------------------|-------------------------------|
| **Chiffrement** | ✅ ElGamal | ✅ ElGamal |
| **Anonymat** | ✅ Élevé | ✅ Élevé |
| **Preuve mathématique** | ❌ Non | ✅ Oui (zk-SNARK) |
| **Vérification on-chain** | ❌ Non | ✅ Oui |
| **Coût en gas** | 💰 Bas | 💰💰 Moyen |
| **Complexité** | 🟢 Simple | 🟡 Avancée |

**Option 1** : Vote chiffré simple et efficace

**Option 2** : Vote chiffré + preuve mathématique que le vote est valide (sans révéler le choix)

**💡 Conseil** : Utilisez l'Option 1 pour la plupart des élections. L'Option 2 est réservée aux élections nécessitant une vérification cryptographique maximale.

---

### Comment sont comptés les votes s'ils sont chiffrés ?

Le processus est le suivant :

1. **Pendant l'élection** :
   - Les votes sont stockés **chiffrés** sur la blockchain
   - Chaque vote est représenté par deux valeurs : **C1** et **C2**

2. **Après la clôture** :
   - Les organisateurs utilisent leur **secret** pour déchiffrer les votes
   - Le déchiffrement se fait **localement** dans le navigateur de l'organisateur
   - Les votes déchiffrés sont soumis à la blockchain

3. **Agrégation** :
   - Les votes standard (publics) et les votes ElGamal (déchiffrés) sont **combinés**
   - Le smart contract additionne tous les votes
   - Les résultats finaux sont affichés sur la page **"Résultats"**

---

### Que se passe-t-il si l'organisateur perd son secret ?

**⚠️ CRITIQUE** : Si l'organisateur perd son secret personnel :

❌ **Impossible de déchiffrer les votes** : Les votes restent chiffrés pour toujours

❌ **Perte des résultats** : L'élection ne peut pas être finalisée

**💡 Solutions de secours** :

1. **Sauvegardes multiples** :
   - Sauvegardez votre secret dans un gestionnaire de mots de passe
   - Gardez une copie papier dans un coffre-fort
   - Utilisez un système de backup chiffré

2. **Co-organisateurs** :
   - Ajoutez des co-organisateurs avec la permission "Déchiffrer les votes"
   - Partagez votre secret avec eux via un canal sécurisé
   - En cas de perte, un co-organisateur peut déchiffrer les votes

3. **Shamir Secret Sharing** :
   - Divisez votre secret en plusieurs parts (ex: 3 parts)
   - Distribuez les parts à plusieurs co-organisateurs
   - Pour déchiffrer, il faut au moins 2 parts sur 3
   - Même si 1 co-organisateur perd sa part, le déchiffrement reste possible

---

### Puis-je changer mon vote ?

**NON**, pour préserver l'intégrité de l'élection :

❌ Une fois votre vote soumis, il est **immuable** sur la blockchain

❌ Vous ne pouvez pas voter une seconde fois (le smart contract le détecte)

**💡 Conseil** : Réfléchissez bien avant de voter !

---

### Comment vérifier que les votes n'ont pas été manipulés ?

La blockchain MultiversX garantit l'**immuabilité** des données :

✅ **Traçabilité complète** :
1. Accédez à l'explorateur MultiversX (explorer.multiversx.com)
2. Recherchez le smart contract de l'élection
3. Consultez tous les événements (logs) de l'élection

✅ **Vérification des votes chiffrés** :
- Tous les votes chiffrés sont visibles sur la blockchain
- Vous pouvez compter le nombre de votes
- Après déchiffrement, vérifiez que le nombre de votes déchiffrés correspond

✅ **Vérification des résultats** :
- Comparez les résultats affichés avec les données du smart contract
- Le total des votes doit correspondre au nombre de transactions de vote

---

### Puis-je utiliser ElGamal sur mobile ?

**OUI**, l'interface DEMOCRATIX est compatible mobile :

✅ Vous pouvez voter depuis votre smartphone

✅ Utilisez l'application **xPortal** (wallet MultiversX mobile)

✅ Le chiffrement ElGamal fonctionne dans le navigateur mobile

⚠️ **Pour les organisateurs** :
- La gestion du secret est plus délicate sur mobile
- Préférez un ordinateur pour configurer le chiffrement et déchiffrer les votes

---

### L'Option 1 est-elle sécurisée ?

**OUI**, l'Option 1 utilise des standards cryptographiques éprouvés :

✅ **Bibliothèque** : `@noble/curves` (audit de sécurité par Trail of Bits)

✅ **Courbe elliptique** : `secp256k1` (utilisée par Bitcoin et Ethereum)

✅ **Randomisation** : Chaque vote utilise un facteur aléatoire unique

✅ **Clé privée** : Stockée localement (jamais exposée sur le réseau)

⚠️ **Mais attention** :
- La sécurité dépend de la **protection du secret** par l'organisateur
- Utilisez un ordinateur sécurisé (antivirus, pare-feu, pas de malware)
- Ne partagez jamais votre secret via un canal non sécurisé

---

### Combien coûte un vote ElGamal ?

Les frais sont légèrement plus élevés qu'un vote standard :

| Type de vote | Coût estimé (gas) |
|--------------|-------------------|
| **Vote standard** | ~5 000 000 gas |
| **Vote ElGamal** | ~7 000 000 gas |

**Raison** : Le vote ElGamal stocke deux valeurs chiffrées (C1 et C2) au lieu d'un simple ID de candidat.

**💡 Note** : Le coût reste très faible (quelques centimes d'EGLD) grâce à l'efficacité de MultiversX.

---

### Puis-je faire un audit de l'élection ?

**OUI**, tout est open-source et vérifiable :

✅ **Code source** :
- Frontend : `github.com/your-org/democratix/frontend`
- Backend : `github.com/your-org/democratix/backend`
- Smart contract : `github.com/your-org/democratix/contracts/voting`

✅ **Smart contract** :
- Le code du smart contract est **vérifiable** sur l'explorateur MultiversX
- Vous pouvez auditer la logique de vote et de déchiffrement

✅ **Blockchain** :
- Toutes les transactions sont publiques
- Vous pouvez retracer chaque vote (chiffré) et chaque déchiffrement

---

## Support

Pour toute question ou problème :

- 📧 Email : support@democratix.io
- 💬 Discord : discord.gg/democratix
- 📖 Documentation complète : docs.democratix.io
- 🐛 Signaler un bug : github.com/your-org/democratix/issues

---

**Dernière mise à jour** : Janvier 2025
**Version** : 1.0.0 (Option 1 ElGamal)
