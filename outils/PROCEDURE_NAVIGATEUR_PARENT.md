# Contrôle du classeur avec le navigateur Parent existant

Ce projet possède **déjà** un navigateur gratuit Chromium/Playwright via **GitHub Actions**. Ne pas recommencer une configuration TinyFish, ni réclamer des captures à l'utilisateur avant de consulter cette procédure.

- Workflow : `.github/workflows/inspection-parent-authentifie.yml`
- Script navigateur : `outils/inspecter-parent-securise.cjs`
- Déclencheur : modifier `browser-requests/parent.json` sur `main` (ou démarrer manuellement le workflow dans Actions)
- Secrets déjà configurés dans GitHub Actions : `TIM_PARENT_EMAIL` et `TIM_PARENT_PASSWORD`. Ne jamais les afficher, les exporter ni les demander en conversation.
- Adresse du site : `https://classeur-tim-v16.pages.dev/`
- Lecture des résultats : après authentification Parent, les tentatives sont stockées dans Firestore (`attempts`) et les copies privées dans `privateAttempts`. Les corrections autorisées sont également contrôlées côté serveur.
- Suivi : récupérer le statut du workflow et ses logs via le connecteur GitHub, puis les artifacts sous `inspection-parent-captures-masquees`.

**Confidentialité :** le workflow standard doit rester en lecture seule ; les captures masquent les données personnelles. Ne jamais mettre les réponses de Tim, sa note détaillée ou les identifiants de session dans les logs GitHub ou une issue publique. Si une lecture privée est nécessaire, produire un rapport chiffré ou utiliser une méthode sécurisée adaptée. Toute suppression/modification de résultats nécessite une demande explicite du Parent.

**8 novembre 2026 :** le défi d'essai espagnol `DAY_20261108_01` a été retiré du générateur et du site. La tentative, la copie et la correction Firebase ont été supprimées, et les compteurs XP corrigés. Le navigateur a confirmé l'absence de ces trois documents lors d'une seconde vérification. Ne pas recréer ce défi lors de prochains imports.

Cette procédure doit être recherchée en premier lors des prochains contrôles du classeur.
