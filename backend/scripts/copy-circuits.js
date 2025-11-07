/**
 * Script pour copier les fichiers de circuits zk-SNARK dans dist/
 *
 * Ce script copie uniquement les verification keys nécessaires pour la vérification
 * des preuves zk-SNARK. Les fichiers WASM et zkey (lourds) restent côté frontend.
 */

const fs = require('fs');
const path = require('path');

// Fonction pour créer un dossier s'il n'existe pas
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

// Fonction pour copier un fichier
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`✅ Copied: ${path.basename(source)}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not copy ${path.basename(source)}: ${error.message}`);
    return false;
  }
}

console.log('📦 Copying zk-SNARK circuit files...');

// Chemins source et destination
const circuitsBuildDir = path.join(__dirname, '../circuits/build');
const distCircuitsDir = path.join(__dirname, '../dist/circuits/build');

// Créer le dossier de destination
ensureDirectoryExists(distCircuitsDir);

// Liste des fichiers à copier (uniquement les verification keys)
const filesToCopy = [
  'valid_vote_verification_key.json',
  'voter_eligibility_simple_verification_key.json'
];

let copiedCount = 0;
let totalFiles = filesToCopy.length;

// Copier chaque fichier
filesToCopy.forEach(fileName => {
  const sourcePath = path.join(circuitsBuildDir, fileName);
  const destPath = path.join(distCircuitsDir, fileName);

  if (copyFile(sourcePath, destPath)) {
    copiedCount++;
  }
});

console.log(`\n📊 Summary: ${copiedCount}/${totalFiles} files copied successfully`);

if (copiedCount === 0) {
  console.log('⚠️  No circuit files were copied. zk-SNARK verification will be disabled.');
  console.log('💡 This is OK for deployment without zk-SNARK features.');
  // Exit with success code anyway - the app can work without zk-SNARK
  process.exit(0);
} else if (copiedCount < totalFiles) {
  console.log('⚠️  Some circuit files are missing. zk-SNARK verification may be partially disabled.');
  process.exit(0);
} else {
  console.log('✅ All circuit files copied successfully!');
  process.exit(0);
}
