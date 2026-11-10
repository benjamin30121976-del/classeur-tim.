'use strict';
// Suppression strictement limitée aux 28 anciens exercices courts E01 à E28.
// Aucun résultat, XP, corrigé ou exercice SPQ n'est touché. Secrets masqués GitHub Actions.
const {chromium}=require('playwright');
const mode=process.env.NETTOYAGE_MODE||'inspect';
if(!['inspect','execute'].includes(mode))throw Error('Mode inconnu');
(async()=>{
 const email=process.env.TIM_PARENT_EMAIL,password=process.env.TIM_PARENT_PASSWORD;
 if(!email||!password)throw Error('Secrets Parent absents');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1180,height:820},locale:'fr-FR'});
  const r=await page.goto('https://classeur-tim-v16.pages.dev/',{waitUntil:'domcontentloaded',timeout:45000});
  if(!r?.ok())throw Error('Site indisponible');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,null,{timeout:50000});
  const result=await page.evaluate(async mode=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,doc,getDoc,getDocs,collection,runTransaction,deleteDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const db=getFirestore(getApp()),mainRef=doc(db,'content','main');
   const [main,extras,attempts,privateAttempts]=await Promise.all([
    getDoc(mainRef),getDocs(collection(db,'exercises')),
    getDocs(collection(db,'attempts')),getDocs(collection(db,'privateAttempts'))
   ]);
   if(!main.exists()||!Array.isArray(main.data().exercises))throw Error('Catalogue principal absent');
   const wanted=new Set(Array.from({length:28},(_,i)=>'E'+String(i+1).padStart(2,'0')));
   const oldMain=main.data().exercises.filter(e=>wanted.has(String(e?.id||'')));
   const oldExtra=extras.docs.filter(d=>wanted.has(d.id));
   const used=[...attempts.docs,...privateAttempts.docs].filter(d=>wanted.has(d.id));
   const beforeSPQ=privateAttempts.docs.filter(d=>d.id==='SPQ_L01_01').length;
   const report={mode,oldMain:oldMain.length,oldExtra:oldExtra.length,used:used.length,spqKept:beforeSPQ,remaining:main.data().exercises.length-oldMain.length,
    oldIds:oldMain.map(e=>e.id).sort(),oldQuestionSizes:oldMain.map(e=>e.questions?.length||0).sort((a,b)=>a-b)};
   if(mode==='inspect')return report;
   if(oldMain.length!==28||new Set(oldMain.map(e=>e.id)).size!==28||used.length!==0||
      oldMain.some(e=>e.subject&&e.subject!=='Espagnol')||
      oldMain.some(e=>!(Array.isArray(e.questions)&&e.questions.length>=1&&e.questions.length<=5)))
      throw Error('Sécurité : les 28 anciens exercices ne correspondent pas exactement au lot prévu. Aucune suppression.');
   await runTransaction(db,async tx=>{
    const current=await tx.get(mainRef);
    if(!current.exists()||!Array.isArray(current.data().exercises))throw Error('Catalogue modifié');
    const currentOld=current.data().exercises.filter(e=>wanted.has(String(e?.id||'')));
    if(currentOld.length!==28)throw Error('Le lot a changé avant suppression');
    tx.update(mainRef,{exercises:current.data().exercises.filter(e=>!wanted.has(String(e?.id||'')))});
   });
   for(const d of oldExtra)await deleteDoc(d.ref);
   const [after,restExtras,stillSPQ]=await Promise.all([
     getDoc(mainRef),getDocs(collection(db,'exercises')),getDoc(doc(db,'privateAttempts','SPQ_L01_01'))
   ]);
   const left=after.data().exercises.filter(e=>wanted.has(String(e?.id||''))).length;
   const leftoverDocs=restExtras.docs.filter(d=>wanted.has(d.id)).length;
   if(left||leftoverDocs||Boolean(beforeSPQ)!==stillSPQ.exists())throw Error('Lecture de confirmation incohérente');
   return {...report,removedFromMain:28,removedFromExtra:oldExtra.length,left,remainingExtra:leftoverDocs,confirmed:true};
  },mode);
  console.log('AUDIT ANCIENS EXERCICES : '+JSON.stringify(result));
  if(mode==='execute'&&!result.confirmed)throw Error('Suppression non confirmée');
 }finally{await browser.close()}
})().catch(err=>{console.error('ECHEC NETTOYAGE : '+String(err.message||err).slice(0,240));process.exit(1)});
