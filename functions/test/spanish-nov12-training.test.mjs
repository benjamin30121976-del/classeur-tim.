import assert from 'node:assert/strict';
import test from 'node:test';
import {nov12IdValid,nov12TaskIds,nov12TaskPublic,nov12Evaluate} from '../spanish-nov12-training.mjs';

const answers=[
 [1,2,0,3,1,0,2,1,0,3],
 ['sino','Nunca','nada','empiezo','sur','verano','empiezas','empieza','empezamos','invierno'],
 ['nunca','nada','el hemisferio sur','empiezo','empiezas','empieza','el invierno','el verano','septiembre','sino']
];

test('seulement trois séries ESE_L14, dix questions chacune sans corrigé envoyé au navigateur',()=>{
 assert.deepEqual(nov12TaskIds(),['ESE_L14_01','ESE_L14_02','ESE_L14_03']);
 assert.equal(nov12IdValid('ESE_L15_01'),false);
 for(const id of nov12TaskIds()){
  const task=nov12TaskPublic(id);
  assert.equal(task.questions.length,10);
  assert.ok(task.questions.every(q=>q.instructionEs&&q.instructionFr));
  assert.ok(task.questions.every(q=>q.kind==='qcm'||q.kind==='gap'||q.kind==='write'));
  for(const q of task.questions){
   assert.equal(Object.hasOwn(q,'right'),false);
   assert.equal(Object.hasOwn(q,'expected'),false);
   assert.equal(Object.hasOwn(q,'explanation'),false);
  }
 }
});

test('corrigés serveur complets avec note sur 10 et bilan des erreurs',()=>{
 for(const [index,id] of nov12TaskIds().entries()){
  const report=nov12Evaluate(id,answers[index],Array(10).fill(false));
  assert.equal(report.score,10);
  assert.equal(report.items.length,10);
  assert.equal(report.xp,1);
  assert.ok(report.items.every(q=>q.correct&&q.expected&&q.explanation));
  const wrong=[...answers[index]];
  wrong[0]=index===0?0:'réponse fausse';
  const failed=nov12Evaluate(id,wrong,Array(10).fill(true));
  assert.equal(failed.score,9);
  assert.equal(failed.translationHelpCount,10);
  assert.ok(Object.keys(failed.errorCounts).length>0);
  assert.equal(nov12Evaluate(id,[],Array(10).fill(false)),null);
 }
});


test('barème du 12 novembre : 7/10 donne +1 XP, 5/10 +0,5 XP, moins de 5 donne 0',()=>{
 for(const [wrongCount,expected] of [[0,1],[3,1],[4,0.5],[5,0.5],[6,0]]){
  const testAnswers=answers[0].map((value,i)=>i<wrongCount?(value+1)%4:value);
  const result=nov12Evaluate('ESE_L14_01',testAnswers,Array(10).fill(false));
  assert.equal(result.score,10-wrongCount);
  assert.equal(result.xp,expected);
 }
});
