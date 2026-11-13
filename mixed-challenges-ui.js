/* Défis mélangés : navigation mobile, méthode, brouillon et relecture.
   Module indépendant : aucun envoi sans clic définitif de Tim. */
(function(){'use strict';
const KEY='tim-mixed-challenges-drafts-v1';
const E=(tag,text,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;};
const btn=(text,fn,cls='mix-btn')=>{const x=E('button',text,cls);x.type='button';x.onclick=fn;return x;};
const finite=x=>Number.isFinite(Number(x));
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}
function save(id,draft){try{const all=read();if(draft)all[id]=draft;else delete all[id];localStorage.setItem(KEY,JSON.stringify(all));}catch{}}
function decode(value){try{return JSON.parse(value);}catch{return {};}}
function answered(q,answer){
 if(q.type!=='reason')return String(answer||'').trim()!=='';
 const a=decode(answer);return /^[0-9]+$/.test(String(a.m??''))&&String(a.c||'').trim()!==''&&String(a.s||'').trim()!=='';
}
function label(tag,text){const x=E(tag,text);x.classList.add('mix-label');return x;}
function draw(q,after=false){
 if(!q.diagram)return null;
 const area=E('div',undefined,'mix-diagram'),ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 300 145');
 svg.setAttribute('role','img');svg.setAttribute('aria-label',q.diagram==='atom'?'Schéma du noyau et des particules de l’atome':q.diagram==='water'?'Schéma de molécules d’eau':q.diagram==='rectangle'?'Rectangle avec dimensions':'Triangle rectangle avec longueurs');
 const add=(name,attrs,text)=>{const z=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))z.setAttribute(k,v);if(text!==undefined)z.textContent=String(text);svg.append(z);return z;};
 const ink='currentColor';
 if(q.diagram==='rectangle'){
  add('rect',{x:52,y:24,width:190,height:94,fill:'none',stroke:ink,'stroke-width':2});
  add('text',{x:143,y:17,'text-anchor':'middle',fill:ink,'font-size':13},q.dimensions[0]+' cm');
  add('text',{x:249,y:75,fill:ink,'font-size':13},q.dimensions[1]+' cm');
 }else if(q.diagram==='triangle'){
  add('path',{d:'M60 20 L60 119 L240 119 Z',fill:'none',stroke:ink,'stroke-width':2});
  add('path',{d:'M60 101 H78 V119',fill:'none',stroke:ink,'stroke-width':2});
  add('text',{x:40,y:77,fill:ink,'font-size':13},q.dimensions[0]+' cm');
  add('text',{x:132,y:135,fill:ink,'font-size':13},q.dimensions[1]+' cm');
  add('text',{x:150,y:64,fill:ink,'font-size':13},'?');
 }else if(q.diagram==='atom'){
  add('circle',{cx:75,cy:75,r:38,fill:'#f3d8de',stroke:'#a44259','stroke-width':1.5});
  const p=Number(q.dimensions[1]),a=Number(q.dimensions[0]);
  add('text',{x:75,y:71,'text-anchor':'middle','font-size':13,fill:'#5b2234'},'Noyau');
  add('text',{x:75,y:88,'text-anchor':'middle','font-size':11,fill:'#5b2234'},'A = '+a);
  add('text',{x:154,y:52,'font-size':14,fill:ink},'Protons : Z = '+p);
  add('text',{x:154,y:81,'font-size':14,fill:ink},'Neutrons : ?');
  if(after)add('text',{x:154,y:112,'font-size':13,fill:ink},'Neutrons = A − Z');
 }else if(q.diagram==='water'){
  const count=Math.min(4,Number(q.dimensions[0])||2);
  for(let i=0;i<count;i++){const cx=32+(i%4)*72,cy=65;
   add('circle',{cx,cy,r:14,fill:'#e06b61',stroke:'#973f36','stroke-width':1.5});
   add('circle',{cx:cx-16,cy:cy-17,r:9,fill:'#e6effa',stroke:'#4777a0'});
   add('circle',{cx:cx+16,cy:cy-17,r:9,fill:'#e6effa',stroke:'#4777a0'});
  }
  add('text',{x:145,y:116,'text-anchor':'middle','font-size':13,fill:ink},count+' molécules de H₂O');
 }
 area.append(svg);return area;
}
function open(ex,ctx={}){
 const host=document.getElementById('exercise-detail'),index=document.getElementById('exercise-index');
 if(!host||!index)return;
 index.classList.add('hide');host.classList.add('active');
 const parent=Boolean(window.__TIM_PARENT),guest=Boolean(window.__TIM_GUEST),serviceReadOnly=Boolean(window.__TIM_READONLY_FALLBACK);
 const old=ctx.old||null,questions=ex.questions||[];
 let preview=null;
 const stored=read()[ex.id]||{},state={
  answers:Array.from({length:questions.length},(_,i)=>String(stored.answers?.[i]||'')),
  translated:Array.from({length:questions.length},(_,i)=>stored.translated?.[i]===true),
  baseline:stored.baseline||null,stage:old?'result':(guest||serviceReadOnly?'quiz':'intro'),page:0,
  checked:[false,false,false,false]};
 const persist=()=>{if(!old&&!parent&&!guest)save(ex.id,{answers:state.answers,translated:state.translated,baseline:state.baseline});};
 const clear=()=>host.replaceChildren();
 const back=()=>{index.classList.remove('hide');host.classList.remove('active');ctx.onReturn?.();};
 const head=()=>{const top=E('div',undefined,'mix-head');
  top.append(btn('← Retour aux défis',back,'mix-link'),E('h2',ex.title));
  top.append(E('p',parent?
    'ESSAI PARENT · '+questions.length+' questions · correction immédiate · aucune note ni aucun XP de Tim enregistré.':
    ([...new Set(questions.map(q=>q.subject))].sort((a,b)=>['Espagnol','Mathématiques','Physique-chimie','Anglais','SVT','Histoire-géographie'].indexOf(a)-['Espagnol','Mathématiques','Physique-chimie','Anglais','SVT','Histoire-géographie'].indexOf(b)).join(' · '))+' — '+questions.length+' questions · une seule validation.','mix-muted'));
  host.append(top);};
 const focus=()=>{host.scrollIntoView?.({behavior:'smooth',block:'start'});};
 const advice=['Lis toutes les consignes jusqu’au bout.','Pose tes calculs sur ton brouillon papier.','Si tu bloques, avance et reviens ensuite.','Rédige des étapes et une phrase de conclusion.','Garde du temps pour relire ta copie.','Pour une interro longue, organise ton travail.','Utilise toutes les bonnes habitudes de la semaine.'];
 function showIntro(){
  clear();head();const box=E('section',undefined,'mix-panel');
  box.append(E('h3',parent?'Essai Parent — méthode du défi':'Ma méthode avant l’interrogation'));
  const day=new Date().getDay();box.append(E('p','Conseil du jour : '+advice[(day+6)%7],'mix-advice'));
  const list=E('ol');
  for(const s of ['Je lis la consigne et je repère ce qui est demandé.','Je cherche sur mon brouillon avant de rédiger.','J’écris mon calcul ou mon raisonnement, puis ma conclusion.','Je passe une question difficile et j’y reviens.','Je relis ma copie avant de valider.'])list.append(E('li',s));
  box.append(list,E('p','Prépare une feuille, un stylo et éventuellement une règle. Aucune aide ne donne les réponses pendant le défi.','mix-muted'));
  if(parent)box.append(E('p','Tu peux répondre librement, même à quelques questions seulement, puis demander le corrigé. Tu pourras recommencer cet essai autant de fois que nécessaire, sans toucher au compte Tim.','mix-advice'));
  box.append(btn(parent?'Commencer mon essai Parent':'J’ai préparé mon brouillon — Commencer',
    ()=>{state.stage='quiz';showQuiz();},'mix-btn mix-primary'));
  host.append(box);focus();
 }
 const countAnswered=()=>questions.filter((q,i)=>answered(q,state.answers[i])).length;
 function questionControls(box,q,i){
  const val=state.answers[i]||'';
  if(q.type==='mc'){
   const group=E('div',undefined,'mix-options');
   q.options.forEach((opt,idx)=>{
    const line=E('label',undefined,'mix-option'),radio=E('input');
    radio.type='radio';radio.name='mix-'+ex.id+'-'+i;radio.value=String(idx);radio.checked=val===String(idx);
    radio.onchange=()=>{state.answers[i]=String(idx);persist();};if(old||guest||serviceReadOnly)radio.disabled=true;
    line.append(radio,E('span',opt));group.append(line);
   });box.append(group);
  }else if(q.type==='reason'){
   const current=decode(val);
   box.append(E('p','1. Je choisis la méthode','mix-step-label'));
   q.methods.forEach((method,k)=>{
    const line=E('label',undefined,'mix-option'),radio=E('input');
    radio.type='radio';radio.name='method-'+ex.id+'-'+i;radio.value=String(k);radio.checked=String(current.m??'')===String(k);
    radio.onchange=()=>{current.m=String(k);state.answers[i]=JSON.stringify(current);persist();};
    if(old||guest||serviceReadOnly)radio.disabled=true;line.append(radio,E('span',method));box.append(line);
   });
   for(const [key,heading,placeholder] of [['c','2. Mon calcul et mes étapes','Je pose mon opération sur le brouillon, puis j’écris mon calcul…'],['s','3. Ma conclusion','Je rédige une phrase complète avec le résultat et l’unité…']]){
    box.append(E('p',heading,'mix-step-label'));
    const field=E('textarea',undefined,'mix-textarea');field.rows=key==='c'?3:2;
    field.placeholder=placeholder;field.value=current[key]||'';field.disabled=!!old||guest||serviceReadOnly;
    field.oninput=()=>{current[key]=field.value;state.answers[i]=JSON.stringify(current);persist();};
    box.append(field);
   }
   box.append(E('p','Utilise ton brouillon pour poser ton calcul avant de répondre.','mix-paper'));
  }else{
   const input=q.format==='short'?E('textarea',undefined,'mix-textarea'):E('input',undefined,'mix-input');
   if(q.format==='short')input.rows=3;else input.type='text';
   input.autocomplete='off';input.spellcheck=q.subject!=='Espagnol';input.placeholder='Écris ta réponse ici…';
   input.value=val;input.disabled=!!old||guest||serviceReadOnly;
   input.oninput=()=>{state.answers[i]=input.value;persist();};
   box.append(input);
  }
 }
 function showQuiz(){
  state.stage='quiz';clear();head();
  const progress=E('section',undefined,'mix-progress');
  progress.append(E('strong','Question '+(state.page+1)+' / '+questions.length),
   E('span',countAnswered()+' réponse(s) complétée(s)'));
  const track=E('div',undefined,'mix-track'),fill=E('div',undefined,'mix-track-fill');
  fill.style.width=(100*(state.page+1)/questions.length)+'%';track.append(fill);progress.append(track);
  host.append(progress);
  if(serviceReadOnly)host.append(E('p','Lecture seule : le serveur des notes est momentanément indisponible. Aucune tentative ne sera enregistrée. Recharge le classeur lorsque le service fonctionne.','mix-paper'));
  const q=questions[state.page],box=E('section',undefined,'mix-panel');
  box.append(E('p',q.subject+' · '+(q.format==='mc'?'Choix':q.format==='fill'?'À compléter':q.format==='reason'?'Raisonnement':'Réponse écrite'),'mix-subject'));
  box.append(E('h3',q.q));
  const graphic=draw(q);if(graphic)box.append(graphic);
  if(q.subject==='Espagnol'&&q.fr){
   const translate=btn(state.translated[state.page]?'Masquer / afficher la traduction':'Traduire en français',()=>{
    state.translated[state.page]=true;persist();fr.hidden=!fr.hidden;
    translate.textContent=fr.hidden?'Voir la traduction française':'Masquer la traduction';
   },'mix-link');
   const fr=E('p',q.fr,'mix-translation');fr.hidden=true;
   box.append(translate,fr);
  }
  questionControls(box,q,state.page);host.append(box);
  const nav=E('div',undefined,'mix-nav');
  const previous=btn('← Précédente',()=>{state.page=Math.max(0,state.page-1);showQuiz();},'mix-btn');
  previous.disabled=state.page===0;nav.append(previous);
  nav.append(btn(state.page===questions.length-1?'Relire ma copie':'Suivante →',()=>{
   if(state.page<questions.length-1){state.page++;showQuiz();}else showReview();
  },'mix-btn mix-primary'));
  host.append(nav);focus();
 }
 function showReview(){
  state.stage='review';
  if(state.baseline===null){state.baseline=state.answers.slice();persist();}
  clear();head();
  const box=E('section',undefined,'mix-panel');box.append(E('h3','Avant de rendre ma copie'));
  box.append(E('p','Tu as répondu à '+countAnswered()+' question(s) sur '+questions.length+'. Tu peux revenir modifier chaque réponse.'+
    (parent?' En essai Parent, les questions laissées vides vaudront zéro, sans blocage.':''),'mix-muted'));
  const rules=['J’ai relu attentivement les consignes.','J’ai vérifié mes calculs, signes et unités.','J’ai relu les langues, les notions de SVT, les dates et les mots d’histoire-géographie.','J’ai relu toutes mes conclusions et répondu à chaque question.'];
  rules.forEach((text,i)=>{const line=E('label',undefined,'mix-check'),checkbox=E('input');checkbox.type='checkbox';checkbox.checked=state.checked[i];
   checkbox.onchange=()=>{state.checked[i]=checkbox.checked;showReview();};line.append(checkbox,E('span',text));box.append(line);});
  const list=E('div',undefined,'mix-review-list');
  questions.forEach((q,i)=>{const complete=answered(q,state.answers[i]),button=btn(
   'Question '+(i+1)+' · '+q.subject+' · '+(complete?'Réponse présente':'À compléter'),()=>{
    state.page=i;showQuiz();
   },'mix-review-item'+(complete?'':' mix-missing'));
   list.append(button);});
  box.append(E('h4','Revoir mes réponses'),list);
  const submit=btn(parent?'Corriger mon essai Parent (sans XP)':'Valider définitivement mon défi',async()=>{
   if(!parent&&(countAnswered()!==questions.length||state.checked.some(v=>!v))){
    alert('Réponds aux questions restantes et coche les étapes de relecture.');return;
   }
   if(!parent&&!confirm('Valider définitivement ? Une seule tentative : tu recevras ensuite ta note et ton corrigé.'))return;
   submit.disabled=true;submit.textContent=parent?'Calcul de ma correction…':'Enregistrement sécurisé…';
   try{
    if(parent){
     const graded=await window.__TIM_BRIDGE.mixedMissionPreview(ex.id,state.answers,state.translated);
     if(!graded||graded.practice!==true||graded.saved!==false||graded.xp!==0)
      throw Error('Essai non confirmé comme non enregistré.');
     preview=graded;state.stage='result';showResult();return;
    }
    const reviewChanges=Array.isArray(state.baseline)?
     state.answers.flatMap((after,i)=>state.baseline[i]!==after?
       [{questionIndex:i,before:state.baseline[i]||'',after}]:[]):[];
    const result=await window.__TIM_BRIDGE.submit(ex.id,state.answers,{
     translationsUsed:state.translated,reviewChanges});
    save(ex.id,null);await ctx.onSaved?.(result);
   }catch(err){
    if(parent){
     submit.disabled=false;submit.textContent='Corriger mon essai Parent (sans XP)';
     box.append(E('p','Correction indisponible : '+String(err?.message||err)+'. Aucune note ni aucun XP de Tim modifié.','mix-paper'));
     return;
    }
    submit.disabled=false;submit.textContent='Valider définitivement mon défi';
    try{await window.__TIM_BRIDGE.refresh?.();}catch{}
    if((window.__CLOUD_ATTEMPTS||[]).some(x=>x.id===ex.id)){ctx.onReload?.();return;}
    alert('Validation non confirmée. Tes réponses restent conservées. '+String(err?.message||err));
   }
  },'mix-btn mix-primary');
  if(!parent&&(countAnswered()!==questions.length||state.checked.some(v=>!v)))submit.disabled=true;
  box.append(submit,E('p',parent?
   'Simulation sans enregistrement : tu peux demander la correction, même avec des réponses manquantes, puis recommencer.':
   'Tu peux modifier tes réponses jusqu’à ce dernier clic. Après, le défi ne peut plus être recommencé.','mix-muted'));
  host.append(box);focus();
 }
 function showResult(){
  clear();head();
  const copy=E('section',undefined,'mix-panel');
  const report=parent?preview:old;
  if(!report){copy.append(E('p','Copie en cours de récupération.'));host.append(copy);return;}
  copy.append(E('h3',(parent?'Note de mon essai Parent : ':'Ma note : ')+
    (finite(report.score)?Number(report.score).toLocaleString('fr-FR')+'/'+report.total:'à actualiser')));
  copy.append(E('p',parent?'ESSAI PARENT · 0 XP · aucune note de Tim enregistrée.':
   'XP obtenus : '+(finite(report.xp)?(report.xp>=0?'+':'')+report.xp:'à confirmer')+' XP','mix-advice'));
  if(Number.isInteger(report.translationHelpCount))copy.append(E('p','Traduction utilisée pour '+report.translationHelpCount+' question(s) d’espagnol.','mix-muted'));
  if(!Array.isArray(report.answers)||report.answers.length!==questions.length){
   copy.append(E('p',parent?'La correction de cet essai est indisponible.':'Le résultat est enregistré. Actualise pour récupérer toute la correction.','mix-muted'));
   if(!parent)copy.append(btn('Actualiser mon corrigé',async()=>{await window.__TIM_BRIDGE.refresh();ctx.onReload?.();},'mix-btn'));
   host.append(copy);return;
  }
  for(const [i,a] of report.answers.entries()){
   const q=questions[i],item=E('article',undefined,'mix-correction');
   const partial=Number(a.points)||0;
   item.append(E('h4','Question '+(i+1)+' · '+q.subject+' · '+partial.toLocaleString('fr-FR')+'/1 point'));
   item.append(E('p',q.q));
   if(q.type==='reason'){
    item.append(E('p','Méthode choisie : '+String(a.methodResponse||'Non renseignée')));
    item.append(E('p','Mon calcul : '+String(a.calculationResponse||'')));
    item.append(E('p','Ma conclusion : '+String(a.conclusionResponse||'')));
    item.append(E('p','Méthode : '+(a.methodCorrect?'bien choisie':'à revoir')+
     ' · Calcul : '+(a.calculationCorrect?'correct':'à revoir')+
     ' · Conclusion : '+(a.conclusionCorrect?'correcte':'à revoir'),'mix-muted'));
   }else{
    item.append(E('p','Ma réponse : '+(!String(a.response||'').trim()?'Sans réponse':
     q.type==='mc'?q.options?.[Number(a.response)]||a.response:a.response)));
    if(a.correct===false)item.append(E('p','Réponse attendue : '+String(a.expected||'')));
   }
   item.append(E('p','Explication : '+String(a.explanation||'Relis la leçon pour comprendre.')));
   const dg=draw(q,true);if(dg)item.append(dg);
   item.append(E('p','À revoir : '+(q.lessonId||'leçon correspondante'),'mix-muted'));
   if(q.lessonId&&typeof window.TIM_PEDAGOGY_NAVIGATE==='function')
    item.append(btn('Ouvrir la leçon correspondante',()=>window.TIM_PEDAGOGY_NAVIGATE(q.subject,q.lessonId),'mix-link'));
   copy.append(item);
  }
  if(parent)copy.append(btn('Recommencer un essai Parent',()=>{
   preview=null;state.answers=questions.map(()=>'');state.translated=questions.map(()=>false);
   state.baseline=null;state.checked=[false,false,false,false];state.page=0;showIntro();
  },'mix-btn mix-primary'));
  host.append(copy);focus();
 }
 if(old)showResult();else if(guest||serviceReadOnly)showQuiz();else showIntro();
}
window.TIM_MIXED_UI={open};
})();