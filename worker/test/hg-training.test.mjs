import test from 'node:test';
import assert from 'node:assert/strict';
import {HG_BANK_TEST,HG_BANK_VERSION,hgTask,hgPublicTask,gradeHgTask,hgTrainingId} from '../hg-training.mjs';
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

test('HG : 9 leçons, 18 exercices, 180 questions et réponses masquées',()=>{
 const ids=HG_BANK_TEST.allIds();
 assert.equal(ids.length,18);
 assert.equal(new Set(ids).size,16);
 for(const id of ids){
  assert.ok(hgTrainingId(id));
  const t=hgTask(id),pub=hgPublicTask(id);
  assert.equal(t.questions.length,10);
  assert.equal(pub.questions.length,10);
  assert.equal(pub.bankVersion,HG_BANK_VERSION);
  assert.equal(t.lessonId,'HG_BIS'+id.slice(5,7));
  assert.equal(pub.questions.every(q=>!['right','expected','explanation','accepted','answer'].some(k=>k in q)),true);
  for(const q of t.questions){
   assert.ok(q.prompt.length>=12,id);
   assert.ok(q.explanation.length>=15,id);
   if(q.kind==='qcm')assert.equal(new Set(q.choices).size,4);
   else assert.ok(q.accepted.includes(q.expected));
  }
 }
 assert.equal(hgTrainingId('HGQ_L01_03'),false);
 assert.equal(hgTrainingId('HGQ_L09_01'),true);
 assert.ok(hgPublicTask('HGQ_L09_01'));
 assert.equal(hgTrainingId('HGQ_L10_01'),false);
 assert.equal(hgPublicTask('HGQ_L10_01'),null);
});

test('HG : les 180 bonnes réponses donnent 10/10 et les 180 fausses 0/10',()=>{
 for(const id of HG_BANK_TEST.allIds()){
  const task=hgTask(id);
  const correct=task.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const wrong=task.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'réponse totalement fausse');
  const success=gradeHgTask(id,correct,HG_BANK_VERSION);
  const failure=gradeHgTask(id,wrong,HG_BANK_VERSION);
  assert.equal(success.score,10,id);
  assert.equal(failure.score,0,id);
  assert.equal(success.items.length,10);
  assert.equal(failure.items.length,10);
  assert.ok(success.items.every(x=>x.correct&&x.explanation));
  assert.ok(failure.items.every(x=>!x.correct&&x.expected&&x.explanation.includes(x.expected)));
 }
});

test('HG : tentative Tim enregistrée une seule fois, note et corrigé lisibles pour Tim et Parent',async()=>{
 const db=sampleDb(),id='HGQ_L07_01',task=hgTask(id);
 const answers=task.questions.map(q=>q.right);
 const before=await TESTABLE.getHgTrainingTask(db,TIM_UID,{id});
 assert.equal(before.completed,false);
 assert.ok(!JSON.stringify(before).includes('"right"'));
 const result=await TESTABLE.submitHgTraining(db,TIM_UID,{id,answers,bankVersion:HG_BANK_VERSION});
 assert.equal(result.submitted,true);
 assert.equal(result.score,10);
 assert.equal(result.xp,1);
 const note=await TESTABLE.getHgTrainingProgress(db,PARENT_UID,{id});
 assert.equal(note.attempt.score,10);
 assert.equal(note.attempt.items.length,10);
 assert.equal((await TESTABLE.getHgTrainingTask(db,TIM_UID,{id})).completed,true);
 assert.equal((await TESTABLE.getHgTrainingProgress(db,PARENT_UID,{})).attempts.length,1);
 await assert.rejects(()=>TESTABLE.submitHgTraining(db,TIM_UID,{id,answers,bankVersion:HG_BANK_VERSION}),e=>e.status===409);
 await assert.rejects(()=>TESTABLE.submitHgTraining(db,PARENT_UID,{id:'HGQ_L07_02',answers,bankVersion:HG_BANK_VERSION}),e=>e.status===403);
 await assert.rejects(()=>TESTABLE.getHgTrainingProgress(db,'visiteur',{}),e=>e.status===403);
});

test('HG : essai Parent intégral et erroné, 0 écriture, 0 XP',async()=>{
 const db=sampleDb(),id='HGQ_L03_02',task=hgTask(id);
 const answers=task.questions.map(q=>q.expected);
 const preview=await TESTABLE.previewHgTraining(db,PARENT_UID,{id,answers,bankVersion:HG_BANK_VERSION});
 assert.equal(preview.score,10);assert.equal(preview.practice,true);assert.equal(preview.saved,false);
 assert.equal(preview.xp,0);assert.equal(db.data.size,0);
 const wrong=await TESTABLE.previewHgTraining(db,PARENT_UID,{id,answers:answers.map(()=>'faux'),bankVersion:HG_BANK_VERSION});
 assert.equal(wrong.score,0);assert.equal(db.data.size,0);
 assert.equal((await TESTABLE.getHgTrainingTask(db,TIM_UID,{id})).completed,false);
 await assert.rejects(()=>TESTABLE.previewHgTraining(db,TIM_UID,{id,answers,bankVersion:HG_BANK_VERSION}),e=>e.status===403);
});

test('HG : données incohérentes ou version périmée ne consomment aucune tentative',async()=>{
 const db=sampleDb(),id='HGQ_L01_01',task=hgTask(id),answers=task.questions.map(q=>q.right);
 await assert.rejects(()=>TESTABLE.submitHgTraining(db,TIM_UID,{id,answers:answers.slice(0,9),bankVersion:HG_BANK_VERSION}),e=>e.status===400);
 await assert.rejects(()=>TESTABLE.submitHgTraining(db,TIM_UID,{id,answers,bankVersion:'hg-ancien'}),e=>e.status===409);
 assert.equal(db.data.size,0);
});

test('HG : accents, dates exactes et réponse fausse',()=>{
 const task=hgTask('HGQ_L02_02'),answers=task.questions.map(q=>q.expected);
 const i=task.questions.findIndex(q=>q.expected==='Lénine');
 assert.ok(i>=0);
 answers[i]='Lenine.';
 assert.equal(gradeHgTask('HGQ_L02_02',answers,HG_BANK_VERSION).score,10);
 answers[i]='Staline';
 assert.equal(gradeHgTask('HGQ_L02_02',answers,HG_BANK_VERSION).score,9);
 const j=task.questions.findIndex(q=>q.expected==='1918');
 assert.ok(j>=0);
 answers[j]='1917';
 assert.equal(gradeHgTask('HGQ_L02_02',answers,HG_BANK_VERSION).score,8);
});


test('HG : cours BIS 09 nazisme, énoncés masqués et 20 corrections',()=>{
 for(const id of ['HGQ_L09_01','HGQ_L09_02']){
  const task=hgTask(id),pub=hgPublicTask(id);
  assert.equal(task.lessonId,'HG_BIS09'); assert.equal(task.questions.length,10);
  assert.equal(pub.questions.every(q=>!('expected' in q||'right' in q||'explanation' in q)),true);
  const correct=task.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const wrong=task.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'incorrect');
  assert.equal(gradeHgTask(id,correct,HG_BANK_VERSION).score,10);
  const miss=gradeHgTask(id,wrong,HG_BANK_VERSION);
  assert.equal(miss.score,0);assert.equal(miss.items.filter(q=>!q.correct&&q.explanation.length>=25).length,10);
 }
});
