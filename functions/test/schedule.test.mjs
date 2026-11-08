import test from 'node:test';import assert from 'node:assert/strict';
import {quarter,suggestedCorrectionDay,paris18Utc,suggestedCorrectionAt,nextCorrectionAfterSubmission} from '../schedule.mjs';
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

test('jour sans cours exclu : report au prochain vrai créneau',()=>{
 assert.equal(suggestedCorrectionDay({subject:'mathématiques',submittedDate:'2026-11-10',excludedDates:['2026-11-12']}),'2026-11-13');
 assert.equal(suggestedCorrectionDay({subject:'espagnol',submittedDate:'2026-11-11',excludedDates:['2026-11-11']}),'2026-11-12');
});
test('exclusion du jour de cours dans le calcul de 18h',()=>{
 assert.equal(suggestedCorrectionAt({subject:'mathématiques',excludedClassDates:['2026-11-12']},'2026-11-10'),'2026-11-13T17:00:00.000Z');
});

test('aucune correction pour une matière inconnue ou une date invalide',()=>{
 assert.equal(suggestedCorrectionDay({subject:'matière inconnue',submittedDate:'2026-11-10'}),null);
 assert.throws(()=>suggestedCorrectionDay({subject:'maths',submittedDate:'2026-02-30'}));
 assert.throws(()=>suggestedCorrectionDay({subject:'maths',submittedDate:'2026-11-10',excludedDates:['demain']}));
});
test('changement heure été/hiver sans déblocage prématuré',()=>{
 assert.equal(paris18Utc('2027-03-26'),'2027-03-26T17:00:00.000Z');
 assert.equal(paris18Utc('2027-03-29'),'2027-03-29T16:00:00.000Z');
});

test('cours suivant selon heure réelle de remise à Paris',()=>{
 const ex={subject:'mathématiques'};
 assert.equal(nextCorrectionAfterSubmission(ex,'2026-11-12T07:00:00Z'),'2026-11-12T17:00:00.000Z');
 assert.equal(nextCorrectionAfterSubmission(ex,'2026-11-12T15:00:00Z'),'2026-11-13T17:00:00.000Z');
 assert.equal(nextCorrectionAfterSubmission(ex,'2026-11-12T18:00:00Z'),'2026-11-13T17:00:00.000Z');
});
test('cours annulé et créneau Q1/Q2 après remise',()=>{
 assert.equal(nextCorrectionAfterSubmission({subject:'mathématiques',excludedClassDates:['2026-11-13']},'2026-11-12T10:00:00Z'),'2026-11-16T17:00:00.000Z');
 assert.equal(nextCorrectionAfterSubmission({subject:'espagnol'},'2026-11-16T14:00:00Z'),'2026-11-18T17:00:00.000Z');
});

test('calendrier malformé : correction verrouillée',()=>{
 assert.equal(nextCorrectionAfterSubmission({subject:'maths',excludedClassDates:'invalide'},'2026-11-10T12:00:00Z'),null);
 assert.equal(nextCorrectionAfterSubmission({subject:'maths',excludedClassDates:['demain']},'2026-11-10T12:00:00Z'),null);
});
