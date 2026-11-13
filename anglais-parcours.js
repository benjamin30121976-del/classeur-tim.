/* Anglais — navigation pédagogique selon la discussion de référence. */
(function(){'use strict';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n;};
const btn=(title,fn)=>{const b=el('button',title);b.type='button';b.className='plain';b.style.cssText='min-height:44px;margin:4px;white-space:normal';b.onclick=fn;return b;};
const add=(root,tag,text)=>{const n=el(tag,text);root.append(n);return n;};
const ENT_ACTIVITIES=[
"1. Ranger les genres musicaux dans l’ordre chronologique.",
"2. Lire les affirmations sur le chant des esclaves et les tambours.",
"3. Identifier les chants fondés sur la Bible.",
"4. Dire si le blues exprime le bonheur ou la tristesse.",
"5. Situer la naissance du blues par rapport à l’abolition de l’esclavage.",
"6. Situer les premiers groupes de jazz au Sud ou à l’Ouest des États-Unis.",
"7. Relier Parker, Armstrong et Ellington à leur instrument.",
"8. Situer la naissance du rock’n’roll dans le temps.",
"9. Identifier le musicien surnommé « the King of rock’n’roll »."
];
const TOPICS=[
{id:'EN_BIS01',name:'The Sounds of Music',original:true,rule:'Le document retrace l’évolution de plusieurs musiques, de leurs artistes et de leurs instruments.',examples:[['Work songs','Chants de travail : work signifie travail, songs signifie chansons.'],['The blues was born in the 1860s','Le blues est né dans les années 1860.'],['New Orleans','Ville citée pour le jazz.'],['The King of rock’n’roll','Surnom d’Elvis Presley.']],help:['1860s = années 1860 ; the fifties = années 1950.','Pour retrouver un instrument, relis la partie jazz.','Écris des phrases complètes : sujet + verbe + information.']},
{id:'EN_BIS02',name:'Le suffixe -ness',original:false,rule:'Le suffixe -ness transforme souvent un adjectif en nom qui désigne une qualité ou un état.',examples:[['happy → happiness','Heureux → bonheur, le y devient i.'],['sad → sadness','Triste → tristesse.'],['kind → kindness','Gentil → gentillesse.'],['weak → weakness','Faible → faiblesse.']],help:['Identifie l’adjectif de départ.','Avec happy, remplace y par i.','Ajoute -ness puis vérifie toutes les lettres.']}
];
function render(root,options={}){
 root.replaceChildren(btn('← Toutes les matières',()=>options.back?.()),el('h2','Anglais — Mes leçons'));
 add(root,'p','1 document ENT vérifié · 2 leçons BIS · 6 exercices de 10 questions.');
 const warning=add(root,'p','Le PDF « The Sounds of Music » est archivé dans le dossier scolaire. Son fichier original n’est pas encore rattaché au lecteur du site ; les textes ci-dessous ne prétendent pas le remplacer.');warning.className='lesson-caution';
 for(const topic of TOPICS){
  const card=el('details');card.className='tim-es-lesson';card.style.cssText='background:#1a2742;border:1px solid #66738a;border-radius:14px;padding:14px;margin:14px 0';
  const summary=add(card,'summary',topic.name);summary.style.cssText='cursor:pointer;font-size:21px;font-weight:800';
  const tabs=el('div'),sheet=el('section');tabs.className='lesson-tabs';sheet.className='panel';card.append(tabs,sheet);
  function openTab(name){
   [...tabs.children].forEach(b=>{b.style.background=b.dataset.tab===name?'#d8fc67':'#34415e';b.style.color=b.dataset.tab===name?'#17223b':'#fff'});
   sheet.replaceChildren();
   if(name==='ent'){
    add(sheet,'h3','Leçon ENT du professeur');
    add(sheet,'p',topic.original?'« The Sounds of Music », PDF du 3 novembre : 2 pages, texte à compléter et neuf activités sur l’évolution de la musique. Il n’y a aucune réponse de Tim dans le PDF.':'Un devoir sur le suffixe -ness est annoncé pour le 6 novembre. La leçon originale du professeur n’est pas fournie : aucun faux cours ENT n’est créé.');
   }
   if(name==='bis'){
    add(sheet,'h3','Leçon BIS — comprendre la règle');
    add(sheet,'p',topic.rule);
    if(topic.original)add(sheet,'p','Frise : work songs → blues (années 1860) → jazz (vers 1900) → rock’n’roll (années 1950) → rap (années 1990).');
    for(const [a,b] of topic.examples){const p=el('p');p.append(el('strong',a+' : '),document.createTextNode(b));sheet.append(p)}
    add(sheet,'h4','Écrire un résultat');
    add(sheet,'p',topic.original?'Question : Where did the first jazz bands appear? Réponse : The first jazz bands appeared in New Orleans. Je reprends le sujet et le verbe, pas seulement le nom de la ville.':'Question : Turn happy into a noun. Réponse : Happiness. Je change le y en i, puis j’ajoute -ness.');
   }
   if(name==='help'){
    add(sheet,'h3','Je n’ai pas compris');
    topic.help.forEach((h,i)=>add(sheet,'p',(i+1)+'. '+h));
    add(sheet,'p','Relis un exemple, explique la méthode à voix haute, puis réponds sans recopier la correction.');
   }
   if(name==='entex'){
    add(sheet,'h3','Exercices ENT originaux');
    if(topic.original){add(sheet,'p','Neuf activités de la feuille du professeur, non transformées artificiellement en une note sur 10.');ENT_ACTIVITIES.forEach(s=>add(sheet,'p',s));}
    else add(sheet,'p','Aucun questionnaire original ENT sur -ness n’est disponible. Les exercices de la rubrique Entraînement sont des créations BIS.');
   }
   if(name==='training'){
    add(sheet,'h3','Entraînement interactif');
    add(sheet,'p','Trois exercices de 10 questions, une tentative par exercice pour Tim. Le Parent peut tester sans enregistrer de note ou d’XP.');
    const nav=el('div'),work=el('div');sheet.append(nav,work);
    for(let i=1;i<=3;i++){
     const id='ENQ_L'+topic.id.slice(-2)+'_0'+i;
     nav.append(btn('Exercice '+i+' — '+['Comprendre les mots','Lire et appliquer','Écrire ses réponses'][i-1],()=>{
      work.replaceChildren();
      if(!window.TIM_ENGLISH_TRAINING?.mount){add(work,'p','Service sécurisé indisponible : l’exercice ne peut pas être validé.');return;}
      window.TIM_ENGLISH_TRAINING.mount(id,work);
     }));
    }
   }
  }
  for(const [id,text] of [['ent','Leçon ENT'],['bis','Leçon BIS'],['help','Je n’ai pas compris'],['entex','Exercices ENT'],['training','Entraînement']]){
   const b=btn(text,()=>openTab(id));b.dataset.tab=id;tabs.append(b);
  }
  openTab('bis');if(options.openLessonId===topic.id||(topic.original&&options.openLessonId==='EN_ENT01'))card.open=true;root.append(card);
 }
 const summary=el('details');summary.className='panel';summary.append(el('summary','Notes et corrections d’anglais'));
 const content=el('div');summary.append(content);summary.addEventListener('toggle',()=>{if(summary.open)window.TIM_ENGLISH_TRAINING?.renderProgress?.(content)});root.append(summary);
}
window.TIM_ENGLISH_PATH={render};
})();