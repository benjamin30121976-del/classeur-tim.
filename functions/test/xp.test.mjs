import test from 'node:test';
import assert from 'node:assert/strict';
import {rawPoints,cappedPoints,lessonTrainingPoints} from '../xp.mjs';
test('Devoirs ENT : toujours 0 XP, quelle que soit la note',()=>{for(const score of [0,4,6,10])assert.equal(rawPoints({category:'school',score,total:10}),0);});
test('Training grants no XP',()=>assert.equal(rawPoints({category:'training',score:10,total:10}),0));
test('Bonus grants 0-2 XP',()=>{
 for(let score=0;score<=10;score++){const n=rawPoints({category:'bonus',score,total:10});assert.ok(n>=0&&n<=2)}
});
test('Manual review blocks automatic XP',()=>assert.equal(rawPoints({category:'bonus',score:2,total:2,needsReview:true}),0));
test('Défis V18 et exercices bonus sans plafond journalier, pénalité réelle à -1',()=>{
 assert.equal(cappedPoints(8,9,0,49,0,'daily'),8);
 assert.equal(cappedPoints(2,0,0,0,3,'bonus'),2);
 assert.equal(cappedPoints(2,0,0,0,10,'bonus'),2);
 assert.equal(cappedPoints(1,0,0,0,20,'bonus'),1);
 assert.equal(cappedPoints(-1,0,4,0,0,'daily'),-1);
});

test('Un devoir sans catégorie explicite ne rapporte aucun XP',()=>assert.equal(rawPoints({score:10,total:10}),0));
test('Un devoir ENT ne retire jamais de XP même avec zéro bonne réponse',()=>assert.equal(rawPoints({category:'school',kind:'daily',score:0,total:10}),0));

test('Exercices de leçon espagnol, maths et physique : 1 / 0,5 / 0 XP et aucune pénalité',()=>{
 for(const [score,expected] of [[0,0],[1,0],[4,0],[4.99,0],[5,0.5],[6,0.5],[6.99,0.5],[7,1],[9,1],[10,1]]){
  assert.equal(lessonTrainingPoints(score,10),expected);
  for(const category of ['school','training']){
   assert.equal(rawPoints({kind:'training',category,score,total:10}),expected);
  }
 }
 assert.equal(lessonTrainingPoints(7,10),1);
 assert.equal(lessonTrainingPoints(5,10),0.5);
 assert.equal(lessonTrainingPoints(4,10),0);
});
test('Les devoirs ENT, défis et relevés privés conservent leur barème initial',()=>{
 for(const score of [0,4,5,7,10]){
  assert.equal(rawPoints({category:'school',kind:'translation-help-log',score,total:10}),0);
  assert.equal(rawPoints({category:'school',kind:'ent',score,total:10}),0);
  assert.equal(rawPoints({category:'school',score,total:10}),0);
 }
 assert.equal(rawPoints({kind:'training',category:'school',score:10,total:10,needsReview:true}),0);
 assert.equal(rawPoints({kind:'daily',category:'challenge',score:10,total:10}),3);
 assert.equal(rawPoints({kind:'daily',category:'challenge',score:0,total:10}),-1);
 assert.equal(cappedPoints(0.5,0,0,0,0,'school'),0.5);
});

test('Cinq bonus à 10/10 le même jour apportent bien 10 XP, sans plafond ni modification du barème',()=>{
 let cumul=0;
 for(let i=0;i<5;i++){
  const raw=rawPoints({category:'bonus',score:10,total:10});
  const awarded=cappedPoints(raw,cumul,0,cumul,cumul,'bonus');
  assert.equal(awarded,2);
  cumul+=awarded;
 }
 assert.equal(cumul,10);
});

test('Aucun plafond quotidien pour tous les défis (3 missions du jour, samedi, dimanche, bonus)',()=>{
 const cases=[
  {kind:'daily',score:10,total:10,expected:3},
  {kind:'weekly',score:20,total:20,expected:10},
  {kind:'sunday',score:20,total:20,expected:20},
  {kind:'bonus-day',score:10,total:10,expected:5},
  {kind:'bonus-parent',score:20,total:20,expected:5}
 ];
 for(const row of cases){
  const raw=rawPoints({kind:row.kind,category:'challenge',score:row.score,total:row.total});
  assert.equal(raw,row.expected,row.kind+' barème');
  for(const alreadyEarned of [0,3,9,30,75,100]){
   assert.equal(cappedPoints(raw,alreadyEarned,0,alreadyEarned,alreadyEarned,'challenge'),raw,
    row.kind+' ne doit pas perdre des XP à cause des gains déjà réalisés');
  }
 }
 let dailyTotal=0;
 for(let i=0;i<3;i++){
  const raw=rawPoints({kind:'daily',category:'challenge',score:10,total:10});
  dailyTotal+=cappedPoints(raw,dailyTotal,0,dailyTotal,0,'challenge');
 }
 assert.equal(dailyTotal,9,'trois défis du jour réussis donnent 9 XP');
});
