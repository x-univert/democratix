# 🛠️ Installation Circom et snarkjs pour Option 2

**Date**: 2 Novembre 2025
**Objectif**: Installer les outils nécessaires pour compiler les circuits zk-SNARK Option 2

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation sur Windows avec WSL](#installation-sur-windows-avec-wsl)
4. [Installation sur Linux/macOS](#installation-sur-linuxmacos)
5. [Vérification de l'installation](#vérification-de-linstallation)
6. [Compilation du circuit Option 2](#compilation-du-circuit-option-2)
7. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Pour compiler les circuits Circom utilisés dans l'Option 2 (ElGamal + zk-SNARK), vous devez installer:

- **Circom**: Compilateur de circuits zk-SNARK
- **snarkjs**: Bibliothèque JavaScript pour générer et vérifier les preuves zk-SNARK
- **Rust**: Requis pour compiler Circom (déjà installé dans votre WSL)

---

## 📦 Prérequis

### Déjà installé sur votre système:

✅ **WSL2 avec Ubuntu** (version par défaut: 2)
✅ **Rust et Cargo** dans WSL (`/home/univert/.cargo/bin/`)
✅ **Node.js v23.3.0** et **npm 10.9.0** sur Windows

### À installer:

❌ **Circom** (compilateur de circuits)
❌ **snarkjs** (génération de preuves)

---

## 🪟 Installation sur Windows avec WSL

### Option 1: Installation Circom depuis les sources (Recommandé)

```bash
# 1. Ouvrir WSL
wsl

# 2. Installer les dépendances
sudo apt update
sudo apt install -y build-essential cmake git libgmp-dev libsodium-dev nasm nlohmann-json3-dev

# 3. Cloner le dépôt Circom
cd ~
git clone https://github.com/iden3/circom.git
cd circom

# 4. Compiler et installer Circom
cargo build --release
cargo install --path circom

# 5. Vérifier que Circom est dans le PATH
which circom
circom --version
```

### Option 2: Installation via binaires pré-compilés

```bash
# 1. Télécharger le binaire depuis GitHub Releases
cd /tmp
wget https://github.com/iden3/circom/releases/latest/download/circom-linux-amd64
chmod +x circom-linux-amd64

# 2. Déplacer vers /usr/local/bin
sudo mv circom-linux-amd64 /usr/local/bin/circom

# 3. Vérifier l'installation
circom --version
```

### Installation snarkjs (Node.js)

```bash
# Dans WSL, installer snarkjs globalement
npm install -g snarkjs

# Vérifier l'installation
snarkjs --version
```

---

## 🐧 Installation sur Linux/macOS

### Installation Circom

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y build-essential cmake git libgmp-dev libsodium-dev nasm nlohmann-json3-dev

# macOS (via Homebrew)
brew install circom

# Ou depuis les sources (Linux/macOS)
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

### Installation snarkjs

```bash
# Installation globale via npm
npm install -g snarkjs

# Ou installation locale dans le projet
cd /path/to/DEMOCRATIX
npm install snarkjs
```

---

## ✅ Vérification de l'installation

### Vérifier Circom

```bash
wsl circom --version
# Sortie attendue: circom compiler 2.x.x
```

### Vérifier snarkjs

```bash
wsl snarkjs --version
# Sortie attendue: snarkjs@0.7.x
```

### Vérifier Rust/Cargo (déjà installé)

```bash
wsl bash -c "export HOME=/home/univert && /home/univert/.cargo/bin/cargo --version"
# Sortie attendue: cargo 1.93.0-nightly
```

---

## 🔨 Compilation du circuit Option 2

Une fois Circom et snarkjs installés, compilez le circuit:

### 1. Naviguer vers le dossier du circuit

```bash
cd C:\Users\DEEPGAMING\MultiversX\DEMOCRATIX\backend\circuits\valid_vote_encrypted
```

### 2. Compiler le circuit avec Circom

```bash
wsl circom valid_vote_encrypted.circom --r1cs --wasm --sym --c
```

**Sortie attendue**:
- `valid_vote_encrypted.r1cs` (système de contraintes)
- `valid_vote_encrypted.sym` (symboles)
- `valid_vote_encrypted_js/` (dossier avec WASM)
- `valid_vote_encrypted_cpp/` (code C++)

### 3. Générer les fichiers Powers of Tau (Trusted Setup Phase 1)

```bash
# Générer un fichier pot12 (2^12 = 4096 contraintes, suffisant pour ce circuit)
wsl snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Contribuer à la cérémonie (entropie aléatoire)
wsl snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v

# Préparer la phase 2
wsl snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

### 4. Générer la clé de preuve (Trusted Setup Phase 2)

```bash
# Générer le zkey initial
wsl snarkjs groth16 setup valid_vote_encrypted.r1cs pot12_final.ptau valid_vote_encrypted_0000.zkey

# Contribuer à la cérémonie du circuit
wsl snarkjs zkey contribute valid_vote_encrypted_0000.zkey valid_vote_encrypted_final.zkey --name="First contribution" -v

# Exporter la clé de vérification
wsl snarkjs zkey export verificationkey valid_vote_encrypted_final.zkey verification_key.json
```

### 5. Copier les fichiers vers le frontend

```bash
# Créer le dossier circuits dans frontend/public (si pas existant)
mkdir -p frontend/public/circuits/valid_vote_encrypted

# Copier les fichiers nécessaires
cp valid_vote_encrypted_js/valid_vote_encrypted.wasm frontend/public/circuits/valid_vote_encrypted/
cp valid_vote_encrypted_final.zkey frontend/public/circuits/valid_vote_encrypted/
cp verification_key.json frontend/public/circuits/valid_vote_encrypted/
```

### 6. Vérifier que les fichiers sont bien copiés

```bash
ls -lh frontend/public/circuits/valid_vote_encrypted/
```

**Fichiers attendus**:
- `valid_vote_encrypted.wasm` (~1-2 MB)
- `valid_vote_encrypted_final.zkey` (~300-500 KB)
- `verification_key.json` (~1 KB)

---

## 🚨 Dépannage

### Problème: `circom: command not found`

**Solution 1**: Ajouter Circom au PATH dans WSL

```bash
# Ajouter à ~/.bashrc
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Solution 2**: Utiliser le chemin complet

```bash
/home/univert/.cargo/bin/circom --version
```

### Problème: `snarkjs: command not found`

**Solution**: Installer snarkjs dans WSL

```bash
wsl npm install -g snarkjs
```

### Problème: Compilation Circom échoue avec "cannot find -lgmp"

**Solution**: Installer libgmp-dev

```bash
wsl sudo apt install -y libgmp-dev libsodium-dev
```

### Problème: `powersoftau` prend trop de temps

**Solution**: Utiliser un fichier Powers of Tau existant

Téléchargez un fichier pot12 déjà généré depuis [iden3 Hermez ceremony](https://github.com/iden3/snarkjs#7-prepare-phase-2):

```bash
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
mv powersOfTau28_hez_final_12.ptau pot12_final.ptau
```

### Problème: Taille du circuit trop grande

**Solution**: Augmenter le paramètre `pot` (actuellement 12)

```bash
# Pour 2^14 contraintes (16384)
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
```

---

## 📊 Taille des fichiers attendue

| Fichier | Taille approximative |
|---------|---------------------|
| `valid_vote_encrypted.r1cs` | ~50-100 KB |
| `valid_vote_encrypted.wasm` | ~1-2 MB |
| `valid_vote_encrypted_final.zkey` | ~300-500 KB |
| `verification_key.json` | ~1 KB |
| `pot12_final.ptau` | ~15 MB (peut être supprimé après) |

---

## ✅ Checklist de compilation

- [ ] Circom installé et accessible
- [ ] snarkjs installé et accessible
- [ ] Circuit compilé (fichiers .r1cs, .wasm générés)
- [ ] Powers of Tau généré (pot12_final.ptau)
- [ ] Clé de preuve générée (valid_vote_encrypted_final.zkey)
- [ ] Clé de vérification exportée (verification_key.json)
- [ ] Fichiers copiés dans `frontend/public/circuits/valid_vote_encrypted/`
- [ ] Frontend peut charger les circuits (tester avec F12 → Network)

---

## 🎯 Prochaines étapes après compilation

1. **Tester le frontend Option 2**:
   - Créer une élection avec Option 2 activée
   - Tenter un vote avec ElGamal + zk-SNARK
   - Vérifier que la preuve est générée (console F12)

2. **Déployer le smart contract mis à jour**:
   ```bash
   # Le smart contract a déjà été compilé avec succès!
   # Utiliser mxpy pour déployer sur Devnet
   ```

3. **Tests E2E Option 2**:
   - Créer fichier `frontend/cypress/e2e/09-elgamal-zksnark-voting.cy.ts`
   - Tester workflow complet Option 2

---

## 📚 Ressources

- [Circom Documentation](https://docs.circom.io/)
- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [Powers of Tau Ceremony](https://github.com/iden3/snarkjs#7-prepare-phase-2)
- [Groth16 Trusted Setup](https://docs.circom.io/getting-started/proving-circuits/#powers-of-tau)

---

**Dernière mise à jour**: 2 Novembre 2025
**Auteur**: Assistant IA + Documentation Circom/snarkjs
