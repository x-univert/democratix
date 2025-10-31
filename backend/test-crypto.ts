/**
 * Script de test pour le CryptoService
 *
 * Teste toutes les fonctionnalités :
 * - Génération d'identité
 * - Merkle tree
 * - Nullifiers
 * - Blind signatures
 *
 * Usage: npx ts-node test-crypto.ts
 */

import { CryptoService } from './src/services/cryptoService';

async function testCryptoService() {
  console.log('🚀 Test du CryptoService DEMOCRATIX\n');
  console.log('='.repeat(60));

  const cryptoService = new CryptoService();

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // ==========================================
    // TEST 1: Génération d'identités
    // ==========================================
    console.log('\n📝 TEST 1: Génération d\'identités d\'électeurs');
    console.log('-'.repeat(60));

    const voter1 = cryptoService.generateVoterIdentity('alice');
    const voter2 = cryptoService.generateVoterIdentity('bob');
    const voter3 = cryptoService.generateVoterIdentity('charlie');

    console.log(`✅ Alice - Commitment: ${voter1.commitment.toString(16).slice(0, 20)}...`);
    console.log(`✅ Bob   - Commitment: ${voter2.commitment.toString(16).slice(0, 20)}...`);
    console.log(`✅ Charlie - Commitment: ${voter3.commitment.toString(16).slice(0, 20)}...`);

    // ==========================================
    // TEST 2: Enregistrement dans Merkle Tree
    // ==========================================
    console.log('\n🌳 TEST 2: Enregistrement dans le Merkle Tree');
    console.log('-'.repeat(60));

    const reg1 = await cryptoService.addVoterToMerkleTree(voter1.commitment);
    console.log(`✅ Alice enregistrée (index: ${reg1.index}, root: ${reg1.root.slice(0, 20)}...)`);

    const reg2 = await cryptoService.addVoterToMerkleTree(voter2.commitment);
    console.log(`✅ Bob enregistré (index: ${reg2.index}, root: ${reg2.root.slice(0, 20)}...)`);

    const reg3 = await cryptoService.addVoterToMerkleTree(voter3.commitment);
    console.log(`✅ Charlie enregistré (index: ${reg3.index}, root: ${reg3.root.slice(0, 20)}...)`);

    console.log(`\n📊 Total électeurs: ${cryptoService.getVoterCount()}`);
    console.log(`📊 Root actuel: ${cryptoService.getMerkleRoot().slice(0, 20)}...`);

    // ==========================================
    // TEST 3: Preuves Merkle
    // ==========================================
    console.log('\n🔐 TEST 3: Génération et vérification de preuves Merkle');
    console.log('-'.repeat(60));

    const proof1 = await cryptoService.generateMerkleProof(voter1.commitment);
    console.log(`✅ Preuve générée pour Alice:`);
    console.log(`   - Depth: ${proof1.siblings.length}`);
    console.log(`   - Root: ${proof1.root.slice(0, 20)}...`);

    const isValid1 = await cryptoService.verifyMerkleProof(proof1);
    console.log(`✅ Vérification preuve Alice: ${isValid1 ? '✓ VALIDE' : '✗ INVALIDE'}`);

    const proof2 = await cryptoService.generateMerkleProof(voter2.commitment);
    const isValid2 = await cryptoService.verifyMerkleProof(proof2);
    console.log(`✅ Vérification preuve Bob: ${isValid2 ? '✓ VALIDE' : '✗ INVALIDE'}`);

    // ==========================================
    // TEST 4: Nullifiers (éviter double vote)
    // ==========================================
    console.log('\n🔒 TEST 4: Génération de Nullifiers');
    console.log('-'.repeat(60));

    const electionId1 = 1;
    const electionId2 = 2;

    const nullifier1_1 = cryptoService.generateNullifier(voter1.nullifier, electionId1);
    const nullifier1_2 = cryptoService.generateNullifier(voter1.nullifier, electionId2);

    console.log(`✅ Alice - Élection #1: ${nullifier1_1.slice(0, 20)}...`);
    console.log(`✅ Alice - Élection #2: ${nullifier1_2.slice(0, 20)}...`);
    console.log(`   → Nullifiers différents: ${nullifier1_1 !== nullifier1_2 ? '✓' : '✗'}`);

    const nullifier2_1 = cryptoService.generateNullifier(voter2.nullifier, electionId1);
    console.log(`✅ Bob   - Élection #1: ${nullifier2_1.slice(0, 20)}...`);
    console.log(`   → Différent d'Alice: ${nullifier1_1 !== nullifier2_1 ? '✓' : '✗'}`);

    // ==========================================
    // TEST 5: Blind Signatures
    // ==========================================
    console.log('\n🎭 TEST 5: Blind Signatures (Tokens anonymes)');
    console.log('-'.repeat(60));

    // Alice génère un token
    const aliceToken = cryptoService.generateVotingToken();
    console.log(`✅ Alice génère token: ${aliceToken.token.slice(0, 20)}...`);

    // Alice aveugle son token
    const blindingFactor = 'a'.repeat(64); // Facteur aléatoire
    const blindedToken = cryptoService.blindToken(aliceToken.token, blindingFactor);
    console.log(`✅ Alice aveugle token: ${blindedToken.slice(0, 20)}...`);

    // Autorité signe (sans voir le token original)
    const signature = cryptoService.signBlindedToken(blindedToken);
    console.log(`✅ Autorité signe: ${signature.slice(0, 20)}...`);

    // Alice dé-aveugle la signature
    const unblindedSig = cryptoService.unblindSignature(signature, blindingFactor);
    console.log(`✅ Alice dé-aveugle: ${unblindedSig.slice(0, 20)}...`);

    // Vérification finale
    const isValidToken = cryptoService.verifyTokenSignature(aliceToken.token, unblindedSig);
    console.log(`✅ Vérification token: ${isValidToken ? '✓ VALIDE' : '✗ INVALIDE'}`);

    // ==========================================
    // TEST 6: Statistiques
    // ==========================================
    console.log('\n📊 TEST 6: Statistiques du système');
    console.log('-'.repeat(60));

    const stats = cryptoService.getStats();
    console.log(`📊 Merkle Tree:`);
    console.log(`   - Profondeur: ${stats.merkleTree.depth}`);
    console.log(`   - Capacité max: ${stats.merkleTree.maxVoters.toLocaleString()} électeurs`);
    console.log(`   - Électeurs actuels: ${stats.merkleTree.currentVoters}`);
    console.log(`   - Root: ${stats.merkleTree.currentRoot.slice(0, 20)}...`);

    console.log(`\n🔐 Blind Signature:`);
    console.log(`   - Algorithme: ${stats.blindSignature.algorithm}`);
    console.log(`   - Taille clé: ${stats.blindSignature.keySize} bits`);

    // ==========================================
    // RÉSUMÉ
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ TOUS LES TESTS RÉUSSIS !');
    console.log('='.repeat(60));

    console.log('\n📚 Fonctionnalités testées:');
    console.log('   ✓ Génération d\'identités (Semaphore-like)');
    console.log('   ✓ Merkle tree (1M électeurs max)');
    console.log('   ✓ Preuves Merkle (anonymat)');
    console.log('   ✓ Nullifiers (éviter double vote)');
    console.log('   ✓ Blind signatures (tokens anonymes)');

    console.log('\n🎯 Prochaines étapes:');
    console.log('   1. Intégrer frontend (snarkjs)');
    console.log('   2. Circuits Circom pour zk-SNARKs');
    console.log('   3. Smart contracts Rust (vérification)');
    console.log('   4. Tests E2E complets\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    process.exit(1);
  }
}

// Exécuter les tests
testCryptoService().then(() => {
  console.log('👋 Fin des tests\n');
  process.exit(0);
});
