import test from 'node:test';
import assert from 'node:assert/strict';
import {rawPoints,cappedPoints} from '../xp.mjs';
test('Devoirs ENT : toujours 0 XP, quelle que soit la note',()=>{for(const score of [0,4,6,10])assert.equal(rawPoints({category:'school',score,total:10}),0);});
test('Training grants no XP',()=>assert.equal(rawPoints({category:'training',score:10,total:10}),0));
test('Bonus grants 0-2 XP',()=>{
 for(let score=0;score<=10;score++){const n=rawPoints({category:'bonus',score,total:10});assert.ok(n>=0&&n<=2)}
});
test('Manual review blocks automatic XP',()=>assert.equal(rawPoints({category:'bonus',score:2,total:2,needsReview:true}),0));
test('Daily, weekly and bonus caps',()=>{
 assert.equal(cappedPoints(8,9,0,49,0,'daily'),1);
 assert.equal(cappedPoints(2,0,0,0,3,'bonus'),0);
 assert.equal(cappedPoints(-9,0,4,0,0,'daily'),-1);
});
