'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

(async()=>{
 const {TESTABLE}=await import('../../worker/server.mjs');
 const {mixedMission,publicMixedMission}=await import('../../worker/mixed-challenges.mjs');
 const {PARENT_UID}=await import('../../worker/auth.mjs');
 const mission=mixedMission('DAY_20261113_04'),publicTask=publicMixedMission(mission);
 const forbid=new Proxy({},{get:(_,field)=>()=>{throw Error('Écriture ou lecture de données interdites pendant test : '+String(field));}});
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{args:['--no-sandbox']})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:850},locale:'fr-FR'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let parentCalls=0,timSubmissions=0;
  await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main><section id="exercise-index"></section><section id="exercise-detail"></section></main></body></html>');
  await page.addStyleTag({content:fs.readFileSync('assets/mixed-challenges.css','utf8')});
  await page.exposeFunction('testParentPreview',async payload=>{
   parentCalls++;
   return TESTABLE.previewMixedChallenge(forbid,PARENT_UID,payload);
  });
  await page.evaluate(()=>{
   window.__TIM_PARENT=true;window.__TIM_GUEST=false;
   window.__CLOUD_ATTEMPTS=[];
   window.__TIM_BRIDGE={
    submit:()=>{throw Error('Appel de validation Tim interdit');},
    mixedMissionPreview:(id,answers,translationsUsed)=>window.testParentPreview({id,answers,translationsUsed}),
    refresh:()=>{throw Error('Actualisation de compte Tim interdite');}
   };
  });
  await page.addScriptTag({path:'mixed-challenges-ui.js'});
  await page.evaluate(task=>window.TIM_MIXED_UI.open(task,{old:null}),publicTask);
  assert.match(await page.locator('#exercise-detail').innerText(),/Essai Parent/);
  await page.getByRole('button',{name:'Commencer mon essai Parent'}).click();
  assert.ok(await page.locator('.mix-panel input:not(:disabled),.mix-panel textarea:not(:disabled)').count()>0);

  // Essai vide : le bouton de correction reste disponible, sans aucun appel au service Tim.
  for(let i=0;i<mission.questions.length;i++){
   await page.getByRole('button',{name:i===9?'Relire ma copie':'Suivante →'}).click();
  }
  const submit=page.getByRole('button',{name:'Corriger mon essai Parent (sans XP)'});
  assert.equal(await submit.isEnabled(),true,'Les questions non remplies ne doivent pas bloquer le Parent.');
  await submit.click();
  await page.getByText('Note de mon essai Parent : 0/10').waitFor();
  assert.match(await page.locator('.mix-panel').innerText(),/aucune note de Tim enregistrée/);
  assert.equal(await page.locator('.mix-correction').count(),10);
  assert.match(await page.locator('.mix-correction').first().innerText(),/Sans réponse/);

  await page.getByRole('button',{name:'Recommencer un essai Parent'}).click();
  await page.getByRole('button',{name:'Commencer mon essai Parent'}).click();
  for(const [i,q] of mission.questions.entries()){
   if(q.type==='mc'){
    await page.locator('.mix-options input[type="radio"]').nth(q.right).check();
   }else if(q.type==='reason'){
    await page.locator('.mix-option input[type="radio"]').nth(q.right).check();
    const nums=q.parts.filter(x=>typeof x==='number');
    const symbols=q.parts.filter(x=>typeof x==='string');
    await page.locator('textarea.mix-textarea').nth(0).fill(nums.join(' ; ')+' '+symbols.join(' '));
    await page.locator('textarea.mix-textarea').nth(1).fill('La réponse au problème est '+q.answer+' '+(q.unit||'unités')+'.');
   }else{
    await page.locator(q.format==='short'?'textarea.mix-textarea':'input.mix-input').fill(String(q.right));
   }
   const translator=page.getByRole('button',{name:'Traduire en français'});
   if(await translator.count())await translator.click();
   await page.getByRole('button',{name:i===9?'Relire ma copie':'Suivante →'}).click();
  }
  assert.equal(await page.getByRole('button',{name:'Corriger mon essai Parent (sans XP)'}).isEnabled(),true);
  await page.getByRole('button',{name:'Corriger mon essai Parent (sans XP)'}).click();
  await page.getByText('Note de mon essai Parent : 10/10').waitFor();
  assert.equal(await page.locator('.mix-correction').count(),10);
  assert.equal(await page.locator('.mix-correction').filter({hasText:'0/1 point'}).count(),0);
  assert.equal(parentCalls,2);
  assert.equal(timSubmissions,0);
  assert.equal(errors.length,0,errors.join(' | '));
  console.log('PASS : Parent sur téléphone, 10 questions, copie vide 0/10, copie complète 10/10, corrections détaillées, reprise illimitée, 0 accès Firestore et 0 XP.');
 }finally{await browser.close();}
})().catch(e=>{console.error('ÉCHEC simulation Parent : '+e.stack);process.exitCode=1;});
