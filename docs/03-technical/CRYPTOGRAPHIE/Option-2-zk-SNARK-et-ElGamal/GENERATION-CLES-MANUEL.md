# 🔑 Génération Manuelle des Clés Groth16 - Option 2

**Date**: 2 Novembre 2025
**Statut**: ⚠️ PROBLÈME - snarkjs ne crée pas les fichiers .ptau
**Solution**: Génération manuelle requise

---

## ❌ Problème Rencontré

Lors de la tentative de génération automatique des clés Groth16, `snarkjs` s'exécute sans erreur mais ne crée pas les fichiers `.ptau`:

```bash
$ npx snarkjs powersoftau new bn128 12 pot12_0000.ptau
[INFO] First Contribution Hash: 9e63a5f6...
# Mais aucun fichier pot12_0000.ptau créé!
```

**Symptômes**:
- La commande se termine avec succès (exit code 0)
- Le hash de contribution est affiché
- Aucun fichier `.ptau` n'est créé dans le répertoire
- Les permissions d'écriture sont OK (vérifié avec `touch`)
- Problème probablement lié à snarkjs sur Windows

---

## ✅ Solution 1: Génération sur Linux/WSL Native

### Installer Node.js dans WSL (si pas déjà fait)

```bash
wsl

# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Installer Node.js
nvm install 20
nvm use 20

# Vérifier
node --version
npm --version
```

### Générer les Clés dans WSL

```bash
# Aller dans le répertoire (depuis WSL)
cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/backend/circuits/valid_vote_encrypted

# Installer snarkjs localement
npm install snarkjs

# Étape 1: Powers of Tau
npx snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
npx snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Democratix"
npx snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Étape 2: Setup Circuit
npx snarkjs groth16 setup valid_vote_encrypted.r1cs pot12_final.ptau valid_vote_encrypted_0000.zkey
npx snarkjs zkey contribute valid_vote_encrypted_0000.zkey valid_vote_encrypted_final.zkey --name="Democratix"
npx snarkjs zkey export verificationkey valid_vote_encrypted_final.zkey verification_key.json

# Vérifier les fichiers
ls -lh *.zkey *.ptau verification_key.json
```

---

## ✅ Solution 2: Utiliser un Fichier Powers of Tau Pré-généré

Au lieu de générer `pot12_final.ptau`, utilisez un fichier de cérémonie publique:

### Option A: Télécharger depuis Hermez (si accessible)

```bash
curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -o pot12_final.ptau
```

**Note**: Le serveur Hermez retourne 403 Forbidden pour certaines régions. Si cela ne fonctionne pas, essayez l'Option B.

### Option B: Générer Localement avec Circom Officiel

1. **Cloner le dépôt snarkjs**:
```bash
git clone https://github.com/iden3/snarkjs.git
cd snarkjs
npm install
```

2. **Générer Powers of Tau**:
```bash
node build/cli.cjs powersoftau new bn128 12 pot12_0000.ptau -v
node build/cli.cjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Democratix"
node build/cli.cjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau
```

3. **Copier le fichier généré**:
```bash
cp pot12_final.ptau /path/to/DEMOCRATIX/backend/circuits/valid_vote_encrypted/
```

---

## ✅ Solution 3: Génération sur une Machine Linux

Si vous avez accès à une machine Linux (serveur, VM, autre ordinateur):

```bash
# Sur la machine Linux
cd /tmp
npm install -g snarkjs

# Générer Powers of Tau
snarkjs powersoftau new bn128 12 pot12_0000.ptau
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Democratix"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau

# Télécharger le fichier vers Windows
# Via SCP, USB, cloud, etc.
```

---

## 📋 Commandes Complètes (une fois pot12_final.ptau disponible)

Une fois que vous avez `pot12_final.ptau`, vous pouvez continuer:

```bash
cd backend/circuits/valid_vote_encrypted

# Setup Groth16
npx snarkjs groth16 setup valid_vote_encrypted.r1cs pot12_final.ptau valid_vote_encrypted_0000.zkey

# Contribution au circuit
npx snarkjs zkey contribute valid_vote_encrypted_0000.zkey valid_vote_encrypted_final.zkey --name="Democratix Contribution"

# Export verification key
npx snarkjs zkey export verificationkey valid_vote_encrypted_final.zkey verification_key.json

# Vérifier les fichiers générés
ls -lh valid_vote_encrypted_final.zkey verification_key.json

# Copier dans le frontend
mkdir -p ../../frontend/public/circuits/valid_vote_encrypted
cp valid_vote_encrypted_js/valid_vote_encrypted.wasm ../../frontend/public/circuits/valid_vote_encrypted/
cp valid_vote_encrypted_final.zkey ../../frontend/public/circuits/valid_vote_encrypted/
cp verification_key.json ../../frontend/public/circuits/valid_vote_encrypted/
```

---

## 📊 Fichiers Attendus

Après la génération complète, vous devriez avoir:

| Fichier | Taille | Description |
|---------|--------|-------------|
| `pot12_final.ptau` | ~17 MB | Powers of Tau final |
| `valid_vote_encrypted_0000.zkey` | ~3 MB | Clé initiale |
| `valid_vote_encrypted_final.zkey` | ~3 MB | Clé finale (avec contributions) |
| `verification_key.json` | ~1 KB | Clé de vérification publique |
| `valid_vote_encrypted.wasm` | ~2.9 MB | Circuit compilé (déjà existant) |

---

## 🧪 Tester les Clés

Une fois les fichiers copiés dans `frontend/public/circuits/valid_vote_encrypted/`, testez:

```bash
cd frontend
npm run dev

# Ouvrir navigateur → F12 → Console
# Essayer de voter avec Option 2
# Vérifier dans Network que les fichiers sont chargés:
# - valid_vote_encrypted.wasm (Status 200)
# - valid_vote_encrypted_final.zkey (Status 200)
```

---

## 🔍 Debugging

### Vérifier si les fichiers sont accessibles

```bash
# Depuis le frontend
curl http://localhost:5173/circuits/valid_vote_encrypted/valid_vote_encrypted.wasm --head
curl http://localhost:5173/circuits/valid_vote_encrypted/valid_vote_encrypted_final.zkey --head
```

### Vérifier la génération de preuve (Console F12)

```javascript
import { groth16 } from 'snarkjs';

const input = {
  candidateId: 1,
  randomness: "12345",
  electionId: 1,
  numCandidates: 3,
  voterSecret: "67890",
  c1_x: "...",
  c1_y: "...",
  c2_x: "...",
  c2_y: "..."
};

const { proof, publicSignals } = await groth16.fullProve(
  input,
  "/circuits/valid_vote_encrypted/valid_vote_encrypted.wasm",
  "/circuits/valid_vote_encrypted/valid_vote_encrypted_final.zkey"
);

console.log("Proof generated!", proof);
```

---

## 🎯 Prochaines Étapes

Une fois les clés générées et copiées:

1. ✅ Redémarrer le frontend (`npm run dev`)
2. ✅ Créer une élection avec ElGamal setup
3. ✅ Tester vote Option 2 (observer temps ~3-4s)
4. ✅ Vérifier transaction on-chain
5. ✅ Créer tests Cypress pour Option 2

---

## 📚 Ressources

- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [Powers of Tau Ceremony](https://github.com/iden3/snarkjs#powers-of-tau)
- [Groth16 Trusted Setup](https://docs.circom.io/getting-started/proving-circuits/)
- [Hermez Ceremony Files](https://github.com/iden3/snarkjs#7-prepare-phase-2)

---

**Dernière mise à jour**: 2 Novembre 2025
**Statut**: Génération manuelle requise - snarkjs sur Windows ne crée pas les fichiers
