import test from 'node:test';
import assert from 'node:assert/strict';
import {SVT_BANK_TEST,SVT_BANK_VERSION,svtTask,svtPublicTask,gradeSvtTask,svtTrainingId} from '../svt-training.mjs';
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

test('SVT : 7 leçons, 14 exercices, 140 questions et réponses masquées',()=>{
 const ids=SVT_BANK_TEST.allIds();
 assert.equal(ids.length,14);
 assert.equal(new Set(ids).size,14);
 for(const id of ids){
  assert.ok(svtTrainingId(id));
  const t=svtTask(id),pub=svtPublicTask(id);
  assert.equal(t.questions.length,10);
  assert.equal(pub.questions.length,10);
  assert.equal(pub.bankVersion,SVT_BANK_VERSION);
  assert.equal(t.lessonId,'SVT_BIS'+id.slice(5,7));
  assert.equal(pub.questions.every(q=>!['right','expected','explanation','accepted','answer'].some(k=>k in q)),true);
  for(const q of t.questions){
   assert.ok(q.prompt.length>=12,id);
   assert.ok(q.explanation.length>=15,id);
   if(q.kind==='qcm')assert.equal(new Set(q.choices).size,4);
   else assert.ok(q.accepted.includes(q.expected));
  }
 }
 assert.equal(svtTrainingId('SVQ_L01_03'),false);
 assert.equal(svtTrainingId('SVQ_L08_01'),false);
 assert.equal(svtPublicTask('SVQ_L08_01'),null);
});

test('SVT : les 140 bonnes réponses donnent 10/10 et les 140 fausses 0/10',()=>{
 for(const id of SVT_BANK_TEST.allIds()){
  const task=svtTask(id);
  const correct=task.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const wrong=task.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'réponse totalement fausse');
  const success=gradeSvtTask(id,correct,SVT_BANK_VERSION);
  const failure=gradeSvtTask(id,wrong,SVT_BANK_VERSION);
  assert.equal(success.score,10,id);
  assert.equal(failure.score,0,id);
  assert.equal(success.items.length,10);
  assert.equal(failure.items.length,10);
  assert.ok(success.items.every(x=>x.correct&&x.explanation));
  assert.ok(failure.items.every(x=>!x.correct&&x.expected&&x.explanation.includes(x.expected)));
 }
});

test('SVT : tentative Tim enregistrée une seule fois, note et corrigé lisibles pour Tim et Parent',async()=>{
 const db=sampleDb(),id='SVQ_L07_01',task=svtTask(id);
 const answers=task.questions.map(q=>q.right);
 const before=await TESTABLE.getSvtTrainingTask(db,TIM_UID,{id});
 assert.equal(before.completed,false);
 assert.ok(!JSON.stringify(before).includes('"right"'));
 const result=await TESTABLE.submitSvtTraining(db,TIM_UID,{id,answers,bankVersion:SVT_BANK_VERSION});
 assert.equal(result.submitted,true);
 assert.equal(result.score,10);
 assert.equal(result.xp,1);
 const note=await TESTABLE.getSvtTrainingProgress(db,PARENT_UID,{id});
 assert.equal(note.attempt.score,10);
 assert.equal(note.attempt.items.length,10);
 assert.equal((await TESTABLE.getSvtTrainingTask(db,TIM_UID,{id})).completed,true);
 assert.equal((await TESTABLE.getSvtTrainingProgress(db,PARENT_UID,{})).attempts.length,1);
 await assert.rejects(()=>TESTABLE.submitSvtTraining(db,TIM_UID,{id,answers,bankVersion:SVT_BANK_VERSION}),e=>e.status===409);
 await assert.rejects(()=>TESTABLE.submitSvtTraining(db,PARENT_UID,{id:'SVQ_L07_02',answers,bankVersion:SVT_BANK_VERSION}),e=>e.status===403);
 await assert.rejects(()=>TESTABLE.getSvtTrainingProgress(db,'visiteur',{}),e=>e.status===403);
});

test('SVT : essai Parent intégral et erroné, 0 écriture, 0 XP',async()=>{
 const db=sampleDb(),id='SVQ_L03_02',task=svtTask(id);
 const answers=task.questions.map(q=>q.expected);
 const preview=await TESTABLE.previewSvtTraining(db,PARENT_UID,{id,answers,bankVersion:SVT_BANK_VERSION});
 assert.equal(preview.score,10);assert.equal(preview.practice,true);assert.equal(preview.saved,false);
 assert.equal(preview.xp,0);assert.equal(db.data.size,0);
 const wrong=await TESTABLE.previewSvtTraining(db,PARENT_UID,{id,answers:answers.map(()=>'faux'),bankVersion:SVT_BANK_VERSION});
 assert.equal(wrong.score,0);assert.equal(db.data.size,0);
 assert.equal((await TESTABLE.getSvtTrainingTask(db,TIM_UID,{id})).completed,false);
 await assert.rejects(()=>TESTABLE.previewSvtTraining(db,TIM_UID,{id,answers,bankVersion:SVT_BANK_VERSION}),e=>e.status===403);
});

test('SVT : données incohérentes ou version périmée ne consomment aucune tentative',async()=>{
 const db=sampleDb(),id='SVQ_L01_01',task=svtTask(id),answers=task.questions.map(q=>q.right);
 await assert.rejects(()=>TESTABLE.submitSvtTraining(db,TIM_UID,{id,answers:answers.slice(0,9),bankVersion:SVT_BANK_VERSION}),e=>e.status===400);
 await assert.rejects(()=>TESTABLE.submitSvtTraining(db,TIM_UID,{id,answers,bankVersion:'svt-ancien'}),e=>e.status===409);
 assert.equal(db.data.size,0);
});

test('SVT : indices, accents et variantes courtes sans accepter une mauvaise réponse',()=>{
 const id='SVQ_L05_02',task=svtTask(id),answers=task.questions.map(q=>q.expected);
 const i=task.questions.findIndex(q=>q.expected==='O₂');
 assert.ok(i>=0);
 answers[i]='O2';
 assert.equal(gradeSvtTask(id,answers,SVT_BANK_VERSION).score,10);
 answers[i]='CO2';
 assert.equal(gradeSvtTask(id,answers,SVT_BANK_VERSION).score,9);
});
