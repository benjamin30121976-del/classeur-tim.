import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rawPoints,cappedPoints,weeklyReward} from '../../functions/xp.mjs';
import {setupMissions,buildMission,isMissionOpen,weekId} from '../../functions/missions-v18.mjs';
import {SPANISH_COURSE} from '../../functions/spanish-training-curriculum.mjs';
const xp=(kind,score,total=kind==='daily'?10:20)=>rawPoints({kind,category:'challenge',score,total});
test('Le barème des 10 questions du petit défi',()=>{
 for(const [n,expected] of [[10,3],[9,3],[8,2],[7,2],[6,1],[5,1],[4,0],[3,0],[2,0],[1,-1],[0,-1]])
  assert.equal(xp('daily',n),expected,n+'/10');
});
test('Le barème du samedi sur 20 questions',()=>{
 for(const [n,expected] of [[20,10],[17,10],[16,7],[15,7],[14,4],[12,4],[11,1],[10,1],[9,0],[8,0],[7,-1],[0,-1]])
  assert.equal(xp('weekly',n),expected,n+'/20');
});
test('Grand défi du dimanche sur 20 questions, montants et anciens devoirs',()=>{
 assert.equal(xp('sunday',20),20);
 assert.equal(xp('sunday',17),20);
 assert.equal(xp('sunday',15),14);
 assert.equal(xp('sunday',10),2);
 assert.equal(xp('sunday',0),-2);
 for(const [score,euro] of [[0,0],[18,0],[19,2],[37,2],[38,5],[74,5],[75,10],[125,10]])
  assert.equal(weeklyReward(score),euro);
 assert.equal(rawPoints({kind:'training',category:'training',score:10,total:10}),0);
 assert.equal(rawPoints({kind:'daily',category:'school',score:10,total:10}),0);
 assert.equal(cappedPoints(20,10,0,50,3,'challenge'),20);
 assert.equal(cappedPoints(2,10,0,50,2,'bonus'),1);
});
test('Défi inversé dimanche 8 novembre : dix traductions exactes et fermeture à minuit',()=>{
 const course={lessons:[{id:'L01',title:'Se présenter',subject:'Espagnol',publishedAt:'2026-11-01'}],exercises:[]};
 const task=buildMission('DAY_20261108_01',course,SPANISH_COURSE);
 assert.equal(task.title,'Défi inversé — Se présenter');
 assert.equal(task.questions.length,10);
 assert.equal(task.strictAnswers,true);
 assert.ok(task.instructions.includes('Attention, la précision compte !'));
 assert.ok(task.questions.every(q=>q.type==='text'&&q.q.includes('Écris en espagnol')));
 assert.deepEqual(task.questions.map(q=>q.right),[
  'Me llamo','Mi nombre','Mi apellido','Tengo quince años','¿Cómo te llamas?',
  '¿Cuántos años tienes?','¿Dónde vives?','Vivo en un pueblo','Soy francés','Mi nacionalidad'
 ]);
 assert.equal(task.questions[0].q,"Écris en espagnol : « Je m'appelle ».");
 assert.equal(isMissionOpen(task,'2026-11-08'),true);
 assert.equal(isMissionOpen(task,'2026-11-09'),false);
 const plan=setupMissions(course,new Date('2026-11-08T22:59:00Z'),SPANISH_COURSE);
 assert.deepEqual(plan.meta.dailyIds,['DAY_20261108_01']);
 const after=setupMissions(course,new Date('2026-11-08T23:00:00Z'),SPANISH_COURSE);
 assert.ok(!after.meta.dailyIds.includes('DAY_20261108_01'));
});
test('Trois défis quotidiens distincts, un seul samedi et dimanche',()=>{
 const content={lessons:[{id:'L01',title:'Espagnol',subject:'Espagnol',publishedAt:'2026-11-01'}],
  exercises:Array.from({length:8},(_,i)=>({id:'EX'+i,lesson:'L01',category:'bonus',
   questions:Array.from({length:5},(_,j)=>({type:'text',q:'Écris '+i+' '+j,right:'hola'}))}))};
 const first=setupMissions(content,new Date('2026-11-09T12:00:00Z'),SPANISH_COURSE);
 const again=setupMissions(content,new Date('2026-11-09T12:00:00Z'),SPANISH_COURSE);
 assert.deepEqual(first,again);
 assert.equal(first.meta.dailyIds.length,24);
 assert.equal(first.exercises.filter(e=>e.kind==='weekly').length,1);
 assert.equal(first.exercises.filter(e=>e.kind==='sunday').length,1);
 assert.equal(first.exercises.filter(e=>e.kind==='daily').length,24);
 const nextTwo=first.exercises.filter(e=>e.kind==='daily').slice(1,3);
 assert.equal(new Set(nextTwo.flatMap(e=>e.questions.map(q=>q.sourceId))).size,20);
 assert.equal(nextTwo[0].questions.length,10);
 assert.equal(first.exercises.find(e=>e.kind==='weekly').questions.length,20);
 assert.equal(weekId('2026-11-09'),'WEEK_2026W46');
 assert.equal(isMissionOpen(first.exercises.find(e=>e.kind==='weekly'),'2026-11-14'),true);
 assert.equal(isMissionOpen(first.exercises.find(e=>e.kind==='weekly'),'2026-11-13'),false);
 const sat=setupMissions(content,new Date('2026-11-14T12:00:00Z'),SPANISH_COURSE);
 assert.equal(sat.meta.dailyIds.length,0);
 assert.equal(sat.exercises.filter(e=>e.kind==='weekly').length,1);
 assert.equal(sat.exercises.filter(e=>e.kind==='sunday').length,1);
});

test("Le défi d'essai est noté avec ponctuation, accents, majuscules et espaces exacts",async()=>{
 const {grade}=await import('../../functions/grading.mjs');
 const task=buildMission('DAY_20261108_01',{lessons:[],exercises:[]},SPANISH_COURSE);
 const secret={questions:task.questions.map(q=>({right:q.right,also:q.also,why:q.why}))};
 const answers=task.questions.map(q=>q.right);
 assert.equal(grade(task,secret,answers).score,10);
 for(const [index,response] of [[0,'me llamo'],[3,'Tengo quince anos'],[4,'Cómo te llamas?'],[4,'¿Cómo  te llamas?'],[4,'¿Cómo te llamas'],[4,'¿Cómo te llamas? ']]){
  const modified=[...answers];modified[index]=response;
  assert.equal(grade(task,secret,modified).score,9,response);
 }
});
