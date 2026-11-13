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
 // Les entraînements de leçons suivent +1 / +0,5 / 0 XP,
 // mais ne changent ni le barème des défis ni les devoirs ENT.
 assert.equal(rawPoints({kind:'training',category:'training',score:10,total:10}),1);
 assert.equal(rawPoints({kind:'training',category:'training',score:5,total:10}),0.5);
 assert.equal(rawPoints({kind:'training',category:'training',score:4,total:10}),0);
 assert.equal(rawPoints({kind:'daily',category:'school',score:10,total:10}),0);
 assert.equal(cappedPoints(20,10,0,50,3,'challenge'),20);
 assert.equal(cappedPoints(2,10,0,50,2,'bonus'),1);
});
test('Le défi d’essai du dimanche 8 novembre est définitivement annulé',()=>{
 const course={lessons:[{id:'L01',title:'Se présenter',subject:'Espagnol',publishedAt:'2026-11-01'}],exercises:[]};
 assert.equal(buildMission('DAY_20261108_01',course,SPANISH_COURSE),null);
 const beforeMidnight=setupMissions(course,new Date('2026-11-08T22:59:00Z'),SPANISH_COURSE);
 const afterMidnight=setupMissions(course,new Date('2026-11-08T23:00:00Z'),SPANISH_COURSE);
 assert.deepEqual(beforeMidnight.meta.dailyIds,[]);
 assert.equal(afterMidnight.meta.dailyIds.length,3);
 assert.ok(!beforeMidnight.exercises.some(e=>e.id==='DAY_20261108_01'));
 assert.ok(!afterMidnight.exercises.some(e=>e.id==='DAY_20261108_01'));
});
test('Trois défis quotidiens distincts, un seul samedi et dimanche',()=>{
 const content={lessons:[{id:'L01',title:'Espagnol',subject:'Espagnol',publishedAt:'2026-11-01'}],
  exercises:Array.from({length:8},(_,i)=>({id:'EX'+i,lesson:'L01',category:'bonus',
   questions:Array.from({length:5},(_,j)=>({type:'text',q:'Écris '+i+' '+j,right:'hola'}))}))};
 const first=setupMissions(content,new Date('2026-11-09T12:00:00Z'),SPANISH_COURSE);
 const again=setupMissions(content,new Date('2026-11-09T12:00:00Z'),SPANISH_COURSE);
 assert.deepEqual(first,again);
 assert.equal(first.meta.dailyIds.length,3);
 assert.equal(first.exercises.filter(e=>e.kind==='weekly').length,1);
 assert.equal(first.exercises.filter(e=>e.kind==='sunday').length,1);
 assert.equal(first.exercises.filter(e=>e.kind==='daily').length,3);
 assert.equal(new Set(first.exercises.filter(e=>e.kind==='daily').flatMap(e=>e.questions.map(q=>q.sourceId))).size,30);
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


test('Samedi et dimanche restent disponibles sans les 28 anciens exercices',()=>{
 const empty={lessons:[],exercises:[]};
 const saturday=setupMissions(empty,new Date('2026-11-14T12:00:00Z'),SPANISH_COURSE);
 const sunday=setupMissions(empty,new Date('2026-11-15T12:00:00Z'),SPANISH_COURSE);
 const weekly=saturday.exercises.find(e=>e.kind==='weekly');
 const sundayMission=sunday.exercises.find(e=>e.kind==='sunday');
 assert.ok(weekly,'Défi de samedi absent sans exercices anciens');
 assert.ok(sundayMission,'Défi de dimanche absent sans exercices anciens');
 assert.equal(weekly.questions.length,20);
 assert.equal(sundayMission.questions.length,20);
 assert.equal(new Set(weekly.questions.map(q=>q.sourceId)).size,20);
 assert.equal(new Set(sundayMission.questions.map(q=>q.sourceId)).size,20);
});
