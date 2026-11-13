# Animations à l'entrée des exercices et au dévoilement des XP — 13 novembre 2026

## Principes non négociables
- Partir de la version actuelle du classeur ; ne modifier ni cours, ni questions, ni notes, ni copies, ni tentatives, ni calcul d'XP.
- Garder les animations d'accueil du loup, du défi quotidien, du samedi, du dimanche et la jauge existantes.
- Aucune fusion vers main ni publication de la version officielle sans accord du parent.
- Ne jamais valider un exercice depuis le compte Tim pour tester.

## Ouverture
- Compte Tim, exercice neuf : lecture du MP4 vertical `Tim_Ouverture_Exercice_Splash_Tan_Tan_V6_Moins_Aigue.mp4`, puis questions.
- Le clip dure 2,9 secondes, H264/AAC, 616 × 824 ; musique originale choisie par le parent.
- Le bouton « Passer l'animation » est disponible. Si le média manque, l'exercice s'ouvre quand même.
- Aucune relecture à l'ouverture d'une copie terminée, à une actualisation, sur le compte Parent ni en Invité.
- Routes reliées : exercices principaux de toutes matières, défis quotidiens, grands défis du week-end, bonus, entraînements d'anglais dans l'interface principale et défis mixtes.

## Correction et XP
- La validation reste confiée au service existant. Dès que le service renvoie le résultat, affichage du bilan et des corrections.
- Animation de résultat après confirmation serveur : loup +3 (mouche), +2 (ticket), +1 (vitre), 0 (paume), −1 (loup penaud) pour les défis quotidiens ; dimanche MP4 uniquement pour 20 XP réels.
- Après le clip, cartouche lisible « +N XP » ou « −N XP » et la note ; y compris 0,5 XP si présent dans le score réel.
- Samedi, bonus Parent, autres scores du dimanche et exercices XP : révélation chiffrée sans réutiliser une vidéo contenant un montant différent.
- Devoirs scolaires 0 XP et copies en attente de correction : pas de fausse récompense animée.
- Réouverture d'une copie déjà notée : accès direct au bilan, sans relancer l'animation.

## MP4 à installer depuis le téléphone
Le fichier binaire ne peut pas être transmis directement par les opérations de modification texte sur GitHub.

1. Ouvrir la branche `animations-entree-revelation-xp-20261113`.
2. À la racine du dépôt, utiliser `Add file > Upload files`.
3. Sélectionner `Tim_Ouverture_Exercice_V6_A_Importer.zip` (fourni dans la conversation), puis enregistrer **uniquement sur cette branche**.
4. Le workflow `installer-ouverture-exercice-tim.yml` vérifiera l'empreinte SHA256 du MP4, puis installera celui-ci dans `assets/animations/`.
5. Vérifier les tests et le site de prévisualisation avec Chromium/Playwright via les workflows GitHub Actions existants, sans réponse réelle ni écriture sur Firebase.

## Validation
Le branchement UI et les tests de simulation sont codés. Les tests CI ne prouvent pas, à eux seuls, la lecture sur le téléphone de Tim : une inspection mobile en lecture seule et l'accord du parent restent nécessaires avant toute publication.
