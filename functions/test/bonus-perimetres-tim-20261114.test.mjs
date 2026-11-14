import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BONUS_PERIMETRE_TIM,bonusPerimetreTimPack} from '../bonus-perimetres-tim-20261114.mjs';
import {grade} from '../grading.mjs';
import {rawPoints,cappedPoints} from '../xp.mjs';

const ex=BONUS_PERIMETRE_TIM;
const key={questions:ex.questions.map(q=>({right:q.right,also:q.also||[],why:q.why}))};
function responses(correct=10){
 return ex.questions.map((q,i)=>{
  const answer=i<correct?String(q.right):q.type==='mc'?String((q.right+1)%4):'réponse incorrecte';
  return q.reasoningRequired?answer+' ||| '+(i<correct?'J additionne les quatre côtés et conclus avec la bonne unité.':'Je donne mon calcul écrit puis je conclus à tort.'):answer;
 });
}
function evaluate(input){return grade(ex,key,input);}
test('défi bonus de remédiation : dix questions, sans leçon fictive ni aide',()=>{
 const pack=bonusPerimetreTimPack();
 assert.deepEqual(pack.lessons,[]);
 assert.equal(pack.exercises.length,1);
 assert.equal(ex.questions.length,10);
 assert.match(ex.id,/^[A-Za-z][A-Za-z0-9_-]{1,35}$/);
 assert.equal(ex.subject,'Mathématiques');
 assert.equal(ex.kind,'bonus-day');
 assert.equal(ex.category,'bonus');
 assert.equal(ex.enabled,true);
 assert.equal(Object.hasOwn(ex,'lesson'),false);
 assert.equal(Object.hasOwn(ex,'help'),false);
 for(const q of ex.questions){
  assert(q.q.length>25 && q.why.length>90);
  assert(['mc','text'].includes(q.type));
  assert(!/\bleçon\b|\bindice\b|\baide\b/i.test(q.q));
  assert(q.skill);
  if(q.type==='mc'){
   assert.equal(q.options.length,4);
   assert.equal(new Set(q.options).size,4);
   assert(Number.isInteger(q.right)&&q.right>=0&&q.right<=3);
  }else{assert(typeof q.right==='string');assert(Array.isArray(q.also));}
 }
 const complete=evaluate(responses());
 assert.equal(complete.score,10);
 assert.equal(complete.total,10);
 assert.equal(complete.needsReview,false);
 assert(complete.answers.every(x=>x.correct===true&&x.explanation.length>90));
});
test('les erreurs constatées sont traitées, sans confondre périmètre et aire',()=>{
 assert(ex.questions.some(q=>q.q.includes('3 cm')&&q.q.includes('4 cm')));
 assert(ex.questions.some(q=>q.q.includes('6 cm')&&q.q.includes('5 cm')));
 assert(ex.questions.some(q=>q.why.includes('j\'ai pas compris')));
 assert(ex.questions.some(q=>q.why.includes('cm²')));
 const scored=evaluate(responses(0));
 assert.equal(scored.score,0);
 assert.equal(scored.total,10);
 assert(scored.answers.every(x=>x.correct===false&&x.explanation.length>90));
});
test('barème de bonus existant : 0 XP / 2,5 XP / 5 XP',()=>{
 for(const n of [0,4,5,6,7,9,10]){
  const attempt=evaluate(responses(n));
  assert.equal(attempt.score,n);
  const expected=n>=7?5:n>=5?2.5:0;
  const actual=rawPoints({kind:ex.kind,category:'challenge',score:attempt.score,total:attempt.total,needsReview:attempt.needsReview});
  assert.equal(actual,expected);
  assert.equal(cappedPoints(actual,100,0,100,20,'challenge'),expected);
 }
});
test('raisonnement écrit demandé pour les deux derniers problèmes',()=>{
 assert.equal(ex.questions.filter(q=>q.reasoningRequired).length,2);
 const full=responses();
 assert(evaluate(full).answers[9].reasoning.length>8);
 full[9]=String(ex.questions[9].right);
 assert.throws(()=>evaluate(full),/Reasoning missing/);
});
test('interface : aucune leçon avant le défi, import sans leçon accepté uniquement pour bonus',()=>{
 const app=readFileSync(new URL('../../app.js',import.meta.url),'utf8');
 const boot=readFileSync(new URL('../../boot.js',import.meta.url),'utf8');
 assert(app.includes("if(ex.kind==='bonus-day'){\n // Pas d'indice ni de renvoi à une leçon avant la validation d'un défi bonus."));
 assert(boot.includes("const bonusWithoutLesson=ex.kind==='bonus-day'&&!ex.lesson;"));
 assert(app.includes("if(lesson)p.append(button('Revoir la leçon : '+lesson.title"));
});
