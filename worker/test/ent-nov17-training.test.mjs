import test from 'node:test';
import assert from 'node:assert/strict';
import {frTask,frPublicTask,frTrainingId,gradeFrTask,FR_BANK_VERSION,FR_BANK_TEST} from '../fr-training.mjs';
import {svtTask,svtPublicTask,svtTrainingId,gradeSvtTask,SVT_BANK_VERSION,SVT_BANK_TEST} from '../svt-training.mjs';
import {englishTask,englishPublicTask,englishTrainingId,gradeEnglishTask,ENGLISH_BANK_VERSION,ENGLISH_BANK_TEST} from '../english-training.mjs';
import {TESTABLE} from '../server.mjs';
import {PARENT_UID,TIM_UID} from '../auth.mjs';

// Ne jamais interroger les données réelles ni enregistrer de tentative pendant ces tests.
const NO_DB=new Proxy({}, {get(_,method){return ()=>{throw Error('Lecture ou écriture privée interdite : '+String(method));};}});
const series=[
 ['FRQ_L12_01',frTask,frPublicTask,frTrainingId,gradeFrTask,FR_BANK_VERSION,TESTABLE.previewFrTraining],
 ['FRQ_L12_02',frTask,frPublicTask,frTrainingId,gradeFrTask,FR_BANK_VERSION,TESTABLE.previewFrTraining],
 ['FRQ_L13_01',frTask,frPublicTask,frTrainingId,gradeFrTask,FR_BANK_VERSION,TESTABLE.previewFrTraining],
 ['FRQ_L13_02',frTask,frPublicTask,frTrainingId,gradeFrTask,FR_BANK_VERSION,TESTABLE.previewFrTraining],
 ['SVQ_L08_01',svtTask,svtPublicTask,svtTrainingId,gradeSvtTask,SVT_BANK_VERSION,TESTABLE.previewSvtTraining],
 ['SVQ_L08_02',svtTask,svtPublicTask,svtTrainingId,gradeSvtTask,SVT_BANK_VERSION,TESTABLE.previewSvtTraining],
 ['ENQ_L08_01',englishTask,englishPublicTask,englishTrainingId,gradeEnglishTask,ENGLISH_BANK_VERSION,TESTABLE.previewEnglishTraining]
];
test('Leçons du 16 et 17 novembre : 70 questions, aucun doublon, correction privée',()=>{
 assert.equal(FR_BANK_TEST.allIds().length,26);
 assert.equal(SVT_BANK_TEST.allIds().length,16);
 assert.equal(ENGLISH_BANK_TEST.allIds().length,12);
 assert.equal(new Set(series.map(x=>x[0])).size,7);
 for(const [id,task,publicTask,valid,grade,bankVersion] of series){
  assert.equal(valid(id),true,id);
  const privateTask=task(id),visible=publicTask(id);
  assert.equal(privateTask.questions.length,10,id);
  assert.equal(visible.questions.length,10,id);
  assert.equal(visible.bankVersion,bankVersion,id);
  assert.equal(visible.questions.every(q=>!['right','expected','explanation','accepted','answer'].some(p=>p in q)),true,id);
  const good=privateTask.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const bad=privateTask.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'une réponse délibérément incorrecte 123');
  const success=grade(id,good,bankVersion),failure=grade(id,bad,bankVersion);
  assert.equal(success.score,10,id);
  assert.equal(failure.score,0,id);
  assert.equal(failure.items.length,10,id);
  assert.ok(failure.items.every(q=>q.explanation.length>15&&q.expected),id);
  assert.ok(success.items.every(q=>q.correct),id);
 }
 assert.equal(frTask('FRQ_L14_01'),null);
 assert.equal(svtTask('SVQ_L09_01'),null);
 assert.equal(englishTask('ENQ_L08_02'),null);
});
for(const [id,task,,,grade,version,preview] of series){
 test('Essai Parent sans lecture, écriture, tentative ou XP : '+id,async()=>{
  const correct=task(id).questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const result=await preview(NO_DB,PARENT_UID,{id,answers:correct,bankVersion:version});
  assert.equal(result.score,10);
  assert.equal(result.xp,0);
  assert.equal(result.practice,true);
  assert.equal(result.saved,false);
  await assert.rejects(()=>preview(NO_DB,TIM_UID,{id,answers:correct,bankVersion:version}),e=>e.status===403);
  assert.equal(grade(id,correct,version).score,10);
 });
}
