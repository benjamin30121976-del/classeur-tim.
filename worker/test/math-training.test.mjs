import test from 'node:test';
import assert from 'node:assert/strict';
import {mathId, mathTask, mathPublicTask, gradeMathTask, MATH_TOTAL} from '../maths-training-curriculum.mjs';
import {getMathTrainingTask, submitMathTraining, getMathTrainingProgress} from '../server.mjs';
import {fromFields} from '../firestore.mjs';
import {TIM_UID, PARENT_UID} from '../auth.mjs';

function allTasks() {
 return Array.from({length:MATH_TOTAL},(_,i)=>mathTask('MT'+String(i+1).padStart(2,'0')));
}

function mockFirestore() {
 const data=new Map();
 return {
  data,
  async get(path){return data.get(path)||null;},
  async list(collection){return [...data.entries()].filter(([path])=>path.startsWith(collection+'/'))
    .map(([path,value])=>({id:path.slice(collection.length+1),data:value}));},
  async transaction(){return 'test-transaction';},
  async commit(writes){
   for(const w of writes){
    const path=w.update?.name?.split('/documents/')[1];
    if(!path)throw Error('Malformed write');
    if(w.currentDocument?.exists===false&&data.has(path)){
     const e=new Error('Already exists');e.status=409;throw e;
    }
    const item=fromFields(w.update.fields);
    if(w.updateTransforms?.some(x=>x.fieldPath==='submittedAt'))
     item.submittedAt=new Date().toISOString();
    data.set(path,item);
   }
  }
 };
}

test('23 mathematical evaluations, each with ten complete questions',()=>{
 assert.equal(MATH_TOTAL,23);
 for(const t of allTasks()){
  assert.ok(t&&mathId(t.id));
  assert.equal(t.questions.length,10);
  assert.equal(t.lessonId,'MBIS'+t.id.slice(2));
  for(const [i,q] of t.questions.entries()){
   assert.ok(q.prompt.length>=15,t.id+' question '+i+' lacks a clear prompt');
   assert.equal(q.choices.length,4,t.id+' question '+i+' answer count');
   assert.equal(new Set(q.choices.map(x=>x.trim().toLowerCase())).size,4,t.id+' question '+i+' duplicated options');
   assert.equal(q.expected,q.choices[q.correctIndex],t.id+' question '+i+' wrong answer position');
   assert.equal(q.feedbackByIndex.length,4);
   assert.equal(q.feedbackByIndex[q.correctIndex],null);
   assert.ok(q.explanation.length>=20);
   for(const [j,feedback] of q.feedbackByIndex.entries()){
    if(j!==q.correctIndex)assert.ok(feedback?.length>=30,t.id+' question '+i+' option '+j+' lacks explanation');
   }
  }
 }
});

test('No correction or correct answer metadata is sent in public tasks',()=>{
 for(const task of allTasks()){
  const exposed=mathPublicTask(task.id);
  for(const question of exposed.questions)assert.deepEqual(Object.keys(question).sort(),['choices','prompt']);
 }
});

test('All 920 independent correct/wrong choice scenarios are graded and explained',()=>{
 let checked=0;
 for(const t of allTasks()){
  const perfect=t.questions.map(q=>q.correctIndex);
  const top=gradeMathTask(t.id,perfect);
  assert.equal(top.score,10);assert.equal(top.total,10);assert.equal(top.xp,0);
  assert.ok(top.items.every(x=>x.correct&&x.explanation));
  for(let i=0;i<10;i++){
   for(let choice=0;choice<4;choice++){
    const answers=perfect.slice();answers[i]=choice;
    const r=gradeMathTask(t.id,answers);
    assert.equal(r.score,choice===perfect[i]?10:9);
    assert.equal(r.total,10);
    assert.equal(r.xp,0);
    assert.equal(r.items[i].response,t.questions[i].choices[choice]);
    assert.equal(r.items[i].correct,choice===perfect[i]);
    assert.equal(r.items[i].expected,t.questions[i].expected);
    assert.ok(r.items[i].explanation.length>=20);
    if(choice!==perfect[i])assert.ok(r.items[i].explanation.includes(t.questions[i].feedbackByIndex[choice]));
    checked++;
   }
  }
 }
 assert.equal(checked,23*10*4);
});

test('Tim gets a durable score and feedback, Parent can read it, no duplicate submission',async()=>{
 const db=mockFirestore(),id='MT13';
 const task=mathTask(id);
 const taskBefore=await getMathTrainingTask(db,TIM_UID,{id});
 assert.equal(taskBefore.completed,false);
 assert.equal(taskBefore.task.questions.length,10);
 const answers=task.questions.map(q=>q.correctIndex);
 answers[1]=(answers[1]+1)%4;
 const result=await submitMathTraining(db,TIM_UID,{id,answers});
 assert.equal(result.submitted,true);
 assert.equal(result.score,9);
 assert.equal(result.total,10);
 assert.equal(result.xp,0);
 assert.equal(result.items.length,2);
 assert.equal(result.items[1].correct,false);
 assert.ok(result.items[1].explanation.includes(' '));
 const taskAfter=await getMathTrainingTask(db,TIM_UID,{id});
 assert.equal(taskAfter.completed,true);
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id,answers}),e=>e.status===409&&e.code==='already-exists');
 assert.equal(db.data.size,1);
 const student=await getMathTrainingProgress(db,TIM_UID);
 const parent=await getMathTrainingProgress(db,PARENT_UID);
 assert.equal(student.attempts.length,1);
 assert.equal(parent.attempts.length,1);
 assert.equal(student.attempts[0].score,9);
 assert.equal(parent.attempts[0].items[1].expected,task.questions[1].expected);
 assert.equal(parent.attempts[0].xp,0);
 await assert.rejects(()=>submitMathTraining(db,PARENT_UID,{id,answers}),e=>e.status===403);
 await assert.rejects(()=>getMathTrainingProgress(db,'unknown-uid'),e=>e.status===403);
});

test('Two simultaneous submissions cannot create a second result',async()=>{
 const db=mockFirestore(),task=mathTask('MT05');
 const correct=task.questions.map(q=>q.correctIndex);
 const responses=await Promise.allSettled([
  submitMathTraining(db,TIM_UID,{id:'MT05',answers:correct}),
  submitMathTraining(db,TIM_UID,{id:'MT05',answers:[(correct[0]+1)%4,correct[1]]})
 ]);
 assert.equal(responses.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(responses.filter(x=>x.status==='rejected').length,1);
 assert.equal(db.data.size,1);
});

test('Invalid answers and unknown exercises cannot create attempts',async()=>{
 const db=mockFirestore();
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id:'MT15',answers:[0]}),e=>e.status===400);
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id:'MT00',answers:[0,0]}),e=>e.status===400);
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id:'MT15',answers:[0,0,0,0,0,0,0,0,0,4]}),e=>e.status===400);
 assert.equal(db.data.size,0);
});
