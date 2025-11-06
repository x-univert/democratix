# Upload de fichiers vers Railway Volumes

## Méthode 1: Railway CLI + SCP (Recommandé)

### Installation Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# Vérification
railway version
```

### Login et Lien avec le Projet

```bash
# Login
railway login

# Lier au projet (dans le dossier du projet)
cd C:\Users\DEEPGAMING\MultiversX\DEMOCRATIX
railway link

# Sélectionner votre projet DEMOCRATIX Backend
```

### Upload des Circuits zk-SNARK

```bash
# Créer un script temporaire pour copier les fichiers
railway run bash

# Dans le shell Railway:
mkdir -p /app/circuits/build
mkdir -p /app/circuits/build/valid_vote_js
mkdir -p /app/circuits/build/voter_eligibility_simple_js
```

**Problème**: Railway CLI ne permet pas de copier facilement des fichiers volumineux.

## Méthode 2: Script d'Upload au Démarrage (PLUS SIMPLE)

Uploadez les circuits sur un service cloud et téléchargez-les au démarrage du backend.

### Étape 1: Compresser les circuits

```bash
# Windows PowerShell
cd backend\circuits
tar -czf circuits.tar.gz build/

# Vérifier la taille
dir circuits.tar.gz
# Devrait être ~10-50MB
```

### Étape 2: Upload sur un service cloud

**Option A: GitHub Release** (GRATUIT, public)

1. Créer une Release sur GitHub: https://github.com/x-univert/democratix/releases/new
2. Tag: `circuits-v1.0.0`
3. Title: "zk-SNARK Circuits v1.0.0"
4. Uploader `circuits.tar.gz`
5. Publier (même en "draft" c'est accessible)

URL finale: `https://github.com/x-univert/democratix/releases/download/circuits-v1.0.0/circuits.tar.gz`

**Option B: IPFS/Pinata** (GRATUIT, décentralisé)

```bash
# Upload via interface web Pinata
# https://app.pinata.cloud/pinmanager

# Obtenir le hash IPFS
# Exemple: QmXxx...
```

URL finale: `https://gateway.pinata.cloud/ipfs/QmXxx...`

**Option C: Google Drive** (GRATUIT, nécessite lien public)

1. Uploader sur Google Drive
2. Clic droit → Partager → "Accessible à tous ceux qui ont le lien"
3. Copier l'ID du fichier

URL finale: `https://drive.google.com/uc?export=download&id=FILE_ID`

### Étape 3: Télécharger au démarrage du backend

Modifier `backend/src/index.ts`:

```typescript
// backend/src/index.ts

import { downloadAndExtractCircuits } from './utils/circuitsDownloader';

async function startServer() {
  try {
    // Télécharger les circuits si nécessaire
    logger.info('🔍 Checking for zk-SNARK circuits...');
    await downloadAndExtractCircuits();

    // Initialiser le service zk-SNARK
    logger.info('🔐 Initializing zk-SNARK verifier...');
    try {
      await zkVerifier.initialize();
      logger.info('✅ zk-SNARK verifier initialized successfully');
    } catch (zkError: any) {
      logger.warn('⚠️  zk-SNARK verifier not available (circuits not found)');
      // Continue sans zk-SNARK
    }

    // ... reste du code ...
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
```

Créer le fichier `backend/src/utils/circuitsDownloader.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import tar from 'tar';

const CIRCUITS_URL = process.env.CIRCUITS_DOWNLOAD_URL ||
  'https://github.com/x-univert/democratix/releases/download/circuits-v1.0.0/circuits.tar.gz';

const CIRCUITS_DIR = path.join(process.cwd(), 'circuits');
const CIRCUITS_MARKER = path.join(CIRCUITS_DIR, '.downloaded');

/**
 * Télécharge et extrait les circuits zk-SNARK si nécessaire
 */
export async function downloadAndExtractCircuits(): Promise<void> {
  try {
    // Vérifier si déjà téléchargé
    try {
      await fs.access(CIRCUITS_MARKER);
      logger.info('✅ Circuits already downloaded, skipping');
      return;
    } catch (e) {
      // Marker n'existe pas, continuer
    }

    // Vérifier si les fichiers essentiels existent
    const verificationKeyPath = path.join(
      CIRCUITS_DIR,
      'build',
      'valid_vote_verification_key.json'
    );

    try {
      await fs.access(verificationKeyPath);
      logger.info('✅ Circuits found locally, creating marker');
      await fs.writeFile(CIRCUITS_MARKER, new Date().toISOString());
      return;
    } catch (e) {
      // Fichiers n'existent pas, télécharger
    }

    logger.info('📥 Downloading zk-SNARK circuits...', { url: CIRCUITS_URL });

    // Créer le répertoire circuits
    await fs.mkdir(CIRCUITS_DIR, { recursive: true });

    // Télécharger l'archive
    const response = await fetch(CIRCUITS_URL);
    if (!response.ok) {
      throw new Error(`Failed to download circuits: ${response.statusText}`);
    }

    const tarPath = path.join(CIRCUITS_DIR, 'circuits.tar.gz');
    const fileStream = createWriteStream(tarPath);

    // @ts-ignore
    await pipeline(response.body, fileStream);

    logger.info('✅ Circuits downloaded, extracting...');

    // Extraire l'archive
    await tar.extract({
      file: tarPath,
      cwd: CIRCUITS_DIR,
    });

    // Supprimer l'archive
    await fs.unlink(tarPath);

    // Créer le marker
    await fs.writeFile(CIRCUITS_MARKER, new Date().toISOString());

    logger.info('✅ Circuits extracted successfully');
  } catch (error: any) {
    logger.error('❌ Failed to download/extract circuits', {
      error: error.message,
    });
    throw error;
  }
}
```

Installer la dépendance `tar`:

```bash
cd backend
npm install tar
npm install --save-dev @types/tar
```

Ajouter la variable d'environnement sur Railway:

```bash
CIRCUITS_DOWNLOAD_URL=https://github.com/x-univert/democratix/releases/download/circuits-v1.0.0/circuits.tar.gz
```

### Avantages de cette méthode:

✅ **Simple**: Upload une fois, téléchargé automatiquement
✅ **Rapide**: Compression réduit la taille (~10-50MB au lieu de 100MB+)
✅ **Résilient**: Si Railway redéploie, circuits re-téléchargés automatiquement
✅ **Versionné**: Peut changer l'URL pour mettre à jour les circuits
✅ **Gratuit**: GitHub Releases, IPFS, Google Drive = gratuits

### Inconvénients:

⚠️ **Temps de démarrage**: +30-60 secondes au premier démarrage
⚠️ **Public**: Si GitHub Release public, tout le monde peut télécharger (mais ce n'est pas secret)

## Méthode 3: Volume Railway + Deployment Script

Railway permet d'exécuter un script après le build:

### nixpacks.toml

Créer `nixpacks.toml` à la racine:

```toml
[phases.setup]
nixPkgs = ["nodejs", "wget", "tar"]

[phases.install]
cmds = [
    "cd backend && npm install"
]

[phases.build]
cmds = [
    "cd backend && npm run build",
    "mkdir -p circuits",
    "wget -O circuits.tar.gz $CIRCUITS_DOWNLOAD_URL",
    "tar -xzf circuits.tar.gz -C circuits",
    "rm circuits.tar.gz"
]

[start]
cmd = "cd backend && npm start"
```

Avantage: Circuits téléchargés pendant le build (pas au runtime).

Inconvénient: Build plus lent (+1-2 minutes).

## Comparaison des Méthodes

| Méthode | Complexité | Coût | Vitesse | Recommandé |
|---------|------------|------|---------|------------|
| **CLI Railway** | ⚠️ Difficile | Gratuit | Rapide | ❌ Non |
| **Download au démarrage** | ✅ Simple | Gratuit | -30s démarrage | ✅ **OUI** |
| **Build script** | ⚠️ Moyen | Gratuit | -1min build | ✅ Oui |
| **Volume manuel** | ❌ Très difficile | Gratuit | Rapide | ❌ Non |

## Recommandation Finale

**Utilisez la Méthode 2 (Download au démarrage)**:

1. ✅ La plus simple à implémenter
2. ✅ Fonctionne immédiatement
3. ✅ Pas besoin d'outils externes
4. ✅ Facile à mettre à jour (juste changer l'URL)

**Étapes rapides**:

```bash
# 1. Compresser les circuits
cd backend/circuits
tar -czf circuits.tar.gz build/

# 2. Upload sur GitHub Release (interface web)

# 3. Copier l'URL du fichier

# 4. Ajouter sur Railway:
# CIRCUITS_DOWNLOAD_URL=https://github.com/.../circuits.tar.gz

# 5. Redéployer Railway
```

**Temps total**: 10-15 minutes
