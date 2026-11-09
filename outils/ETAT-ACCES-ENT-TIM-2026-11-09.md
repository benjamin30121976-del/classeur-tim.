# Accès aux cours ENT de Tim — état vérifié le 9 novembre 2026

## Objectif du parent
Depuis ChatGPT, déclencher à la demande une lecture du compte Parent EduConnect pour obtenir les cours ENT, devoirs, consignes et toutes les pièces jointes. Préparer avec le parent des classeurs matière par matière, les leçons BIS et les exercices. Ne jamais effacer les cours/exercices existants ni installer de nouveau logiciel sur le téléphone.

## Installation conservée
- `ENT_USERNAME` et `ENT_PASSWORD` sont enregistrés par le parent dans GitHub Actions Secrets. Ne pas les demander à nouveau ni les afficher. `ENT_BIRTHDATE` demeure facultatif.
- `ent-request.txt` : incrémenter `Demande : N` sur `main` depuis le connecteur GitHub pour déclencher la collecte.
- Workflow : `.github/workflows/tim_ent_essai.yml`.
- Programme : `scripts/tim_ent_collect.py` (lecture seule ; liste les cours et devoirs ; récupère les détails et pièces jointes).
- Confidentialité : `scripts/tim_ent_crypto.py` chiffre l'archive avec une clé publique. L'archive chiffrée seule devient un artifact GitHub ; ne jamais pousser les fichiers privés dans ce dépôt public.
- Clé privée de déchiffrement : bibliothèque ChatGPT, `/Suivi scolaire Tim 3D/Acces ENT securise/tim-ent-private-key.pem`. Ne jamais la publier sur GitHub.

## Tests en situation réelle du 09/11/2026
- Établissement Frédéric Desmons trouvé dans l'API Skolengo, code ENT `entmip`.
- API `api.skolengo.com` joignable.
- Domaine SSO attendu : `sso.mon-ent-occitanie.fr`; DNS, TCP et TLS 1.3 fonctionnent depuis Linux GitHub, mais la requête HTTP est interrompue sans réponse (RemoteDisconnected / reset / timeout).
- Depuis Ubuntu, Ubuntu ARM, macOS et Windows GitHub, SSO et CAS Occitanie restent inaccessibles par requête HTTP. EduConnect répond depuis Linux/macOS ; les identifiants ne sont pas la cause démontrée du blocage.
- Navigateur Chromium sur GitHub : ne parvient pas non plus à lire les pages SSO et CAS Occitanie.
- Dernier diagnostic du collecteur : exécution `42701261690`. Comparaison quatre runners : `42702086976`.
- Tentative Cloudflare isolée dans branche de test `ent-sso-probe-20261109` ; route d'essai `/api/ent-connectivity-probe` dans `_worker.js` uniquement sur cette branche. Aucune modification du site principal. Aucune publication preview Cloudflare vérifiée ; la tentative GitHub `42702523244` a obtenu HTTP 000.
- Aucun cours, aucun devoir et aucune pièce jointe de la nouvelle collecte n'ont été récupérés. Aucun fichier scolaire en clair n'a été placé dans le dépôt public.
- Le workflow principal a été simplifié après les diagnostics : préflight bref de disponibilité SSO, puis authentification/collecte seulement si le SSO répond.

## Prochaine piste nécessaire
Utiliser une infrastructure ou session de navigation autorisée qui rejoint effectivement Mon ENT Occitanie. Si le navigateur Work ou un réseau Cloudflare correctement déployé peut rejoindre le SSO, réaliser un test SSO public d'abord, puis l'authentification parent avec stockage privé, puis un premier export chiffré, et vérifier `manifest.json`, `cours.json`, `devoirs.json`, `pieces_jointes/`.
Ne pas relancer indéfiniment le même test GitHub depuis la même infrastructure ni refaire l'installation Firefox/Termux/Violentmonkey. Le compte Parent ne nécessite pas une nouvelle saisie du mot de passe dans ChatGPT.

## Source
Tests GitHub Actions : dépôt `benjamin30121976-del/classeur-tim.`; ses journaux publics sont limités aux statuts techniques.
