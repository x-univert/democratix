/**
 * Create Test Election Tool
 * Crée une élection de test avec tous les paramètres
 */

export async function createTestElectionTool(args: any) {
  const {
    title,
    numCandidates,
    encryptionType,
    durationHours = 1,
    requiresRegistration = false
  } = args;

  try {
    const encryptionLabels = {
      0: 'Standard (Public)',
      1: 'Chiffré ElGamal',
      2: 'Chiffré ElGamal + zk-SNARK'
    };

    // Generate test candidates
    const candidates = [];
    const candidateNames = ['Alice Dupont', 'Bob Martin', 'Charlie Durand', 'Diana Lopez', 'Eve Chen'];
    const parties = ['Parti A', 'Parti B', 'Parti C', 'Indépendant', 'Parti D'];
    const bios = [
      'Candidate progressiste avec 10 ans d\'expérience en gouvernance',
      'Candidat conservateur, ancien maire de la ville',
      'Entrepreneur tech, défenseur de l\'innovation',
      'Activiste social, champion des droits civiques',
      'Économiste, spécialiste en finance publique'
    ];

    for (let i = 0; i < numCandidates; i++) {
      candidates.push({
        name: candidateNames[i],
        biography: bios[i],
        metadata: {
          party: parties[i],
          experience: `${5 + i * 2} ans`,
          website: `https://${candidateNames[i].toLowerCase().replace(' ', '')}.example.com`
        }
      });
    }

    // Generate election metadata
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000); // Dans 5 minutes
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    const electionMetadata = {
      title,
      description: `Élection de test - ${encryptionLabels[encryptionType as keyof typeof encryptionLabels]}`,
      organization: 'DEMOCRATIX Team',
      type: 'test',
      encryptionType,
      candidates,
      dates: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        createdAt: now.toISOString()
      },
      settings: {
        requiresRegistration,
        allowAbstention: true,
        maxVotesPerVoter: 1
      }
    };

    // Generate ElGamal keys if needed
    let elgamalKeys = null;
    if (encryptionType === 1 || encryptionType === 2) {
      const { secp256k1 } = await import('@noble/curves/secp256k1');
      const { randomBytes } = await import('@noble/hashes/utils');

      const privateKeyBytes = randomBytes(32);
      const privateKeyBigInt = BigInt('0x' + Buffer.from(privateKeyBytes).toString('hex'));
      const G = secp256k1.ProjectivePoint.BASE;
      const publicKeyPoint = G.multiply(privateKeyBigInt);

      elgamalKeys = {
        publicKey: publicKeyPoint.toHex(true),
        privateKey: privateKeyBigInt.toString(16).padStart(64, '0')
      };
    }

    // Build result
    let result = `✅ **Élection de Test Créée**\n\n`;
    result += `**Titre**: ${title}\n`;
    result += `**Type**: ${encryptionLabels[encryptionType as keyof typeof encryptionLabels]}\n`;
    result += `**Candidats**: ${numCandidates}\n`;
    result += `**Durée**: ${durationHours}h\n`;
    result += `**Inscription requise**: ${requiresRegistration ? 'Oui' : 'Non'}\n\n`;

    result += `**Dates**:\n`;
    result += `- Début: ${startTime.toLocaleString('fr-FR')}\n`;
    result += `- Fin: ${endTime.toLocaleString('fr-FR')}\n\n`;

    if (elgamalKeys) {
      result += `**🔑 Clés ElGamal Générées**:\n\n`;
      result += `Clé Publique:\n\`\`\`\n${elgamalKeys.publicKey}\n\`\`\`\n\n`;
      result += `Clé Privée (⚠️ SECRÈTE):\n\`\`\`\n${elgamalKeys.privateKey}\n\`\`\`\n\n`;
    }

    result += `**Candidats**:\n`;
    candidates.forEach((c, i) => {
      result += `${i + 1}. **${c.name}** (${c.metadata.party})\n`;
      result += `   ${c.biography}\n\n`;
    });

    result += `**Métadonnées IPFS**:\n\`\`\`json\n${JSON.stringify(electionMetadata, null, 2)}\n\`\`\`\n\n`;

    result += `**Prochaines Étapes**:\n`;
    result += `1. Uploadez les métadonnées sur IPFS: \`upload_to_ipfs\`\n`;
    result += `2. Créez l'élection sur ${process.env.FRONTEND_URL}/create\n`;
    if (elgamalKeys) {
      result += `3. Utilisez la clé publique lors de la création\n`;
      result += `4. Conservez la clé privée pour le déchiffrement\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ],
      _metadata: {
        electionMetadata,
        elgamalKeys
      }
    };
  } catch (error) {
    throw new Error(`Failed to create test election: ${error instanceof Error ? error.message : String(error)}`);
  }
}
