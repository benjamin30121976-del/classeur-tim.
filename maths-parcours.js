/* Parcours Mathématiques : même navigation que l'Espagnol, sans XP ni jeu.
   Sources : cours ENT existants et 23 leçons BIS conservées intactes.
   Les évaluations associées sont validées UNE fois et corrigées par le serveur. */
(function(){
'use strict';
const GROUPS=[
 {name:'Calculs numériques',start:1,end:4,keywords:/relatif|fraction|puissanc|calcul numerique|ecriture scientifique/},
 {name:'Pythagore',start:5,end:9,keywords:/pythagore/},
 {name:'Calcul littéral',start:10,end:13,keywords:/litteral|developp|programme de calcul|expression/},
 {name:'Thalès',start:14,end:17,keywords:/thales|rapport|proportionnalit/},
 {name:'Brevet et géométrie',start:18,end:18,keywords:/brevet|geometrie/},
 {name:'Automatismes',start:19,end:21,keywords:/automatism/},
 {name:'Révisions et évaluations',start:22,end:23,keywords:/evaluation|controle|revisio|correction/}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nrm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const suffix=x=>String(x).replace(/^MBIS/,'');
const cleanTitle=s=>String(s||'').replace(/^BIS\s*[·:]\s*/i,'');
let root=null,options={},all=[],bis=[],ent=[],exercises=[],group=null,selected=null;
let grades={status:'loading',attempts:[]};
function groupOfId(id){
 const n=Number(suffix(id));return GROUPS.find(g=>n>=g.start&&n<=g.end)||GROUPS[0];
}
function groupOfEnt(lesson){
 const text=nrm([lesson.chapter,lesson.topic,lesson.title].join(' '));
 // Reconnaître la finalité de la séance avant les notions qu'elle révise.
 if(/automatism/.test(text))return GROUPS[5];
 if(/evaluation|controle|revisio|correction/.test(text))return GROUPS[6];
 if(/brevet/.test(text))return GROUPS[4];
 if(/thales/.test(text))return GROUPS[3];
 if(/pythagore/.test(text))return GROUPS[1];
 if(/litteral|developp|programme de calcul|expression/.test(text))return GROUPS[2];
 if(/fraction|puissanc|relatif|calcul numerique|ecriture scientifique/.test(text))return GROUPS[0];
 return null;
}
function entFor(g){return ent.filter(x=>groupOfEnt(x)===g);}
function exFor(g){const ids=new Set(entFor(g).map(x=>x.id));return exercises.filter(x=>x.subject==='Mathématiques'&&ids.has(x.lesson)&&x.category!=='bonus');}
function header(title,sub){return '<header class="spx-hero"><span class="spx-kicker">MATHÉMATIQUES · CLASSEUR DE TIM</span><h2>'+esc(title)+'</h2><p>'+esc(sub)+'</p></header>';}
function back(label){return '<button type="button" class="spx-back" data-math-back>← '+esc(label)+'</button>';}
function draw(html,backFn){if(!root)return;root.innerHTML='<div class="spx math-path">'+html+'</div>';const b=root.querySelector('[data-math-back]');if(b)b.onclick=backFn;try{root.scrollIntoView({block:'start'});}catch(e){}}
function btn(attr,value,label){return '<button type="button" class="spx-quick-link" '+attr+'="'+esc(value)+'">'+esc(label)+'</button>';}
function lesson(id){return bis.find(x=>x.id===id);}
function sectionBtns(id){
 const g=groupOfId(id),course=entFor(g).length,ex=exFor(g).length;
 return '<div class="spx-quick-links">'+
 (course?btn('data-math-ent',id,'1 · Leçon ENT ('+course+')'):'')+
 btn('data-math-bis',id,'2 · Leçon BIS')+
 btn('data-math-help',id,'3 · Je n’ai pas compris')+
 (ex?btn('data-math-ex',id,'Exercices ENT du chapitre ('+ex+')'):'')+
 (id==='MBIS13'?btn('data-math-programs',id,'Fiche originale · Programmes A et B'):'')+
 btn('data-math-train',id,'Évaluation · une seule fois · 0 XP')+
 '</div>';
}
function wire(){
 root.querySelectorAll('[data-math-group]').forEach(b=>b.onclick=()=>category(GROUPS[Number(b.dataset.mathGroup)]));
 root.querySelectorAll('[data-math-ent]').forEach(b=>b.onclick=()=>viewEnt(b.dataset.mathEnt));
 root.querySelectorAll('[data-math-bis]').forEach(b=>b.onclick=()=>viewBis(b.dataset.mathBis));
 root.querySelectorAll('[data-math-help]').forEach(b=>b.onclick=()=>viewHelp(b.dataset.mathHelp));
 root.querySelectorAll('[data-math-ex]').forEach(b=>b.onclick=()=>viewEntExercises(b.dataset.mathEx));
 root.querySelectorAll('[data-math-programs]').forEach(b=>b.onclick=()=>viewProgramsOriginal());
 root.querySelectorAll('[data-math-train]').forEach(b=>b.onclick=()=>viewTraining(b.dataset.mathTrain));
 root.querySelectorAll('[data-math-open-original]').forEach(b=>b.onclick=()=>options.original(b.dataset.mathOpenOriginal));
 root.querySelectorAll('[data-math-open-exercise]').forEach(b=>b.onclick=()=>options.exercise(b.dataset.mathOpenExercise));
}
function home(){
 selected=null;group=null;
 draw(header('Mes leçons de mathématiques','Choisis un chapitre, puis une sous-leçon. Les cours du professeur restent séparés des explications.')+
 back('Toutes les matières')+
 '<h3 class="spx-subheading">Qu’est-ce que tu veux apprendre ?</h3><div class="spx-grid">'+
 GROUPS.map((g,i)=>{
 const bs=bis.filter(x=>groupOfId(x.id)===g);
 return '<button type="button" class="spx-card" data-math-group="'+i+'"><span class="spx-icon">∑</span><strong>'+esc(g.name)+'</strong><p>'+bs.length+' sous-leçon(s) · '+entFor(g).length+' cours ENT</p><small>Ouvrir les sous-leçons</small></button>';
 }).join('')+'</div><p class="spx-note">Leçons ENT originales, leçons BIS, explications et exercices distincts. Chaque évaluation est validée une seule fois ; aucun XP.</p>', options.back);
 wire();
}
function category(g){
 group=g;selected=null;
 const bs=bis.filter(x=>groupOfId(x.id)===g);
 const rows=bs.map(x=>{
 const id=x.id,exists=grades.attempts.find(a=>a.lessonId===id);
 return '<article class="spx-lesson-item"><div class="spx-lesson-intro"><span class="spx-chip">∑</span><div class="spx-lesson-copy"><h4>'+esc(cleanTitle(x.title))+'</h4><p>'+esc(x.summary||'')+'</p><small>'+esc(exists?'Évaluation terminée · note consultable':'Évaluation disponible : une seule tentative')+'</small></div></div>'+sectionBtns(id)+'</article>';
 }).join('');
 draw(header(g.name,'Cours, méthodes et exercices de ce chapitre.')+back('Toutes les rubriques')+
 '<h3 class="spx-subheading">Choisis une sous-leçon</h3>'+rows+
 '<p class="spx-note">Les exercices ENT sont des documents du professeur. Les petites évaluations de compréhension sont créées à partir des leçons BIS : une tentative, correction immédiate et bilan Parent.</p>',home);
 wire();
}
function listPage(id,title,rows,kind){
 selected=id;group=groupOfId(id);
 draw(header(title,'Documents rattachés à ce chapitre dans le classeur existant.')+
 back('Retour aux sous-leçons')+
 '<div class="spx-panel"><p>Les fiches restent originales. Plusieurs séances ENT peuvent porter sur la même notion ; choisis celle que tu veux consulter.</p>'+
 (rows.length?rows.map(x=>'<button class="spx-row" type="button" data-math-open-'+kind+'="'+esc(x.id)+'"><span class="spx-chip">▤</span><span><strong>'+esc(x.title)+'</strong><small>'+esc(x.date||x.summary||'Document du professeur')+'</small></span></button>').join(''):'<p>Aucune fiche ENT associée à cette rubrique pour le moment.</p>')+
 '</div>'+sectionBtns(id),()=>category(group));
 wire();
}
function viewEnt(id){listPage(id,'Leçons ENT — '+groupOfId(id).name,entFor(groupOfId(id)),'original');}
function viewEntExercises(id){listPage(id,'Exercices ENT du chapitre — '+groupOfId(id).name,exFor(groupOfId(id)),'exercise');}
function blocks(lesson,mode){
 const content=(lesson?.blocks||[]).filter(b=>mode==='bis'||['Comprendre','Méthode étape par étape','Exemples corrigés','Erreur fréquente','Objectif'].includes(b.h));
 return content.map(b=>{
  if(b.kind==='svg'&&typeof b.svg==='string'){
   // Dessins vectoriels de la leçon BIS archivée : pas de script ni d'évènement exécutable.
   const svg=b.svg.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi,'');
   return '<section class="spx-panel"><h3>'+esc(b.h||'Schéma')+'</h3><div class="math-diagram">'+svg+'</div></section>';
  }
  if(b.kind==='bullets')return '<section class="spx-panel"><h3>'+esc(b.h||'Méthode')+'</h3><ol>'+((b.items||[]).map(x=>'<li>'+esc(x)+'</li>').join(''))+'</ol></section>';
  if(b.kind==='note')return '<section class="spx-panel"><h3>'+esc(b.h||'Explication')+'</h3><p>'+esc(b.body||'').replace(/\n/g,'</p><p>')+'</p></section>';
  return '';
 }).join('');
}
function viewProgramsOriginal(){
 const id='MBIS13',g=groupOfId(id);
 const progA=['Choisir un nombre.','Soustraire 2.','Multiplier par 5.','Ajouter le triple du nombre de départ.'];
 const progB=['Choisir un nombre.','Multiplier par 4.','Soustraire 5.','Multiplier le résultat par 2.'];
 const qs=[
  'Vérifie qu’en prenant 1 comme nombre de départ, on obtient −2 avec le programme A.',
  'On appelle x le nombre de départ. Donne l’expression littérale associée au programme A, puis développe et réduis cette expression.',
  'Quel nombre de départ faut-il choisir pour obtenir 0 avec le programme A ?',
  'Quel résultat obtient-on avec le programme B si on choisit 1 comme nombre de départ ?',
  'Montre que les programmes A et B donnent toujours le même résultat.'
 ];
 const block=(label,steps)=>'<section class="spx-panel"><h3>'+label+'</h3><ol>'+steps.map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol></section>';
 draw(header('Fiche ENT · Deux programmes de calcul','Devoir du 8 octobre 2026 · Énoncé complet du professeur, sans réponses.')+
  back('Retour au chapitre Calcul littéral')+
  '<section class="spx-panel"><h3>Lis l’énoncé avant les questions</h3><p>Cette fiche reproduit l’exercice 3 demandé par Mme Pialet. Les cinq questions se rapportent aux programmes présentés ci-dessous. Il s’agit du travail ENT, pas de la mini-évaluation BIS de deux questions.</p></section>'+
  block('Programme A',progA)+block('Programme B',progB)+
  '<section class="spx-panel"><h3>Les cinq questions du professeur</h3><ol>'+qs.map(q=>'<li style="margin:14px 0">'+esc(q)+'</li>').join('')+'</ol><p>Pour répondre, utilise une feuille de brouillon. Les résultats ne sont pas enregistrés ni notés ici.</p></section>'+
  '<section class="spx-panel"><h3>Besoin de revoir la méthode ?</h3>'+btn('data-math-bis',id,'Lire la leçon BIS · Programmes de calcul')+'</section>',
  ()=>category(g));
 wire();
}
function viewBis(id){
 selected=id;group=groupOfId(id);const x=lesson(id);if(!x)return;
 draw(header('Leçon simplifiée : '+cleanTitle(x.title),'Niveau 2 · Explications, exemples et schémas.')+back('Retour aux sous-leçons')+
 blocks(x,'bis')+'<section class="spx-panel"><h3>Pour continuer</h3>'+sectionBtns(id)+'</section>',()=>category(group));
 wire();
}
function viewHelp(id){
 selected=id;group=groupOfId(id);const x=lesson(id);if(!x)return;
 const useful=(x.blocks||[]).filter(b=>['Comprendre','Méthode étape par étape','Exemples corrigés','Erreur fréquente'].includes(b.h));
 draw(header('Je n’ai pas compris : '+cleanTitle(x.title),'Niveau 3 · Revoir la notion autrement, sans question notée.')+back('Retour aux sous-leçons')+
 '<section class="spx-panel"><h3>Reprendre la méthode</h3><p>Relis chaque étape, puis regarde l’exemple corrigé et l’erreur à éviter.</p></section>'+
 useful.map(b=>b.kind==='bullets'?'<section class="spx-panel"><h3>'+esc(b.h)+'</h3><ol>'+b.items.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol></section>':
 '<section class="spx-panel"><h3>'+esc(b.h)+'</h3><p>'+esc(b.body||'')+'</p></section>').join('')+
 '<section class="spx-panel">'+sectionBtns(id)+'</section>',()=>category(group));
 wire();
}
async function refreshProgress(){
 if(!options.progress)return grades;
 try{
  const p=await options.progress();
  grades={status:'ok',attempts:Array.isArray(p.attempts)?p.attempts:[]};
 }catch(e){grades={status:'error',attempts:grades.attempts||[],message:e.message||'Erreur de lecture des notes'};}
 return grades;
}
function mark20(record){const n=Number(record?.total),score=Number(record?.score);return Number.isInteger(score)&&n>0?String(Math.round(20*score/n))+' / 20 ('+score+' / '+n+' bonnes réponses'+(n===2?' · ancien format':'')+')':'Note indisponible';}
function resultPage(record){
 if(!record)return;
 const id=record.lessonId, x=lesson(id);selected=id;group=groupOfId(id);
 const hasCorrection=Array.isArray(record.items)&&record.items.length===record.total&&record.items.every(a=>a&&typeof a.explanation==='string'&&a.explanation.trim());
 const failures=hasCorrection?record.items.filter(a=>!a.correct):[];
 draw(header('Résultat : '+cleanTitle(x?.title||id),'Exercice terminé définitivement. La note reste consultable dans le compte Parent.')+
 back('Retour aux sous-leçons')+
 '<section class="spx-panel"><h3>Ma note : '+esc(mark20(record))+'</h3><p>'+esc(record.submittedAt?'Résultat enregistré · 0 XP · une seule tentative':'Résultat validé · 0 XP · une seule tentative')+'</p>'+ 
 (!hasCorrection?'<p>Les explications détaillées sont momentanément indisponibles. Reviens consulter cette note ; tu ne dois pas refaire l’exercice.</p>':'')+
 (hasCorrection?(failures.length?'<p><strong>À revoir :</strong> '+failures.length+' question(s). Retourne à la leçon BIS de cette sous-leçon.</p>':'<p>Aucune erreur sur cet exercice.</p>'):'')+'</section>'+ 
 (hasCorrection?record.items:[]).map((a,i)=>'<section class="spx-panel math-correction '+(a.correct?'correct':'incorrect')+'"><h3>Question '+(i+1)+' : '+(a.correct?'Correct':'À revoir')+'</h3><p><strong>'+esc(a.prompt)+'</strong></p><p>Réponse de Tim : '+esc(a.response)+'</p>'+ 
 (!a.correct?'<p>Réponse attendue : <strong>'+esc(a.expected)+'</strong></p>':'')+
 '<p>'+esc(a.explanation)+'</p></section>').join('')+
 '<section class="spx-panel"><h3>Revoir la sous-leçon</h3>'+btn('data-math-bis',id,'2 · Leçon BIS')+btn('data-math-help',id,'3 · Je n’ai pas compris')+'</section>',()=>category(group));
 wire();
}
async function viewTraining(id){
 const x=lesson(id);if(!x)return;selected=id;group=groupOfId(id);
 const testId='MT'+suffix(id);
 const completed=grades.attempts.find(a=>a.id===testId);
 if(completed){resultPage(completed);return;}
 draw(header('Évaluation : '+cleanTitle(x.title),'Une seule tentative. Correction et note dès la validation ; aucun XP.')+
 back('Retour aux sous-leçons')+
 '<section class="spx-panel"><h3>Avant de commencer</h3><p>10 questions, 2 points par bonne réponse. Lis toute la consigne avant de choisir. Tu peux revoir la méthode sans utiliser ta tentative.</p>'+btn('data-math-bis',id,'Revoir la leçon BIS')+btn('data-math-help',id,'Je n’ai pas compris')+'</section>'+
 '<section class="spx-panel" id="math-quiz"><p>Chargement sécurisé de l’exercice…</p></section>',()=>category(group));
 wire();
 if(window.__TIM_GUEST){const p=root.querySelector('#math-quiz');p.innerHTML='<p>Le questionnaire est réservé aux comptes Tim et Parent. La visite en invité reste en lecture seule.</p>';return;}
 const holder=root.querySelector('#math-quiz');
 try{
  const data=await options.task(testId);
  if(!holder?.isConnected)return;
  if(data.completed&&!window.__TIM_PARENT){await refreshProgress();const done=grades.attempts.find(a=>a.id===testId);if(done)resultPage(done);else holder.textContent='Exercice déjà validé : la note est en cours de récupération.';return;}
  const task=data.task;
  if(!task||task.lessonId!==id||!Array.isArray(task.questions)||task.questions.length!==10)throw Error('Exercice incomplet : dix questions sont nécessaires.');
  // Une seule tentative : vérifier que chaque question contient des choix valides.
  const context=['statement','context','instructions','enonce'].map(k=>task[k]).find(v=>typeof v==='string'&&v.trim())||'';
  const normalizeChoice=v=>String(v).normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
  const validQuestions=task.questions.every(q=>typeof q.prompt==='string'&&q.prompt.trim().length>=10&&Array.isArray(q.choices)&&q.choices.length===4&&q.choices.every(v=>typeof v==='string'&&v.trim())&&new Set(q.choices.map(normalizeChoice)).size===4);
  if(!validQuestions)throw Error('Énoncé ou choix de réponses incomplets. Aucune tentative n’a été utilisée.');
  const dependsOnMissingData=/(programme\s+[AB]|ce programme|la figure|le graphique|le tableau|le schéma|le document|ci-dessus|ci-contre)/i;
  const embeddedData=/(choisir|choisis|soustraire|soustrais|multiplier|multiplie|ajouter|ajoute|on considère|mesure|longueur|coordonnées|données)/i;
  if(!context&&task.questions.some(q=>dependsOnMissingData.test(q.prompt)&&!embeddedData.test(q.prompt)))
   throw Error('Une question renvoie à un programme ou à une figure dont l’énoncé manque. Exercice suspendu, aucune tentative utilisée.');
  if(window.__TIM_PARENT){holder.innerHTML='<h3>Aperçu Parent · 10 questions (lecture seule)</h3><p>Ces questions ne sont pas les réponses correctes. Aucune tentative n’est créée lors de cet aperçu.</p>'+task.questions.map((q,i)=>'<section class="spx-training-question"><h4>Question '+(i+1)+' / 10</h4><p>'+esc(q.prompt)+'</p><ul>'+q.choices.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul></section>').join('');return;}
  holder.innerHTML='<h3>10 questions de compréhension</h3>'+ 
   '<p><strong>Avant de répondre :</strong> lis les données et la consigne de chaque question. Ce questionnaire BIS de dix questions est distinct des exercices ENT du professeur.</p>'+
   (context?'<section class="spx-panel"><h3>Énoncé à consulter pour les dix questions</h3><p style="white-space:pre-wrap">'+esc(context)+'</p></section>':'')+
   '<p>Après la validation définitive, tu recevras la note et les explications. Tu ne pourras pas refaire cet exercice.</p>'+
   '<form id="math-quiz-form">'+task.questions.map((q,i)=>'<fieldset class="spx-training-question"><legend>Question '+(i+1)+' / '+task.questions.length+'</legend><p>'+esc(q.prompt)+'</p>'+
    q.choices.map((v,j)=>'<label class="math-choice"><input type="radio" name="mq'+i+'" value="'+j+'"> '+esc(v)+'</label>').join('')+'</fieldset>').join('')+
   '<div class="spx-quiz-navigation"><p id="math-quiz-progress" role="status" aria-live="polite"></p><button type="button" id="math-quiz-prev" class="spx-back">← Question précédente</button> <button type="button" id="math-quiz-next" class="spx-button">Question suivante →</button></div><button type="submit" id="math-quiz-submit" class="spx-button">Valider définitivement les 10 réponses</button><p id="math-quiz-status" role="status" aria-live="polite"></p></form>';
  const form=holder.querySelector('#math-quiz-form');
  const questions=[...form.querySelectorAll('fieldset.spx-training-question')];
  const prev=form.querySelector('#math-quiz-prev'),next=form.querySelector('#math-quiz-next'),submit=form.querySelector('#math-quiz-submit'),progress=form.querySelector('#math-quiz-progress');
  let step=0;
  const showStep=()=>{
   questions.forEach((q,i)=>q.hidden=i!==step);
   prev.hidden=step===0;next.hidden=step===questions.length-1;
   submit.hidden=step!==questions.length-1;
   const answered=questions.filter((q,i)=>form.querySelector('input[name="mq'+i+'"]:checked')).length;
   progress.textContent='Question '+(step+1)+' / '+questions.length+' · '+answered+' réponse(s) renseignée(s) sur '+questions.length;
  };
  prev.onclick=()=>{if(step>0){step--;showStep();}};
  next.onclick=()=>{if(step<questions.length-1){step++;showStep();}};
  form.addEventListener('change',showStep);
  showStep();
  form.onsubmit=async ev=>{
   ev.preventDefault();
   const answers=task.questions.map((q,i)=>{const checked=form.querySelector('input[name="mq'+i+'"]:checked');return checked?Number(checked.value):null;});
   const status=holder.querySelector('#math-quiz-status');
   if(answers.some(a=>a===null)){step=answers.indexOf(null);showStep();status.textContent='Il reste des questions sans réponse. Complète la question '+(step+1)+' avant de valider.';return;}
   if(!window.confirm('Valider cet exercice une seule fois ? La note et la correction seront définitives.'))return;
   const buttons=holder.querySelectorAll('button,input');buttons.forEach(b=>b.disabled=true);
   status.textContent='Enregistrement de la note…';
   try{
    const record=await options.submit(testId,answers);
    if(!record?.submitted||record.id!==testId||record.xp!==0)throw Error('Confirmation serveur incomplète.');
    grades.attempts=[record,...grades.attempts.filter(a=>a.id!==testId)];
    resultPage(record);
   }catch(e){
    await refreshProgress();
    const done=grades.attempts.find(a=>a.id===testId);
    if(done){resultPage(done);return;}
    status.textContent='La validation n’est pas confirmée : '+(e.message||'connexion indisponible')+'. Les réponses sont conservées à l’écran.';
    buttons.forEach(b=>b.disabled=false);
   }
  };
 }catch(e){if(holder?.isConnected)holder.innerHTML='<p>Impossible de charger cette évaluation : '+esc(e.message||'service indisponible')+'. Les leçons restent consultables.</p>';}
}
function render(element,opts){
 root=element;options=opts||{};all=options.lessons||[];
 bis=all.filter(x=>/^MBIS(?:0[1-9]|1[0-9]|2[0-3])$/.test(x.id||''));
 ent=all.filter(x=>x.subject==='Mathématiques'&&!/^MBIS/.test(x.id||'')&&x.category!=='bis'&&x.category!=='bonus'&&x.kind!=='bonus');
 exercises=options.exercises||[];
 grades=window.__TIM_MATH_PROGRESS||{status:'loading',attempts:[]};
 home();
 if(options.progress)refreshProgress().then(()=>{if(root&&group&&!selected)category(group);});
}
function renderParentProgress(container){
 if(!window.__TIM_PARENT||!window.__TIM_BRIDGE?.mathTrainingProgress)return;
 const panel=document.createElement('section');panel.className='panel math-parent-progress';
 panel.innerHTML='<h3>Mathématiques — notes et bilans des sous-leçons</h3><div data-math-parent><p>Chargement des résultats…</p></div>';
 container.append(panel);
 const dest=panel.querySelector('[data-math-parent]');
 const renderRecords=()=>{
  const list=grades.attempts||[];
  if(grades.status!=='ok'){dest.textContent='Le suivi des mathématiques est indisponible : '+(grades.message||'réessaie après reconnexion')+'.';return;}
  const misses=list.flatMap(a=>(a.items||[]).filter(q=>!q.correct).map(q=>({id:a.lessonId,prompt:q.prompt,explanation:q.explanation})));
  dest.innerHTML='<p><strong>'+list.length+' / 23</strong> évaluations réalisées. Une validation par sous-leçon, 0 XP.</p>'+
   (misses.length?'<p><strong>À retravailler :</strong> '+misses.length+' erreur(s) dans les évaluations réalisées.</p>':'<p>Aucune difficulté relevée dans les évaluations terminées.</p>')+
   list.map(a=>{
    const course=(window.__TIM_DATA?.lessons||[]).find(l=>l.id===a.lessonId);
    const faults=(a.items||[]).filter(it=>!it.correct);
    return '<details class="spx-parent-result"><summary>'+esc(cleanTitle(course?.title||a.lessonId))+' — '+esc(mark20(a))+'</summary>'+ 
     (Array.isArray(a.items)&&a.items.length===a.total?(faults.length?'<p><strong>À revoir :</strong> '+esc(faults.map(v=>v.prompt).join(' ; '))+'</p><p>Leçon conseillée : '+esc(cleanTitle(course?.title||a.lessonId))+' (BIS et ENT du même chapitre).</p>':'<p>Toutes les réponses sont correctes.</p>'):'<p>Le détail de cette correction est momentanément indisponible.</p>')+
     (a.items||[]).map(it=>'<p>'+esc(it.prompt)+' — '+(it.correct?'correct':'incorrect')+'<br>Tim : '+esc(it.response)+' ; attendu : '+esc(it.expected)+'<br>'+esc(it.explanation)+'</p>').join('')+
    '</details>';
   }).join('')+
   '<button type="button" class="spx-button" data-math-refresh>Actualiser les notes</button>';
  const b=dest.querySelector('[data-math-refresh]');b.onclick=async()=>{b.disabled=true;await loadParent(true);};
 };
 let loadingParent=false,lastFingerprint='';
 const loadParent=async(force=false)=>{
  if(loadingParent)return;
  loadingParent=true;
  try{
   const response=await window.__TIM_BRIDGE.mathTrainingProgress();
   grades={status:'ok',attempts:response.attempts||[]};
  }catch(e){grades={status:'error',attempts:[],message:e.message};}
  const fingerprint=JSON.stringify(grades);
  if(force||fingerprint!==lastFingerprint){lastFingerprint=fingerprint;renderRecords();}
  loadingParent=false;
 };
 loadParent(true);
 // Espace Parent actualisé automatiquement, sans toucher à une tentative.
 const parentRefreshTimer=setInterval(()=>{
  if(!panel.isConnected){clearInterval(parentRefreshTimer);return;}
  if(!document.hidden)loadParent(false);
 },60000);
}
window.TIM_MATH_PATH={render,renderParentProgress};
})();