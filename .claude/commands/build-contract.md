---
description: Build le smart contract MultiversX
allowed-tools: Bash(wsl bash:*), Bash(sc-meta:*)
---

Build le smart contract voting avec sc-meta.

Exécute:
```bash
wsl -e bash -c "cd /mnt/c/Users/DEEPGAMING/MultiversX/DEMOCRATIX/contracts/voting && HOME=/home/univert /home/univert/.cargo/bin/sc-meta all build"
```

Ensuite, affiche un résumé:
- Taille du WASM généré
- Vérification que les fichiers .abi.json et .wasm sont présents
- Erreurs de compilation éventuelles
