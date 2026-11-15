'use strict';
/* Réemploi du circuit existant Parent + Chromium + TIM_BRIDGE.publish.
   Ne crée que deux nouveaux documents : aucune écriture de résultats ni de copies Tim. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const path=require('node:path');
const SITE=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const EMAIL=process.env.TIM_PARENT_EMAIL;
const PASSWORD=process.env.TIM_PARENT_PASSWORD;
(async()=>{
 assert.equal(process.env.TIM_HG_CAHIER_PUBLISH,'OUI','Import nazisme non autorisé dans cette exécution.');
 assert(EMAIL&&PASSWORD,'Connexion Parent existante absente ; aucun import.');
 const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'../packs/bonus-nazisme-cahier-16nov-v2.json'),'utf8'));
 assert.equal(pack.lessons?.length,1);
 assert.equal(pack.exercises?.length,1);
 const lesson=pack.lessons[0],exercise=pack.exercises[0];
 assert.equal(lesson.id,'BD16_HG_CAHIER');
 assert.equal(exercise.id,'BD1611_HG02');
 assert.equal(exercise.lesson,lesson.id);
 assert.equal(exercise.homeworkBonus,true);
 assert.equal(exercise.homeworkDue,'2026-11-16');
 assert.equal(exercise.questions?.length,10);
 assert(exercise.questions.every(q=>q.why?.trim()&&q.q?.trim()));
 assert(!pack.exercises.some(e=>e.id==='BD1611_HG01'));
 const bin=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(bin?{executablePath:bin}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  let ready=false;
  for(let i=0;i<35;i++){
   await page.goto(SITE+'?hg-cahier='+i,{waitUntil:'domcontentloaded',timeout:45000});
   ready=await page.evaluate(async()=>{
    const [html,app,hg]=await Promise.all([
     fetch('./index.html',{cache:'no-store'}).then(r=>r.ok?r.text():''),
     fetch('./app.js',{cache:'no-store'}).then(r=>r.ok?r.text():''),
     fetch('./histoire-geographie-pack.js',{cache:'no-store'}).then(r=>r.ok?r.text():'')
    ]);
    return html.includes('emc-20261115-cahier-nazisme-v5')&&
      app.includes('newerNazismBonus')&&
      hg.includes('hg-ent-20261113-nazisme-9bis-cahier-20261115-v5');
   });
   if(ready)break;
   console.log('Cloudflare pas encore à la version HG requise : vérification '+(i+1));
   await new Promise(r=>setTimeout(r,8000));
  }
  assert(ready,'Version Cloudflare non conforme ; aucun import Firestore.');
  console.log('CONFIRMÉ CLOUDFLARE : nouvelle leçon BIS et filtrage du bonus présents.');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&typeof window.__TIM_BRIDGE?.publish==='function',null,{timeout:60000});
  const state=await page.evaluate(async data=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp());
   const refs=[
    ['lessons',data.lessons[0]],
    ['exercises',data.exercises[0]]
   ];
   const docs=await Promise.all(refs.map(([collection,v])=>getDoc(doc(db,collection,v.id))));
   const attempts=await Promise.all(['BD1611_HG01','BD1611_HG02'].map(id=>getDoc(doc(db,'attempts',id))));
   let existing=0;
   for(let i=0;i<docs.length;i++){
    if(!docs[i].exists())continue;
    existing++;
    const raw=docs[i].data();
    const actual=raw.payloadJson?JSON.parse(raw.payloadJson):raw;
    const desired=refs[i][1];
    if(Object.keys(desired).some(k=>JSON.stringify(actual[k])!==JSON.stringify(desired[k])))
     throw new Error('Conflit de documents existants '+desired.id+' ; aucun écrasement autorisé.');
   }
   return {existing,oldAttemptExists:attempts[0].exists(),newAttemptExists:attempts[1].exists()};
  },pack);
  assert(!state.newAttemptExists,'Une tentative du nouveau bonus existe déjà : import refusé.');
  assert([0,2].includes(state.existing),'Import partiel détecté : aucun écrasement.');
  console.log('AVANT import : documents du lot '+state.existing+'/2 ; ancienne tentative '+(state.oldAttemptExists?'présente':'absente')+'.');
  if(state.existing===0){
   const count=await page.evaluate(async data=>window.__TIM_BRIDGE.publish(data),{lessons:pack.lessons,exercises:pack.exercises});
   assert.equal(count,2,'Deux nouveaux documents attendus.');
   console.log('CONFIRMÉ FIRESTORE : deux documents ajoutés par le compte Parent.');
  }
  const verified=await page.evaluate(async data=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp());
   const [l,e,a,b]=await Promise.all([
    getDoc(doc(db,'lessons',data.lessons[0].id)),
    getDoc(doc(db,'exercises',data.exercises[0].id)),
    getDoc(doc(db,'attempts','BD1611_HG01')),
    getDoc(doc(db,'attempts','BD1611_HG02'))
   ]);
   const lesson=l.exists()?(l.data().payloadJson?JSON.parse(l.data().payloadJson):l.data()):null;
   const exercise=e.exists()?(e.data().payloadJson?JSON.parse(e.data().payloadJson):e.data()):null;
   return {lesson:lesson?.id,exercise:exercise?.id,count:exercise?.questions?.length,oldAttemptExists:a.exists(),newAttemptExists:b.exists()};
  },pack);
  assert.equal(verified.lesson,'BD16_HG_CAHIER');
  assert.equal(verified.exercise,'BD1611_HG02');
  assert.equal(verified.count,10);
  assert.equal(verified.oldAttemptExists,state.oldAttemptExists,'Une tentative ancienne a changé !');
  assert.equal(verified.newAttemptExists,state.newAttemptExists,'Une tentative nouvelle a changé !');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_DATA?.exercises?.some(x=>x.id==='BD1611_HG02'),null,{timeout:60000});
  const view=await page.evaluate(()=>({
   lesson:window.__TIM_DATA?.lessons?.some(x=>x.id==='BD16_HG_CAHIER'),
   bonus:window.__TIM_DATA?.exercises?.some(x=>x.id==='BD1611_HG02'&&x.questions?.length===10),
   old:window.__TIM_DATA?.exercises?.some(x=>x.id==='BD1611_HG01')
  }));
  assert.deepEqual(view,{lesson:true,bonus:true,old:true});
  console.log('CONFIRMÉ PARENT APRÈS RECHARGEMENT : nouveau bonus de dix questions et nouvelle fiche visibles, ancienne fiche préservée. Aucune tentative ni XP écrit.');
 }finally{await browser.close();}
})().catch(e=>{console.error('Import HG non confirmé : '+String(e?.message||e).slice(0,380));process.exitCode=1;});
