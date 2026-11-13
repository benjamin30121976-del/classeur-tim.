'use strict';
/* Import sécurisé via le compte Parent, identique à celui des trois exercices.
   Ces trois documents sont des emplacements de suivi et NON des notes.
   Aucune copie Tim, aucun XP, aucune ancienne donnée ne sont modifiés. */
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const EMAIL=process.env.TIM_PARENT_EMAIL,PASS=process.env.TIM_PARENT_PASSWORD;
(async()=>{
 assert(EMAIL&&PASS,'Compte Parent indisponible : aucun changement.');
 const {spanishNov12HelpExercises}=await import('../functions/spanish-nov12-help-logging.mjs');
 const items=spanishNov12HelpExercises();
 const {rawPoints}=await import('../functions/xp.mjs');
 assert.equal(items.length,3);
 assert(items.every(x=>x.category==='school'&&x.questions.length===1&&rawPoints({kind:x.kind,category:x.category,score:1,total:1})===0));
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:840},locale:'fr-FR'});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASS);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>window.__TIM_PARENT===true&&document.body.classList.contains('ready')&&typeof window.__TIM_BRIDGE?.publish==='function',null,{timeout:45000});
  const missing=await page.evaluate(async items=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp());
   const snaps=await Promise.all(items.map(item=>getDoc(doc(db,'exercises',item.id))));
   for(const [i,snap] of snaps.entries()){
    if(!snap.exists())continue;
    const raw=snap.data(),value=raw.payloadJson?JSON.parse(raw.payloadJson):raw,ex=items[i];
    if(value.id!==ex.id||value.category!=='school'||value.kind!=='translation-help-log'||
       value.questions?.length!==1||value.questions[0].type!=='text')
      throw Error('Conflit de suivi avec un document existant ; aucune modification effectuée.');
   }
   return items.filter((_,i)=>!snaps[i].exists()).map(x=>x.id);
  },items);
  console.log('Suivis privés existants : '+(3-missing.length)+'/3.');
  if(missing.length){
   const input=items.filter(x=>missing.includes(x.id));
   const count=await page.evaluate(async input=>window.__TIM_BRIDGE.publish({lessons:[],exercises:input}),input);
   assert.equal(count,input.length);
  }
  const checked=await page.evaluate(async ids=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp());
   const docs=await Promise.all(ids.map(id=>getDoc(doc(db,'exercises',id))));
   return docs.filter(s=>s.exists()&&JSON.parse(s.data()?.payloadJson||'{}').kind==='translation-help-log').length;
  },items.map(x=>x.id));
  assert.equal(checked,3);
  console.log('CONFIRMÉ FIRESTORE : 3 emplacements de suivi traduction disponibles, 0 XP, aucune tentative créée.');
 }finally{await browser.close();}
})().catch(error=>{
 console.error('Publication du suivi non confirmée : '+String(error?.message||error).slice(0,450));
 process.exitCode=1;
});
