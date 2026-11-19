import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
import {fromFields} from '../firestore.mjs';

function mockFirestore(exercise){
 const records=new Map([['exercises/'+exercise.id,exercise]]);
 return {
  records,
  async get(key){return records.get(key)||null;},
  async list(collection){return [...records.entries()]
    .filter(([key])=>key.startsWith(collection+'/'))
    .map(([key,data])=>({id:key.slice(collection.length+1),data}));},
  async transaction(){return 'school-homework-simulation';},
  async commit(writes){
   for(const write of writes){
    const id=write.update.name.split('/documents/')[1];
    assert.ok(id);
    if(write.currentDocument?.exists===false&&records.has(id)){
     const e=new Error('duplicate');e.status=409;throw e;
    }
    const fields=fromFields(write.update.fields);
    records.set(id,write.update.updateMask?{...records.get(id),...fields}:fields);
   }
  }
 };
}
function school(id,due){
 const q={type:'mc',q:'Combien font deux plus deux ?',
  options:['3','4','5','6'],right:'1',
  why:'Deux plus deux font quatre : on additionne deux unités et deux unités.'};
 return {id,kind:'school',category:'school',enabled:true,
   subject:'Mathématiques',title:'Devoir original ENT',
   entHomeworkOriginal:true,homeworkDue:due,linkedHomework:['ENT_HW_ID'],
   questions:Array.from({length:10},()=>({...q}))};
}
test('devoir pour demain : note et zéro XP, aucune correction ni réponse divulguée',async()=>{
 const id='SCH_MATH_FUTURE',db=mockFirestore(school(id,'2099-12-31'));
 const response=await TESTABLE.submitExercise(db,TIM_UID,{id,answers:Array(10).fill(1)});
 assert.equal(response.score,10);
 assert.equal(response.total,10);
 assert.equal(response.xp,0);
 assert.equal(response.correctionStatus,'pending-parent');
 assert.equal(response.correctionLocked,true);
 assert.equal(response.answers,undefined,'la bonne réponse ne quitte pas le serveur');
 const attempt=db.records.get('attempts/'+id);
 assert.equal(attempt.schoolScore,10);
 assert.equal(attempt.schoolTotal,10);
 assert.equal(attempt.correctionNotBefore,'2100-01-01');
 assert.equal((await TESTABLE.releasedCorrections(db,TIM_UID)).corrections.length,0);
 await assert.rejects(()=>TESTABLE.releaseCorrection(db,PARENT_UID,{id,released:true}),
   error=>error.status===409);
 assert.equal(db.records.get('attempts/'+id).correctionStatus,'pending-parent');
});
test('devoir scolaire échu : note et corrigé accessibles après la date, sans seconde tentative',async()=>{
 const id='SCH_MATH_PAST',db=mockFirestore(school(id,'2026-01-01'));
 const submitted=await TESTABLE.submitExercise(db,TIM_UID,{id,answers:Array(10).fill(1)});
 assert.equal(submitted.correctionStatus,'released');
 assert.equal(submitted.answers.length,10);
 assert.equal(submitted.xp,0);
 assert.equal((await TESTABLE.releasedCorrections(db,TIM_UID)).corrections[0].score,10);
 await assert.rejects(()=>TESTABLE.submitExercise(db,TIM_UID,{id,answers:Array(10).fill(1)}),
   error=>error.status===409);
});
