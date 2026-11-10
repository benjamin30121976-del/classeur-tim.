/* Espagnol 3e : une leçon, trois exercices, correction expliquée.
   Les documents ENT restent réservés aux archives Parent.
   Les réponses attendues ne sont jamais envoyées avant la validation serveur. */
(function(){
'use strict';
const LESSONS=[
 ['10099~6400501','16 septembre','Se présenter'],
 ['10099~6400551','17 septembre','Parler de son sport préféré'],
 ['10099~6400534','22 septembre','Écrire à un correspondant'],
 ['10099~6400502','23 septembre','L’animal totem et la lettre'],
 ['10099~6400485','24 septembre','Horoscope et caractère'],
 ['10099~6400552','1er octobre','Accords et conjugaison'],
 ['10099~6400535','6 octobre','Horoscope et articles'],
 ['10099~6400486','8 octobre','Comprendre une conversation'],
 ['10099~6400505','14 octobre','Articles et goûts'],
 ['10099~6400553','15 octobre','Questions et possessifs'],
 ['10099~6400536','3 novembre','Tutoiement, politesse et contrôle'],
 ['10099~6400506','4 novembre','Réviser la conjugaison'],
 ['10099~6400487','5 novembre','Dix verbes au présent']
];
const titles=['Je comprends les mots','Je complète les phrases','J’écris seul'];
const ST={
 card:'border:1px solid #c6d1e8;border-radius:14px;margin:12px 0;background:#f7f9ff;color:#273448;overflow:hidden',
 summary:'display:block;cursor:pointer;font-weight:850;line-height:1.55;padding:17px 14px;color:#263a83;font-size:17px;overflow-wrap:anywhere',
 button:'min-height:43px;display:inline-flex;align-items:center;justify-content:center;white-space:normal;text-align:left;background:#28458e!important;border:1px solid #28458e!important;color:#fff!important;font-weight:800;padding:9px 13px;border-radius:10px;cursor:pointer;font-size:15px;line-height:1.4;opacity:1!important;text-shadow:none!important',
 muted:'font-size:14px;color:#526077;line-height:1.5',
 panel:'background:#fff;border:1px solid #d8dff0;border-radius:12px;padding:12px;margin:11px 0;color:#25334e',
 title:'font-size:19px;font-weight:850;color:#233d8e;margin:16px 0 10px',
 h:'color:#273b83;font-size:16px;margin:13px 0 8px'
};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const css=(node,style)=>{node.style.cssText=style;return node;};
const say=(text,language='es',label)=>{
 const french=language==='fr';
 const button=css(el('button',label||(french?'▶ Écouter en français':'▶ Écouter en espagnol')),ST.button+';min-height:36px;padding:6px 11px;font-size:13px');
 button.type='button';button.setAttribute(french?'data-say-fr':'data-say-es',text);
 button.setAttribute('aria-label',(french?'Écouter en français : ':'Écouter en espagnol : ')+text);return button;
};
const button=(label)=>{const b=css(el('button',label),ST.button);b.type='button';return b;};
const p=(parent,text,style)=>{const n=el('p',text);n.style.cssText=style||ST.muted;parent.append(n);return n;};
const isParent=()=>Boolean(window.__TIM_PARENT)&&!window.__TIM_GUEST;
const isTim=()=>!window.__TIM_PARENT&&!window.__TIM_GUEST;
const taskId=(lesson,series)=>'ESE_L'+String(lesson).padStart(2,'0')+'_0'+series;
function inlineLesson(holder,entId,renderL01){
 holder.replaceChildren();
 const tmp=el('div');
 const result=entId==='10099~6400501'?renderL01(tmp):window.TIM_SPANISH_ENT_BIS?.render(tmp,entId);
 if(result===false || !tmp.firstElementChild){p(holder,'Le cours ne peut pas être affiché pour le moment.');return;}
 const bis=tmp.firstElementChild;
 bis.open=true;
 const summary=bis.querySelector(':scope > summary');
 if(summary)summary.style.cssText='display:none!important';
 if(entId!=='10099~6400501'){
  const end=bis.querySelector(':scope > div > p:last-child');
  if(end?.textContent?.includes('Leçon BIS rédigée'))end.remove();
  const title=bis.querySelector('h4');
  if(title?.textContent==='1. Comprendre le cours du professeur')title.textContent='1. Comprendre la leçon';
 }
 bis.style.margin='0';bis.style.border='none';bis.style.background='#f7f9ff';
 holder.append(bis);
}
function spellingWarning(parent){
 const note=css(el('aside'),'background:#fff4df;color:#613f17;border:1px solid #d8aa53;border-left:5px solid #a76a1b;border-radius:11px;padding:12px 14px;margin:13px 0;line-height:1.55;font-size:15px');
 note.setAttribute('role','note');
 note.append(css(el('strong','Attention à l’orthographe et à la ponctuation espagnoles'),'display:block;margin-bottom:5px;font-weight:850'));
 note.append(el('p','Attention : relis tes réponses avant de valider ! Vérifie les accents (á, é, í, ó, ú), la lettre ñ, la conjugaison et l’ordre des mots. Pour une question en espagnol, place « ¿ » au début et « ? » à la fin. Les majuscules ne sont pas pénalisées.'));
 note.lastElementChild.style.margin='0';
 parent.append(note);
}
function drawCorrection(slot,report,lessonNumber,ensureLesson){
 slot.replaceChildren();
 const score=Number(report.score),items=Array.isArray(report.items)?report.items:[];
 const wrapper=css(el('section',undefined,'tim-es-training-result'),ST.panel);
 const title=css(el('h4','Résultat de l’exercice — '+String(score).replace('.',',')+' / 10 points'),ST.title);
 wrapper.append(title);
 p(wrapper,'Ce résultat mesure la compréhension de la leçon. Ce n’est pas une note scolaire. Aucune récompense XP n’est associée à cet exercice.');
 if(Number.isInteger(report.translationHelpCount))p(wrapper,'Traduction française consultée pour '+report.translationHelpCount+' question(s) sur 10. Aucune pénalité.','font-weight:850;color:#263d89;font-size:15px');
 const incorrect=items.filter(x=>x.correct===false);
 const partial=items.filter(x=>x.points===0.5);
 const full=items.filter(x=>x.correct===true);
 const summary=el('p',incorrect.length?
   full.length+' réponse(s) correctes, '+partial.length+' partiellement correctes et '+(incorrect.length-partial.length)+' incorrectes. Les corrections sont expliquées ci-dessous.':
   'Toutes les réponses sont correctes.');
 summary.style.cssText='font-weight:850;color:#263a83;font-size:16px;line-height:1.5';
 wrapper.append(summary);
 items.forEach((item,i)=>{
  const points=Number.isFinite(item.points)?item.points:(item.correct?1:0);
  const card=css(el('section'),ST.panel+';border-left:4px solid '+(points===1?'#26836a':points===0.5?'#b98a31':'#bd6244')+';margin:11px 0');
  const heading=el('strong',(i+1)+'. '+item.prompt);
  heading.style.cssText='display:block;font-size:15px;color:#25344e;line-height:1.5;margin-bottom:8px';
  const status=el('strong',String(points).replace('.',',')+'/1 — '+(points===1?'Réponse correcte':points===0.5?'Réponse partiellement correcte':'Réponse incorrecte'));
  status.style.cssText='color:'+(points===1?'#246d54':points===0.5?'#845b1b':'#a5472d')+';display:block;margin:8px 0';
  card.append(heading,status);
  p(card,'Ta réponse : '+String(item.response??'Non renseignée'),'font-size:15px;color:#333e58;margin:6px 0');
  if(!item.correct)p(card,'Réponse attendue : '+item.expected,'font-size:15px;font-weight:850;color:#263a83;margin:6px 0');
  if(item.feedback)p(card,item.feedback,'font-size:14px;font-weight:700;color:#364f72;line-height:1.6;margin:9px 0');
  p(card,item.explanation||'Relis la partie correspondante de la leçon.','font-size:14px;color:#495975;line-height:1.6;margin:9px 0');
  if(typeof item.translationUsed==='boolean')p(card,item.translationUsed?'Consigne traduite en français pendant l’exercice.':'Consigne lue sans traduction française.','font-size:13px;color:#53647e;margin:8px 0');
  wrapper.append(card);
 });
 const back=button('Revoir la leçon pour comprendre mes erreurs');
 back.addEventListener('click',()=>{
  ensureLesson();wrapper.scrollIntoView?.({behavior:'smooth',block:'start'});
 });
 wrapper.append(back);
 slot.append(wrapper);
}
function renderQuestions(slot,task,lessonNumber,after,ensureLesson){
 slot.replaceChildren();
 const wrapper=css(el('section'),ST.panel);
 const head=css(el('h4',task.title),ST.title);wrapper.append(head);
 p(wrapper,'Les consignes sont en espagnol. Tu peux écouter chaque consigne ou afficher sa traduction française. Cette aide ne retire aucun point. Une seule validation par exercice.');
 spellingWarning(wrapper);
 if(!isTim()){
  p(wrapper,'Seul Tim peut répondre. Le Parent peut relire les questions, les réponses et les corrections.','font-weight:750;color:#6b4c2a');
 }
 const readers=[],translationsUsed=Array(10).fill(false);
 for(const [i,q] of task.questions.entries()){
  const field=css(el('fieldset'),ST.panel+';padding:13px 12px;margin:14px 0');
  const legend=css(el('legend','Question '+(i+1)+' / 10'),'font-weight:900;color:#263d8c;padding:0 6px');
  field.append(legend);
  const instruction=el('p',q.instructionEs||'Consigne indisponible');
  instruction.setAttribute('lang','es');
  instruction.style.cssText='line-height:1.55;font-size:16px;font-weight:850;color:#27334d;margin:8px 0 12px';
  field.append(instruction);
  const controls=css(el('div'),'display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:6px 0 13px');
  controls.append(say(q.speechEs||q.instructionEs,'es','▶ Écouter la consigne espagnole'));
  const translate=button('Traduire en français');
  translate.style.cssText=ST.button+';background:#e7edfa!important;color:#243b79!important;border:1px solid #9cadd1!important;font-size:13px;min-height:36px;padding:7px 11px';
  const french=css(el('div'),'font-size:14px;line-height:1.55;color:#27384f;background:#edf4ff;padding:10px;border-radius:9px;margin:7px 0');
  const frenchText=el('p',q.instructionFr||'Traduction indisponible');
  frenchText.setAttribute('lang','fr');frenchText.style.cssText='margin:0 0 9px;line-height:1.55';
  french.append(frenchText,say(q.speechFr||q.instructionFr,'fr','▶ Écouter la traduction française'));
  french.hidden=true;french.style.display='none';
  translate.setAttribute('aria-expanded','false');
  translate.addEventListener('click',()=>{
   french.hidden=!french.hidden;
   french.style.display=french.hidden?'none':'block';
   translate.setAttribute('aria-expanded',String(!french.hidden));
   translate.textContent=french.hidden?'Traduire en français':'Masquer la traduction';
   if(!french.hidden)translationsUsed[i]=true;
  });
  controls.append(translate);field.append(controls,french);
  if(q.sourceEs){
   const expression=css(el('p'),'font-size:17px;font-weight:800;line-height:1.55;color:#273b85;margin:9px 0 6px');
   expression.textContent='Expresión: '+q.sourceEs;
   expression.setAttribute('lang','es');
   field.append(expression,say(q.sourceEs,'es','▶ Écouter l’expression espagnole'));
  }
  if(q.sourceFr){
   const source=css(el('p'),q.kind==='gap'?'Sens recherché en français : '+q.sourceFr:'Expression à traduire en espagnol : '+q.sourceFr);
   source.style.cssText='font-size:15px;line-height:1.55;color:#283a53;background:#eff4ff;padding:10px;border-radius:9px;margin:10px 0';
   source.setAttribute('lang','fr');
   field.append(source,say(q.sourceFr,'fr','▶ Écouter la phrase française'));
  }
  if(q.stem){
   const phrase=css(el('p',q.stem),'font-size:18px;font-weight:800;line-height:1.5;white-space:pre-wrap;color:#253b85;margin:13px 0');
   phrase.setAttribute('lang','es');field.append(phrase);
  }
  if(q.kind==='qcm'&&Array.isArray(q.choices)&&q.choices.length===4){
   const radios=[];
   q.choices.forEach((choice,k)=>{
    const label=css(el('label'),'display:flex;gap:11px;align-items:flex-start;cursor:pointer;background:#f4f7fc;border:1px solid #d9e1ef;border-radius:10px;margin:7px 0;padding:11px;color:#25354b;font-size:15px;line-height:1.55');
    const radio=el('input');radio.type='radio';radio.name=task.id+'_q'+i;radio.value=String(k);radio.disabled=!isTim();
    radio.style.cssText='flex:0 0 20px;display:block!important;position:static!important;opacity:1!important;visibility:visible!important;width:20px;height:20px;margin:2px 0;accent-color:#28458e;appearance:auto!important;pointer-events:auto!important';
    label.append(radio,el('span',choice));field.append(label);radios.push(radio);
   });
   readers.push(()=>radios.findIndex(r=>r.checked));
  }else if(q.kind==='gap'||q.kind==='write'){
   const label=css(el('label',q.kind==='gap'?'Écris le mot manquant :':'Écris ta réponse en espagnol :'),'font-weight:750;color:#354766;display:block;margin:10px 0 8px;font-size:14px');
   const answer=el('input');answer.type='text';answer.maxLength=200;
   answer.disabled=!isTim();answer.autocomplete='off';answer.setAttribute('autocapitalize','none');
   answer.spellcheck=false;answer.placeholder=q.kind==='gap'?'Mot à compléter':'Réponse sans propositions';
   answer.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;box-sizing:border-box;width:100%;min-height:45px;padding:11px 12px;background:white!important;color:#20344c!important;border:1px solid #8498b8!important;border-radius:10px;font-size:16px;line-height:1.45';
   field.append(label,answer);readers.push(()=>answer.value.trim());
  }else{
   p(field,'Cette question est momentanément indisponible.','font-weight:750;color:#a94334');
   readers.push(()=>null);
  }
  wrapper.append(field);
 }
 if(isTim()){
  p(wrapper,'Réponds aux 10 questions avant de valider. La correction apparaît immédiatement après l’envoi ; tu pourras la relire, mais pas refaire l’exercice.','font-weight:750;color:#384a65');
  spellingWarning(wrapper);
  const confirmButton=button('Valider mes 10 réponses — une seule fois');
  const feedback=p(wrapper,'','font-weight:750;color:#9a4b36;margin:12px 0');
  confirmButton.onclick=async()=>{
   const answers=readers.map(read=>read());
   if(answers.some(a=>a===null||a===-1||a==='')){feedback.textContent='Réponds aux dix questions avant de valider.';return;}
   if(!window.confirm('Avant de valider, as-tu vérifié les accents, la lettre ñ, la conjugaison et les signes « ¿ » et « ? » ?\\nUne fois validé, cet exercice ne pourra plus être recommencé.'))return;
   confirmButton.disabled=true;confirmButton.textContent='Enregistrement sécurisé…';feedback.textContent='';
   try{
    const report=await window.__TIM_BRIDGE.spanishEntTrainingSubmit(task.id,answers,translationsUsed);
    drawCorrection(slot,report,lessonNumber,ensureLesson);
    await after();
   }catch(e){
    const code=String(e?.code||e?.message||e);
    if(/already-exists/.test(code)){
     try{
      const saved=await window.__TIM_BRIDGE.spanishEntTrainingProgress(task.id);
      if(saved.attempt){drawCorrection(slot,saved.attempt,lessonNumber,ensureLesson);await after();return;}
     }catch(_){}
    }
    // Ne pas réessayer une soumission incertaine : une validation pourrait
    // être enregistrée même si le réseau a perdu sa réponse.
    try{
     const saved=await window.__TIM_BRIDGE.spanishEntTrainingProgress(task.id);
     if(saved.attempt){drawCorrection(slot,saved.attempt,lessonNumber,ensureLesson);await after();return;}
    }catch(_){}
    feedback.textContent='Validation non confirmée : '+(e?.message||'connexion indisponible')+'. Actualise le site pour vérifier le résultat avant toute nouvelle tentative.';
    confirmButton.textContent='Validation à vérifier';
   }
  };
  wrapper.append(confirmButton,feedback);
 }
 slot.append(wrapper);
}
function summaryOf(attempts,where){
 where.replaceChildren();
 const complete=attempts.length;
 const result=css(el('div'),ST.panel);
 const title=css(el('h3','Mes résultats' ),ST.title);result.append(title);
 p(result,complete+' / 39 exercices réalisés. Chaque exercice a 10 questions et ne peut être validé qu’une fois.','font-size:15px;color:#34445f;line-height:1.55');
 if(complete>=3){
  const good=attempts.reduce((s,a)=>s+(Number(a.score)||0),0);
  const total=attempts.reduce((s,a)=>s+(Number(a.total)||10),0);
  p(result,'Bilan après '+complete+' exercices : '+good+' réponses correctes sur '+total+'.','font-weight:850;font-size:16px;color:#263d89');
  const helped=attempts.filter(a=>Number.isInteger(a.translationHelpCount));
  if(helped.length)p(result,'Aide pour comprendre les consignes : '+helped.reduce((n,a)=>n+a.translationHelpCount,0)+' question(s) traduite(s) sur '+(helped.length*10)+' questions réalisées.','font-size:15px;color:#34445f;line-height:1.55');
  const weak=attempts.filter(a=>Number(a.score)<7);
  if(weak.length){
   const label=el('strong','À revoir en priorité :');
   result.append(label);
   const ul=el('ul');ul.style.cssText='padding-left:22px';
   weak.slice(0,5).forEach(a=>{
    const num=Number(/^ESE_L(\d\d)/.exec(a.id)?.[1]),item=LESSONS[num-1];
    if(item)ul.append(el('li','Leçon '+num+' — '+item[2]+' : '+a.score+'/10'));
   });result.append(ul);
  }else p(result,'Aucun exercice avec moins de 7 réponses correctes pour le moment.');
 }else{
  p(result,'Le bilan général apparaîtra après au moins 3 exercices. Pour l’instant, consulte les résultats individuellement.');
 }
 if(isParent())p(result,'Les réponses complètes et leurs explications sont consultables dans chaque exercice terminé.','font-weight:700;color:#41516b');
 where.append(result);
}
async function render(root,opts={},helpers={}){
 root.replaceChildren();
 const back=button('← Toutes les matières');
 if(typeof opts.back==='function'){back.onclick=opts.back;root.append(back);}
 const heading=el('h2','Espagnol — Mes leçons');heading.style.cssText='margin:18px 0 9px;color:inherit;font-size:24px';
 root.append(heading);
 p(root,'13 leçons, avec 3 exercices d’entraînement chacune. Lis, écoute, réponds puis consulte immédiatement tes corrections.','font-size:16px;color:inherit;line-height:1.6;margin:5px 0 16px');
 const resultSlot=el('div');root.append(resultSlot);
 const bridge=window.__TIM_BRIDGE||{};
 let attempts=[],loaded=false;
 const progressStatus=p(root,'Chargement du suivi des exercices…','font-size:13px;color:#96aad1');
 const refresh=async()=>{
  try{
   const saved=await bridge.spanishEntTrainingProgress();
   attempts=saved.attempts||[];loaded=true;
   progressStatus.textContent='Résultats synchronisés pour '+attempts.length+' exercice(s).';
   summaryOf(attempts,resultSlot);
   root.querySelectorAll('[data-es-training-id]').forEach(b=>{
    const done=attempts.find(a=>a.id===b.getAttribute('data-es-training-id'));
    b.textContent=done?'✓ '+b.getAttribute('data-es-title')+' — '+done.score+'/10 · Voir la correction':b.getAttribute('data-es-title')+' · À faire';
   });
  }catch(e){
   loaded=false;progressStatus.textContent='Résultats indisponibles : '+(e.message||e)+'. Les exercices ne pourront pas être validés tant que le suivi sécurisé est inaccessible.';
   summaryOf(attempts,resultSlot);
  }
 };
 LESSONS.forEach(([entId,date,name],li)=>{
  const index=li+1,card=css(el('details',undefined,'tim-es-lesson'),ST.card);
  const label=css(el('summary','Leçon '+index+' — '+name+' · '+date),ST.summary);
  card.append(label);
  const inner=css(el('div'),'padding:0 13px 14px');
  const learn=button('Lire et écouter la leçon');
  learn.style.marginBottom='8px';
  const lessonSlot=el('div');lessonSlot.hidden=true;let lessonReady=false;
  const openLesson=()=>{
   if(!lessonReady){inlineLesson(lessonSlot,entId,helpers.appendL01);lessonReady=true;}
   lessonSlot.hidden=false;learn.textContent='Masquer la leçon';
   lessonSlot.scrollIntoView?.({behavior:'smooth',block:'nearest'});
  };
  learn.onclick=()=>{
   if(lessonSlot.hidden)openLesson();
   else {lessonSlot.hidden=true;learn.textContent='Lire et écouter la leçon';}
  };
  inner.append(learn,lessonSlot);
  const trainer=css(el('h3','Mes 3 exercices'),ST.h);inner.append(trainer);
  p(inner,'Une seule validation par exercice. Le résultat et les explications apparaissent tout de suite.');
  const rows=el('div');rows.style.cssText='display:grid;grid-template-columns:minmax(0,1fr);gap:8px';
  const work=el('div');work.style.cssText='margin-top:13px';
  for(let i=1;i<=3;i++){
   const id=taskId(index,i);
   const b=button('Exercice '+i+' — '+titles[i-1]+' · À faire');
   b.style.cssText=ST.button+';width:100%;justify-content:flex-start';
   b.dataset.esTrainingId=id;
   b.dataset.esTitle='Exercice '+i+' — '+titles[i-1];
   b.onclick=async()=>{
    card.open=true;work.replaceChildren();
    const wait=p(work,'Ouverture de l’exercice…');
    if(!loaded){await refresh();if(!loaded){wait.textContent='Connexion au suivi impossible. Aucune validation ne peut être enregistrée pour le moment.';return;}}
    const previous=attempts.find(a=>a.id===id);
    try{
     if(previous){
      const saved=await bridge.spanishEntTrainingProgress(id);
      if(!saved.attempt){wait.textContent='Le résultat enregistré est momentanément inaccessible.';return;}
      drawCorrection(work,saved.attempt,index,openLesson);
      return;
     }
     const resp=await bridge.spanishEntTrainingTask(id);
     if(resp.completed){
      const saved=await bridge.spanishEntTrainingProgress(id);
      if(saved.attempt){drawCorrection(work,saved.attempt,index,openLesson);await refresh();}
      else wait.textContent='Cet exercice est déjà validé. Résultat à actualiser.';
      return;
     }
     renderQuestions(work,resp.task,index,refresh,openLesson);
    }catch(e){wait.textContent='Impossible d’ouvrir cet exercice : '+(e.message||'service indisponible');}
   };
   rows.append(b);
  }
  inner.append(rows,work);card.append(inner);root.append(card);
 });
 refresh();
}
window.TIM_SPANISH_SIMPLIFIED={render,lessons:LESSONS.map((x,i)=>({id:x[0],num:i+1,name:x[2]}))};
})();
