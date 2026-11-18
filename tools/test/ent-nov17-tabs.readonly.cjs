'use strict';
/* Test Chromium local des nouvelles leçons : aucune connexion Firebase ni soumission. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const here=path.resolve(__dirname,'../..');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [device,viewport] of [['mobile',{width:390,height:844}],['ordinateur',{width:1280,height:800}]]){
   const page=await browser.newPage({viewport});
   await page.setContent('<!doctype html><html lang="fr"><body><main id="root"></main></body></html>');
   await page.evaluate(()=>{
    window.__TIM_GUEST=true;window.__TIM_PARENT=false;
    const mock=name=>({mount:(id,slot)=>{window.__lastMounted=id;slot.dataset.trainingId=id;},renderProgress:()=>{}});
    window.TIM_FR_TRAINING=mock('FR');
    window.TIM_SVT_TRAINING=mock('SVT');
    window.TIM_ENGLISH_TRAINING=mock('EN');
    window.TIM_HG_TRAINING=mock('HG');
   });
   for(const file of ['francais-pack.js','svt-pack.js','anglais-pack.js','histoire-geographie-pack.js','francais-parcours.js','svt-parcours.js','anglais-parcours.js','histoire-geographie-parcours.js']){
    await page.addScriptTag({path:path.join(here,file)});
   }
   for(const scenario of [
    {api:'TIM_FR_PATH',lesson:'FR_BIS12',course:'Chapitre 6 : le subjonctif',want:'FRQ_L12_01',button:'QCM de compréhension'},
    {api:'TIM_FR_PATH',lesson:'FR_BIS13',course:'Orwell',want:'FRQ_L13_02',button:'Réponses écrites'},
    {api:'TIM_SVT_PATH',lesson:'SVT_BIS08',course:'Réaction lente',want:'SVQ_L08_01',button:'QCM de compréhension'},
    {api:'TIM_ENGLISH_PATH',lesson:'EN_BIS08',course:'Songs rooted in rebellion',want:'ENQ_L08_01',button:'exercice 1'},
    {api:'TIM_HG_PATH',lesson:'HG_BIS09',course:'bilan EMC et B le nazisme',want:'HGQ_L09_03',button:'Cinq mots à définir'}
   ]){
    const result=await page.evaluate(async s=>{
     const root=document.getElementById('root');window.__lastMounted=null;
     window[s.api].render(root,{openLessonId:s.lesson});
     const courses=[...root.querySelectorAll('details.tim-es-lesson')];
     const course=courses.find(x=>x.querySelector('summary')?.textContent.includes(s.course)&&x.open);
     if(!course)return {error:'Cours non ouvert',titles:courses.filter(x=>x.open).map(x=>x.querySelector('summary')?.textContent)};
     const tab=[...course.querySelectorAll('button')].find(x=>x.textContent.trim()==='Entraînement');
     if(!tab)return {error:'Onglet Entraînement absent'};
     tab.click();
     await Promise.resolve();
     const button=[...course.querySelectorAll('button')].find(x=>x.textContent.includes(s.button)&&x!==tab);
     if(!button)return {error:'Bouton nouvel exercice absent',buttons:[...course.querySelectorAll('button')].map(x=>x.textContent.trim()).slice(-10)};
     button.click();
     return {mounted:window.__lastMounted};
    },scenario);
    assert.equal(result.mounted,scenario.want,device+' '+scenario.lesson+' '+JSON.stringify(result));
    console.log('OK '+device+' '+scenario.want);
   }
   await page.evaluate(()=>{
    window.__TIM_GUEST=false;
    window.__TIM_DATA={metadata:{spanishEnt:{lessons:[],dates:{}}}};
    window.TIM_SPANISH_SIMPLIFIED={
     lessons:Array.from({length:14},(_,i)=>({id:'L'+i})),
     render:async root=>{root.replaceChildren(document.createElement('p'));},
     renderQuestions:(slot,task)=>{window.__lastSpanish=task.id;slot.dataset.trainingId=task.id;},
     drawCorrection:()=>{}
    };
    window.__TIM_BRIDGE={
     spanishEntTrainingTask:async id=>({task:{id,questions:Array.from({length:10},(_,i)=>({kind:'qcm',instructionEs:'Pregunta '+i,choices:['a','b','c','d']}))},completed:false}),
     spanishEntTrainingProgress:async()=>({attempt:null})
    };
   });
   await page.addScriptTag({path:path.join(here,'espagnol-ent-exact.js')});
   const result=await page.evaluate(async()=>{
    const root=document.getElementById('root');
    await window.TIM_SPANISH_ENT_EXACT.render(root,{});
    const panel=[...root.querySelectorAll('details.tim-es-lesson')].find(x=>x.textContent.includes('Mardi 17 novembre'));
    if(!panel)return {error:'Leçon espagnole du 17 absente'};
    panel.open=true;panel.dispatchEvent(new Event('toggle'));
    const tabs=[...panel.querySelectorAll('button')],training=tabs.find(x=>x.textContent==='Entraînement');
    if(!training)return {error:'Onglet entrainement ESP absent'};
    training.click();
    const buttons=[...panel.querySelectorAll('button[data-es-training-id]')];
    if(buttons.length!==3)return {error:'Doit avoir trois exercices ESP',buttons:buttons.map(x=>x.dataset.esTrainingId)};
    const out=[];
    for(const b of buttons){
     b.click();await Promise.resolve();await Promise.resolve();
     out.push(window.__lastSpanish);
    }
    return {ids:out};
   });
   assert.deepEqual(result.ids,['ESE_L16_01','ESE_L16_02','ESE_L16_03'],device+' espagnol '+JSON.stringify(result));
   console.log('OK '+device+' espagnol : 3 exercices de dix questions');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
