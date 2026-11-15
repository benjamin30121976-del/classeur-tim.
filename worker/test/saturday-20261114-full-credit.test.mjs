import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {PARENT_UID,TIM_UID} from '../auth.mjs';
import {fromFields} from '../firestore.mjs';
import {mixedMission} from '../mixed-challenges.mjs';
import {prepareSaturdayFullCredit,SATURDAY_FULL_CREDIT_VERSION,
 SATURDAY_FULL_CREDIT_ARCHIVE} from '../saturday-20261114-full-credit.mjs';
import {SATURDAY_COPY_ID,SATURDAY_REVISION} from '../saturday-20261114-review.mjs';

const id=SATURDAY_COPY_ID;
function fixture({date='2026-11-15'}={}){
 const m=mixedMission(id),bad=new Set([5,7,10,13,17]);
 const answers=m.questions.map((q,i)=>({
  question:q.q,response:String(q.right),points:bad.has(i)?0:1,
  correct:!bad.has(i),expected:q.why,explanation:q.why||'',skill:q.skill
 }));
 answers[2].response='No voy nunca al colegio los sábados';
 answers[11]={...answers[11],response:'6+6 = 12\n12x2 = 24',points:0.5,correct:false,
  explanation:'Résultat juste, calcul non vérifié'};
 answers[14]={...answers[14],response:'6/24 = 0,25 0,25x4 = 1',points:0.5,correct:false,
  explanation:'Résultat juste, calcul non vérifié'};
 const current={exerciseId:id,authorUid:TIM_UID,score:14,total:20,answers,
  submittedAt:'2026-11-14T16:00:00Z',
  gradeRevision:{version:SATURDAY_REVISION,originalScore:12,correctedScore:14}};
 const pub={exerciseId:id,authorUid:TIM_UID,xp:4,correctionStatus:'released',
  submittedAt:'2026-11-14T16:00:00Z'};
 const xp={week:'2026-11-09',date,weekXp:30,weekEarned:31,earned:5,lost:1,bonus:0,policyVersion:18};
 const prev={version:SATURDAY_REVISION,originalScore:12,correctedScore:14,
  originalPrivateAttempt:{score:12},originalPublicAttempt:{xp:4}};
 const stored=new Map([
  ['privateAttempts/'+id,current],['attempts/'+id,pub],['xpState/tim',xp],
  ['gradingReviewHistory/'+id,prev]
 ]);
 let writes=0;
 const db={
  transaction:async()=>('tx-1'),
  get:async(path)=>stored.get(path)||null,
  commit:async(batch,tx)=>{
   assert.equal(tx,'tx-1');assert.equal(batch.length,4);
   const paths=batch.map(x=>x.update.name.split('/documents/')[1]);
   assert.deepEqual(paths,[SATURDAY_FULL_CREDIT_ARCHIVE,
    'privateAttempts/'+id,'attempts/'+id,'xpState/tim']);
   assert.equal(batch[0].currentDocument?.exists,false);
   assert.deepEqual(batch[1].updateMask.fieldPaths,['score','answers','gradeRevision']);
   assert.deepEqual(batch[2].updateMask.fieldPaths,['xp']);
   assert.deepEqual(batch[3].updateMask.fieldPaths,date==='2026-11-15'?
    ['weekXp','weekEarned']:['weekXp','weekEarned','earned']);
   if(stored.has(SATURDAY_FULL_CREDIT_ARCHIVE))throw Error('Archive must be unique');
   batch.forEach(x=>{
    const p=x.update.name.split('/documents/')[1];
    const obj=fromFields(x.update.fields);
    stored.set(p,x.updateMask?{...stored.get(p),...obj}:obj);
   });
   writes++;
  }
 };
 return {db,stored,writes:()=>writes,
  initial:{copy:structuredClone(current),pub:structuredClone(pub),
   xp:structuredClone(xp),previous:structuredClone(prev)}};
}
const apply={mode:'apply',approval:'WEEK_2026W46_FULL_CREDIT_PARENT_20261115'};
test('Calculs de Tim justes : chacun obtient 1/1 ; les 18 autres corrections restent inchangées',()=>{
 const {initial}=fixture();
 const plan=prepareSaturdayFullCredit(initial.copy,initial.pub,initial.xp,initial.previous);
 assert.equal(plan.scoreAfter,15);assert.equal(plan.xpAfter,7);
 assert.equal(plan.deltaXp,3);
 assert.deepEqual(plan.changes,[{question:12,from:0.5,to:1},{question:15,from:0.5,to:1}]);
 assert.equal(plan.answers[11].points,1);assert.equal(plan.answers[14].points,1);
 for(let i=0;i<20;i++){
  assert.equal(plan.answers[i].response,initial.copy.answers[i].response);
  if(i!==11&&i!==14)assert.deepEqual(plan.answers[i],initial.copy.answers[i]);
 }
 assert.match(plan.answers[11].explanation,/formule du périmètre/);
 assert.match(plan.answers[14].explanation,/fraction en nombre décimal/);
});
test('Aperçu de la vraie opération : zéro écriture, bon score et XP',async()=>{
 const {db,stored,writes}=fixture();
 const before=structuredClone(stored.get('xpState/tim'));
 const out=await TESTABLE.correctSaturdayFullCredit(db,PARENT_UID,{mode:'preview'});
 assert.deepEqual(out,{status:'eligible',fromScore:14,toScore:15,
  fromXp:4,toXp:7,xpDelta:3,questions:[12,15],noWrite:true});
 assert.equal(writes(),0);assert.deepEqual(stored.get('xpState/tim'),before);
});
test('Transaction unique : archive de la copie, 15/20, +3 XP, aucune nouvelle tentative',async()=>{
 const {db,stored,writes,initial}=fixture();
 const out=await TESTABLE.correctSaturdayFullCredit(db,PARENT_UID,apply);
 assert.deepEqual(out,{status:'corrected',score:15,total:20,xp:7,xpDelta:3,
  questions:[12,15],historySaved:true,attemptStillUnique:true});
 assert.equal(writes(),1);
 const current=stored.get('privateAttempts/'+id);
 const pub=stored.get('attempts/'+id);
 const xp=stored.get('xpState/tim');
 const arc=stored.get(SATURDAY_FULL_CREDIT_ARCHIVE);
 assert.equal(current.score,15);assert.equal(pub.xp,7);
 assert.equal(xp.weekXp,33);assert.equal(xp.weekEarned,34);
 assert.equal(xp.earned,5);assert.equal(xp.lost,1);
 assert.equal(xp.date,'2026-11-15');
 assert.deepEqual(arc.originalPrivateAttempt,initial.copy);
 assert.deepEqual(arc.originalPublicAttempt,initial.pub);
 assert.deepEqual(arc.originalXpState,initial.xp);
 assert.deepEqual(stored.get('gradingReviewHistory/'+id),initial.previous);
 assert.equal(current.answers[11].points,1);assert.equal(current.answers[14].points,1);
 for(let i=0;i<20;i++)
  assert.equal(current.answers[i].response,initial.copy.answers[i].response);
 const again=await TESTABLE.correctSaturdayFullCredit(db,PARENT_UID,apply);
 assert.equal(again.status,'already-corrected');assert.equal(writes(),1);
});
test('Si la date est encore samedi, mettre à jour également les XP quotidiens',async()=>{
 const {db,stored}=fixture({date:'2026-11-14'});
 const out=await TESTABLE.correctSaturdayFullCredit(db,PARENT_UID,apply);
 assert.equal(out.status,'corrected');
 assert.equal(stored.get('xpState/tim').earned,8);
});
test('Sécurité : aucun autre profil, aucune approbation manquante, banque/tentative/XP inattendus',async()=>{
 const {db,writes}=fixture();
 await assert.rejects(TESTABLE.correctSaturdayFullCredit(db,TIM_UID,apply));
 await assert.rejects(TESTABLE.correctSaturdayFullCredit(db,PARENT_UID,{mode:'apply'}));
 assert.equal(writes(),0);
 for(const mutate of [
  x=>x.stored.get('privateAttempts/'+id).score=14.5,
  x=>x.stored.get('privateAttempts/'+id).answers[11].response='6+6=24',
  x=>x.stored.get('privateAttempts/'+id).answers[14].response='6/24=1',
  x=>x.stored.get('privateAttempts/'+id).answers[14].points=1,
  x=>x.stored.get('privateAttempts/'+id).answers[2].points=.5,
  x=>x.stored.get('attempts/'+id).xp=7,
  x=>x.stored.get('xpState/tim').week='2026-11-16',
  x=>x.stored.get('xpState/tim').weekEarned=3,
  x=>x.stored.delete('gradingReviewHistory/'+id),
  x=>x.stored.set(SATURDAY_FULL_CREDIT_ARCHIVE,{version:'other'})
 ]){
  const x=fixture();mutate(x);
  await assert.rejects(TESTABLE.correctSaturdayFullCredit(x.db,PARENT_UID,apply));
  assert.equal(x.writes(),0);
 }
});
