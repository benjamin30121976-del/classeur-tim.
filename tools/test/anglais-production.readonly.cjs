'use strict';
/* Anglais 3e — vérification en lecture seule de la production privée.
   Aucune écriture de note, tentative ou XP ; essai Parent uniquement. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const email=process.env.TIM_PARENT_EMAIL,password=process.env.TIM_PARENT_PASSWORD;
(async()=>{
 assert(email&&password,'Identifiants du compte Parent absents dans les secrets CI.');
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
 try{
  await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&Boolean(window.__TIM_DATA)&&Boolean(window.__TIM_BRIDGE?.englishTrainingTask),null,{timeout:60000});
  // L'animation démarre avec un léger décalage après l'authentification.
  // Attendre son apparition avant de cliquer sur le bouton prévu par l'app.
  await page.locator('#intro-screen').waitFor({state:'visible',timeout:9000}).catch(()=>{});
  if(await page.locator('#intro-screen').isVisible()){
   await page.locator('#intro-skip').click({timeout:9000});
   await page.locator('#intro-screen').waitFor({state:'hidden',timeout:10000});
  }
  const report=await page.evaluate(async()=>{
   const pack=window.TIM_ANGLAIS_PACK,bridge=window.__TIM_BRIDGE;
   if(!pack||!bridge?.attachments||!bridge?.englishTrainingPreviewSubmit)throw Error('Anglais ou connexion privée non chargé.');
   const courses=pack.lessons.filter(x=>x.id.startsWith('EN_ENT_'));
   const bis=pack.bis||[],docs=pack.attachments||[],homework=pack.homework||[];
   const missing=[];
   for(const target of [...new Set(docs.map(x=>x.target))]){
    const found=await bridge.attachments.list('lesson',target);
    for(const wanted of docs.filter(x=>x.target===target)){
     if(!found.some(x=>x.fileName===wanted.name))missing.push(wanted.name);
    }
   }
   const before=await bridge.englishTrainingProgress();
   const taskData=await bridge.englishTrainingTask('ENQ_L07_01');
   const task=taskData?.task;
   if(!task||task.questions?.length!==10)throw Error('L’exercice du prétérit BE-ING n’est pas disponible.');
   const leaked=task.questions.some(q=>['right','expected','explanation','accepted'].some(k=>Object.hasOwn(q,k)));
   const answers=task.questions.map(q=>q.kind==='qcm'?0:'réponse volontairement incorrecte');
   const preview=await bridge.englishTrainingPreviewSubmit(task.id,answers,task.bankVersion);
   const after=await bridge.englishTrainingProgress();
   return {courses:courses.length,bis:bis.length,attachments:docs.length,missing,homework:homework.length,
    questions:task.questions.length,leaked,practice:preview.practice,saved:preview.saved,
    xp:preview.xp,score:preview.score,items:preview.items?.length,
    hasExplanations:preview.items?.every(i=>typeof i.explanation==='string'&&i.explanation.length>8),
    before:JSON.stringify(before?.attempts||[]),after:JSON.stringify(after?.attempts||[])};
  });
  assert.equal(report.courses,22);
  assert.equal(report.bis,7);
  assert.equal(report.attachments,9);
  assert.deepEqual(report.missing,[]);
  assert.equal(report.homework,17);
  assert.equal(report.questions,10);
  assert.equal(report.leaked,false);
  assert.equal(report.practice,true);
  assert.equal(report.saved,false);
  assert.equal(report.xp,0);
  assert.equal(report.items,10);
  assert.equal(report.hasExplanations,true);
  assert.equal(report.before,report.after,'Un essai Parent ne doit pas créer de copie Tim.');
  // Contrôle réel de l’interface, sans valider d’exercice.
  await page.locator('[data-nav="home"]').first().click();
  const homeButtons=page.locator('#home-content .english-home-quick button');
  assert.equal(await homeButtons.count(),2,'Deux raccourcis anglais doivent être visibles sur Accueil.');
  const homepage=await page.locator('#home-content .english-home-quick').innerText();
  assert.match(homepage,/Prétérit simple et BE-ING/,'Un exercice précis doit être accessible depuis Accueil.');
  const state=await page.evaluate(()=>({
   status:window.__TIM_CHALLENGES?.dailyBankStatus,
   summary:document.querySelector('.daily-loup-summary')?.textContent||''
  }));
  if(state.status==='four-subjects')assert.match(state.summary,/Anglais.*espagnol.*maths.*physique-chimie/i);
  await homeButtons.first().click();
  assert.equal(await page.locator('#exercise-list .pc-exercise-lesson').count(),5,
   'Les cinq chapitres d’anglais doivent figurer dans Exercices.');
  assert.equal(await page.locator('#exercise-list .pc-exercise-lesson .tile').count(),11,
   'Les 11 exercices anglais doivent être directement cliquables.');
  assert.equal(await page.locator('#exercise-list .pc-official-ent-list details').count(),8,
   'Les 9 pièces ENT sont réparties sur 8 séances datées.');
  const consignes=page.locator('#exercise-list details').filter({hasText:'Consignes et devoirs de l’ENT'});
  assert.equal(await consignes.count(),1,'Les 17 consignes ENT doivent rester distinguées des tests BIS.');
  await page.locator('#exercise-list .pc-exercise-lesson .tile').last().click();
  await page.locator('#exercise-detail .tim-es-question-page').waitFor({timeout:20000});
  assert.match(await page.locator('#exercise-detail').innerText(),/Question 1 sur 10/);
  assert.equal(await page.locator('#exercise-detail .pc-confirm').count(),0,
   'Aucune validation ne doit être déclenchée par le test.');
  // Vérifier que le renvoi depuis une correction d'anglais ouvre une seule
  // séance BIS dans le bon chapitre, plutôt que toutes les séances.
  const pedagogic=await page.evaluate(()=>{
   window.TIM_PEDAGOGY_NAVIGATE('Anglais','EN_BIS07');
   const view=document.getElementById('matieres-content');
   const expanded=[...view.querySelectorAll('details.chapter-section[open]')];
   const courses=[...view.querySelectorAll('details.tim-es-lesson[open]')];
   return {matterActive:document.getElementById('matieres').classList.contains('active'),
    chapter:expanded[0]?.querySelector('summary')?.textContent||'',
    expandedChapters:expanded.length,expandedLessons:courses.length,
    selectedTab:courses[0]?.querySelector('div.lesson-tabs button[data-tab="bis"]')?.style.background||''};
  });
  assert.equal(pedagogic.matterActive,true,'Le lien doit ouvrir la matière Anglais.');
  assert.match(pedagogic.chapter,/Actions passées et simultanéité/);
  assert.equal(pedagogic.expandedChapters,1);
  assert.equal(pedagogic.expandedLessons,1);
  console.log('ANGLAIS RENVOI OK : correction → leçon BIS prétérit BE-ING, un seul cours ouvert.');
  console.log('ANGLAIS INTERFACE OK : Accueil, 11 exercices détaillés, 9 documents ENT sur 8 séances, questionnaire ouvrable sans validation.');
  console.log('ANGLAIS PRODUCTION OK : 22 cours ENT, 7 BIS, 17 devoirs, 9 documents privés, 10 réponses corrigées sans enregistrer de note/XP.');
 }finally{await page.close();await browser.close();}
})().catch(e=>{console.error('ÉCHEC CONTRÔLE ANGLAIS : '+String(e?.message||e));process.exitCode=1;});
