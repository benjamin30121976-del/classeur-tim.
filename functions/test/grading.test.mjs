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
