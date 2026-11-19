# Automatisation ENT → pédagogie — contrat de sécurité

Ce dossier prépare un pack depuis des fiches structurées rédigées à partir des documents ENT. Il ne fabrique jamais une correction depuis un simple nom de PDF.

Chaîne : ZIP ENT → inventaire SHA-256 → lecture des contenus réels → fiches JSON sourcées → validation de 10 questions par leçon → pack brouillon → revue des corrections → intégration dans les modules existants → tests GitHub Actions Chromium/Playwright → publication uniquement après autorisation.

Commande de préparation : `python outils/preparer_import_ent.py archive.zip --output import-ent-preparation`.
Commande de validation : `python outils/construire_pack.py fiches.json --output pack-ent-brouillon.json`.

Schéma des fiches : `{"lecons":[{"id_ent":"id-unique","matiere":"Mathématiques","titre":"...","cours_original":"texte exact du cours","source_document":"chemin source","date_seance":"2026-11-19","lecon_bis":"explication pédagogique","je_n_ai_pas_compris":"aide détaillée","questions":[{"type":"ecrit","enonce":"...","reponse":"...","explication":"...","lecon_a_revoir":"..."}]}]}`.

Dix questions distinctes minimum. QCM : type qcm, choix de 3 propositions minimum, réponse présente dans choix. Aucun accès Firebase, aucune modification de tentative ou XP. Le pack n'est pas directement injecté dans le site : les formats de données et la logique serveur existants doivent être adaptés et testés avant intégration. Les barèmes de référence sont inclus comme garde-fou et non appliqués à des résultats réels.

Statuts obligatoires : préparé, validé structurellement, intégré en branche, testé, publié, vérifié. Ne jamais confondre ces étapes.
