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

/* Compléments ENT vérifiés jusqu'au 12/11/2026 : lecture seule, sans notes ni XP. */
const TIM_ENT_NEW=[
 {id:'TIM_ENT_20261106',date:'2026-11-06',title:'6 novembre — Automatismes 5 et factorisation',chapter:'Calcul littéral',teacher:'Test 5 sur les automatismes Leçon : factoriser une expression littérale',work:'Finir de corriger son évaluation',source:'Séance ENT 10099~6402971 ; devoir ENT 10099~214457',note:'Ces informations figuraient dans l’export ENT du 10 novembre, après les premières captures prises pendant la séance.'},
 {id:'TIM_ENT_20261109',date:'2026-11-09',title:'9 novembre — Correction et factorisation',chapter:'Calcul littéral',teacher:'Correction du test 5 sur les automatismes Correction ex 35 p.77 Exercices sur la factorisation : n°36 et 37 p.77',work:'Faire exercice n°35 p.77',source:'Séance ENT 10099~6402906 ; devoir ENT 10099~214606',note:'Les énoncés et corrigés officiels de la page 77 ne sont pas disponibles.'},
 {id:'TIM_ENT_20261112',date:'2026-11-12',title:'12 novembre — La réciproque de Thalès',chapter:'Thalès',
  teacher:'Leçon : la réciproque de Thalès',
  work:'Pour vendredi 13 novembre : Finir l’exercice 25 p.253.',
  source:'Séance ENT 10099~6402938 ; contenu 10099~215177 ; devoir ENT 10099~215178',
  note:'Aucun PDF joint à cette séance. L’énoncé de l’exercice 25 p.253 n’est pas fourni dans l’export ENT ; seul le numéro est attesté.'}
];
function mathEntList(){
 const old=ent.filter(e=>!TIM_ENT_NEW.some(v=>String(e.id)===v.id || String(e.date||'').includes(v.date) || String(e.id)==='M26S'+v.date.slice(5,7)+v.date.slice(8,10)));
 return [...old,...TIM_ENT_NEW];
}
function viewTimEnt(id){
 const x=TIM_ENT_NEW.find(v=>v.id===id);if(!x)return;
 const isThales=x.id==='TIM_ENT_20261112';
 selected=id;group=isThales?GROUPS[3]:GROUPS[2];
 draw(header('Cours ENT · '+x.title,'Texte authentique du cahier de textes de Mme Pialet, séparé des explications BIS.')+
 back('Retour à tous les cours ENT')+
 '<article class="spx-panel math-reading-lesson">'+
 '<section class="math-reading-section"><h3>En classe — texte du professeur</h3><p>'+esc(x.teacher)+'</p></section>'+
 (isThales?'<section data-tim-thales-original-pdf class="math-reading-section"></section>':'')+
 '<section class="math-reading-section"><h3>Travail demandé — texte ENT</h3><p>'+esc(x.work)+'</p></section>'+
 '<section class="math-reading-section"><h3>Source et limites</h3><p>'+esc(x.source)+'. '+esc(x.note)+'</p></section></article>'+
 '<div class="math-reading-actions"><h3>'+(isThales?'Comprendre la réciproque de Thalès':'Comprendre la factorisation')+'</h3>'+
 (isThales?btn('data-math-reciproque','lesson','Lire la leçon BIS expliquée'):btn('data-math-factor','lesson','Lire la leçon simplifiée'))+
 '</div>',viewEntChronology);
 wire();
 if(isThales)mountTimThalesSource();
}
function mountTimThalesSource(){
 const host=root?.querySelector('[data-tim-thales-original-pdf]');
 if(host&&window.TIM_INLINE_ENT_DOCUMENTS?.mount){
  window.TIM_INLINE_ENT_DOCUMENTS.mount(host,['M26S1009'],{
   title:'Support du professeur du 9 octobre : théorème de Thalès (déjà archivé, non joint au cours du 12 novembre)',
   filenamePattern:/leçon.*théorème.*thalès\.pdf/i,limit:1,auto:true
  }).catch(()=>{host.textContent='Le PDF de Thalès du 9 octobre est momentanément indisponible.';});
 }
}
function viewTimReciproqueThales(){
 selected='TIM_RECIPROQUE_THALES_BIS';group=GROUPS[3];
 draw(header('Leçon BIS · La réciproque de Thalès','Explication pédagogique du cours du jeudi 12 novembre, distincte du texte officiel du professeur.')+
 back('Retour au chapitre Thalès')+
 '<article class="spx-panel math-reading-lesson">'+
 '<section class="math-reading-section"><h3>1 · Comprendre à quoi ça sert</h3><p>La réciproque de Thalès sert à <strong>prouver que deux droites sont parallèles</strong>, à partir de longueurs connues. Le théorème de Thalès fait l’inverse : si les droites sont parallèles, il permet d’écrire des rapports égaux.</p></section>'+ 
 '<section data-tim-thales-original-pdf class="math-reading-section"></section>'+
 '<section class="math-reading-section"><h3>2 · Regarder les alignements</h3><p>Dans le triangle ABC, les points A, D, B sont alignés dans cet ordre et les points A, E, C sont alignés dans cet ordre. On veut savoir si les droites (DE) et (BC) sont parallèles.</p>'+
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 270" role="img" aria-label="Triangle ABC avec D sur AB, E sur AC et le segment DE" style="display:block;max-width:420px;width:100%;height:auto;margin:12px auto;background:#f5f9fc;border-radius:9px"><path d="M200 25 L55 235 L345 235 Z" fill="none" stroke="#25415f" stroke-width="3"/><line x1="143" y1="108" x2="257" y2="108" stroke="#137a88" stroke-width="4"/><g fill="#25415f" font-size="17" font-weight="700" font-family="Arial, sans-serif"><text x="190" y="19">A</text><text x="35" y="255">B</text><text x="346" y="255">C</text><text x="119" y="101">D</text><text x="269" y="105">E</text></g></svg>'+
 '<p>Le dessin aide à se repérer, mais ce sont les calculs qui prouvent le parallélisme.</p></section>'+
 '<section class="math-reading-section"><h3>3 · Méthode en quatre étapes</h3><ol><li>Vérifier que A, D, B sont alignés et que A, E, C sont alignés <strong>dans le même ordre</strong>.</li><li>Calculer <strong>AD / AB</strong>.</li><li>Calculer <strong>AE / AC</strong>.</li><li>Si les deux rapports sont égaux, conclure : <strong>(DE) est parallèle à (BC)</strong> grâce à la réciproque du théorème de Thalès.</li></ol></section>'+
 '<section class="math-reading-section"><h3>4 · Exemple corrigé</h3><p>AD = 3 cm, AB = 5 cm, AE = 4,2 cm et AC = 7 cm.</p><ol><li>AD / AB = 3 / 5 = <strong>0,6</strong>.</li><li>AE / AC = 4,2 / 7 = <strong>0,6</strong>.</li><li>Les rapports sont égaux et les points sont alignés dans le même ordre. Donc <strong>(DE) // (BC)</strong>.</li></ol></section>'+
 '<section class="math-reading-section"><h3>5 · Je n’ai pas compris</h3><p>Imagine deux côtés d’un triangle. Tu compares la proportion parcourue sur chacun : 3 sur 5 d’un côté, 4,2 sur 7 de l’autre. Les deux représentent 60 % : la petite barre DE est alors parallèle à la base BC, si les points sont correctement alignés.</p><p><strong>Erreur à éviter :</strong> ne pas comparer AD / AC avec AE / AB. Les côtés doivent se correspondre. Ne pas conclure à partir du dessin seul.</p></section>'+
 '<section class="math-reading-section"><h3>6 · Et si les rapports sont différents ?</h3><p>Par exemple : 3 / 5 = 0,6 mais 5 / 7 ≈ 0,714. Les rapports ne sont pas égaux ; si les points sont bien alignés, <strong>(DE) n’est pas parallèle à (BC)</strong> (contraposée de Thalès).</p></section>'+
 '<section class="math-reading-section"><h3>Devoir donné pour vendredi 13 novembre</h3><p><strong>Finir l’exercice 25 p.253.</strong> L’énoncé du manuel n’est pas présent dans l’archive ENT ; il n’est pas reproduit ici.</p></section>'+
 '</article>'+
 '<section class="spx-panel math12-exercises"><h3>Mes 3 exercices BIS — 12 novembre</h3><p>10 questions chacun, une seule validation, note sur 10 et correction. Ces exercices d’entraînement ne remplacent pas le devoir 25 p.253 du manuel (énoncé absent de l’ENT).</p><div class="spx-quick-links">'+
 btn('data-math-nov12-ex','MTH12_01','Exercice 1 — Comprendre la méthode')+
 btn('data-math-nov12-ex','MTH12_02','Exercice 2 — Calculer les rapports')+
 btn('data-math-nov12-ex','MTH12_03','Exercice 3 — Rédiger et conclure')+
 '</div></section>'+
 '<div class="math-reading-actions">'+btn('data-math-open-original','TIM_ENT_20261112','Relire le texte exact du cours ENT du 12 novembre')+'</div>',()=>category(GROUPS[3]));
 wire();
 mountTimThalesSource();
}
function viewTimFactorisation(){
 selected='TIM_FACTORISATION_BIS';group=GROUPS[2];
 draw(header('Factoriser une expression littérale','Cours simplifié à partir des séances des 6 et 9 novembre · distinct du texte original ENT.')+
 back('Retour au chapitre Calcul littéral')+
 '<article class="spx-panel math-reading-lesson">'+
 '<section class="math-reading-section"><h3>Comprendre</h3><p>Factoriser, c’est transformer une somme ou une différence en produit, grâce à un facteur commun. C’est le contraire de développer.</p><p>Développer : 3(x + 4) = 3x + 12.<br>Factoriser : <strong>3x + 12 = 3(x + 4)</strong>.</p></section>'+
 '<section class="math-reading-section"><h3>La méthode</h3><ol><li>Dans 6x + 15, repère le facteur commun : 3.</li><li>Écris 6x = 3 × 2x et 15 = 3 × 5.</li><li>Place le facteur devant la parenthèse : <strong>6x + 15 = 3(2x + 5)</strong>.</li><li>Vérifie en développant : 3 × 2x + 3 × 5 = 6x + 15.</li></ol></section>'+
 '<section class="math-reading-section"><h3>Trois exemples corrigés</h3><p>5x² + 10x = <strong>5x(x + 2)</strong>.</p><p>8x − 12 = <strong>4(2x − 3)</strong>.</p><p>7(x + 2) + 3(x + 2) = <strong>10(x + 2)</strong>.</p></section>'+
 '<section class="math-reading-section"><h3>Attention aux signes</h3><p>4x − 8 = 4(x − 2), et non 4(x + 2). Développe pour vérifier.</p></section>'+
 '<section class="math-reading-section"><h3>Deux exemples supplémentaires corrigés</h3><p>Factorise 9x + 18 : <strong>9(x + 2)</strong>.</p><p>Factorise 12x − 8 : <strong>4(3x − 2)</strong>.</p><p>Ces exemples ne sont pas les exercices 35, 36 et 37 du manuel, dont les énoncés restent manquants.</p></section>'+
 '</article><details class="math-reading-docs"><summary>Cours originaux du professeur (ENT)</summary>'+
 TIM_ENT_NEW.map(x=>btn('data-math-open-original',x.id,x.title)).join('')+
 '</details><p class="small">Aucune nouvelle évaluation, note ou tentative créée.</p>',()=>category(GROUPS[2]));
 wire();
}

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
 if(TIM_ENT_NEW.some(x=>x.id===lesson.id))return GROUPS.find(g=>g.name===lesson.chapter)||GROUPS[2];
 const text=nrm([lesson.chapter,lesson.topic,lesson.title].join(' '));
 // Reconnaître la finalité de la séance avant les notions qu'elle révise.
 if(/automatism/.test(text))return GROUPS[5];
 if(/evaluation|controle|revisio|correction/.test(text))return GROUPS[6];
 if(/brevet/.test(text))return GROUPS[4];
 if(/thales/.test(text))return GROUPS[3];
 if(/pythagore/.test(text))return GROUPS[1];
 if(/litteral|developp|programme de calcul|expression|equation|factoris/.test(text))return GROUPS[2];
 if(/fraction|puissanc|relatif|calcul numerique|ecriture scientifique/.test(text))return GROUPS[0];
 return null;
}
function entFor(g){return mathEntList().filter(x=>groupOfEnt(x)===g);}
function exFor(g){const ids=new Set([...entFor(g),...ent.filter(x=>groupOfEnt(x)===g)].map(x=>x.id));return exercises.filter(x=>x.subject==='Mathématiques'&&ids.has(x.lesson)&&x.category!=='bonus');}
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
 (g===GROUPS[2]||g===GROUPS[3]?btn('data-math-ent-interactive',id,'Exercices ENT interactifs · note /10 et XP'):'')+
 btn('data-math-train',id,'Évaluation BIS · 10 questions · une seule fois · jusqu’à +1 XP')+
 '</div>';
}
function wire(){
 root.querySelectorAll('[data-math-group]').forEach(b=>b.onclick=()=>category(GROUPS[Number(b.dataset.mathGroup)]));
 root.querySelectorAll('[data-math-all-ent]').forEach(b=>b.onclick=()=>viewEntChronology());
 root.querySelectorAll('[data-math-ent]').forEach(b=>b.onclick=()=>viewEnt(b.dataset.mathEnt));
 root.querySelectorAll('[data-math-bis]').forEach(b=>b.onclick=()=>viewBis(b.dataset.mathBis));
 root.querySelectorAll('[data-math-help]').forEach(b=>b.onclick=()=>viewHelp(b.dataset.mathHelp));
 root.querySelectorAll('[data-math-method]').forEach(b=>b.onclick=()=>viewMathMethod(b.dataset.mathMethod));
 root.querySelectorAll('[data-math-ex]').forEach(b=>b.onclick=()=>viewEntExercises(b.dataset.mathEx));
 root.querySelectorAll('[data-math-ent-interactive]').forEach(b=>b.onclick=()=>viewEntExercises(b.dataset.mathEntInteractive));
 root.querySelectorAll('[data-math-programs]').forEach(b=>b.onclick=()=>viewProgramsOriginal());
 root.querySelectorAll('[data-math-train]').forEach(b=>b.onclick=()=>viewTraining(b.dataset.mathTrain));
 root.querySelectorAll('[data-math-open-original]').forEach(b=>b.onclick=()=>TIM_ENT_NEW.some(x=>x.id===b.dataset.mathOpenOriginal)?viewTimEnt(b.dataset.mathOpenOriginal):options.original(b.dataset.mathOpenOriginal));
 root.querySelectorAll('[data-math-factor]').forEach(b=>b.onclick=()=>viewTimFactorisation());
 root.querySelectorAll('[data-math-reciproque]').forEach(b=>b.onclick=()=>viewTimReciproqueThales());
 root.querySelectorAll('[data-math-nov12-ex]').forEach(b=>b.onclick=()=>viewTimMathNov12Exercise(b.dataset.mathNov12Ex));
 root.querySelectorAll('[data-math-open-exercise]').forEach(b=>b.onclick=()=>options.exercise(b.dataset.mathOpenExercise));
}
function home(){
 selected=null;group=null;
 draw(header('Mathématiques','Choisis ton chapitre, puis ta leçon.')+
 back('Toutes les matières')+
 '<section class="spx-panel math-latest-ent" style="margin:14px 0"><h3>Dernier cours ENT · Jeudi 12 novembre</h3><p><strong>La réciproque de Thalès</strong> · devoir pour vendredi 13 novembre : finir l’exercice 25 p.253.</p><div class="spx-quick-links">'+btn('data-math-open-original','TIM_ENT_20261112','Voir le cours ENT du jour')+btn('data-math-reciproque','lesson','Lire la leçon expliquée')+'</div></section>'+
 '<div class="math-chapter-list">'+GROUPS.map((g,i)=>{
  const lessons=bis.filter(x=>groupOfId(x.id)===g);
  if(!lessons.length)return '';
  return '<button type="button" class="math-chapter-entry" data-math-group="'+i+'"><strong>'+esc(g.name)+'</strong><span>'+(lessons.length+([GROUPS[2],GROUPS[3]].includes(g)?1:0))+' leçon'+(lessons.length>1?'s':'')+' à lire</span></button>';
 }).join('')+'</div>'+
 '<div id="math-ent-import-mount"></div>'+ 
 '<section class="math-ent-home" style="margin:15px 0;padding:13px;border:1px solid #bad0e7;border-radius:13px;background:#eff6ff;color:#233d5e"><div id="math-ent-home-directory"></div></section>'+
 '<details class="math-reading-docs"><summary>Voir les cours du professeur (ENT)</summary>'+
 btn('data-math-all-ent','all','Consulter les '+mathEntList().length+' cours originaux')+'</details>',options.back);
 wire();
 const importHost=root.querySelector('#math-ent-import-mount');
 if(importHost&&window.__TIM_PARENT&&!window.__TIM_GUEST){
  // Archive complète des 17 PDF, y compris les premières séances de septembre.
  if(window.TIM_MATH_PDF_BULK_IMPORT?.render)importHost.append(window.TIM_MATH_PDF_BULK_IMPORT.render());
  // Import historique des neuf documents dont les présentations ODP originales.
  if(window.TIM_MATH_ENT_PDF_IMPORT?.render)importHost.append(window.TIM_MATH_ENT_PDF_IMPORT.render());
 }
 const area=root.querySelector('#math-ent-home-directory');
 if(area&&window.TIM_MATH_ENT?.renderDirectory)window.TIM_MATH_ENT.renderDirectory(area);
 else if(area)area.textContent='Les exercices ENT interactifs ne sont pas encore disponibles.';
}
function viewEntChronology(){
 selected=null;group=null;
 const lessonDate=x=>{const m=String(x.id||'').match(/^M26S(\d{2})(\d{2})$/);return m?'2026-'+m[1]+'-'+m[2]:String(x.date||'');};
 const lessons=mathEntList().slice().sort((a,b)=>lessonDate(a).localeCompare(lessonDate(b),'fr'));
 draw(header('Cours ENT de mathématiques · Chronologie','Les cours originaux de Mme Pialet, sans ajout ni remplacement du contenu officiel.')+
 back('Retour aux chapitres')+
 '<section class="spx-panel"><h3>'+lessons.length+' séances ENT conservées</h3><p>Cours d’origine et mises à jour jusqu’au 12 novembre 2026. Aujourd’hui : réciproque de Thalès ; devoir du 13 novembre : exercice 25 p.253. Les énoncés du manuel ne figurent pas dans l’export.</p>'+
 (lessons.length?lessons.map((x,i)=>'<button class="spx-row" type="button" data-math-open-original="'+esc(x.id)+'"><span class="spx-chip">'+(i+1)+'</span><span><strong>'+esc(x.title)+'</strong><small>'+esc(x.date||x.summary||'Cours ENT')+'</small></span></button>').join(''):'<p>Aucun cours ENT retrouvé.</p>')+
 '</section>',home);
 wire();
}
function category(g){
 group=g;selected=null;
 const bs=bis.filter(x=>groupOfId(x.id)===g);
 const rows=bs.map(x=>{
  const done=grades.attempts.some(a=>a.lessonId===x.id);
  return '<button type="button" class="math-lesson-entry" data-math-bis="'+esc(x.id)+'">'+
   '<strong>'+esc(cleanTitle(x.title))+'</strong>'+
   (x.summary?'<span class="math-lesson-description">'+esc(x.summary)+'</span>':'')+
   '<span class="math-lesson-open">'+(done?'Lire la leçon · Évaluation déjà faite':'Lire la leçon')+' →</span></button>';
 }).join('');
 draw(header(g.name,'Choisis une leçon pour la lire.')+back('Tous les chapitres')+
 '<div class="math-lesson-list">'+rows+
 (g===GROUPS[2]?'<button type="button" class="math-lesson-entry" data-math-factor="lesson"><strong>Factoriser une expression littérale · 6 et 9 novembre</strong><span class="math-lesson-description">Méthode expliquée et exemples corrigés</span><span class="math-lesson-open">Lire la leçon →</span></button>':'')+
 (g===GROUPS[3]?'<button type="button" class="math-lesson-entry" data-math-reciproque="lesson"><strong>La réciproque de Thalès · 12 novembre</strong><span class="math-lesson-description">Leçon BIS, dessin, méthode, exemples corrigés et devoir du 13 novembre</span><span class="math-lesson-open">Lire la leçon →</span></button>':'')+
 '</div>',home);
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
function viewEnt(id){
 const g=groupOfId(id);
 listPage(id,'Leçons ENT — '+g.name,entFor(g),'original');
 if(window.TIM_INLINE_ENT_DOCUMENTS?.mount){
  const panel=document.createElement('section');panel.className='math-inline-ent-list';
  panel.style.cssText='padding:12px;margin:12px 0;border-radius:12px;border:1px solid #c1d2e5;background:#eef5fd;color:#25415e';
  const host=root.querySelector('.spx.math-path');
  if(host)host.insertBefore(panel,host.children[2]||null);
  window.TIM_INLINE_ENT_DOCUMENTS.mount(panel,entFor(g).map(e=>e.id),{
   title:'PDF et schémas originaux — visibles sur cette page',limit:15
  }).catch(e=>{panel.textContent='Document privé indisponible : '+String(e.message||e);});
 }
}
function viewEntExercises(id){
 const g=groupOfId(id);
 listPage(id,'Exercices ENT du chapitre — '+g.name,exFor(g),'exercise');
 const ids=g===GROUPS[2]?['ME_ENT_PROGRAMMES']:g===GROUPS[3]?['ME_ENT_THALES3']:[];
 if(ids.length&&window.TIM_MATH_ENT?.renderDirectory){
  const panel=document.createElement('section');
  panel.className='math-ent-embedded';
  panel.style.cssText='background:#edf5fd;border:1px solid #bad0e7;border-radius:13px;padding:13px;margin:15px 0';
  root.querySelector('.spx.math-path')?.insertBefore(panel,root.querySelector('.spx.math-path')?.children[2]||null);
  window.TIM_MATH_ENT.renderDirectory(panel,{showUnavailable:false,onlyIds:ids});
 }
}
function blocks(lesson,mode){
 const content=(lesson?.blocks||[]).filter(b=>!/^Question d[’']entraînement\s*[12]$/iu.test(b.h||'')&&(mode==='bis'||['Comprendre','Méthode étape par étape','Exemples corrigés','Erreur fréquente','Objectif'].includes(b.h)));
 return content.map(b=>{
  if(b.kind==='svg'&&typeof b.svg==='string'){
   const svg=b.svg.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi,'');
   return '<section class="math-reading-section"><h3>'+esc(b.h||'Schéma')+'</h3><div class="math-diagram">'+svg+'</div></section>';
  }
  if(b.kind==='bullets')return '<section class="math-reading-section"><h3>'+esc(b.h||'Méthode')+'</h3><ol>'+((b.items||[]).map(x=>'<li>'+esc(x)+'</li>').join(''))+'</ol></section>';
  if(b.kind==='note')return '<section class="math-reading-section"><h3>'+esc(b.h||'Explication')+'</h3><p>'+esc(b.body||'').replace(/\n/g,'</p><p>')+'</p></section>';
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
  '<section class="spx-panel"><h3>Lis l’énoncé avant les questions</h3><p>Cette fiche reproduit l’exercice 3 demandé par Mme Pialet. Les cinq questions se rapportent aux programmes présentés ci-dessous. Il s’agit du travail ENT, pas de l’évaluation BIS de dix questions.</p></section>'+
  block('Programme A',progA)+block('Programme B',progB)+
  '<section class="spx-panel"><h3>Les cinq questions du professeur</h3><ol>'+qs.map(q=>'<li style="margin:14px 0">'+esc(q)+'</li>').join('')+'</ol><p>Pour répondre, utilise une feuille de brouillon. Les résultats ne sont pas enregistrés ni notés ici.</p></section>'+
  '<section class="spx-panel"><h3>Exercice complémentaire noté · 10 questions</h3><p>Les cinq questions du professeur restent inchangées et ne sont pas notées ici. Pour un contrôle interactif de dix questions sur la même notion, fais l’évaluation BIS : correction immédiate après validation.</p>'+btn('data-math-train',id,'Faire les 10 questions notées')+'</section>'+ '<section class="spx-panel"><h3>Besoin de revoir la méthode ?</h3>'+btn('data-math-bis',id,'Lire la leçon BIS · Programmes de calcul')+'</section>',
  ()=>category(g));
 wire();
}
function viewMathMethod(id){
 viewBis(id);
 const method=[...(root?.querySelectorAll('.math-reading-section h3')||[])].find(h=>h.textContent==='Méthode étape par étape');
 (method||root?.querySelector('.math-reading-lesson'))?.scrollIntoView?.({block:'start',behavior:'auto'});
}
function viewBis(id){
 selected=id;group=groupOfId(id);const x=lesson(id);if(!x)return;
 const g=group,hasEnt=entFor(g).length>0,hasEntEx=exFor(g).length>0;
 draw(header(cleanTitle(x.title),'Parcours conseillé : document ENT, méthode simplifiée, exemple, exercice puis correction expliquée.')+
 back('Retour à toutes les leçons')+
 '<article class="spx-panel math-reading-lesson">'+blocks(x,'bis')+'</article>'+
 '<div class="math-reading-actions"><h3>Étape 3 · Je m’exerce après avoir compris la leçon</h3>'+
 btn('data-math-help',id,'Je n’ai pas compris')+
 btn('data-math-train',id,'Faire les 10 questions')+
 '</div>'+
 (hasEnt||hasEntEx||id==='MBIS13'?'<details class="math-reading-docs"><summary>Documents et exercices du professeur (ENT)</summary>'+
 (hasEnt?btn('data-math-ent',id,'Voir les cours du professeur'):'')+
 (hasEntEx?btn('data-math-ex',id,'Voir les exercices du professeur'):'')+
 (id==='MBIS13'?btn('data-math-programs',id,'Fiche originale : programmes A et B'):'')+
 '</details>':''),
 home);
 wire();
 // Les PDF originaux disponibles restent sur cette page, avant la leçon BIS.
 // L'archive privée est interrogée seulement à l'ouverture du volet.
 const article=root.querySelector('.math-reading-lesson');
 if(article){
  const guide=document.createElement('p');
  guide.className='math-bis-study-step';
  guide.textContent='Étape 2 · Je comprends la règle, je suis la méthode et je lis les exemples corrigés.';
  guide.style.cssText='font-weight:800;color:#294a75;line-height:1.55;margin:5px 0 15px';
  article.prepend(guide);
 }
 if(article&&window.TIM_INLINE_ENT_DOCUMENTS?.mount){
  const ids=entFor(g).map(e=>String(e.id||'')).filter(Boolean);
  if(ids.length){
   const details=document.createElement('details');details.className='math-inline-ent-sources';
   details.style.cssText='padding:12px;margin:16px 0;border:1px solid #bdd0e2;border-radius:12px;background:#edf5fd;color:#223c59';
   const summary=document.createElement('summary');
   summary.textContent='Étape 1 · Consulter ici les documents ENT du chapitre (PDF et schémas)';
   summary.style.cssText='cursor:pointer;font-weight:800;line-height:1.5;min-height:40px';
   const slot=document.createElement('div');details.append(summary,slot);
   let mounted=false;
   details.addEventListener('toggle',()=>{
    if(!details.open||mounted)return;
    mounted=true;
    window.TIM_INLINE_ENT_DOCUMENTS.mount(slot,ids,{
     title:'Documents originaux du chapitre '+g.name,limit:10
    }).catch(err=>{slot.textContent='Lecture des PDF indisponible : '+String(err.message||err);});
   });
   article.prepend(details);
  }
 }
}

/* Aides courtes et différentes de la leçon, écrites pour chaque notion. */
const MATH_RESCUE={
 MBIS01:['Imagine un thermomètre : partir de −3 et monter de 7 degrés amène à +4. Le signe fait partie du nombre.','−3 + 7 = 4, car 7 est plus grand que 3.'],
 MBIS02:['Deux fractions ne peuvent s’additionner que si leurs parts ont la même taille. Transforme-les d’abord au même dénominateur.','1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2.'],
 MBIS03:['Une puissance est une multiplication répétée. Le petit chiffre ne veut pas dire « multiplier par ce chiffre ».','3⁴ = 3 × 3 × 3 × 3 = 81, et non 12.'],
 MBIS04:['En écriture scientifique, le premier nombre est toujours entre 1 et 10. Puis une puissance de dix indique la taille du nombre.','4 520 = 4,52 × 10³ ; on a déplacé la virgule de trois rangs.'],
 MBIS05:['Cherche d’abord l’angle droit indiqué dans l’énoncé ; sur une figure, un petit carré peut le signaler. Le côté opposé est l’hypoténuse.','Si ABC est rectangle en A, le côté BC est l’hypoténuse.'],
 MBIS06:['Pour trouver la diagonale (hypoténuse), additionne les carrés. Pour trouver un autre côté, soustrais les carrés.','13² − 5² = 169 − 25 = 144 ; la longueur cherchée vaut 12.'],
 MBIS07:['Tu connais déjà les trois côtés : tu vérifies si les deux petits carrés additionnés donnent le carré du plus long.','Avec 3, 4 et 5 : 3² + 4² = 9 + 16 = 25 = 5² ; le triangle est rectangle.'],
 MBIS08:['Même vérification, autre résultat : si les carrés ne sont pas égaux, le triangle n’est pas rectangle.','4² + 5² = 41, mais 6² = 36. Ce triangle n’est pas rectangle.'],
 MBIS09:['Dans un problème concret, commence par dessiner le triangle et écrire les longueurs. Cherche l’angle droit avant la formule.','Dans un rectangle de 3 m sur 4 m, la diagonale vaut √(3² + 4²) = 5 m.'],
 MBIS10:['La lettre x est simplement une place réservée à un nombre. Remplace-la par la valeur donnée pour comprendre le calcul.','Si x = 4, alors 3x + 2 = 3 × 4 + 2 = 14.'],
 MBIS11:['Le nombre devant la parenthèse multiplie TOUS les termes à l’intérieur, même le deuxième.','3(x + 2) = 3 × x + 3 × 2 = 3x + 6.'],
 MBIS12:['Avec deux parenthèses, compte quatre multiplications : chacun des deux termes de gauche avec chacun des deux termes de droite.','(x + 2)(x + 5) = x² + 5x + 2x + 10 = x² + 7x + 10.'],
 MBIS13:['Écris le nombre de départ avec x. À chaque nouvelle consigne, transforme le résultat précédent, pas toujours x tout seul.','Choisir x, ajouter 3, puis multiplier par 7 donne 7(x + 3).'],
 MBIS14:['Thalès parle de triangles construits avec des droites parallèles. Vérifie les parallèles avant d’écrire les fractions.','Si MN est parallèle à BC, alors AM/AB = AN/AC = MN/BC.'],
 MBIS15:['Une fois les bonnes fractions écrites, cherche le nombre manquant par produit en croix.','3/9 = 4/x donne 3x = 36, donc x = 12.'],
 MBIS16:['Garde toujours la même direction : petit côté sur grand côté pour toutes les fractions, ou l’inverse pour toutes.','AM/AB = AN/AC = MN/BC : ne retourne pas seulement la fraction du milieu.'],
 MBIS17:['Une figure avec des parallèles appelle Thalès. Une série de consignes « choisir un nombre » appelle le calcul littéral. Ce sont deux questions différentes.','Choisir x, soustraire 9, multiplier par 2, ajouter 3x donne 2(x − 9) + 3x.'],
 MBIS18:['Un problème long n’est pas un seul gros calcul : résous chaque petite question et réutilise la longueur trouvée pour la suivante.','Si CE = 30 m et ED = 10 m, alors CD = 40 m avant de calculer une diagonale.'],
 MBIS19:['Avant de calculer, identifie la famille : nombres négatifs, fraction ou puissance. Applique ensuite sa règle propre.','(−2)² + 1/2 = 4 + 0,5 = 4,5.'],
 MBIS20:['« Réduire » signifie regrouper ce qui se ressemble ; « développer » signifie multiplier dans les parenthèses.','3x + 4x = 7x, mais 2(x + 3) = 2x + 6.'],
 MBIS21:['Pose une seule question avant de choisir : vois-tu un angle droit ou des droites parallèles ?','Angle droit → Pythagore. Droites parallèles avec côtés correspondants → Thalès.'],
 MBIS22:['Ne révise pas cinq méthodes en même temps. Commence par un exercice de fractions, puis un de lettres, puis un de géométrie.','(x − 4)(x − 3) : fais les quatre produits, puis regroupe pour obtenir x² − 7x + 12.'],
 MBIS23:['Une correction sert à trouver la PREMIÈRE ligne où ton calcul est devenu faux, pas seulement à recopier le résultat.','Si MN² = 20,25 m², alors MN = √20,25 = 4,5 m. Vérifie le sujet A ou B.']
};
function viewHelp(id){
 selected=id;group=groupOfId(id);const x=lesson(id);if(!x)return;
 const help=MATH_RESCUE[id];
 const notion=x.blocks.find(b=>b.h==='Comprendre');
 const tip=x.blocks.find(b=>b.h==='Erreur fréquente');
 draw(header('Je n’ai pas compris : '+cleanTitle(x.title),'On reprend une seule idée, sans exercice noté.')+
  back('Retour à la leçon')+
  '<article class="spx-panel math-help-page">'+
  '<h3>Une autre façon de comprendre</h3><p>'+esc(help?.[0]||notion?.body||'Relis la règle puis l’exemple.')+'</p>'+
  '<h3>Un exemple expliqué</h3><p class="math-help-example">'+esc(help?.[1]||'Regarde l’exemple corrigé du cours.')+'</p>'+
  '<details><summary>L’erreur à éviter</summary><p>'+esc(tip?.body||'Vérifie les signes et les étapes du calcul.')+'</p></details>'+
  '</article>'+
  '<div class="math-reading-actions">'+btn('data-math-bis',id,'Revenir à la leçon complète')+'</div>',
  ()=>viewBis(id));
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
 const perfect=hasCorrection&&Number(record.score)===Number(record.total)&&Number(record.total)>0&&failures.length===0;
 draw(header('Résultat : '+cleanTitle(x?.title||id),'Exercice terminé définitivement. La note reste consultable dans le compte Parent.')+
 back('Retour aux sous-leçons')+
 '<section class="spx-panel"><h3>Ma note : '+esc(mark20(record))+'</h3><p>'+esc((record.submittedAt?'Résultat enregistré':'Résultat validé')+' · '+Number(record.xp||0)+' XP · une seule tentative')+'</p>'+ 
 (!hasCorrection?'<p>Les explications détaillées sont momentanément indisponibles. Reviens consulter cette note ; tu ne dois pas refaire l’exercice.</p>':'')+
 (hasCorrection?(failures.length?'<p><strong>À revoir :</strong> '+failures.length+' question(s). Retourne à la leçon BIS de cette sous-leçon.</p>':'<p>Toutes les réponses sont correctes. Aucune correction nécessaire.</p>'):'')+'</section>'+ 
 (hasCorrection?'<details class="spx-panel math-exercise-review"><summary>Revoir mon exercice — questions et réponses</summary>'+
  record.items.map((a,i)=>'<p><strong>Question '+(i+1)+' : '+esc(a.prompt)+'</strong></p><p>Ma réponse : '+esc(a.response)+'</p>').join('')+'</details>':'')+
 (hasCorrection&&!perfect?record.items.map((a,i)=>({a,i})).filter(x=>!x.a.correct):[]).map(({a,i})=>'<section class="spx-panel math-correction incorrect"><h3>Question '+(i+1)+' : À revoir</h3><p><strong>'+esc(a.prompt)+'</strong></p><p>Réponse de Tim : '+esc(a.response)+'</p>'+ 
 (!a.correct?'<p>Réponse attendue : <strong>'+esc(a.expected)+'</strong></p>':'')+
 '<p>'+esc(a.explanation)+'</p>'+(a.entReference?.title?'<p>Document ENT à revoir : '+esc(a.entReference.title)+' · page(s) '+esc((a.entReference.pages||[]).join(', '))+'</p>':'')+'</section>').join('')+
 '<section class="spx-panel"><h3>Revoir la sous-leçon</h3>'+btn('data-math-method',id,'Revoir la méthode étape par étape')+btn('data-math-bis',id,'Lire la leçon BIS complète')+btn('data-math-help',id,'Je n’ai pas compris')+'</section>',()=>category(group));
 wire();
}
/* Pour les programmes de calcul, présenter l'énoncé en étapes plutôt qu'en une phrase de 160 caractères. */
function readableMathPrompt(value){
 const prompt=String(value||'');
 const m=/^Programme de calcul : (.+?)\. (Quelle .+)$/u.exec(prompt);
 if(!m){
  const part=/^(.+?\.) ((?:Pour appliquer |L'égalité ).+)$/u.exec(prompt);
  return part
   ?'<p class="math-quiz-context">'+esc(part[1])+'</p><p class="math-quiz-question-text">'+esc(part[2])+'</p>'
   :'<p class="math-quiz-question-text">'+esc(prompt)+'</p>';
 }
 const steps=m[1].split(/,\s*(?:puis\s+)?/);
 if(steps.length<3)return '<p class="math-quiz-question-text">'+esc(prompt)+'</p>';
 return '<div class="math-quiz-program"><strong>Programme de calcul</strong><ol>'+
  steps.map(step=>'<li>'+esc(step.replace(/^puis\s+/i,''))+'</li>').join('')+
  '</ol></div><p class="math-quiz-question-text">'+esc(m[2])+'</p>';
}
async function viewTraining(id){
 const x=lesson(id);if(!x)return;selected=id;group=groupOfId(id);
 const testId='MT'+suffix(id);
 const completed=grades.attempts.find(a=>a.id===testId);
 if(completed){resultPage(completed);return;}
 draw(header('Exercice : '+cleanTitle(x.title),'10 questions. Une seule réponse à choisir chaque fois.')+
 back('Retour aux leçons')+
 '<p class="math-quiz-brief">Lis la question, choisis ta réponse et avance. La note et les explications arrivent à la fin.</p>'+
 '<section class="spx-panel" id="math-quiz"><p>Chargement de l’exercice…</p></section>',()=>category(group));
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
  if(window.__TIM_PARENT){holder.innerHTML='<h3>Aperçu Parent · 10 questions (lecture seule)</h3><p>Ces questions ne sont pas les réponses correctes. Aucune tentative n’est créée lors de cet aperçu.</p>'+task.questions.map((q,i)=>'<section class="spx-training-question"><h4>Question '+(i+1)+' / 10</h4>'+readableMathPrompt(q.prompt)+'<ul>'+q.choices.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul></section>').join('');return;}
  holder.innerHTML='<h3>À toi de jouer</h3>'+
   (context?'<section class="spx-panel"><h3>Énoncé à consulter pour les dix questions</h3><p style="white-space:pre-wrap">'+esc(context)+'</p></section>':'')+
   '<p class="math-one-try">Une seule validation. Tu peux changer tes réponses jusqu’à l’envoi.</p>'+
   '<form id="math-quiz-form">'+task.questions.map((q,i)=>'<fieldset class="spx-training-question"><legend>Question '+(i+1)+' / '+task.questions.length+'</legend>'+readableMathPrompt(q.prompt)+
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
    if(!task.bankVersion)throw Error('Version du questionnaire manquante : recharge la page avant de valider.');
    const record=await options.submit(testId,answers,task.bankVersion);
    if(!record?.submitted||record.id!==testId||record.bankVersion!==task.bankVersion||!Number.isFinite(record.xp))throw Error('Confirmation serveur incomplète.');
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
 // Lien direct vers la sous-leçon demandée depuis une correction, sans tout faire défiler.
 if(options.openLessonId&&lesson(options.openLessonId))viewBis(options.openLessonId);
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
  dest.innerHTML='<p><strong>'+list.length+' / 23</strong> évaluations réalisées. Une validation par sous-leçon ; XP affichés sur chaque copie.</p>'+
   (misses.length?'<p><strong>À retravailler :</strong> '+misses.length+' erreur(s) dans les évaluations réalisées.</p>':'<p>Aucune difficulté relevée dans les évaluations terminées.</p>')+
   list.map(a=>{
    const course=(window.__TIM_DATA?.lessons||[]).find(l=>l.id===a.lessonId);
    const faults=(a.items||[]).filter(it=>!it.correct);
    return '<details class="spx-parent-result"><summary>'+esc(cleanTitle(course?.title||a.lessonId))+' — '+esc(mark20(a))+' · '+esc(Number(a.xp||0))+' XP</summary>'+ 
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