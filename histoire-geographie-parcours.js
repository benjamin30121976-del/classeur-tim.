/* Histoire-géographie et EMC : parcours de neuf thèmes, sources ENT
   identifiées, BIS expliquées, cinq onglets et schémas pédagogiques. */
(function(){'use strict';
const E=(tag,txt,cls='')=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=String(txt);if(cls)x.className=cls;return x;};
const add=(root,tag,txt,cls='')=>{const x=E(tag,txt,cls);root.append(x);return x;};
const btn=(t,action)=>{const b=E('button',t,'plain');b.type='button';b.onclick=action;b.style.cssText='min-height:44px;margin:4px;padding:9px 13px;white-space:normal';return b;};
const fr=s=>String(s||'').slice(8,10)+'/'+String(s||'').slice(5,7)+'/'+String(s||'').slice(0,4);
const SCHEMES={
timeline:{title:'Chronologie de la Grande Guerre',names:['1914','1915–1917','1918'],desc:['Début','Tranchées','Armistice']},
russia:{title:'Chronologie de la révolution russe',names:['Févr. 1917','Oct. 1917','Mars 1918'],desc:['Abdication','Bolcheviks','Paix']},
stalin:{title:'Le régime stalinien contrôle plusieurs domaines',names:['Économie','Propagande','Police'],desc:['Plans','Culte du chef','Terreur']},
city:{title:'Organisation schématique d’une aire urbaine',names:['Centre','Banlieue','Périurbain'],desc:['Emplois','Habitat','Mobilités']},
mobility:{title:'Différentes échelles de mobilité',names:['Locale','Régionale','Nationale'],desc:['Navette','Métropole','Migration']},
republic:{title:'Les valeurs et principes républicains',names:['Liberté','Égalité','Fraternité'],desc:['Droits','Loi','Solidarité']},
law:{title:'Deux jalons du droit à l’IVG',names:['1975','Parlement','2024'],desc:['Loi Veil','Débats','Constitution']},
eu:{title:'Institutions de l’UE : schéma simplifié',names:['Commission','Parlement + Conseil UE','Loi UE'],desc:['Propose','Adoptent','Appliquée']},
nazism:{title:'Repères historiques du nazisme',names:['1933','1935','1939–1945'],desc:['Dictature','Lois racistes','Guerre / Shoah']}
};
function diagram(kind){
 const data=SCHEMES[kind];if(!data)return E('p','Schéma pédagogique en préparation.');
 const panel=E('section',undefined,'hg-bis-illustration');
 panel.style.cssText='background:#eef6fb;color:#27455d;border:1px solid #a5c5dc;border-radius:13px;padding:11px;margin:12px 0';
 add(panel,'strong',data.title+' — schéma BIS, non reproduit de l’ENT');
 const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');
 svg.setAttribute('viewBox','0 0 370 145');svg.setAttribute('width','100%');svg.setAttribute('role','img');svg.setAttribute('aria-label',data.title);
 function shape(t,props,txt){const n=document.createElementNS(NS,t);for(const [a,b] of Object.entries(props))n.setAttribute(a,String(b));if(txt!==undefined)n.textContent=txt;svg.append(n);return n;}
 for(let i=0;i<3;i++){
  const x=9+i*121;
  shape('rect',{x,y:35,width:112,height:73,rx:11,fill:['#c6dfed','#d9e6c0','#f4dfbe'][i],stroke:'#547691','stroke-width':1.4});
  shape('text',{x:x+56,y:65,'text-anchor':'middle',fill:'#1e3c55','font-size':i===1&&data.names[i].length>16?10:12,'font-weight':'bold'},data.names[i]);
  shape('text',{x:x+56,y:86,'text-anchor':'middle',fill:'#3d5267','font-size':11},data.desc[i]);
  if(i<2)shape('path',{d:'M '+(x+112)+' 71 l 8 0 m -4 -4 l 4 4 l -4 4',stroke:'#2e627e','stroke-width':1.8,fill:'none'});
 }
 panel.append(svg);
 if(kind==='eu')add(panel,'p','Attention : le Conseil de l’Europe (46 États) est distinct de l’UE et n’est pas représenté dans la chaîne législative.');
 if(kind==='city')add(panel,'p','Ce dessin simplifie la notion d’aire urbaine : il ne remplace pas le schéma exact utilisé en classe.');
 return panel;
}
function bisContent(root,b){
 add(root,'h4',b.title);
 add(root,'p',b.rule);
 root.append(diagram(b.diagram));
 add(root,'h4','Comprendre la leçon pas à pas');
 b.steps.forEach((t,i)=>add(root,'p',(i+1)+'. '+t));
 add(root,'h4','Exemples guidés : comment écrire');
 for(const [q,a] of b.examples){
  const p=E('p');p.append(E('strong',q+' : '),document.createTextNode(a));root.append(p);
 }
 add(root,'h4','Réponse rédigée : méthode');
 if(b.id==='HG_BIS04'||b.id==='HG_BIS05')add(root,'p','Je décris d’abord ce que montre la carte ou le schéma, je cite la légende, puis j’explique la notion géographique. Je donne un exemple précis.');
 else if(b.id==='HG_BIS06'||b.id==='HG_BIS07'||b.id==='HG_BIS08')add(root,'p','Je nomme la valeur, la loi ou l’institution, puis j’explique son rôle avec un exemple. Ne pas confondre les institutions qui portent des noms proches.');
 else add(root,'p','Je commence par situer le fait dans le temps et identifier les acteurs. J’explique ensuite une cause, le déroulement et une conséquence.');
 if(b.id==='HG_BIS02')add(root,'p','Précision chronologique : la sortie de guerre est annoncée en 1917, mais le traité de paix est signé en mars 1918.');
 if(b.id==='HG_BIS08')add(root,'p','Précision institutionnelle : le Conseil de l’Europe n’est pas le Conseil européen. Il n’est pas une institution de l’Union européenne.');
 if(b.id==='HG_BIS09')add(root,'p','Repères : 1933, construction de la dictature ; 1935, lois de Nuremberg ; 1939–1945, guerre et Shoah. En 1945, l’Allemagne nazie est vaincue. Schéma créé pour apprendre, non fourni dans l’ENT.');
}
// Associations ENT explicites : la date de remise n'est pas toujours la date de séance.
// Ne pas rattacher le cours à recopier pour le 9 novembre à la séance du 9 novembre
// lorsqu'il a été donné pendant celle du 6.
const ENT_LINKED_HOMEWORK={
 '10099~6402886':['10099~213498','10099~213669'],
 '10099~6402837':['10099~214592'],
 '10099~6402820':['10099~214770','10099~215099'],
 '10099~6402787':['10099~215396']
};
const LINKED_HOMEWORK_IDS=new Set(Object.values(ENT_LINKED_HOMEWORK).flat());
function homeworkForCourse(course,pack){
 const ids=ENT_LINKED_HOMEWORK[course.entId];
 if(ids)return pack.homework.filter(h=>ids.includes(h.id));
 return pack.homework.filter(h=>h.lessonEntId===course.entId||(
  h.due===course.date&&!LINKED_HOMEWORK_IDS.has(h.id)));
}
function session(course,bis,pack){
 const details=E('details',undefined,'tim-es-lesson');
 details.style.cssText='background:#18243c;border:1px solid #5b6983;border-radius:13px;margin:11px 0;padding:12px';
 details.append(E('summary',fr(course.date)+' — '+course.title));
 const tabs=E('div');tabs.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:10px 0';
 const pane=E('section',undefined,'panel');pane.style.cssText='margin-top:8px';details.append(tabs,pane);
 let selected='';
 function openTab(tab){
  selected=tab;pane.replaceChildren();
  for(const b of tabs.children){const on=b.dataset.tab===tab;b.style.background=on?'#d8fc67':'#34415e';b.style.color=on?'#152039':'#fff';}
  if(tab==='ent'){
   add(pane,'h3','1 · Séance ENT du professeur');
   add(pane,'p','Référence ENT '+course.entId+' · '+fr(course.date),'subtle');
   if(course.originalText){
    add(pane,'h4','Transcription du texte ENT archivé');
    add(pane,'p',course.originalText);
    add(pane,'p','Le texte du professeur est conservé tel qu’archivé. Les précisions historiques ou institutionnelles figurent dans la leçon BIS.','lesson-caution');
   }else if(course.summary){
    add(pane,'p','Résumé des informations disponibles dans l’ENT : le texte complet de cette séance n’a pas été retrouvé.','lesson-caution');
    add(pane,'p',course.summary);
   }else add(pane,'p','Cette séance est inscrite à l’ENT, mais aucun cours détaillé n’est fourni dans l’archive.');
   const due=homeworkForCourse(course,pack);
   if(due.length){add(pane,'h4','Consignes et travaux liés à cette séance');
    for(const h of due){add(pane,'p','Pour le '+fr(h.due)+' — '+h.title+' : '+h.content);if(h.originalText){add(pane,'h4','Texte original donné à copier dans l’ENT');add(pane,'p',h.originalText);}}
    add(pane,'p','Les travaux cochés dans l’ENT ne prouvent pas que les corrections individuelles sont connues.');}
   const area=E('div');pane.append(area);window.TIM_HG_DOCUMENTS?.render(course.id,area);
  }else if(tab==='bis'){
   add(pane,'h3','2 · Leçon BIS — comprendre simplement');bis.forEach(b=>bisContent(pane,b));
  }else if(tab==='help'){
   add(pane,'h3','3 · Je n’ai pas compris');
   for(const b of bis){add(pane,'h4',b.title);b.help.forEach((t,i)=>add(pane,'p',(i+1)+'. '+t));}
   add(pane,'p','Relis les explications, puis entraîne-toi sur dix questions. La correction indiquera ce qu’il faut revoir.');
  }else if(tab==='entex'){
   add(pane,'h3','4 · Exercices et documents ENT du professeur');
   const tasks=homeworkForCourse(course,pack);
   if(!tasks.length)add(pane,'p','Pas d’exercice détaillé du professeur rattaché à cette séance.');
   for(const h of tasks){add(pane,'p','Consigne pour le '+fr(h.due)+' — '+h.title+' : '+h.content);if(h.originalText){add(pane,'h4','Transcription ENT à recopier');add(pane,'p',h.originalText);}}
   const attached=pack.attachments.filter(d=>d.target===course.id);
   if(attached.length){add(pane,'p','Document original : '+attached.map(d=>d.name).join(' ; '));const area=E('div');pane.append(area);window.TIM_HG_DOCUMENTS?.render(course.id,area);}
   if(/schéma|carte|tableau/i.test(course.title)&&!attached.length)add(pane,'p','La carte, le schéma ou le tableau exact n’est pas joint dans la collecte. Aucun exercice ENT inventé.');
  }else if(tab==='train'){
   add(pane,'h3','5 · Exercices BIS interactifs');
   add(pane,'p','Deux exercices de dix questions pour chaque leçon. Pour le chapitre Nazisme, un troisième exercice ciblé sur les cinq définitions du devoir ENT du 16 novembre est ajouté. Une seule tentative Tim ; essai Parent non enregistré.');
   const actions=E('div'),slot=E('div');pane.append(actions,slot);
   for(const b of bis)for(let i=1;i<=(b.id==='HG_BIS09'?3:2);i++){
    const id='HGQ_L'+b.id.slice(-2)+'_0'+i;
    actions.append(btn(b.title+' · '+(i===1?'QCM de compréhension':i===2?'Réponses écrites':'Cinq mots à définir (devoir ENT 16 novembre)'),()=>{
     slot.replaceChildren();
     if(!window.TIM_HG_TRAINING?.mount){add(slot,'p','Questionnaire indisponible.');return;}
     window.TIM_HG_TRAINING.mount(id,slot);
    }));
   }
  }
 }
 for(const [key,label] of [['ent','Leçon ENT'],['bis','Leçon BIS'],['help','Je n’ai pas compris'],['entex','Exercices ENT'],['train','Entraînement']]){
  const b=btn(label,()=>openTab(key));b.dataset.tab=key;tabs.append(b);
 }
 details.addEventListener('toggle',()=>{if(details.open&&!selected)openTab('ent');});
 return {details,openTab};
}
/* Parcours EMC : navigation par chapitres puis par fiche, comme Espagnol/Maths.
   Réutilise sans duplication les contenus ENT, BIS et identifiants d'exercices HG.
   Aucun accès au stockage ni modification de tentative, note ou XP. */
function renderEmc(root,opts={}){
 const pack=window.TIM_HG_PACK;
 const chapters=(pack?.chapters||[]).filter(ch=>ch.includes('(EMC)'));
 const onlyBis=ch=>(pack?.bis||[]).filter(b=>b.group===ch);
 const onlyCourses=ch=>(pack?.lessons||[]).filter(c=>c.chapter===ch).sort((a,b)=>a.date.localeCompare(b.date));
 const courseTitle=c=>fr(c.date)+' — '+c.title;
 const make=(tag,text,cls='')=>E(tag,text,cls);
 const button=(text,fn,cls='spx-button')=>{
  const node=make('button',text,cls);node.type='button';node.addEventListener('click',fn);return node;
 };
 const panel=(where,title,eyebrow='')=>{
  const p=make('section',undefined,'spx-panel');
  if(eyebrow)p.append(make('span',eyebrow,'spx-label'));
  if(title)p.append(make('h3',title));where.append(p);return p;
 };
 const frame=(title,description,back,backTitle)=>{
  const view=make('div',undefined,'spx emc-view');
  const hero=make('header',undefined,'spx-hero');
  hero.append(make('span','EMC · CLASSE DE 3e','spx-kicker'),make('h2',title),make('p',description));
  view.append(hero);
  if(back)view.append(button('← '+backTitle,back,'spx-back'));
  root.replaceChildren(view);
  try{root.scrollIntoView({block:'start'});}catch{}
  return view;
 };
 const nav=(where,chapter,selected)=>{
  const line=make('nav',undefined,'emc-shortcuts');
  line.setAttribute('aria-label','Rubriques du chapitre EMC');
  const links=[
   ['Cours ENT',()=>openCourses(chapter),'ent'],
   ['Leçon BIS',()=>openBis(chapter),'bis'],
   ['Je n’ai pas compris',()=>openHelp(chapter),'help'],
   ['Exercices ENT',()=>openEntTasks(chapter),'entex'],
   ['Entraînement',()=>openTraining(chapter),'train']
  ];
  for(const [label,action,key] of links){
   const el=button(label,action,'spx-button subtle'+(key===selected?' emc-active':''));
   if(key===selected)el.setAttribute('aria-current','page');
   line.append(el);
  }
  where.append(line);
 };
 const recordFor=ch=>[...new Map(onlyCourses(ch).flatMap(c=>homeworkForCourse(c,pack)).map(h=>[h.id,h])).values()];
 function home(){
  const view=frame('Mes leçons d’EMC','Choisis un thème, puis lis le cours, la leçon BIS ou les exercices.',opts.back,'Toutes les matières');
  const search=make('div',undefined,'spx-search');
  const inp=make('input');inp.type='search';inp.placeholder='Rechercher : loi Veil, République, Europe…';
  inp.setAttribute('aria-label','Rechercher un chapitre EMC');
  search.append(inp);view.append(search,make('h3','Qu’est-ce que tu veux comprendre ?','spx-subheading'));
  const grid=make('div',undefined,'spx-grid');view.append(grid);
  const cards=[];
  for(const ch of chapters){
   const courses=onlyCourses(ch),bis=onlyBis(ch),card=button('',()=>openChapter(ch),'spx-card');
   card.textContent='';
   const icon=make('span','▤','spx-icon');
   const summary=make('strong',ch.replace(' (EMC)',''));
   const subtitle=make('p',bis.map(b=>b.title).join(' · ')||'Séances ENT de ce chapitre');
   const metric=make('small',courses.length+' cours ENT · '+bis.length+' leçon BIS · '+(bis.length*2)+' exercices');
   card.append(icon,summary,subtitle,metric);grid.append(card);cards.push({ch,card});
  }
  inp.addEventListener('input',()=>{
   const q=inp.value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   for(const item of cards){
    const hay=(item.ch+' '+onlyBis(item.ch).map(b=>b.title).join(' ')).toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    item.card.hidden=!hay.includes(q);
   }
  });
  const note=panel(view,'Cours authentiques et révisions');
  add(note,'p','Les cours ENT et les textes des devoirs sont conservés tels que récupérés. Les leçons BIS et leurs schémas sont des explications pédagogiques ajoutées, jamais présentées comme des cours du professeur.');
  const evaluation=pack.homework.find(h=>h.due==='2026-11-18'&&/évaluation EMC/i.test(h.title));
  if(evaluation){
   const alert=panel(view,'Évaluation annoncée — mercredi 18 novembre 2026','AGENDA ENT');
   add(alert,'p','L’ENT annonce une évaluation d’EMC mais ne précise pas le programme exact. Les trois chapitres ci-dessus servent de révision sans inventer le sujet.');
  }
  view.append(button('Voir mes notes et corrections EMC',showResults,'spx-button subtle'));
 }
 function openChapter(ch){
  const courses=onlyCourses(ch),bis=onlyBis(ch);
  const view=frame(ch.replace(' (EMC)',''),'Leçons et documents classés par thème. Choisis directement ce que tu veux lire.',home,'Tous les thèmes EMC');
  const bisPanel=panel(view,'Leçon BIS expliquée','COMPRENDRE AVANT DE S’ENTRAÎNER');
  for(const b of bis){
   const row=button('',()=>openBis(ch),'spx-row');
   row.append(make('span','▤','spx-chip'));
   const labels=make('span');labels.append(make('strong',b.title),make('small','Méthode, schéma, exemples guidés et rédaction'));
   row.append(labels,make('span','Lire →'));bisPanel.append(row);
  }
  const lessons=panel(view,'Cours du professeur — ENT','SÉANCES PAR DATE');
  for(const c of courses){
   const row=button('',()=>openCourse(ch,c),'spx-row');
   row.append(make('span','ENT','spx-chip'));
   const labels=make('span');labels.append(make('strong',courseTitle(c)),make('small',c.originalText?'Texte original archivé':'Titre et consignes ENT retrouvés ; cours détaillé absent'));
   row.append(labels,make('span','Ouvrir →'));lessons.append(row);
  }
  nav(view,ch,'');
  const help=panel(view,'Comment travailler ce chapitre ?');
  add(help,'p','Lis la leçon BIS, puis essaie d’expliquer une notion avec une phrase complète. Utilise « Je n’ai pas compris » si une étape est difficile. Termine par l’entraînement de dix questions.');
 }
 function openCourses(ch){
  const courses=onlyCourses(ch);
  const view=frame('Cours ENT · '+ch.replace(' (EMC)',''),'Les séances authentiques du professeur, classées chronologiquement.',()=>openChapter(ch),'Retour au chapitre');
  nav(view,ch,'ent');
  const list=panel(view,'Choisis une séance');
  for(const c of courses){
   const row=button('',()=>openCourse(ch,c),'spx-row');
   row.append(make('span','ENT','spx-chip'));
   const labels=make('span');labels.append(make('strong',courseTitle(c)),make('small','Cours et consignes vérifiés dans l’ENT'));
   row.append(labels,make('span','Ouvrir →'));list.append(row);
  }
 }
 function openCourse(ch,c){
  const view=frame('Cours ENT · '+fr(c.date),c.title,()=>openCourses(ch),'Tous les cours ENT du chapitre');
  nav(view,ch,'ent');
  const p=panel(view,'Séance du professeur','SOURCE ENT · '+fr(c.date));
  add(p,'p','Référence ENT : '+c.entId);
  if(c.originalText){add(p,'h4','Texte original relevé');add(p,'p',c.originalText);}
  else if(c.summary){add(p,'p','Le texte complet de cette séance n’a pas été retrouvé. Le titre et les consignes ci-dessous proviennent de l’ENT.','lesson-caution');add(p,'p',c.summary);}
  else add(p,'p','Seule la date de la séance a été relevée dans l’ENT. Aucun texte de cours n’est inventé.');
  const tasks=homeworkForCourse(c,pack);
  if(tasks.length){
   const due=panel(view,'Devoirs liés à cette séance','DATE DE REMISE ≠ DATE DU COURS');
   for(const h of tasks){
    const line=make('div',undefined,'emc-task');
    add(line,'h4',h.title+' · Pour le '+fr(h.due));
    if(h.content)add(line,'p',h.content);
    if(h.originalText){add(line,'h4','Texte original ENT');add(line,'p',h.originalText);}
    due.append(line);
   }
  }
  const attachments=(pack.attachments||[]).filter(d=>d.target===c.id);
  if(attachments.length){
   const docs=panel(view,'Pièces jointes du professeur');
   const slot=make('div');docs.append(slot);
   window.TIM_HG_DOCUMENTS?.render(c.id,slot);
  }
  view.append(button('Lire la leçon BIS expliquée',()=>openBis(ch),'spx-button'));
 }
 function openBis(ch){
  const bis=onlyBis(ch);
  const view=frame('Leçon BIS · '+ch.replace(' (EMC)',''),'Explications simplifiées, schéma et exemples guidés.',()=>openChapter(ch),'Retour au chapitre');
  nav(view,ch,'bis');
  for(const b of bis){
   const p=panel(view,b.title,'LEÇON BIS · EXPLICATIONS');
   bisContent(p,b);
  }
  const next=panel(view,'Après avoir compris');
  add(next,'p','Entraîne-toi ensuite sur dix questions, une seule validation par exercice. Pour rédiger, utilise des phrases complètes et explique la règle ou le fait historique.');
  next.append(button('Je n’ai pas compris',()=>openHelp(ch),'spx-button subtle'),button('Faire les exercices',()=>openTraining(ch),'spx-button'));
 }
 function openHelp(ch){
  const view=frame('Je n’ai pas compris',ch.replace(' (EMC)','')+' · Une explication plus simple, étape par étape.',()=>openChapter(ch),'Retour au chapitre');
  nav(view,ch,'help');
  const p=panel(view,'Reprendre une notion','AIDE À LA COMPRÉHENSION');
  for(const b of onlyBis(ch)){
   add(p,'h4',b.title);
   for(const [i,step] of b.help.entries())add(p,'p',(i+1)+'. '+step);
   add(p,'h4','Exemple de réponse complète');
   for(const [q,a] of b.examples.slice(0,1))add(p,'p',q+' — '+a);
  }
  add(p,'p','Si une difficulté reste, reviens au cours ENT et à la leçon BIS. Aucune correction anticipée des exercices notés n’est affichée.');
  p.append(button('Revoir la leçon BIS',()=>openBis(ch),'spx-button subtle'));
 }
 function openEntTasks(ch){
  const view=frame('Devoirs et exercices ENT',ch.replace(' (EMC)','')+' · Consignes originales, séparées des entraînements créés.',()=>openChapter(ch),'Retour au chapitre');
  nav(view,ch,'entex');
  const tasks=recordFor(ch);
  if(!tasks.length){const p=panel(view,'Aucune consigne détaillée');add(p,'p','Les documents disponibles ne contiennent pas de devoir précisément rattaché à ce chapitre. Aucun exercice du professeur n’est inventé.');}
  else for(const h of tasks){
   const p=panel(view,h.title,'ENT · POUR LE '+fr(h.due));
   if(h.content)add(p,'p',h.content);
   if(h.originalText){add(p,'h4','Texte original du professeur');add(p,'p',h.originalText);}
   else add(p,'p','Énoncé complet non fourni dans la collecte.','lesson-caution');
  }
  add(view,'p','Ces consignes ENT ne sont pas les questionnaires BIS notés du classeur.','spx-note');
 }
 function openTraining(ch){
  const bs=onlyBis(ch);
  const view=frame('Exercices d’entraînement',ch.replace(' (EMC)','')+' · Deux questionnaires distincts de dix questions.',()=>openChapter(ch),'Retour au chapitre');
  nav(view,ch,'train');
  const p=panel(view,'QCM et réponses écrites','2 × 10 QUESTIONS · 0 XP');
  add(p,'p','Une seule tentative pour Tim, note sur 10 et correction après validation. Pour les erreurs, la méthode et la leçon à revoir sont indiquées. Le Parent peut faire un essai sans note ni XP enregistrés.');
  const slot=make('div',undefined,'emc-training-slot');
  for(const b of bs)for(let n=1;n<=2;n++){
   const id='HGQ_L'+b.id.slice(-2)+'_0'+n;
   p.append(button(n===1?'Exercice 1 · Comprendre (QCM)':'Exercice 2 · Répondre par écrit',()=>{
    slot.replaceChildren();
    if(!window.TIM_HG_TRAINING?.mount){add(slot,'p','Entraînement indisponible : aucun résultat n’est enregistré.');return;}
    Promise.resolve(window.TIM_HG_TRAINING.mount(id,slot)).catch(err=>add(slot,'p','Impossible de charger l’exercice : '+String(err.message||err)));
   },'spx-button subtle'));
  }
  p.append(slot);
  const method=panel(view,'Besoin de revoir la méthode ?');
  method.append(button('Ouvrir la leçon BIS',()=>openBis(ch),'spx-button subtle'));
 }
 function showResults(){
  const view=frame('Mes notes et corrections EMC','Historique des exercices EMC seulement, sans mélanger les autres chapitres d’histoire-géographie.',home,'Tous les thèmes EMC');
  const p=panel(view,'Mes résultats EMC');
  const slot=make('div');p.append(slot);
  if(!window.TIM_HG_TRAINING?.renderProgress)add(slot,'p','Les résultats sont actuellement indisponibles.');
  else Promise.resolve(window.TIM_HG_TRAINING.renderProgress(slot,{emcOnly:true})).catch(err=>add(slot,'p','Suivi indisponible : '+String(err.message||err)));
 }
 if(!pack||!chapters.length){frame('EMC','Les cours d’EMC sont temporairement indisponibles.',opts.back,'Toutes les matières');return;}
 if(opts.openLessonId){
  const lessonId=String(opts.openLessonId);
  const b=pack.bis.find(x=>x.id===lessonId&&chapters.includes(x.group));
  if(b){openBis(b.group);return;}
  const course=pack.lessons.find(x=>(x.id===lessonId||x.entId===lessonId)&&chapters.includes(x.chapter));
  if(course){openCourse(course.chapter,course);return;}
 }
 home();
}
function render(root,opts={}){
 if(opts.emcOnly===true)return renderEmc(root,opts);
 const pack=window.TIM_HG_PACK;
 const emcOnly=opts.emcOnly===true;
 const visibleChapters=(pack?.chapters||[]).filter(x=>!emcOnly||/\(EMC\)/.test(x));
 const visibleLessons=(pack?.lessons||[]).filter(x=>visibleChapters.includes(x.chapter));
 const visibleBis=(pack?.bis||[]).filter(x=>visibleChapters.includes(x.group));
 root.replaceChildren(btn('← Toutes les matières',()=>opts.back?.()),E('h2',emcOnly?'EMC — Mes leçons':'Histoire-géographie — Mes leçons'));
 if(!visibleLessons.length){add(root,'p',emcOnly?'Aucune séance EMC identifiée dans le classeur pour le moment.':'Le dossier Histoire-géographie est temporairement indisponible.');return;}
 add(root,'p',visibleLessons.length+' séances ENT classées par date · '+visibleBis.length+' leçons BIS · '+((visibleBis.length*2+(visibleBis.some(b=>b.id==='HG_BIS09')?1:0)))+' exercices de 10 questions.');
 add(root,'p',emcOnly?'Les cours EMC déjà archivés dans Histoire-géographie sont présentés ici sans duplication de copies, notes ou XP. Les documents ENT et les leçons BIS restent distincts.':'Archives ENT du 12 novembre et collecte ciblée du 13. Si le professeur ne donne qu’un titre, la leçon BIS est un ajout distinct : aucun texte officiel n’est inventé.','lesson-caution');
 if(!emcOnly&&window.__TIM_PARENT&&!window.__TIM_GUEST&&window.TIM_HG_DOCUMENTS?.parentImport)root.append(window.TIM_HG_DOCUMENTS.parentImport());
 const exam=pack.homework.find(h=>h.due==='2026-11-18'&&/évaluation/i.test(h.title));
 if(exam){const panel=E('section',undefined,'panel');
  add(panel,'h3','Évaluation d’EMC annoncée — mercredi 18 novembre');
  add(panel,'p','L’ENT mentionne « évaluation EMC », sans préciser son sujet exact. Les leçons sur les principes républicains, la loi Veil et les institutions européennes fournissent une révision, mais le programme de contrôle n’est pas confirmé.');
  root.append(panel);}
 for(const chapter of visibleChapters){
  const rows=pack.lessons.filter(x=>x.chapter===chapter),bis=pack.bis.filter(b=>b.group===chapter);
  const chosen=bis.find(b=>b.id===opts.openLessonId);
  const courseFor=chosen?(rows.find(c=>c.date===chosen.date)||rows[rows.length-1]):null;
  const group=E('details',undefined,'chapter-section');group.style.cssText='border:1px solid #51617c;padding:13px;margin:14px 0;border-radius:14px';
  group.append(E('summary',chapter+' · '+rows.length+' séance(s) ENT · '+bis.length+' fiche(s) BIS'));
  const listing=E('div');group.append(listing);
  for(const course of rows){
   const item=session(course,bis,pack);listing.append(item.details);
   if(opts.openLessonId===course.id||opts.openLessonId===course.entId||(chosen&&courseFor?.id===course.id)){
    group.open=true;item.details.open=true;item.openTab(chosen?'bis':'ent');
   }
  }
  if(!opts.openLessonId&&chapter==='Nazisme : dictature et persécutions'&&!emcOnly){group.open=true;listing.lastElementChild?.setAttribute('open','');}
  if(!opts.openLessonId&&emcOnly&&chapter===visibleChapters[0])group.open=true;
  root.append(group);
 }
 const missing=E('details',undefined,'panel');missing.append(E('summary','Documents ENT manquants ou incomplets'));
 for(const m of pack.missing)add(missing,'p','• '+m);
 root.append(missing);
 const progress=E('details',undefined,'panel');progress.append(E('summary',emcOnly?'Notes et corrections EMC (historique partagé avec Histoire-géographie)':'Notes, copies et corrections en histoire-géographie'));
 const slot=E('div');progress.append(slot);progress.addEventListener('toggle',()=>{if(progress.open)window.TIM_HG_TRAINING?.renderProgress(slot)});root.append(progress);
 const sources=E('details',undefined,'panel');sources.append(E('summary','Références pour vérifier les leçons BIS'));
 for(const item of pack.sources){const p=E('p');const a=E('a',item.title);a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);sources.append(p);}root.append(sources);
}
window.TIM_HG_PATH={render};
})();
