import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {PARENT_UID,TIM_UID} from '../auth.mjs';
import {fromFields} from '../firestore.mjs';
import {mixedMission} from '../mixed-challenges.mjs';

const ID='WEEK_2026W46',PATH='privateAttempts/'+ID;
function fixture(extra={}){
 const mission=mixedMission(ID),wrong=new Set([2,5,7,10,11,13,14,17]);
 const answers=mission.questions.map((q,i)=>({
  question:q.q,
  response:q.type==='mc'?String(q.right):
   q.type==='reason'?JSON.stringify({m:q.right,c:'1+1=2',s:'Le résultat vaut 2 cm.'}):String(q.right),
  correct:!wrong.has(i),points:wrong.has(i)?0:1,expected:q.right,skill:q.skill
 }));
 answers[2].response='No voy nunca al colegio los sábados';
 answers[11].response='P = 6 + 6 = 24';
 answers[14].response='6 / 24 × 4 = 4 = 1';
 const old={exerciseId:ID,authorUid:TIM_UID,total:20,score:12,answers,needsReview:false,
  submittedAt:'2026-11-14T16:00:00.000Z',reviewChanges:[]};
 const pub={exerciseId:ID,authorUid:TIM_UID,xp:4,correctionStatus:'released',
  submittedAt:'2026-11-14T16:00:00.000Z'};
 const original=structuredClone(old),originalPublic=structuredClone(pub);
 const store=new Map([[PATH,old],['attempts/'+ID,pub],['xpState/tim',{weekXp:4,earned:4}]]);
 let commits=0;
 const db={
  transaction:async()=>({transaction:'fixture'}),
  get:async(path)=>store.get(path)||null,
  commit:async(writes)=>{
   assert.equal(writes.length,2,'Seule archive + note corrigée sont autorisées');
   const writesMap=writes.map(x=>({path:x.update.name.split('/documents/').at(-1),
    data:fromFields(x.update.fields),mask:x.updateMask?.fieldPaths||null,
    exists:x.currentDocument?.exists}));
   assert.deepEqual(writesMap.map(x=>x.path),['gradingReviewHistory/'+ID,PATH]);
   assert.equal(writesMap[0].exists,false,'La sauvegarde historique est créée une seule fois');
   assert.deepEqual(writesMap[1].mask,['score','answers','gradeRevision']);
   assert.equal(store.has(writesMap[0].path),false);
   store.set(writesMap[0].path,writesMap[0].data);
   store.set(PATH,{...store.get(PATH),...writesMap[1].data});
   commits++;
  }
 };
 for(const [key,value] of Object.entries(extra))store.set(key,value);
 return {db,store,original,originalPublic,commits:()=>commits};
}
const apply={mode:'apply',approval:'WEEK_2026W46_PARENT_REQUEST_20261115'};
test('Aperçu Parent : 0 écriture, XP identiques et 3 questions seulement',async()=>{
 const {db,store,original,commits}=fixture();
 const out=await TESTABLE.reviseSaturday20261114(db,PARENT_UID,{mode:'preview'});
 assert.equal(out.status,'eligible');
 assert.equal(out.xpUnchanged,true);
 assert.deepEqual(out.questions,[3,12,15]);
 assert.equal(commits(),0);
 assert.deepEqual(store.get(PATH),original);
});
test('Rectification Parent atomique : sauvegarder original, mettre note/correction à jour, ne toucher ni XP ni tentatives',async()=>{
 const {db,store,original,originalPublic,commits}=fixture();
 const oldXp=structuredClone(store.get('xpState/tim'));
 const out=await TESTABLE.reviseSaturday20261114(db,PARENT_UID,apply);
 assert.equal(out.status,'corrected');
 assert.equal(out.originalArchived,true);
 assert.equal(out.xpUnchanged,true);
 assert.equal(out.attemptUntouched,true);
 assert.equal(commits(),1);
 const archive=store.get('gradingReviewHistory/'+ID);
 assert.deepEqual(archive.originalPrivateAttempt,original);
 assert.deepEqual(archive.originalPublicAttempt,originalPublic);
 const corrected=store.get(PATH);
 assert.equal(corrected.score,14);
 assert.equal(corrected.answers[2].points,1);
 assert.equal(corrected.answers[11].points,.5);
 assert.equal(corrected.answers[14].points,.5);
 for(let i=0;i<20;i++)assert.equal(corrected.answers[i].response,original.answers[i].response);
 assert.equal(corrected.submittedAt,original.submittedAt);
 assert.deepEqual(store.get('attempts/'+ID),originalPublic);
 assert.deepEqual(store.get('xpState/tim'),oldXp);
 const second=await TESTABLE.reviseSaturday20261114(db,PARENT_UID,apply);
 assert.equal(second.status,'already-corrected');
 assert.equal(commits(),1,'Rejouer la correction ne doit pas réécrire');
});
test('Parent uniquement, accord requis, interdiction de corriger une copie divergente',async()=>{
 const {db,commits}=fixture();
 await assert.rejects(TESTABLE.reviseSaturday20261114(db,TIM_UID,apply));
 await assert.rejects(TESTABLE.reviseSaturday20261114(db,PARENT_UID,{mode:'apply'}));
 assert.equal(commits(),0);
 for(const mut of [
  state=>{state.store.get(PATH).score=13},
  state=>{state.store.get(PATH).answers[1].question='changé'},
  state=>{state.store.get('attempts/'+ID).xp=7},
  state=>{state.store.get(PATH).answers[2].points=.5},
  state=>{state.store.get(PATH).answers[11].response='P=6+6=23'},
  state=>{state.store.get(PATH).answers[14].response='6/24×4=2'}
 ]){
  const state=fixture();mut(state);
  await assert.rejects(TESTABLE.reviseSaturday20261114(state.db,PARENT_UID,apply));
  assert.equal(state.commits(),0);
 }
});
