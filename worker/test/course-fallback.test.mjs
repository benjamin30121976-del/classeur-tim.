import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
const main={lessons:[{id:'L1',title:'Cours',subject:'Mathématiques'}],
 exercises:[{id:'EX1',questions:[{type:'text',q:'Question',right:'solution secrète'}]}]};
test('Tim peut ouvrir ses cours même si Firestore refuse les listes de compléments',async()=>{
 let listCalls=0;
 const db={get:async(path)=>path==='content/main'?main:null,
  list:async()=>{listCalls++;throw Error('firestore-list-error');}};
 const result=await TESTABLE.courseContent(db,TIM_UID);
 assert.equal(result.additionsIncomplete,true);
 assert.deepEqual(result.additions,{lessons:[],exercises:[]});
 assert.equal(result.content.lessons.length,1);
 assert.equal(result.content.exercises[0].questions[0].right,undefined);
 assert.equal(listCalls,6);
});
test('Tim conserve les compléments disponibles quand une liste échoue',async()=>{
 const db={get:async()=>main,list:async name=>{
  if(name==='lessons')return [{id:'L2',data:{id:'L2',title:'Leçon complémentaire'}}];
  throw Error('firestore-list-error');
 }};
 const result=await TESTABLE.courseContent(db,TIM_UID);
 assert.equal(result.additionsIncomplete,true);
 assert.equal(result.additions.lessons[0].title,'Leçon complémentaire');
 assert.deepEqual(result.additions.exercises,[]);
});
test('Les cours complets ne déclenchent pas d’avertissement',async()=>{
 const db={get:async()=>main,list:async()=>[]};
 const result=await TESTABLE.courseContent(db,TIM_UID);
 assert.equal(result.additionsIncomplete,false);
});
test('Un compte non Tim ne peut pas charger le contenu Tim',async()=>{
 const db={get:async()=>main,list:async()=>[]};
 await assert.rejects(()=>TESTABLE.courseContent(db,PARENT_UID),{status:403});
});
