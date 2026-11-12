import test from 'node:test';
import assert from 'node:assert/strict';
import {PHYSICS_BANK_VERSION,PHYSICS_BANK_TEST,physicsTask,physicsPublicTask,gradePhysicsTask,physicsTrainingId}
 from '../physics-training.mjs';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
import {PHYSICS_ENT_IDS,PHYSICS_ENT_VERSION,physicsEntPublicTask,physicsEntGrade} from '../physics-ent-training.mjs';
import {fromFields} from '../firestore.mjs';

function sampleDb(){
 const data=new Map();
 return {
  data,
  async get(path){return data.get(path)||null},
  async list(col){return [...data.entries()].filter(([p])=>p.startsWith(col+'/'))
   .map(([p,v])=>({id:p.slice(col.length+1),data:v}))},
  async transaction(){return {}},
  async commit(writes){
   for(const w of writes){
    const path=w.update.name.split('/documents/')[1];
    assert.ok(path);
    if(w.currentDocument?.exists===false&&data.has(path))throw Error('already-exists');
    const value=fromFields(w.update.fields);
    if(w.updateTransforms?.some(x=>x.fieldPath==='submittedAt'))value.submittedAt=new Date().toISOString();
    data.set(path,value);
   }
  }
 };
}
test('210 questions : 7 leçons, chacune avec 3 exercices de 10 questions',()=>{
 const ids=PHYSICS_BANK_TEST.allIds();
 assert.equal(ids.length,21);
 assert.equal(new Set(ids).size,21);
 for(const id of ids){
  assert.equal(physicsTrainingId(id),true);
  const q=physicsTask(id),pub=physicsPublicTask(id);
  assert.equal(q.questions.length,10);
  assert.equal(pub.questions.length,10);
  assert.equal(q.lessonId,'PC_BIS'+id.slice(5,7));
  assert.equal(pub.bankVersion,PHYSICS_BANK_VERSION);
  for(let i=0;i<10;i++){
   const x=q.questions[i],visible=pub.questions[i];
   assert.ok(x.prompt.trim().length>=20,id+' question '+i+' trop courte');
   assert.ok(x.explanation.trim().length>=20,id+' explication '+i+' trop courte');
   assert.equal('right' in visible,false);
   assert.equal('expected' in visible,false);
   assert.equal('explanation' in visible,false);
   assert.equal('accepted' in visible,false);
   if(x.kind==='qcm'){
    assert.equal(x.choices.length,4);
    assert.equal(new Set(x.choices).size,4);
    assert.equal(x.expected,x.choices[x.right]);
   }else{
    assert.ok(Array.isArray(x.accepted));
    assert.ok(x.accepted.includes(x.expected));
   }
  }
 }
 assert.equal(physicsTrainingId('PCQ_L08_01'),false);
 assert.equal(physicsTrainingId('PCQ_L01_04'),false);
 assert.equal(physicsPublicTask('PCQ_L99_01'),null);
});
test('Les 21 notes sont correctes de 0/10 à 10/10 et les explications sont présentes',()=>{
 for(const id of PHYSICS_BANK_TEST.allIds()){
  const task=physicsTask(id);
  const correct=task.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const wrong=task.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'texte faux à corriger');
  const full=gradePhysicsTask(id,correct,PHYSICS_BANK_VERSION);
  const empty=gradePhysicsTask(id,wrong,PHYSICS_BANK_VERSION);
  assert.equal(full.score,10,id);
  assert.equal(empty.score,0,id);
  assert.equal(full.items.length,10);
  assert.equal(empty.items.length,10);
  assert.ok(full.items.every(x=>x.correct&&x.explanation));
  assert.ok(empty.items.every(x=>!x.correct&&x.expected&&x.explanation));
 }
});
test('Une validation : résultat immédiat, copie visible à Tim et Parent, aucune deuxième tentative',async()=>{
 const db=sampleDb(),id='PCQ_L01_01',task=physicsTask(id),answers=task.questions.map(x=>x.right);
 const before=await TESTABLE.getPhysicsTrainingTask(db,TIM_UID,{id});
 assert.equal(before.completed,false);
 assert.equal(JSON.stringify(before).includes('"right"'),false);
 const result=await TESTABLE.submitPhysicsTraining(db,TIM_UID,{id,answers,bankVersion:PHYSICS_BANK_VERSION});
 assert.equal(result.submitted,true);
 assert.equal(result.score,10);
 assert.equal(result.xp,1);
 assert.equal((await TESTABLE.getPhysicsTrainingProgress(db,PARENT_UID,{})).attempts.length,1);
 const review=await TESTABLE.getPhysicsTrainingProgress(db,TIM_UID,{id});
 assert.equal(review.attempt.items.length,10);
 assert.equal((await TESTABLE.getPhysicsTrainingTask(db,TIM_UID,{id})).completed,true);
 await assert.rejects(()=>TESTABLE.submitPhysicsTraining(db,TIM_UID,{id,answers,bankVersion:PHYSICS_BANK_VERSION}),e=>e.status===409);
 await assert.rejects(()=>TESTABLE.submitPhysicsTraining(db,PARENT_UID,{id:'PCQ_L01_02',answers,bankVersion:PHYSICS_BANK_VERSION}),e=>e.status===403);
 await assert.rejects(()=>TESTABLE.getPhysicsTrainingProgress(db,'visiteur',{}),e=>e.status===403);
});
test('Les réponses invalides et versions périmées ne consomment aucune tentative',async()=>{
 const db=sampleDb(),id='PCQ_L01_03',task=physicsTask(id);
 const answers=task.questions.map(x=>x.expected);
 await assert.rejects(()=>TESTABLE.submitPhysicsTraining(db,TIM_UID,{id,answers:answers.slice(0,9),bankVersion:PHYSICS_BANK_VERSION}),e=>e.status===400);
 await assert.rejects(()=>TESTABLE.submitPhysicsTraining(db,TIM_UID,{id,answers,bankVersion:'pc-ancienne-version'}),e=>e.status===409);
 assert.equal(db.data.size,0);
});

test('Le Parent peut faire un exercice blanc et voir sa correction sans modifier les notes de Tim',async()=>{
 const db=sampleDb(),id='PCQ_L01_01',task=physicsTask(id);
 const original=await TESTABLE.getPhysicsTrainingTask(db,PARENT_UID,{id});
 assert.equal(original.completed,false);
 assert.equal(original.task.questions.length,10);
 assert.equal(JSON.stringify(original.task).includes('"expected"'),false);
 const answers=task.questions.map(q=>q.right);
 const result=await TESTABLE.previewPhysicsTraining(db,PARENT_UID,{id,answers,bankVersion:PHYSICS_BANK_VERSION});
 assert.equal(result.practice,true);
 assert.equal(result.submitted,false);
 assert.equal(result.saved,false);
 assert.equal(result.xp,0);
 assert.equal(result.score,10);
 assert.equal(result.items.length,10);
 assert.equal(db.data.size,0,'Le compte Parent ne doit effectuer aucune écriture Firestore');
 assert.equal((await TESTABLE.getPhysicsTrainingTask(db,TIM_UID,{id})).completed,false);
 assert.equal((await TESTABLE.getPhysicsTrainingProgress(db,PARENT_UID,{})).attempts.length,0);
 const wrong=task.questions.map(q=>(q.right+1)%4);
 const second=await TESTABLE.previewPhysicsTraining(db,PARENT_UID,{id,answers:wrong,bankVersion:PHYSICS_BANK_VERSION});
 assert.equal(second.score,0);
 assert.equal(db.data.size,0);
 await assert.rejects(()=>TESTABLE.previewPhysicsTraining(db,TIM_UID,{id,answers,bankVersion:PHYSICS_BANK_VERSION}),e=>e.status===403);
 await assert.rejects(()=>TESTABLE.previewPhysicsTraining(db,'invité',{id,answers,bankVersion:PHYSICS_BANK_VERSION}),e=>e.status===403);
 await assert.rejects(()=>TESTABLE.previewPhysicsTraining(db,PARENT_UID,{id,answers:answers.slice(1),bankVersion:PHYSICS_BANK_VERSION}),e=>e.status===400);
 await assert.rejects(()=>TESTABLE.previewPhysicsTraining(db,PARENT_UID,{id,answers,bankVersion:'ancienne-version'}),e=>e.status===409);
});

const entFormAnswers=['protons et neutrons','négative','11','¹²₆C','il gagne un électron',
 'il a perdu deux électrons','10','carbone, hydrogène et oxygène','CO₂','H₂O'];
const entMoleculeAnswers=['H2O','H,H,O','O2','O,O','N2','N,N','H2','H,H','CO2','C,O,O','C,H,H,H,H','N2O'];
test('Deux vraies fiches ENT : 8 questions originales décomposées en 10 réponses, 7 molécules et 12 cases',()=>{
 assert.deepEqual(PHYSICS_ENT_IDS,['PC_ENT_CTRL1','PC_ENT_MOLECULES']);
 const ctrl=physicsEntPublicTask('PC_ENT_CTRL1'),table=physicsEntPublicTask('PC_ENT_MOLECULES');
 assert.equal(ctrl.fields.length,10);
 assert.equal(table.fields.length,12);
 assert.equal(new Set(ctrl.fields.map(q=>q.group)).size,8);
 assert.equal(table.molecules.length,7);
 assert.equal(table.molecules.find(x=>x.id==='methane').printedFormula,'CH₄');
 assert.equal(table.molecules.find(x=>x.id==='protoxyde_azote').printedModel,'2 N (bleu) + 1 O (rouge)');
 for(const task of [ctrl,table]){
  assert.equal(task.bankVersion,PHYSICS_ENT_VERSION);
  assert.ok(task.document.fileName.endsWith('.pdf'));
  const json=JSON.stringify(task);
  assert.equal(json.includes('"expected"'),false);
  assert.equal(json.includes('"correct"'),false);
  assert.equal(json.includes('"explanation"'),false);
 }
 assert.equal(physicsEntPublicTask('PC_ENT_ILLISIBLE'),null);
});
test('Correction des deux fiches originales : 10/10, 0/10 et toutes les explications présentes',()=>{
 const cases=[['PC_ENT_CTRL1',entFormAnswers],['PC_ENT_MOLECULES',entMoleculeAnswers]];
 for(const [id,answers] of cases){
  const perfect=physicsEntGrade(id,answers,PHYSICS_ENT_VERSION);
  assert.equal(perfect.score,10,id);
  assert.equal(perfect.total,10);
  assert.equal(perfect.correctFields,answers.length);
  assert.equal(perfect.items.length,answers.length);
  assert.ok(perfect.items.every(x=>x.correct===true&&x.explanation.length>10));
  const wrong=physicsEntGrade(id,answers.map(()=>'zzz'),PHYSICS_ENT_VERSION);
  assert.equal(wrong.score,0,id);
  assert.ok(wrong.items.every(x=>!x.correct));
 }
 assert.equal(physicsEntGrade('PC_ENT_CTRL1',['protons et neutrons','négative','11','A=12,Z=6,C','gagne un electron','a perdu 2 electrons','10','C H O','co2','h2o'],PHYSICS_ENT_VERSION).score,10);
});
test('ENT : Tim valide une fois, note et XP sauvegardés, Parent voit toutes les réponses corrigées',async()=>{
 const db=sampleDb(),id='PC_ENT_CTRL1',answers=entFormAnswers;
 const task=await TESTABLE.getPhysicsEntTask(db,TIM_UID,{id});
 assert.equal(task.completed,false);
 assert.equal(JSON.stringify(task).includes('"expected"'),false);
 const result=await TESTABLE.submitPhysicsEntTask(db,TIM_UID,{id,answers,bankVersion:PHYSICS_ENT_VERSION});
 assert.equal(result.submitted,true);
 assert.equal(result.score,10);
 assert.equal(result.xp,1);
 assert.equal((await TESTABLE.getPhysicsEntTask(db,TIM_UID,{id})).completed,true);
 const parent=await TESTABLE.getPhysicsEntProgress(db,PARENT_UID,{id});
 assert.equal(parent.attempt.items.length,10);
 assert.equal(parent.attempt.items[0].prompt,'Quelles sont les particules présentes dans le noyau de l’atome ?');
 const list=await TESTABLE.getPhysicsEntProgress(db,PARENT_UID,{});
 assert.equal(list.attempts.length,1);
 assert.equal(list.attempts[0].score,10);
 assert.equal(list.attempts[0].xp,1);
 await assert.rejects(()=>TESTABLE.submitPhysicsEntTask(db,TIM_UID,{id,answers,bankVersion:PHYSICS_ENT_VERSION}),e=>e.status===409);
 await assert.rejects(()=>TESTABLE.submitPhysicsEntTask(db,PARENT_UID,{id:'PC_ENT_MOLECULES',answers:entMoleculeAnswers,bankVersion:PHYSICS_ENT_VERSION}),e=>e.status===403);
});
test('ENT : essais Parent corrigés sans XP, résultat ni tentative enregistrés',async()=>{
 const db=sampleDb();
 for(const [id,answers] of [['PC_ENT_CTRL1',entFormAnswers],['PC_ENT_MOLECULES',entMoleculeAnswers]]){
  const parent=await TESTABLE.getPhysicsEntTask(db,PARENT_UID,{id});
  assert.equal(parent.completed,false);
  const result=await TESTABLE.previewPhysicsEntTask(db,PARENT_UID,{id,answers,bankVersion:PHYSICS_ENT_VERSION});
  assert.equal(result.practice,true);assert.equal(result.saved,false);assert.equal(result.submitted,false);
  assert.equal(result.xp,0);assert.equal(result.score,10);
  assert.equal(db.data.size,0);
  assert.equal((await TESTABLE.getPhysicsEntTask(db,TIM_UID,{id})).completed,false);
  await assert.rejects(()=>TESTABLE.previewPhysicsEntTask(db,TIM_UID,{id,answers,bankVersion:PHYSICS_ENT_VERSION}),e=>e.status===403);
  await assert.rejects(()=>TESTABLE.previewPhysicsEntTask(db,PARENT_UID,{id,answers:answers.slice(1),bankVersion:PHYSICS_ENT_VERSION}),e=>e.status===400);
 }
});
