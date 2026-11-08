/* Diagnostic lecture seule : ni jeton ni note dans les journaux. */
'use strict';
const {chromium}=require('playwright');
const code=c=>/^(functions\/[a-z-]+|app-check\/[a-z-]+)$/.test(String(c||''))?c:'unknown';
(async()=>{
 if(!process.env.TIM_PARENT_EMAIL||!process.env.TIM_PARENT_PASSWORD)throw Error('Secrets Parent non configures');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  const http=[];
  page.on('response',r=>{
   const url=new URL(r.url());
   if(url.hostname.endsWith('.cloudfunctions.net')&&/\/getParentReport$/.test(url.pathname))http.push(r.status());
  });
  await page.goto('https://classeur-tim-v16.pages.dev/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
  await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,{timeout:45000});
  await page.waitForTimeout(2000);
  const result=await page.evaluate(async()=>{
   const raw=localStorage.getItem('mi-espanol-firebase-web-config');
   let hasKey=false;
   try{hasKey=!!JSON.parse(raw||'{}').appCheckSiteKey;}catch(e){}
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFunctions,httpsCallable}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-functions.js');
   const f=getFunctions(getApp(),'europe-west1');
   let called='unknown',error='';
   try{const x=await httpsCallable(f,'getParentReport')({});called=Array.isArray(x?.data?.attempts)?'success':'unexpected-data';}
   catch(e){called='failed';error=String(e.code||'');}
   let appcheck='not-configured';
   if(hasKey)try{
    const {getAppCheck,getToken}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app-check.js');
    const token=await getToken(getAppCheck(getApp()),false);
    appcheck=token?.token?'token-obtained':'no-token';
   }catch(e){appcheck='token-error:'+String(e.code||'unknown');}
   return {hasKey,called,error,appcheck};
  });
  console.log('RESULT '+JSON.stringify({authenticated:true,appCheckConfigured:result.hasKey,
   callable:result.called,callableError:code(result.error),appCheck:result.appcheck.startsWith('token-error:')?'token-error:'+code(result.appcheck.slice(12)):result.appcheck,
   endpointHttpStatus:http}));
 }finally{await browser.close();}
})().catch(e=>{console.error('DIAG FAILED '+String(e.message||e).replace(/[^\w\s:.-]/g,'').slice(0,110));process.exit(1);});
