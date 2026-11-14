import test from 'node:test';
import assert from 'node:assert/strict';
import {PARENT_UID,TIM_UID} from '../auth.mjs';
import {TESTABLE} from '../server.mjs';

test('diagnostic Q10 Parent : seulement les drapeaux de présence, aucune donnée ni écriture',async()=>{
 const seen=[],store=new Set(['exercises/MTH12_03','publicExercises/MTH12_03']);
 const db={
  get:async path=>{seen.push(path);return store.has(path)?{payloadJson:'NE JAMAIS EXPOSER'}:null;},
  set:()=>{throw Error('Écriture interdite');},
  update:()=>{throw Error('Écriture interdite');}
 };
 const result=await TESTABLE.getFirestoreReadDiagnostics(db,PARENT_UID,{mathNov12Bank:true});
 assert.deepEqual(result,{readOnly:true,bank:'MTH12_03',exercise:true,publicExercise:true,
  answerKey:false,releasedCorrection:false,attempt:false,privateAttempt:false});
 assert.equal(seen.length,6);
 assert.doesNotMatch(JSON.stringify(result),/NE JAMAIS EXPOSER/);
});
test('diagnostic Q10 interdit au compte Tim',async()=>{
 await assert.rejects(TESTABLE.getFirestoreReadDiagnostics({get:async()=>null},TIM_UID,{mathNov12Bank:true}));
});
