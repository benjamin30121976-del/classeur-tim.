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
const ED=window.TIM_SPANISH_EDU||{};
const esc=x=>String(x==null?"":x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const nrm=x=>String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const categoryOf=id=>C.findIndex(c=>c.ids.indexOf(id)>=0);
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
   dest.innerHTML=matches.length?'<p><strong>Voici où chercher :</strong></p>'+matches.slice(0,5).map(m=>'<button type="button" class="spx-hit" data-find="'+m.ref+'"><strong>'+esc(ED[m.ref].name)+'</strong>'+(m.answer?'<small>'+esc(m.answer)+'</small>':"")+'</button>').join(""):'<p>Je ne retrouve pas ce mot. Essaie une expression plus courte.</p>';
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
   '<section class="spx-panel"><span class="spx-label">2 · MON PETIT DICTIONNAIRE</span><h3>Les mots expliqués en français</h3><table class="spx-words"><tr><th>Espagnol</th><th>Français</th></tr>'+x.pairs.map(p=>'<tr><td>'+esc(p[0])+'</td><td>'+esc(p[1])+'</td></tr>').join("")+'</table></section>'+
   '<section class="spx-panel"><span class="spx-label">3 · JE M’ENTRAÎNE</span><h3>Cinq exercices, dix questions chacun</h3><p>Choisis une série. Valide chaque réponse pour voir la correction. Tu peux recommencer autant que tu veux.</p>'+
   ["Je comprends les expressions","Je retrouve les mots espagnols","Je m'entraîne dans les deux sens","Je comprends les phrases","Je révise toute la sous-leçon"].map((label,i)=>'<button type="button" class="spx-row" data-set="'+i+'"><span class="spx-chip">'+(i+1)+'</span><span><strong>'+esc(label)+'</strong><small>10 questions · correction expliquée</small></span><span>›</span></button>').join("")+'</section>'+
   '<section class="spx-panel"><span class="spx-label">4 · LE COURS DE L’ENT</span><h3>Retrouver le cours de la classe</h3><p>Repère dans le classeur : '+esc(date)+'. Les documents d’origine restent accessibles lorsqu’ils sont disponibles.</p><button class="spx-button subtle" type="button" id="spx-ent">Voir la fiche du cours</button></section>');
  bindBack(()=>openCategory(category));root.querySelectorAll("[data-set]").forEach(b=>b.onclick=()=>begin(+b.dataset.set));
  root.querySelector("#spx-ent").onclick=()=>opts.original(ref);scroll();
 }
 function questionData(){
  const x=ED[id],p=x.pairs[qIndex],dir=(set===0||set===3)?0:(set===1?1:(set===2?qIndex%2:(qIndex+1)%2));
  const target=dir===0?1:0,source=dir===0?0:1;
  const correct=p[target],wrong=[];
  for(let j=1;j<10&&wrong.length<3;j++){const other=x.pairs[(qIndex+j+set)%10][target];if(other!==correct&&wrong.indexOf(other)<0)wrong.push(other);}
  const placement=(qIndex+set)%4,choices=wrong;choices.splice(placement,0,correct);
  return {p,dir,correct,choices,placement,question:dir===0?"Que signifie en français ?":"Comment dit-on en espagnol ?",word:p[source]};
 }
 function begin(n){set=n;qIndex=0;score=0;showQuestion();}
 function showQuestion(){
  if(qIndex>=10){end();return;}
  selected=-1;validated=false;const q=questionData();
  draw(header(ED[id].name,"Exercice "+(set+1)+" sur 5 · question "+(qIndex+1)+" sur 10")+
   back("Retour à la sous-leçon")+
   '<section class="spx-panel"><span class="spx-label">QUESTION '+(qIndex+1)+' / 10</span><h3>'+esc(q.question)+'</h3><div class="spx-example">'+esc(q.word)+'</div><p>Choisis la bonne traduction.</p>'+
   q.choices.map((val,i)=>'<button class="spx-option" type="button" data-option="'+i+'">'+esc(val)+'</button>').join("")+
   '<div id="spx-correct" aria-live="polite"></div>'+
   '<button class="spx-button" id="spx-submit" type="button" disabled>Valider ma réponse</button>'+
   '<button class="spx-button subtle" id="spx-next" type="button" hidden>Question suivante →</button></section>');
  bindBack(()=>openLesson(id));root.querySelectorAll("[data-option]").forEach(b=>b.onclick=()=>{
   if(validated)return;selected=+b.dataset.option;
   root.querySelectorAll("[data-option]").forEach(z=>z.classList.toggle("selected",+z.dataset.option===selected));
   root.querySelector("#spx-submit").disabled=false;
  });
  root.querySelector("#spx-submit").onclick=()=>{
   if(selected<0||validated)return;validated=true;
   const ok=selected===q.placement;if(ok)score++;
   root.querySelectorAll("[data-option]").forEach(b=>b.disabled=true);
   const wrong=q.choices[selected],other=ED[id].pairs.find(p=>p[q.dir===0?1:0]===wrong);
   const explain=ok?"Tu as retrouvé la bonne traduction.":"Tu as choisi « "+wrong+" »."+(other?" Cette réponse correspond à « "+other[q.dir===0?0:1]+" ».":"");
   root.querySelector("#spx-correct").innerHTML='<div class="spx-feedback"><strong>'+(ok?"Bonne réponse !":"Pas tout à fait. Regarde pourquoi.")+'</strong><p>'+esc(explain)+'</p><p><strong>Bonne réponse : '+esc(q.correct)+'</strong></p><p>« '+esc(q.p[0])+' » signifie « '+esc(q.p[1])+' ».</p><p>'+esc(ED[id].tip)+'</p></div>';
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