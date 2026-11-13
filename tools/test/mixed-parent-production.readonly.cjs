'use strict';
/* Test de production sur le compte Parent : uniquement des appels de simulation
   explicitement sans écriture et sans XP. Jamais de validation Tim. */
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
(async()=>{
 const {mixedMission}=await import('../../worker/mixed-challenges.mjs');
 assert(process.env.TIM_PARENT_EMAIL&&process.env.TIM_PARENT_PASSWORD,'Secrets Parent non disponibles');
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{args:['--no-sandbox']})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:850},locale:'fr-FR'});
  let blocked=0;
  await page.route('**/api/tim',async route=>{
   let body={};try{body=route.request().postDataJSON()}catch{}
   const allowed=['getParentBonus','getSpanishDailyMissions','getMixedChallengePlan','getParentReport',
    'getSpanishTrainingProgress','getTimReleasedCorrections','getMathEntProgress','getMathTrainingProgress',
    'getSpanishEntTrainingProgress','getPhysicsTrainingProgress','getPhysicsEntProgress',
    'getSpanishEntTrainingTask','getMathTrainingTask','getMathEntTask','getPhysicsTrainingTask',
    'getPhysicsEntTask','previewMixedChallenge'];
   if(!allowed.includes(body.action)){blocked++;await route.abort('blockedbyclient');return;}
   await route.continue();
  });
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
  await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&Boolean(window.__TIM_BRIDGE?.mixedMissionPreview),null,{timeout:50000});
  const data=await page.evaluate(()=>{
   const meta=window.__TIM_CHALLENGES||{},id=meta.dailyIds?.[0];
   const exercise=window.__TIM_DATA?.exercises?.find(q=>q.id===id);
   return {id,bank:exercise?.questionBank,count:exercise?.questions?.length,parent:Boolean(window.__TIM_PARENT)};
  });
  assert(data.parent&&data.id&&data.bank==='mixed-202611-v1'&&data.count===10);
  const mission=mixedMission(data.id),answers=mission.questions.map(q=>{
   if(q.type==='mc')return String(q.right);
   if(q.type==='text')return String(q.right);
   const nums=q.parts.filter(n=>typeof n==='number'),ops=q.parts.filter(x=>typeof x==='string');
   return JSON.stringify({m:String(q.right),c:nums.join(' ; ')+' '+ops.join(' '),
    s:'La réponse au problème est '+q.answer+' '+(q.unit||'unités')+'.'});
  });
  const full=await page.evaluate(async({id,answers})=>window.__TIM_BRIDGE.mixedMissionPreview(id,answers,[]),
   {id:data.id,answers});
  assert.equal(full.score,10);assert.equal(full.total,10);assert.equal(full.saved,false);
  assert.equal(full.submitted,false);assert.equal(full.xp,0);
  const empty=await page.evaluate(async({id})=>window.__TIM_BRIDGE.mixedMissionPreview(id,Array(10).fill(''),[]),
   {id:data.id});
  assert.equal(empty.score,0);assert.equal(empty.saved,false);assert.equal(empty.xp,0);
  // Test du bouton concret de l'accueil jusqu'à la correction.
  await page.locator('.daily-loup-launch').first().evaluate(button=>button.click());
  const introduction=page.locator('#exercise-detail');
  await introduction.getByText('Essai Parent — méthode du défi').waitFor({timeout:15000});
  await introduction.getByRole('button',{name:'Commencer mon essai Parent'}).evaluate(b=>b.click());
  for(let i=0;i<10;i++){
   const nav=introduction.locator('.mix-nav button').last();
   await nav.evaluate(b=>b.click());
  }
  assert.equal(await introduction.getByRole('button',{name:'Corriger mon essai Parent (sans XP)'}).isEnabled(),true);
  await introduction.getByRole('button',{name:'Corriger mon essai Parent (sans XP)'}).evaluate(b=>b.click());
  await introduction.getByText('Note de mon essai Parent : 0/10').waitFor({timeout:20000});
  assert.equal(await introduction.locator('.mix-correction').count(),10);
  assert.equal(blocked,0,'La simulation a essayé d’effectuer des opérations non autorisées.');
  console.log('CONFIRMÉ EN PRODUCTION : compte Parent, 10/10 complet, 0/10 vide, bouton réel de correction, 0 XP et aucune écriture Tim.');
 }finally{await browser.close();}
})().catch(err=>{console.error('ÉCHEC correction Parent en production : '+String(err?.stack||err).slice(0,2100));process.exitCode=1;});
