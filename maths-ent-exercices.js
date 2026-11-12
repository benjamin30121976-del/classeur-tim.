/* Mathématiques — devoirs ENT originaux de Mme Pialet, retranscrits depuis
   les PDF que la famille a fournis et classés dans sa bibliothèque.
   Les deux formulaires utilisent le serveur Cloudflare pour noter :
   aucune clé de correction ni XP calculé en navigateur.
   Ne pas confondre avec le manuel Mission Indigo 2016 : il manque encore
   ses pages d'exercices 77 et 252. */
(function(){
'use strict';
const IDS=['ME_ENT_PROGRAMMES','ME_ENT_THALES3'];
const TITLES={
 ME_ENT_PROGRAMMES:'Six programmes de calcul — fiche ENT du 5 novembre',
 ME_ENT_THALES3:'Thalès — trois premières figures ENT du 12 octobre'
};
const E=(tag,text='',cls='')=>{const e=document.createElement(tag);if(text)e.textContent=String(text);if(cls)e.className=cls;return e;};
const B=(text,click)=>{const b=E('button',text);b.type='button';b.onclick=click;return b;};
const api=()=>window.__TIM_BRIDGE;
const parent=()=>Boolean(window.__TIM_PARENT&&!window.__TIM_GUEST);
const guest=()=>Boolean(window.__TIM_GUEST);
const style={
 panel:'color:#233d5b;background:#f9fbff;border:1px solid #c7d6e9;border-radius:13px;padding:14px;margin:13px 0;line-height:1.55',
 button:'display:block;width:100%;min-height:45px;margin:10px 0 7px;padding:11px 12px;border-radius:10px;border:1px solid #9bbad9;color:#254872;background:#eaf3ff;font-weight:800;text-align:left;cursor:pointer;font-size:15px',
 primary:'display:block;width:100%;min-height:50px;padding:12px;background:#284b86;color:#fff;border-radius:11px;border:0;font-size:16px;font-weight:850',
 input:'display:block;width:100%;box-sizing:border-box;min-height:47px;padding:10px 11px;margin:7px 0 4px;background:#fff;color:#1d3b60;border:1px solid #91accb;border-radius:9px;font-size:17px',
 note:'background:#edf5fe;color:#23415f;border-left:4px solid #7faccd;padding:10px 12px;border-radius:7px;line-height:1.5;font-size:14px'
};
function setStatus(el,msg){el.replaceChildren(E('p',msg));}
const figureData=[
 {title:'Case 1 : A, N, C et A, M, B',
  points:[['A',166,20],['N',113,83],['C',60,148],['M',198,83],['B',231,148]],
  lines:[['A','C'],['A','B'],['N','M'],['C','B']],parallel:[2,3]},
 {title:'Case 2 : E, J, G et E, I, F',
  points:[['E',147,20],['J',100,84],['G',52,149],['I',192,84],['F',237,149]],
  lines:[['E','G'],['E','F'],['J','I'],['G','F']],parallel:[2,3]},
 {title:'Case 3 : R, T, V et S, T, U',
  points:[['R',55,73],['T',150,96],['V',243,119],['S',55,160],['U',243,32]],
  lines:[['R','V'],['S','U'],['R','S'],['U','V']],parallel:[2,3]}
];
const NS='http://www.w3.org/2000/svg';
function diagram(index){
 const d=figureData[index],svg=document.createElementNS(NS,'svg');
 svg.setAttribute('viewBox','0 0 300 190');
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label','Schéma repère de Thalès '+d.title+' non à l’échelle');
 svg.style.cssText='display:block;width:100%;max-width:360px;margin:10px auto;border:1px solid #cad9e9;background:white;border-radius:8px';
 const map=Object.fromEntries(d.points.map(x=>[x[0],x]));
 const lines=d.lines;
 for(const [i,[a,b]] of lines.entries()){
  const el=document.createElementNS(NS,'line');
  el.setAttribute('x1',map[a][1]);el.setAttribute('y1',map[a][2]);
  el.setAttribute('x2',map[b][1]);el.setAttribute('y2',map[b][2]);
  el.setAttribute('stroke',d.parallel.includes(i)?'#176fa2':'#334962');
  el.setAttribute('stroke-width',d.parallel.includes(i)?3:2);
  if(d.parallel.includes(i))el.setAttribute('stroke-dasharray','6 4');
  svg.append(el);
 }
 for(const [name,x,y] of d.points){
  const c=document.createElementNS(NS,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);
  c.setAttribute('r',4);c.setAttribute('fill','#1a4464');svg.append(c);
  const txt=document.createElementNS(NS,'text');txt.setAttribute('x',x+6);
  txt.setAttribute('y',y-7);txt.setAttribute('font-size',14);
  txt.setAttribute('font-weight','700');txt.setAttribute('fill','#162b44');
  txt.textContent=name;svg.append(txt);
 }
 return svg;
}
function resultSheet(slot,r){
 slot.replaceChildren();
 if(!r?.items||!Array.isArray(r.items)){setStatus(slot,'Copie corrigée indisponible.');return;}
 const practice=r.practice===true;
 const header=E('section','', 'math-ent-results-header');header.style.cssText=style.panel+';background:#f0f7ff';
 const heading=E('h3',practice?'Essai du Parent — correction':'Résultat de Tim — correction');
 header.append(heading);
 const grade=E('p',r.score+'/10 · '+(practice?'0 XP (essai sans enregistrement)':'+'+r.xp+' XP'));
 grade.style.cssText='font-size:21px;font-weight:900;margin:8px 0;color:#20517b';header.append(grade);
 header.append(E('p',r.correctFields+' réponse(s) correcte(s) sur '+r.fieldCount+'. '+r.scale));
 if(!practice)header.append(E('p','Copie conservée, tentative unique.'));
 slot.append(header);
 for(const [i,item] of r.items.entries()){
  const row=E('section','','math-ent-feedback');row.style.cssText=style.panel+';border-left:4px solid '+(item.correct?'#498f68':'#b55b4e');
  row.append(E('h4','Réponse '+(i+1)+' — '+(item.correct?'Correcte':'À revoir')));
  row.append(E('p',item.prompt),E('p',(practice?'Votre réponse : ':'Réponse de Tim : ')+item.response),
   E('p','Bonne réponse : '+item.expected),E('p','Explication : '+item.explanation));
  slot.append(row);
 }
 slot.append(E('p','Pour revoir les erreurs, consulte la leçon BIS associée dans les mathématiques.'));
}
async function savedCopy(slot,id){
 setStatus(slot,'Lecture de la copie validée par Tim…');
 try{
  const r=await api().mathEntProgress(id);
  if(r?.attempt)resultSheet(slot,r.attempt);
  else setStatus(slot,'La copie n’est pas encore enregistrée.');
 }catch(e){setStatus(slot,'Impossible de lire la copie : '+String(e?.message||e));}
}
async function mount(id,host){
 host.replaceChildren();
 if(!IDS.includes(id)){setStatus(host,'Fiche ENT inconnue.');return;}
 if(guest()){setStatus(host,'Les copies sont réservées aux comptes Tim et Parent.');return;}
 if(!api()?.mathEntTask){setStatus(host,'Le service des devoirs ENT de mathématiques est indisponible.');return;}
 setStatus(host,'Chargement des questions authentiques…');
 let fetched;
 try{fetched=await api().mathEntTask(id);}
 catch(e){setStatus(host,'Impossible de charger la fiche : '+String(e?.message||e));return;}
 const task=fetched?.task;
 if(!task||!Array.isArray(task.fields)){setStatus(host,'Fiche incomplète : aucune tentative consommée.');return;}
 const p=parent();
 host.replaceChildren();
 const h=E('h2',task.title);h.style.cssText='color:#23466b;font-size:20px';host.append(h);
 const src=E('p','Document ENT du '+task.date+' · Travail demandé pour le '+task.due+'.');src.style.cssText='font-size:13px;color:#436082';host.append(src);
 const intro=E('p',p
  ?'Mode essai Parent : note et correction d’entraînement, aucune écriture dans les résultats ni XP de Tim.'
  :'Compte Tim : une seule validation pour cette fiche, note /10, correction immédiate et XP selon le barème commun.');
 intro.style.cssText=style.note;host.append(intro);
 // Énoncé PDF original à côté des réponses ; la fiche reste toujours sur la même page.
 // Le lecteur consulte seulement les fichiers déjà autorisés dans Firebase.
 const official=E('div','','math-ent-source-document');
 official.style.cssText='margin:12px 0';
 host.append(official);
 if(window.TIM_INLINE_ENT_DOCUMENTS?.forMathExercise)
  window.TIM_INLINE_ENT_DOCUMENTS.forMathExercise(official,id).catch(err=>{
   setStatus(official,'Fiche PDF non disponible : '+String(err.message||err));
  });
 else setStatus(official,'Le lecteur intégré des documents originaux est indisponible.');

 if(fetched.completed&&!p){
  const report=E('div');host.append(report);await savedCopy(report,id);return;
 }
 if(fetched.completed&&p){
  const old=E('section','','math-ent-old');old.style.cssText=style.panel;
  old.append(E('p','Tim a déjà validé cette fiche. Sa copie reste accessible, votre essai est indépendant.'));
  const pane=E('div');const button=B('Voir la copie et les corrections de Tim',()=>savedCopy(pane,id));
  button.style.cssText=style.button;old.append(button,pane);host.append(old);
 }
 const form=E('section','','math-ent-form');
 const answers=Array(task.fields.length).fill('');
 const count=E('p');count.style.cssText='font-weight:750;color:#285173';
 const update=()=>{count.textContent=answers.filter(x=>x.trim()).length+' / '+answers.length+' réponses complétées. '+task.scale;};
 form.append(count);
 let lastGroup=0;
 for(const [i,f] of task.fields.entries()){
  if(task.kind==='thales'&&f.group!==lastGroup){
   const c=task.cases[f.group-1];
   const fig=E('section','','math-ent-figure');fig.style.cssText=style.panel;
   fig.append(E('h3',c.title));
   const why=E('p','Données : '+c.given);fig.append(why,diagram(f.group-1));
   const caption=E('p','Schéma de repérage non à l’échelle, établi d’après la figure fournie par la professeure.');
   caption.style.cssText='font-size:13px;color:#4b6783';fig.append(caption);form.append(fig);
  }
  lastGroup=f.group;
  const row=E('section','','math-ent-field');
  row.style.cssText=style.panel;
  if(task.kind==='programmes'){
   row.append(E('h3','Programme n°'+f.group));
   const steps=E('ol');
   for(const step of f.steps||[])steps.append(E('li',step));
   row.append(steps);
  }
  const label=E('label',f.label);
  label.style.cssText='font-size:15px;font-weight:700;line-height:1.45;color:#263e5d;display:block';
  const field=E('input');field.type='text';field.maxLength=160;field.autocomplete='off';field.spellcheck=false;
  field.placeholder=task.kind==='programmes'?'Exemple : 2(x+3)-4x':f.kind==='ratios'?'Trois fractions égales, séparées par =':f.kind==='number'?'Résultat numérique (virgule possible)':'Ta réponse';
  field.setAttribute('aria-label',f.label);
  field.style.cssText=style.input;
  field.addEventListener('input',()=>{answers[i]=field.value.trim();update();onChange();});
  label.append(field);row.append(label);form.append(row);
 }
 update();host.append(form);
 const confirm=E('label','','math-ent-confirm');
 confirm.style.cssText=style.panel+';display:flex;align-items:flex-start;gap:9px;font-weight:700';
 const checkbox=E('input');checkbox.type='checkbox';checkbox.style.cssText='width:21px;height:21px;flex:0 0 auto;margin-top:4px';
 confirm.append(checkbox,E('span',p?'Je corrige cet essai sans rien enregistrer pour Tim.':'Je valide définitivement ma seule tentative sur cette fiche ENT.'));
 host.append(confirm);
 const report=E('div','','math-ent-feedback-panel');
 const submit=B(p?'Corriger mon essai ENT (sans XP)':'Valider les réponses ENT et obtenir ma note',async()=>{
  if(submit.disabled)return;
  submit.disabled=true;setStatus(report,p?'Calcul de la correction Parent…':'Validation de la copie et calcul des XP…');
  try{
   const graded=p?await api().mathEntPreviewSubmit(id,answers,task.bankVersion)
    :await api().mathEntSubmit(id,answers,task.bankVersion);
   form.hidden=true;confirm.hidden=true;submit.hidden=true;
   resultSheet(report,graded);
  }catch(e){
   if(p)setStatus(report,'Essai non enregistré : '+String(e?.message||e));
   else{
    // Ne pas consommer deux fois une tentative sur une erreur réseau.
    await savedCopy(report,id);
    report.prepend(E('p','La confirmation de l’enregistrement a échoué : '+String(e?.message||e)));
   }
   submit.disabled=false;
  }
 });
 submit.style.cssText=style.primary+';margin:12px 0';
 function onChange(){submit.disabled=!checkbox.checked||answers.some(v=>!v.trim());}
 checkbox.addEventListener('change',onChange);onChange();
 host.append(submit,report);
}
function renderDirectory(host,{showUnavailable=true,onlyIds=IDS}={}){
 host.replaceChildren();
 host.append(E('h3','Exercices ENT originaux à remplir'));
 host.append(E('p','Ces deux fiches proviennent des documents réellement donnés par Mme Pialet, et non d’exercices inventés.'));
 for(const id of onlyIds.filter(x=>IDS.includes(x))){
  const row=E('section','','math-ent-entry');row.style.cssText=style.panel;
  row.append(E('h4',TITLES[id]));
  row.append(E('p',id==='ME_ENT_PROGRAMMES'?'Six programmes de calcul, six expressions à écrire.':'Thalès : trois figures, 15 cases à compléter et des longueurs à calculer.'));
  const content=E('div','','math-ent-open-content');
  const open=B(parent()?'Essayer cette fiche ENT sans XP':'Faire cette fiche ENT',()=>mount(id,content));
  open.style.cssText=style.button;
  row.append(open,content);host.append(row);
 }
 if(showUnavailable){
  const note=E('p','Les exercices du manuel Mission Indigo 2016, notamment n°35 à 37 p.77 et n°18 et 19 p.252, ne sont pas retranscrits : les photos des pages exactes manquent.');
  note.style.cssText=style.note;host.append(note);
 }
}
async function renderProgress(host){
 host.replaceChildren();
 if(guest()){setStatus(host,'Résultats réservés aux comptes Tim et Parent.');return;}
 try{
  const x=await api().mathEntProgress(),rows=x?.attempts||[];
  host.append(E('p',rows.length+' / 2 fiches de maths ENT validées.'));
  if(!rows.length)host.append(E('p','Aucun de ces deux devoirs ENT n’a été validé par Tim.'));
  for(const r of rows){
   const box=E('details','','math-ent-history');box.style.cssText=style.panel;
   box.append(E('summary',r.title+' · '+r.score+'/10 · +'+r.xp+' XP'));
   const content=E('div'),view=B('Voir toute la copie corrigée',()=>savedCopy(content,r.id));
   view.style.cssText=style.button;box.append(view,content);host.append(box);
  }
 }catch(e){setStatus(host,'Historique ENT de mathématiques indisponible : '+String(e?.message||e));}
}
window.TIM_MATH_ENT={IDS,TITLES,mount,renderDirectory,renderProgress};
})();