import test from 'node:test';
import assert from 'node:assert/strict';
import {grade} from '../grading.mjs';
const makeExercise=(prompt,expected)=>({
 id:'TEST_MATH_BONUS_READONLY',kind:'bonus-day',subject:'Mathématiques',
 questions:[{type:'text',q:prompt,right:expected,why:'Correction pédagogique.',also:[]}]
});
const gradeOne=(q,expected,response)=>{
 const e=makeExercise(q,expected),k={questions:[{right:expected,why:'Correction pédagogique.',also:[]}]};
 return grade(e,k,[response]).answers[0];
};
test('Bonus périmètre : valeur finale, phrase et méthode équivalente acceptées',()=>{
 const q='Un rectangle mesure 6 cm de long et 6 cm de large. Donne son périmètre en cm.';
 for(const actual of ['24','24 cm','P = 6 + 6 + 6 + 6 = 24 cm',
   '2 × (6 + 6) = 24 cm','Le périmètre du rectangle est de 24 cm.']){
  assert.equal(gradeOne(q,'24 cm',actual).correct,true,actual);
 }
});
test('Bonus : résultat au milieu d’un calcul faux refusé',()=>{
 const q='Un rectangle mesure 6 cm de long et 6 cm de large. Donne son périmètre en cm.';
 for(const actual of ['2 × 24 = 48 cm','6 + 6 = 24 cm','24 cm²',
 'Le périmètre ne vaut pas 24 cm','La surface est de 24 cm²']){
  assert.equal(gradeOne(q,'24 cm',actual).correct,false,actual);
 }
});
test('Aire demandée en cm² ou m² : accepter la bonne unité au carré',()=>{
 for(const unit of ['cm²','m²']){
  const q='Calcule la surface d’un rectangle de 3 par 4. Donne l’aire en '+unit+'.';
  for(const actual of ['12 '+unit,'3 × 4 = 12 '+unit]){
   assert.equal(gradeOne(q,'12',actual).correct,true,actual);
  }
  assert.equal(gradeOne(q,'12',unit==='cm²'?'12 cm':'12 m').correct,false,'unité linéaire');
  assert.equal(gradeOne(q,'12',unit==='cm²'?'12 m²':'12 cm²').correct,false,'unité de surface erronée');
  assert.equal(gradeOne(q,'12','3 + 4 = 12 '+unit).correct,false,'calcul faux');
 }
});
test('Bonus fraction : une fraction réductible ne devient pas correcte par équivalence',()=>{
 const q='Calcule 2/3 + 1/6. Donne une fraction irréductible.';
 assert.equal(gradeOne(q,'5/6','5/6').correct,true);
 assert.equal(gradeOne(q,'5/6','10/12').correct,false);
});
