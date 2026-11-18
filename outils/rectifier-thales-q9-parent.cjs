'use strict';
/* Action unique autorisée par le Parent : rectifier la question 9 de Thalès.
   Jamais d'exercice soumis, ni écriture directe Firestore depuis le navigateur.
   La transaction serveur archive l'original, vérifie l'ID et écrit uniquement
   la nouvelle note et la mention de neutralisation. */
const {chromium}=require('playwright');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 if(process.env.TIM_TH_Q9_APPLY!=='1')throw Error('Autorisation de rectification absente');
 if(process.env.GITHUB_REF!=='refs/heads/main')throw Error('Interdit hors main');
 const email=process.env.TIM_PARENT_EMAIL,password=process.env.TIM_PARENT_PASSWORD;
 if(!email||!password)throw Error('Secrets Parent manquants');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
  let done=false;
  for(let i=0;i<18&&!done;i++){
   await page.goto(site+'?thales-q9-20261118='+i,{waitUntil:'domcontentloaded',timeout:45000});
   if(await page.locator('#parent-enter').isVisible().catch(()=>false)){
    await page.locator('#parent-enter').click();
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(password);
    await page.locator('#login-button').click();
   }
   try{
    await page.waitForFunction(()=>document.body.classList.contains('ready')&&
     window.__TIM_PARENT===true&&typeof window.__TIM_BRIDGE?.thalesQ9Correction==='function',null,{timeout:8000});
    done=true;
   }catch{
    if(i===17)throw Error('Le module de rectification Parent n’est pas publié sur Cloudflare.');
    await sleep(5000);
   }
  }
  const preview=await page.evaluate(()=>window.__TIM_BRIDGE.thalesQ9Correction('preview'));
  if(preview?.status==='already-corrected'){
   console.log('THALES_Q9 déjà corrigé : 10/10, original archivé, XP inchangés.');return;
  }
  if(preview?.status!=='eligible'||preview.oldScore!==9||preview.newScore!==10||
     preview.xpBefore!==1||preview.xpAfter!==1||preview.noWrite!==true)
   throw Error('Prévisualisation non conforme : aucune correction appliquée.');
  const result=await page.evaluate(()=>window.__TIM_BRIDGE.thalesQ9Correction(
   'apply','BD1611_MA01_Q9_PARENT_APPROVED_20261118'
  ));
  if(result?.status!=='corrected'||result.oldScore!==9||result.newScore!==10||
     result.xpBefore!==1||result.xpAfter!==1||
     result.historySaved!==true||result.otherAnswersPreserved!==true)
   throw Error('Résultat de rectification non confirmé. Vérification manuelle requise.');
  const check=await page.evaluate(()=>window.__TIM_BRIDGE.thalesQ9Correction('preview'));
  if(check?.status!=='already-corrected')throw Error('Contrôle final : note rectifiée non confirmée');
  console.log('THALES_Q9_RECTIFICATION_CONFIRMÉE : 9/10 → 10/10 ; 0 XP supplémentaire, copie originale conservée.');
 }finally{await browser.close();}
})().catch(e=>{console.error('THALES_Q9_NON_CONFIRME : '+String(e?.message||e).slice(0,180));process.exitCode=1;});