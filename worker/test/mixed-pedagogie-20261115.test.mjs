import test from 'node:test';
import assert from 'node:assert/strict';
import {numericMathAnswerMatches as ok} from '../math-answer-equivalence.mjs';
import {mixedMission,gradeMixedMission} from '../mixed-challenges.mjs';

test('Le correcteur accepte le vrai calcul du samedi 14 novembre',()=>{
 const rect='Un rectangle mesure 6 cm de long et 6 cm de large. Donne son périmètre en cm.';
 assert.equal(ok('P = 6 + 6 + 6 + 6 = 24 cm','24',rect),true);
 assert.equal(ok('2 × (6 + 6) = 24 cm','24',rect),true);
 assert.equal(ok('Le périmètre du rectangle est de 24 cm.','24',rect),true);
 assert.equal(ok('6 + 6 = 24 cm','24',rect),false);
 assert.equal(ok('2 × 24 = 48 cm','24',rect),false);
 assert.equal(ok('24 cm²','24',rect),false);
 assert.equal(ok('La surface est de 24 cm²','24',rect),false);
 assert.equal(ok('Le périmètre ne vaut pas 24 cm','24',rect),false);
});
test('Fraction 6/24 × 4 = 1 : étapes correctes, erreur ou valeur hors calcul refusée',()=>{
 const q='Calcule : 6/24 × 4 = ?';
 for(const answer of ['1','1,0','6/24 × 4 = 1','6/24*4=1','1/1'])
  assert.equal(ok(answer,'1',q),true,answer);
 for(const answer of ['6/24 × 4 = 2','6/24 + 4 = 1','La réponse est 11','6/24 × 4 = 0,5','24/4=1'])
  assert.equal(ok(answer,'1',q),false,answer);
});
test('Une fraction demandée irréductible doit réellement être simplifiée',()=>{
 const q='Calcule 2/3 + 1/6. Donne une fraction irréductible.';
 assert.equal(ok('5/6','5/6',q),true);
 assert.equal(ok('10/12','5/6',q),false);
 assert.equal(ok('0,833333','5/6',q),false);
});
function keyAnswers(mission){
 return mission.questions.map(q=>{
  if(q.type==='mc'||q.type==='text')return String(q.right);
  const values=q.parts.filter(p=>typeof p==='number');
  return JSON.stringify({m:String(q.right),c:values.join(' ; ')+' '+q.parts.filter(p=>typeof p==='string').join(' '),
   s:'La réponse au problème est '+q.answer+' '+(q.unit||'unités')+'.'});
 });
}
test('Défi samedi W46 : la variante vraie n’est plus notée fausse',()=>{
 const mission=mixedMission('WEEK_2026W46');
 assert.equal(mission.questions[11].subject,'Mathématiques');
 assert.equal(mission.questions[14].subject,'Mathématiques');
 const answers=keyAnswers(mission);
 answers[11]='P = 6 + 6 + 6 + 6 = 24 cm';
 answers[14]='6/24 × 4 = 1';
 answers[2]='No voy nunca al colegio los sábados';
 const report=gradeMixedMission(mission,answers);
 assert.equal(report.score,20,JSON.stringify(report.answers.filter(a=>a.points!==1).map(a=>a.question)));
 assert.equal(report.answers[11].points,1);
 assert.equal(report.answers[14].points,1);
 assert.equal(report.answers[2].points,1);
 assert.equal(mission.questions[11].lessonId,null,'Ne pas inventer une leçon sur le périmètre.');
 assert.equal(mission.questions[14].lessonId,'MBIS02','Lier les fractions à MBIS02.');
});
test('L’espagnol exige encore une négation correcte et le samedi',()=>{
 const mission=mixedMission('WEEK_2026W46'),answer=keyAnswers(mission);
 for(const falsePhrase of ['Voy al colegio los sábados','No voy siempre al colegio los sábados',
  'Nunca voy a clase el lunes','Voy nunca a clase el sábado']){
  const a=answer.slice();a[2]=falsePhrase;
  const result=gradeMixedMission(mission,a);
  assert.equal(result.answers[2].points,0,falsePhrase);
 }
});
test('Les questions de raisonnement acceptent les quatre côtés du rectangle',()=>{
 let match;
 for(const id of ['WEEK_2026W46','WEEK_2026W47','SUNDAY_20261115',
  'SUNDAY_20261122','DAY_20261116_01','DAY_20261116_02']){
  const mission=mixedMission(id),i=mission?.questions?.findIndex(q=>
   q.subject==='Mathématiques'&&q.type==='reason'&&q.diagram==='rectangle'&&/bord|périmètre/i.test(q.q));
  if(i>=0){match={mission,i};break;}
 }
 assert.ok(match,'Une question sur le périmètre doit être trouvée');
 const {mission,i}=match,q=mission.questions[i],a=q.dimensions[0],b=q.dimensions[1];
 const responses=keyAnswers(mission);
 responses[i]=JSON.stringify({m:q.right,c:a+' + '+b+' + '+a+' + '+b+' = '+q.answer,
  s:'Le périmètre est de '+q.answer+' '+q.unit+'.'});
 const score=gradeMixedMission(mission,responses);
 assert.equal(score.answers[i].points,1,score.answers[i].explanation);
});
