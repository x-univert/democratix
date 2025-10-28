# Problème de Déploiement des Smart Contracts

## Résumé

Les smart contracts **voting** et **results** ne se déploient pas correctement sur le devnet MultiversX avec l'erreur :
```
runtime.go:841 [invalid contract code] []
```

## Analyse du Problème

### Contrats Déployés avec Succès
- ✅ **voter-registry** (`erd1qqqqqqqqqqqqqpgqu6z244pwew5ep7r0mv59aa2snm80pgv6d3qqce2mtu`) - FONCTIONNE

### Contrats Échoués
- ❌ **voting** (`erd1qqqqqqqqqqqqqpgqscpptz4nvd2a4cseslyqejcj99mx95v4d3qqe4cxzv`) - ERREUR
- ❌ **results** (`erd1qqqqqqqqqqqqqpgq57wdlxf38d6zwl727zq4u4shppyv257yd3qqp0y8gt`) - ERREUR

### Cause Racine

Les fichiers WASM générés sont trop petits et invalides :
- `voting_wasm.wasm` : 15 KB
- `results_wasm.wasm` : 9.8 KB
- `voter_registry_wasm.wasm` : 5.5 KB (fonctionne quand même)

**Problème de compilation** :
1. Le linker Windows (`link.exe`) interfère avec la compilation WASM
2. Les dossiers `meta/` n'ont pas de fichier `Cargo.toml`
3. La compilation échoue avec des erreurs de linker

## Solutions Proposées

### Solution 1 : Utiliser Docker (RECOMMANDÉ)

MultiversX recommande d'utiliser Docker pour compiler les smart contracts sur Windows :

```bash
# Utiliser l'image Docker officielle
docker run --rm -v ${PWD}:/workspace multiversx/sdk-rust-contract-builder:v8.0.1 \
  --project=/workspace/contracts/voting

docker run --rm -v ${PWD}:/workspace multiversx/sdk-rust-contract-builder:v8.0.1 \
  --project=/workspace/contracts/results
```

### Solution 2 : Réparer la Structure du Projet

Créer les fichiers manquants dans chaque contrat :

**Pour `/contracts/voting/meta/Cargo.toml` :**
```toml
[package]
name = "voting-meta"
version = "0.1.0"
edition = "2021"
publish = false

[[bin]]
name = "voting-meta"
path = "src/main.rs"

[dependencies.voting]
path = ".."

[dependencies.multiversx-sc-meta]
version = "0.53"
```

**Pour `/contracts/voting/meta/src/main.rs` :**
```rust
fn main() {
    multiversx_sc_meta::cli_main::<voting::AbiProvider>();
}
```

Répéter pour le contrat `results`.

### Solution 3 : Utiliser WSL2 (Windows Subsystem for Linux)

Si Docker n'est pas disponible, compiler depuis WSL2 :

```bash
# Dans WSL2
cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts
sc-meta all build
```

## Étapes de Résolution

1. **Choisir une solution** (Docker recommandé)
2. **Recompiler les contrats** avec la méthode choisie
3. **Vérifier la taille des fichiers WASM** (doivent être > 20KB minimum)
4. **Redéployer** :
   ```bash
   mxpy contract deploy \
     --bytecode=contracts/voting/output/voting.wasm \
     --recall-nonce \
     --pem=wallet-deployer.pem \
     --gas-limit=60000000 \
     --proxy=https://devnet-gateway.multiversx.com \
     --chain=D \
     --send
   ```
5. **Vérifier** sur l'explorateur que le code existe dans le contrat

## Vérification Post-Déploiement

Pour vérifier qu'un contrat est bien déployé :

```bash
curl -s "https://devnet-api.multiversx.com/accounts/<ADDRESS>" | python -m json.tool
```

Vérifier que :
- `code` n'est pas vide
- `codeHash` existe
- `deployTxHash` existe

## Ressources

- [Documentation MultiversX Build](https://docs.multiversx.com/developers/sc-build-reference/)
- [SDK Rust Contract Builder](https://hub.docker.com/r/multiversx/sdk-rust-contract-builder)
- [Troubleshooting Windows Compilation](https://docs.multiversx.com/developers/developer-reference/troubleshooting/#windows-compilation-issues)
