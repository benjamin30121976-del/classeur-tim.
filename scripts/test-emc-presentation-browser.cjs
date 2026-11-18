'use strict';
/* Chromium local — compare la vraie structure de navigation EMC aux autres
   matières. Aucune authentification, aucun réseau, aucune tentative ni écriture. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const dir=path.resolve(__dirname,'..');
const pack=fs.readFileSync(path.join(dir,'histoire-geographie-pack.js'),'utf8');
const parcours=fs.readFileSync(path.join(dir,'histoire-geographie-parcours.js'),'utf8');
const training=fs.readFileSync(path.join(dir,'histoire-geographie-exercices.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'assets/emc-parcours.css'),'utf8');
const sharedCss=fs.readFileSync(path.join(dir,'espagnol-parcours.css'),'utf8');
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
assert.match(app,/name==='EMC'&&window\.TIM_HG_PATH/);
assert.match(app,/emcOnly:true/);
assert.match(training,/options\.emcOnly/);
assert.match(training,/options\.emcOnly\?6:18/);
assert.match(parcours,/renderEmc\(root,opts\)/);
const output=path.join(dir,'browser-results','emc-presentation');
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [device,viewport] of [
   ['petit-android',{width:360,height:740}],
   ['android',{width:390,height:844}],
   ['bureau',{width:1180,height:850}]
  ]){
   const page=await browser.newPage({viewport,locale:'fr-FR'});
   await page.route('**/*',r=>r.abort('blockedbyclient'));
   await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:12px;background:#f2f6fa;color:#243147;font:16px Arial"><main id="root"></main></body></html>');
   await page.addStyleTag({content:sharedCss});
   await page.addStyleTag({content:css});
   await page.addScriptTag({content:pack});
   await page.addScriptTag({content:parcours});
   await page.evaluate(()=>{
    window.__TIM_GUEST=true;window.__TIM_PARENT=false;
    window.__EMC_TEST_IDS=[];
    window.TIM_HG_TRAINING={
     mount:(id,slot)=>{window.__EMC_TEST_IDS.push(id);slot.textContent='Questionnaire fictif affiché sans écriture';},
     renderProgress:(slot,opts)=>{slot.textContent='Suivi fictif filtré : '+String(opts?.emcOnly)}
    };
    window.TIM_HG_PATH.render(document.getElementById('root'),{emcOnly:true,back:()=>{}});
   });
   assert.match(await page.locator('#root .spx-hero h2').innerText(),/Mes leçons d’EMC/);
   assert.equal(await page.locator('#root .spx-card').count(),3,'Accueil avec trois cartes EMC attendu');
   assert.equal(await page.locator('#root .chapter-section').count(),0,'Ancien menu accordéon toujours utilisé');
   const panel=page.locator('#root');
   const width=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2);
   assert(await width(),'Débordement horizontal sur écran '+device);
   // Une carte = un thème ; la leçon BIS est une fiche unique, distincte des séances ENT.
   await panel.locator('.spx-card').first().click();
   assert.equal(await panel.locator('.spx-row').count(),3,'Une leçon BIS et deux séances ENT doivent être visibles');
   assert.match(await panel.locator('.spx-row').first().innerText(),/Constitution/);
   await panel.locator('.spx-row').first().click();
   assert.match(await panel.locator('.spx-hero h2').innerText(),/Leçon BIS/);
   assert.equal(await panel.locator('.hg-bis-illustration').count(),1,'Leçon BIS répétée ou sans dessin');
   assert.match(await panel.innerText(),/Comprendre la leçon pas à pas/);
   const nav=panel.locator('.emc-shortcuts');
   assert.equal(await nav.locator('button').count(),5,'Les cinq rubriques doivent être accessibles directement');
   for(const key of ['Cours ENT','Leçon BIS','Je n’ai pas compris','Exercices ENT','Entraînement'])
    assert(await nav.getByRole('button',{name:key,exact:true}).count(),'Rubrique introuvable : '+key);
   await nav.getByRole('button',{name:'Je n’ai pas compris',exact:true}).click();
   assert.match(await panel.innerText(),/Reprendre une notion/);
   await panel.locator('.emc-shortcuts').getByRole('button',{name:'Cours ENT',exact:true}).click();
   assert.equal(await panel.locator('.spx-row').count(),2,'Deux séances ENT du thème République');
   await panel.locator('.spx-row').first().click();
   assert.match(await panel.innerText(),/06\/11\/2026/);
   assert.match(await panel.innerText(),/III Les valeurs et principes de la République/i,'Le texte du cours du 6 est absent');
   assert.match(await panel.innerText(),/Pour le 09\/11\/2026/i,'Devoir du 9 novembre mal rattaché au 6');
   await panel.locator('.emc-shortcuts').getByRole('button',{name:'Exercices ENT',exact:true}).click();
   assert.match(await panel.innerText(),/Texte original du professeur/,'Document de devoir original ENT absent');
   await panel.locator('.emc-shortcuts').getByRole('button',{name:'Entraînement',exact:true}).click();
   assert.match(await panel.innerText(),/0 XP/,'Le barème existant n’est pas précisé');
   assert.equal(await panel.locator('.emc-training-slot').count(),1,'Emplacement de quiz manquant');
   await panel.getByRole('button',{name:/Exercice 1.*QCM/}).click();
   const opened=await page.evaluate(()=>window.__EMC_TEST_IDS);
   assert.deepEqual(opened,['HGQ_L06_01'],'L’identifiant historique de l’exercice doit rester inchangé');
   // Non-régression : Histoire-Géographie conserve ses 9 chapitres et 26 séances (nouvelle séance du 16 novembre).
   const normal=await page.evaluate(()=>{
    const root=document.getElementById('root');
    window.TIM_HG_PATH.render(root,{back:()=>{}});
    return {chapters:root.querySelectorAll('details.chapter-section').length,
      lessons:root.querySelectorAll('details.tim-es-lesson').length};
   });
   assert.deepEqual(normal,{chapters:9,lessons:26});
   assert(await width(),'Le parcours Histoire-Géographie déborde après retour');
   // Retour au nouvel accueil pour capturer la présentation réellement testée.
   await page.evaluate(()=>window.TIM_HG_PATH.render(document.getElementById('root'),{emcOnly:true,back:()=>{}}));
   await panel.locator('.spx-card').first().click();
   await page.screenshot({path:path.join(output,'emc-'+device+'.png'),fullPage:true,animations:'disabled'});
   console.log('OK EMC '+device+' : cartes, une BIS par thème, cours/date, aide, devoir ENT, 0 XP, même identifiant, HG intact.');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
