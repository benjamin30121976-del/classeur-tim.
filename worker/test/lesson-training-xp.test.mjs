import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
import {fromFields} from '../firestore.mjs';

function mockFirestore(exercise){
 const records=new Map([['exercises/'+exercise.id,exercise]]);
 return {
  records,
  async get(path){return records.get(path)||null;},
  async transaction(){return 'lesson-training-test';},
  async commit(writes){
   for(const write of writes){
    const id=write.update.name.split('/documents/')[1];
    assert.ok(id);
    if(write.currentDocument?.exists===false&&records.has(id)){
     const e=new Error('duplicate');e.status=409;throw e;
    }
    records.set(id,fromFields(write.update.fields));
   }
  }
 };
}
function training(id,subject){
 return {id,subject,kind:'training',category:'school',enabled:true,
  title:'Entraînement · '+subject,lesson:'L14',
  questions:Array.from({length:10},(_,i)=>({type:'mc',q:'Question pédagogique '+(i+1),
   options:['A','B','C','D'],right:'1',why:'On explique la méthode.'}))};
}
test('Espagnol et maths : le serveur garde 0 / 0,5 / 1 XP, sans pénalité, et une tentative unique',async()=>{
 for(const subject of ['Espagnol','Mathématiques']){
  for(const [score,expected] of [[0,0],[4,0],[5,0.5],[6,0.5],[7,1],[10,1]]){
   const id=subject==='Espagnol'?'ESE_L14_01':'MTH12_01';
   const db=mockFirestore(training(id,subject));
   const answers=Array.from({length:10},(_,i)=>i<score?1:0);
   const result=await TESTABLE.submitExercise(db,TIM_UID,{id,answers});
   assert.equal(result.submitted,true);
   assert.equal(result.xp,expected,subject+' / note '+score);
   assert.equal(db.records.get('attempts/'+id).xp,expected);
   assert.equal(db.records.get('privateAttempts/'+id).score,score);
   const state=db.records.get('xpState/tim');
   assert.equal(state.weekXp,expected);
   assert.equal(state.lost,0);
   await assert.rejects(()=>TESTABLE.submitExercise(db,TIM_UID,{id,answers}),e=>e.status===409);
   assert.equal(db.records.get('xpState/tim').weekXp,expected,'Pas de doublon XP');
  }
 }
});
test('Devoir ENT et suivi privé des traductions ne rapportent aucun XP',async()=>{
 for(const [kind,id,n] of [['ent','ENT_ES01',10],['translation-help-log','TRH_ESE_L14_01',1]]){
  const ex={...training(id,'Espagnol'),kind};
  ex.questions=ex.questions.slice(0,n);
  const db=mockFirestore(ex);
  const res=await TESTABLE.submitExercise(db,TIM_UID,{id,answers:Array(n).fill(1)});
  assert.equal(res.xp,0);
  assert.equal(db.records.get('xpState/tim').weekXp,0);
 }
});
test('Le compte Parent ne peut pas créer une tentative à la place de Tim',async()=>{
 const db=mockFirestore(training('ESE_L14_01','Espagnol'));
 await assert.rejects(()=>TESTABLE.submitExercise(db,PARENT_UID,{id:'ESE_L14_01',answers:Array(10).fill(1)}),
   e=>e.status===403);
 assert.equal(db.records.size,1);
});
