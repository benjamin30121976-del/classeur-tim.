import test from 'node:test';
import assert from 'node:assert/strict';
import {grade} from '../grading.mjs';
const ex={questions:[{q:'A',type:'mc',options:['oui','non']},{q:'B',type:'text'},{q:'C',type:'free'}]};
const key={questions:[{right:1},{right:'Éléphant',also:['éléphants']},{right:'texte libre'}]};
test('QCM, accents et réponse libre sans notation automatique',()=>{
 const r=grade(ex,key,['1','elephant','essai']);
 assert.equal(r.score,2);assert.equal(r.total,2);assert.equal(r.needsReview,true);assert.equal(r.answers[2].correct,null);
});
test('Nombre de réponses incorrect refusé',()=>assert.throws(()=>grade(ex,key,['1'])));
test('Réponse trop longue refusée',()=>assert.throws(()=>grade(ex,key,['1','x'.repeat(10001),'a'])));

test('V16: rejects more than 30 questions',()=>{
 const exercise={questions:Array.from({length:31},()=>({q:'x',type:'text'}))};
 const key={questions:Array.from({length:31},()=>({right:'oui'}))};
 assert.throws(()=>grade(exercise,key,Array(31).fill('oui')));
});
test('V16: strips punctuation in short text',()=>{
 const exercise={questions:[{q:'x',type:'text'}]};
 const key={questions:[{right:'¿Hola, Tim?'}]};
 assert.equal(grade(exercise,key,['hola tim']).score,1);
});
test('V16: rejects unsupported question type',()=>{
 assert.throws(()=>grade({questions:[{q:'x',type:'unknown'}]},{questions:[{right:'x'}]},['x']));
});


test('bonus maths : accepter un résultat exact rédigé comme une phrase',()=>{
 const bonus={kind:'bonus-day',subject:'Mathématiques',questions:[{q:'Calcule le périmètre du rectangle 8 cm par 4 cm.',type:'text'}]};
 const key={questions:[{right:'24 cm',also:['24']}]};
 for(const response of ['24 cm','Le périmètre est de 24 cm.','P = 24 cm','On obtient 24 cm','24']){
  const graded=grade(bonus,key,[response]);
  assert.equal(graded.score,1,'Réponse correcte non reconnue : '+response);
 }
 for(const response of ['La surface fait 24 cm.','Il ne faut pas 24 cm','24 m','32 cm','24 cm ou 32 cm']){
  const graded=grade(bonus,key,[response]);
  assert.equal(graded.score,0,'Réponse incorrecte créditée : '+response);
 }
});

test('une méthode non interprétée automatiquement ne doit pas être déclarée validée',()=>{
 const ex={kind:'bonus-day',subject:'Mathématiques',questions:[{q:'Développe 2(x+3)',type:'text',reasoningRequired:true}]};
 const key={questions:[{right:'2x+6',why:'2(x+3)=2x+6'}]};
 const result=grade(ex,key,['2x+6 ||| 2x+3+3']);
 assert.equal(result.score,1);
 assert.equal(result.answers[0].correct,true);
 assert.equal(result.answers[0].reasoningAssessment,'not-automatically-graded');
 assert.equal(result.answers[0].reasoning,'2x+3+3');
 assert.throws(()=>grade(ex,key,['2x+6 ||| ']),/Reasoning missing/);
});
