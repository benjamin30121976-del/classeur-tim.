/* Fiches originales ENT de physique-chimie, recopiées fidèlement des deux PDF.
   10 réponses pour la fiche de contrôle ; 12 cases pour le tableau des molécules.
   La correction est exclusivement effectuée par le serveur privé. */
(function(){
'use strict';
const IDS=['PC_ENT_CTRL1','PC_ENT_MOLECULES'];
const TITLES={
 PC_ENT_CTRL1:'Préparation au contrôle n°1 — Atomes, ions et molécules',
 PC_ENT_MOLECULES:'Chapitre 1 — Tableau des molécules'
};
const E=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;};
const B=(label,fn,cls='spx-quick-link')=>{const b=E('button',cls,label);b.type='button';b.onclick=fn;return b;};
const api=()=>window.__TIM_BRIDGE;
const parent=()=>Boolean(window.__TIM_PARENT&&!window.__TIM_GUEST);
const guest=()=>Boolean(window.__TIM_GUEST);
const paper='background:#fff;color:#223956;border:1px solid #d3dfea;border-radius:13px;padding:14px;margin:13px 0;line-height:1.55';
const titleStyle='font-size:16px;font-weight:800;color:#223d63;line-height:1.45';
const noteStyle='padding:12px 14px;border-left:4px solid #8aa9c7;background:#f2f6fc;color:#25415d;border-radius:7px;line-height:1.5';
const btnStyle='display:block;min-height:45px;padding:9px 13px;background:#ebf2fb;border:1px solid #b0c3df;border-radius:10px;color:#24466c;font-size:15px;font-weight:800;text-align:left;cursor:pointer;margin:7px 0';
const primaryStyle='padding:13px;border-radius:12px;border:1px solid #254b88;background:#254b88;color:#fff;font-size:16px;font-weight:800;min-height:48px;cursor:pointer';
function setStatus(where,msg){where.replaceChildren(E('p','',msg));}
function explainMode(){
 return parent()
  ?'Mode essai Parent : vous pouvez remplir la fiche et obtenir sa correction sans modifier les notes, XP ou tentatives de Tim.'
  :'Compte Tim : une seule validation. Note, corrections et XP apparaissent immédiatement ; le Parent conserve la copie.';
}
const DOT={H:['#f9fafc','#b9c7d6','Hydrogène'],C:['#333941','#333941','Carbone'],N:['#247bc7','#247bc7','Azote'],O:['#d74e40','#d74e40','Oxygène']};
function atomsOf(raw){
 const s=String(raw??'').replace(/[,\s;|]/g,'').replaceAll('₂','2').replaceAll('₃','3').replaceAll('₄','4').replaceAll('₆','6');
 if(!s)return [];
 let list=[],pos=0;
 for(const m of s.matchAll(/([HCON])(\d{0,2})/g)){
  if(m.index!==pos)return [];
  pos+=m[0].length;
  const num=m[2]?Number(m[2]):1;
  if(num>16||num<1)return [];
  list.push(...Array(num).fill(m[1]));
 }
 return pos===s.length?list:[];
}
function atomsPreview(raw){
 const holder=E('div','pc-atoms');
 holder.style.cssText='display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-height:39px;padding:6px 0';
 const atoms=atomsOf(raw);
 for(const sym of atoms){
  const dot=E('span','pc-atom-ball',sym);
  dot.title=DOT[sym][2];dot.setAttribute('aria-label',DOT[sym][2]);
  dot.style.cssText='width:31px;height:31px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;background:'+DOT[sym][0]+';color:'+(sym==='H'?'#2c455e':'#fff')+';border:2px solid '+DOT[sym][1]+';box-sizing:border-box';
  holder.append(dot);
 }
 if(!atoms.length)holder.append(E('span','','Aucun atome placé.'));
 return holder;
}
function correction(slot,report){
 slot.replaceChildren();
 if(!report||!Array.isArray(report.items)){setStatus(slot,'La copie corrigée n’est pas disponible actuellement.');return;}
 const practice=report.practice===true;
 const box=E('section','pc-ent-grade');box.style.cssText=paper+';border-left:5px solid #577fa4;background:#f5f9ff';
 box.append(E('h3','',practice?'Correction de votre essai Parent':'Correction du travail de Tim'));
 const score=E('p','',report.score+' / 10 · '+(practice?'0 XP (essai non enregistré)':report.xp+' XP acquis'));
 score.style.cssText='font-size:21px;font-weight:850;color:#23477d;margin:8px 0';
 box.append(score);
 box.append(E('p','',report.correctFields+' / '+report.fieldCount+' réponses exactes. '+(report.scale||'')));
 box.append(E('p','',practice?'Cet essai ne compte pas pour Tim.':'Résultat conservé. Cet exercice ne peut pas être rejoué par Tim.'));
 slot.append(box);
 for(const [i,item] of report.items.entries()){
  const card=E('section','pc-ent-correction');card.style.cssText=paper+';border-left:4px solid '+(item.correct?'#4c9474':'#c16e54');
  card.append(E('h4','', 'Réponse '+(i+1)+' — '+(item.correct?'Correcte':'À revoir')));
  card.append(E('p','',item.prompt));
  const response=E('p','', (practice?'Votre réponse : ':'Réponse de Tim : ')+(item.kind==='model'?atomsOf(item.response).join(' · '):item.response));
  card.append(response);
  card.append(E('p','', 'Réponse attendue : '+item.expected));
  if(item.kind==='model')card.append(atomsPreview(item.expected));
  card.append(E('p','', 'Explication : '+item.explanation));
  slot.append(card);
 }
 const hint=E('p','',report.score===10
  ?'Toutes les réponses sont correctes. Tu peux relire la règle pour consolider les acquis.'
  :'Pour chaque erreur, compare ta réponse, la correction et la règle de la leçon BIS.');
 hint.style.cssText=noteStyle;slot.append(hint);
 const ref=report.lessonToReview||
  (report.id==='PC_ENT_MOLECULES'?'PC_BIS03':'PC_BIS01');
 if(/^PC_BIS0[1-7]$/.test(String(ref))){
  const link=B('Revoir la leçon BIS liée à cet exercice',()=>{
   window.TIM_PEDAGOGY_NAVIGATE?.('Physique-chimie',ref);
  });link.style.cssText=btnStyle+';width:100%';slot.append(link);
 }
}
async function savedCopy(slot,id){
 try{
  const x=await api().physicsEntProgress(id);
  if(x?.attempt)correction(slot,x.attempt);
  else setStatus(slot,'Aucune copie confirmée pour cette fiche.');
 }catch(e){setStatus(slot,'Copie indisponible : '+String(e?.message||e));}
}
function modelBuilder(field,index,answers,onUpdate){
 const box=E('div','pc-ent-model-input');
 const caption=E('p','','Construis le modèle avec des boules. Couleurs du cours : H blanc, C noir, N bleu, O rouge.');
 caption.style.cssText='font-size:14px;line-height:1.5;margin:0 0 5px;color:#435872';box.append(caption);
 const view=E('div');view.append(atomsPreview(answers[index]));box.append(view);
 const toolbar=E('div');toolbar.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:9px 0';
 function repaint(){view.replaceChildren(atomsPreview(answers[index]));onUpdate();}
 for(const sym of field.atoms){
  const b=B('+ '+sym+' · '+DOT[sym][2],()=>{
   const arr=atomsOf(answers[index]);
   if(arr.length>=16)return;
   arr.push(sym);answers[index]=arr.join(',');
   repaint();
  },'pc-add-atom');
  b.style.cssText='padding:8px 9px;min-height:41px;border:1px solid #b6c6d8;border-radius:8px;background:#f2f6fb;color:#243b59;font-size:13px;font-weight:800';
  toolbar.append(b);
 }
 box.append(toolbar);
 const commands=E('div');commands.style.cssText='display:flex;gap:9px;flex-wrap:wrap';
 const undo=B('Retirer la dernière boule',()=>{
  const arr=atomsOf(answers[index]);arr.pop();answers[index]=arr.join(',');repaint();
 });
 undo.style.cssText=btnStyle+';font-size:13px';
 const clear=B('Effacer le modèle',()=>{answers[index]='';repaint();});
 clear.style.cssText=btnStyle+';font-size:13px';
 commands.append(undo,clear);box.append(commands);
 return box;
}
async function mount(id,host){
 host.replaceChildren();
 if(!IDS.includes(id)){setStatus(host,'Fiche ENT inconnue.');return;}
 if(guest()){setStatus(host,'Les exercices originaux et les résultats sont réservés aux comptes Parent et Tim.');return;}
 if(!api()?.physicsEntTask){setStatus(host,'Le service privé des exercices ENT n’est pas connecté.');return;}
 setStatus(host,'Chargement de la fiche du professeur…');
 let result;
 try{result=await api().physicsEntTask(id);}
 catch(e){setStatus(host,'Impossible de récupérer la fiche originale : '+String(e?.message||e));return;}
 const task=result?.task;
 if(!task||!Array.isArray(task.fields)){setStatus(host,'Fiche incomplète : aucune tentative consommée.');return;}
 const isParent=parent();
 host.replaceChildren();
 const heading=E('h2','',task.title);heading.style.cssText='color:#20385d;font-size:22px;margin:10px 0';host.append(heading);
 const label=E('p','',task.source+' · '+task.date);label.style.cssText='color:#436184;font-size:14px';host.append(label);
 const mode=E('p','',explainMode());mode.style.cssText=noteStyle;host.append(mode);
 // Le document original est affiché au même endroit que les questions.
 if(window.TIM_PHYSICS_INLINE_PDF?.createInline){
  const doc=window.TIM_PHYSICS_INLINE_PDF.createInline(
   {target:task.document.target,fileName:task.document.fileName},task.document.page,
   'Document original du professeur — visible ici pendant l’exercice');
  host.append(doc);
 }
 if(result.completed&&!isParent){
  const slot=E('div');host.append(slot);setStatus(slot,'Récupération de la copie enregistrée…');
  await savedCopy(slot,id);return;
 }
 if(result.completed&&isParent){
  const old=E('div');old.style.cssText=paper;
  old.append(E('p','','Tim a déjà validé cette fiche. Vous pouvez lire sa copie, ou faire votre propre essai sans enregistrer de résultat.'));
  const copy=E('div');old.append(B('Voir la copie de Tim',()=>savedCopy(copy,id)),copy);host.append(old);
 }
 const answers=task.fields.map(()=>'');
 const form=E('section','pc-ent-answer-sheet');
 form.style.cssText='margin:14px 0';
 const progress=E('p','');progress.style.cssText='font-weight:700;color:#385874';
 const updateProgress=()=>{
  progress.textContent=answers.filter(x=>typeof x==='string'&&x.trim()).length+' / '+answers.length+' cases remplies · '+task.scale;
 };
 form.append(progress);
 if(task.type==='formative'){
  let previous=0;
  task.fields.forEach((f,index)=>{
   const group=E('section','pc-ent-question');group.style.cssText=paper;
   if(f.group!==previous)group.append(E('h3','', 'Question '+f.group+' du professeur'));
   else group.append(E('h3','','Deuxième partie de la question '+f.group));
   previous=f.group;
   const question=E('p','',f.label);question.style.cssText=titleStyle;group.append(question);
   const input=E('textarea');input.rows=2;input.maxLength=160;input.placeholder=f.placeholder||'Écris ta réponse ici';input.value=answers[index];
   input.style.cssText='display:block;width:100%;box-sizing:border-box;padding:11px;border:1px solid #99b2cc;border-radius:8px;background:#fff;color:#203a5e;font-size:16px;min-height:65px;resize:vertical';
   input.setAttribute('aria-label','Question '+f.group+' — '+f.label);
   input.oninput=()=>{answers[index]=input.value.trim();updateProgress();};
   group.append(input);form.append(group);
  });
 }else if(task.type==='molecule-table'){
  const intro=E('p','','Complète les cases vides du tableau du professeur. Le méthane a déjà sa formule CH₄ ; le protoxyde d’azote a déjà son modèle (2 boules bleues et 1 rouge).');
  intro.style.cssText=noteStyle;form.append(intro);
  for(const [ri,m] of task.molecules.entries()){
   const group=E('section','pc-ent-molecule-row');group.style.cssText=paper;
   const name=E('h3','', (ri+1)+'. '+m.name);name.style.cssText=titleStyle;group.append(name);
   const ff=task.fields.findIndex(x=>x.id===m.id+'_formula');
   const mf=task.fields.findIndex(x=>x.id===m.id+'_model');
   const formula=E('div');formula.append(E('strong','','Formule de la molécule'));
   if(ff>=0){
    const input=E('input');input.type='text';input.maxLength=35;input.spellcheck=false;input.autocomplete='off';input.placeholder='Exemple : H2O';
    input.setAttribute('aria-label','Formule de '+m.name);
    input.style.cssText='display:block;width:100%;box-sizing:border-box;padding:11px;margin:8px 0;border:1px solid #9bb4ce;border-radius:8px;background:#fff;color:#203c5d;font-size:17px';
    input.oninput=()=>{answers[ff]=input.value.trim();updateProgress();};formula.append(input);
   }else{formula.append(E('p','',m.printedFormula+' — déjà écrit par le professeur'));}
   group.append(formula);
   const model=E('div');model.append(E('strong','','Modèle moléculaire'));
   if(mf>=0)model.append(modelBuilder(task.fields[mf],mf,answers,updateProgress));
   else{model.append(E('p','',m.printedModel+' — modèle déjà donné sur le PDF original'));model.append(atomsPreview('N,N,O'));}
   group.append(model);form.append(group);
  }
 }
 updateProgress();
 host.append(form);
 const confirmation=E('label','pc-ent-confirmation');
 confirmation.style.cssText=paper+';display:flex;align-items:flex-start;gap:9px';
 const check=E('input');check.type='checkbox';check.style.cssText='width:21px;height:21px;margin-top:3px;flex:0 0 auto';
 confirmation.append(check,E('span','',isParent
  ?'Je veux corriger mon essai sans enregistrer de note ni d’XP pour Tim.'
  :'Je confirme : je valide une seule fois cette fiche ENT et je recevrai ma note et ma correction.'));
 host.append(confirmation);
 const resultSlot=E('section','pc-ent-results');
 const submit=B(isParent?'Corriger mon essai ENT (0 XP pour Tim)':'Valider ma fiche ENT — une seule tentative',async()=>{
  if(submit.disabled)return;
  if(answers.some(x=>!String(x).trim())||!check.checked)return;
  submit.disabled=true;
  setStatus(resultSlot,isParent?'Correction de l’essai Parent…':'Enregistrement de la fiche et de la correction…');
  try{
   const graded=isParent
    ?await api().physicsEntPreviewSubmit(id,answers,task.bankVersion)
    :await api().physicsEntSubmit(id,answers,task.bankVersion);
   form.hidden=true;confirmation.hidden=true;submit.hidden=true;
   correction(resultSlot,graded);
  }catch(e){
   if(isParent)setStatus(resultSlot,'Essai non enregistré : '+String(e?.message||e));
   else{
    // Ne jamais recommencer automatiquement une validation quand la réponse réseau se perd.
    await savedCopy(resultSlot,id);
    resultSlot.prepend(E('p','','Validation non confirmée : '+String(e?.message||e)));
   }
   submit.disabled=false;
  }
 });
 submit.style.cssText=primaryStyle+';width:100%;margin:11px 0';
 const onChange=()=>{
  submit.disabled=!check.checked||answers.some(x=>!String(x).trim());
 };
 check.onchange=onChange;
 // Mettre à jour l’état de validation quand une réponse change.
 form.addEventListener('input',onChange);
 // Les boules ajoutées sont des boutons (pas des champs) : observer les clics.
 form.addEventListener('click',()=>{onChange();});
 onChange();
 host.append(submit,resultSlot);
}
function renderDirectory(host,{showUnavailable=true}={}){
 host.replaceChildren();
 const heading=E('h3','','Exercices ENT du professeur — à remplir');
 host.append(heading);
 host.append(E('p','', 'Deux fiches originales entièrement récupérées : tu peux répondre dans le classeur, obtenir ta note, les corrections et les XP.'));
 for(const id of IDS){
  const row=E('section','pc-ent-official-card');row.style.cssText=paper;
  row.append(E('h4','',TITLES[id]));
  row.append(E('p','',id==='PC_ENT_CTRL1'?'Fiche de contrôle : 8 questions du professeur, 10 réponses à noter.':'Tableau officiel : 7 molécules, 12 cases à remplir et des boules colorées pour construire les modèles.'));
  const area=E('div','pc-ent-official-work');
  const open=B(parent()?'Ouvrir et essayer cette fiche ENT':'Faire cette fiche ENT',()=>{
   area.replaceChildren(E('p','','Ouverture de la fiche…'));
   mount(id,area);
  });
  open.style.cssText=btnStyle+';width:100%';
  row.append(open,area);host.append(row);
 }
 if(showUnavailable){
  const notice=E('p','','Autres devoirs ENT : certains renvoient uniquement à des pages du manuel (p. 117, 119, 122, 128, 164–165). Leurs énoncés complets ne sont pas présents dans les documents reçus. Ils ne sont pas inventés ni notés.');
  notice.style.cssText=noteStyle;host.append(notice);
 }
}
async function renderProgress(host){
 host.replaceChildren();
 if(guest()){setStatus(host,'Résultats accessibles uniquement à Tim et au Parent.');return;}
 try{
  const progress=await api().physicsEntProgress();
  const rows=progress?.attempts||[];
  host.append(E('p','',rows.length+' / 2 fiches ENT originales validées par Tim.'));
  for(const record of rows){
   const box=E('details','pc-ent-saved');
   box.style.cssText=paper;
   box.append(E('summary','',record.title+' · '+record.score+'/10 · +'+record.xp+' XP'));
   const copy=E('div');copy.style.cssText='padding:8px 0';
   box.append(B('Voir toutes les réponses et corrections',()=>savedCopy(copy,record.id)),copy);
   host.append(box);
  }
  if(!rows.length)host.append(E('p','','Tim n’a encore validé aucune de ces deux fiches ENT.'));
 }catch(e){setStatus(host,'Résultats ENT momentanément indisponibles : '+String(e?.message||e));}
}
window.TIM_PHYSICS_ENT={IDS,TITLES,mount,renderDirectory,renderProgress};
})();