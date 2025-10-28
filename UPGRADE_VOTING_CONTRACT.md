# 🔄 Guide d'Upgrade du Smart Contract Voting

**Date:** 26 Octobre 2025
**Objectif:** Ajouter la protection anti-vote multiple SANS perdre les données existantes

---

## ✅ Modifications apportées

### 1. Nouveau storage mapper
```rust
#[storage_mapper("voters")]
fn voters(&self, election_id: u64, voter: &ManagedAddress) -> SingleValueMapper<bool>;
```

### 2. Nouvelle fonction view
```rust
#[view(hasVoted)]
fn has_voted(&self, election_id: u64, voter: ManagedAddress) -> bool {
    self.voters(election_id, &voter).get()
}
```

### 3. Protection dans `cast_vote`
- Vérification si l'utilisateur a déjà voté (ligne 158-161)
- Enregistrement du votant après le vote (ligne 175)

---

## 📋 Prérequis

1. ✅ Contract compilé: `contracts/voting/output/voting.wasm`
2. ✅ Wallet avec des EGLD sur Devnet
3. ✅ Adresse du contrat actuel déployé

---

## 🚀 Commandes d'UPGRADE (conserver les données)

### Option 1: Via mxpy (RECOMMANDÉ)

```bash
# 1. Vérifier l'adresse de votre contrat actuel
# Remplacez <VOTING_CONTRACT_ADDRESS> par votre adresse réelle

# 2. Upgrade du contrat
mxpy contract upgrade <VOTING_CONTRACT_ADDRESS> \
  --bytecode=contracts/voting/output/voting.wasm \
  --recall-nonce \
  --gas-limit=50000000 \
  --pem=wallet-deployer.pem \
  --chain=D \
  --proxy=https://devnet-gateway.multiversx.com \
  --send

# Exemple avec une vraie adresse:
# mxpy contract upgrade erd1qqqqqqqqqqqqqpgqwpwukjk8m9w5yn2mq2g5k2qw8qk8k2qw8q... \
#   --bytecode=contracts/voting/output/voting.wasm \
#   --recall-nonce \
#   --gas-limit=50000000 \
#   --pem=wallet-deployer.pem \
#   --chain=D \
#   --proxy=https://devnet-gateway.multiversx.com \
#   --send
```

### Option 2: Via l'explorateur Devnet (plus simple)

1. **Aller sur:** https://devnet-explorer.multiversx.com
2. **Rechercher votre contrat** (adresse du voting contract)
3. **Cliquer sur "Upgrade"**
4. **Télécharger le fichier:** `contracts/voting/output/voting.wasm`
5. **Connecter votre wallet** (xPortal Mobile ou DeFi Wallet)
6. **Gas Limit:** 50,000,000
7. **Confirmer la transaction**

---

## 🔍 Vérification après l'upgrade

### 1. Vérifier que les données sont préservées

```bash
# Vérifier le nombre total d'élections (doit rester identique)
mxpy contract query <VOTING_CONTRACT_ADDRESS> \
  --function="getTotalElections" \
  --proxy=https://devnet-gateway.multiversx.com

# Vérifier une élection spécifique (exemple élection ID 1)
mxpy contract query <VOTING_CONTRACT_ADDRESS> \
  --function="getElection" \
  --arguments 1 \
  --proxy=https://devnet-gateway.multiversx.com
```

### 2. Tester la nouvelle fonction `hasVoted`

```bash
# Vérifier si une adresse a voté (exemple)
mxpy contract query <VOTING_CONTRACT_ADDRESS> \
  --function="hasVoted" \
  --arguments 1 <VOTER_ADDRESS_HEX> \
  --proxy=https://devnet-gateway.multiversx.com

# Pour convertir une adresse erd1... en hex:
mxpy wallet bech32 --decode <VOTER_ADDRESS>
```

### 3. Tester le vote multiple (doit échouer)

Essayez de voter deux fois pour la même élection:
- Le premier vote doit passer ✅
- Le second vote doit échouer avec le message: "Vous avez déjà voté pour cette élection" ❌

---

## ⚠️ Important

### Ce qui est PRÉSERVÉ après l'upgrade:
- ✅ Toutes les élections existantes
- ✅ Tous les candidats
- ✅ Tous les votes déjà enregistrés
- ✅ Les compteurs (election_counter)

### Ce qui est NOUVEAU après l'upgrade:
- ✅ Protection anti-vote multiple
- ✅ Fonction `hasVoted(election_id, voter)`
- ✅ Storage mapper `voters`

### Notes importantes:
- Les votes passés (avant l'upgrade) ne sont pas trackés dans le nouveau storage `voters`
- Seuls les nouveaux votes (après l'upgrade) seront trackés
- Les utilisateurs qui ont voté AVANT l'upgrade pourront voter une fois de plus (mais c'est le seul impact)

---

## 🆘 En cas de problème

### Erreur: "Invalid code"
- Vérifiez que le fichier WASM est bien celui de `contracts/voting/output/voting.wasm`
- Recompilez si nécessaire: `wsl bash -l -c "cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/voting && sc-meta all build"`

### Erreur: "Insufficient gas"
- Augmentez le gas limit à 60,000,000 ou 100,000,000

### Erreur: "Upgrade not allowed"
- Vérifiez que vous utilisez le wallet qui a déployé le contrat original
- Seul le propriétaire (owner) peut upgrade un contrat

---

## 📝 Commandes de référence

### Obtenir l'adresse du contrat depuis le config

```bash
# Lire le fichier de config frontend
cat frontend/src/config/config.devnet.ts | grep votingContract
```

### Vérifier le propriétaire du contrat

```bash
mxpy contract query <VOTING_CONTRACT_ADDRESS> \
  --function="getOwner" \
  --proxy=https://devnet-gateway.multiversx.com
```

---

**Prêt pour l'upgrade ?** 🚀

Récupérez l'adresse de votre contrat voting depuis votre config et lancez la commande d'upgrade !
