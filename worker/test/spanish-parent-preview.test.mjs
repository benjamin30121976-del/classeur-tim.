import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {PARENT_UID,TIM_UID} from '../auth.mjs';
const ID='ESE_L01_01';
test('Espagnol : Parent peut lire 10 questions sans correction avant soumission',async()=>{
 const db={get:async()=>null};
 const response=await TESTABLE.getSpanishEntTrainingTask(db,PARENT_UID,{id:ID});
 assert.equal(response.completed,false);
 assert.equal(response.task.questions.length,10);
 assert.equal(JSON.stringify(response.task).includes('"expected"'),false);
 assert.equal(JSON.stringify(response.task).includes('"explanation"'),false);
});
test('Espagnol : essai Parent corrige les 10 questions sans note, XP ni écriture en base',async()=>{
 const calls=[];
 const db={
  get:async key=>{calls.push('read:'+key);return null;},
  commit:async()=>{calls.push('commit');throw Error('L’essai ne doit jamais écrire en base');},
  transaction:async()=>{calls.push('transaction');throw Error('L’essai ne doit pas demander de transaction');}
 };
 const {task}=await TESTABLE.getSpanishEntTrainingTask(db,PARENT_UID,{id:ID});
 const answers=task.questions.map(q=>q.kind==='qcm'?0:'hola');
 const help=Array(10).fill(false);
 const before=calls.length;
 const result=await TESTABLE.previewSpanishEntTraining(db,PARENT_UID,{id:ID,answers,translationsUsed:help});
 assert.equal(calls.length,before,'Le Parent ne consulte même pas le stockage pendant la correction');
 assert.equal(result.practice,true);assert.equal(result.saved,false);
 assert.equal(result.submitted,false);assert.equal(result.xp,0);
 assert.ok(Number.isFinite(result.score)&&result.score>=0&&result.score<=10);
 assert.equal(result.items.length,10);
 assert.ok(result.items.every(item=>typeof item.explanation==='string'&&item.explanation.length>0));
 const again=await TESTABLE.previewSpanishEntTraining(db,PARENT_UID,{id:ID,answers,translationsUsed:help});
 assert.equal(again.practice,true);
 assert.equal(calls.length,before,'Aucun résultat enregistré sur les deux essais du Parent');
 assert.deepEqual(again.items,result.items);
 await assert.rejects(()=>TESTABLE.previewSpanishEntTraining(db,TIM_UID,{id:ID,answers,translationsUsed:help}),e=>e.status===403);
 await assert.rejects(()=>TESTABLE.previewSpanishEntTraining(db,PARENT_UID,{id:ID,answers:answers.slice(1),translationsUsed:help}),e=>e.status===400);
 await assert.rejects(()=>TESTABLE.previewSpanishEntTraining(db,PARENT_UID,{id:'inconnu',answers,translationsUsed:help}),e=>e.status===400);
});
