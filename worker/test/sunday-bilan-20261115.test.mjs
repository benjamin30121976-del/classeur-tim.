import test from 'node:test';
import assert from 'node:assert/strict';
import {mixedMission,isMixedMissionId,mixedPlan,publicMixedMission,gradeMixedMission} from '../mixed-challenges.mjs';
import {rawPoints} from '../../functions/xp.mjs';
const ID='SUNDAY_BILAN_20261115';
const mission=mixedMission(ID);
const answers=()=>mission.questions.map(q=>JSON.stringify(q.fields.map((f,i)=>q.number===4?['rougeur','chaleur','gonflement','douleur'][i]:f.accepted[0])));
test('La nouvelle mission est distincte et les missions antérieures sont inchangées',()=>{
 assert.equal(isMixedMissionId(ID),true);
 assert.equal(mission.questions.length,20);
 assert.equal(mixedMission('SUNDAY_20261115').questions.length,20);
 assert.equal(mixedMission('SUNDAY_20261115').questions.some(q=>q.type==='structured'),false);
 assert.equal(mixedPlan(new Date('2026-11-15T13:00:00Z')).sunday,ID);
});
test('Dix questions actuelles, dix révisions, sept matières et 68 cadres',()=>{
 assert.equal(mission.questions.length,20);
 assert.equal(mission.questions.reduce((n,q)=>n+q.fields.length,0),68);
 assert.deepEqual(mission.questions.reduce((o,q)=>(o[q.difficulty]=(o[q.difficulty]||0)+1,o),{}),{facile:12,'intermédiaire':6,difficile:2});
 assert.equal(new Set(mission.questions.map(q=>q.subject)).size,7);
 assert.equal(mission.questions.filter(q=>q.number<=10).length,10);
});
test('Réponses non divulguées au navigateur avant la validation',()=>{
 const pub=publicMixedMission(mission);
 assert.equal(JSON.stringify(pub).includes('"accepted"'),false);
 assert.equal(JSON.stringify(pub).includes('"why"'),false);
 assert.equal(JSON.stringify(pub).includes('"lessonReview"'),false);
 assert.equal(pub.questions.length,20);
});
test('Copie correcte, 20/20 et barème historique +20 XP',()=>{
 const result=gradeMixedMission(mission,answers());
 assert.equal(result.score,20);
 assert.equal(result.total,20);
 assert.equal(result.answers.every(a=>a.points===1),true);
 assert.equal(rawPoints({kind:'sunday',category:'challenge',score:result.score,total:result.total,needsReview:false}),20);
});
test('JSP remplit le cadre mais donne zéro point',()=>{
 const r=gradeMixedMission(mission,mission.questions.map(q=>JSON.stringify(q.fields.map(()=>'JSP'))));
 assert.equal(r.score,0);
 assert.equal(r.answers.every(a=>a.points===0),true);
});
test('Une case manquante interdit la validation Tim, mais essai Parent toléré',()=>{
 const responses=answers(),one=JSON.parse(responses[0]);one[1]='';responses[0]=JSON.stringify(one);
 assert.throws(()=>gradeMixedMission(mission,responses),/Cadres incomplets/);
 assert.equal(gradeMixedMission(mission,responses,[],{allowIncomplete:true}).answers[0].points,0.75);
 assert.equal(gradeMixedMission(mission,mission.questions.map(()=>''),[],{allowIncomplete:true}).score,0);
});
test('Un même symptôme répété quatre fois ne rapporte pas quatre points',()=>{
 const responses=answers();responses[3]=JSON.stringify(['rougeur','rougeur','rougeur','rougeur']);
 const result=gradeMixedMission(mission,responses);
 assert.equal(result.answers[3].points,0.25);
 assert.equal(result.answers[3].fieldResults.filter(x=>x.correct).length,1);
});
test('Espagnol : les accents obligatoires restent vérifiés',()=>{
 const responses=answers();const q=JSON.parse(responses[12]);q[1]='Me gustan las matematicas.';responses[12]=JSON.stringify(q);
 assert.equal(gradeMixedMission(mission,responses).answers[12].points,0.35);
});
