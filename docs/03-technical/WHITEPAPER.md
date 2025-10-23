# DEMOCRATIX - Whitepaper
## Plateforme de Vote Décentralisée sur MultiversX

**Version:** 1.0
**Date:** Janvier 2025
**Statut:** Draft

---

## Table des Matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Introduction](#introduction)
3. [Problématique](#problématique)
4. [Solution Technique](#solution-technique)
5. [Architecture](#architecture)
6. [Sécurité et Vie Privée](#sécurité-et-vie-privée)
7. [Cas d'Usage](#cas-dusage)
8. [Tokenomics](#tokenomics)
9. [Roadmap](#roadmap)
10. [Conclusion](#conclusion)

---

## 1. Résumé Exécutif

DEMOCRATIX est une plateforme de vote décentralisée construite sur la blockchain MultiversX, conçue pour révolutionner les processus démocratiques en offrant transparence, sécurité et vérifiabilité tout en préservant l'anonymat des votants.

### Objectifs Principaux
- **Transparence totale** : Tous les votes sont vérifiables sur la blockchain
- **Anonymat garanti** : Impossible de lier un vote à une identité
- **Sécurité maximale** : Protection contre la fraude et la manipulation
- **Accessibilité** : Interface simple utilisable par tous
- **Conformité légale** : Respect du RGPD et des réglementations électorales

---

## 2. Introduction

### 2.1 Contexte

Les systèmes de vote traditionnels font face à plusieurs défis :
- Coûts élevés d'organisation
- Risques de fraude et manipulation
- Manque de transparence
- Accessibilité limitée (déplacements nécessaires)
- Dépouillement lent et coûteux
- Confiance basée sur les institutions centralisées

### 2.2 Pourquoi MultiversX ?

MultiversX offre des avantages uniques pour le vote électronique :
- **Rapidité** : Finalité des transactions en ~6 secondes
- **Scalabilité** : Jusqu'à 100,000 TPS grâce au sharding adaptatif
- **Coût minimal** : Frais de transaction négligeables (~$0.001)
- **Sécurité** : Mécanisme de consensus Secure Proof of Stake
- **Efficacité énergétique** : Impact carbone réduit

---

## 3. Problématique

### 3.1 Défis du Vote Électronique

**Triangle de l'impossibilité du vote électronique** :
1. Vérifiabilité individuelle (je peux vérifier mon vote)
2. Vérifiabilité universelle (tous peuvent vérifier le résultat)
3. Confidentialité du vote (mon choix reste secret)

**Problèmes supplémentaires** :
- Vote sous contrainte (coercition)
- Achat de votes
- Attaques par déni de service
- Usurpation d'identité
- Vote multiple

### 3.2 Notre Approche

DEMOCRATIX résout ces défis grâce à :
- **zk-SNARKs** : Preuves à divulgation nulle de connaissance
- **Commit-Reveal Scheme** : Séparation engagement/révélation
- **Time-locked Encryption** : Chiffrement temporel
- **Decentralized Identity** : Identité décentralisée avec credentials vérifiables

---

## 4. Solution Technique

### 4.1 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                      │
│  (Interface Web/Mobile - Multi-langues - Accessible)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  COUCHE AUTHENTIFICATION                     │
│  (FranceConnect / eID / OAuth2 / DID)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   COUCHE APPLICATION                         │
│  (API REST - GraphQL - WebSocket)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  COUCHE SMART CONTRACTS                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Registre    │  │  Vote        │  │  Résultats   │     │
│  │  Électeurs   │  │  Contract    │  │  Contract    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  BLOCKCHAIN MULTIVERSX                       │
│  (Sharding - SPoS - Adaptive State Sharding)                │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Composants Principaux

#### 4.2.1 Smart Contract d'Enregistrement
```rust
// Pseudo-code
struct Voter {
    credential_hash: Hash,      // Hash du credential
    is_registered: bool,
    has_voted: bool,
    voting_token: BlindedToken  // Token aveugle
}

fn register_voter(credential_proof: ZKProof) {
    // Vérifie la preuve sans connaître l'identité
    verify_zk_proof(credential_proof);
    // Génère un token de vote aveugle
    issue_blinded_voting_token();
}
```

#### 4.2.2 Smart Contract de Vote
```rust
struct Election {
    id: u64,
    title: String,
    description_ipfs: Hash,
    start_time: u64,
    end_time: u64,
    candidates: Vec<Candidate>,
    encrypted_votes: Vec<EncryptedVote>,
    status: ElectionStatus
}

fn cast_vote(voting_token: BlindedToken, encrypted_vote: EncryptedVote) {
    // Vérifie le token sans connaître le votant
    verify_token(voting_token);
    // Invalide le token
    revoke_token(voting_token);
    // Stocke le vote chiffré
    store_encrypted_vote(encrypted_vote);
}
```

#### 4.2.3 Smart Contract de Dépouillement
```rust
fn reveal_results(decryption_keys: Vec<DecryptionKey>) {
    require!(multi_sig_verified(decryption_keys));
    require!(election.status == ElectionStatus::Closed);

    // Déchiffrement homomorphique des votes
    let results = homomorphic_tally(encrypted_votes);

    // Publication des résultats
    publish_results(results);
}
```

### 4.3 Flux de Vote

```
PHASE 1: ENREGISTREMENT (J-30 à J-7)
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Citoyen  │─────▶│ Vérif ID │─────▶│ Token    │
│          │      │ (off-ch) │      │ Voting   │
└──────────┘      └──────────┘      └──────────┘

PHASE 2: VOTE (Jour J - 8h à 20h)
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Vote     │─────▶│ Chiffre  │─────▶│ Blockchain│
│ Citoyen  │      │ (client) │      │ MultiversX│
└──────────┘      └──────────┘      └──────────┘

PHASE 3: DÉPOUILLEMENT (Jour J - 20h01)
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Multi-   │─────▶│ Déchiffr.│─────▶│ Résultats│
│ Signature│      │ Votes    │      │ Publics  │
└──────────┘      └──────────┘      └──────────┘
```

---

## 5. Architecture

### 5.1 Couches du Système

#### Couche 1 : Identité (Off-Chain)
- Intégration FranceConnect
- Vérification eID européenne
- Génération de credentials vérifiables W3C
- Stockage sécurisé (HSM pour les autorités)

#### Couche 2 : Anonymisation (Mix-Networks)
- Réseau de mixage pour déconnecter identité/vote
- Protocol de blind signature (RSA ou Chaum)
- Garantie de k-anonymat

#### Couche 3 : Blockchain (On-Chain)
- Smart contracts MultiversX
- Stockage immuable des votes chiffrés
- Logs d'événements vérifiables

#### Couche 4 : Stockage Décentralisé
- IPFS pour métadonnées élections
- Arweave pour archivage permanent
- Redondance géographique

### 5.2 Technologies Utilisées

| Composant | Technologie |
|-----------|-------------|
| Blockchain | MultiversX (EGLD) |
| Smart Contracts | Rust (MultiversX VM) |
| Cryptographie | zk-SNARKs (Groth16), ElGamal, RSA-PSS |
| Stockage | IPFS, Arweave |
| Backend | Node.js / Rust |
| Frontend | React / Vue.js |
| Base de données | PostgreSQL (off-chain data) |
| Authentification | OAuth2, OpenID Connect, FranceConnect |

---

## 6. Sécurité et Vie Privée

### 6.1 Principes de Sécurité

#### Privacy by Design
- Minimisation des données
- Pseudonymisation systématique
- Chiffrement de bout en bout
- Séparation des rôles

#### Security by Design
- Audits de sécurité réguliers
- Pentests avant chaque élection
- Bug bounty program
- Monitoring 24/7

### 6.2 Cryptographie

#### zk-SNARKs pour l'Éligibilité
```
Prouve : "Je suis un citoyen éligible"
Sans révéler : Qui je suis
```

#### Chiffrement Homomorphique pour le Comptage
```
Additionne les votes chiffrés directement
Résultat déchiffrable uniquement avec multi-sig
```

#### Blind Signatures pour l'Anonymat
```
Autorité signe un token sans voir son contenu
Token utilisable une seule fois pour voter
```

### 6.3 Protection contre les Attaques

| Attaque | Contre-mesure |
|---------|---------------|
| Vote multiple | Token unique invalidé après usage |
| Achat de votes | Impossibilité de prouver son vote |
| Coercition | Re-vote possible (seul le dernier compte) |
| DDoS | Cloudflare + Rate limiting + Blockchain résilience |
| Manipulation résultats | Immuabilité blockchain + Vérification publique |
| Compromission serveur | Logique on-chain, pas de serveur critique |

### 6.4 Conformité RGPD

- **Droit d'accès** : Via credential, pas de données personnelles on-chain
- **Droit à l'oubli** : Données off-chain supprimables, hash on-chain non-réversible
- **Portabilité** : Export des métadonnées
- **Privacy by Default** : Anonymat par conception
- **DPO** : Désignation d'un DPO pour le projet
- **DPIA** : Analyse d'impact réalisée

---

## 7. Cas d'Usage

### 7.1 Élections Nationales

**Présidentielles, Législatives**
- Millions de votants simultanés
- Haute sécurité requise
- Vérification juridique des résultats
- Intégration listes électorales INSEE

**Avantages** :
- Réduction coûts (bureaux de vote, personnel)
- Résultats en quelques minutes
- Accessibilité (expatriés, mobilité réduite)
- Audit trail complet

### 7.2 Référendums

- Questions binaires ou à choix multiples
- Transparence totale du processus
- Mobilisation citoyenne facilitée
- Coût marginal par référendum

### 7.3 Élections Locales

**Municipales, Départementales, Régionales**
- Adaptation aux petites collectivités
- Formation du personnel électoral
- Support technique dédié

### 7.4 Votes Consultatifs

- Conseils de quartier
- Budgets participatifs
- Consultations citoyennes
- Assemblées générales (associations, copropriétés)

### 7.5 Secteur Privé

- Votes en Assemblée Générale (SA, SAS)
- Élections professionnelles (CSE)
- Votes d'actionnaires
- Gouvernance DAO

---

## 8. Tokenomics

### 8.1 Modèle Économique

**Option 1 : Sans Token Natif (Recommandé pour gouvernements)**
- Paiement en EGLD (natif MultiversX)
- Coût par vote : ~0.001-0.01 EGLD
- Budget prévisible pour les organisateurs

**Option 2 : Avec Token DEMO**
- Token utilitaire pour gouvernance du protocole
- Staking pour les validateurs d'identité
- Récompenses pour les auditeurs (bug bounty)

### 8.2 Coûts Estimés

| Type d'Élection | Électeurs | Coût Blockchain | Coût Total (infra incluse) |
|-----------------|-----------|-----------------|----------------------------|
| Municipale | 1,000 | ~1 EGLD (~40€) | ~500€ |
| Départementale | 50,000 | ~50 EGLD (~2,000€) | ~10,000€ |
| Régionale | 500,000 | ~500 EGLD (~20,000€) | ~50,000€ |
| Nationale | 50,000,000 | ~50,000 EGLD (~2M€) | ~5M€ |

**Comparaison** : Une élection présidentielle française coûte environ **200M€** en mode traditionnel.

### 8.3 Financement du Projet

**Phase 1 : Développement (18 mois)**
- Grants MultiversX Foundation
- Subventions publiques (Programme Horizon Europe)
- Partenariats académiques

**Phase 2 : Déploiement**
- Licences pour collectivités
- SaaS pour PME/Associations
- Support et maintenance

---

## 9. Roadmap

### Phase 1 : Fondations (Q1-Q2 2025)
- ✅ Whitepaper et spécifications
- 🔄 Développement smart contracts de base
- 🔄 POC avec 100 utilisateurs
- 🔄 Audit de sécurité initial

### Phase 2 : MVP (Q3-Q4 2025)
- Interface utilisateur v1
- Intégration FranceConnect
- Tests avec collectivités pilotes
- Certification ANSSI Niveau 1

### Phase 3 : Beta Publique (Q1-Q2 2026)
- Élections test municipales (3-5 villes)
- zk-SNARKs implémentés
- Interface mobile
- Support multilingue

### Phase 4 : Production (Q3 2026+)
- Déploiement national
- API publique
- Conformité électorale complète
- Certification ANSSI Niveau 2

---

## 10. Gouvernance du Projet

### 10.1 Open Source

- Licence : **AGPL-3.0** (copyleft pour protéger l'intérêt public)
- Repository : GitHub public
- Contributions communautaires bienvenues
- Transparence totale du code

### 10.2 Structure

- **Fondation DEMOCRATIX** (à créer)
- Conseil scientifique (cryptographes, juristes)
- Comité éthique
- Advisory board (élus, société civile)

### 10.3 Financement Pérenne

- Contribution des utilisateurs (gouvernements, entreprises)
- Fonds de dotation
- Partenariats académiques
- Indépendance vis-à-vis des fournisseurs

---

## 11. Aspects Légaux

### 11.1 Cadre Juridique Français

**Code Électoral**
- Adaptation nécessaire (articles L. 57-1, L. 66)
- Expérimentations possibles (article 37-1 Constitution)
- Validation Conseil Constitutionnel

**Autorités Compétentes**
- CNIL : Protection des données
- ANSSI : Sécurité des SI
- Conseil d'État : Légalité des procédures
- Commission Européenne : Réglementation eIDAS

### 11.2 Cadre Européen

- **Règlement eIDAS** : Identité électronique
- **RGPD** : Protection des données
- **NIS 2** : Cybersécurité des infrastructures critiques
- **Digital Services Act** : Responsabilité des plateformes

---

## 12. Risques et Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Faille cryptographique | Faible | Critique | Audits multiples, bug bounty |
| Attaque 51% MultiversX | Très faible | Critique | Nature décentralisée du réseau |
| Bugs smart contracts | Moyenne | Élevé | Audits formels, tests exhaustifs |
| Adoption faible | Moyenne | Élevé | Pilotes, communication, UX simple |
| Résistance politique | Élevée | Élevé | Lobbying, preuves de concept |
| Fracture numérique | Élevée | Moyen | Formation, points d'accès physiques |

---

## 13. Conclusion

DEMOCRATIX représente une opportunité unique de moderniser la démocratie en combinant :
- **Innovation technologique** (blockchain MultiversX)
- **Rigueur cryptographique** (zk-SNARKs, chiffrement homomorphique)
- **Pragmatisme réglementaire** (conformité RGPD, Code électoral)
- **Ambition démocratique** (accessibilité, transparence, confiance)

### Prochaines Étapes

1. **Validation communautaire** : Revue par pairs de ce whitepaper
2. **Partenariats académiques** : Inria, CNRS, universités
3. **Pilotes** : 3-5 collectivités volontaires
4. **Financement** : Dépôt de dossiers (ANR, Europe, MultiversX grants)

### Appel à Contribution

Ce projet est **open source** et **d'intérêt public**. Nous cherchons :
- Développeurs Rust/Blockchain
- Cryptographes
- Juristes spécialisés
- Designers UX
- Collectivités pilotes
- Financeurs

---

**Contact** : democratix@protonmail.com
**GitHub** : https://github.com/[votre-org]/democratix
**Site Web** : https://democratix.vote (à venir)

---

*"La technologie au service de la démocratie, pas l'inverse."*
