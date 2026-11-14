import test from 'node:test';
import assert from 'node:assert/strict';
import {PARENT_UID,TIM_UID} from '../auth.mjs';
import {TESTABLE} from '../server.mjs';
import {mathNov12ForParentImport} from '../../maths-12nov-training.mjs';

const OLD={
 type:'mc',
 q:'Le professeur a demandé l’exercice 25 p.253, mais son énoncé n’est pas dans l’ENT. Comment le classeur doit-il le présenter ?',
 options:['Inventer les mesures de la page','Indiquer que l’énoncé manque et proposer des exercices distincts','Prétendre que ces questions sont l’exercice officiel','Marquer le devoir comme réalisé'],
 right:'1',
 why:'Les trois séries sont des exercices pédagogiques originaux, pas une reproduction du devoir 25 p.253.',
 skill:'Réciproque de Thalès'
};
function fixture(opts={}){
 const expected=mathNov12ForParentImport().exercises.find(x=>x.id==='MTH12_03');
 const stored=structuredClone(expected);stored.questions[9]={...OLD};
 if(opts.unknown)stored.questions[9].q='Énoncé inconnu';
 if(opts.altered)stored.questions[0].q='Question originale modifiée';
 if(opts.corrected)stored.questions[9]={...expected.questions[9]};
 const data=new Map([['exercises/MTH12_03',stored]]);
 if(opts.attempt)data.set('attempts/MTH12_03',{score:10});
 if(opts.privateAttempt)data.set('privateAttempts/MTH12_03',{score:10});
 if(opts.released)data.set('releasedCorrections/MTH12_03',{});
 if(opts.pub)data.set('publicExercises/MTH12_03',{});
 if(opts.key)data.set('answerKeys/MTH12_03',{});
 const history=[];
 const db={
  transaction:async()=>{history.push({kind:'begin'});return 'transaction-test';},
  get:async(path,tx)=>{history.push({kind:'get',path,tx});return data.get(path)||null;},
  commit:async(writes,tx)=>{
   history.push({kind:'commit',writes,tx});
   assert.equal(writes.length,1);
   assert.equal(writes[0].update.name.endsWith('/exercises/MTH12_03'),true);
   assert.deepEqual(writes[0].updateMask.fieldPaths,['payloadJson']);
   assert.equal(tx,'transaction-test');
   const next=JSON.parse(writes[0].update.fields.payloadJson.stringValue);
   data.set('exercises/MTH12_03',next);
   return {writeResults:[{}]};
  }
 };
 return {db,history,data,expected};
}
const approval={approval:'MTH12_03_Q10_PARENT_APPROVED_20261114'};
test('Correcteur serveur : une seule écriture payloadJson et neuf questions conservées',async()=>{
 const {db,history,data,expected}=fixture();
 const out=await TESTABLE.correctMathNov12Question10(db,PARENT_UID,approval);
 assert.equal(out.status,'updated');
 assert.equal(history.filter(x=>x.kind==='commit').length,1);
 const current=data.get('exercises/MTH12_03');
 assert.deepEqual(current.questions.slice(0,9),expected.questions.slice(0,9));
 assert.deepEqual(current.questions[9],expected.questions[9]);
 assert.deepEqual([...data.keys()],['exercises/MTH12_03']);
 const again=await TESTABLE.correctMathNov12Question10(db,PARENT_UID,approval);
 assert.equal(again.status,'already-corrected');
 assert.equal(history.filter(x=>x.kind==='commit').length,1);
});
test('Correcteur serveur : arrêt sans écriture si tentative/copie ou banque parallèle',async()=>{
 for(const key of ['attempt','privateAttempt','released','pub','key','altered','unknown']){
  const {db,history}=fixture({[key]:true});
  await assert.rejects(TESTABLE.correctMathNov12Question10(db,PARENT_UID,approval));
  assert.equal(history.filter(x=>x.kind==='commit').length,0,key);
 }
});
test('Correcteur serveur : Parent seulement et accord explicite obligatoire',async()=>{
 const {db,history}=fixture();
 await assert.rejects(TESTABLE.correctMathNov12Question10(db,TIM_UID,approval));
 await assert.rejects(TESTABLE.correctMathNov12Question10(db,PARENT_UID,{}));
 assert.equal(history.length,0);
});
