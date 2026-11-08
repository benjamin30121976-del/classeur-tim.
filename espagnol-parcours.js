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
   dest.querySelectorAll("[data-find]").forEach(b=>b.onclick=()=>openLesson(b.dataset.find));
  };
 }
 function openCategory(i){
  category=i;const c=C[i];
  const item=ref=>{
   const hasEnt=lessons.some(l=>l.id===ref);
   const activities=ENT_ACTIVITIES[ref]||0;
   return '<article class="spx-lesson-item">'+
    '<div class="spx-lesson-intro"><span class="spx-chip" aria-hidden="true">▤</span><div class="spx-lesson-copy"><h4>'+esc(ED[ref].name)+'</h4><p>'+esc(ED[ref].intro)+'</p>'+statLine([ref])+'</div></div>'+
    '<div class="spx-quick-links" aria-label="Accès directs : '+esc(ED[ref].name)+'">'+
     '<button type="button" class="spx-quick-link" data-lesson="'+ref+'">Leçon</button>'+
     '<button type="button" class="spx-quick-link spx-quick-easy" data-easy="'+ref+'">Leçon simplifiée</button>'+
     '<button type="button" class="spx-quick-link" data-training="'+ref+'">Entraînements · 5 × 10</button>'+
     (hasEnt?'<button type="button" class="spx-quick-link" data-course="'+ref+'">Cours ENT</button>':'')+
     (activities>0?'<button type="button" class="spx-quick-link" data-ent-exercises="'+ref+'">Exercices ENT ('+activities+')</button>':'')+
    '</div></article>';
  };
  draw(header(c.title,c.text)+back("Toutes les rubriques")+
   '<p class="spx-chapter-overview">'+plural(entCourseCount(c.ids),'fiche de cours ENT','fiches de cours ENT')+' · '+plural(entActivityCount(c.ids),'activité/exercice ENT repéré','activités/exercices ENT repérés')+' · '+(c.ids.length*TRAINING_SERIES)+' entraînements de 10 questions</p>'+
   '<h3 class="spx-subheading">Choisis une sous-leçon</h3>'+
   c.ids.map(item).join("")+
   '<p class="spx-note">« Exercices ENT » ouvre les énoncés retrouvés et traduits, lorsqu’ils sont disponibles. Les originaux complets restent dans « Cours ENT ». Les entraînements (0 XP) sont distincts des devoirs du professeur.</p>');
  bindBack(home);
  root.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>openLesson(b.dataset.lesson));
  root.querySelectorAll("[data-easy]").forEach(b=>b.onclick=()=>openLesson(b.dataset.easy,true));
  root.querySelectorAll("[data-training]").forEach(b=>b.onclick=()=>openLesson(b.dataset.training,false,"training"));
  root.querySelectorAll("[data-ent-exercises]").forEach(b=>b.onclick=()=>openLesson(b.dataset.entExercises,false,"ent"));
  root.querySelectorAll("[data-course]").forEach(b=>b.onclick=()=>opts.original(b.dataset.course));
  scroll();
 }
 function openLesson(ref,showEasy=false,jumpTo=''){
  id=ref;category=categoryOf(ref);const x=ED[ref];
  const real=lessons.find(l=>l.id===ref);const date=real&&real.date?real.date:"Date non indiquée";
  const help=real?.help||{};
  const helpIntro=help.simple||x.intro;
  const helpSteps=Array.isArray(help.steps)&&help.steps.length?help.steps:[x.tip,"Regarde l’exemple ci-dessous avant de t’entraîner."];
  const helpExample=help.example||x.example;
  const easyBlock='<details class="spx-easy-lesson" id="spx-easy-lesson"'+(showEasy?' open':'')+'>'+
    '<summary>Je n’ai pas compris ? <span>Ouvrir la leçon expliquée plus simplement</span></summary>'+
    '<div class="spx-easy-content"><h3>On reprend depuis le début</h3><p>'+esc(helpIntro)+'</p>'+
    '<h4>En trois petites étapes</h4><ol>'+helpSteps.map(step=>'<li>'+esc(step)+'</li>').join("")+'</ol>'+
    '<div class="spx-example"><strong>Un exemple expliqué :</strong> '+esc(helpExample)+'</div>'+
    '<p>Tu peux relire cette aide autant que tu veux avant les dix questions.</p></div></details>';
  draw(header(x.name,C[category].title)+back("Retour aux sous-leçons")+
   '<p class="spx-chapter-overview">'+statLine([ref])+'</p>'+easyBlock+
   '<section class="spx-panel"><span class="spx-label">1 · JE COMPRENDS</span><h3>C’est quoi, exactement ?</h3><p>'+esc(x.intro)+'</p><div class="spx-example">'+esc(x.example)+'</div><p><strong>À retenir :</strong> '+esc(x.tip)+'</p></section>'+
   '<section class="spx-panel"><span class="spx-label">2 · MON PETIT DICTIONNAIRE</span><h3>Les mots expliqués en français</h3><table class="spx-words"><tr><th>Espagnol</th><th>Français</th></tr>'+x.pairs.map(p=>'<tr><td><span lang="es">'+esc(p[0])+'</span> '+listen(p[0])+'</td><td>'+esc(p[1])+'</td></tr>').join("")+'</table></section>'+
   '<section class="spx-panel"><span class="spx-label">4 · JE COMPRENDS LES CONSIGNES</span><h3>Qu’est-ce que la professeure me demande ?</h3><p>Voici des phrases que tu peux rencontrer dans un exercice. La traduction est toujours visible. Les explications t’aident à savoir quoi faire, sans te donner la réponse.</p><div class="spx-guide-list">'+INSTRUCTIONS.map(row=>'<div class="spx-guide"><strong lang="es">'+esc(row[0])+'</strong> '+listen(row[0])+'<div class="spx-guide-fr">En français : '+esc(row[1])+'</div><small>'+esc(row[2])+'</small></div>').join("")+'</div><p class="spx-note">Méthode : 1. Je lis la consigne. 2. Je repère le verbe d’action (« complète », « choisis », « justifie »). 3. Je fais seulement ce qui est demandé.</p></section>'+
   '<section class="spx-panel"><span class="spx-label">5 · JE M’ENTRAÎNE</span><h3>Cinq exercices, dix questions chacun</h3><p>Choisis une série. À chaque question, la consigne en espagnol apparaît avec sa traduction et l’action à effectuer. Tu peux recommencer autant que tu veux.</p>'+
   ["Je comprends les expressions","Je retrouve les mots espagnols","Je m'entraîne dans les deux sens","Je comprends les phrases","Je révise toute la sous-leçon"].map((label,i)=>'<button type="button" class="spx-row" data-set="'+i+'"><span class="spx-chip">'+(i+1)+'</span><span><strong>'+esc(label)+'</strong><small>10 questions · correction expliquée</small></span><span>›</span></button>').join("")+'</section>'+
   '<section class="spx-panel"><span class="spx-label">6 · LE COURS DE L’ENT</span><h3>Retrouver le cours de la classe</h3><p>Repère dans le classeur : '+esc(date)+'. Les documents d’origine restent accessibles lorsqu’ils sont disponibles.</p><button class="spx-button subtle" type="button" id="spx-ent">Voir la fiche du cours</button></section>');
  if(window.TIM_SPANISH_ENT_ORIGINALS){const originalPanel=window.TIM_SPANISH_ENT_ORIGINALS.renderPanel(ref);const second=root.querySelectorAll(".spx-panel")[1];if(second)second.after(originalPanel);}
  if(ref==="L05"&&window.TIM_SPANISH_LETTER){const first=root.querySelector(".spx-panel");if(first)first.after(window.TIM_SPANISH_LETTER.createPanel());}
  bindBack(()=>openCategory(category));root.querySelectorAll("[data-set]").forEach(b=>b.onclick=()=>begin(+b.dataset.set));
  root.querySelector("#spx-ent").onclick=()=>opts.original(ref);
  if(showEasy||jumpTo){
   const target=showEasy?root.querySelector("#spx-easy-lesson"):
     jumpTo==="training"?root.querySelector("[data-set]")?.closest(".spx-panel"):
     jumpTo==="ent"?root.querySelector(".spx-ent-translations"):null;
   if(target)requestAnimationFrame(()=>target.scrollIntoView({behavior:"auto",block:"start"}));
   else scroll();
  }else scroll();
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
   back("Retour à la sous-leçon")+
   '<section class="spx-panel"><span class="spx-label">QUESTION '+(qIndex+1)+' / 10</span>'+
   '<div class="spx-instruction"><span class="spx-label">LA CONSIGNE, EN DEUX LANGUES</span><p lang="es" class="spx-instruction-es">'+esc(guide.es)+' '+listen(guide.es)+'</p><p class="spx-instruction-fr"><strong>En français :</strong> '+esc(guide.fr)+'</p><button class="spx-help-button" type="button" id="spx-explain">Je ne comprends pas la consigne</button><p class="spx-action" id="spx-action" hidden><strong>Ce que tu dois faire :</strong> '+esc(guide.action)+'</p></div>'+
   '<h3>'+esc(q.question)+'</h3><div class="spx-example">'+esc(q.word)+(q.dir===0||q.cloze?(' '+listen(q.word)):'')+'</div><p>'+esc(guide.fr)+'</p>'+
   q.choices.map((val,i)=>'<button class="spx-option" type="button" data-option="'+i+'">'+esc(val)+'</button>').join("")+
   '<div id="spx-correct" aria-live="polite"></div>'+
   '<button class="spx-button" id="spx-submit" type="button" disabled>Valider ma réponse</button>'+
   '<button class="spx-button subtle" id="spx-next" type="button" hidden>Question suivante →</button></section>');
  bindBack(()=>openLesson(id));
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
   back("Retour à la sous-leçon")+
   '<section class="spx-panel"><h3>Ton résultat : '+score+' / 10</h3><p>Ce résultat est indicatif. Il n’est pas enregistré comme un devoir.</p><button type="button" class="spx-button" id="spx-repeat">Recommencer les dix questions</button><button type="button" class="spx-button subtle" id="spx-other">Choisir un autre exercice</button></section>');
  bindBack(()=>openLesson(id));root.querySelector("#spx-repeat").onclick=()=>begin(set);root.querySelector("#spx-other").onclick=()=>openLesson(id);
 }
 home();
}
window.TIM_SPANISH_PATH={render:render,groupCount:C.length,lessonCount:Object.keys(ED).length};
})();