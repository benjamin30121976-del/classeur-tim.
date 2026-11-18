import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
import {fromFields} from '../firestore.mjs';
const ID='BD1611_MA01',PRIVATE='privateAttempts/'+ID,PUBLIC='attempts/'+ID;
const HISTORY='gradingReviewHistory/BD1611_MA01_Q9_20261118';
const approval={mode:'apply',approval:'BD1611_MA01_Q9_PARENT_APPROVED_20261118'};
function fixture(){
 const answers=Array.from({length:10},(_,i)=>({
  question:i===8?'A,M,B et A,N,C sont alignés. AM/AB=2/5 et AN/AC=4/10. Quelle conclusion ?':'Question '+(i+1),
  response:i===8?'2':'Réponse bonne '+(i+1),
  correct:i!==8,points:i===8?0:1,expected:i===8?'Les droites (MN) et (BC) sont parallèles':'Réponse attendue',explanation:'Explication'
 }));
 const copy={exerciseId:ID,authorUid:TIM_UID,total:10,score:9,needsReview:false,answers};
 const pub={exerciseId:ID,authorUid:TIM_UID,xp:1,correctionStatus:'released'};
 const xp={weekXp:8,earned:8};
 const source={id:ID,questions:Array.from({length:10},(_,i)=>i===8?{type:'mc',q:'AM/AB=2/5 et AN/AC=4/10',options:['Autre','Sans conclusion','Les rapports sont différents','Les droites (MN) et (BC) sont parallèles']}:{type:'mc',q:'Question',options:['A','B','C','D']})};
 const store=new Map([[PRIVATE,copy],[PUBLIC,pub],['xpState/tim',xp],['exercises/'+ID,source]]);
 let commits=0;
 const db={
  transaction:async()=>('tx'),
  get:async(path)=>store.get(path)||null,
  commit:async(writes,tx)=>{
   assert.equal(tx,'tx');assert.equal(writes.length,2);
   assert.deepEqual(writes.map(w=>w.update.name.split('/documents/').at(-1)),[HISTORY,PRIVATE]);
   assert.equal(writes[0].currentDocument?.exists,false);
   assert.deepEqual(writes[1].updateMask.fieldPaths,['score','answers','gradeRevision']);
   assert.equal(store.has(HISTORY),false);
   const history=fromFields(writes[0].update.fields),patch=fromFields(writes[1].update.fields);
   store.set(HISTORY,history);
   store.set(PRIVATE,{...store.get(PRIVATE),...patch});
   commits++;
  }
 };
 return {db,store,commits:()=>commits,original:structuredClone(copy),oldPub:structuredClone(pub),oldXp:structuredClone(xp)};
}
test('Aperçu Parent sans écriture et sans nouvelle tentative',async()=>{
 const f=fixture();
 const v=await TESTABLE.correctThalesNov16Question9(f.db,PARENT_UID,{mode:'preview'});
 assert.equal(v.status,'eligible');assert.equal(v.oldScore,9);assert.equal(v.newScore,10);
 assert.equal(v.xpBefore,1);assert.equal(v.xpAfter,1);
 assert.equal(f.commits(),0);assert.deepEqual(f.store.get(PRIVATE),f.original);
});
test('Une rectification atomique, réponse conservée, autre neuf questions inchangées, XP identiques',async()=>{
 const f=fixture();
 const out=await TESTABLE.correctThalesNov16Question9(f.db,PARENT_UID,approval);
 assert.equal(out.status,'corrected');assert.equal(out.newScore,10);
 const after=f.store.get(PRIVATE),history=f.store.get(HISTORY);
 assert.deepEqual(history.originalPrivateAttempt,f.original);
 assert.equal(after.score,10);assert.equal(after.answers[8].neutralized,true);
 assert.equal(after.answers[8].points,1);
 assert.equal(after.answers[8].response,'2');
 for(let i=0;i<10;i++)if(i!==8)assert.deepEqual(after.answers[i],f.original.answers[i]);
 assert.deepEqual(f.store.get(PUBLIC),f.oldPub);assert.deepEqual(f.store.get('xpState/tim'),f.oldXp);
 assert.equal(f.commits(),1);
 const repeat=await TESTABLE.correctThalesNov16Question9(f.db,PARENT_UID,{mode:'preview'});
 assert.equal(repeat.status,'already-corrected');assert.equal(f.commits(),1);
});
test('Refus de correction à Tim, sans accord, sur une autre note ou une copie altérée',async()=>{
 for(const mutation of [
  f=>f.store.get(PRIVATE).score=8,
  f=>f.store.get(PRIVATE).answers[8].response='Pas la réponse vérifiée',
  f=>f.store.get(PRIVATE).answers[7].correct=false,
  f=>f.store.get(PUBLIC).xp=3,
  f=>f.store.get(PRIVATE).answers[8].question='Autre exercice',
  f=>f.store.set(HISTORY,{version:'différent'})
 ]){
  const f=fixture();mutation(f);
  await assert.rejects(()=>TESTABLE.correctThalesNov16Question9(f.db,PARENT_UID,approval));
  assert.equal(f.commits(),0);
 }
 const f=fixture();
 await assert.rejects(()=>TESTABLE.correctThalesNov16Question9(f.db,TIM_UID,approval));
 await assert.rejects(()=>TESTABLE.correctThalesNov16Question9(f.db,PARENT_UID,{mode:'apply',approval:''}));
 assert.equal(f.commits(),0);
});