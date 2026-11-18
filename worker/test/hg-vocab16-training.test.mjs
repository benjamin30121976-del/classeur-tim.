import test from 'node:test';
import assert from 'node:assert/strict';
import {HG_BANK_TEST,HG_BANK_VERSION,hgTask,hgPublicTask,hgTrainingId,gradeHgTask} from '../hg-training.mjs';
import {TESTABLE} from '../server.mjs';
import {PARENT_UID,TIM_UID} from '../auth.mjs';

const id='HGQ_L09_03';
const noDb=new Proxy({}, {get(_,property){return ()=>{throw Error('Test sans accès Firestore '+String(property));};}});
test('Devoir ENT du 16 novembre : cinq définitions, dix questions pédagogiques, sans exposer les réponses',()=>{
 assert.equal(HG_BANK_TEST.allIds().length,19);
 assert.equal(hgTrainingId(id),true);
 assert.equal(hgTrainingId('HGQ_L08_03'),false);
 const privateTask=hgTask(id),publicTask=hgPublicTask(id);
 assert.equal(privateTask.lessonId,'HG_BIS09');
 assert.equal(privateTask.questions.length,10);
 assert.equal(publicTask.questions.length,10);
 assert.equal(privateTask.questions.filter(x=>x.kind==='qcm').length,5);
 assert.equal(privateTask.questions.filter(x=>x.kind==='text').length,5);
 for(const q of publicTask.questions){
  assert.ok(q.prompt.length>12);
  assert.ok(!('expected' in q)&&!('explanation' in q)&&!('right' in q));
 }
 const all=privateTask.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
 const bad=privateTask.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'incorrect 123');
 const right=gradeHgTask(id,all,HG_BANK_VERSION),wrong=gradeHgTask(id,bad,HG_BANK_VERSION);
 assert.equal(right.score,10);
 assert.equal(wrong.score,0);
 assert.ok(wrong.items.every(q=>!q.correct&&q.expected&&q.explanation.length>=25));
});
test('Devoir ENT du 16 novembre : simulation Parent sans lecture, note, XP ni copie',async()=>{
 const task=hgTask(id),answers=task.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
 const preview=await TESTABLE.previewHgTraining(noDb,PARENT_UID,{id,answers,bankVersion:HG_BANK_VERSION});
 assert.equal(preview.practice,true);
 assert.equal(preview.saved,false);
 assert.equal(preview.xp,0);
 assert.equal(preview.score,10);
 assert.equal(preview.items.length,10);
 await assert.rejects(()=>TESTABLE.previewHgTraining(noDb,TIM_UID,{id,answers,bankVersion:HG_BANK_VERSION}),e=>e.status===403);
});
