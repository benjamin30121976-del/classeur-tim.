'use strict';
/* Test Chromium sur de fausses données ENT : aucune connexion, copie, XP ni Firebase. */
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const out=path.join(process.cwd(),'browser-fixture-avenir');
 fs.mkdirSync(out,{recursive:true});
 try {
  for(const device of [{name:'ordinateur',w:1280,h:800},{name:'telephone',w:390,h:844}]){
   const context=await browser.newContext({viewport:{width:device.w,height:device.h},
      locale:'fr-FR',isMobile:device.name==='telephone',hasTouch:device.name==='telephone'});
   const page=await context.newPage();
   await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="future"></main></body></html>');
   await page.addStyleTag({path:path.join(process.cwd(),'prochaines-missions.css')});
   await page.evaluate(()=>{
      const q=()=>({type:'text',q:'Explique avec tes mots',right:'Réponse de test',
         why:'Une explication pédagogique fictive, uniquement pour tester le rendu.'});
      const b=(id,task,day,title)=>({id,title,subject:'Anglais',category:'bonus',
         homeworkBonus:true,homeworkDue:day,linkedHomework:[task],
         questions:Array.from({length:10},q)});
      window.__fakeData={metadata:{timEntHomework:[
       {entId:'ENT20',subject:'Anglais',title:'Examen à venir',due:'2026-11-20',description:'Réviser les conjugaisons.'},
       {entId:'ENT21',subject:'Anglais',title:'Devoir du samedi',due:'2026-11-21',description:'Relire les mots.'},
       {entId:'ENT22',subject:'Anglais',title:'Devoir du dimanche',due:'2026-11-22'},
       {entId:'ENT25',subject:'Anglais',title:'Devoir dans une semaine',due:'2026-11-25'},
       {entId:'ENT19',subject:'Anglais',title:'Devoir de demain',due:'2026-11-19'}
      ]},exercises:[
       b('B1','ENT20','2026-11-20','Révision 1'),
       b('B2','ENT20','2026-11-20','Révision 2'),
       b('B3','ENT20','2026-11-20','Révision 3'),
       b('B4','ENT22','2026-11-22','Révision du dimanche'),
       b('B5','ENT25','2026-11-25','Révision dans une semaine')
      ]};
      window.__clicked=[];
   });
   await page.addScriptTag({path:path.join(process.cwd(),'prochaines-missions.js')});
   await page.evaluate(()=>{
     window.TIM_NEXT_MISSIONS.render(document.querySelector('#future'),{
       data:window.__fakeData,attempts:[],now:new Date('2026-11-18T12:00:00Z'),
       openBonus:id=>window.__clicked.push(id),openSubject:()=>{}
     });
   });
   assert.equal(await page.locator('.future-card').count(),4);
   const first=page.locator('.future-card').filter({hasText:'Examen à venir'});
   assert.equal(await first.locator('button.future-action.primary').count(),3);
   assert.match(await page.locator('#future').innerText(),/1 \/ 4|3 \/ 4|avec exercices/);
   assert.match(await page.locator('#future').innerText(),/Aucun exercice bonus associé précisément/);
   await first.getByRole('button',{name:/Faire le bonus · Révision 3/}).click();
   const clicked=await page.evaluate(()=>window.__clicked);
   assert.deepEqual(clicked,['B3']);
   await page.screenshot({path:path.join(out,'devoirs-a-venir-'+device.name+'.png'),fullPage:true});
   await context.close();
  }
  console.log('OK : quatre échéances anticipées, trois exercices visibles et accessibles, écrans PC/téléphone.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
