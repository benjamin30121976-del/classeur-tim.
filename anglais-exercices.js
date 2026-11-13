/* Anglais — moteur d’exercices BIS. Les questions viennent exclusivement
   du serveur /api/tim. Les corrections ne sont affichées qu’après confirmation
   de la validation et récupération de la copie enregistrée.
   Même disposition et classes que l’Espagnol, une question à la fois. */
(function(){
'use strict';
const RE=/^ENQ_L0[1-7]_0[1-3]$/;
const E=(tag,cls,txt)=>{
 const a=document.createElement(tag);if(cls)a.className=cls;
 if(txt!==undefined)a.textContent=String(txt);return a;
};
const button=(txt,click,cls='')=>{
 const b=E('button',cls,txt);b.type='button';b.onclick=click;return b;
};
const bridge=()=>window.__TIM_BRIDGE;
const userIsTim=()=>!window.__TIM_PARENT&&!window.__TIM_GUEST;
const family=()=>!window.__TIM_GUEST;
const st={
 primary:'background:#28458e;color:#fff;border:1px solid #28458e;border-radius:11px;min-height:43px;padding:10px 14px;font-size:15px;font-weight:800;cursor:pointer',
 outline:'background:#edf3fb;color:#274675;border:1px solid #bdcfe6;border-radius:11px;min-height:43px;padding:10px 14px;font-size:15px;font-weight:800;cursor:pointer',
 warning:'border-left:4px solid #b79d5c;background:#fff8e8;color:#594a30;padding:10px 14px;border-radius:7px;font-size:15px;line-height:1.5',
 line:'margin:10px 0;font-size:16px;line-height:1.6;color:#243a53',
 group:'border:1px solid #d5deea;background:#fff;border-radius:12px;margin:10px 0;padding:12px 14px;color:#273e5d'
};
function setStatus(slot,msg){
 slot.replaceChildren(E('p','',msg));
}
function showCorrection(slot,report){
 slot.replaceChildren();
 if(!report||!Array.isArray(report.items)||report.items.length!==10){
  setStatus(slot,'La copie corrigée est momentanément indisponible. Aucune nouvelle tentative ne sera lancée.');return;
 }
 const parentPractice=report.practice===true;
 const heading=E('section','tim-es-training-result');
 heading.style.cssText='padding:15px;border-radius:12px;border:1px solid #b8cbe0;background:#f6f9fe;margin:12px 0';
 heading.append(E('h3','', (parentPractice?'Simulation Parent — ':'Résultat de Tim — ')+report.score+' / 10'));
 heading.append(E('p','',parentPractice?'Mode essai Parent : 0 XP, aucune tentative ni note enregistrée.':Number(report.xp||0)+' XP · Validation unique · Correction conservée'));
 const count=report.items.filter(i=>!i.correct).length;
 heading.append(E('p','',count?count+' erreur(s) : pour chacune, compare ta réponse, la réponse attendue et le raisonnement expliqué ci-dessous.':'Toutes les réponses sont correctes.'));
 slot.append(heading);
 report.items.forEach((item,i)=>{
  const box=E('section','tim-es-training-result-item');
  box.style.cssText=st.group+';border-left:4px solid '+(item.correct?'#397b56':'#bb664e');
  box.append(E('h4','', 'Question '+(i+1)+' — '+(item.correct?'Réussie':'À revoir')));
  box.append(E('p','',item.prompt));
  box.append(E('p','', (parentPractice?'Votre réponse : ':'Réponse de Tim : ')+item.response));
  box.append(E('p','', 'Bonne réponse : '+item.expected));
  box.append(E('p','', 'Pourquoi : '+(item.explanation||item.feedback||'Relire la leçon.')));
  slot.append(box);
 });
 slot.append(E('p','',parentPractice?'Vous pouvez recommencer cet essai sans toucher aux résultats de Tim.':'L’exercice n’est plus rejouable. Revois la méthode avant la prochaine activité.'));
 const lessonId=/^EN_BIS0[1-7]$/.test(String(report.lessonId||''))?report.lessonId:
  /^ENQ_L0[1-7]_0[1-3]$/.test(String(report.id||''))?'EN_BIS'+String(report.id).slice(5,7):null;
 const reviewTitles={EN_BIS01:'The Sounds of Music : genres et chronologie',EN_BIS02:'Le suffixe -ness',EN_BIS03:'Vacances et prétérit simple',EN_BIS04:'Personnalité et adverbes',EN_BIS05:'SO, NEITHER et BUT',EN_BIS06:'Se présenter en anglais',EN_BIS07:'Prétérit simple et prétérit BE-ING'};
 if(lessonId){
  if(count)slot.append(E('p','','Partie conseillée à revoir : '+(reviewTitles[lessonId]||'la règle et les exemples')+'.'));
  const reviser=button('Revoir la leçon BIS pour comprendre les erreurs',()=>{
   window.TIM_PEDAGOGY_NAVIGATE?.('Anglais',lessonId);
  },'spx-quick-link');
  reviser.style.cssText='display:block;width:100%;min-height:47px;margin:12px 0;padding:10px;font-weight:800';
  slot.append(reviser);
 }
}
async function loadSaved(slot,id){
 try{
  const r=await bridge()?.englishTrainingProgress(id);
  if(r?.attempt)showCorrection(slot,r.attempt);
  else setStatus(slot,'La tentative est déjà enregistrée, mais sa copie est indisponible pour le moment.');
 }catch(error){
  setStatus(slot,'Impossible de consulter la copie maintenant. '+(error.message||''));
 }
}
async function mount(id,where){
 if(!RE.test(String(id||'')))throw Error('Identifiant d’exercice de anglais invalide');
 where.replaceChildren();
 if(!family()){
  setStatus(where,'Les questionnaires et résultats personnels sont réservés aux comptes Tim et Parent.');
  return;
 }
 if(!bridge()?.englishTrainingTask){
  setStatus(where,'La connexion au service sécurisé de anglais n’est pas disponible. Aucun résultat ne peut être enregistré.');
  return;
 }
 setStatus(where,'Chargement des dix questions…');
 let result;
 try{result=await bridge().englishTrainingTask(id);}
 catch(err){setStatus(where,'Impossible de charger les questions. Aucune tentative n’est consommée. '+(err.message||''));return;}
 const task=result?.task;
 if(!task||task.questions?.length!==10){setStatus(where,'Questionnaire incomplet : aucune validation possible.');return;}
 if(result.completed&&!window.__TIM_PARENT){await loadSaved(where,id);return;}
 const isParentPractice=Boolean(window.__TIM_PARENT&&!window.__TIM_GUEST);
 if(!userIsTim()&&!isParentPractice){
  setStatus(where,'Ce questionnaire est réservé aux comptes Tim et Parent.');
  return;
 }
 // Animation uniquement avant une nouvelle tentative, après vérification du serveur.
 try{if(userIsTim())await window.TIM_ANIMATIONS?.playOpening?.();}
 catch(error){console.warn('Animation anglais ignorée',error);}
 const answers=Array(10).fill(null);
 let page=0,pending=false,refreshLast=()=>{};
 const head=E('section','tim-es-training-form');
 const details=E('div','');
 where.replaceChildren(head,details);
 head.append(E('h3','',task.title));
 head.append(E('p','',isParentPractice?'Mode essai Parent · 10 questions · aucun XP, aucune tentative ni note enregistrée pour Tim.':'10 questions · une seule tentative pour Tim · note et corrections immédiates après validation.'));
 if(isParentPractice&&result.completed){
  const completed=E('div','pc-parent-saved');
  completed.style.cssText='border:1px solid #a7c0d9;background:#f0f6fb;padding:11px;margin:12px 0;border-radius:10px';
  completed.append(E('p','','Tim a déjà validé cet exercice. Vous pouvez consulter sa copie et réaliser votre propre essai sans modifier ses résultats.'));
  const savedSlot=E('div','pc-parent-saved-slot');
  completed.append(button('Voir la copie et les corrections de Tim',()=>loadSaved(savedSlot,id),'spx-quick-link tim-es-quick-link'),savedSlot);
  head.append(completed);
 }
 const feedback=E('p','');
 feedback.style.cssText='font-size:14px;color:#47617e;margin:8px 0';
 head.append(feedback);
 const draw=()=>{
  details.replaceChildren();
  const q=task.questions[page];
  feedback.textContent='Question '+(page+1)+' sur 10 · '+answers.filter(v=>v!==null).length+' réponse(s) complétée(s)';
  const block=E('section','tim-es-question-page');
  block.style.cssText='background:#fff;color:#223a5c;padding:15px;border-radius:12px;border:1px solid #d4dfeb';
  block.append(E('h4','', 'Question '+(page+1)));
  const stem=E('p','',q.prompt);stem.style.cssText='font-size:18px;line-height:1.55;font-weight:800;color:#1b3b61';
  block.append(stem);
  if(q.kind==='qcm'){
   for(let index=0;index<4;index++){
    const row=E('label','pc-answer-choice');
    row.style.cssText='display:flex;align-items:flex-start;gap:12px;padding:11px 12px;margin:9px 0;border:1px solid #cbd8e6;border-radius:10px;cursor:pointer;background:'+(answers[page]===index?'#e3effb':'#fff');
    const radio=E('input');radio.type='radio';radio.name='phys-'+id+'-'+page;radio.value=String(index);radio.checked=answers[page]===index;radio.style.cssText='margin:5px 0 0;flex:0 0 auto;width:19px;height:19px;accent-color:#28458e';
    radio.onchange=()=>{answers[page]=index;draw();};
    row.append(radio,E('span','',q.choices[index]));block.append(row);
   }
  }else{
   const input=E('input');input.type='text';input.autocomplete='off';input.spellcheck=false;input.maxLength=80;
   input.placeholder='Écris ta réponse courte';input.value=answers[page]??'';
   input.setAttribute('aria-label','Réponse à la question '+(page+1));
   input.style.cssText='display:block;box-sizing:border-box;width:100%;min-height:47px;font-size:17px;border:1px solid #9db8d0;border-radius:9px;padding:10px;color:#263b56;background:#fff';
   input.oninput=()=>{answers[page]=input.value.trim()?input.value:null;feedback.textContent='Question '+(page+1)+' sur 10 · '+answers.filter(v=>v!==null).length+' réponse(s) complétée(s)';if(page===9)refreshLast();};
   block.append(input);
  }
  details.append(block);
  const nav=E('div','tim-es-question-navigation');nav.style.cssText='display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;margin:17px 0';
  if(page>0)nav.append(button('← Précédente',()=>{page--;draw();},'pc-prev'));
  if(page<9)nav.append(button('Suivante →',()=>{page++;draw();},'pc-next'));
  if(page===9){
   const filled=()=>answers.every((v,i)=>task.questions[i].kind==='text'?(typeof v==='string'&&v.trim().length>0):Number.isInteger(v));
   const info=E('p','', 'Il manque '+answers.filter(v=>v===null).length+' réponse(s). Tu peux revenir aux questions précédentes.');
   if(filled())info.textContent='Les 10 réponses sont complètes. Vérifie-les avant la validation définitive.';
   info.style.cssText=st.warning;nav.append(info);
   const confirm=E('label','pc-confirm');
   const box=E('input');box.type='checkbox';box.style.cssText='width:21px;height:21px;margin-right:8px;vertical-align:middle';
   confirm.append(box,E('span','',isParentPractice?'Je confirme : corriger cet essai sans rien enregistrer pour Tim.':'Je confirme : c’est ma seule tentative pour cet exercice.'));
   confirm.style.cssText='display:block;width:100%;font-weight:700;color:#273f5a;padding:8px 0';
   nav.append(confirm);
   const submit=button(isParentPractice?'Corriger mon essai (0 XP, sans enregistrement)':'Valider définitivement les 10 réponses',async()=>{
    if(pending||!filled()||!box.checked)return;
    pending=true;submit.disabled=true;setStatus(details,isParentPractice?'Correction de votre simulation, sans enregistrement…':'Enregistrement de la copie et de la correction…');
    try{
     const graded=isParentPractice
      ?await bridge().englishTrainingPreviewSubmit(id,answers,task.bankVersion)
      :await bridge().englishTrainingSubmit(id,answers,task.bankVersion);
     showCorrection(details,graded);
     if(!isParentPractice){
      document.dispatchEvent(new Event('tim-physics-training-saved'));
      try{await window.TIM_ANIMATIONS?.playResult?.({kind:'training'},graded);}
      catch(error){console.warn('Animation XP anglais ignorée',error);}
     }
    }catch(error){
     if(isParentPractice){
      setStatus(details,'Essai Parent non enregistré : '+(error.message||'Service momentanément indisponible'));
     }else{
      // Une réponse HTTP perdue ne doit jamais provoquer une deuxième tentative de Tim.
      await loadSaved(details,id);
      const note=E('p','', 'Si aucune copie n’apparaît, la validation n’a pas pu être confirmée : '+(error.message||'Erreur réseau'));
      note.style.cssText=st.warning;details.prepend(note);
     }
    }
   });submit.style.cssText=st.primary;submit.disabled=!filled;
   refreshLast=()=>{
    const missing=answers.filter(v=>v===null).length;
    info.textContent=missing?('Il manque '+missing+' réponse(s). Tu peux revenir aux questions précédentes.'):'Les 10 réponses sont complètes. Vérifie-les avant la validation définitive.';
    submit.disabled=pending||!filled()||!box.checked;
   };
   box.onchange=refreshLast;
   nav.append(submit);refreshLast();
  }
  details.append(nav);
 };
 draw();
}
async function renderProgress(where){
 where.replaceChildren();
 if(!family()){setStatus(where,'Mode Visiteur : notes réservées aux comptes Tim et Parent.');return;}
 if(!bridge()?.englishTrainingProgress){setStatus(where,'Le suivi sécurisé est indisponible.');return;}
 setStatus(where,'Chargement des notes et des corrections…');
 try{
  const r=await bridge().englishTrainingProgress();
  const rows=r?.attempts||[];
  where.replaceChildren(E('p','',rows.length+' / 11 exercices BIS validés. Une seule tentative par exercice.'));
  if(!rows.length){where.append(E('p','','Aucune note de anglais enregistrée pour le moment.'));return;}
  for(const item of rows){
   const block=E('details','pc-progress-item');block.style.cssText=st.group;
   block.append(E('summary','',item.title+' · '+item.score+'/10 · '+(item.xp||0)+' XP'));
   const pane=E('div');
   pane.style.cssText='margin:8px 0;padding:4px';
   const date=item.submittedAt?new Date(item.submittedAt):null;
   const iso=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString('fr-FR'):'date non renseignée';
   pane.append(E('p','', 'Leçon '+item.lessonId?.slice(-2)+' · '+iso));
   const mistakes=Object.values(item.errorCounts||{}).reduce((a,b)=>a+Number(b||0),0);
   pane.append(E('p','',mistakes?mistakes+' erreur(s) : voir la correction complète ci-dessous.':'10 réponses correctes.'));
   const view=button('Voir la copie et les corrections',()=>loadSaved(pane,item.id));
   view.style.cssText=st.outline;pane.append(view);block.append(pane);where.append(block);
  }
 }catch(error){setStatus(where,'Impossible de charger les notes : '+(error.message||''));}
}
window.TIM_ENGLISH_TRAINING={mount,renderProgress};
})();
