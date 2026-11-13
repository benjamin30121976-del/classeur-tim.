'use strict';
/* Anglais 3e — vérification en lecture seule de la production privée.
   Aucune écriture de note, tentative ou XP ; essai Parent uniquement. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const email=process.env.TIM_PARENT_EMAIL,password=process.env.TIM_PARENT_PASSWORD;
(async()=>{
 assert(email&&password,'Identifiants du compte Parent absents dans les secrets CI.');
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
 try{
  await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&Boolean(window.__TIM_DATA)&&Boolean(window.__TIM_BRIDGE?.englishTrainingTask),null,{timeout:60000});
  const report=await page.evaluate(async()=>{
   const pack=window.TIM_ANGLAIS_PACK,bridge=window.__TIM_BRIDGE;
   if(!pack||!bridge?.attachments||!bridge?.englishTrainingPreviewSubmit)throw Error('Anglais ou connexion privée non chargé.');
   const courses=pack.lessons.filter(x=>x.id.startsWith('EN_ENT_'));
   const bis=pack.bis||[],docs=pack.attachments||[],homework=pack.homework||[];
   const missing=[];
   for(const target of [...new Set(docs.map(x=>x.target))]){
    const found=await bridge.attachments.list('lesson',target);
    for(const wanted of docs.filter(x=>x.target===target)){
     if(!found.some(x=>x.fileName===wanted.name))missing.push(wanted.name);
    }
   }
   const before=await bridge.englishTrainingProgress();
   const taskData=await bridge.englishTrainingTask('ENQ_L07_01');
   const task=taskData?.task;
   if(!task||task.questions?.length!==10)throw Error('L’exercice du prétérit BE-ING n’est pas disponible.');
   const leaked=task.questions.some(q=>['right','expected','explanation','accepted'].some(k=>Object.hasOwn(q,k)));
   const answers=task.questions.map(q=>q.kind==='qcm'?0:'réponse volontairement incorrecte');
   const preview=await bridge.englishTrainingPreviewSubmit(task.id,answers,task.bankVersion);
   const after=await bridge.englishTrainingProgress();
   return {courses:courses.length,bis:bis.length,attachments:docs.length,missing,homework:homework.length,
    questions:task.questions.length,leaked,practice:preview.practice,saved:preview.saved,
    xp:preview.xp,score:preview.score,items:preview.items?.length,
    hasExplanations:preview.items?.every(i=>typeof i.explanation==='string'&&i.explanation.length>8),
    before:JSON.stringify(before?.attempts||[]),after:JSON.stringify(after?.attempts||[])};
  });
  assert.equal(report.courses,22);
  assert.equal(report.bis,7);
  assert.equal(report.attachments,9);
  assert.deepEqual(report.missing,[]);
  assert.equal(report.homework,17);
  assert.equal(report.questions,10);
  assert.equal(report.leaked,false);
  assert.equal(report.practice,true);
  assert.equal(report.saved,false);
  assert.equal(report.xp,0);
  assert.equal(report.items,10);
  assert.equal(report.hasExplanations,true);
  assert.equal(report.before,report.after,'Un essai Parent ne doit pas créer de copie Tim.');
  console.log('ANGLAIS PRODUCTION OK : 22 cours ENT, 7 BIS, 17 devoirs, 9 documents privés, 10 réponses corrigées sans enregistrer de note/XP.');
 }finally{await page.close();await browser.close();}
})().catch(e=>{console.error('ÉCHEC CONTRÔLE ANGLAIS : '+String(e?.message||e));process.exitCode=1;});
