import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathTask,mathPublicTask,mathId,gradeMathTask,MATH_TOTAL} from '../../worker/maths-training-curriculum.mjs';
import {TESTABLE} from '../../worker/server.mjs';
import {TIM_UID,PARENT_UID} from '../../worker/auth.mjs';
import {fromFields} from '../../worker/firestore.mjs';

test('23 sous-leçons, deux questions notées sans réponses divulguées',()=>{
 assert.equal(MATH_TOTAL,23);
 for(let i=1;i<=23;i++){
  const id='MT'+String(i).padStart(2,'0');
  assert.equal(mathId(id),true);
  const task=mathTask(id),publicTask=mathPublicTask(id);
  assert.equal(task.lessonId,'MBIS'+String(i).padStart(2,'0'));
  assert.equal(task.questions.length,2);
  assert.equal(publicTask.questions.length,2);
  for(const q of task.questions){
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
  }
  assert.equal(JSON.stringify(publicTask).includes('correctIndex'),false);
  assert.equal(JSON.stringify(publicTask).includes('expected'),false);
  const good=gradeMathTask(id,task.questions.map(q=>q.correctIndex));
  assert.equal(good.score,2);assert.equal(good.total,2);assert.equal(good.xp,0);
  assert.ok(good.items.every(q=>q.correct===true&&q.explanation));
  const bad=gradeMathTask(id,task.questions.map(q=>(q.correctIndex+1)%4));
  assert.equal(bad.score,0);assert.ok(bad.items.every(q=>!q.correct&&q.expected));
 }
 assert.equal(mathId('MT24'),false);
 assert.equal(mathPublicTask('MT24'),null);
 assert.throws(()=>gradeMathTask('MT01',[0]),/invalid-answers/);
});

test('validation unique côté serveur, note immédiatement disponible au Parent et à Tim',async()=>{
 const dbEntries=new Map();
 const db={
  transaction:async()=>({}),
  get:async(path)=>dbEntries.get(path)||null,
  commit:async(writes)=>{
   for(const w of writes){
    const path=w.update.name.split('/documents/')[1];
    if(w.currentDocument?.exists===false&&dbEntries.has(path))throw Error('already-exists');
    dbEntries.set(path,fromFields(w.update.fields));
   }
  },
  list:async(col)=>[...dbEntries.entries()].filter(([p])=>p.startsWith(col+'/')).map(([p,data])=>({id:p.split('/').pop(),data}))
 };
 const task=mathTask('MT01');
 const answer=task.questions.map(q=>q.correctIndex);
 const visible=await TESTABLE.getMathTrainingTask(db,TIM_UID,{id:'MT01'});
 assert.equal(visible.completed,false);
 assert.equal(visible.task.questions.length,2);
 const reply=await TESTABLE.submitMathTraining(db,TIM_UID,{id:'MT01',answers:answer});
 assert.equal(reply.submitted,true);
 assert.equal(reply.score,2);
 assert.equal(reply.xp,0);
 const state=await TESTABLE.getMathTrainingProgress(db,PARENT_UID);
 assert.equal(state.attempts.length,1);
 assert.equal(state.attempts[0].score,2);
 assert.equal(state.attempts[0].items[0].correct,true);
 const timState=await TESTABLE.getMathTrainingProgress(db,TIM_UID);
 assert.equal(timState.attempts.length,1);
 assert.equal((await TESTABLE.getMathTrainingTask(db,PARENT_UID,{id:'MT01'})).completed,true);
 await assert.rejects(()=>TESTABLE.submitMathTraining(db,TIM_UID,{id:'MT01',answers:answer}),e=>e.status===409);
 await assert.rejects(()=>TESTABLE.submitMathTraining(db,PARENT_UID,{id:'MT02',answers:answer}),e=>e.status===403);
 await assert.rejects(()=>TESTABLE.getMathTrainingProgress(db,'invite'),e=>e.status===403);
});

test('intégration de la matière et du bilan dans le même classeur',()=>{
 const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../../app.js',import.meta.url),'utf8');
 const boot=readFileSync(new URL('../../boot.js',import.meta.url),'utf8');
 const path=readFileSync(new URL('../../maths-parcours.js',import.meta.url),'utf8');
 assert.match(html,/maths-parcours\.css/);
 assert.match(html,/maths-parcours\.js/);
 assert.match(app,/window\.TIM_MATH_PATH\.render\(root/);
 assert.match(app,/window\.TIM_MATH_PATH\.renderParentProgress\(root\)/);
 assert.match(boot,/submitMathTraining/);
 assert.match(boot,/getMathTrainingProgress/);
 assert.match(boot,/const automatic=\[\.\.\.attempts\.filter\(a=>spanishTraining\(a\.id\)\),\.\.\.mathRecords\]/);
 assert.match(boot,/validatedCount=attempts\.length\+mathRecords\.length/);
 assert.match(boot,/const mathMatch=\/\^MT/);
 assert.match(boot,/if\(mathMatch\)\{/);
 assert.match(boot,/Bilan :/);
 assert.match(boot,/Leçon BIS/);

 assert.match(path,/Je n’ai pas compris/);
 assert.match(path,/une seule tentative/i);
 assert.doesNotMatch(path,/gagner.*XP|débloquer.*XP/i);
});