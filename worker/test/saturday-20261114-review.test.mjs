import test from 'node:test';
import assert from 'node:assert/strict';
import {mixedMission} from '../mixed-challenges.mjs';
import {examineSaturdayCopy,SATURDAY_REVISION,SATURDAY_COPY_ID} from '../saturday-20261114-review.mjs';

const source=mixedMission(SATURDAY_COPY_ID);
function fixture(){
 const wrong=new Set([2,5,7,10,11,13,14,17]);
 const answers=source.questions.map((q,i)=>({
  question:q.q,
  response:q.type==='mc'?String(q.right):
    q.type==='reason'?JSON.stringify({m:q.right,c:'1+1=2',s:'Le résultat mesure 2 cm.'}):
    String(q.right),
  correct:!wrong.has(i),points:wrong.has(i)?0:1,
  expected:q.right,skill:q.skill,explanation:'Copie historique'
 }));
 answers[2].response='No voy nunca al colegio los sábados';
 answers[11].response='P = 6 + 6 = 24';
 answers[14].response='6 / 24 × 4 = 4 = 1';
 return {
  copy:{exerciseId:SATURDAY_COPY_ID,total:20,score:12,
   authorUid:'tim-fixture',answers,submittedAt:'2026-11-14T16:00:00Z'},
  publicRecord:{exerciseId:SATURDAY_COPY_ID,xp:4,authorUid:'tim-fixture'}
 };
}
test('Samedi : copie inchangée, espagnol corrigé, maths demi-points et aucun XP touché',()=>{
 const {copy,publicRecord}=fixture();
 const original=structuredClone(copy);
 const review=examineSaturdayCopy(copy,publicRecord);
 assert.equal(review.version,SATURDAY_REVISION);
 assert.equal(review.oldScore,12);
 assert.equal(review.newScore,14);
 assert.equal(review.oldXp,4);assert.equal(review.newXp,4);
 assert.deepEqual(review.changes.map(c=>c.question),[3,12,15]);
 assert.equal(review.answers[2].points,1);
 assert.equal(review.answers[11].points,.5);
 assert.equal(review.answers[14].points,.5);
 assert.equal(review.answers[11].correct,false);
 assert.equal(review.answers[14].correct,false);
 for(let i=0;i<20;i++){
  assert.equal(review.answers[i].response,copy.answers[i].response,'Réponse originale conservée');
  if(![2,11,14].includes(i))assert.deepEqual(review.answers[i],copy.answers[i]);
 }
 assert.deepEqual(copy,original,'La fonction pure ne modifie jamais la copie initiale');
 assert.match(review.answers[11].explanation,/24 cm/);
 assert.match(review.answers[14].explanation,/24\/24 = 1/);
});
test('Samedi : refus si note initiale, XP ou banque ne correspondent pas',()=>{
 for(const alter of [
  x=>x.copy.score=11,
  x=>x.publicRecord.xp=7,
  x=>x.copy.answers[0].question='Autre question',
  x=>x.copy.answers.pop(),
  x=>x.copy.gradeRevision={version:SATURDAY_REVISION},
  x=>x.copy.answers[2].points=.5,
  x=>x.copy.answers[11].response='P = 6 + 6 = 22',
  x=>x.copy.answers[14].response='6/24×4=2'
 ]){
  const state=fixture();alter(state);
  assert.throws(()=>examineSaturdayCopy(state.copy,state.publicRecord),/saturday-review/);
 }
});
test('Samedi : un résultat correct mais une fausse égalité reçoit seulement un demi-point',()=>{
 const {copy,publicRecord}=fixture();
 const report=examineSaturdayCopy(copy,publicRecord);
 for(const i of [11,14]){
  assert.equal(report.answers[i].points,.5);
  assert.match(report.answers[i].explanation,/raisonnement non vérifié/);
 }
});
