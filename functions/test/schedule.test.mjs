import test from 'node:test';import assert from 'node:assert/strict';
import {quarter,suggestedCorrectionDay,paris18Utc,suggestedCorrectionAt} from '../schedule.mjs';
test('Q2 then Q1',()=>{assert.equal(quarter('2026-11-02'),'Q2');assert.equal(quarter('2026-11-09'),'Q1');});
test('math next class after Tuesday',()=>assert.equal(suggestedCorrectionDay({subject:'maths',submittedDate:'2026-11-10'}),'2026-11-12'));
test('Spanish next class after Monday Q2',()=>assert.equal(suggestedCorrectionDay({subject:'espagnol',submittedDate:'2026-11-09'}),'2026-11-11'));
test('winter and summer Paris 18h',()=>{assert.equal(paris18Utc('2026-11-12'),'2026-11-12T17:00:00.000Z');assert.equal(paris18Utc('2027-06-03'),'2027-06-03T16:00:00.000Z');});
test('unknown subject remains locked',()=>assert.equal(suggestedCorrectionAt({subject:'inconnue'},'2026-11-10'),null));

test('créneaux Q1 et Q2 du tableau de référence',()=>{
 assert.equal(suggestedCorrectionDay({subject:'physique-chimie',submittedDate:'2026-11-09'}),'2026-11-10');
 assert.equal(suggestedCorrectionDay({subject:'physique-chimie',submittedDate:'2026-11-16'}),'2026-11-17');
 assert.equal(suggestedCorrectionDay({subject:'SVT',submittedDate:'2026-11-09'}),'2026-11-09');
 assert.equal(suggestedCorrectionDay({subject:'SVT',submittedDate:'2026-11-16'}),'2026-11-17');
 assert.equal(suggestedCorrectionDay({subject:'technologie',submittedDate:'2026-11-09'}),'2026-11-12');
 assert.equal(suggestedCorrectionDay({subject:'technologie',submittedDate:'2026-11-16'}),'2026-11-19');
 assert.equal(suggestedCorrectionDay({subject:'espagnol',submittedDate:'2026-11-16'}),'2026-11-16');
});
test('date de devoir antérieure à la soumission ne déclenche pas de correction passée',()=>{
 assert.equal(suggestedCorrectionDay({subject:'mathématiques',dueDate:'2026-11-05',submittedDate:'2026-11-10'}),'2026-11-12');
});
