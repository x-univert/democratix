# DEMOCRATIX - Roadmap Détaillée

**Dernière mise à jour** : Janvier 2025
**Version** : 1.0

---

## Vue d'Ensemble

```
2025 Q1-Q2      2025 Q3-Q4      2026 Q1-Q2      2026 Q3+
    │               │               │               │
    ▼               ▼               ▼               ▼
FONDATIONS        MVP          BETA PUBLIC    PRODUCTION
```

---

## Phase 1 : FONDATIONS (Q1-Q2 2025)

### Objectif
Poser les bases techniques, juridiques et organisationnelles du projet.

### Jalons Techniques

#### Mois 1-2 : Architecture & Spécifications
- [x] Rédaction Whitepaper
- [x] Rédaction Business Plan
- [ ] Spécifications techniques détaillées
- [ ] Architecture système complète
- [ ] Schéma de base de données
- [ ] API Specifications (OpenAPI/Swagger)
- [ ] Modèles cryptographiques formels

**Livrables** :
- Documentation technique complète (200+ pages)
- Diagrammes d'architecture (UML, C4)
- Threat model & security analysis

#### Mois 3-4 : Smart Contracts v0.1
- [ ] Configuration environnement MultiversX
- [ ] Smart contract d'enregistrement (Rust)
- [ ] Smart contract de vote (Rust)
- [ ] Smart contract de résultats (Rust)
- [ ] Tests unitaires (>90% coverage)
- [ ] Tests d'intégration

**Livrables** :
- 3 smart contracts fonctionnels
- Suite de tests complète
- Documentation code (Rustdoc)

#### Mois 5-6 : Infrastructure & POC
- [ ] Backend API (Node.js/Rust)
- [ ] Interface CLI pour tests
- [ ] Déploiement testnet MultiversX
- [ ] POC avec 100 utilisateurs internes
- [ ] Monitoring & logging (Prometheus, Grafana)

**Livrables** :
- API REST fonctionnelle
- POC validé avec métriques

### Jalons Juridiques & Organisationnels

#### Mois 1-3
- [ ] Constitution de l'association loi 1901
- [ ] Dépôt marque "DEMOCRATIX"
- [ ] Analyse juridique Code électoral
- [ ] Premier contact CNIL
- [ ] Premier contact ANSSI

#### Mois 4-6
- [ ] Rédaction CGU/CGV
- [ ] Privacy Policy (RGPD)
- [ ] DPIA (Data Protection Impact Assessment)
- [ ] Création conseil scientifique

### Jalons Financiers

- [ ] Grant MultiversX Foundation (cible : 50k€)
- [ ] Grant ANR/BPI France (cible : 200k€)
- [ ] Partenariats académiques (3 universités)
- [ ] Budget total Phase 1 : **300k€**

### Équipe Phase 1

- 2 développeurs blockchain (Rust)
- 1 développeur backend
- 1 cryptographe/chercheur
- 1 juriste spécialisé
- 1 chef de projet

---

## Phase 2 : MVP (Q3-Q4 2025)

### Objectif
Livrer un Minimum Viable Product utilisable en conditions réelles limitées.

### Jalons Techniques

#### Mois 7-8 : Interface Utilisateur
- [ ] Design system & maquettes (Figma)
- [ ] Frontend React/Vue.js
- [ ] Interface votant (responsive)
- [ ] Interface organisateur
- [ ] Interface vérificateur (audit)
- [ ] Accessibilité WCAG 2.1 AA

**Livrables** :
- Application web complète
- Design system documenté
- Tests accessibilité

#### Mois 9-10 : Authentification & Identité
- [ ] Intégration FranceConnect
- [ ] Intégration eIDAS (eID européennes)
- [ ] Module credentials vérifiables (W3C)
- [ ] Gestion des tokens de vote
- [ ] Système de blind signatures

**Livrables** :
- Module d'authentification complet
- Support 5+ méthodes d'authentification

#### Mois 11-12 : Tests & Audit
- [ ] Tests end-to-end (Cypress/Playwright)
- [ ] Tests de charge (JMeter) : 10k votes/h
- [ ] Audit de sécurité externe (cabinet spécialisé)
- [ ] Corrections failles identifiées
- [ ] Pentests

**Livrables** :
- Rapport d'audit sécurité
- Corrections apportées
- Certification de l'auditeur

### Jalons Pilotes

#### Mois 10-12 : Collectivités Pilotes
- [ ] Sélection 3-5 communes (5k-20k habitants)
- [ ] Convention de partenariat
- [ ] Formation personnel
- [ ] Vote consultatif test (budget participatif)
- [ ] Retours utilisateurs

**Cibles** :
- 3 communes en milieu rural
- 2 communes péri-urbaines
- Total : ~50k électeurs potentiels

### Jalons Réglementaires

- [ ] Dossier CNIL complet
- [ ] Dossier ANSSI certification niveau 1
- [ ] Homologation RGS (Référentiel Général de Sécurité)
- [ ] Validation juridique procédures

### Budget Phase 2

- Développement : 400k€
- Audits sécurité : 100k€
- Pilotes : 50k€
- Marketing & communication : 50k€
- **Total : 600k€**

### Équipe Phase 2

- 4 développeurs full-stack
- 2 DevOps/SRE
- 1 cryptographe
- 1 UX/UI designer
- 1 responsable partenariats
- 1 responsable juridique
- 1 chef de projet

---

## Phase 3 : BETA PUBLIQUE (Q1-Q2 2026)

### Objectif
Ouverture publique contrôlée, élections réelles non-critiques.

### Jalons Techniques

#### Mois 13-14 : Cryptographie Avancée
- [ ] Implémentation zk-SNARKs (Groth16 ou PLONK)
- [ ] Chiffrement homomorphique (ElGamal ou Paillier)
- [ ] Mix-networks pour anonymisation
- [ ] Audits cryptographiques formels

**Livrables** :
- Anonymat renforcé mathématiquement prouvé
- Publications académiques

#### Mois 15-16 : Mobile & Accessibilité
- [ ] Application mobile iOS (Swift)
- [ ] Application mobile Android (Kotlin)
- [ ] Support biométrie (Face ID, Touch ID)
- [ ] Interface seniors simplifiée
- [ ] Support langues régionales

**Livrables** :
- Apps sur App Store & Google Play
- Support 10+ langues

#### Mois 17-18 : Élections Réelles
- [ ] 10-15 élections municipales réelles
- [ ] Référendums locaux
- [ ] Budgets participatifs
- [ ] Total : 200k-500k votes enregistrés

**Métriques de Succès** :
- Taux de participation : +15% vs traditionnel
- Satisfaction utilisateurs : >80%
- Incidents de sécurité : 0
- Conformité légale : 100%

### Jalons Communautaires

- [ ] Open source release complète (GitHub)
- [ ] Documentation développeur exhaustive
- [ ] Bug bounty program (10k-100k€)
- [ ] Conférences académiques (2 publications)
- [ ] Hackathons (3 événements)

### Jalons Réglementaires

- [ ] Certification ANSSI niveau 2
- [ ] Qualification eIDAS
- [ ] Homologation Conseil d'État
- [ ] Validation Conseil Constitutionnel (si possible)

### Budget Phase 3

- Développement : 500k€
- Cryptographie : 200k€
- Élections pilotes : 150k€
- Bug bounty : 100k€
- Communication : 100k€
- **Total : 1,050k€**

### Équipe Phase 3

- 6 développeurs
- 2 cryptographes
- 3 DevOps/SRE
- 2 UX/UI designers
- 2 responsables partenariats
- 1 responsable juridique
- 1 community manager
- 1 directeur technique
- 1 directeur général

---

## Phase 4 : PRODUCTION (Q3 2026+)

### Objectif
Déploiement national, utilisation pour élections officielles.

### Jalons Techniques

#### Mois 19-24 : Scale & Robustesse
- [ ] Architecture multi-régions (EU)
- [ ] CDN global (Cloudflare)
- [ ] Capacité : 10M votes simultanés
- [ ] SLA 99.99%
- [ ] Disaster recovery < 1h
- [ ] Tests de charge extrêmes

**Livrables** :
- Infrastructure production critique
- Redondance géographique complète

#### Mois 19+ : Fonctionnalités Avancées
- [ ] Vote à distance pour expatriés
- [ ] Vote anticipé sécurisé
- [ ] Vote par procuration électronique
- [ ] Intégration listes électorales INSEE
- [ ] API publique pour observateurs
- [ ] Dashboard temps réel (anonymisé)

### Jalons Déploiement

#### Année 1 (2026)
- **Municipales partielles** : 50-100 communes
- **Référendums locaux** : 20+ consultations
- **Élections professionnelles** : 100+ entreprises
- **Associations** : 1000+ votes AG

#### Année 2 (2027)
- **Départementales** : 10+ départements
- **Régionales** : 2-3 régions pilotes
- **Législatives partielles** : 5-10 circonscriptions

#### Année 3 (2028)
- **Municipales générales** : 5000+ communes
- **Référendum national** : expérimentation

#### Année 4+ (2029+)
- **Présidentielles** : objectif ultime
- **Toutes élections** : généralisation

### Jalons Internationaux

- [ ] Adaptation Belgique, Suisse, Luxembourg
- [ ] Traduction 20+ langues
- [ ] Partenariats ONG (élections pays en développement)
- [ ] Certifications internationales (ISO 27001, SOC 2)

### Budget Phase 4 (Année 1)

- Infrastructure : 800k€/an
- Développement : 1,000k€/an
- Sécurité & audits : 300k€/an
- Support & formation : 200k€/an
- Marketing : 300k€/an
- **Total : 2,600k€/an**

**Revenus attendus** :
- Licences collectivités : 1,500k€
- Secteur privé : 800k€
- Subventions : 500k€
- **Total : 2,800k€** → **Équilibre atteint**

---

## Milestones Clés Résumés

| Date | Milestone | Description |
|------|-----------|-------------|
| **Mars 2025** | M1 : Specs complètes | Documentation technique finalisée |
| **Juin 2025** | M2 : POC 100 users | Validation concept technique |
| **Sept 2025** | M3 : MVP prêt | Interface + smart contracts v1 |
| **Déc 2025** | M4 : Premiers pilotes | 3-5 collectivités testent |
| **Mars 2026** | M5 : zk-SNARKs | Anonymat renforcé opérationnel |
| **Juin 2026** | M6 : Beta publique | 10-15 élections réelles |
| **Sept 2026** | M7 : Certification | ANSSI niveau 2 obtenue |
| **Déc 2026** | M8 : Scale | 1M votes capacité démontrée |
| **2027** | M9 : Départementales | Premières élections majeures |
| **2028** | M10 : Municipales | Déploiement large échelle |

---

## Facteurs de Succès

### Techniques
✅ Audits de sécurité réguliers
✅ Architecture scalable dès le début
✅ Open source pour la confiance
✅ Tests exhaustifs avant chaque élection

### Politiques
✅ Soutien élus locaux (maires innovants)
✅ Appui parlementaires (commission lois)
✅ Validation autorités (CNIL, ANSSI)
✅ Acceptation société civile

### Organisationnels
✅ Équipe pluridisciplinaire (tech + droit + science politique)
✅ Gouvernance transparente
✅ Communication proactive
✅ Formation des utilisateurs

---

## Risques & Plans B

### Risque : Refus certification ANSSI
**Plan B** : Commencer par votes non-officiels (associations, entreprises)

### Risque : Adoption trop lente
**Plan B** : Pivot vers secteur privé (AG, CSE) pour financer

### Risque : Évolution réglementaire défavorable
**Plan B** : Lobbying, adaptation internationale (autres pays UE)

### Risque : Faille de sécurité majeure
**Plan B** : Bug bounty agressif, audits continus, assurance cyber

---

## Indicateurs de Performance (KPIs)

### Techniques
- Uptime : **>99.9%**
- Latence vote : **<3 secondes**
- Coût par vote : **<0.10€**
- Bugs critiques : **0**

### Usage
- Nombre d'électeurs : **50k (2025) → 10M (2028)**
- Nombre d'élections : **10 (2025) → 1000+ (2028)**
- Taux de participation : **+10-20% vs traditionnel**

### Financiers
- Break-even : **Q4 2026**
- ROI pour collectivités : **>300%** (vs vote traditionnel)

### Satisfaction
- NPS (Net Promoter Score) : **>50**
- Satisfaction utilisateurs : **>85%**
- Confiance résultats : **>90%**

---

## Conclusion

Cette roadmap est **ambitieuse mais réaliste**, fondée sur :
- Approche incrémentale (POC → Pilotes → Beta → Production)
- Rigueur technique (audits, tests, certifications)
- Pragmatisme réglementaire (dialogue autorités dès le début)
- Modèle économique viable (équilibre 2026)

**Next step** : Validation de cette roadmap par le conseil scientifique et les partenaires initiaux.

---

**Mise à jour prévue** : Trimestrielle
**Responsable** : CTO DEMOCRATIX
