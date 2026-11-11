# Intégration des animations validées — Tim

## Périmètre validé
- Ne pas changer l'introduction `assets/loup-intro.gif`.
- Ne pas changer le défi du jour tant que son image n'est pas contrôlée sur le site.
- Ne pas changer la jauge `assets/barre-xp-original.jpg` ni son compteur réel.
- Remplacer le défi du samedi par le parchemin « +10 XP à gagner ».
- Afficher le dimanche « +20 XP gagné » seulement si la validation donne réellement 20 XP.
- Afficher les cinq animations de résultat après la validation sûre d'un défi du jour : +3, +2, +1, 0, −1.
- Ajouter un **défi bonus Parent** de 5 XP, distinct du bonus automatique existant.

## Les médias ne sont pas encore dans cette branche
La branche contient le code, pas les médias binaires du chat.
Le ZIP validé est `Tim_Toutes_Animations_Validees_Avec_Bonus.zip`.

Pour ajouter les médias, depuis GitHub sélectionner cette branche, puis **Add file > Upload files** et y envoyer ce ZIP **à la racine**. Le workflow `Installer les animations validées de Tim` extraira exactement les neuf médias attendus dans `assets/animations/`, sans toucher à l'introduction, au défi du jour ni à la jauge.

Le lecteur `tim-animations.js` ignore les médias absents et possède un bouton « Passer l’animation » : aucun exercice ne doit devenir inaccessible.

## Le nouveau défi bonus
Compte Parent : espace Parent > « Défi bonus personnalisé · +5 XP » > sélectionner un exercice de 10 questions minimum > attribuer.

Compte Tim : accueil > « Cadeau surprise · Défi bonus du Parent » > ouvrir le cadeau > répondre une fois.

Attribution automatique : **5 XP si au moins 85 % de réussite ; sinon 0 XP**. La note et le corrigé sont immédiatement disponibles. Ces points ne consomment pas le plafond des anciens bonus automatiques. Les essais déjà enregistrés restent intacts.

Les fonctions Firebase à publier après validation sont `assignParentBonus`, `getParentBonus` et la nouvelle version de `submitTimExercise`. Le workflow existant `Publier les fonctions Firebase Tim et Parent` a été adapté pour les inclure, mais reste manuel. Il faut le lancer depuis GitHub Actions après fusion et sauvegarde du déploiement précédent. Les règles Firestore ne changent pas.

## Vérifications avant mise en production
1. `node scripts/test-animations-bonus.mjs` ; vérifier les cinq notes et les barèmes.
2. Sous Tim : un défi quotidien 9/10, 7/10, 5/10, 3/10 et 1/10 (dans un environnement de test) déclenche respectivement +3, +2, +1, 0, −1 ; pas de nouvelle tentative permise.
3. Le samedi, le parchemin apparaît avant l'ouverture des 20 questions.
4. Le dimanche, l'hologramme « gagné » ne se déclenche qu'en cas de 20 XP réels.
5. Le Parent attribue un défi ; Tim voit le cadeau ; une seule validation ; note et correction instantanées ; le Parent voit l'essai.
6. Vérifier le son sur Android et les boutons « Passer ».
7. Confirmer l'introduction, le défi du jour et la jauge XP inchangés.

**Ne pas fusionner sans les neuf médias et la publication des fonctions Firebase.**
