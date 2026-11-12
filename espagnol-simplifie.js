/* Espagnol 3e : une leçon, trois exercices, correction expliquée.
   Les documents ENT restent réservés aux archives Parent.
   Les réponses attendues ne sont jamais envoyées avant la validation serveur. */
(function(){
'use strict';
const LESSONS=[
 ['10099~6400501','16 septembre','Se présenter'],
 ['10099~6400551','17 septembre','Parler de son sport préféré'],
 ['10099~6400534','22 septembre','La lettre : se présenter et inviter'],
 ['10099~6400502','23 septembre','La lettre : expliquer le choix d’un animal'],
 ['10099~6400485','24 septembre','Horoscope et caractère'],
 ['10099~6400552','1er octobre','Accords et conjugaison'],
 ['10099~6400535','6 octobre','Horoscope et articles'],
 ['10099~6400486','8 octobre','Comprendre « Mes camarades » à l’oral'],
 ['10099~6400505','14 octobre','Articles et goûts'],
 ['10099~6400553','15 octobre','Questions et possessifs'],
 ['10099~6400536','3 novembre','Tutoiement, politesse et contrôle'],
 ['10099~6400506','4 novembre','Réviser la conjugaison'],
 ['10099~6400487','5 novembre','Dix verbes au présent'],
 ['10099~6400554','12 novembre','12 novembre — No empiezo en septiembre : négations et saisons']
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

/* Fiches rédigées à partir des séances ENT : la consigne du professeur et
   l'explication pédagogique ne doivent pas être confondues. */
const ENT_WHAT_WAS_DONE={
 '10099~6400501':'Se présenter à l’oral avec la fiche de renseignements ; revoir llamarse, ser et ir.',
 '10099~6400551':'Se présenter puis expliquer quel sport on préfère, en utilisant les phrases du cahier.',
 '10099~6400534':'Rédiger une lettre à un correspondant : se présenter, parler de ses goûts et l’inviter à son anniversaire.',
 '10099~6400502':'Compléter cette même lettre avec une phrase sur l’animal totem préféré et expliquer pourquoi.',
 '10099~6400485':'Travailler l’horoscope, les dates de naissance et les adjectifs de caractère.',
 '10099~6400552':'Revoir les accords au féminin/pluriel et les verbes llamarse, ir et traer.',
 '10099~6400535':'Corriger l’oral sur l’horoscope ; revoir aussi les articles du devoir associé.',
 '10099~6400486':'Comprendre à l’oral « Mis compañeros » (mes camarades). L’enregistrement original n’est pas présent ici.',
 '10099~6400505':'Corriger l’expression écrite et travailler les articles définis et indéfinis.',
 '10099~6400553':'Comprendre les questions, les possessifs et le dialogue du manuel avec la professeure.',
 '10099~6400536':'Réviser su et usted, puis préparer l’évaluation de compréhension et d’expression écrite.',
 '10099~6400506':'Évaluation de fin de séquence ; travail de conjugaison Práctica (photocopie du professeur).',
 '10099~6400487':'Réviser les dix verbes au présent pour l’évaluation de conjugaison et préparer la carte Plickers.',
 '10099~6400554':'Évaluation de conjugaison, compréhension écrite « No empiezo en septiembre » (groupe A) : no… sino, nunca, nada et hemisferio sur ; Plickers. Photocopie à finir pour mardi 17 novembre.'
};
const LESSON_HELP_IDS=['L01','L04','L05','L05','L06','L07','L08','L07','L04','L11','L12','L10','L15','L15'];
const SPECIAL_HELP={
 '10099~6400534':[
  ['Pourquoi parle-t-on d’un anniversaire dans la lettre ?',
   'C’est une partie de la consigne d’expression écrite : tu écris à un correspondant, tu te présentes et tu l’invites. Ce n’est pas une leçon indépendante sur les fêtes.',
   'Te invito a mi cumpleaños el veinte de mayo. = Je t’invite à mon anniversaire le 20 mai.'],
  ['Comment construire une lettre sans tout mélanger ?',
   'Écris dans cet ordre : bonjour, prénom et âge, goûts, animal préféré, invitation, formule de fin. Chaque partie peut tenir en une phrase courte.',
   '¡Hola! Me llamo Ana. Tengo quince años. Me gusta el fútbol. ¡Hasta pronto!']
 ],
 '10099~6400554':[
  ['Pourquoi « sino » et non « pero » ?','Sino remplace une idée que l’on vient de nier : pas septembre, mais mars. Pero oppose deux idées sans corriger cette négation.','No empiezo en septiembre, sino en marzo. = Je ne commence pas en septembre, mais en mars.'],
  ['Quelle différence entre nunca et nada ?','Nunca signifie jamais : cela parle de fréquence. Nada signifie rien : cela parle d’une absence de chose.','Nunca estudio el domingo. = Je n’étudie jamais le dimanche. No veo nada. = Je ne vois rien.'],
  ['Pourquoi est-ce l’hiver en août dans le sud ?','Les saisons sont inversées entre les deux hémisphères : août est l’été en France et l’hiver dans l’hémisphère sud.','En agosto es invierno en el hemisferio sur. = En août, c’est l’hiver dans l’hémisphère sud.']
 ],
 '10099~6400502':[
  ['À quoi sert l’animal totem dans ce cours ?',
   'La professeure demande une phrase supplémentaire dans la lettre au correspondant. Tu choisis un animal, puis tu expliques ton choix avec « porque » (parce que).',
   'Mi animal tótem preferido es el lobo porque es inteligente. = Mon animal totem préféré est le loup parce qu’il est intelligent.'],
  ['Pourquoi reparle-t-on d’une lettre et d’un anniversaire ?',
   'C’est le même travail commencé le 22 septembre : l’animal totem est seulement une partie de la lettre, et l’invitation à l’anniversaire est une autre partie.',
   'Te invito a mi cumpleaños. = Je t’invite à mon anniversaire.']
 ]
};
const FIRST_LESSON={
 goal:'Savoir te présenter en quelques phrases et répondre aux questions simples sur ton identité.',
 steps:['Commence par ton prénom avec « Me llamo… ».','Pour dire ton âge, utilise « Tengo… años » et non « Soy… años ».','Pour dire d’où tu viens, utilise « Soy… » ou « Vivo en… ».'],
 examples:[['Me llamo Ana.','Je m’appelle Ana.'],['Tengo quince años.','J’ai quinze ans.'],['Vivo en Francia.','J’habite en France.']],
 learn:['Je sais dire mon prénom, mon âge et mon lieu de vie.'],
 conjugations:['llamarse','ser','ir'],
 vocab:[['me llamo','je m’appelle'],['tengo','j’ai'],['años','ans'],['vivo','j’habite']]
};
function inlineLesson(holder,entId,renderL01,showExercises){
 holder.replaceChildren();
 const source=window.TIM_SPANISH_ENT_BIS;
 const data=entId==='10099~6400501'?FIRST_LESSON:source?.getLesson?.(entId);
 if(!data){p(holder,'Le cours n’est pas disponible pour cette séance.');return;}
 const explained=window.TIM_SPANISH_BIS_EXPLAINED?.[entId]||null;
 const sheet=el('article',undefined,'tim-es-course-sheet');
 sheet.setAttribute('aria-label','Leçon BIS, expliquée pour Tim');
 const h=(title)=>{
  const heading=el('h3',title);
  if(title==='Comprendre la règle')heading.dataset.timReviewPart='rule';
  if(title==='Comment faire')heading.dataset.timReviewPart='method';
  if(title==='Un exemple corrigé, pas à pas')heading.dataset.timReviewPart='example';
  sheet.append(heading);
 };
 const para=(text,cls)=>sheet.append(el('p',text,cls));
 const example=(parent,item)=>{
  if(!Array.isArray(item)||item.length<2)return;
  const block=el('p',undefined,'tim-es-course-example');
  const spanish=el('strong',item[0]);spanish.lang='es';
  block.append(spanish,say(item[0],'es','Écouter'),el('span',item[1]));
  parent.append(block);
 };
 sheet.append(el('p','LEÇON BIS · EXPLICATION FACILE','tim-es-bis-label'));
 h('À quoi sert cette leçon ?');
 para(explained?.why||data.goal||'Comprendre les phrases vues en cours.');
 h('Comprendre la règle');
 para(explained?.rule||data.goal);
 h('Comment faire');
 const steps=el('ol',undefined,'tim-es-course-steps');
 (data.steps||[]).slice(0,entId==='10099~6400554'?5:3).forEach(step=>steps.append(el('li',step)));
 sheet.append(steps);
 if(explained?.worked?.length===3){
  h('Un exemple corrigé, pas à pas');
  const worked=el('div',undefined,'tim-es-worked');
  worked.append(el('p',explained.worked[0], 'tim-es-worked-question'));
  worked.append(el('p',explained.worked[1], 'tim-es-worked-method'));
  worked.append(el('p',explained.worked[2], 'tim-es-worked-answer'));
  sheet.append(worked);
 }
 if(data.examples?.length){
  h('Deux autres exemples');
  (data.examples||[]).slice(0,2).forEach(item=>example(sheet,item));
 }
 const takeaway=el('p',undefined,'tim-es-course-remember');
 takeaway.append(el('strong','À retenir : '),document.createTextNode(explained?.remember||data.learn?.[0]||'Revoir la méthode et les exemples.'));
 sheet.append(takeaway);
 holder.append(sheet);
 /* Le vrai document ENT reste distinct de la leçon expliquée. */
 const original=el('details',undefined,'tim-es-ent-original');
 const originalTitle=el('summary','Cours ENT du professeur et fiches originales');
 const originalSlot=el('div',undefined,'tim-es-ent-original-content');
 original.append(originalTitle,originalSlot);
 let originalMode=null;
 const openOriginal=async section=>{
  originalMode=section;
  original.hidden=false;
  original.open=true;
  originalTitle.textContent=section==='exercises'?'Exercices ENT et fiches du professeur':'Cours original ENT et traduction';
  originalSlot.replaceChildren(el('p','Chargement du document original…'));
  try{
   if(window.__TIM_GUEST){
    originalSlot.textContent='Les documents originaux sont réservés aux comptes Tim et Parent.';
   }else if(typeof window.TIM_SPANISH_ENT_EXACT?.renderLessonOriginal==='function'){
    await window.TIM_SPANISH_ENT_EXACT.renderLessonOriginal(originalSlot,entId,section);
   }else originalSlot.textContent='Le document original est indisponible pour le moment.';
  }catch(e){
   originalSlot.textContent='Impossible de charger le document original pour le moment.';
  }
  original.scrollIntoView?.({block:'start'});
 };
 original.addEventListener('toggle',()=>{
  if(original.open&&!originalMode)openOriginal('course');
 });
 holder.append(original);

 /* Aide réellement distincte du cours : deux difficultés ciblées,
    avec une autre explication et une phrase traduite. */
 const i=LESSONS.findIndex(row=>row[0]===entId);
 const mapped=window.TIM_SPANISH_HELP_TOPICS?.[LESSON_HELP_IDS[i]]||[];
 const topics=SPECIAL_HELP[entId]||mapped;
 const help=el('details',undefined,'tim-es-course-help');
 const summary=el('summary','Je n’ai pas compris');
 help.append(summary);
 help.append(el('p','Choisis ce qui te bloque :'));
 const choices=el('div',undefined,'tim-es-help-choices');
 const answer=el('div',undefined,'tim-es-help-answer');
 answer.setAttribute('aria-live','polite');
 topics.slice(0,3).forEach(topic=>{
  const b=button(topic[0]);
  b.className='tim-es-help-question';
  b.onclick=()=>{
   answer.replaceChildren();
   answer.append(el('strong',topic[0]),el('p',topic[1]),el('p',topic[2]));
  };
  choices.append(b);
 });
 help.append(choices,answer);
 holder.append(help);

 /* Les tableaux, le lexique et les autres exemples existent toujours,
    mais ils ne prennent pas la place de la leçon à lire. */
 const extra=el('details',undefined,'tim-es-course-extra');
 extra.append(el('summary','Approfondir : autres exemples, vocabulaire et conjugaison'));
 const body=el('div');
 const extras=(data.examples||[]).slice(3);
 if(extras.length){
  body.append(el('h4','Autres exemples'));
  extras.forEach(item=>example(body,item));
 }
 if(data.steps?.length>4){
  body.append(el('h4','Conseils supplémentaires'));
  const list=el('ul');data.steps.slice(4).forEach(t=>list.append(el('li',t)));body.append(list);
 }
 if(data.conjugations?.length){
  body.append(el('h4','Les verbes au présent'));
  for(const name of data.conjugations){
   const info=source?.getVerb?.(name);
   if(!info?.forms)continue;
   const d=el('details',undefined,'tim-es-verb-sheet');
   d.append(el('summary',name+' — '+info.meaning));
   const persons=['yo — je','tú — tu','él/ella — il/elle','nosotros — nous','vosotros — vous','ellos/ellas — ils/elles'];
   const t=el('table',undefined,'tim-es-verb-table');
   const tbody=el('tbody');
   info.forms.forEach((form,j)=>{
    const tr=el('tr');
    tr.append(el('th',persons[j]));
    const td=el('td');td.append(el('strong',form),say(form,'es','Écouter'));tr.append(td);tbody.append(tr);
   });
   t.append(tbody);d.append(t);body.append(d);
  }
 }
 if(data.vocab?.length){
  body.append(el('h4','Le vocabulaire de la leçon'));
  const vocab=el('ul',undefined,'tim-es-vocab-list');
  data.vocab.forEach(pair=>{
   if(!Array.isArray(pair)||pair.length<2)return;
   const li=el('li');
   li.append(el('strong',pair[0]+' : '),document.createTextNode(pair[1]));
   vocab.append(li);
  });
  body.append(vocab);
 }
 extra.append(body);holder.append(extra);

 /* Reprise du menu ENT / BIS / aide / exercices des mathématiques. */
 const menu=el('nav',undefined,'spx-quick-links tim-es-quick-links');
 menu.setAttribute('aria-label','Cours et exercices de cette leçon');
 const addChoice=(label,action)=>{
  const b=el('button',label,'spx-quick-link tim-es-quick-link');
  b.type='button';b.onclick=action;menu.append(b);
 };
 addChoice('1 · Leçon ENT',()=>openOriginal('course'));
 addChoice('2 · Leçon BIS',()=>{
  original.open=false;original.hidden=true;
  help.open=false;help.hidden=true;
  sheet.scrollIntoView?.({block:'start'});
 });
 addChoice('3 · Je n’ai pas compris',()=>{
  original.open=false;original.hidden=true;
  help.hidden=false;help.open=true;
  help.scrollIntoView?.({block:'start'});
 });
 addChoice('Exercices ENT du chapitre',()=>openOriginal('exercises'));
 addChoice('Exercices BIS · 3 séries de 10 questions',()=>showExercises?.());
 original.hidden=true;
 help.hidden=true;
 const route=el('p','Parcours conseillé : 1. lire le cours ENT et ses PDF ; 2. comprendre la leçon BIS et son exemple ; 3. faire les exercices ; 4. comprendre sa correction.','tim-es-study-route');
 route.style.cssText='padding:10px 12px;margin:9px 0;border-left:3px solid #5378b8;background:#f1f5fb;color:#213f66;line-height:1.55';
 holder.replaceChildren(route,menu,original,sheet,help,extra);
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
 const parentPractice=report.practice===true;
 const wrapper=css(el('section',undefined,'tim-es-training-result'),ST.panel);
 const title=css(el('h4',(parentPractice?'Simulation Parent — ':'Résultat de l’exercice — ')+String(score).replace('.',',')+' / 10 points'),ST.title);
 wrapper.append(title);
 p(wrapper,parentPractice?'Simulation du Parent : 0 XP, aucune tentative ni note enregistrée pour Tim.':'Ce résultat mesure la compréhension de la leçon. Ce n’est pas une note scolaire. XP gagnés : '+Number(report.xp||0).toLocaleString('fr-FR')+' XP.','font-size:15px;font-weight:750;color:#263d89;line-height:1.6');
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
   const category=String(item.category||'');
   const part=/(conjugaison|accord|construction|accent|ponctuation|grammaire)/i.test(category)?'method':
    /(vocabulaire|traduction)/i.test(category)?'rule':'example';
   const partName=part==='rule'?'Comprendre la règle':part==='method'?'Comment faire':'Un exemple corrigé, pas à pas';
   p(card,'Partie à revoir dans la leçon : « '+partName+' ».','font-size:14px;font-weight:850;color:#294a79;margin:9px 0');
   const go=button('Revoir cette partie de la leçon');
   go.type='button';
   go.onclick=()=>{
    ensureLesson();
    const lesson=slot.closest('.tim-es-lesson');
    const anchor=lesson?.querySelector('[data-tim-review-part="'+part+'"]')||
     lesson?.querySelector('[data-tim-review-part="rule"]')||
     lesson?.querySelector('.tim-es-course-sheet');
    anchor?.scrollIntoView?.({block:'start',behavior:'auto'});
   };
   card.append(go);
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
 const parentPractice=isParent();
 const mayAnswer=isTim()||parentPractice;
 const head=css(el('h4',task.title),ST.title);wrapper.append(head);
 p(wrapper,'10 questions. Une question à la fois. Tu peux écouter ou traduire la consigne.','font-size:15px;line-height:1.55;color:#344663;margin:8px 0 14px');
 if(parentPractice){
  p(wrapper,'Mode essai Parent : répondez aux dix questions, obtenez la correction, mais aucune note ni XP ne seront enregistrés pour Tim. Vous pouvez recommencer votre essai.','font-weight:750;color:#375179');
 }else if(!mayAnswer){
  p(wrapper,'Connexion Parent ou Tim nécessaire pour répondre aux questions.','font-weight:750;color:#6b4c2a');
 }
 const readers=[],translationsUsed=Array(10).fill(false);
 const pages=[];
 for(const [i,q] of task.questions.entries()){
  const field=css(el('fieldset',undefined,'tim-es-question-page'),ST.panel+';padding:13px 12px;margin:14px 0');
  field.hidden=i!==0;
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
    const radio=el('input');radio.type='radio';radio.name=task.id+'_q'+i;radio.value=String(k);radio.disabled=!mayAnswer;
    radio.style.cssText='flex:0 0 20px;display:block!important;position:static!important;opacity:1!important;visibility:visible!important;width:20px;height:20px;margin:2px 0;accent-color:#28458e;appearance:auto!important;pointer-events:auto!important';
    label.append(radio,el('span',choice));field.append(label);radios.push(radio);
   });
   readers.push(()=>radios.findIndex(r=>r.checked));
  }else if(q.kind==='gap'||q.kind==='write'){
   const label=css(el('label',q.kind==='gap'?'Écris le mot manquant :':'Écris ta réponse en espagnol :'),'font-weight:750;color:#354766;display:block;margin:10px 0 8px;font-size:14px');
   const answer=el('input');answer.type='text';answer.maxLength=200;
   answer.disabled=!mayAnswer;answer.autocomplete='off';answer.setAttribute('autocapitalize','none');
   answer.spellcheck=false;answer.placeholder=q.kind==='gap'?'Mot à compléter':'Réponse sans propositions';
   answer.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;box-sizing:border-box;width:100%;min-height:45px;padding:11px 12px;background:white!important;color:#20344c!important;border:1px solid #8498b8!important;border-radius:10px;font-size:16px;line-height:1.45';
   field.append(label,answer);readers.push(()=>answer.value.trim());
  }else{
   p(field,'Cette question est momentanément indisponible.','font-weight:750;color:#a94334');
   readers.push(()=>null);
  }
  wrapper.append(field);
  pages.push(field);
 }
 const navigation=el('nav',undefined,'tim-es-question-navigation');
 navigation.setAttribute('aria-label','Se déplacer entre les questions');
 const progress=css(el('p','Question 1 sur 10'),'font-weight:850;color:#263a83;font-size:16px;margin:0 0 10px');
 progress.setAttribute('role','status');
 const previous=button('← Précédente');
 const next=button('Suivante →');
 previous.className='tim-es-question-prev';
 next.className='tim-es-question-next';
 let current=0;
 const showQuestion=(index)=>{
  current=Math.max(0,Math.min(pages.length-1,index));
  pages.forEach((page,i)=>{page.hidden=i!==current;});
  previous.hidden=current===0;
  next.hidden=current===pages.length-1;
  progress.textContent='Question '+(current+1)+' sur '+pages.length+' · '+readers.filter(read=>read()!==-1&&read()!=='').length+' réponse(s)';
  pages[current]?.scrollIntoView?.({block:'nearest',behavior:'instant'});
 };
 previous.onclick=()=>showQuestion(current-1);
 next.onclick=()=>showQuestion(current+1);
 navigation.append(progress,previous,next);
 wrapper.append(navigation);
 wrapper.addEventListener('change',()=>showQuestion(current));
 showQuestion(0);
 if(mayAnswer){
  const advice=el('details',undefined,'tim-es-answer-advice');
  advice.append(el('summary','Conseil avant de valider'),el('p','Vérifie les accents, la lettre ñ et les signes ¿ ? quand tu écris en espagnol.'));
  wrapper.append(advice);
  const confirmButton=button(parentPractice?'Corriger mon essai Parent (sans XP)':'Valider mes 10 réponses — une seule fois');
  const feedback=p(wrapper,'','font-weight:750;color:#9a4b36;margin:12px 0');
  confirmButton.onclick=async()=>{
   const answers=readers.map(read=>read());
   if(answers.some(a=>a===null||a===-1||a==='')){showQuestion(answers.findIndex(a=>a===null||a===-1||a===''));feedback.textContent='Réponds à cette question avant de valider.';return;}
   if(!parentPractice&&!window.confirm('Avant de valider, as-tu vérifié les accents, la lettre ñ, la conjugaison et les signes « ¿ » et « ? » ?\\nUne fois validé, cet exercice ne pourra plus être recommencé.'))return;
   confirmButton.disabled=true;confirmButton.textContent=parentPractice?'Correction de votre essai…':'Enregistrement sécurisé…';feedback.textContent='';
   try{
    const report=parentPractice
     ?await window.__TIM_BRIDGE.spanishEntTrainingPreview(task.id,answers,translationsUsed)
     :await window.__TIM_BRIDGE.spanishEntTrainingSubmit(task.id,answers,translationsUsed);
    drawCorrection(slot,report,lessonNumber,ensureLesson);
    if(!parentPractice)await after();
   }catch(e){
    if(parentPractice){
     feedback.textContent='Essai non enregistré : '+(e?.message||'correction momentanément indisponible');
     confirmButton.disabled=false;confirmButton.textContent='Corriger mon essai Parent (sans XP)';
     return;
    }
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
 p(result,complete+' / 42 exercices réalisés. Chaque exercice a 10 questions et ne peut être validé qu’une fois.','font-size:15px;color:#34445f;line-height:1.55');
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
   if(!lessonReady){inlineLesson(lessonSlot,entId,helpers.appendL01,()=>{exerciseSection.open=true;exerciseSection.scrollIntoView?.({block:'start'});});lessonReady=true;}
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
    if(!loaded){await refresh();if(!loaded&&!isParent()){wait.textContent='Connexion au suivi impossible. Aucune validation ne peut être enregistrée pour le moment.';return;}}
    const previous=attempts.find(a=>a.id===id);
    try{
     if(previous&&!isParent()){
      const saved=await bridge.spanishEntTrainingProgress(id);
      if(!saved.attempt){wait.textContent='Le résultat enregistré est momentanément inaccessible.';return;}
      drawCorrection(work,saved.attempt,index,openLesson);
      return;
     }
     const resp=await bridge.spanishEntTrainingTask(id);
     if(resp.completed&&!isParent()){
      const saved=await bridge.spanishEntTrainingProgress(id);
      if(saved.attempt){drawCorrection(work,saved.attempt,index,openLesson);await refresh();}
      else wait.textContent='Cet exercice est déjà validé. Résultat à actualiser.';
      return;
     }
     if(isParent()){
      work.replaceChildren();
      if(previous||resp.completed){
       const savedPanel=el('details');savedPanel.className='tim-es-parent-copy';
       savedPanel.style.cssText=ST.panel+';margin:10px 0';
       savedPanel.append(el('summary','Consulter la copie corrigée de Tim'));
       const savedBody=el('div');savedPanel.append(savedBody);
       savedPanel.addEventListener('toggle',async()=>{
        if(!savedPanel.open)return;
        try{
         const copy=await bridge.spanishEntTrainingProgress(id);
         if(copy.attempt)drawCorrection(savedBody,copy.attempt,index,openLesson);
         else savedBody.textContent='Copie de Tim indisponible actuellement.';
        }catch(e){savedBody.textContent='Copie indisponible : '+String(e.message||e);}
       });
       work.append(savedPanel);
      }
      const practice=el('div');work.append(practice);
      renderQuestions(practice,resp.task,index,refresh,openLesson);
     }else{
      renderQuestions(work,resp.task,index,refresh,openLesson);
     }
    }catch(e){wait.textContent='Impossible d’ouvrir cet exercice : '+(e.message||'service indisponible');}
   };
   rows.append(b);
  }
  exerciseBody.append(rows,work);exerciseSection.append(exerciseBody);
  inner.append(exerciseSection);card.append(inner);root.append(card);
  lessonCards.push(card);
  // Ouvrir le cours pendant le clic, sans attendre l'événement toggle asynchrone.
  label.addEventListener('click',()=>{if(!card.open)openLesson();});
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
