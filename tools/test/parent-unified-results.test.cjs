'use strict';
/* Test du panneau Parent en mémoire seulement : aucune connexion ni écriture Firebase. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const filename=path.join(__dirname,'../../parent-unified-results.js');
const source=fs.readFileSync(filename,'utf8');
class Node {
 constructor(tag){this.tag=tag;this.className='';this.textContent='';this.children=[];}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=items;}
}
function renderCopy(record,items){
 const window={};
 const code=source.replace('window.TIM_PARENT_UNIFIED={render};','window.TIM_PARENT_UNIFIED={render,renderDetails};');
 assert.notEqual(code,source,'Point de chargement du panneau Parent introuvable');
 vm.runInNewContext(code,{window,document:{createElement:tag=>new Node(tag)},console,setTimeout,clearTimeout});
 const root=new Node('div');
 window.TIM_PARENT_UNIFIED.renderDetails(root,record,items);
 const output=[];
 const walk=n=>{output.push(String(n.textContent||''));for(const child of n.children||[])walk(child);};
 walk(root);
 return output.join('\n');
}
test('0,75/1 reste une réponse partiellement correcte et ne devient pas une erreur entière',()=>{
 const text=renderCopy({score:0.75,total:1,lesson:'Mathématiques'},[{
  question:'Quel est le résultat ?',response:'24 cm',expected:'24 cm',correct:false,
  points:0.75,explanation:'Détailler les étapes.'
 }]);
 assert.match(text,/Réponses partielles : 1/);
 assert.match(text,/Erreurs : 0/);
 assert.match(text,/Réponse partiellement correcte/);
 assert.match(text,/Points attribués : 0,75\/1/);
 assert.doesNotMatch(text,/Réponse incorrecte/);
});
test('le bilan Parent conserve les bonnes réponses et les points déjà enregistrés',()=>{
 const text=renderCopy({score:1,total:1,lesson:'Mathématiques'},[{
  question:'Quel est le périmètre ?',response:'24 cm',expected:'24 cm',correct:true,points:1
 }]);
 assert.match(text,/Réponse de Tim : 24 cm/);
 assert.match(text,/Réponse attendue : 24 cm/);
 assert.match(text,/Points attribués : 1\/1/);
});
test('l export récupère les détails des sept matières, sans consommer de tentative',()=>{
 assert(source.includes("['spanishEnt','physics','physicsEnt','mathEnt','english','svt','hg','fr']"));
 assert(source.includes('safeRead('));
 assert.doesNotMatch(source,/submitTimExercise|deleteDoc|addDoc\(/);
});


test('le Parent voit explicitement si le raisonnement n a pas été évalué automatiquement',()=>{
 const text=renderCopy({score:1,total:1,lesson:'Mathématiques'},[{
  question:'Développe',response:'2x+6',expected:'2x+6',correct:true,points:1,
  reasoning:'2x+3+3',reasoningAssessment:'not-automatically-graded'
 }]);
 assert.match(text,/démarche écrite est conservée sans évaluation automatique/);
});


test('l export produit vraiment un JSON complet pour les sept matières sans toucher à Tim',async()=>{
 class FakeElement {
  constructor(tag){this.tag=tag;this.textContent='';this.className='';this.children=[];this.listeners={};this.value='';}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  setAttribute(){}
  addEventListener(type,callback){this.listeners[type]=callback;}
  remove(){}
  click(){
   if(this.tag==='a'){downloaded=true;return;}
   return this.listeners.click?.();
  }
 }
 const root=new FakeElement('div');
 const ids=[
  'ESE_L14_01','ME_ENT_PROGRAMMES','PCQ_L01_01',
  'ENQ_L01_01','SVQ_L01_01','HGQ_L01_01','FRQ_L01_01'
 ];
 const result=(id)=>({
  id,submittedAt:'2026-11-14T12:00:00.000Z',score:1,total:1,xp:0,
  items:[{question:'Question fictive',response:'oui',expected:'oui',correct:true,points:1}]
 });
 const progress=(id)=>id?Promise.resolve({attempt:result(id)}):
  Promise.resolve({attempts:ids.filter(x=>x!==''&&x).map(x=>({id:x,submittedAt:'2026-11-14T12:00:00.000Z',score:1,total:1}))});
 const only=prefix=>(id)=>id?Promise.resolve({attempt:result(id)}):
  Promise.resolve({attempts:ids.filter(x=>x.startsWith(prefix)).map(x=>({id:x,submittedAt:'2026-11-14T12:00:00.000Z',score:1,total:1}))});
 const empty=async()=>({attempts:[]});
 const bridge={
  spanishEntTrainingProgress:only('ESE_'),
  mathTrainingProgress:empty,
  trainingProgress:empty,
  parentReport:async()=>({attempts:[]}),
  physicsTrainingProgress:only('PCQ_'),
  englishTrainingProgress:only('ENQ_'),
  svtTrainingProgress:only('SVQ_'),
  hgTrainingProgress:only('HGQ_'),
  frTrainingProgress:only('FRQ_'),
  physicsEntProgress:empty,
  mathEntProgress:only('ME_ENT_')
 };
 let exported=null,downloaded=false;
 const window={
  __TIM_PARENT:true,__TIM_BRIDGE:bridge,__TIM_DATA:{exercises:[],lessons:[]},
  __CLOUD_ATTEMPTS:[{
   id:'TIMBONUSPERIM20261114',title:'Périmètres',date:'2026-11-14T12:30:00.000Z',
   score:1,total:1,xp:0,answers:[{question:'Exercice fictif',response:'24 cm',expected:'24 cm',correct:true,points:1}]
  }]
 };
 const document={createElement:tag=>new FakeElement(tag),body:new FakeElement('body')};
 const URL={createObjectURL(blob){exported=blob;return 'blob:unit-test';},revokeObjectURL(){}};
 vm.runInNewContext(source,{window,document,Blob,URL,console,setTimeout,clearTimeout});
 window.TIM_PARENT_UNIFIED.render(root);
 await new Promise(resolve=>setImmediate(resolve));
 const find=node=>{
  if(node.tag==='button'&&node.textContent.includes('Exporter le bilan complet'))return node;
  for(const child of node.children){
   const found=find(child);if(found)return found;
  }
  return null;
 };
 const button=find(root);
 assert.ok(button,'Le bouton Exporter n est pas présent');
 await button.click();
 assert.equal(downloaded,true);
 assert.ok(exported instanceof Blob);
 const payload=JSON.parse(await exported.text());
 assert.equal(payload.records.length,8,'Sept matières et bonus doivent être conservés');
 for(const record of payload.records){
  assert.equal(record.questions.length,1,'Copie non exportée : '+record.id);
  assert.equal(record.questions[0].response,'oui'===record.questions[0].response?'oui':'24 cm');
 }
 assert.deepEqual([...new Set(payload.records.map(x=>x.subject))].sort(),[
  'Anglais','Espagnol','Français','Histoire-géographie',
  'Mathématiques','Physique-chimie','SVT'
 ].sort());
});
