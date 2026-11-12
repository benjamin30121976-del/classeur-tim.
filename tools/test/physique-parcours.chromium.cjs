'use strict';
/* Audit Chromium en lecture seule. Il n’utilise aucun compte Tim/Parent, ne
   valide aucune question et bloque toute requête de mutation. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const target=process.env.TIM_SITE_URL||'http://127.0.0.1:8779/';
const output='audit-physique';
async function main(){
 fs.mkdirSync(output,{recursive:true});
 const path=['/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(path?{executablePath:path}:{}),args:['--no-sandbox']});
 const report={site:target,readOnly:true,checks:{},errors:[]};
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  await page.route('**/*',async route=>{
   if(!['GET','HEAD'].includes(route.request().method())){report.errors.push('Mutation blocked: '+route.request().url());await route.abort();return;}
   await route.continue();
  });
  page.on('pageerror',e=>report.errors.push('JS: '+String(e.message).slice(0,300)));
  const res=await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
  assert.ok(res?.ok(),'Accueil inaccessible');
  await page.locator('#guest-enter').waitFor({state:'visible',timeout:30000});
  await page.locator('#guest-enter').click();
  await page.locator('body.guest-mode').waitFor({timeout:30000});
  const intro=page.locator('#intro-screen');
  if(await intro.isVisible()){
   const skip=page.locator('#intro-skip');
   if(await skip.isVisible())await skip.click();
   else {
    const silent=page.locator('#intro-silent');
    if(await silent.isVisible())await silent.click();
   }
   await intro.waitFor({state:'hidden',timeout:20000});
  }
  const nav=page.locator('[data-nav="matieres"]').first();
  await nav.waitFor({state:'visible',timeout:20000});await nav.click();
  const physics=page.locator('#matieres-content button.matter-card').filter({hasText:'Physique-chimie'});
  await physics.waitFor({state:'visible',timeout:20000});await physics.click();
  const cards=page.locator('#matieres-content details.tim-es-lesson');
  await cards.first().waitFor({state:'visible',timeout:20000});
  report.checks.sevenLessons=await cards.count();
  assert.equal(report.checks.sevenLessons,7,'Le nombre de leçons diffère');
  await cards.first().locator('summary').click();
  await page.locator('#matieres-content .tim-es-course-sheet').waitFor({state:'visible',timeout:15000});
  report.checks.diagram=await page.locator('#matieres-content .pc-learning-drawing svg').count();
  assert.equal(report.checks.diagram,1,'Dessin manquant');
  const menu=page.locator('#matieres-content .tim-es-quick-links button');
  report.checks.fiveActions=await menu.count();
  assert.equal(report.checks.fiveActions,5,'Les cinq actions espagnoles manquent');
  await menu.nth(2).click();
  await page.locator('.tim-es-course-help').waitFor({state:'visible',timeout:15000});
  report.checks.help=true;
  await menu.nth(0).click();
  await page.locator('.tim-es-ent-original').waitFor({state:'visible',timeout:15000});
  report.checks.ent=true;
  await menu.nth(4).click();
  const choices=page.locator('.pc-exercise-work');
  await page.locator('.tim-es-exercises').waitFor({state:'visible',timeout:15000});
  const series=page.locator('.tim-es-exercises button.tim-es-quick-link');
  report.checks.series=await series.count();
  assert.equal(report.checks.series,3,'Trois exercices par leçon manquants');
  await series.first().click();
  await choices.getByText(/réservés aux comptes Tim et Parent/i).waitFor({timeout:15000});
  report.checks.guestCannotGrade=true;
  await page.screenshot({path:output+'/physique-mobile.jpg',type:'jpeg',quality:70,fullPage:true});
  fs.writeFileSync(output+'/rapport.json',JSON.stringify(report,null,2));
  process.stdout.write(JSON.stringify(report)+'\n');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
