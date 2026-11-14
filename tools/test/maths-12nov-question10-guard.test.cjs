'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {planQuestion10,OLD}=require('../../outils/mth12-question10-guard.cjs');
const expectedPromise=import('../../maths-12nov-training.mjs').then(m=>m.mathNov12ForParentImport().exercises.find(x=>x.id==='MTH12_03'));
const legacy=expected=>({...expected,questions:expected.questions.map((q,i)=>i===9?{...OLD}:{...q})});
test('question 10 : seule cette question change, les 9 précédentes restent intactes',async()=>{
 const expected=await expectedPromise,stored=legacy(expected);
 const plan=planQuestion10(JSON.stringify(stored),expected,{});
 assert.equal(plan.status,'ready');
 const updated=JSON.parse(plan.nextPayload);
 assert.deepEqual(updated.questions.slice(0,9),stored.questions.slice(0,9));
 assert.deepEqual(updated.questions[9],expected.questions[9]);
 assert.equal(updated.title,stored.title);
 assert.equal(updated.id,'MTH12_03');
 assert.equal(planQuestion10(plan.nextPayload,expected,{}).status,'already-corrected');
});
test('question 10 : les résultats ou corrections déjà présents bloquent toute modification',async()=>{
 const expected=await expectedPromise,raw=JSON.stringify(legacy(expected));
 for(const flag of ['attempt','privateAttempt','releasedCorrection'])
  assert.throws(()=>planQuestion10(raw,expected,{[flag]:true}),/STOP : une copie\/correction/);
});
test('question 10 : refuser une banque prioritaire, une question inconnue ou un énoncé modifié',async()=>{
 const expected=await expectedPromise,raw=JSON.stringify(legacy(expected));
 for(const flag of ['publicExercise','answerKey'])
  assert.throws(()=>planQuestion10(raw,expected,{[flag]:true}),/STOP : banque publique/);
 const altered=legacy(expected);altered.questions[9].q='Nouvelle question inconnue';
 assert.throws(()=>planQuestion10(JSON.stringify(altered),expected,{}),/STOP : question 10 inconnue/);
 const changedOther=legacy(expected);changedOther.questions[0].q='Question numéro un modifiée';
 assert.throws(()=>planQuestion10(JSON.stringify(changedOther),expected,{}),/STOP : les neuf autres questions/);
});
test('question 10 : état déjà corrigé ne provoque aucune nouvelle écriture',async()=>{
 const expected=await expectedPromise,raw=JSON.stringify(expected);
 const plan=planQuestion10(raw,expected,{attempt:true});
 assert.equal(plan.status,'already-corrected');
 assert.equal(plan.nextPayload,raw);
});
