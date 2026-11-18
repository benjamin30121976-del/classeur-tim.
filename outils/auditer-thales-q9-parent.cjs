'use strict';
/* Audit de la seule copie Thalès Q9 depuis le compte Parent (lecture seule).
   Ne transmet ni réponse de Tim, ni identifiant, ni note, ni document privé aux logs. */
const {chromium}=require('playwright');
(async()=>{
 const email=process.env.TIM_PARENT_EMAIL,password=process.env.TIM_PARENT_PASSWORD;
 if(!email||!password)throw Error('Compte Parent indisponible');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  await page.route('**/api/tim',async route=>{
   let body={};try{body=route.request().postDataJSON()}catch{}
   const action=String(body.action||'');
   if(/^(submit|release|import|delete|reset|set|correct|revise|apply)/i.test(action)){
    await route.abort('blockedbyclient');return;
   }
   await route.continue();
  });
  await page.goto(process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,undefined,{timeout:60000});
  const result=await page.evaluate(()=>{
   const a=(window.__CLOUD_ATTEMPTS||[]).find(x=>x.id==='BD1611_MA01');
   const ex=window.__TIM_DATA?.exercises?.find(x=>x.id==='BD1611_MA01');
   if(!a)return {found:false};
   const q=a.answers?.[8],other=a.answers?.filter((_,i)=>i!==8)||[];
   const text=String(q?.question||ex?.questions?.[8]?.q||'');
   const response=String(q?.response??'');
   return {
    found:true,authorAttempt:a.id==='BD1611_MA01',
    question9:q!=null,answerCount:a.answers?.length||0,
    textIdentified:/AM\\s*\\/\\s*AB\\s*=\\s*2\\s*\\/\\s*5/i.test(text)&&/AN\\s*\\/\\s*AC\\s*=\\s*4\\s*\\/\\s*10/i.test(text),
    chosenIncorrectRatios:/rapport/i.test(response)&&/diff[eé]rent/i.test(response),
    point9:Number(q?.points)===0&&q?.correct===false,
    otherPointsFixed:other.every(x=>Number(x?.points)===1&&x?.correct===true),
    oneCreditAvailable:Number.isFinite(a.score)&&a.total===10&&a.score===9,
    xpPresent:Number.isFinite(a.xp),
    correctionReleased:a.correctionStatus==='released'
   };
  });
  console.log('AUDIT_THALÈS_Q9 '+JSON.stringify(result));
  if(!result.found||!result.question9||!result.answerCount||!result.textIdentified)
   process.exitCode=2;
 }finally{await browser.close();}
})().catch(e=>{console.error('AUDIT_THALÈS_Q9_ECHEC : '+String(e?.message||e).slice(0,160));process.exitCode=1;});