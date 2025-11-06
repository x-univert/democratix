# Spécification: Système de Sondages

## Vue d'ensemble

Ajouter une fonctionnalité de **sondages rapides** en complément des élections sécurisées.

## Architecture

### 1. Base de données (Backend)

```typescript
interface Poll {
  id: number;
  title: string;
  description: string;
  creator: string; // Adresse MultiversX
  createdAt: Date;
  endsAt: Date;
  status: 'active' | 'closed';

  // Options
  options: PollOption[];

  // Configuration
  config: {
    multipleChoice: boolean; // Vote multiple autorisé?
    resultsVisibleBeforeEnd: boolean; // Voir résultats avant la fin?
    requireWallet: boolean; // Connexion wallet obligatoire?
    allowChangeVote: boolean; // Modifier son vote?
    anonymous: boolean; // Vote anonyme?
  };

  // Statistiques
  totalVotes: number;
  uniqueVoters: number;
}

interface PollOption {
  id: number;
  pollId: number;
  text: string;
  votes: number;
  percentage: number;
}

interface PollVote {
  pollId: number;
  voter: string; // Hash de l'adresse ou adresse directe
  optionIds: number[]; // Support vote multiple
  votedAt: Date;
  ipAddress?: string; // Pour éviter le spam (si pas de wallet)
}
```

### 2. API Endpoints

```typescript
// Création
POST   /api/polls                    // Créer un sondage
GET    /api/polls                    // Liste des sondages
GET    /api/polls/:id                // Détails d'un sondage
DELETE /api/polls/:id                // Supprimer (créateur seulement)

// Vote
POST   /api/polls/:id/vote           // Voter
DELETE /api/polls/:id/vote           // Annuler son vote (si autorisé)
GET    /api/polls/:id/results        // Résultats
GET    /api/polls/:id/my-vote        // Mon vote actuel

// Admin
PUT    /api/polls/:id/close          // Fermer le sondage
GET    /api/polls/:id/export         // Export CSV des résultats
```

### 3. Base de données

**Option 1: SQLite locale** (comme actuellement pour co-organizers)
- Simple, pas besoin de setup externe
- Perdu lors des redéploiements (utiliser Railway Volume)

**Option 2: PostgreSQL Railway**
- Railway offre PostgreSQL gratuit
- Persistant, backups automatiques
- **Recommandé pour production**

**Option 3: Firestore/Supabase**
- Temps réel natif
- Gratuit jusqu'à un certain volume

### 4. Frontend - Nouvelles Pages

```
/polls                    // Liste des sondages
/polls/create             // Créer un sondage
/polls/:id                // Voir et voter
/polls/:id/results        // Résultats détaillés (graphiques)
```

### 5. Différence avec Élections

| Aspect | Élection | Sondage |
|--------|----------|---------|
| **Stockage** | Blockchain MultiversX | Base de données backend |
| **Coût** | Gas fees (~$0.01-0.10) | Gratuit |
| **Vitesse** | 6-10 secondes | Instantané |
| **Immutabilité** | ✅ Garantie | ❌ Backend contrôle |
| **Anonymat crypto** | zk-SNARK / ElGamal | Simple hash |
| **Audit** | Public on-chain | Logs backend |

## Cas d'usage

### Sondages Publics (Sans wallet)
- Sondages d'opinion générale
- Feedback utilisateurs
- Enquêtes marketing
- **Protection spam**: IP tracking + CAPTCHA

### Sondages Avec Wallet (Recommandé)
- Sondages DAO/communauté
- Pré-vote pour tester l'opinion
- Décisions internes d'organisation
- **Protection Sybil**: 1 wallet = 1 vote

### Sondages Pondérés (Avancé)
- Vote pondéré par tokens détenus
- Vote pondéré par NFT rares
- Vote quadratique (coût exponentiel)

## Implémentation par Phases

### Phase 1: MVP (2-3 jours)
- [x] API CRUD sondages
- [x] Vote simple (1 option, 1 vote)
- [x] Résultats en temps réel
- [x] Frontend basique (liste + création + vote)

### Phase 2: Fonctionnalités (3-4 jours)
- [x] Vote multiple
- [x] Modification de vote
- [x] Paramètres de confidentialité
- [x] Dashboard créateur
- [x] Export CSV

### Phase 3: Avancé (1 semaine)
- [x] Authentification wallet optionnelle
- [x] WebSocket pour résultats temps réel
- [x] Graphiques interactifs (Chart.js)
- [x] Vote pondéré par tokens
- [x] Intégration avec élections (créer élection depuis sondage)

### Phase 4: Production (1 semaine)
- [x] Rate limiting anti-spam
- [x] CAPTCHA pour votes sans wallet
- [x] PostgreSQL Railway
- [x] Analytics (Google Analytics / Mixpanel)
- [x] Tests E2E avec Cypress

## Schéma Base de Données PostgreSQL

```sql
-- Sondages
CREATE TABLE polls (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator VARCHAR(62) NOT NULL, -- Adresse MultiversX (erd1...)
    created_at TIMESTAMP DEFAULT NOW(),
    ends_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',

    -- Configuration JSON
    config JSONB DEFAULT '{}',

    -- Stats (dénormalisé pour performance)
    total_votes INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,

    -- Index pour recherche
    CONSTRAINT valid_status CHECK (status IN ('active', 'closed'))
);

-- Options de sondage
CREATE TABLE poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    votes INTEGER DEFAULT 0
);

-- Votes
CREATE TABLE poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    voter_hash VARCHAR(64) NOT NULL, -- Hash de l'identifiant (wallet ou IP)
    voted_at TIMESTAMP DEFAULT NOW(),

    -- Métadonnées
    ip_address VARCHAR(45), -- IPv6 support
    user_agent TEXT,

    -- Contrainte: 1 vote par voter_hash par poll
    UNIQUE(poll_id, voter_hash)
);

-- Choix de vote (support vote multiple)
CREATE TABLE poll_vote_choices (
    vote_id INTEGER REFERENCES poll_votes(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
    PRIMARY KEY (vote_id, option_id)
);

-- Index pour performance
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_creator ON polls(creator);
CREATE INDEX idx_polls_ends_at ON polls(ends_at);
CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
```

## Exemples d'UI

### 1. Page de liste des sondages
```
┌─────────────────────────────────────────────┐
│  🗳️  Sondages Actifs                        │
│                                             │
│  🔴 [LIVE] Quelle feature prioriser?        │
│     📊 1,234 votes · Se termine dans 2h     │
│     [Voter →]                               │
│                                             │
│  🔴 [LIVE] Meilleur design pour le logo     │
│     📊 856 votes · Se termine dans 5h       │
│     [Voir résultats →] (déjà voté ✓)        │
│                                             │
│  📁 Sondages Terminés (voir tout)           │
└─────────────────────────────────────────────┘
```

### 2. Page de création
```
┌─────────────────────────────────────────────┐
│  Créer un Sondage                           │
│                                             │
│  Titre: [____________________________]      │
│  Description: [_____________________]       │
│                [_____________________]      │
│                                             │
│  Options:                                   │
│    1. [Option A____________] [X]            │
│    2. [Option B____________] [X]            │
│    3. [Option C____________] [X]            │
│    [+ Ajouter option]                       │
│                                             │
│  ⚙️ Paramètres:                             │
│  ☑ Vote multiple autorisé                   │
│  ☑ Résultats visibles pendant le vote       │
│  ☐ Wallet MultiversX requis                 │
│  ☑ Modifier son vote autorisé               │
│                                             │
│  Durée: [2 jours ▼]                         │
│                                             │
│  [Créer le sondage]                         │
└─────────────────────────────────────────────┘
```

### 3. Page de vote
```
┌─────────────────────────────────────────────┐
│  🗳️ Quelle feature prioriser?               │
│  Par @organisateur · Se termine dans 2h     │
│                                             │
│  Nous voulons améliorer la plateforme.      │
│  Votez pour la feature que vous voulez!     │
│                                             │
│  ○ Dark mode                                │
│  ○ Application mobile                       │
│  ○ Vote pondéré par tokens                  │
│  ○ Intégration Discord                      │
│                                             │
│  [Voter] [Voir résultats sans voter]        │
│                                             │
│  📊 1,234 votes · 856 votants uniques       │
└─────────────────────────────────────────────┘
```

### 4. Page de résultats
```
┌─────────────────────────────────────────────┐
│  📊 Résultats: Quelle feature prioriser?    │
│  Sondage terminé · 1,234 votes              │
│                                             │
│  Dark mode                                  │
│  ████████████████████░░ 45% (556 votes)     │
│                                             │
│  Application mobile                         │
│  ████████████░░░░░░░░░ 28% (345 votes)      │
│                                             │
│  Vote pondéré par tokens                    │
│  ████████░░░░░░░░░░░░░ 18% (222 votes)      │
│                                             │
│  Intégration Discord                        │
│  ██░░░░░░░░░░░░░░░░░░░  9% (111 votes)      │
│                                             │
│  [Export CSV] [Partager]                    │
└─────────────────────────────────────────────┘
```

## Stack Technique Recommandé

### Backend
- **ORM**: Prisma (TypeScript, excellent avec PostgreSQL)
- **Validation**: Zod (déjà utilisé dans le projet?)
- **Rate Limiting**: `express-rate-limit`
- **CAPTCHA**: hCaptcha ou reCAPTCHA v3

### Frontend
- **Graphiques**: Chart.js ou Recharts
- **Formulaires**: React Hook Form + Zod
- **État**: Context API (ou Zustand si besoin)
- **Temps réel**: Socket.io (déjà implémenté)

### Base de données
- **Railway PostgreSQL** (recommandé)
  - Free tier: 512MB RAM, 1GB stockage
  - Upgrade: $5/mois pour 2GB

## Monétisation Possible

1. **Freemium Model**
   - Gratuit: 100 votes max, 7 jours rétention
   - Premium ($5/mois): Votes illimités, analytics avancés, export

2. **Pay-per-Poll**
   - Sondage standard: Gratuit
   - Sondage avec wallet requis: 0.1 EGLD
   - Sondage pondéré par tokens: 0.5 EGLD

3. **White Label**
   - DAOs/entreprises peuvent customiser l'UI
   - $50/mois pour domaine personnalisé

## Sécurité

### Anti-Spam Sans Wallet
1. **IP Rate Limiting**: Max 5 votes/heure par IP
2. **CAPTCHA**: Sur vote si détection de bot
3. **Fingerprinting**: Canvas fingerprint du navigateur
4. **Honeypot**: Champs cachés pour piéger les bots

### Anti-Sybil Avec Wallet
1. **Signature de transaction**: Prouver possession du wallet
2. **Nonce unique**: Empêcher replay attacks
3. **Cooldown**: 1 vote par wallet par sondage
4. **Blacklist**: Bannir wallets malveillants

## Migration depuis Élections

Ajouter un bouton dans l'interface d'élection:

```
┌─────────────────────────────────────────────┐
│  Cette élection est terminée.               │
│  Voulez-vous créer un sondage similaire?    │
│                                             │
│  [Créer un sondage basé sur cette élection] │
└─────────────────────────────────────────────┘
```

Cela copie:
- Titre et description
- Candidats → Options
- Durée suggérée (proportionnelle)

## Conclusion

Le système de sondages est **complémentaire et non concurrent** des élections:

- **Élections**: Haute sécurité, immuabilité, coût élevé, lent
- **Sondages**: Rapidité, gratuité, flexibilité, engagement

**Recommandation**: Commencer par un MVP simple (Phase 1) pour valider l'intérêt utilisateur, puis itérer selon les retours.

## Estimation Développement

- **Phase 1 (MVP)**: 2-3 jours
- **Phase 2 (Complet)**: 1 semaine
- **Phase 3 (Production-ready)**: 2 semaines

**Total**: ~3 semaines pour une implémentation complète et robuste.
