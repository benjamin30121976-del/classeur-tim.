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
const found=id=>(progress().attempts||[]).find(a=>a.id===id);
const isTim=()=>!window.__TIM_GUEST&&!window.__TIM_PARENT;
function listIds(lesson){return ["Q","W"].flatMap(mode=>[1,2,3,4,5].map(n=>"SP"+mode+"_"+lesson+"_0"+n));}
function count(lesson){return listIds(lesson).filter(id=>found(id)).length;}
function progressLabel(lesson){const n=count(lesson);return n+" / 10 exercices terminés";}
function mount(root,{lesson,onBack}){
 const slot=root.querySelector("#spx-training-list");if(!slot)return;
 let currentId=null;
 function drawList(){
  currentId=null;
  const p=progress(),ready=p.status==='ok';
  const header=ready?'<p class="spx-training-status">'+progressLabel(lesson)+'</p>'+
   '<div class="spx-training-track" role="progressbar" aria-label="Exercices terminés" aria-valuenow="'+count(lesson)+'" aria-valuemin="0" aria-valuemax="10"><span style="width:'+(count(lesson)*10)+'%"></span></div>':
   '<p class="spx-training-warning">'+esc(p.message||'Chargement du suivi des exercices…')+'</p>';
  const section=mode=>'<h4 class="spx-training-group-title">'+(mode==='Q'?'5 exercices QCM':'5 exercices à écrire')+'</h4>'+
   Array.from({length:5},(_,j)=>{
    const id='SP'+mode+'_'+lesson+'_0'+(j+1),done=found(id),saved=draft(id),name=mode==='Q'?'QCM '+(j+1):'Écriture '+(j+1);
    const detail=done?'Terminé · '+done.score+'/10 · Voir la correction':
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
  const canAnswer=isTim()&&progress().status==='ok';
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
     if(!window.__TIM_BRIDGE?.trainingSubmit)throw Error('Service non disponible.');
     const report=await window.__TIM_BRIDGE.trainingSubmit(id,values);
     if(!report?.submitted||!Array.isArray(report.items)||report.items.length!==10)throw Error('Confirmation serveur incomplète.');
     clearDraft(id);drawReview(report);
    }catch(error){
     // Ne pas afficher de note fictive ni marquer comme terminé sans confirmation distante.
     check.innerHTML='<p class="spx-training-warning">La validation n’a pas été confirmée : '+esc(error.message||'Erreur de connexion')+'. Les réponses restent sauvegardées en brouillon sur cet appareil.</p><button class="spx-button subtle" type="button" id="spx-training-reload">Vérifier si l’exercice a été enregistré</button>';
     check.querySelector('#spx-training-reload').onclick=async()=>{
      try{await window.__TIM_BRIDGE.trainingProgress();const record=found(id);if(record){clearDraft(id);drawReview(record);}else check.querySelector('.spx-training-warning').textContent='Aucune validation enregistrée. Tu peux réessayer.';}
      catch(e){check.querySelector('.spx-training-warning').textContent='Impossible de vérifier la sauvegarde pour le moment.';}
     };
    }
   };
  };
 }
 function drawReview(record){
  currentId=record.id;
  const task=ENGINE.buildSpanishTasks(record.id,COURSE());
  if(!task||!Array.isArray(record.items)){drawList();return;}
  slot.innerHTML='<button class="spx-training-back" type="button" id="spx-training-return">← Liste des exercices</button>'+
   '<h3>Exercice terminé · '+(task.mode==='Q'?'QCM ':'Écriture ')+task.series+'</h3>'+
   '<p class="spx-training-score">Résultat enregistré : '+record.score+' / 10 · 0 XP</p>'+
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
 const update=()=>{if(!currentId)drawList();};
 document.addEventListener('tim-spanish-training-progress',update,{once:true});
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
     (attempts.length?attempts.map(a=>'<details class="spx-parent-result"><summary>'+(a.mode==='Q'?'QCM ':'Écriture ')+a.series+' — '+a.score+'/10</summary>'+
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
