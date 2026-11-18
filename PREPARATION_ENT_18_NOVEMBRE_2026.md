# ENT de Tim — préparation du 18 novembre 2026

## Sources reçues
- `ENT-Tim-18-11-2026-cours-devoirs.zip` et `ENT-Tim-18-11-2026-pieces-jointes.zip`, collectés localement le 18/11 via Termux/Skolengo.
- 3 séances (espagnol `10099~6400507`, français `10099~6410460`, histoire-géographie `10099~6402857` sans texte).
- 8 devoirs, 5 pièces originales, dont les deux `3D.pdf` différents (`10099~115427` et `10099~115430`).

## Préparé sur cette branche uniquement
- Importeur privé `tim-ent-18nov-private-import.js` : vérifie les 5 pièces avec SHA-256 et les rattache aux cibles existantes ; ne remplace aucun fichier ; nécessite action explicite du Parent depuis son compte pour transférer les fichiers au stockage privé.
- `tim-ent-18nov-lessons.js` : nouvelle séance FR du 18/11 qui réutilise `FR_BIS12` ; complément espagnol du 18/11 avec cinq rubriques (ENT, BIS, Je n’ai pas compris, exercices ENT, préparation écrite).
- Français : `10099~6410460` ajouté sans modifier les autres cours ; les phrases présentées sont une synthèse, pas la transcription mot pour mot du texte professeur.
- Espagnol : le document `10099~115430` (3 pages) est associé à la séance du 18/11 sous un nom non ambigu ; `10099~115426` (liste 2) est réutilisé.
- SVT : leçons `SVT_ENT_20261117` et `SVT_BIS08` déjà existantes ; pièce `10099~115422` rattachée sans inventer de nouveau cours.
- Français : fiche IV `10099~114824` liée au devoir `FR_HW_214980` pour le 26/11. Le PDF n'est **pas** un document du cours de subjonctif du 18/11.
- Histoire-Géographie : séance du 18/11 sans texte ; aucun cours inventé.
- Maths : devoirs du 19/11 (51 p.259 et 32 p.94) et du 23/11 (contrôle factorisation/équations/réciproque de Thalès), mais pages de manuel non fournies.
- Physique : contrôle n°2 pour le 19/11 ; aucun nouveau cours dans cette extraction.

## Contrôles effectués
- Deux scripts JS parsés sans erreur.
- Test hors ligne des cinq IDs de pièces, de l'ajout unique du cours français et des exemples BIS, et de l'ordre des scripts dans l'index HTML.
- Aucune action GitHub Actions/Chromium exécutée à cette étape ; aucun test authentifié et aucune vérification Android effectués.
- Aucune copie, note, tentative, XP, donnée Firebase, pièce privée ou archive historique modifiée.
- **Branche main non modifiée ; aucune publication Cloudflare.**

## Points non terminés
1. Contrôle Chromium/Playwright du rendu sur la branche ou en environnement adapté, sans écrire de tentative.
2. Relecture pédagogique des dix questions espagnoles : elles sont consultables comme brouillon non noté, pas branchées sur le moteur officiel note/XP/tentative unique. Ne pas annoncer cet entraînement comme « exercice interactif noté ».
3. Publication après autorisation explicite du parent.
4. Import des cinq pièces dans le compte Parent depuis le ZIP reçu, puis vérification du stockage et de l'ouverture de chaque PDF/image (étape indispensable : rien de privé n'est publié dans GitHub).

