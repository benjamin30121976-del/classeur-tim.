/* Physique-chimie : reprise stricte du parcours de lecture Mathématiques.
   Navigation : chapitre → leçon complète → aide / documents ENT.
   Lecture seule. Aucun exercice noté, résultat, tentative ou XP modifié. */
(function(){
'use strict';
const GROUPS=[
 {title:'Atomes et noyau',bis:['PC_BIS01'],ent:['PCENT6390167']},
 {title:'Ions et tests',bis:['PC_BIS02','PC_BIS05'],ent:['PCENT6390184','PCENT6390185']},
 {title:'Molécules et formules',bis:['PC_BIS03'],ent:['PCENT6390201']},
 {title:'Graphiques et mesures',bis:['PC_BIS04'],ent:['PCENT6390186']},
 {title:'Réactions chimiques',bis:['PC_BIS06','PC_BIS07'],ent:['PCENT6390203','PCENT6390170']}
];
/* Consignes classées selon la date POUR laquelle elles étaient demandées,
   et non la date d'affichage dans les séances ENT. Aucun énoncé inventé. */
const HOMEWORK=[
 {date:'2026-09-22',id:'10099~209896',topic:'Atomes et noyau',text:'Si tu as eu C ou D : exercice 2 p.164 avec Z, A et N ; exercices 7 et 8 p.165. Si tu as eu A ou B : exercices 6, 7 et 11 p.165.'},
 {date:'2026-09-24',id:'10099~210574',topic:'Ions et tests',text:'Faire l’activité « Un peu de gymnastique ». Donner un exemple d’ion positif et un exemple d’ion négatif.'},
 {date:'2026-09-29',id:'10099~211249',topic:'Révisions et évaluations',text:'Réviser pour le contrôle n°1 et apporter sa calculatrice.'},
 {date:'2026-10-06',id:'10099~212086',topic:'Molécules et formules',text:'Recopier et compléter le tableau en pièce jointe. Exercice 25 p.119 ; exercice 24 p.119 facultatif.'},
 {date:'2026-10-13',id:'10099~212950',topic:'Ions et tests',text:'Activité p.122.'},
 {date:'2026-11-03',id:'10099~213200',topic:'Graphiques et mesures',text:'Exercices 2, 3 et 5 p.128. Recopier le tableau et le compléter.'},
 {date:'2026-11-05',id:'10099~214109',topic:'Molécules et formules',text:'Exercice 7 p.128. Recopier et compléter le tableau en pièce jointe.'},
 {date:'2026-11-12',id:'10099~215024',topic:'Réactions chimiques',text:'Devoir référencé dans l’ENT, mais aucune consigne écrite n’a été récupérée.'}
];
let root=null,opts={},bis=[],ent=[],groupIndex=null,selected=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>{const [y,m,d]=String(s||'').split('-');return y&&m&&d?d+'/'+m+'/'+y:String(s||'');};
const byId=id=>bis.find(x=>x.id===id)||ent.find(x=>x.id===id);
const gById=id=>GROUPS.findIndex(g=>g.bis.includes(id)||g.ent.includes(id));
function header(title,sub){return '<header class="spx-hero"><span class="spx-kicker">PHYSIQUE-CHIMIE · CLASSEUR DE TIM</span><h2>'+esc(title)+'</h2><p>'+esc(sub)+'</p></header>';}
function back(label){return '<button type="button" class="spx-back" data-pc-back>← '+esc(label)+'</button>';}
function btn(attr,value,label){return '<button type="button" class="spx-quick-link" '+attr+'="'+esc(value)+'">'+esc(label)+'</button>';}
function draw(html,goBack){
 if(!root)return;
 root.innerHTML='<div class="spx math-path">'+html+'</div>';
 const b=root.querySelector('[data-pc-back]');if(b)b.onclick=goBack;
 root.querySelectorAll('[data-pc-group]').forEach(x=>x.onclick=()=>chapter(Number(x.dataset.pcGroup)));
 root.querySelectorAll('[data-pc-bis]').forEach(x=>x.onclick=()=>lesson(x.dataset.pcBis));
 root.querySelectorAll('[data-pc-help]').forEach(x=>x.onclick=()=>help(x.dataset.pcHelp));
 root.querySelectorAll('[data-pc-ent]').forEach(x=>x.onclick=()=>entLesson(x.dataset.pcEnt));
 root.querySelectorAll('[data-pc-all-ent]').forEach(x=>x.onclick=()=>entChronology());
 root.querySelectorAll('[data-pc-homework]').forEach(x=>x.onclick=()=>homework(x.dataset.pcHomework));
 root.querySelectorAll('[data-pc-work]').forEach(x=>x.onclick=()=>homework(x.dataset.pcWork));
 try{root.scrollIntoView({block:'start'});}catch(e){}
}
function home(){
 groupIndex=null;selected=null;
 draw(header('Physique-chimie','Choisis ton chapitre, puis ta leçon. Comme en mathématiques.')+
 back('Toutes les matières')+
 '<div class="math-chapter-list">'+GROUPS.map((g,i)=>
  '<button type="button" class="math-chapter-entry" data-pc-group="'+i+'"><strong>'+esc(g.title)+'</strong><span>'+g.bis.length+' leçon'+(g.bis.length>1?'s':'')+' à lire</span></button>'
 ).join('')+'</div>'+
 '<details class="math-reading-docs"><summary>Voir les cours et devoirs du professeur (ENT)</summary>'+
 btn('data-pc-all-ent','all','Cours ENT classés par date')+
 btn('data-pc-homework','all','Devoirs de l’ENT par date')+
 '</details>',opts.back);
}
function chapter(i){
 const g=GROUPS[i];if(!g){home();return;}
 groupIndex=i;selected=null;
 draw(header(g.title,'Choisis une leçon pour la lire entièrement.')+back('Tous les chapitres')+
 '<div class="math-lesson-list">'+g.bis.map(id=>{
  const l=byId(id);if(!l)return '';
  return '<button type="button" class="math-lesson-entry" data-pc-bis="'+esc(id)+'"><strong>'+esc(l.title)+'</strong><span class="math-lesson-description">'+esc(l.summary||'')+'</span><span class="math-lesson-open">Lire la leçon →</span></button>';
 }).join('')+'</div>'+
 '<details class="math-reading-docs"><summary>Cours originaux du professeur sur ce chapitre</summary>'+
 g.ent.map(id=>{const x=byId(id);return x?btn('data-pc-ent',id,fmt(x.date)+' · '+x.title.replace(/^\d{2}\/\d{2}\s+—\s+/,'')):'';}).join('')+
 btn('data-pc-work',g.title,'Voir les devoirs ENT du chapitre')+'</details>',home);
}
function sections(l){
 return (l.blocks||[]).map(block=>{
  if(block.kind==='note'){
   const paragraphs=String(block.body||'').split(/\n+/).filter(Boolean);
   return '<section class="math-reading-section"><h3>'+esc(block.h||'Explication')+'</h3>'+
    paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('')+'</section>';
  }
  if(block.kind==='bullets')return '<section class="math-reading-section"><h3>'+esc(block.h||'À retenir')+'</h3><ol>'+
   (block.items||[]).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol></section>';
  return '';
 }).join('');
}
function lesson(id){
 const l=byId(id);if(!l)return;
 const i=gById(id);groupIndex=i;selected=id;
 const g=GROUPS[i];
 draw(header(l.title,'Lis la leçon du début à la fin.')+back('Retour aux leçons du chapitre')+
 '<article class="spx-panel math-reading-lesson">'+sections(l)+'</article>'+
 '<div class="math-reading-actions"><h3>Après la leçon</h3>'+
 btn('data-pc-help',id,'Je n’ai pas compris')+'</div>'+
 '<details class="math-reading-docs"><summary>Documents et exercices du professeur (ENT)</summary>'+
 g.ent.map(eid=>{const x=byId(eid);return x?btn('data-pc-ent',eid,fmt(x.date)+' · '+x.title.replace(/^\d{2}\/\d{2}\s+—\s+/,'')):'';}).join('')+
 btn('data-pc-work',g.title,'Voir les devoirs de ce chapitre')+
 '<p>Les fichiers PDF et PowerPoint originaux sont conservés dans le dossier scolaire. Leur lecteur privé n’est pas encore raccordé à cette matière.</p></details>'+
 '<p class="spx-note">Aucune évaluation notée n’est activée ici : pas de note ni d’XP tant que les questionnaires et leurs corrections ne sont pas prêts.</p>',
 ()=>chapter(i));
}
function help(id){
 const l=byId(id);if(!l)return;
 const i=gById(id);groupIndex=i;selected=id;const h=l.help||{};
 draw(header('Je n’ai pas compris : '+l.title,'On reprend la même idée avec des mots plus simples.')+
 back('Retour à la leçon')+
 '<article class="spx-panel math-reading-lesson">'+
 '<section class="math-reading-section"><h3>Une autre façon de comprendre</h3><p>'+esc(h.simple||l.summary||'Relis le début de la leçon.')+'</p></section>'+
 '<section class="math-reading-section"><h3>Un exemple pas à pas</h3>'+((h.steps||[]).map(t=>'<p>'+esc(t)+'</p>').join(''))+'</section>'+
 '<section class="math-reading-section"><h3>L’erreur à éviter</h3><p>'+esc(h.example||'Vérifie chaque étape.')+'</p></section>'+
 '</article><div class="math-reading-actions">'+btn('data-pc-bis',id,'Revenir à la leçon complète')+'</div>',
 ()=>lesson(id));
}
function entChronology(){
 groupIndex=null;selected=null;
 const rows=ent.slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''),'fr'));
 draw(header('Cours ENT · Chronologie','Les textes du professeur, conservés séparément des leçons simplifiées.')+
 back('Retour aux chapitres')+
 '<section class="spx-panel">'+
 rows.map(x=>'<button type="button" class="spx-row" data-pc-ent="'+esc(x.id)+'"><span class="spx-chip">▤</span><span><strong>'+esc(x.title)+'</strong><small>'+esc(fmt(x.date))+'</small></span></button>').join('')+
 '</section>',home);
}
function entLesson(id){
 const l=byId(id);if(!l)return;
 selected=id;const i=gById(id);groupIndex=i;
 const note=(l.blocks||[]).find(x=>x.h==='Cahier de textes ENT — professeur');
 const raw=note?.body||l.summary||'Aucun texte de cours retrouvé dans cette séance ENT.';
 draw(header('Cours ENT · '+fmt(l.date),'Ce qui est écrit par le professeur, sans ajouter un cours inventé.')+
 back('Retour aux cours ENT')+
 '<article class="spx-panel math-reading-lesson"><section class="math-reading-section"><h3>'+esc(l.title)+'</h3><p>'+esc(raw)+'</p></section>'+
 '<section class="math-reading-section"><h3>À savoir</h3><p>'+((/sans contenu publié/i.test(l.title))?
 'Cette séance est répertoriée, mais aucun texte pédagogique n’était disponible dans les documents récupérés.':
 'Ce texte est l’activité notée dans l’ENT. Le PDF complet du professeur peut contenir davantage d’explications.')+
 '</p></section></article>'+
 (i>=0?'<div class="math-reading-actions"><h3>Pour comprendre la leçon</h3>'+
 GROUPS[i].bis.map(x=>{const a=byId(x);return a?btn('data-pc-bis',x,a.title):'';}).join('')+'</div>':''),
 entChronology);
}
function homework(topic){
 selected=null;groupIndex=null;
 const items=HOMEWORK.filter(x=>topic==='all'||x.topic===topic);
 draw(header('Devoirs ENT de physique-chimie','Consignes enregistrées par date, non notées dans ce classeur.')+
 back(topic==='all'?'Retour aux chapitres':'Retour au chapitre')+
 '<section class="spx-panel">'+
 (items.length?items.map(x=>
 '<section class="math-reading-section"><h3>Pour le '+esc(fmt(x.date))+'</h3><p>'+esc(x.text)+'</p><p class="spx-note">Devoir ENT '+esc(x.id)+' · '+esc(x.topic)+'</p></section>'
 ).join(''):'<p>Aucun devoir avec consigne récupéré pour ce chapitre.</p>')+
 '<p>Les pages du manuel ne sont pas reconstituées : il faut le texte exact pour afficher un énoncé complet.</p></section>',
 ()=>{if(topic==='all')home();else{const i=GROUPS.findIndex(x=>x.title===topic);if(i>=0)chapter(i);else home();}});
}
function render(element,options){
 root=element;opts=options||{};
 const all=Array.isArray(opts.lessons)?opts.lessons:[];
 bis=all.filter(x=>x.subject==='Physique-chimie'&&x.kind==='bis'&&/^PC_BIS0[1-7]$/.test(x.id||''));
 ent=all.filter(x=>x.subject==='Physique-chimie'&&/^PCENT/.test(x.id||''));
 home();
}
window.TIM_PHYSIQUE_PATH={render};
})();