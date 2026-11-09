# Audit des leçons de mathématiques — Tim 3e D
**Date : 9 novembre 2026.** État de la source ENT vérifié jusqu'au **6 novembre 2026**. Dernière consigne de devoir reçue pour le **9 novembre 2026**.

## Inventaire vérifié sur le site interactif
- **17 cours ENT** (M26S0914 à M26S1106), du 14 septembre au 6 novembre. Liste chronologique intégrale ajoutée à `maths-parcours.js` sans modifier les cours du professeur.
- **23 leçons BIS** (MBIS01 à MBIS23). Les 23 comprennent chacune : objectif, explication simple, méthode étape par étape, exemples corrigés, schéma SVG, erreur fréquente ; chacune dispose aussi de la rubrique « Je n'ai pas compris ».
- **23 évaluations BIS de 10 questions** (MT01 à MT23), avec notation et corrigé immédiats, déjà vérifiées séparément.
- **7 fiches d'exercices ENT archivées** dans le site, conservées comme sources originales de 3 à 6 questions et distinctes des évaluations BIS.
- Les cours ENT ne sont pas des transcriptions intégrales de tous les PDF de la professeure ; ce sont des fiches de séance et des renvois aux supports.

## Sujets des 23 leçons BIS
| Rubrique | Leçons | Nombre |
|---|---|---:|
| Calculs numériques : relatifs, fractions, puissances, écriture scientifique | MBIS01–04 | 4 |
| Pythagore, réciproque, contraposée et applications | MBIS05–09 | 5 |
| Calcul littéral, distributivité, double développement, programmes de calcul | MBIS10–13 | 4 |
| Thalès, rapports, calculs et exercice mixte | MBIS14–17 | 4 |
| Problèmes type brevet | MBIS18 | 1 |
| Automatismes | MBIS19–21 | 3 |
| Révisions et correction du contrôle du 16 octobre | MBIS22–23 | 2 |

## Vérification réelle des pièces jointes côté site : lacune importante
Audit GitHub Actions, compte Parent en **lecture seule**, 9 novembre : https://github.com/benjamin30121976-del/classeur-tim./actions/runs/42538212745

| Indicateur | Résultat |
|---|---:|
| Fiches ENT mathématiques chargées | 17 |
| Fiches ENT avec une pièce jointe effectivement associée dans Firestore | **1** |
| Fiches ENT sans pièce jointe directement associée | **16** |
| Erreurs de lecture des références | 0 |

La fiche ayant une pièce jointe est **M26S1009 — Thalès du 9 octobre**. Les autres cours ne sont pas nécessairement incomplets en texte ; **leurs fichiers originaux ne sont pas reliés directement à leurs fiches en ligne**. Cette lacune n'est pas résolue par la présence de supports dans le dossier de bibliothèque.

## Originaux conservés dans la bibliothèque hors site
`/Suivi scolaire Tim 3D/Mathématiques/Pièces jointes/` contient **68 captures PNG, 5 PDF originaux, 2 présentations ODP** :
1. Exercices d'application directe de Thalès (9 octobre).
2. Leçon de Thalès (9 octobre).
3. Exercices type DNB Thalès/Pythagore (15 octobre).
4. Fiche égalité des trois rapports et programmes de calcul (2 novembre).
5. Corrigé officiel du contrôle du 16 octobre, sujets A et B (5 novembre).
6. Automatismes 5.1 (2 novembre) et 5.2 (5 novembre), présentations originales.
Les captures documentent aussi les cours de septembre et octobre dont les PDF complets n'ont pas été obtenus. **Ne pas supprimer ni écraser ces originaux.**

## Éléments précisément manquants dans les sources
- **1er octobre** : page 2 du PDF de la leçon officielle sur le développement littéral ; page 1 seulement conservée en image.
- **12–15 octobre** : énoncés exacts des exercices n° 18 et 19, page 252 du manuel, non récupérés.
- **13 octobre** : contenu détaillé de la séance PIX, non reconstitué.
- **16 octobre** : copie personnelle et note de Tim non reçues ; corrigés officiels A/B bien conservés.
- **9 novembre** : la consigne « Faire exercice n° 35 page 77 » est archivée sous `Exercices/2026-11-09 - Devoir exercice 35 page 77.md`, mais la page 77/énoncé manque. Ce devoir n'autorise pas à inventer une nouvelle leçon.

## Prochaines opérations nécessaires
1. Relier aux bonnes **fiches ENT** les PDF, présentations et captures déjà conservés en bibliothèque, après contrôle de leur correspondance, de leur intégrité et des règles d'accès Parent/Tim. Aucune importation ni attachement automatique n'a été réalisée par cet audit.
2. Récupérer les pages et la séance manquantes listées ci-dessus, et les attribuer aux bonnes dates.
3. Vérifier l'ENT à partir du **9 novembre** pour savoir si de nouvelles leçons ont été publiées après le 6. Sans nouvelle capture du cahier de textes, ne pas annoncer que le 9 novembre est à jour.
4. Ne pas mélanger les sujets originaux de Mme Pialet avec les leçons pédagogiques BIS et leurs évaluations.

**Conclusion : les leçons BIS sont structurellement complètes. Les 17 séances ENT connues sont référencées, mais les originaux ne sont reliés que dans 1 fiche sur 17 ; l'actualisation au-delà du 6 novembre reste à confirmer.**

## Vérification de la chronologie sur le site
- Contrôle avec le compte Parent en lecture seule, ordinateur **et téléphone** : les **17 fiches ENT** apparaissent dans la chronologie, aucun doublon ni séance manquante dans cette liste.
- GitHub Actions : https://github.com/benjamin30121976-del/classeur-tim./actions/runs/42538472920 (**0 anomalie**).
- L'absence de 16 pièces jointes sur 17 dans les fiches originales reste un problème distinct, à corriger en important les fichiers déjà archivés depuis la bibliothèque ; la chronologie ne remplace pas ces pièces jointes.
