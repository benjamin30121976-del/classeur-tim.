'use strict';
/* Chromium/Playwright sur la prévisualisation Cloudflare, lecture seule.
 * Ne jamais envoyer de tentative ni recopier d'ID token, de clé ou de résultats d'élève. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const site=process.env.TIM_SITE_URL;
if(!/^https:\/\/[a-z0-9-]+\.classeur-tim-v16\.pages\.dev\/?$/.test(site||''))throw Error('URL de prévisualisation non autorisée');
(async()=>{
 const url=site.replace(/\/$/,'');
 const statusResponse=await fetch(url+'/api/status',{cache:'no-store'});
 assert.equal(statusResponse.status,200);
 const status=await statusResponse.json();
 assert.equal(status.platform,'cloudflare-pages');
 console.log('APERÇU_CLOUDFLARE',{available:status.available===true,hgLessons:status.features?.hgLessons,hgExercises:status.features?.hgExercises});
 if(status.available!==true){
  console.log('SONDE_FIRESTORE_NON_EXECUTEE: le secret serveur n’est pas configuré pour Preview. Ne rien conclure sur les droits Firestore de Production.');
  return;
 }
 assert(process.env.TIM_PARENT_EMAIL&&process.env.TIM_PARENT_PASSWORD,'Secrets GitHub Parent absents');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  let blocked=0;
  await page.route('**/api/tim',async route=>{
    let action='';try{action=route.request().postDataJSON()?.action||''}catch{}
    if(!['getFirestoreReadDiagnostics','getHgTrainingTask','getHgTrainingProgress'].includes(action)){
      blocked++;await route.abort('blockedbyclient');return;
    }
    await route.continue();
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
  await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
  await page.locator('#login-button').click();
  await page.locator('body.ready').waitFor({timeout:60000});
  assert.equal(await page.evaluate(()=>window.__TIM_PARENT===true),true,'Session Parent absente');
  const result=await page.evaluate(async()=>{
    const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
    const {getAuth}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js');
    const token=await getAuth(getApp()).currentUser?.getIdToken();
    if(!token)return {error:'firebase-token-missing'};
    const resp=await fetch('/api/tim',{method:'POST',cache:'no-store',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify({action:'getFirestoreReadDiagnostics',payload:{}})});
    const body=await resp.json().catch(()=>({}));
    return {http:resp.status,documentHttpStatus:body.data?.documentHttpStatus??null,
      collectionHttpStatus:body.data?.collectionHttpStatus??null,error:String(body.error||'')};
  });
  console.log('FIRESTORE_STATUS_CODES_ONLY '+JSON.stringify(result));
  console.log('WRITE_ATTEMPTS_BLOCKED '+blocked);
  assert.equal(blocked,0);
  assert.equal(result.http,200,'Action de diagnostic refusée ; aucun diagnostic concluant');
  assert(Number.isInteger(result.documentHttpStatus)&&Number.isInteger(result.collectionHttpStatus));
 }finally{await browser.close()}
})().catch(e=>{console.error('DIAGNOSTIC_ERREUR '+String(e?.message||e).slice(0,220));process.exitCode=1});
