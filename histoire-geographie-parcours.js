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
   const due=pack.homework.filter(h=>h.due===course.date||h.lessonEntId===course.entId);
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
   const tasks=pack.homework.filter(h=>h.due===course.date||h.lessonEntId===course.entId);
   if(!tasks.length)add(pane,'p','Pas d’exercice détaillé du professeur rattaché à cette séance.');
   for(const h of tasks){add(pane,'p','Consigne pour le '+fr(h.due)+' — '+h.title+' : '+h.content);if(h.originalText){add(pane,'h4','Transcription ENT à recopier');add(pane,'p',h.originalText);}}
   const attached=pack.attachments.filter(d=>d.target===course.id);
   if(attached.length){add(pane,'p','Document original : '+attached.map(d=>d.name).join(' ; '));const area=E('div');pane.append(area);window.TIM_HG_DOCUMENTS?.render(course.id,area);}
   if(/schéma|carte|tableau/i.test(course.title)&&!attached.length)add(pane,'p','La carte, le schéma ou le tableau exact n’est pas joint dans la collecte. Aucun exercice ENT inventé.');
  }else if(tab==='train'){
   add(pane,'h3','5 · Exercices BIS interactifs');
   add(pane,'p','Deux exercices de dix questions : QCM pour comprendre, puis réponses écrites. Une seule tentative Tim, note et correction expliquée ; essai Parent non enregistré.');
   const actions=E('div'),slot=E('div');pane.append(actions,slot);
   for(const b of bis)for(let i=1;i<=2;i++){
    const id='HGQ_L'+b.id.slice(-2)+'_0'+i;
    actions.append(btn(b.title+' · '+(i===1?'QCM de compréhension':'Réponses écrites'),()=>{
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
function render(root,opts={}){
 const pack=window.TIM_HG_PACK;
 root.replaceChildren(btn('← Toutes les matières',()=>opts.back?.()),E('h2','Histoire-géographie — Mes leçons'));
 if(!pack?.lessons?.length){add(root,'p','Le dossier Histoire-géographie est temporairement indisponible.');return;}
 add(root,'p',pack.lessons.length+' séances ENT classées par date · '+pack.bis.length+' leçons BIS · '+(pack.bis.length*2)+' exercices de 10 questions.');
 add(root,'p','Archives ENT du 12 novembre et collecte ciblée du 13. Si le professeur ne donne qu’un titre, la leçon BIS est un ajout distinct : aucun texte officiel n’est inventé.','lesson-caution');
 if(window.__TIM_PARENT&&!window.__TIM_GUEST&&window.TIM_HG_DOCUMENTS?.parentImport)root.append(window.TIM_HG_DOCUMENTS.parentImport());
 const exam=pack.homework.find(h=>h.due==='2026-11-18'&&/évaluation/i.test(h.title));
 if(exam){const panel=E('section',undefined,'panel');
  add(panel,'h3','Évaluation d’EMC annoncée — mercredi 18 novembre');
  add(panel,'p','L’ENT mentionne « évaluation EMC », sans préciser son sujet exact. Les leçons sur les principes républicains, la loi Veil et les institutions européennes fournissent une révision, mais le programme de contrôle n’est pas confirmé.');
  root.append(panel);}
 for(const chapter of pack.chapters){
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
  if(!opts.openLessonId&&chapter==='Nazisme : dictature et persécutions'){group.open=true;listing.lastElementChild?.setAttribute('open','');}
  root.append(group);
 }
 const missing=E('details',undefined,'panel');missing.append(E('summary','Documents ENT manquants ou incomplets'));
 for(const m of pack.missing)add(missing,'p','• '+m);
 root.append(missing);
 const progress=E('details',undefined,'panel');progress.append(E('summary','Notes, copies et corrections en histoire-géographie'));
 const slot=E('div');progress.append(slot);progress.addEventListener('toggle',()=>{if(progress.open)window.TIM_HG_TRAINING?.renderProgress(slot)});root.append(progress);
 const sources=E('details',undefined,'panel');sources.append(E('summary','Références pour vérifier les leçons BIS'));
 for(const item of pack.sources){const p=E('p');const a=E('a',item.title);a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);sources.append(p);}root.append(sources);
}
window.TIM_HG_PATH={render};
})();
