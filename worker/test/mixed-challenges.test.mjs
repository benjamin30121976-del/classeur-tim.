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
  const five=/^DAY_2026111[67]_/.test(id)||id==='WEEK_2026W47'||id==='SUNDAY_20261122';
  const subjects=Object.fromEntries(['Espagnol','Mathématiques','Physique-chimie',...(five?['Anglais','SVT']:[])].map(s=>[
   s,mission.questions.filter(q=>q.subject===s).length
  ]));
  assert.equal(Object.values(subjects).reduce((x,y)=>x+y,0),mission.questions.length);
  assert.ok(Object.values(subjects).every(x=>x>=1));
  if(five){assert.equal(subjects.Anglais,daily?2:4);assert.equal(subjects.SVT,daily?2:4);assert.ok(Object.values(subjects).every(v=>v===(daily?2:4)));}
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

test('Six matières du 23 novembre : 30 questions de HG distinctes sur cinq jours sans remplacer les copies précédentes',()=>{
 const generated=[];
 for(const day of ['23','24','25','26','27']){
  for(const slot of ['01','02','03']){
   const id='DAY_202611'+day+'_'+slot,mission=mixedMission(id);
   assert.ok(mission,id);
   assert.equal(mission.questions.length,10);
   const subjects=['Espagnol','Mathématiques','Physique-chimie','Anglais','SVT','Histoire-géographie'];
   const stats=Object.fromEntries(subjects.map(x=>[x,mission.questions.filter(q=>q.subject===x).length]));
   assert.ok(Object.values(stats).every(n=>n>=1),id+' matière manquante');
   assert.equal(stats['Histoire-géographie'],2,id);
   assert.equal(Object.values(stats).reduce((a,b)=>a+b,0),10);
   assert.deepEqual(Object.fromEntries(['mc','fill','short','reason'].map(x=>[x,mission.questions.filter(q=>q.format===x).length])),
    {mc:2,fill:3,short:3,reason:2});
   const correct=keyAnswers(mission);
   assert.equal(gradeMixedMission(mission,correct).score,10,id);
   assert.ok(publicMixedMission(mission).questions.every(q=>
    !['right','why','also','answer','parts'].some(k=>k in q)));
   generated.push(...mission.questions.filter(q=>q.subject==='Histoire-géographie').map(q=>q.sourceId));
  }
 }
 assert.equal(generated.length,30);
 assert.equal(new Set(generated).size,30,'Aucune répétition des 30 questions HG dans la semaine');
 for(const id of ['DAY_20261113_04','DAY_20261116_01','DAY_20261120_03','WEEK_2026W47','SUNDAY_20261122']){
  const mission=mixedMission(id);
  assert.equal(mission.questions.filter(x=>x.subject==='Histoire-géographie').length,0,'Ancien défi à préserver : '+id);
 }
 for(const id of ['WEEK_2026W48','SUNDAY_20261129']){
  const mission=mixedMission(id);
  assert.equal(mission.questions.length,20);
  assert.equal(mission.questions.filter(x=>x.subject==='Histoire-géographie').length,4,id);
 }
});

test('Sept matières du 30 novembre, 30 questions françaises distinctes et copies anciennes intactes',()=>{
 const ids=[];
 for(const date of ['20261130','20261201','20261202','20261203','20261204']){
  for(const slot of ['01','02','03']){
   const id='DAY_'+date+'_'+slot,m=mixedMission(id);
   assert.ok(m,id);assert.equal(m.questions.length,10);
   for(const subject of ['Espagnol','Mathématiques','Physique-chimie','Anglais','SVT','Histoire-géographie','Français'])
    assert.ok(m.questions.some(q=>q.subject===subject),id+' sans '+subject);
   assert.equal(m.questions.filter(q=>q.subject==='Français').length,2);
   assert.deepEqual(Object.fromEntries(['mc','fill','short','reason'].map(k=>[k,m.questions.filter(q=>q.format===k).length])),
    {mc:2,fill:3,short:3,reason:2});
   assert.equal(gradeMixedMission(m,keyAnswers(m)).score,10,id);
   assert.ok(publicMixedMission(m).questions.every(q=>!['right','why','parts','answer'].some(k=>k in q)));
   ids.push(...m.questions.filter(q=>q.subject==='Français').map(q=>q.sourceId));
  }
 }
 assert.equal(ids.length,30);assert.equal(new Set(ids).size,30);
 for(const id of ['DAY_20261116_01','DAY_20261123_02','WEEK_2026W48','SUNDAY_20261129'])
  assert.equal(mixedMission(id).questions.filter(q=>q.subject==='Français').length,0,id);
 for(const id of ['WEEK_2026W49','SUNDAY_20261206']){
  const m=mixedMission(id);assert.equal(m.questions.length,20);
  assert.equal(m.questions.filter(q=>q.subject==='Français').length,4,id);
 }
});
