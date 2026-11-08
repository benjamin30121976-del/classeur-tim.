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
