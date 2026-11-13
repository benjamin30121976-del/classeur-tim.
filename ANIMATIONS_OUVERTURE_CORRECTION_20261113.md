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

## État validé le 13 novembre 2026

- **Créé et codé :** animation d'ouverture Splash V6 (MP4) sur les nouvelles tentatives ; cinq vidéos de résultats quotidiennes ; nouvelle animation du loup à **+2,5 XP** (GIF) seulement si le serveur attribue exactement 2,5 XP ; cartouche chiffré des résultats.
- **Médias installés :** `assets/animations/Tim_Ouverture_Exercice_Splash_Tan_Tan_V6_Moins_Aigue.mp4` et `assets/animations/Tim_Animation_2_5XP_Loup.gif`.
- **Publié dans GitHub main :** PR n° 50 fusionnée (commit `1d0973ec3a3c8b04216185bad48bce1c403c7eb9`).
- **Sauvegarde avant fusion :** branche `sauvegarde-main-avant-animations-20261113`, commit `b57e5f28e3c427c0ed28f3efd41dc7bbd935962d`.
- **Test de code :** tests des montants XP, ouverture, bouton « Passer », relecture sans animation, pas de modification des notes/copies/tentatives.
- **Test Chromium/Playwright local via GitHub Actions :** succès sur écran mobile simulé et bureau ; vidéo, GIF +2,5 XP, cartouche de révélation et bouton de correction.
- **Vérification de la version réellement publiée :** workflow existant « Navigateur autonome du classeur » n° `43493151312` réussi ; sur `https://classeur-tim-v16.pages.dev/`, ouverture MP4, GIF +2,5, révélation et bouton testés en Chromium (mobile simulé et bureau), sans se connecter. Captures archivées dans les artefacts du workflow.
- **Test du corrigé des défis :** workflow n° `43493359715` réussi après adaptation du test à la nouvelle signature `openExercise(id,options={})` (aucun barème modifié).
- **Limite explicite :** les essais réels des comptes Tim et Parent n'ont pas été soumis. Le son et la fluidité sur l'appareil Android du Parent n'ont pas été vérifiés physiquement. Certains contrôles transversaux d'autres matières peuvent signaler des anomalies indépendantes, qui doivent être suivies séparément.

**Il n'y a plus de ZIP à demander ni à importer : les deux fichiers sont déjà installés et consultables sur le site publié.**
