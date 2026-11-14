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
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&
   Boolean(window.__TIM_BRIDGE?.hgTrainingTask)&&Boolean(window.TIM_HG_PACK),null,{timeout:60000});
  await page.locator('#intro-screen').waitFor({state:'visible',timeout:9000}).catch(()=>{});
  if(await page.locator('#intro-screen').isVisible()){
   await page.locator('#intro-skip').click({timeout:9000});
   await page.locator('#intro-screen').waitFor({state:'hidden',timeout:10000});
  }
  /* Diagnostic Parent sans écriture : seuls deux statuts HTTP sont affichés.
     Aucun jeton, mot de passe, résultat d'élève ou contenu Firestore n'est journalisé. */
  const diag=await page.evaluate(async()=>{
   try{
    const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
    const {getAuth}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js');
    const user=getAuth(getApp()).currentUser;
    if(!user)return {requestHttpStatus:0,error:'parent-non-authentifie'};
    const token=await user.getIdToken();
    const response=await fetch('/api/tim',{method:'POST',cache:'no-store',
     headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
     body:JSON.stringify({action:'getFirestoreReadDiagnostics',payload:{}})});
    const json=await response.json().catch(()=>({}));
    const extra={};
    for(const key of ['documentGoogleStatus','collectionGoogleStatus','documentGoogleReason',
     'collectionGoogleReason','documentRetryAfterSeconds','collectionRetryAfterSeconds']){
     if(json?.data&&Object.hasOwn(json.data,key))extra[key]=json.data[key];
    }
    return {requestHttpStatus:response.status,documentHttpStatus:json?.data?.documentHttpStatus??null,
     collectionHttpStatus:json?.data?.collectionHttpStatus??null,error:String(json?.error||''),...extra};
   }catch{return {requestHttpStatus:0,error:'diagnostic-indisponible'};}
  });
  console.log('DIAGNOSTIC_FIRESTORE_HTTP_STATUTS_SEULEMENT '+JSON.stringify(diag));
  /* Même si Google limite Firestore (429), le Parent peut consulter
     les questions et corriger un essai SANS enregistrement ni XP. */
  const practice=await page.evaluate(async()=>{
   const bridge=window.__TIM_BRIDGE;
   const results=[];
   for(const [id,taskMethod,previewMethod] of [
    ['HGQ_L09_01','hgTrainingTask','hgTrainingPreviewSubmit'],
    ['SVQ_L07_01','svtTrainingTask','svtTrainingPreviewSubmit']
   ]){
    try{
     const result=await bridge[taskMethod](id),task=result?.task;
     const answers=(task?.questions||[]).map(q=>q.kind==='qcm'?0:'réponse de vérification');
     const corrected=await bridge[previewMethod](id,answers,task.bankVersion);
     results.push({id,questions:task.questions.length,practice:corrected.practice,
      saved:corrected.saved,xp:corrected.xp,corrections:corrected.items?.length||0});
    }catch(e){results.push({id,error:String(e?.message||e).slice(0,120)});}
   }
   return results;
  });
  console.log('SIMULATIONS_PARENT_SANS_ECRITURE '+JSON.stringify(practice));
  for(const result of practice){
   assert.equal(result.questions,10,'Questionnaire Parent indisponible : '+result.id);
   assert.equal(result.practice,true);
   assert.equal(result.saved,false);
   assert.equal(result.xp,0);
   assert.equal(result.corrections,10);
  }
  const before=await page.evaluate(()=>window.__TIM_BRIDGE.hgTrainingProgress());
  const results=await page.evaluate(async()=>{
   const pack=window.TIM_HG_PACK,bridge=window.__TIM_BRIDGE;
   if(!pack||!window.TIM_HG_PATH||!window.TIM_HG_TRAINING?.mount)
    throw Error('Le pack HG ou les modules du parcours sont absents.');
   const ids=Array.from({length:9},(_,i)=>[1,2].map(n=>'HGQ_L0'+(i+1)+'_0'+n)).flat();
   let leaked=false,preview=null,total=0;
   for(const id of ids){
    const response=await bridge.hgTrainingTask(id),task=response?.task;
    if(!task||task.questions?.length!==10)throw Error('Questionnaire incomplet : '+id);
    leaked=leaked||task.questions.some(q=>['right','expected','explanation','accepted'].some(k=>Object.hasOwn(q,k)));
    total+=task.questions.length;
    if(id==='HGQ_L08_01'){
     const answers=task.questions.map(q=>q.kind==='qcm'?0:'réponse fausse');
     preview=await bridge.hgTrainingPreviewSubmit(id,answers,task.bankVersion);
    }
   }
   return {lessons:pack.lessons.length,bis:pack.bis.length,homework:pack.homework.length,attached:pack.attachments.length,
    originalLessons:pack.lessons.filter(x=>x.originalText).length,originalHomework:pack.homework.filter(x=>x.originalText).length,
    ids:ids.length,total,leaked,preview};
  });
  assert.deepEqual([results.lessons,results.bis,results.homework,results.attached,results.ids,results.total],
   [25,9,15,1,18,180]);
  assert.ok(results.originalLessons>=3&&results.originalHomework>=4);
  assert.equal(results.leaked,false);
  assert.equal(results.preview.practice,true);
  assert.equal(results.preview.saved,false);
  assert.equal(results.preview.xp,0);
  assert.equal(results.preview.items.length,10);
  assert.ok(results.preview.items.every(x=>x.explanation?.length>16));
  const after=await page.evaluate(()=>window.__TIM_BRIDGE.hgTrainingProgress());
  assert.deepEqual(after.attempts,before.attempts,'L’essai Parent a modifié une copie Tim');
  await page.locator('[data-nav="home"]').first().click();
  assert.equal(await page.locator('#home-content .hg-home-quick button').count(),2);
  await page.locator('#home-content .hg-home-quick button').first().click();
  assert.equal(await page.locator('#exercise-list .hg-exercise-lesson').count(),9);
  assert.equal(await page.locator('#exercise-list .hg-exercise-lesson .tile').count(),18);
  await page.locator('#exercise-list .hg-exercise-lesson .tile').first().click();
  await page.locator('#exercise-detail .tim-es-question-page').waitFor({timeout:20000});
  assert.match(await page.locator('#exercise-detail').innerText(),/Question 1 sur 10/);
  const link=await page.evaluate(()=>{
   window.TIM_PEDAGOGY_NAVIGATE('Histoire-géographie','HG_BIS08');
   const root=document.getElementById('matieres-content'),groups=[...root.querySelectorAll('details.chapter-section[open]')];
   return {active:document.getElementById('matieres').classList.contains('active'),
    chapter:groups[0]?.querySelector('summary')?.textContent||'',groupCount:groups.length,
    lessonCount:root.querySelectorAll('details.tim-es-lesson[open]').length,
    dates:[...root.querySelectorAll('details.tim-es-lesson > summary')].map(x=>x.textContent)};
  });
  assert.equal(link.active,true);
  assert.match(link.chapter,/Institutions européennes/);
  assert.equal(link.groupCount,1);
  assert.equal(link.lessonCount,1);
  assert.ok(link.dates.some(x=>/12\/11\/2026/.test(x)));
  assert.equal(blocked,0);
  console.log('HISTOIRE-GEOGRAPHIE PRODUCTION OK : 25 séances ENT, 9 BIS, 15 devoirs, 18 quiz/180 questions, Parent 0 XP, Accueil, Exercices, renvoi institutions européennes.');
 }finally{await page.close();await browser.close();}
})().catch(e=>{console.error('ÉCHEC HG PRODUCTION : '+String(e?.stack||e).slice(0,3800));process.exitCode=1;});
