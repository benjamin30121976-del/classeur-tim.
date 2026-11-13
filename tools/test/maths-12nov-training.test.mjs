import test from 'node:test';
import assert from 'node:assert/strict';
import {mathNov12ForParentImport,mathNov12Score,mathNov12PublicTask,MATH12_IDS} from '../../maths-12nov-training.mjs';
test('une leçon du 12 novembre et trois exercices de 10 questions, sans inventer le manuel',()=>{
 const pack=mathNov12ForParentImport();
 assert.equal(pack.lessons.length,1);
 assert.equal(pack.exercises.length,3);
 assert.match(pack.lessons[0].blocks[0].body,/l’exercice 25 page 253/);
 for(const ex of pack.exercises){
  assert.equal(ex.questions.length,10);
  assert.equal(ex.category,'school');
  assert(ex.questions.every(q=>q.options.length===4&&new Set(q.options).size===4));
  assert(ex.questions.every(q=>q.q.length>12&&q.why.length>10));
  const publicTask=mathNov12PublicTask(ex.id,ex);
  assert.equal(publicTask.questions.length,10);
  assert(publicTask.questions.every(q=>!Object.hasOwn(q,'right')&&!Object.hasOwn(q,'why')));
 }
});
test('correction complète sur 10 et résumé pour chaque exercice',()=>{
 const pack=mathNov12ForParentImport();
 for(const ex of pack.exercises){
  const answers=ex.questions.map(q=>Number(q.right));
  const score=mathNov12Score(ex.id,answers);
  assert.equal(score.score,10);
  assert.equal(score.items.length,10);
  assert(score.items.every(x=>x.expected&&x.explanation));
  const wrong=answers.slice();wrong[0]=(wrong[0]+1)%4;
  assert.equal(mathNov12Score(ex.id,wrong).score,9);
  assert.equal(mathNov12Score(ex.id,[]),null);
 }
});


test('barème maths BIS : 7/10 = +1 XP, 5/10 = +0,5 XP et 4/10 = 0 XP',()=>{
 for(const ex of mathNov12ForParentImport().exercises){
  const correct=ex.questions.map(q=>Number(q.right));
  for(const [n,expected] of [[0,1],[3,1],[4,0.5],[5,0.5],[6,0]]){
   const answers=correct.map((value,i)=>i<n?(value+1)%4:value);
   const result=mathNov12Score(ex.id,answers);
   assert.equal(result.score,10-n);
   assert.equal(result.xp,expected);
  }
 }
});
