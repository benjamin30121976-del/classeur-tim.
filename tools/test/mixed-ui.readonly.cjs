'use strict';
/* Test navigateur isolé : ni identifiant, ni réseau, ni validation.
   Contrôle seulement l'écran pédagogique en mémoire. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const {mixedMission,publicMixedMission}=await import('../../worker/mixed-challenges.mjs');
 const exercise=publicMixedMission(mixedMission('DAY_20261116_01'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:850}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main><section id="exercise-index"></section><section id="exercise-detail"></section></main></body></html>');
  await page.addStyleTag({content:fs.readFileSync('assets/mixed-challenges.css','utf8')});
  await page.evaluate(()=>{window.__TIM_PARENT=false;window.__TIM_GUEST=false;window.__CLOUD_ATTEMPTS=[];window.__TIM_BRIDGE={submit:()=>{throw Error('Interdit en test lecture seule')}};});
  await page.addScriptTag({path:'mixed-challenges-ui.js'});
  await page.evaluate(q=>window.TIM_MIXED_UI.open(q,{}),exercise);
  assert.match(await page.locator('#exercise-detail').innerText(),/Ma méthode avant l’interrogation/);
  assert.equal(await page.locator('.mix-panel').count(),1);
  await page.getByRole('button',{name:/Commencer/}).click();
  let translations=0,diagrams=0,reason=0;
  for(let i=0;i<10;i++){
   const content=await page.locator('.mix-progress').innerText();
   assert.match(content,new RegExp('Question '+(i+1)+' / 10'));
   if(await page.locator('.mix-diagram svg').count())diagrams++;
   if(await page.locator('.mix-step-label').count())reason++;
   const translate=page.getByRole('button',{name:'Traduire en français'});
   if(await translate.count()){await translate.click();translations++;assert.equal(await page.locator('.mix-translation').isVisible(),true);}
   await page.getByRole('button',{name:i===9?'Relire ma copie':'Suivante →'}).click();
  }
  assert.ok(translations>=2,'La traduction doit être proposée pour chaque question espagnole');
  assert.equal(reason,2,'Deux vrais raisonnements pour 10 questions');
  assert.ok(diagrams>=1,'Un schéma sur une question scientifique ou géométrique');
  assert.match(await page.locator('#exercise-detail').innerText(),/Avant de rendre ma copie/);
  assert.equal(await page.getByRole('button',{name:'Valider définitivement mon défi'}).isDisabled(),true);
  assert.equal(await page.locator('.mix-review-item').count(),10);
  await page.getByRole('button',{name:/Question 4 ·/}).click();
  assert.match(await page.locator('.mix-progress').innerText(),/Question 4 \/ 10/);
  await page.evaluate(q=>{window.__TIM_PARENT=true;window.TIM_MIXED_UI.open(q,{})},exercise);
  assert.equal(await page.locator('.mix-panel').count(),1);
  assert.ok(await page.locator('input:disabled').count()>=1);
  assert.equal(errors.length,0,'Erreur JavaScript dans l’interface : '+errors.join(','));
  console.log('PASS : mobile 390 px, préparation, 10 questions, 2 raisonnements, traduction, relecture, retour question, aperçu parent, zéro validation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
