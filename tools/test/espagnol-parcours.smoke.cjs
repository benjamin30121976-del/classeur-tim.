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
   if(!(await page.locator('#matieres > .pagehead').isVisible()))throw Error(device+': subject choice header not visible on selection screen');
   await page.locator('#matieres-content .matter-card').filter({hasText:'Espagnol'}).first().click();
   if(!(await page.locator('#matieres > .pagehead').isHidden()))throw Error(device+': redundant subject choice header still visible inside Spanish');
   const categories=await page.locator('#matieres-content .spx-card').count();
   if(categories!==6)throw Error(device+': 6 categories expected, found '+categories);
   const pictures=page.locator('#matieres-content .spx-card .spx-topic-svg');
   if(await pictures.count()!==6)throw Error(device+': expected 6 different vector pictograms');
   const paths=await pictures.evaluateAll(nodes=>nodes.map(n=>n.innerHTML));
   if(new Set(paths).size!==6)throw Error(device+': topic pictograms must be distinct');
   for(const card of await page.locator('#matieres-content .spx-card').all()){
     const badge=card.locator('.spx-icon');
     const label=(await badge.textContent()).trim();
     if(label)throw Error(device+': old letter label still present: '+label);
   }
   const firstCardText=await page.locator('#matieres-content .spx-card').first().innerText();
   if(!firstCardText.includes('fiches de cours ENT')||!firstCardText.includes('ENT repérés')||!firstCardText.includes('20 entraînements')||!firstCardText.includes('Leçons simplifiées disponibles'))throw Error(device+': overview inventory missing on Spanish cards');
   await page.screenshot({path:path.join(out,device+'-espagnol-accueil.png'),fullPage:true});
   await page.locator('#spx-find').fill('je suis');
   const links=await page.locator('#spx-results .spx-hit').count();
   if(links<1)throw Error(device+': search "je suis" returned no lesson');
   await page.locator('#spx-find').fill('');
   await page.locator('#matieres-content .spx-back').click();
   if(!(await page.locator('#matieres > .pagehead').isVisible()))throw Error(device+': subject choice header not restored when returning to subjects');
   await page.locator('#matieres-content .matter-card').filter({hasText:'Espagnol'}).first().click();
   if(!(await page.locator('#matieres > .pagehead').isHidden()))throw Error(device+': subject choice header displayed again in Spanish');
   await page.locator('#matieres-content .spx-card').first().click();
   const rows=await page.locator('#matieres-content .spx-lesson-item').count();
   if(rows!==4)throw Error(device+': expected four verbs sub-lessons, got '+rows);
   const firstLessonText=await page.locator('#matieres-content .spx-lesson-item').first().innerText();
   if(!firstLessonText.includes('1 fiche de cours ENT')||!firstLessonText.includes('5 entraînements')||firstLessonText.includes('Je n’ai pas compris'))throw Error(device+': sublesson inventory duplicate or missing');
   const firstActions=page.locator('#matieres-content .spx-lesson-item').first().locator('.spx-quick-link');
   if(await firstActions.count()!==4)throw Error(device+': expected four direct actions without unavailable ENT exercises');
   for(const label of ['Leçon','Leçon simplifiée','Entraînements · 5 × 10','Cours ENT']){
     if(!(await firstActions.filter({hasText:label}).count()))throw Error(device+': missing direct link '+label);
   }
   await page.locator('#matieres-content [data-easy="L09"]').click();
   if(!(await page.locator('#spx-easy-lesson').isVisible()))throw Error(device+': simple lesson not visible');
   if(!(await page.locator('#spx-easy-lesson').getAttribute('open')!==null))throw Error(device+': simple lesson not expanded from shortcut');
   if(await page.locator('#spx-easy-lesson li').count()<3)throw Error(device+': simplified help steps missing');
   await page.locator('#matieres-content .spx-back').click();
   const returnRows=await page.locator('#matieres-content .spx-lesson-item').count();
   if(returnRows!==4)throw Error(device+': return from simplified help failed');
   const entButton=page.locator('#matieres-content [data-ent-exercises="L13"]');
   if(!(await entButton.isVisible()))throw Error(device+': ENT exercises action missing for photocopy');
   await entButton.click();
   const entWork=await page.locator('#matieres-content .spx-chapter-overview').innerText();
   if(!entWork.includes('3 activités/exercices ENT repérés'))throw Error(device+': sourced ENT activity count missing in photocopy lesson');
   if(!(await page.locator('#matieres-content .spx-ent-translations').isVisible()))throw Error(device+': ENT button does not open original exercise extracts');
   await page.locator('#matieres-content .spx-back').click();
   await page.locator('#matieres-content [data-training="L09"]').click();
   if(await page.locator('#matieres-content [data-set]').count()!==5)throw Error(device+': training shortcut does not open 5 series');
   await page.locator('#matieres-content .spx-back').click();
   await page.locator('#matieres-content [data-lesson="L09"]').click();
   const voices=await page.locator('#matieres-content .spx-words .spx-listen').count();
   if(voices!==10)throw Error(device+': expected one audio button for each of 10 Spanish expressions, found '+voices);
   await page.evaluate(()=>{
      window.__spanishSpoken=[];
      window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
      Object.defineProperty(window,"speechSynthesis",{value:{
        cancel(){},getVoices(){return [{lang:"es-ES",name:"Spanish test voice"}];},
        speak(utterance){window.__spanishSpoken.push({text:utterance.text,lang:utterance.lang,rate:utterance.rate});}
      },configurable:true});
   });
   const firstWord=await page.locator('#matieres-content .spx-words .spx-listen').first().getAttribute('data-say-es');
   await page.locator('#matieres-content .spx-words .spx-listen').first().click();
   const spoken=await page.evaluate(()=>window.__spanishSpoken[0]);
   if(spoken?.text!==firstWord||spoken?.lang!=="es-ES"||spoken?.rate>0.9)throw Error(device+': Spanish voice button not wired correctly');
   if(await page.locator('#matieres-content .spx-guide .spx-listen').count()!==8)throw Error(device+': teacher instructions lack Spanish audio');
   if(!(await page.locator('#matieres-content .spx-ent-translations .spx-listen').count()))throw Error(device+': ENT original expressions lack audio');
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
   // L'accès « Cours ENT » doit ouvrir la vraie fiche du cours et non les bonus.
   await page.locator('[data-nav="matieres"]:visible').first().click();
   await page.locator('#matieres-content .matter-card').filter({hasText:'Espagnol'}).first().click();
   await page.locator('#matieres-content .spx-card').first().click();
   await page.locator('#matieres-content [data-course="L09"]').click();
   if(!(await page.locator('#lesson-detail.active').isVisible()))throw Error(device+': direct ENT course shortcut failed');
   if(!(await page.locator('#lesson-detail .lesson-type-label.ent').isVisible()))throw Error(device+': not a real ENT course');
   // Retour aux matières et contrôle que la photo manuscrite privée n'est jamais affichée aux invités.
   await page.locator('[data-nav="matieres"]:visible').first().click();
   if(!(await page.locator('#matieres > .pagehead').isVisible()))throw Error(device+': subject choice header not visible on selection screen');
   await page.locator('#matieres-content .matter-card').filter({hasText:'Espagnol'}).first().click();
   if(!(await page.locator('#matieres > .pagehead').isHidden()))throw Error(device+': redundant subject choice header still visible inside Spanish');
   await page.locator('#matieres-content .spx-card').filter({hasText:'Poser des questions et écrire'}).click();
   await page.locator('#matieres-content [data-lesson="L05"]').click();
   if(!(await page.locator('#matieres-content .tim-letter-panel').isVisible()))throw Error(device+': original handwritten letter panel not accessible');
   const atelier=page.locator('#matieres-content .tim-letter-workshop');
   if(!(await atelier.isVisible()))throw Error(device+': translation and correction workshop missing');
   if(await atelier.locator('.tim-letter-lesson').count()!==6)throw Error(device+': expected 6 sections of letter analysis');
   await atelier.locator('.tim-letter-lesson summary').first().click();
   if(!(await atelier.locator('.tim-letter-fr').first().isVisible()))throw Error(device+': French translation not visible after opening section');
   if(!(await atelier.locator('.tim-letter-handwriting').isVisible()))throw Error(device+': handwriting guidance missing');
   if(await atelier.locator('.tim-letter-es .spx-listen').count()!==6)throw Error(device+': Spanish letter examples lack audio');
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