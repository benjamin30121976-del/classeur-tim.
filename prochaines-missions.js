/* Mes prochaines missions — lecture seule des devoirs ENT déjà présents.
 * Aucun accès ENT direct, aucune écriture Firestore, aucun impact sur les XP,
 * les copies et les tentatives. Les bonus réutilisent le moteur existant.
 */
(function(){
'use strict';
let selected='all';
const E=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
const iso=/^\d{4}-\d{2}-\d{2}$/;
const text=x=>String(x==null?'':x).replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
function parisToday(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const p=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return p.year+'-'+p.month+'-'+p.day;
}
function dayNumber(d){if(!iso.test(d))return NaN;const [y,m,day]=d.split('-').map(Number);const ms=Date.UTC(y,m-1,day);return new Date(ms).toISOString().slice(0,10)===d?ms/86400000:NaN;}
function daysUntil(date,today){return dayNumber(date)-dayNumber(today);}
function formatDate(value){
 if(!iso.test(value))return String(value||'');
 const [y,m,d]=value.split('-').map(Number);
 return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));
}
const cap=x=>x.charAt(0).toLocaleUpperCase('fr')+x.slice(1);
function packAssignments(data){
 const sources=[
  ['Anglais',window.TIM_ANGLAIS_PACK?.homework],
  ['Espagnol',data?.metadata?.spanishEnt?.homework],
  ['Mathématiques',data?.metadata?.mathEnt?.homework],
  ['Mathématiques',window.TIM_MATHS_ENT_PACK?.homework],
  ['Physique-chimie',window.TIM_PHYSIQUE_PACK?.homework],
  ['SVT',window.TIM_SVT_PACK?.homework],
  ['Histoire-géographie',window.TIM_HG_PACK?.homework],
  ['Français',window.TIM_FR_PACK?.homework],
  // Compléments éventuels de l'import ENT ; les devoirs officiels restent des annonces, jamais de faux questionnaires.
  ['',data?.metadata?.timEntHomework],
  ['',data?.metadata?.entHomework],
  ['',(data?.exercises||[]).filter(ex=>ex?.category==='school' && ex?.homeworkDue)]
 ];
 const found=new Map();
 for(const [subject,list] of sources){
  if(!Array.isArray(list))continue;
  for(const h of list){
   if(!h||typeof h!=='object')continue;
   const subjectName=subject||text(h.subject||'');
   if(!subjectName)continue;
   const due=String(h.due||h.dueDate||h.dueDateTime||h.homeworkDue||'').slice(0,10);
   if(!iso.test(due)||!Number.isFinite(dayNumber(due)))continue;
   const id=String(h.entId||h.id||'');
   const title=text(h.title||h.label||'Travail à préparer');
   const description=text(h.content||h.description||h.instructions||'');
   const keys=new Set([id,String(h.id||''),String(h.entId||'')].filter(Boolean));
   const isExam=/(?:^|[^A-Za-zÀ-ÿ])(contr[oô]le|[eé]valuation|interro(?:gation)?|dict[eé]e|test)(?=$|[^A-Za-zÀ-ÿ])/i.test(title+' '+description);
   const key=(id||title.toLowerCase())+'|'+due+'|'+subjectName;
   if(!found.has(key))found.set(key,{id,keys,subject:subjectName,due,title,description,isExam,origin:'ENT'});
   else for(const identity of keys)found.get(key).keys.add(identity);
  }
 }
 return [...found.values()].sort((a,b)=>a.due.localeCompare(b.due)||a.subject.localeCompare(b.subject,'fr'));
}
function bonuses(data){
 return (Array.isArray(data?.exercises)?data.exercises:[])
  .filter(ex=>ex?.homeworkBonus===true&&Array.isArray(ex.questions)&&ex.questions.length>=10)
  .filter(ex=>iso.test(String(ex.homeworkDue||'')))
  .sort((a,b)=>String(a.homeworkDue).localeCompare(String(b.homeworkDue)));
}
function linked(ex,task){
 const ids=Array.isArray(ex.linkedHomework)?ex.linkedHomework.map(String):[];
 return ids.length>0&&ids.some(id=>task.keys.has(id));
}
function makeButton(label,action,cls=''){
 const b=E('button','future-action '+cls,label);b.type='button';b.addEventListener('click',action);return b;
}
function subjectClass(name){
 const n=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return n.startsWith('anglais')?'anglais':n.startsWith('espagnol')?'espagnol':n.startsWith('mathem')?'maths':n.startsWith('physique')?'physique':n.startsWith('svt')?'svt':n.startsWith('histoire')?'histoire':'francais';
}
function pill(value,cls=''){return E('span','future-pill '+cls,value);}
function card(task,opts,done,today,unlinked=false){
 const diff=daysUntil(task.due,today);
 const node=E('article','future-card future-'+subjectClass(task.subject));
 const head=E('div','future-card-head');
 head.append(E('span','future-subject',task.subject),pill(diff===1?'DEMAIN':'J-'+diff,diff===1?'urgent':'countdown'));
 node.append(head);
 const title=E('h3','future-task-title',task.title);node.append(title);
 node.append(E('p','future-task-date',cap(formatDate(task.due))));
 node.append(pill(unlinked?'Entraînement créé dans le classeur':task.isExam?'Évaluation annoncée dans l’ENT':'Devoir indiqué dans l’ENT','type'));
 if(task.description)node.append(E('p','future-description',task.description));
 if(!unlinked){
  node.append(E('p','future-source','Consigne issue de l’ENT · Travail officiel'));
 }
 const matched=opts.bonuses.filter(ex=>linked(ex,task));
 const available=unlinked?(task.ex?[task.ex]:[]):matched;
 if(available.length){
  const count=available.filter(ex=>done.has(String(ex.id))).length;
  const progress=E('div','future-progress');
  progress.append(E('span','',count+' / '+available.length+' entraînement'+(available.length>1?'s':'')+' bonus terminé'+(count>1?'s':'')));
  const track=E('div','future-track'),bar=E('span','future-bar');
  bar.style.width=(100*count/available.length)+'%';track.append(bar);progress.append(track);node.append(progress);
 }else if(!unlinked){
  node.append(E('p','future-no-bonus','Aucun exercice bonus associé précisément à cette consigne pour le moment.'));
 }
 const actions=E('div','future-actions');
 for(const ex of available){
  const completed=done.has(String(ex.id));
  actions.append(makeButton((completed?'Voir la correction':'Faire le bonus')+' · '+text(ex.title||'Révision'),()=>opts.openBonus?.(ex.id),completed?'secondary':'primary'));
 }
 if(!unlinked && opts.openSubject)actions.append(makeButton('Voir la matière',()=>opts.openSubject(task.subject),'secondary'));
 if(actions.children.length)node.append(actions);
 if(task.isExam){
  const plan=E('details','future-plan');
  plan.append(E('summary','','Comment me préparer sur plusieurs jours ?'));
  const ul=E('ol');
  ['Relire le cours ENT et la leçon BIS correspondante.','Faire un exercice de compréhension, en expliquant le raisonnement.','Relire les corrections des erreurs et refaire un exemple sur brouillon.','La veille : vérifier les points encore difficiles.'].forEach(s=>ul.append(E('li','',s)));
  plan.append(ul);node.append(plan);
 }
 return node;
}
function collect(data,now=new Date()){
 // Un devoir n'apparaît ici qu'à J-2 ou plus tôt.
 // À J-1, Tim le prépare dans les bonus déjà existants : pas de doublon.
 const today=parisToday(now);
 const all=packAssignments(data).filter(x=>daysUntil(x.due,today)>=2);
 const allBonuses=bonuses(data);
 const later=all.map(task=>({...task,bonusCount:allBonuses.filter(ex=>linked(ex,task)).length}));
 return {today,all:later,later,examCount:later.filter(x=>x.isExam).length,
   withBonus:later.filter(x=>x.bonusCount>0).length,withoutBonus:later.filter(x=>x.bonusCount===0).length};
}
function render(root,opts={}){
 if(!root)return;
 root.replaceChildren();
 const data=opts.data||window.__TIM_DATA||{},state=collect(data,opts.now||new Date()),allBonuses=bonuses(data);
 const done=new Set((opts.attempts||[]).map(a=>String(a.id)));
 const hero=E('div','future-hero');
 const copy=E('div','future-hero-copy');
 copy.append(E('span','future-overline','OBJECTIF : PRENDRE DE L’AVANCE'),E('h2','','Mes prochaines missions'),E('p','','Devoirs, interrogations et révisions : prépare-toi plusieurs jours avant la date !'));
 const figures=E('div','future-numbers');
 for(const [n,label] of [[state.later.length,'missions à venir'],[state.withBonus,'avec exercices'],[state.examCount,'contrôles annoncés']]){
  const stat=E('div','future-number');stat.append(E('strong','',n),E('small','',label));figures.append(stat);
 }
 copy.append(figures);hero.append(copy,E('span','future-hero-symbol','✦'));root.append(hero);
 const warning=E('p','future-sync-note','Calendrier établi à partir des données ENT déjà importées ; il ne se met pas à jour sans nouvelle collecte. Une coche ENT ne prouve pas que Tim a terminé le devoir.');
 root.append(warning);
 const filters=E('div','future-filters');
 for(const [mode,label] of [['all','Tout voir'],['exam','Contrôles'],['homework','Devoirs']]){
  const b=makeButton(label,()=>{selected=mode;render(root,opts);},selected===mode?'selected':'');
  b.setAttribute('aria-pressed',String(selected===mode));filters.append(b);
 }
 root.append(filters);
 const include=t=>selected==='all'||(selected==='exam'&&t.isExam)||(selected==='homework'&&!t.isExam);
 const sections=[['Les jours suivants','À partir d’après-demain : prépare tes devoirs et contrôles plusieurs jours à l’avance.',state.later]];
 for(const [label,description,list] of sections){
  const section=E('section','future-section');
  section.append(E('h3','future-section-title',label),E('p','future-section-intro',description));
  const rows=list.filter(include);
  if(rows.length){
   const grid=E('div','future-list');
   for(const task of rows)grid.append(card(task,{...opts,bonuses:allBonuses},done,state.today));
   section.append(grid);
  }else section.append(E('div','future-empty','Aucun '+(selected==='exam'?'contrôle':selected==='homework'?'devoir':'travail')+' annoncé dans cette rubrique avec les données actuellement disponibles.'));
  root.append(section);
 }

}
function renderTeaser(root,data,open){
 if(!root)return;
 const state=collect(data||window.__TIM_DATA);
 const b=E('button','future-home-teaser');b.type='button';
 const textBox=E('span','future-home-copy');
 textBox.append(E('span','future-home-kicker','CALENDRIER DES MISSIONS'),E('strong','','Prends de l’avance !'),E('small','',state.later.length+' mission'+(state.later.length>1?'s':'')+' à anticiper'));
 b.append(E('span','future-home-icon','▣'),textBox,E('span','future-home-arrow','→'));
 b.addEventListener('click',open);root.append(b);
}
window.TIM_NEXT_MISSIONS={collect,render,renderTeaser,parisToday,daysUntil};
})();
