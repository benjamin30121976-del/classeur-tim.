'use strict';
/* Test strictement en lecture seule : aucune tentative Tim ni note modifiée. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const email=process.env.TIM_STUDENT_EMAIL||'';
const password=process.env.TIM_STUDENT_PASSWORD||'';
const url=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
(async()=>{
 assert(email&&password,'Connexion de test Tim absente');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#tim-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===false&&window.__TIM_BRIDGE, null,{timeout:45000});
  const result=await page.evaluate(async()=>{
   const ids=['ESE_L14_01','ESE_L14_02','ESE_L14_03'];
   const exercises=window.__TIM_DATA?.exercises||[];
   const docs=ids.map(id=>exercises.find(e=>e.id===id));
   const keyLeaked=docs.some(ex=>ex?.questions?.some(q=>['right','why','also','expected'].some(k=>Object.prototype.hasOwnProperty.call(q,k))));
   const task=await window.__TIM_BRIDGE.spanishEntTrainingTask('ESE_L14_01');
   let progress;
   try{const s=await window.__TIM_BRIDGE.spanishEntTrainingProgress();progress={ok:Array.isArray(s?.attempts),count:s?.attempts?.length||0};}
   catch(e){progress={ok:false,error:String(e?.code||e?.message||e).slice(0,100)};}
   return {count:docs.filter(x=>x?.questions?.length===10).length,keyLeaked,
    questionCount:task?.task?.questions?.length||0,completed:task?.completed===true,progress};
  });
  assert.equal(result.count,3,'Trois exercices manquants chez Tim');
  assert.equal(result.keyLeaked,false,'Corrigés exposés dans les questions de Tim');
  assert.equal(result.questionCount,10,'Questions non accessibles chez Tim');
  console.log('PASS Tim lecture seule : 3 exercices, questions sans corrigés. Suivi : '+JSON.stringify(result.progress));
 }finally{await browser.close();}
})().catch(e=>{console.error('ÉCHEC lecture Tim : '+String(e?.message||e).slice(0,400));process.exitCode=1;});
