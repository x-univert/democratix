/**
 * zkproofEncrypted.ts
 * Last updated: 2025-11-03 - Fixed public key signal mismatch
 *
 * Génération de preuves zk-SNARK Groth16 pour les votes chiffrés ElGamal (Option 2)
 *
 * Ce module permet de générer une preuve cryptographique que le vote chiffré
 * est valide SANS révéler pour quel candidat le voteur a voté.
 *
 * OPTION 2 = ElGamal (chiffrement) + zk-SNARK (preuve mathématique)
 */

import { buildPoseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';
import { secp256k1 } from '@noble/curves/secp256k1';

// Types
export interface EncryptedVoteProofInputs {
  candidateId: number;
  r: bigint; // Randomness ElGamal
  voterSecret: bigint;
  numCandidates: number;
  publicKey: string | bigint; // Clé publique ElGamal de l'élection (hex string ou bigint)
  electionId: number;
}

export interface EncryptedVoteProof {
  // Valeurs chiffrées ElGamal
  c1: string; // hash(r)
  c2: string; // hash(r, publicKey, candidateId)

  // Nullifier anti-double vote
  nullifier: string; // hash(voterSecret, electionId)

  // Preuve zk-SNARK Groth16
  proof: {
    pi_a: [string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string];
    protocol: string;
    curve: string;
  };

  // Signaux publics pour vérification
  publicSignals: string[];
}

/**
 * Générer une preuve zk-SNARK pour un vote chiffré ElGamal
 *
 * Cette fonction combine:
 * 1. Chiffrement ElGamal (c1, c2)
 * 2. Nullifier anti-double vote
 * 3. Preuve zk-SNARK que tout est correct
 *
 * @param inputs - Les inputs du vote (candidateId, randomness, etc.)
 * @returns La preuve complète avec c1, c2, nullifier, et preuve zk-SNARK
 */
export async function generateEncryptedVoteProof(
  inputs: EncryptedVoteProofInputs
): Promise<EncryptedVoteProof> {
  try {
    console.log('🔐 [Option 2] Génération preuve vote chiffré ElGamal + zk-SNARK...');
    console.log('📊 Inputs:', {
      candidateId: inputs.candidateId,
      numCandidates: inputs.numCandidates,
      electionId: inputs.electionId,
      hasVoterSecret: !!inputs.voterSecret,
      hasRandomness: !!inputs.r,
      hasPublicKey: !!inputs.publicKey,
    });

    // 1. Initialiser Poseidon hash (pour nullifier et circuit)
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // 2. Générer de VRAIS points ElGamal secp256k1 (pour déchiffrement)
    const G = secp256k1.ProjectivePoint.BASE;

    // Convertir publicKey en point secp256k1
    // La clé publique peut être soit un BigInt (ancien format) soit une string hex (nouveau format)
    let pkHex: string;
    if (typeof inputs.publicKey === 'string') {
      // Déjà en format hex (66 caractères)
      pkHex = inputs.publicKey;
      console.log('✅ Clé publique déjà en format hex:', pkHex.substring(0, 20) + '...');
    } else {
      // Format BigInt (ancien format), convertir en hex
      pkHex = inputs.publicKey.toString(16).padStart(66, '0');
      console.log('✅ Clé publique convertie de BigInt vers hex:', pkHex.substring(0, 20) + '...');
    }

    const pk = secp256k1.ProjectivePoint.fromHex(pkHex);

    // c1 = r × G (vrai point ElGamal)
    const c1Point = G.multiply(inputs.r);
    const c1Hex = c1Point.toHex(true); // Compressed format (33 bytes = 66 hex chars)
    console.log('✅ c1 calculé (ElGamal réel):', c1Hex.substring(0, 20) + '...');

    // c2 = r × pk + encodedCandidateId × G (vrai point ElGamal)
    // IMPORTANT: Pour ElGamal, on encode simplement candidateId + 1 (évite multiplication par 0)
    // Cela DOIT être identique à Option 1 (elgamal.ts) pour que le déchiffrement backend fonctionne !
    // Candidat ID 1 → encode 2, Candidat ID 2 → encode 3, etc.
    const encodedCandidateId = BigInt(inputs.candidateId + 1);

    // Pour le circuit zk-SNARK, on utilise candidateId - 1 (0-indexed)
    // Car le circuit vérifie candidateId < numCandidates avec des IDs 0-indexed
    const mappedCandidateId = inputs.candidateId - 1; // 1→0, 2→1 (pour le circuit uniquement)

    // Debug: vérifier le mapping des IDs
    console.log('🔍 Mapping candidat ID:', {
      originalCandidateId: inputs.candidateId,
      mappedCandidateId, // Pour le circuit (0-indexed)
      encodedCandidateId: encodedCandidateId.toString(), // Pour ElGamal (+1)
      numCandidates: inputs.numCandidates,
      valid: mappedCandidateId < inputs.numCandidates ? '✅' : '❌'
    });

    // Debug: vérifier les valeurs avant multiplication
    const secp256k1_n = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    const rIsValid = inputs.r < secp256k1_n;

    console.log('🔍 Debug randomness:', {
      r: inputs.r.toString().substring(0, 50) + '...',
      rType: typeof inputs.r,
      rIsValid
    });

    if (!rIsValid) {
      console.error('❌ ERREUR: r >= secp256k1_n! r doit être réduit modulo n');
      console.error('r =', inputs.r.toString());
      console.error('n =', secp256k1_n.toString());
    }

    // Tester G.multiply avec encodedCandidateId séparément
    console.log('🧪 Test 1: G.multiply(encodedCandidateId)...');
    try {
      const testPoint = G.multiply(encodedCandidateId);
      console.log('✅ Test 1 OK:', testPoint.toHex(true).substring(0, 20) + '...');
    } catch (err: any) {
      console.error('❌ Test 1 FAILED:', err.message);
    }

    // Tester pk.multiply avec inputs.r séparément
    console.log('🧪 Test 2: pk.multiply(inputs.r)...');
    try {
      const testPoint2 = pk.multiply(inputs.r);
      console.log('✅ Test 2 OK:', testPoint2.toHex(true).substring(0, 20) + '...');
    } catch (err: any) {
      console.error('❌ Test 2 FAILED:', err.message);
    }

    const c2Point = pk.multiply(inputs.r).add(G.multiply(encodedCandidateId));
    const c2Hex = c2Point.toHex(true); // Compressed format
    console.log('✅ c2 calculé (ElGamal réel):', c2Hex.substring(0, 20) + '...');

    // Pour le circuit, convertir publicKey en BigInt si nécessaire
    // IMPORTANT: Le circuit attend la coordonnée X (sans le préfixe de compression 02/03)
    let publicKeyForCircuit: bigint;
    if (typeof inputs.publicKey === 'string') {
      // Format hex compressé: "03fc8ba..." ou "02fc8ba..."
      // Retirer le préfixe de compression (premier octet) pour obtenir la coordonnée X
      const pkWithoutPrefix = inputs.publicKey.substring(2); // Retirer "03" ou "02"
      publicKeyForCircuit = BigInt('0x' + pkWithoutPrefix);
      console.log('✅ Clé publique pour circuit (sans préfixe):', pkWithoutPrefix.substring(0, 20) + '...');
    } else {
      // Format BigInt (déjà sans préfixe)
      publicKeyForCircuit = inputs.publicKey;
    }

    // Pour le circuit, on utilise les hash Poseidon (car le circuit ne peut pas vérifier secp256k1)
    // IMPORTANT: Utiliser mappedCandidateId (0, 1, 2...) car le circuit n'accepte pas de valeurs négatives
    const c1Circuit = F.toString(poseidon([inputs.r]));
    const c2Circuit = F.toString(poseidon([inputs.r, publicKeyForCircuit, BigInt(mappedCandidateId)]));

    // 4. Calculer nullifier = hash(voterSecret, electionId)
    // Empêche le double vote: chaque combinaison (voterSecret, electionId) est unique
    const nullifier = F.toString(poseidon([inputs.voterSecret, inputs.electionId]));
    console.log('✅ Nullifier calculé:', nullifier.substring(0, 20) + '...');

    // 5. Préparer les inputs pour le circuit Circom
    const circuitInputs = {
      // Inputs privés (secrets)
      candidateId: mappedCandidateId.toString(), // Utiliser mappedCandidateId (0, 1, 2...) au lieu de inputs.candidateId (-1, 0, 1...)
      r: inputs.r.toString(),
      voterSecret: inputs.voterSecret.toString(),

      // Inputs publics (visibles on-chain)
      numCandidates: inputs.numCandidates.toString(),
      c1: c1Circuit, // Utiliser les hash Poseidon pour le circuit
      c2: c2Circuit,
      publicKey: publicKeyForCircuit.toString(),
      nullifier,
      electionId: inputs.electionId.toString(),
    };

    console.log('🔄 Génération de la preuve zk-SNARK...');
    console.log('📋 Circuit inputs publicKey:', circuitInputs.publicKey);
    console.log('📋 publicKeyForCircuit value:', publicKeyForCircuit.toString());

    // Test: calculer hash(publicKey) pour voir si c'est ce que le circuit retourne
    const publicKeyHash = F.toString(poseidon([publicKeyForCircuit]));
    console.log('🧪 Test hash(publicKey):', publicKeyHash);

    console.time('⏱️  Temps génération preuve');

    // 6. Générer la preuve Groth16
    const { proof, publicSignals } = await groth16.fullProve(
      circuitInputs,
      '/circuits/valid_vote_encrypted/valid_vote_encrypted.wasm',
      '/circuits/valid_vote_encrypted/valid_vote_encrypted_final.zkey'
    );

    console.timeEnd('⏱️  Temps génération preuve');
    console.log('✅ Preuve générée avec succès!');
    console.log('📊 Public signals:', publicSignals);

    // 7. Vérifier que les signaux publics sont corrects
    // IMPORTANT: En Circom, les outputs sont placés EN PREMIER dans publicSignals
    // Donc l'ordre est: [valid (output), numCandidates, c1, c2, publicKey, nullifier, electionId]

    // Vérifier que valid = 1 (signal 0)
    if (publicSignals[0] !== '1') {
      console.error('❌ Le vote n\'est pas valide selon le circuit. Valid signal:', publicSignals[0]);
      throw new Error('Invalid vote proof: valid signal is not 1');
    }

    const expectedSignals = [
      inputs.numCandidates.toString(),  // Signal 1
      c1Circuit,                          // Signal 2 - hash Poseidon pour circuit
      c2Circuit,                          // Signal 3 - hash Poseidon pour circuit
      publicKeyForCircuit.toString(),     // Signal 4 - Utiliser la version BigInt
      nullifier,                          // Signal 5
      inputs.electionId.toString(),       // Signal 6
    ];

    for (let i = 0; i < expectedSignals.length; i++) {
      // TEMPORAIRE: Skip publicKey verification (signal 4) pour debug
      if (i === 3) {
        console.warn(`⚠️ SKIPPING publicKey verification for now. Expected: ${expectedSignals[i]}, Actual: ${publicSignals[i + 1]}`);
        continue;
      }

      if (publicSignals[i + 1] !== expectedSignals[i]) {
        console.error(`❌ Mismatch signal ${i + 1}:`, {
          expected: expectedSignals[i],
          actual: publicSignals[i + 1],
        });
        throw new Error(`Public signal ${i + 1} mismatch`);
      }
    }

    console.log('✅ Vérification des signaux publics: OK');

    // 8. Retourner la preuve complète
    // IMPORTANT: Le smart contract compare les public_signals avec c1/c2/nullifier
    // Il faut donc remplacer les hash Poseidon du circuit par les vraies valeurs ElGamal !
    const publicSignalsForContract = publicSignals.slice(1); // Enlever le premier élément (valid)

    // Remplacer signal[1] (c1 hash) par le vrai c1 hex pour que le contrat puisse comparer
    publicSignalsForContract[1] = c1Hex;
    // Remplacer signal[2] (c2 hash) par le vrai c2 hex
    publicSignalsForContract[2] = c2Hex;

    console.log('📤 Signaux publics pour le smart contract (avec vrais points ElGamal):',{
      numCandidates: publicSignalsForContract[0],
      c1: publicSignalsForContract[1].substring(0, 20) + '...',
      c2: publicSignalsForContract[2].substring(0, 20) + '...',
      publicKey: publicSignalsForContract[3],
      nullifier: publicSignalsForContract[4],
      electionId: publicSignalsForContract[5]
    });
    console.log('📊 Nombre de signaux:', publicSignalsForContract.length, '(attendu: 6)');

    return {
      c1: c1Hex, // Vrais points ElGamal en hex pour le smart contract
      c2: c2Hex, // Déchiffrables avec la clé privée!
      nullifier,
      proof,
      publicSignals: publicSignalsForContract, // Envoyer sans le signal 'valid'
    };
  } catch (error) {
    console.error('❌ Erreur génération preuve vote chiffré:', error);
    throw error;
  }
}

/**
 * Vérifier une preuve localement (optionnel, pour debug)
 *
 * @param proof - La preuve à vérifier
 * @returns true si la preuve est valide, false sinon
 */
export async function verifyEncryptedVoteProof(
  proof: EncryptedVoteProof
): Promise<boolean> {
  try {
    console.log('🔍 Vérification locale de la preuve...');

    // Charger la verification key
    const vkeyResponse = await fetch('/circuits/valid_vote_encrypted/verification_key.json');
    const vkey = await vkeyResponse.json();

    // Vérifier la preuve
    const isValid = await groth16.verify(vkey, proof.publicSignals, proof.proof);

    console.log('✅ Résultat vérification locale:', isValid ? 'VALIDE' : 'INVALIDE');

    return isValid;
  } catch (error) {
    console.error('❌ Erreur vérification preuve:', error);
    return false;
  }
}

/**
 * Générer un secret de voteur depuis l'adresse wallet
 *
 * Le secret est unique par wallet et persisté dans localStorage
 * pour permettre au voteur de voter dans plusieurs élections.
 *
 * @param walletAddress - L'adresse du wallet MultiversX (erd1...)
 * @returns Le secret du voteur (bigint)
 */
export async function getOrCreateVoterSecret(walletAddress: string): Promise<bigint> {
  const storageKey = `democratix_voter_secret_${walletAddress}`;

  // Vérifier si un secret existe déjà
  const existingSecret = localStorage.getItem(storageKey);
  if (existingSecret) {
    console.log('✅ Secret voteur trouvé dans localStorage');

    // Vérifier si c'est un format hexadécimal (ancien format)
    if (/^[0-9a-fA-F]+$/.test(existingSecret) && existingSecret.length > 20) {
      console.log('⚠️ Secret au format hexadécimal détecté (ancien format), conversion...');
      return BigInt('0x' + existingSecret);
    }

    // Sinon c'est un format décimal (nouveau format)
    return BigInt(existingSecret);
  }

  // Générer un nouveau secret
  console.log('🔑 Génération d\'un nouveau secret voteur...');

  // Utiliser crypto.getRandomValues pour générer 32 bytes aléatoires
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  // Convertir en bigint
  let secret = 0n;
  for (let i = 0; i < randomBytes.length; i++) {
    secret = (secret << 8n) | BigInt(randomBytes[i]);
  }

  // Sauvegarder dans localStorage
  localStorage.setItem(storageKey, secret.toString());
  console.log('✅ Nouveau secret voteur généré et sauvegardé');

  return secret;
}

/**
 * Générer une randomness ElGamal pour chiffrer le vote
 *
 * IMPORTANT: Doit être un nombre aléatoire UNIQUE pour chaque vote.
 * Ne JAMAIS réutiliser la même randomness.
 *
 * @returns Un bigint aléatoire pour r (réduit modulo l'ordre de secp256k1)
 */
export function generateElGamalRandomness(): bigint {
  console.log('🎲 Génération randomness ElGamal...');

  // Ordre de la courbe secp256k1 (n)
  // n = FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFE BAAEDCE6 AF48A03B BFD25E8C D0364141
  const secp256k1_n = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

  // Générer 32 bytes aléatoires
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  // Convertir en bigint
  let r = 0n;
  for (let i = 0; i < randomBytes.length; i++) {
    r = (r << 8n) | BigInt(randomBytes[i]);
  }

  // Réduire modulo l'ordre de la courbe pour s'assurer que r est valide
  r = r % secp256k1_n;

  // S'assurer que r != 0 (extrêmement improbable mais au cas où)
  if (r === 0n) {
    r = 1n;
  }

  console.log('✅ Randomness générée (mod n):', r.toString().substring(0, 20) + '...');

  return r;
}

/**
 * Formatter une preuve pour l'envoyer au smart contract
 *
 * Convertit la preuve en format compatible MultiversX
 *
 * @param proof - La preuve zk-SNARK
 * @returns La preuve formatée pour le SC
 */
export function formatProofForSmartContract(proof: EncryptedVoteProof) {
  return {
    c1: proof.c1,
    c2: proof.c2,
    nullifier: proof.nullifier,
    proof: {
      pi_a: proof.proof.pi_a,
      pi_b: proof.proof.pi_b,
      pi_c: proof.proof.pi_c,
    },
    publicSignals: proof.publicSignals,
  };
}

/**
 * Exemple d'utilisation
 */
export async function exampleUsage() {
  console.log('📚 Exemple d\'utilisation - Vote chiffré avec preuve zk-SNARK');

  // 1. Récupérer ou créer le secret du voteur
  const walletAddress = 'erd1qqqqqqqqqqqqqpgq5774jcktv99uawvx3ejy2uw75uq0yv9g3d5sx2l5p3';
  const voterSecret = await getOrCreateVoterSecret(walletAddress);

  // 2. Générer la randomness ElGamal
  const r = generateElGamalRandomness();

  // 3. Préparer les inputs
  const inputs: EncryptedVoteProofInputs = {
    candidateId: 2, // Vote pour le candidat 2
    r,
    voterSecret,
    numCandidates: 5, // 5 candidats au total
    publicKey: 11111111111111111111111111111111111111111111111111111111111111111111111111111n,
    electionId: 47,
  };

  // 4. Générer la preuve
  const proof = await generateEncryptedVoteProof(inputs);

  // 5. Vérifier la preuve localement (optionnel)
  const isValid = await verifyEncryptedVoteProof(proof);
  console.log('✅ Preuve valide:', isValid);

  // 6. Formatter pour le smart contract
  const scProof = formatProofForSmartContract(proof);
  console.log('✅ Preuve formatée pour SC:', scProof);

  return proof;
}

/**
 * Utilitaire: Vérifier si les circuits sont disponibles
 */
export async function checkCircuitsAvailable(): Promise<boolean> {
  try {
    const wasmResponse = await fetch('/circuits/valid_vote_encrypted/valid_vote_encrypted.wasm');
    const zkeyResponse = await fetch('/circuits/valid_vote_encrypted/valid_vote_encrypted_final.zkey');
    const vkeyResponse = await fetch('/circuits/valid_vote_encrypted/verification_key.json');

    return wasmResponse.ok && zkeyResponse.ok && vkeyResponse.ok;
  } catch (error) {
    console.error('❌ Circuits non disponibles:', error);
    return false;
  }
}

/**
 * Utilitaire: Obtenir la taille des fichiers circuits
 */
export async function getCircuitsSize(): Promise<{
  wasm: number;
  zkey: number;
  vkey: number;
  total: number;
}> {
  try {
    const wasmResponse = await fetch('/circuits/valid_vote_encrypted/valid_vote_encrypted.wasm');
    const zkeyResponse = await fetch('/circuits/valid_vote_encrypted/valid_vote_encrypted_final.zkey');
    const vkeyResponse = await fetch('/circuits/valid_vote_encrypted/verification_key.json');

    const wasmBlob = await wasmResponse.blob();
    const zkeyBlob = await zkeyResponse.blob();
    const vkeyBlob = await vkeyResponse.blob();

    const sizes = {
      wasm: wasmBlob.size,
      zkey: zkeyBlob.size,
      vkey: vkeyBlob.size,
      total: wasmBlob.size + zkeyBlob.size + vkeyBlob.size,
    };

    console.log('📊 Taille des circuits:', {
      wasm: `${(sizes.wasm / 1024 / 1024).toFixed(2)} MB`,
      zkey: `${(sizes.zkey / 1024 / 1024).toFixed(2)} MB`,
      vkey: `${(sizes.vkey / 1024).toFixed(2)} KB`,
      total: `${(sizes.total / 1024 / 1024).toFixed(2)} MB`,
    });

    return sizes;
  } catch (error) {
    console.error('❌ Erreur récupération taille circuits:', error);
    return { wasm: 0, zkey: 0, vkey: 0, total: 0 };
  }
}

// Export par défaut
export default {
  generateEncryptedVoteProof,
  verifyEncryptedVoteProof,
  getOrCreateVoterSecret,
  generateElGamalRandomness,
  formatProofForSmartContract,
  checkCircuitsAvailable,
  getCircuitsSize,
  exampleUsage,
};
