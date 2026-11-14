import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {BONUS_PERIMETRE_TIM,bonusPerimetreTimPack} from '../bonus-perimetres-tim-20261114.mjs';
import {grade} from '../grading.mjs';
import {rawPoints,cappedPoints} from '../xp.mjs';

const ex=BONUS_PERIMETRE_TIM;
const key={questions:ex.questions.map(q=>({right:q.right,also:q.also||[],why:q.why}))};
function writeMethod(q,good=true){
 if(q.reasoningCheck?.kind!=='rectangle-perimeter-v1')return good?
  'Je détaille les étapes de calcul et conclus correctement.':'Je décris ici des étapes à revoir.';
 const {length:l,width:w,unit}=q.reasoningCheck,total=2*(l+w);
 return JSON.stringify(good?
  {calculation:`2 × (${l} + ${w}) = ${total} ${unit}`,conclusion:unit==='cm'?
   `Le périmètre du rectangle est de ${total} cm.`:`Il faut ${total} m de clôture pour entourer le potager.`}:
  {calculation:`${l} × ${w} = ${l*w}`,conclusion:'Je donne une phrase-réponse incorrecte.'});
}
function responses(correct=10){
 return ex.questions.map((q,i)=>{
  const good=i<correct;
  const answer=good?String(q.right):q.type==='mc'?String((q.right+1)%4):'réponse incorrecte';
  return q.reasoningRequired?answer+' ||| '+writeMethod(q,good):answer;
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

test('import Parent protégé : aucun lancement sans autorisation explicite',()=>{
 const script=readFileSync(new URL('../../outils/publier-bonus-perimetres-via-parent.cjs',import.meta.url),'utf8');
 assert.doesNotThrow(()=>new Script(script), 'Syntaxe de l import Parent');
 assert(script.includes("process.env.TIM_BONUS_PERIMETRES_CONFIRME==='OUI'"));
 assert(script.includes("bonusPerimetreTimPack()"));
 assert(script.includes("assert.deepEqual(verified,{found:1,questions:10})"));
});

test('résultat juste mais calcul faux : pas de point entier',()=>{
 const answers=responses(),q=ex.questions[8];
 answers[8]=String(q.right)+' ||| '+JSON.stringify({
  calculation:'8 × 4 = 32',conclusion:'Le périmètre du rectangle est de 24 cm.'
 });
 const graded=evaluate(answers),answer=graded.answers[8];
 assert.equal(answer.points,0.5);assert.equal(answer.correct,false);
 assert.equal(graded.score,9.5);
 assert.equal(answer.reasoningDetails.calculationCorrect,false);
 assert.match(answer.explanation,/Ton résultat numérique est juste/);
});
test('calcul juste et bonne conclusion, mais résultat saisi faux : crédit partiel',()=>{
 const answers=responses(),q=ex.questions[8];
 answers[8]='32 cm ||| '+writeMethod(q,true);
 const out=evaluate(answers);
 assert.equal(out.answers[8].points,0.5);
 assert.equal(out.answers[8].correct,false);
 assert.equal(out.score,9.5);
});
test('calcul faux prétendant produire le bon résultat : rejet',()=>{
 const answers=responses(),q=ex.questions[8];
 answers[8]=String(q.right)+' ||| '+JSON.stringify({
  calculation:'8 × 4 = 24',conclusion:'Le périmètre du rectangle est de 24 cm.'
 });
 const out=evaluate(answers).answers[8];
 assert.equal(out.correct,false);
 assert.equal(out.points,0.5);
 assert.match(out.explanation,/égalité incorrecte|ne démontre pas/);
});
test('un texte long sans calcul valide ne vaut pas un raisonnement',()=>{
 const answers=responses(),q=ex.questions[8];
 answers[8]=String(q.right)+' ||| '+JSON.stringify({
  calculation:'J ai écrit beaucoup de choses sans aucune opération valable ici.',
  conclusion:'Le périmètre du rectangle est de 24 cm.'
 });
 assert.equal(evaluate(answers).answers[8].points,0.5);
});
test('bonne opération mais mauvaise unité ou phrase : note partielle',()=>{
 const answers=responses(),q=ex.questions[8];
 answers[8]=String(q.right)+' ||| '+JSON.stringify({
  calculation:'8 + 4 + 8 + 4 = 24',
  conclusion:'La surface fait 24 cm².'
 });
 const out=evaluate(answers).answers[8];
 assert.equal(out.correct,false);
 assert.equal(out.points,0.5);
 assert.equal(out.reasoningDetails.calculationCorrect,true);
 assert.equal(out.reasoningDetails.conclusionCorrect,false);
});
test('plusieurs écritures mathématiquement valables sont acceptées',()=>{
 const q=ex.questions[8],cases=[
  '8 + 4 + 8 + 4 = 24',
  '2 × (8 + 4) = 24 cm',
  '(8+4)*2=24',
  '8 * 2 + 4 * 2 = 24',
  '8+4=12 ; 12*2=24'
 ];
 for(const calculation of cases){
  const answers=responses();
  answers[8]=String(q.right)+' ||| '+JSON.stringify({
   calculation,conclusion:'Le périmètre du rectangle est de 24 cm.'
  });
  const out=evaluate(answers).answers[8];
  assert.equal(out.points,1,'Calcul valable refusé : '+calculation+' / '+out.explanation);
 }
});
test('deuxième problème : vraie clôture calculée avec unité mètre',()=>{
 const answers=responses(),q=ex.questions[9];
 answers[9]=String(q.right)+' ||| '+JSON.stringify({
  calculation:'9 + 6 + 9 + 6 = 30 m',
  conclusion:'Il faut 30 m de clôture pour entourer le potager.'
 });
 const out=evaluate(answers).answers[9];
 assert.equal(out.correct,true);
 assert.equal(out.points,1);
});
test('raisonnement structuré : calcul et phrase nécessaires',()=>{
 const answers=responses();
 answers[9]='30 m ||| '+JSON.stringify({calculation:'9+6+9+6=30',conclusion:''});
 assert.throws(()=>evaluate(answers),/Reasoning missing/);
});
