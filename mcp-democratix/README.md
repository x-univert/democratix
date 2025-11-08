# 🗳️ MCP DEMOCRATIX Server

Serveur MCP personnalisé pour automatiser les tâches DEMOCRATIX et améliorer le workflow de développement avec Claude Code.

## 🎯 Fonctionnalités

### 6 Outils Puissants

| Outil | Description | Utilité |
|-------|-------------|---------|
| `create_test_election` | Crée une élection de test complète | Tester rapidement les 3 options de vote |
| `get_election_stats` | Statistiques blockchain d'une élection | Analytics détaillées (votes, gas, types) |
| `monitor_votes` | Monitoring temps réel des votes | Voir les derniers votes avec détails |
| `generate_elgamal_keys` | Génère paires de clés ElGamal | Options 1 & 2 (chiffrement) |
| `upload_to_ipfs` | Upload métadonnées sur IPFS | Stockage décentralisé |
| `get_votes_by_type` | Répartition votes par type | Analytics comparatives |

## 📦 Installation

### 1. Installer les Dépendances

\`\`\`bash
cd mcp-democratix
npm install
\`\`\`

### 2. Configuration

Copiez `.env.example` vers `.env` et configurez :

\`\`\`bash
cp .env.example .env
\`\`\`

Éditez `.env` :

\`\`\`env
# MultiversX
MULTIVERSX_NETWORK=devnet
MULTIVERSX_API_URL=https://devnet-api.multiversx.com
VOTING_CONTRACT_ADDRESS=erd1qqqqqqqqqqqqqpgq...

# IPFS (Pinata) - Optionnel
PINATA_API_KEY=your_api_key
PINATA_SECRET_API_KEY=your_secret_key

# URLs
FRONTEND_URL=https://democratix-frontend.vercel.app
BACKEND_URL=https://democratix-backend-production.up.railway.app
\`\`\`

### 3. Build

\`\`\`bash
npm run build
\`\`\`

### 4. Installer dans Claude Code

\`\`\`bash
claude mcp add democratix \\
  --transport stdio \\
  --env MULTIVERSX_API_URL=$MULTIVERSX_API_URL \\
  --env VOTING_CONTRACT_ADDRESS=$VOTING_CONTRACT_ADDRESS \\
  -- npx tsx /chemin/vers/mcp-democratix/src/index.ts
\`\`\`

**Ou en mode dev** :

\`\`\`bash
npm run dev
\`\`\`

## 🚀 Utilisation dans Claude Code

### Exemple 1 : Créer Élection de Test

\`\`\`
Dans Claude Code, tapez :

"Crée une élection de test Option 2 avec 3 candidats, durée 2h"

→ Claude utilise : create_test_election
→ Retourne : Métadonnées complètes + clés ElGamal + candidats
\`\`\`

### Exemple 2 : Analytics Élection

\`\`\`
"Donne-moi les stats de l'élection 90"

→ Claude utilise : get_election_stats
→ Retourne : Total votes, répartition par type, gas moyen
\`\`\`

### Exemple 3 : Monitoring Temps Réel

\`\`\`
"Montre-moi les 5 derniers votes de l'élection 90"

→ Claude utilise : monitor_votes
→ Retourne : Liste avec type, votant, timestamp, gas
\`\`\`

### Exemple 4 : Générer Clés ElGamal

\`\`\`
"Génère des clés ElGamal et sauvegarde-les"

→ Claude utilise : generate_elgamal_keys (saveToFile: true)
→ Retourne : Clés publique/privée + fichier dans .secure-keys/
\`\`\`

### Exemple 5 : Répartition Votes

\`\`\`
"Quelle est la répartition des votes par type de chiffrement ?"

→ Claude utilise : get_votes_by_type
→ Retourne : Tableau + graphique avec percentages
\`\`\`

## 🛠️ Outils Détaillés

### create_test_election

**Paramètres** :
- `title` (string) - Titre de l'élection
- `numCandidates` (number) - Nombre de candidats (2-5)
- `encryptionType` (number) - 0=Standard, 1=ElGamal, 2=ElGamal+zkSNARK
- `durationHours` (number, optionnel) - Durée en heures (défaut: 1)
- `requiresRegistration` (boolean, optionnel) - Inscription requise (défaut: false)

**Retourne** :
- Métadonnées élection complètes (JSON)
- Liste candidats avec bios
- Clés ElGamal (si Options 1 ou 2)
- Dates début/fin

**Exemple** :
\`\`\`json
{
  "title": "Test zkSNARK",
  "numCandidates": 3,
  "encryptionType": 2,
  "durationHours": 2
}
\`\`\`

---

### get_election_stats

**Paramètres** :
- `electionId` (number) - ID de l'élection

**Retourne** :
- Total votes
- Votes par type (Standard, zkSNARK, ElGamal, ElGamal+zk)
- Gas moyen
- Lien frontend

---

### monitor_votes

**Paramètres** :
- `electionId` (number) - ID de l'élection
- `limit` (number, optionnel) - Nombre de votes à afficher (défaut: 10)

**Retourne** :
- Liste des derniers votes avec :
  - Type de vote (icône + nom)
  - Adresse votant (tronquée)
  - Timestamp
  - Gas utilisé
  - Lien Explorer

---

### generate_elgamal_keys

**Paramètres** :
- `saveToFile` (boolean, optionnel) - Sauvegarder dans .secure-keys/ (défaut: false)

**Retourne** :
- Clé publique (hex, 66 chars)
- Clé privée (hex, 64 chars)
- Courbe : secp256k1
- Avertissement sécurité
- Chemin fichier (si sauvegardé)

⚠️ **IMPORTANT** : Conservez la clé privée en sécurité !

---

### upload_to_ipfs

**Paramètres** :
- `metadata` (object) - Objet JSON à uploader
- `name` (string) - Nom du fichier IPFS

**Retourne** :
- Hash IPFS (ex: `QmXxx...`)
- URL Pinata Gateway
- Métadonnées uploadées

**Prérequis** : PINATA_API_KEY et PINATA_SECRET_API_KEY configurés

---

### get_votes_by_type

**Paramètres** :
- `electionId` (number, optionnel) - ID élection spécifique ou toutes

**Retourne** :
- Tableau répartition par type
- Pourcentages
- Graphique ASCII
- Total votes

## 🎓 Workflows Recommandés

### Workflow 1 : Test Rapide Option 2

\`\`\`
1. "Génère des clés ElGamal et sauvegarde"
2. "Crée une élection de test Option 2 avec 3 candidats"
3. Copier les clés dans le frontend lors de la création
4. Voter avec les 3 options si possible
5. "Donne les stats de l'élection X"
6. "Montre les derniers votes"
\`\`\`

### Workflow 2 : Analytics Hebdomadaire

\`\`\`
1. "Quelle est la répartition des votes par type ?"
2. "Donne les stats des élections 88, 89, 90"
3. "Montre les 20 derniers votes"
4. Analyser les tendances (quel type est préféré ?)
\`\`\`

### Workflow 3 : Préparation Demo

\`\`\`
1. "Crée 3 élections de test (une par option) avec 2 candidats chacune"
2. Noter les clés ElGamal pour Options 1 et 2
3. Créer les élections sur le frontend
4. Effectuer des votes de test
5. "Donne les stats des 3 élections"
6. Préparer screenshots pour démo
\`\`\`

## 🔧 Développement

### Structure

\`\`\`
mcp-democratix/
├── src/
│   ├── index.ts              # Serveur MCP principal
│   └── tools/
│       ├── createTestElection.ts
│       ├── getElectionStats.ts
│       ├── monitorVotes.ts
│       ├── generateElGamalKeys.ts
│       ├── uploadToIPFS.ts
│       └── getVotesByType.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
\`\`\`

### Ajouter un Nouvel Outil

1. Créez `src/tools/monNouvelOutil.ts` :

\`\`\`typescript
export async function monNouvelOutilTool(args: any) {
  const { param1, param2 } = args;

  // Votre logique ici

  return {
    content: [
      {
        type: 'text',
        text: 'Résultat de l\'outil'
      }
    ]
  };
}
\`\`\`

2. Ajoutez dans `src/index.ts` :

\`\`\`typescript
import { monNouvelOutilTool } from './tools/monNouvelOutil.js';

// Dans tools array
const tools: Tool[] = [
  // ... autres outils
  {
    name: 'mon_nouvel_outil',
    description: 'Description de mon outil',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string' },
        param2: { type: 'number' }
      },
      required: ['param1']
    }
  }
];

// Dans le switch case
case 'mon_nouvel_outil':
  return await monNouvelOutilTool(args);
\`\`\`

### Tests

\`\`\`bash
# Mode watch pour développement
npm run watch

# Test manuel
npm run dev
\`\`\`

## 📚 Documentation Technique

### Architecture MCP

```
Claude Code
    ↓
MCP DEMOCRATIX Server (stdio)
    ↓
Outils (6 tools)
    ↓
APIs Externes:
  - MultiversX API (blockchain)
  - Pinata API (IPFS)
  - Backend DEMOCRATIX (optionnel)
```

### Sécurité

- ✅ Clés privées stockées dans `.secure-keys/` avec permissions 600
- ✅ Variables d'environnement pour credentials
- ✅ Pas de logs de clés secrètes
- ⚠️ Ne jamais committer `.env` ou `.secure-keys/`

### Performance

- Requêtes blockchain : ~300-500ms
- Upload IPFS : ~1-2s
- Génération clés ElGamal : <100ms
- Monitoring votes : ~200-400ms

## 🐛 Dépannage

### Erreur : "VOTING_CONTRACT_ADDRESS not set"

Configurez dans `.env` :
\`\`\`env
VOTING_CONTRACT_ADDRESS=erd1qqqqqqqqqqqqqpgq...
\`\`\`

### Erreur : "Pinata API credentials not configured"

L'outil `upload_to_ipfs` nécessite :
\`\`\`env
PINATA_API_KEY=your_key
PINATA_SECRET_API_KEY=your_secret
\`\`\`

Obtenez vos clés sur : https://pinata.cloud

### MCP ne se connecte pas

1. Vérifiez que npm install a réussi
2. Vérifiez le chemin dans la commande `claude mcp add`
3. Testez en mode dev : `npm run dev`

## 🤝 Contribution

Pour ajouter des fonctionnalités :
1. Forkez le projet
2. Créez une branche feature
3. Ajoutez vos outils dans `src/tools/`
4. Testez avec `npm run dev`
5. Créez une Pull Request

## 📜 Licence

MIT - DEMOCRATIX Team

---

**Créé avec ❤️ pour améliorer le développement DEMOCRATIX**
