# Classeur Tim — audit de couverture du cycle ENT

Statut : **audit sur branche de préparation ; pas de feu vert à Tim**. Le code et les tests sur données fictives ne constituent pas une intégration complète de vrais cours ENT, ni une publication sur le site.

## 1. Obligations à chaque réception de ZIP
- Comparer la collecte au **site réellement intégré** et à l'historique confirmé, pas seulement à un fichier « état candidat ». Conserver les originaux et les liens source.
- Distinguer leçons nouvelles, modifiées, déjà intégrées, incomplètes ; devoirs du jour, pour demain, à venir, sans date et à échéance passée. Une case ENT « fait » ne prouve pas que Tim a exécuté le travail.
- Lier chaque PDF/image/document original à son cours ou devoir via **identifiant ENT**, vérifier son intégrité et son ouverture sur mobile et PC. Un fichier seulement repéré dans un ZIP **n'est pas encore publié ni lisible**.
- Si le texte du cours est uniquement dans le PDF, **le consulter réellement** avant de produire une leçon BIS ; une fiche inventée à partir du seul titre est interdite.
- Pour chaque cours : cours original non altéré, BIS pédagogique, « Je n'ai pas compris », exemple guidé, série d'exercices de dix questions, solutions, corrections et renvoi à la leçon. Texte exact du professeur distinct de l'explication de ChatGPT.
- Pour chaque devoir de demain : consigne et pièce d'origine, 1 à 3 bonus selon la charge réelle ; pour **chaque devoir futur**, au moins une série de dix questions datée et reliée à l'identifiant ENT. Ne pas recréer ce bonus lorsqu'il passe de J+7 à J+1.
- Entraînements complémentaires quotidiens : 2 à 5 séries pertinentes selon les matières récentes, distinctes des trois défis quotidiens de dix questions.
- Défis : trois en semaine, mélange fondé sur les matières **réellement couvertes par les derniers cours** ; grands défis du samedi et du dimanche de vingt questions minimum, préparés en avance. Conserver les défis anciens/commencés.
- Chaque question : énoncé compréhensible, réponse prouvée, correction qui explique pourquoi, particularités de langue (accents, ponctuation), démonstration et rédaction en maths/sciences ; dessins quand ils éclairent la notion.
- Leçon, bonus, défi : respecter les **barèmes propres à la catégorie**, note sur dix, tentative unique, retour immédiat lorsqu'une correction automatique est possible, aucune modification rétrospective des résultats.
- Parent : compte rendu par exercice avec énoncés, réponses de Tim, erreurs, correction et leçon à revoir ; Tim : navigation intuitive, PDF utilisables, « À venir » et exercices réellement visibles.
- Vérifier les sept matières et signaler toute autre matière ENT non encore gérée, sans la supprimer silencieusement.
- En fin de cycle : récapitulatif par catégorie **prévu / rédigé / vérifié / importé / publié / visible sur Tim et Parent**. Dire clairement les blocages ; pas de feu vert si une seule étape indispensable reste non vérifiée.

## 2. État technique constaté
- **Codé et testé sur ZIP fictifs** : classement différentiel, nouvelles/anciennes échéances, préparation des bonus devoirs futurs, vérification de la présence d'une correction, contrôles de PDF manquant, d'échéance absente et de leçon sans entraînement. La détection de PDF n'établit pas l'intégrité ni l'affichage.
- **Tests de régression existants** : moteurs de corrections, XP, défis et écran À venir. Ces tests utilisent des données synthétiques ; ils ne garantissent pas l'exactitude scientifique d'une future question.
- **Navigateur Chromium authentifié** : essais de navigation en lecture seule sur les comptes Tim et Parent sur ordinateur et téléphone. Sur la branche, le script inspecte la **production actuelle**, pas les nouvelles modifications non publiées.
- **Non achevé** : collecte Termux quotidienne ciblée sept matières en conditions réelles ; lecture et import exhaustifs des PDFs avec provenance ; rédaction/publipostage de toutes les BIS, aides, corrections et nouveaux défis ; passage réel ZIP → contenu Firebase/Cloudflare → inspection nouvelle version ; vérification profonde de chaque correction et aperçu Parent.
- **Protection** : aucune écriture de tests sur les copies, notes, tentatives, XP, images privées de Tim ; aucune fusion `main`, aucun déploiement sans accord.

## 3. Critère du feu vert
Dire « Tim peut travailler » **uniquement si** le ZIP réel a été traité, les données effectivement créées et contrôlées, les pièces PDF accessibles, les exercices et corrigés complets, les bonus et les défis affichés, la publication expressément autorisée puis réalisée et la production vérifiée sur les deux comptes. Sinon : transmettre un bilan d'écarts, ne pas promettre la disponibilité.

La lecture d'un document privé se fait dans les outils autorisés et jamais par TinyFish. Le parent ne doit pas devoir rappeler la création des étapes pédagogiques.
