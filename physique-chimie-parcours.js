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

/* Ces schémas sont pédagogiques : ils ne remplacent pas les figures PDF de la professeure. */
const GLOSSARY={
 PC_BIS01:[['Atome','Une partie minuscule de la matière.'],['Noyau','Le centre de l’atome.'],['Proton','Une particule positive dans le noyau.'],['Neutron','Une particule sans charge dans le noyau.'],['Électron','Une particule négative autour du noyau.']],
 PC_BIS02:[['Neutre','Qui a autant de charges positives que négatives.'],['Ion','Un atome ou un groupe d’atomes qui a gagné ou perdu des électrons.'],['Charge','Le signe électrique positif (+) ou négatif (−).']],
 PC_BIS03:[['Molécule','Un groupe d’atomes reliés entre eux.'],['Symbole','Une ou deux lettres pour nommer un élément, comme H ou Cl.'],['Indice','Le petit chiffre placé après une lettre dans une formule.']],
 PC_BIS04:[['Axe','Une ligne graduée du graphique.'],['Graduation','Un repère numéroté sur l’axe.'],['Unité','Ce que l’on mesure : minute, degré, centimètre…']],
 PC_BIS05:[['Réactif de test','Le produit que le professeur ajoute pour reconnaître un ion.'],['Précipité','Un solide qui apparaît dans le liquide pendant le test.']],
 PC_BIS06:[['Réactifs','Les substances présentes au départ.'],['Produits','Les substances obtenues après la réaction.'],['Dihydrogène','Un gaz noté H₂, avec deux atomes d’hydrogène par molécule.']],
 PC_BIS07:[['Équation','Une écriture avec une flèche pour représenter une réaction.'],['Coefficient','Le grand chiffre DEVANT une formule, qui compte les molécules.'],['Indice','Le petit chiffre DANS une formule : on ne le change pas.']]
};
function glossary(id){
 const words=GLOSSARY[id]||[];
 if(!words.length)return '';
 return '<section class="math-reading-section pc-vocabulary"><h3>Les mots à connaître avant de commencer</h3><dl>'+
 words.map(([w,d])=>'<dt>'+esc(w)+'</dt><dd>'+esc(d)+'</dd>').join('')+'</dl></section>';
}
const SHAPES={
 PC_BIS01:
 '<svg viewBox="0 0 640 235" role="img" aria-label="Schéma simple d’un atome : le noyau avec protons et neutrons au centre, les électrons négatifs autour." xmlns="http://www.w3.org/2000/svg">'+
 '<ellipse cx="315" cy="112" rx="176" ry="74" fill="none" stroke="#a4bdd6" stroke-width="3" stroke-dasharray="8 8"/>'+
 '<circle cx="315" cy="112" r="52" fill="#eef3fa" stroke="#566b87" stroke-width="3"/>'+
 '<circle cx="293" cy="100" r="19" fill="#d87064"/><circle cx="330" cy="95" r="19" fill="#9cacc0"/><circle cx="319" cy="125" r="19" fill="#d87064"/>'+
 '<text x="293" y="106" text-anchor="middle" fill="white" font-size="20" font-weight="bold">+</text><text x="330" y="101" text-anchor="middle" fill="#23364e" font-size="18">0</text><text x="319" y="131" text-anchor="middle" fill="white" font-size="20" font-weight="bold">+</text>'+
 '<circle cx="156" cy="80" r="16" fill="#3b7cbb"/><circle cx="478" cy="137" r="16" fill="#3b7cbb"/>'+
 '<text x="156" y="87" text-anchor="middle" font-size="21" fill="white">−</text><text x="478" y="144" text-anchor="middle" font-size="21" fill="white">−</text>'+
 '<text x="314" y="187" text-anchor="middle" font-size="18" fill="#223b58" font-weight="bold">NOYAU</text><text x="314" y="209" text-anchor="middle" font-size="15" fill="#344c69">protons (+) et neutrons (0)</text>'+
 '<text x="85" y="58" text-anchor="middle" font-size="16" fill="#244e7d">électron (−)</text><path d="M116 61L143 75" stroke="#3b7cbb" stroke-width="2"/>'+
 '<text x="534" y="105" text-anchor="middle" font-size="16" fill="#244e7d">électron (−)</text><path d="M503 112L485 125" stroke="#3b7cbb" stroke-width="2"/>'+
 '</svg>',
 PC_BIS02:
 '<svg viewBox="0 0 640 220" role="img" aria-label="Sodium neutre : 11 protons et 11 électrons. Après perte d’un électron, ion sodium positif : 11 protons et 10 électrons." xmlns="http://www.w3.org/2000/svg">'+
 '<rect x="22" y="20" width="235" height="170" rx="14" fill="#eef6fc" stroke="#a5c2d9"/>'+
 '<text x="139" y="56" text-anchor="middle" font-size="23" fill="#244360" font-weight="bold">Sodium Na</text>'+
 '<text x="139" y="91" text-anchor="middle" font-size="18" fill="#244360">11 protons (+)</text><text x="139" y="122" text-anchor="middle" font-size="18" fill="#244360">11 électrons (−)</text><text x="139" y="159" text-anchor="middle" font-size="18" fill="#315a75" font-weight="bold">Neutre</text>'+
 '<path d="M268 106H363" stroke="#3a6789" stroke-width="4"/><path d="M352 95L364 106L352 117" fill="none" stroke="#3a6789" stroke-width="4"/><text x="315" y="76" text-anchor="middle" font-size="15" fill="#2a4c6a">perd 1</text><text x="315" y="93" text-anchor="middle" font-size="15" fill="#2a4c6a">électron</text>'+
 '<rect x="378" y="20" width="240" height="170" rx="14" fill="#fff4e7" stroke="#d5b18d"/><text x="498" y="56" text-anchor="middle" font-size="23" fill="#6e4b28" font-weight="bold">Ion Na⁺</text>'+
 '<text x="498" y="91" text-anchor="middle" font-size="18" fill="#6e4b28">11 protons (+)</text><text x="498" y="122" text-anchor="middle" font-size="18" fill="#6e4b28">10 électrons (−)</text><text x="498" y="159" text-anchor="middle" font-size="18" fill="#855222" font-weight="bold">Positif (+)</text>'+
 '</svg>',
 PC_BIS03:
 '<svg viewBox="0 0 640 230" role="img" aria-label="Une molécule d’eau H2O possède deux atomes d’hydrogène H et un atome d’oxygène O. Une molécule de dioxyde de carbone CO2 possède un carbone et deux oxygènes." xmlns="http://www.w3.org/2000/svg">'+
 '<text x="164" y="31" text-anchor="middle" font-size="22" font-weight="bold" fill="#294768">Eau : H₂O</text>'+
 '<path d="M115 124L165 98L210 124" fill="none" stroke="#8497a9" stroke-width="12" stroke-linecap="round"/>'+
 '<circle cx="105" cy="130" r="34" fill="#f7f8fb" stroke="#8198af" stroke-width="3"/><circle cx="165" cy="89" r="42" fill="#d65b52"/><circle cx="223" cy="130" r="34" fill="#f7f8fb" stroke="#8198af" stroke-width="3"/>'+
 '<text x="105" y="139" text-anchor="middle" fill="#334d6b" font-size="27" font-weight="bold">H</text><text x="165" y="98" text-anchor="middle" fill="white" font-size="30" font-weight="bold">O</text><text x="223" y="139" text-anchor="middle" fill="#334d6b" font-size="27" font-weight="bold">H</text>'+
 '<text x="164" y="199" text-anchor="middle" font-size="17" fill="#294768">2 H + 1 O</text>'+
 '<text x="472" y="31" text-anchor="middle" font-size="22" font-weight="bold" fill="#294768">Dioxyde de carbone : CO₂</text>'+
 '<path d="M383 125H560" stroke="#8497a9" stroke-width="12"/><circle cx="385" cy="125" r="37" fill="#d65b52"/><circle cx="472" cy="125" r="40" fill="#41474e"/><circle cx="559" cy="125" r="37" fill="#d65b52"/>'+
 '<text x="385" y="135" text-anchor="middle" font-size="29" fill="white" font-weight="bold">O</text><text x="472" y="135" text-anchor="middle" font-size="29" fill="white" font-weight="bold">C</text><text x="559" y="135" text-anchor="middle" font-size="29" fill="white" font-weight="bold">O</text>'+
 '<text x="472" y="199" text-anchor="middle" font-size="17" fill="#294768">1 C + 2 O</text>'+
 '</svg>',
 PC_BIS04:
 '<svg viewBox="0 0 640 260" role="img" aria-label="Graphique du temps en minutes sur l’axe horizontal et de la température en degrés Celsius sur l’axe vertical. Un point est marqué à 5 minutes et 30 degrés." xmlns="http://www.w3.org/2000/svg">'+
 '<path d="M96 18V210H565" stroke="#2c4b6a" stroke-width="3" fill="none"/>'+
 '<g stroke="#d5e0eb" stroke-width="1"><path d="M96 165H540M96 120H540M96 75H540M96 30H540M172 18V210M248 18V210M324 18V210M400 18V210M476 18V210M552 18V210"/></g>'+
 '<g fill="#2b4968" font-size="16"><text x="75" y="214">0</text><text x="60" y="170">10</text><text x="60" y="125">20</text><text x="60" y="80">30</text><text x="60" y="35">40</text><text x="92" y="233">0</text><text x="168" y="233">1</text><text x="244" y="233">2</text><text x="320" y="233">3</text><text x="396" y="233">4</text><text x="472" y="233">5</text><text x="548" y="233">6</text></g>'+
 '<circle cx="476" cy="75" r="9" fill="#c85e5a" stroke="white" stroke-width="2"/><path d="M476 75V210M476 75H96" stroke="#be5d59" stroke-width="2" stroke-dasharray="7 6"/>'+
 '<text x="516" y="60" font-size="17" font-weight="bold" fill="#9b413c">(5 ; 30)</text>'+
 '<text x="316" y="255" text-anchor="middle" fill="#2b4968" font-size="16">Temps (min)</text>'+
 '<text x="98" y="12" fill="#2b4968" font-size="15">Température (°C)</text>'+
 '</svg>',
 PC_BIS05:
 '<svg viewBox="0 0 640 205" role="img" aria-label="Deux tests d’identification : avec la soude, les ions cuivre peuvent donner un solide bleu ; avec le nitrate d’argent, les ions chlorure peuvent donner un solide blanc." xmlns="http://www.w3.org/2000/svg">'+
 '<rect x="17" y="15" rx="15" width="298" height="175" fill="#eef6fc" stroke="#b3cee2"/><rect x="325" y="15" rx="15" width="298" height="175" fill="#f2f5fa" stroke="#c1cfdd"/>'+
 '<text x="167" y="45" text-anchor="middle" font-size="19" fill="#284966" font-weight="bold">Ion cuivre Cu²⁺</text><text x="167" y="75" text-anchor="middle" font-size="16" fill="#284966">Test avec la soude</text>'+
 '<rect x="110" y="92" width="114" height="55" rx="8" fill="#4388c2" stroke="#36729f"/><text x="167" y="126" text-anchor="middle" font-size="19" font-weight="bold" fill="white">Bleu</text>'+
 '<text x="167" y="174" text-anchor="middle" font-size="15" fill="#284966">Un solide peut apparaître</text>'+
 '<text x="475" y="45" text-anchor="middle" font-size="19" fill="#284966" font-weight="bold">Ion chlorure Cl⁻</text><text x="475" y="75" text-anchor="middle" font-size="16" fill="#284966">Test avec le nitrate d’argent</text>'+
 '<rect x="418" y="92" width="114" height="55" rx="8" fill="#fff" stroke="#7e94a8" stroke-width="2"/><text x="475" y="126" text-anchor="middle" font-size="19" font-weight="bold" fill="#334c65">Blanc</text>'+
 '<text x="475" y="174" text-anchor="middle" font-size="15" fill="#284966">Un solide peut apparaître</text>'+
 '</svg>',
 PC_BIS06:
 '<svg viewBox="0 0 640 190" role="img" aria-label="Schéma conceptuel d’une réaction : fer et acide sont les réactifs ; des ions fer et du dihydrogène sont des produits possibles dans les conditions étudiées." xmlns="http://www.w3.org/2000/svg">'+
 '<rect x="15" y="20" width="235" height="138" rx="14" fill="#eef6fc" stroke="#a9c4dc"/>'+
 '<text x="132" y="50" text-anchor="middle" fill="#264965" font-size="18" font-weight="bold">DÉPART</text><text x="132" y="88" text-anchor="middle" fill="#264965" font-size="20">Fer + acide</text><text x="132" y="123" text-anchor="middle" fill="#264965" font-size="16">Réactifs</text>'+
 '<path d="M263 90H375" stroke="#3a6b8c" stroke-width="5"/><path d="M360 77L377 90L360 103" stroke="#3a6b8c" stroke-width="5" fill="none"/>'+
 '<rect x="388" y="20" width="235" height="138" rx="14" fill="#edf8f1" stroke="#a4cdb3"/>'+
 '<text x="506" y="50" text-anchor="middle" fill="#27583f" font-size="18" font-weight="bold">ARRIVÉE</text><text x="506" y="87" text-anchor="middle" fill="#27583f" font-size="18">Ions fer + H₂</text><text x="506" y="123" text-anchor="middle" fill="#27583f" font-size="16">Produits</text>'+
 '</svg>',
 PC_BIS07:
 '<svg viewBox="0 0 640 200" role="img" aria-label="Équation équilibrée 2 H2 plus O2 donne 2 H2O : quatre atomes d’hydrogène et deux atomes d’oxygène des deux côtés." xmlns="http://www.w3.org/2000/svg">'+
 '<rect x="12" y="15" width="290" height="152" rx="15" fill="#edf5fc" stroke="#adc4dd"/>'+
 '<rect x="338" y="15" width="290" height="152" rx="15" fill="#edf8f1" stroke="#a7cdb4"/>'+
 '<text x="157" y="49" text-anchor="middle" font-size="18" fill="#254f74" font-weight="bold">AVANT</text><text x="157" y="94" text-anchor="middle" font-size="29" fill="#254f74" font-weight="bold">2 H₂ + O₂</text>'+
 '<text x="157" y="130" text-anchor="middle" font-size="17" fill="#254f74">4 H et 2 O</text>'+
 '<path d="M303 92H337" stroke="#477999" stroke-width="4"/><path d="M326 82L339 92L326 102" stroke="#477999" stroke-width="3" fill="none"/>'+
 '<text x="483" y="49" text-anchor="middle" font-size="18" fill="#28583f" font-weight="bold">APRÈS</text><text x="483" y="94" text-anchor="middle" font-size="29" fill="#28583f" font-weight="bold">2 H₂O</text>'+
 '<text x="483" y="130" text-anchor="middle" font-size="17" fill="#28583f">4 H et 2 O</text>'+
 '<text x="320" y="189" text-anchor="middle" font-size="16" fill="#2b4c69">Même nombre d’atomes de chaque côté</text>'+
 '</svg>'
};
function diagram(id){
 const svg=SHAPES[id];if(!svg)return '';
 return '<figure class="pc-illustration">'+svg+
 '<figcaption>Schéma simplifié pour comprendre la leçon ; ce n’est pas un document original du professeur.</figcaption></figure>';
}

function lesson(id){
 const l=byId(id);if(!l)return;
 const i=gById(id);groupIndex=i;selected=id;
 const g=GROUPS[i];
 draw(header(l.title,'Lis la leçon du début à la fin.')+back('Retour aux leçons du chapitre')+
 '<article class="spx-panel math-reading-lesson">'+glossary(id)+diagram(id)+sections(l)+'</article>'+
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
 '<section class="math-reading-section"><h3>À retenir</h3><p>'+esc(h.example||'Vérifie chaque étape.')+'</p></section>'+
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
 if(opts.openLessonId && /^PC_BIS0[1-7]$/.test(opts.openLessonId) && byId(opts.openLessonId))lesson(opts.openLessonId);
 else if(opts.openLessonId && /^PCENT/.test(opts.openLessonId) && byId(opts.openLessonId))entLesson(opts.openLessonId);
 else home();
}
window.TIM_PHYSIQUE_PATH={render};
})();