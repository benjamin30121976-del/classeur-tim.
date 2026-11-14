'use strict';
/* Publication ciblée via le compte Parent existant, par Chromium/Playwright.
   À déclencher UNIQUEMENT après autorisation explicite ; n'écrit qu'un exercice absent,
   sans jamais modifier les notes, XP ou tentatives de Tim. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
const EMAIL=process.env.TIM_PARENT_EMAIL,PASSWORD=process.env.TIM_PARENT_PASSWORD;
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
(async()=>{
 assert(process.env.TIM_BONUS_PERIMETRES_CONFIRME==='OUI','Autorisation explicite requise : publication bloquée.');
 assert(EMAIL&&PASSWORD,'Connexion Parent existante manquante');
 const {bonusPerimetreTimPack}=await import('../functions/bonus-perimetres-tim-20261114.mjs');
 const pack=bonusPerimetreTimPack();
 assert.equal(pack.exercises.length,1);
 assert(pack.exercises.every(e=>e.questions.length===10&&e.kind==='bonus-day'&&e.category==='bonus'));
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:840},locale:'fr-FR'});
  let versionReady=false;
  for(let i=0;i<45;i++){
   await page.goto(URL+'?bonus-release-check='+i,{waitUntil:'domcontentloaded',timeout:45000});
   versionReady=await page.evaluate(async()=>{
    const [app,boot]=await Promise.all([
     fetch('./app.js',{cache:'no-store'}).then(r=>r.text()),
     fetch('./boot.js',{cache:'no-store'}).then(r=>r.text())
    ]);
    return app.includes("if(ex.kind==='bonus-day'){")&&boot.includes("const bonusWithoutLesson=ex.kind==='bonus-day'&&!ex.lesson;");
   });
   if(versionReady)break;
   console.log('En attente de la version Cloudflare compatible périmètres, contrôle '+(i+1)+'/45');
   await new Promise(resolve=>setTimeout(resolve,7000));
  }
  assert(versionReady,'Le nouveau classeur n est pas encore publié ; import annulé sans écriture.');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&typeof window.__TIM_BRIDGE?.publish==='function',null,{timeout:60000});
  const missing=await page.evaluate(async data=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp());
   const present=await Promise.all(data.exercises.map(e=>getDoc(doc(db,'exercises',e.id))));
   for(let i=0;i<present.length;i++){
    if(!present[i].exists())continue;
    const raw=present[i].data(),actual=raw.payloadJson?JSON.parse(raw.payloadJson):raw;
    const expected=data.exercises[i];
    if(actual.id!==expected.id||JSON.stringify(actual.questions)!==JSON.stringify(expected.questions)||actual.kind!=='bonus-day')
     throw Error('Conflit de contenu '+expected.id+' : refus de modifier un exercice existant.');
   }
   return data.exercises.filter((_,i)=>!present[i].exists());
  },pack);
  console.log('Exercices de remédiation absents : '+missing.length+' / 1.');
  if(missing.length){
   const count=await page.evaluate(async exercises=>window.__TIM_BRIDGE.publish({lessons:[],exercises}),missing);
   assert.equal(count,missing.length);
   console.log('Écriture Parent vérifiée : '+count+' bonus ajoutés.');
  }
  const verified=await page.evaluate(async exercises=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp()),docs=await Promise.all(exercises.map(e=>getDoc(doc(db,'exercises',e.id))));
   return {found:docs.filter(d=>d.exists()).length,questions:docs.reduce((n,d)=>n+(d.exists()?JSON.parse(d.data().payloadJson).questions.length:0),0)};
  },pack.exercises);
  assert.deepEqual(verified,{found:1,questions:10});
  console.log('CONFIRMÉ FIRESTORE : 1 défi périmètres, 10 questions ; aucun résultat, XP ou tentative de Tim modifié.');
 }finally{await browser.close();}
})().catch(e=>{console.error('Publication des bonus NON CONFIRMÉE : '+String(e?.message||e).slice(0,390));process.exitCode=1;});
