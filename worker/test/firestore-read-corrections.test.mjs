import test from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../server.mjs';
import {TIM_UID} from '../auth.mjs';

test('relecture de copie historique Tim : une seule lecture privée pour la même copie',async()=>{
 const counts=new Map();
 const db={
  async list(path){
   if(path==='attempts')return [
    {id:'EX_TRAIN_1',data:{authorUid:TIM_UID,correctionStatus:'pending-parent'}},
    {id:'EX_TRAIN_2',data:{authorUid:TIM_UID,correctionStatus:'released'}}
   ];
   if(path==='releasedCorrections')return [
    {id:'EX_TRAIN_2',data:{released:true}}
   ];
   throw Error('collection interdite');
  },
  async get(path){
   counts.set(path,(counts.get(path)||0)+1);
   return {needsReview:false,score:8,total:10,answers:[
     {correct:true,response:'a'},{correct:false,response:'b'}
   ]};
  }
 };
 const result=await TESTABLE.releasedCorrections(db,TIM_UID);
 assert.equal(result.corrections.length,2);
 assert.equal(counts.get('privateAttempts/EX_TRAIN_1'),1);
 assert.equal(counts.get('privateAttempts/EX_TRAIN_2'),1);
});

