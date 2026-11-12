/* Physique-chimie : présentation identique à la vraie page espagnole.
   Réutilise les classes CSS tim-es-* de espagnol-simplifie.js.
   Les notes et réponses restent privées ; aucun exercice non vérifié n'est publié. */
(function(){
'use strict';
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
const ORDER=['PC_BIS01','PC_BIS02','PC_BIS03','PC_BIS05','PC_BIS04','PC_BIS06','PC_BIS07'];
const TITLES={
 PC_BIS01:'L’atome : de quoi est-il fait ?',
 PC_BIS02:'Les ions : comment deviennent-ils positifs ou négatifs ?',
 PC_BIS03:'Les molécules : lire une formule',
 PC_BIS05:'Identifier les ions grâce à un test',
 PC_BIS04:'Construire et lire un graphique',
 PC_BIS06:'Quand un métal réagit avec un acide',
 PC_BIS07:'Équilibrer une réaction chimique'
};
const ASSOCIATED={
 PC_BIS01:['PCENT6390167'],
 PC_BIS02:['PCENT6390184'],
 PC_BIS03:['PCENT6390201'],
 PC_BIS05:['PCENT6390185'],
 PC_BIS04:['PCENT6390186'],
 PC_BIS06:['PCENT6390203'],
 PC_BIS07:['PCENT6390170']
};
const HOMEWORK_TOPICS={
 PC_BIS01:['Atomes et noyau'],
 PC_BIS02:['Ions et tests'],
 PC_BIS03:['Molécules et formules'],
 PC_BIS04:['Graphiques et mesures'],
 PC_BIS05:['Ions et tests'],
 PC_BIS06:['Réactions chimiques'],
 PC_BIS07:['Réactions chimiques']
};
const TWO_EXAMPLES={
 PC_BIS01:[
 ['Bore : A = 11, Z = 5','Le bore a 5 protons. Il possède 11 − 5 = 6 neutrons, et 5 électrons s’il est neutre.'],
 ['Magnésium : A = 24, Z = 12','Le magnésium possède 12 protons, 12 neutrons et 12 électrons lorsqu’il est neutre.']],
 PC_BIS02:[
 ['Na⁺','Le sodium a perdu 1 électron. Son nombre de protons ne change pas : il est positif.'],
 ['Cl⁻','Le chlore a gagné 1 électron. Le signe − signifie que l’ion est négatif.']],
 PC_BIS03:[
 ['H₂O : l’eau','Le petit 2 concerne H : il y a 2 hydrogènes et 1 oxygène.'],
 ['CO₂ : le dioxyde de carbone','Sans petit chiffre après C, il y a 1 carbone. Le petit 2 après O signifie 2 oxygènes.']],
 PC_BIS04:[
 ['Point (2 ; 20)','Sur un graphique temps-température, tu avances jusqu’à 2 minutes puis tu montes à 20 °C.'],
 ['Point (5 ; 30)','Tu avances jusqu’à 5 minutes puis tu montes à 30 °C.']],
 PC_BIS05:[
 ['Ion cuivre Cu²⁺','Avec la soude, le test peut produire un solide bleu.'],
 ['Ion chlorure Cl⁻','Avec le nitrate d’argent, le test peut produire un solide blanc.']],
 PC_BIS06:[
 ['Les mots « réactifs » et « produits »','Le fer et les ions hydrogène sont les réactifs ; les ions fer et le dihydrogène sont des produits possibles.'],
 ['Pourquoi voit-on des bulles ?','Dans l’exemple étudié, un gaz se forme : le dihydrogène. Les bulles seules ne suffisent pas à identifier le gaz.']],
 PC_BIS07:[
 ['H₂ + Cl₂ → 2 HCl','Il y a 2 H et 2 Cl de chaque côté : l’équation est équilibrée.'],
 ['2 CO + O₂ → 2 CO₂','À gauche comme à droite : 2 carbones et 4 oxygènes.']]
};
const HELP={
 PC_BIS01:[
 ['Je ne distingue pas protons, neutrons et électrons','Dans le noyau, il y a les protons (+) et les neutrons (sans charge). Les électrons (−) sont autour.','Les lettres Z et A servent à compter ce qu’il y a DANS le noyau, pas les électrons.'],
 ['Je confonds Z et A','Z compte uniquement les protons ; A compte les protons ET les neutrons.','Pour A = 12 et Z = 6 : il y a 6 protons et 12 − 6 = 6 neutrons.']],
 PC_BIS02:[
 ['Je ne comprends pas le signe +','Les électrons sont négatifs. Quand un atome en perd, il a plus de + que de − : il devient positif.','Na⁺ a perdu 1 électron. Le + n’indique pas qu’il a gagné un proton.'],
 ['Je ne comprends pas le signe −','Quand un atome gagne un électron négatif, il devient négatif.','Cl⁻ a gagné 1 électron.']],
 PC_BIS03:[
 ['Je ne comprends pas les petits chiffres','Un petit chiffre après une lettre donne le nombre d’atomes de cet élément. Sans chiffre, cela signifie 1.','H₂O : 2 H et 1 O.'],
 ['Je confonds 2 H₂O et H₂O₂','Le chiffre devant compte le nombre de molécules ; celui dans la formule décrit la molécule.','2 H₂O signifie 2 molécules d’eau, soit 4 H et 2 O au total.']],
 PC_BIS04:[
 ['Je ne sais pas quel axe regarder','On commence par l’axe horizontal, celui qui va vers la droite. Puis on lit l’axe vertical, vers le haut.','(5 ; 30) signifie 5 sur l’axe horizontal et 30 sur l’axe vertical.'],
 ['Je ne sais pas utiliser l’échelle','Si un carreau vaut 5 degrés, 2 carreaux valent 10 degrés. Les graduations doivent être régulières.','Pour placer 30 °C, on compte 6 carreaux si chacun vaut 5 °C.']],
 PC_BIS05:[
 ['C’est quoi un précipité ?','C’est un solide qui apparaît dans un liquide pendant le test : parfois un petit nuage coloré.','Avec de la soude, la présence d’ions cuivre peut produire un précipité bleu.'],
 ['Je ne sais pas conclure un test','Regarde d’abord quel réactif le professeur a utilisé, puis la couleur observée.','Si le réactif est la soude et que le précipité est bleu, le test indique des ions cuivre Cu²⁺.']],
 PC_BIS06:[
 ['C’est quoi un réactif ?','C’est une substance de départ. Le produit est ce qui se forme ensuite.','Dans l’exemple du fer avec un acide, le fer est un réactif.'],
 ['Pourquoi une flèche ?','La flèche sépare ce qui réagit à gauche de ce qui se forme à droite.','Fe + 2 H⁺ → Fe²⁺ + H₂ : on lit les réactifs à gauche et les produits à droite.']],
 PC_BIS07:[
 ['Je ne sais pas équilibrer','Compte les H et les O de chaque côté. Si ce n’est pas égal, change les nombres DEVANT les formules.','H₂ + O₂ → H₂O n’est pas équilibrée. 2 H₂ + O₂ → 2 H₂O l’est.'],
 ['Pourquoi ne peut-on pas changer H₂O ?','Le petit chiffre fait partie de la formule : si tu le modifies, tu changes la substance.','On peut écrire 2 H₂O, mais on ne remplace pas H₂O par H₂O₂.']]
};
const FILES=['Chapitre 1 — Atomes, molécules et ions (PDF, 14 pages)','Chapitre 1 — Atomes, molécules et ions (PowerPoint)','Ce que je dois savoir pour le contrôle n° 1 (PDF)','Évaluation formative — contrôle n° 2 (PDF)','Tableau des molécules (PDF)'];
let root=null,opts={},all=[],cards=[],activeId=null;
const E=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
const style=(node,css)=>{node.style.cssText=css;return node};
const safe=s=>String(s??'');
const byId=id=>all.find(l=>l.id===id);
const entOf=id=>(ASSOCIATED[id]||[]).map(byId).filter(Boolean);
const dueOf=id=>HOMEWORK.filter(h=>(HOMEWORK_TOPICS[id]||[]).includes(h.topic));
const readable=d=>{const a=String(d||'').split('-');return a.length===3?a[2]+'/'+a[1]+'/'+a[0]:String(d||'');};
const button=(txt,fn,cls='')=>{const b=E('button',cls,txt);b.type='button';if(fn)b.onclick=fn;return b};
function textLines(node,str,classname=''){
 String(str||'').split('\n').filter(Boolean).forEach(x=>node.append(E('p',classname,x)));
}
function section(parent,title,copy){
 parent.append(E('h3','',title));textLines(parent,copy);
}
function originalPanel(slot,id,mode){
 slot.replaceChildren();
 const docs=entOf(id),work=dueOf(id);
 if(mode==='course'){
  slot.append(E('h3','','Le PDF original du professeur'));
  slot.append(E('p','', 'Les pages utiles du PDF figurent désormais directement dans la leçon BIS. Le document complet peut aussi être affiché ci-dessous, sans changer d’onglet. Pour répondre, utilise les exercices interactifs, pas le PDF.'));
 }else{
  slot.append(E('h3','','Exercices du professeur (ENT)'));
  slot.append(E('p','', 'Les PDF du professeur sont des documents à consulter ou à imprimer : ils ne sont pas des questionnaires à remplir sur le téléphone.'));
  const go=button('Faire les exercices interactifs de physique-chimie',()=>{
   const section=root?.querySelector('.tim-es-lesson[open] .tim-es-exercises');
   if(section){section.open=true;section.scrollIntoView({block:'start'});}
  },'spx-quick-link tim-es-quick-link');
  go.style.cssText='display:block;width:100%;margin:12px 0 18px;text-align:center';
  slot.append(go);
 }
 const docArea=E('section','pc-lesson-files');
 docArea.append(E('h4','','Documents originaux disponibles'));
 slot.append(docArea);
 if(window.TIM_PHYSICS_DOCUMENTS?.lessonFiles)window.TIM_PHYSICS_DOCUMENTS.lessonFiles(id,docArea);
 else docArea.append(E('p','','Le lecteur des pièces jointes n’est pas disponible.'));
 if(mode==='course'){
  slot.append(E('h4','','Texte du cahier de textes ENT'));
  if(!docs.length)slot.append(E('p','','Aucun texte du professeur rattaché à cette séance.'));
  for(const d of docs){
   slot.append(E('h4','',readable(d.date)+' — '+d.title));
   const raw=d.blocks?.find(b=>b.h==='Cahier de textes ENT — professeur')?.body||d.summary||'Aucun texte de cours publié.';
   slot.append(E('p','ent-es-source-text',raw));
  }
 }else{
  slot.append(E('h4','','Consignes des devoirs ENT'));
  if(!work.length)slot.append(E('p','','Aucune consigne de devoir récupérée pour ce sujet.'));
  work.forEach(d=>{
   slot.append(E('h4','','Pour le '+readable(d.date)));
   slot.append(E('p','ent-es-source-text',d.text));
  });
  slot.append(E('p','','Les exercices du manuel ne sont pas reconstitués sans leurs énoncés originaux.'));
 }
}

function showCard(id,scroll=true){
 activeId=id;cards.forEach(c=>{
  const yes=c.dataset.pcLesson===id;
  c.hidden=!yes;
  c.open=yes;
  if(yes&&!c.dataset.pcReady){c.querySelector('.tim-es-card-inner').append(buildLesson(id));c.dataset.pcReady='1';}
 });
 if(scroll){try{root.querySelector('.tim-es-lesson[open]')?.scrollIntoView({block:'start'});}catch(_){}}
}
function showList(){
 activeId=null;
 cards.forEach(c=>{c.open=false;c.hidden=false;});
 try{root.scrollIntoView({block:'start'});}catch(_){}
}

/* Schémas pédagogiques simplifiés, distincts des documents du professeur.
   Dans chaque figure, seuls les objets nécessaires à la notion sont représentés. */
const PC_DRAWINGS={
 PC_BIS01: '<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schéma simplifié d’un atome : au centre protons positifs et neutrons neutres ; autour électrons négatifs.">'
  +'<ellipse cx="320" cy="123" rx="183" ry="83" fill="none" stroke="#a4b7cb" stroke-width="4" stroke-dasharray="8 7"/>'
  +'<circle cx="320" cy="123" r="58" fill="#e6edf5" stroke="#8299b2" stroke-width="3"/>'
  +'<circle cx="291" cy="111" r="21" fill="#bf6059"/><circle cx="337" cy="108" r="21" fill="#8da4b9"/><circle cx="319" cy="146" r="21" fill="#bf6059"/>'
  +'<text x="291" y="118" text-anchor="middle" fill="#fff" font-size="24" font-weight="bold">+</text><text x="337" y="115" text-anchor="middle" fill="#fff" font-size="20">0</text><text x="319" y="154" text-anchor="middle" fill="#fff" font-size="24" font-weight="bold">+</text>'
  +'<circle cx="144" cy="109" r="18" fill="#306fa9"/><circle cx="499" cy="145" r="18" fill="#306fa9"/><text x="144" y="117" text-anchor="middle" font-size="25" fill="#fff">−</text><text x="499" y="153" text-anchor="middle" font-size="25" fill="#fff">−</text>'
  +'<path d="M237 202L279 159M394 204L342 164M68 63L133 99" stroke="#415a76" stroke-width="3" fill="none"/>'
  +'<text x="195" y="225" text-anchor="middle" font-size="18" font-weight="bold" fill="#244567">Noyau : proton (+)</text><text x="438" y="227" text-anchor="middle" font-size="18" font-weight="bold" fill="#244567">et neutron (0)</text><text x="70" y="52" font-size="18" font-weight="bold" fill="#244567">Électron (−)</text>'
  +'</svg>',
 PC_BIS02: '<svg viewBox="0 0 640 235" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Le sodium perd un électron : de 11 protons et 11 électrons, il devient Na positif avec 11 protons et 10 électrons.">'
  +'<rect x="12" y="28" width="241" height="167" rx="15" fill="#edf4fc" stroke="#98b6d1" stroke-width="3"/><rect x="388" y="28" width="240" height="167" rx="15" fill="#fff6e9" stroke="#c9ad85" stroke-width="3"/>'
  +'<text x="132" y="65" text-anchor="middle" font-size="23" font-weight="bold" fill="#244967">ATOME Na</text><text x="132" y="101" text-anchor="middle" font-size="18" fill="#244967">11 protons (+)</text><text x="132" y="131" text-anchor="middle" font-size="18" fill="#244967">11 électrons (−)</text><text x="132" y="170" text-anchor="middle" font-size="20" font-weight="bold" fill="#244967">Neutre</text>'
  +'<path d="M273 111H368" stroke="#446680" stroke-width="4"/><path d="M355 99L370 111L355 123" fill="none" stroke="#446680" stroke-width="4"/><text x="322" y="78" text-anchor="middle" font-size="16" fill="#284c66">Perd</text><text x="322" y="97" text-anchor="middle" font-size="16" fill="#284c66">1 électron</text>'
  +'<text x="509" y="65" text-anchor="middle" font-size="23" font-weight="bold" fill="#85572d">ION Na⁺</text><text x="509" y="101" text-anchor="middle" font-size="18" fill="#85572d">11 protons (+)</text><text x="509" y="131" text-anchor="middle" font-size="18" fill="#85572d">10 électrons (−)</text><text x="509" y="170" text-anchor="middle" font-size="20" font-weight="bold" fill="#85572d">Positif (+)</text>'
  +'</svg>',
 PC_BIS03: '<svg viewBox="0 0 640 252" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Les molécules H2O et CO2 sont dessinées avec des boules : H2O contient deux H et un O ; CO2 contient un C et deux O.">'
  +'<text x="160" y="35" font-size="25" text-anchor="middle" fill="#29456b" font-weight="bold">Eau H₂O</text><path d="M114 126L160 92L206 126" stroke="#849ab2" stroke-width="11" fill="none" stroke-linecap="round"/>'
  +'<circle cx="106" cy="133" r="32" fill="#fff" stroke="#8094ad" stroke-width="3"/><circle cx="160" cy="94" r="44" fill="#d0554b"/><circle cx="214" cy="133" r="32" fill="#fff" stroke="#8094ad" stroke-width="3"/>'
  +'<text x="106" y="142" text-anchor="middle" font-size="27" fill="#2b4364">H</text><text x="160" y="104" text-anchor="middle" font-size="31" fill="white">O</text><text x="214" y="142" text-anchor="middle" font-size="27" fill="#2b4364">H</text>'
  +'<text x="160" y="215" text-anchor="middle" font-size="19" fill="#29456b">2 H et 1 O</text>'
  +'<text x="480" y="35" font-size="25" text-anchor="middle" fill="#29456b" font-weight="bold">Gaz CO₂</text><path d="M392 122H568" stroke="#849ab2" stroke-width="12"/><circle cx="394" cy="122" r="38" fill="#d0554b"/><circle cx="480" cy="122" r="41" fill="#303b49"/><circle cx="568" cy="122" r="38" fill="#d0554b"/>'
  +'<text x="394" y="131" text-anchor="middle" font-size="28" fill="#fff">O</text><text x="480" y="132" text-anchor="middle" font-size="29" fill="#fff">C</text><text x="568" y="131" text-anchor="middle" font-size="28" fill="#fff">O</text>'
  +'<text x="480" y="215" text-anchor="middle" font-size="19" fill="#29456b">1 C et 2 O</text>'
  +'</svg>',
 PC_BIS04: '<svg viewBox="0 0 640 268" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Graphique avec minutes de 0 à 6 sur l’axe horizontal, température de 0 à 40 degrés sur le vertical, et un point placé à 5 minutes et 30 degrés.">'
  +'<g stroke="#d9e2ec" stroke-width="1.5"><path d="M100 54H520M100 97H520M100 140H520M100 183H520M170 54V226M240 54V226M310 54V226M380 54V226M450 54V226M520 54V226"/></g>'
  +'<path d="M100 40V226H555" stroke="#334f71" stroke-width="4" fill="none"/>'
  +'<g font-size="16" fill="#29486a"><text x="78" y="230">0</text><text x="69" y="188">10</text><text x="69" y="145">20</text><text x="69" y="102">30</text><text x="69" y="59">40</text><text x="98" y="248">0</text><text x="167" y="248">1</text><text x="237" y="248">2</text><text x="307" y="248">3</text><text x="377" y="248">4</text><text x="447" y="248">5</text><text x="517" y="248">6</text></g>'
  +'<path d="M450 97V226M100 97H450" stroke="#b6564b" stroke-width="3" stroke-dasharray="7 6"/><circle cx="450" cy="97" r="9" fill="#bd554b" stroke="#fff" stroke-width="2"/>'
  +'<text x="462" y="83" font-size="19" fill="#a3453d" font-weight="bold">(5 ; 30)</text>'
  +'<text x="310" y="267" text-anchor="middle" font-size="17" fill="#29486a">Temps (minutes)</text><text x="100" y="28" font-size="17" fill="#29486a">Température (°C)</text>'
  +'</svg>',
 PC_BIS05: '<svg viewBox="0 0 640 229" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schémas de tests de laboratoire : soude et ion cuivre donnent un solide bleu ; nitrate d’argent et ion chlorure un solide blanc.">'
  +'<rect x="10" y="14" width="304" height="200" rx="13" fill="#edf5fc" stroke="#b3cce2" stroke-width="2"/><rect x="326" y="14" width="303" height="200" rx="13" fill="#f2f5f9" stroke="#b7c8d7" stroke-width="2"/>'
  +'<text x="161" y="45" text-anchor="middle" font-size="20" fill="#26476b" font-weight="bold">Test de l’ion cuivre</text><text x="161" y="77" text-anchor="middle" font-size="17" fill="#26476b">Produit : soude</text>'
  +'<rect x="108" y="100" width="106" height="55" rx="7" fill="#367dc1" stroke="#245f9b"/><text x="161" y="134" text-anchor="middle" fill="white" font-size="21" font-weight="bold">Bleu</text><text x="161" y="185" text-anchor="middle" font-size="16" fill="#26476b">Solide bleu observé</text>'
  +'<text x="477" y="45" text-anchor="middle" font-size="20" fill="#26476b" font-weight="bold">Test de l’ion chlorure</text><text x="477" y="77" text-anchor="middle" font-size="17" fill="#26476b">Produit : nitrate d’argent</text>'
  +'<rect x="423" y="100" width="108" height="55" rx="7" fill="#fff" stroke="#8396aa" stroke-width="2"/><text x="477" y="134" text-anchor="middle" fill="#334b64" font-size="21" font-weight="bold">Blanc</text><text x="477" y="185" text-anchor="middle" font-size="16" fill="#26476b">Solide blanc observé</text>'
  +'</svg>',
 PC_BIS06: '<svg viewBox="0 0 640 222" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avant la réaction : fer et ions hydrogène ; après, ions fer et dihydrogène gazeux.">'
  +'<rect x="9" y="32" width="241" height="160" rx="14" fill="#edf5fc" stroke="#adc9e1" stroke-width="2"/><rect x="389" y="32" width="241" height="160" rx="14" fill="#edf8f1" stroke="#a5d0b9" stroke-width="2"/>'
  +'<text x="130" y="64" text-anchor="middle" font-size="21" font-weight="bold" fill="#284e70">DÉPART</text><text x="130" y="110" text-anchor="middle" font-size="22" fill="#284e70">Fer + acide</text><text x="130" y="146" text-anchor="middle" font-size="18" fill="#284e70">Réactifs</text>'
  +'<path d="M266 111H373" stroke="#386d91" stroke-width="5"/><path d="M361 99L375 111L361 123" fill="none" stroke="#386d91" stroke-width="5"/>'
  +'<text x="510" y="64" text-anchor="middle" font-size="21" font-weight="bold" fill="#285f43">ARRIVÉE</text><text x="510" y="109" text-anchor="middle" font-size="20" fill="#285f43">Ions fer + H₂</text><text x="510" y="146" text-anchor="middle" font-size="18" fill="#285f43">Produits</text>'
  +'</svg>',
 PC_BIS07: '<svg viewBox="0 0 640 225" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Une équation équilibrée possède quatre atomes H et deux atomes O à gauche et à droite : 2 H2 plus O2 donne 2 H2O.">'
  +'<rect x="10" y="13" width="296" height="190" rx="13" fill="#edf5fc" stroke="#aac6de" stroke-width="2"/><rect x="333" y="13" width="296" height="190" rx="13" fill="#edf8f2" stroke="#a5ccb2" stroke-width="2"/>'
  +'<text x="158" y="48" text-anchor="middle" fill="#23486a" font-size="19" font-weight="bold">AVANT</text><text x="158" y="92" text-anchor="middle" fill="#23486a" font-size="28" font-weight="bold">2 H₂ + O₂</text>'
  +'<text x="158" y="132" text-anchor="middle" fill="#23486a" font-size="19">4 H et 2 O</text><text x="158" y="165" text-anchor="middle" fill="#23486a" font-size="17">Réactifs</text>'
  +'<text x="482" y="48" text-anchor="middle" fill="#296143" font-size="19" font-weight="bold">APRÈS</text><text x="482" y="92" text-anchor="middle" fill="#296143" font-size="28" font-weight="bold">2 H₂O</text>'
  +'<text x="482" y="132" text-anchor="middle" fill="#296143" font-size="19">4 H et 2 O</text><text x="482" y="165" text-anchor="middle" fill="#296143" font-size="17">Produits</text>'
  +'<path d="M304 111H332" stroke="#476b81" stroke-width="4"/><path d="M321 101L333 111L321 121" fill="none" stroke="#476b81" stroke-width="4"/>'
  +'</svg>'
};
function drawing(id){
 const svg=PC_DRAWINGS[id];if(!svg)return null;
 const fig=E('figure','pc-learning-drawing');
 fig.style.cssText='margin:15px 0 23px;padding:14px 9px 10px;background:#f7faff;border:1px solid #d4e0ee;border-radius:12px;overflow:auto';
 const holder=E('div');holder.style.cssText='width:100%;min-width:510px;max-width:670px;margin:auto';holder.innerHTML=svg;
 const graphic=holder.querySelector('svg');if(graphic){graphic.style.width='100%';graphic.style.height='auto';graphic.style.display='block';}
 const legend=E('figcaption','','Dessin simplifié pour comprendre ; sur téléphone, fais glisser horizontalement si besoin. Les figures du professeur restent dans les documents ENT.');
 legend.style.cssText='font-size:13px;line-height:1.5;color:#445c76;margin-top:8px;text-align:center';
 fig.append(holder,legend);return fig;
}

function buildLesson(id){
 const l=byId(id),t=l?.teaching;
 if(!t)return E('p','','Cette leçon BIS n’est pas encore vérifiée.');
 const layout=E('div','tim-es-reading');
 const back=button('← Choisir une autre leçon',showList,'tim-es-back');
 back.style.cssText='margin:7px 0 13px;min-height:40px;background:#eef3fb!important;border:1px solid #bbcce1!important;color:#2d4d77!important;padding:8px 12px;border-radius:9px;font-weight:700';
 layout.append(back);
 const sheet=E('article','tim-es-course-sheet');
 sheet.append(E('p','tim-es-bis-label','LEÇON BIS · EXPLICATION FACILE'));
 section(sheet,'À quoi sert cette leçon ?',t.why);
 const fig=drawing(id);if(fig)sheet.append(fig);
 section(sheet,'Comprendre la règle',t.rule);
 if(window.TIM_PHYSICS_INLINE_PDF)window.TIM_PHYSICS_INLINE_PDF.insertLesson(id,'afterRule',sheet);
 sheet.append(E('h3','','Comment faire'));
 const steps=E('ol','tim-es-course-steps');
 for(const step of t.steps||[])steps.append(E('li','',step.replace(/^\d+\.\s*/,'')));
 sheet.append(steps);
 if(window.TIM_PHYSICS_INLINE_PDF)window.TIM_PHYSICS_INLINE_PDF.insertLesson(id,'beforeWorked',sheet);
 sheet.append(E('h3','','Un exemple corrigé, pas à pas'));
 const worked=E('div','tim-es-worked');
 for(const [index,line] of (t.worked||[]).entries())
  worked.append(E('p',index===0?'tim-es-worked-question':index===(t.worked.length-1)?'tim-es-worked-answer':'tim-es-worked-method',line));
 sheet.append(worked);
 sheet.append(E('h3','','Deux autres exemples'));
 for(const [title,explanation] of t.examples||[]){
  const p=E('p','tim-es-course-example');
  p.append(E('strong','',title),E('span','',explanation));sheet.append(p);
 }
 if(window.TIM_PHYSICS_INLINE_PDF)window.TIM_PHYSICS_INLINE_PDF.insertLesson(id,'afterExamples',sheet);
 const take=E('p','tim-es-course-remember');
 take.append(E('strong','','À retenir : '),document.createTextNode(t.remember));sheet.append(take);
 layout.append(sheet);

 // Exactement les cinq accès de la page Espagnol.
 const menu=E('nav','spx-quick-links tim-es-quick-links');
 menu.setAttribute('aria-label','Cours et exercices de cette leçon');
 const original=E('details','tim-es-ent-original');original.hidden=true;
 const origSum=E('summary','','Cours original du professeur');
 const origSlot=E('div','tim-es-ent-original-content');
 original.append(origSum,origSlot);
 const openOriginal=mode=>{
  original.hidden=false;original.open=true;origSum.textContent=mode==='course'?'Cours original ENT':'Exercices ENT du chapitre';
  originalPanel(origSlot,id,mode);original.scrollIntoView?.({block:'start'});
 };
 const help=E('details','tim-es-course-help');help.hidden=true;
 help.append(E('summary','','Je n’ai pas compris'),E('p','','Choisis ce qui te bloque :'));
 const choices=E('div','tim-es-help-choices'),answer=E('div','tim-es-help-answer');
 answer.setAttribute('aria-live','polite');
 for(const [title,explanation,example] of t.help||[]){
  const b=button(title,()=>answer.replaceChildren(E('strong','',title),E('p','',explanation),E('p','',example)),'tim-es-help-question');
  choices.append(b);
 }
 help.append(choices,answer);
 const exerciseSection=E('details','tim-es-exercises');
 exerciseSection.append(E('summary','','Après la leçon — faire les 3 exercices'));
 const exerciseBody=E('div');
 exerciseBody.append(E('h3','','Mes trois exercices de dix questions'));
 exerciseBody.append(E('p','',window.__TIM_PARENT?'Compte Parent : vous pouvez répondre aux dix questions et obtenir une correction d’essai, sans enregistrer de note ni d’XP pour Tim.':'Compte Tim : une seule tentative par exercice, puis note et corrections expliquées.'));
 const options=E('div');
 options.style.cssText='display:grid;gap:9px;margin:14px 0';
 const work=E('div','pc-exercise-work');
 let activeTask='';
 ['Je comprends les mots','J’applique la leçon','Je réponds seul'].forEach((name,index)=>{
  const exid='PCQ_L'+id.slice(-2)+'_0'+(index+1);
  const b=button('Exercice '+(index+1)+' — '+name,async()=>{
   activeTask=exid;work.replaceChildren(E('p','','Ouverture de l’exercice…'));
   if(!window.TIM_PHYSICS_TRAINING?.mount){work.textContent='Service des exercices de physique indisponible.';return;}
   await window.TIM_PHYSICS_TRAINING.mount(exid,work);
  },'spx-quick-link tim-es-quick-link');
  b.style.cssText='display:block;width:100%;min-height:51px;font-size:15px!important;text-align:left';
  options.append(b);
 });
 exerciseBody.append(options,work);exerciseSection.append(exerciseBody);
 const showExercises=()=>{exerciseSection.open=true;exerciseSection.scrollIntoView?.({block:'start'});};
 const actions=[
  ['1 · Leçon ENT',()=>openOriginal('course')],
  ['2 · Leçon BIS',()=>{original.open=false;original.hidden=true;help.open=false;help.hidden=true;sheet.scrollIntoView?.({block:'start'});}],
  ['3 · Je n’ai pas compris',()=>{original.open=false;original.hidden=true;help.hidden=false;help.open=true;help.scrollIntoView?.({block:'start'});}],
  ['Exercices ENT · fiches du professeur (à consulter)',()=>openOriginal('exercises')],
  ['Exercices BIS interactifs · 3 séries de 10',showExercises]
 ];
 for(const [label,fn] of actions)menu.append(button(label,fn,'spx-quick-link tim-es-quick-link'));
 layout.append(menu,original,help);
 const extra=E('details','tim-es-course-extra');
 extra.append(E('summary','','Approfondir : vocabulaire et autres explications'));
 const body=E('div');
 const terms=E('dl','pc-lesson-terms');
 for(const [word,definition] of t.terms||[]){
  terms.append(E('dt','',word),E('dd','',definition));
 }
 body.append(terms);
 extra.append(body);layout.append(extra,exerciseSection);
 return layout;
}
function archives(){
 const a=E('details','ent-es-archive-parent');
 a.style.cssText='border:1px solid #7a8ca8;border-radius:13px;padding:13px 14px;margin:24px 0;background:#20324d;color:#f3f7ff';
 const title=E('summary','','Archives Parent — cours, devoirs, PDF et séances d’origine');
 title.style.cssText='cursor:pointer;font-size:17px;font-weight:850;line-height:1.5;padding:10px 3px;color:#fff';
 a.append(title);
 const inside=E('div');inside.style.cssText='color:#f2f7ff;padding:10px 0;font-size:15px;line-height:1.6';
 const allEnt=all.filter(x=>/^PCENT/.test(x.id)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
 inside.append(E('h3','','Séances du cahier de textes ENT'));
 for(const x of allEnt){const d=E('details');d.style.cssText='padding:8px 0;border-bottom:1px solid #ffffff30';
 d.append(E('summary','',readable(x.date)+' · '+x.title));
 const raw=x.blocks?.find(b=>b.h==='Cahier de textes ENT — professeur')?.body||x.summary||'';
 const p=E('p','',raw);p.style.whiteSpace='pre-wrap';d.append(p);inside.append(d);
 }
 inside.append(E('h3','','Devoirs ENT'));
 for(const x of HOMEWORK){const d=E('details');d.style.cssText='padding:7px 0';d.append(E('summary','','Pour le '+readable(x.date)+' · '+x.topic));d.append(E('p','',x.text));inside.append(d);}
 inside.append(E('h3','','Pièces jointes d’origine classées dans la bibliothèque scolaire'));
 FILES.forEach(name=>inside.append(E('p','',name)));
 inside.append(E('p','','Ces fichiers sont dans la bibliothèque privée de Tim. Aucun faux lien de téléchargement n’est affiché ici.'));
 if(window.TIM_PHYSICS_DOCUMENTS?.parentImport)inside.append(window.TIM_PHYSICS_DOCUMENTS.parentImport());
 a.append(inside);return a;
}
function render(container,options={}){
 root=container;opts=options;all=Array.isArray(options.lessons)?options.lessons.filter(x=>x.subject==='Physique-chimie'):[];
 cards=[];activeId=null;root.replaceChildren();
 const back=button('← Toutes les matières',()=>options.back?.());
 back.style.cssText='min-height:43px;display:inline-flex;align-items:center;justify-content:center;background:#28458e!important;color:#fff!important;font-weight:800;padding:9px 13px;border-radius:10px;cursor:pointer;border:1px solid #28458e';
 root.append(back);
 const heading=E('h2','','Physique-chimie — Mes leçons');heading.style.cssText='margin:18px 0 9px;color:inherit;font-size:24px';
 root.append(heading);
 const intro=E('p','','Choisis une leçon : elle s’ouvre et tu peux la lire directement.');
 intro.style.cssText='font-size:16px;color:inherit;line-height:1.6;margin:5px 0 16px';root.append(intro);
 const explain=E('p','pc-quiz-intro',window.__TIM_PARENT
  ?'Compte Parent : les 21 exercices BIS sont consultables et réalisables en mode essai, avec correction, sans toucher aux notes ni aux XP de Tim.'
  :'Exercices BIS interactifs : 21 exercices, avec saisie des réponses directement dans le classeur. Les PDF du professeur restent des documents à consulter.');
 explain.style.cssText='font-size:15px;line-height:1.6;margin:8px 0 10px;padding:12px;border:1px solid #bed1e5;background:#eff5fc;color:#233f61;border-radius:12px';
 root.append(explain);
 const access=button('Voir les 21 exercices interactifs de physique-chimie',()=>{
  const nav=document.querySelector('[data-nav="exercices"]');
  if(!nav)return;
  nav.click();
  const options=[...document.querySelectorAll('#exercise-list button.matter-card')];
  const target=options.find(x=>x.textContent?.includes('Physique-chimie'));
  if(target)target.click();
 },'spx-quick-link tim-es-quick-link');
 access.style.cssText='display:block;width:100%;margin:8px 0 17px;padding:13px;min-height:51px;text-align:center';
 root.append(access);
 for(const [i,id] of ORDER.entries()){
  const l=byId(id);if(!l)continue;
  const card=E('details','tim-es-lesson');
  card.dataset.pcLesson=id;
  card.style.cssText='border:1px solid #c6d1e8;border-radius:14px;margin:12px 0;background:#f7f9ff;color:#273448;overflow:hidden';
  const label=E('summary','','Leçon '+(i+1)+' — '+(TITLES[id]||l.title));
  label.style.cssText='display:block;cursor:pointer;font-weight:850;line-height:1.55;padding:17px 14px;color:#263a83;font-size:17px;overflow-wrap:anywhere';
  const inner=E('div','tim-es-card-inner');inner.style.cssText='padding:0 13px 18px';
  card.append(label,inner);
  card.addEventListener('toggle',()=>{if(card.open&&activeId!==id)showCard(id,false);});
  cards.push(card);root.append(card);
 }
 const results=E('details','tim-es-results');
 results.append(E('summary','','Mes résultats et corrections'));
 const stat=E('div');stat.style.cssText='padding:12px;color:#293d59;line-height:1.6;background:#fff';
 stat.append(E('p','','Ouvre ce panneau pour consulter les notes et corrections de physique-chimie.'));
 results.append(stat);
 results.addEventListener('toggle',()=>{if(results.open){
  if(window.TIM_PHYSICS_TRAINING?.renderProgress)window.TIM_PHYSICS_TRAINING.renderProgress(stat);
  else stat.textContent='Le suivi des résultats n’est pas disponible.';
 }});
 root.append(results);
 if(window.__TIM_PARENT&&!window.__TIM_GUEST)root.append(archives());
 if(options.openLessonId){
  const target=/^PC_BIS/.test(options.openLessonId)?options.openLessonId:ORDER.find(id=>(ASSOCIATED[id]||[]).includes(options.openLessonId));
  if(target)showCard(target,false);
 }
}
window.TIM_PHYSIQUE_PATH={render};
})();