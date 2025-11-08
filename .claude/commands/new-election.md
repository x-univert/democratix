---
description: Guide pour créer une nouvelle élection de test
---

Guide rapide pour créer une élection de test avec DEMOCRATIX:

## Étapes

### 1. Accéder à la page de création
Ouvrir: https://democratix-frontend.vercel.app/create

### 2. Informations de base

**Titre**: $1 (ex: "Élection Test Option 2")

**Description IPFS**: Créer un JSON avec:
```json
{
  "title": "Élection Test",
  "description": "Test du système de vote Option 2 avec zk-SNARK",
  "organization": "DEMOCRATIX Team"
}
```

### 3. Configuration

- **Inscription requise**: Non (pour tests rapides)
- **Type de chiffrement**:
  - 0 = Standard (public)
  - 1 = ElGamal (chiffré)
  - 2 = ElGamal + zk-SNARK (max sécurité)

### 4. Candidats

Ajouter au moins 2 candidats:

**Candidat 1 - Alice**
```json
{
  "name": "Alice Dupont",
  "biography": "Candidate progressiste avec 10 ans d'expérience",
  "metadata": { "party": "Parti A" },
  "links": {
    "website": "https://alice.example.com"
  }
}
```

**Candidat 2 - Bob**
```json
{
  "name": "Bob Martin",
  "biography": "Candidat conservateur, ancien maire",
  "metadata": { "party": "Parti B" },
  "links": {
    "twitter": "@bobmartin"
  }
}
```

### 5. Dates

- **Début**: Maintenant (ou date future)
- **Fin**: +1 heure (pour tests rapides)

### 6. Clé ElGamal (Options 1 & 2)

Si Option 1 ou 2:
- Générer une paire de clés ElGamal
- **Sauvegarder la clé privée** (pour déchiffrement)
- Uploader la clé publique

### 7. Vérification

Après création:
- Noter l'ID de l'élection
- Vérifier que l'élection apparaît dans la liste
- Tester un vote selon l'option choisie

## Commandes Suivantes

Après création:
- `/test-vote <encryption_type>` - Tester le vote
- Voter pour différents candidats
- Finaliser et déchiffrer (Options 1 & 2)
