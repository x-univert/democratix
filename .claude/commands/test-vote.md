---
description: Guide pour tester les 3 options de vote
---

Checklist de test pour les systèmes de vote DEMOCRATIX:

## Créer une Élection de Test

1. Aller sur https://democratix-frontend.vercel.app/create
2. Créer une élection avec:
   - 2-3 candidats
   - Option de chiffrement: $1 (0=standard, 1=ElGamal, 2=ElGamal+zkSNARK)
   - Inscription requise: Non (pour faciliter les tests)

## Test Option 0 - Vote Standard

- [ ] Vote pour candidat 1
- [ ] Vérifier que le vote apparaît immédiatement dans les résultats
- [ ] Vote visible par tous

## Test Option 1 - Vote Chiffré ElGamal

- [ ] Vote pour candidat 1
- [ ] Vérifier que c1, c2 sont affichés (hex)
- [ ] Finaliser l'élection
- [ ] Déchiffrer avec la clé privée
- [ ] Vérifier que candidateId est correct (1, 2, 3...)

## Test Option 2 - Vote Chiffré ElGamal + zk-SNARK

- [ ] Vote pour candidat 1 → vérifier pas d'erreur "invalid scalar"
- [ ] Vote pour candidat 2 → vérifier que la preuve se génère (2-3s)
- [ ] Vérifier les logs console (mappedCandidateId doit être ≥ 0)
- [ ] Finaliser l'élection
- [ ] Déchiffrer avec la clé privée
- [ ] **CRITIQUE**: Vérifier que les IDs candidats correspondent (pas d'inversion)

## Vérifications Backend

Consulter les logs Railway pour:
- Déchiffrement ElGamal: `m` et `candidateId` doivent être cohérents
- Vérification zk-SNARK: `Proof verified successfully`

## Notes

Si les IDs sont inversés ou incorrects après déchiffrement:
1. L'élection a peut-être été créée avec l'ancien code
2. Créer une **nouvelle élection** après le dernier déploiement
3. Vérifier que Railway a bien redéployé le backend
