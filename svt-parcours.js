/* SVT : parcours des séances ENT et sept leçons pédagogiques, cinq onglets.
   Original et ajout pédagogique ne sont jamais présentés comme la même chose. */
(function(){'use strict';
const E=(tag,txt,cls='')=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=String(txt);if(cls)e.className=cls;return e;};
const add=(root,tag,txt,cls='')=>{const x=E(tag,txt,cls);root.append(x);return x;};
const button=(title,cb,cls='plain')=>{const e=E('button',title,cls);e.type='button';e.onclick=cb;e.style.cssText='min-height:44px;margin:4px;padding:9px 13px;white-space:normal';return e;};
const date=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
const diagrams={
 microbes:{desc:'Micro-organismes utiles et pathogènes',words:['Microbes','Utile','Pathogène'],nodes:[[75,72,26,'#71cbb8'],[180,72,26,'#bfdc7c'],[285,72,26,'#e99a93']]},
 barriers:{desc:'Barrières : peau intacte, blessure et contamination',words:['Peau','Blessure','Entrée'],nodes:[[75,72,29,'#84b9da'],[180,72,29,'#efcc82'],[285,72,29,'#df9e9a']]},
 graph:{desc:'Graphique fictif : une quantité augmente de deux à six',words:['Début : 2','Fin : 6','+ 4'],nodes:[[75,82,24,'#8ab8d8'],[180,62,24,'#8ab8d8'],[285,39,24,'#8ab8d8']]},
 petri:{desc:'Boîte de Petri, halos autour de pastilles',words:['Pastille','Halo','Bactérie'],nodes:[[75,72,25,'#f3dca1'],[180,72,33,'#a8e0ce'],[285,72,25,'#e2c59b']]},
 blood:{desc:'Globules rouges et globules blancs représentés par des cellules',words:['Hématie','Leucocyte','Sang'],nodes:[[75,72,27,'#e67c7c'],[180,72,33,'#a7bde7'],[285,72,21,'#e67c7c']]},
 inflammation:{desc:'Blessure : alerte et arrivée de leucocytes',words:['Épine','Alerte','Défense'],nodes:[[75,72,25,'#e5a09a'],[180,72,28,'#e8d28e'],[285,72,28,'#b5cbe6']]},
 phago:{desc:'Les quatre étapes simplifiées de la phagocytose',words:['1. Repérer','2. Englober','3. Digérer','4. Rejeter'],nodes:[[49,67,23,'#b6d2e1'],[139,67,27,'#b6d2e1'],[229,67,31,'#b6d2e1'],[319,67,23,'#b6d2e1']]}
};
function draw(kind){
 const spec=diagrams[kind];if(!spec)return null;
 const box=E('section');box.style.cssText='background:#f0f7fc;border:1px solid #b8d4e6;border-radius:13px;padding:10px;margin:13px 0;color:#24465b';
 add(box,'strong','Schéma pédagogique simplifié (non issu du document ENT)');
 const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');
 svg.setAttribute('viewBox','0 0 370 143');svg.setAttribute('width','100%');svg.setAttribute('role','img');svg.setAttribute('aria-label',spec.desc);
 const shape=(type,attrs,txt)=>{
  const n=document.createElementNS(NS,type);
  for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));
  if(txt!==undefined)n.textContent=txt;svg.append(n);return n;
 };
 for(let i=0;i<spec.nodes.length;i++){
  const [x,y,r,fill]=spec.nodes[i];
  shape('circle',{cx:x,cy:y,r,fill,stroke:'#527b93','stroke-width':'2'});
  if(kind==='phago'){
   if(i===0)shape('circle',{cx:x+31,cy:y-15,r:7,fill:'#ca6565'});
   else if(i===1)shape('circle',{cx:x+12,cy:y-8,r:7,fill:'#ca6565'});
   else if(i===2)shape('circle',{cx:x+6,cy:y-4,r:5,fill:'#e8ab9e'});
   else shape('circle',{cx:x+31,cy:y-18,r:4,fill:'#e8ab9e'});
  }
  shape('text',{x,y:123,'text-anchor':'middle',fill:'#224157','font-size':kind==='phago'?11:13},spec.words[i]);
  if(i<spec.nodes.length-1)shape('text',{x:x+((spec.nodes[i+1][0]-x)/2),y:75,'text-anchor':'middle','font-size':21,fill:'#507e93'},'→');
 }
 box.append(svg);
 add(box,'p','Dessins réalisés pour expliquer le mécanisme, sans prétendre reproduire le schéma de Mme Vidon.');
 return box;
}
function showBis(root,bis){
 for(const b of bis){
  add(root,'h4',b.title);
  add(root,'p',b.rule);
  root.append(draw(b.diagram));
  add(root,'h4','Comprendre en trois étapes');
  for(const [i,step] of b.steps.entries())add(root,'p',(i+1)+'. '+step);
  add(root,'h4','Exemples guidés');
  for(const [q,a] of b.examples){const block=E('p');block.append(E('strong',q+' — '),document.createTextNode(a));root.append(block);}
  if(b.id==='SVT_BIS07'){
   add(root,'h4','Comment écrire un résultat en SVT ?');
   add(root,'p','Je vois que la peau autour de l’épine est rouge et gonflée. Or je sais que ce sont deux signes de l’inflammation. J’en déduis qu’une réaction immunitaire rapide se déclenche à cet endroit.');
   add(root,'p','Important : ne saute pas « Or je sais ». Une bonne conclusion doit être justifiée par une connaissance du cours.');
  }
  if(b.id==='SVT_BIS03')add(root,'p','Exemple du graphique fictif : je lis les unités, je relève les deux valeurs puis je calcule 6 − 2 = 4. J’écris : « La quantité a augmenté de 4 unités. »');
 }
}
function courseTabs(course,bis,pack){
 const details=E('details',undefined,'tim-es-lesson');
 details.style.cssText='background:#18243c;border:1px solid #5b6983;border-radius:13px;margin:10px 0;padding:12px';
 details.append(E('summary',date(course.date)+' — '+course.title));
 const tabs=E('div');tabs.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:10px 0';
 const content=E('section','', 'panel');content.style.cssText='margin-top:8px';details.append(tabs,content);
 let selected=null;
 function openTab(tab){
  selected=tab;content.replaceChildren();
  for(const t of tabs.children){const active=t.dataset.tab===tab;t.style.background=active?'#d8fc67':'#34415e';t.style.color=active?'#152039':'#fff';}
  if(tab==='ent'){
   add(content,'h3','1 · Leçon ENT — Mme Vidon');
   add(content,'p','Séance '+date(course.date)+' · référence '+course.entId,'subtle');
   add(content,'p','Synthèse du contenu relevé dans l’archive ENT. Ce résumé n’est pas une transcription littérale complète ; la copie originale demeure dans l’archive privée.','lesson-caution');
   add(content,'p',course.original);
   const due=pack.homework.filter(h=>h.due===course.date);
   if(due.length){add(content,'h4','Consignes ENT pour cette date');for(const item of due)add(content,'p',item.title+' : '+item.content);}
   if(due.length)add(content,'p','Le statut « fait » ou « non fait » de ces devoirs n’a pas été vérifié.');
   const slot=E('div');content.append(slot);window.TIM_SVT_DOCUMENTS?.render(course.id,slot);
  }else if(tab==='bis'){
   add(content,'h3','2 · Leçon BIS — explications simplifiées');
   showBis(content,bis);
  }else if(tab==='help'){
   add(content,'h3','3 · Je n’ai pas compris');
   for(const b of bis){
    add(content,'h4',b.title);
    for(const step of b.help)add(content,'p','• '+step);
    add(content,'p','Méthode : lis l’exemple, explique ce que tu as compris avec tes mots, puis réponds à une question courte.');
   }
  }else if(tab==='entex'){
   add(content,'h3','4 · Exercices et documents ENT');
   const tasks=pack.homework.filter(h=>h.due===course.date);
   for(const t of tasks)add(content,'p',t.title+' ('+date(t.due)+') : '+t.content);
   if(!tasks.length)add(content,'p','Aucun exercice du professeur détaillé dans le relevé de cette séance.');
   const docs=pack.attachments.filter(d=>d.target===course.id);
   if(docs.length){add(content,'p','Pièce originale : '+docs.map(d=>d.name).join(' ; '));const slot=E('div');content.append(slot);window.TIM_SVT_DOCUMENTS?.render(course.id,slot);}
   if(course.date==='2026-09-14'||course.date==='2026-09-22')add(content,'p','Les tableaux ou graphiques originaux mentionnés dans l’ENT ne sont pas présents dans l’archive. Aucun exercice officiel n’a été inventé.');
  }else if(tab==='train'){
   add(content,'h3','5 · Exercices d’entraînement BIS');
   add(content,'p','Deux exercices de 10 questions par leçon : reconnaître les notions, puis écrire des réponses. Note sur 10 et corrigé immédiat. Une seule tentative pour Tim ; essai Parent sans enregistrer.');
   const actions=E('div'),slot=E('div');content.append(actions,slot);
   for(const b of bis)for(let x=1;x<=2;x++){
    const id='SVQ_L'+b.id.slice(-2)+'_0'+x;
    actions.append(button(b.title+' · '+(x===1?'QCM de compréhension':'Réponses écrites'),()=>{
     slot.replaceChildren();
     if(!window.TIM_SVT_TRAINING?.mount){add(slot,'p','Service des questionnaires momentanément indisponible.');return;}
     window.TIM_SVT_TRAINING.mount(id,slot);
    }));
   }
  }
 }
 for(const [tab,label] of [['ent','Leçon ENT'],['bis','Leçon BIS'],['help','Je n’ai pas compris'],['entex','Exercices ENT'],['train','Entraînement']]){
  const b=button(label,()=>openTab(tab));b.dataset.tab=tab;tabs.append(b);
 }
 details.addEventListener('toggle',()=>{if(details.open&&!selected)openTab('ent');});
 return {details,openTab};
}
function render(root,opts={}){
 const pack=window.TIM_SVT_PACK;
 root.replaceChildren(button('← Toutes les matières',()=>opts.back?.()),E('h2','SVT — Mes leçons'));
 if(!pack?.lessons?.length){add(root,'p','Les données SVT sont momentanément indisponibles.');return;}
 add(root,'p',pack.lessons.length+' séances ENT datées · '+pack.bis.length+' leçons BIS · 14 exercices de 10 questions.');
 add(root,'p','Archive du 12 novembre (avec consignes du 13). Les textes des séances affichés sont des synthèses, pas les documents intégraux.', 'lesson-caution');
 if(window.__TIM_PARENT&&!window.__TIM_GUEST&&window.TIM_SVT_DOCUMENTS?.parentImport)root.append(window.TIM_SVT_DOCUMENTS.parentImport());
 for(const chapter of pack.chapters){
  const rows=pack.lessons.filter(s=>s.chapter===chapter),bis=pack.bis.filter(b=>b.group===chapter);
  const chosen=bis.find(b=>b.id===opts.openLessonId);
  const associated=chosen?(rows.find(s=>s.date===chosen.date)||rows[rows.length-1]):null;
  const box=E('details',undefined,'chapter-section');box.style.cssText='border:1px solid #51617c;padding:12px;margin:13px 0;border-radius:13px';
  box.append(E('summary',chapter+' · '+rows.length+' séance(s) · '+bis.length+' BIS'));
  const list=E('div');box.append(list);
  for(const course of rows){
   const item=courseTabs(course,bis,pack);list.append(item.details);
   if(opts.openLessonId===course.id||opts.openLessonId===course.entId||Boolean(associated&&associated.id===course.id)){
    box.open=true;item.details.open=true;item.openTab(chosen?'bis':'ent');
   }
  }
  if(!opts.openLessonId&&chapter==='Phagocytose'){box.open=true;list.lastElementChild?.setAttribute('open','');}
  root.append(box);
 }
 const docs=E('details',undefined,'panel');docs.append(E('summary','Documents mentionnés mais non récupérés dans l’ENT'));
 for(const missing of pack.missing)add(docs,'p','• '+missing);
 root.append(docs);
 const progress=E('details',undefined,'panel');progress.append(E('summary','Mes notes, copies et corrections SVT'));
 const slot=E('div');progress.append(slot);progress.addEventListener('toggle',()=>{if(progress.open)window.TIM_SVT_TRAINING?.renderProgress(slot)});
 root.append(progress);
}
window.TIM_SVT_PATH={render};
})();
