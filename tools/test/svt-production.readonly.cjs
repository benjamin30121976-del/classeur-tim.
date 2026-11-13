'use strict';
/* Contrôle SVT de la production avec le compte Parent ; lecture seule.
   Interdiction d'envoyer une copie, d'affecter XP et d'utiliser le compte Tim. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
(async()=>{
 assert(process.env.TIM_PARENT_EMAIL&&process.env.TIM_PARENT_PASSWORD,'Connexion Parent de test indisponible');
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
 let blocked=0;
 try{
  await page.route('**/api/tim',async route=>{
   let body;try{body=route.request().postDataJSON()}catch{body={};}
   if(/^(submitSvtTraining|submitTimExercise|submitExercise|submitMathTraining|submitPhysicsTraining|submitEnglishTraining)$/.test(body?.action||'')){
    blocked++;await route.abort('blockedbyclient');return;
   }
   await route.continue();
  });
  await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
  await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&Boolean(window.__TIM_BRIDGE?.svtTrainingTask),null,{timeout:60000});
  await page.locator('#intro-screen').waitFor({state:'visible',timeout:9000}).catch(()=>{});
  if(await page.locator('#intro-screen').isVisible()){
   await page.locator('#intro-skip').click({timeout:9000});
   await page.locator('#intro-screen').waitFor({state:'hidden',timeout:10000});
  }
  const before=await page.evaluate(()=>window.__TIM_BRIDGE.svtTrainingProgress());
  const verify=await page.evaluate(async()=>{
   const pack=window.TIM_SVT_PACK,bridge=window.__TIM_BRIDGE;
   if(!pack||!window.TIM_SVT_PATH||!window.TIM_SVT_TRAINING?.mount)
    throw Error('Le pack ou le lecteur de la SVT n’est pas chargé.');
   const ids=Array.from({length:7},(_,i)=>[1,2].map(v=>'SVQ_L0'+(i+1)+'_0'+v)).flat();
   const counts=[];
   let preview,leaked=false;
   for(const id of ids){
    const response=await bridge.svtTrainingTask(id);
    const task=response?.task;
    if(task?.questions?.length!==10)throw Error('Exercice incomplet : '+id);
    leaked=leaked||task.questions.some(q=>['right','expected','accepted','explanation'].some(k=>Object.hasOwn(q,k)));
    counts.push(task.questions.length);
    if(id==='SVQ_L07_01'){
     const answers=task.questions.map(q=>q.kind==='qcm'?0:'incorrect');
     preview=await bridge.svtTrainingPreviewSubmit(id,answers,task.bankVersion);
    }
   }
   return {lessons:pack.lessons.length,bis:pack.bis.length,homework:pack.homework.length,
    attachments:pack.attachments.length,ids:counts.length,questions:counts.reduce((a,b)=>a+b,0),
    leaked,preview};
  });
  assert.deepEqual([verify.lessons,verify.bis,verify.homework,verify.attachments,verify.ids,verify.questions],[11,7,11,1,14,140]);
  assert.equal(verify.leaked,false);
  assert.equal(verify.preview.practice,true);
  assert.equal(verify.preview.saved,false);
  assert.equal(verify.preview.xp,0);
  assert.equal(verify.preview.items.length,10);
  assert.ok(verify.preview.items.every(x=>x.explanation?.length>16));
  const after=await page.evaluate(()=>window.__TIM_BRIDGE.svtTrainingProgress());
  assert.deepEqual(after.attempts,before.attempts,'L’essai Parent ne doit pas écrire les copies de Tim');
  await page.locator('[data-nav="home"]').first().click();
  assert.equal(await page.locator('#home-content .svt-home-quick button').count(),2);
  await page.locator('#home-content .svt-home-quick button').first().click();
  assert.equal(await page.locator('#exercise-list .svt-exercise-lesson').count(),7);
  assert.equal(await page.locator('#exercise-list .svt-exercise-lesson .tile').count(),14);
  await page.locator('#exercise-list .svt-exercise-lesson .tile').first().click();
  await page.locator('#exercise-detail .tim-es-question-page').waitFor({timeout:20000});
  assert.match(await page.locator('#exercise-detail').innerText(),/Question 1 sur 10/);
  const link=await page.evaluate(()=>{
   window.TIM_PEDAGOGY_NAVIGATE('SVT','SVT_BIS07');
   const root=document.getElementById('matieres-content');
   return {subjectOpen:document.getElementById('matieres').classList.contains('active'),
    chapter:[...root.querySelectorAll('details.chapter-section[open]')].map(x=>x.querySelector('summary')?.textContent),
    courseCount:root.querySelectorAll('details.tim-es-lesson[open]').length};
  });
  assert.equal(link.subjectOpen,true);
  assert.equal(link.chapter.length,1);
  assert.match(link.chapter[0],/Phagocytose/);
  assert.equal(link.courseCount,1);
  assert.equal(blocked,0);
  console.log('SVT PRODUCTION OK : 11 séances ENT, 7 BIS, 14 quiz/140 questions, Parent 0 XP, Accueil, Exercices et retour Phagocytose.');
 }finally{await page.close();await browser.close();}
})().catch(err=>{console.error('ÉCHEC TEST SVT PRODUCTION : '+String(err?.stack||err).slice(0,3500));process.exitCode=1;});
