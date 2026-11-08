/* Vérifications réelles du parcours Espagnol : 3 niveaux, ENT et 5x10 sans XP. */
const {chromium}=require('playwright');
const fs=require('fs');const path=require('path');
const out=path.join(process.cwd(),'test-espagnol-results');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for (const [device,width,height] of [['mobile',390,844],['desktop',1200,860]]) {
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const subject=page.locator('#matieres-content');
   await page.goto('http://127.0.0.1:8778/',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#guest-enter').click();
   await page.waitForFunction(()=>document.body.classList.contains('guest-mode'),{timeout:20000});
   const intro=page.locator('#intro-screen');
   if(await intro.isVisible()){
    const skip=page.locator('#intro-silent');if(await skip.isVisible())await skip.click();
    await intro.waitFor({state:'hidden',timeout:20000});
   }
   const selectSpanish=async()=>{
    await page.locator('[data-nav="matieres"]:visible').first().click();
    await subject.locator('.matter-card').filter({hasText:'Espagnol'}).first().click();
    if(!(await page.locator('#matieres > .pagehead').isHidden()))throw Error('Selection header still visible inside subject');
   };
   const openGroup=async(index)=>{
    await subject.locator('.spx-card[data-category="'+index+'"]').click();
   };
   await selectSpanish();
   if(await subject.locator('.spx-card').count()!==6)throw Error('6 Spanish groups required');
   if(await subject.locator('.spx-topic-svg').count()!==6)throw Error('Topic pictograms missing');
   const search=subject.locator('#spx-find');await search.fill('je suis');
   if(await subject.locator('#spx-results .spx-hit').count()===0)throw Error('Search result missing');
   await search.fill('');

   let lessonTotal=0;
   for(let group=0;group<6;group++){
    await openGroup(group);
    const lessonIds=await subject.locator('.spx-quick-easy').evaluateAll(nodes=>nodes.map(x=>x.dataset.easy));
    lessonTotal+=lessonIds.length;
    for(const id of lessonIds){
     const card=subject.locator('.spx-lesson-item').filter({has:page.locator('[data-easy="'+id+'"]')});
     const labels=await card.locator('.spx-quick-link').allTextContents();
     for(const must of ['1 · Leçon ENT','2 · Leçon simplifiée','3 · Je n’ai pas compris','Exercices d’entraînement · 5 × 10']){
      if(!labels.some(x=>x.includes(must)))throw Error(id+': missing shortcut '+must+'; available '+JSON.stringify(labels));
     }
     if(labels.some(x=>x.trim()==='Leçon'||x.includes('Je n’ai pas compris ?')))throw Error(id+': obsolete duplicate');
     await card.locator('[data-easy="'+id+'"]').click();
     if(!(await subject.locator('.spx-simplified-page').isVisible()))throw Error(id+': simplified lesson not opened');
     if(await subject.locator('.spx-words .spx-listen').count()!==10)throw Error(id+': translated spoken vocabulary incomplete');
     if(await subject.locator('.spx-simple-steps li').count()<2)throw Error(id+': simplified explanation not complete');
     await subject.locator('.spx-back').click();
     await subject.locator('[data-help="'+id+'"]').click();
     if(!(await subject.locator('.spx-personal-help').isVisible()))throw Error(id+': separate help not opened');
     if(await subject.locator('.spx-help-prompt').count()<2)throw Error(id+': prepared FAQ questions missing');
     await subject.locator('.spx-help-prompt').first().click();
     if(!(await subject.locator('#spx-help-result .spx-help-answer').isVisible()))throw Error(id+': FAQ does not answer');
     await subject.locator('.spx-back').click();
    }
    await subject.locator('.spx-back').click();
   }
   if(lessonTotal!==15)throw Error('Expected 15 sublessons, got '+lessonTotal);
   await page.screenshot({path:path.join(out,device+'-nouvelle-organisation.png'),fullPage:true});
   await openGroup(0);
   await subject.locator('[data-help="L09"]').click();
   await subject.locator('#spx-help-input').fill('Pourquoi yo hablo et pas yo habla ?');
   await subject.locator('#spx-help-send').click();
   if(!(await subject.locator('#spx-help-result').innerText()).includes('yo (je)'))throw Error('Specific question not answered about verb ending');
   await subject.locator('#spx-help-input').fill('Une question hors de cette leçon, complètement inconnue');
   await subject.locator('#spx-help-send').click();
   if(!(await subject.locator('#spx-help-result').innerText()).includes('pas trouvé'))throw Error('Unknown question must not invent an answer');
   await subject.locator('.spx-back').click();
   await subject.locator('[data-training="L09"]').click();
   if(!(await subject.locator('.spx-practice-page').isVisible()))throw Error('Training view missing');
   if(await subject.locator('[data-set]').count()!==5)throw Error('5 exercises required');
   const practice=await subject.locator('.spx-practice-page').innerText();
   if(!practice.includes('0 XP')||!practice.includes('10 questions'))throw Error('Practice description missing');
   await subject.locator('[data-set="0"]').click();
   for(let q=0;q<10;q++){
    if(!(await subject.locator('.spx-instruction-fr').isVisible()))throw Error('French question translation missing');
    await subject.locator('#spx-explain').click();
    if(!(await subject.locator('#spx-action').isVisible()))throw Error('Guidance missing');
    await subject.locator('.spx-option').first().click();
    await subject.locator('#spx-submit').click();
    if(!(await subject.locator('.spx-feedback').isVisible()))throw Error('Correction missing');
    await subject.locator('#spx-next').click();
   }
   if(!(await subject.locator('#spx-repeat').isVisible()))throw Error('End-of-series repeat missing');
   await subject.locator('#spx-repeat').click();
   if(!(await subject.locator('.spx-option').first().isVisible()))throw Error('Repeat exercise failed');
   await subject.locator('.spx-back').click();
   if(!(await subject.locator('.spx-practice-page').isVisible()))throw Error('Back from quiz must go to training list');
   await subject.locator('.spx-back').click();
   await subject.locator('[data-ent-exercises="L13"]').click();
   if(!(await subject.locator('.spx-ent-translations').isVisible()))throw Error('ENT exercise extracts not displayed');
   if(!(await subject.locator('.spx-ent-item').count()))throw Error('ENT original excerpt missing');
   await subject.locator('.spx-back').click();
   await subject.locator('[data-course="L09"]').click();
   if(!(await page.locator('#lesson-detail .lesson-type-label.ent').isVisible()))throw Error('ENT course shortcut not opening original');
   await selectSpanish();
   await openGroup(4);
   await subject.locator('[data-easy="L05"]').click();
   if(!(await subject.locator('.tim-letter-panel').isVisible()))throw Error('Original letter panel must remain within L05');
   if(await subject.locator('.tim-letter-original').count())throw Error('Guest must not see private letter');
   if(errors.length)throw Error('Browser JS errors: '+errors.join(' / '));
   await page.screenshot({path:path.join(out,device+'-lettre-simplifiee.png'),fullPage:true});
   console.log('OK '+device+': 6 groups, 15x3 lesson levels, ENT, help, 5x10 exercises, no XP');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
