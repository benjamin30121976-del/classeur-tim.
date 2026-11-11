/* Contrôle de production du classeur : zéro écriture Firebase, zéro note nominative publiée. */
'use strict';
const {chromium}=require('playwright');
const URL='https://classeur-tim-v16.pages.dev';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function getStatus(){
 const r=await fetch(URL+'/api/status',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('statut api http '+r.status);
 const d=await r.json();
 if(d.platform!=='cloudflare-pages'||d.available!==true)throw Error('api pas encore activée '+JSON.stringify({platform:d.platform,available:d.available}));
 return d;
}
(async()=>{
 let activated=false;
 for(let i=0;i<45;i++){
  try{await getStatus();activated=true;break;}catch(e){
   if(i%6===0)console.log('Contrôle publication : serveur non confirmé, tentative '+(i+1));
   await pause(6000);
  }
 }
 if(!activated)throw Error('Le serveur Cloudflare ne signale pas encore son activation. Vérifier le dernier déploiement.');
 console.log('OK : API Cloudflare en production, secret détecté.');

 const perfectDisplay=[
  ['espagnol-simplifie.js','Aucune correction nécessaire'],
  ['app.js','aucune correction nécessaire'],
  ['maths-parcours.js','Aucune correction nécessaire'],
  ['espagnol-training-ui.js','Aucune correction nécessaire']
 ];
 for(const [file,phrase] of perfectDisplay){
  let matched=false;
  for(let pass=0;pass<12;pass++){
   const r=await fetch(URL+'/'+file+'?verification=perfect-20261110',{cache:'no-store'});
   if(r.ok&&(await r.text()).includes(phrase)){matched=true;break;}
   await pause(5000);
  }
  if(!matched)throw Error('Version publiée non confirmée pour '+file);
 }
 console.log('OK : les quatre interfaces de résultat sans correction pour une note parfaite sont publiées sur Cloudflare.');
 const guest=await fetch(URL+'/api/tim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'getParentReport',payload:{}})});
 if(guest.status!==401)throw Error('Accès anonyme inattendu '+guest.status);
 console.log('OK : l’API refuse les connexions anonymes.');
 const source=await fetch(URL+'/worker/auth.mjs');
 if(source.status!==404)throw Error('Source interne exposée : '+source.status);
 console.log('OK : modules privés non accessibles.');
 if(!process.env.TIM_PARENT_EMAIL||!process.env.TIM_PARENT_PASSWORD)throw Error('Secrets de connexion Parent absents de GitHub.');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  const response=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response?.ok())throw Error('Le classeur public ne répond pas.');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
  await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,{timeout:50000});
  const checks=await page.evaluate(async()=>{
    const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
    const {getAuth}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js');
    const user=getAuth(getApp()).currentUser;
    if(!user)throw Error('Connexion Firebase Parent absente');
    const token=await user.getIdToken();
    async function call(action){
      const response=await fetch('/api/tim',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action,payload:{}})});
      let data;
      try{data=await response.json();}catch{data={};}
      const attempts=Array.isArray(data?.data?.attempts)?data.data.attempts:null;
      return {status:response.status,code:data.error||'',count:attempts?.length??null,
        onlyExercise:action==='getParentReport'&&attempts?.length===1?{
          id:String(attempts[0].id||''),title:String(attempts[0].title||''),status:attempts[0].correctionStatus||''
        }:null};
    }
    return {report:await call('getParentReport'),forbidden:await call('getTimCourseContent')};
  });
  console.log('Contrôle Parent : HTTP '+checks.report.status+', notes présentes : '+checks.report.count+', erreur : '+(checks.report.code||'aucune'));
  if(checks.report.onlyExercise)console.log('IDENTIFICATION EXERCICE UNIQUE (sans note ni reponses) : '+JSON.stringify(checks.report.onlyExercise));
  if(checks.report.status!==200||!Number.isInteger(checks.report.count))throw Error('Lecture Parent via Cloudflare échouée (HTTP '+checks.report.status+', code '+checks.report.code+').');
  if(checks.forbidden.status!==403)throw Error('Protection du cours Tim incorrecte pour Parent : HTTP '+checks.forbidden.status);
  console.log('OK : compte Parent lit les notes et ne peut pas consulter les fonctions réservées à Tim.');

  // Vérifier la vraie lettre manuscrite privée, pas seulement le module visible.
  const letter=await page.evaluate(async()=>{
   const api=window.__TIM_BRIDGE?.attachments;
   if(!api||!window.TIM_SPANISH_LETTER)return {ready:false};
   const files=await api.list('lesson','L05');
   const matches=files.filter(x=>/lettre.*tim|tim.*lettre|manuscrite.*corrig|copie.*corrig/i.test(String(x.title||'')+' '+String(x.fileName||'')));
   const file=matches.find(x=>x.mime==='application/pdf')||matches.find(x=>String(x.mime).startsWith('image/'));
   if(!file)return {ready:true,exists:false,count:files.length};
   const blob=await api.read(file);
   return {ready:true,exists:true,count:files.length,mime:file.mime,
     isPdf:blob.type==='application/pdf',bytes:blob.size,integrity:blob.size===file.size,
     titleIsLetter:/lettre.*tim|tim.*lettre/i.test(String(file.title||'')+' '+String(file.fileName||''))};
  });
  console.log('AUDIT LETTRE CORRESPONDANT PRIVEE : '+JSON.stringify(letter));
  if(!letter.ready||!letter.exists||!letter.integrity||letter.bytes<1000)
    throw Error('La lettre originale de Tim ne peut pas être confirmée dans la leçon L05');
  console.log('OK : copie manuscrite privée liée à la leçon L05, fichier relu intégralement et vérifié.');

  // Audit transversal Parent : catalogue, progression et évaluations accessibles.
  const parentView=await page.evaluate(async()=>{
    const data=window.__TIM_DATA||{},bridge=window.__TIM_BRIDGE||{},lessons=data.lessons||[],exercises=data.exercises||[];
    const bySubject=(name)=>lessons.filter(x=>x.subject===name);
    const out={spanishLessons:bySubject('Espagnol').length,mathENT:bySubject('Mathématiques').filter(x=>/^M26S/.test(x.id||'')).length,
      mathBIS:bySubject('Mathématiques').filter(x=>/^MBIS/.test(x.id||'')).length,
      liveDaily:exercises.filter(e=>e.kind==='daily').length,
      saturday:exercises.filter(e=>e.kind==='weekly').length,
      sunday:exercises.filter(e=>e.kind==='sunday').length,
      failedMath:0,completeMath:0,spanishProgress:false,mathProgress:false};
    for(let i=1;i<=23;i++){
      try{const r=await bridge.mathTrainingTask('MT'+String(i).padStart(2,'0'));
        const q=r?.task?.questions||[];
        if(q.length===10&&q.every(x=>typeof x.prompt==='string'&&x.choices?.length===4&&!('correctIndex' in x)))out.completeMath++;
        else out.failedMath++;
      }catch{out.failedMath++;}
    }
    try{out.spanishProgress=Array.isArray((await bridge.spanishEntTrainingProgress())?.attempts);}catch{}
    try{out.mathProgress=Array.isArray((await bridge.mathTrainingProgress())?.attempts);}catch{}
    return out;
  });
  console.log('AUDIT PARENT GENERAL (lecture seule) : '+JSON.stringify(parentView));
  if(parentView.mathENT!==17||parentView.mathBIS!==23||parentView.completeMath!==23||parentView.failedMath||!parentView.spanishProgress||!parentView.mathProgress)
    throw Error('Parent : inventaire ou evaluations maths incomplets.');
  console.log('OK : Parent peut consulter maths 17 cours ENT, 23 BIS, 23 tests de 10 questions, et les suivis maths/espagnol.');

  // Tableau Parent : une seule liste, y compris le QCM historique de Tim.
  await page.waitForFunction(()=>typeof window.TIM_PARENT_UNIFIED?.render==='function',null,{timeout:16000});
  await page.evaluate(()=>{const el=document.querySelector('[data-nav="parent"]');if(el)el.click()});
  await page.locator('#parent-content .tim-parent-unified').waitFor({timeout:12000});
  await page.waitForFunction(()=>document.querySelector('#parent-content .tim-parent-unified .results-list')?.textContent?.includes('QCM 1'),null,{timeout:22000});
  const unified=await page.evaluate(()=>({
    visible:!!document.querySelector('#parent-content .tim-parent-unified'),
    historical:document.querySelector('#parent-content .tim-parent-unified .results-list')?.textContent?.includes('QCM 1'),
    total:document.querySelector('#parent-content .tim-parent-unified .results-list')?.querySelectorAll('article').length||0,
    export:!![...document.querySelectorAll('#parent-content .tim-parent-unified button')].find(b=>b.textContent?.includes('Exporter le bilan complet'))
  }));
  console.log('AUDIT TABLEAU PARENT UNIFIE : '+JSON.stringify(unified));
  if(!unified.visible||!unified.historical||!unified.export||unified.total<1)throw Error('Dashboard Parent centralisé incomplet');
  console.log('OK : le compte Parent retrouve le QCM historique, le filtre et l’export dans le tableau centralisé.');
  // Vérifier qu'une copie conservée est relisible avec ses dix réponses.
  const qcm=page.locator('#parent-content .tim-parent-unified article').filter({hasText:'QCM 1'}).first();
  await qcm.locator('summary').first().evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#parent-content .tim-parent-unified article details[open]')?.querySelectorAll('.separated').length===10,null,{timeout:18000});
  const saved=await page.evaluate(async()=>{
    const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
    const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
    const db=getFirestore(getApp()),main=await getDoc(doc(db,'content','main'));
    const expected=new Set([...Array.from({length:18},(_,i)=>'E'+String(i+1).padStart(2,'0')),...Array.from({length:10},(_,i)=>'R'+String(i+1).padStart(2,'0'))]);
    return {oldCount:(main.data()?.exercises||[]).filter(e=>expected.has(e.id)).length,
      storedQcm:(await getDoc(doc(db,'privateAttempts','SPQ_L01_01'))).exists(),
      readQuestions:document.querySelector('#parent-content .tim-parent-unified article details[open]')?.querySelectorAll('.separated').length||0};
  });
  console.log('AUDIT APRÈS NETTOYAGE : '+JSON.stringify(saved));
  if(saved.oldCount!==0||!saved.storedQcm||saved.readQuestions!==10)
   throw Error('Suppression anciens exercices ou copie QCM détaillée non confirmée');


  if(process.env.TIM_STUDENT_EMAIL&&process.env.TIM_STUDENT_PASSWORD){
   const timPage=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
   await timPage.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
   await timPage.locator('#tim-enter').click();
   await timPage.locator('#login-email').fill(process.env.TIM_STUDENT_EMAIL);
   await timPage.locator('#login-password').fill(process.env.TIM_STUDENT_PASSWORD);
   await timPage.locator('#login-button').click();
   await timPage.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===false&&!window.__TIM_GUEST,null,{timeout:50000});
   console.log('OK : connexion reelle au compte Tim reussie sur ecran de telephone.');
   // Le classeur presente une animation d'introduction devant la navigation.
   // La passer sans toucher au contenu ni a une tentative d'exercice.
   const intro=timPage.locator('#intro-screen');
   if(await intro.isVisible()){
     await timPage.locator('#intro-silent').click({timeout:8000});
     await intro.waitFor({state:'hidden',timeout:20000});
   }
   await timPage.waitForFunction(()=>typeof window.openLesson==='function' && !!document.querySelector('#home.page.active'),null,{timeout:15000});
   // Test de navigation par evenement DOM : evite les calques visuels temporaires (aucune ecriture).
   await timPage.locator('[data-nav="matieres"]').first().evaluate(el=>el.click());
   await timPage.locator('#matieres-content button.matter-espanol').first().waitFor({timeout:12000});
   await timPage.locator('#matieres-content button.matter-espanol').first().evaluate(el=>el.click());
   await timPage.locator('#matieres-content details.tim-es-lesson').first().waitFor({timeout:20000});
   const view=await timPage.evaluate(async()=>{
     const bridge=window.__TIM_BRIDGE;
     const cardCount=document.querySelectorAll('#matieres-content details.tim-es-lesson').length;
     const tasks={complete:0,invalid:0,blocked:0};
     for(let li=1;li<=13;li++)for(let i=1;i<=3;i++){
       const id='ESE_L'+String(li).padStart(2,'0')+'_0'+i;
       try{
         const response=await bridge.spanishEntTrainingTask(id);
         const q=response?.task?.questions||[];
         if(q.length===10&&q.every(item=>typeof item.instructionEs==='string'&&!('right' in item)&&!('expected' in item)&&!('answer' in item)))tasks.complete++;
         else tasks.invalid++;
       }catch{tasks.blocked++;}
     }
     let progress='inaccessible';
     try{const response=await bridge.spanishEntTrainingProgress();progress=Array.isArray(response?.attempts)?'accessible':'format-invalide';}catch{}
     let pdf={available:0,readable:0};
     try{
       const list=await bridge.attachments.list('lesson','ENTESP_2026');
       pdf.available=list.filter(x=>String(x.fileName||'').toLowerCase().endsWith('.pdf')).length;
       for(const item of list.filter(x=>String(x.fileName||'').toLowerCase().endsWith('.pdf'))){
         try{const blob=await bridge.attachments.read(item);if(blob.size>0&&(await blob.slice(0,5).text())==='%PDF-')pdf.readable++;}catch{}
       }
     }catch(e){pdf.error=String(e?.code||e?.message||e).slice(0,120);}
     return {cardCount,tasks,progress,pdf};
   });
   console.log('AUDIT COMPTE TIM (lecture seule) : '+JSON.stringify(view));
   if(view.cardCount!==13)throw Error('Tim : nombre de lecons espagnoles incorrect : '+view.cardCount);
   if(view.tasks.complete!==39||view.tasks.invalid||view.tasks.blocked)throw Error('Tim : exercice non charge ou avec mauvaise structure (39 attendus).');
   if(view.progress!=='accessible')throw Error('Tim : historique des tentatives indisponible.');
   if(view.pdf.available!==9||view.pdf.readable!==9)throw Error('Tim : au moins un des 9 PDF originaux est inaccessible.');
   console.log('OK : Tim peut consulter 13 lecons, 39 exercices corrigibles, ses resultats et les 9 PDF ENT. Aucune reponse soumise.');

   const timExtra=await timPage.evaluate(async()=>{
     const bridge=window.__TIM_BRIDGE||{};
     let maths=0,failed=0,progress=false;
     for(let i=1;i<=23;i++){
       try{
         const r=await bridge.mathTrainingTask('MT'+String(i).padStart(2,'0'));
         if(r?.task?.questions?.length===10&&r.task.questions.every(q=>q.choices?.length===4&&!('correctIndex' in q)))maths++;
         else failed++;
       }catch{failed++;}
     }
     try{progress=Array.isArray((await bridge.mathTrainingProgress())?.attempts);}catch{}
     const el=document.documentElement;
     return {maths,failed,progress,overflow:el.scrollWidth-el.clientWidth,canSubmit:typeof bridge.spanishEntTrainingSubmit==='function'};
   });
   console.log('AUDIT TIM MATHS ET MOBILE (lecture seule) : '+JSON.stringify(timExtra));
   if(timExtra.maths!==23||timExtra.failed||!timExtra.progress||timExtra.overflow>12||!timExtra.canSubmit)
     throw Error('Tim : maths, progression, interface ou bouton de validation indisponible.');
   console.log('OK : 23 tests maths consultables, suivi disponible, format mobile conforme. Aucune soumission.');

  }else{
   console.log('Compte Tim : contrôle non effectué (identifiants de test non disponibles dans GitHub).');
  }

  // Contrôle visiteur sur la vraie page, sans authentification.
  const guestPage=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  const guestResponse=await guestPage.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  if(!guestResponse?.ok())throw Error('Accueil Visiteur indisponible.');
  await guestPage.locator('#guest-enter').click({timeout:10000});
  await guestPage.locator('body.guest-mode').waitFor({timeout:20000});
  await guestPage.waitForFunction(()=>typeof window.openLesson==='function'&&!!document.querySelector('#home.page.active'),null,{timeout:22000});
  const guestIntro=guestPage.locator('#intro-screen');
  if(await guestIntro.isVisible()){
    await guestPage.locator('#intro-silent').evaluate(el=>el.click());
    await guestIntro.waitFor({state:'hidden',timeout:15000});
  }
  await guestPage.locator('[data-nav="matieres"]').first().evaluate(el=>el.click());
  await guestPage.locator('#matieres-content button.matter-espanol').first().waitFor({timeout:15000});
  await guestPage.locator('#matieres-content button.matter-espanol').first().evaluate(el=>el.click());
  await guestPage.locator('#matieres-content details.tim-es-lesson').first().waitFor({timeout:15000});
  const guestView=await guestPage.evaluate(()=>({
    guest:window.__TIM_GUEST===true,
    parent:window.__TIM_PARENT===true,
    cards:document.querySelectorAll('#matieres-content details.tim-es-lesson').length,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    privateResultWarning:(document.getElementById('matieres-content')?.innerText||'').includes('Résultats indisponibles')
  }));
  console.log('AUDIT VISITEUR MOBILE (lecture seule) : '+JSON.stringify(guestView));
  if(!guestView.guest||guestView.parent||guestView.cards!==13||guestView.overflow>12)
    throw Error('Visiteur : accès, interface ou 13 leçons espagnoles incorrects.');
  if(guestView.privateResultWarning)console.log('AMELIORATION : message technique resultats indisponibles dans espace Visiteur.');
  console.log('OK : Visiteur navigue dans les lecons sans identification ni accès aux notes privées.');

 }finally{await browser.close();}
 console.log('CONFIRMATION : accès Cloudflare/Firebase en lecture seule opérationnel. Aucune note ni exercice modifié.');
})().catch(e=>{console.error('ECHEC DIAGNOSTIC : '+String(e.message||e).slice(0,240));process.exit(1);});
