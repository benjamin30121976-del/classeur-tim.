/* Valide l'encart des corrections sans ouvrir Firebase ni toucher à Tim. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('boot.js','utf8');
const start=source.indexOf("  const refreshCorrections=async()=>{",source.indexOf("panel.id='parent-corrections'"));
const stop=source.indexOf("  refreshCorrections();",start);
assert.ok(start>0 && stop>start,'Le suivi Parent n’a pas été retrouvé.');
const code=source.slice(start,stop);
function node(type='div'){
 const n={type,children:[],style:{},textContent:'',disabled:false,
  append(...parts){this.children.push(...parts);},
  replaceChildren(...parts){this.children=[...parts];}};
 return n;
}
async function run({publicDocs=[],privateDocs=[],serviceOk=false,readAllowed=true}={}){
 const status=node('p'),list=node('div'),panel={querySelector(selector){
  if(selector==='#pending-corrections-status')return status;
  if(selector==='#pending-corrections-list')return list;
  throw Error('Unexpected selector: '+selector);
 }};
 const docs=rows=>({docs:rows.map(d=>({id:d.id,data:()=>d}))});
 const ctx={
  panel,document:{createElement:node},
  window:{__TIM_DATA:{exercises:[{id:'MATH_A',title:'Calculs en mathématiques'},{id:'SVT_B',title:'Cellules en SVT'}]},
   TIM_SPANISH_EDU:{L01:{name:'Se présenter'}},
   TIM_SPANISH_TRAINING_ENGINE:{buildSpanishTasks:()=>({questions:[{type:'mc',choices:['autre choix','autre réponse',"je m'appelle",'aucun']} ]})}},
  functionsApi:{},collection:(_db,path)=>path,db:{},
  doc:(_db,path,id)=>({path,id}),
  getDoc:async({path,id})=>{
   const data=(path==='privateAttempts'?privateDocs:publicDocs).find(x=>x.id===id);
   return {exists:()=>Boolean(data),data:()=>data};
  },
  cloudCallable:name=>async()=>{
   if(name==='getParentReport'&&serviceOk)return {data:{attempts:publicDocs.map(x=>({...x,title:x.title||x.id,correctionStatus:x.correctionStatus||'pending-parent'}))}};
   throw Error('functions/not-found');
  },
  httpsCallable:(_api,name)=>async()=>{
   if(name==='getParentReport'&&serviceOk)return {data:{attempts:publicDocs.map(x=>({...x,title:x.title||x.id,correctionStatus:x.correctionStatus||'pending-parent'}))}};
   throw Error('functions/not-found');
  },
  getDocs:async path=>{
   if(!readAllowed)throw Object.assign(Error('permission-denied'),{code:'permission-denied'});
   if(path==='attempts')return docs(publicDocs);
   if(path==='privateAttempts')return docs(privateDocs);
   throw Error('Unexpected collection');
  },console,alert:()=>{throw Error('No alert expected')},Promise,Map,String,Number
 };
 await vm.runInNewContext('(async()=>{'+code+'await refreshCorrections();})()',ctx);
 function allText(n){return [n.textContent,...n.children.map(allText)].join('\n');}
 function actions(n){return [n,...n.children.flatMap(actions)].filter(x=>x.type==='button');}
 return {text:allText(status)+'\n'+allText(list),buttons:actions(list),allText:()=>allText(list)};
}
test('Sans devoir, la lecture Firestore remplace le message trompeur',async()=>{
 const x=await run();
 assert.match(x.text,/0 devoir\(s\) en attente/);
 assert.match(x.text,/Consultation des résultats : disponible via Firebase/);
 assert.doesNotMatch(x.text,/Suivi indisponible : fonctions Firebase/);
 assert.equal(x.buttons.length,1,'Seul Actualiser doit être proposé');
});
test('Notes Maths et SVT accessibles, sans bouton de déblocage non opérationnel',async()=>{
 const x=await run({
  publicDocs:[{id:'MATH_A',correctionStatus:'pending-parent'},{id:'SVT_B',correctionStatus:'released'}],
  privateDocs:[{id:'MATH_A',score:8,total:10},{id:'SVT_B',score:6,total:10}]
 });
 assert.match(x.text,/Calculs en mathématiques · 8\/10/);
 assert.match(x.text,/Cellules en SVT · 6\/10/);
 assert.match(x.text,/1 devoir\(s\) en attente/);
 assert.equal(x.buttons.length,3,'Deux boutons pour ouvrir les copies et un bouton Actualiser');
});
test('En cas de double refus, aucun succès fictif',async()=>{
 const x=await run({readAllowed:false});
 assert.match(x.text,/Lecture des résultats Firebase indisponible/);
 assert.doesNotMatch(x.text,/Consultation des résultats : disponible/);
});
test('Si le backend fonctionne, les boutons de correction demeurent',async()=>{
 const x=await run({serviceOk:true,publicDocs:[{id:'MATH_A',score:8,total:10}]});
 assert.match(x.text,/1 devoir\(s\) en attente/);
 assert.equal(x.buttons.length,3);
 assert.match(x.buttons[0].textContent,/Débloquer/);
 assert.match(x.buttons[1].textContent,/Voir la copie/);
});

test('Le Parent ouvre une copie espagnole sans rejouer le QCM',async()=>{
 const x=await run({serviceOk:true,
  publicDocs:[{id:'SPQ_L01_01',title:'QCM 1 — Se présenter',score:10,total:10,correctionStatus:'pending-parent'}],
  privateDocs:[{id:'SPQ_L01_01',score:10,total:10,answers:[{question:'Que signifie me llamo ?',response:'2',correct:true,expected:"je m'appelle"}]}]
 });
 assert.match(x.text,/Espagnol · Se présenter/);
 assert.match(x.text,/QCM 1 · 10\/10/);
 const view=x.buttons.find(b=>/Voir la copie/.test(b.textContent));
 assert.ok(view,'Le bouton de lecture doit apparaître');
 await view.onclick();
 assert.match(x.allText(),/Que signifie me llamo/);
 assert.match(x.allText(),/Réponse de Tim : je m'appelle/);
 assert.match(x.allText(),/Bonne réponse/);
 assert.doesNotMatch(x.allText(),/Valider définitivement/);
});
