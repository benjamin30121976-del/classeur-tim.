'use strict';
/* Import Parent existant : mathématiques du 12 novembre.
   Crée seulement 1 leçon BIS et 3 exercices de 10 questions absents.
   Aucun droit Firebase supplémentaire et aucune tentative modifiée. */
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const EMAIL=process.env.TIM_PARENT_EMAIL,PASSWORD=process.env.TIM_PARENT_PASSWORD;
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const Q10_MODE=process.env.TIM_MTH12_Q10_MODE||'legacy-import';
const {planQuestion10}=require('./mth12-question10-guard.cjs');

async function question10Snapshot(page){
 // Les trois documents autorisés en lecture au Parent restent sous transaction.
 return page.evaluate(async()=>{
  const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
  const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
  const db=getFirestore(getApp());
  const names=['exercises','attempts','privateAttempts'];
  const records=await Promise.all(names.map(name=>getDoc(doc(db,name,'MTH12_03'))));
  return {payloadJson:records[0].exists()?records[0].data()?.payloadJson:null,
   exercise:records[0].exists(),attempt:records[1].exists(),privateAttempt:records[2].exists()};
 });
}
async function serverBankSnapshot(page){
 // Réutiliser l'action diagnostic serveur Parent existante pour les trois
 // collections dont la lecture directe est bloquée en production.
 return page.evaluate(async()=>{
  const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
  const {getAuth}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js');
  const current=getAuth(getApp()).currentUser;
  if(!current)throw Error('STOP : session Parent non disponible pour le contrôle serveur.');
  const token=await current.getIdToken();
  const resp=await fetch('/api/tim',{method:'POST',cache:'no-store',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
   body:JSON.stringify({action:'getFirestoreReadDiagnostics',payload:{mathNov12Bank:true}})});
  if(!resp.ok)throw Error('STOP : diagnostic serveur refusé, HTTP '+resp.status+'.');
  const data=(await resp.json())?.data;
  if(data?.readOnly!==true||data?.bank!=='MTH12_03'||
     ['exercise','publicExercise','answerKey','releasedCorrection','attempt','privateAttempt']
      .some(k=>typeof data[k]!=='boolean'))
   throw Error('STOP : diagnostic serveur ciblé indisponible ; aucune écriture.');
  return data;
 });
}
async function bankSnapshot(page){
 const [client,server]=await Promise.all([question10Snapshot(page),serverBankSnapshot(page)]);
 if(client.exercise!==server.exercise||client.attempt!==server.attempt||
    client.privateAttempt!==server.privateAttempt)
  throw Error('STOP : désaccord entre le compte Parent et le serveur. Aucune écriture.');
 return {payloadJson:client.payloadJson,flags:{
  attempt:server.attempt,privateAttempt:server.privateAttempt,
  publicExercise:server.publicExercise,answerKey:server.answerKey,
  releasedCorrection:server.releasedCorrection}};
}
async function checkOrFixQuestion10(page,mode,pack){
 if(mode!=='verify'&&mode!=='fix')throw Error('Mode de contrôle invalide');
 const expected=pack.exercises.find(x=>x.id==='MTH12_03');
 const before=await bankSnapshot(page);
 const plan=planQuestion10(before.payloadJson,expected,before.flags);
 console.log('QUESTION10 PRECONTROLE : '+plan.status+' ; tentatives présentes : '+Boolean(before.flags.attempt||before.flags.privateAttempt)+'.');
 if(plan.status==='already-corrected'){
  console.log('QUESTION10 : déjà correcte dans Firebase. Aucune écriture.');
  return;
 }
 if(mode==='verify'){
  console.log('QUESTION10 : modification exactement ciblée possible. Précontrôle lecture seule : aucune écriture.');
  return;
 }
 // Vérification répétée immédiatement avant la transaction, côté serveur.
 const fresh=await bankSnapshot(page);
 if(fresh.payloadJson!==before.payloadJson)throw Error('STOP : source changée depuis le précontrôle.');
 planQuestion10(fresh.payloadJson,expected,fresh.flags);
 await page.evaluate(async values=>{
  const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
  const {getFirestore,doc,runTransaction}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
  const db=getFirestore(getApp());
  const refs=['exercises','attempts','privateAttempts'].map(name=>doc(db,name,'MTH12_03'));
  await runTransaction(db,async tx=>{
   const saved=await Promise.all(refs.map(ref=>tx.get(ref)));
   if(!saved[0].exists()||saved[0].data()?.payloadJson!==values.before)
    throw Error('STOP : document modifié depuis le précontrôle ; aucune écriture.');
   if(saved[1].exists()||saved[2].exists())
    throw Error('STOP : nouvelle tentative ou copie privée présente ; aucune écriture.');
   // Une seule mise à jour : le champ payloadJson du document existant.
   tx.update(refs[0],{payloadJson:values.after});
  });
 },{before:before.payloadJson,after:plan.nextPayload});
 const after=await bankSnapshot(page);
 const verified=planQuestion10(after.payloadJson,expected,after.flags);
 assert.equal(verified.status,'already-corrected','Question 10 non confirmée après mise à jour.');
 console.log('QUESTION10 CONFIRMÉE FIRESTORE : uniquement exercises/MTH12_03 question 10 remplacée ; copies et XP intacts.');
}

(async()=>{
 assert(EMAIL&&PASSWORD,'Connexion Parent manquante');
 const {mathNov12ForParentImport}=await import('../maths-12nov-training.mjs');
 const pack=mathNov12ForParentImport();
 assert.equal(pack.lessons.length,1);assert.equal(pack.exercises.length,3);
 assert(pack.exercises.every(x=>x.questions.length===10&&x.category==='school'&&x.enabled===true));
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:840},locale:'fr-FR'});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&typeof window.__TIM_BRIDGE?.publish==='function',null,{timeout:45000});
  if(Q10_MODE==='verify'||Q10_MODE==='fix'){
   await checkOrFixQuestion10(page,Q10_MODE,pack);
   return;
  }
  if(Q10_MODE!=='legacy-import')throw Error('Mode d’import inconnu, aucune écriture.');

  const remaining=await page.evaluate(async pack=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp());
   const entries=[...pack.lessons.map(v=>({type:'lessons',v})),...pack.exercises.map(v=>({type:'exercises',v}))];
   const saved=await Promise.all(entries.map(x=>getDoc(doc(db,x.type,x.v.id))));
   for(let i=0;i<saved.length;i++){
    if(!saved[i].exists())continue;
    const raw=saved[i].data(),actual=raw.payloadJson?JSON.parse(raw.payloadJson):raw,expected=entries[i].v;
    if(actual.id!==expected.id||(entries[i].type==='exercises'&&
       (actual.questions?.length!==10||actual.lesson!=='MTH12')))
     throw Error('Identifiant déjà utilisé avec un contenu différent : import refusé.');
   }
   return entries.filter((x,i)=>!saved[i].exists());
  },pack);
  console.log('Cours et exercices du 12 novembre restant à publier : '+remaining.length+' / 4.');
  if(remaining.length){
   const lessons=remaining.filter(x=>x.type==='lessons').map(x=>x.v);
   const exercises=remaining.filter(x=>x.type==='exercises').map(x=>x.v);
   const count=await page.evaluate(async data=>window.__TIM_BRIDGE.publish(data),{lessons,exercises});
   assert.equal(count,remaining.length);
   console.log('Publication Parent confirmée pour '+count+' contenu(s).');
  }
  const verified=await page.evaluate(async pack=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp());
   const lesson=await getDoc(doc(db,'lessons','MTH12'));
   const exercises=await Promise.all(pack.exercises.map(x=>getDoc(doc(db,'exercises',x.id))));
   const all=exercises.every(x=>x.exists()&&JSON.parse(x.data().payloadJson||'{}').questions?.length===10);
   return {lesson:lesson.exists(),exercises:exercises.filter(x=>x.exists()).length,all};
  },pack);
  assert.deepEqual(verified,{lesson:true,exercises:3,all:true});
  console.log('CONFIRMÉ FIRESTORE : leçon math 12 novembre + 3 exercices (30 questions). Aucune note ou XP modifié.');
 }finally{await browser.close();}
})().catch(e=>{console.error('Import math du 12 novembre non confirmé : '+String(e?.message||e).slice(0,380));process.exitCode=1;});
