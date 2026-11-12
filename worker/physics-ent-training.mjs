/* Exercices ENT de physique-chimie : TRANSCRIPTION fidèle de deux fiches originales,
   observées en PDF et conservées privées sur les comptes Tim et Parent.
   2026-09-29 : "Préparation au contrôle n°1 : Atomes, ions et molécules", 8 lignes,
      10 réponses quand on sépare les sous-questions de Mg²⁺ et des deux formules.
   2026-10-06 / 2026-11-05 : "Chapitre 1 tableau molécules", 7 lignes,
      dont CH4 déjà imprimé et modèle N2O déjà imprimé.
   Ne pas ajouter d'exercices de manuel sans les vrais énoncés.
   La clé de correction demeure ici, dans le WORKER (jamais chargée par le navigateur). */
export const PHYSICS_ENT_VERSION='pc-ent-20261112-v1';
export const PHYSICS_ENT_IDS=['PC_ENT_CTRL1','PC_ENT_MOLECULES'];
export const physicsEntId=x=>PHYSICS_ENT_IDS.includes(x);

const FORM=[
 ['noyau',1,'Quelles sont les particules présentes dans le noyau de l’atome ?','protons et neutrons','Le noyau contient des protons positifs et des neutrons neutres.','noyau'],
 ['electron',2,'Quelle est la charge d’un électron ?','négative','L’électron porte une charge électrique négative (−).','electron'],
 ['sodium',3,'Un atome de sodium Na possède 11 protons. Combien a-t-il d’électrons ?','11','Un atome neutre contient autant d’électrons que de protons : 11.','sodium'],
 ['carbone',4,'Écris la notation symbolique de l’atome de carbone contenant 6 protons et 6 neutrons.','¹²₆C','A = 6 + 6 = 12 ; Z = 6 ; symbole C, donc ¹²₆C.','carbone'],
 ['fluorure',5,'Comment obtient-on un ion fluorure F⁻ à partir de l’atome de fluor ?','en gagnant un électron','L’ion F⁻ a un électron négatif de plus que l’atome de fluor neutre.','fluorure'],
 ['magnesium_perte',6,'L’ion Mg²⁺ possède 12 charges positives. Combien a-t-il gagné ou perdu d’électrons ?','perdu 2 électrons','Mg²⁺ porte +2 : l’atome neutre a perdu deux électrons.','magnesium_perte'],
 ['magnesium_neg',6,'Combien possède-t-il de charges négatives ? (ion Mg²⁺ avec 12 charges positives)','10','Magnésium : 12 charges positives, charge totale +2, donc 10 électrons négatifs.','magnesium_neg'],
 ['glucose',7,'Le glucose a pour formule C₆H₁₂O₆. Quels sont les atomes présents dans la molécule ?','carbone, hydrogène et oxygène','C signifie carbone, H signifie hydrogène, O signifie oxygène.','glucose'],
 ['dioxyde',8,'Quelle est la formule chimique du dioxyde de carbone ?','CO₂','Une molécule de dioxyde de carbone contient 1 carbone et 2 oxygènes : CO₂.','formula'],
 ['eau',8,'Quelle est la formule chimique de l’eau ?','H₂O','Une molécule d’eau contient 2 hydrogènes et 1 oxygène : H₂O.','formula']
];
const MOLECULES=[
 {id:'eau',name:'Eau',formula:'H2O'},
 {id:'dioxygene',name:'Dioxygène',formula:'O2'},
 {id:'diazote',name:'Diazote',formula:'N2'},
 {id:'dihydrogene',name:'Dihydrogène',formula:'H2'},
 {id:'dioxyde_carbone',name:'Dioxyde de carbone',formula:'CO2'},
 {id:'methane',name:'Méthane',formula:'CH4',printedFormula:true},
 {id:'protoxyde_azote',name:'Protoxyde d’azote',formula:'N2O',printedModel:true}
];
const normalize=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .replace(/[−–—]/g,'-').replace(/[₂]/g,'2').replace(/[₃]/g,'3').replace(/[₄]/g,'4')
 .replace(/[₆]/g,'6').replace(/[₁]/g,'1').replace(/[¹]/g,'1').replace(/[²]/g,'2')
 .replace(/[⁶]/g,'6').replace(/[⁰]/g,'0').replace(/[\s\u00a0]/g,'').toLowerCase().trim();
function cleanFormula(s){return normalize(s).replace(/[^a-z0-9]/g,'');}
function formulaCounts(input){
 const s=String(input??'').replace(/[\s,;|]/g,'').replace(/([HCON])₁/g,'$11')
  .replaceAll('₂','2').replaceAll('₃','3').replaceAll('₄','4').replaceAll('₆','6');
 if(!s||s.length>60)return null;
 const counts={H:0,C:0,O:0,N:0};let cursor=0;
 for(const m of s.matchAll(/(H|C|O|N)(\d{0,2})/g)){
  if(m.index!==cursor)return null;
  cursor+=m[0].length;
  let n=m[2]?Number(m[2]):1;
  if(n<1||n>16)return null;
  counts[m[1]]+=n;
 }
 if(cursor!==s.length)return null;
 return counts;
}
function sameCounts(a,b){
 const x=formulaCounts(a),y=formulaCounts(b);return Boolean(x&&y&&['C','H','N','O'].every(k=>x[k]===y[k]));
}
function gradeForm(row,answer){
 const value=normalize(answer);
 switch(row[5]){
 case 'noyau':return value.includes('proton')&&value.includes('neutron')&&!value.includes('electron');
 case 'electron':return ['negative','negatif','-','-1','moins','chargenegative','charge-'].includes(value);
 case 'sodium':return /^(11|onze)(electrons?)?$/.test(value);
 case 'carbone':{
  // Plusieurs notations sont acceptées : ¹²₆C, 12/6C, C A=12 Z=6.
  const v=normalize(answer).replace(/[^a-z0-9]/g,'');
  return /^(126c|c126|c12z6|a12z6c|cza126|ca12z6|cz6a12|z6a12c|c612)$/.test(v)||
   (/(^|[^a-z])c($|[^a-z])/.test(String(answer).toLowerCase())&&/a\s*[:=]\s*12/i.test(answer)&&/z\s*[:=]\s*6/i.test(answer));
 }
 case 'fluorure':return (value.includes('gagn')||value.includes('capt')||value.includes('recoi')||value.includes('ajout'))&&
  (value.includes('electron')||value.includes('e-'))&&!value.includes('perd')&&!value.includes('deux');
 case 'magnesium_perte':return (value.includes('perd')||value.includes('retir')||value.includes('enlev'))&&
  (value.includes('2')||value.includes('deux'))&&(value.includes('electron')||value.includes('e-'))&&!value.includes('gagn');
 case 'magnesium_neg':return /^(10|dix)(electrons?|charges?negatives?)?$/.test(value);
 case 'glucose':{
  const v=value.replace(/[^a-z]/g,'');
  const words=['carbone','hydrogene','oxygene'].every(k=>v.includes(k));
  const stripped=v.replace(/carbone|hydrogene|oxygene|et|de|atomes/g,'');
  return (words&&!stripped)||['cho','coh','hoc','hco','och','ohc'].includes(v)||
    /^(c,h,o|c;h;o|c-h-o)$/i.test(String(answer).replace(/\s/g,''));
 }
 case 'formula':return cleanFormula(answer)===cleanFormula(row[3]);
 }
 return false;
}
function modelFormat(s){return formulaCounts(s);}
function task(id){
 if(id==='PC_ENT_CTRL1'){
  return {
   id,type:'formative',title:'Préparation au contrôle n°1 — Atomes, ions et molécules',
   source:'Fiche du professeur : Évaluation formative, contrôle n°1',
   document:{target:'PCENT6390168',fileName:'Eval formative controle 2 el.pdf',page:1},
   date:'2026-09-29',bankVersion:PHYSICS_ENT_VERSION,total:10,
   scale:'10 réponses, chacune vaut 1 point.',
   fields:FORM.map(([id,group,label])=>({id,group,label,kind:'text',placeholder:id==='carbone'?'Ex. : ¹²₆C ou C, A=12, Z=6':'Écris ta réponse ici'}))
  };
 }
 if(id==='PC_ENT_MOLECULES'){
  const fields=[];
  for(const [i,m] of MOLECULES.entries()){
   if(!m.printedFormula)fields.push({id:m.id+'_formula',group:i+1,kind:'formula',label:'Formule de la molécule : '+m.name,placeholder:'Ex. : H2O'});
   if(!m.printedModel)fields.push({id:m.id+'_model',group:i+1,kind:'model',label:'Construis le modèle : '+m.name,atoms:['H','C','N','O']});
  }
  return {
   id,type:'molecule-table',title:'Chapitre 1 — Tableau des molécules',
   source:'Tableau à compléter du professeur (6 octobre et 5 novembre)',
   document:{target:'PCENT6390201',fileName:'Chapitre 1 tableau molecules.pdf',page:1},
   date:'2026-10-06',bankVersion:PHYSICS_ENT_VERSION,total:10,
   scale:'12 cases à compléter. Chaque case vaut 1/12 du total, note arrondie sur 10.',
   molecules:MOLECULES.map(m=>({id:m.id,name:m.name,
    ...(m.printedFormula?{printedFormula:'CH₄'}:{}),
    ...(m.printedModel?{printedModel:'2 N (bleu) + 1 O (rouge)'}:{})})),
   fields
  };
 }
 return null;
}
export function physicsEntPublicTask(id){return task(id);}
export function physicsEntGrade(id,answers,version){
 if(version!==PHYSICS_ENT_VERSION||!physicsEntId(id)||!Array.isArray(answers))
  throw Error('invalid-ent-task');
 const publicTask=task(id);
 if(answers.length!==publicTask.fields.length)throw Error('invalid-answer-count');
 if(answers.some(v=>typeof v!=='string'||v.length>160||!v.trim()))throw Error('missing-answer');
 let items;
 if(id==='PC_ENT_CTRL1'){
  items=FORM.map((row,i)=>({
   questionIndex:i,group:row[1],kind:'text',prompt:row[2],response:answers[i],
   expected:row[3],correct:gradeForm(row,answers[i]),explanation:row[4]
  }));
 }else{
  const map=new Map(MOLECULES.map(m=>[m.id,m]));
  items=publicTask.fields.map((f,i)=>{
   const m=map.get(f.id.slice(0,-(f.kind==='model'?6:8)));
   if(!m)throw Error('unknown-molecule');
   const expected=m.formula,answer=answers[i];
   const correct=f.kind==='formula'?sameCounts(answer,expected):sameCounts(answer,expected);
   return {questionIndex:i,group:f.group,kind:f.kind,prompt:f.label,
    response:answer,expected:expected,correct,
    explanation:f.kind==='formula'
     ?'La formule indique la composition de '+m.name+' : '+expected+'.'
     :'Le modèle de '+m.name+' possède exactement les atomes de '+expected+' (H blanc, C noir, N bleu, O rouge).'};
  });
 }
 const correct=items.filter(x=>x.correct).length;
 const score=Math.round(correct/items.length*10);
 return {
  id,type:publicTask.type,title:publicTask.title,subject:'Physique-chimie',
  source:publicTask.source,bankVersion:PHYSICS_ENT_VERSION,
  score,total:10,correctFields:correct,fieldCount:items.length,
  scale:publicTask.scale,items,
  xp:0,lessonToReview:correct===items.length?null:'PC_BIS'+(id==='PC_ENT_MOLECULES'?'03':'01'),
  errorCounts:correct===items.length?{}:{[id]:items.length-correct}
 };
}
