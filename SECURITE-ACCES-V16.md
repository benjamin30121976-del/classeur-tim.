# Restauration des accès V16 — contrôle avant publication

## Accès prévus
- Invité : lire les matières, cours, schémas et énoncés publiés, sans réponse, validation, progression ni corrigé.
- Tim : authentification Firebase existante, réponses et progression, correction différée selon exercise-policy.js.
- Parent : authentification Firebase existante, gestion et suivi.

## Blocage de sécurité constaté
Le paquet public guest-data.js contient les champs de réponse `right` et les explications `why` de nombreuses questions. Le module espagnol-05-novembre.js contient également ces champs. Toute personne peut lire ces fichiers directement depuis le site, même si l'interface masque les corrections.

**Ne pas publier le mode invité comme « corrections sécurisées » tant que les réponses ne sont pas retirées de tous les actifs publics.**

## Correction requise
1. Séparer le catalogue public (leçons et énoncés uniquement) des réponses.
2. Placer les réponses dans une ressource protégée côté serveur, avec vérification d'identité et de rôle.
3. Corriger côté serveur ; ne pas envoyer la réponse attendue au navigateur de l'invité ou de Tim avant l'heure de publication.
4. Vérifier les règles Firestore : pas de lecture publique des corrigés, résultats ou documents privés.
5. Vérifier tous les fichiers JS, JSON et les sourcemaps publics avant mise en production.
6. Tester l'accès invité en navigation privée et par requête directe aux URL des ressources.

## État
Écran d'entrée préparé sur branche `restauration-acces-v16`. Aucune publication sur main.
