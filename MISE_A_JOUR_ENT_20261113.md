# Mise à jour ENT du vendredi 13 novembre 2026 — préparation sur branche uniquement

Collecte directe Termux le 14 novembre à 05:17 heure française. **Aucune publication, aucune écriture Firebase, aucune note, tentative ou XP modifié.**

## Matières
- **Mathématiques** : séance 10099~6402972 ; contenu 10099~215379 : « Exercices sur la réciproque de Thalès ». Le devoir antérieur 10099~215178 (« Finir l'exercice 25 p.253 ») était pour le vendredi 13. Travaux après séance : 10099~215381 pour le lundi 16, 10099~215380 pour le jeudi 19 et 10099~215382 pour le lundi 23 ; agenda : « Exercices », sans énoncé détaillé ni PDF associé.
- **Histoire-géographie** : séance 10099~6402787 ; contenu 10099~215395, intitulé « bilan EMC et B le nazisme », sans texte HTML ; devoir 10099~215396 : « définir 5 mots » pour le lundi 16 novembre, liste absente.
- **SVT** : séance 10099~6396500 visible dans l'agenda du 13, sans contenu de cours ; deux leçons exigibles le 13, 10099~214813 et 10099~214815, sur l'inflammation et la phagocytose. Déjà présentes dans le classeur : SVT_ENT_20261113, SVT_HW_10, SVT_HW_11. Pas de doublon créé.
- **Espagnol, physique-chimie, anglais, français** : aucune séance du 13 retrouvée dans la collecte ciblée ; les cours existants restent inchangés.

## Vérifications et limites
- Rapport automatique : « 2 séances ». **Correction après lecture de l'agenda brut : 3 séances dans les 7 matières**, dont celle de SVT que le script n'avait pas associée.
- Cinq identifiants de devoir liés aux séances de mathématiques et histoire-géographie ; trois devoirs exigibles le 13 figurent dans l'agenda (2 SVT + 1 mathématiques).
- 0 pièce jointe nouvelle référencée dans l'archive. L'image de phagocytose est une ressource web référencée dans le HTML du devoir, non un nouveau PDF joint.
- Les dates futures (16, 19, 23 novembre) sont des **échéances**, pas des preuves d'une publication le 13.
- L'examen ici porte sur GitHub et l'archive ENT, non les données privées Firebase ni un navigateur connecté.
- Pas de nouveau questionnaire ni de modification des défis.

## Réalisation pédagogique du 14 novembre 2026 — branche de préparation

### Mathématiques : séquence du 13 novembre
- Le cours ENT du 13/11 est conservé distinctement : « Exercices sur la réciproque de Thalès ».
- La leçon BIS existante des 12/13 novembre est complétée sans doublon de chapitre : schéma existant, deux nouveaux exemples guidés (rapports égaux / différents), modèle de rédaction en quatre parties, rubrique « Je n’ai pas compris ».
- Les trois exercices BIS existants de 10 questions (MTH12_01 à MTH12_03) sont réutilisés, sans créer de nouvelles tentatives ni modifier leurs corrigés.
- L’exercice 25 p.253 et les exercices dus les 16, 19 et 23 novembre ne sont pas reproduits : leur énoncé original n’a pas été fourni par l’ENT.

### Histoire-géographie : leçon BIS 09
- Le seul contenu ENT du 13 est l'intitulé « bilan EMC et B le nazisme » (réf. 10099~6402787) ; aucun cours original développé n'a été publié. Cette limite reste indiquée.
- Ajout du **neuvième chapitre** (« Nazisme : dictature et persécutions »), d'une BIS pédagogique progressive, d’un schéma chronologique 1933 / 1935 / 1939–1945, d’exemples de réponse rédigée et d’aides sur les confusions fréquentes.
- Questions créées côté serveur : **HGQ_L09_01** (10 QCM) et **HGQ_L09_02** (10 réponses courtes). L’interface accède à ces deux questionnaires sans divulguer les réponses avant la validation.
- Total : 9 leçons BIS et **18 exercices de 10 questions** (180 questions), les 16 exercices précédents demeurent inchangés.
- Le devoir « définir 5 mots » pour le lundi 16 novembre (réf. 10099~215396) est rattaché à la séance du 13 ; la liste des cinq mots est manquante et n'est pas inventée.
- Repères historiques vérifiés auprès du United States Holocaust Memorial Museum :
  https://encyclopedia.ushmm.org/content/en/article/foundations-of-the-nazi-state
  https://encyclopedia.ushmm.org/content/fr/article/nuremberg-laws

### SVT : consolidation sans doublon
- Séance du 13 présente dans l’agenda, sans texte de cours : ne pas créer d’original imaginaire.
- BIS07 « Phagocytose » enrichie : quatre étapes du processus, distinction avec l’inflammation, exemple de rédaction « Je vois… / Or je sais… / J’en déduis… », aides adaptées.
- BIS06 « Inflammation » clarifiée. Le schéma existant et les **2 × 10 questions** de la BIS07 restent accessibles, sans remise à zéro des tentatives ou des XP.

### Contrôles réellement exécutés
- **GitHub Actions** : workflow existant `verifier-histoire-geographie.yml`, exécution 43557725543, branche `ent-actualisation-13-novembre-2026`, **76 tests réussis / 76, 0 échec**.
- Le workflow a vérifié la syntaxe des fichiers concernés, les questions, la correction, la tentative unique, les notes et XP sur une base fictive, ainsi que le mode d'essai Parent sans enregistrement. Les contrôles ne prouvent pas une connexion ni un affichage réels.
- **Aucune modification de `main`**, aucune écriture Firebase, aucune publication sur Cloudflare et aucune tentative réelle de Tim exécutée.
- Contrôle Chromium de l'affichage des *nouveaux* écrans sur le site publié : **non effectué** car la branche de préparation n’est pas déployée. Cela devra être vérifié après autorisation de publication.
