# 📝 CHANGELOG - DEMOCRATIX

Toutes les modifications notables du projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Non publié] - En cours de développement

### 🔜 Prévu
- Tests end-to-end avec Cypress
- Système de notifications en temps réel
- Documentation utilisateur complète (page "À propos", FAQ)
- Backend Node.js pour génération de preuves
- Amélioration formulaire création d'élection (ajout candidats dès la création)

---

## [0.6.0] - 2025-10-28 - Election Finalization & UTF-8 Fix

### ✨ Ajouté
- **Workflow de finalisation d'élection** - Nouveau statut "Finalized"
  - Fonction `finalizeElection` ajoutée au smart contract
  - Hook `useFinalizeElection` créé pour le frontend
  - Bouton de finalisation dans ElectionDetail avec modale de confirmation
  - Notice de finalisation sur ElectionCard pour élections fermées
  - Traductions FR/EN/ES complètes (`finalizeButton`, `finalizeInfo`, `needsFinalization`, etc.)
  - Event `electionFinalized` émis sur la blockchain
- **ConfirmModal réutilisable** - Modales de confirmation pour toutes les actions critiques
  - Vote, Activation, Clôture, Finalisation, Création élection, Ajout candidat
  - Support multi-langues avec i18next
  - Types: success, warning, error, info

### 🐛 Corrections
- **Fix encodage UTF-8** - Caractères accentués affichés correctement
  - Remplacement de `String.fromCharCode()` par `TextDecoder('utf-8')`
  - Fix dans `useGetElections.ts` ligne 221-233 (titres d'élection)
  - Fix dans `useGetCandidates.ts` ligne 97-109 (noms de candidats)
  - "Election vérification" au lieu de "Election vÃ©rification"
  - "Clément ROUX" au lieu de "ClÃ©ment ROUX"
- **Logique boutons élections expirées** - Meilleure UX
  - Bouton "VOTER MAINTENANT" masqué si date de fin dépassée
  - Bouton "Voir les détails" affiché pour non-organisateurs
  - Fix dans `ElectionCard.tsx` lignes 317, 326-334
  - Fix dans `ElectionDetail.tsx` ligne 596

### 🔧 Améliorations
- **AdminDashboard counting logic** - Comptage correct des élections
  - Utilisation du statut blockchain uniquement (sans mélanger avec timestamps)
  - Alignement avec la logique de la page Elections
  - Fix lignes 57-80

### 📝 Documentation
- Mise à jour PROGRESS.md (v0.6.0, 98% complété)
- Mise à jour CHANGELOG.md (cette entrée)
- Ajout notes de session détaillées

### 🎯 Impact
- **MVP à 98%** - Workflow complet Pending → Active → Closed → Finalized
- **Meilleure qualité** - Encodage UTF-8 correct, boutons cohérents
- **Production-ready** - Modales de confirmation pour éviter les erreurs

---

## [0.5.0] - 2025-10-28 - Vote Fix & UI Polish

### 🐛 Corrections CRITIQUES
- **Fix vote encoding bug** - Résolution du problème `ErrInvalidArgument`
  - Conversion `Uint8Array` → `Buffer` pour structures imbriquées SDK
  - Correction syntaxe SDK v15 (`transaction.data` au lieu de `getData()`)
  - Vote maintenant 100% fonctionnel et testé
  - Documentation complète dans `.claude/docs-claude/VOTE_ENCODING_RESOLUTION.md`
- **Fix pagination redirect** - useRef au lieu de useState pour isFirstRender
  - Correction du bug de redirection vers page 1 lors du refresh
  - Pagination maintenant persistante dans l'URL

### ✨ Ajouté
- **Vote button pour organisateurs** - Possibilité de tester le vote en tant qu'organisateur
- **Logs de debug détaillés** - Tracking complet du processus de vote
  - Logs de l'encodage candidateId
  - Logs de création de transaction
  - Logs des données de transaction
  - Facilite le debugging futur

### 🎨 Design Améliorations
- **Header navigation text** - Texte du menu visible avec logo sur écrans moyens+
  - Logo "DEMOCRATIX" visible dès md: (768px+) au lieu de lg: (1024px+)
  - Menu navigation (Dashboard, Elections, etc.) toujours visible, pas seulement l'icône
- **Results page text colors** - Meilleure lisibilité sur fond orange
  - Section "Gagnant" entièrement en blanc (`text-white`)
  - Titre, nom du gagnant, et stats tous visibles
- **Results page image borders** - Images parfaitement alignées
  - Ajout de `block` sur les images (supprime marge inline)
  - Ajout de `overflow-hidden` sur conteneurs
  - Coins arrondis responsifs (`rounded-t-xl` mobile, `rounded-l-xl` desktop)
  - Hauteur automatique sur desktop (`md:h-auto`) pour remplir la carte

### 🧪 Tests
- ✅ **Élection #19**: 2 votes enregistrés et comptés correctement
- ✅ **Élection #20**: 4 votes (3 + 1) avec pourcentages exacts (75%/25%)
- ✅ **Affichage résultats**: Graphiques et stats cohérents blockchain ↔ frontend
- ✅ **Pagination**: URL ?page=2 ou ?page=3 persiste après refresh

### 📚 Documentation
- Création de `VOTE_ENCODING_RESOLUTION.md` (guide complet du bug fix)
  - Analyse technique du problème
  - Solution détaillée avec code
  - Tests et validation
  - Limitations de sécurité (crypto_mock)
  - Checklist pour futurs bugs similaires

### 🛠️ Technique
- Smart contract queries validées:
  - `getTotalVotes(election_id)` ✅
  - `getCandidateVotes(election_id, candidate_id)` ✅
  - `getElection(election_id)` ✅
- Transaction encoding format documenté
- Types MultiversX SDK clarifiés (Buffer vs Uint8Array)

---

## [0.4.0] - 2025-10-27 - UI/UX Improvements

### ✨ Ajouté
- **Loading Skeletons** - Placeholders animés pendant le chargement
  - `SkeletonCard` pour la liste des élections
  - `SkeletonDetail` pour la page de détails
  - `Skeleton` composant de base réutilisable
  - Animation shimmer pour effet de brillance
- **ErrorMessage Component** - Gestion d'erreurs améliorée
  - 5 types d'erreurs prédéfinis (notFound, loadError, networkError, permissionDenied, generic)
  - Messages traduits (FR/EN/ES)
  - Boutons d'action (Retry, Go Back)
  - Design cohérent avec les thèmes
- **Animations & Transitions**
  - Page fade-in pour transitions entre pages
  - Slide-up pour modals et toasts
  - Scale bounce pour interactions boutons
  - Shake animation pour erreurs
  - Hover lift effect pour cartes
  - Button press effect
  - Loading dots animation
  - Stagger animations pour listes

### 🔄 Modifié
- **Elections Page**: Remplacé spinner par skeleton grid complet
- **ElectionDetail Page**: Remplacé spinner par SkeletonDetail
- **Error handling**: Utilisation du composant ErrorMessage
- **Global CSS**: Ajout de 9 nouvelles animations

### 📚 Documentation
- Traductions d'erreurs dans 3 langues (FR/EN/ES)
- Commentaires CSS pour animations
- Documentation des classes utilitaires

### 🎨 Design
- Amélioration de l'expérience pendant le chargement
- Feedback visuel cohérent sur toutes les actions
- Animations fluides et naturelles

---

## [0.3.0] - 2025-10-27 - Phase MVP avancée

### ✨ Ajouté
- **i18n Complet** - Support multilingue FR/EN/ES
  - 430 lignes de traductions par langue
  - 11 pages/composants traduits
  - Pluralisation et interpolation
  - Sélecteur de langue dans Settings
  - Persistance dans localStorage

### 🔒 Sécurité
- **Correction critique**: Suppression des clés API Pinata hardcodées
- Ajout de `.env` dans `.gitignore`
- Création de `.env.example` avec placeholders
- Documentation de la configuration sécurisée

### 📚 Documentation
- Mise à jour ROADMAP_DEVELOPPEMENT.md avec état actuel
- Création de RECOMMANDATIONS_PROCHAINES_ETAPES.md
- Ajout de ce CHANGELOG.md

### 🐛 Corrections
- Sécurisation du service IPFS
- Variables d'environnement correctement configurées

---

## [0.2.0] - 2025-10-26 - Intégration IPFS

### ✨ Ajouté
- **Service IPFS complet** via Pinata
  - Upload de fichiers (images)
  - Upload de JSON (métadonnées)
  - Récupération depuis IPFS
  - Validation des hashes IPFS
  - Test de connexion
- **Métadonnées structurées**
  - `ElectionMetadata` interface
  - `CandidateMetadata` interface
- **Hook personnalisé**: `useIPFSImage` pour charger les images

### 🔄 Modifié
- `CreateElection`: Upload métadonnées sur IPFS
- `AddCandidate`: Upload photo + biographie sur IPFS
- `ElectionDetail`: Récupération métadonnées depuis IPFS
- Smart contracts: Utilisation de `description_ipfs` au lieu de description directe

### 🛠️ Technique
- Installation d'axios pour requêtes HTTP
- Configuration Pinata API
- Gateway IPFS pour affichage public

---

## [0.1.0] - 2025-10-25 - MVP Phase 1

### ✨ Ajouté

#### Smart Contracts (Rust)
- **voting.rs**: Contrat principal de vote
  - Création d'élections
  - Enregistrement des votes
  - Gestion des candidats
  - Statuts d'élection (Pending, Active, Closed, Finalized)
- **voter-registry.rs**: Registre des votants
  - Enregistrement des électeurs
  - Vérification d'éligibilité
- **results.rs**: Gestion des résultats
  - Comptage des votes
  - Publication des résultats
  - Détermination du gagnant

#### Frontend (React + TypeScript)
- **Architecture de base**
  - React 18 + TypeScript
  - Vite pour le build
  - Tailwind CSS pour le styling
  - React Router pour la navigation
- **Intégration MultiversX**
  - Connexion wallet (@multiversx/sdk-dapp)
  - Signature de transactions
  - Requêtes vers la blockchain
- **Système de thèmes**
  - Dark mode (TealLab)
  - Light mode (BrightLight)
  - Vibe mode
  - Sélecteur dans Settings
- **Pages principales**
  - **Home**: Page d'accueil avec hero section
  - **Elections**: Liste des élections avec filtres (All, Pending, Active, Closed, Finalized)
  - **ElectionDetail**: Détails d'une élection + actions (vote, ajout candidat, activation, clôture)
  - **CreateElection**: Formulaire de création d'élection
  - **Vote**: Interface de vote avec sélection de candidat
  - **AddCandidate**: Ajout de candidats à une élection
  - **Results**: Visualisation des résultats avec graphiques (Recharts)
  - **AdminDashboard**: Statistiques globales et mes élections
  - **Profile**: Historique de participation de l'utilisateur
- **Composants**
  - `ElectionCard`: Carte d'élection réutilisable
  - `Header`: Navigation avec connexion wallet
  - `Footer`: Pied de page avec liens
  - `Settings`: Modal de configuration (thème, langue, réseau)
  - `Button`, `Loader`, etc.

#### Hooks Personnalisés
- **Elections**
  - `useGetElections`: Récupère toutes les élections
  - `useGetElectionDetail`: Détails d'une élection
  - `useGetCandidates`: Liste des candidats
  - `useGetUserVotingHistory`: Historique de vote
  - `useElectionMetadata`: Métadonnées IPFS
- **Transactions**
  - `useCreateElection`: Créer une élection
  - `useAddCandidate`: Ajouter un candidat
  - `useActivateElection`: Activer une élection
  - `useCloseElection`: Clôturer une élection
  - `useVote`: Voter pour un candidat

### 🛠️ Infrastructure
- Git repository initialisé
- Structure de dossiers organisée
- Déploiement sur Devnet MultiversX
- Configuration Tailwind CSS
- ESLint + Prettier

### 📋 Tests
- Tests unitaires basiques des smart contracts
- Tests manuels de l'interface

---

## [0.0.1] - 2025-10-20 - Initialisation

### ✨ Ajouté
- Initialisation du projet
- Architecture projet définie
- Documentation initiale
  - WHITEPAPER.md
  - ROADMAP.md
  - BUSINESS_PLAN.md
- Configuration Git

---

## Légende des Symboles

- ✨ `Ajouté` : Nouvelles fonctionnalités
- 🔄 `Modifié` : Changements dans des fonctionnalités existantes
- 🗑️ `Déprécié` : Fonctionnalités bientôt supprimées
- 🐛 `Corrigé` : Corrections de bugs
- 🔒 `Sécurité` : Corrections de vulnérabilités
- 📚 `Documentation` : Changements dans la documentation
- 🛠️ `Technique` : Changements techniques ou d'infrastructure
- 🔜 `Prévu` : Fonctionnalités à venir

---

## Notes de Version

### Convention de Versioning

Le projet utilise [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0) : Changements incompatibles avec les versions précédentes
- **MINOR** (0.X.0) : Ajout de fonctionnalités rétro-compatibles
- **PATCH** (0.0.X) : Corrections de bugs rétro-compatibles

### Étapes du Projet

1. **v0.1.0 - v0.4.0** : Phase MVP (Minimum Viable Product)
2. **v0.5.0 - v0.9.0** : Phase Beta (Tests utilisateurs)
3. **v1.0.0** : Première release production
4. **v2.0.0+** : Features avancées (zk-SNARKs, etc.)

---

**Dernière mise à jour** : 27 Octobre 2025
