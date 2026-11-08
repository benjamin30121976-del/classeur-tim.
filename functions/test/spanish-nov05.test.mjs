import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spanishNov05Exercises} from '../spanish-nov05-private.mjs';
import {grade} from '../grading.mjs';
import {readFileSync} from 'node:fs';

test('Les corrigés espagnols restent sur le serveur, jamais dans le fichier public',()=>{
 const publicSource=readFileSync(new URL('../../espagnol-05-novembre.js',import.meta.url),'utf8');
 assert.equal(spanishNov05Exercises.length,2);
 for(const ex of spanishNov05Exercises){
  assert.ok(publicSource.includes(ex.id));
  assert.ok(ex.questions.length>0);
  assert.ok(ex.questions.every(q=>q.right!==undefined));
 }
 assert.doesNotMatch(publicSource,/"(?:right|also|why|answerKey|expected|solution|correction)"\s*:/);
});
test('Le serveur corrige correctement les 14 réponses espagnoles sans révéler les clés',()=>{
 let count=0;
 for(const ex of spanishNov05Exercises){
  const key={questions:ex.questions.map(q=>({right:q.right,also:q.also,why:q.why}))};
  const safe={...ex,questions:ex.questions.map(({right,also,why,...q})=>q)};
  const result=grade(safe,key,ex.questions.map(q=>q.right));
  assert.equal(result.score,result.total);
  assert.equal(result.total,ex.questions.length);
  count+=result.total;
 }
 assert.equal(count,14);
});
