# Guide d'Upgrade du Smart Contract - Intégration zk-SNARK

**Date**: 31 Octobre 2025
**Version**: v0.8.0 → v0.9.0
**Objectif**: Ajouter les fonctionnalités de vote privé avec zk-SNARK

---

## 📋 Résumé des Changements

### Nouvelles Structures

1. **PrivateVote** (lignes 70-78 de `lib.rs`)
```rust
pub struct PrivateVote<M: ManagedTypeApi> {
    pub vote_commitment: ManagedBuffer<M>,  // Hash Poseidon du vote
    pub nullifier: ManagedBuffer<M>,         // Empêche le double vote
    pub backend_signature: ManagedBuffer<M>, // Signature du backend
    pub timestamp: u64,
}
```

### Nouveaux Storage Mappers

1. **private_votes** - Stocke les votes privés par élection
2. **used_nullifiers** - Empêche le double vote
3. **backend_verifier_address** - Adresse du backend autorisé

### Nouveaux Endpoints

1. **submitPrivateVote** - Soumettre un vote privé avec preuve zk-SNARK
2. **setBackendVerifier** - Configurer l'adresse backend (owner only)
3. **getBackendVerifier** - Récupérer l'adresse backend
4. **getPrivateVotes** - Récupérer les votes privés d'une élection
5. **isNullifierUsed** - Vérifier si un nullifier a été utilisé

---

## 🔧 Option 1 : Upgrader le Contrat Existant

### Avantages
✅ Conserve toutes les données existantes (élections, votes, candidats)
✅ Ajoute simplement les nouvelles fonctionnalités
✅ Pas besoin de redéployer les élections de test

### Prérequis
- Wallet PEM file du owner du contrat
- Accès à l'adresse : `erd1qqqqqqqqqqqqqpgq9v39v8r36dhu4l6n2armf4u3297qf5ycd3qqxgyzz7`

### Commandes

```bash
# 1. Compiler le contrat (DÉJÀ FAIT ✅)
cd contracts/voting
wsl --exec bash -l -c "sc-meta all build"

# 2. Upgrader le contrat sur devnet
mxpy contract upgrade erd1qqqqqqqqqqqqqpgq9v39v8r36dhu4l6n2armf4u3297qf5ycd3qqxgyzz7 \
  --bytecode output/voting.wasm \
  --pem ~/multiversx-wallets/wallet-owner.pem \
  --gas-limit 100000000 \
  --recall-nonce \
  --send \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D

# 3. Configurer l'adresse du backend verifier
# Remplacer BACKEND_ADDRESS par l'adresse du wallet backend
mxpy contract call erd1qqqqqqqqqqqqqpgq9v39v8r36dhu4l6n2armf4u3297qf5ycd3qqxgyzz7 \
  --function setBackendVerifier \
  --arguments 0x<BACKEND_ADDRESS_HEX> \
  --pem ~/multiversx-wallets/wallet-owner.pem \
  --gas-limit 5000000 \
  --recall-nonce \
  --send \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D

# 4. Vérifier l'upgrade
mxpy contract query erd1qqqqqqqqqqqqqpgq9v39v8r36dhu4l6n2armf4u3297qf5ycd3qqxgyzz7 \
  --function getBackendVerifier \
  --proxy https://devnet-gateway.multiversx.com
```

---

## 🚀 Option 2 : Déployer un Nouveau Contrat

### Avantages
✅ Environnement frais pour tester
✅ Pas de risque de casser les données existantes
✅ Permet de comparer ancien vs nouveau

### Inconvénients
❌ Perd les données de test existantes
❌ Nécessite de recréer les élections

### Commandes

```bash
# 1. Compiler le contrat (DÉJÀ FAIT ✅)
cd contracts/voting
wsl --exec bash -l -c "sc-meta all build"

# 2. Déployer un nouveau contrat
mxpy contract deploy \
  --bytecode output/voting.wasm \
  --pem ~/multiversx-wallets/wallet-deployer.pem \
  --gas-limit 100000000 \
  --recall-nonce \
  --send \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D

# Récupérer l'adresse du contrat déployé
# La transaction retournera quelque chose comme :
# Contract address: erd1qqqqqqqqqqqqqpgq...

# 3. Mettre à jour backend/.env
# VOTING_CONTRACT_ADDRESS_ZK=erd1qqqqqqqqqqqqqpgq...

# 4. Configurer le backend verifier
mxpy contract call <NEW_CONTRACT_ADDRESS> \
  --function setBackendVerifier \
  --arguments 0x<BACKEND_ADDRESS_HEX> \
  --pem ~/multiversx-wallets/wallet-owner.pem \
  --gas-limit 5000000 \
  --recall-nonce \
  --send \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D
```

---

## 🧪 Tests Après Upgrade/Déploiement

### Test 1 : Vérifier la Configuration

```bash
# Vérifier que le backend verifier est configuré
mxpy contract query <CONTRACT_ADDRESS> \
  --function getBackendVerifier \
  --proxy https://devnet-gateway.multiversx.com
```

### Test 2 : Soumettre un Vote Privé

**Via Frontend** :
1. Aller sur http://localhost:5173/elections
2. Sélectionner une élection active
3. Cliquer "Vote"
4. Choisir un candidat
5. Cliquer "🔐 Voter en Mode Privé (zk-SNARK)"
6. Observer la progression dans le modal

**Via mxpy** :
```bash
# Générer une preuve (via backend API)
curl -X POST http://localhost:3001/api/zk/verify-vote \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {...},
    "publicSignals": ["1", "5", "12345..."]
  }'

# Soumettre le vote avec la signature backend
mxpy contract call <CONTRACT_ADDRESS> \
  --function submitPrivateVote \
  --arguments \
    1 \
    0x<VOTE_COMMITMENT_HEX> \
    0x<NULLIFIER_HEX> \
    0x<BACKEND_SIGNATURE_HEX> \
  --pem ~/multiversx-wallets/wallet-voter.pem \
  --gas-limit 20000000 \
  --recall-nonce \
  --send
```

### Test 3 : Vérifier les Votes Privés

```bash
# Récupérer les votes privés d'une élection
mxpy contract query <CONTRACT_ADDRESS> \
  --function getPrivateVotes \
  --arguments 1 \
  --proxy https://devnet-gateway.multiversx.com
```

### Test 4 : Test de Double Vote

```bash
# Essayer de voter deux fois avec le même nullifier
# Doit échouer avec "Nullifier déjà utilisé"
mxpy contract call <CONTRACT_ADDRESS> \
  --function submitPrivateVote \
  --arguments \
    1 \
    0x<VOTE_COMMITMENT_HEX> \
    0x<SAME_NULLIFIER_HEX> \
    0x<BACKEND_SIGNATURE_HEX> \
  --pem ~/multiversx-wallets/wallet-voter.pem \
  --gas-limit 20000000
```

---

## 📊 Checklist Avant Production

### Backend
- [ ] zkVerifier service initialisé correctement
- [ ] Endpoints /api/zk/* testés
- [ ] Verification keys chargées
- [ ] Signature backend sécurisée (HSM/KMS)

### Smart Contract
- [ ] Contrat upgradé/déployé sur devnet
- [ ] Backend verifier address configurée
- [ ] Tests de vote privé réussis
- [ ] Tests de prévention double vote réussis

### Frontend
- [ ] zkProofService testé
- [ ] Modal de progression fonctionnel
- [ ] Hook useSubmitPrivateVote testé
- [ ] Gestion d'erreurs testée

### Documentation
- [ ] Guide utilisateur mis à jour
- [ ] Documentation technique complète
- [ ] Exemples de code fournis

---

## 🔐 Sécurité - Points Critiques

### 1. Adresse Backend Verifier

⚠️ **IMPORTANT** : Seule l'adresse configurée dans `backend_verifier_address` peut autoriser les votes.

**Recommandations** :
- Utiliser un wallet dédié pour le backend
- Stocker la clé privée dans un HSM/KMS
- Mettre en place une rotation de clés
- Monitorer tous les appels `submitPrivateVote`

### 2. Signature Backend

🔒 **POC** : Actuellement utilise un hash SHA-256 simple.

**TODO Production** :
- Implémenter signature Ed25519
- Utiliser `ed25519-dalek` ou équivalent
- Signer : `sign(electionId || voteCommitment || nullifier)`
- Vérifier signature on-chain (nécessite precompile ou lib crypto)

### 3. Preuves zk-SNARK

🚧 **POC** : Utilise des preuves mockées.

**TODO Production** :
- Remplacer par vrais circuits Circom
- Générer vraies preuves avec snarkjs
- Utiliser Poseidon au lieu de SHA-256
- Implémenter Merkle tree pour liste électorale

---

## 📝 Notes de Version

### v0.9.0 - Vote Privé zk-SNARK (31 Oct 2025)

**Ajouté** :
- ✅ Structure `PrivateVote`
- ✅ Endpoint `submitPrivateVote`
- ✅ Storage pour nullifiers
- ✅ Configuration backend verifier

**Sécurité** :
- ✅ Prévention double vote (nullifiers)
- ✅ Vérification période élection
- ⚠️ Signature backend POC (à améliorer)

**Limitations POC** :
- ⚠️ Preuves mockées (pas de vraie vérification cryptographique)
- ⚠️ Signature simple (pas Ed25519)
- ⚠️ Pas de vérification on-chain des preuves

---

## 🎯 Prochaines Étapes

1. **Immédiat** (cette session) :
   - [ ] Décider : Upgrade vs Nouveau déploiement
   - [ ] Exécuter les commandes d'upgrade/déploiement
   - [ ] Configurer backend verifier address
   - [ ] Tester via frontend

2. **Court terme** (semaine prochaine) :
   - [ ] Tests E2E complets
   - [ ] Documentation utilisateur
   - [ ] Vidéo démo

3. **Moyen terme** (2-4 semaines) :
   - [ ] Implémenter vrais circuits Circom
   - [ ] Signature Ed25519 backend
   - [ ] Merkle tree liste électorale
   - [ ] Vérification on-chain (si possible)

4. **Long terme** (2-3 mois) :
   - [ ] Audit de sécurité
   - [ ] Tests de charge
   - [ ] Migration mainnet

---

**Auteur** : Claude
**Date** : 31 Octobre 2025
**Version** : v0.9.0-draft
