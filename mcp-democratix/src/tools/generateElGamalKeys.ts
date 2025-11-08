/**
 * Generate ElGamal Keys Tool
 * Génère une paire de clés ElGamal (publique/privée) pour chiffrement
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { randomBytes } from '@noble/hashes/utils';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function generateElGamalKeysTool(args: any) {
  const { saveToFile = false } = args;

  try {
    // Generate random private key (32 bytes)
    const privateKeyBytes = randomBytes(32);
    const privateKeyBigInt = BigInt('0x' + Buffer.from(privateKeyBytes).toString('hex'));

    // Generate public key: pk = sk × G
    const G = secp256k1.ProjectivePoint.BASE;
    const publicKeyPoint = G.multiply(privateKeyBigInt);

    // Convert to hex strings
    const privateKey = privateKeyBigInt.toString(16).padStart(64, '0');
    const publicKey = publicKeyPoint.toHex(true); // Compressed format

    const result = {
      publicKey,
      privateKey,
      curve: 'secp256k1',
      format: 'hex',
      warning: '⚠️  GARDEZ LA CLÉ PRIVÉE SECRÈTE ! Nécessaire pour déchiffrer les votes.'
    };

    // Save to file if requested
    if (saveToFile) {
      const keysDir = join(process.cwd(), '.secure-keys');

      try {
        mkdirSync(keysDir, { recursive: true });

        const timestamp = Date.now();
        const filename = `elgamal-keys-${timestamp}.json`;
        const filepath = join(keysDir, filename);

        writeFileSync(
          filepath,
          JSON.stringify(result, null, 2),
          { mode: 0o600 } // Read/write for owner only
        );

        return {
          content: [
            {
              type: 'text',
              text: `🔑 **Clés ElGamal Générées**\n\n` +
                    `**Clé Publique** (à partager):\n\`\`\`\n${publicKey}\n\`\`\`\n\n` +
                    `**Clé Privée** (⚠️ SECRÈTE !):\n\`\`\`\n${privateKey}\n\`\`\`\n\n` +
                    `**Sauvegardé** dans: \`${filepath}\`\n\n` +
                    `✅ Utilisez la clé publique lors de la création de l'élection\n` +
                    `🔐 Conservez la clé privée pour déchiffrer les votes après finalisation`
            }
          ]
        };
      } catch (err) {
        // If save fails, still return keys
        console.error('Failed to save keys to file:', err);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `🔑 **Clés ElGamal Générées**\n\n` +
                `**Clé Publique** (à partager):\n\`\`\`\n${publicKey}\n\`\`\`\n\n` +
                `**Clé Privée** (⚠️ SECRÈTE !):\n\`\`\`\n${privateKey}\n\`\`\`\n\n` +
                `**Courbe**: ${result.curve}\n` +
                `**Format**: ${result.format}\n\n` +
                `${result.warning}\n\n` +
                `💡 Passez \`saveToFile: true\` pour sauvegarder dans .secure-keys/`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to generate ElGamal keys: ${error instanceof Error ? error.message : String(error)}`);
  }
}
