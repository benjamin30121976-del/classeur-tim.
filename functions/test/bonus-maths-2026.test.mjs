import test from 'node:test';
import assert from 'node:assert/strict';
import {BONUS_MATH_2026,bonusMathPack} from '../bonus-maths-2026.mjs';
import {grade,normalizeMath} from '../grading.mjs';
import {rawPoints,cappedPoints} from '../xp.mjs';

const asSubmission=(ex,correct=10)=>{
 const responses=ex.questions.map((q,i)=>{
  const value=q.type==='mc'?String(q.right):String(q.right);
  const actual=i<correct?value:(q.type==='mc'?String((Number(q.right)+1)%4):'réponse inexacte');
  return q.reasoningRequired?actual+' ||| '+(i<correct?'Je détaille les étapes de calcul et conclus correctement.':'Je décris ici les étapes de mon calcul à revoir.'):actual;
 });
 return responses;
};
const evaluate=(ex,responses)=>grade(ex,{questions:ex.questions.map(q=>({right:q.right,also:q.also,why:q.why}))},responses);

test('sept bonus de mathématiques et exactement 70 questions complètes',()=>{
 const pack=bonusMathPack();
 assert.equal(pack.lessons.length,0);assert.equal(pack.exercises.length,7);
 assert.equal(new Set(BONUS_MATH_2026.map(ex=>ex.id)).size,7);
 for(const ex of BONUS_MATH_2026){
  assert.equal(ex.questions.length,10);assert.equal(ex.subject,'Mathématiques');
  assert.equal(ex.kind,'bonus-day');assert.equal(ex.category,'bonus');assert.equal(ex.enabled,true);
  assert(/^(MBIS0[236]|MBIS11|MBIS15|ENT-EQUATIONS|ENT-FACTORISATION)$/.test(ex.lesson));
  ex.questions.forEach(q=>{
   assert(['mc','text'].includes(q.type));
   assert(q.q.length>12);assert(q.why.length>20);assert(q.skill);
   if(q.type==='mc'){assert.equal(q.options.length,4);assert(new Set(q.options).size===4);assert(Number.isInteger(q.right)&&q.right>=0&&q.right<=3);}
   else assert.equal(typeof q.right,'string');
  });
  const result=evaluate(ex,asSubmission(ex));assert.equal(result.score,10);
  assert.equal(result.total,10);assert.equal(result.needsReview,false);
  assert(result.answers.every(a=>a.correct&&a.explanation.length>20));
 }
});
test('les 7 exercices ont bien 0, 5, 7 et 10 réponses, et une correction explicative',()=>{
 for(const ex of BONUS_MATH_2026){
  for(const n of [0,4,5,6,7,9,10]){
   const out=evaluate(ex,asSubmission(ex,n));
   assert.equal(out.score,n);
   assert.equal(out.answers.length,10);
   const expected=n>=7?5:n>=5?2.5:0;
   const points=rawPoints({kind:ex.kind,category:'challenge',score:out.score,total:out.total,needsReview:out.needsReview});
   assert.equal(points,expected);
   assert.equal(cappedPoints(points,150,0,150,50,'challenge'),expected,'pas de plafond bonus');
  }
 }
});
test('orthographe mathématique et justification écrite sans correction humaine',()=>{
 assert.equal(normalizeMath('−2x − 6'),normalizeMath('-2x-6'));
 assert.equal(normalizeMath('4⁵'),normalizeMath('4^5'));
 const math=BONUS_MATH_2026[3],q=math.questions[2];
 const a=asSubmission(math);a[2]='-2x - 6';
 assert.equal(evaluate(math,a).answers[2].correct,true);
 assert.throws(()=>evaluate(math,asSubmission(math).map((r,i)=>i===6?'5x - 7 ||| court':r)),/Reasoning missing/);
 const good=evaluate(math,asSubmission(math));
 assert(good.answers[6].reasoning.includes('Je détaille'));
});
