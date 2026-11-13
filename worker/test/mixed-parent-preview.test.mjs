import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {PARENT_UID,TIM_UID} from '../auth.mjs';
import {mixedMission} from '../mixed-challenges.mjs';

const NO_DB=new Proxy({},{
 get(_,method){return ()=>{throw Error('Accès Firestore interdit dans une simulation Parent : '+String(method));};}
});
function correctAnswers(mission){
 return mission.questions.map(q=>{
  if(q.type==='mc')return String(q.right);
  if(q.type==='text')return String(q.right);
  const values=q.parts.filter(p=>typeof p==='number');
  const symbols=q.parts.filter(p=>typeof p==='string');
  return JSON.stringify({m:String(q.right),
   c:values.join(' ; ')+' '+symbols.join(' '),
   s:'La réponse au problème est '+q.answer+' '+(q.unit||'unités')+'.'});
 });
}
for(const id of ['DAY_20261113_04','DAY_20261116_01','WEEK_2026W46','SUNDAY_20261115','WEEK_2026W47','SUNDAY_20261122']){
 test('Parent : '+id+' corrigé complet et aucun appel base de données',async()=>{
  const mission=mixedMission(id),answers=correctAnswers(mission);
  const report=await TESTABLE.previewMixedChallenge(NO_DB,PARENT_UID,{id,answers,
   translationsUsed:mission.questions.map(q=>q.subject==='Espagnol')});
  assert.equal(report.practice,true);assert.equal(report.saved,false);assert.equal(report.submitted,false);
  assert.equal(report.xp,0);assert.equal(report.score,mission.questions.length);assert.equal(report.total,mission.questions.length);
  assert.equal(report.answers.length,mission.questions.length);
  assert.ok(report.answers.every(a=>a.points===1&&a.explanation.length>12));
  assert.ok(report.translationHelpCount>0);
 });
}
test('Parent : correction d’une copie partielle sans jamais imposer de répondre aux 10 questions',async()=>{
 const id='DAY_20261113_04',mission=mixedMission(id),answers=mission.questions.map(()=>'');
 const partial=await TESTABLE.previewMixedChallenge(NO_DB,PARENT_UID,{id,answers,translationsUsed:[]});
 assert.equal(partial.score,0);assert.equal(partial.total,10);assert.equal(partial.answers.length,10);
 assert.equal(partial.saved,false);assert.equal(partial.xp,0);
 assert.ok(partial.answers.filter(a=>a.points===0).length===10);
 const single=mission.questions.findIndex(q=>q.type!=='reason');
 answers[single]=mission.questions[single].type==='mc'?String(mission.questions[single].right):mission.questions[single].right;
 const one=await TESTABLE.previewMixedChallenge(NO_DB,PARENT_UID,{id,answers,translationsUsed:[]});
 assert.equal(one.score,1);assert.equal(one.answers.length,10);
 const reasonIndex=mission.questions.findIndex(q=>q.type==='reason');
 answers[reasonIndex]=JSON.stringify({m:mission.questions[reasonIndex].right,c:'',s:''});
 const method=await TESTABLE.previewMixedChallenge(NO_DB,PARENT_UID,{id,answers,translationsUsed:[]});
 assert.equal(method.score,1.5);assert.equal(method.answers[reasonIndex].points,0.5);
});
test('La simulation est strictement interdite sur le compte Tim',async()=>{
 const id='DAY_20261113_04',answers=mixedMission(id).questions.map(()=>'');
 await assert.rejects(()=>TESTABLE.previewMixedChallenge(NO_DB,TIM_UID,{id,answers}),{status:403});
});
test('Parent : refuser un identifiant ancien et les aides de traduction sur d’autres matières',async()=>{
 const id='DAY_20261113_04',mission=mixedMission(id);
 await assert.rejects(()=>TESTABLE.previewMixedChallenge(NO_DB,PARENT_UID,{id:'DAY_20261113_01',answers:[]}),{status:400});
 const nonSpanish=mission.questions.findIndex(q=>q.subject!=='Espagnol');
 const used=mission.questions.map((_,i)=>i===nonSpanish);
 await assert.rejects(()=>TESTABLE.previewMixedChallenge(NO_DB,PARENT_UID,{id,answers:correctAnswers(mission),translationsUsed:used}),{status:400});
});
