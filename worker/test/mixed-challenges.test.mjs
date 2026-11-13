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
for(const id of ['DAY_20261113_04','DAY_20261113_05','DAY_20261113_06','DAY_20261116_01','DAY_20261116_02','DAY_20261116_03',
 'DAY_20261117_01','DAY_20261117_02','DAY_20261117_03',
 'WEEK_2026W46','SUNDAY_20261115','WEEK_2026W47','SUNDAY_20261122']){
 test('Mission '+id+' : matières, questions vérifiables, aucune réponse publique',()=>{
  assert.equal(isMixedMissionId(id),true);
  const mission=mixedMission(id),daily=mission.kind==='daily';
  assert.equal(mission.questions.length,daily?10:20);
  const four=/^DAY_2026111[67]_/.test(id)||id==='WEEK_2026W47'||id==='SUNDAY_20261122';
  const subjects=Object.fromEntries(['Espagnol','Mathématiques','Physique-chimie',...(four?['Anglais']:[])].map(s=>[
   s,mission.questions.filter(q=>q.subject===s).length
  ]));
  assert.equal(Object.values(subjects).reduce((x,y)=>x+y,0),mission.questions.length);
  assert.ok(Object.values(subjects).every(x=>x>=1));
  if(four)assert.equal(subjects.Anglais,daily?1:2);
  else assert.deepEqual(Object.values(subjects).sort((a,b)=>a-b),daily?[3,3,4]:[6,7,7]);
  const tally=Object.fromEntries(['mc','fill','short','reason'].map(t=>[t,mission.questions.filter(q=>q.format===t).length]));
  assert.deepEqual(tally,daily?{mc:2,fill:3,short:3,reason:2}:{mc:4,fill:6,short:6,reason:4});
  assert.equal(new Set(mission.questions.map(q=>q.sourceId)).size,mission.questions.length);
  const levels=Object.fromEntries(['facile','moyenne','difficile'].map(d=>[d,mission.questions.filter(q=>q.difficulty===d).length]));
  assert.deepEqual(levels,daily?{facile:3,moyenne:4,difficile:3}:{facile:6,moyenne:8,difficile:6});
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
test('Plan spécial du vendredi 13 : 3 missions mélangées différentes et anciennes copies intactes',()=>{
 const plan=mixedPlan(new Date('2026-11-13T12:00:00Z'));
 assert.deepEqual(plan.dailyIds,['DAY_20261113_04','DAY_20261113_05','DAY_20261113_06']);
 assert.equal(plan.exercises.filter(x=>x.kind==='daily').length,3);
 assert.equal(plan.exercises.length,5);
 assert.ok(plan.exercises.filter(x=>x.kind==='daily').every((x,i)=>x.title.includes('Mission '+(i+1)+' / 3')));
 const all=plan.exercises.filter(x=>x.kind==='daily').flatMap(x=>x.questions.map(q=>q.sourceId));
 assert.equal(all.length,30);
 assert.equal(new Set(all).size,30);
 for(const id of ['DAY_20261113_01','DAY_20261113_02','DAY_20261113_03',
                  'DAY_20261112_01','DAY_20261114_04','DAY_20261116_04'])
  assert.equal(isMixedMissionId(id),false,'Ne jamais réutiliser une ID de défi validé : '+id);
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

test('Orthographe espagnole : un accent manquant donne un demi-point',()=>{
 const mission=mixedMission('DAY_20261116_01'),answers=keyAnswers(mission);
 const index=mission.questions.findIndex(q=>q.subject==='Espagnol'&&q.type==='text'&&/[áéíóúñ]/i.test(q.right));
 if(index<0){
  // La rotation déterministe peut choisir uniquement des phrases sans accents.
  const other=mixedMission('DAY_20261116_02');
  const j=other.questions.findIndex(q=>q.subject==='Espagnol'&&q.type==='text'&&/[áéíóúñ]/i.test(q.right));
  assert.ok(j>=0);
  const res=keyAnswers(other);
  res[j]=other.questions[j].right.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const marked=gradeMixedMission(other,res);
  assert.equal(marked.answers[j].points,0.5);
 }else{
  answers[index]=mission.questions[index].right.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const marked=gradeMixedMission(mission,answers);
  assert.equal(marked.answers[index].points,0.5);
 }
});
