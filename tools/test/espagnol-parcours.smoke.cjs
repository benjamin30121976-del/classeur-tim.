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
     for(const must of ['1 · Leçon ENT','2 · Leçon simplifiée','3 · Je n’ai pas compris','Exercices d’entraînement · 10 × 10']){
      if(!labels.some(x=>x.includes(must)))throw Error(id+': missing shortcut '+must+'; available '+JSON.stringify(labels));
     }
     if(labels.some(x=>x.trim()==='Leçon'||x.includes('Je n’ai pas compris ?')))throw Error(id+': obsolete duplicate');
     await card.locator('[data-easy="'+id+'"]').click();
     if(!(await subject.locator('.spx-simplified-page').isVisible()))throw Error(id+': simplified lesson not opened');
     if(await subject.locator('.spx-words .spx-listen').count()!==10)throw Error(id+': translated spoken vocabulary incomplete');
     if(await subject.locator('.spx-simple-steps li').count()<2)throw Error(id+': simplified explanation not complete');
     if(await subject.locator('.spx-understand-guide li').count()<3)throw Error(id+': guided steps missing');
     if(await subject.locator('.spx-microtask').count()!==3)throw Error(id+': three free situations expected');
     if(['L09','L10','L13','L15'].includes(id)&&await subject.locator('.spx-verb').count()===0)throw Error(id+': conjugation tables missing');
     await subject.locator('.spx-microtask .spx-micro-answer summary').first().click();
     if(!(await subject.locator('.spx-microtask .spx-micro-answer').first().innerText()).includes('Exemple de réponse'))throw Error(id+': free practice correction hidden');
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
   if(await subject.locator('.spx-training-item').count()!==10)throw Error('Expected five QCM and five writing exercises');
   const practice=await subject.locator('.spx-practice-page').innerText();
   if(!practice.includes('0 XP')||!practice.includes('une seule tentative'))throw Error('Training rules missing');
   if(await subject.locator('.spx-training-item:not(:disabled)').count()!==0)throw Error('Guest should not validate school exercises');
   // Navigateur de test : simule des réponses Firebase, sans écrire dans les données de Tim.
   await page.evaluate(()=>{
    window.__TIM_GUEST=false;window.__TIM_PARENT=false;
    window.__TIM_SPANISH_PROGRESS={status:'ok',attempts:[]};
    window.__TIM_BRIDGE={
      trainingProgress:async()=>window.__TIM_SPANISH_PROGRESS,
      trainingSubmit:async(id,answers)=>{
        const p=window.__TIM_SPANISH_PROGRESS;
        if(p.attempts.some(a=>a.id===id))throw Error('already-exists');
        const task=window.TIM_SPANISH_TRAINING_ENGINE.buildSpanishTasks(id,window.TIM_SPANISH_EDU);
        const report=window.TIM_SPANISH_TRAINING_ENGINE.evaluateSpanishTask(task,answers);
        p.attempts.push({...report,mode:task.mode,series:task.series,lessonId:task.lesson,submittedAt:new Date().toISOString(),xp:0});
        return {submitted:true,xp:0,cloudSaved:true};
      }
    };
   });
   await subject.locator('.spx-back').click();
   await subject.locator('[data-training="L09"]').click();
   await subject.locator('[data-training-id="SPQ_L09_01"]').click();
   if(await subject.locator('.spx-training-question').count()!==10)throw Error('10 multiple-choice questions required');
   if(await subject.locator('.spx-training-audio [data-say-speed="slow"]').count()!==10)throw Error('Normal/slow audio missing for Spanish source questions');
   for(let i=0;i<10;i++)await subject.locator('.spx-training-question').nth(i).locator('input[type="radio"]').first().check();
   await subject.locator('#spx-training-submit').click();
   await subject.locator('#spx-training-confirm').click();
   if(!(await subject.locator('.spx-training-score').isVisible()))throw Error('Score not displayed after permanent validation');
   if(await subject.locator('.spx-training-correction').count()!==10)throw Error('Ten reviewed answers missing');
   if(!(await subject.locator('#spx-review-lesson').count())||!(await subject.locator('#spx-review-help').count()))throw Error('Targeted help links after errors missing');
   if(!await subject.locator('.spx-error-tip').count())throw Error('Error explanation absent');
   if(await subject.locator('#spx-training-submit').count())throw Error('Terminated task still submit-able');
   await subject.locator('#spx-training-return').click();
   if(!(await subject.locator('[data-training-id="SPQ_L09_01"]').innerText()).includes('Terminé'))throw Error('Persisted score not displayed');
   await subject.locator('[data-training-id="SPQ_L09_01"]').click();
   if(await subject.locator('.spx-training-question').count())throw Error('Completed task replayed');
   await subject.locator('#spx-training-return').click();
   await subject.locator('[data-training-id="SPW_L09_01"]').click();
   if(await subject.locator('.spx-training-question').count()!==10)throw Error('Ten written questions required');
   const correct=await page.evaluate(()=>window.TIM_SPANISH_TRAINING_ENGINE.buildSpanishTasks('SPW_L09_01',window.TIM_SPANISH_EDU).questions.map(q=>q.answer));
   for(let i=0;i<correct.length;i++)await subject.locator('[data-response="'+i+'"]').fill(correct[i]);
   await subject.locator('#spx-training-submit').click();
   await subject.locator('#spx-training-confirm').click();
   if(!(await subject.locator('.spx-training-score').innerText()).includes('10 / 10'))throw Error('Written answers wrongly corrected');
   await subject.locator('#spx-training-return').click();
   if(!(await subject.locator('.spx-training-status').innerText()).includes('2 / 10'))throw Error('One-time progress not displayed');
   await page.evaluate(()=>{
    const box=document.createElement('div');box.id='test-parent-spanish';document.body.append(box);
    window.__TIM_PARENT=true;
    window.TIM_SPANISH_TRAINING_UI.renderParentProgress(box);
   });
   if(!(await page.locator('#test-parent-spanish .spx-parent-diagnostic').isVisible()))throw Error('Parent diagnosis absent');
   if(!(await page.locator('#test-parent-spanish').innerText()).includes('Notions à revoir'))throw Error('Parent lacks prioritized difficulties');
   await page.evaluate(()=>{document.querySelector('#test-parent-spanish')?.remove();window.__TIM_PARENT=false;});
   await subject.locator('.spx-back').click();
   await subject.locator('[data-ent-exercises="L13"]').click();
   if(!(await subject.locator('.spx-ent-translations').isVisible()))throw Error('ENT exercise extracts not displayed');
   if(!(await subject.locator('.spx-ent-item').count()))throw Error('ENT original excerpt missing');
   await subject.locator('.spx-back').click();
   await subject.locator('[data-course="L09"]').click();
   if(!(await page.locator('#lesson-detail .lesson-type-label.ent').isVisible()))throw Error('ENT course shortcut not opening original');
   // Mode local transitoire (simulateur de Firebase indisponible) : Tim peut travailler
   // sans faux enregistrement distant, puis les résultats se synchronisent plus tard.
   await selectSpanish();
   await openGroup(0);
   await page.evaluate(()=>{window.__TIM_SPANISH_PROGRESS={status:'unavailable',attempts:[],message:'Firebase en attente'};});
   await subject.locator('[data-training="L09"]').click();
   if(!(await subject.locator('.spx-training-warning').first().innerText()).includes('Mode provisoire'))throw Error('Offline warning missing');
   await subject.locator('[data-training-id="SPW_L09_02"]').click();
   const written=await page.evaluate(()=>window.TIM_SPANISH_TRAINING_ENGINE.buildSpanishTasks('SPW_L09_02',window.TIM_SPANISH_EDU).questions.map(q=>q.answer));
   for(let i=0;i<10;i++)await subject.locator('[data-response="'+i+'"]').fill(written[i]);
   await subject.locator('#spx-training-submit').click();
   await subject.locator('#spx-training-confirm').click();
   if(!(await subject.locator('.spx-training-score').innerText()).includes('sur cet appareil'))throw Error('Offline grade presented as cloud-saved');
   await subject.locator('#spx-training-return').click();
   if(!(await subject.locator('[data-training-id="SPW_L09_02"]').innerText()).includes('Terminé'))throw Error('Offline result did not lock exercise');
   const localRecord=await page.evaluate(()=>JSON.parse(localStorage.getItem('tim_spanish_training_completed_local_v1')||'{}').SPW_L09_02);
   if(!localRecord?.localOnly||localRecord.score!==10)throw Error('Offline result not stored locally');
   await page.evaluate(()=>{window.__TIM_SPANISH_PROGRESS={status:'ok',attempts:[]};});
   await subject.locator('.spx-back').click();
   await subject.locator('[data-training="L09"]').click();
   await page.waitForFunction(()=>!!window.__TIM_SPANISH_PROGRESS?.attempts?.find(a=>a.id==='SPW_L09_02'),{timeout:5000});
   if(!await page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('tim_spanish_training_completed_local_v1')||'{}').SPW_L09_02;return Boolean(x?.cloudSaved&&!x.localOnly&&x.items?.length===10);}))throw Error('Synced local result or its correction lost');
   await selectSpanish();
   await openGroup(4);
   await subject.locator('[data-easy="L05"]').click();
   if(!(await subject.locator('.tim-letter-panel').isVisible()))throw Error('Original letter panel must remain within L05');
   if(await subject.locator('.tim-letter-original').count())throw Error('Guest must not see private letter');
   if(errors.length)throw Error('Browser JS errors: '+errors.join(' / '));
   await page.screenshot({path:path.join(out,device+'-lettre-simplifiee.png'),fullPage:true});
   console.log('OK '+device+': 15x3 lesson levels, 10 unique tasks per lesson, writing, marking, ENT, no XP');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
