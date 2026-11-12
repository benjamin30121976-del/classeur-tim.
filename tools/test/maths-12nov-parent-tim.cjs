'use strict';
/* Audit math du 12 novembre : lecture seule, aucun envoi de réponse définitif.
   Vérifie les 3 exercices, leur affichage et l'essai Parent de 30 questions. */
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const USERS=[
 {role:'parent',email:process.env.TIM_PARENT_EMAIL,password:process.env.TIM_PARENT_PASSWORD,selector:'#parent-enter'},
 {role:'tim',email:process.env.TIM_STUDENT_EMAIL,password:process.env.TIM_STUDENT_PASSWORD,selector:'#tim-enter'}
];
const IDS=['MTH12_01','MTH12_02','MTH12_03'];
async function verify(browser,user){
 assert(user.email&&user.password,'Identifiants de test '+user.role+' absents');
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator(user.selector).click();
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill(user.password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&!!window.__TIM_BRIDGE, null,{timeout:45000});
  assert.equal(await page.evaluate(()=>Boolean(window.__TIM_PARENT)),user.role==='parent');
  const check=await page.evaluate(async ids=>{
   const pack=window.__TIM_DATA||{};
   const saved=ids.map(id=>pack.exercises?.find(x=>x.id===id));
   const visible=saved.filter(q=>q?.questions?.length===10).length;
   const leak=saved.some(q=>q?.questions?.some(x=>['right','why','expected','answer'].some(k=>Object.hasOwn(x,k))));
   const one=await window.__TIM_BRIDGE.mathNov12Task(ids[0]);
   return {visible,leak,questions:one.task?.questions?.length,complete:one.completed};
  },IDS);
  assert.equal(check.visible,3,'Trois exercices non présents sur le compte '+user.role);
  if(user.role==='tim')assert.equal(check.leak,false,'La fiche de Tim expose des corrigés');
  assert.equal(check.questions,10);
  if(user.role==='parent'){
   const {mathNov12ForParentImport}=await import('../../maths-12nov-training.mjs');
   for(const exercise of mathNov12ForParentImport().exercises){
    const answers=exercise.questions.map(q=>Number(q.right));
    const report=await page.evaluate(async ({id,answers})=>window.__TIM_BRIDGE.mathNov12Preview(id,answers),
     {id:exercise.id,answers});
    assert.equal(report.score,10);assert.equal(report.practice,true);assert.equal(report.saved,false);
    assert.equal(report.items?.length,10);
   }
   console.log('PASS Parent maths du 12 : 30 corrections testées (10/10 chaque), aucune note enregistrée.');
  }
  await page.evaluate(()=>document.getElementById('intro-skip')?.click());
  await page.locator('#intro-screen').waitFor({state:'hidden',timeout:15000});
  await page.evaluate(()=>window.TIM_PEDAGOGY_NAVIGATE('Mathématiques',''));
  const first=page.locator('#matieres-content [data-math-reciproque]').first();
  await first.waitFor({state:'visible',timeout:20000});
  await first.click();
  await page.locator('#matieres-content [data-math-nov12-ex="MTH12_01"]').click();
  const form=page.locator('#matieres-content #math12-quiz-form');
  await form.waitFor({state:'visible',timeout:20000});
  assert.equal(await form.locator('fieldset').count(),10);
  assert.equal(await form.locator('input[type=radio]').count(),40);
  console.log('PASS '+user.role+' maths 12 : fiche Thalès et QCM de dix questions affichés, aucune soumission.');
 }finally{await page.close();}
}
(async()=>{
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
 try{for(const user of USERS)await verify(browser,user);}
 finally{await browser.close();}
})().catch(e=>{console.error('ÉCHEC audit maths 12 novembre : '+String(e?.message||e).slice(0,1700));process.exitCode=1;});
