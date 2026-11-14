import test from 'node:test';
import assert from 'node:assert/strict';
import {isFirestoreQuotaResponse} from '../firestore.mjs';
const fake=(status,statusText='',message='')=>({status,clone(){return {json:async()=>({error:{status:statusText,message}})};}});
test('Le serveur reconnaît le quota HTTP 429',async()=>{
 assert.equal(await isFirestoreQuotaResponse(fake(429)),true);
});
test('Le serveur reconnaît la réponse Google RESOURCE_EXHAUSTED en HTTP 403',async()=>{
 assert.equal(await isFirestoreQuotaResponse(fake(403,'RESOURCE_EXHAUSTED','Quota exceeded.')),true);
 assert.equal(await isFirestoreQuotaResponse(fake(403,'PERMISSION_DENIED','Forbidden')),false);
});
test('Aucun autre statut n est confondu avec un dépassement de quota',async()=>{
 assert.equal(await isFirestoreQuotaResponse(fake(500,'INTERNAL','Quota exceeded')),false);
 assert.equal(await isFirestoreQuotaResponse(fake(404)),false);
});
