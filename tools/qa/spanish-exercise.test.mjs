import test from 'node:test';
import assert from 'node:assert/strict';
import {SPANISH_ENT_LESSONS,spanishEntTrainingId,spanishEntTask,spanishEntPublicTask,gradeSpanishEntTask} from '../../worker/spanish-ent-training.mjs';
import {spanishLessonXp} from '../../worker/spanish-lesson-xp.mjs';
import {TESTABLE} from '../../worker/server.mjs';
import {fromFields} from '../../worker/firestore.mjs';
import {TIM_UID,PARENT_UID} from '../../worker/auth.mjs';

// Uniquement des données fabriquées et une base en mémoire : aucun accès Firebase réel.
const ids=SPANISH_ENT_LESSONS.flatMap(id=>[1,2,3].map(n=>'ESE_'+id+'_0'+n));
const translations=Array(10).fill(false);
const correct=task=>task.questions.map(q=>q.right);

function fakeFirestore(){
 const records=new Map();
 return {
  records,
  async get(path){return records.get(path)||null;},
  async transaction(){return 'synthetic-transaction';},
  async list(path){return [...records.entries()].filter(([p])=>p.startsWith(path+'/')).map(([p,data])=>({id:p.slice(path.length+1),data}));},
  async commit(writes){
   for(const write of writes){
    const name=write.update?.name?.split('/documents/')[1];
    assert.ok(name,'Missing database write path');
    if(write.currentDocument?.exists===false&&records.has(name)){
      const error=new Error('already exists');error.status=409;throw error;
    }
    const value=fromFields(write.update.fields);
    if(write.updateTransforms?.some(x=>x.fieldPath==='submittedAt'))value.submittedAt=new Date().toISOString();
    records.set(name,value);
   }
  }
 };
}

test('All 39 Spanish exercises contain ten distinct usable questions and safe public versions',()=>{
 assert.equal(SPANISH_ENT_LESSONS.length,13);
 assert.equal(ids.length,39);
 let checked=0;
 for(const id of ids){
  assert.ok(spanishEntTrainingId(id),id);
  const task=spanishEntTask(id);
  const publicTask=spanishEntPublicTask(id);
  assert.equal(task.questions.length,10,id);
  assert.equal(publicTask.questions.length,10,id);
  const identities=new Set();
  for(let i=0;i<10;i++){
    const privateQuestion=task.questions[i],published=publicTask.questions[i];
    assert.ok(privateQuestion.instructionEs?.length>=10,id+' Spanish instruction '+i);
    assert.ok(privateQuestion.instructionFr?.length>=10,id+' French instruction '+i);
    assert.ok(privateQuestion.explanation?.length>=15,id+' explanation '+i);
    assert.ok(privateQuestion.sourceFr||privateQuestion.sourceEs||privateQuestion.stem,id+' no question context '+i);
    assert.ok(!('right' in published)&&!('expected' in published)&&!('explanation' in published),id+' exposed correction '+i);
    if(privateQuestion.kind==='qcm'){
      assert.equal(published.choices.length,4,id);
      assert.equal(new Set(published.choices).size,4,id);
      assert.ok(Number.isInteger(privateQuestion.right));
    }else{
      assert.ok(['gap','write'].includes(privateQuestion.kind),id);
      assert.equal(typeof privateQuestion.right,'string');
      assert.ok(privateQuestion.right.trim());
    }
    const identity=[published.kind,published.stem||'',published.sourceEs||'',published.sourceFr||''].join('|');
    assert.ok(!identities.has(identity),id+' duplicated question '+i);
    identities.add(identity);
    checked++;
  }
 }
 assert.equal(checked,390);
});

test('Every Spanish exercise grades a perfect submission and explains an incorrect answer',()=>{
 for(const id of ids){
  const task=spanishEntTask(id),full=correct(task);
  const report=gradeSpanishEntTask(id,full,translations);
  assert.equal(report.score,10,id+' correct score');
  assert.equal(report.items.length,10);
  assert.ok(report.items.every(q=>q.correct&&q.points===1&&q.explanation?.length>0),id+' missing explanation');
  const wrong=full.slice(),q=task.questions[0];
  wrong[0]=q.kind==='qcm'?(q.right+1)%4:'zzzzzz';
  const failed=gradeSpanishEntTask(id,wrong,translations);
  assert.equal(failed.score,9,id+' bad answer should lose one point');
  assert.equal(failed.items[0].correct,false,id);
  assert.ok(failed.items[0].feedback&&failed.items[0].explanation,id+' missing correction');
 }
});

test('One submission only; Parent and Tim can consult the saved correction and XP',async()=>{
 const db=fakeFirestore(),id=ids[0],answers=correct(spanishEntTask(id));
 await assert.rejects(()=>TESTABLE.submitSpanishEntTraining(db,PARENT_UID,{id,answers,translationsUsed:translations}),e=>e.status===403);
 const before=await TESTABLE.getSpanishEntTrainingTask(db,TIM_UID,{id});
 assert.equal(before.completed,false);
 assert.ok(!JSON.stringify(before.task).includes('"right"'));
 const result=await TESTABLE.submitSpanishEntTraining(db,TIM_UID,{id,answers,translationsUsed:translations});
 assert.equal(result.score,10);assert.equal(result.xp,1);
 assert.ok(result.items.every(q=>q.expected&&q.explanation));
 assert.equal((await TESTABLE.getSpanishEntTrainingTask(db,TIM_UID,{id})).completed,true);
 await assert.rejects(()=>TESTABLE.submitSpanishEntTraining(db,TIM_UID,{id,answers,translationsUsed:translations}),e=>e.status===409);
 assert.equal(db.records.size,2,'Exactly one attempt and one XP state');
 assert.equal(db.records.get('xpState/tim').weekXp,1,'No duplicate XP');
 for(const uid of [TIM_UID,PARENT_UID]){
  const view=await TESTABLE.getSpanishEntTrainingProgress(db,uid,{id});
  assert.equal(view.attempt.items.length,10);
  assert.equal(view.attempt.xp,1);
  const summary=await TESTABLE.getSpanishEntTrainingProgress(db,uid,{});
  assert.equal(summary.attempts.length,1);
  assert.equal(summary.attempts[0].score,10);
 }
});

test('Current Spanish lesson XP thresholds',()=>{
 assert.equal(spanishLessonXp(10),1);
 assert.equal(spanishLessonXp(7),1);
 assert.equal(spanishLessonXp(6.5),0.5);
 assert.equal(spanishLessonXp(5),0.5);
 assert.equal(spanishLessonXp(4.5),0);
 assert.throws(()=>spanishLessonXp(11));
});
