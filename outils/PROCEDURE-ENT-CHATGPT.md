# Collecte ENT de Tim à la demande, via GitHub Actions

Déclencheur : modification du fichier `ent-request.txt` sur `main` par ChatGPT via le connecteur GitHub.
Le workflow `tim_ent_essai.yml` récupère les devoirs, les séances de cours et leurs pièces jointes depuis Skolengo / Mon ENT Occitanie.
Les identifiants EDUCONNECT sont exclusivement dans GitHub Actions Secrets (`ENT_USERNAME`, `ENT_PASSWORD`, `ENT_BIRTHDATE` si demandé).
La bibliothèque GitHub publique ne reçoit **jamais** les cours ni les pièces jointes en clair.

## Lecture des résultats par ChatGPT

1. Lire le dernier workflow `Collecte privee ENT Tim sur demande` et son statut via GitHub.
2. Identifier son artifact `tim-ent-documents-chiffres` et le télécharger via le connecteur GitHub.
3. Retrouver la clé privée dans la bibliothèque ChatGPT : `/Suivi scolaire Tim 3D/Acces ENT securise/tim-ent-private-key.pem`.
4. Matérialiser la clé privée dans l'espace de calcul si nécessaire ; ne **jamais** la transmettre au dépôt GitHub ni dans les logs.
5. Décompresser l'artifact GitHub ZIP et déchiffrer `tim-ent-documents.chiffre` avec :
   `python scripts/tim_ent_crypto.py decrypt tim-ent-documents.chiffre extrait/ tim-ent-private-key.pem`
6. Inspecter `manifest.json`, `cours.json`, `devoirs.json`, `pieces_jointes/`, `erreurs.json`, comparer aux classeurs, préparer les leçons BIS et demander validation du parent avant intégration.

## Premier lancement

- Renseigner les secrets GitHub une fois. Le mot de passe ne doit **pas** être communiqué dans le chat.
- Ne jamais demander à Tim son mot de passe élève ; le compte Parent suffit.
- Modifier `ent-request.txt`. L'API sera interrogée en lecture seule. Le workflow ne change aucun document ENT.
- Si les secrets manquent, le workflow échoue avec `ECHEC_CONFIGURATION_ENT`, sans exposer d'information scolaire.

## Confidentialité

L'archive est chiffrée avec RSA-OAEP/AES-256-GCM. La clé publique est versionnée dans GitHub. La clé privée existe seulement dans la bibliothèque ChatGPT du parent et ne doit pas être copiée dans le dépôt. L'archive chiffrée GitHub expire après 30 jours. Ne pas ajouter de fichiers sous `ENT/` au dépôt public.
