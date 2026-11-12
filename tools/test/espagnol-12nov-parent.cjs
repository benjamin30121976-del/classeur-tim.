'use strict';
// Contrôle authentifié en lecture seule. Aucune note, tentative ou donnée privée affichée.
const {chromium}=require('playwright');
const {readFileSync,existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const EMAIL=process.env.TIM_PARENT_EMAIL, PASSWORD=process.env.TIM_PARENT_PASSWORD;
async function check(browser,name,viewport){
 const context=await browser.newContext({viewport,locale:'fr-FR'});
 const page=await context.newPage();let popups=0;
 page.on('popup',()=>popups++);
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>window.__TIM_PARENT===true&&document.body.classList.contains('ready'),null,{timeout:45000});
  if(await page.locator('#intro-screen').isVisible()){
   await page.locator('#intro-skip').click({timeout:7000});
   await page.locator('#intro-screen').waitFor({state:'hidden',timeout:15000});
  }
  const inv=await page.evaluate(async()=>{
   const pack=window.__TIM_DATA?.metadata?.spanishEnt||{};
   const records=pack.lessons||[];
   const ids=records.map(x=>String(x?.data?.id));
   const pdfs=await window.__TIM_BRIDGE.attachments.list('lesson','ENTESP_2026');
   return {lessons:records.length,has1211:ids.includes('10099~6400554'),
    teacherPdf:pdfs.some(x=>x.fileName==='4 EECEno empiezo las clases en septiembre.pdf'||x.sha256==='be48a6fa18032c127be5cdc1652ca9a585908953a67cedc562dbd7575b472837')};
  });
  console.log(name+' : cours espagnols originaux dans Firebase='+inv.lessons+
    ', seance 12 novembre deja presente='+inv.has1211+
    ', PDF groupe A deja present='+inv.teacherPdf);
  await page.addScriptTag({content:readFileSync('espagnol-cours-12nov.js','utf8')});
  await page.addScriptTag({content:readFileSync('espagnol-ent-exact.js','utf8')});
  await page.evaluate(()=>window.TIM_PEDAGOGY_NAVIGATE('Espagnol','10099~6400554'));
  const card=page.locator('#matieres-content .tim-es-nov12');
  await card.waitFor({state:'visible',timeout:16000});
  assert.match(await card.locator('summary').textContent(),/12 novembre/);
  await card.locator('summary').evaluate(el=>el.click());
  await card.getByText('Texte de Mme Gonzalez dans l’ENT').waitFor({state:'visible',timeout:10000});
  await card.getByText('Devoir pour mardi 17 novembre').waitFor({state:'visible',timeout:15000});
  assert((await card.textContent()).includes('terminar la fotocopia'));
  assert((await card.textContent()).includes('no… sino'));
  const viewer=card.locator('.pc-inline-pdf');
  if(inv.teacherPdf){
   await viewer.waitFor({state:'visible',timeout:20000});
   assert.equal(await viewer.getByRole('button',{name:'Afficher ici le document du professeur'}).count(),0);
   await viewer.scrollIntoViewIfNeeded();
   const ok=await page.waitForFunction(()=>{
    const node=document.querySelector('#matieres-content .tim-es-nov12 .pc-inline-pdf');
    const canvas=node?.querySelector('canvas'),status=node?.querySelector('.pc-pdf-toolbar span')?.textContent||'';
    return Boolean(canvas?.width>0&&canvas?.height>0&&/^Page \d+ \/ \d+$/.test(status));
   },null,{timeout:30000}).then(()=>true).catch(()=>false);
   assert(ok,name+' : fiche PDF du groupe A non affichée dans la page');
   console.log('OK '+name+' : fiche ENT du groupe A affichée automatiquement dans le cours du 12 novembre.');
  }else{
   assert.match(await card.textContent(),/n’est pas encore présent/);
   assert.equal(await card.getByRole('button',{name:'Installer cette fiche PDF privée'}).count(),1);
   console.log('ATTENTION '+name+' : le fichier source est dans l export du parent mais pas encore dans le stockage privé.');
  }
  assert.equal(popups,0);
  console.log('PASS '+name+' : le cours ENT et la leçon BIS du 12 novembre sont consultables, sans écriture ni nouvel onglet.');
 }finally{await context.close();}
}
(async()=>{
 assert(EMAIL&&PASSWORD,'Accès Parent manquant');
 const c=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(c?{executablePath:c}:{})});
 try{await check(browser,'ordinateur',{width:1280,height:840});
     await check(browser,'telephone',{width:390,height:844});}
 finally{await browser.close();}
})().catch(e=>{console.error('ECHEC AUDIT ESPAGNOL : '+String(e?.message||e).slice(0,200));process.exitCode=1;});