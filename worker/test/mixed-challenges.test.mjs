import test from 'node:test';
import assert from 'node:assert/strict';
import {isMixedMissionId,mixedMission,mixedPlan,publicMixedMission,gradeMixedMission}
 from '../mixed-challenges.mjs';

function keyAnswers(mission){
 return mission.questions.map(q=>{
  if(q.type==='mc')return String(q.right);
  if(q.type==='text')return String(q.right);
  const numbers=q.parts.filter(p=>typeof p==='number');
  const symbols=q.parts.filter(p=>typeof p==='string');
  const calc=numbers.join(' ; ')+' '+symbols.join(' ');
  return JSON.stringify({m:String(q.right),c:calc,s:'La réponse au problème est '+q.answer+' '+(q.unit||'unités')+'.'});
 });
}
for(const id of ['DAY_20261116_01','DAY_20261116_02','DAY_20261116_03',
 'DAY_20261117_01','DAY_20261117_02','DAY_20261117_03',
 'WEEK_2026W46','SUNDAY_20261115']){
 test('Mission '+id+' : trois matières, questions vérifiables, aucune réponse publique',()=>{
  assert.equal(isMixedMissionId(id),true);
  const mission=mixedMission(id),daily=mission.kind==='daily';
  assert.equal(mission.questions.length,daily?10:20);
  const subjects=Object.fromEntries(['Espagnol','Mathématiques','Physique-chimie'].map(s=>[
   s,mission.questions.filter(q=>q.subject===s).length
  ]));
  assert.deepEqual(Object.values(subjects).sort((a,b)=>a-b),daily?[3,3,4]:[6,7,7]);
  const tally=Object.fromEntries(['mc','fill','short','reason'].map(t=>[t,mission.questions.filter(q=>q.format===t).length]));
  assert.deepEqual(tally,daily?{mc:2,fill:3,short:3,reason:2}:{mc:4,fill:6,short:6,reason:4});
  assert.equal(new Set(mission.questions.map(q=>q.sourceId)).size,mission.questions.length);
  const publicTask=publicMixedMission(mission);
  assert.ok(publicTask.questions.every(q=>!('right' in q)&&!('why' in q)&&!('also' in q)&&!('parts' in q)&&!('answer' in q)));
  const answers=keyAnswers(mission),report=gradeMixedMission(mission,answers);
  assert.equal(report.score,mission.questions.length,JSON.stringify(report.answers.filter(a=>a.points!==1)));
  assert.equal(report.needsReview,false);
  assert.equal(report.answers.length,mission.questions.length);
 });
}
test('Les dates des anciens défis restent inchangées',()=>{
 for(const id of ['DAY_20261111_01','DAY_20261113_03','SUNDAY_20261108','WEEK_2026W45'])
  assert.equal(isMixedMissionId(id),false);
});
test('Plan du 16 novembre : 3 missions + weekend ; pas de doublons',()=>{
 const plan=mixedPlan(new Date('2026-11-16T12:00:00Z'));
 assert.deepEqual(plan.dailyIds,['DAY_20261116_01','DAY_20261116_02','DAY_20261116_03']);
 assert.equal(plan.exercises.length,5);
 const all=plan.exercises.filter(x=>x.kind==='daily').flatMap(x=>x.questions.map(q=>q.sourceId));
 assert.equal(new Set(all).size,30,'Les 30 questions quotidiennes sont différentes');
});
test('Traduction en français : comptage des questions, pas des clics',()=>{
 const mission=mixedMission('DAY_20261116_01'),answers=keyAnswers(mission);
 const used=mission.questions.map((q,i)=>q.subject==='Espagnol'&&i%2===0);
 const report=gradeMixedMission(mission,answers,used);
 assert.equal(report.translationHelpCount,used.filter(Boolean).length);
});
test('Points partiels pour une méthode correcte avec un calcul faux',()=>{
 const mission=mixedMission('DAY_20261116_01'),answers=keyAnswers(mission);
 const i=mission.questions.findIndex(q=>q.type==='reason');
 const q=mission.questions[i];
 answers[i]=JSON.stringify({m:String(q.right),c:'calcul faux',s:'Je ne connais pas le résultat.'});
 const report=gradeMixedMission(mission,answers);
 assert.equal(report.answers[i].points,0.5);
 assert.equal(report.score,mission.questions.length-0.5);
});
test('Les questions écrites fausses sont corrigées avec une explication',()=>{
 const mission=mixedMission('DAY_20261116_03'),answers=keyAnswers(mission);
 const i=mission.questions.findIndex(q=>q.format==='fill');
 answers[i]='réponse volontairement fausse';
 const report=gradeMixedMission(mission,answers);
 assert.equal(report.answers[i].correct,false);
 assert.ok(report.answers[i].explanation.length>15);
 assert.equal(report.score,9);
});
