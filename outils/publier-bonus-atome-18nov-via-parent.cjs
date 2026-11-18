'use strict';
/* Import ciblé d'un seul exercice Bonus devoirs de physique depuis le compte Parent.
   Aucun UPDATE/DELETE, aucune écriture de copies, notes, XP ou tentatives Tim.
   Branche de préparation uniquement ; ne modifie pas main. */
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const EMAIL=process.env.TIM_PARENT_EMAIL,PASSWORD=process.env.TIM_PARENT_PASSWORD;
(async()=>{
 assert.equal(process.env.TIM_PHYSIQUE_BONUS_PUBLISH,'OUI','Publication non autorisée.');
 assert(EMAIL&&PASSWORD,'Accès Parent non configuré ; aucune écriture.');
 const pack=JSON.parse(readFileSync(path.join(__dirname,'../packs/bonus-physique-atome-az-18nov-2026.json'),'utf8'));
 assert.equal(pack.lessons?.length,0);
 assert.equal(pack.exercises?.length,1);
 const ex=pack.exercises[0];
 assert.equal(ex.id,'BD1811_PC02');
 assert.equal(ex.subject,'Physique-chimie');
 assert.equal(ex.lesson,'PC_BIS01');
 assert.equal(ex.homeworkBonus,true);
 assert.equal(ex.category,'bonus');
 assert.equal(ex.questions?.length,10);
 assert(ex.questions.every(q=>q.q?.trim()&&q.why?.trim()&&q.right!==undefined));
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  await page.goto(URL+'?bonus-atome-1811',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&typeof window.__TIM_BRIDGE?.publish==='function',null,{timeout:60000});
  const lessonOk=await page.evaluate(()=>window.__TIM_DATA?.lessons?.some(x=>x.id==='PC_BIS01')===true);
  assert(lessonOk,'Leçon PC_BIS01 absente du compte Parent ; aucun import.');
  const current=await page.evaluate(async id=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,getDoc,doc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const snap=await getDoc(doc(getFirestore(getApp()),'exercises',id));
   return snap.exists()?(snap.data().payloadJson?JSON.parse(snap.data().payloadJson):snap.data()):null;
  },ex.id);
  if(current){
   for(const key of Object.keys(ex))assert.deepEqual(current[key],ex[key],'Conflit avec un exercice existant : '+key);
   console.log('Exercice déjà présent, contenu identique. Aucun écrasement.');
  } else {
   const count=await page.evaluate(async exercise=>window.__TIM_BRIDGE.publish({lessons:[],exercises:[exercise]}),ex);
   assert.equal(count,1,'Un seul bonus devait être ajouté.');
   console.log('Import Parent exécuté : un exercice créé, sans autre écriture.');
  }
  const verified=await page.evaluate(async id=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,getDoc,doc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const snap=await getDoc(doc(getFirestore(getApp()),'exercises',id));
   if(!snap.exists())return null;
   const data=snap.data().payloadJson?JSON.parse(snap.data().payloadJson):snap.data();
   return {id:data.id,homeworkBonus:data.homeworkBonus,subject:data.subject,questions:data.questions?.length,category:data.category};
  },ex.id);
  assert.deepEqual(verified,{id:'BD1811_PC02',homeworkBonus:true,subject:'Physique-chimie',questions:10,category:'bonus'});
  await page.reload({waitUntil:'domcontentloaded'});
  // Le classeur exige de choisir à nouveau Parent après chaque rechargement,
  // même si Firebase conserve la session. Ne pas saisir de mot de passe Tim.
  await page.locator('#parent-enter').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&window.__TIM_DATA?.exercises?.some(x=>x.id==='BD1811_PC02'),null,{timeout:60000});
  const shown=await page.evaluate(()=>window.__TIM_DATA.exercises.some(x=>x.id==='BD1811_PC02'&&x.homeworkBonus===true&&x.questions?.length===10));
  assert(shown,'Le bonus n apparaît pas dans le catalogue rechargé Parent.');
  console.log('PUBLIÉ ET VÉRIFIÉ : Bonus devoirs / Physique-chimie / Atome et noyau, 10 questions, dans le catalogue Parent rechargé.');
  console.log('Aucune copie, note, XP ou tentative de Tim modifiée.');
 } finally {await browser.close();}
})().catch(e=>{console.error('PUBLICATION NON CONFIRMÉE : '+String(e?.message||e).slice(0,500));process.exitCode=1;});
