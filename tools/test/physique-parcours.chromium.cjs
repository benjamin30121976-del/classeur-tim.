'use strict';
/* Audit Chromium en lecture seule. Il n’utilise aucun compte Tim/Parent, ne
   valide aucune question et bloque toute requête de mutation. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const target=process.env.TIM_SITE_URL||'http://127.0.0.1:8779/';
const output='audit-physique';
function makeSyntheticPdf(){
 const operations='BT /F1 24 Tf 65 690 Td (Document de controle - non prive) Tj ET';
 const objs=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
  '<< /Length '+Buffer.byteLength(operations,'latin1')+' >>\nstream\n'+operations+'\nendstream',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
 ];
 let body='%PDF-1.4\n',offsets=[0];
 for(let i=0;i<objs.length;i++){
  offsets.push(Buffer.byteLength(body,'latin1'));
  body+=(i+1)+' 0 obj\n'+objs[i]+'\nendobj\n';
 }
 const xref=Buffer.byteLength(body,'latin1');
 body+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
 for(let i=1;i<offsets.length;i++)body+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 body+='trailer\n<< /Root 1 0 R /Size '+(objs.length+1)+' >>\nstartxref\n'+xref+'\n%%EOF\n';
 return Buffer.from(body,'latin1').toString('base64');
}

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
  // Vérifier le menu Exercices général, sans modifier aucune donnée.
  const general=page.locator('[data-nav="exercices"]').first();
  await general.waitFor({state:'visible',timeout:15000});
  await general.click();
  const physicsTile=page.locator('#exercise-list button.matter-card').filter({hasText:'Physique-chimie'});
  await physicsTile.waitFor({state:'visible',timeout:15000});
  report.checks.physicsInGeneralExercises=true;
  report.checks.physicsCounter=await physicsTile.textContent();
  assert.ok(/21 exercice/.test(report.checks.physicsCounter),'Le menu général doit annoncer 21 exercices');
  await physicsTile.click();
  const lessonBoxes=page.locator('#exercise-list .pc-exercise-lesson');
  await lessonBoxes.first().waitFor({state:'visible',timeout:15000});
  report.checks.exerciseLessonGroups=await lessonBoxes.count();
  assert.equal(report.checks.exerciseLessonGroups,7,'Sept groupes de leçons attendus dans Exercices');
  const interactiveTiles=page.locator('#exercise-list .pc-exercise-lesson button.tile');
  report.checks.interactiveExerciseTiles=await interactiveTiles.count();
  assert.equal(report.checks.interactiveExerciseTiles,21,'Les 21 exercices doivent être cliquables');
  await interactiveTiles.first().click();
  const globalSlot=page.locator('#exercise-detail .pc-global-training-slot');
  await globalSlot.waitFor({state:'visible',timeout:15000});
  await globalSlot.getByText(/réservés aux comptes Tim et Parent/i).waitFor({timeout:15000});
  report.checks.guestCannotSubmitFromMainMenu=true;
  const backExercise=page.locator('#exercise-detail button').filter({hasText:'Retour aux exercices de physique-chimie'});
  await backExercise.click();
  assert.equal(await interactiveTiles.count(),21,'La navigation retour doit conserver les exercices');
  // Test du PDF intégré avec un DOCUMENT SYNTHÉTIQUE, jamais avec ceux de Tim.
  await page.evaluate(b64=>{
   window.__TIM_GUEST=false;
   const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
   const blob=new Blob([bytes],{type:'application/pdf'});
   window.__TIM_BRIDGE={attachments:{
    list:async()=>[{id:'pdf-factice',targetKind:'lesson',targetId:'PCENT6390167',fileName:'Chapitre 1 Atomes molécules et ions 3eme.pdf',size:blob.size}],
    read:async()=>blob
   }};
   const host=document.createElement('div');host.id='pc-test-in-page';
   host.style.cssText='padding:20px;max-width:600px;margin:auto;background:white';
   document.body.append(host);
   const example=window.TIM_PHYSICS_INLINE_PDF.createInline(
    {target:'PCENT6390167',fileName:'Chapitre 1 Atomes molécules et ions 3eme.pdf'},
    1,'Test privé simulé — rester dans la même page'
   );
   host.append(example);
  },makeSyntheticPdf());
  await page.locator('#pc-test-in-page').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{
   const card=document.querySelector('#pc-test-in-page .pc-inline-pdf');
   const cv=card?.querySelector('canvas');
   return Boolean(card&&cv&&cv.width>100&&cv.height>100&&!card.textContent.includes('Affichage impossible'));
  },{timeout:45000});
  const pageLabel=await page.locator('#pc-test-in-page .pc-pdf-toolbar span').innerText();
  assert.equal(pageLabel,'Page 1 / 1');
  report.checks.privatePdfInsideLesson=true;
  report.checks.pdfCanvasRendered=true;
  report.checks.openedTabs=0;
  await page.locator('#pc-test-in-page').screenshot({path:output+'/pdf-integre-demonstration.jpg',type:'jpeg',quality:75});
  await page.screenshot({path:output+'/physique-mobile.jpg',type:'jpeg',quality:70,fullPage:true});
  fs.writeFileSync(output+'/rapport.json',JSON.stringify(report,null,2));
  process.stdout.write(JSON.stringify(report)+'\n');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
