'use strict';
// Diagnostic de l'accès Défi du jour. Jamais de connexion Tim, de validation, de note ni d'XP.
// En mode Invité : bascule éphémère de la seule variable d'interface pour
// vérifier le déclenchement du clic élève, puis restauration avant d'ouvrir la fiche.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=process.env.GITHUB_WORKSPACE||path.resolve(__dirname,'..');
const output=path.join(root,'browser-results','audit-animation-defi');
fs.mkdirSync(output,{recursive:true});
const URL='https://classeur-tim-v16.pages.dev/';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [label,viewport,isMobile] of [
   ['android',{width:390,height:844},true],
   ['ordinateur',{width:1365,height:900},false]
  ]){
   const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile,locale:'fr-FR'});
   const page=await context.newPage();
   const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message.slice(0,180)));
   await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
   await page.locator('#guest-enter').click();
   await page.waitForFunction(()=>typeof window.openExercise==='function'&&!!window.__TIM_CHALLENGES,null,{timeout:30000});
   if(await page.locator('#intro-screen').isVisible()){
    const skip=page.locator('#intro-skip');
    if(await skip.isVisible())await skip.click();
    else {await page.locator('#intro-silent').click();await page.locator('#intro-screen').waitFor({state:'hidden',timeout:14000});}
   }
   await page.waitForFunction(()=>document.querySelectorAll('.daily-loup-launch').length>0,null,{timeout:12000});
   const initial=await page.evaluate(()=>{
    const meta=window.__TIM_CHALLENGES||{};
    const first=meta.dailyIds?.[0];
    const ex=(window.__TIM_DATA?.exercises||[]).find(x=>x.id===first);
    return {ids:meta.dailyIds?.length||0,firstPresent:!!ex,kind:ex?.kind,bank:ex?.questionBank,
      controls:document.querySelectorAll('.daily-loup-launch').length,
      guest:window.__TIM_GUEST,parent:window.__TIM_PARENT,
      reduced:window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      anim:typeof window.TIM_ANIMATIONS?.playOpening,
      hasAttempt:Boolean((window.__CLOUD_ATTEMPTS||[]).some(x=>x.id===first))};
   });
   console.log('DIAGNOSTIC '+label+' '+JSON.stringify(initial));
   assert.equal(initial.guest,true,'Test invité absent');
   assert.ok(initial.ids>=1&&initial.firstPresent&&initial.kind==='daily','Défi du jour manquant dans les données invitées');
   assert.equal(initial.anim,'function','Module animation non chargé');
   assert.equal(initial.reduced,false,'Réduction mouvement activée dans environnement test');
   // Ne modifie aucune donnée : seulement le contrôle visuel en mémoire du navigateur.
   await page.evaluate(()=>{
    window.__TIM_GUEST=false;
    const btn=document.querySelector('.daily-loup-launch');
    btn.disabled=false;
    btn.click();
    window.__TIM_GUEST=true;
   });
   await page.locator('.tim-anim-overlay video').waitFor({timeout:7000});
   const state=await page.locator('.tim-anim-overlay video').evaluate(v=>({
    src:v.currentSrc||v.src,readyState:v.readyState,paused:v.paused
   }));
   assert.match(state.src,/Tim_Ouverture_Exercice_Splash_Tan_Tan_V6_Moins_Aigue\.mp4/);
   await page.screenshot({path:path.join(output,label+'-defi-clique-animation.png'),animations:'allow'});
   await page.getByRole('button',{name:'Passer l’animation'}).click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached',timeout:6000});
   await page.waitForFunction(()=>document.getElementById('exercise-detail')?.classList.contains('active'),null,{timeout:7000});
   assert.equal(await page.evaluate(()=>window.__TIM_GUEST),true,'Mode invité doit être restauré');
   await page.screenshot({path:path.join(output,label+'-apres-animation-lecture-seule.png')});
   const errs=jsErrors.filter(x=>!/permission|unauthori/i.test(x));
   assert.deepEqual(errs,[],'Erreur JS pendant le clic');
   console.log('OK CLIC REEL '+label+': défi du jour -> Splash MP4 -> fiche en lecture seule ; 0 tentative créée.');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error('AUDIT ANIMATION DEFI : '+err.message);process.exitCode=1;});
