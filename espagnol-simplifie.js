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
 p(wrapper,'Ce résultat mesure la compréhension de la leçon. Ce n’est pas une note scolaire. XP gagnés : '+Number(report.xp||0).toLocaleString('fr-FR')+' XP.','font-size:15px;font-weight:750;color:#263d89;line-height:1.6');
 if(Number.isInteger(report.translationHelpCount))p(wrapper,'Traduction française consultée pour '+report.translationHelpCount+' question(s) sur 10. Aucune pénalité.','font-weight:850;color:#263d89;font-size:15px');
 const points=item=>Number.isFinite(item.points)?item.points:(item.correct?1:0);
 const errors=items.map((item,i)=>({item,i})).filter(x=>points(x.item)<1);
 const perfect=score===10&&items.length===10&&errors.length===0;
 const summary=el('p',perfect?'10/10 : toutes les réponses sont correctes. Aucune correction nécessaire.':
  (10-errors.length)+' réponse(s) correctes et '+errors.length+' à revoir. Les corrections sont expliquées ci-dessous.');
 summary.style.cssText='font-weight:850;color:#263a83;font-size:16px;line-height:1.5';
 wrapper.append(summary);
 // L'exercice reste consultable à tout moment sans fournir d'explication superflue.
 if(items.length){
  const review=el('details');review.className='tim-es-exercise-review';
  const heading=el('summary','Revoir mon exercice — questions et réponses');heading.style.cssText='cursor:pointer;font-weight:800;color:#263d89;padding:12px 0';
  review.append(heading);
  items.forEach((item,i)=>{
   const card=css(el('section'),ST.panel+';margin:8px 0;padding:10px');
   p(card,'Question '+(i+1)+' : '+String(item.prompt||''),'font-weight:800;color:#263a83;margin:5px 0');
   p(card,'Ma réponse : '+String(item.response??'Non renseignée'),'font-size:15px;color:#333e58;margin:5px 0');
   review.append(card);
  });
  wrapper.append(review);
 }
 if(!perfect){
  const weak=Object.entries(report.errorCounts||{}).filter(([name,count])=>name!=='réussi'&&Number(count)>0);
  if(weak.length)p(wrapper,'À retravailler : '+weak.map(([name,count])=>name+' ('+count+' question'+(count>1?'s':'')+')').join(' ; ')+'.','font-size:15px;font-weight:800;color:#314975;line-height:1.55');
  for(const {item,i} of errors){
   const n=points(item);
   const card=css(el('section'),ST.panel+';border-left:4px solid '+(n===0.5?'#b98a31':'#bd6244')+';margin:11px 0');
   const heading=el('strong',(i+1)+'. '+item.prompt);
   heading.style.cssText='display:block;font-size:15px;color:#25344e;line-height:1.5;margin-bottom:8px';
   const status=el('strong',String(n).replace('.',',')+'/1 — '+(n===0.5?'Réponse partiellement correcte':'Réponse incorrecte'));
   status.style.cssText='color:'+(n===0.5?'#845b1b':'#a5472d')+';display:block;margin:8px 0';
   card.append(heading,status);
   p(card,'Ta réponse : '+String(item.response??'Non renseignée'),'font-size:15px;color:#333e58;margin:6px 0');
   p(card,'Réponse attendue : '+item.expected,'font-size:15px;font-weight:850;color:#263a83;margin:6px 0');
   if(item.category)p(card,'Type d’erreur : '+item.category,'font-size:13px;color:#8c4c28;font-weight:800;margin:8px 0');
   if(item.feedback)p(card,item.feedback,'font-size:14px;font-weight:700;color:#364f72;line-height:1.6;margin:9px 0');
   if(item.explanation){
    const rule=el('strong','La règle à retenir :');
    rule.style.cssText='display:block;color:#263d7a;margin-top:8px;font-size:14px';
    card.append(rule);
    p(card,item.explanation,'font-size:14px;color:#495975;line-height:1.6;margin:5px 0 9px');
   }
   wrapper.append(card);
  }
  const back=button('Revoir la leçon pour comprendre mes erreurs');
  back.addEventListener('click',()=>ensureLesson());
  wrapper.append(back);
 }
 slot.append(wrapper);
}
function renderQuestions(slot,task,lessonNumber,after,ensureLesson){
 slot.replaceChildren();
 const wrapper=css(el('section'),ST.panel);
 const head=css(el('h4',task.title),ST.title);wrapper.append(head);
 p(wrapper,'Les consignes sont en espagnol. Tu peux écouter chaque consigne ou afficher sa traduction française. Une seule validation par exercice. De 7 à 10/10 : +1 XP ; de 5 à moins de 7/10 : +0,5 XP ; moins de 5/10 : 0 XP.');
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
 const totalXp=attempts.reduce((n,a)=>n+Number(a.xp||0),0);
 p(result,'XP gagnés avec les leçons d’espagnol : '+totalXp.toLocaleString('fr-FR')+' XP.','font-size:15px;font-weight:850;color:#263d89;line-height:1.55');
 if(complete>=3){
  const good=attempts.reduce((s,a)=>s+(Number(a.score)||0),0);
  const total=attempts.reduce((s,a)=>s+(Number(a.total)||10),0);
  p(result,'Bilan après '+complete+' exercices : '+good.toLocaleString('fr-FR')+' points sur '+total+'.','font-weight:850;font-size:16px;color:#263d89');
  const difficulties=new Map();
  for(const attempt of attempts)for(const [name,count] of Object.entries(attempt.errorCounts||{})){
   if(name!=='réussi'&&Number.isFinite(Number(count))&&Number(count)>0)
    difficulties.set(name,(difficulties.get(name)||0)+Number(count));
  }
  if(difficulties.size){
   const ordered=[...difficulties.entries()].sort((a,b)=>b[1]-a[1]);
   p(result,'Difficultés observées : '+ordered.map(([name,count])=>name+' ('+count+')').join(' ; ')+'.','font-weight:750;font-size:14px;color:#435776');
  }
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
 p(root,'Choisis une leçon : elle s’ouvre et tu peux la lire directement.','font-size:16px;color:inherit;line-height:1.6;margin:5px 0 16px');
 const results=el('details');results.className='tim-es-results';
 const resultsHeading=el('summary','Mes résultats et corrections');results.append(resultsHeading);
 const resultSlot=el('div');results.append(resultSlot);
 const bridge=window.__TIM_BRIDGE||{};
 let attempts=[],loaded=false;
 const progressStatus=p(results,'Chargement du suivi des exercices…','font-size:13px;color:#536987');
 const refresh=async()=>{
  if(window.__TIM_GUEST){
   loaded=false;
   progressStatus.textContent='Mode Visiteur : les résultats personnels sont réservés aux comptes Tim et Parent.';
   resultSlot.replaceChildren();
   return;
  }
  try{
   const saved=await bridge.spanishEntTrainingProgress();
   attempts=saved.attempts||[];loaded=true;
   progressStatus.textContent='Résultats synchronisés pour '+attempts.length+' exercice(s).';
   summaryOf(attempts,resultSlot);
   root.querySelectorAll('[data-es-training-id]').forEach(b=>{
    const done=attempts.find(a=>a.id===b.getAttribute('data-es-training-id'));
    b.textContent=done?'✓ '+b.getAttribute('data-es-title')+' — '+done.score+'/10 · +'+Number(done.xp||0).toLocaleString('fr-FR')+' XP · Revoir le résultat':b.getAttribute('data-es-title')+' · À faire';
   });
  }catch(e){
   loaded=false;progressStatus.textContent='Résultats indisponibles : '+(e.message||e)+'. Les exercices ne pourront pas être validés tant que le suivi sécurisé est inaccessible.';
   summaryOf(attempts,resultSlot);
  }
 };
 const lessonCards=[];
 let activeCard=null;
 LESSONS.forEach(([entId,date,name],li)=>{
  const index=li+1,card=css(el('details',undefined,'tim-es-lesson'),ST.card);
  const label=css(el('summary','Leçon '+index+' — '+name),ST.summary);
  label.title='Séance du '+date;
  card.append(label);
  const inner=css(el('div'),'padding:0 13px 18px');
  const returnToList=button('← Choisir une autre leçon');
  returnToList.className='tim-es-back';
  returnToList.style.cssText='margin:7px 0 13px;min-height:40px;background:#eef3fb!important;border:1px solid #bbcce1!important;color:#2d4d77!important;padding:8px 12px;border-radius:9px;font-weight:700';
  returnToList.onclick=()=>{
   card.open=false;
   activeCard=null;
   lessonCards.forEach(other=>{other.hidden=false;});
   root.scrollIntoView?.({block:'start'});
  };
  const lessonSlot=el('div');lessonSlot.className='tim-es-reading';
  let lessonReady=false;
  const openLesson=()=>{
   if(!lessonReady){inlineLesson(lessonSlot,entId,helpers.appendL01);lessonReady=true;}
   lessonSlot.hidden=false;
  };
  inner.append(returnToList,lessonSlot);
  const exerciseSection=el('details');exerciseSection.className='tim-es-exercises';
  const exerciseHeading=el('summary','Après la leçon — faire les 3 exercices');
  exerciseHeading.style.cssText='cursor:pointer;font-weight:800;font-size:16px;color:#294a79;padding:11px 5px';
  exerciseSection.append(exerciseHeading);
  const exerciseBody=el('div');
  const trainer=css(el('h3','Mes 3 exercices'),ST.h);exerciseBody.append(trainer);
  p(exerciseBody,'Une seule validation par exercice. Note et correction après l’envoi.');
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
  exerciseBody.append(rows,work);exerciseSection.append(exerciseBody);
  inner.append(exerciseSection);card.append(inner);root.append(card);
  lessonCards.push(card);
  card.addEventListener('toggle',()=>{
   if(card.open){
    activeCard=card;
    lessonCards.forEach(other=>{if(other!==card){other.open=false;other.hidden=true;}});
    openLesson();
   }else if(activeCard===card){
    activeCard=null;
    lessonCards.forEach(other=>{other.hidden=false;});
   }
  });
  if(opts.openLessonId===entId){card.open=true;openLesson();}
 });
 if(activeCard)lessonCards.forEach(other=>{if(other!==activeCard)other.hidden=true;});
 results.style.cssText='margin:20px 0;padding:14px;border:1px solid #b8cce3;border-radius:12px;background:#f3f7fc;color:#253b59';
 resultsHeading.style.cssText='cursor:pointer;font-size:16px;font-weight:800';
 root.append(results);
 refresh();
}
window.TIM_SPANISH_SIMPLIFIED={render,lessons:LESSONS.map((x,i)=>({id:x[0],num:i+1,name:x[2]}))};
})();
