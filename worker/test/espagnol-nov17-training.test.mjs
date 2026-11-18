import test from 'node:test';
import assert from 'node:assert/strict';
import {spanishEntTask,spanishEntPublicTask,spanishEntTrainingId,gradeSpanishEntTask} from '../spanish-ent-training.mjs';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';

const NO_DB=new Proxy({}, {get(_,method){return ()=>{throw Error('Aucun accès Firestore permis : '+String(method));};}});
const IDs=['ESE_L16_01','ESE_L16_02','ESE_L16_03'];
test('Espagnol du 17 novembre : trois exercices distincts de dix questions',()=>{
 for(const id of IDs){
  assert.equal(spanishEntTrainingId(id),true);
  const task=spanishEntTask(id),publicTask=spanishEntPublicTask(id);
  assert.equal(task.lessonId,'L16');
  assert.equal(task.questions.length,10);
  assert.equal(publicTask.questions.length,10);
  assert.equal(JSON.stringify(publicTask).includes('"expected"'),false);
  assert.equal(JSON.stringify(publicTask).includes('"explanation"'),false);
  assert.equal(JSON.stringify(publicTask).includes('"right"'),false);
  const right=task.questions.map(q=>q.right),help=Array(10).fill(false);
  assert.equal(gradeSpanishEntTask(id,right,help).score,10,id);
  const wrong=task.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'réponse fausse 123');
  assert.equal(gradeSpanishEntTask(id,wrong,help).score,0,id);
  assert.throws(()=>gradeSpanishEntTask(id,right.slice(1),help));
  assert.ok(task.questions.every(q=>q.explanation?.length>=20),id);
 }
 assert.equal(spanishEntTrainingId('ESE_L16_04'),false);
 assert.equal(spanishEntTrainingId('ESE_L15_01'),false);
});
for(const id of IDs){
 test('Espagnol 17 novembre : essai Parent sans requête ni résultat enregistré — '+id,async()=>{
  const t=spanishEntTask(id),answers=t.questions.map(q=>q.right),translationsUsed=Array(10).fill(false);
  const report=await TESTABLE.previewSpanishEntTraining(NO_DB,PARENT_UID,{id,answers,translationsUsed});
  assert.equal(report.score,10);
  assert.equal(report.xp,0);
  assert.equal(report.saved,false);
  assert.equal(report.practice,true);
  assert.equal(report.items.length,10);
  await assert.rejects(()=>TESTABLE.previewSpanishEntTraining(NO_DB,TIM_UID,{id,answers,translationsUsed}),e=>e.status===403);
 });
}
