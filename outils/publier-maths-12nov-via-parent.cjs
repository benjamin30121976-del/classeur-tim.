'use strict';
/* Import Parent existant : mathématiques du 12 novembre.
   Crée seulement 1 leçon BIS et 3 exercices de 10 questions absents.
   Aucun droit Firebase supplémentaire et aucune tentative modifiée. */
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const EMAIL=process.env.TIM_PARENT_EMAIL,PASSWORD=process.env.TIM_PARENT_PASSWORD;
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
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
