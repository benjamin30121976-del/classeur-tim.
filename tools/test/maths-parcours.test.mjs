import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathTask,mathPublicTask,mathId,gradeMathTask,MATH_TOTAL} from '../../worker/maths-training-curriculum.mjs';
import {TESTABLE} from '../../worker/server.mjs';
import {MATH_BANK_VERSION} from '../../worker/math-private-kv.mjs';
import {TIM_UID,PARENT_UID} from '../../worker/auth.mjs';
import {fromFields} from '../../worker/firestore.mjs';

test('23 sous-leçons, dix questions notées sans réponses divulguées',()=>{
 assert.equal(MATH_TOTAL,23);
 for(let i=1;i<=23;i++){
  const id='MT'+String(i).padStart(2,'0');
  assert.equal(mathId(id),true);
  const task=mathTask(id),publicTask=mathPublicTask(id);
  assert.equal(task.lessonId,'MBIS'+String(i).padStart(2,'0'));
  assert.equal(task.questions.length,10);
  assert.equal(publicTask.questions.length,10);
  for(const q of task.questions){
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
  }
  assert.equal(JSON.stringify(publicTask).includes('correctIndex'),false);
  assert.equal(JSON.stringify(publicTask).includes('expected'),false);
  const good=gradeMathTask(id,task.questions.map(q=>q.correctIndex));
  assert.equal(good.score,10);assert.equal(good.total,10);assert.equal(good.items.length,10);assert.equal(good.xp,0);
  assert.ok(good.items.every(q=>q.correct===true&&q.explanation));
  const bad=gradeMathTask(id,task.questions.map(q=>(q.correctIndex+1)%4));
  assert.equal(bad.score,0);assert.ok(bad.items.every(q=>!q.correct&&q.expected));
 }
 assert.equal(mathId('MT24'),false);
 assert.equal(mathPublicTask('MT24'),null);
 assert.throws(()=>gradeMathTask('MT01',[0]),/invalid-answers/);
});

function dummyMathEnv(){
 const publicQuizzes={},privateQuizzes={};
 for(let i=1;i<=23;i++){
  const id='MT'+String(i).padStart(2,'0'),t=mathTask(id);
  publicQuizzes[id]={id,lessonId:t.lessonId,title:t.title,bankVersion:MATH_BANK_VERSION,
   questions:t.questions.map(q=>({prompt:q.prompt,choices:q.choices.slice()}))};
  privateQuizzes[id]={lessonId:t.lessonId,questions:t.questions.map((q,j)=>({
   questionId:id+'-TEST-'+j,correctIndex:q.correctIndex,expected:q.expected,
   explanation:q.explanation,feedbackByIndex:q.feedbackByIndex.slice(),entReference:{title:'test',pages:[1]}
  }))};
 }
 const bank={version:MATH_BANK_VERSION,
  public:{version:MATH_BANK_VERSION,questions:230,quizzes:publicQuizzes},
  private:{version:MATH_BANK_VERSION,questions:230,quizzes:privateQuizzes}};
 return {TIM_MATH_PRIVATE_KV:{async get(){return bank;}}};
}

test('validation unique côté serveur, note immédiatement disponible au Parent et à Tim',async()=>{
 const env=dummyMathEnv(),dbEntries=new Map();
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
 const visible=await TESTABLE.getMathTrainingTask(db,TIM_UID,{id:'MT01'},env);
 assert.equal(visible.completed,false);
 assert.equal(visible.task.questions.length,10);
 const reply=await TESTABLE.submitMathTraining(db,TIM_UID,{id:'MT01',answers:answer,bankVersion:MATH_BANK_VERSION},env);
 assert.equal(reply.submitted,true);
 assert.equal(reply.score,10);
 assert.equal(reply.xp,1);
 const state=await TESTABLE.getMathTrainingProgress(db,PARENT_UID);
 assert.equal(state.attempts.length,1);
 assert.equal(state.attempts[0].score,10);
 assert.equal(state.attempts[0].items[0].correct,true);
 const timState=await TESTABLE.getMathTrainingProgress(db,TIM_UID);
 assert.equal(timState.attempts.length,1);
 assert.equal((await TESTABLE.getMathTrainingTask(db,PARENT_UID,{id:'MT01'},env)).completed,true);
 await assert.rejects(()=>TESTABLE.submitMathTraining(db,TIM_UID,{id:'MT01',answers:answer,bankVersion:MATH_BANK_VERSION},env),e=>e.status===409);
 await assert.rejects(()=>TESTABLE.submitMathTraining(db,PARENT_UID,{id:'MT02',answers:answer,bankVersion:MATH_BANK_VERSION},env),e=>e.status===403);
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
 assert.match(app,/window\.TIM_PARENT_UNIFIED\?\.render/);
 assert.match(boot,/submitMathTraining/);
 assert.match(boot,/getMathTrainingProgress/);
 assert.ok(boot.includes('...mathRecords]')); assert.ok(boot.includes('spanishTraining(a.id)||gradedMission(a.id)'));
 assert.match(boot,/validatedCount=attempts\.length\+mathRecords\.length/);
 assert.match(boot,/const mathMatch=\/\^MT/);
 assert.match(boot,/if\(mathMatch\)\{/);
 assert.match(boot,/Bilan :/);
 assert.match(boot,/leçon BIS/i);

 assert.match(path,/Je n’ai pas compris/);
 assert.match(path,/une seule tentative/i);
 assert.doesNotMatch(path,/gagner.*XP|débloquer.*XP/i);
});

test('Le suivi Parent affiche les XP réels des mathématiques et le règlement est exact',()=>{
 const boot=readFileSync(new URL('../../boot.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../../app.js',import.meta.url),'utf8');
 assert.match(boot,/const mathXp=Number\(record\.xp\?\?0\)/);
 assert.match(boot,/mathXp\.toLocaleString\('fr-FR'\)/);
 assert.doesNotMatch(boot,/record\.total\+' · 0 XP'/);
 assert.ok(app.includes('Entraînements des leçons de mathématiques et d’espagnol'));
 assert.ok(app.includes('5 à 6/10 = +0,5 XP'));
});

test('Import privé des maths : interface Parent et refus du mode Visiteur',()=>{
 const app=readFileSync(new URL('../../app.js',import.meta.url),'utf8');
 const boot=readFileSync(new URL('../../boot.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
 const upload=readFileSync(new URL('../../maths-private-import.js',import.meta.url),'utf8');
 const server=readFileSync(new URL('../../worker/server.mjs',import.meta.url),'utf8');
 const rules=readFileSync(new URL('../../firestore.rules',import.meta.url),'utf8');
 assert.match(html,/maths-private-import\.js/);
 assert.match(app,/window\.TIM_MATH_PRIVATE_IMPORT\?\.render/);
 assert.match(boot,/mathBankImport:async/);
 assert.match(server,/permitted\(uid,'parent'\)/);
 assert.match(server,/importMathPrivateQuiz:importMathPrivateQuiz/);
 assert.match(upload,/!window\.__TIM_PARENT\|\|window\.__TIM_GUEST/);
 assert.match(upload,/\.zip/);
 assert.match(upload,/import interrompu/i);
 assert.match(rules,/match \/\{document=\*\*\} \{ allow read, write: if false; \}/);
 assert.doesNotMatch(upload,/correctIndex\s*:/);
});


test('Mathématiques : choisir une leçon ouvre son cours complet avant les exercices',()=>{
 const src=readFileSync(new URL('../../maths-parcours.js',import.meta.url),'utf8');
 const dataScript=readFileSync(new URL('../../maths-bis-data.js',import.meta.url),'utf8');
 const raw=dataScript.slice(dataScript.indexOf('={')+1).trim().replace(/;\s*$/,'');
 const pack=JSON.parse(raw);
 assert.equal(pack.lessons.length,23);
 for(const lesson of pack.lessons){
  assert.equal(lesson.blocks.length,6,lesson.id+' : six étapes du cours attendues');
  assert.ok(lesson.blocks.some(b=>b.kind==='svg'),lesson.id+' : schéma absent');
 }
 const category=src.slice(src.indexOf('function category(g){'),src.indexOf('function listPage('));
 const reading=src.slice(src.indexOf('function viewBis(id){'),src.indexOf('function viewHelp(id){'));
 assert.match(category,/class="math-lesson-entry"/);
 assert.match(category,/data-math-bis/);
 assert.doesNotMatch(category,/sectionBtns/);
 assert.match(reading,/math-reading-lesson/);
 assert.match(reading,/blocks\(x,'bis'\)/);
 assert.match(reading,/Après la leçon/);
 assert.match(reading,/Documents et exercices du professeur/);
 assert.doesNotMatch(reading,/sectionBtns/);
});
