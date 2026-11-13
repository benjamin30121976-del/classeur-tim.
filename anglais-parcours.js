/* Anglais : 22 séances ENT datées, 7 fiches BIS, 5 onglets par leçon.
   Les textes officiels restent séparés des explications et questions créées. */
(function(){'use strict';
const E=(tag,text,cls='')=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const add=(root,tag,text,cls='')=>{const n=E(tag,text,cls);root.append(n);return n;};
const button=(text,cb,cls='plain')=>{const n=E('button',text,cls);n.type='button';n.onclick=cb;n.style.cssText='min-height:44px;white-space:normal;margin:4px';return n;};
const short=d=>d?String(d).slice(8,10)+'/'+String(d).slice(5,7)+'/'+String(d).slice(0,4):'';
const ORDER=['Vacances et prétérit','Personnalité','Similitudes et présentation','Musique et vocabulaire','Actions passées et simultanéité'];
const TRAINING={EN_BIS01:3,EN_BIS02:3,EN_BIS03:1,EN_BIS04:1,EN_BIS05:1,EN_BIS06:1,EN_BIS07:1};
const ENT_MUSIC_QUIZ=[
'1. Classer les genres musicaux dans l’ordre chronologique.',
'2. Lire les affirmations sur le chant des esclaves et l’usage des tambours.',
'3. Identifier les chants fondés sur la Bible.',
'4. Identifier le sentiment exprimé par le blues.',
'5. Situer les débuts du blues par rapport à l’esclavage.',
'6. Situer les premiers groupes de jazz aux États-Unis.',
'7. Associer des musiciens aux instruments.',
'8. Situer la naissance du rock’n’roll dans le temps.',
'9. Identifier le surnom « the King of rock’n’roll ».'
];
function bisContent(slot,bis){
 add(slot,'h4',bis.title);
 add(slot,'p',bis.rule);
 for(const [a,b] of bis.examples){const p=E('p');p.append(E('strong',a+' : '),document.createTextNode(b));slot.append(p);}
 add(slot,'h4','Exemple guidé : comment rédiger');
 if(bis.id==='EN_BIS03')add(slot,'p','Question : Where did you go last summer? Réponse : I went to the beach last summer. Je reprends le sujet I, le verbe au prétérit went et le complément.');
 else if(bis.id==='EN_BIS04')add(slot,'p','Question : What are you like? Réponse : I am rather shy, but I am very caring. Je formule deux phrases complètes avec des adjectifs.');
 else if(bis.id==='EN_BIS05')add(slot,'p','Phrase : I can swim. Réponse : So can I. Je repère can, le conserve et construis So + can + I.');
 else if(bis.id==='EN_BIS06')add(slot,'p','Question : Introduce yourself. Réponse : I am a student. I like playing football. Je donne une information par phrase.');
 else if(bis.id==='EN_BIS07')add(slot,'p','Phrase : The band was playing when the lights went out. Je distingue was playing (action en cours) et went out (événement court).');
 else if(bis.id==='EN_BIS02')add(slot,'p','Question : Turn happy into a noun. Réponse : Happiness. Je remplace y par i puis j’ajoute -ness.');
 else add(slot,'p','Question : Where did the first jazz bands appear? Réponse : The first jazz bands appeared in New Orleans. Je reformule en phrase complète.');
}
function tabbedCourse(course,bis,pack){
 const details=E('details',undefined,'tim-es-lesson');details.style.cssText='background:#18243c;border:1px solid #5b6983;border-radius:13px;margin:11px 0;padding:12px';
 const summary=E('summary',short(course.date)+' — '+course.originalTitle);summary.style.cssText='cursor:pointer;font-size:17px;font-weight:800';details.append(summary);
 const tabs=E('div',undefined,'lesson-tabs');tabs.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:10px 0';
 const body=E('section',undefined,'panel');body.style.cssText='margin-top:8px';
 details.append(tabs,body);
 let selected='';
 function openTab(tab){
  selected=tab;body.replaceChildren();
  for(const b of tabs.children){const on=b.dataset.tab===tab;b.style.background=on?'#d8fc67':'#34415e';b.style.color=on?'#152039':'#fff';}
  if(tab==='ent'){
   add(body,'h3','1 · Leçon ENT du professeur');
   add(body,'p','Séance '+short(course.date)+' · Référence ENT '+course.entId,'subtle');
   if(course.originalContent.length){
    add(body,'p','Texte authentique de l’enseignant, conservé sans correction ni réécriture :');
    course.originalContent.forEach(line=>add(body,'p',line));
   }else add(body,'p','Cette séance figure dans le calendrier ENT, mais l’archive ne contient pas de texte détaillé. Aucun cours n’a été inventé.');
   const due=(pack.homework||[]).filter(h=>h.due===course.date);
   if(due.length){
    add(body,'h4','Devoirs ENT pour cette date');
    for(const hw of due){
     add(body,'p',hw.title+' — '+(hw.content||'Aucune précision supplémentaire publiée dans l’agenda.'));
    }
    add(body,'p','Le statut fait/non fait de ces anciens devoirs n’a pas été vérifié par le Parent.','subtle');
   }
   const target=E('div');body.append(target);
   if(window.TIM_ENGLISH_DOCUMENTS?.render)window.TIM_ENGLISH_DOCUMENTS.render(course.id,target);
  }else if(tab==='bis'){
   add(body,'h3','2 · Leçons BIS expliquées');
   bis.forEach(b=>bisContent(body,b));
  }else if(tab==='help'){
   add(body,'h3','3 · Je n’ai pas compris');
   for(const b of bis){
    add(body,'h4',b.title);
    b.help.forEach((step,i)=>add(body,'p',(i+1)+'. '+step));
   }
   add(body,'p','Reprends un exemple, explique la démarche avec tes mots, puis essaie seul. La correction montrera précisément ce qu’il faut revoir.');
  }else if(tab==='entex'){
   add(body,'h3','4 · Exercices et fiches ENT du professeur');
   const documents=pack.attachments.filter(x=>x.target===course.id);
   const due=(pack.homework||[]).filter(h=>h.due===course.date);
   for(const hw of due){
    add(body,'p','Consigne ENT du '+short(hw.due)+' — '+hw.title+' : '+(hw.content||'Pas de détail supplémentaire publié.'));
   }
   if(!documents.length)add(body,'p','Aucune fiche originale jointe à cette séance dans la collecte.');
   else{
    add(body,'p',documents.length+' document(s) originaux rattaché(s) à cette séance : '+documents.map(x=>x.name).join(' ; ')+'.');
    const target=E('div');body.append(target);
    if(window.TIM_ENGLISH_DOCUMENTS?.render)window.TIM_ENGLISH_DOCUMENTS.render(course.id,target);
    if(course.chapter==='Musique et vocabulaire'&&documents.some(x=>/THE SOUNDS OF MUSIC/i.test(x.name))){
     add(body,'h4','Neuf activités repérées dans le PDF original');
     ENT_MUSIC_QUIZ.forEach(x=>add(body,'p',x));
     add(body,'p','Ce questionnaire contient neuf activités de types différents. Il n’est pas transformé arbitrairement en dix questions notées.');
    }
   }
  }else if(tab==='train'){
   add(body,'h3','5 · Entraînement interactif — exercices BIS');
   add(body,'p','Tous les questionnaires comportent dix questions. Tim valide une seule fois, reçoit sa note, ses corrections détaillées et les leçons à revoir. Le compte Parent peut tester sans enregistrer.');
   const actions=E('div'),slot=E('div');body.append(actions,slot);
   for(const item of bis){
    for(let i=1;i<=TRAINING[item.id];i++){
     const id='ENQ_L'+item.id.slice(-2)+'_0'+i;
     actions.append(button(item.title+' · exercice '+i,()=>{
      slot.replaceChildren();
      if(!window.TIM_ENGLISH_TRAINING?.mount){add(slot,'p','Service de validation indisponible.');return;}
      window.TIM_ENGLISH_TRAINING.mount(id,slot);
     }));
    }
   }
  }
 }
 for(const [tag,label] of [['ent','Leçon ENT'],['bis','Leçon BIS'],['help','Je n’ai pas compris'],['entex','Exercices ENT'],['train','Entraînement']]){
  const b=button(label,()=>openTab(tag));b.dataset.tab=tag;tabs.append(b);
 }
 details.addEventListener('toggle',()=>{if(details.open&&!selected)openTab('ent');});
 return {details,openTab};
}
function render(root,opts={}){
 const pack=window.TIM_ANGLAIS_PACK;
 root.replaceChildren(button('← Toutes les matières',()=>opts.back?.()),E('h2','Anglais — Mes leçons'));
 if(!pack||!Array.isArray(pack.lessons)){add(root,'p','Les cours d’anglais ne sont pas chargés.');return;}
 const all=pack.lessons.filter(x=>x.id.startsWith('EN_ENT_')),bis=pack.bis||[];
 add(root,'p',all.length+' séances ENT classées chronologiquement · '+bis.length+' leçons BIS · '+pack.attachments.length+' pièces originales · 11 entraînements de dix questions.');
 add(root,'p','Dernière collecte de l’ENT : 12 novembre 2026. Les séances sont classées d’après les textes authentiques ; les explications BIS sont distinctes.','lesson-caution');
 const nextEval=(pack.homework||[]).find(x=>x.due==='2026-11-16'&&/evaluation/i.test(x.title));
 if(nextEval){
  const call=E('section',undefined,'panel');
  add(call,'h3','Évaluation d’anglais — lundi 16 novembre 2026');
  add(call,'p',nextEval.content);
  add(call,'p','Ouvre les deux chapitres « Musique et vocabulaire » et « Actions passées et simultanéité » pour réviser les leçons ENT, les BIS et les exercices.');
  root.append(call);
 }
 if(window.__TIM_PARENT&&window.TIM_ENGLISH_DOCUMENTS?.parentImport)root.append(window.TIM_ENGLISH_DOCUMENTS.parentImport());
 for(const chapter of ORDER){
  const rows=all.filter(x=>x.chapter===chapter),chapterBis=bis.filter(x=>x.group===chapter);
  const container=E('details',undefined,'chapter-section');container.style.cssText='border:1px solid #51617c;padding:13px;margin:14px 0;border-radius:14px';
  const heading=E('summary',chapter+' · '+rows.length+' séances ENT · '+chapterBis.length+' leçon(s) BIS');heading.style.cssText='cursor:pointer;font-size:20px;font-weight:800';container.append(heading);
  const list=E('div',undefined,'chapter-body');
  container.append(list);
  for(const course of rows){
   const c=tabbedCourse(course,chapterBis,pack);
   list.append(c.details);
   if(opts.openLessonId===course.id||opts.openLessonId===course.entId||chapterBis.some(b=>opts.openLessonId===b.id)){
    container.open=true;c.details.open=true;c.openTab(opts.openLessonId?.startsWith('EN_BIS')?'bis':'ent');
   }
  }
  if(!opts.openLessonId&&chapter==='Actions passées et simultanéité'){
   container.open=true;
   const last=list.lastElementChild;if(last){last.open=true;}
  }
  root.append(container);
 }
 const future=E('section',undefined,'panel');
 add(future,'h3','Prochain cours ENT — en attente');
 add(future,'p','Lundi 16 novembre 2026 : séance inscrite à l’emploi du temps, sans nouveau cours publié dans cette collecte. Une évaluation écrite est annoncée dans l’agenda ENT : le contenu exact des révisions est rappelé ci-dessus.');
 root.append(future);
 const progress=E('details',undefined,'panel');progress.append(E('summary','Notes, copies et corrections d’anglais'));
 const slot=E('div');progress.append(slot);progress.addEventListener('toggle',()=>{if(progress.open)window.TIM_ENGLISH_TRAINING?.renderProgress?.(slot)});root.append(progress);
}
window.TIM_ENGLISH_PATH={render};
})();