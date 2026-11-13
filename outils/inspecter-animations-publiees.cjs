'use strict';
// Vérification des animations réellement publiées sur Cloudflare dans Chromium.
// Lecture seule : aucun compte connecté, aucun exercice ni envoi Firebase.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=process.env.GITHUB_WORKSPACE||path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'browser-requests/inspection.json'),'utf8'));
const base=config.site;
const out=path.join(root,'browser-results','animations-publiees');
fs.mkdirSync(out,{recursive:true});

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  for(const mobile of [true,false]){
   const tag=mobile?'mobile':'bureau';
   const context=await browser.newContext({
    viewport:mobile?{width:390,height:844}:{width:1365,height:900},
    isMobile:mobile,hasTouch:mobile,locale:'fr-FR'
   });
   const page=await context.newPage();
   const result=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
   assert.ok(result&&result.status()<400,'Classeur Cloudflare indisponible');
   await page.waitForFunction(()=>typeof window.TIM_ANIMATIONS?.playOpening==='function',null,{timeout:20000});
   const links=await page.evaluate(()=>({
    splash:window.TIM_ANIMATIONS.url('opening'),
    gif:window.TIM_ANIMATIONS.url('plus2half'),
    script:[...document.scripts].some(s=>s.src.includes('tim-animations.js?v=revelation-xp-defis-20261113-v2'))
   }));
   assert.ok(links.script,'La version corrigée du lecteur n’est pas publiée');
   const [appResponse,mixedResponse,cssResponse]=await Promise.all([
     page.request.get(new URL('./app.js?v=revelation-xp-defis-20261113-v2',base).href,{timeout:30000}),
     page.request.get(new URL('./mixed-challenges-ui.js?v=revelation-xp-defis-20261113-v2',base).href,{timeout:30000}),
     page.request.get(new URL('./tim-animations.css?v=revelation-xp-defis-20261113-v2',base).href,{timeout:30000})
   ]);
   assert.ok(appResponse.ok()&&mixedResponse.ok()&&cssResponse.ok(),'Les nouveaux modules ne sont pas accessibles');
   const [appSource,mixedSource,cssSource]=await Promise.all([appResponse.text(),mixedResponse.text(),cssResponse.text()]);
   assert.ok(appSource.includes('replay-result-animation'),'Bouton de relecture XP absent du module principal en production');
   assert.ok(mixedSource.includes('replay-result-animation'),'Bouton de relecture XP absent des défis mélangés en production');
   assert.ok(cssSource.includes('.tim-anim-overlay{display:flex!important}'),'CSS de réduction des animations non publié');
   assert.ok(links.splash.includes('Tan_Tan_V6_Moins_Aigue.mp4'),'Ancienne entrée des exercices');
   assert.ok(links.gif.includes('Tim_Animation_2_5XP_Loup.gif'),'GIF +2,5 non raccordé');
   for(const [name,rel] of [['MP4',links.splash],['GIF',links.gif]]){
    const response=await page.request.get(new URL(rel,base).toString(),{timeout:30000});
    assert.equal(response.status(),200,name+' non publié sur Cloudflare');
    assert.ok((await response.body()).length>100000,name+' trop petit');
   }
   await page.evaluate(()=>{window.TIM_ANIMATIONS.playOpening();});
   await page.locator('.tim-anim-overlay video').waitFor({timeout:9000});
   await page.waitForFunction(()=>{const v=document.querySelector('.tim-anim-overlay video');return v&&v.readyState>=2;},null,{timeout:12000});
   await page.screenshot({path:path.join(out,tag+'-ouverture-cloudflare.png')});
   await page.getByRole('button',{name:'Passer l’animation'}).click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   await page.evaluate(()=>{window.TIM_ANIMATIONS.playResult({kind:'training'},{xp:2.5,score:8,total:10,correctionStatus:'released'});});
   await page.locator('.tim-anim-overlay img').waitFor();
   await page.waitForFunction(()=>{const i=document.querySelector('.tim-anim-overlay img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:12000});
   await page.screenshot({path:path.join(out,tag+'-loup-2-5-cloudflare.png')});
   await page.locator('.tim-anim-award:not([hidden])').waitFor({timeout:10000});
   assert.equal((await page.locator('.tim-anim-award-value').innerText()).trim(),'+2,5 XP');
   await page.screenshot({path:path.join(out,tag+'-revelation-2-5-cloudflare.png')});
   await page.getByRole('button',{name:'Voir ma correction'}).click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   console.log('OK Cloudflare '+tag+': MP4, GIF +2,5, retour correction, lecture seule.');
   await context.close();
  }
  // Test réel du rendu CSS sur un Android configuré pour réduire les animations.
  const reduced=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',locale:'fr-FR'});
  try{
    const page=await reduced.newPage();
    const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
    assert.ok(response?.ok(),'Site indisponible en mode mouvement réduit');
    await page.waitForFunction(()=>typeof window.TIM_ANIMATIONS?.playResult==='function',null,{timeout:20000});
    await page.evaluate(()=>{window.TIM_ANIMATIONS.playResult({kind:'daily'},{xp:2,score:8,total:10,correctionStatus:'released',correctionLocked:false});});
    assert.ok(await page.locator('.tim-anim-award-value').getByText('+2 XP',{exact:true}).isVisible(),'XP masqués sur Android en mode mouvement réduit');
    await page.screenshot({path:path.join(out,'android-mouvement-reduit-cloudflare.png')});
    await page.getByRole('button',{name:'Voir ma correction'}).click();
    console.log('OK Cloudflare Android : +2 XP reste visible en mode mouvement réduit.');
  }finally{await reduced.close();}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
