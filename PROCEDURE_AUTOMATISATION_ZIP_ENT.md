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