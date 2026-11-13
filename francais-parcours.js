/* Français : cours ENT archivés et leçons BIS séparés. Les schémas sont
   des représentations pédagogiques, jamais des copies du professeur. */
(function(){'use strict';
const E=(tag,txt,cls='')=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=String(txt);if(cls)x.className=cls;return x;};
const add=(root,tag,txt,cls='')=>{const x=E(tag,txt,cls);root.append(x);return x;};
const button=(t,on)=>{const x=E('button',t,'plain');x.type='button';x.onclick=on;x.style.cssText='min-height:44px;margin:4px;padding:9px 13px;white-space:normal';return x;};
const date=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
const DIAGRAMS={
syntax:['Phrase','Nature','Fonction'],portrait:['Auteur','Narrateur','Personnage'],agreement:['Sujet','Noyau','Verbe'],
dnb:['Répondre','Citer','Expliquer'],memory:['Situation','Émotion','Souvenir'],times:['Avant','Pendant','Après'],
participle:['Participe','Auxiliaire','Accord'],argument:['Thèse','Argument','Exemple'],image:['Je vois','J’interprète','Je déduis'],
reading:['Faits','Indices','Interprétation'],fable:['Récit','Choix','Morale']
};
function draw(type){
 const names=DIAGRAMS[type];if(!names)return E('p','Aucune illustration.');
 const p=E('section',undefined,'fr-bis-diagram');
 p.style.cssText='background:#eff6fd;color:#294357;border:1px solid #b9d3e5;border-radius:14px;padding:11px;margin:12px 0';
 add(p,'strong','Petit schéma explicatif BIS (non issu du fichier ENT)');
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 370 120');svg.setAttribute('width','100%');svg.setAttribute('role','img');svg.setAttribute('aria-label',names.join(' puis '));
 const part=(tag,attr,text)=>{
  const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attr))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;svg.append(n);
 };
 names.forEach((label,i)=>{
  const x=7+i*122;
  part('rect',{x,y:29,width:111,height:64,rx:11,stroke:'#688da8','stroke-width':1.2,fill:['#cae2ef','#deebcf','#f4e1c8'][i]});
  part('text',{x:x+55,y:64,'font-size':label.length>14?10:13,'font-weight':'bold','text-anchor':'middle',fill:'#254a62'},label);
  if(i<2)part('path',{d:'M '+(x+112)+' 61 l 7 0 m -4 -4 l 4 4 l -4 4',stroke:'#416f84','stroke-width':1.8,fill:'none'});
 });
 p.append(svg);return p;
}
function showBis(root,items){
 for(const b of items){
  add(root,'h3',b.title);add(root,'p',b.rule);root.append(draw(b.diagram));
  add(root,'h4','Je comprends : les étapes');
  b.steps.forEach((line,i)=>add(root,'p',(i+1)+'. '+line));
  add(root,'h4','Exemples guidés');
  for(const [title,text] of b.examples){const p=E('p');p.append(E('strong',title+' — '),document.createTextNode(text));root.append(p);}
  if(b.id==='FR_BIS07'){
   add(root,'h4','Comment écrire une réponse avec une explication ?');
   add(root,'p','« J’écris mise avec un e, car “que” reprend “robe” : ce COD féminin singulier est placé avant l’auxiliaire avoir. »');
  }
  if(b.id==='FR_BIS09'){
   add(root,'h4','Un brouillon en trois lignes pour analyser une image');
   add(root,'p','1. Je vois : détails réels observés. 2. J’interprète : ce que symbolisent ces détails. 3. J’en déduis : thèse implicite justifiée.');
   add(root,'p','Il faut ouvrir le PDF du professeur pour décrire les objets et personnages exacts de chaque image.');
  }
  if(b.id==='FR_BIS10')add(root,'p','Le texte intégral de l’édition Nathan de L’Étranger n’est pas présent dans l’ENT : cette fiche n’en reproduit pas des passages.');
 }
}
function courseTabs(course,chapterBis,pack){
 const node=E('details',undefined,'tim-es-lesson');
 node.style.cssText='background:#18243c;border:1px solid #536784;border-radius:13px;margin:10px 0;padding:12px';
 node.append(E('summary',date(course.date)+' — '+course.title));
 const tabs=E('div');tabs.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:10px 0';
 const pane=E('section',undefined,'panel');pane.style.cssText='margin:7px 0';node.append(tabs,pane);
 let current=null;
 async function tab(name){
  current=name;pane.replaceChildren();
  for(const b of tabs.children){
   const active=b.dataset.tab===name;b.style.background=active?'#dbf87d':'#34415e';b.style.color=active?'#1d313e':'#fff';
  }
  if(name==='ent'){
   add(pane,'h3','1 · Leçon ENT — '+(course.teacher==='SIMIEZ'?'M. Simiez':'M. Lunel'));
   add(pane,'p','Séance du '+date(course.date)+' · référence '+course.entId);
   add(pane,'p','Le passage ci-dessous résume les informations disponibles dans l’archive ENT. Ce n’est pas une transcription mot pour mot ni le manuel original.','lesson-caution');
   add(pane,'p',course.original);
   const docs=E('div');pane.append(docs);
   if(pack.attachments.some(x=>x.target===course.id))await window.TIM_FR_DOCUMENTS?.render(course.id,docs);
  }else if(name==='bis'){
   add(pane,'h3','2 · Leçon BIS — explication simplifiée');showBis(pane,chapterBis);
  }else if(name==='help'){
   add(pane,'h3','3 · Je n’ai pas compris');
   for(const b of chapterBis){add(pane,'h4',b.title);b.help.forEach(line=>add(pane,'p','• '+line));}
   add(pane,'p','Lis l’explication, réécris un exemple et ouvre ensuite un exercice de 10 questions.');
  }else if(name==='entex'){
   add(pane,'h3','4 · Devoirs et exercices ENT');
   const due=pack.homework.filter(h=>h.due===course.date);
   if(!due.length)add(pane,'p','Aucune consigne de devoir avec ce jour précis dans le relevé.');
   for(const h of due){
    add(pane,'p',date(h.due)+' — '+h.title+' : '+h.content);
    const documents=E('div');pane.append(documents);
    if(pack.attachments.some(x=>x.target===h.id))await window.TIM_FR_DOCUMENTS?.render(h.id,documents);
   }
   const courseDocs=E('div');pane.append(courseDocs);
   if(pack.attachments.some(x=>x.target===course.id))await window.TIM_FR_DOCUMENTS?.render(course.id,courseDocs);
   add(pane,'p','Les PDF sont des documents originaux du professeur ; les questionnaires BIS sont des entraînements créés.');
  }else if(name==='train'){
   add(pane,'h3','5 · Entraînement interactif');
   add(pane,'p','Deux exercices de dix questions : compréhension/QCM puis réponse écrite. Une seule tentative pour Tim ; essai Parent non enregistré.');
   const actions=E('div'),slot=E('div');pane.append(actions,slot);
   for(const b of chapterBis)for(let s=1;s<=2;s++){
    const id='FRQ_L'+b.id.slice(-2)+'_0'+s;
    actions.append(button(b.title+' · '+(s===1?'QCM de compréhension':'Réponses écrites'),()=>{
     slot.replaceChildren();
     if(!window.TIM_FR_TRAINING?.mount){add(slot,'p','Questionnaire indisponible.');return;}
     Promise.resolve(window.TIM_FR_TRAINING.mount(id,slot)).catch(e=>add(slot,'p','Service indisponible : '+(e.message||e)));
    }));
   }
  }
 }
 for(const [key,label] of [['ent','Leçon ENT'],['bis','Leçon BIS'],['help','Je n’ai pas compris'],['entex','Exercices ENT'],['train','Entraînement']]){
  const b=button(label,()=>tab(key));b.dataset.tab=key;tabs.append(b);
 }
 node.addEventListener('toggle',()=>{if(node.open&&!current)tab('ent');});
 return {node,tab};
}
function render(root,options={}){
 const pack=window.TIM_FR_PACK;
 root.replaceChildren(button('← Toutes les matières',()=>options.back?.()),E('h2','Français — Mes leçons'));
 if(!pack){add(root,'p','Le dossier français n’est pas chargé.');return;}
 add(root,'p',pack.lessons.length+' séances ENT archivées · '+pack.bis.length+' leçons BIS · 22 exercices interactifs.');
 add(root,'p','Deux enseignants : M. Lunel (langue et littérature) et M. Simiez (argumentation). Les cours futurs sans publication restent indiqués comme prévus, pas comme terminés.','lesson-caution');
 if(window.__TIM_PARENT&&!window.__TIM_GUEST&&window.TIM_FR_DOCUMENTS?.parentImport)root.append(window.TIM_FR_DOCUMENTS.parentImport());
 const next=E('section',undefined,'panel');
 add(next,'h3','Devoir annoncé : dictée du lundi 16 novembre');
 add(next,'p','L’ENT mentionne une dictée mensuelle, sans fournir le texte à dicter. Révisions conseillées : accords sujet-verbe et participe passé. L’énoncé exact reste inconnu.');
 root.append(next);
 for(const chapter of pack.chapters){
  const rows=pack.lessons.filter(x=>x.chapter===chapter),bis=pack.bis.filter(b=>b.group===chapter);
  const selected=bis.find(x=>x.id===options.openLessonId),course=selected?(rows.find(x=>x.date===selected.date)||rows[rows.length-1]):null;
  const group=E('details',undefined,'chapter-section');group.style.cssText='margin:14px 0;padding:13px;border:1px solid #536784;border-radius:14px';
  group.append(E('summary',chapter+' · '+rows.length+' séance(s) ENT · '+bis.length+' fiche(s) BIS'));
  const list=E('div');group.append(list);
  for(const l of rows){
   const item=courseTabs(l,bis,pack);list.append(item.node);
   if(options.openLessonId===l.id||options.openLessonId===l.entId||Boolean(selected&&course?.id===l.id)){
    group.open=true;item.node.open=true;item.tab(selected?'bis':'ent');
   }
  }
  if(!options.openLessonId&&chapter==='Accord du participe passé'){group.open=true;}
  root.append(group);
 }
 const missing=E('details',undefined,'panel');missing.append(E('summary','Documents et devoirs qui manquent encore'));
 for(const x of pack.missing)add(missing,'p','• '+x);
 root.append(missing);
 const progress=E('details',undefined,'panel');progress.append(E('summary','Mes notes et corrections en français'));
 const slot=E('div');progress.append(slot);progress.addEventListener('toggle',()=>{if(progress.open)window.TIM_FR_TRAINING?.renderProgress(slot);});root.append(progress);
}
window.TIM_FR_PATH={render};
})();
