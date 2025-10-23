# Installation Windows pour DEMOCRATIX

## ❌ Problème Rencontré

```
error: linking with `link.exe` failed: exit code: 1
note: you may need to install Visual Studio build tools with the "C++ build tools" workload
```

## ✅ Solution : Installer Visual Studio Build Tools

### Option 1 : Build Tools Uniquement (Recommandé - Plus Léger)

1. **Télécharger Build Tools** :
   - Aller sur : https://visualstudio.microsoft.com/downloads/
   - Scroller jusqu'à **"Tools for Visual Studio"**
   - Télécharger **"Build Tools for Visual Studio 2022"**

2. **Installer** :
   - Exécuter l'installateur
   - Cocher **"Desktop development with C++"**
   - Cliquer sur "Install"
   - **Taille** : ~7 GB
   - **Durée** : 15-30 minutes

3. **Redémarrer** :
   ```bash
   # Fermer et rouvrir le terminal
   # Puis retester
   cd /c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/voting
   cargo build --target wasm32-unknown-unknown --release
   ```

---

### Option 2 : Utiliser WSL2 (Windows Subsystem for Linux)

**Avantages** :
- Environnement Linux complet
- Pas de problèmes de build tools
- Meilleure compatibilité avec les outils blockchain

**Installation** :

1. **Activer WSL2** :
   ```powershell
   # En tant qu'administrateur dans PowerShell
   wsl --install
   ```

2. **Redémarrer Windows**

3. **Ouvrir Ubuntu** (installé automatiquement)

4. **Dans Ubuntu, installer Rust** :
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   rustup target add wasm32-unknown-unknown
   ```

5. **Cloner le projet dans WSL** :
   ```bash
   cd ~
   git clone https://github.com/x-univert/DEMOCRATIX.git
   cd DEMOCRATIX/contracts/voting
   cargo build --target wasm32-unknown-unknown --release
   ```

---

### Option 3 : Utiliser Docker (Alternative)

**Si vous avez Docker Desktop** :

```bash
# Pull image Rust
docker pull rust:latest

# Compiler dans Docker
docker run --rm -v "${PWD}:/app" -w /app rust:latest cargo build --target wasm32-unknown-unknown --release
```

---

## 📋 Que Faire Maintenant ?

### Recommandation : Option 1 (Build Tools)

C'est la solution la plus simple si vous voulez rester sur Windows nativement.

**Étapes** :
1. Télécharger Build Tools : https://visualstudio.microsoft.com/downloads/
2. Installer "Desktop development with C++"
3. Redémarrer le terminal
4. Retester le build

**Pendant le téléchargement/installation (~30 min)**, vous pouvez :
- ✅ Tester le backend (Node.js ne nécessite pas Build Tools)
- ✅ Créer votre wallet devnet
- ✅ Lire la documentation MultiversX

---

## 🧪 Test du Backend (Maintenant)

En attendant Build Tools, testons le backend :

```bash
# Vérifier Node.js
node --version  # Devrait afficher v18+

# Aller dans backend
cd /c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/backend

# Installer dépendances
npm install

# Copier .env
cp ../.env.example .env

# Démarrer le serveur
npm run dev
```

**Dans un autre terminal** :
```bash
curl http://localhost:3000/health
```

**Résultat attendu** :
```json
{"status":"ok","timestamp":"2025-10-20T..."}
```

Si ça marche → ✅ Votre backend fonctionne !

---

## 🔄 Alternatives si Problème de Téléchargement

### Si la connexion est lente pour Build Tools (7 GB)

**Solution : Utiliser un Cloud Environment**

1. **GitHub Codespaces** (Gratuit pour 60h/mois)
   - Aller sur : https://github.com/x-univert/DEMOCRATIX
   - Cliquer sur "Code" → "Codespaces" → "Create codespace"
   - Environnement Linux complet dans le navigateur
   - Rust pré-installé

2. **GitPod** (Gratuit pour 50h/mois)
   - Aller sur : https://gitpod.io/#https://github.com/x-univert/DEMOCRATIX
   - Environnement prêt à l'emploi

3. **Replit**
   - Importer depuis GitHub
   - Environnement cloud

---

## 📊 Comparaison des Options

| Option | Avantages | Inconvénients | Temps Setup |
|--------|-----------|---------------|-------------|
| **Build Tools** | Natif Windows, rapide après | 7 GB, ~30 min install | 30-60 min |
| **WSL2** | Environnement Linux, meilleur | Apprendre Linux si nouveau | 20 min |
| **Docker** | Isolation, reproductible | Besoin Docker Desktop | 10 min |
| **Codespaces** | Zéro installation, cloud | Limite 60h/mois gratuit | 2 min |

---

## 🎯 Ma Recommandation

**Pour Débutant** :
→ Option 1 (Build Tools) - Rester sur Windows nativement

**Pour Développeur Blockchain** :
→ Option 2 (WSL2) - Meilleures pratiques, plus compatible

**Pour Tester Rapidement** :
→ GitHub Codespaces - Aucune installation

---

## 📞 Besoin d'Aide ?

Si vous êtes bloqué :
1. Partagez les messages d'erreur complets
2. Dites quelle option vous avez choisie
3. On résoudra ensemble !

---

## ✅ Prochaines Étapes

Une fois les Build Tools installés :

1. **Compiler les smart contracts** :
   ```bash
   cd contracts
   ./build.sh
   ```

2. **Vérifier les fichiers .wasm** :
   ```bash
   ls -la voting/output/
   ls -la voter-registry/output/
   ```

3. **Déployer sur devnet** :
   ```bash
   ./deploy-devnet.sh
   ```

---

**Bon courage ! On y est presque ! 💪**
