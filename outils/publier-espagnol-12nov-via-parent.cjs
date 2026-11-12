'use strict';
/* Reprend la méthode d'import Parent utilisée pour les 150 entraînements.
   N'ajoute que les 3 exercices du 12 novembre absents. Aucune écriture dans
   les tentatives, notes, XP, cours ENT ou autres matières. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const email=process.env.TIM_PARENT_EMAIL||'';
const password=process.env.TIM_PARENT_PASSWORD||'';
const url=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';

(async()=>{
 if(!email||!password)throw Error('Compte Parent non configuré : aucun changement effectué.');
 const {nov12ForParentImport}=await import('../functions/spanish-nov12-training.mjs');
 const exercises=nov12ForParentImport();
 assert.deepEqual(exercises.map(x=>x.id),['ESE_L14_01','ESE_L14_02','ESE_L14_03']);
 assert(exercises.every(ex=>ex.lesson==='L14'&&ex.category==='school'&&ex.kind==='training'&&ex.questions.length===10));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:840},locale:'fr-FR'});
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response?.ok())throw Error('Le site V16 est inaccessible.');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>window.__TIM_PARENT===true&&document.body.classList.contains('ready')&&typeof window.__TIM_BRIDGE?.publish==='function',null,{timeout:45000});
  const plan=await page.evaluate(rows=>{
   const pack=window.__TIM_DATA||{};
   const lessons=new Set((pack.lessons||[]).map(x=>x.id));
   const existing=new Map((pack.exercises||[]).map(x=>[x.id,x]));
   if(!lessons.has('L14'))throw Error('Leçon L14 absente : aucun import effectué.');
   for(const q of rows){
    if(existing.has(q.id)){
     const old=existing.get(q.id);
     if(old.questions?.length!==10||old.lesson!=='L14')
      throw Error('Un identifiant existe avec une autre structure : aucun écrasement.');
    }
   }
   return {ids:rows.filter(x=>!existing.has(x.id)).map(x=>x.id),found:rows.length-rows.filter(x=>!existing.has(x.id)).length};
  },exercises);
  console.log('Exercices du 12 novembre déjà présents : '+plan.found+' / 3.');
  if(plan.ids.length){
   const pending=exercises.filter(x=>plan.ids.includes(x.id));
   const count=await page.evaluate(async batch=>window.__TIM_BRIDGE.publish({lessons:[],exercises:batch}),pending);
   assert.equal(count,pending.length);
   console.log('Import Parent demandé et confirmé : '+count+' exercice(s).');
  }
  await page.reload({waitUntil:'domcontentloaded'});
  if(!await page.evaluate(()=>window.__TIM_PARENT===true&&document.body.classList.contains('ready'))){
   if(await page.locator('#parent-enter').isVisible()){
    await page.locator('#parent-enter').click();
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(password);
    await page.locator('#login-button').click();
   }
  }
  await page.waitForFunction(()=>window.__TIM_PARENT===true&&document.body.classList.contains('ready'),null,{timeout:45000});
  const verify=await page.evaluate(ids=>{
   const docs=window.__TIM_DATA?.exercises||[];
   return ids.filter(id=>docs.some(x=>x.id===id&&x.questions?.length===10)).length;
  },exercises.map(x=>x.id));
  assert.equal(verify,3,'La relecture de Firebase ne confirme pas les 3 exercices.');
  console.log('CONFIRMÉ : 3 exercices de 10 questions relus dans Firestore avec le compte Parent. Aucun résultat de Tim modifié.');
 }finally{await browser.close();}
})().catch(e=>{
 console.error('Import des exercices du 12 novembre non confirmé : '+String(e?.message||e).slice(0,280));
 process.exitCode=1;
});
