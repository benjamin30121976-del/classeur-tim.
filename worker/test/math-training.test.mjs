import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {mathId, mathTask, mathPublicTask, gradeMathTask, MATH_TOTAL} from '../maths-training-curriculum.mjs';
import {getMathTrainingTask, submitMathTraining, getMathTrainingProgress} from '../server.mjs';
import {MATH_BANK_VERSION,mathPublicTaskPrivate,gradeMathTaskPrivate} from '../math-private-kv.mjs';
import {fromFields} from '../firestore.mjs';
import {TIM_UID, PARENT_UID} from '../auth.mjs';

function allTasks() {
 return Array.from({length:MATH_TOTAL},(_,i)=>mathTask('MT'+String(i+1).padStart(2,'0')));
}

// Fixture artificielle : utilise l'ANCIENNE banque déjà présente dans le dépôt
// pour tester les transactions, sans ajouter le corrigé des 230 nouvelles questions.
function mockMathEnvironment() {
 const publicQuizzes={},privateQuizzes={};
 for(const t of allTasks()){
  publicQuizzes[t.id]={id:t.id,lessonId:t.lessonId,title:t.title,
    bankVersion:MATH_BANK_VERSION,questions:t.questions.map(q=>({prompt:q.prompt,choices:q.choices.slice()}))};
  privateQuizzes[t.id]={lessonId:t.lessonId,questions:t.questions.map((q,i)=>({
   questionId:t.id+'-TEST-'+i,correctIndex:q.correctIndex,expected:q.expected,
   explanation:q.explanation,feedbackByIndex:q.feedbackByIndex.slice(),
   entReference:{title:'Support ENT de test',pages:[1]}
  }))};
 }
 const bank={version:MATH_BANK_VERSION,
  public:{version:MATH_BANK_VERSION,questions:230,quizzes:publicQuizzes},
  private:{version:MATH_BANK_VERSION,questions:230,quizzes:privateQuizzes}};
 return {TIM_MATH_PRIVATE_KV:{async get(key,type){
  assert.equal(type,'json');
  return key===MATH_BANK_VERSION?bank:null;
 }}};
}
const mathEnv=mockMathEnvironment();

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
   assert.equal(new Set(q.feedbackByIndex.filter(Boolean)).size,3,t.id+' question '+i+' needs an explanation for each wrong option');
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
 const taskBefore=await getMathTrainingTask(db,TIM_UID,{id},mathEnv);
 assert.equal(taskBefore.completed,false);
 assert.equal(taskBefore.task.questions.length,10);
 const answers=task.questions.map(q=>q.correctIndex);
 answers[1]=(answers[1]+1)%4;
 const result=await submitMathTraining(db,TIM_UID,{id,answers,bankVersion:MATH_BANK_VERSION},mathEnv);
 assert.equal(result.submitted,true);
 assert.equal(result.score,9);
 assert.equal(result.total,10);
 assert.equal(result.xp,1);
 assert.equal(result.items.length,10);
 assert.equal(result.items[1].correct,false);
 assert.ok(result.items[1].explanation.includes(' '));
 const taskAfter=await getMathTrainingTask(db,TIM_UID,{id},mathEnv);
 assert.equal(taskAfter.completed,true);
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id,answers,bankVersion:MATH_BANK_VERSION},mathEnv),e=>e.status===409&&e.code==='already-exists');
 assert.equal(db.data.size,2);
 const student=await getMathTrainingProgress(db,TIM_UID);
 const parent=await getMathTrainingProgress(db,PARENT_UID);
 assert.equal(student.attempts.length,1);
 assert.equal(parent.attempts.length,1);
 assert.equal(student.attempts[0].score,9);
 assert.equal(parent.attempts[0].items[1].expected,task.questions[1].expected);
 assert.equal(parent.attempts[0].xp,1);
 await assert.rejects(()=>submitMathTraining(db,PARENT_UID,{id,answers,bankVersion:MATH_BANK_VERSION},mathEnv),e=>e.status===403);
 await assert.rejects(()=>getMathTrainingProgress(db,'unknown-uid'),e=>e.status===403);
});

test('Two simultaneous submissions cannot create a second result',async()=>{
 const db=mockFirestore(),task=mathTask('MT05');
 const correct=task.questions.map(q=>q.correctIndex);
 const responses=await Promise.allSettled([
  submitMathTraining(db,TIM_UID,{id:'MT05',answers:correct,bankVersion:MATH_BANK_VERSION},mathEnv),
  submitMathTraining(db,TIM_UID,{id:'MT05',answers:correct.map((v,i)=>i===0?(v+1)%4:v),bankVersion:MATH_BANK_VERSION},mathEnv)
 ]);
 assert.equal(responses.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(responses.filter(x=>x.status==='rejected').length,1);
 assert.equal(db.data.size,2);
});

test('Invalid answers and unknown exercises cannot create attempts',async()=>{
 const db=mockFirestore();
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id:'MT15',answers:[0]},mathEnv),e=>e.status===400);
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id:'MT00',answers:[0,0]},mathEnv),e=>e.status===400);
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id:'MT15',answers:[0,0,0,0,0,0,0,0,0,4]},mathEnv),e=>e.status===400);
 assert.equal(db.data.size,0);
});

test('Les 23 leçons BIS ne montrent plus les 46 mini-exercices de deux questions',()=>{
 const content=readFileSync(new URL('../../maths-bis-data.js',import.meta.url),'utf8');
 const context={window:{}};
 runInNewContext(content,context);
 const lessons=context.window.TIM_MATHS_BIS_PACK.lessons;
 assert.equal(lessons.length,23);
 for(const l of lessons){
  assert.ok(!l.blocks.some(b=>/^Question d[’']entraînement\s*[12]$/iu.test(b.h||'')),l.id+' still shows an ungraded two-question exercise');
 }
});

test('La note et les dix explications sont restituées dès la validation',async()=>{
 const db=mockFirestore(),id='MT11',task=mathTask(id);
 const replies=task.questions.map(q=>q.correctIndex);
 replies[3]=(replies[3]+2)%4;
 const answer=await submitMathTraining(db,TIM_UID,{id,answers:replies,bankVersion:MATH_BANK_VERSION},mathEnv);
 assert.equal(answer.score,9);
 assert.equal(answer.total,10);
 assert.equal(answer.items.length,10);
 assert.ok(answer.items.every(it=>it.expected&&it.explanation));
 assert.ok(answer.items[3].correct===false);
 const parent=await getMathTrainingProgress(db,PARENT_UID);
 assert.equal(parent.attempts[0].total,10);
 assert.equal(parent.attempts[0].items.length,10);
 assert.equal(parent.attempts[0].items[3].explanation,answer.items[3].explanation);
});


test('KV manquant, version périmée et ancien historique ne consomment aucun nouvel essai',async()=>{
 const db=mockFirestore(),id='MT01';
 const answers=mathTask(id).questions.map(q=>q.correctIndex);
 await assert.rejects(()=>getMathTrainingTask(db,TIM_UID,{id},{}),e=>e.status===503);
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id,answers,bankVersion:MATH_BANK_VERSION},{}),e=>e.status===503);
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id,answers,bankVersion:'old'},mathEnv),e=>e.status===409);
 assert.equal(db.data.size,0);
 db.data.set('mathTrainingAttempts/'+id,{id,authorUid:TIM_UID,lessonId:'MBIS01',score:9,total:10,xp:0,items:[]});
 await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id,answers,bankVersion:MATH_BANK_VERSION},mathEnv),e=>e.status===409);
 assert.equal(db.data.size,1);
 const historical=(await getMathTrainingProgress(db,PARENT_UID)).attempts[0];
 assert.equal(historical.xp,0);
});

test('Le questionnaire envoyé à Tim ne contient aucune correction (KV de test)',async()=>{
 const task=await mathPublicTaskPrivate(mathEnv,'MT01');
 assert.equal(task.bankVersion,MATH_BANK_VERSION);
 for(const q of task.questions)assert.deepEqual(Object.keys(q).sort(),['choices','prompt']);
 const scores=await gradeMathTaskPrivate(mathEnv,'MT01',mathTask('MT01').questions.map(q=>q.correctIndex),MATH_BANK_VERSION);
 assert.equal(scores.score,10);
});

test('Les trois paliers XP mathématiques 4/10, 5/10 et 7/10 sont cumulatifs et sans doublon',async()=>{
 const db=mockFirestore();
 for(const [id,n,expectedXp] of [['MT02',4,0],['MT03',5,0.5],['MT04',7,1]]){
  const task=mathTask(id);
  const answers=task.questions.map((q,i)=>i<n?q.correctIndex:(q.correctIndex+1)%4);
  const report=await submitMathTraining(db,TIM_UID,{id,answers,bankVersion:MATH_BANK_VERSION},mathEnv);
  assert.equal(report.score,n,id+' score');
  assert.equal(report.xp,expectedXp,id+' XP');
  await assert.rejects(()=>submitMathTraining(db,TIM_UID,{id,answers,bankVersion:MATH_BANK_VERSION},mathEnv),
   e=>e.status===409&&e.code==='already-exists');
 }
 const state=db.data.get('xpState/tim');
 assert.equal(state.weekXp,1.5);
 assert.equal(state.weekEarned,1.5);
 const records=(await getMathTrainingProgress(db,PARENT_UID)).attempts;
 assert.equal(records.length,3);
 assert.deepEqual(records.map(r=>r.xp).sort((a,b)=>a-b),[0,0.5,1]);
});
