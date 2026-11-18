'use strict';
/* Contrôle lecture seule Chromium du code réellement publié et du catalogue Parent.
 * Jamais de tentative, de calcul de note ou d'écriture de XP. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  const site='https://classeur-tim-v16.pages.dev/';
  let deployed=false,last='';
  for(let i=0;i<9;i++){
   await page.goto(site+'?verify-xp-bonus='+i,{waitUntil:'domcontentloaded',timeout:45000});
   const v=await page.evaluate(async()=>{
    const [app,status]=await Promise.all([
     fetch('./app.js?xp-check='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.text():''),
     fetch('./api/status',{cache:'no-store'}).then(r=>r.ok?r.json():null)
    ]);
    return {appHasCorrectBanner:app.includes('9–10/10 : +1 XP')&&app.includes('Autres paliers non confirmés'),
      appWithoutBadCap:!app.includes('Plafond quotidien +3 XP.'),
      cloudflareAvailable:status?.platform==='cloudflare-pages'&&status?.available===true};
   });
   last=JSON.stringify(v);
   if(v.appHasCorrectBanner&&v.appWithoutBadCap&&v.cloudflareAvailable){deployed=true;break;}
   await new Promise(resolve=>setTimeout(resolve,4500));
  }
  assert(deployed,'L’interface Cloudflare ne reflète pas le nouveau barème : '+last);
  console.log('CONFIRMÉ SUR LE SITE : barème Bonus devoirs 9–10/10 = +1, pas d’ancienne limite +3/jour, API Cloudflare disponible.');
  const email=process.env.TIM_PARENT_EMAIL,pass=process.env.TIM_PARENT_PASSWORD;
  assert(email&&pass,'Accès Parent indisponible.');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(pass);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&window.__TIM_DATA?.exercises?.some(x=>x.id==='BD1811_PC02'),null,{timeout:60000});
  const readOnly=await page.evaluate(()=>{
   const ids=['BD1811_PC01','BD1811_PC02'];
   const found=ids.map(id=>window.__TIM_DATA.exercises.find(x=>x.id===id)).filter(Boolean);
   return {found:found.length,allBonus:found.every(e=>e.homeworkBonus===true),
     parent:window.__TIM_PARENT===true};
  });
  assert.deepEqual(readOnly,{found:2,allBonus:true,parent:true});
  console.log('CONFIRMÉ PAR CHROMIUM PARENT : les 2 bonus physique sont présents, sans aucune soumission ni modification des résultats.');
 }finally{await browser.close();}
})().catch(e=>{console.error('CONTRÔLE SITE INCOMPLET : '+String(e.message||e).slice(0,500));process.exitCode=1;});
