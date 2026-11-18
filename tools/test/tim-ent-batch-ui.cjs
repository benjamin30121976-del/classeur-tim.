'use strict';
const assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const folder=path.join(process.cwd(),'browser-fixture-ent-batch');fs.mkdirSync(folder,{recursive:true});
 try{
  for(const device of [{id:'pc',width:1280,height:760},{id:'telephone',width:390,height:844}]){
   const context=await browser.newContext({viewport:{width:device.width,height:device.height},
    isMobile:device.id==='telephone',hasTouch:device.id==='telephone',locale:'fr-FR'});
   const page=await context.newPage();
   await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main id="parent-root"></main></body></html>');
   await page.evaluate(()=>{window.__TIM_PARENT=true;window.__TIM_GUEST=false;});
   await page.addScriptTag({path:path.join(process.cwd(),'tim-ent-batch-import.js')});
   await page.evaluate(()=>document.getElementById('parent-root').append(window.TIM_ENT_BATCH.render()));
   assert.equal(await page.locator('#tim-ent-batch-import input[type=file]').count(),1);
   assert.equal(await page.locator('#tim-ent-batch-import button').isDisabled(),true);
   assert.match(await page.locator('#tim-ent-batch-import').innerText(),/documents.*leçons|PDF.*leçons/i);
   await page.screenshot({path:path.join(folder,'lot-ent-parent-'+device.id+'.png'),fullPage:true});
   // Le compte Tim ne reçoit jamais de commande de publication.
   await page.evaluate(()=>{
    window.__TIM_PARENT=false;
    document.getElementById('parent-root').replaceChildren(window.TIM_ENT_BATCH.render());
   });
   assert.equal(await page.locator('#tim-ent-batch-import button').count(),0);
   await context.close();
  }
  console.log('OK : import disponible uniquement au Parent, aperçu PC/téléphone, aucune écriture.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
