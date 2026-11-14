'use strict';
/* Chromium en lecture seule, données locales : aucune connexion Firebase, note ou XP écrit. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const start=app.indexOf('function openExercise(id,options={}){');
const end=app.indexOf("\ndocument.getElementById('exercise-search')",start);
assert(start>0&&end>start,'Lecteur des exercices introuvable');
const exerciseCode=app.slice(start,end);
const figureCode=fs.readFileSync(path.join(root,'maths-bonus-figures.js'),'utf8');
const out=path.join(root,'browser-results','figures-maths-bonus');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {BONUS_MATH_2026}=await import('../functions/bonus-maths-2026.mjs');
 const {BONUS_PERIMETRE_TIM}=await import('../functions/bonus-perimetres-tim-20261114.mjs');
 const tests=[
  {ex:BONUS_MATH_2026.find(e=>e.id==='TIMBONUSM05'),tag:'thales',first:'Quel théorème'},
  {ex:BONUS_MATH_2026.find(e=>e.id==='TIMBONUSM03'),tag:'pythagore',first:'hypoténuse'},
  {ex:BONUS_PERIMETRE_TIM,tag:'perimetres',first:'périmètre'}
 ];
 const browser=await chromium.launch({headless:true});
 try{
  for(const [device,viewport] of [['android',{width:390,height:844}],['bureau',{width:1330,height:900}]]){
   const page=await browser.newPage({viewport,locale:'fr-FR'});
   page.on('request',req=>{if(!/^data:|^about:/.test(req.url()))throw Error('Requête réseau interdite : '+req.url());});
   await page.setContent('<!doctype html><html lang="fr"><meta charset="utf-8"><style>body{font:16px Arial;background:#1c324e;color:#f4f8fb;margin:0;padding:16px}.q,.panel{border:1px solid #7289a9;border-radius:12px;padding:16px;margin:16px 0}.qtitle{font-weight:bold;margin-bottom:14px}.choose{display:block;padding:5px}.answer{width:80%;padding:9px}.intro{margin:12px}.feedback{padding:12px}</style><main id="exercise-index"></main><section id="exercise-detail"></section></html>');
   await page.addScriptTag({content:figureCode});
   for(const {ex,tag,first} of tests){
    assert(ex&&ex.questions.length===10,tag+' mal défini');
    await page.evaluate(({source,exercise})=>{
      const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text??'');return n;};
      const button=(label,fn,cls)=>{const n=E('button',cls,label);n.onclick=fn;return n;};
      const DATA={lessons:[],exercises:[exercise]};
      window.__TIM_PARENT=true;window.__TIM_GUEST=false;window.__CLOUD_ATTEMPTS=[];
      window.__TIM_BRIDGE={submit:async()=>{throw Error('Aucune écriture');}};
      window.TIM_EXERCISE={school:()=>false};
      const services={DATA,document,window,E,button,badge:()=>E('span','badge','Maths'),
       notice:s=>E('div','note',s),safe:v=>String(v??''),page:()=>{},
       clear:n=>(n.replaceChildren(),n),lessonBy:()=>null,exerciseBy:()=>exercise,
       attemptFor:()=>null,drafts:()=>({}),makeAttachmentPanel:()=>E('div','attachments',''),
       v7Feedback:()=>E('div'),scrollTop:()=>{},openLesson:()=>{},
       renderExerciseIndex:()=>{},v7NewAttempt:()=>{},DRAFT_KEY:'local',save:()=>{},
       confirm:()=>false,alert:()=>{},exerciseDescription:item=>item.description};
      Function(...Object.keys(services),source+';return openExercise')(...Object.values(services))(exercise.id,{skipOpening:true});
    },{source:exerciseCode,exercise:ex});
    assert.equal(await page.locator('#exercise-detail .q').count(),10,tag+' : pas 10 questions');
    assert.equal(await page.locator('#exercise-detail .q figure').count(),10,tag+' : figure manquante');
    assert.equal(await page.locator('#exercise-detail .q svg[role="img"]').count(),10,tag+' : SVG non accessible');
    const title=await page.locator('#exercise-detail .qtitle').first().innerText();
    assert(title.includes(first),tag+' : première consigne non clarifiée');
    const text=await page.locator('#exercise-detail').innerText();
    assert(!text.includes('Réponse attendue :'),'Clé de réponse visible avant validation');
    if(tag==='thales'){
     assert((await page.locator('.q').first().innerText()).includes('parallèle'),'Thalès : parallélisme absent');
     assert((await page.locator('.q svg').first().getAttribute('aria-label')).includes('alignés'),'Thalès : diagramme mal identifié');
     assert((await page.locator('.q').nth(7).innerText()).includes('croisée'),'Thalès croisé non expliqué');
    }
    if(tag==='perimetres'){
     assert((await page.locator('.q').nth(2).innerText()).includes('périmètre'),'Périmètre mal formulé');
     assert((await page.locator('.q').nth(8).innerText()).includes('périmètre'),'Calcul demandé sans périmètre');
    }
    await page.screenshot({path:path.join(out,tag+'-'+device+'.png'),fullPage:true});
    console.log('OK '+tag+' '+device+' : 10 figures, 10 questions, aucun résultat ni indice révélé.');
   }
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
