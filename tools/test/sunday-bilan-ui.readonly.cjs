'use strict';
/* Chromium mobile en mémoire. Jamais de validation Tim ni d'écriture Firestore. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const {mixedMission,publicMixedMission}=await import('../../worker/mixed-challenges.mjs');
 const {TESTABLE}=await import('../../worker/server.mjs');
 const {PARENT_UID}=await import('../../worker/auth.mjs');
 const mission=mixedMission('SUNDAY_BILAN_20261115');
 const publicTask=publicMixedMission(mission);
 const db=new Proxy({},{get:(_,field)=>()=>{throw Error('Firestore interdit : '+String(field));}});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:850},locale:'fr-FR'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let calls=0;
  await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main><section id="exercise-index"></section><section id="exercise-detail"></section></main></body></html>');
  await page.addStyleTag({content:fs.readFileSync('assets/mixed-challenges.css','utf8')});
  await page.exposeFunction('testParentPreview',async payload=>{calls++;return TESTABLE.previewMixedChallenge(db,PARENT_UID,payload);});
  await page.evaluate(()=>{window.__TIM_PARENT=false;window.__TIM_GUEST=false;window.__CLOUD_ATTEMPTS=[];window.__TIM_BRIDGE={submit:()=>{throw Error('Tim ne doit jamais soumettre en test')},mixedMissionPreview:(id,answers,translated)=>window.testParentPreview({id,answers,translationsUsed:translated})};});
  await page.addScriptTag({path:'mixed-challenges-ui.js'});
  await page.evaluate(task=>window.TIM_MIXED_UI.open(task,{}),publicTask);
  await page.getByRole('button',{name:/Commencer/}).click();
  for(let i=0;i<mission.questions.length;i++){
   assert.match(await page.locator('.mix-progress').innerText(),new RegExp('Question '+(i+1)+' / 20'));
   assert.equal(await page.locator('.mix-structured-field textarea').count(),mission.questions[i].fields.length);
   await page.getByRole('button',{name:i===19?'Relire ma copie':'Suivante →'}).click();
  }
  assert.equal(await page.locator('.mix-review-item').count(),20);
  assert.equal(await page.getByRole('button',{name:'Valider définitivement mon défi'}).isDisabled(),true);
  assert.equal(calls,0);
  await page.evaluate(task=>{window.__TIM_PARENT=true;window.TIM_MIXED_UI.open(task,{});},publicTask);
  await page.getByRole('button',{name:'Commencer mon essai Parent'}).click();
  for(let i=0;i<20;i++)await page.getByRole('button',{name:i===19?'Relire ma copie':'Suivante →'}).click();
  await page.getByRole('button',{name:'Corriger mon essai Parent (sans XP)'}).click();
  await page.getByText('Note de mon essai Parent : 0/20').waitFor();
  assert.equal(await page.locator('.mix-correction').count(),20);
  await page.getByRole('button',{name:'Recommencer un essai Parent'}).click();
  await page.getByRole('button',{name:'Commencer mon essai Parent'}).click();
  for(const [i,q] of mission.questions.entries()){
   const vals=q.fields.map((f,j)=>q.number===4?['rougeur','chaleur','gonflement','douleur'][j]:f.accepted[0]);
   for(let j=0;j<vals.length;j++)await page.locator('.mix-structured-field textarea').nth(j).fill(vals[j]);
   await page.getByRole('button',{name:i===19?'Relire ma copie':'Suivante →'}).click();
  }
  await page.getByRole('button',{name:'Corriger mon essai Parent (sans XP)'}).click();
  await page.getByText('Note de mon essai Parent : 20/20').waitFor();
  assert.equal(await page.locator('.mix-correction').count(),20);
  assert.equal(calls,2);
  assert.equal(errors.length,0,errors.join(' | '));
  console.log('PASS : Dimanche 20 questions, 68 cadres, Tim bloqué si vide, Parent 0/20 et 20/20, sans Firestore.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
