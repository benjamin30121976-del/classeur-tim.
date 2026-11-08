# Activer l'accès Parent aux notes privées de Tim

Projet Firebase : `classeur-ba3e7`.

## Situation vérifiée
- L'application authentifie les comptes Tim et Parent.
- Le compte Parent a été refusé en production lors de la lecture de la collection `privateAttempts`, avant tout import des 150 exercices.
- Dans le dépôt GitHub, les règles permettent déjà au Parent de consulter cette collection.
- Les règles réellement déployées sur Firebase sont donc à contrôler : ne pas supposer que le fichier du dépôt est publié.

## Modification minimale dans la console Firebase

Console : https://console.firebase.google.com/project/classeur-ba3e7/firestore/rules

Dans les règles **déjà présentes**, conserver tous les autres blocs (notamment les pièces jointes `attachments` et `attachment_chunks`). À l'intérieur du bloc
`match /databases/{database}/documents`, modifier **uniquement** le bloc `privateAttempts` ou l'ajouter s'il manque :

```javascript
match /privateAttempts/{id} {
  allow get, list: if request.auth != null
    && request.auth.uid == 'BPEuNAhHVyX8ewQ2I54s56m11vj1';
  allow create, update, delete: if false;
}
```

Ne pas autoriser la lecture publique, ni les écritures directes par Parent ou Tim.
Conserver également la règle `attempts` autorisant le Parent à lire les tentatives et Tim à lire uniquement ses propres tentatives.

Après contrôle, utiliser **Publier** dans la console Firebase. Cela requiert la connexion d'un administrateur du projet. Ne pas copier l'ensemble de `firestore.rules` du dépôt sur les règles en production : ce fichier peut ne pas intégrer les blocs ajoutés directement dans la console, notamment pour les pièces jointes.

## Vérifier après publication
1. Dans le compte Parent, tenter d'actualiser les résultats depuis la rubrique Parent.
2. Le compte Parent doit pouvoir lire les résultats de `privateAttempts`; Tim ne doit pas y accéder directement.
3. Le dépôt prévoit un test indépendant `verifier-acces-notes.yml` sur émulateur ; un test vert ne prouve pas que les règles ont été publiées en production.
4. Le partage d'une **nouvelle** note nécessite aussi le fonctionnement du service d'enregistrement des exercices ; tester une validation réelle avec Tim avant de déclarer la synchronisation totalement active.

Aucun changement de règle n'autorise à effacer ou modifier les notes existantes.
