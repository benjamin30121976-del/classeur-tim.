import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {grade} from '../../functions/grading.mjs';

const pack=JSON.parse(fs.readFileSync(new URL('../../packs/bonus-nazisme-cahier-16nov-v2.json',import.meta.url),'utf8'));
const lesson=pack.lessons[0], ex=pack.exercises[0];
const key={questions:ex.questions.map(({right,also,why})=>({right,also,why}))};
const submit=answers=>grade(ex,key,answers);
const answers=ex.questions.map(q=>q.type==='mc'?String(q.right):q.right);

test('La leçon est complémentaire au cahier, sans remplacer le cours ENT',()=>{
 assert.equal(pack.lessons.length,1);
 assert.equal(ex.id,'BD1611_HG02');
 assert.equal(ex.supersedesExerciseId,'BD1611_HG01');
 assert.equal(ex.homeworkDue,'2026-11-16');
 assert.equal(ex.lesson,lesson.id);
 assert.match(lesson.source,/photo/i);
 assert.match(ex.originalSourceStatus,/ENT n’énumère pas/i);
 assert.equal(pack.exercises.length,1);
});

test('Dix questions progressives : cinq QCM puis cinq mots à écrire',()=>{
 assert.equal(ex.questions.length,10);
 assert.equal(ex.questions.filter(x=>x.type==='mc').length,5);
 assert.equal(ex.questions.filter(x=>x.type==='text').length,5);
 assert.deepEqual(ex.questions.slice(5).map(x=>x.right),
  ['autoritaire','antiparlementaire','nationaliste','raciste','antisémite']);
 for(const [i,q] of ex.questions.entries()){
  assert(q.q?.trim() && q.why?.trim(), 'Question '+(i+1)+' incomplète');
  if(q.type==='mc'){
   assert.equal(q.options.length,4);
   assert.equal(new Set(q.options).size,4);
   assert(Number.isInteger(q.right)&&q.right>=0&&q.right<4);
  }
 }
});

test('Correction côté serveur : dix bonnes réponses donnent 10/10',()=>{
 const result=submit(answers);
 assert.equal(result.score,10);
 assert.equal(result.total,10);
 assert.equal(result.needsReview,false);
 assert(result.answers.every(a=>a.correct&&a.explanation?.trim()));
});

test('Les 15 distracteurs QCM sont tous notés faux',()=>{
 for(let i=0;i<5;i++){
  for(let choice=0;choice<4;choice++){
   if(choice===ex.questions[i].right)continue;
   const attempt=[...answers];attempt[i]=String(choice);
   const outcome=submit(attempt);
   assert.equal(outcome.score,9, 'Question '+i+' option '+choice+' incorrecte mais acceptée');
   assert.equal(outcome.answers[i].correct,false);
  }
 }
});

test('Chaque erreur écrite est pénalisée avec explication',()=>{
 for(let i=5;i<10;i++){
  const attempt=[...answers];attempt[i]='inexact';
  const outcome=submit(attempt);
  assert.equal(outcome.score,9);
  assert.equal(outcome.answers[i].correct,false);
  assert(outcome.answers[i].explanation.length>50);
 }
 const allWrong=submit(ex.questions.map(q=>q.type==='mc'?String((q.right+1)%4):'inexact'));
 assert.equal(allWrong.score,0);
});

test('Aucune altération de l’ancien questionnaire ni des tentatives',()=>{
 assert(!pack.exercises.some(x=>x.id==='BD1611_HG01'));
 const app=fs.readFileSync(new URL('../../app.js',import.meta.url),'utf8');
 assert.match(app,/newerNazismBonus/);
 assert.match(app,/id==='BD16_HG_CAHIER'\?'HG_BIS09':id/);
 assert.match(app,/!attemptFor\(e\.id\)/);
 assert(!/deleteDoc\(.*BD1611_HG01/.test(app));
});
