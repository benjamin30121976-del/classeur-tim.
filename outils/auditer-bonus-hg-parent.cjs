'use strict';
/* Contrôle Parent en lecture seule : existe-t-il une copie de l'ancien bonus ?
   N'affiche aucun score, aucune réponse et n'exécute aucune écriture. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const EMAIL=process.env.TIM_PARENT_EMAIL||'';
const PASSWORD=process.env.TIM_PARENT_PASSWORD||'';
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
(async()=>{
 assert(EMAIL&&PASSWORD,'Secrets Parent absents. Aucun audit possible.');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_BRIDGE,null,{timeout:60000});
  const read=await page.evaluate(async()=>{
   try{
    const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
    const {getAuth}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js');
    const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
    const app=getApp();
    if(!getAuth(app).currentUser)return {status:'non-authentifie'};
    const snap=await getDoc(doc(getFirestore(app),'attempts','BD1611_HG01'));
    const exists=snap.exists();
    const present=(window.__TIM_DATA?.exercises||[]).some(e=>e.id==='BD1611_HG01');
    const newPresent=(window.__TIM_DATA?.exercises||[]).some(e=>e.id==='BD1611_HG02');
    return {status:'lu',oldAttemptExists:exists,oldExerciseVisible:present,newExerciseVisible:newPresent};
   }catch(e){return {status:'inconnu',code:String(e?.code||'lecture-impossible').slice(0,40)};}
  });
  assert.equal(read.status,'lu','État de la copie non vérifiable : '+read.status);
  console.log('AUDIT HG BONUS LECTURE SEULE : '+JSON.stringify(read));
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error('AUDIT HG BONUS INCOMPLET : '+e.message);process.exitCode=1;});
