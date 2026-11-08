/* Entraînements espagnols, une seule validation, synchronisés par Firebase.
   Mode invité : lecture seule. Parent : consultation des notes/corrections.
   Pas de remise à zéro, aucun XP, pas de correction inventée si serveur indisponible. */
(()=>{'use strict';
const ENGINE=window.TIM_SPANISH_TRAINING_ENGINE;
const COURSE=()=>window.TIM_SPANISH_EDU||{};
const esc=x=>String(x??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const draftKey=id=>"tim_spanish_unique_training_draft_v1_"+id;
const draft=id=>{try{const d=JSON.parse(localStorage.getItem(draftKey(id))||"null");return Array.isArray(d)&&d.length===10?d.map(v=>String(v??"")):null;}catch(e){return null;}};
const saveDraft=(id,answers)=>{try{localStorage.setItem(draftKey(id),JSON.stringify(answers));}catch(e){}};
const clearDraft=id=>{try{localStorage.removeItem(draftKey(id));}catch(e){}};
const progress=()=>window.__TIM_GUEST?{status:'guest',message:'Mode invité : les exercices sont consultables uniquement avec le compte Tim.',attempts:[]}:window.__TIM_SPANISH_PROGRESS||{status:'loading',attempts:[]};
const found=id=>{const cloud=(progress().attempts||[]).find(a=>a.id===id),cached=localAttempt(id);if(!cloud)return cached;if(cached&&Array.isArray(cached.items)&&cached.items.length===10)return {...cloud,score:cached.score,items:cached.items,localOnly:false};return cloud;};
const isTim=()=>!window.__TIM_GUEST&&!window.__TIM_PARENT;

/* Mode transitoire, à distinguer du compte Firebase. Aucune réponse n'est perdue
   à cause d'une erreur de publication du serveur ; les copies restent sur cet appareil. */
const COMPLETED_KEY="tim_spanish_training_completed_local_v1";
function readLocal(){
 try{const x=JSON.parse(localStorage.getItem(COMPLETED_KEY)||"{}");
  return x&&typeof x==="object"&&!Array.isArray(x)?x:{};}catch(e){return {};}
}
function storeLocal(report,answers){
 try{
  const saved=readLocal();
  if(saved[report.id])return saved[report.id];
  const item={...report,answers,submitted:true,localOnly:!report.cloudSaved,xp:0,submittedAt:new Date().toISOString()};
  saved[report.id]=item;localStorage.setItem(COMPLETED_KEY,JSON.stringify(saved));
  return item;
 }catch(error){throw Error("Stockage local indisponible. Les réponses restent en brouillon, mais aucun exercice n’a été validé.");}
}
function markCloudSaved(id){
 try{
  const x=readLocal();
  if(!x[id]||x[id].cloudSaved)return;
  x[id]={...x[id],localOnly:false,cloudSaved:true};
  localStorage.setItem(COMPLETED_KEY,JSON.stringify(x));
 }catch(e){}
}
function localAttempt(id){return isTim()?readLocal()[id]||null:null;}
let syncing=false;
async function syncPending(){
 if(syncing||!isTim()||progress().status!=='ok'||!window.__TIM_BRIDGE?.trainingSubmit)return;
 const entries=Object.entries(readLocal()).filter(([id,item])=>item.localOnly&&!item.cloudSaved);
 if(!entries.length)return;
 syncing=true;
 try{
  for(const [id,item] of entries){
   if((progress().attempts||[]).some(a=>a.id===id)){markCloudSaved(id);continue;}
   if(!Array.isArray(item.answers)||item.answers.length!==10)continue;
   try{
    const report=await window.__TIM_BRIDGE.trainingSubmit(id,item.answers);
    if(report?.submitted)markCloudSaved(id);
   }catch(error){
    if(String(error.code||"").includes("already-exists")){
     await window.__TIM_BRIDGE.trainingProgress();
     if((progress().attempts||[]).some(a=>a.id===id))markCloudSaved(id);
    }
   }
  }
 }finally{syncing=false;}
}

function listIds(lesson){return ["Q","W"].flatMap(mode=>[1,2,3,4,5].map(n=>"SP"+mode+"_"+lesson+"_0"+n));}
function count(lesson){return listIds(lesson).filter(id=>found(id)).length;}
function progressLabel(lesson){const n=count(lesson);return n+" / 10 exercices terminés";}
function mount(root,{lesson,onBack}){
 const slot=root.querySelector("#spx-training-list");if(!slot)return;
 let currentId=null;
 function drawList(){
  currentId=null;
  const p=progress(),ready=p.status==='ok'||(['unavailable','local'].includes(p.status)&&isTim());
  const header=(ready?'<p class="spx-training-status">'+progressLabel(lesson)+'</p>'+
   '<div class="spx-training-track" role="progressbar" aria-label="Exercices terminés" aria-valuenow="'+count(lesson)+'" aria-valuemin="0" aria-valuemax="10"><span style="width:'+(count(lesson)*10)+'%"></span></div>':'')+
   (['unavailable','local'].includes(p.status)&&isTim()?'<p class="spx-training-warning"><strong>Mode provisoire :</strong> les réponses, les notes et les corrections sont enregistrées uniquement sur cet appareil. Ton parent ne les voit pas encore sur son compte. Ne supprime pas les données du navigateur. Le transfert vers Firebase sera tenté quand il sera disponible.</p>':
    p.status!=='ok'?'<p class="spx-training-warning">'+esc(p.message||'Chargement du suivi des exercices…')+'</p>':'');
  const section=mode=>'<h4 class="spx-training-group-title">'+(mode==='Q'?'5 exercices QCM':'5 exercices à écrire')+'</h4>'+
   Array.from({length:5},(_,j)=>{
    const id='SP'+mode+'_'+lesson+'_0'+(j+1),done=found(id),saved=draft(id),name=mode==='Q'?'QCM '+(j+1):'Écriture '+(j+1);
    const detail=done?'Terminé · '+(done.score===null?'Note à consulter depuis le compte Parent':done.score+'/10')+' · '+(done.localOnly?'Sur cet appareil · ':'')+'Voir le bilan':
     saved&&saved.some(v=>v.trim())?'En cours sur cet appareil · Reprendre':
     'À faire · 10 questions';
    return '<button type="button" class="spx-training-item'+(done?' is-done':'')+'" data-training-id="'+id+'"'+
     (!ready?' disabled title="Sauvegarde indisponible"':'')+'>'+
     '<span class="spx-training-state" aria-hidden="true">'+(done?'✓':String(j+1))+'</span>'+
     '<span><strong>'+name+'</strong><small>'+esc(detail)+'</small></span>'+
     '<span aria-hidden="true">›</span></button>';
   }).join('');
  slot.innerHTML=header+section('Q')+section('W')+
   '<p class="spx-note">Une seule tentative par exercice. Après validation, tu peux relire les réponses et les corrections, mais pas recommencer. Les XP restent réservés aux bonus.</p>';
  slot.querySelectorAll('[data-training-id]').forEach(b=>b.onclick=()=>openExercise(b.dataset.trainingId));
 }
 function openExercise(id){
  const task=ENGINE.buildSpanishTasks(id,COURSE());if(!task)return;
  currentId=id;
  const done=found(id);
  if(done){drawReview(done);return;}
  const canAnswer=isTim()&&['ok','local','unavailable'].includes(progress().status);
  const prev=draft(id)||Array(10).fill('');
  const title=task.mode==='Q'?'QCM '+task.series:'Écriture '+task.series;
  const blocks=task.questions.map((q,i)=>{
   const control=q.type==='mc'?'<div class="spx-training-options">'+q.choices.map((x,k)=>'<label><input type="radio" name="q'+i+'" value="'+k+'"'+(prev[i]===String(k)?' checked':'')+(canAnswer?'':' disabled')+'><span>'+esc(x)+'</span></label>').join('')+'</div>':
    '<input class="spx-training-text" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" data-response="'+i+'" value="'+esc(prev[i])+'" placeholder="Écris ta réponse" maxlength="300"'+(canAnswer?'':' disabled')+'>';
   return '<fieldset class="spx-training-question"><legend>Question '+(i+1)+' / 10</legend><p>'+esc(q.prompt)+'</p>'+control+'</fieldset>';
  }).join('');
  slot.innerHTML='<button class="spx-training-back" type="button" id="spx-training-return">← Liste des exercices</button>'+
   '<h3>'+title+' — '+esc(COURSE()[lesson].name)+'</h3>'+
   '<p class="spx-training-reminder">Une seule validation définitive. Tu pourras ensuite consulter la correction et la note, sans rejouer. Aucun XP.</p>'+
   (['unavailable','local'].includes(progress().status)&&isTim()?'<p class="spx-training-warning">Sauvegarde provisoire sur ce téléphone seulement : synchronisation avec le compte Tim en attente.</p>':'')+
   (!canAnswer?'<p class="spx-training-warning">Seul le compte Tim peut répondre et enregistrer une note.</p>':'')+
   '<form id="spx-training-form">'+blocks+
   (canAnswer?'<div id="spx-training-check" aria-live="polite"></div><button class="spx-button" type="submit" id="spx-training-submit">Vérifier mes 10 réponses</button>':'')+
   '</form>';
  slot.querySelector('#spx-training-return').onclick=drawList;
  if(!canAnswer)return;
  const form=slot.querySelector('#spx-training-form'),check=slot.querySelector('#spx-training-check');
  const read=()=>task.questions.map((q,i)=>q.type==='mc'?
   (form.querySelector('input[name="q'+i+'"]:checked')?.value||'') :
   (form.querySelector('[data-response="'+i+'"]')?.value||'').trim());
  form.addEventListener('input',()=>{saveDraft(id,read());check.replaceChildren();});
  form.addEventListener('change',()=>{saveDraft(id,read());check.replaceChildren();});
  form.onsubmit=e=>{
   e.preventDefault();
   const values=read(),missing=task.questions.findIndex((q,i)=>!String(values[i]).trim());
   if(missing>=0){check.innerHTML='<p class="spx-training-warning">Réponds d’abord à la question '+(missing+1)+'.</p>';return;}
   check.innerHTML='<p class="spx-training-warning">Attention : après validation, cet exercice sera terminé définitivement. Tu pourras consulter la correction, mais pas le refaire.</p><button type="button" class="spx-button" id="spx-training-confirm">Confirmer la validation définitive</button>';
   const button=check.querySelector('#spx-training-confirm');
   button.onclick=async()=>{
    button.disabled=true;button.textContent='Enregistrement en cours…';
    try{
     if(['unavailable','local'].includes(progress().status)){
      // Un seul résultat local par identifiant : ne pas présenter cela comme une sauvegarde Firebase.
      const evaluated=ENGINE.evaluateSpanishTask(task,values);
      const local=storeLocal({...evaluated,mode:task.mode,series:task.series,lessonId:task.lesson},values);
      clearDraft(id);drawReview(local);return;
     }
     if(!window.__TIM_BRIDGE?.trainingSubmit)throw Error('Service non disponible.');
     const report=await window.__TIM_BRIDGE.trainingSubmit(id,values);
     if(!report?.submitted||!report.cloudSaved)throw Error('Confirmation serveur incomplète.');
     const scored=ENGINE.evaluateSpanishTask(task,values);
     const local=storeLocal({...scored,mode:task.mode,series:task.series,lessonId:task.lesson,cloudSaved:true},values);
     clearDraft(id);drawReview(local);
    }catch(error){
     // Vérifier d'abord si le serveur a bien enregistré la tentative malgré
     // une réponse réseau perdue ; ne jamais permettre une deuxième tentative.
     try{await window.__TIM_BRIDGE?.trainingProgress?.();}catch(e){}
     const cloud=(progress().attempts||[]).find(a=>a.id===id);
     if(cloud){clearDraft(id);drawReview(cloud);return;}
     // Sans confirmation Firebase, garder une unique copie locale explicite
     // plutôt que de laisser le travail effectué par Tim disparaître.
     try{
      const evaluated=ENGINE.evaluateSpanishTask(task,values);
      const local=storeLocal({...evaluated,mode:task.mode,series:task.series,lessonId:task.lesson},values);
      clearDraft(id);drawReview(local);
     }catch(err){
      check.innerHTML='<p class="spx-training-warning">Enregistrement indisponible. Les réponses restent en brouillon sur cet appareil : '+esc(err.message||error.message||'Erreur')+'.</p>';
     }
    }
   };
  };
 }
 function drawReview(record){
  currentId=record.id;
  const task=ENGINE.buildSpanishTasks(record.id,COURSE());
  if(!task){drawList();return;}
  if(!Array.isArray(record.items)||record.items.length!==10){
   slot.innerHTML='<button class="spx-training-back" type="button" id="spx-training-return">← Liste des exercices</button>'+
     '<h3>Exercice terminé · '+(task.mode==='Q'?'QCM ':'Écriture ')+task.series+'</h3>'+
     '<p class="spx-training-score">Exercice enregistré dans le compte · 0 XP</p>'+
     '<p class="spx-note">Cet exercice ne peut pas être rejoué. Les réponses de cette tentative ne sont pas disponibles sur cet appareil. Le compte Parent peut consulter la note enregistrée et le détail des corrections.</p>'+
     '<div class="spx-example">Réponses de référence : '+task.questions.map((q,i)=>(i+1)+'. '+esc(q.answer)).join(' · ')+'</div>';
   slot.querySelector('#spx-training-return').onclick=drawList;return;
  }
  slot.innerHTML='<button class="spx-training-back" type="button" id="spx-training-return">← Liste des exercices</button>'+
   '<h3>Exercice terminé · '+(task.mode==='Q'?'QCM ':'Écriture ')+task.series+'</h3>'+
   '<p class="spx-training-score">'+(record.localOnly?'Résultat conservé sur cet appareil : ':'Résultat enregistré dans le compte : ')+record.score+' / 10 · 0 XP</p>'+
   (record.localOnly?'<p class="spx-training-warning">Correction conservée localement. Elle sera synchronisée avec le compte Tim dès que Firebase sera disponible.</p>':'')+
   '<p class="spx-note">Une seule tentative. Voici tes réponses, les bonnes réponses et les explications. Cet exercice est verrouillé pour éviter de le rejouer.</p>'+
   record.items.map((item,i)=>'<section class="spx-training-correction '+(item.correct?'good':'bad')+'">'+
    '<h4>Question '+(i+1)+' · '+(item.correct?'Bonne réponse':'À revoir')+'</h4>'+
    '<p>'+esc(item.prompt||task.questions[i].prompt)+'</p>'+
    '<p><strong>Ta réponse :</strong> '+esc(task.questions[i].type==='mc'?(task.questions[i].choices[Number(item.response)]||item.response):item.response)+'</p>'+
    '<p><strong>Réponse attendue :</strong> '+esc(item.expected)+'</p>'+
    '<p>'+esc(item.explanation||'')+'</p></section>').join('')+
   '<p class="spx-note">Si tu veux continuer à travailler cette notion après validation, les bonus XP restent disponibles à l’accueil général.</p>';
  slot.querySelector('#spx-training-return').onclick=drawList;
 }
 drawList();
 const update=()=>{if(!currentId){drawList();syncPending().then(()=>{if(!currentId)drawList();}).catch(()=>{});}};
 document.addEventListener('tim-spanish-training-progress',update,{once:true});
 if(progress().status==='ok')syncPending().then(()=>{if(!currentId)drawList();}).catch(()=>{});
 if(window.__TIM_BRIDGE?.trainingProgress&&progress().status!=='ok'){
  window.__TIM_BRIDGE.trainingProgress().catch(()=>{});
 }
 return {refresh:drawList};
}
function renderParentProgress(root){
 const box=document.createElement('section');box.className='panel spx-parent-progress';
 box.innerHTML='<h3>Espagnol — suivi des 150 entraînements</h3><div id="spx-parent-progress-list"></div>';
 root.append(box);
 const slot=box.querySelector('#spx-parent-progress-list');
 const render=()=>{
  const p=progress();if(p.status!=='ok'){slot.innerHTML='<p class="spx-training-warning">'+esc(p.message||'Chargement du suivi…')+'</p>';return;}
  const ids=Object.keys(COURSE()),total=(p.attempts||[]).length;
  slot.innerHTML='<p><strong>'+total+' / 150</strong> exercices terminés par Tim. Une seule note par exercice, sans meilleure note ni seconde tentative.</p>'+
   ids.map(id=>{
    const attempts=listIds(id).map(key=>found(key)).filter(Boolean);
    return '<details class="spx-parent-chapter"><summary>'+esc(COURSE()[id].name)+' — '+attempts.length+'/10 fait(s)</summary>'+
     (attempts.length?attempts.map(a=>'<details class="spx-parent-result"><summary>'+(a.mode==='Q'?'QCM ':'Écriture ')+a.series+' — '+(a.score===null?'note indisponible':a.score+'/10')+'</summary>'+
      (a.items||[]).map((it,i)=>'<p><strong>Question '+(i+1)+'</strong> : '+esc(it.prompt)+'<br>Tim : '+esc(it.response)+' · attendu : '+esc(it.expected)+' · '+(it.correct?'correct':'à revoir')+'</p>').join('')+'</details>').join(''):'<p>Aucun exercice terminé.</p>')+'</details>';
   }).join('')+
   '<button type="button" class="spx-button subtle" id="spx-parent-refresh">Actualiser le suivi</button>';
  slot.querySelector('#spx-parent-refresh').onclick=async()=>{
   const b=slot.querySelector('#spx-parent-refresh');b.disabled=true;b.textContent='Actualisation…';
   try{await window.__TIM_BRIDGE.trainingProgress();}catch(e){}render();
  };
 };
 render();
 document.addEventListener('tim-spanish-training-progress',render,{once:true});
}
window.TIM_SPANISH_TRAINING_UI={mount,progressLabel,renderParentProgress,listIds};
})();
