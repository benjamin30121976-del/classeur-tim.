/* Interface espagnole isolée : aucune lecture ni écriture des XP/bonus. */
(function(){
"use strict";
const C=[
 {title:"Les verbes et la conjugaison",text:"C'est quoi un verbe ? Comment le conjuguer ?",icon:"V",ids:["L09","L10","L13","L15"],keywords:"être conjuguer avoir faire aller"},
 {title:"Les adjectifs et le caractère",text:"C'est quoi un adjectif ? Comment décrire quelqu'un et parler de son horoscope ?",icon:"A",ids:["L06","L07"],keywords:"féminin masculin qualités horoscope"},
 {title:"Se présenter et parler de soi",text:"Dire son prénom, son âge, ses goûts et ses activités.",icon:"S",ids:["L01","L02","L04"],keywords:"nom âge aimer sport jour cours"},
 {title:"La grammaire : construire une phrase",text:"Comprendre les petits mots comme « le », « la », « mon », « son ».",icon:"G",ids:["L08","L12"],keywords:"article adjectif possessif politesse"},
 {title:"Poser des questions et écrire",text:"Comment poser une question, écrire une lettre et comprendre une consigne ?",icon:"?",ids:["L11","L05","L14"],keywords:"lettre contrôle question consigne énoncé écrire"},
 {title:"Les pays où l'on parle espagnol",text:"Découvrir l'Espagne, le Mexique et les autres pays hispanophones.",icon:"P",ids:["L03"],keywords:"géographie pays espagne mexique"}
];
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
const esc=x=>String(x==null?"":x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const nrm=x=>String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const categoryOf=id=>C.findIndex(c=>c.ids.indexOf(id)>=0);
const listen=phrase=>'<button type="button" class="spx-listen" data-say-es="'+esc(phrase)+'" title="Écouter en espagnol" aria-label="Écouter en espagnol : '+esc(phrase)+'">🔊</button>';
const header=(title,sub)=>'<header class="spx-hero"><span class="spx-flag" aria-label="Drapeau espagnol"></span><span class="spx-kicker">ESPAGNOL · CLASSEUR DE TIM</span><h2>'+esc(title)+'</h2><p>'+esc(sub)+'</p></header>';
const back=txt=>'<button type="button" class="spx-back" data-back="yes">← '+esc(txt)+'</button>';
function render(root,opts){
 const lessons=opts.lessons||[];let category=0,id="L09",set=0,qIndex=0,selected=-1,validated=false,score=0;
 function draw(content){root.innerHTML='<div class="spx">'+content+'</div>';}
 function bindBack(fn){root.querySelector("[data-back]").onclick=fn;}
 function scroll(){try{root.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){}}
 function home(){
  draw(header("Mes leçons d'espagnol","Cherche ce que tu veux comprendre, puis entraîne-toi librement.")+
   back("Toutes les matières")+
   '<div class="spx-search">⌕ <input type="search" id="spx-find" autocomplete="off" placeholder="Ex. : je suis, horoscope, lettre, consigne…" aria-label="Rechercher un mot ou une leçon"></div>'+
   '<div id="spx-results" class="spx-results" hidden></div>'+
   '<h3 class="spx-subheading">Qu’est-ce que tu veux apprendre ?</h3>'+
   '<div class="spx-grid">'+C.map((c,i)=>'<button type="button" class="spx-card" data-category="'+i+'"><span class="spx-icon">'+esc(c.icon)+'</span><strong>'+esc(c.title)+'</strong><p>'+esc(c.text)+'</p><small>'+c.ids.length+' sous-leçon'+(c.ids.length>1?"s":"")+' →</small></button>').join("")+'</div>'+
   '<p class="spx-note">Les exercices de cette matière servent à apprendre. Les exercices bonus restent séparés à l’accueil général.</p>');
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
  draw(header(c.title,c.text)+back("Toutes les rubriques")+
   '<h3 class="spx-subheading">Choisis une sous-leçon</h3>'+
   c.ids.map(ref=>'<button type="button" class="spx-row" data-lesson="'+ref+'"><span class="spx-chip">▤</span><span><strong>'+esc(ED[ref].name)+'</strong><small>'+esc(ED[ref].intro)+'</small></span><span>›</span></button>').join(""));
  bindBack(home);root.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>openLesson(b.dataset.lesson));scroll();
 }
 function openLesson(ref){
  id=ref;category=categoryOf(ref);const x=ED[ref];
  const real=lessons.find(l=>l.id===ref);const date=real&&real.date?real.date:"Date non indiquée";
  draw(header(x.name,C[category].title)+back("Retour aux sous-leçons")+
   '<section class="spx-panel"><span class="spx-label">1 · JE COMPRENDS</span><h3>C’est quoi, exactement ?</h3><p>'+esc(x.intro)+'</p><div class="spx-example">'+esc(x.example)+'</div><p><strong>À retenir :</strong> '+esc(x.tip)+'</p></section>'+
   '<section class="spx-panel"><span class="spx-label">2 · MON PETIT DICTIONNAIRE</span><h3>Les mots expliqués en français</h3><table class="spx-words"><tr><th>Espagnol</th><th>Français</th></tr>'+x.pairs.map(p=>'<tr><td><span lang="es">'+esc(p[0])+'</span> '+listen(p[0])+'</td><td>'+esc(p[1])+'</td></tr>').join("")+'</table></section>'+
   '<section class="spx-panel"><span class="spx-label">4 · JE COMPRENDS LES CONSIGNES</span><h3>Qu’est-ce que la professeure me demande ?</h3><p>Voici des phrases que tu peux rencontrer dans un exercice. La traduction est toujours visible. Les explications t’aident à savoir quoi faire, sans te donner la réponse.</p><div class="spx-guide-list">'+INSTRUCTIONS.map(row=>'<div class="spx-guide"><strong lang="es">'+esc(row[0])+'</strong> '+listen(row[0])+'<div class="spx-guide-fr">En français : '+esc(row[1])+'</div><small>'+esc(row[2])+'</small></div>').join("")+'</div><p class="spx-note">Méthode : 1. Je lis la consigne. 2. Je repère le verbe d’action (« complète », « choisis », « justifie »). 3. Je fais seulement ce qui est demandé.</p></section>'+
   '<section class="spx-panel"><span class="spx-label">5 · JE M’ENTRAÎNE</span><h3>Cinq exercices, dix questions chacun</h3><p>Choisis une série. À chaque question, la consigne en espagnol apparaît avec sa traduction et l’action à effectuer. Tu peux recommencer autant que tu veux.</p>'+
   ["Je comprends les expressions","Je retrouve les mots espagnols","Je m'entraîne dans les deux sens","Je comprends les phrases","Je révise toute la sous-leçon"].map((label,i)=>'<button type="button" class="spx-row" data-set="'+i+'"><span class="spx-chip">'+(i+1)+'</span><span><strong>'+esc(label)+'</strong><small>10 questions · correction expliquée</small></span><span>›</span></button>').join("")+'</section>'+
   '<section class="spx-panel"><span class="spx-label">6 · LE COURS DE L’ENT</span><h3>Retrouver le cours de la classe</h3><p>Repère dans le classeur : '+esc(date)+'. Les documents d’origine restent accessibles lorsqu’ils sont disponibles.</p><button class="spx-button subtle" type="button" id="spx-ent">Voir la fiche du cours</button></section>');
  if(window.TIM_SPANISH_ENT_ORIGINALS){const originalPanel=window.TIM_SPANISH_ENT_ORIGINALS.renderPanel(ref);const second=root.querySelectorAll(".spx-panel")[1];if(second)second.after(originalPanel);}
  if(ref==="L05"&&window.TIM_SPANISH_LETTER){const first=root.querySelector(".spx-panel");if(first)first.after(window.TIM_SPANISH_LETTER.createPanel());}
  bindBack(()=>openCategory(category));root.querySelectorAll("[data-set]").forEach(b=>b.onclick=()=>begin(+b.dataset.set));
  root.querySelector("#spx-ent").onclick=()=>opts.original(ref);scroll();
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