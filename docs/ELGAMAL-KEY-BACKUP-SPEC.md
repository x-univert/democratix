# Spécification: Backup des Clés ElGamal

## Problème
Les clés privées ElGamal sont critiques. Si perdues = votes impossibles à déchiffrer.

## Solution: Double Backup

### 1. Railway Volume (Primaire)
- Stockage persistant local
- Accès rapide
- Survit aux redéploiements

### 2. IPFS/Pinata (Backup décentralisé)
- Backup chiffré sur IPFS
- Récupérable de n'importe où
- Immutable

## Implémentation

### Modification du KeyManagementService

```typescript
// backend/src/services/keyManagementService.ts

import { pinataService } from './pinataService';

export class KeyManagementService {
  // ... code existant ...

  /**
   * Sauvegarde une clé chiffrée (local + IPFS backup)
   */
  async saveEncryptedKey(
    electionId: number,
    encryptedData: EncryptedKeyData
  ): Promise<{ localPath: string; ipfsHash?: string }> {
    // 1. Sauvegarde locale (Railway Volume)
    const fileName = `election-${electionId}-key.json`;
    const filePath = path.join(KEYS_DIR, fileName);

    await fs.writeFile(
      filePath,
      JSON.stringify(encryptedData, null, 2),
      { mode: 0o600 } // Lecture/écriture propriétaire seulement
    );

    logger.info('✅ Encrypted private key stored', {
      electionId,
      filePath: filePath.replace(process.cwd(), ''),
    });

    // 2. Backup IPFS (optionnel mais recommandé)
    let ipfsHash: string | undefined;
    try {
      const buffer = Buffer.from(JSON.stringify(encryptedData));
      const result = await pinataService.uploadBuffer(
        buffer,
        `election-${electionId}-key-backup.json`
      );
      ipfsHash = result.IpfsHash;

      logger.info('✅ Encrypted key backed up to IPFS', {
        electionId,
        ipfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      });
    } catch (ipfsError: any) {
      logger.warn('⚠️  IPFS backup failed (continuing without backup)', {
        electionId,
        error: ipfsError.message,
      });
      // Continue sans bloquer si IPFS échoue
    }

    return { localPath: filePath, ipfsHash };
  }

  /**
   * Récupère une clé (local d'abord, puis IPFS backup si nécessaire)
   */
  async loadEncryptedKey(
    electionId: number,
    ipfsHash?: string
  ): Promise<EncryptedKeyData | null> {
    const fileName = `election-${electionId}-key.json`;
    const filePath = path.join(KEYS_DIR, fileName);

    // 1. Essayer local d'abord
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const keyData: EncryptedKeyData = JSON.parse(data);

      logger.info('✅ Loaded encrypted key from local storage', {
        electionId,
      });

      return keyData;
    } catch (localError: any) {
      logger.warn('⚠️  Local key not found', { electionId });

      // 2. Fallback: Essayer IPFS backup
      if (ipfsHash) {
        try {
          logger.info('🔄 Attempting to restore key from IPFS backup...', {
            electionId,
            ipfsHash,
          });

          const response = await fetch(
            `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
          );

          if (!response.ok) {
            throw new Error(`IPFS fetch failed: ${response.statusText}`);
          }

          const keyData: EncryptedKeyData = await response.json();

          // Sauvegarder localement pour la prochaine fois
          await fs.writeFile(
            filePath,
            JSON.stringify(keyData, null, 2),
            { mode: 0o600 }
          );

          logger.info('✅ Key restored from IPFS backup', {
            electionId,
            ipfsHash,
          });

          return keyData;
        } catch (ipfsError: any) {
          logger.error('❌ Failed to restore key from IPFS', {
            electionId,
            ipfsHash,
            error: ipfsError.message,
          });
        }
      }
    }

    logger.error('❌ No encrypted key found (local or IPFS)', { electionId });
    return null;
  }
}
```

### Modification de l'API ElectionController

```typescript
// backend/src/controllers/electionController.ts

export const setupElGamalEncryption = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { electionId } = req.params;
    const { organizerAddress } = req.body;

    // ... génération des clés ElGamal ...

    // Chiffrer et sauvegarder la clé privée
    const encryptedData = await keyManagementService.encryptPrivateKey(
      privateKey,
      Number(electionId)
    );

    const { localPath, ipfsHash } = await keyManagementService.saveEncryptedKey(
      Number(electionId),
      encryptedData
    );

    // Stocker le hash IPFS dans la DB pour récupération future
    if (ipfsHash) {
      await storeIPFSBackupHash(Number(electionId), ipfsHash);
    }

    // Retourner au frontend
    res.status(200).json({
      success: true,
      publicKey: publicKeyHex,
      backups: {
        local: true,
        ipfs: !!ipfsHash,
        ipfsHash: ipfsHash,
      },
      message: ipfsHash
        ? 'Clé générée et sauvegardée (local + IPFS backup)'
        : 'Clé générée et sauvegardée (local uniquement)',
    });
  } catch (error: any) {
    logger.error('❌ Failed to setup ElGamal encryption', { error });
    res.status(500).json({ error: error.message });
  }
};
```

### Stockage du hash IPFS

Ajouter un champ dans la base de données des élections:

```typescript
// backend/src/models/election.ts (ou wherever you store election data)

interface ElectionMetadata {
  electionId: number;
  ipfsBackupHash?: string; // Hash IPFS du backup de la clé privée
  createdAt: Date;
}

// Sauvegarder dans un fichier JSON (simple) ou PostgreSQL (mieux)
const METADATA_FILE = path.join(process.cwd(), '.secure-keys', 'metadata.json');

async function storeIPFSBackupHash(
  electionId: number,
  ipfsHash: string
): Promise<void> {
  try {
    let metadata: Record<number, ElectionMetadata> = {};

    // Charger metadata existante
    try {
      const data = await fs.readFile(METADATA_FILE, 'utf8');
      metadata = JSON.parse(data);
    } catch (e) {
      // Fichier n'existe pas encore
    }

    // Ajouter/mettre à jour
    metadata[electionId] = {
      electionId,
      ipfsBackupHash: ipfsHash,
      createdAt: new Date(),
    };

    // Sauvegarder
    await fs.writeFile(
      METADATA_FILE,
      JSON.stringify(metadata, null, 2),
      { mode: 0o600 }
    );

    logger.info('✅ IPFS backup hash stored', { electionId, ipfsHash });
  } catch (error) {
    logger.error('Failed to store IPFS backup hash', { error });
  }
}

async function getIPFSBackupHash(
  electionId: number
): Promise<string | undefined> {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf8');
    const metadata: Record<number, ElectionMetadata> = JSON.parse(data);
    return metadata[electionId]?.ipfsBackupHash;
  } catch (e) {
    return undefined;
  }
}
```

## Flux Complet

### 1. Génération de clé (organisateur)
```
Frontend: "Générer clés ElGamal"
    ↓
Backend: Génère paire de clés
    ↓
Backend: Chiffre clé privée avec MASTER_KEY_PASSWORD
    ↓
Backend: Sauvegarde local (.secure-keys/election-80-key.json)
    ↓
Backend: Upload backup chiffré sur IPFS
    ↓
Backend: Stocke hash IPFS dans metadata.json
    ↓
Frontend: Affiche succès + "Backup IPFS: ✅"
```

### 2. Déchiffrement des votes (fin d'élection)
```
Frontend: "Déchiffrer les votes"
    ↓
Backend: Cherche clé dans .secure-keys/
    ↓
Backend: [Si trouvé] Déchiffre avec MASTER_KEY_PASSWORD → OK
    ↓
Backend: [Si non trouvé] Récupère hash IPFS depuis metadata.json
    ↓
Backend: Télécharge backup depuis IPFS
    ↓
Backend: Sauvegarde localement pour cache
    ↓
Backend: Déchiffre avec MASTER_KEY_PASSWORD → OK
```

## Sécurité

### ✅ Ce qui est chiffré:
- Clé privée ElGamal (AES-256-GCM)
- Mot de passe maître requis pour déchiffrer

### ✅ Ce qui est public (sans risque):
- Hash IPFS du backup (car le backup est chiffré)
- Clé publique ElGamal (utilisée pour chiffrer les votes)

### ⚠️ Ce qui doit être secret:
- `MASTER_KEY_PASSWORD` (ne JAMAIS le commit dans Git!)
- Accès au Railway Dashboard (seuls les admins)

## Récupération d'urgence

Si Railway Volume est corrompu:

1. Allez sur `https://gateway.pinata.cloud/ipfs/{ipfsHash}`
2. Téléchargez le fichier JSON
3. Uploadez-le manuellement dans `.secure-keys/`
4. Ou utilisez l'API de récupération (à implémenter)

## Coûts

- **Railway Volume**: Gratuit jusqu'à 1GB
- **IPFS/Pinata**: Gratuit jusqu'à 1GB (largement suffisant pour clés)
- **Backup par clé**: ~2KB (500 élections = 1MB)

## Recommandations

1. **Toujours activer le backup IPFS** en production
2. **Tester la récupération** régulièrement
3. **Monitorer l'espace disque** du Volume Railway
4. **Rotation du MASTER_KEY_PASSWORD** tous les 6 mois (nécessite re-chiffrement)
