'use strict';
/* Contrôle de la sixième matière sur la production Cloudflare en lecture
   seule avec compte Parent : aucune écriture Tim, aucune tentative ni XP. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
(async()=>{
 assert(process.env.TIM_PARENT_EMAIL&&process.env.TIM_PARENT_PASSWORD,'Identifiants Parent absents des secrets CI');
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
 let blocked=0;
 try{
  await page.route('**/api/tim',async route=>{
   let body={};try{body=route.request().postDataJSON()}catch{}
   if(/^(submit|release|import|delete|reset|set)/i.test(body.action||'')){
    blocked++;await route.abort('blockedbyclient');return;
   }
   await route.continue();
  });
  await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
  await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
  await page.locator('#login-button').click();
  const clientErrors=[];
  page.on('pageerror',e=>clientErrors.push('JS: '+String(e?.message||e).slice(0,350)));
  page.on('console',msg=>{if(msg.type()==='error')clientErrors.push('console: '+msg.text().slice(0,350));});
  try{
   await page.waitForFunction(()=>document.body.classList.contains('ready')&&
    Boolean(window.__TIM_BRIDGE?.frTrainingTask)&&Boolean(window.TIM_FR_PACK),null,{timeout:60000});
  }catch(e){
   const diagnostics=await page.evaluate(()=>({
    title:document.title,path:location.href,bodyClass:document.body.className,
    loginVisible:document.getElementById('login-screen')?.className,
    frPack:!!window.TIM_FR_PACK,
    frPath:!!window.TIM_FR_PATH,
    frTraining:!!window.TIM_FR_TRAINING,
    bridge:!!window.__TIM_BRIDGE,
    bridgeFr:typeof window.__TIM_BRIDGE?.frTrainingTask,
    scripts:[...document.scripts].filter(s=>/boot\.js|francais|app\.js/.test(s.src)).map(s=>s.src),
    pageText:document.body.innerText.slice(0,300)
   }));
   throw new Error('Client français non prêt : '+JSON.stringify(diagnostics)+' / '+clientErrors.slice(0,8).join(' ; ')+' / '+e.message);
  }
  await page.locator('#intro-screen').waitFor({state:'visible',timeout:9000}).catch(()=>{});
  if(await page.locator('#intro-screen').isVisible()){
   await page.locator('#intro-skip').click({timeout:9000});
   await page.locator('#intro-screen').waitFor({state:'hidden',timeout:10000});
  }
  const before=await page.evaluate(()=>window.__TIM_BRIDGE.frTrainingProgress());
  const results=await page.evaluate(async()=>{
   const pack=window.TIM_FR_PACK,bridge=window.__TIM_BRIDGE;
   if(!pack||!window.TIM_FR_PATH||!window.TIM_FR_TRAINING?.mount)
    throw Error('Le pack FR ou les modules du parcours sont absents.');
   const ids=Array.from({length:11},(_,i)=>[1,2].map(n=>'FRQ_L'+String(i+1).padStart(2,'0')+'_0'+n)).flat();
   let leaked=false,preview=null,total=0;
   for(const id of ids){
    const response=await bridge.frTrainingTask(id),task=response?.task;
    if(!task||task.questions?.length!==10)throw Error('Questionnaire incomplet : '+id);
    leaked=leaked||task.questions.some(q=>['right','expected','explanation','accepted'].some(k=>Object.hasOwn(q,k)));
    total+=task.questions.length;
    if(id==='FRQ_L07_01'){
     const answers=task.questions.map(q=>q.kind==='qcm'?0:'réponse fausse');
     preview=await bridge.frTrainingPreviewSubmit(id,answers,task.bankVersion);
    }
   }
   return {lessons:pack.lessons.length,bis:pack.bis.length,homework:pack.homework.length,attached:pack.attachments.length,
    originalLessons:pack.lessons.filter(x=>x.originalText).length,originalHomework:pack.homework.filter(x=>x.originalText).length,
    ids:ids.length,total,leaked,preview};
  });
  assert.deepEqual([results.lessons,results.bis,results.homework,results.attached,results.ids,results.total],
   [27,11,15,14,22,220]);
  assert.equal(results.originalLessons,0); // Les cours ENT sont résumés, jamais inventés en texte intégral.
  assert.equal(results.leaked,false);
  assert.equal(results.preview.practice,true);
  assert.equal(results.preview.saved,false);
  assert.equal(results.preview.xp,0);
  assert.equal(results.preview.items.length,10);
  assert.ok(results.preview.items.every(x=>x.explanation?.length>16));
  const after=await page.evaluate(()=>window.__TIM_BRIDGE.frTrainingProgress());
  assert.deepEqual(after.attempts,before.attempts,'L’essai Parent a modifié une copie Tim');
  await page.locator('[data-nav="home"]').first().click();
  assert.equal(await page.locator('#home-content .fr-home-quick button').count(),2);
  await page.locator('#home-content .fr-home-quick button').first().click();
  assert.equal(await page.locator('#exercise-list .fr-exercise-lesson').count(),11);
  assert.equal(await page.locator('#exercise-list .fr-exercise-lesson .tile').count(),22);
  const docGroups=await page.locator('#exercise-list .fr-document-row').count();
  assert.equal(docGroups,8,'Les 14 PDF originaux doivent être listés par cours ou devoir.');

  await page.locator('#exercise-list .fr-exercise-lesson .tile').first().click();
  await page.locator('#exercise-detail .tim-es-question-page').waitFor({timeout:20000});
  assert.match(await page.locator('#exercise-detail').innerText(),/Question 1 sur 10/);
  const link=await page.evaluate(()=>{
   window.TIM_PEDAGOGY_NAVIGATE('Français','FR_BIS07');
   const root=document.getElementById('matieres-content'),groups=[...root.querySelectorAll('details.chapter-section[open]')];
   return {active:document.getElementById('matieres').classList.contains('active'),
    chapter:groups[0]?.querySelector('summary')?.textContent||'',groupCount:groups.length,
    lessonCount:root.querySelectorAll('details.tim-es-lesson[open]').length,
    dates:[...root.querySelectorAll('details.tim-es-lesson > summary')].map(x=>x.textContent)};
  });
  assert.equal(link.active,true);
  assert.match(link.chapter,/Accord du participe passé/);
  assert.equal(link.groupCount,1);
  assert.equal(link.lessonCount,1);
  assert.ok(link.dates.some(x=>/09\/11\/2026/.test(x)));
  assert.equal(blocked,0);
  console.log('FRANCAIS PRODUCTION OK : 27 séances ENT, 11 BIS, 15 devoirs, 22 quiz/220 questions, Parent 0 XP, Accueil, Exercices, renvoi institutions européennes.');
 }finally{await page.close();await browser.close();}
})().catch(e=>{console.error('ÉCHEC FR PRODUCTION : '+String(e?.stack||e).slice(0,3800));process.exitCode=1;});
