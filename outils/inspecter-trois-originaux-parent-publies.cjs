'use strict';
/* Vérifie en production l'interface Parent prête à recevoir le ZIP.
   Ne sélectionne aucun fichier et n'appelle jamais attachments.upload/remove. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const email=process.env.TIM_PARENT_EMAIL||'';
const password=process.env.TIM_PARENT_PASSWORD||'';
if(!email||!password)throw Error('Compte Parent nécessaire');
const expected={
 spanish:['1a7d9be5cb0bda99adb1a337795822f5295478bba7994ffcb0bb543bade816e3',
          '9e6658b16436577febe7ee0e597c033496a8d82057258fcad9a475559e4a0215'],
 svt:'d4d46ee96c3f22fedb0e1f6b42eabd2b837f6af0a1d4cd3b2f031524d11ecaf5'
};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function session(browser,device,viewport){
 const context=await browser.newContext({viewport,locale:'fr-FR'});
 const page=await context.newPage();
 try{
  let published=false;
  for(let i=0;i<15;i++){
   const response=await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
   if(response?.ok()){
    published=await page.evaluate(()=>Boolean(
     document.querySelector('script[src*="tim-ent-17nov-private-import.js?v=originaux-17nov-20261118-v1"]') &&
     document.querySelector('script[src*="svt-pack.js?v=originaux-17nov-20261118-v1"]') &&
     document.querySelector('script[src*="espagnol-ent-exact.js?v=originaux-17nov-20261118-v1"]')
    ));
    if(published)break;
   }
   await sleep(8000);
  }
  if(!published)throw Error('Version Cloudflare des 3 originaux non publiée');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>window.__TIM_PARENT===true&&
    typeof window.TIM_ENT_17NOV_IMPORT?.panel==='function'&&
    typeof window.__TIM_BRIDGE?.attachments?.list==='function',undefined,{timeout:40000});
  const info=await page.evaluate(async expected=>{
   const panel=window.TIM_ENT_17NOV_IMPORT.panel();
   const text=panel.textContent||'';
   const input=panel.querySelector('input[type=file]');
   const action=[...panel.querySelectorAll('button')].find(x=>/Importer et vérifier/i.test(x.textContent));
   const svt=window.TIM_SVT_PACK?.attachments?.find(x=>x.target==='SVT_ENT_20261117');
   const bridge=window.__TIM_BRIDGE.attachments;
   const es=await bridge.list('lesson','ENTESP_2026'),science=await bridge.list('lesson','SVT_ENT_20261117');
   return {
    importer:!!input&&!!action&&action.disabled&&/trois documents originaux/i.test(text),
    svtReference:svt?.sha256===expected.svt,
    spanish:typeof window.TIM_SPANISH_ENT_EXACT?.renderLessonOriginal==='function',
    imported:expected.spanish.filter(hash=>es.some(x=>x.sha256===hash)).length+
     Number(science.some(x=>x.sha256===expected.svt))
   };
  },expected);
  if(!info.importer||!info.svtReference||!info.spanish)
   throw Error('L’importeur, le rattachement SVT ou le parcours espagnol ne sont pas prêts.');
  console.log('PRODUCTION '+device+' : module d’import et rattachements chargés sur compte Parent.');
  console.log('PRODUCTION '+device+' : '+info.imported+'/3 originaux trouvés dans le stockage privé ; aucune écriture.');
 }finally{await context.close();}
}
(async()=>{
 const exe=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
 const browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{})});
 try{
  await session(browser,'ordinateur',{width:1280,height:840});
  await session(browser,'telephone',{width:390,height:844});
 }finally{await browser.close();}
})().catch(e=>{console.error('VERIFICATION IMPORT PROD : '+String(e?.message||e).slice(0,200));process.exitCode=1;});
