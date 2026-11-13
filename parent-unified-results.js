/* Tableau de bord Parent unique : toutes matières, archives et corrections détaillées.
   Consultation exclusivement sous connexion Parent, sans nouvelle écriture Firestore. */
(function(){'use strict';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text??'');return n;};
const cell=(parent,tag,cls,text)=>{const n=el(tag,cls,text);parent.append(n);return n;};
const safeDate=value=>{
 if(!value)return 'Date non disponible';
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toLocaleString('fr-FR',{timeZone:'Europe/Paris'}):'Date non disponible';
};
const isExact=n=>Number.isFinite(Number(n))&&n!==null&&n!==undefined;
const scoreLabel=r=>isExact(r.score)&&isExact(r.total)?Number(r.score).toLocaleString('fr-FR')+'/'+Number(r.total):'Note indisponible';
function subjectOf(id,ex){
 if(/^ESE_L|^SP[QW]_L/.test(id))return 'Espagnol';
 if(/^MT\d\d$/.test(id))return 'Mathématiques';
 if(/^ME_ENT_(PROGRAMMES|THALES3)$/.test(id))return 'Mathématiques';
 if(/^PCQ_L0[1-7]_0[1-3]$/.test(id))return 'Physique-chimie';
 if(/^ENQ_L0[1-7]_0[1-3]$/.test(id))return 'Anglais';
  if(/^SVQ_L0[1-7]_0[1-2]$/.test(id))return 'SVT';
  if(/^HGQ_L0[1-8]_0[1-2]$/.test(id))return 'Histoire-géographie';
 if(/^PC_ENT_(CTRL1|MOLECULES)$/.test(id))return 'Physique-chimie';
 if(/^(DAY_|WEEK_|SUNDAY_)/.test(id))return 'Défis';
 return ex?.subject||'Autre matière';
}
function lessonOf(id,record,ex){
 if(/^ESE_L/.test(id)){
  const num=Number(/^ESE_L(\d\d)/.exec(id)?.[1]);
  const lesson=window.TIM_SPANISH_SIMPLIFIED?.lessons?.[num-1];
  return lesson?'Leçon '+num+' — '+lesson.name:'Leçon '+num;
 }
 if(/^SP[QW]_L/.test(id)){
  const m=/^SP[QW]_(L\d\d)/.exec(id),lesson=m&&window.TIM_SPANISH_EDU?.[m[1]];
  return lesson?.name||'Leçon '+(m?.[1]||'').slice(1);
 }
 if(/^MT\d\d$/.test(id)){
  const ref=record?.lessonId||'MBIS'+id.slice(2);
  return window.__TIM_DATA?.lessons?.find(x=>x.id===ref)?.title||'Sous-leçon '+id.slice(2);
 }
 if(/^PCQ_L0[1-7]_0[1-3]$/.test(id)){
  const ref=record?.lessonId||('PC_BIS'+id.slice(5,7));
  return window.__TIM_DATA?.lessons?.find(x=>x.id===ref)?.title||'Leçon '+id.slice(5,7);
 }
 if(/^ENQ_L0[1-7]_0[1-3]$/.test(id)){const ref=record?.lessonId||('EN_BIS'+id.slice(5,7));return window.TIM_ANGLAIS_PACK?.bis?.find(x=>x.id===ref)?.title||window.__TIM_DATA?.lessons?.find(x=>x.id===ref)?.title||'Leçon d’anglais';}
  if(/^SVQ_L0[1-7]_0[1-2]$/.test(id)){const ref=record?.lessonId||('SVT_BIS'+id.slice(5,7));return window.TIM_SVT_PACK?.bis?.find(x=>x.id===ref)?.title||'Leçon SVT';}
  if(/^HGQ_L0[1-8]_0[1-2]$/.test(id)){const ref=record?.lessonId||('HG_BIS'+id.slice(5,7));return window.TIM_HG_PACK?.bis?.find(x=>x.id===ref)?.title||'Leçon histoire-géographie';}
 if(/^PC_ENT_/.test(id))return record?.source||'Fiche originale du professeur';
 if(/^ME_ENT_/.test(id))return record?.source||'Fiche ENT de maths de Mme Pialet';
 return window.__TIM_DATA?.lessons?.find(x=>x.id===ex?.lesson)?.title||ex?.lesson||'';
}
function questionItems(raw){
 const arr=Array.isArray(raw?.items)?raw.items:Array.isArray(raw?.answers)?raw.answers:[];
 return arr.map(a=>({
  question:a.prompt||a.question||a.q||'Question enregistrée',
  response:a.response??'',
  expected:a.expected??'',
  correct:a.correct??null,
  points:a.points,
  explanation:a.explanation||a.feedback||'',
  category:a.category||''
 }));
}
function perfect(r,items){return isExact(r.score)&&isExact(r.total)&&Number(r.total)>0&&Number(r.score)===Number(r.total)&&items.length>0&&items.every(x=>x.correct===true);}
function makeRecord(raw,kind){
 const id=String(raw?.id||'');if(!id)return null;
 const ex=window.__TIM_DATA?.exercises?.find(e=>e.id===id);
 const subject=subjectOf(id,ex);
 const title=kind==='spanishEnt'?'Exercice '+Number(raw.series||(/_0([1-3])$/.exec(id)?.[1]||1))+' — '+(['','Je comprends les mots','Je complète les phrases','J’écris seul'][raw.series||Number(/_0([1-3])$/.exec(id)?.[1]||1)]||'Espagnol'):
  kind==='math'?'Évaluation de la sous-leçon '+id.slice(2):
  kind==='oldSpanish'?(raw.mode==='Q'?'QCM ':'Écriture ')+(raw.series||1)+' — '+(window.TIM_SPANISH_EDU?.[raw.lessonId]?.name||'Espagnol'):
  String(raw.title||ex?.title||id);
 return {id,title,subject,lesson:lessonOf(id,raw,ex),date:raw.submittedAt||raw.date||'',
   score:raw.score??null,total:raw.total??null,xp:Number(raw.xp||0),kind,raw,
   items:questionItems(raw)};
}
async function allRecords(){
 const bridge=window.__TIM_BRIDGE||{};
 const responses=await Promise.allSettled([
  bridge.spanishEntTrainingProgress?.(),
  bridge.mathTrainingProgress?.(),
  bridge.trainingProgress?.(),
  bridge.parentReport?.(),
  bridge.physicsTrainingProgress?.(),
  bridge.englishTrainingProgress?.(),
  bridge.svtTrainingProgress?.(),
  bridge.hgTrainingProgress?.(),
  bridge.physicsEntProgress?.(),
  bridge.mathEntProgress?.()
 ]);
 const [spanish,math,oldSpanish,report,physics,english,svt,hg,physEnt,mathEnt]=responses.map(x=>x.status==='fulfilled'?x.value:null);
 const map=new Map(),add=(record,kind)=>{
  const x=makeRecord(record,kind);if(!x)return;
  const prev=map.get(x.id);
  if(!prev||x.items.length>prev.items.length)map.set(x.id,x);
 };
 for(const r of window.__CLOUD_ATTEMPTS||[])add(r,'legacy');
 for(const r of oldSpanish?.attempts||window.__TIM_SPANISH_PROGRESS?.attempts||[])add(r,'oldSpanish');
 for(const r of spanish?.attempts||[])add(r,'spanishEnt');
 for(const r of math?.attempts||[])add(r,'math');
 for(const r of physics?.attempts||[])add(r,'physics');
 for(const r of english?.attempts||[])add(r,'english');
  for(const r of svt?.attempts||[])add(r,'svt');
  for(const r of hg?.attempts||[])add(r,'hg');
 for(const r of physEnt?.attempts||[])add(r,'physicsEnt');
 for(const r of mathEnt?.attempts||[])add(r,'mathEnt');
 for(const r of report?.attempts||[])if(!map.has(r.id))add(r,'parentSummary');
 const warnings=[];
 if(responses[0].status==='rejected')warnings.push('Espagnol : suivi momentanément indisponible');
 if(responses[1].status==='rejected')warnings.push('Mathématiques : suivi momentanément indisponible');
 if(responses[2].status==='rejected')warnings.push('Ancien suivi espagnol : indisponible');
 if(responses[3].status==='rejected')warnings.push('Archives Parent : indisponibles');
 if(responses[4].status==='rejected')warnings.push('Physique-chimie : suivi momentanément indisponible');
 if(responses[5].status==='rejected')warnings.push('Anglais : suivi momentanément indisponible');
  if(responses[6].status==='rejected')warnings.push('SVT : suivi momentanément indisponible');
  if(responses[7].status==='rejected')warnings.push('Histoire-géographie : suivi momentanément indisponible');
 if(responses[8].status==='rejected')warnings.push('Exercices ENT de physique : suivi momentanément indisponible');
 if(responses[9].status==='rejected')warnings.push('Exercices ENT de maths : suivi momentanément indisponible');
 return {records:[...map.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date))),warnings};
}
async function loadDetails(record){
 if(!['spanishEnt','physics','english','svt','hg','physicsEnt','mathEnt'].includes(record.kind)||record.items.length)return record.items;
 const result=record.kind==='hg'?await window.__TIM_BRIDGE.hgTrainingProgress(record.id):record.kind==='svt'?await window.__TIM_BRIDGE.svtTrainingProgress(record.id):record.kind==='english'?await window.__TIM_BRIDGE.englishTrainingProgress(record.id):record.kind==='physics'
  ?await window.__TIM_BRIDGE.physicsTrainingProgress(record.id)
  :record.kind==='physicsEnt'?await window.__TIM_BRIDGE.physicsEntProgress(record.id)
  :record.kind==='mathEnt'?await window.__TIM_BRIDGE.mathEntProgress(record.id)
  :await window.__TIM_BRIDGE.spanishEntTrainingProgress(record.id);
 if(!result?.attempt)throw Error('Copie momentanément indisponible');
 record.items=questionItems(result.attempt);
 return record.items;
}
function renderDetails(slot,record,items){
 slot.replaceChildren();
 if(!items.length){cell(slot,'p','small','Les questions et réponses de cette copie ne sont pas encore disponibles.');return;}
 const isPerfect=perfect(record,items);
 cell(slot,'p','small',isPerfect?'Toutes les réponses sont correctes. Aucune correction nécessaire.':'Questions et réponses de Tim. Seules les erreurs sont expliquées.');
 const errors=items.filter(a=>a.correct===false||a.points===0.5);
 const strengths=items.length-errors.length;
 cell(slot,'p','small','Réussites : '+strengths+' / '+items.length+' · Erreurs : '+errors.length+(record.lesson?' · Leçon : '+record.lesson:''));
 if(errors.length&&record.lesson)cell(slot,'p','small','À revoir : '+record.lesson);
 items.forEach((item,i)=>{
  const line=el('div','separated');
  cell(line,'strong','',(i+1)+'. '+item.question);
  cell(line,'p','', 'Réponse de Tim : '+item.response);
  if(item.correct===false||item.points===0.5){
   cell(line,'p','wrong',item.points===0.5?'Réponse partiellement correcte':'Réponse incorrecte');
   cell(line,'p','correct','Réponse attendue : '+item.expected);
   cell(line,'p','subtle','Explication : '+(item.explanation||'Revoir cette question avec la leçon.'));
  }
  slot.append(line);
 });
}
function render(root){
 root.replaceChildren();
 if(window.__TIM_PARENT!==true){cell(root,'p','small','Tableau de bord réservé au compte Parent.');return;}
 const box=el('section','panel tim-parent-unified');
 cell(box,'h3','','Tableau de bord unique — tous les exercices de Tim');
 cell(box,'p','small','Toutes les matières, les notes, les XP, les copies et les erreurs au même endroit. Les exercices ne sont jamais modifiés ici.');
 const tools=el('div','toolrow');
 const filter=el('select');filter.setAttribute('aria-label','Filtrer par matière');
 const refresh=el('button','plain','Actualiser tous les résultats');
 const exportButton=el('button','plain','Exporter le bilan complet (.json)');
 tools.append(filter,refresh,exportButton);box.append(tools);
 const stats=el('p','small','Chargement des résultats…'),notice=el('div'),list=el('div','results-list');
 box.append(stats,notice,list);root.append(box);
 let results=[],busy=false;
 const paint=()=>{
  const names=['Toutes les matières',...[...new Set(results.map(r=>r.subject))].sort((a,b)=>a.localeCompare(b,'fr'))];
  const current=filter.value||names[0];
  filter.replaceChildren(...names.map(name=>{const o=el('option','',name);o.value=name;return o}));
  filter.value=names.includes(current)?current:names[0];
  const visible=results.filter(r=>filter.value==='Toutes les matières'||r.subject===filter.value);
  stats.textContent=results.length+' exercice(s) enregistré(s) dans toutes les matières · '+visible.length+' affiché(s).';
  list.replaceChildren();
  if(!visible.length){cell(list,'p','small','Aucun exercice terminé dans cette sélection.');return;}
  visible.forEach(r=>{
   const article=el('article','panel');
   cell(article,'h4','',r.subject+' — '+r.title);
   cell(article,'p','small',(r.lesson?r.lesson+' · ':'')+safeDate(r.date));
   cell(article,'p','small','Note : '+scoreLabel(r)+' · XP : '+r.xp.toLocaleString('fr-FR'));
   const details=el('details','summary-details');
   details.append(el('summary','','Voir les  questions, réponses et corrections'));
   const content=el('div');details.append(content);
   let loaded=false;
   details.addEventListener('toggle',async()=>{
    if(!details.open||loaded)return;
    content.replaceChildren();cell(content,'p','small','Chargement de la copie…');
    try{const items=await loadDetails(r);renderDetails(content,r,items);loaded=true}
    catch{content.replaceChildren();cell(content,'p','small','Copie momentanément indisponible. Réessaie en rouvrant ce détail.');}
   });
   article.append(details);list.append(article);
  });
 };
 const update=async()=>{
  if(busy)return;busy=true;refresh.disabled=true;stats.textContent='Actualisation des résultats sécurisés…';
  try{const fresh=await allRecords();results=fresh.records;notice.replaceChildren();
   if(fresh.warnings.length)cell(notice,'p','small',fresh.warnings.join(' · '));
   paint();
  }catch{stats.textContent='Chargement impossible. Les notes existantes ne sont pas modifiées.'}
  finally{refresh.disabled=false;busy=false}
 };
 filter.addEventListener('change',paint);
 refresh.addEventListener('click',update);
 exportButton.addEventListener('click',async()=>{
  exportButton.disabled=true;
  try{
   for(const r of results)if(['spanishEnt','physics','physicsEnt','mathEnt'].includes(r.kind)&&!r.items.length){try{await loadDetails(r)}catch{}}
   const payload={exportedAt:new Date().toISOString(),records:results.map(r=>({
    id:r.id,subject:r.subject,lesson:r.lesson,title:r.title,date:r.date,score:r.score,total:r.total,xp:r.xp,
    questions:r.items
   }))};
   const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='bilan-complet-tim.json';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
  }finally{exportButton.disabled=false}
 });
 update();
}
window.TIM_PARENT_UNIFIED={render};
})();