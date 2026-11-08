/* Cryptographic tests for Cloudflare-to-Firebase auth. No real credentials. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {PROJECT,PARENT_UID,TIM_UID,verifyFirebaseToken,getFirestoreAccessToken} from '../../worker/auth.mjs';
const C=globalThis.crypto||webcrypto;
const TE=new TextEncoder();
const encode=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
const bytes=data=>Buffer.from(data).toString('base64url');
function claims(uid){
 const now=Math.floor(Date.now()/1000);
 return {iss:'https://securetoken.google.com/'+PROJECT,aud:PROJECT,sub:uid,
  iat:now-60,exp:now+3000,auth_time:now-100};
}
async function signedJwt(key,payload,kid='test-2026'){
 const header=encode({alg:'RS256',typ:'JWT',kid}),body=encode(payload),toSign=header+'.'+body;
 const signature=await C.subtle.sign('RSASSA-PKCS1-v1_5',key.privateKey,TE.encode(toSign));
 return toSign+'.'+bytes(signature);
}
test('Les jetons Firebase sont vérifiés cryptographiquement avant les rôles',async()=>{
 const key=await C.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,
  publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const publicJwk=await C.subtle.exportKey('jwk',key.publicKey);
 publicJwk.kid='test-2026';publicJwk.alg='RS256';publicJwk.use='sig';
 const old=globalThis.fetch;
 globalThis.fetch=async url=>{
  assert.match(String(url),/securetoken@system/);
  return new Response(JSON.stringify({keys:[publicJwk]}),{headers:{'cache-control':'max-age=3600'}});
 };
 try{
  assert.equal(await verifyFirebaseToken('Bearer '+await signedJwt(key,claims(PARENT_UID))),PARENT_UID);
  assert.equal(await verifyFirebaseToken('Bearer '+await signedJwt(key,claims(TIM_UID))),TIM_UID);
  const outsiderToken=await signedJwt(key,claims('different-user'));
  await assert.rejects(()=>verifyFirebaseToken('Bearer '+outsiderToken),e=>e.status===403);
  const foreign={...claims(TIM_UID),aud:'other-project'};
  const foreignToken=await signedJwt(key,foreign);
  await assert.rejects(()=>verifyFirebaseToken('Bearer '+foreignToken),e=>e.status===401);
  const expired={...claims(TIM_UID),exp:Math.floor(Date.now()/1000)-1};
  const expiredToken=await signedJwt(key,expired);
  await assert.rejects(()=>verifyFirebaseToken('Bearer '+expiredToken),e=>e.status===401);
  const token=await signedJwt(key,claims(TIM_UID));
  const tampered=token.slice(0,-4)+'ABCD';
  await assert.rejects(()=>verifyFirebaseToken('Bearer '+tampered),e=>e.status===401);
 }finally{globalThis.fetch=old;}
});
test('Compte de service : jeton OAuth de portée Firestore, sans clé publiée',async()=>{
 const key=await C.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,
  publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const pkcs8=await C.subtle.exportKey('pkcs8',key.privateKey);
 const pem='-----BEGIN PRIVATE KEY-----\n'+Buffer.from(pkcs8).toString('base64').match(/.{1,64}/g).join('\n')+'\n-----END PRIVATE KEY-----\n';
 const secret=JSON.stringify({project_id:PROJECT,client_email:'tim-test@'+PROJECT+'.iam.gserviceaccount.com',private_key:pem});
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=async (url,options)=>{
  assert.equal(String(url),'https://oauth2.googleapis.com/token');
  calls++;
  const body=new URLSearchParams(options.body);
  assert.match(body.get('grant_type'),/jwt-bearer/);
  const jwt=body.get('assertion').split('.');
  const payload=JSON.parse(Buffer.from(jwt[1],'base64url').toString());
  assert.equal(payload.scope,'https://www.googleapis.com/auth/datastore');
  assert.equal(payload.aud,'https://oauth2.googleapis.com/token');
  return new Response(JSON.stringify({access_token:'TEST-OAUTH-TOKEN',expires_in:3600}));
 };
 try{
  assert.equal(await getFirestoreAccessToken({FIREBASE_SERVICE_ACCOUNT:secret}),'TEST-OAUTH-TOKEN');
  assert.equal(calls,1);
  await assert.rejects(()=>getFirestoreAccessToken({FIREBASE_SERVICE_ACCOUNT:JSON.stringify({project_id:'other-project'})}),e=>e.status===503);
 }finally{globalThis.fetch=old;}
});
