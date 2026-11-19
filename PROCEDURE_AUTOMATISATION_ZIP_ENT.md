# Classeur Tim — chaîne de traitement des ZIP Termux

**Statut technique : branche de préparation uniquement ; aucune écriture Firestore, aucune publication Cloudflare.**

## Raccordement au fonctionnement existant

- En amont : utiliser uniquement le collecteur ENT Termux éprouvé ou son adaptation ciblée validée ; l'assistant fournit un `.py` téléchargeable et sa commande exacte. **Ce programme ne remplace pas Termux et ne contacte pas l'ENT.**
- À réception des ZIP : lancer `tools/tim_ent_lot.py collect` pour inventorier les cours/devoirs et leurs échéances, éviter les doublons par identifiant ENT, produire un plan et un bilan.
- L'assistant transforme alors les seuls nouveaux contenus en leçons ENT (sans inventer le texte du professeur), leçons BIS, rubrique « Je n'ai pas compris », séries de dix questions avec corrections, bonus devoirs pour le lendemain, et entraînements du jour. Le rapport `plan_pedagogique.json` indique les cibles. Aucune synthèse ou question n'est créée sans sources suffisantes.
- Valider le lot avec `tools/tim_ent_lot.py validate` avant tout import. Le programme génère alors un JSON compatible avec la fonctionnalité **« Publier les nouveaux cours »** déjà disponible dans le compte Parent, avec les marqueurs XP conformes. La création des contenus pédagogiques repose sur la rédaction et la vérification de l'assistant ; elle n'est pas obtenue mécaniquement par la simple extraction des ZIP.
- La publication réelle doit rester soumise à l'accord du Parent, via une session authentifiée, sans contourner Firebase. **Une branche GitHub n'est pas une publication et un import des documents d'origine dans Firebase reste séparé.**
- Les missions du jour (trois × dix questions en semaine) et les défis de samedi et dimanche (vingt questions) sont déjà calculés par les moteurs `missions-v18.mjs`, `getMixedChallengePlan` et les composants existants. Les tests doivent confirmer qu'ils contiennent les matières adéquates et ne modifient jamais les exercices commencés.
- Après autorisation, Chromium/Playwright des workflows GitHub Actions existants contrôle le site réel et le compte Parent en lecture seule. **Jamais TinyFish.**

## Exécution dans ChatGPT, après réception des ZIP

```bash
python tools/tim_ent_lot.py collect /chemin/ENT-Tim-cours-devoirs.zip /chemin/ENT-Tim-pieces-jointes.zip --date 2026-11-18 --out /chemin/lot_prive
```

Les fichiers `ent_prive_lot.json`, `plan_pedagogique.json` et `bilan_preparation.md` restent **privés dans l'espace de travail**. `etat_candidat_non_confirme.json` n'est **pas** la preuve d'une intégration ; il ne doit pas être promu automatiquement en historique validé.

Après rédaction du lot pédagogique à partir des originaux :

```bash
python tools/tim_ent_lot.py validate /chemin/lot_pedagogique.json --out /chemin/lot_import_parent.json
```

Le validateur exige notamment : matière reconnue, identifiant unique, leçon BIS et aide explicites, **dix questions** par série, une solution définie et une correction suffisamment détaillée pour chaque question. Il détecte les choix multiples identiques. Il ne démontre pas à lui seul que toutes les réponses sont justes ; l'assistant doit les relire et tester le correcteur serveur et les XP.

## Correspondance des marqueurs de notation

| Type | Données de publication | Barème |
|---|---|---|
| ENT original | `category:school` | 0 XP |
| Entraînement de leçon | `kind:training`, `category:training` | 7–10/10 : +1 ; 5–6 : +0,5 ; 0–4 : 0 |
| Bonus devoirs | `category:bonus`, `homeworkBonus:true`, `linkedHomework` et `homeworkDue` | Identique à l'entraînement, sans plafond quotidien |
| Défis du jour | moteur existant `daily` | 9–10 : +3 ; 7–8 : +2 ; 5–6 : +1 ; 2–4 : 0 ; 0–1 : −1 |
| Défis samedi/dimanche | moteurs existants `weekly` et `sunday` | Barèmes distincts dans `functions/xp.mjs` |

**Limites à ne jamais masquer :** cette première livraison automatise le classement différentiel, les échéances et le contrôle des lots. Le collecteur réseau quotidien Android n'est pas encore certifié. La rédaction des BIS/questions exige l'analyse de ChatGPT après réception des vrais ZIP. Le résultat du site n'est pas prêt tant que le Parent n'a pas autorisé la publication et que le navigateur réel n'a pas vérifié les leçons et exercices. Ne pas modifier `main` ni les copies, XP, notes ou tentatives existants.

## Devoirs à venir — nouvelle exigence obligatoire (18/11/2026)

- Le traitement porte sur **tous les devoirs futurs connus**, et pas seulement sur ceux de demain : J+2, J+3, J+4, J+7 ou plus, selon les dates réellement présentes dans le ZIP ENT.
- Une préparation d'au moins **dix questions avec solutions et explications** doit être associée à **chaque devoir à venir**. Pour une évaluation importante, proposer une seconde série lorsque la matière et les sources le justifient.
- La clé stable de chaque préparation associe l'identifiant ENT, l'échéance et le numéro de série. Une seconde collecte ne doit pas créer un doublon et une préparation de J+7 doit rester accessible lorsqu'elle passe à J+1.
- Le format publié pour ces séries est le **Bonus devoirs existant** : `category:'bonus'`, `homeworkBonus:true`, `linkedHomework:[identifiant_ENT]`, `homeworkDue:YYYY-MM-DD` ; **barème +1 / +0,5 / 0 XP, sans plafond**, une seule tentative.
- L'onglet « À venir » doit montrer tous les bonus effectivement reliés au devoir, le nombre disponible et les devoirs sans bonus ; **ne jamais dire « exercice prêt » s'il n'existe pas**.
- Le mode `collect` produit `upcomingHomeworkExercisePreparations` et `homeworkExercisePreparations` ; les séries n'y sont que **prévues**, jamais inventées à partir d'un intitulé incomplet.
- Après rédaction des questions, utiliser `validate --plan plan_pedagogique.json`. La vérification bloque si un devoir n'a pas sa série corrigée, si la date ou la matière ne correspond pas, si une correction est absente, ou si les 1–3 bonus prévus pour demain ne sont pas couverts. Avec `--existing`, les séries déjà publiées peuvent compter sans être recréées ; elles sont vérifiées structurellement.
- Vérifier le vrai parcours sur les deux comptes Parent/Tim avec GitHub Actions et Chromium/Playwright en lecture seule. Tester les nouveaux écrans dans un environnement isolé avant publication, puis revérifier le site après accord du Parent. **Jamais de copie, de réponse ou de XP de Tim modifié par les tests.**

**État des vérifications** : ZIP et devoirs simulés jusqu'à J+7, tests automatiques et rendu sur échantillons synthétiques. La chaîne avec les ZIP réels du Parent, la rédaction des nouvelles questions et la publication après accord ne peut pas être déclarée vérifiée avant sa première exécution complète.

## État du raccordement unique ENT — 19 novembre 2026

Le circuit Termux validé ne change pas : le parent récupère les ZIP avec le programme Python existant, puis les transmet dans la conversation. L'assistant lit les cours et PDF, rédige et contrôle les leçons BIS, les aides, tous les exercices et leurs corrections avant de préparer un seul lot.

1. tools/tim_ent_lot.py collect : inventaire, changements, devoirs du jour, demain, à venir, dates absentes, sources PDF incomplètes.
2. Rédaction pédagogique à partir des vrais documents : cours original exact distinct de BIS, Je n'ai pas compris, exemples guidés, 10 questions et corrections détaillées, bonus par devoir et 2–5 entraînements de révision selon le plan. Ne pas considérer un simple plan comme une fiche réellement créée.
3. tools/tim_ent_lot.py assemble : contrôle du pack rédigé et création du ZIP unique avec PACK_PEDAGOGIQUE.json, MANIFESTE_LOT_TIM.json et les originaux, par ID ENT exact. Le paramètre --mapping permet de relier explicitement les anciens cours et pièces lorsqu'ils sont prouvés. Les PDF uniquement référencés dans un index séparé sont recherchés aussi.
4. tim-ent-batch-import.js : dans le compte Parent, une validation et une confirmation pour le lot ; utilise le pont d'import existant, puis vérifie tous les SHA-256 avant et après le stockage privé.
5. boot.js et app.js : nouvelles fiches dans les sept matières, devoirs dans le calendrier, originaux affichés dans les leçons ENT et BIS, entraînements et bonus consultables ; aucun historique Tim effacé.
6. Tests : GitHub Actions hors ligne et Chromium/Playwright Parent/Tim en lecture seule, sur PC et téléphone. Les tests graphiques du nouvel import utilisent des données fictives ; le site publié n'est pas modifié.

Limites bloquantes : aucun vrai ZIP Termux de ce nouveau lot n'a encore été exécuté jusqu'à la publication. Le stockage privé limite actuellement chaque fichier à 4 Mo. Le générateur serveur des défis est essentiellement statique et n'intègre pas automatiquement les nouveautés ENT. Le dernier contrôle du compte Tim a rencontré un accès au catalogue de secours et une erreur JavaScript. Aucune publication sans autorisation distincte ; jamais de modification des notes, XP ou tentatives lors des tests.

Feu vert interdit si un document n'est pas intégré et lisible dans la bonne leçon, si une correction n'a pas été vérifiée, si un devoir futur n'a pas sa préparation ou si les deux comptes n'affichent pas correctement le travail réellement publié.

## Protection du quota Firestore et contrôles après modifications

**Décision existante reprise de la PR n°61.** Le contrôle authentifié Chromium/Playwright des comptes Tim et Parent ne doit pas se relancer à chaque commit sur la branche : il peut multiplier les lectures Firestore sans vérifier une version publiée. Le workflow `.github/workflows/inspection-comptes-eleve-parent.yml` conserve les tests de code automatiques et limite le parcours authentifié à `workflow_dispatch` après une série cohérente de modifications, puis après publication autorisée. Le contrôle PC/téléphone doit rester en lecture seule ; aucune réponse ni XP de Tim n'est modifié.

**Diagnostic du 19 novembre 2026 :** le parcours Tim reçoit HTTP 503 `firestore-limit-429` de l'API privée `getTimCourseContent` sur ordinateur et téléphone, alors que l'API de statut Cloudflare est disponible et que le compte Parent charge ses pages. Il s'agit d'une lecture de cours privée indisponible : les tests locaux réussis ne rétablissent pas le quota. Le catalogue Invité en secours ne constitue pas une preuve que tous les nouveaux exercices sont accessibles à Tim. Les tests authentifiés doivent être ciblés, pas relancés automatiquement à chaque petit changement. Le dernier test de code du workflow corrigé est réussi ; aucune publication.
