'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pacificMidnight,FREE_READ_THRESHOLD,safeCode}=
 require('../diagnostiquer-quota-firestore.cjs');
test('Minuit Pacifique correspond à 08:00 UTC en novembre et 07:00 UTC en juillet',()=>{
 assert.equal(pacificMidnight(new Date('2026-11-19T10:30:00Z')).toISOString(),
  '2026-11-19T08:00:00.000Z');
 assert.equal(pacificMidnight(new Date('2026-07-19T10:30:00Z')).toISOString(),
  '2026-07-19T07:00:00.000Z');
});
test('Pas de donnée privée ni de fausse preuve de quota restant',()=>{
 const script=fs.readFileSync(require.resolve('../diagnostiquer-quota-firestore.cjs'),'utf8');
 assert.equal(FREE_READ_THRESHOLD,50000);
 assert.match(script,/apparentHeadroomToFreeThreshold/);
 assert.match(script,/Estimation Cloud Monitoring/);
 assert.doesNotMatch(script,/(?:\.setDoc\(|\.deleteDoc\(|documents:commit|documents:batchWrite)/);
 assert.equal(safeCode('RESOURCE_EXHAUSTED'),'RESOURCE_EXHAUSTED');
 assert.equal(safeCode('eyJhIjoiYSJ9***'),null);
});
test('Inspection distingue authentification et leçons privées, et stoppe si quota refusé',()=>{
 const s=fs.readFileSync(require('node:path').resolve(__dirname,
  '../../outils/inspecter-comptes-lecture-seule.cjs'),'utf8');
 assert.match(s,/tim-course-unavailable/);
 assert.match(s,/privateCourseStatus/);
 assert.match(s,/controle suspendu/);
 assert.match(s,/read-only|Lecture seule|lecture seule/i);
});
