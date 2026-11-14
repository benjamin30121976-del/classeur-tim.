

'use strict';
const DATA=window.__TIM_DATA;
const EXAM=null; // Complété ultérieurement dans une publication parentale validée d'après l'ENT ; aucune saisie par Tim.
const ATTEMPT_KEY='tim_espagnol_v6_attempts';
const DRAFT_KEY='tim_espagnol_v6_drafts';
const IMPORT_KEY='tim_espagnol_v6_parent_import';
let storageOK=true;
try{let k='tim_v6_storage_test';localStorage.setItem(k,'1');storageOK=localStorage.getItem(k)==='1';localStorage.removeItem(k);}catch(e){storageOK=false;}
let volatile={},lessonSearch='',lessonTopic='all',exerciseSearch='',exerciseTopic='all',dicoCurrentVerb=null,dicoStage='hub',wordCategory='all';
function load(k,fallback){try{const x=localStorage.getItem(k);return x?JSON.parse(x):fallback;}catch(e){return volatile[k]===undefined?fallback:volatile[k];}}
function save(k,x){volatile[k]=x;try{localStorage.setItem(k,JSON.stringify(x));return true;}catch(e){storageOK=false;return false;}}
function attempts(){return window.__CLOUD_ATTEMPTS || [];}
function drafts(){const d=load(DRAFT_KEY,{});return d&&typeof d==='object'&&!Array.isArray(d)?d:{};}
function attemptFor(id){return attempts().find(a=>a.id===id);}
function safe(x){return String(x??'');}
function E(tag,cls,txt){let el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=safe(txt);return el;}
function clear(el){el.replaceChildren();return el;}
function add(parent,...nodes){parent.append(...nodes);return parent;}
function norm(x){return safe(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?¡!.,;:]/g,'').replace(/\s+/g,' ').trim();}
function short(x,n=110){x=safe(x);return x.length>n?x.slice(0,n-1)+'…':x;}
function button(label,handler,cls='plain'){let b=E('button',cls,label);b.type='button';b.addEventListener('click',handler);return b;}
function badge(text,cls=''){return E('span','pill '+cls,text);}
function notice(text,cls='note info'){return E('div',cls,text);}
function scrollTop(){window.scrollTo(0,0);requestAnimationFrame(()=>window.scrollTo(0,0));}
function page(name){if(name==='parent' && !window.__TIM_PARENT){name='home';}if(name==='dico')renderDico('hub');if(name==='cours'){document.getElementById('lesson-index').classList.remove('hide');document.getElementById('lesson-detail').classList.remove('active');}if(name==='exercices'){document.getElementById('exercise-index').classList.remove('hide');document.getElementById('exercise-detail').classList.remove('active');}for(const p of document.querySelectorAll('.page'))p.classList.toggle('active',p.id===name);for(const b of document.querySelectorAll('[data-nav]')){b.classList.toggle('selected',b.dataset.nav===name);b.setAttribute('aria-current',b.dataset.nav===name?'page':'false');}scrollTop();if(name==='matieres')renderMatieres();if(name==='cours')renderLessonIndex();if(name==='exercices')renderExerciseIndex();if(name==='parent')renderParent();refreshXPHeader();if(name==='difficultes')renderDifficulties();if(name==='home')renderHome();if(name==='revisions')renderRevisions();if(name==='aide')document.getElementById('help-query').focus();}
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.nav==='exercices'){exerciseSubject='';exerciseGroup='';exerciseMode='';document.getElementById('exercise-search').value='';}page(b.dataset.nav);}));
function lessonBy(id){return DATA.lessons.find(l=>l.id===id);}
function exerciseBy(id){return DATA.exercises.find(e=>e.id===id);}
function quizLabel(q){return q.level==='Rédaction'?'Rédaction : 7 critères vérifiés':q.level+' · '+q.questions.length+' questions';}
function exerciseDescription(ex){const description=safe(ex?.description);return ex?.kind==='training'?description.replace(/0 XP/g,'+1 / +0,5 / 0 XP selon la note'):ex?.kind?description:description.replace(/correction immédiate/gi,'correction après autorisation du parent');}
function topicSelect(id,arr,sel,handler){const root=clear(document.getElementById(id));root.append(new Option('Tous les thèmes','all'));for(const x of arr)root.append(new Option(x,x));root.value=sel;root.addEventListener('change',()=>handler(root.value));}
function cardAction(heading,meta,description,onClick,status){const b=E('button','tile');b.type='button';if(status)b.append(badge(status,status==='Terminé'?'green':''));b.append(E('strong','',heading),E('small','',meta));if(description)b.append(E('small','',description));b.append(E('span','end','Ouvrir →'));b.addEventListener('click',onClick);return b;}
function makeExamples(root,rows){for(const [es,fr] of rows){const ex=E('div','example');const left=E('div');left.append(document.createTextNode(es+' '));left.append(speakButton(es));ex.append(left,E('div','',fr));root.append(ex);}}
function speakButton(txt){let b=E('button','speak','▶ Écouter');b.type='button';b.title='Écouter en espagnol';b.addEventListener('click',()=>speak(txt));return b;}
function speak(txt){if(!('speechSynthesis' in window)){alert('La voix espagnole n’est pas disponible dans ce navigateur.');return;}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(safe(txt));u.lang='es-ES';u.rate=.82;const v=speechSynthesis.getVoices().find(x=>x.lang?.toLowerCase().startsWith('es'));if(v)u.voice=v;u.onerror=()=>{alert('La prononciation n’a pas fonctionné sur cet appareil.');};speechSynthesis.speak(u);}catch(err){alert('Impossible de lire cette phrase sur ce téléphone.');}}
function buildBlock(block){
 let box=E('div','block');if(block.h)box.append(E('h3','',block.h));
 if(block.kind==='table'){
  if(block.tableRole==='grid'){
   const holder=E('div','v16-table-scroll'),t=E('table','v16-native-table');
   for(const [i,row] of (block.rows||[]).entries()){const tr=E('tr');for(const cell of row)tr.append(E(i===0?'th':'td','',cell));t.append(tr);}holder.append(t);box.append(holder);
  }else makeExamples(box,block.rows||[]);
 }else if(block.kind==='note')box.append(E('div','v16-prewrap',block.body||''));
 else if(block.kind==='bullets'){let ul=E('ul');for(const line of (block.items||[]))ul.append(E('li','',line));box.append(ul);}
 else if(block.kind==='svg'){
  if(window.TIM_LESSON_EDITOR?.safeSvg?.(block.svg)){
   const img=E('img','v16-inline-figure');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(block.svg);img.alt=block.h||'Schéma de cours';img.loading='lazy';box.append(img);
  }else box.append(notice('Schéma indisponible ou format non autorisé.'));
  if(block.caption)box.append(E('p','v16-caption',block.caption));
 }else if(block.kind==='figure'){
  let spot=E('div','v16-image-spot','Chargement de la figure…');spot.dataset.attachmentId=block.attachmentId||'';box.append(spot);
  if(block.caption)box.append(E('p','v16-caption',block.caption));
 }
 return box;
}
async function loadInlineLessonFigures(root,lessonId){
 const nodes=[...root.querySelectorAll('.v16-image-spot[data-attachment-id]')];if(!nodes.length)return;
 const api=window.__TIM_BRIDGE?.attachments;
 if(!api){nodes.forEach(n=>n.textContent='Figure consultable après connexion au compte Tim ou parent.');return;}
 try{const list=await api.list('lesson',lessonId);const byId=new Map(list.map(x=>[x.id,x]));
  for(const node of nodes){const meta=byId.get(node.dataset.attachmentId);
   if(!meta){node.textContent='Figure introuvable : vérifie les pièces jointes de ce cours.';continue;}
   try{const blob=await api.read(meta),url=URL.createObjectURL(blob);const img=E('img','v16-inline-figure');img.src=url;img.alt=meta.title||'Schéma du cours';img.loading='lazy';node.replaceChildren(img);
   }catch(err){node.textContent='Impossible de charger la figure : '+(err.message||err);}
  }
 }catch(err){nodes.forEach(n=>n.textContent='Figures non disponibles : '+(err.message||err));}
}


const COURSE_GROUPS=[
 {title:'Se présenter',topics:['Identité','Goûts','Lettre','École'],icon:'◎',sub:'Identité, goûts, écrire une lettre'},
 {title:'Verbes et grammaire',topics:['Conjugaison','Grammaire','Questions'],icon:'Aa',sub:'Présent, accords, questions'},
 {title:'Culture espagnole',topics:['Horoscope','Géographie'],icon:'◇',sub:'Pays hispanophones et horoscope'},
 {title:'Méthodes de contrôle',topics:['Méthode'],icon:'✓',sub:'Comprendre les consignes et réviser'}
];
let lessonGroup='', lessonSubject='', exerciseGroup='', exerciseSubject='', exerciseMode='';
// Les bonus publiés sont choisis librement : matière, puis exercice complet.
let bonusCatalogSubject='';
function bonusStatus(){return window.TIM_BONUS.state(DATA.exercises,attempts());}
function bonusMissionPanel(onHome=false,subject=''){
 const state=bonusStatus(),all=state.chosen;
 const chosen=subject||(onHome?'':bonusCatalogSubject);
 const available=chosen?all.filter(e=>(e.subject||'Espagnol')===chosen):all;
 const box=E('section',onHome?'bonus-spotlight home-bonus':'bonus-spotlight');
 box.setAttribute('aria-label','Défi bonus : choisir une matière puis un exercice');
 const head=E('div','bonus-spotlight-head');
 head.append(E('h2','bonus-spotlight-heading','DÉFI BONUS'),E('span','bonus-count',all.length+' exercice'+(all.length>1?'s':'')));
 box.append(head);
 if(onHome){
  const scene=E('div','bonus-home-scene'),wolf=E('img','bonus-home-wolf');
  wolf.src=window.TIM_ANIMATIONS?.url?.('bonus')||'./assets/animations/Tim_Defi_Bonus_5XP.gif';
  wolf.alt='Loup animé avec casque, assis devant une fenêtre';wolf.width=307;wolf.height=309;scene.append(wolf);box.append(scene);
 }
 if(!all.length){
  box.append(E('p','bonus-empty','Aucun exercice bonus publié pour le moment.'));
 }else if(!chosen){
  box.append(E('p','bonus-lead','Choisis une matière. Chaque exercice bonus est indépendant et peut rapporter 5 XP, 2,5 XP ou 0 XP, sans plafond.'));
  const subjects=[...new Set(all.map(ex=>ex.subject||'Espagnol'))].sort((a,b)=>a.localeCompare(b,'fr'));
  for(const name of subjects){
   const rows=all.filter(ex=>(ex.subject||'Espagnol')===name),done=rows.filter(ex=>attemptFor(ex.id)).length;
   const b=E('button','bonus-mission-item');b.type='button';
   b.append(E('span','bonus-mission-number','∑'));
   const copy=E('span','bonus-mission-copy');copy.append(E('strong','',name),E('small','',rows.length+' exercices · '+done+' terminé(s) · '+(rows.length*5)+' XP à gagner au maximum'));b.append(copy,E('span','bonus-mission-status','Choisir'));
   b.addEventListener('click',()=>{
    bonusCatalogSubject=name;
    if(onHome){exerciseSubject='';exerciseMode='bonus-mission';page('exercices');}
    else renderExerciseIndex();
   });box.append(b);
  }
 }else{
  if(!subject){
   box.append(button('← Toutes les matières',()=>{bonusCatalogSubject='';renderExerciseIndex();},'group-back'));
  }
  box.append(E('p','bonus-lead',chosen+' · '+available.length+' exercices de 10 questions. Une seule tentative par exercice. Note et correction immédiates.'));
  for(const [i,ex] of available.entries()){
   const done=attemptFor(ex.id),b=E('button','bonus-mission-item');b.type='button';
   b.append(E('span','bonus-mission-number',done?'✓':String(i+1)));
   const copy=E('span','bonus-mission-copy');
   copy.append(E('strong','',ex.title),E('small','',done?'Terminé · '+(Number.isFinite(done.score)?done.score+'/10 · ':'')+(Number.isFinite(done.xp)?done.xp+' XP':'Résultat consultable'):'À faire · 10 questions · jusqu’à 5 XP'));
   b.append(copy,E('span','bonus-mission-status',done?'Voir le résultat':'Faire le défi'));
   b.addEventListener('click',()=>openExercise(ex.id));box.append(b);
  }
  if(!available.length)box.append(E('p','bonus-empty','Aucun exercice bonus publié dans cette matière.'));
 }
 if(window.__TIM_GUEST)box.append(E('p','bonus-footnote','Mode invité : consultation uniquement, sans validation ni XP.'));
 return box;
}
// V15 : chapitres classés par matière, et non par thèmes espagnols pour tout le site.
function subjectOf(item){return item?.subject||'Espagnol';}
function chapterOf(lesson){
 const raw=safe(lesson?.chapter||lesson?.topic||'Autres notions').trim()||'Autres notions';
 // Les intitulés ENT et BIS peuvent être différents pour le même chapitre.
 // Regrouper uniquement à l'affichage, sans modifier le contenu original stocké.
 if(subjectOf(lesson)!=='Mathématiques')return raw;
 const key=norm(raw+' '+safe(lesson?.title));
 if(/thales/.test(key))return 'Thalès';
 if(/pythagore/.test(key))return 'Pythagore';
 if(/litteral|developpement|programme de calcul/.test(key))return 'Calcul littéral';
 if(/fractions|puissance|nombres relatifs|calculs? numerique|ecriture scientifique/.test(key))return 'Calculs numériques';
 if(/automatismes/.test(key))return 'Automatismes';
 if(/revisions|evaluation|controle/.test(key))return 'Révisions / évaluation';
 return raw;
}
function isBisLesson(lesson){return lesson?.kind==='bis'||lesson?.category==='bis'||/^MBIS\d{2}$/.test(lesson?.id||'');}
function isBonusLesson(lesson){return lesson?.category==='bonus'||lesson?.kind==='bonus'||/^M26B_/.test(lesson?.id||'')||/cours bonus/i.test(lesson?.source||'');}
function groupsForLessons(rows,subject){
 const topics=[...new Set(rows.map(chapterOf))];
 if(subject==='Espagnol'){
  const groups=COURSE_GROUPS.filter(g=>g.topics.some(t=>topics.includes(t)));
  const covered=new Set(groups.flatMap(g=>g.topics));
  return [...groups,...topics.filter(t=>!covered.has(t)).map(t=>({title:t,topics:[t],icon:'▤',sub:'Chapitre '+t}))];
 }
 return topics.sort((a,b)=>a.localeCompare(b,'fr')).map(t=>({title:t,topics:[t],icon:'▤',sub:'Cours, devoirs et entraînements'}));
}
function setLessonSubject(name){
 if(name==='Physique-chimie'&&window.TIM_PHYSIQUE_PATH){page('matieres');renderMatiere(name);return;}if(name==='Anglais'&&window.TIM_ENGLISH_PATH){page('matieres');renderMatiere(name);return;}if(name==='SVT'&&window.TIM_SVT_PATH){page('matieres');renderMatiere(name);return;}if(name==='Histoire-géographie'&&window.TIM_HG_PATH){page('matieres');renderMatiere(name);return;}if(name==='Français'&&window.TIM_FR_PATH){page('matieres');renderMatiere(name);return;}
 lessonSubject=name;lessonGroup='';
 const selector=document.getElementById('lesson-topic');
 const topics=[...new Set(DATA.lessons.filter(l=>!name||subjectOf(l)===name).map(chapterOf))].sort((a,b)=>a.localeCompare(b,'fr'));
 selector.replaceChildren(new Option('Tous les chapitres','all'),...topics.map(t=>new Option(t,t)));
 selector.value='all';document.getElementById('lesson-search').value='';renderLessonIndex();
}
function exerciseGroupDefs(exs){
 const all=exs.map(e=>lessonBy(e.lesson)).filter(Boolean);
 return groupsForLessons(all,exerciseSubject||'Espagnol');
}
function groupTile(o,count,click,unit='fiche'){const b=E('button','group-card');b.type='button';const ic=E('span','group-icon',o.icon);b.append(ic);const txt=E('div');txt.append(E('strong','',o.title),E('small','',count+' '+unit+(count>1?'s':'')+' · '+o.sub));b.append(txt);b.addEventListener('click',click);return b;}
function renderLessonIndex(){
 const root=clear(document.getElementById('lesson-list'));
 const q=norm(document.getElementById('lesson-search').value),topic=document.getElementById('lesson-topic').value;
 const subjects=[...new Set([...SCHOOL_SUBJECTS,...DATA.lessons.map(subjectOf)])];
 if(!lessonSubject&&!q){
  root.className='matter-grid';document.getElementById('lesson-count').textContent='Choisis d’abord une matière :';
  for(const name of subjects){const count=DATA.lessons.filter(l=>subjectOf(l)===name).length;
   const b=E('button','matter-card');b.type='button';
   b.append(E('strong','',name),E('small','',count+' cours enregistré(s)'));
   if(count)b.addEventListener('click',()=>setLessonSubject(name));else b.disabled=true;
   root.append(b);
  }return;
 }
 const eligible=DATA.lessons.filter(l=>(!lessonSubject||subjectOf(l)===lessonSubject));
 const groups=groupsForLessons(eligible,lessonSubject||'Espagnol');
 if(lessonSubject&&!q&&!lessonGroup){
  root.className='clicklist group-picker';root.append(button('← Toutes les matières',()=>setLessonSubject(''),'group-back'));
  document.getElementById('lesson-count').textContent=lessonSubject+' · Choisis un chapitre :';
  for(const g of groups){const count=eligible.filter(l=>g.topics.includes(chapterOf(l))).length;
   root.append(groupTile(g,count,()=>{lessonGroup=g.title;renderLessonIndex();}));
  }return;
 }
 root.className='clicklist';
 if(lessonSubject)root.append(button('← Chapitres de '+lessonSubject,()=>{lessonGroup='';renderLessonIndex();},'group-back'));
 const group=groups.find(g=>g.title===lessonGroup);
 const found=eligible.filter(l=>(topic==='all'||chapterOf(l)===topic)&&(!group||q||group.topics.includes(chapterOf(l)))&&(!q||norm(l.title+' '+l.date+' '+l.topic+' '+l.summary+' '+l.source+' '+l.blocks.map(b=>JSON.stringify(b)).join(' ')).includes(q)));
 document.getElementById('lesson-count').textContent=found.length+' fiche(s) trouvée(s)';
 const entCourses=found.filter(l=>!isBisLesson(l)),bisCourses=found.filter(isBisLesson);
 if(entCourses.length){root.append(E('h3','lesson-type-label ent','COURS ENT · '+entCourses.length));for(const l of entCourses)root.append(cardAction(l.title,'Cours ENT · '+(l.date||'Séance enregistrée')+' · '+chapterOf(l),l.summary,()=>openLesson(l.id)));}
 if(bisCourses.length){root.append(E('h3','lesson-type-label bis','LEÇONS BIS ILLUSTRÉES · '+bisCourses.length));for(const l of bisCourses)root.append(cardAction(l.title,'Leçon BIS · '+chapterOf(l),l.summary,()=>openLesson(l.id)));}
 if(!found.length)root.append(notice('Aucune fiche trouvée pour cette recherche.'));
}
function openLesson(id){const l=lessonBy(id);if(!l)return;
 if(subjectOf(l)==='SVT'&&window.TIM_SVT_PATH){page('matieres');renderMatiere('SVT',id);return;}if(subjectOf(l)==='Histoire-géographie'&&window.TIM_HG_PATH){page('matieres');renderMatiere('Histoire-géographie',id);return;}if(subjectOf(l)==='Français'&&window.TIM_FR_PATH){page('matieres');renderMatiere('Français',id);return;}if(subjectOf(l)==='Anglais'&&window.TIM_ENGLISH_PATH){page('matieres');renderMatiere('Anglais',id);return;}if(subjectOf(l)==='Physique-chimie'&&window.TIM_PHYSIQUE_PATH){page('matieres');renderMatiere('Physique-chimie',id);return;}lessonSubject=subjectOf(l);lessonGroup='';page('cours');document.getElementById('lesson-index').classList.add('hide');const dest=clear(document.getElementById('lesson-detail'));dest.classList.add('active');
 const bis=isBisLesson(l),allSame=DATA.lessons.filter(x=>x.id!==l.id&&subjectOf(x)===subjectOf(l)&&chapterOf(x)===chapterOf(l)),others=allSame.filter(x=>bis?!isBisLesson(x):isBisLesson(x));
 dest.append(button('← Retour au sommaire',()=>{dest.classList.remove('active');document.getElementById('lesson-index').classList.remove('hide');scrollTop();},'plain back'));
 dest.append(E('p','lesson-type-label '+(bis?'bis':'ent'),bis?'LEÇON BIS · POUR MIEUX COMPRENDRE':'COURS ENT · DOCUMENT DU PROFESSEUR'),E('h2','',l.title),E('p','meta',bis?'Version pédagogique complémentaire':'Cours abordé : '+(l.date||'date non précisée')),E('p','',l.summary));
 if(bis){dest.append(notice('Cette leçon BIS complète le cours ENT ; elle ne remplace jamais la version du professeur.','note info'));}
 else {dest.append(notice('Les PDF et figures originaux du professeur apparaissent dans « Documents originaux » lorsqu’ils sont associés à ce cours. La fiche affichée ici peut être une synthèse ; elle n’est pas forcément une reproduction du PDF.','lesson-caution'));}
 const tabs=E('div','lesson-tabs');tabs.append(button('COURS ENT',()=>{const target=bis?others[0]:l;if(target)openLesson(target.id);else alert('Aucun cours ENT associé à ce chapitre.');},'plain'),button('LEÇON BIS',()=>{const target=bis?l:others[0];if(target)openLesson(target.id);else alert('Aucune leçon BIS associée à ce chapitre.');},'plain'));dest.append(tabs);
 if(others.length>1){const rel=E('div','panel');rel.append(E('h3','',bis?'Autres cours ENT de ce chapitre':'Leçons BIS de ce chapitre'));for(const other of others)rel.append(cardAction(other.title,bis?'Cours ENT':'Leçon BIS',other.summary,()=>openLesson(other.id)));dest.append(rel);}
 // Lettre personnelle de Tim : visionneuse privée identique dans le parcours Espagnol et la fiche ENT.
 if(l.id==='L05'&&window.TIM_SPANISH_LETTER)dest.append(window.TIM_SPANISH_LETTER.createPanel());
 // Les énoncés espagnols des captures ENT sont traduits sans remplacer les PDF de l'enseignante.
 if(subjectOf(l)==='Espagnol'&&window.TIM_SPANISH_ENT_ORIGINALS){dest.append(window.TIM_SPANISH_ENT_ORIGINALS.renderPanel(l.id));}
 // Les PDF d'origine sont prioritaires et consultables en lecteur mobile privé.
 if(!bis)dest.append(makeAttachmentPanel('lesson',l.id));
 for(const b of l.blocks)dest.append(buildBlock(b));loadInlineLessonFigures(dest,l.id);
 if(bis)dest.append(makeAttachmentPanel('lesson',l.id));
let related=DATA.exercises.filter(e=>e.lesson===l.id&&!e.id.startsWith('R'));let controls=E('div','panel separated');controls.append(E('h3','','S’entraîner sur cette leçon'));if(related.length){let list=E('div','clicklist');for(const ex of related)list.append(cardAction(ex.title,(ex.kind==='training'?'Entraînement · +1 / +0,5 / 0 XP':window.TIM_EXERCISE.school(ex)?'Devoir ENT · 0 XP':'Bonus · jusqu’à +2 XP')+' · '+quizLabel(ex),null,()=>openExercise(ex.id),attemptFor(ex.id)?'Terminé':'À faire'));controls.append(list);}else controls.append(E('p','','Un exercice pourra être ajouté ultérieurement.'));dest.append(controls);
let help=E('div','helpbox');help.append(E('h3','','Je n’ai pas compris'));help.append(E('p','','Voici une autre manière de comprendre. Les explications suivantes ont été écrites spécialement pour le classeur.'));const stage=E('div');let index=0;function step(){clear(stage);if(index===0){stage.append(badge('Niveau 1 · Explication simple'),E('p','',l.help.simple));}if(index===1){stage.append(badge('Niveau 2 · Étapes guidées'));let ol=E('ol');for(const x of l.help.steps)ol.append(E('li','',x));stage.append(ol,E('p','note info',l.help.example));}if(index>=2){stage.append(badge('Niveau 3 · Vérifier avec un exemple'));const ck=l.help.check;if(ck){stage.append(E('p','',ck.q));let opts=E('div','check-answers');ck.options.forEach((o,j)=>opts.append(button(o,()=>{msg.textContent=(j===ck.right?'Bonne réponse. ':'Ce n’est pas la bonne réponse. ')+ck.why;msg.style.color=j===ck.right?'var(--green)':'var(--red)';},'plain')));stage.append(opts);const msg=E('p','subtle','Cette mini-question est une aide, pas un exercice noté.');stage.append(msg);}else stage.append(E('p','',l.help.example));}next.textContent=index===0?'Explication pas à pas →':index===1?'Vérifier avec un exemple →':'Recommencer l’aide';}
const next=button('Explication pas à pas →',()=>{index=(index+1)%3;step();});help.append(stage,next);step();dest.append(help);
let arch=E('div','panel');arch.append(E('h3','','Historique des cours'));arch.append(E('p','small', 'Les originaux ENT doivent être ajoutés dans l’espace parent pour être consultables de façon privée, sans mettre les PDF scolaires sur un site public.'));arch.append(button('Voir le journal des séances',()=>page('archives'),'plain'));dest.append(arch);scrollTop();}
document.getElementById('lesson-search').addEventListener('input',renderLessonIndex);
function renderRevisions(){const root=clear(document.getElementById('revisions-content'));if(EXAM&&EXAM.date){const box=E('div','panel');box.append(badge('Contrôle confirmé'),E('h3','',EXAM.title+' — '+EXAM.date),E('p','',EXAM.topics||''));root.append(box);}else root.append(notice('Aucun prochain contrôle n’est actuellement renseigné. Dès qu’une date et un programme seront confirmés dans l’ENT, le parent pourra demander une mise à jour du classeur.','notice'));
let grid=E('div','clicklist');for(const l of DATA.lessons){const small=l.blocks.find(b=>b.kind==='table');grid.append(cardAction('Fiche '+l.id.slice(1)+' · '+l.title,l.date,small?small.rows.slice(0,2).map(r=>r[0]).join(' · '):l.summary,()=>openLesson(l.id)));}root.append(grid);}
function getRelevantRemedials(){const a=attempts(),miss=new Set();for(const t of a){if(!(t.correctionStatus==='released'&&Array.isArray(t.answers)&&t.answers.length>0))continue;t.answers.forEach((x,i)=>{if(x.correct===false){const skill=exerciseBy(t.id)?.questions[i]?.skill;if(skill&&DATA.skillToRemedy[skill])miss.add(DATA.skillToRemedy[skill]);}});}return [...miss].filter(id=>!attemptFor(id)).map(exerciseBy).filter(Boolean);}
/* Physique-chimie : les 21 exercices sécurisés utilisent leur banque serveur.
   Ils sont affichés dans le menu commun Exercices, sans fabriquer de faux DATA.exercises
   ni exposer les corrigés au navigateur. */
function openPhysicsTrainingFromExercises(id,lessonId,lessonName){
 if(!/^PCQ_L0[1-7]_0[1-3]$/.test(id)||!window.TIM_PHYSICS_TRAINING?.mount){
  alert('Le questionnaire sécurisé de physique-chimie est indisponible.');return;
 }
 page('exercices');
 const index=document.getElementById('exercise-index'),detail=document.getElementById('exercise-detail');
 index.classList.add('hide');
 const root=clear(detail);root.classList.add('active');
 root.append(button('← Retour aux exercices de physique-chimie',()=>{
  detail.classList.remove('active');index.classList.remove('hide');
  renderExerciseIndex();scrollTop();
 },'plain back'));
 root.append(E('p','lesson-type-label bis','PHYSIQUE-CHIMIE · EXERCICE BIS INTERACTIF'));
 root.append(E('h2','',lessonName));
 root.append(E('p','intro',window.__TIM_PARENT?'Mode essai Parent : répondez aux dix questions et obtenez les corrections sans enregistrer de note ni d’XP pour Tim.':'Dix questions, une seule tentative pour Tim. La note et les explications apparaissent après validation et sont visibles sur le compte Parent.'));
 root.append(button('Revoir la leçon avant de répondre',()=>{page('matieres');renderMatiere('Physique-chimie',lessonId);},'plain'));
 const slot=E('div','pc-global-training-slot');root.append(slot);
 window.TIM_PHYSICS_TRAINING.mount(id,slot).catch(e=>{
  slot.replaceChildren(notice('Questionnaire indisponible : '+String(e?.message||e)));
 });
 scrollTop();
}
function renderPhysicsExerciseDirectory(root,toolbar){
 document.getElementById('exercise-search').closest('.toolrow').classList.add('hide');
 root.className='clicklist';
 const names=['Je comprends les mots','J’applique la leçon','Je réponds seul'];
 toolbar.append(button('← Toutes les matières',()=>{
  exerciseSubject='';exerciseGroup='';exerciseMode='';
  renderExerciseIndex();scrollTop();
 },'group-back'),E('h3','','Physique-chimie'));
 document.getElementById('exercise-count').textContent='Physique-chimie · 2 exercices ENT originaux + 21 BIS interactifs';
 root.append(E('p','exercise-type-prompt',window.__TIM_PARENT?'Compte Parent : choisissez une leçon et réalisez un essai des dix questions. Vous verrez la correction sans modifier le score, les XP ni la tentative de Tim.':'Choisis une leçon puis un exercice. Réponds directement sur le site : aucun PDF à remplir. Une seule validation, correction et note immédiates.'));
 const originals=E('section','pc-official-ent-list');
 originals.style.cssText='border:1px solid #aac6e1;background:#edf5fd;border-radius:13px;padding:14px;margin:14px 0;color:#243f61';
 originals.append(E('h3','','Exercices ENT du professeur — 2 fiches à remplir'));
 const originalList=E('div','pc-official-ent-cards');
 if(window.TIM_PHYSICS_ENT?.renderDirectory)window.TIM_PHYSICS_ENT.renderDirectory(originalList);
 else originalList.append(E('p','','Les exercices ENT ne sont pas disponibles.'));
 originals.append(originalList);root.append(originals);
 root.append(E('h3','','Exercices BIS — 21 entraînements interactifs'));

 for(let i=1;i<=7;i++){
  const num=String(i).padStart(2,'0'),lessonId='PC_BIS'+num;
  const l=lessonBy(lessonId);
  if(!l)continue;
  const section=E('section','pc-exercise-lesson');
  section.style.cssText='margin:14px 0 20px;padding:16px 13px;background:#f8faff;color:#253d60;border:1px solid #cbd8e7;border-radius:15px';
  section.append(E('h3','', 'Leçon '+i+' — '+l.title));
  section.append(button('Revoir cette leçon',()=>{page('matieres');renderMatiere('Physique-chimie',lessonId);},'plain'));
  const list=E('div','clicklist');
  list.style.cssText='display:grid;gap:10px;margin-top:12px';
  for(let series=1;series<=3;series++){
   const id='PCQ_L'+num+'_0'+series;
   list.append(cardAction('Exercice '+series+' — '+names[series-1],
    window.__TIM_PARENT?'10 questions · essai Parent sans note ni XP':'10 questions · correction immédiate · une tentative',
    series===3?'Réponses courtes à écrire directement dans le classeur.':'Questions à choix multiples, directement dans le classeur.',
    ()=>openPhysicsTrainingFromExercises(id,lessonId,l.title)));
  }
  section.append(list);root.append(section);
 }
}
/* Anglais : les mêmes cartes d'exercices que pour la physique-chimie,
   sans confondre questionnaires BIS et documents authentiques de l'ENT. */
const ENGLISH_SERIES={
 EN_BIS01:['Comprendre les mots','Appliquer la chronologie','Rédiger des réponses'],
 EN_BIS02:['Reconnaître les noms en -ness','Appliquer la règle','Écrire sans modèle']
};
const ENGLISH_CHAPTERS=['Vacances et prétérit','Personnalité','Similitudes et présentation','Musique et vocabulaire','Actions passées et simultanéité'];
function englishSeriesFor(bis){
 return ENGLISH_SERIES[bis.id]||['Comprendre et rédiger'];
}
function openEnglishTrainingFromExercises(id,lessonId,title){
 if(!/^ENQ_L0[1-7]_0[1-3]$/.test(id)||!window.TIM_ENGLISH_TRAINING?.mount){
  alert('Le questionnaire interactif d’anglais est momentanément indisponible.');
  return;
 }
 exerciseSubject='Anglais';
 page('exercices');
 const index=document.getElementById('exercise-index'),detail=document.getElementById('exercise-detail');
 index.classList.add('hide');
 const root=clear(detail);root.classList.add('active');
 root.append(button('← Retour aux exercices d’anglais',()=>{
  detail.classList.remove('active');index.classList.remove('hide');
  renderExerciseIndex();scrollTop();
 },'plain back'));
 root.append(E('p','lesson-type-label bis','ANGLAIS · ENTRAÎNEMENT INTERACTIF'));
 root.append(E('h2','',title));
 root.append(E('p','intro',window.__TIM_PARENT?
  'Essai Parent : dix questions et leur correction, sans enregistrer de tentative, note ou XP pour Tim.':
  'Dix questions · une seule tentative pour Tim · note et correction détaillées après validation.'));
 root.append(button('Revoir cette leçon avant l’exercice',()=>{page('matieres');renderMatiere('Anglais',lessonId);},'plain'));
 const slot=E('div','en-global-training-slot');root.append(slot);
 Promise.resolve(window.TIM_ENGLISH_TRAINING.mount(id,slot)).catch(error=>{
  slot.replaceChildren(notice('Questionnaire indisponible : '+String(error?.message||error)));
 });
 scrollTop();
}
function renderEnglishExerciseDirectory(root,toolbar){
 const finder=document.getElementById('exercise-search').closest('.toolrow');
 finder.classList.add('hide');root.className='clicklist';
 toolbar.append(button('← Toutes les matières',()=>{
  exerciseSubject='';exerciseGroup='';exerciseMode='';
  renderExerciseIndex();scrollTop();
 },'group-back'),E('h3','','🇬🇧 Anglais — mes exercices'));
 const pack=window.TIM_ANGLAIS_PACK;
 const bis=Array.isArray(pack?.bis)?pack.bis:[];
 if(!bis.length){
  root.append(notice('Le répertoire des leçons d’anglais est indisponible. Aucun exercice ne peut être lancé.'));
  return;
 }
 const total=bis.reduce((n,b)=>n+englishSeriesFor(b).length,0);
 document.getElementById('exercise-count').textContent='Anglais · '+total+' exercices interactifs · 9 documents ENT';
 root.append(E('p','exercise-type-prompt',window.__TIM_PARENT?
  'Choisissez un exercice précis : vous pourrez répondre en mode essai Parent, sans modifier les résultats ni XP de Tim.':
  'Choisis le chapitre et l’exercice. Réponds directement dans le classeur ; une seule validation et correction détaillée.'));
 for(const chapter of ENGLISH_CHAPTERS){
  const lessons=bis.filter(b=>b.group===chapter);
  if(!lessons.length)continue;
  const section=E('section','pc-exercise-lesson');
  section.style.cssText='margin:14px 0 18px;padding:15px;background:#f8faff;color:#253d60;border:1px solid #cbd8e7;border-radius:15px';
  section.append(E('h3','','🇬🇧 '+chapter));
  for(const lesson of lessons){
   const title=String(lesson.title||'Leçon BIS');
   section.append(E('h4','',title));
   section.append(button('Revoir la leçon BIS',()=>{page('matieres');renderMatiere('Anglais',lesson.id);},'plain'));
   const list=E('div','clicklist');list.style.cssText='display:grid;gap:9px;margin:10px 0 16px';
   for(const [ix,caption] of englishSeriesFor(lesson).entries()){
    const id='ENQ_L'+lesson.id.slice(-2)+'_0'+(ix+1);
    list.append(cardAction('Exercice '+(ix+1)+' — '+caption,
     window.__TIM_PARENT?'10 questions · essai Parent · 0 XP':'10 questions · note et corrigé immédiats',
     'Thème : '+title+' · Exercice BIS créé pour s’entraîner, et non une fiche originale ENT.',
     ()=>openEnglishTrainingFromExercises(id,lesson.id,title)));
   }
   section.append(list);
  }
  root.append(section);
 }
 const docs=Array.isArray(pack.attachments)?pack.attachments:[];
 const ent=E('section','pc-official-ent-list');
 ent.style.cssText='margin:18px 0;padding:15px;background:#edf5fd;color:#243f61;border:1px solid #aac6e1;border-radius:14px';
 ent.append(E('h3','','Documents et corrections du professeur (ENT) · '+docs.length));
 ent.append(E('p','','Ce sont les pièces originales récupérées dans l’ENT. Certaines sont des leçons ou des corrigés, et non des formulaires notés. Elles restent consultables dans le compte privé.'));
 const byTarget=new Map();
 for(const file of docs){if(!byTarget.has(file.target))byTarget.set(file.target,[]);byTarget.get(file.target).push(file);}
 for(const [target,items] of byTarget){
  const row=E('details','pc-doc-row');row.style.cssText='margin:9px 0;padding:10px;border:1px solid #c2d3e5;border-radius:10px;background:#fff';
  const date=target.slice(-8),day=date.slice(6,8)+'/'+date.slice(4,6);
  row.append(E('summary','',''+day+' — '+items.map(i=>i.name).join(' · ')));
  const slot=E('div');row.append(slot);
  row.addEventListener('toggle',()=>{
   if(!row.open||row.dataset.loaded==='yes')return;
   row.dataset.loaded='yes';
   if(window.TIM_ENGLISH_DOCUMENTS?.render)
    Promise.resolve(window.TIM_ENGLISH_DOCUMENTS.render(target,slot)).catch(e=>slot.append(notice('Document indisponible : '+(e.message||e))));
   else slot.append(notice('Lecteur des documents ENT momentanément indisponible.'));
  });
  ent.append(row);
 }
 root.append(ent);
 const homework=Array.isArray(pack.homework)?pack.homework:[];
 if(homework.length){
  const listing=E('details','panel');
  listing.style.cssText='padding:14px;margin:12px 0';
  listing.append(E('summary','','Consignes et devoirs de l’ENT · '+homework.length+' entrées'));
  listing.append(E('p','','L’ENT contient ces consignes. Cela ne prouve pas que les exercices ont été réalisés ni corrigés par Tim.'));
  for(const task of homework){
   const day=String(task.due||'').slice(8,10)+'/'+String(task.due||'').slice(5,7);
   listing.append(E('p','',day+' — '+task.title+(task.content?' : '+task.content:'')));
  }
  root.append(listing);
 }
}

/* SVT : mêmes accès directs que les exercices d'anglais et de physique. */
function openSvtTrainingFromExercises(id,lessonId,title){
 if(!/^SVQ_L0[1-7]_0[1-2]$/.test(id)||!window.TIM_SVT_TRAINING?.mount){
  alert('Questionnaire SVT indisponible.');return;
 }
 exerciseSubject='SVT';
 page('exercices');
 const index=document.getElementById('exercise-index'),detail=document.getElementById('exercise-detail');
 index.classList.add('hide');
 const root=clear(detail);root.classList.add('active');
 root.append(button('← Retour aux exercices de SVT',()=>{
  detail.classList.remove('active');index.classList.remove('hide');
  renderExerciseIndex();scrollTop();
 },'plain back'));
 root.append(E('h2','',title));
 root.append(E('p','intro',window.__TIM_PARENT?
  'Mode Parent : dix questions, correction complète, sans enregistrer de note ou XP pour Tim.':
  'Dix questions. Une seule tentative, note et correction immédiatement après validation.'));
 root.append(button('Revoir la leçon BIS',()=>{page('matieres');renderMatiere('SVT',lessonId);},'plain'));
 const slot=E('div','svt-global-training-slot');root.append(slot);
 Promise.resolve(window.TIM_SVT_TRAINING.mount(id,slot)).catch(e=>slot.append(notice('Exercice indisponible : '+String(e?.message||e))));
 scrollTop();
}
function renderSvtExerciseDirectory(root,toolbar){
 const finder=document.getElementById('exercise-search').closest('.toolrow');
 finder.classList.add('hide');root.className='clicklist';
 toolbar.append(button('← Toutes les matières',()=>{exerciseSubject='';exerciseGroup='';exerciseMode='';renderExerciseIndex();scrollTop();},'group-back'),E('h3','','🌱 SVT — Mes exercices'));
 const pack=window.TIM_SVT_PACK,chapters=pack?.chapters||[],bis=pack?.bis||[];
 if(!bis.length){root.append(notice('Les leçons SVT ne sont pas disponibles.'));return;}
 document.getElementById('exercise-count').textContent='SVT · 14 exercices de 10 questions';
 root.append(E('p','exercise-type-prompt',window.__TIM_PARENT?
  'Choisis un questionnaire : essai Parent sans enregistrer de copie ni de XP.':
  'Choisis la leçon et le type de questions. Chaque exercice ne se valide qu’une fois.'));
 for(const chapter of chapters){
  const lessons=bis.filter(b=>b.group===chapter);
  const section=E('section','svt-exercise-lesson');
  section.style.cssText='margin:12px 0;padding:14px;background:#f3f9fb;color:#244451;border:1px solid #b9d8d5;border-radius:14px';
  section.append(E('h3','','🌱 '+chapter));
  for(const b of lessons){
   section.append(E('h4','',b.title));
   section.append(button('Leçon BIS illustrée',()=>{page('matieres');renderMatiere('SVT',b.id);},'plain'));
   for(let i=1;i<=2;i++){
    const id='SVQ_L'+b.id.slice(-2)+'_0'+i;
    section.append(cardAction('Exercice '+i+' — '+(i===1?'Comprendre les notions':'Répondre par écrit'),
     '10 questions · note /10 · correction immédiate',
     'Entraînement BIS créé à partir du cours · '+b.title,
     ()=>openSvtTrainingFromExercises(id,b.id,b.title+' · exercice '+i)));
   }
  }
  root.append(section);
 }
 const ent=E('details','panel');
 ent.style.cssText='margin:15px 0;padding:12px';
 ent.append(E('summary','','Consignes et devoirs d’origine ENT · '+pack.homework.length));
 ent.append(E('p','','Ces consignes ont été récupérées du cahier de textes et ne sont pas automatiquement des exercices réalisés ou notés par Tim.'));
 for(const h of pack.homework)ent.append(E('p','',h.due.slice(8,10)+'/'+h.due.slice(5,7)+' — '+h.title+' : '+h.content));
 root.append(ent);
 if(pack.attachments?.length){
  const original=E('section','panel');
  original.style.cssText='margin:12px 0;padding:14px';
  original.append(E('h3','','Fichier original du professeur : '+pack.attachments[0].name));
  original.append(button('Ouvrir la séance du 3 novembre',()=>{page('matieres');renderMatiere('SVT','SVT_ENT_20261103');},'plain'));
  root.append(original);
 }
}
/* Histoire-géographie : mêmes accès directs que les exercices d'anglais et de physique. */
function openHgTrainingFromExercises(id,lessonId,title){
 if(!/^HGQ_L0[1-8]_0[1-2]$/.test(id)||!window.TIM_HG_TRAINING?.mount){
  alert('Questionnaire Histoire-géographie indisponible.');return;
 }
 exerciseSubject='Histoire-géographie';
 page('exercices');
 const index=document.getElementById('exercise-index'),detail=document.getElementById('exercise-detail');
 index.classList.add('hide');
 const root=clear(detail);root.classList.add('active');
 root.append(button('← Retour aux exercices d’histoire-géographie',()=>{
  detail.classList.remove('active');index.classList.remove('hide');
  renderExerciseIndex();scrollTop();
 },'plain back'));
 root.append(E('h2','',title));
 root.append(E('p','intro',window.__TIM_PARENT?
  'Mode Parent : dix questions, correction complète, sans enregistrer de note ou XP pour Tim.':
  'Dix questions. Une seule tentative, note et correction immédiatement après validation.'));
 root.append(button('Revoir la leçon BIS',()=>{page('matieres');renderMatiere('Histoire-géographie',lessonId);},'plain'));
 const slot=E('div','hg-global-training-slot');root.append(slot);
 Promise.resolve(window.TIM_HG_TRAINING.mount(id,slot)).catch(e=>slot.append(notice('Exercice indisponible : '+String(e?.message||e))));
 scrollTop();
}
function renderHgExerciseDirectory(root,toolbar){
 const finder=document.getElementById('exercise-search').closest('.toolrow');
 finder.classList.add('hide');root.className='clicklist';
 toolbar.append(button('← Toutes les matières',()=>{exerciseSubject='';exerciseGroup='';exerciseMode='';renderExerciseIndex();scrollTop();},'group-back'),E('h3','','🌍 Histoire-géographie — Mes exercices'));
 const pack=window.TIM_HG_PACK,chapters=pack?.chapters||[],bis=pack?.bis||[];
 if(!bis.length){root.append(notice('Les leçons Histoire-géographie ne sont pas disponibles.'));return;}
 document.getElementById('exercise-count').textContent='Histoire-géographie · '+((window.TIM_HG_PACK?.bis?.length||0)*2)+' exercices de 10 questions';
 root.append(E('p','exercise-type-prompt',window.__TIM_PARENT?
  'Choisis un questionnaire : essai Parent sans enregistrer de copie ni de XP.':
  'Choisis la leçon et le type de questions. Chaque exercice ne se valide qu’une fois.'));
 for(const chapter of chapters){
  const lessons=bis.filter(b=>b.group===chapter);
  const section=E('section','hg-exercise-lesson');
  section.style.cssText='margin:12px 0;padding:14px;background:#f3f9fb;color:#244451;border:1px solid #b9d8d5;border-radius:14px';
  section.append(E('h3','','🌍 '+chapter));
  for(const b of lessons){
   section.append(E('h4','',b.title));
   section.append(button('Leçon BIS illustrée',()=>{page('matieres');renderMatiere('Histoire-géographie',b.id);},'plain'));
   for(let i=1;i<=2;i++){
    const id='HGQ_L'+b.id.slice(-2)+'_0'+i;
    section.append(cardAction('Exercice '+i+' — '+(i===1?'Comprendre les notions':'Répondre par écrit'),
     '10 questions · note /10 · correction immédiate',
     'Entraînement BIS créé à partir du cours · '+b.title,
     ()=>openHgTrainingFromExercises(id,b.id,b.title+' · exercice '+i)));
   }
  }
  root.append(section);
 }
 const ent=E('details','panel');
 ent.style.cssText='margin:15px 0;padding:12px';
 ent.append(E('summary','','Consignes et devoirs d’origine ENT · '+pack.homework.length));
 ent.append(E('p','','Ces consignes ont été récupérées du cahier de textes et ne sont pas automatiquement des exercices réalisés ou notés par Tim.'));
 for(const h of pack.homework)ent.append(E('p','',h.due.slice(8,10)+'/'+h.due.slice(5,7)+' — '+h.title+' : '+h.content));
 root.append(ent);
 if(pack.attachments?.length){
  const original=E('section','panel');
  original.style.cssText='margin:12px 0;padding:14px';
  original.append(E('h3','','Fichier original du professeur : '+pack.attachments[0].name));
  original.append(button('Ouvrir la séance du 23 septembre',()=>{page('matieres');renderMatiere('Histoire-géographie','HG_ENT_20260923');},'plain'));
  root.append(original);
 }
}
/* Français : mêmes accès directs que les exercices d'anglais et de physique. */
function openFrTrainingFromExercises(id,lessonId,title){
 if(!/^FRQ_L(?:0[1-9]|1[01])_0[1-2]$/.test(id)||!window.TIM_FR_TRAINING?.mount){
  alert('Questionnaire de français indisponible.');return;
 }
 exerciseSubject='Français';
 page('exercices');
 const index=document.getElementById('exercise-index'),detail=document.getElementById('exercise-detail');
 index.classList.add('hide');
 const root=clear(detail);root.classList.add('active');
 root.append(button('← Retour aux exercices de français',()=>{
  detail.classList.remove('active');index.classList.remove('hide');
  renderExerciseIndex();scrollTop();
 },'plain back'));
 root.append(E('h2','',title));
 root.append(E('p','intro',window.__TIM_PARENT?
  'Mode Parent : dix questions, correction complète, sans enregistrer de note ou XP pour Tim.':
  'Dix questions. Une seule tentative, note et correction immédiatement après validation.'));
 root.append(button('Revoir la leçon BIS',()=>{page('matieres');renderMatiere('Français',lessonId);},'plain'));
 const slot=E('div','fr-global-training-slot');root.append(slot);
 Promise.resolve(window.TIM_FR_TRAINING.mount(id,slot)).catch(e=>slot.append(notice('Exercice indisponible : '+String(e?.message||e))));
 scrollTop();
}
function renderFrExerciseDirectory(root,toolbar){
 const finder=document.getElementById('exercise-search').closest('.toolrow');
 finder.classList.add('hide');root.className='clicklist';
 toolbar.append(button('← Toutes les matières',()=>{exerciseSubject='';exerciseGroup='';exerciseMode='';renderExerciseIndex();scrollTop();},'group-back'),E('h3','','📖 Français — Mes exercices'));
 const pack=window.TIM_FR_PACK,chapters=pack?.chapters||[],bis=pack?.bis||[];
 if(!bis.length){root.append(notice('Les leçons Français ne sont pas disponibles.'));return;}
 document.getElementById('exercise-count').textContent='Français · 22 exercices de 10 questions';
 root.append(E('p','exercise-type-prompt',window.__TIM_PARENT?
  'Choisis un questionnaire : essai Parent sans enregistrer de copie ni de XP.':
  'Choisis la leçon et le type de questions. Chaque exercice ne se valide qu’une fois.'));
 for(const chapter of chapters){
  const lessons=bis.filter(b=>b.group===chapter);
  const section=E('section','fr-exercise-lesson');
  section.style.cssText='margin:12px 0;padding:14px;background:#f3f9fb;color:#244451;border:1px solid #b9d8d5;border-radius:14px';
  section.append(E('h3','','📖 '+chapter));
  for(const b of lessons){
   section.append(E('h4','',b.title));
   section.append(button('Leçon BIS illustrée',()=>{page('matieres');renderMatiere('Français',b.id);},'plain'));
   for(let i=1;i<=2;i++){
    const id='FRQ_L'+b.id.slice(-2)+'_0'+i;
    section.append(cardAction('Exercice '+i+' — '+(i===1?'Comprendre les notions':'Répondre par écrit'),
     '10 questions · note /10 · correction immédiate',
     'Entraînement BIS créé à partir du cours · '+b.title,
     ()=>openFrTrainingFromExercises(id,b.id,b.title+' · exercice '+i)));
   }
  }
  root.append(section);
 }
 const ent=E('details','panel');
 ent.style.cssText='margin:15px 0;padding:12px';
 ent.append(E('summary','','Consignes et devoirs d’origine ENT · '+pack.homework.length));
 ent.append(E('p','','Ces consignes ont été récupérées du cahier de textes et ne sont pas automatiquement des exercices réalisés ou notés par Tim.'));
 for(const h of pack.homework)ent.append(E('p','',h.due.slice(8,10)+'/'+h.due.slice(5,7)+' — '+h.title+' : '+h.content));
 root.append(ent);
 if(pack.attachments?.length){
  const originals=E('details','panel');
  originals.style.cssText='margin:14px 0;padding:14px';
  originals.append(E('summary','','PDF originaux de M. Simiez · '+pack.attachments.length+' références ENT'));
  originals.append(E('p','','Ces documents sont des fiches de travail du professeur et non des exercices créés. Certains fichiers sont des exemplaires identiques rattachés à des séances différentes.'));
  const groups=new Map();
  for(const doc of pack.attachments){
   if(!groups.has(doc.target))groups.set(doc.target,[]);
   groups.get(doc.target).push(doc);
  }
  for(const [target,docs] of groups){
   const row=E('details','fr-document-row');
   row.style.cssText='margin:9px 0;padding:10px;background:#f5faff;color:#284052;border-radius:10px';
   row.append(E('summary','',docs[0].date.slice(8,10)+'/'+docs[0].date.slice(5,7)+' — '+docs.map(d=>d.name).join(' · ')));
   const slot=E('div');row.append(slot);
   row.addEventListener('toggle',()=>{
    if(!row.open||row.dataset.loaded==='yes')return;
    row.dataset.loaded='yes';
    Promise.resolve(window.TIM_FR_DOCUMENTS?.render(target,slot)).catch(e=>slot.append(notice('Document indisponible : '+String(e.message||e))));
   });
   originals.append(row);
  }
  root.append(originals);
 }
}
function renderMathOfficialExercises(root,toolbar){
 const finder=document.getElementById('exercise-search').closest('.toolrow');
 finder.classList.add('hide');root.className='clicklist';
 toolbar.append(button('← Toutes les matières',()=>{
  exerciseSubject='';exerciseMode='';exerciseGroup='';
  renderExerciseIndex();scrollTop();
 },'group-back'),E('h3','','Mathématiques — exercices ENT du professeur'));
 document.getElementById('exercise-count').textContent='Mathématiques · 2 fiches ENT interactives · note sur 10 et XP';
 const intro=E('p','exercise-type-prompt',window.__TIM_PARENT
  ?'Compte Parent : remplissez les exercices originaux en mode essai, avec correction sans toucher aux notes ni aux XP de Tim.'
  :'Compte Tim : deux vraies fiches de Mme Pialet à remplir ici, avec une seule validation, note, correction et XP.');
 root.append(intro);
 const directory=E('section','math-ent-main-directory');directory.style.cssText='margin:12px 0';
 if(window.TIM_MATH_ENT?.renderDirectory)window.TIM_MATH_ENT.renderDirectory(directory);
 else directory.append(E('p','','Les formulaires originaux de maths sont momentanément indisponibles.'));
 root.append(directory);
 root.append(button('Voir les leçons et évaluations BIS de mathématiques',()=>{
  page('matieres');renderMatiere('Mathématiques');
 },'plain'));
}
function renderExerciseIndex(){
 const root=clear(document.getElementById('exercise-list')),q=norm(document.getElementById('exercise-search').value),topic=document.getElementById('exercise-topic').value;
 const toolbar=clear(document.getElementById('exercise-subject-toolbar'));
 const finder=document.getElementById('exercise-search').closest('.toolrow');
 const extras=clear(document.getElementById('recommended-extra'));
 const bases=DATA.exercises.filter(e=>!window.TIM_EXERCISE.challenge(e));
 if(exerciseSubject==='Physique-chimie'){renderPhysicsExerciseDirectory(root,toolbar);return;}
 if(exerciseSubject==='Anglais'){renderEnglishExerciseDirectory(root,toolbar);return;}
  if(exerciseSubject==='SVT'){renderSvtExerciseDirectory(root,toolbar);return;}
  if(exerciseSubject==='Histoire-géographie'){renderHgExerciseDirectory(root,toolbar);return;}
 if(exerciseSubject==='Français'){renderFrExerciseDirectory(root,toolbar);return;}
 if(exerciseSubject==='Mathématiques'){renderMathOfficialExercises(root,toolbar);return;}
 if(!exerciseSubject){
  finder.classList.add('hide');root.className='matter-grid';
  if(exerciseMode==='homework-bonus'){
   root.className='clicklist';
   document.getElementById('exercise-count').textContent='Exercices bonus des devoirs · XP selon chaque exercice';
   const back=button('← Tous les exercices',()=>{exerciseMode='';renderExerciseIndex();},'group-back');
   back.style.setProperty('color','#e6efff','important');toolbar.append(back);
   const homework=bases.filter(e=>e.homeworkBonus===true);
   if(!homework.length){
    const empty=notice('Aucun exercice bonus de devoirs n’est encore publié. Les exercices préparés ensemble apparaîtront ici, sans modifier tes devoirs de l’ENT.');
    empty.style.color='#243c5b';root.append(empty);
   }
   else for(const ex of homework)root.append(cardAction(ex.title,(ex.subject||'Espagnol')+' · Exercice de révision · barème XP indiqué sur la fiche',exerciseDescription(ex),()=>openExercise(ex.id),attemptFor(ex.id)?'Terminé':'À faire'));
   return;
  }
  if(exerciseMode==='school-all'){
   root.className='clicklist';const schoolwork=bases.filter(e=>window.TIM_EXERCISE.mode(e)==='school');
   document.getElementById('exercise-count').textContent='Devoirs de l’école · XP selon l’exercice';toolbar.append(button('← Toutes les matières',()=>{exerciseMode='';renderExerciseIndex();},'group-back'));
   if(!schoolwork.length)root.append(notice('Aucun devoir de l’ENT n’a encore été publié dans le classeur.'));
   else for(const ex of schoolwork)root.append(cardAction(ex.title,(ex.subject||'Espagnol')+' · '+(ex.kind==='training'?'jusqu’à +1 XP':'0 XP'),exerciseDescription(ex),()=>openExercise(ex.id),attemptFor(ex.id)?'Terminé':'À faire'));return;
  }
  if(exerciseMode==='bonus-mission'){
   root.className='clicklist';document.getElementById('exercise-count').textContent='Défi bonus du jour';
   toolbar.append(button('← Toutes les matières',()=>{exerciseMode='';renderExerciseIndex();},'group-back'));
   root.append(bonusMissionPanel(false));return;
  }
  document.getElementById('exercise-count').textContent='Devoirs de l’école et exercices bonus :';
  const overview=E('div','exercise-v12-overview');
  overview.append(button('📚 DEVOIRS DE L’ÉCOLE',()=>{exerciseSubject='';exerciseMode='school-all';renderExerciseIndex();},'exercise-v12-overview-button school'));
  root.append(overview,bonusMissionPanel(false));
  const icons=['🇪🇸','∑','⚗','EN','📖','🌍','⚖','🌱','⚙'];
  SCHOOL_SUBJECTS.forEach((name,i)=>{const count=name==='Physique-chimie'?23:name==='Anglais'?11:name==='SVT'?14:name==='Histoire-géographie'?(window.TIM_HG_PACK?.bis?.length||0)*2:name==='Français'?22:name==='Mathématiques'?2+bases.filter(e=>(e.subject||'Espagnol')===name).length:bases.filter(e=>(e.subject||'Espagnol')===name).length;
    const b=E('button','matter-card'+(name==='Espagnol'?' matter-espanol':''));b.type='button';
    b.append(E('span','ico',name==='Anglais'?'🇬🇧':name==='SVT'?'🌱':name==='Histoire-géographie'?'🌍':name==='Français'?'📖':icons[i]||'▤'),E('strong','',name),E('small','',count?count+' exercice(s) disponible(s)':'À compléter avec les cours de Tim'));
    if(count)b.addEventListener('click',()=>{exerciseSubject=name;exerciseGroup='';exerciseMode='';document.getElementById('exercise-search').value='';renderExerciseIndex();scrollTop();});
    else {b.disabled=true;b.classList.add('pending-subject');}root.append(b);
  });return;
 }
 finder.classList.remove('hide');root.className='clicklist';
 toolbar.append(button('← Toutes les matières',()=>{exerciseSubject='';exerciseGroup='';exerciseMode='';document.getElementById('exercise-search').value='';renderExerciseIndex();scrollTop();},'group-back'),E('h3','',exerciseSubject));
 const bySubject=bases.filter(e=>(e.subject||'Espagnol')===exerciseSubject);
 if(!exerciseMode&&!q){
  finder.classList.add('hide');document.getElementById('exercise-count').textContent='Choisis ta mission :';
  const choices=E('div','exercise-type-choice');
  for(const [mode,label,icon,desc] of [
   ['school','DEVOIRS DE L’ÉCOLE','📚','Devoirs ENT et entraînements liés · XP selon le barème de chaque exercice.'],
   ['bonus','EXERCICES BONUS','⭐','Exercices créés pour s’entraîner · XP selon le barème de chaque exercice.']
  ]){
   const found=bySubject.filter(e=>window.TIM_EXERCISE.mode(e)===mode);
   const tile=E('button','exercise-type-tile '+mode);tile.type='button';
   tile.append(E('span','type-icon',icon),E('strong','',label),E('small','',desc),E('span','type-counter',found.length+' exercice(s)'));
   tile.addEventListener('click',()=>{exerciseMode=mode;exerciseGroup='';renderExerciseIndex();});choices.append(tile);
  }
  root.append(E('p','exercise-type-prompt','Le nombre d’XP dépend de l’exercice et de ta note. Le barème est indiqué sur chaque fiche.'),choices);
  return;
 }
 // Défi bonus du jour : aucun exercice sans ajout explicite.
 if(exerciseMode==='bonus'&&!q){
  finder.classList.add('hide');
  document.getElementById('exercise-count').textContent='Tes missions bonus en '+exerciseSubject;
  toolbar.append(button('← Devoirs / bonus',()=>{exerciseMode='';exerciseGroup='';renderExerciseIndex();},'group-back'));
  root.append(bonusMissionPanel(false,exerciseSubject));return;
 }
 finder.classList.remove('hide');
 if(exerciseMode)toolbar.append(button('← Devoirs / bonus',()=>{exerciseMode='';exerciseGroup='';document.getElementById('exercise-search').value='';renderExerciseIndex();},'group-back'));
 const categoryExercises=bySubject.filter(e=>!exerciseMode||window.TIM_EXERCISE.mode(e)===(exerciseMode==='bonus-all'?'bonus':exerciseMode));
 const groups=exerciseGroupDefs(categoryExercises);
 if(!q&&!exerciseGroup){
  root.classList.add('group-picker');document.getElementById('exercise-count').textContent=exerciseMode==='bonus-all'?'Tous les exercices bonus · Choisis un thème :':exerciseMode==='school'?'Devoirs de l’école · Choisis un thème :':'Exercices bonus · Choisis un thème :';
  if(!categoryExercises.length){root.append(notice(exerciseMode==='school'?'Aucun devoir de l’ENT publié pour cette matière.':'Aucun exercice bonus pour le moment.')); return;}
  for(const g of groups){const count=categoryExercises.filter(e=>g.topics.includes(chapterOf(lessonBy(e.lesson)))).length;root.append(groupTile({...g,sub:g.sub.replace('Identité, goûts, écrire une lettre','Questions sur toi et tes goûts')},count,()=>{exerciseGroup=g.title;renderExerciseIndex();},'exercice'));}return;
 }
 root.classList.remove('group-picker');
 if(exerciseGroup&&!q)root.append(button('← Tous les thèmes',()=>{exerciseGroup='';renderExerciseIndex();},'group-back'));
 const group=groups.find(g=>g.title===exerciseGroup);
 const found=categoryExercises.filter(e=>{const l=lessonBy(e.lesson);return l&&(topic==='all'||chapterOf(l)===topic)&&(!group||q||group.topics.includes(chapterOf(l)))&&(!q||norm(e.title+' '+l.title+' '+quizLabel(e)).includes(q));});
 document.getElementById('exercise-count').textContent=found.length+' exercice(s) · '+found.filter(e=>attemptFor(e.id)).length+' terminé(s)';
 for(const ex of found)root.append(cardAction(ex.title,lessonBy(ex.lesson).title+' · '+quizLabel(ex),exerciseDescription(ex),()=>openExercise(ex.id),attemptFor(ex.id)?'Terminé':'À faire'));
 if(!found.length)root.append(notice('Aucun exercice dans cette sélection.'));
 const available=getRelevantRemedials().filter(e=>(e.subject||'Espagnol')===exerciseSubject&&(!exerciseMode||window.TIM_EXERCISE.mode(e)===exerciseMode));
 if(available.length&&!exerciseMode){extras.append(E('h3','separated','Nouveaux exercices conseillés après une erreur'));const c=E('div','clicklist');for(const ex of available)c.append(cardAction(ex.title,lessonBy(ex.lesson).title,'Questions différentes de l’exercice déjà validé',()=>openExercise(ex.id)));extras.append(c);}
}
function answerValue(input){if(input.type==='radio'){const chosen=document.querySelector('input[name="'+input.name+'"]:checked');return chosen?chosen.value:'';}return input.value;}
function freeOrTextAnswer(question,answer){if(question.type==='free')return null;const correct=question.type==='mc'?String(question.right)===String(answer):[question.right,...(question.also||[])].some(x=>norm(x)===norm(answer));return correct;}
function openExercise(id,options={}){const ex=exerciseBy(id);if(!ex)return;
 // Seulement à l'entrée d'un exercice neuf du compte élève.
 // Pas de nouvelle lecture lors des corrections, consultations ou actualisations.
 if(!options.skipOpening&&!window.__TIM_PARENT&&!window.__TIM_GUEST&&!attemptFor(id)&&window.TIM_ANIMATIONS?.playOpening){
  // Démarrer la vidéo pendant le clic pour que le son fonctionne sur Android.
  try{
   Promise.resolve(window.TIM_ANIMATIONS.playOpening())
    .catch(error=>console.warn('Animation d’ouverture ignorée',error))
    .then(()=>openExercise(id,{skipOpening:true}));
  }catch(error){console.warn('Animation indisponible',error);openExercise(id,{skipOpening:true});}
  return;
 }
 if(ex.questionBank==='mixed-202611-v1'&&window.TIM_MIXED_UI?.open){
  page('exercices');window.__TIM_OPEN_EXERCISE_ID=id;
  // Un essai Parent ne doit jamais afficher ni consommer la copie de Tim.
  const existing=window.__TIM_PARENT?null:attemptFor(id);
  window.TIM_MIXED_UI.open(ex,{
   old:existing,
   onReturn:()=>{renderExerciseIndex();scrollTop();},
   onReload:()=>openExercise(id,{skipOpening:true}),
   onSaved:async(saved)=>{
    if(!saved||!Array.isArray(saved.answers)||saved.answers.length!==ex.questions.length)
     throw Error('Le serveur n’a pas confirmé le corrigé. Actualiser sans recommencer.');
    window.__CLOUD_ATTEMPTS.push(saved);
    const note=window.__TIM_BRIDGE.notifyAlert?.(id,saved);if(note?.catch)note.catch(()=>{});
    v7NewAttempt(saved);openExercise(id,{skipOpening:true});
     try{await window.TIM_ANIMATIONS?.playResult?.(ex,saved);}catch(error){console.warn('Récompense non affichée',error);}
   }
  });return;
 }
 const existing=attemptFor(id),completedChallenge=Boolean(existing&&['daily','weekly','sunday','bonus-parent','bonus-day'].includes(ex.kind));window.__TIM_OPEN_EXERCISE_ID=id;page('exercices');document.getElementById('exercise-index').classList.add('hide');const root=clear(document.getElementById('exercise-detail'));root.classList.add('active');root.append(button('← Retour aux exercices',()=>{root.classList.remove('active');document.getElementById('exercise-index').classList.remove('hide');renderExerciseIndex();scrollTop();},'plain back'));root.append(badge(ex.level),E('h2','',ex.title),E('p','intro',exerciseDescription(ex)));
if(ex.kind==='bonus-day'){
 // Pas d'indice ni de renvoi à une leçon avant la validation d'un défi bonus.
}else if(ex.kind==='daily'&&ex.questionBank==='spanish-ent-v1'){
 root.append(E('p','small','Révision de plusieurs leçons d’espagnol : vocabulaire, phrases, traduction et conjugaison.'));
 root.append(button('Revoir les leçons d’espagnol',()=>{page('matieres');renderMatiere('Espagnol');},'plain'));
}else{
 root.append(E('p','small','Leçon associée : '+(lessonBy(ex.lesson)?.title||(ex.subject==='Mathématiques'?ex.chapter||'Cours ENT de mathématiques':'Voir les cours de la matière'))));
 if(lessonBy(ex.lesson))root.append(button('Voir la leçon correspondante',()=>openLesson(ex.lesson),'plain'));
}
if(ex.instructions&&!completedChallenge){const instructions=E('div','note info',ex.instructions);instructions.style.cssText='white-space:pre-line;font-size:16px;line-height:1.65;margin:12px 0;padding:16px;border:2px solid #e9b84a;border-radius:14px';root.append(instructions);}
if(!completedChallenge)root.append(makeAttachmentPanel('exercise',ex.id));if(!window.__TIM_GUEST&&!ex.kind&&!attemptFor(ex.id)){
 const mode=window.TIM_EXERCISE.mode(ex);
 const modeInfo=notice(mode==='school'?'📚 DEVOIR DE L’ÉCOLE · 0 XP. Ton parent débloquera la correction.':mode==='bonus'?'⭐ EXERCICE BONUS · 100 % = +2 XP ; dès 60 % = +1 XP ; sinon 0. Maximum +3 XP par jour.':'Cet exercice n’est pas encore disponible.');modeInfo.id='tim-exercise-mode-info';root.append(modeInfo);
}
if(window.__TIM_GUEST){root.append(notice('Visite en lecture seule : tu peux voir les questions, mais tu ne peux ni répondre ni valider.','guest-preview'));
 for(const [i,q] of ex.questions.entries()){const row=E('div','q');row.append(E('strong','',(i+1)+'. '+q.q));if(q.type==='mc'){const ul=E('ul');for(const option of q.options)ul.append(E('li','',option));row.append(ul);}root.append(row);}return;}
const old=existing,draft=drafts()[ex.id]||[];let form=E('div','panel');let controls=[];
ex.questions.forEach((question,i)=>{const row=E('div','q');row.append(E('div','qtitle',(i+1)+'. '+question.q));const rawPrevious=old?old.answers[i]?.response:draft[i];const previous=typeof rawPrevious==='string'?rawPrevious.split(' ||| ')[0]:rawPrevious;if(question.type==='mc'){let options=E('div','check-answers');question.options.forEach((option,j)=>{const label=E('label','choose');const input=E('input');input.type='radio';input.name='question-'+ex.id+'-'+i;input.value=String(j);input.checked=previous!==undefined&&String(previous)===String(j);input.disabled=!!old;input.addEventListener('change',saveDraft);label.append(input,E('span','',option));options.append(label);});row.append(options);controls.push({kind:'mc',name:'question-'+ex.id+'-'+i});}else{const input=question.type==='free'?E('textarea','answer wide'):E('input','answer');if(question.type==='text'){input.type='text';input.autocomplete='off';input.spellcheck=false;input.placeholder=ex.subject==='Mathématiques'?'Écris le résultat, par exemple 5/8 ou 12 cm':'Écris la réponse en espagnol';}else{input.rows=6;input.placeholder='Écris ta lettre ici…';}input.value=previous===undefined?'':safe(previous);input.disabled=!!old;input.addEventListener('input',saveDraft);row.append(input);if(ex.kind==='bonus-day'&&ex.subject==='Mathématiques'&&question.reasoningRequired){
 const detailed=question.reasoningCheck?.kind==='rectangle-perimeter-v1';
 const initial=old?String(old.answers?.[i]?.reasoning||''):String(draft[i]||'').split(' ||| ')[1]||'';
 let previousReasoning={};if(detailed){try{previousReasoning=JSON.parse(initial)||{};}catch{previousReasoning={};}}
 const lbl=E('label','small',detailed?'Mon calcul et mes étapes :':'Explique comment tu as obtenu ton résultat (opérations, théorème ou phrase de conclusion).');
 const work=E('textarea','answer wide');work.rows=3;
 work.placeholder=detailed?'Écris les opérations et les étapes de ton calcul.':'Écris les étapes de ton raisonnement ici.';
 work.value=detailed?String(previousReasoning.calculation||''):initial;work.disabled=!!old;
 work.addEventListener('input',saveDraft);row.append(lbl,work);
 if(detailed){
  const clbl=E('label','small','Ma phrase-réponse :'),conclusion=E('textarea','answer wide');
  conclusion.rows=2;conclusion.placeholder='Rédige une phrase complète avec le résultat et son unité.';
  conclusion.value=String(previousReasoning.conclusion||'');conclusion.disabled=!!old;
  conclusion.addEventListener('input',saveDraft);row.append(clbl,conclusion);
  controls.push({kind:'reasoning-v2',node:input,work,conclusion});
 }else controls.push({kind:'reasoning',node:input,work});
}else controls.push({kind:'text',node:input});}form.append(row);});if(!completedChallenge)root.append(form);
function values(){return controls.map(c=>c.kind==='mc'?(document.querySelector('input[name="'+c.name+'"]:checked')?.value??''):
 c.kind==='reasoning'?c.node.value.trim()+' ||| '+c.work.value.trim():
 c.kind==='reasoning-v2'?c.node.value.trim()+' ||| '+JSON.stringify({calculation:c.work.value.trim(),conclusion:c.conclusion.value.trim()}):c.node.value.trim());}
function reasoningReady(c){return c.kind==='reasoning'?(!!c.node.value.trim()&&c.work.value.trim().length>=8):
 c.kind==='reasoning-v2'?(!!c.node.value.trim()&&!!c.work.value.trim()&&!!c.conclusion.value.trim()):true;}
function saveDraft(){if(old)return;const d=drafts();d[id]=values();save(DRAFT_KEY,d);}
if(old){
 const challenge=['daily','weekly','sunday','bonus-parent','bonus-day'].includes(ex.kind);
 if(challenge){
  const summary=E('section','panel challenge-result-summary');summary.id='challenge-result-summary';
  summary.style.cssText='margin:12px 0;padding:18px;border:2px solid #dfbc61;border-radius:16px;line-height:1.6';
  const grade=Number.isFinite(old.score)&&Number.isFinite(old.total)?old.score.toLocaleString('fr-FR')+'/'+old.total.toLocaleString('fr-FR'):'note en cours de chargement';
  const xp=Number.isFinite(old.xp)?(old.xp>=0?'+':'')+old.xp.toLocaleString('fr-FR')+' XP':'XP indisponibles';
  summary.append(E('h3','','Ta note : '+grade),E('p','challenge-result-xp','XP attribués : '+xp));
  summary.append(E('p','small','Défi terminé. Tes réponses sont enregistrées ; tu peux relire ton exercice, mais pas recommencer.'));
  root.append(summary);
 }
 const locked=old.correctionStatus==='pending-parent'||old.correctionLocked===true;
 const disclosed=old.correctionStatus==='released'&&Array.isArray(old.answers)&&old.answers.length===ex.questions.length;
 // Relecture volontaire du résultat : jamais de nouvelle validation ni de nouveaux XP.
 if(disclosed&&!window.__TIM_PARENT&&!window.__TIM_GUEST&&Number.isFinite(old.xp)&&
    ex.kind!=='translation-help-log'&&!window.TIM_EXERCISE?.school?.(ex)){
  root.append(button('Revoir l’animation de ma note et de mes XP',
    ()=>window.TIM_ANIMATIONS?.playResult?.(ex,old),'mission-launch replay-result-animation'));
 }
 const retry=()=>button('Actualiser ma note et mon corrigé',async()=>{
  try{await window.__TIM_BRIDGE.refresh();openExercise(id);}
  catch(err){alert('Résultat enregistré, mais correction temporairement inaccessible : '+String(err?.message||err));}
 },'mission-launch');
 if(challenge){
  if(disclosed){
   renderFeedback(ex,old,root);
  }else{
   root.append(notice('Le défi a bien été enregistré, mais le corrigé complet ne s’affiche pas encore. Tu peux le recharger sans refaire le défi.'));
   root.append(retry());
  }
 }else if(locked){
  const panel=E('div','correction-pending');
  panel.append(E('strong','','Devoir envoyé — correction en attente du parent'),E('p','','Tes XP sont calculés immédiatement. Ton parent décidera quand afficher le corrigé.'));
  root.append(panel);
 }else if(disclosed){
  root.append(E('div','banner-good','Exercice terminé · correction disponible.'));
  renderFeedback(ex,old,root);
 }else root.append(notice('Correction en attente du parent ou en cours de chargement.'));
 if(!challenge&&typeof old.xp==='number')root.append(E('div','xp-award',(old.xp>=0?'+':'')+old.xp+' XP'));
} else if(window.__TIM_PARENT){controls.forEach(c=>{if(c.node)c.node.disabled=true;else for(const el of form.querySelectorAll('input'))el.disabled=true;});root.append(notice('Aperçu parent : seul Tim peut répondre et valider cet exercice.'));}else{
 const submit=button('Valider définitivement cet exercice',async()=>{
  const vals=values();
  if(vals.some(v=>!safe(v).trim())||controls.some(c=>!reasoningReady(c))){alert('Réponds à toutes les questions et écris ta démarche lorsque cela est demandé.');return;}
  if(attemptFor(id)){openExercise(id);return;}
  if(!confirm('Confirmer ? Cet exercice sera définitivement terminé, sur tous les appareils.'))return;
  submit.disabled=true;submit.textContent='Enregistrement sécurisé…';
  let saved;
  try{saved=await window.__TIM_BRIDGE.submit(id,vals);}
  catch(err){
   submit.disabled=false;submit.textContent='Valider définitivement cet exercice';
   // Un enregistrement peut avoir abouti côté serveur avant une coupure réseau.
   try{await window.__TIM_BRIDGE.refresh();}catch{}
   if(attemptFor(id)){
    alert('L’exercice a bien été enregistré. Son résultat va être affiché.');
    openExercise(id);
   }else alert('Validation non confirmée. Tes réponses restent sauvegardées ; vérifie ta connexion avant de réessayer. '+String(err?.message||err));
   return;
  }
  window.__CLOUD_ATTEMPTS.push(saved);
  const notification=window.__TIM_BRIDGE.notifyAlert?.(id,saved);
  if(notification?.catch)notification.catch(()=>{});
  const d=drafts();delete d[id];save(DRAFT_KEY,d);v7NewAttempt(saved);
  // Afficher le bilan déjà sauvegardé avant de révéler les XP du serveur.
  // Aucune nouvelle validation : note, copie et XP restent inchangés.
  try{
   openExercise(id,{skipOpening:true});
   try{await window.TIM_ANIMATIONS?.playResult?.(ex,saved);}
   catch(error){console.warn('Récompense non affichée',error);}
  }catch(renderError){
   console.error('Affichage du résultat indisponible :',renderError);
   root.replaceChildren();
   root.append(notice('Ton exercice est enregistré, mais le résultat n’a pas pu s’afficher. Tu ne dois pas le recommencer.'));
   root.append(button('Ouvrir ma note et mon corrigé',()=>openExercise(id),'mission-launch'));
  }
},'btn');root.append(E('p','small','Une seule validation. Pour les défis, la note et la correction sont immédiates ; les devoirs scolaires restent à 0 XP et sous contrôle du parent.'),submit);}
if(!old && !window.__TIM_PARENT && controls.length>1){
  const questionNodes=[...form.querySelectorAll('.q')];
  const submit=root.querySelector('button.btn');
  if(submit){submit.classList.add('quiz-final');}
  form.classList.add('quiz-one');
  const progress=E('div','quiz-progress');const heading=E('div','quiz-row');const stateLabel=E('span','','Question 1 / '+questionNodes.length);const nAnswered=E('span','','0 réponse');heading.append(stateLabel,nAnswered);const bar=E('div','quiz-track');const barFill=E('span');bar.append(barFill);progress.append(heading,bar);root.insertBefore(progress,form);
  const actions=E('div','quiz-controls');let step=0;
  const before=button('← Précédent',()=>{showStep(step-1);progress.scrollIntoView({behavior:'smooth',block:'start'});},'plain');
  const after=button('Suivant →',()=>{const answers=values();if(!safe(answers[step]).trim()||!reasoningReady(controls[step])){alert('Écris ta réponse et ton raisonnement avant de continuer.');return;}showStep(step+1);progress.scrollIntoView({behavior:'smooth',block:'start'});},'btn');
  actions.append(before,after);root.insertBefore(actions,submit);
  function showStep(n){step=Math.min(questionNodes.length-1,Math.max(0,n));for(let i=0;i<questionNodes.length;i++)questionNodes[i].classList.toggle('quiz-current',i===step);stateLabel.textContent='Question '+(step+1)+' / '+questionNodes.length;barFill.style.width=(((step+1)/questionNodes.length)*100)+'%';let filled=values().filter(v=>safe(v).trim()).length;nAnswered.textContent=filled+' réponse'+(filled>1?'s':'');before.disabled=step===0;after.classList.toggle('hide',step===questionNodes.length-1);submit.classList.toggle('ready',step===questionNodes.length-1);}
  form.addEventListener('change',()=>{nAnswered.textContent=values().filter(v=>safe(v).trim()).length+' réponses';});form.addEventListener('input',()=>{nAnswered.textContent=values().filter(v=>safe(v).trim()).length+' réponses';});
  showStep(0);
 }
scrollTop();}
function renderFeedback(ex,t,root){
 function showWrittenMethod(container,answer){
  const d=answer.reasoningDetails;
  if(d){
   container.append(E('p','','Calcul écrit : '+safe(d.calculation||'')));
   container.append(E('p','','Phrase-réponse écrite : '+safe(d.conclusion||'')));
  }else if(answer.reasoning){
   container.append(E('p','','Raisonnement écrit : '+safe(answer.reasoning)));
  }
 }
 const isChallenge=['daily','weekly','sunday','bonus-parent','bonus-day'].includes(ex.kind);
 const isBonusDay=ex.kind==='bonus-day';
 const box=E('section','result'+(t.needsReview?' waiting':''));
 const perfect=!t.needsReview&&Number(t.score)===Number(t.total)&&Number(t.total)>0&&
  Array.isArray(t.answers)&&t.answers.length===Number(t.total)&&t.answers.every(a=>a.correct===true);
 if(isChallenge)box.id='challenge-detailed-correction';
 box.append(E('h3','',isBonusDay?(perfect?'Aucune erreur à corriger.':'Voir mes erreurs corrigées'):
  perfect?'Toutes les réponses sont correctes — aucune correction nécessaire.':
  t.needsReview?'Rédaction enregistrée — à revoir':'Correction détaillée : '+Number(t.score).toLocaleString('fr-FR')+'/'+Number(t.total).toLocaleString('fr-FR')));
 box.append(E('p','subtle','Validé le '+new Date(t.date).toLocaleString('fr-FR')+'. Les réponses sont verrouillées sur tous les appareils.'));
 // Questions et réponses toujours relisibles, sans expliquer les réponses déjà correctes.
 const review=E('details','summary-details');
 review.append(E('summary','','Revoir mon exercice — questions et réponses'));
 for(const [i,a] of t.answers.entries()){
  const q=ex.questions[i]||{},given=q.type==='mc'?(q.options?.[Number(a.response)]??a.response):a.response;
  const row=E('div','separated');
  row.append(E('strong','',(i+1)+'. '+safe(a.question||q.q||'Question')),E('p','','Ma réponse : '+safe(given)));
  showWrittenMethod(row,a);
  review.append(row);
 }
 if(!isBonusDay)box.append(review);
 for(const [i,a] of (perfect?[]:t.answers).entries()){
  if(a.correct===true||(isBonusDay&&a.correct!==false))continue;
  const q=ex.questions[i]||{},p=E('div','feedback');
  const given=q.type==='mc'?(q.options?.[Number(a.response)]??a.response):a.response;
  p.append(E('strong','',(i+1)+'. '+safe(a.question||q.q||'Question')),E('p','','Ta réponse : '+safe(given)));
  showWrittenMethod(p,a);
  if(a.correct!==null)p.append(E('p',a.correct?'correct':'wrong',
   a.correct?'Bonne réponse.':a.points===0.5?
    (q.reasoningCheck?.kind==='rectangle-perimeter-v1'?'Réponse partiellement correcte : 0,5/1 (résultat ou raisonnement à revoir).':'Réponse presque correcte : 0,5/1 (accent ou ponctuation).'):
    'Réponse à revoir.'));
  if(a.correct===false){
   p.append(E('p','correct','Réponse attendue : '+safe(a.expected)));
   const explanation=safe(a.explanation).trim()||'Compare les mots, leur ordre et les terminaisons avec la réponse attendue. Relis la leçon pour comprendre la règle.';
   p.append(E('p','subtle','Explication : '+explanation));
   const spanishSource=ex.questionBank==='spanish-ent-v1'?
    /^ESE_L(0[1-9]|1[0-3])_0[1-3]:\d+$/.exec(String(q.sourceId||'')):null;
   if(spanishSource){
    const num=Number(spanishSource[1]),lesson=window.TIM_SPANISH_SIMPLIFIED?.lessons?.[num-1];
    if(lesson)p.append(button('Revoir la leçon '+num+' : '+lesson.name,
      ()=>{page('matieres');renderMatiere('Espagnol',lesson.id);},'plain'));
   }else{
    const source=safe(q.sourceId).split(':')[0];
    const lessonId=DATA.exercises.find(item=>item.id===source)?.lesson||ex.lesson;
    const lesson=lessonBy(lessonId);
    if(lesson)p.append(button('Revoir la leçon : '+lesson.title,()=>openLesson(lesson.id),'plain'));
   }
  }else if(a.explanation)p.append(E('p','subtle','Explication : '+a.explanation));
  box.append(p);
 }
 if(isChallenge){
  root.append(box);
  if(isBonusDay){
   review.querySelector('summary').textContent='Relire mon exercice — toutes mes réponses';
   root.append(review);
  }
  root.append(v7Feedback(ex,t));
 }else root.append(v7Feedback(ex,t),box);
 if(t.answers.some(a=>a.correct===false))root.append(button('Voir mon carnet des difficultés',()=>page('difficultes'),'plain'));
}
document.getElementById('exercise-search').addEventListener('input',renderExerciseIndex);
function renderDifficulties(){const root=clear(document.getElementById('difficulties-content'));const done=attempts().filter(t=>(t.correctionStatus==='released'&&Array.isArray(t.answers)&&t.answers.length>0));const errs=[];for(const t of done){for(const [i,x] of t.answers.entries())if(x.correct===false)errs.push({t,x,i});}let stats=E('div','mini-grid');stats.append(E('div','info-stat',done.length+' exercices'),E('div','info-stat',errs.length+' erreurs'),E('div','info-stat',getRelevantRemedials().length+' aides'));root.append(stats);
if(!done.length){root.append(notice('Aucun exercice validé. Les difficultés apparaîtront après la première correction.'));return;}if(!errs.length){root.append(notice('Aucune erreur dans les exercices validés. Cela ne signifie pas que toutes les notions sont maîtrisées.','banner-good'));return;}
const groups={};for(const e of errs){const s=e.x.skill||'autre';(groups[s]??=[]).push(e);}for(const [skill,items] of Object.entries(groups)){const b=E('div','panel');b.append(badge('Notion à retravailler'),E('h3','',skill+' · '+items.length+' erreur(s)'));for(const {t,x} of items){const line=E('div','separated');line.append(E('strong','',t.title),E('p','',x.question),E('p','wrong','Réponse donnée : '+(x.response??'')),E('p','correct','Réponse attendue : '+x.expected),E('p','subtle',x.explanation));b.append(line);}const r=DATA.skillToRemedy[skill];if(r&&!attemptFor(r))b.append(button('Faire un nouvel exercice différent',()=>openExercise(r),'btn'));else if(r)b.append(E('p','small','L’exercice complémentaire correspondant est déjà terminé.'));const lesson=lessonBy(items[0].t.lesson);if(lesson)b.append(button('Revoir la leçon',()=>openLesson(lesson.id),'plain'));root.append(b);}}
function renderDico(stage='hub'){dicoStage=stage;for(const suffix of ['hub','subjects','spanish','verbs','verbtime','verbdetail','words']){let elem=document.getElementById('dico-'+suffix);elem.classList.toggle('active',suffix===stage);elem.classList.toggle('hide',suffix!==stage);}if(stage==='verbs')renderVerbIndex();if(stage==='words')renderWordIndex();}
function renderVerbIndex(){const root=clear(document.getElementById('dico-verbs'));root.append(button('← Dictionnaire espagnol',()=>renderDico('spanish'),'plain back'),E('h3','','Choisis un verbe'));let inp=E('input','search');inp.type='search';inp.placeholder='Chercher un verbe (ex. ser, llamarse)';root.append(inp);let list=E('div','clicklist');root.append(list);function update(){clear(list);const q=norm(inp.value);const f=DATA.verbs.filter(v=>norm(v.verb+' '+v.fr).includes(q)).sort((a,b)=>a.verb.localeCompare(b.verb,'es'));if(!f.length)list.append(notice('Ce verbe ne figure pas dans les cours enregistrés.'));for(const v of f)list.append(cardAction(v.verb,v.fr,short(v.source,65),()=>{dicoCurrentVerb=v;renderDico('verbtime');renderVerbTime();}));}inp.addEventListener('input',update);update();}
function renderVerbTime(){const root=clear(document.getElementById('dico-verbtime'));const v=dicoCurrentVerb;if(!v)return;root.append(button('← Liste des verbes',()=>renderDico('verbs'),'plain back'),E('h3','',v.verb+' — '+v.fr),E('p','subtle','Choisis le temps de conjugaison'));root.append(cardAction('Présent de l’indicatif','Temps étudié dans les documents ENT','Les six personnes, les traductions et la prononciation',()=>{renderDico('verbdetail');renderVerbDetail();}));root.append(notice('Les autres temps ne sont pas proposés, car ils ne sont pas confirmés dans les cours étudiés. Ils pourront être ajoutés plus tard.'));}
function renderVerbDetail(){const root=clear(document.getElementById('dico-verbdetail'));const v=dicoCurrentVerb;if(!v)return;root.append(button('← Temps de conjugaison',()=>renderDico('verbtime'),'plain back'),badge('Présent de l’indicatif'),E('h3','',v.verb+' — '+v.fr),E('p','subtle','Source : '+v.source));const translations={'llamarse':['je m’appelle','tu t’appelles','il/elle s’appelle','nous nous appelons','vous vous appelez','ils/elles s’appellent']};for(let i=0;i<v.forms.length;i++){let r=E('div','gloss-row');r.append(E('div','',DATA.persons[i]));let col=E('div');col.append(document.createTextNode(v.forms[i]+' '),speakButton(v.forms[i]));r.append(col);root.append(r);}if(v.verb==='ser'||v.verb==='estar')root.append(notice('Ser sert surtout à décrire l’identité et une caractéristique ; estar sert souvent à décrire un état ou un lieu.'));}
function renderWordIndex(){const root=clear(document.getElementById('dico-words'));root.append(button('← Dictionnaire espagnol',()=>renderDico('spanish'),'plain back'),E('h3','','Mots et expressions'));let input=E('input','search');input.type='search';input.placeholder='Écris un mot en français ou en espagnol';root.append(input);let filter=E('select');let cats=['Tous les thèmes',...new Set(DATA.vocab.map(x=>x.cat))];for(const c of cats)filter.append(new Option(c,c));filter.value=wordCategory==='all'?cats[0]:wordCategory;root.append(E('p','small','Recherche dans les deux langues.'));root.append(filter);let list=E('div');root.append(list);function update(){clear(list);const q=norm(input.value),cat=filter.value;const rows=DATA.vocab.filter(w=>(!q||norm(w.fr+' '+w.es).includes(q))&&(cat===cats[0]||w.cat===cat));list.append(E('p','subtle',rows.length+' mot(s) ou expression(s)'));if(!rows.length){list.append(notice('Ce mot ne figure pas dans les cours enregistrés dans ce classeur.'));return;}for(const w of rows){let r=E('div','gloss-row');r.append(E('div','',w.fr));let x=E('div');x.append(document.createTextNode(w.es+' '),speakButton(w.es));r.append(x);list.append(r);}}input.addEventListener('input',update);filter.addEventListener('change',update);update();}
document.querySelectorAll('[data-dico]').forEach(b=>b.addEventListener('click',()=>renderDico(b.dataset.dico)));document.getElementById('tool-help').addEventListener('click',()=>page('aide'));
function renderTimeline(){const root=clear(document.getElementById('timeline-content'));root.append(E('h3','','Journal des séances disponibles'));let stack=E('div','timeline');for(const [iso,date,topic,source,ids] of DATA.timeline){const row=E('div','timeline-row');row.append(E('div','date',date));let cell=E('div');cell.append(E('strong','',topic),E('small','',source));let links=E('div','btnrow');for(const id of ids.split(',').filter(Boolean))links.append(button('Fiche '+id.slice(1),()=>openLesson(id),'plain'));cell.append(links);row.append(cell);stack.append(row);}root.append(stack);root.append(notice('Les dates sans fiche retrouvée (29 septembre, 13 octobre) et la fiche vide du 7 octobre ne prouvent pas que les cours ont été annulés.'));}
function renderArchives(){renderTimeline();const root=clear(document.getElementById('archive-content'));const categories=[...new Set(DATA.archive.map(x=>x.day))];categories.sort((a,b)=>{const extract=(x)=>{const [day,month]=x.split(' ');const m={'septembre':9,'octobre':10,'novembre':11};return (m[month]||0)*100+Number(day||0);};return extract(a)-extract(b)});for(const group of categories){const arr=DATA.archive.filter(x=>x.day===group);const details=E('details','archive-group');details.append(E('summary','',group+' · '+arr.length+' capture(s)'));const wrap=E('div','archive-grid');for(const img of arr){const b=E('button','archive-shot');b.type='button';const picture=E('img');picture.src=img.src;picture.loading='lazy';picture.alt='Capture ENT du '+group+', '+img.name;b.append(picture,E('small','',img.name));b.addEventListener('click',()=>openImage(img));wrap.append(b);}details.append(wrap);root.append(details);}}
function openImage(img){const dial=document.getElementById('image-dialog');document.getElementById('dialog-caption').textContent=img.day+' · '+img.name;document.getElementById('dialog-image').src=img.src;if(typeof dial.showModal==='function')dial.showModal();else window.open(img.src,'_blank');}
document.getElementById('dialog-close').addEventListener('click',()=>document.getElementById('image-dialog').close());
function searchHelp(){const root=clear(document.getElementById('help-results')),q=norm(document.getElementById('help-query').value);if(!q){root.textContent='Écris un mot, une notion ou une date.';return;}let arr=[];const v=DATA.verbs.filter(x=>norm(x.verb+' '+x.fr).includes(q));for(const x of v.slice(0,3))arr.push({type:'verbe',title:x.verb+' — '+x.fr,description:'Présent : '+x.forms.join(' · '),go:()=>{page('dico');dicoCurrentVerb=x;renderDico('verbdetail');renderVerbDetail();}});
const words=DATA.vocab.filter(x=>norm(x.fr+' '+x.es).includes(q));for(const x of words.slice(0,5))arr.push({type:'mot',title:x.fr+' → '+x.es,description:'Vocabulaire : '+x.cat,go:()=>{page('dico');renderDico('words');}});
const course=DATA.lessons.filter(l=>norm(l.title+' '+l.date+' '+l.topic+' '+l.summary+' '+l.source+' '+l.blocks.map(b=>JSON.stringify(b)).join(' ')).includes(q));for(const l of course.slice(0,6))arr.push({type:'cours',title:l.title,description:l.date+' · '+l.summary,go:()=>openLesson(l.id)});
if(!arr.length){root.textContent='Je n’ai pas trouvé cette information dans les cours enregistrés. Essaie un autre mot ou consulte les fiches par date.';return;}root.className='';let list=E('div','clicklist');for(const item of arr)list.append(cardAction(item.title,item.type,item.description,item.go));root.append(list);}
document.getElementById('help-search').addEventListener('click',searchHelp);document.getElementById('help-query').addEventListener('keydown',ev=>{if(ev.key==='Enter')searchHelp();});
function reportText(a){if(!a.length)return 'Aucun exercice enregistré.';return 'Classeur espagnol Tim — '+a.length+' exercices\n\n'+a.map(t=>`${new Date(t.date).toLocaleString('fr-FR')} · ${t.title} · ${t.needsReview?'Rédaction à revoir':t.score+'/'+t.total}\n`+t.answers.map((x,i)=>`${i+1}. ${x.question}\nRéponse : ${x.response}\nAttendu : ${x.expected}\n${x.correct===null?'Relecture humaine':x.correct?'Correct':'Incorrect'}`).join('\n')).join('\n\n');}
function exported(){return {app:'classeur_espagnol_tim',version:7,exportedAt:new Date().toISOString(),attempts:attempts()};}
function exportJSON(){const blob=new Blob([JSON.stringify(exported(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);let a=document.createElement('a');a.download='resultats_espagnol_Tim_V7.json';a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);}
function renderAttempts(list,arr){clear(list);if(!arr.length){list.append(notice('Aucun exercice validé.'));return;}for(const a of arr.slice().reverse()){let box=E('div','panel');box.append(E('h3','',a.title+(a.needsReview?' · à corriger':a.score===null?' · note non disponible':' · '+a.score+'/'+a.total)),E('p','meta',new Date(a.date).toLocaleString('fr-FR')));const detail=E('details','summary-details');detail.append(E('summary','','Voir toutes les réponses'));for(const [i,x] of a.answers.entries()){const row=E('div','separated');row.append(E('strong','',(i+1)+'. '+x.question),E('p','',`Réponse : ${x.response}`),E('p','subtle',`Attendu : ${x.expected}`),E('p',x.correct===false?'wrong':x.correct===true?'correct':'subtle',x.correct===null?'À relire':x.correct?'Correct':'À revoir'));detail.append(row);}box.append(detail);list.append(box);}}
// V15 — Lecture privée des pièces jointes (PDF, figures, photos, documents).
function makeAttachmentPanel(targetKind,targetId){
 const panel=E('section','panel attachment-panel');panel.append(E('h3','',targetKind==='lesson'?(isBisLesson(lessonBy(targetId))?'Documents complémentaires de la leçon BIS':'Documents originaux ENT · PDF et figures'):'Documents et figures'));
 if(!window.__TIM_BRIDGE?.attachments){panel.append(E('p','small','Les pièces jointes privées sont visibles après connexion.'));return panel;}
 const info=E('p','small','Chargement des documents…'),list=E('div','attachment-list');panel.append(info,list);
 const api=window.__TIM_BRIDGE.attachments;
 async function refresh(){
  clear(list);info.textContent='Chargement des pièces jointes…';
  try{
   const files=await api.list(targetKind,targetId);info.textContent=files.length?files.length+' document(s) disponible(s).':'Aucune pièce jointe pour le moment.';
   for(const item of files){
    const row=E('div','attachment-row');
    row.append(E('div','attachment-name',(item.title||item.fileName)+' · '+(item.size/1024/1024).toFixed(2)+' Mo'));
    const controls=E('div','btnrow'),preview=E('div','attachment-preview');
    const open=button('Voir / télécharger',async()=>{
     open.disabled=true;preview.replaceChildren(E('p','small','Ouverture du document…'));
     let disposePdf=()=>{};
     try{
      const blob=await api.read(item),url=URL.createObjectURL(blob);
      clear(preview);const dl=E('a','btn','Télécharger '+item.fileName);dl.href=url;dl.download=item.fileName;preview.append(dl);
      if(item.mime.startsWith('image/')){const img=E('img','attachment-image');img.src=url;img.alt=item.title||item.fileName;preview.append(img);}
      else if(item.mime==='application/pdf'){
       // Les PDF intégrés en iframe ne s'affichent pas de manière fiable sur Chrome Android.
       // La V15.1 dessine les pages dans le classeur avec PDF.js (zoom et navigation).
       const host=E('div','attachment-pdf-reader');preview.append(host);
       const module=await import('./pdf-preview.js');
       const release=await module.mountPdfPreview(host,blob);
       if(typeof release==='function')disposePdf=release;
      }else preview.append(E('p','small','Ce format est à ouvrir après téléchargement.'));
      const close=button('Fermer l’aperçu',()=>{disposePdf();URL.revokeObjectURL(url);clear(preview);},'plain');preview.append(close);
     }catch(e){preview.textContent='Ouverture impossible : '+(e.message||e);}finally{open.disabled=false;}
    },'plain');controls.append(open);
    if(window.__TIM_PARENT){controls.append(button('Supprimer',async()=>{
     if(!confirm('Supprimer définitivement « '+item.fileName+' » ?'))return;
     try{await api.remove(item);await refresh();}catch(e){alert('Suppression impossible : '+(e.message||e));}
    },'plain'));}
    row.append(controls,preview);list.append(row);
   }
  }catch(e){info.textContent='Pièces jointes indisponibles : '+(e.message||e);}
 }
 refresh();return panel;
}
function makeAttachmentAdminPanel(){
 const box=E('div','panel');box.append(E('h3','','Ajouter un PDF, une figure ou une pièce jointe'),E('p','small','Sélectionne la matière puis le cours ou l’exercice. Fichiers privés accessibles uniquement à Tim et à son parent. Taille maximale : 4 Mo. PDF, images et documents Office/OpenDocument. Aucun abonnement de stockage supplémentaire nécessaire dans les limites gratuites de Firestore.'));
 const api=window.__TIM_BRIDGE.attachments;
 const subjects=[...new Set([...DATA.lessons.map(subjectOf),...DATA.exercises.map(subjectOf)])].sort((a,b)=>a.localeCompare(b,'fr'));
 const subject=E('select','attachment-select');subject.setAttribute('aria-label','Matière');subjects.forEach(s=>subject.append(new Option(s,s)));if(subjects.includes('Mathématiques'))subject.value='Mathématiques';
 const target=E('select','attachment-select');target.setAttribute('aria-label','Cours ou exercice associé');
 const label=E('input','answer');label.type='text';label.maxLength=120;label.placeholder='Titre facultatif du document';label.setAttribute('aria-label','Titre du document');
 const file=E('input','attachment-file');file.type='file';file.multiple=true;file.accept='.pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.docx,.pptx,.xlsx,.odp,.odt';file.setAttribute('aria-label','Choisir un fichier');
 const state=E('p','small','Les fichiers ne sont pas ajoutés automatiquement : tu confirmes la publication.');
 function fill(){const rows=[...DATA.lessons.filter(l=>subjectOf(l)===subject.value).map(l=>({value:'lesson|'+l.id,name:'Cours · '+chapterOf(l)+' · '+l.title})),...DATA.exercises.filter(e=>subjectOf(e)===subject.value&&!window.TIM_EXERCISE.challenge(e)).map(e=>({value:'exercise|'+e.id,name:'Exercice · '+e.title}))];target.replaceChildren(...rows.map(v=>new Option(v.name,v.value)));}
 subject.addEventListener('change',fill);fill();
 const send=button('Ajouter la pièce jointe',async()=>{
  const selected=[...(file.files||[])],value=target.value;if(!selected.length||!value){state.textContent='Choisis un document et un cours ou exercice.';return;}
  const [kind,id]=value.split('|');send.disabled=true;
  try{let count=0;for(const fileItem of selected){state.textContent='Envoi '+(count+1)+'/'+selected.length+' : '+fileItem.name;await api.upload(kind,id,fileItem,selected.length===1?label.value:fileItem.name,n=>state.textContent='Envoi '+(count+1)+'/'+selected.length+' : '+n+' %');count++;}state.textContent=count+' fichier(s) ajoutés. Tim peut les consulter depuis le cours.';file.value='';label.value='';}
  catch(e){state.textContent='Échec : '+(e.message||e);}
  finally{send.disabled=false;}
 },'btn');
 box.append(E('p','small','Matière'),subject,E('p','small','Rattacher à'),target,E('p','small','Titre visible dans le classeur'),label,E('p','small','Fichier'),file,send,state);
 return box;
}
// L'ancien panneau d'envoi manuel par le Parent est retiré de l'interface.
function parentAdminPanels(root){
 if(window.TIM_ENT_PRIVATE_IMPORT?.render&&window.__TIM_BRIDGE?.attachments)root.prepend(window.TIM_ENT_PRIVATE_IMPORT.render({lessons:DATA.lessons,api:window.__TIM_BRIDGE.attachments}));
 if(window.__TIM_BRIDGE?.attachments)root.prepend(makeAttachmentAdminPanel());
 const test=E('div','panel');test.append(E('h3','','Contrôle technique de Firebase'),E('p','small','Ce test crée un résultat fictif dans la collection séparée test_attempts, le lit, vérifie le verrouillage, puis le supprime. Il ne touche à aucun résultat de Tim.'));
 const status=E('p','subtle','Aucun test effectué.');
 const run=button('Tester Firebase sans toucher aux notes',async()=>{
  run.disabled=true;status.textContent='Test de la base en cours…';
  try{const out=await window.__TIM_BRIDGE.diagnose();status.textContent=out.parentContentRead&&out.attemptsRead&&out.unauthorizedAttemptWriteBlocked&&out.backendReport?'TEST RÉUSSI : cours parent, résultats, protection contre les écritures directes et rapport serveur vérifiés.':'TEST INCOMPLET : '+JSON.stringify(out);}
  catch(e){status.textContent='ÉCHEC DU TEST : '+(e.message||e);}
  finally{run.disabled=false;}
 },'btn');test.append(run,status);root.prepend(test);
 const addPanel=E('div','panel');addPanel.append(E('h3','','Ajouter de nouveaux cours et exercices'),E('p','small','Les nouveaux exercices doivent préciser leur catégorie : category: "school" pour les devoirs de l’ENT (XP selon les réponses), ou category: "bonus" pour les exercices d’entraînement créés à partir des leçons (+0 à +2 XP). Date de publication enregistrée automatiquement dans Firebase. Les anciens cours et résultats ne sont jamais écrasés.')); 
 const input=E('textarea','answer wide');input.rows=5;input.placeholder='JSON : {"lessons":[...],"exercises":[{"id":"...","category":"school" ou "bonus",...}]}' ;input.setAttribute('aria-label','Contenu JSON du nouveau cours');
 const packFile=E('input','attachment-file');packFile.type='file';packFile.accept='.json,application/json';packFile.setAttribute('aria-label','Charger un lot JSON de cours depuis le téléphone');
 packFile.addEventListener('change',async()=>{const f=packFile.files?.[0];if(!f)return;try{if(f.size>850000)throw Error('Lot trop volumineux.');const text=await f.text();const parsed=JSON.parse(text);if(!Array.isArray(parsed.lessons)&&!Array.isArray(parsed.exercises))throw Error('Lot JSON de cours invalide.');input.value=JSON.stringify(parsed);info.textContent='Lot chargé : vérifie le contenu, puis appuie sur Publier. Aucun envoi automatique.';}catch(e){info.textContent='Fichier invalide : '+(e.message||e);}});
 const info=E('p','small','Aucun ancien cours n’est remplacé. Seul le compte parent peut publier.');
 const buttonAdd=button('Publier les nouveaux cours',async()=>{
  buttonAdd.disabled=true;info.textContent='Vérification du contenu…';
  try{const payload=JSON.parse(input.value);const n=await window.__TIM_BRIDGE.publish(payload);info.textContent=n+' contenu(s) ajouté(s) dans Firebase. Rechargement…';window.location.reload();}
  catch(e){info.textContent='Publication refusée : '+(e.message||e);buttonAdd.disabled=false;}
 },'btn');addPanel.append(E('p','small','Choisir un lot JSON sur le téléphone (ou coller le texte ci-dessous) :'),packFile,input,buttonAdd,info);{const advanced=E('details','v16-import');advanced.append(E('summary','','Import de fichiers JSON (option avancée)'),addPanel);root.prepend(advanced);}
 const mail=E('div','panel');mail.append(E('h3','','Alerte e-mail après validation'),E('p','small','L’alerte utilise un scénario Make : réception du webhook, vérification de l’exercice, puis envoi Gmail au parent. Le site ne peut pas envoyer un e-mail directement sans ce scénario.'));
 const hook=E('input','answer');hook.type='url';hook.placeholder='https://hook.eu1.make.com/…';hook.autocomplete='off';hook.setAttribute('aria-label','Adresse du webhook Make');
 const mailStatus=E('p','small','Configuration Make non vérifiée.');
 window.__TIM_BRIDGE.readAlertWebhook?.().then(v=>{if(v){hook.value=v;mailStatus.textContent='Webhook enregistré. Il reste à vérifier le scénario Make et l’arrivée réelle d’un e-mail.';}else mailStatus.textContent='Alerte désactivée : aucun webhook Make enregistré.';}).catch(()=>{});
 const saveMail=button('Enregistrer le webhook',async()=>{
  saveMail.disabled=true;try{const enabled=await window.__TIM_BRIDGE.saveAlertWebhook(hook.value);mailStatus.textContent=enabled?'Webhook enregistré dans Firebase. Attention : ce n’est pas une preuve de réception d’e-mail.':'Webhook supprimé, alerte désactivée.';}
  catch(e){mailStatus.textContent='Échec : '+(e.message||e);}finally{saveMail.disabled=false;}
 },'plain');mail.append(hook,saveMail,mailStatus);root.prepend(mail);
 if(window.TIM_LESSON_EDITOR?.render)root.prepend(window.TIM_LESSON_EDITOR.render({lessons:DATA.lessons,bridge:window.__TIM_BRIDGE,onSaved:()=>window.location.reload()}));
}
function renderParent(){
 const root=clear(document.getElementById('parent-content'));
 if(!window.__TIM_PARENT){root.append(notice('Connexion Parent requise.'));return;}
 if(window.TIM_PARENT_UNIFIED?.render)window.TIM_PARENT_UNIFIED.render(root);
 else root.append(notice('Le tableau de bord centralisé est momentanément indisponible.'));
 root.append(makeXPPanel(),makeRewardsTile());
 // Les commandes de gestion Parent restent accessibles ; le suivi des notes
 // et des copies est maintenant réuni en un seul tableau de bord.
 if(window.__TIM_BRIDGE?.diagnose)parentAdminPanels(root);
 /* Le Parent ne choisit plus et n'envoie plus de défi bonus. */
 // L'import privé des évaluations est la première action de l'espace Parent.
 if(window.TIM_MATH_PRIVATE_IMPORT?.render)root.prepend(window.TIM_MATH_PRIVATE_IMPORT.render());
 root.append(notice('Les devoirs officiels restent ceux de l’ENT ; le classeur permet de consulter le suivi des exercices de Tim.','note info'));
}

const WOLF_ICON='<svg aria-hidden="true" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10 23 18 32 14 41 18 56 10 53 37 46 47 32 56 18 47 11 37Z" fill="#e6eaff" stroke="#5868cd" stroke-width="2.6" stroke-linejoin="round"/><path d="m23 35 9 5 9-5-3 12-6 5-6-5Z" fill="#6472d0"/><path d="m18 29 8 3m20-3-8 3" stroke="#28376c" stroke-width="3" stroke-linecap="round"/><path d="M27 41 32 44 37 41" stroke="#263a73" stroke-width="2.5" stroke-linejoin="round"/></svg>';

const SCHOOL_SUBJECTS=['Espagnol',...(window.__TIM_MORE_PACK?.subjects||[])];
// Conserver les acquis historiques ; nouveau barème à compter de la préparation V6.
const XP_V5_START='2026-11-06';
const XP_START='2026-11-06T04:27:16Z';
const XP_V10_START='2026-11-06T05:42:54Z'; // Maintient les barèmes des validations antérieures à la V10.
const parisDay=window.TIM_XP.day;
const weekMonday=window.TIM_XP.monday;
function xpBar(a){const ex=exerciseBy(a.id);return window.TIM_XP.contribution(a,ex);}
function xpBarV9(a){return window.TIM_XP.contributionV9(a,exerciseBy(a.id));}
function xpBarV10(a){return window.TIM_XP.contributionV10(a,exerciseBy(a.id));}
function xpBarV5(a){if(a.needsReview||!a.total)return 0;const p=Math.max(0,Math.min(1,a.score/a.total));let v=p===1?10:p>=.8?6:p>=.6?2:p>=.4?-2:-5;if((a.id.startsWith('DAY_')||a.id.startsWith('WEEK_')||a.id.startsWith('SUNDAY_'))&&p>=.8)v+=5;return v;}
function coreXpInfo(done=attempts()){
 if(done.every(a=>typeof a.xp==='number')){
  const ordered=[...done].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  let total=0,peak=0;const week=window.TIM_XP.monday(parisDay(new Date()));let weekly=0;
  for(const a of ordered){total=Math.max(0,total+Number(a.xp||0));peak=Math.max(peak,total);if(parisDay(a.date)&&window.TIM_XP.monday(parisDay(a.date))===week)weekly=Math.max(0,weekly+Number(a.xp||0));}
  const level=Math.floor(peak/100)+1;
  return {total,perfect:done.filter(a=>a.correctionStatus==='released'&&a.total>0&&a.score===a.total).length,peak,level,inLevel:Math.max(0,Math.min(100,total-(level-1)*100)),done:done.length,week:weekly,rawWeek:weekly,reward:window.TIM_XP.reward(Math.max(0,weekly)),legacy:0,weeklyPass:false};
 }
 const daily=new Map();let legacy=0,perfect=0;
 for(const a of done){if(a.total>0&&a.score===a.total&&(a.correctionStatus==='released'&&Array.isArray(a.answers)&&a.answers.length>0))perfect++;
  if(!a.date||a.date<XP_V5_START){legacy+=a.needsReview?5:(Math.max(0,Number(a.score)||0)*10+(a.total>0&&a.score===a.total?20:0));continue;}
  const day=parisDay(a.date);if(!day)continue;
  const value=a.date<XP_START?xpBarV5(a):a.date<XP_V10_START?xpBarV9(a):a.policyVersion>=12?xpBar(a):xpBarV10(a),old=daily.get(day)||{plus:0,bonus:0,minus:0};
  const isNewBonus=a.date>=XP_V10_START&&!window.TIM_EXERCISE.challenge(exerciseBy(a.id))&&(a.policyVersion>=12?window.TIM_XP.isBonus(exerciseBy(a.id),a.date):!exerciseBy(a.id)?.publishedAt||parisDay(exerciseBy(a.id)?.publishedAt)!==day);
  if(value>=0){if(isNewBonus)old.bonus+=value;else old.plus+=value;}else old.minus+=value;daily.set(day,old);
 }
 const weeks=new Map();const today=parisDay(new Date());const current=weekMonday(today);
 for(const [day,v] of daily){const key=weekMonday(day);weeks.set(key,(weeks.get(key)||0)+Math.min(10,v.plus+Math.min(3,v.bonus))+Math.max(-5,v.minus));}
 let total=legacy,peak=legacy;for(const key of [...weeks.keys()].sort()){total=Math.max(0,total+Math.max(-50,Math.min(50,weeks.get(key))));peak=Math.max(peak,total);}
 const thisWeek=Math.max(0,weeks.get(current)||0);
 const currentWeekly=window.__TIM_CHALLENGES?.weekly;
 const weeklyPass=done.some(a=>a.id===currentWeekly&&a.total>0&&a.score/a.total>=.8&&weekMonday(parisDay(a.date))===current);
 const reward=window.TIM_XP.reward(thisWeek);
 const level=Math.floor(peak/100)+1;
 return {total,perfect,peak,level,inLevel:Math.max(0,Math.min(100,total-(level-1)*100)),done:done.length,week:thisWeek,rawWeek:weeks.get(current)||0,reward,legacy,weeklyPass};
}
/* Les XP d'entraînement Espagnol sont enregistrés dans une collection dédiée.
   Leur ajout à l'affichage ne recalcule pas ni ne remplace les XP historiques. */
function xpInfo(done=attempts()){
 const base=coreXpInfo(done);
 const spanish=Array.isArray(window.__TIM_SPANISH_ENT_XP)?window.__TIM_SPANISH_ENT_XP:[];
 const unique=new Map();
 for(const a of spanish){
  if(!/^ESE_L(?:0[1-9]|1[0-3])_0[1-3]$/.test(String(a.id||'')))continue;
  if(![0,0.5,1].includes(a.xp))continue;
  unique.set(a.id,a);
 }
 let spanishTotal=0,spanishWeek=0;
 const current=window.TIM_XP.monday(parisDay(new Date()));
 for(const a of unique.values()){
  const date=parisDay(a.submittedAt);
  // Seules les tentatives effectivement datées et enregistrées sont
  // incluses au total comme dans le compteur du service Cloudflare.
  if(!date)continue;
  spanishTotal+=a.xp;
  if(window.TIM_XP.monday(date)===current)spanishWeek+=a.xp;
 }
 const total=base.total+spanishTotal,week=base.week+spanishWeek;
 const peak=Math.max(base.peak,total),level=Math.floor(peak/100)+1;
 return {...base,total,week,rawWeek:base.rawWeek+spanishWeek,
  reward:window.TIM_XP.reward(Math.max(0,week)),peak,level,
  inLevel:Math.max(0,Math.min(100,total-(level-1)*100)),
  done:base.done+unique.size};
}
function makeXPPanel(){
 const st=xpInfo(),week=Math.max(0,Number(st.week)||0);
 const cap=Math.min(75,week),value=week.toLocaleString('fr-FR');
 const wrapper=E('section','xp-showcase');
 const top=E('div','xp-showcase-top');
 top.append(E('div','xp-showcase-title','MES XP DE LA SEMAINE'),E('strong','xp-current-count',value+' / 75 XP'));
 wrapper.append(top);
 const art=E('div','xp-illustration');
 const picture=E('img','xp-illustration-img');
 picture.src='./assets/barre-xp-original.png';
 picture.alt='Illustration du loup allongé devant une jauge de 0 à 75 XP, dans une bibliothèque bleue et dorée.';
 picture.width=2172;picture.height=724;picture.loading='eager';picture.decoding='async';
 art.append(picture);
 const track=E('div','xp-art-track');
 track.setAttribute('role','progressbar');track.setAttribute('aria-label','XP de la semaine');
 track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','75');
 track.setAttribute('aria-valuenow',String(cap));
 const fill=E('div','xp-art-fill');fill.style.transform='scaleX('+cap/75+')';
 track.append(fill);art.append(track);
 const meter=E('div','xp-art-meter',value+' XP cette semaine');
 art.append(meter);wrapper.append(art);
 const tierRow=E('div','xp-reward-tiers');
 for(const [threshold,euros] of [[19,2],[38,5],[75,10]]){
  const reached=week>=threshold;
  const tile=E('div','xp-reward-tier'+(reached?' achieved':''));
  tile.append(E('strong','',threshold+' XP'),E('span','',euros+' €'));
  tile.setAttribute('aria-label',threshold+' XP : '+euros+' euros'+(reached?', palier atteint':''));
  tierRow.append(tile);
 }
 wrapper.append(tierRow);
 const next=week<19?19:week<38?38:week<75?75:null;
 wrapper.append(E('p','xp-explainer',next===null?
  'Objectif de 75 XP atteint. Récompense de 10 € à valider par le parent.':
  'Encore '+(next-week).toLocaleString('fr-FR')+' XP pour atteindre le palier de '+(next===19?'2 €':next===38?'5 €':'10 €')+'.'));
 wrapper.append(E('p','xp-level-caption','Niveau '+st.level+' · '+st.total.toLocaleString('fr-FR')+' XP cumulés · remise à zéro du compteur hebdomadaire chaque lundi.'));
 return wrapper;
}
function refreshXPHeader(){const el=document.getElementById('xp-header');if(!el||window.__TIM_GUEST)return;const s=xpInfo();el.innerHTML='<span>⭐ '+s.total.toLocaleString('fr-FR')+' XP</span><small>Niveau '+s.level+'</small>';}
document.addEventListener('tim-spanish-ent-xp-progress',()=>refreshXPHeader());
function makeRewardsTile(){const b=E('button','reward-open');b.type='button';
 const text=E('span');text.append(E('strong','','🎁 MES RÉCOMPENSES'),E('small','','Comment fonctionnent les XP, les défis et les gains ?'));
 b.append(text,E('span','','›'));b.addEventListener('click',()=>{
  const dialog=document.getElementById('rewards-dialog'),body=clear(document.getElementById('rewards-explanation'));
  body.append(E('p','','Les XP des défis sont comptés du lundi au dimanche. Le compteur hebdomadaire revient à zéro le lundi. La récompense est à valider et à verser par le parent ; les montants ne se cumulent pas.'));
  const table=E('table'),heads=E('tr');for(const t of ['XP de la semaine','Récompense'])heads.append(E('th','',t));table.append(heads);
  for(const [score,amount] of [[19,'2 €'],[38,'5 €'],[75,'10 €']]){const row=E('tr');row.append(E('td','',score+' XP'),E('td','',amount));table.append(row);}body.append(table);
  const p=E('ul');for(const t of ['Défi du samedi (20 questions) : 17–20 = +10 XP ; 15–16 = +7 XP ; 12–14 = +4 XP ; 10–11 = +1 XP ; 8–9 = 0 XP ; 0–7 = −1 XP.','Défi du dimanche (20 questions sur la rentrée) : mêmes paliers que samedi, doublés pour atteindre 20 XP maximum.','Devoirs scolaires ENT : 0 XP. Entraînements des leçons de mathématiques et d’espagnol : 7 à 10/10 = +1 XP ; 5 à 6/10 = +0,5 XP ; 0 à 4/10 = 0 XP. Exercice bonus libre : maximum +3 XP par jour.','Une seule validation par défi du week-end. Les résultats et les XP déjà acquis restent enregistrés.','À chaque lundi, seul le compteur hebdomadaire repart à zéro : les notes, copies, trophées et XP de niveau restent enregistrés.','Les récompenses ne sont pas versées automatiquement ; le parent valide le montant.'])p.append(E('li','',t));body.append(p);
  if(!window.__TIM_GUEST){const st=xpInfo();body.append(E('p','','Cette semaine : '+st.week.toLocaleString('fr-FR')+' XP. Récompense actuelle : '+st.reward+' €.'));}
  dialog.setAttribute('tabindex','-1');if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');dialog.scrollTop=0;dialog.focus({preventScroll:true});
 });return b;}
document.getElementById('rewards-close')?.addEventListener('click',()=>{const d=document.getElementById('rewards-dialog');if(d.close)d.close();else d.removeAttribute('open');});
// Le défi quotidien et son panneau ont été supprimés.
function dailyMissionPanel(){
 const meta=window.__TIM_CHALLENGES||{};
 const ids=Array.isArray(meta.dailyIds)?meta.dailyIds:[];
 const section=E('section','daily-loup-panel');
 section.setAttribute('aria-label','Défi du jour et barème des XP');
 const imageBox=E('div','daily-loup-image');
 const wolf=E('img','daily-loup-gif');
 const dailyFallback='./assets/loup-defi-original.webp';
 wolf.src=dailyFallback;
 if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)window.TIM_ANIMATIONS?.setCardImage?.(wolf,'daily',dailyFallback);
 wolf.width=358;wolf.height=267;wolf.alt='Loup au casque assis dans sa bibliothèque, présentant le défi du jour.';
 wolf.loading='eager';wolf.decoding='async';
 imageBox.append(wolf);section.append(imageBox);
 const content=E('div','daily-loup-content');
 content.append(E('p','daily-loup-eyebrow','MISSION · DU LUNDI AU VENDREDI'));
 content.append(E('h2','','DÉFI DU JOUR'));
 const mixed=['mixed','three-subjects','four-subjects','five-subjects','six-subjects','seven-subjects'].includes(meta.dailyBankStatus);
 content.append(E('p','daily-loup-summary',meta.dailyBankStatus==='seven-subjects'?
  '3 missions de 10 questions · Français, histoire-géographie, SVT, anglais, espagnol, maths et physique-chimie mélangés · 7 matières par jour.':
  meta.dailyBankStatus==='six-subjects'?
  '3 missions de 10 questions · Histoire-géographie, SVT, anglais, espagnol, maths et physique-chimie mélangés · 6 matières chaque jour.':
  meta.dailyBankStatus==='five-subjects'?
  '3 missions de 10 questions · SVT, anglais, espagnol, maths et physique-chimie mélangés · 2 questions par matière.':
  meta.dailyBankStatus==='four-subjects'?
  '3 missions de 10 questions · Anglais, espagnol, maths et physique-chimie mélangés · Réponses écrites et corrections.':
  meta.dailyBankStatus==='three-subjects'?
  '3 missions de 10 questions · Espagnol, maths et physique-chimie mélangés · Rédaction, raisonnement et relecture.':
  mixed?'3 défis par jour · 10 questions chacun · 2 QCM et 8 réponses écrites · une seule validation par défi.':
  '3 défis possibles par jour · 10 questions chacun · une seule validation par défi.'));
 if(meta.today<'2026-11-16'&&meta.dailyBankStatus==='three-subjects')
  content.append(E('p','daily-loup-future','L’anglais et la SVT rejoignent les trois autres matières dès le lundi 16 novembre. Les défis déjà proposés restent inchangés.'));
 if(!mixed&&meta.today>='2026-11-11'&&ids.length)content.append(
  E('p','daily-loup-unavailable','Les nouveaux défis à réponses écrites sont momentanément indisponibles ; les défis classiques restent accessibles.'));
 const scores=E('div','daily-xp-scale');
 for(const [grade,award] of [['9–10/10','+3 XP'],['7–8/10','+2 XP'],['5–6/10','+1 XP'],['2–4/10','0 XP'],['0–1/10','−1 XP']]){
  const row=E('div','daily-xp-rule'+(award.startsWith('−')?' daily-xp-loss':''));
  row.append(E('span','',grade),E('strong','',award));scores.append(row);
 }
 content.append(scores);
 const buttons=E('div','daily-loup-buttons');
 if(ids.length===0){
  buttons.append(E('p','daily-loup-unavailable','Les défis du jour sont accessibles du lundi au vendredi. Les grands défis restent disponibles le week-end.'));
 }else for(const [i,id] of ids.entries()){
  const ex=DATA.exercises.find(x=>x.id===id),done=ex?attemptFor(id):null;
  if(!ex){
   buttons.append(E('p','daily-loup-unavailable','Mission '+(i+1)+' : pas assez de questions disponibles.'));
   continue;
  }
  const label=window.__TIM_PARENT&&ex.questionBank==='mixed-202611-v1'?
    'Mission '+(i+1)+' · Essai Parent (sans XP)':
    done?'Mission '+(i+1)+' · Terminée'+(done.score!==null?' · '+done.score+'/10':'')+' · '+Number(done.xp||0).toLocaleString('fr-FR')+' XP':'Mission '+(i+1)+' · Commencer';
  const b=button(label,()=>openExercise(id),'daily-loup-launch'+(done?' done':''));
  if(window.__TIM_GUEST&&!done){b.disabled=true;b.title='Connexion nécessaire pour répondre';}
  buttons.append(b);
 }
 content.append(buttons);
 section.append(content);
 return section;
}
function missionCard(kind){
 if(kind==='daily')return null;
 const meta=window.__TIM_CHALLENGES||{},id=kind==='weekly'?meta.weekly:meta.sunday;
 const ex=DATA.exercises.find(x=>x.id===id),done=ex&&attemptFor(ex.id),sunday=kind==='sunday';
 const c=E('section',sunday?'sunday-card game-challenge':'weekly-card game-challenge');
 const head=E('div','challenge-top');
 head.append(E('strong','',sunday?'👑 GRAND DÉFI DU DIMANCHE':'🏆 DÉFI DU SAMEDI'),E('span','challenge-xp-tag',sunday?'JUSQU’À +20 XP':'JUSQU’À +10 XP'));
 c.append(head);
 const body=E('div','challenge-main'),copy=E('div','challenge-main-copy');
 if(!ex){copy.append(E('p','challenge-detail','Le grand contrôle nécessite au moins 20 questions issues des cours disponibles.'));}
 else{
  copy.append(E('p','challenge-detail',sunday?'20 questions de révision sur les leçons depuis la rentrée.':'20 questions sur les leçons de la semaine et les révisions.'));
  copy.append(E('p','challenge-meta',ex.realLessons.length+' leçon'+(ex.realLessons.length>1?'s':'')+' · '+(sunday?'Depuis septembre':'Contrôle hebdomadaire')));
  copy.append(E('p','challenge-success','🎯 Dès 17/20 : '+(sunday?'20':'10')+' XP'));
 }
 body.append(copy);
 const wolfWrap=E('div','challenge-wolf-scene'),artKind=sunday?'sunday':'weekly';
 const img=E('img','challenge-wolf challenge-wolf-'+artKind);
 img.src='./assets/loup-'+artKind+(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'-statique.webp':'-anime.webp');
 const previousArt=img.src;
 if(!sunday)window.TIM_ANIMATIONS?.setCardImage?.(img,'saturday',previousArt);
 else window.TIM_ANIMATIONS?.setCardImage?.(img,'sundayCard',previousArt);
 img.alt=sunday?'Loup animé au casque dans son bureau pour le défi du dimanche':'Loup victorieux avec une coupe';img.loading='lazy';img.width=sunday?356:126;img.height=sunday?358:100;
 wolfWrap.append(img);body.append(wolfWrap);c.append(body);
 const dow=new Date((meta.today||'2026-11-08')+'T12:00:00Z').getUTCDay(),open=sunday?dow===0:dow===6;
 const actions=E('div','challenge-card-actions');
 if(!ex)actions.append(badge('À venir'));
 else if(done)actions.append(badge('✓ Déjà validé · '+(done.score===null?'correction en attente':done.score+'/'+done.total),'green'),button('Voir ma validation',()=>openExercise(ex.id),'small-cta'));
 else if(!open)actions.append(badge(sunday?'Disponible dimanche':'Disponible samedi'));
 else if(window.__TIM_GUEST)actions.append(badge('Lecture seule · invité'));
 else actions.append(button(window.__TIM_PARENT?(ex?.questionBank==='mixed-202611-v1'?'Essai Parent (sans XP)':'Prévisualiser le défi'):'LANCER LE DÉFI',async()=>{if(!sunday)await window.TIM_ANIMATIONS?.play?.('saturday');openExercise(ex.id);},'mission-launch'));
 c.append(actions);return c;
}

function englishHomeExercises(){
 const area=E('section','panel english-home-quick');
 area.style.cssText='margin:15px 0;padding:15px;border:1px solid #5a97af;border-radius:15px;background:#182d46';
 area.append(E('h3','','🇬🇧 Anglais — exercices de révision'));
 area.append(E('p','','11 exercices interactifs, dont des entraînements sur le prétérit, la musique et le suffixe -ness.'));
 const openAll=()=>{exerciseSubject='Anglais';exerciseGroup='';exerciseMode='';page('exercices');};
 area.append(button('Ouvrir les 11 exercices d’anglais',openAll,'plain'));
 area.append(button('Prétérit simple et BE-ING · 10 questions',()=>openEnglishTrainingFromExercises('ENQ_L07_01','EN_BIS07','Prétérit simple et prétérit BE-ING'),'plain'));
 return area;
}

function svtHomeExercises(){
 const area=E('section','panel svt-home-quick');
 area.style.cssText='margin:14px 0;padding:14px;border:1px solid #529f91;border-radius:14px;background:#183f48';
 area.append(E('h3','','🌱 SVT — Leçons et exercices'));
 area.append(E('p','','7 leçons illustrées · 14 exercices de dix questions · cours ENT de Mme Vidon.'));
 area.append(button('Ouvrir les 14 exercices SVT',()=>{exerciseSubject='SVT';exerciseGroup='';exerciseMode='';page('exercices');},'plain'));
 area.append(button('Phagocytose · questionnaire de 10 questions',()=>openSvtTrainingFromExercises('SVQ_L07_01','SVT_BIS07','Phagocytose'),'plain'));
 return area;
}
function hgHomeExercises(){
 const area=E('section','panel hg-home-quick');
 area.style.cssText='margin:14px 0;padding:14px;border:1px solid #529f91;border-radius:14px;background:#183f48';
 area.append(E('h3','','🌍 Histoire-géographie — Leçons et exercices'));
 area.append(E('p','','8 leçons illustrées · 16 exercices de dix questions · cours ENT de Mme Baudoux.'));
 area.append(button('Ouvrir les '+((window.TIM_HG_PACK?.bis?.length||0)*2)+' exercices Histoire-géographie',()=>{exerciseSubject='Histoire-géographie';exerciseGroup='';exerciseMode='';page('exercices');},'plain'));
 area.append(button('Institutions européennes · questionnaire de 10 questions',()=>openHgTrainingFromExercises('HGQ_L08_01','HG_BIS08','Institutions européennes'),'plain'));
 return area;
}
function frHomeExercises(){
 const area=E('section','panel fr-home-quick');
 area.style.cssText='margin:14px 0;padding:14px;border:1px solid #529f91;border-radius:14px;background:#183f48';
 area.append(E('h3','','📖 Français — Leçons et exercices'));
 area.append(E('p','','11 leçons illustrées · 22 exercices de dix questions · cours ENT de M. Lunel et M. Simiez.'));
 area.append(button('Ouvrir les 22 exercices de français',()=>{exerciseSubject='Français';exerciseGroup='';exerciseMode='';page('exercices');},'plain'));
 area.append(button('Accord du participe passé · questionnaire de 10 questions',()=>openFrTrainingFromExercises('FRQ_L07_01','FR_BIS07','Accord du participe passé'),'plain'));
 return area;
}
function makeSoundSettings(){const zone=E('div','sound-settings');zone.append(E('span','','🔊 Bruit des touches : '));
 const selector=E('select');selector.setAttribute('aria-label','Son des boutons');for(const [value,name] of [['bulle','Bulle · pop'],['arcade','Tir arcade · pew'],['muet','Sans bruit']])selector.add(new Option(name,value));selector.value=window.TIM_SOUND?.mode||'bulle';selector.addEventListener('change',()=>window.TIM_SOUND?.setMode(selector.value));zone.append(selector);return zone;
}
function renderHome(){
 const root=clear(document.getElementById('home-content'));refreshXPHeader();
 const hero=E('section','mission-hero');
 const copy=E('div','mission-copy');copy.append(E('div','shout','RÉVISIONS DES DEVOIRS'),E('h1','','MES DEVOIRS EN BONUS'),E('p','','Des exercices préparés ensemble pour réviser les devoirs. Note, correction et XP selon le barème de chaque exercice.'));
 copy.append(button('Ouvrir mes exercices bonus →',()=>{exerciseSubject='';exerciseGroup='';exerciseMode='homework-bonus';page('exercices');},'lobo-go'));hero.append(copy);const wolf=E('img','mission-wolf');wolf.src='./assets/loup-accueil.webp';wolf.alt='Le loup jongleur du classeur';hero.append(wolf);// Défis quotidiens rétablis avec les images originales du parent.
 root.append(hero);
 if(window.__TIM_READONLY_FALLBACK)
  root.append(notice('Accès provisoire : le serveur des cours est indisponible. Les leçons et les défis sont consultables, mais la validation des réponses et les XP sont suspendus sur cet appareil. Actualise la page pour rétablir le compte complet.'));
 else if(window.__TIM_ADDONS_INCOMPLETE)
  root.append(notice('Certaines fiches complémentaires n’ont pas pu être chargées. Les cours principaux et les défis restent accessibles. Actualise le classeur pour retrouver toutes les fiches.'));
 root.append(dailyMissionPanel(),...(window.__TIM_GUEST?[]:[makeXPPanel()]),makeRewardsTile(),makeSoundSettings(),missionCard('weekly'),missionCard('sunday'));
 root.append(E('h2','home-section-title','Que veux-tu travailler ?'));
 const cards=E('div','home-grid');
 for(const o of [{name:'Matières',sub:'Cours classés par matière',icon:'▦',cls:'cours',dest:'matieres'},
  {name:'Exercices',sub:'Matière, thème, puis quiz',icon:'✓',cls:'exos',dest:'exercices'},
  {name:'Outils',sub:'Dictionnaires et recherche',icon:'⌕',cls:'words',dest:'dico'},
  {name:'Mes erreurs',sub:'Corrections et progrès',icon:'◎',cls:'errors',dest:'difficultes'}]){
  const b=E('button','home-card '+o.cls);b.type='button';b.append(E('span','icon-bubble',o.icon),E('span','corner','›'));const t=E('div');t.append(E('strong','',o.name),E('small','',o.sub));b.append(t);b.addEventListener('click',()=>{if(o.dest==='exercices'){exerciseSubject='';exerciseGroup='';exerciseMode='';}page(o.dest);});cards.append(b);
 }root.append(cards);
 root.append(E('p','home-mini-note',window.__TIM_GUEST?'Visite publique : cours et questions consultables, aucune réponse enregistrée.':'Débloque tes missions et suis ta progression. Consulte « Mes récompenses » pour connaître les règles.'));
 if(window.__TIM_PARENT)root.append(button('Voir les résultats et les réglages parent',()=>page('parent'),'plain'));
}
function setMatieresSelectionHeader(show){
 // Le titre « Mes matières » et sa consigne sont utiles au choix des matières,
 // mais redondants après l'ouverture d'une matière (dont Espagnol).
 const heading=document.querySelector('#matieres > .pagehead');
 if(heading)heading.style.display=show?'':'none';
}
function renderMatieres(){
 setMatieresSelectionHeader(true);
 const root=clear(document.getElementById('matieres-content'));refreshXPHeader();
 root.append(E('p','intro',window.__TIM_GUEST?'Aperçu public. Les contenus privés nécessitent une connexion.':'Retrouve les cours, les chapitres et les exercices de chaque matière.')); 
 const wrap=E('div','matter-grid');
 const icons=['🇪🇸','∑','⚗','EN','📖','🌍','⚖','🌱','⚙'];
 for(let i=0;i<SCHOOL_SUBJECTS.length;i++){
  const name=SCHOOL_SUBJECTS[i],n=name==='Espagnol'&&window.TIM_SPANISH_ENT_EXACT?.lessonCount?window.TIM_SPANISH_ENT_EXACT.lessonCount():name==='Espagnol'?(DATA.metadata?.spanishEnt?.lessons?.length||0):name==='SVT'?(window.TIM_SVT_PACK?.lessons?.length||0):name==='Histoire-géographie'?(window.TIM_HG_PACK?.lessons?.length||0):name==='Français'?(window.TIM_FR_PACK?.lessons?.length||0):DATA.lessons.filter(x=>(x.subject||'Espagnol')===name).length,ex=name==='Physique-chimie'?23:name==='Anglais'?11:name==='SVT'?14:name==='Histoire-géographie'?(window.TIM_HG_PACK?.bis?.length||0)*2:name==='Français'?22:name==='Mathématiques'?2+DATA.exercises.filter(x=>(x.subject||'Espagnol')===name).length:name==='Espagnol'&&window.TIM_SPANISH_SIMPLIFIED?42:DATA.exercises.filter(x=>(x.subject||'Espagnol')===name).length;
  const b=E('button','matter-card'+(name==='Espagnol'?' matter-espanol':''));b.type='button';b.append(E('span','ico',name==='Anglais'?'🇬🇧':name==='SVT'?'🌱':name==='Histoire-géographie'?'🌍':name==='Français'?'📖':icons[i]||'▤'),E('strong','',name),E('small','',n+' leçon(s) · '+ex+' exercice(s)'+(!n?' · Cours ENT à ajouter':'') ));
  if(n||(name==='Espagnol'&&window.__TIM_PARENT&&window.TIM_SPANISH_ENT_EXACT))b.addEventListener('click',()=>renderMatiere(name));else{b.title='Les vrais cours de Tim ne sont pas encore ajoutés';b.disabled=true;b.style.opacity='.55';}
  wrap.append(b);
 }root.append(wrap);
 if(SCHOOL_SUBJECTS.some(s=>!DATA.lessons.some(l=>(l.subject||'Espagnol')===s)))root.append(E('div','note','Les autres matières ne seront remplies qu’à partir des documents réels de Tim (ENT, cahiers et devoirs). Aucun cours ne sera inventé.'));
}
function renderMatiere(name,openLessonId=null){
 setMatieresSelectionHeader(false);
 const root=clear(document.getElementById('matieres-content'));
 if(name==='Espagnol'&&window.TIM_SPANISH_ENT_EXACT){
  window.TIM_SPANISH_ENT_EXACT.render(root,{back:renderMatieres,openLessonId}).catch(e=>root.append(E('p','notice','Espagnol indisponible : '+e.message)));
  return;
 }
 if(name==='Espagnol'&&window.TIM_SPANISH_PATH&&window.TIM_SPANISH_EDU){
  window.TIM_SPANISH_PATH.render(root,{lessons:DATA.lessons,back:renderMatieres,original:openLesson});
  return;
 }
 if(name==='Physique-chimie'&&window.TIM_PHYSIQUE_PATH){
  window.TIM_PHYSIQUE_PATH.render(root,{lessons:DATA.lessons,back:renderMatieres,openLessonId});
  return;
 }
 if(name==='Anglais'&&window.TIM_ENGLISH_PATH){window.TIM_ENGLISH_PATH.render(root,{lessons:DATA.lessons,back:renderMatieres,openLessonId});return;}
  if(name==='SVT'&&window.TIM_SVT_PATH){window.TIM_SVT_PATH.render(root,{back:renderMatieres,openLessonId});return;}
  if(name==='Histoire-géographie'&&window.TIM_HG_PATH){window.TIM_HG_PATH.render(root,{back:renderMatieres,openLessonId});return;}
 if(name==='Français'&&window.TIM_FR_PATH){window.TIM_FR_PATH.render(root,{back:renderMatieres,openLessonId});return;}
  if(name==='Mathématiques'&&window.TIM_MATH_PATH){
  window.TIM_MATH_PATH.render(root,{
   lessons:DATA.lessons,exercises:DATA.exercises,openLessonId,
   back:renderMatieres,original:openLesson,exercise:openExercise,
   task:id=>window.__TIM_BRIDGE.mathTrainingTask(id),
   submit:(id,answers,bankVersion)=>window.__TIM_BRIDGE.mathTrainingSubmit(id,answers,bankVersion),
   progress:()=>window.__TIM_BRIDGE.mathTrainingProgress()
  });
  return;
 }
 root.append(button('← Toutes les matières',renderMatieres,'matter-back'),E('h2','',name));
 const lessons=DATA.lessons.filter(x=>subjectOf(x)===name);
 const exs=DATA.exercises.filter(x=>subjectOf(x)===name&&!window.TIM_EXERCISE.challenge(x));
 root.append(E('p','intro',lessons.length+' cours · '+exs.length+' exercices. Les vrais devoirs de l’ENT sont séparés des bonus.'));
 const groups=groupsForLessons(lessons,name);
 for(const group of groups){
  const chapterLessons=lessons.filter(l=>group.topics.includes(chapterOf(l)));
  const chapterExercises=exs.filter(e=>chapterLessons.some(l=>l.id===e.lesson));
  const section=E('details','chapter-section');const sum=E('summary','',group.title+' · '+chapterLessons.length+' cours · '+chapterExercises.length+' exercices');section.append(sum);
  const body=E('div','chapter-body');
  const ordinary=chapterLessons.filter(l=>!isBonusLesson(l));
  const bonus=chapterLessons.filter(l=>!ordinary.includes(l));
  function addLessons(title,rows){if(!rows.length)return;body.append(E('h3','',title));const list=E('div','clicklist');for(const l of rows)list.append(cardAction(l.title,l.date||'Révision',l.summary||'',()=>openLesson(l.id)));body.append(list);}
  addLessons('Cours de la classe / ENT',ordinary);addLessons('Cours bonus : explications supplémentaires',bonus);
  function addEx(title,rows){if(!rows.length)return;body.append(E('h3','',title));const list=E('div','clicklist');for(const e of rows)list.append(cardAction(e.title,(e.kind==='training'?'Jusqu’à +1 XP':window.TIM_EXERCISE.school(e)?'0 XP':'Bonus XP'),exerciseDescription(e),()=>openExercise(e.id),attemptFor(e.id)?'Terminé':'À faire'));body.append(list);}
  addEx('Devoirs ENT et entraînements liés',chapterExercises.filter(e=>window.TIM_EXERCISE.mode(e)==='school'));
  addEx('Entraînements bonus',chapterExercises.filter(e=>window.TIM_EXERCISE.mode(e)!=='school'));
  section.append(body);root.append(section);
 }
}
const V7_IMAGES={};
let v7AudioEnabled=window.TIM_SOUND?.on??true,v7Ctx=null,v7Rain=null,v7LastReaction=null;
function v7UpdateSoundButton(){v7AudioEnabled=window.TIM_SOUND?.on??v7AudioEnabled;const b=document.getElementById('sound-toggle');if(!b)return;b.textContent=v7AudioEnabled?'🔊':'🔇';b.title=v7AudioEnabled?'Couper les sons':'Activer les sons';b.classList.toggle('on',v7AudioEnabled);b.setAttribute('aria-label',b.title);}
function v7Audio(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!v7Ctx)v7Ctx=new C();if(v7Ctx.state==='suspended')v7Ctx.resume();return v7Ctx;}catch(e){return null;}}
function v7Toast(msg){const el=document.getElementById('v7-toast');if(!el)return;el.textContent=msg;el.hidden=false;clearTimeout(v7Toast.t);v7Toast.t=setTimeout(()=>el.hidden=true,3500);}
function v7Sfx(kind){const c=v7Audio();if(!c)return;let now=c.currentTime+.02;const settings={welcome:[200,385,260,.66],win:[250,520,350,1.02],try:[260,325,210,.46],review:[185,295,230,.55]};const [a,b,z,d]=settings[kind]||settings.welcome;
 // Stylised cartoon wolf howl generated locally (not a recorded animal call).
 for(let i=0;i<2;i++){const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type=i?'sine':'sawtooth';f.type='lowpass';f.frequency.value=i?900:650;o.frequency.setValueAtTime(a*(i?1.98:1),now);o.frequency.exponentialRampToValueAtTime(b*(i?1.98:1),now+d*.4);o.frequency.exponentialRampToValueAtTime(z*(i?1.98:1),now+d);g.gain.setValueAtTime(.0001,now);g.gain.linearRampToValueAtTime(i?.036:.1,now+d*.16);g.gain.setValueAtTime(i?.036:.1,now+d*.55);g.gain.exponentialRampToValueAtTime(.0001,now+d);o.connect(f).connect(g).connect(c.destination);o.start(now);o.stop(now+d+.04);}
}
function v7SpeakWolf(s){if(!('speechSynthesis' in window)){v7Toast('La voix de synthèse n’est pas disponible sur ce téléphone.');return;}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s);u.lang='fr-FR';u.rate=.94;u.pitch=.77;u.volume=.84;const voice=speechSynthesis.getVoices().find(x=>x.lang?.toLowerCase().startsWith('fr'));if(voice)u.voice=voice;speechSynthesis.speak(u);}catch(e){v7Toast('La voix n’a pas fonctionné.');}}
function v7WolfHello(){if(!v7AudioEnabled){v7AudioEnabled=true;v7UpdateSoundButton();}v7Sfx('welcome');v7SpeakWolf('Bienvenue dans ton classeur, Tim ! Allez, campeón, on s’y met. Vamos !');const im=document.querySelector('.wolf-hero');if(im){im.classList.remove('wolf-howling');void im.offsetWidth;im.classList.add('wolf-howling');}}
function v7Reaction(t){if(t.needsReview)return {key:'review',heading:'Texte enregistré !',phrase:'El Lobo attend la relecture de ta rédaction. Aucun point perdu pour le moment.',sound:'review',voice:'Texte enregistré. Bien joué pour l’effort. On le relira ensemble.'};
 if(t.score===t.total)return {key:'correct',heading:'¡Perfecto !',phrase:'Tout est juste. El Lobo pousse son hurlement de victoire !',sound:'win',voice:'Ouh ! Bravo Tim ! Toutes les réponses sont justes. Tu assures !'};
 if(t.score===0)return {key:'error',heading:'On reprend autrement',phrase:'Pas de panique. El Lobo a repéré ce qui bloque : regarde les explications et le carnet des difficultés.',sound:'try',voice:'Aïe, ce n’est pas encore ça. On regarde ensemble. Tu vas y arriver.'};
 return {key:'progress',heading:'Bien joué, on progresse !',phrase:'Il reste quelques erreurs. El Lobo t’aide à comprendre, sans recommencer cet exercice.',sound:'try',voice:'Bien joué pour les réponses correctes ! On va comprendre les autres. Vamos !'};}
function v7NewAttempt(t){v7LastReaction=t.id;window.TIM_SOUND?.play('tap');}
function v7Feedback(ex,t){
 const r=v7Reaction(t),card=E('div','result-reaction');
 card.append(E('span','avatar','🐺'));
 const words=E('div');words.append(E('strong','',r.heading),E('p','',t.needsReview?'Ton texte est enregistré pour une relecture.':(t.score===t.total?'Tout est juste, bien joué !':'Regarde les explications pour comprendre les réponses.')));
 card.append(words);return card;
}
function v7RainToggle(){const b=document.getElementById('rain-toggle');if(v7Rain){try{v7Rain.source.stop();}catch(e){}v7Rain=null;b.classList.remove('on');b.textContent='☔';b.title='Activer la pluie douce';v7Toast('Ambiance pluie coupée.');return;}const c=v7Audio();if(!c){v7Toast('Ce navigateur ne permet pas les sons.');return;}const length=Math.floor(c.sampleRate*2);const buff=c.createBuffer(1,length,c.sampleRate);let arr=buff.getChannelData(0);let x=0;for(let i=0;i<length;i++){x=(x*.98)+(Math.random()*2-1)*.02;arr[i]=x*.6;}let source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buff;source.loop=true;filter.type='lowpass';filter.frequency.value=1350;gain.gain.value=.045;source.connect(filter).connect(gain).connect(c.destination);source.start();v7Rain={source,filter,gain};b.classList.add('on');b.textContent='🌧️';b.title='Arrêter la pluie douce';v7Toast('Ambiance pluie activée.');}
function v7InitUI(){document.addEventListener('tim-sound-change',v7UpdateSoundButton);v7UpdateSoundButton();document.getElementById('sound-toggle').addEventListener('click',()=>{v7AudioEnabled=!v7AudioEnabled;window.TIM_SOUND?.setOn(v7AudioEnabled);v7UpdateSoundButton();if(!v7AudioEnabled&&'speechSynthesis' in window)speechSynthesis.cancel();v7Toast(v7AudioEnabled?'Sons activés.':'Sons coupés.');});document.getElementById('rain-toggle').addEventListener('click',v7RainToggle);
 const cour=document.getElementById('cours').querySelector('.pagehead');if(cour){const a=E('div','utility-row');a.append(button('★ Fiches de révision',()=>page('revisions'),'small-cta'));cour.append(a);}
 const parent=document.getElementById('parent-content');let parentH=document.getElementById('parent').querySelector('.pagehead');parentH.append(E('div','parent-note','Les résultats sont enregistrés en ligne dans Firestore et visibles par les comptes autorisés. Les notifications automatiques ne sont pas encore disponibles.'));let links=E('div','utility-row');links.append(button('🗂 Archives ENT',()=>page('archives'),'small-cta'),button('★ Fiches de révision',()=>page('revisions'),'small-cta'));parentH.append(links);
 const rev=document.getElementById('revisions').querySelector('.pagehead');rev.append(button('← Accueil',()=>page('home'),'small-cta'));
 const help=document.getElementById('aide').querySelector('.pagehead');help.append(button('← Accueil',()=>page('home'),'small-cta'));
 const arch=document.getElementById('archives').querySelector('.pagehead');arch.append(button('← Coin parent',()=>page('parent'),'small-cta'));
}

// Init
const categories=[...new Set(DATA.lessons.map(l=>l.topic))].sort((a,b)=>a.localeCompare(b,'fr'));
topicSelect('lesson-topic',categories,'all',v=>{lessonTopic=v;renderLessonIndex()});
topicSelect('exercise-topic',categories,'all',v=>{exerciseTopic=v;renderExerciseIndex()});
renderHome();renderLessonIndex();renderExerciseIndex();renderRevisions();renderArchives();renderDico('hub');
/* Retour pédagogique depuis une correction vers la sous-leçon concernée.
   Sans soumettre de questionnaire ni modifier les copies déjà validées. */
window.TIM_PEDAGOGY_NAVIGATE=(subject,lessonId)=>{
 if(!['Espagnol','Mathématiques','Physique-chimie','Anglais','SVT','Histoire-géographie','Français'].includes(subject))return;
 if(typeof lessonId!=='string'||lessonId.length>40)return;
 page('matieres');
 renderMatiere(subject,lessonId);
};
const hash=location.hash.replace('#','');if(document.getElementById(hash)?.classList.contains('page'))page(hash);else page('home');

 v7InitUI();


// Rafraîchir les exercices et les corrections après une autorisation parentale.
// Aucun déblocage automatique à une heure programmée.
let __timLastDay=window.TIM_EXERCISE.day(new Date());
let __timLastCorrectionAccess='';
function __timRefreshCalendar(){
 const today=window.TIM_EXERCISE.day(new Date());const dateChanged=today!==__timLastDay;__timLastDay=today;
 const detail=document.getElementById('exercise-detail');
 if(detail?.classList.contains('active')&&window.__TIM_OPEN_EXERCISE_ID){
  const a=attemptFor(window.__TIM_OPEN_EXERCISE_ID);
  if(a){const access=String((a.correctionStatus==='released'&&Array.isArray(a.answers)&&a.answers.length>0));
   if(__timLastCorrectionAccess!==access){__timLastCorrectionAccess=access;openExercise(a.id);return;}}
 }
 if(dateChanged){
  // Le cours et les missions sont reconstruits pour la nouvelle journée.
  window.location.reload();return;
  const el=document.getElementById('exercices');if(el?.classList.contains('active')){
   renderExerciseIndex();
   const tip=document.getElementById('tim-exercise-mode-info');const ex=exerciseBy(window.__TIM_OPEN_EXERCISE_ID);
   if(tip&&ex){const mode=window.TIM_EXERCISE.mode(ex);tip.textContent=mode==='bonus'?'⭐ EXERCICE BONUS · 100 % = +2 XP ; dès 60 % = +1 XP ; sinon 0. Maximum +3 XP par jour.':mode==='school'?'📚 DEVOIR DE L’ÉCOLE · 0 XP.':'Pas encore disponible.';}
  }
  if(document.getElementById('home')?.classList.contains('active'))renderHome();
 }
}
setInterval(__timRefreshCalendar,60000);
document.addEventListener('visibilitychange',async()=>{
 if(document.hidden)return;
 if(window.__TIM_BRIDGE?.refresh&&!window.__TIM_PARENT&&!window.__TIM_GUEST){
  try{await window.__TIM_BRIDGE.refresh();}catch(e){console.warn('Actualisation des corrections indisponible',e);}
 }
 __timRefreshCalendar();
});
