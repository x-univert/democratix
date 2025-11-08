# 💾 Guide Simple - Sauvegarde des Conversations

## 🎯 La Solution la Plus Simple

Vous avez maintenant **UNE SEULE commande** à retenir pour sauvegarder vos conversations :

```powershell
powershell -ExecutionPolicy Bypass -Command "& '.\.claude\save.ps1' 'Votre message ici'"
```

## 🚀 Utilisation

### Méthode 1 : Avec un message (Recommandé)

**Quand :** Vous voulez sauvegarder rapidement ce que vous venez de faire

```powershell
powershell -ExecutionPolicy Bypass -Command "& '.\.claude\save.ps1' 'Implémentation du système de vote'"
```

**Exemples concrets :**

```powershell
# Après avoir créé une fonctionnalité
powershell -ExecutionPolicy Bypass -Command "& '.\.claude\save.ps1' 'Création de l API REST pour les élections'"

# Après avoir résolu un bug
powershell -ExecutionPolicy Bypass -Command "& '.\.claude\save.ps1' 'Bug de validation des votes résolu'"

# Avant une pause
powershell -ExecutionPolicy Bypass -Command "& '.\.claude\save.ps1' 'Pause déjeuner - Backend à 60%'"

# Fin de journée
powershell -ExecutionPolicy Bypass -Command "& '.\.claude\save.ps1' 'Fin journée - Smart contracts déployés sur devnet'"
```

### Méthode 2 : Sans message (Interactif)

**Quand :** Vous voulez décrire plus en détail

```powershell
powershell -ExecutionPolicy Bypass -Command "& '.\.claude\save.ps1'"
```

Le script vous demandera alors :
```
💾 Sauvegarde de conversation

Décrivez ce qui a été fait dans cette session: _
```

Vous tapez votre résumé et appuyez sur Entrée.

## ⚡ Raccourci Ultra-Rapide (Optionnel)

### Créer un alias PowerShell

1. Ouvrez votre profil PowerShell :
```powershell
notepad $PROFILE
```

2. Ajoutez cette ligne :
```powershell
function save { param($msg) & '.\.claude\save.ps1' $msg }
```

3. Rechargez le profil :
```powershell
. $PROFILE
```

4. Maintenant vous pouvez faire simplement :
```powershell
save "Mon message"
```

## 📂 Où sont sauvegardées les conversations ?

```
.claude/conversations/
├── checkpoint_2025-10-31_21-04-15.md
├── checkpoint_2025-10-31_21-16-27.md
└── checkpoint_2025-10-31_XX-XX-XX.md
```

Chaque fichier contient :
- La date et l'heure exacte
- Votre résumé de la session
- Le contexte technique

## 🕐 Quand sauvegarder ?

### ✅ Moments clés :

1. **Après chaque étape importante**
   - Fonctionnalité terminée
   - Bug résolu
   - Tests passés

2. **Avant/Après une interruption**
   - Pause déjeuner
   - Fin de journée
   - Réunion

3. **Régulièrement**
   - Toutes les 30-60 minutes
   - Après 3-5 commits

4. **Avant des opérations risquées**
   - Refactoring majeur
   - Mise à jour de dépendances
   - Changement d'architecture

5. **En cas de problème**
   - Terminal qui lag
   - Doute sur la stabilité
   - Avant de tester quelque chose de nouveau

## 💡 Bonnes Pratiques

### Format de message recommandé :

```
[Action] [Composant] - [Résultat/État]
```

**Exemples :**

```powershell
# ✅ BON
save "Implémentation VoteController - 5 endpoints CRUD fonctionnels"
save "Fix bug validation - Tous les tests passent"
save "Déploiement smart contract - Adresse: erd1..."

# ❌ MOINS BON
save "Travail sur le code"
save "Modifications"
save "Update"
```

### Astuce : Messages multi-lignes

Si vous avez beaucoup à dire, utilisez le mode interactif :

```powershell
powershell -ExecutionPolicy Bypass -Command "& '.\.claude\save.ps1'"
```

Puis tapez votre résumé complet.

## 🔍 Consulter l'historique

### Voir tous vos checkpoints :

```powershell
dir .claude\conversations\checkpoint_*.md
```

### Voir le dernier checkpoint :

```powershell
Get-Content (Get-ChildItem .claude\conversations\checkpoint_*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
```

### Chercher dans l'historique :

```powershell
Select-String -Path .claude\conversations\checkpoint_*.md -Pattern "vote"
```

## 🆚 Comparaison avec l'Option 3 (Capture Automatique)

| Critère | Option 1 (save.ps1) ✅ | Option 3 (Capture Auto) ❌ |
|---------|----------------------|---------------------------|
| **Simplicité** | 1 commande | Configuration complexe |
| **Fiabilité** | 100% | Dépend du terminal |
| **Contrôle** | Total | Limité |
| **Lisibilité** | Résumés clairs | Logs bruts |
| **Performance** | Instantané | Overhead constant |

## ❓ FAQ

### Q : Dois-je utiliser l'Option 3 ?
**R :** Non, l'Option 1 avec `save.ps1` est largement suffisante et bien meilleure.

### Q : Puis-je sauvegarder automatiquement ?
**R :** Non, car Claude ne peut pas exécuter des commandes en arrière-plan. Mais avec l'alias `save`, c'est très rapide !

### Q : Les fichiers prennent beaucoup de place ?
**R :** Non, ce sont de petits fichiers texte (< 1 Ko). Même après 1000 sauvegardes, ça fait < 1 Mo.

### Q : Puis-je éditer les checkpoints après ?
**R :** Oui ! Ce sont des fichiers Markdown. Ouvrez-les avec n'importe quel éditeur et ajoutez des notes.

### Q : Que faire si je perds une conversation ?
**R :** Consultez vos checkpoints dans `.claude/conversations/`. Ils contiennent les résumés de toutes vos sessions.

## 🎯 Workflow Recommandé

```
1. Démarrer une session avec Claude
2. Travailler sur votre projet
3. À chaque étape importante :
   save "Ce que vous venez de faire"
4. Continuer à travailler
5. Répéter l'étape 3
6. Fin de session :
   save "Résumé complet de la session + prochaines étapes"
```

---

**En résumé :** Oubliez l'Option 3. Utilisez simplement `save.ps1` ! 🎉
