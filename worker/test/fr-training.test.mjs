import test from 'node:test';
import assert from 'node:assert/strict';
import {FR_BANK_TEST,FR_BANK_VERSION,frTask,frPublicTask,gradeFrTask,frTrainingId} from '../fr-training.mjs';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
import {fromFields} from '../firestore.mjs';

function sampleDb(){
 const data=new Map();
 return {data,
  async get(path){return data.get(path)||null;},
  async list(col){return [...data.entries()].filter(([p])=>p.startsWith(col+'/'))
   .map(([p,v])=>({id:p.slice(col.length+1),data:v}));},
  async transaction(){return {};},
  async commit(writes){
   for(const w of writes){
    const path=w.update.name.split('/documents/')[1];
    if(w.currentDocument?.exists===false&&data.has(path))throw Error('already-exists');
    const value=fromFields(w.update.fields);
    if(w.updateTransforms?.some(x=>x.fieldPath==='submittedAt'))value.submittedAt=new Date().toISOString();
    data.set(path,value);
   }
  }
 };
}

test('FR : 11 leçons, 22 exercices, 220 questions et réponses masquées',()=>{
 const ids=FR_BANK_TEST.allIds();
 assert.equal(ids.length,22);
 assert.equal(new Set(ids).size,22);
 for(const id of ids){
  assert.ok(frTrainingId(id));
  const t=frTask(id),pub=frPublicTask(id);
  assert.equal(t.questions.length,10);
  assert.equal(pub.questions.length,10);
  assert.equal(pub.bankVersion,FR_BANK_VERSION);
  assert.equal(t.lessonId,'FR_BIS'+id.slice(5,7));
  assert.equal(pub.questions.every(q=>!['right','expected','explanation','accepted','answer'].some(k=>k in q)),true);
  for(const q of t.questions){
   assert.ok(q.prompt.length>=12,id);
   assert.ok(q.explanation.length>=15,id);
   if(q.kind==='qcm')assert.equal(new Set(q.choices).size,4);
   else assert.ok(q.accepted.includes(q.expected));
  }
 }
 assert.equal(frTrainingId('FRQ_L01_03'),false);
 assert.equal(frTrainingId('FRQ_L12_01'),false);
 assert.equal(frPublicTask('FRQ_L12_01'),null);
});

test('FR : les 220 bonnes réponses donnent 10/10 et les 220 fausses 0/10',()=>{
 for(const id of FR_BANK_TEST.allIds()){
  const task=frTask(id);
  const correct=task.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const wrong=task.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'réponse totalement fausse');
  const success=gradeFrTask(id,correct,FR_BANK_VERSION);
  const failure=gradeFrTask(id,wrong,FR_BANK_VERSION);
  assert.equal(success.score,10,id);
  assert.equal(failure.score,0,id);
  assert.equal(success.items.length,10);
  assert.equal(failure.items.length,10);
  assert.ok(success.items.every(x=>x.correct&&x.explanation));
  assert.ok(failure.items.every(x=>!x.correct&&x.expected&&x.explanation.includes(x.expected)));
 }
});

test('FR : tentative Tim enregistrée une seule fois, note et corrigé lisibles pour Tim et Parent',async()=>{
 const db=sampleDb(),id='FRQ_L07_01',task=frTask(id);
 const answers=task.questions.map(q=>q.right);
 const before=await TESTABLE.getFrTrainingTask(db,TIM_UID,{id});
 assert.equal(before.completed,false);
 assert.ok(!JSON.stringify(before).includes('"right"'));
 const result=await TESTABLE.submitFrTraining(db,TIM_UID,{id,answers,bankVersion:FR_BANK_VERSION});
 assert.equal(result.submitted,true);
 assert.equal(result.score,10);
 assert.equal(result.xp,1);
 const note=await TESTABLE.getFrTrainingProgress(db,PARENT_UID,{id});
 assert.equal(note.attempt.score,10);
 assert.equal(note.attempt.items.length,10);
 assert.equal((await TESTABLE.getFrTrainingTask(db,TIM_UID,{id})).completed,true);
 assert.equal((await TESTABLE.getFrTrainingProgress(db,PARENT_UID,{})).attempts.length,1);
 await assert.rejects(()=>TESTABLE.submitFrTraining(db,TIM_UID,{id,answers,bankVersion:FR_BANK_VERSION}),e=>e.status===409);
 await assert.rejects(()=>TESTABLE.submitFrTraining(db,PARENT_UID,{id:'FRQ_L07_02',answers,bankVersion:FR_BANK_VERSION}),e=>e.status===403);
 await assert.rejects(()=>TESTABLE.getFrTrainingProgress(db,'visiteur',{}),e=>e.status===403);
});

test('FR : essai Parent intégral et erroné, 0 écriture, 0 XP',async()=>{
 const db=sampleDb(),id='FRQ_L03_02',task=frTask(id);
 const answers=task.questions.map(q=>q.expected);
 const preview=await TESTABLE.previewFrTraining(db,PARENT_UID,{id,answers,bankVersion:FR_BANK_VERSION});
 assert.equal(preview.score,10);assert.equal(preview.practice,true);assert.equal(preview.saved,false);
 assert.equal(preview.xp,0);assert.equal(db.data.size,0);
 const wrong=await TESTABLE.previewFrTraining(db,PARENT_UID,{id,answers:answers.map(()=>'faux'),bankVersion:FR_BANK_VERSION});
 assert.equal(wrong.score,0);assert.equal(db.data.size,0);
 assert.equal((await TESTABLE.getFrTrainingTask(db,TIM_UID,{id})).completed,false);
 await assert.rejects(()=>TESTABLE.previewFrTraining(db,TIM_UID,{id,answers,bankVersion:FR_BANK_VERSION}),e=>e.status===403);
});

test('FR : données incohérentes ou version périmée ne consomment aucune tentative',async()=>{
 const db=sampleDb(),id='FRQ_L01_01',task=frTask(id),answers=task.questions.map(q=>q.right);
 await assert.rejects(()=>TESTABLE.submitFrTraining(db,TIM_UID,{id,answers:answers.slice(0,9),bankVersion:FR_BANK_VERSION}),e=>e.status===400);
 await assert.rejects(()=>TESTABLE.submitFrTraining(db,TIM_UID,{id,answers,bankVersion:'fr-ancien'}),e=>e.status===409);
 assert.equal(db.data.size,0);
});

test('FR : accord du participe passé, variantes et refus des erreurs',()=>{
 const id='FRQ_L07_02',task=frTask(id),answers=task.questions.map(q=>q.expected);
 const a=task.questions.findIndex(q=>q.expected==='mise');
 assert.ok(a>=0);
 assert.equal(gradeFrTask(id,answers,FR_BANK_VERSION).score,10);
 answers[a]='mis';
 assert.equal(gradeFrTask(id,answers,FR_BANK_VERSION).score,9);
 answers[a]='mise.';
 assert.equal(gradeFrTask(id,answers,FR_BANK_VERSION).score,10);
});
