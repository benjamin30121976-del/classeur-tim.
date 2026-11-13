import test from 'node:test';
import assert from 'node:assert/strict';
import {rawPoints} from '../xp.mjs';
import {grade} from '../grading.mjs';
import {SPANISH_NOV12_HELP_IDS,spanishNov12HelpId,spanishNov12HelpExercises,readSpanishNov12HelpCount} from '../spanish-nov12-help-logging.mjs';

test('trois enregistrements de suivi distincts des exercices, et 0 XP dans le moteur serveur',()=>{
 const items=spanishNov12HelpExercises();
 assert.equal(items.length,3);
 for(const [index,doc] of items.entries()){
  assert.equal(doc.id,spanishNov12HelpId(SPANISH_NOV12_HELP_IDS[index]));
  assert.match(doc.id,/^TRH_ESE_L14_0[1-3]$/);
  assert.equal(doc.category,'school');
  assert.equal(doc.questions.length,1);
  assert.equal(doc.questions[0].type,'text');
  for(const count of [0,1,2,9,10]){
   const answer=String(count);
   const key={questions:doc.questions.map(q=>({right:q.right,why:q.why}))};
   const result=grade(doc,key,[answer]);
   assert.equal(result.answers[0].response,answer,'Le nombre traduit doit être conservé dans la copie privée.');
   assert.equal(rawPoints({kind:doc.kind,category:doc.category,score:result.score,total:result.total,needsReview:false}),0);
  }
 }
});

test('le compteur relève une valeur 0 à 10, jamais une note ou un événement daté',()=>{
 const sample=value=>({answers:[{response:String(value)}]});
 for(const n of [0,1,2,5,9,10])assert.equal(readSpanishNov12HelpCount(sample(n)),n);
 for(const bad of ['11','-1','2.5','inconnu','',undefined])assert.equal(readSpanishNov12HelpCount(sample(bad)),null);
 assert.equal(readSpanishNov12HelpCount({answers:[]}),null);
});
