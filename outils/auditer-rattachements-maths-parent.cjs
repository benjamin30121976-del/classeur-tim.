'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const email=process.env.TIM_PARENT_EMAIL,password=process.env.TIM_PARENT_PASSWORD;
const dates=['2026-09-17','2026-09-21','2026-10-01','2026-10-02','2026-10-09','2026-10-15','2026-11-02','2026-11-05'];
(async()=>{
 assert(email&&password,'Identifiants Parent absents');
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,null,{timeout:45000});
  const intro=page.locator('#intro-screen');
  if(await intro.isVisible()){
   await page.locator('#intro-skip').click({timeout:7000});
   await intro.waitFor({state:'hidden',timeout:15000});
  }
  await page.addScriptTag({content:fs.readFileSync('maths-pdf-bulk-import.js','utf8')});
  const result=await page.evaluate(async dates=>{
   const list=window.__TIM_DATA?.lessons||[],api=window.__TIM_BRIDGE?.attachments;
   const datesReport=[];
   for(const date of dates){
    try{
     const match=window.TIM_MATH_PDF_BULK_IMPORT.matchCourse(date);
     const existing=await api.list('lesson',match.id);
     datesReport.push({date,found:true,existsInMaths:match.subject==='Mathématiques',
      documents:existing.filter(x=>/\.pdf$/i.test(x.fileName||'')).length});
    }catch(e){datesReport.push({date,found:false,error:String(e?.message||e).slice(0,100)});}
   }
   return {total:datesReport.length,registeredMaths:list.filter(x=>x.subject==='Mathématiques'&&/^M26S/.test(x.id||'')).length,
    datesReport};
  },dates);
  const catalogue=await page.evaluate(()=>(window.__TIM_DATA?.lessons||[]).filter(l=>l.subject==='Mathématiques'&&l.kind!=='bis'&&l.category!=='bis').map(l=>({id:l.id,date:l.date,kind:l.kind,category:l.category})).slice(0,25));
  console.log('Identifiants des cours de mathématiques (sans contenu ni réponses) : '+JSON.stringify(catalogue));
  for(const x of result.datesReport)console.log(x.date+': '+(x.found?'cours et stockage Firebase identifiés ; PDF présents='+x.documents:'non trouvé')+
    (x.error?'; '+x.error:''));
  assert(result.datesReport.every(x=>x.found&&x.existsInMaths),'Une ou plusieurs séances ENT ne peuvent pas recevoir leurs PDF');
  console.log('PASS : '+dates.length+' dates ENT correspondent à des cours existants ; aucun fichier modifié.');
 }finally{await browser.close();}
})().catch(e=>{console.error('ÉCHEC correspondance PDF : '+e.message);process.exitCode=1;});