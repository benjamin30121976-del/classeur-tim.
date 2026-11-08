# Règles de qualité des exercices — classeur de Tim (3e D)

Dernière révision : 9 novembre 2026.

## Source et présentation
1. Distinguer sans ambiguïté les **exercices ENT originaux** de Mme Pialet, les **leçons BIS pédagogiques** et les **évaluations BIS** (dix questions notées côté serveur). Ne jamais présenter un mini-test BIS comme la reproduction d'un devoir entier.
2. Chaque exercice est compréhensible seul : titre, objectif, consigne explicite, **énoncé complet avant les questions**, toutes les valeurs et unités, tableaux, schémas, programmes A/B et pièces jointes nécessaires. Ne pas employer « ici », « ci-dessus » ou « cette figure » lorsque le support n'apparaît pas sur le même écran.
3. Prévoir des questions progressives : compréhension simple, application guidée, justification. Une seule demande nette par question, avec vocabulaire de 3e.
4. En géométrie : préciser alignements, parallélisme, angles droits et correspondances des points ; une conclusion ne doit jamais reposer sur une figure absente.
5. En programme de calcul : reproduire **toutes les étapes dans l'ordre**, puis poser les questions. Conserver les programmes A/B visibles pendant la saisie.
6. Les exercices ENT classés uniquement par chapitre doivent être étiquetés « du chapitre ». Ne pas laisser croire à un rattachement exact à une sous-leçon sans relation vérifiée.

## Notation et sécurité
7. Vérifier **indépendamment** tous les calculs, toutes les options (aucun doublon équivalent), la bonne réponse, la correction et l'explication de chaque distracteur avant publication.
8. Une validation par exercice ; **jamais de validation de test sur le compte de Tim**. Le parent peut consulter la note, les erreurs et les leçons à revoir. Une question incomplète doit bloquer l'envoi plutôt que consommer une tentative.
9. Ne pas promettre une correction immédiate si l'API ne retourne pas effectivement la note et le corrigé. Afficher honnêtement les erreurs serveur. Éviter les pénalités XP pour des questions peu claires ou une correction inaccessible.
10. Le **défi du jour est supprimé** de sa génération et de l'interface. Ne pas le recréer. Les traces historiques restent intactes. Conserver l'historique des tentatives (pas de suppression implicite).

## Contrôle du site
11. Navigateurs : **Chromium + Playwright avec GitHub Actions**, sans modifier les données d'apprentissage. Workflow : `.github/workflows/inspection-parent-authentifie.yml`; demande de contrôle : `browser-requests/parent.json`.
12. **Ne pas relancer TinyFish : son portefeuille est à court de crédits.** Ne pas demander de paiement pour ce travail.
13. Vérifier la syntaxe JavaScript, puis la navigation desktop/téléphone, l'énoncé visible et la présence de toutes les questions. Les mini-tests générés côté serveur nécessitent un audit spécifique de leur contenu avant d'être déclarés validés.
14. Ne jamais annoncer qu'une publication sur Cloudflare est fonctionnelle sans en avoir vérifié le résultat.

## Audit du 8 novembre 2026
- Fiche authentique « Deux programmes de calcul », devoir du 8 octobre : programmes A et B et cinq questions retranscrits dans le parcours `MBIS13`.
- Huit questions incomplètes clarifiées dans la banque notée, puis retrait des petits exercices isolés dans les leçons BIS.
- Les 23 évaluations comprennent désormais dix questions chacune, dont huit nouvelles questions vérifiées par sous-leçon ; la validation de leur exécution sur le site publié reste à confirmer.
- Les exercices historiques du professeur ne sont pas écrasés. Les résultats antérieurs de Tim ne sont pas modifiés.

## Audit renforcé des évaluations de mathématiques (8 novembre 2026)
- Banque serveur : worker/maths-training-curriculum.mjs et worker/maths-training-extra.mjs, 23 évaluations MT01 à MT23, dix questions par sous-leçon.
- 230 questions autonomes. Énoncés complétés pour Pythagore (triangle et unités), Thalès (alignements et parallèles), programmes de calcul et racines carrées.
- Quatre choix distincts par question. 690 mauvaises réponses possibles (trois par question). Les 230 questions disposent désormais d'une explication dédiée à chaque mauvais choix, suivie de la démarche de résolution correcte.
- 920 scénarios de notation vérifiés par simulation : quatre choix pour chacune des 230 questions. Score brut de 0 à 10, affiché aussi sur 20 (deux points par réponse exacte), avec le nombre de bonnes réponses.
- Tim voit la note et la correction immédiatement après confirmation du serveur. La même tentative ne peut pas être validée une deuxième fois.
- Le serveur utilise mathTrainingAttempts, une transaction Firestore et une précondition exists:false. Les autorisations Tim/Parent sont contrôlées côté serveur.
- Le compte Parent affiche les résultats à l'ouverture, puis les actualise toutes les 60 secondes tant que la page reste ouverte et visible. Il reçoit les réponses attendues, l'erreur spécifique et la sous-leçon conseillée.
- Tests de notation, de non-répétition et d'accès Parent/Tim dans worker/test/math-training.test.mjs, ajoutés au contrôle GitHub Actions.
- Le contrôle Chromium/Playwright du site public a été demandé : sa réussite et la mise en production ne sont pas garanties avant inspection du rapport. Ne pas déclencher de soumission depuis le compte Tim.

## Changement demandé le 8 novembre 2026 : dix questions minimum
- Le défi du jour ne doit plus apparaître ni être généré. Les missions du samedi et du dimanche restent séparées.
- Toutes les **évaluations BIS de mathématiques créées pour Tim** comportent dix questions, affichées une à une, avec navigation précédente/suivante et contrôle des réponses avant validation.
- Les exercices ENT reproduisent fidèlement les sujets des enseignants, même lorsqu'ils comportent moins de dix questions : il ne faut pas leur inventer de questions attribuées au professeur.
- Chaque évaluation BIS est notée sur 20 : dix questions à deux points, correction immédiatement après enregistrement et bilan Parent. Une seule tentative par identifiant MT01–MT23, y compris depuis un autre appareil.
- Les anciennes notes déjà enregistrées au format deux questions sont conservées sans retraitement : elles ne donnent pas droit à recommencer la même évaluation.
- Les tests automatisés doivent vérifier les 230 questions, les 920 combinaisons de choix individuels, la confidentialité des réponses, l'enregistrement unique et les droits Tim/Parent avant publication.

## Contrôle du 9 novembre 2026 : suppression des exercices BIS de deux questions
- Dans `maths-bis-data.js`, les 46 blocs « Question d’entraînement 1/2 » ont été retirés des 23 leçons BIS : ils apparaissent désormais dans l'évaluation notée complète (dix questions par sous-leçon), avec corrigé après validation.
- Le parcours `maths-parcours.js` cache également ces blocs si une ancienne copie de leçon provient encore de Firebase. Les leçons BIS affichent un bouton direct vers l'exercice noté de dix questions.
- La fiche ENT « Deux programmes de calcul » demeure un sujet original de cinq questions, consultable sans note ; un bouton ouvre séparément l'évaluation complémentaire BIS de dix questions notées, sans attribuer au professeur les questions ajoutées.
- Toutes les nouvelles corrections comportent le mauvais choix particulier, l'explication de ce raisonnement erroné et la méthode correcte. Les tests de sécurité vérifient le retour des dix explications immédiatement dans la réponse de validation et leur consultation ultérieure par Tim et le Parent.
- L'inspection du site Cloudflare reste non confirmée ; il serait inexact de déclarer sa mise en production vérifiée sans rapport Chromium.
