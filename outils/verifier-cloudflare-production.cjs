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
      return {status:response.status,code:data.error||'',count:Array.isArray(data?.data?.attempts)?data.data.attempts.length:null};
    }
    return {report:await call('getParentReport'),forbidden:await call('getTimCourseContent')};
  });
  console.log('Contrôle Parent : HTTP '+checks.report.status+', notes présentes : '+checks.report.count+', erreur : '+(checks.report.code||'aucune'));
  if(checks.report.status!==200||!Number.isInteger(checks.report.count))throw Error('Lecture Parent via Cloudflare échouée (HTTP '+checks.report.status+', code '+checks.report.code+').');
  if(checks.forbidden.status!==403)throw Error('Protection du cours Tim incorrecte pour Parent : HTTP '+checks.forbidden.status);
  console.log('OK : compte Parent lit les notes et ne peut pas consulter les fonctions réservées à Tim.');
  if(process.env.TIM_STUDENT_EMAIL&&process.env.TIM_STUDENT_PASSWORD){
   const timPage=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
   await timPage.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
   await timPage.locator('#tim-enter').click();
   await timPage.locator('#login-email').fill(process.env.TIM_STUDENT_EMAIL);
   await timPage.locator('#login-password').fill(process.env.TIM_STUDENT_PASSWORD);
   await timPage.locator('#login-button').click();
   await timPage.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===false&&!window.__TIM_GUEST,null,{timeout:50000});
   console.log('OK : connexion reelle au compte Tim reussie sur ecran de telephone.');
   await timPage.locator('[data-nav="matieres"]:visible').first().click();
   await timPage.locator('#matieres-content button.matter-espanol').first().click();
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
       pdf.available=list.filter(x=>/\\.pdf$/i.test(x.fileName||'')).length;
       for(const item of list.filter(x=>/\\.pdf$/i.test(x.fileName||''))){
         try{const blob=await bridge.attachments.read(item);if(blob.size>0&&(await blob.slice(0,5).text())==='%PDF-')pdf.readable++;}catch{}
       }
     }catch{}
     return {cardCount,tasks,progress,pdf};
   });
   console.log('AUDIT COMPTE TIM (lecture seule) : '+JSON.stringify(view));
   if(view.cardCount!==13)throw Error('Tim : nombre de lecons espagnoles incorrect : '+view.cardCount);
   if(view.tasks.complete!==39||view.tasks.invalid||view.tasks.blocked)throw Error('Tim : exercice non charge ou avec mauvaise structure (39 attendus).');
   if(view.progress!=='accessible')throw Error('Tim : historique des tentatives indisponible.');
   if(view.pdf.available!==9||view.pdf.readable!==9)throw Error('Tim : au moins un des 9 PDF originaux est inaccessible.');
   console.log('OK : Tim peut consulter 13 lecons, 39 exercices corrigibles, ses resultats et les 9 PDF ENT. Aucune reponse soumise.');
  }else{
   console.log('Compte Tim : contrôle non effectué (identifiants de test non disponibles dans GitHub).');
  }
 }finally{await browser.close();}
 console.log('CONFIRMATION : accès Cloudflare/Firebase en lecture seule opérationnel. Aucune note ni exercice modifié.');
})().catch(e=>{console.error('ECHEC DIAGNOSTIC : '+String(e.message||e).slice(0,240));process.exit(1);});
