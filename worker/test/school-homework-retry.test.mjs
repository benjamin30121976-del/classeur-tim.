import test from 'node:test';
import assert from 'node:assert/strict';
import {retrySchoolHomework,schoolHomeworkRetakeStatus} from '../school-homework-retry.mjs';
import {grade} from '../../functions/grading.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
import {fromFields} from '../firestore.mjs';

const q={type:'mc',q:'Combien font deux et deux ?',options:['3','4','5','6'],
 right:'1',why:'Deux plus deux font quatre, en additionnant deux unités puis deux unités.'};
function school(id,due){
 return {id,kind:'school',category:'school',enabled:true,homeworkDue:due,
  entHomeworkOriginal:true,subject:'Mathématiques',title:'Devoir ENT du lendemain',
  questions:Array.from({length:10},()=>({...q}))};
}
function mockDb(ex,initial=4){
 const rows=new Map([
  ['attempts/'+ex.id,{exerciseId:ex.id,authorUid:TIM_UID,schoolHomework:true,
   correctionNotBefore:'2100-01-01',schoolScore:initial,schoolTotal:10,
   correctionStatus:'pending-parent',xp:0}],
  ['privateAttempts/'+ex.id,{exerciseId:ex.id,authorUid:TIM_UID,score:initial,
   answers:[{response:'0',expected:'4',correct:false}]}],
  ['xpState/tim',{weekXp:18,weekEarned:18,date:'2099-12-29'}]
 ]);
 return {
  rows,changes:[],
  async get(key){return rows.get(key)||null;},
  async transaction(){return 'test-transaction';},
  async commit(writes){
   const keys=writes.map(x=>x.update.name.split('/documents/')[1]);
   for(const [i,w] of writes.entries()){
    if(w.currentDocument?.exists===false&&rows.has(keys[i]))
     throw Object.assign(Error('duplicate'),{status:409});
   }
   for(const [i,w] of writes.entries()){
    const fields=fromFields(w.update.fields);
    rows.set(keys[i],w.update.updateMask?{...rows.get(keys[i]),...fields}:fields);
    this.changes.push(keys[i]);
   }
  }
 };
}
function api(ex){
 const key={questions:ex.questions.map(x=>({right:x.right,why:x.why}))};
 return {resolveExercise:async()=>({exercise:ex,key}),grade};
}

test('le devoir scolaire est refait ; copie initiale, note et XP originaux restent intacts',async()=>{
 const ex=school('SCH_TIM_REPRISE','2099-12-31'),db=mockDb(ex,4),impl=api(ex);
 const original=structuredClone(db.rows.get('attempts/'+ex.id));
 const firstCopy=structuredClone(db.rows.get('privateAttempts/'+ex.id));
 const xp=structuredClone(db.rows.get('xpState/tim'));
 const result=await retrySchoolHomework(db,TIM_UID,{id:ex.id,
   answers:[1,1,1,1,1,1,1,1,0,0]},impl);
 assert.equal(result.attemptNumber,2);
 assert.equal(result.score,8);
 assert.equal(result.total,10);
 assert.equal(result.xp,0);
 assert.equal(result.correctionLocked,true);
 assert.equal(result.answers,undefined);
 assert.equal(result.correction,undefined);
 assert.equal(db.rows.get('schoolHomeworkRetakes/'+ex.id+'_T2').score,8);
 assert.deepEqual(db.rows.get('attempts/'+ex.id),original);
 assert.deepEqual(db.rows.get('privateAttempts/'+ex.id),firstCopy);
 assert.deepEqual(db.rows.get('xpState/tim'),xp);
 assert.deepEqual(db.changes.sort(),[
  'schoolHomeworkRetakeState/'+ex.id,
  'schoolHomeworkRetakes/'+ex.id+'_T2'].sort());
 const status=await schoolHomeworkRetakeStatus(db,TIM_UID,{id:ex.id},impl);
 assert.equal(status.score,8);
 assert.equal(status.bestScore,8);
 assert.equal(status.canRetry,true);
 assert.deepEqual(status.scores,[{attempt:1,score:4},{attempt:2,score:8}]);
 assert.ok(!JSON.stringify(status).includes('expected'));
});

test('après une deuxième reprise à 10/10, la première note demeure et aucune nouvelle reprise',async()=>{
 const ex=school('SCH_TIM_FINAL','2099-12-31'),db=mockDb(ex,4),impl=api(ex);
 await retrySchoolHomework(db,TIM_UID,{id:ex.id,answers:Array(10).fill(0)},impl);
 const perfect=await retrySchoolHomework(db,TIM_UID,{id:ex.id,answers:Array(10).fill(1)},impl);
 assert.equal(perfect.attemptNumber,3);
 assert.equal(perfect.score,10);
 const status=await schoolHomeworkRetakeStatus(db,TIM_UID,{id:ex.id},impl);
 assert.equal(status.canRetry,false);
 assert.equal(status.attemptCount,3);
 assert.equal(status.bestScore,10);
 await assert.rejects(()=>retrySchoolHomework(db,TIM_UID,{id:ex.id,answers:Array(10).fill(0)},impl),
  error=>error.status===409);
 assert.equal(db.rows.get('attempts/'+ex.id).schoolScore,4);
});

test('date échue, autre matière non scolaire et parent refusés',async()=>{
 const past=school('SCH_TIM_PAST','2020-01-01');
 const db1=mockDb(past,2);
 await assert.rejects(()=>retrySchoolHomework(db1,TIM_UID,{id:past.id,
  answers:Array(10).fill(1)},api(past)),e=>e.status===409);
 await assert.rejects(()=>retrySchoolHomework(db1,PARENT_UID,{id:past.id,
  answers:Array(10).fill(1)},api(past)),e=>e.status===403);
 const training={...school('TRN_TIM_TEST','2099-12-31'),kind:'training',category:'training'};
 const db2=mockDb(training);
 await assert.rejects(()=>retrySchoolHomework(db2,TIM_UID,{id:training.id,
  answers:Array(10).fill(1)},api(training)),e=>e.status===409);
 assert.equal(db1.changes.length,0);
 assert.equal(db2.changes.length,0);
});

test('les copies corrigées ne sont pas transmises par le statut, même au compte Parent',async()=>{
 const ex=school('SCH_TIM_PARENT','2099-12-31'),db=mockDb(ex,7),impl=api(ex);
 await retrySchoolHomework(db,TIM_UID,{id:ex.id,answers:Array(10).fill(0)},impl);
 const parent=await schoolHomeworkRetakeStatus(db,PARENT_UID,{id:ex.id},impl);
 assert.equal(parent.score,0);
 assert.equal(parent.bestScore,7);
 assert.equal(parent.attemptCount,2);
 assert.equal(parent.canRetry,true);
 assert.equal(parent.answers,undefined);
 assert.equal(parent.why,undefined);
 assert.equal(parent.xp,undefined);
});
