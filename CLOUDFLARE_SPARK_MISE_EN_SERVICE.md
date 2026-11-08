# Classeur de Tim — serveur Cloudflare avec Firebase Spark

**Statut : prototype testé, non publié sur le site de Tim.**

## Objectif
Faire fonctionner les validations et les corrections sur Cloudflare Pages sans
migrer Firebase Spark vers Blaze ni modifier les cours, les 150 exercices
ou les règles de sécurité Firestore déjà publiées.

## Architecture
- L'authentification reste Firebase Auth avec les comptes de Tim et du Parent.
- GET /api/status indique si le secret serveur est configuré.
- POST /api/tim accepte uniquement un jeton Firebase signé et vérifié, dont le
  propriétaire doit être le Parent ou Tim.
- Le serveur Cloudflare signe un jeton OAuth Google avec son compte de service,
  puis utilise l'API REST Firestore pour les collections existantes.
- submitTimExercise utilise une transaction et une précondition de création pour
  empêcher de valider deux fois le même exercice. Les résultats détaillés restent
  réservés au Parent dans privateAttempts ; Tim voit la validation dans attempts.
- Le Parent peut libérer et reverrouiller une correction.
- Les autres routes sont servies par les fichiers statiques du site.
- Aucune clé n'est conservée dans GitHub ou dans le JavaScript public.

## Tests déjà réalisés
- Syntaxe, jetons Firebase signés, vérification des rôles et OAuth simulé.
- Exercices mathématiques fictifs : score, XP=0, validation unique, refus du Parent.
- Consultation, déblocage et reverrouillage des corrections.
- Suppression des clés de réponses dans les cours lus par Tim.
- Cloudflare Pages local : pages visibles, refus API non authentifiée.
- La connexion au vrai compte de service et l'écriture réelle Firestore ne sont
  PAS encore testées : aucune note réelle de Tim n'a été modifiée.

## Seule configuration privée encore nécessaire dans Cloudflare

1. Dans le projet Google Cloud classeur-ba3e7, créer de préférence un compte
   de service dédié, avec le seul rôle Cloud Datastore User (roles/datastore.user).
2. Créer une clé privée JSON de ce compte de service et la conserver en sécurité.
3. Dans https://dash.cloudflare.com/ ouvrir Workers & Pages, puis le projet qui
   correspond à classeur-tim-v16.pages.dev.
4. Ouvrir Settings > Variables and Secrets > Add ; choisir Production et
   impérativement Secret / Encrypt (valeur chiffrée).
5. Nom exact du secret : FIREBASE_SERVICE_ACCOUNT
   Valeur : le contenu complet du JSON de la clé du compte de service.
6. Ne jamais envoyer la clé par chat, photo, e-mail ou dépôt GitHub.
7. Une fois le secret en place, publier la branche testée sur main afin de
   déployer Cloudflare. Vérifier GET /api/status, puis les connexions Parent
   et Tim en lecture seule.
8. Attendre une véritable validation naturelle d'exercice par Tim avant de
   vérifier le transfert de sa note ; ne jamais sacrifier un exercice pour un test.

**Ne pas lancer l'ancien programme de déploiement Cloud Functions Firebase** :
il exige Blaze et ne correspond pas à cette solution.

## Quotas
Cloudflare Pages Functions utilise le quota Workers Free (100 000 requêtes/jour).
Firestore Spark conserve ses limites gratuites (notamment 50 000 lectures et
20 000 écritures par jour). Un classeur personnel y reste normalement bien en dessous.

## Sécurité et limites
- Un compte de service Google IAM valide est nécessaire et reste à vérifier.
- La clé est un secret sensible ; la révoquer si elle est exposée.
- Ne pas fusionner la branche avant de disposer du secret Cloudflare.
- Le fonctionnement en situation réelle n'est pas encore confirmé.
