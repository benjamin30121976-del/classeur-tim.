/* Transcriptions limitées aux extraits réellement lisibles sur les captures ENT,
   récupérées dans le dossier espagnol du parent (septembre–novembre 2026).
   Un énoncé = source + texte espagnol visible + traduction + explication sans réponse.
   Attention : les PDF ENT natifs ne sont pas tous conservés ; ne pas prétendre à leur exhaustivité. */
(function(){
"use strict";
const SRC={
 fiche:"3D 16 09.pdf · aperçu du 16 septembre 2026",
 horoscope:"4 El horóscopo.pdf · aperçu du 30 septembre 2026",
 accords:"3D.pdf (137,95 Ko) · aperçu du 1er octobre 2026",
 verbes:"3D.pdf (187,90 Ko) · aperçu du 30 septembre 2026",
 totem:"3F.pdf · aperçu du 24 septembre 2026",
 presente:"8 ejercicio Presente de indicativo NCCp20.pdf · aperçu du 4 novembre 2026",
 tableau:"10 lista 1 llamarse pensar poder decir traer ir ser estar tener hacer.pdf · aperçu du 4 novembre 2026",
 ent4:"Cahier de textes ENT · séance du 4 novembre 2026",
 ent5:"Cahier de textes ENT · séance du 5 novembre 2026",
 oral:"Cahier de textes ENT · séance du 17 septembre 2026"
};
const entry=(es,fr,how,source,kind="énoncé")=>({es,fr,how,source:SRC[source]||source,kind});
const ITEMS={
L01:[
 entry("Ficha de datos","Fiche de renseignements.","Il s'agit du titre du document : complète les rubriques avec tes propres informations.","fiche","titre"),
 entry("Mi nombre","Mon prénom.","Écris ton prénom, pas ton nom de famille.","fiche","rubrique"),
 entry("Mi apellido","Mon nom de famille.","Écris le nom de famille.","fiche","rubrique"),
 entry("Mi dirección","Mon adresse.","Indique l'adresse demandée dans la fiche ; ne publie pas tes informations personnelles dans les exercices publics.","fiche","rubrique"),
 entry("Edad","Âge.","Indique ton âge, en années.","fiche","rubrique"),
 entry("Mi fecha de nacimiento","Ma date de naissance.","Cherche la date où tu es né : jour, mois et année.","fiche","rubrique"),
 entry("Lugar de nacimiento","Lieu de naissance.","Indique la ville ou le lieu où tu es né.","fiche","rubrique"),
 entry("Nacionalidad","Nationalité.","Indique ta nationalité.","fiche","rubrique"),
 entry("Gustos: deporte, color, comida, actividades extraescolares, una ciudad…","Goûts : sport, couleur, nourriture, activités extrascolaires, une ville…","Donne un exemple personnel pour chacune des catégories demandées.","fiche","rubrique")
],
L02:[
 entry("¿Cuándo vas a clase de español?","Quand vas-tu en cours d'espagnol ?","Repère cuándo (quand). Réponds en indiquant le ou les jours et, si nécessaire, le moment de la journée.","fiche","question"),
 entry("Voy a clase de español el…","Je vais en cours d'espagnol le…","C'est un début de réponse : complète avec un jour de la semaine.","fiche","amorce"),
 entry("Por la mañana / por la tarde","Le matin / l'après-midi.","Choisis l'expression qui correspond à l'horaire demandé.","fiche","vocabulaire"),
 entry("Una semana de cada dos","Une semaine sur deux.","Cette expression sert quand le cours ne revient pas toutes les semaines.","fiche","vocabulaire")
],
L03:[
 entry("Busco un (una) correspondiente hispanohablante, precisamente de…","Je cherche un correspondant (ou une correspondante) hispanophone, précisément de…","C'est un début de présentation : indique un pays souhaité après de.","fiche","amorce"),
 entry("Hispanohablante","Qui parle espagnol ; hispanophone.","Ce mot désigne la langue parlée, pas une nationalité particulière.","fiche","vocabulaire")
],
L04:[
 entry("Me gusta(n)…","J'aime…","Écris une activité ou une chose que tu apprécies ; le verbe dépend de ce qui est aimé.","fiche","amorce"),
 entry("No me gusta(n)…","Je n'aime pas…","Écris une activité ou une chose que tu n'aimes pas.","fiche","amorce"),
 entry("¿Cuál es tu deporte favorito?","Quel est ton sport préféré ?","La question demande un sport. Tu peux répondre avec une phrase courte.","oral","question")
],
L05:[],
L06:[
 entry("El horóscopo: ¿De qué signo eres?","L'horoscope : de quel signe astrologique es-tu ?","La question porte sur ton signe astrologique, pas sur ton caractère.","horoscope","titre et question"),
 entry("Nací el… (tu fecha de nacimiento)","Je suis né(e) le… (ta date de naissance).","Complète avec le jour, le mois et éventuellement l'année de naissance.","horoscope","amorce"),
 entry("Entonces, soy… (tu signo astrológico)","Donc, je suis… (ton signe astrologique).","Complète avec ton signe astrologique.","horoscope","amorce"),
 entry("Según el horóscopo soy… (tu carácter, 4 palabras)","Selon l'horoscope, je suis… (ton caractère, quatre mots).","Choisis quatre adjectifs pour décrire le caractère annoncé par l'horoscope.","horoscope","amorce"),
 entry("Estoy / No estoy de acuerdo con…","Je suis / Je ne suis pas d'accord avec…","Indique si tu es d'accord avec la description et précise le trait de caractère concerné.","horoscope","amorce")
],
L07:[
 entry("Pon en femenino: Soy un chico seductor pero celoso.","Mets au féminin : je suis un garçon séducteur mais jaloux.","Tu dois transformer la phrase pour parler d'une fille : observe les noms et les adjectifs qui changent. La réponse n'est pas donnée ici.","accords","consigne et phrase"),
 entry("Pon en singular: los Piscis son sensibles pero intuitivos.","Mets au singulier : les Poissons sont sensibles mais intuitifs.","Passe du pluriel au singulier : examine l'article, le verbe et les adjectifs.","accords","consigne et phrase"),
 entry("Pon en plural: el Leo es brillante pero orgulloso.","Mets au pluriel : le Lion est brillant mais orgueilleux.","Passe du singulier au pluriel : vérifie l'article, le verbe et les adjectifs.","accords","consigne et phrase"),
 entry("¡Ojo! Z: vivaz → vivaces","Attention ! Pour vivaz (vif/vive), le pluriel est vivaces.","Repère l'exception : devant la terminaison -es, certains mots changent z en c.","accords","rappel")
],
L08:[
 entry("Artículo definido","Article défini (le, la, les).","Observe si le nom est masculin ou féminin, singulier ou pluriel avant de choisir el, la, los ou las.","accords","titre de tableau"),
 entry("Artículo indefinido","Article indéfini (un, une, des).","Observe le genre et le nombre du nom avant de choisir un, una, unos ou unas.","accords","titre de tableau")
],
L09:[
 entry("Presente de indicativo","Présent de l'indicatif.","C'est le temps de conjugaison à utiliser pour compléter les phrases.","presente","titre"),
 entry("Hablar / aprender / vivir","Parler / apprendre / vivre.","Ce sont les trois verbes modèles du tableau. Repère à quelle personne correspond chaque terminaison.","presente","modèle")
],
L10:[
 entry("Llamarse, ir, traer","S'appeler, aller, apporter.","Ces trois verbes apparaissent dans le tableau à apprendre ; observe les six personnes.","verbes","liste de verbes"),
 entry("No copiar","Ne pas recopier.","Cette mention apparaît sur le document de conjugaison : lis les consignes de la professeure pour savoir ce qu'il faut faire.","verbes","indication")
],
L11:[
 entry("¿Cuándo vas a clase de español?","Quand vas-tu en cours d'espagnol ?","Identifie le mot interrogatif cuándo : on te demande quand.","fiche","question"),
 entry("¿Cuál es tu deporte favorito?","Quel est ton sport préféré ?","Identifie cuál (quel) et réponds avec un sport.","oral","question"),
 entry("¿De qué signo eres?","De quel signe astrologique es-tu ?","On te demande ton signe astrologique.","horoscope","question")
],
L12:[],
L13:[
 entry("Presente de indicativo (Ejercicio NCC Practica p.20): completa el texto.","Présent de l'indicatif (exercice Práctica NCC, page 20) : complète le texte.","Cherche le sujet de chaque phrase, puis conjugue le verbe entre parenthèses au présent.","presente","consigne"),
 entry("¡Hola! __________ (presentarse – yo); soy Quique.","Bonjour ! Je __________ (se présenter – je) ; je suis Quique.","C'est un verbe pronominal. Conjugue presentarse à la première personne du singulier, sans regarder la correction.","presente","phrase à trous"),
 entry("Mi perro y yo __________ (correr) por la playa.","Mon chien et moi __________ (courir) sur la plage.","Repère « mon chien et moi » : cela correspond à nous. Choisis la bonne conjugaison.","presente","phrase à trous"),
 entry("Anita, mi hermanita, __________ (bañarse) y mis padres __________ (escribir) postales.","Anita, ma petite sœur, __________ (se baigner) et mes parents __________ (écrire) des cartes postales.","Il y a deux verbes à conjuguer : le premier pour Anita, le second pour mes parents.","presente","phrase à trous")
],
L14:[
 entry("Miércoles 04/11: evaluación de fin de secuencia (ver el plano)","Mercredi 4 novembre : évaluation de fin de séquence (voir le plan).","Ceci est une annonce de l'ENT, pas une nouvelle consigne d'exercice à compléter.","ent4","annonce")
],
L15:[
 entry("Presente de indicativo: llamarse, pensar, poder, decir, traer, hacer, ir, ser/estar, tener","Présent de l'indicatif : s'appeler, penser, pouvoir, dire, apporter, faire, aller, être (ser/estar), avoir.","Ce sont les verbes de la fiche. Le but est de mémoriser leur conjugaison aux différentes personnes.","tableau","titre et liste"),
 entry("Dobla el papel y completa el cuadro.","Plie la feuille et complète le tableau.","Cache le tableau de réponses déjà rempli, puis complète toi-même le tableau vide sans regarder.","tableau","consigne"),
 entry("Compara tus métodos de memorización con los de tus compañeros.","Compare tes méthodes de mémorisation avec celles de tes camarades.","Explique comment tu apprends les verbes et compare ta méthode avec celle d'autres élèves.","tableau","consigne"),
 entry("Ejercicio Práctica p.20: repasar juntos los verbos.","Exercice Práctica page 20 : revoir les verbes ensemble.","Il s'agit de la révision collective annoncée dans le cahier de textes.","ent5","activité"),
 entry("Traer el PLICKERS.","Apporter la carte Plickers.","Cette consigne concerne le matériel à apporter, pas une réponse à rédiger.","ent5","consigne")
]
};
function el(t,cls,txt){const n=document.createElement(t);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function renderPanel(id){
 const items=ITEMS[id]||[];
 const panel=el("section","spx-panel spx-ent-translations");
 panel.append(el("span","spx-label","3 · ÉNONCÉS DES DOCUMENTS ENT"));
 panel.append(el("h3","","Comprendre les consignes originales"));
 if(!items.length){panel.append(el("p","","Aucune consigne espagnole complète n'a pu être vérifiée dans les captures conservées pour cette sous-leçon. Les exercices du classeur restent disponibles, sans être présentés comme des documents officiels."));return panel;}
 panel.append(el("p","","Voici les passages lisibles des aperçus conservés. Le texte en espagnol est suivi de sa traduction et de ce qu'il faut faire. Les réponses à compléter restent volontairement vides."));
 const list=el("div","spx-ent-list");
 for(const item of items){
  const box=el("div","spx-ent-item");
  const utterance=el("p","spx-ent-spanish",item.es);
  const listen=el("button","spx-listen","🔊");listen.type="button";listen.dataset.sayEs=item.es;listen.title="Écouter en espagnol";listen.setAttribute("aria-label","Écouter cette consigne en espagnol");
  utterance.append(document.createTextNode(" "),listen);box.append(utterance);
  const translation=el("p","spx-ent-french");translation.append(el("strong","", "En français : "),document.createTextNode(item.fr));box.append(translation);
  const action=el("p","spx-ent-action");action.append(el("strong","","Ce qu'on attend de toi : "),document.createTextNode(item.how));box.append(action);
  box.append(el("small","spx-ent-source","Source : "+item.source+" · "+item.kind));
  list.append(box);
 }
 panel.append(list);
 panel.append(el("p","spx-ent-disclaimer","Ces passages proviennent des captures de l'ENT, pas de PDF intégraux. Ils ne constituent pas une transcription exhaustive des documents d'origine. Les traductions et explications ont été ajoutées pour aider Tim."));
 return panel;
}
window.TIM_SPANISH_ENT_ORIGINALS={items:ITEMS,get:id=>(ITEMS[id]||[]),renderPanel};
})();