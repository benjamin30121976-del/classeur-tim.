# Règles de qualité des exercices — classeur de Tim (3e D)

Dernière révision : 8 novembre 2026.

## Source et présentation
1. Distinguer sans ambiguïté les **exercices ENT originaux** de Mme Pialet, les **leçons BIS pédagogiques** et les **mini-évaluations BIS** (deux questions côté serveur). Ne jamais présenter un mini-test BIS comme la reproduction d'un devoir entier.
2. Chaque exercice est compréhensible seul : titre, objectif, consigne explicite, **énoncé complet avant les questions**, toutes les valeurs et unités, tableaux, schémas, programmes A/B et pièces jointes nécessaires. Ne pas employer « ici », « ci-dessus » ou « cette figure » lorsque le support n'apparaît pas sur le même écran.
3. Prévoir des questions progressives : compréhension simple, application guidée, justification. Une seule demande nette par question, avec vocabulaire de 3e.
4. En géométrie : préciser alignements, parallélisme, angles droits et correspondances des points ; une conclusion ne doit jamais reposer sur une figure absente.
5. En programme de calcul : reproduire **toutes les étapes dans l'ordre**, puis poser les questions. Conserver les programmes A/B visibles pendant la saisie.
6. Les exercices ENT classés uniquement par chapitre doivent être étiquetés « du chapitre ». Ne pas laisser croire à un rattachement exact à une sous-leçon sans relation vérifiée.

## Notation et sécurité
7. Vérifier **indépendamment** tous les calculs, toutes les options (aucun doublon équivalent), la bonne réponse, la correction et l'explication de chaque distracteur avant publication.
8. Une validation par exercice ; **jamais de validation de test sur le compte de Tim**. Le parent peut consulter la note, les erreurs et les leçons à revoir. Une question incomplète doit bloquer l'envoi plutôt que consommer une tentative.
9. Ne pas promettre une correction immédiate si l'API ne retourne pas effectivement la note et le corrigé. Afficher honnêtement les erreurs serveur. Éviter les pénalités XP pour des questions peu claires ou une correction inaccessible.
10. Le **défi du jour est suspendu** jusqu'à vérification complète des énoncés, de la correction et de la notation. Ne pas le réactiver par un simple changement de date. Conserver l'historique des tentatives (pas de suppression implicite).

## Contrôle du site
11. Navigateurs : **Chromium + Playwright avec GitHub Actions**, sans modifier les données d'apprentissage. Workflow : `.github/workflows/inspection-parent-authentifie.yml`; demande de contrôle : `browser-requests/parent.json`.
12. **Ne pas relancer TinyFish : son portefeuille est à court de crédits.** Ne pas demander de paiement pour ce travail.
13. Vérifier la syntaxe JavaScript, puis la navigation desktop/téléphone, l'énoncé visible et la présence de toutes les questions. Les mini-tests générés côté serveur nécessitent un audit spécifique de leur contenu avant d'être déclarés validés.
14. Ne jamais annoncer qu'une publication sur Cloudflare est fonctionnelle sans en avoir vérifié le résultat.

## Audit du 8 novembre 2026
- Fiche authentique « Deux programmes de calcul », devoir du 8 octobre : programmes A et B et cinq questions retranscrits dans le parcours `MBIS13`.
- Huit questions incomplètes corrigées dans les leçons `MBIS14`, `MBIS15`, `MBIS16`, `MBIS18` et `MBIS23`.
- Les deux questions des 23 mini-évaluations sont délivrées par le serveur : leur validation pédagogique individuelle **reste à faire**.
- Les exercices historiques du professeur ne sont pas écrasés. Les résultats antérieurs de Tim ne sont pas modifiés.
