'use strict';
/* Lecture seule des comptes Parent et Tim : aucune réponse, note ni XP soumis. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const base=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const users=[
 {role:'Parent',email:process.env.TIM_PARENT_EMAIL,password:process.env.TIM_PARENT_PASSWORD,entry:'#parent-enter'},
 {role:'Tim',email:process.env.TIM_STUDENT_EMAIL,password:process.env.TIM_STUDENT_PASSWORD,entry:'#tim-enter'}
];
async function check(browser,user){
 assert(user.email&&user.password,'Identifiants du test indisponibles pour '+user.role);
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
 try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator(user.entry).click();
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill(user.password);
  await page.locator('#login-button').click();
  try{
   await page.waitForFunction(()=>document.body.classList.contains('ready')&&Boolean(window.__TIM_DATA),null,{timeout:60000});
  }catch(error){
   const diagnostics=await page.evaluate(()=>({
    message:document.getElementById('access-status')?.textContent?.slice(0,230)||'',
    ready:document.body.classList.contains('ready'),
    activeUser:Boolean(window.__TIM_DATA),
    accessHidden:document.getElementById('access')?.hidden,
    bodyClass:document.body.className.slice(0,100)
   }));
   throw Error('Compte '+user.role+' pas prêt : '+JSON.stringify(diagnostics));
  }
  await page.waitForFunction(()=>Boolean(window.__TIM_CHALLENGES)&&Boolean(document.querySelector('.daily-loup-panel')),null,{timeout:25000});
  const report=await page.evaluate(()=>{
   const meta=window.__TIM_CHALLENGES||{},ids=meta.dailyIds||[];
   const exercises=ids.map(id=>window.__TIM_DATA?.exercises?.find(e=>e.id===id));
   return {day:meta.today,status:meta.dailyBankStatus,ids,
    questions:exercises.map(x=>x?.questions?.length??0),
    subjects:exercises.map(x=>[...new Set((x?.questions||[]).map(q=>q.subject))].sort()),
    banks:exercises.map(x=>x?.questionBank||''),
    leak:exercises.some(x=>x?.questions?.some(q=>['right','why','answer','parts'].some(key=>Object.hasOwn(q,key)))),
    buttons:document.querySelectorAll('.daily-loup-launch').length,
    summary:document.querySelector('.daily-loup-summary')?.innerText||''};
  });
  if(report.day==='2026-11-13'){
   assert.deepEqual(report.ids,['DAY_20261113_04','DAY_20261113_05','DAY_20261113_06'],'Les anciens identifiants du vendredi ne doivent pas être remplacés.');
   assert.deepEqual(report.questions,[10,10,10]);
   assert.deepEqual(report.banks,Array(3).fill('mixed-202611-v1'));
   assert.equal(report.status,'three-subjects');
   assert.equal(report.buttons,3);
   for(const subjects of report.subjects)assert.deepEqual(subjects,['Espagnol','Mathématiques','Physique-chimie']);
   if(user.role==='Tim')assert.equal(report.leak,false,'Aucune correction ne doit être présente dans les questions du compte Tim.');
   assert.match(report.summary,/physique-chimie/i);
   console.log('CONFIRMÉ '+user.role+' : 13 novembre, trois missions mixtes affichées, 30 questions, aucun enregistrement.');
  }else console.log('Le test du vendredi 13 ne s’applique plus au jour '+report.day+' ; aucun exercice soumis.');
 }finally{await page.close();}
}
(async()=>{
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{})});
 try{for(const user of users)await check(browser,user);}
 finally{await browser.close();}
})().catch(error=>{console.error('ÉCHEC contrôle des missions quotidiennes : '+String(error?.message||error).slice(0,1400));process.exitCode=1;});