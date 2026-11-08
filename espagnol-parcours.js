/* Interface espagnole isolée : aucune lecture ni écriture des XP/bonus. */
(function(){
"use strict";
const C=[
 {title:"Les verbes et la conjugaison",text:"C'est quoi un verbe ? Comment le conjuguer ?",icon:"conversation",ids:["L09","L10","L13","L15"],keywords:"être conjuguer avoir faire aller"},
 {title:"Les adjectifs et le caractère",text:"C'est quoi un adjectif ? Comment décrire quelqu'un et parler de son horoscope ?",icon:"smile",ids:["L06","L07"],keywords:"féminin masculin qualités horoscope"},
 {title:"Se présenter et parler de soi",text:"Dire son prénom, son âge, ses goûts et ses activités.",icon:"person",ids:["L01","L02","L04"],keywords:"nom âge aimer sport jour cours"},
 {title:"La grammaire : construire une phrase",text:"Comprendre les petits mots comme « le », « la », « mon », « son ».",icon:"puzzle",ids:["L08","L12"],keywords:"article adjectif possessif politesse"},
 {title:"Poser des questions et écrire",text:"Comment poser une question, écrire une lettre et comprendre une consigne ?",icon:"pencil",ids:["L11","L05","L14"],keywords:"lettre contrôle question consigne énoncé écrire"},
 {title:"Les pays où l'on parle espagnol",text:"Découvrir l'Espagne, le Mexique et les autres pays hispanophones.",icon:"globe",ids:["L03"],keywords:"géographie pays espagne mexique"}
];
/* Petits pictogrammes vectoriels du même style, liés au contenu de chaque rubrique.
   Aucune police ou bibliothèque externe : un rendu constant sur Android et iPhone. */
const ICON_PATHS={
 conversation:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/><path d="M8 11h8M8 14h5"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14.5c1.2 1.5 2.4 2.2 4 2.2s2.8-.7 4-2.2"/><path d="M9 9.5h.01M15 9.5h.01"/>',
 person:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 puzzle:'<path d="M13 4V3a2 2 0 0 0-4 0v1H5a1 1 0 0 0-1 1v4h1a2 2 0 0 1 0 4H4v6a1 1 0 0 0 1 1h4v-1a2 2 0 0 1 4 0v1h6a1 1 0 0 0 1-1v-5h1a2 2 0 0 0 0-4h-1V5a1 1 0 0 0-1-1z"/>',
 pencil:'<path d="m15 5 4 4M4 20l4.8-1 10.8-10.8a2.8 2.8 0 0 0-4-4L4.8 15 4 20z"/><path d="M9 21h11"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9"/>'
};
const iconSvg=key=>'<svg class="spx-topic-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+(ICON_PATHS[key]||ICON_PATHS.conversation)+'</svg>';
const INSTRUCTIONS=[
 ["Lee el texto.","Lis le texte.","Lis le passage avant de répondre aux questions."],
 ["Completa la frase.","Complète la phrase.","Cherche le mot ou la forme qui manque dans la phrase."],
 ["Elige la respuesta correcta.","Choisis la bonne réponse.","Observe les propositions et sélectionne celle qui convient."],
 ["Relaciona las palabras.","Associe les mots.","Relie chaque mot à sa traduction ou à son équivalent."],
 ["Responde a las preguntas.","Réponds aux questions.","Lis chaque question, puis formule la réponse demandée."],
 ["Justifica tu respuesta.","Justifie ta réponse.","Explique pourquoi tu réponds cela, ou cite un passage si la consigne le demande."],
 ["Escribe una frase.","Écris une phrase.","Rédige une phrase entière, pas seulement un mot."],
 ["Verdadero o falso.","Vrai ou faux.","Décide si la phrase est vraie ou fausse, puis vérifie si tu dois justifier."]
];
/* Questions ciblées, rédigées à l'avance : pas de promesse d'IA ni de coût API.
   Distinctes de la leçon simplifiée. Chaque fiche dispose d'au moins deux difficultés fréquentes. */
const HELP_TOPICS={
 L01:[
  ["Pourquoi on dit « tengo quince años » et pas « soy quince años » ?","Pour indiquer son âge, l'espagnol utilise le verbe tener (avoir). En français on dit « j'ai quinze ans » : en espagnol, « tengo quince años ».","Essaie : tengo doce años = j'ai douze ans. La forme tengo reste la même."],
  ["Comment demander le prénom et l'âge ?","Pour le prénom : ¿Cómo te llamas? Pour l'âge : ¿Cuántos años tienes? Le premier demande un nom, le deuxième un nombre d'années.","Tu peux répondre « Me llamo… » puis « Tengo… años »."]
 ],
 L02:[
  ["Pourquoi « el lunes » veut dire « le lundi » ?","Pour parler d'un jour où tu as habituellement cours, on emploie souvent l'article el devant le jour : el lunes, el martes, el miércoles.","Voy a clase el lunes = Je vais en cours le lundi."],
  ["Quelle différence entre « por la mañana » et « por la tarde » ?","Por la mañana = le matin ; por la tarde = l'après-midi. Ces expressions donnent le moment de la journée.","Exemple : Tengo español por la mañana = J'ai espagnol le matin."]
 ],
 L03:[
  ["C'est quoi un pays hispanophone ?","Un pays hispanophone est un pays où l'on parle espagnol. Ce n'est pas forcément un pays situé en Espagne ou en Europe.","Le Mexique, l'Argentine et l'Espagne sont des exemples de pays hispanophones."],
  ["Quelle différence entre « España » et « español » ?","España est le nom du pays : l'Espagne. Español désigne la langue espagnole ou peut vouloir dire espagnol pour une personne.","Vivo en España = J'habite en Espagne. Hablo español = Je parle espagnol."]
 ],
 L04:[
  ["Pourquoi « me gusta » et « me gustan » sont différents ?","Me gusta accompagne une activité ou une seule chose. Me gustan accompagne plusieurs choses au pluriel.","Me gusta la música = J'aime la musique ; me gustan los perros = J'aime les chiens."],
  ["Comment dire ce que je n'aime pas ?","Ajoute no devant me gusta ou me gustan. Cela donne no me gusta ou no me gustan.","No me gusta el fútbol = Je n'aime pas le football."]
 ],
 L05:[
  ["Comment organiser ma lettre au correspondant ?","Fais de petits paragraphes : 1. Dire bonjour ; 2. Te présenter ; 3. Parler de tes goûts ; 4. Poser une question ; 5. Terminer la lettre.","Exemple de début : ¡Hola! Me llamo… Tengo… años."],
  ["Quelles corrections regarder dans ma lettre ?","Regarde si l'âge est indiqué avec tener, si tu dis el pueblo pour un village ou la ciudad pour une ville, et si l'invitation comporte une date complète. La photo conserve les annotations de la professeure.","Lis une correction à la fois, puis essaie de réécrire seulement la phrase concernée."]
 ],
 L06:[
  ["Pourquoi « soy » apparaît dans la description de l'horoscope ?","Soy est une forme du verbe ser (être). On l'utilise notamment pour dire son signe astrologique ou décrire un trait de caractère.","Soy Leo = Je suis Lion ; soy simpático = Je suis sympathique."],
  ["Qu'est-ce que « estoy de acuerdo » ?","Estoy de acuerdo veut dire je suis d'accord. No estoy de acuerdo veut dire je ne suis pas d'accord.","Utilise cette expression pour dire si la description de l'horoscope te correspond."]
 ],
 L07:[
  ["Pourquoi « simpático » devient « simpática » ?","De nombreux adjectifs terminés par -o deviennent -a pour décrire une fille ou un mot féminin.","Un chico simpático / una chica simpática."],
  ["Comment mettre un adjectif au pluriel ?","Pour beaucoup d'adjectifs, on ajoute -s après une voyelle. Certains adjectifs terminés par -z deviennent -ces au pluriel.","Simpático → simpáticos ; vivaz → vivaces."]
 ],
 L08:[
  ["Comment choisir entre « el », « la », « los » et « las » ?","Commence par identifier si le nom est masculin ou féminin, puis s'il est singulier ou pluriel. El = masculin singulier, la = féminin singulier, los = masculin pluriel, las = féminin pluriel.","El libro, la casa, los libros, las casas."],
  ["Pourquoi « una » et « un » ne sont pas pareils ?","Un est généralement devant un nom masculin singulier ; una devant un nom féminin singulier.","Un perro = un chien ; una perra = une chienne."]
 ],
 L09:[
  ["Pourquoi « yo hablo » et pas « yo habla » ?","Au présent, le verbe régulier hablar prend -o avec yo (je). Avec él ou ella, il prend -a. On doit d'abord identifier la personne.","Yo hablo = Je parle ; ella habla = Elle parle."],
  ["Comment savoir si je dois écrire -o, -as ou -a ?","Repère le pronom : yo = je, tú = tu, él/ella = il/elle. Avec hablar : hablo, hablas, habla. Entraîne-toi d'abord avec un seul verbe.","Yo hablo, tú hablas, ella habla."]
 ],
 L10:[
  ["Pourquoi « soy » et « estoy » veulent tous les deux dire « je suis » ?","Ser sert surtout pour l'identité ou une caractéristique. Estar sert notamment pour un état ou un lieu. Le contexte indique le verbe.","Soy francés = Je suis français ; estoy cansado = Je suis fatigué."],
  ["Pourquoi on dit « me llamo », « te llamas », « se llama » ?","Llamarse est un verbe pronominal : le petit mot change selon la personne. Me avec je, te avec tu, se avec il/elle.","Me llamo Tim ; te llamas Ana ; se llama Luis."]
 ],
 L11:[
  ["Pourquoi il y a « ¿ » au début d'une question ?","En espagnol, une question commence par ¿ et finit par ?. Le premier signe indique tout de suite qu'il s'agit d'une question.","¿Cómo te llamas? = Comment t'appelles-tu ?"],
  ["Comment choisir entre « cómo », « dónde » et « cuándo » ?","Cómo demande comment ; dónde demande où ; cuándo demande quand.","¿Dónde vives? = Où habites-tu ?"]
 ],
 L12:[
  ["Pourquoi « su » peut vouloir dire « son » ou « votre » ?","Le possessif su change de sens selon la personne dont on parle. Il peut signifier son, sa ou votre dans la formule de politesse.","Su libro peut être son livre ou votre livre selon le contexte."],
  ["À quoi sert « usted » ?","Usted est un vous de politesse utilisé pour parler à une seule personne. Le verbe se conjugue comme avec il/elle.","¿Cómo se llama usted? = Comment vous appelez-vous ?"]
 ],
 L13:[
  ["Pourquoi « mi perro y yo » correspond à « nosotros » ?","Mi perro y yo signifie mon chien et moi : nous sommes deux. C'est donc nous, qui se dit nosotros en espagnol.","Mi perro y yo corremos = Mon chien et moi courons."],
  ["Comment conjuguer un verbe avec « se » ?","Pour un verbe pronominal, repère la personne et le petit pronom : me, te, se, nos… Puis conjugue le verbe.","Anita se baña = Anita se baigne."]
 ],
 L14:[
  ["Quelle différence entre « completa » et « justifica » ?","Completa te demande de remplir ce qui manque. Justifica te demande d'expliquer pourquoi ta réponse est correcte, parfois en citant un passage.","Completa la frase = Complète la phrase ; justifica tu respuesta = Justifie ta réponse."],
  ["Je ne comprends pas la consigne de l'exercice, que faire ?","Traduis d'abord le verbe d'action : lee = lis, elige = choisis, traduce = traduis. Puis regarde si la réponse doit être un mot, une phrase ou une justification.","Avant de répondre, reformule en français : « Je dois… »."]
 ],
 L15:[
  ["Comment mémoriser dix verbes au présent ?","Travaille deux ou trois verbes à la fois. Cache les réponses, écris une forme, vérifie, puis recommence. N'apprends pas tout le tableau d'un coup.","Commence par yo soy, yo estoy, yo tengo, puis ajoute les autres."],
  ["Pourquoi « ser » et « estar » signifient être ?","En espagnol, l'idée « être » se partage entre deux verbes. Ser indique notamment l'identité ; estar indique souvent un état ou une localisation.","Soy alumno = Je suis élève ; estoy aquí = Je suis ici."]
 ]
};
const ED=window.TIM_SPANISH_EDU||{};
/* Comptage prudent des activités/exercices IDENTIFIÉS dans les captures ENT,
   jamais un inventaire exhaustif des devoirs de la professeure.
   L01 fiche de renseignements ; L02 question d'emploi du temps ;
   L05 rédaction de lettre ; L06 production horoscope ;
   L07 trois transformations de grammaire ; L13 trois phrases photocopiées ;
   L15 feuille Práctica et fiche de tableaux des 10 verbes.
   Les simulations E01…/R01… créées pour le site ne sont PAS comptées comme ENT. */
const ENT_ACTIVITIES=Object.freeze({L01:1,L02:1,L05:1,L06:1,L07:3,L13:3,L15:2});
const TRAINING_SERIES=5,QUESTIONS_PER_SERIES=10;
const esc=x=>String(x==null?"":x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const nrm=x=>String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const categoryOf=id=>C.findIndex(c=>c.ids.indexOf(id)>=0);
const listen=phrase=>'<button type="button" class="spx-listen" data-say-es="'+esc(phrase)+'" title="Écouter en espagnol" aria-label="Écouter en espagnol : '+esc(phrase)+'">🔊</button>';
const header=(title,sub)=>'<header class="spx-hero"><span class="spx-flag" aria-label="Drapeau espagnol"></span><span class="spx-kicker">ESPAGNOL · CLASSEUR DE TIM</span><h2>'+esc(title)+'</h2><p>'+esc(sub)+'</p></header>';
const back=txt=>'<button type="button" class="spx-back" data-back="yes">← '+esc(txt)+'</button>';
function render(root,opts){
 const lessons=opts.lessons||[];let category=0,id="L09",set=0,qIndex=0,selected=-1,validated=false,score=0;
 const entCourseCount=ids=>ids.reduce((n,ref)=>n+(lessons.some(l=>l.id===ref)?1:0),0);
 const entActivityCount=ids=>ids.reduce((n,ref)=>n+(ENT_ACTIVITIES[ref]||0),0);
 const plural=(n,singular,pluralWord)=>n+' '+(n===1?singular:pluralWord);
 const statLine=(ids,isCategory=false)=>{
  const cours=entCourseCount(ids),acts=entActivityCount(ids),series=ids.length*TRAINING_SERIES;
  return '<span class="spx-metrics">'+
    '<span>'+plural(cours,'fiche de cours ENT','fiches de cours ENT')+'</span>'+
    '<span>'+plural(acts,'activité/exercice ENT repéré','activités/exercices ENT repérés')+'</span>'+
    '<span>'+plural(series,'entraînement','entraînements')+' · 10 questions chacun</span>'+
    (isCategory?'<span>Leçons simplifiées disponibles</span>':'')+
   '</span>';
 };
 function draw(content){root.innerHTML='<div class="spx">'+content+'</div>';}
 function bindBack(fn){root.querySelector("[data-back]").onclick=fn;}
 function scroll(){try{root.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){}}
 function home(){
  draw(header("Mes leçons d'espagnol","Cherche ce que tu veux comprendre, puis entraîne-toi librement.")+
   back("Toutes les matières")+
   '<div class="spx-search">⌕ <input type="search" id="spx-find" autocomplete="off" placeholder="Ex. : je suis, horoscope, lettre, consigne…" aria-label="Rechercher un mot ou une leçon"></div>'+
   '<div id="spx-results" class="spx-results" hidden></div>'+
   '<h3 class="spx-subheading">Qu’est-ce que tu veux apprendre ?</h3>'+
   '<div class="spx-grid">'+C.map((c,i)=>'<button type="button" class="spx-card" data-category="'+i+'"><span class="spx-icon">'+iconSvg(c.icon)+'</span><strong>'+esc(c.title)+'</strong><p>'+esc(c.text)+'</p><small>'+c.ids.length+' sous-leçon'+(c.ids.length>1?"s":"")+' →</small>'+statLine(c.ids,true)+'</button>').join("")+'</div>'+
   '<p class="spx-note">« Activités/exercices ENT » = ceux identifiés dans les captures conservées, pas forcément tous les travaux de la professeure. Les cinq entraînements de dix questions par sous-leçon sont des exercices créés pour Tim, à 0 XP et répétables. Les bonus restent à l’accueil général.</p>');
  bindBack(opts.back);
  root.querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>openCategory(+b.dataset.category));
  const inp=root.querySelector("#spx-find"),dest=root.querySelector("#spx-results");
  inp.oninput=()=>{
   const q=nrm(inp.value);if(!q){dest.hidden=true;return;}
   const matches=[];
   C.forEach(c=>c.ids.forEach(ref=>{
    const x=ED[ref];if(!x)return;
    let weight=0,answer="";
    const meta=nrm(x.name+" "+c.title+" "+c.text+" "+c.keywords+" "+x.intro);
    if(meta.includes(q))weight+=8;
    const keys=q.split(" ").filter(t=>t.length>2&&!["comment","quelle","quel","dans","pour","avec","espagnol","veux","dire","signifie"].includes(t));
    keys.forEach(t=>{if(meta.includes(t))weight+=2;});
    x.pairs.forEach(p=>{
     const a=nrm(p[0]),b=nrm(p[1]);
     if((a&&q.includes(a)&&a.length>=3)||(b&&q.includes(b)&&b.length>=3)||a.includes(q)||b.includes(q)){
      weight+=10;if(!answer||p[0].length>answer.length)answer=p[0]+" = "+p[1];
     }
    });
    if(weight)matches.push({ref,weight,answer});
   }));
   matches.sort((a,b)=>b.weight-a.weight);
   dest.hidden=false;
   dest.innerHTML=matches.length?'<p><strong>Voici où chercher :</strong></p>'+matches.slice(0,5).map(m=>'<button type="button" class="spx-hit" data-find="'+m.ref+'"><strong>'+esc(ED[m.ref].name)+'</strong>'+(m.answer?'<small>'+esc(m.answer)+'</small>':'<small>'+esc(ED[m.ref].intro)+'</small>')+'</button>').join(""):'<p>Je ne retrouve pas ce mot. Essaie une expression plus courte.</p>';
   dest.querySelectorAll("[data-find]").forEach(b=>b.onclick=()=>openSimplified(b.dataset.find));
  };
 }

 const enterLesson=ref=>{id=ref;category=categoryOf(ref);};
 const helpFor=ref=>lessons.find(l=>l.id===ref)?.help||{};
 const listBack=()=>openCategory(category);
 const trainingNames=["Je comprends les expressions","Je retrouve les mots espagnols","Je m’entraîne dans les deux sens","Je comprends les phrases","Je révise toute la sous-leçon"];
 function openCategory(i){
  category=i;const c=C[i];
  const item=ref=>{
   const hasEnt=lessons.some(l=>l.id===ref);
   const activities=ENT_ACTIVITIES[ref]||0;
   return '<article class="spx-lesson-item">'+
    '<div class="spx-lesson-intro"><span class="spx-chip" aria-hidden="true">▤</span><div class="spx-lesson-copy"><h4>'+esc(ED[ref].name)+'</h4><p>'+esc(ED[ref].intro)+'</p>'+statLine([ref])+'</div></div>'+
    '<div class="spx-quick-links" aria-label="Accès directs : '+esc(ED[ref].name)+'">'+
     (hasEnt?'<button type="button" class="spx-quick-link" data-course="'+ref+'">1 · Leçon ENT</button>':'')+
     '<button type="button" class="spx-quick-link spx-quick-easy" data-easy="'+ref+'">2 · Leçon simplifiée</button>'+
     '<button type="button" class="spx-quick-link spx-quick-help" data-help="'+ref+'">3 · Je n’ai pas compris</button>'+
     (activities>0?'<button type="button" class="spx-quick-link" data-ent-exercises="'+ref+'">Exercices ENT ('+activities+')</button>':'')+
     '<button type="button" class="spx-quick-link" data-training="'+ref+'">Exercices d’entraînement · 5 × 10</button>'+
    '</div></article>';
  };
  draw(header(c.title,c.text)+back("Toutes les rubriques")+
   '<p class="spx-chapter-overview">'+plural(entCourseCount(c.ids),'fiche de cours ENT','fiches de cours ENT')+' · '+plural(entActivityCount(c.ids),'activité/exercice ENT repéré','activités/exercices ENT repérés')+' · '+(c.ids.length*TRAINING_SERIES)+' entraînements de 10 questions</p>'+
   '<h3 class="spx-subheading">Choisis une sous-leçon</h3>'+
   c.ids.map(item).join("")+
   '<p class="spx-note">Les leçons ENT viennent du classeur de cours ; les exercices ENT sont ceux retrouvés dans les documents. Les exercices d’entraînement sont créés pour Tim, répétables, à 0 XP.</p>');
  bindBack(home);
  root.querySelectorAll("[data-easy]").forEach(b=>b.onclick=()=>openSimplified(b.dataset.easy));
  root.querySelectorAll("[data-help]").forEach(b=>b.onclick=()=>openHelp(b.dataset.help));
  root.querySelectorAll("[data-training]").forEach(b=>b.onclick=()=>openPractice(b.dataset.training));
  root.querySelectorAll("[data-ent-exercises]").forEach(b=>b.onclick=()=>openEntExercises(b.dataset.entExercises));
  root.querySelectorAll("[data-course]").forEach(b=>b.onclick=()=>opts.original(b.dataset.course));
  scroll();
 }
 function navButtons(ref,options){
  return '<div class="spx-sibling-nav">'+options.map(option=>
   '<button type="button" class="spx-button subtle" data-switch="'+esc(option[0])+'">'+esc(option[1])+'</button>'
  ).join("")+'</div>';
 }
 function bindSwitch(){
  root.querySelectorAll("[data-switch]").forEach(button=>button.onclick=()=>{
   const value=button.dataset.switch;
   if(value==="ent")return opts.original(id);
   if(value==="easy")return openSimplified(id);
   if(value==="help")return openHelp(id);
   if(value==="practice")return openPractice(id);
   if(value==="exercises")return openEntExercises(id);
  });
 }
 function openSimplified(ref){
  enterLesson(ref);const x=ED[ref],help=helpFor(ref);
  const explanation=help.simple||x.intro;
  const steps=Array.isArray(help.steps)&&help.steps.length?help.steps:[x.tip,"Regarde ensuite l’exemple avant de t’entraîner."];
  const example=help.example||x.example;
  draw(header("Leçon simplifiée : "+x.name,"Niveau 2 · La même notion, expliquée plus facilement.")+
   back("Retour aux sous-leçons")+
   '<section class="spx-panel spx-simplified-page"><span class="spx-label">2 · LEÇON SIMPLIFIÉE</span>'+
   '<h3>On reprend doucement</h3><p>'+esc(explanation)+'</p>'+
   '<h4>Les étapes à retenir</h4><ol class="spx-simple-steps">'+steps.map(step=>'<li>'+esc(step)+'</li>').join("")+'</ol>'+
   '<div class="spx-example"><strong>Exemple :</strong> '+esc(example)+'</div>'+
   '<p><strong>À retenir :</strong> '+esc(x.tip)+'</p></section>'+
   '<section class="spx-panel"><h3>Mon petit dictionnaire</h3><p>Appuie sur 🔊 pour écouter les expressions en espagnol.</p>'+
   '<table class="spx-words"><tr><th>Espagnol</th><th>Français</th></tr>'+
   x.pairs.map(p=>'<tr><td><span lang="es">'+esc(p[0])+'</span> '+listen(p[0])+'</td><td>'+esc(p[1])+'</td></tr>').join("")+'</table></section>'+
   '<section class="spx-panel"><h3>Tu veux continuer ?</h3>'+
   navButtons(ref,[["help","3 · Je n’ai pas compris"],["practice","Exercices d’entraînement"],["ent","1 · Leçon ENT"]])+'</section>');
  if(ref==="L05"&&window.TIM_SPANISH_LETTER)root.querySelector(".spx-simplified-page").after(window.TIM_SPANISH_LETTER.createPanel());
  bindBack(listBack);bindSwitch();scroll();
 }
 function openPractice(ref){
  enterLesson(ref);const x=ED[ref];
  draw(header("Exercices d’entraînement",x.name)+back("Retour aux sous-leçons")+
   '<section class="spx-panel spx-practice-page"><span class="spx-label">EXERCICES DE LA LEÇON SIMPLIFIÉE · 0 XP</span>'+
   '<h3>5 exercices de 10 questions</h3>'+
   '<p>Une correction après chaque réponse. Tu peux refaire les exercices autant de fois que tu veux, sans perdre ni gagner de XP.</p>'+
   trainingNames.map((label,i)=>'<button type="button" class="spx-row" data-set="'+i+'"><span class="spx-chip">'+(i+1)+'</span><span><strong>'+esc(label)+'</strong><small>10 questions · 0 XP · recommencer librement</small></span><span>›</span></button>').join("")+
   navButtons(ref,[["easy","2 · Leçon simplifiée"],["help","3 · Je n’ai pas compris"]])+'</section>');
  bindBack(listBack);bindSwitch();
  root.querySelectorAll("[data-set]").forEach(b=>b.onclick=()=>begin(+b.dataset.set));
  scroll();
 }
 function openEntExercises(ref){
  enterLesson(ref);const n=ENT_ACTIVITIES[ref]||0;
  if(n===0){openCategory(category);return;}
  draw(header("Exercices ENT : "+ED[ref].name,"Documents et énoncés de la professeure retrouvés dans le classeur.")+
   back("Retour aux sous-leçons")+
   '<p class="spx-chapter-overview">'+plural(n,'activité/exercice ENT repéré','activités/exercices ENT repérés')+' dans les supports conservés. Ces exercices sont distincts des entraînements créés pour Tim.</p>'+
   '<div id="spx-ent-content"></div>'+
   '<section class="spx-panel"><h3>Retrouver le document complet</h3>'+
   '<p>Les PDF, photos et annotations d’origine sont associés à la fiche ENT lorsqu’ils sont disponibles.</p>'+
   navButtons(ref,[["ent","1 · Leçon ENT"],["easy","2 · Leçon simplifiée"],["practice","Exercices d’entraînement"]])+'</section>');
  const holder=root.querySelector("#spx-ent-content");
  if(window.TIM_SPANISH_ENT_ORIGINALS){holder.append(window.TIM_SPANISH_ENT_ORIGINALS.renderPanel(ref));}
  else{holder.textContent="Les extraits traduits ne sont pas disponibles dans cette version.";}
  if(ref==="L05"&&window.TIM_SPANISH_LETTER)holder.append(window.TIM_SPANISH_LETTER.createPanel());
  bindBack(listBack);bindSwitch();scroll();
 }
 function openHelp(ref){
  enterLesson(ref);const faqs=HELP_TOPICS[ref]||[],x=ED[ref];
  draw(header("Je n’ai pas compris : "+x.name,"Niveau 3 · Dis précisément ce qui te bloque pour recevoir une autre explication.")+
   back("Retour aux sous-leçons")+
   '<section class="spx-panel spx-personal-help"><span class="spx-label">3 · JE N’AI PAS COMPRIS</span>'+
   '<h3>Quel est ton problème ?</h3><p>Choisis une question fréquente ou écris ta propre question. Les réponses de cette rubrique ont été préparées pour cette sous-leçon.</p>'+
   '<div class="spx-help-choices">'+faqs.map((v,i)=>'<button type="button" class="spx-help-prompt" data-faq="'+i+'">'+esc(v[0])+'</button>').join("")+'</div>'+
   '<form id="spx-help-form"><label class="spx-help-label" for="spx-help-input">Écris ce que tu ne comprends pas</label>'+
   '<textarea id="spx-help-input" rows="3" maxlength="350" placeholder="Exemple : pourquoi yo hablo et pas yo habla ?"></textarea>'+
   '<button type="submit" class="spx-button" id="spx-help-send">Comprendre ma question</button></form>'+
   '<div id="spx-help-result" aria-live="polite"></div>'+
   '<p class="spx-note">Cette aide fonctionne avec des explications et des traductions préparées pour la leçon : elle ne fait pas appel à une IA. Si la question n’est pas reconnue, elle ne fabrique pas de réponse.</p></section>'+
   '<section class="spx-panel"><h3>Revoir la leçon ou s’entraîner</h3>'+
   navButtons(ref,[["easy","2 · Leçon simplifiée"],["practice","Exercices d’entraînement"],["ent","1 · Leçon ENT"]])+'</section>');
  bindBack(listBack);bindSwitch();
  const answer=root.querySelector("#spx-help-result"),input=root.querySelector("#spx-help-input");
  function respond(text,index=-1){
   const normalized=nrm(text);if(!normalized){
    answer.innerHTML='<div class="spx-help-answer">Choisis une question ci-dessus ou écris ce qui te bloque.</div>';return;
   }
   let topic=index>=0?faqs[index]:null;
   if(!topic){
    const tokens=normalized.split(" ").filter(w=>w.length>=3&&!["pourquoi","comment","quelle","quand","lequel","cela","avec","dans","pour","entre","est","des","les","une","pas","que","mot","veut","dire","signifie","faut"].includes(w));
    let score=0;
    for(const choice of faqs){
     const title=nrm(choice[0]);
     const match=tokens.reduce((n,token)=>n+(title.includes(token)?1:0),0);
     if(match>score){score=match;topic=choice;}
    }
    if(score<Math.min(2,Math.max(1,tokens.length))){topic=null;}
   }
   if(topic){
    answer.innerHTML='<div class="spx-help-answer"><strong>Explication :</strong><p>'+esc(topic[1])+'</p><div class="spx-example"><strong>Exemple :</strong> '+esc(topic[2])+'</div></div>';
    return;
   }
   const pair=x.pairs.find(p=>{
    const es=nrm(p[0]),fr=nrm(p[1]);
    return (es.length>=3&&(normalized.includes(es)||es===normalized))||(fr.length>=3&&(normalized.includes(fr)||fr===normalized));
   });
   if(pair){
    answer.innerHTML='<div class="spx-help-answer"><strong>Ce mot, simplement :</strong><p>« '+esc(pair[0])+' » signifie « '+esc(pair[1])+' ». '+esc(x.tip)+'</p>'+listen(pair[0])+'</div>';
    return;
   }
   const instruction=INSTRUCTIONS.find(row=>normalized.includes(nrm(row[0]))||normalized.includes(nrm(row[1])));
   if(instruction){
    answer.innerHTML='<div class="spx-help-answer"><strong>La consigne :</strong><p>« '+esc(instruction[0])+' » veut dire « '+esc(instruction[1])+' ».</p><p>'+esc(instruction[2])+'</p></div>';
    return;
   }
   answer.innerHTML='<div class="spx-help-answer"><strong>Je n’ai pas trouvé de réponse assez précise dans cette leçon.</strong><p>Essaie de donner le mot espagnol exact ou choisis une des questions proposées. Tu peux aussi relire la leçon simplifiée.</p></div>';
  }
  root.querySelectorAll("[data-faq]").forEach(b=>b.onclick=()=>{
   const idx=+b.dataset.faq;input.value=faqs[idx][0];respond(input.value,idx);
  });
  root.querySelector("#spx-help-form").addEventListener("submit",e=>{e.preventDefault();respond(input.value);});
  scroll();
 }
 function questionData(){
  const x=ED[id],p=x.pairs[qIndex],make=(correct,wrong,prompt,word,dir,cloze)=>{
   const unique=[];
   wrong.forEach(v=>{if(v!==correct&&unique.indexOf(v)<0&&unique.length<3)unique.push(v);});
   for(const pair of x.pairs){if(unique.length>=3)break;const v=cloze?String(pair[0]).split(" ")[cloze==="first"?0:String(pair[0]).split(" ").length-1]:pair[dir===0?1:0];if(v!==correct&&unique.indexOf(v)<0)unique.push(v);}
   const placement=(qIndex+set)%4,choices=unique.slice(0,3);choices.splice(placement,0,correct);
   return {p,dir,correct,choices,placement,question:prompt,word,cloze};
  };
  if(set===3&&["L09","L10","L13","L15"].indexOf(id)>=0){
   const parts=p[0].trim().split(/\s+/),correct=parts.pop();
   if(parts.length){
    const others=x.pairs.map(t=>t[0].trim().split(/\s+/).pop());
    return make(correct,others,"Complète la conjugaison pour dire « "+p[1]+" » :",parts.join(" ")+" ___",1,"last");
   }
  }
  if(set===3&&id==="L08"){
   const parts=p[0].split(" "),correct=parts.shift();
   return make(correct,x.pairs.map(t=>t[0].split(" ")[0]),"Quel article complète « "+p[1]+" » ?", "___ "+parts.join(" "),1,"first");
  }
  const dir=(set===0||set===3)?0:(set===1?1:(set===2?qIndex%2:(qIndex+1)%2));
  const target=dir===0?1:0,source=dir===0?0:1;
  return make(p[target],x.pairs.map(t=>t[target]),dir===0?"Que signifie en français ?":"Comment dit-on en espagnol ?",p[source],dir,null);
 }
 function questionInstruction(q){
  if(q.cloze==="last")return {es:"Completa la frase con la forma correcta del verbo.",fr:"Complète la phrase avec la bonne forme du verbe.",action:"Repère qui fait l'action (je, tu, il, nous…). Puis choisis la forme du verbe qui correspond. Ne regarde pas la correction avant de répondre."};
  if(q.cloze==="first")return {es:"Completa con el artículo correcto.",fr:"Complète avec l'article correct.",action:"Observe le nom après le trou. Cherche si le mot est masculin ou féminin, singulier ou pluriel. Choisis ensuite l'article qui convient."};
  if(q.dir===0)return {es:"Elige la traducción correcta.",fr:"Choisis la bonne traduction.",action:"Lis l'expression en espagnol, puis choisis sa traduction en français parmi les propositions."};
  return {es:"Elige la expresión correcta en español.",fr:"Choisis la bonne expression en espagnol.",action:"Lis le sens en français, puis retrouve comment on l'écrit en espagnol parmi les propositions."};
 }
 function begin(n){set=n;qIndex=0;score=0;showQuestion();}
 function showQuestion(){
  if(qIndex>=10){end();return;}
  selected=-1;validated=false;const q=questionData(),guide=questionInstruction(q);
  draw(header(ED[id].name,"Exercice "+(set+1)+" sur 5 · question "+(qIndex+1)+" sur 10")+
   back("Retour aux exercices d’entraînement")+
   '<section class="spx-panel"><span class="spx-label">QUESTION '+(qIndex+1)+' / 10</span>'+
   '<div class="spx-instruction"><span class="spx-label">LA CONSIGNE, EN DEUX LANGUES</span><p lang="es" class="spx-instruction-es">'+esc(guide.es)+' '+listen(guide.es)+'</p><p class="spx-instruction-fr"><strong>En français :</strong> '+esc(guide.fr)+'</p><button class="spx-help-button" type="button" id="spx-explain">Je ne comprends pas la consigne</button><p class="spx-action" id="spx-action" hidden><strong>Ce que tu dois faire :</strong> '+esc(guide.action)+'</p></div>'+
   '<h3>'+esc(q.question)+'</h3><div class="spx-example">'+esc(q.word)+(q.dir===0||q.cloze?(' '+listen(q.word)):'')+'</div><p>'+esc(guide.fr)+'</p>'+
   q.choices.map((val,i)=>'<button class="spx-option" type="button" data-option="'+i+'">'+esc(val)+'</button>').join("")+
   '<div id="spx-correct" aria-live="polite"></div>'+
   '<button class="spx-button" id="spx-submit" type="button" disabled>Valider ma réponse</button>'+
   '<button class="spx-button subtle" id="spx-next" type="button" hidden>Question suivante →</button></section>');
  bindBack(()=>openPractice(id));
  root.querySelector("#spx-explain").onclick=()=>{const note=root.querySelector("#spx-action");note.hidden=!note.hidden;root.querySelector("#spx-explain").textContent=note.hidden?"Je ne comprends pas la consigne":"Masquer l'explication";};
  root.querySelectorAll("[data-option]").forEach(b=>b.onclick=()=>{
   if(validated)return;selected=+b.dataset.option;
   root.querySelectorAll("[data-option]").forEach(z=>z.classList.toggle("selected",+z.dataset.option===selected));
   root.querySelector("#spx-submit").disabled=false;
  });
  root.querySelector("#spx-submit").onclick=()=>{
   if(selected<0||validated)return;validated=true;
   const ok=selected===q.placement;if(ok)score++;
   root.querySelectorAll("[data-option]").forEach(b=>b.disabled=true);
   const wrong=q.choices[selected],other=q.cloze?null:ED[id].pairs.find(p=>p[q.dir===0?1:0]===wrong);
   const explain=ok?"Tu as retrouvé la bonne forme.":"Tu as choisi « "+wrong+" »."+(other?" Cette réponse correspond à « "+other[q.dir===0?0:1]+" ».":"");
   root.querySelector("#spx-correct").innerHTML='<div class="spx-feedback"><strong>'+(ok?"Bonne réponse !":"Pas tout à fait. Regarde pourquoi.")+'</strong><p>'+esc(explain)+'</p><p><strong>Bonne réponse : '+esc(q.correct)+'</strong></p><p>La forme complète est « '+esc(q.p[0])+' » : « '+esc(q.p[1])+' ».</p><p>'+esc(ED[id].tip)+'</p></div>';
   root.querySelector("#spx-submit").hidden=true;
   root.querySelector("#spx-next").hidden=false;
   root.querySelector("#spx-next").textContent=qIndex===9?"Voir mon bilan →":"Question suivante →";
  };
  root.querySelector("#spx-next").onclick=()=>{qIndex++;showQuestion();};
 }
 function end(){
  draw(header("Série terminée","Tu peux refaire cet entraînement autant de fois que tu le souhaites.")+
   back("Retour aux exercices d’entraînement")+
   '<section class="spx-panel"><h3>Ton résultat : '+score+' / 10</h3><p>Ce résultat est indicatif. Il n’est pas enregistré comme un devoir.</p><button type="button" class="spx-button" id="spx-repeat">Recommencer les dix questions</button><button type="button" class="spx-button subtle" id="spx-other">Choisir un autre exercice</button></section>');
  bindBack(()=>openPractice(id));root.querySelector("#spx-repeat").onclick=()=>begin(set);root.querySelector("#spx-other").onclick=()=>openPractice(id);
 }
 home();
}
window.TIM_SPANISH_PATH={render:render,groupCount:C.length,lessonCount:Object.keys(ED).length};
})();