import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,getDoc,getDocs,setDoc,collection,query,where} from 'firebase/firestore';
const parentUid='BPEuNAhHVyX8ewQ2I54s56m11vj1',timUid='uqZI3Up97YWzKvWhssWQidn4TJO2';
let env;
const client=uid=>uid===null?env.unauthenticatedContext().firestore():env.authenticatedContext(uid).firestore();
before(async()=>{
 assert.ok(process.env.FIRESTORE_EMULATOR_HOST,'Tests exécutables uniquement sur émulateur Firestore.');
 env=await initializeTestEnvironment({
  projectId:'tim-notes-droits-isoles',
  firestore:{rules:readFileSync(new URL('../../firestore.rules',import.meta.url),'utf8')}
 });
 await env.withSecurityRulesDisabled(async ctx=>{
  const admin=ctx.firestore();
  await setDoc(doc(admin,'privateAttempts/SPW_L09_01'),{
   authorUid:timUid,score:7,total:10,answers:[{question:'Exemple',response:'Réponse'}]
  });
  await setDoc(doc(admin,'attempts/SPW_L09_01'),{authorUid:timUid,xp:0});
 });
});
after(async()=>{if(env)await env.cleanup()});
test('Le parent connecté consulte la note et liste les corrections privées',async()=>{
 const db=client(parentUid);
 const attempt=await assertSucceeds(getDoc(doc(db,'privateAttempts/SPW_L09_01')));
 assert.equal(attempt.data().score,7);
 const list=await assertSucceeds(getDocs(collection(db,'privateAttempts')));
 assert.equal(list.size,1);
 await assertSucceeds(getDocs(collection(db,'attempts')));
});
test('Tim voit son état personnel mais pas le détail privé réservé au parent',async()=>{
 const db=client(timUid);
 await assertSucceeds(getDoc(doc(db,'attempts/SPW_L09_01')));
 await assertSucceeds(getDocs(query(collection(db,'attempts'),where('authorUid','==',timUid))));
 await assertFails(getDoc(doc(db,'privateAttempts/SPW_L09_01')));
 await assertFails(getDocs(collection(db,'privateAttempts')));
 await assertFails(setDoc(doc(db,'privateAttempts/SPW_L09_02'),{score:10}));
});
test('Invités, tiers et Parent ne peuvent falsifier une note',async()=>{
 for(const uid of [null,'other-user',parentUid]){
  const db=client(uid);
  if(uid!==parentUid){
   await assertFails(getDoc(doc(db,'privateAttempts/SPW_L09_01')));
   await assertFails(getDocs(collection(db,'privateAttempts')));
  }
  await assertFails(setDoc(doc(db,'privateAttempts/SPW_L09_01'),{score:10}));
 }
});
