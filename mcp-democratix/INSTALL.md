# 🚀 Installation Rapide MCP DEMOCRATIX

Guide d'installation en 5 minutes !

## ✅ Prérequis

- Node.js 18+
- npm 9+
- Claude Code installé

## 📝 Étape 1 : Configuration

### 1.1 Installer les dépendances

\`\`\`bash
cd mcp-democratix
npm install
\`\`\`

### 1.2 Créer le fichier .env

\`\`\`bash
cp .env.example .env
\`\`\`

### 1.3 Éditer .env

Ouvrez `.env` et configurez au minimum :

\`\`\`env
# REQUIS
VOTING_CONTRACT_ADDRESS=erd1qqqqqqqqqqqqqpgq7vz63cw2czd0w3jrk3rkm2rkz...

# OPTIONNEL (pour upload_to_ipfs)
PINATA_API_KEY=votre_clé_api
PINATA_SECRET_API_KEY=votre_clé_secrète
\`\`\`

**Où trouver VOTING_CONTRACT_ADDRESS ?**

1. Ouvrez `frontend/.env` ou `backend/.env`
2. Cherchez `VITE_VOTING_CONTRACT_ADDRESS` ou `VOTING_CONTRACT_ADDRESS`
3. Copiez l'adresse qui commence par `erd1...`

## 🔧 Étape 2 : Build

\`\`\`bash
npm run build
\`\`\`

## ⚙️ Étape 3 : Installer dans Claude Code

### Option A : Installation Globale (Recommandé)

\`\`\`bash
# Windows PowerShell
claude mcp add democratix \`
  --transport stdio \`
  --env VOTING_CONTRACT_ADDRESS=erd1... \`
  -- npx tsx C:\Users\DEEPGAMING\MultiversX\DEMOCRATIX\mcp-democratix\src\index.ts
\`\`\`

Remplacez le chemin par le vôtre !

### Option B : Test en Mode Dev

\`\`\`bash
npm run dev
\`\`\`

Laissez tourner et testez dans Claude Code.

## ✅ Étape 4 : Vérifier l'Installation

Dans Claude Code, tapez :

\`\`\`
/mcp
\`\`\`

Vous devriez voir :
\`\`\`
✅ democratix - connected
   Tools: create_test_election, get_election_stats, monitor_votes, ...
\`\`\`

## 🎯 Étape 5 : Premier Test

Dans Claude Code, tapez :

\`\`\`
"Génère des clés ElGamal"
\`\`\`

Si vous voyez les clés publique/privée → **Succès !** 🎉

## 🔥 Commandes Rapides

### Tester Tous les Outils

\`\`\`
# Dans Claude Code

"Génère des clés ElGamal"
→ Test: generate_elgamal_keys ✅

"Donne les stats de l'élection 90"
→ Test: get_election_stats ✅

"Montre les derniers votes"
→ Test: monitor_votes ✅

"Quelle est la répartition des votes ?"
→ Test: get_votes_by_type ✅

"Crée une élection de test Option 2 avec 2 candidats"
→ Test: create_test_election ✅
\`\`\`

## 🐛 Problèmes Courants

### "VOTING_CONTRACT_ADDRESS not set"

**Solution** : Vérifiez `.env` et que l'adresse commence bien par `erd1...`

### "Module not found"

**Solution** :
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
npm run build
\`\`\`

### "Cannot find module @modelcontextprotocol/sdk"

**Solution** : La version du SDK a peut-être changé
\`\`\`bash
npm install @modelcontextprotocol/sdk@latest
\`\`\`

### MCP non visible dans Claude Code

**Solution** :
1. Redémarrez Claude Code
2. Vérifiez avec : `claude mcp list`
3. Si absent, réinstallez avec Étape 3

## 📚 Prochaines Étapes

Une fois installé :
1. Consultez `README.md` pour la documentation complète
2. Testez tous les 6 outils
3. Créez votre première élection de test !

## 🆘 Support

Problèmes ? Demandez à Claude Code :
\`\`\`
"J'ai un problème avec le MCP DEMOCRATIX, peux-tu m'aider ?"
\`\`\`

---

**Installation en 5 minutes ✅**
**6 outils puissants 🚀**
**Développement DEMOCRATIX facilité 💪**
