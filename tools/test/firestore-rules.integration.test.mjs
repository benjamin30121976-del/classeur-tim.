import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,getDoc,getDocs,setDoc,collection,query,where,Timestamp} from 'firebase/firestore';
const parentUid='BPEuNAhHVyX8ewQ2I54s56m11vj1',timUid='uqZI3Up97YWzKvWhssWQidn4TJO2';
let env;
const db=uid=>uid===null?env.unauthenticatedContext().firestore():env.authenticatedContext(uid).firestore();
before(async()=>{
 assert.ok(process.env.FIRESTORE_EMULATOR_HOST,'Local emulator required');
 env=await initializeTestEnvironment({projectId:'tim-access-rules-local-test',firestore:{rules:readFileSync(new URL('../../firestore.rules',import.meta.url),'utf8')}});
 await env.withSecurityRulesDisabled(async ctx=>{
  const admin=ctx.firestore();
  for(const [path,value] of [
   ['publicLessons/L01',{title:'Leçon'}],['publicExercises/E01',{enabled:false}],
   ['answerKeys/E01',{questions:[{right:1}]}],['content/legacy',{answers:['private']}],
   ['attempts/mine',{authorUid:timUid,score:0}],['attempts/other',{authorUid:'other',score:1}],
   ['privateAttempts/mine',{expected:'private'}],
   ['releasedCorrections/locked',{released:false,releaseAt:Timestamp.fromDate(new Date('2020-01-01'))}],
   ['releasedCorrections/future',{released:true,releaseAt:Timestamp.fromDate(new Date('2099-01-01'))}],
   ['releasedCorrections/past',{released:true,releaseAt:Timestamp.fromDate(new Date('2020-01-01'))}]
  ]) await setDoc(doc(admin,path),value);
 });
});
after(async()=>{if(env)await env.cleanup()});
test('Invité: aucun accès Firestore',async()=>{
 const guest=db(null);
 await assertFails(getDoc(doc(guest,'publicLessons/L01')));
 await assertFails(getDoc(doc(guest,'answerKeys/E01')));
 await assertFails(setDoc(doc(guest,'attempts/fake'),{authorUid:timUid,xp:100}));
});
test('Tim: énoncés et résultats personnels uniquement',async()=>{
 const tim=db(timUid);
 await assertSucceeds(getDoc(doc(tim,'publicLessons/L01')));
 await assertSucceeds(getDoc(doc(tim,'attempts/mine')));
 await assertFails(getDoc(doc(tim,'attempts/other')));
 await assertSucceeds(getDocs(query(collection(tim,'attempts'),where('authorUid','==',timUid))));
 await assertFails(getDocs(collection(tim,'attempts')));
});
test('Tim: réponses, anciens contenus et XP protégés',async()=>{
 const tim=db(timUid);
 for(const path of ['answerKeys/E01','content/legacy','privateAttempts/mine'])await assertFails(getDoc(doc(tim,path)));
 await assertFails(setDoc(doc(tim,'attempts/fake'),{authorUid:timUid,xp:100}));
});
test('Tim: correction après validation parent et échéance',async()=>{
 const tim=db(timUid);
 await assertFails(getDoc(doc(tim,'releasedCorrections/locked')));
 await assertFails(getDoc(doc(tim,'releasedCorrections/future')));
 await assertSucceeds(getDoc(doc(tim,'releasedCorrections/past')));
});
test('Parent: accès privé, mais ne peut pas fabriquer des XP',async()=>{
 const parent=db(parentUid);
 await assertSucceeds(getDoc(doc(parent,'answerKeys/E01')));
 await assertSucceeds(getDoc(doc(parent,'privateAttempts/mine')));
 await assertSucceeds(setDoc(doc(parent,'releasedCorrections/new'),{released:false,releaseAt:Timestamp.fromDate(new Date('2099-01-01'))}));
 await assertFails(setDoc(doc(parent,'attempts/fake'),{authorUid:timUid,xp:100}));
});
test('Compte inconnu: refus',async()=>{
 const other=db('unknown');
 await assertFails(getDoc(doc(other,'publicLessons/L01')));
 await assertFails(getDoc(doc(other,'answerKeys/E01')));
});


test('Tim cannot bypass release through listing or changing parent settings',async()=>{
 const tim=db(timUid);
 await assertFails(getDocs(collection(tim,'releasedCorrections')));
 await assertFails(setDoc(doc(tim,'settings/correctionPolicy'),{released:true}));
 await assertFails(setDoc(doc(tim,'answerKeys/E01'),{questions:[]}));
});
test('No browser account, including Parent, may write XP aggregates',async()=>{
 for(const uid of [null,timUid,parentUid,'unknown']){
  const client=db(uid);
  await assertFails(getDoc(doc(client,'xpState/tim')));
  await assertFails(setDoc(doc(client,'xpState/tim'),{earned:9999,weekEarned:9999}));
 }
});
