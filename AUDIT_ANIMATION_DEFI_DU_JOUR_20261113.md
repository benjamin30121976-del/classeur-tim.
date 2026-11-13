# Contrôle de l'animation du Défi du jour — 13 novembre 2026

## Signalement
Le parent constate que les animations ne semblent pas apparaître en ouvrant le « Défi du jour » sur le compte Tim.

## Ce qui est établi (lecture seule)
- La version de production est `https://classeur-tim-v16.pages.dev/`.
- Dans `app.js`, chaque bouton « Mission N · Commencer » du panneau quotidien appelle `openExercise(id)`.
- `openExercise` n'essaie de lire l'animation d'ouverture **que** si le rôle est Tim, que l'exercice n'a pas déjà de tentative (`!attemptFor(id)`), et que `TIM_ANIMATIONS.playOpening` est présent.
- Le lecteur `tim-animations.js` n'affiche aucune animation si le navigateur signale `prefers-reduced-motion: reduce`.
- Un contrôle Chromium/Playwright depuis GitHub Actions (workflow `Vérifier animations et défi bonus de Tim`, run 43522629691) a confirmé la présence des trois missions quotidiennes et testé **le clic de la première mission**, la lecture de la vidéo MP4 et le retour à sa fiche sur mobile simulé et ordinateur. Aucun compte authentifié et aucune copie créée. Pour franchir le garde-fou Invité au seul moment du clic, le test a simulé le rôle élève dans la mémoire de son propre navigateur et a rétabli immédiatement le rôle Invité, sans envoi ni validation.
- Le workflow s'est terminé avec conclusion `success`.

## Non vérifié
- L'affichage sur le vrai téléphone de Tim, ses paramètres de réduction des animations, la présence d'une tentative préexistante sur la mission consultée et l'animation de résultat après une véritable correction. Les résultats personnels de Tim ne sont pas lus ni modifiés par ce test.
- L'absence de l'animation chez Tim reste donc **un signalement non résolu**, même si le clic fonctionne dans le test de navigateur.

## Prochain diagnostic utile
Contrôler en lecture seule sur l'écran du compte Tim le libellé des missions « Commencer » versus « Terminée » ; ne jamais répondre aux questions ni valider pour tester. Si les missions non terminées n'affichent pas l'animation, examiner les réglages de mouvement/autoplay et les erreurs JavaScript sur cet appareil. Ne pas modifier `main` ou les barèmes sans autorisation explicite.
