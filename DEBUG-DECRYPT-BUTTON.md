# Debug: Bouton Déchiffrement Aléatoire

## Test à Faire sur Vercel

1. Allez sur: https://democratix-frontend.vercel.app
2. Ouvrez la **Console du navigateur** (F12 → Console)
3. Allez sur la page Results d'une élection fermée
4. Cherchez ces logs:

### Logs Attendus (SI LE BOUTON APPARAÎT):

```
✅ isPrimaryOrganizer: true
✅ canDecrypt set to: true
```

### Logs Attendus (SI LE BOUTON N'APPARAÎT PAS):

```
❌ Error checking decrypt permission: [erreur réseau]
❌ canDecrypt set to: false
```

Ou:

```
⚠️ isPrimaryOrganizer: false
⚠️ Checking co-organizer permissions...
❌ 404 Not Found (l'API organizers n'existe pas ou échoue)
```

## Variables à Vérifier

### Dans la Console du Navigateur:

```javascript
// Vérifiez que VITE_BACKEND_API_URL est correcte
console.log(import.meta.env.VITE_BACKEND_API_URL);
// Attendu: https://democratix-backend-production.up.railway.app

// Vérifiez isPrimaryOrganizer
console.log('isPrimaryOrganizer:', isPrimaryOrganizer);

// Vérifiez canDecrypt
console.log('canDecrypt:', canDecrypt);
```

## Solutions Possibles

### Solution 1: Ajouter des Logs (Temporaire)

Ajoutez des console.log pour débugger.

### Solution 2: Vérifier l'API Organizers

Testez manuellement:
```
https://democratix-backend-production.up.railway.app/api/elections/81/organizers
```

Si 404 ou erreur = L'API n'existe pas ou est cassée.

### Solution 3: Fallback Plus Robuste

Utilisez seulement `isPrimaryOrganizer` sans appel API additionnel.
