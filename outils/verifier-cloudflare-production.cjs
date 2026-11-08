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
 }finally{await browser.close();}
 console.log('CONFIRMATION : accès Cloudflare/Firebase en lecture seule opérationnel. Aucune note ni exercice modifié.');
})().catch(e=>{console.error('ECHEC DIAGNOSTIC : '+String(e.message||e).slice(0,240));process.exit(1);});
