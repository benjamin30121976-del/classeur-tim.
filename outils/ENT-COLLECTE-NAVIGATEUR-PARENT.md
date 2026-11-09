# Procédure de collecte du compte Parent ENT — navigateur authentifié

## Quand utiliser
Lorsque le collecteur GitHub ne peut pas accéder à sso.mon-ent-occitanie.fr (préflight HTTP échoué), ne pas répéter la connexion Python depuis GitHub. Utiliser **ChatGPT Work avec navigateur cloud** ou tout navigateur de travail avec session Parent explicitement autorisée. Ne jamais envoyer l'identifiant ou mot de passe EduConnect dans la conversation ni dans un journal.

## Point d’entrée vérifié
Établissement : Collège Frédéric Desmons, Saint-Geniès-de-Malgoirès (Gard), académie de Montpellier.
Adresse officielle : https://frederic-desmons.mon-ent-occitanie.fr/
Page EduConnect générique seule : ne pas l'utiliser comme point de départ.
Depuis l'accueil du collège : « Se connecter », « Élève ou parent », « de l'académie de Montpellier » (EduConnect), « Responsable d'élève ». L'utilisateur réalise lui-même l'authentification si nécessaire.
Ne pas confondre avec l'académie de Toulouse ni avec le compte Élève.

## Objectif de lecture (aucune modification de l'ENT)
- Pour Tim en 3e D, relever les devoirs, matière, professeur lorsque visible, date d'annonce, date d'échéance, consignes exactes, pièce jointe et état (si présent).
- Pour chaque matière, relever les contenus de séance / cours ENT originaux, dates, titres, textes complets et pièces jointes (PDF, DOC, images, schémas).
- Relever d'abord depuis le 01/09/2026, puis lors des visites suivantes uniquement les nouveaux éléments ou changements ; prévoir lecture en plusieurs lots par matière.
- Conserver les fichiers originaux et leur source sans transformer les cours ; créer séparément les leçons BIS, entraînements corrigés et exercices.
- Si un document est inaccessible, noter son titre et son emplacement sans l'inventer.

## Archivage privé
Dossier privé existant : /Suivi scolaire Tim 3D/
Créer un sous-dossier par matière dans son classeur existant ; enregistrer les pièces jointes en conservant un nom lisible.
Format de relevé JSON recommandé : 
{
  "matiere":"Mathématiques", "type":"cours", "date":"2026-11-09",
  "titre":"...", "contenu_original":"...", "source":"ENT Collège Frédéric Desmons",
  "url_source":"...", "pieces_jointes":["..."], "statut":"verifie"
}
Chaque devoir doit porter une date d'échéance et un indicateur du caractère complet de l'énoncé.
Ne rien publier dans le dépôt GitHub public. Ne pas envoyer de captures de Tim/notes/identifiants dans des journaux d'exécution.

## Après récupération
Comparer aux classeurs existants, ne jamais écraser les cours ENT, signaler les éléments manquants et préparer les leçons BIS/exercices avec le Parent avant publication sur le site de Tim.

## État technique au 09/11/2026
Le SSO Occitanie coupe les requêtes HTTP depuis les runners GitHub, y compris Chromium. Les secrets ENT_USERNAME et ENT_PASSWORD sont déjà installés dans GitHub Actions. La connexion complète via navigateur authentifié doit être validée avant d'annoncer une récupération automatique opérationnelle.
