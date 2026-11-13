'use strict';
// Audit parent en lecture seule : jamais de soumission ni de modification de copies.
const {chromium}=require('playwright');
const {readFileSync,existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const EMAIL=process.env.TIM_PARENT_EMAIL,PASSWORD=process.env.TIM_PARENT_PASSWORD;
const ID='10099~6400554';
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
  // Diagnostic en lecture seule des fonctions déjà déployées pour les exercices.
  // Aucun appel submit/preview et aucune réponse ou note personnelle affichée.
  if(name==='ordinateur'){
   const backend=await page.evaluate(async()=>{
    const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
    const {getFunctions,httpsCallable}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-functions.js');
    const api=getFunctions(getApp(),'europe-west1');
    const check=async(id)=>{
      try{const res=await httpsCallable(api,'getSpanishEntTrainingTask')({id});
       return {ok:Boolean(res.data?.task),questions:res.data?.task?.questions?.length||0};
      }catch(e){return {ok:false,error:String(e?.code||e?.message||e).slice(0,95)};}
    };
    return {lessonL14:Boolean(window.__TIM_DATA?.lessons?.find(x=>x.id==='L14')),
      known:await check('ESE_L13_01'),newLesson:await check('ESE_L14_01')};
   });
   console.log('DIAGNOSTIC L14 / fonctions Firebase déjà publiées : '+JSON.stringify(backend));
  }
  const original=await page.evaluate(async()=>{
   const pdfs=await window.__TIM_BRIDGE.attachments.list('lesson','ENTESP_2026');
   return {teacherPdf:pdfs.some(x=>x.fileName==='4 EECEno empiezo las clases en septiembre.pdf')};
  });
  for(const file of ['espagnol-bis-ent-data.js','espagnol-simplifie.js','espagnol-cours-12nov.js','espagnol-ent-exact.js']){
   await page.addScriptTag({content:readFileSync(file,'utf8')});
  }
  const structure=await page.evaluate(()=>({
   total:window.TIM_SPANISH_SIMPLIFIED?.lessons?.length,
   bis:!!window.TIM_SPANISH_ENT_BIS?.getLesson?.('10099~6400554')
  }));
  assert.equal(structure.total,14);
  assert.equal(structure.bis,true);
  if(name==='ordinateur'){
   const ids=['ESE_L14_01','ESE_L14_02','ESE_L14_03'];
   const check=await page.evaluate(async ids=>{
    const exercises=window.__TIM_DATA?.exercises||[];
    const saved=ids.map(id=>exercises.find(ex=>ex.id===id));
    if(saved.some(x=>x?.questions?.length!==10))return {present:saved.filter(x=>x?.questions?.length===10).length,taskLength:0};
    const first=await window.__TIM_BRIDGE.spanishEntTrainingTask(ids[0]);
    return {present:saved.length,taskLength:first.task?.questions?.length||0,
     noOriginalAnswers:first.task?.questions?.every(q=>!('right'in q)&&!('expected'in q))};
   },ids);
   assert.equal(check.present,3,'Les trois exercices importés sont masqués dans la version V16.');
   assert.equal(check.taskLength,10,'L’exercice 14 ne se charge pas depuis Firestore.');
   assert.equal(check.noOriginalAnswers,true,'La lecture publique de la fiche contient des réponses.');
   const {nov12ForParentImport}=await import('../../functions/spanish-nov12-training.mjs');
   for(const exercise of nov12ForParentImport()){
    const answers=exercise.questions.map(q=>q.type==='mc'?Number(q.right):String(q.right));
    const translated=Array(10).fill(false);translated[0]=true;translated[7]=true;
    const report=await page.evaluate(async ({id,answers,translated})=>
     window.__TIM_BRIDGE.spanishEntTrainingPreview(id,answers,translated),{id:exercise.id,answers,translated});
    assert.equal(report.practice,true);
    assert.equal(report.saved,false);
    assert.equal(report.score,10);
    assert.equal(report.translationHelpCount,2);
    assert.equal(report.items?.length,10);
   }
   console.log('PASS Parent : 3 exercices du 12 novembre visibles, 30 corrections 10/10 simulées, compteur 2/10 vérifié, aucune note ni XP enregistrés.');
  }
  // Passer complètement l'animation AVANT de naviguer vers la matière,
  // car le bouton "Passer" peut lui-même renvoyer à l'accueil.
  await page.evaluate(()=>document.getElementById('intro-skip')?.click());
  await page.locator('#intro-screen').waitFor({state:'hidden',timeout:16000});
  await page.evaluate(()=>window.TIM_PEDAGOGY_NAVIGATE('Espagnol', '10099~6400554'));
  const card=page.locator('#matieres-content .tim-es-lesson').filter({hasText:'Leçon 14'}).first();
  await card.waitFor({state:'visible',timeout:16000});
  assert.match(await card.locator('summary').first().textContent(),/12 novembre/);
  if(!await card.evaluate(node=>node.open))await card.locator('summary').first().click();
  await card.locator('.tim-es-quick-links').waitFor({state:'visible',timeout:16000});
  await card.getByRole('button',{name:'1 · Leçon ENT'}).click();
  await card.getByText('Texte de Mme Gonzalez dans l’ENT').waitFor({state:'visible',timeout:15000});
  await card.getByText('Devoir pour mardi 17 novembre',{exact:false}).waitFor({state:'visible',timeout:20000});
  assert((await card.textContent()).includes('terminar la fotocopia'));
  await card.getByRole('button',{name:'3 · Je n’ai pas compris'}).click();
  assert.equal(await card.locator('.tim-es-course-help').getAttribute('open'),'');
  await card.locator('.tim-es-exercises > summary').click();
  assert.equal(await card.locator('button[data-es-training-id]').count(),3);
  await page.waitForFunction(()=>{
   const node=[...document.querySelectorAll('#matieres-content .tim-es-lesson')]
    .find(x=>x.textContent.includes('Leçon 14'));
   const state=node?.querySelector('.tim-es-exercises [role="status"]');
   return state&&(/Exercices disponibles|n’est pas encore activée/.test(state.textContent));
  },null,{timeout:18000});
  const activation=await card.locator('.tim-es-exercises [role="status"]').textContent();
  const disabled=await card.locator('button[data-es-training-id]').evaluateAll(xs=>xs.every(x=>x.disabled));
  assert(disabled ? /n’est pas encore activée/.test(activation) : /Exercices disponibles/.test(activation));
  if(original.teacherPdf){
   await card.getByRole('button',{name:'1 · Leçon ENT'}).click();
   await card.locator('.pc-inline-pdf').first().waitFor({state:'visible',timeout:20000});
  }else{
   console.log(name+' : PDF groupe A non encore installé dans Firebase privé.');
  }
  assert.equal(popups,0);
  console.log('PASS '+name+' : leçon 14 intégrée, ENT, BIS, aide et 3 exercices sans soumission.');
 }finally{await context.close();}
}
(async()=>{
 assert(EMAIL&&PASSWORD,'Accès Parent manquant');
 const c=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(c?{executablePath:c}:{})});
 try{await check(browser,'ordinateur',{width:1280,height:840});
     await check(browser,'telephone',{width:390,height:844});}
 finally{await browser.close();}
})().catch(e=>{console.error('ECHEC AUDIT ESPAGNOL 14 : '+String(e?.message||e).slice(0,1200));process.exitCode=1;});
