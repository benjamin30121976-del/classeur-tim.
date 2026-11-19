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

## Raccordement effectif des exercices et défis ENT — 19 novembre 2026

Les changements de la branche `automatisation-ent-pedagogie-20261118` doivent être repris **sans repartir de zéro** :

- Les entraînements des lots `timEntBatch:true` sont visibles dans la matière **et** dans l'onglet Exercices pour les sept matières ; ne jamais modifier les anciens parcours.
- Dans tout nouvel exercice contenant un énoncé espagnol, chaque question `q` porte `fr` ou `translationFr` ; le bouton « Traduire en français » révèle uniquement la consigne, et « Écouter en espagnol » la lit sans divulguer la réponse. L'import est refusé si cette traduction manque.
- Le plan ENT prépare **trois défis de 10 questions pour le prochain jour de semaine**, puis les deux prochaines échéances des grands défis (samedi et dimanche, **20 questions**). Les identifiants supplémentaires `ENTD_YYYYMMDD_01..03`, `ENTW_YYYYMMDD`, `ENTS_YYYYMMDD` ne reprennent **aucun identifiant historique**. Les nouveaux contenus sont rédigés, corrigés et vérifiés avant d'être importés.
- Les définitions du lot possèdent `timEntBatch:true`, `kind:'daily'|'weekly'|'sunday'`, `category:'challenge'`, `period:YYYY-MM-DD`, `realLessons:[...]`, `lesson:<ID valide>`, `questions` à 10/20 éléments (réponses et `why` vérifiables). Les défis du jour ne remplacent ceux déjà affichés que lorsque les **trois sont complets et publiés avant le jour d'ouverture**. Samedi/dimanche : même condition de publication anticipée. Le serveur refuse une validation hors période. Aucun recalcul d'ancien XP.
- La préparation `collect` n'invente aucune question ni correction : elle produit les obligations `newChallengeTasks`. L'assistant doit rédiger le contenu pédagogique à partir de la collecte réelle ; `validate --plan` refuse le ZIP si une obligation n'est pas couverte, puis `assemble` fabrique le lot privé unique. Les tests fictifs ne remplacent pas ce travail.
- **Deux corrections différentes à ne pas confondre** : la correction d'un exercice interactif de révision est donnée selon son moteur de notation et la règle de tentative unique ; le corrigé scolaire officiel d'un devoir ENT n'est intégré que lorsqu'il a été réellement fourni/autorisé par le professeur, sans le fabriquer ou le diffuser prématurément.
- Les modifications et les tests restent sur la branche isolée. GitHub Actions contrôle le code hors ligne ; les navigations Chromium authentifiées doivent être **ciblées**, notamment après la publication autorisée et non à chaque push. Toujours distinguer code testé, site publié, et affichage réellement vérifié sur Tim et Parent.

**Point restant non simulable avec les données seules :** créer les nouvelles explications et réponses exactes pour les vrais ZIP Termux, puis publier avec autorisation et constater la lecture privée de Tim. Ne pas déclarer le classeur prêt sur la seule base des tests de format.



## Règle non négociable : devoirs scolaires à rendre et entraînements

- **Devoir scolaire réellement donné par l'ENT** : respecter l'énoncé exact et la provenance du professeur. S'il est converti en questionnaire noté, il porte `kind: school`, `category: school`, `entHomeworkOriginal: true`, `linkedHomework` et `homeworkDue`. Sans origine ou date vérifiée, l'import le refuse. Aucun XP.
- Tim voit **sa note immédiatement après validation** mais ne voit aucune bonne réponse, correction ou explication avant la fin de la date limite du devoir. Le corrigé peut devenir accessible **à partir du lendemain du jour d'échéance**, selon la date Europe/Paris. Un devoir sans date vérifiable ne doit pas libérer un corrigé automatiquement.
- **Entraînements dans les leçons, Bonus devoirs et défis** : une seule tentative, correction automatique immédiate lorsque possible et XP selon leur barème propre. Un entraînement hérité qui a historiquement `category: school` ne devient pas un devoir à corrigé différé.
- La règle est vérifiée **dans le traitement des notes, dans la lecture différée du corrigé, dans l'import des lots et dans l'écran élève** ; ne pas conclure sur une simple vérification de l'interface.
- Aucune règle de report de correction ne modifie rétroactivement les copies, notes ou XP de Tim. Les vérifications de cette nouvelle règle ont été exécutées sur données fictives ; le site publié et les deux comptes n'ont pas encore été vérifiés sur ce nouveau parcours.


## Collecte sélective sept matières — prototype branché sur V4.1 (19 novembre 2026)

**Fichier préparé :** `tools/ent_tim_nouveautes_7_matieres.py`. Copie téléchargeable : `ent_tim_nouveautes_7_matieres.py` dans le dossier bibliothèque `/Suivi scolaire Tim 3D/` et dans la conversation de création. **Non encore exécuté sur Android ni validé contre les API vivantes pour les sept matières.**

Il réutilise **strictement** les modules déjà éprouvés du collecteur direct V4.1 : V3.7 (session EduConnect), V3.8 (URL et nom sécurisé) et V3.9 (pièces jointes). Le parent télécharge le `.py` dans Android puis exécute :

```bash
python ~/storage/downloads/ent_tim_nouveautes_7_matieres.py
```

Sans option : sept matières, période depuis la dernière collecte générale réussie avec au moins sept jours de recouvrement (premier lancement : sept derniers jours) et agenda jusqu'à J+21 pour retrouver les devoirs à venir. Une matière précise ou une autre date de départ se sélectionne avec `--matiere` ou `--depuis AAAA-MM-JJ` ; la période de retour est bornée à 35 jours, sans réinterroger toute l'année.

L'archive unique datée `ENT-Tim-nouveautes-AAAAMMJJ_HHMMSS.zip` contient les **originaux** des cours, les devoirs liés ou annoncés, le calendrier, l'index des pièces et leurs octets lorsque le téléchargement réussit, ainsi qu'un rapport d'erreurs. Les erreurs et fichiers dépassant les 4 Mo de la capacité d'import Parent bloquent le statut « collecte complète » et n'avancent pas le curseur. Une exécution filtrée par matière ne fait pas avancer le curseur commun. Aucun ZIP ancien ni copie de Tim n'est modifié.

**Vérifié localement** : compilation Python, détection des sept matières, dates et fenêtres, et test simulé agenda → deux types de contenu → un ZIP. **Non vérifié** : authentification réelle Android, disponibilité de tous les champs API, pièces sur serveur du collège, absence d'items manquants dans une collecte vivante et publication/affichage sur Tim ou Parent. Le serveur de l'ENT ne se contacte que lors de l'exécution volontaire dans Termux. Les ZIP doivent toujours être renvoyés à ChatGPT pour création et vérification pédagogique ; aucune génération automatique de corrigés n'est prétendue.

**Autre correction sur la même branche** : le pipeline prévoit désormais les trois défis du lundi lors d'une collecte du vendredi ou du week-end. Le diagnostic Firebase du compte Parent ne tente plus une écriture `attempts/diagnostic_interdit` sous prétexte de tester les permissions ; il est désormais intégralement en lecture seule.


## Moteur de génération pédagogique automatique (branche de travail, 19/11/2026)

**Programme interne : tools/tim_ent_autogenerate.py.** Prolonge le moteur
déjà existant tools/tim_ent_lot.py : ZIP reçu → collect → rédaction IA des BIS,
« Je n'ai pas compris », exemples guidés, entraînements, Bonus devoirs et
défis → relecture indépendante IA → validate → assemble → ZIP privé
prêt pour contrôle Parent. Aucun nouvel outil ENT, aucune commande Termux
à demander pour cette étape.

- Sources : texte officiel conservé ; pièce PDF jointe au cours d'origine.
  Extraction des PDF natifs textuels seulement, avec correspondance exacte
  par identifiant ENT. Un scan, un schéma/image ou un PDF incertain bloque
  le lot, et la transcription n'est jamais appelée « texte du professeur ».
- 10 questions par entraînement / Bonus devoirs / défi quotidien ; 20 par
  défi de samedi et dimanche. Devoirs à échéance future, identifiants stables.
- Les matières peuvent être mélangées avec un catalogue privé de leçons
  déjà vérifiées. Sans seconde matière fiable, le défi mixte est bloqué.
- Avec --existing, réemploi des fiches déjà publiées et blocage des conflits,
  sans toucher aux copies, tentatives ni XP de Tim.
- Second appel IA de vérification pour chaque fiche et série ; le validateur
  existant contrôle en plus rattachements, dates, barèmes et complétude.
  La relecture pédagogique humaine reste nécessaire avant publication.

**Dépendance technique non encore vérifiée en réel :** le programme a besoin
d'une clé API OPENAI_API_KEY, distincte de l'abonnement ChatGPT, et de
--ai-consent pour envoyer le texte des cours à l'API. Les appels peuvent être
facturés. Ne transmettre jamais de mot de passe EduConnect, de jeton de
session ni de ZIP privé au dépôt GitHub public. En l'absence de clé ou
d'accord, le programme refuse de se prétendre automatisé.

Exécution INTERNE après réception du ZIP :
- python tools/tim_ent_autogenerate.py CHEMIN_ZIP --out DOSSIER_PRIVE_VIDE --ai-consent
- Options privées facultatives : --previous ETAT_CONFIRME,
  --existing CATALOGUE_CONTENUS_SANS_COPIES, --catalog COURS_HISTORIQUES_VERIFIES.

**État de preuve :** tests sur ZIP fictif avec faux modèle IA, sans appel
réseau, vérifiés via le workflow test-ent-lot.yml. Aucun ZIP vivant de Tim
traité avec une vraie clé API, aucun import Parent, aucun déploiement
Cloudflare et aucune mutation Firestore. Ne pas dire « entièrement
automatisé et opérationnel » avant la validation du vrai circuit.

## Règle supplémentaire explicitement demandée le 19 novembre : reprendre le devoir scolaire

La règle précédente « tentative unique » ne s'applique plus aux **devoirs scolaires originaux ENT** (kind=school) déjà notés **avant ou le jour de leur échéance**. Cette modification découle d'une nouvelle consigne explicite du Parent et ne concerne ni les entraînements, ni les Bonus devoirs, ni les défis.

- Tim valide le devoir, obtient immédiatement sa note sur 10, sans voir les bonnes réponses ou la correction avant le lendemain de la date limite de rendu (Europe/Paris).
- S'il n'a pas 10/10, il peut cliquer sur « Refaire ce devoir pour améliorer ma note » et répondre aux mêmes questions à nouveau, avant ou le jour de l'échéance. Une nouvelle note est calculée **sans dévoiler la correction**. La reprise cesse au 10/10 ou après l'échéance.
- Toute tentative est une **nouvelle copie immuable** sous schoolHomeworkRetakes ; la copie initiale dans attempts/privateAttempts reste intacte. L'historique montre les notes successives et la meilleure note. Aucune reprise ne modifie xpState ou n'attribue de XP (0 XP pour le devoir scolaire).
- Le serveur authentifie Tim, vérifie la catégorie « school » et la date à chaque validation ; la réponse API ne contient ni clé de correction, ni explication. Le compte Parent consulte les notes par l'API de statut, sans envoyer une copie à la place de Tim.
- Les Bonus devoirs (homeworkBonus:true), exercices de leçon et défis **conservent** leur politique propre. Un devoir ENT qui n'est qu'une consigne « apprendre la leçon » ne doit jamais être présenté comme un questionnaire original du professeur : seules les questions vraiment accessibles peuvent être reproduites comme devoir scolaire original.
- Code : worker/school-homework-retry.mjs, API retryTimSchoolHomework / getTimSchoolHomeworkRetakes, pont boot.js et interface app.js. Tests : worker/test/school-homework-retry.test.mjs. Les tests utilisent exclusivement un Firestore fictif.

**État :** codé et testé hors ligne sur la branche, **non publié et non contrôlé sur le compte réel de Tim**. Changement de publication et de données réelles interdit sans autorisation explicite du Parent.
