const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
const out=path.join(process.cwd(),'test-espagnol-results');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [device,width,height] of [['mobile',390,844],['desktop',1200,860]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8778/',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#guest-enter').click();
   await page.waitForFunction(()=>document.body.classList.contains('guest-mode'),{timeout:20000});
   const intro=page.locator('#intro-screen');
   if(await intro.isVisible()){
    const skip=page.locator('#intro-silent');
    if(await skip.isVisible())await skip.click();
    await intro.waitFor({state:'hidden',timeout:20000});
   }
   await page.locator('[data-nav="matieres"]:visible').first().click();
   await page.locator('#matieres-content .matter-card').filter({hasText:'Espagnol'}).first().click();
   const categories=await page.locator('#matieres-content .spx-card').count();
   if(categories!==6)throw Error(device+': 6 categories expected, found '+categories);
   await page.screenshot({path:path.join(out,device+'-espagnol-accueil.png'),fullPage:true});
   await page.locator('#spx-find').fill('je suis');
   const links=await page.locator('#spx-results .spx-hit').count();
   if(links<1)throw Error(device+': search "je suis" returned no lesson');
   await page.locator('#spx-find').fill('');
   await page.locator('#matieres-content .spx-card').first().click();
   const rows=await page.locator('#matieres-content .spx-row[data-lesson]').count();
   if(rows!==4)throw Error(device+': expected four verbs sub-lessons, got '+rows);
   await page.locator('#matieres-content .spx-row[data-lesson]').first().click();
   const referenceInstructions=await page.locator('#matieres-content .spx-guide').count();
   if(referenceInstructions!==8)throw Error(device+': expected 8 translated teacher instructions, got '+referenceInstructions);
   const originalPanel=page.locator('#matieres-content .spx-ent-translations');
   if(!(await originalPanel.isVisible()))throw Error(device+': original ENT translated panel not visible');
   const translations=await originalPanel.locator('.spx-ent-item').count();
   if(translations<1)throw Error(device+': original ENT extracts missing in this lesson');
   if(!(await originalPanel.locator('.spx-ent-spanish').first().textContent()))throw Error(device+': Spanish originals missing');
   if(!(await originalPanel.locator('.spx-ent-french').first().textContent()))throw Error(device+': French translations missing');
   const series=await page.locator('#matieres-content .spx-row[data-set]').count();
   if(series!==5)throw Error(device+': expected 5 training series, got '+series);
   await page.screenshot({path:path.join(out,device+'-verbes-lecon.png'),fullPage:true});
   await page.locator('#matieres-content .spx-row[data-set]').first().click();
   for(let q=0;q<10;q++){
    const es=await page.locator('.spx-instruction-es').textContent();
    const fr=await page.locator('.spx-instruction-fr').textContent();
    if(!es?.trim() || !fr?.includes('En français'))throw Error(device+': Spanish instruction or French translation missing on question '+(q+1));
    await page.locator('#spx-explain').click();
    if(!(await page.locator('#spx-action').isVisible()))throw Error(device+': explanation of the instruction not accessible');
    await page.locator('#matieres-content .spx-option').first().click();
    await page.locator('#spx-submit').click();
    if(!(await page.locator('#matieres-content .spx-feedback').isVisible()))throw Error(device+': correction missing question '+(q+1));
    await page.locator('#spx-next').click();
   }
   if(!(await page.locator('#spx-repeat').isVisible()))throw Error(device+': exercise summary missing');
   await page.locator('#spx-repeat').click();
   if(!(await page.locator('#matieres-content .spx-option').first().isVisible()))throw Error(device+': repeat failed');
   await page.locator('#matieres-content .spx-back').click();
   await page.locator('#spx-ent').click();
   if(!(await page.locator('#lesson-detail.active').isVisible()))throw Error(device+': original ENT lesson not opened');
   if(!(await page.locator('#lesson-detail .spx-ent-translations').isVisible()))throw Error(device+': translations not displayed with original ENT lesson');
   // Retour aux matières et contrôle que la photo manuscrite privée n'est jamais affichée aux invités.
   await page.locator('[data-nav="matieres"]:visible').first().click();
   await page.locator('#matieres-content .matter-card').filter({hasText:'Espagnol'}).first().click();
   await page.locator('#matieres-content .spx-card').filter({hasText:'Poser des questions et écrire'}).click();
   await page.locator('#matieres-content .spx-row[data-lesson="L05"]').click();
   if(!(await page.locator('#matieres-content .tim-letter-panel').isVisible()))throw Error(device+': original handwritten letter panel not accessible');
   const atelier=page.locator('#matieres-content .tim-letter-workshop');
   if(!(await atelier.isVisible()))throw Error(device+': translation and correction workshop missing');
   if(await atelier.locator('.tim-letter-lesson').count()!==6)throw Error(device+': expected 6 sections of letter analysis');
   await atelier.locator('.tim-letter-lesson summary').first().click();
   if(!(await atelier.locator('.tim-letter-fr').first().isVisible()))throw Error(device+': French translation not visible after opening section');
   if(!(await atelier.locator('.tim-letter-handwriting').isVisible()))throw Error(device+': handwriting guidance missing');
   if(!(await page.locator('#matieres-content .tim-letter-state').isVisible()))throw Error(device+': private access explanation missing');
   if(await page.locator('#matieres-content .tim-letter-original').count())throw Error(device+': personal image visible in guest mode');
   if(await page.locator('#matieres-content .tim-letter-upload').count())throw Error(device+': guest should not see private upload');
   await page.screenshot({path:path.join(out,device+'-atelier-lettre.png'),fullPage:true});
   if(errors.length)throw Error(device+': JS error(s): '+errors.join('; '));
   console.log('OK '+device+' : 6 categories, search, 5 series, 10 questions and repeat');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});