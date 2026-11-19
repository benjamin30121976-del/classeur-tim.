import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolCorrectionNotBefore,schoolCorrectionIsOpen,schoolExerciseCorrectionIsOpen} from '../school-homework-policy.mjs';
test('devoir ENT pour demain : note aujourd’hui, corrigé caché le jour du rendu',()=>{
 const ex={category:'school',kind:'school',homeworkDue:'2026-11-20'};
 assert.equal(schoolCorrectionNotBefore(ex),'2026-11-21');
 assert.equal(schoolExerciseCorrectionIsOpen(ex,'2026-11-19'),false);
 assert.equal(schoolExerciseCorrectionIsOpen(ex,'2026-11-20'),false);
 assert.equal(schoolExerciseCorrectionIsOpen(ex,'2026-11-21'),true);
});
test('un devoir sans échéance vérifiable ne divulgue pas de corrigé',()=>{
 assert.equal(schoolCorrectionNotBefore({category:'school',kind:'school'}),null);
 assert.equal(schoolExerciseCorrectionIsOpen({category:'school',kind:'school'},'2026-11-21'),false);
 assert.equal(schoolCorrectionNotBefore({category:'school',kind:'school',homeworkDue:'2026-02-30'}),null);
});
test('le 31 décembre et février bissextile sont traités',()=>{
 assert.equal(schoolCorrectionNotBefore({category:'school',homeworkDue:'2026-12-31'}),'2027-01-01');
 assert.equal(schoolCorrectionNotBefore({category:'school',homeworkDue:'2028-02-29'}),'2028-03-01');
});
test('les entraînements et bonus ne sont jamais retardés par un devoir associé',()=>{
 for(const category of ['training','bonus','challenge']){
  const ex={category,homeworkDue:'2026-11-20'};
  assert.equal(schoolCorrectionIsOpen({schoolHomework:false},'2026-11-19'),true);
  assert.equal(schoolExerciseCorrectionIsOpen(ex,'2026-11-19'),true);
 }
});
test('filtrage serveur insensible à un indicateur released forcé avant l’échéance',()=>{
 const record={schoolHomework:true,correctionNotBefore:'2026-11-21',correctionStatus:'released'};
 assert.equal(schoolCorrectionIsOpen(record,'2026-11-20'),false);
 assert.equal(schoolCorrectionIsOpen(record,'2026-11-21'),true);
});

test('un ancien entraînement enregistré en catégorie school reste corrigé immédiatement',()=>{
 const legacy={kind:'training',category:'school'};
 assert.equal(schoolExerciseCorrectionIsOpen(legacy,'2026-11-19'),true);
});
