'use strict';
/* Diagnostic ciblé en lecture seule de l'affichage Parent.
   Ne soumet aucun exercice, ne modifie aucune collection et ne journalise
   ni notes, ni réponses, ni données d'authentification. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {existsSync}=require('node:fs');
const email=process.env.TIM_PARENT_EMAIL;
const password=process.env.TIM_PARENT_PASSWORD;
const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
(async()=>{
 assert(email&&password,'Secrets Parent indisponibles.');
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  let extensionWarning=false,jsErrors=0,apiWriteBlocked=0;
  page.on('console',msg=>{
   if(msg.type()==='warning'&&msg.text().includes('Extensions indisponibles'))extensionWarning=true;
   if(msg.type()==='error')jsErrors++;
  });
  page.on('pageerror',()=>{jsErrors++;});
  await page.route('**/api/tim',async route=>{
   let payload={};try{payload=route.request().postDataJSON()||{};}catch{}
   if(/^(submit|import|release|set|delete|reset|assign)/i.test(String(payload.action||''))){
    apiWriteBlocked++;return route.abort('blockedbyclient');
   }
   return route.continue();
  });
  await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  let loaded=false;
  try{await page.waitForFunction(()=>document.body.classList.contains('ready'),null,{timeout:60000});loaded=true;}catch{}
  const ui=await page.evaluate(()=>({
   ready:document.body.classList.contains('ready'),
   parent:window.__TIM_PARENT===true,
   dataReady:!!window.__TIM_DATA,
   lessonsCount:window.__TIM_DATA?.lessons?.length||0,
   exercisesCount:window.__TIM_DATA?.exercises?.length||0,
   hasNewLesson:!!window.__TIM_DATA?.lessons?.some(x=>x.id==='BD16_HG_CAHIER'),
   hasNewExercise:!!window.__TIM_DATA?.exercises?.some(x=>x.id==='BD1611_HG02'),
   hasOldExercise:!!window.__TIM_DATA?.exercises?.some(x=>x.id==='BD1611_HG01')
  }));
  const dbResult=await page.evaluate(async()=>{
   try{
    const [{getApp},{getFirestore,doc,getDoc,collection,getDocs}]=await Promise.all([
     import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),
     import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js')
    ]);
    const db=getFirestore(getApp());
    const [l,e]=await Promise.allSettled([
     getDoc(doc(db,'lessons','BD16_HG_CAHIER')),
     getDoc(doc(db,'exercises','BD1611_HG02'))
    ]);
    const [ls,es]=await Promise.allSettled([
     getDocs(collection(db,'lessons')),
     getDocs(collection(db,'exercises'))
    ]);
    const brief=x=>x.status==='fulfilled'?{ok:true,count:x.value.size}:{ok:false,code:String(x.reason?.code||'erreur').slice(0,40)};
    return {
     lessonDocument:l.status==='fulfilled'?l.value.exists():null,
     exerciseDocument:e.status==='fulfilled'?e.value.exists():null,
     lessonDirectError:l.status==='rejected'?String(l.reason?.code||'erreur').slice(0,40):null,
     exerciseDirectError:e.status==='rejected'?String(e.reason?.code||'erreur').slice(0,40):null,
     lessonCollection:brief(ls),exerciseCollection:brief(es)
    };
   }catch(e){return {error:String(e?.code||e?.message||'initialisation').slice(0,80)};}
  });
  console.log('DIAGNOSTIC_PARENT_HG_LECTURE_SEULE '+JSON.stringify({ui,db:dbResult,extensionWarning,jsErrors,apiWriteBlocked,loaded}));
  assert.equal(ui.parent,true,'Session Parent non autorisée');
  assert.equal(dbResult.lessonDocument,true,'La nouvelle fiche Firestore doit exister');
  assert.equal(dbResult.exerciseDocument,true,'Le nouveau bonus Firestore doit exister');
  // Contrôle visuel ciblé du site réellement publié : aucune réponse saisie.
  if(await page.locator('#intro-screen').isVisible().catch(()=>false)){
   const skip=page.locator('#intro-skip');
   if(await skip.isVisible())await skip.click();
   await page.locator('#intro-screen').waitFor({state:'hidden',timeout:12000});
  }
  await page.locator('[data-nav="home"]:visible').first().click({timeout:15000});
  await page.getByRole('button',{name:/Ouvrir mes exercices bonus/i}).click({timeout:15000});
  const tiles=page.locator('#exercise-list .homework-bonus-card');
  const newCard=tiles.filter({hasText:/Les cinq idées nazies à définir/i});
  const oldCard=tiles.filter({hasText:/Cinq notions à définir/i});
  const cards={total:await tiles.count(),newCount:await newCard.count(),oldCount:await oldCard.count()};
  assert.equal(cards.newCount,1,'Le nouveau bonus ne figure pas dans « Bonus devoirs ».');
  await newCard.click({timeout:15000});
  const d=page.locator('#exercise-detail.active');
  const detail={
   visible:await d.isVisible(),
   questions:await d.locator('.q').count(),
   title:await d.locator('.homework-detail-hero h2').textContent()
  };
  assert(detail.visible);
  assert.equal(detail.questions,10);
  assert.match(detail.title,/cinq idées nazies/i);
  const courses=d.locator('details.homework-detail-courses');
  if(!(await courses.isVisible()))throw Error('Lien vers la leçon BIS absent');
  await courses.locator('summary').click();
  await courses.getByRole('button',{name:/Leçon BIS correspondante/i}).click({timeout:15000});
  const bis=await page.locator('#matieres-content').innerText();
  assert(/antiparlementaire/i.test(bis),'Le cours HG BIS enrichi n’est pas ouvert.');
  console.log('BONUS_HG_REEL_CHROMIUM '+JSON.stringify({cards,detail,lessonOpened:true,noAnswerSubmitted:true}));
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error('Diagnostic bonus Parent incomplet : '+String(e?.message||e).slice(0,230));process.exitCode=1;});
