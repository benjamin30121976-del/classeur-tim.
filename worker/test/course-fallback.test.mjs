import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID,ApiFault} from '../auth.mjs';
const main={lessons:[{id:'L1',title:'Cours',subject:'Mathématiques'}],
 exercises:[{id:'EX1',questions:[{type:'text',q:'Question',right:'solution secrète'}]}]};

test('Tim ne reçoit JAMAIS un faux catalogue complet si les deux listes échouent',async()=>{
 let calls=0;
 const db={get:async path=>path==='content/main'?main:null,
  list:async()=>{calls++;throw Error('firestore-list-error');}};
 await assert.rejects(()=>TESTABLE.courseContent(db,TIM_UID),
  e=>e.status===503&&e.code==='student-course-incomplete');
 assert.equal(calls,6,'essais existants pour une erreur générale, sans boucle infinie');
});
test('Une liste de compléments absente suffit à bloquer un lot partiel',async()=>{
 const db={get:async()=>main,list:async name=>{
  if(name==='lessons')return [{id:'L2',data:{id:'L2',title:'Leçon complémentaire'}}];
  throw Error('firestore-list-error');
 }};
 await assert.rejects(()=>TESTABLE.courseContent(db,TIM_UID),
  e=>e.status===503&&e.code==='student-course-incomplete');
});
test('Le catalogue complet reste accessible et sans bonnes réponses',async()=>{
 const db={get:async()=>main,list:async()=>[]};
 const result=await TESTABLE.courseContent(db,TIM_UID);
 assert.equal(result.additionsIncomplete,false);
 assert.equal(result.content.lessons.length,1);
 assert.equal(result.content.exercises[0].questions[0].right,undefined);
});
test('Le compte Parent ne reçoit pas le catalogue privé de Tim via son API',async()=>{
 const db={get:async()=>main,list:async()=>[]};
 await assert.rejects(()=>TESTABLE.courseContent(db,PARENT_UID),{status:403});
});
test('Quota Google : aucune tentative de relecture excessive, erreur affichable',async()=>{
 let calls=0;
 const db={get:async()=>main,list:async()=>{calls++;throw new ApiFault(503,'firestore-quota-exceeded');}};
 await assert.rejects(()=>TESTABLE.courseContent(db,TIM_UID),
  e=>e.status===503&&e.code==='student-course-incomplete');
 assert.equal(calls,2);
});
test('HTTP 429 : deux appels de liste au maximum, aucune donnée réduite à zéro',async()=>{
 let calls=0;
 const db={get:async()=>main,list:async()=>{calls++;throw new ApiFault(503,'firestore-limit-429');}};
 await assert.rejects(()=>TESTABLE.courseContent(db,TIM_UID),
  e=>e.status===503&&e.code==='student-course-incomplete');
 assert.equal(calls,2);
});
