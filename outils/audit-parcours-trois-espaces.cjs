/* Audit production lecture seule. Aucune note, identité ou réponse dans le rapport. */
'use strict';
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const SITE='https://classeur-tim-v16.pages.dev/';
const out='audit-complet-roles';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];
function add(device,role,name,ok,note=''){checks.push({device,role,name,ok:!!ok,note:String(note).slice(0,120)});}
function errText(e){return String(e?.message||e).slice(0,170);}
async function nav(p,name){await p.locator('[data-nav="'+name+'"]').first().evaluate(x=>x.click());await p.waitForTimeout(80);}
async function login(p,role){
 await p.goto(SITE,{waitUntil:'domcontentloaded',timeout:40000});
 if(role==='Visiteur'){await p.locator('#guest-enter').click();await p.locator('body.guest-mode').waitFor();}
 else{
  const email=process.env[role==='Parent'?'TIM_PARENT_EMAIL':'TIM_STUDENT_EMAIL'];
  const password=process.env[role==='Parent'?'TIM_PARENT_PASSWORD':'TIM_STUDENT_PASSWORD'];
  if(!email||!password)throw Error('Secrets de connexion absents');
  await p.locator(role==='Parent'?'#parent-enter':'#tim-enter').click();
  await p.locator('#login-email').fill(email);
  await p.locator('#login-password').fill(password);
  await p.locator('#login-button').click();
  await p.waitForFunction(r=>document.body.classList.contains('ready')&&window.__TIM_PARENT===(r==='Parent'),role,{timeout:50000});
 }
 const intro=p.locator('#intro-screen');
 if(await intro.isVisible()){
  const skip=p.locator('#intro-silent');if(await skip.isVisible())await skip.evaluate(el=>el.click());
  await intro.waitFor({state:'hidden',timeout:19000});
 }
 await p.waitForFunction(()=>typeof window.openLesson==='function',null,{timeout:12000});
}
async function selectMatter(p,name){
 await nav(p,'matieres');
 const root=p.locator('#matieres-content');
 await root.locator('button.matter-card').filter({hasText:name}).first().evaluate(el=>el.click());
 return root;
}
async function inspectSpanish(p,dev,role){
 const root=await selectMatter(p,'Espagnol');
 await root.locator('.tim-es-lesson').first().waitFor({timeout:15000});
 const n=await root.locator('.tim-es-lesson').count();
 add(dev,role,'13 leçons espagnol',n===13,n);
 const indexes=dev==='mobile'&&role==='Visiteur'?Array.from({length:n},(_,i)=>i):[0,Math.max(0,n-1)];
 let opened=0,trainers=0;
 for(const i of indexes){
  const item=root.locator('.tim-es-lesson').nth(i);
  await item.locator(':scope > summary').evaluate(el=>el.click());
  await p.waitForTimeout(70);
  const v=await item.evaluate(el=>({open:el.open,
   words:(el.querySelector('.tim-es-reading')?.textContent||'').trim().length,
   tasks:el.querySelectorAll('[data-es-training-id]').length,
   early:el.querySelector('.tim-es-exercises')?.open===true
  }));
  if(v.open&&v.words>100)opened++;
  if(v.tasks===3&&!v.early)trainers++;
  await item.locator('.tim-es-back').evaluate(el=>el.click());
 }
 add(dev,role,'Leçon espagnole lisible au premier clic',opened===indexes.length,opened+'/'+indexes.length);
 add(dev,role,'Exercices espagnols après la lecture',trainers===indexes.length,trainers+'/'+indexes.length);
}
async function inspectMath(p,dev,role){
 const root=await selectMatter(p,'Mathématiques');
 const n=await root.locator('.math-lesson-entry').count();
 add(dev,role,'23 leçons de maths directement choisissables',n===23,n);
 const indexes=dev==='mobile'&&role==='Visiteur'?Array.from({length:n},(_,i)=>i):[0,Math.max(0,n-1)];
 let courses=0,after=0;
 for(const i of indexes){
  await root.locator('.math-lesson-entry').nth(i).evaluate(el=>el.click());
  await root.locator('.math-reading-lesson').waitFor({timeout:12000});
  const v=await root.evaluate(el=>{
   const a=el.querySelector('.math-reading-lesson'),b=el.querySelector('.math-reading-actions');
   return {count:a?.querySelectorAll('.math-reading-section').length,words:a?.textContent.length||0,
    after:!!(a&&b&&(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING))};
  });
  if(v.count===6&&v.words>300)courses++;
  if(v.after)after++;
  await root.locator('[data-math-back]').first().evaluate(el=>el.click());
 }
 add(dev,role,'Leçon maths complète et lisible',courses===indexes.length,courses+'/'+indexes.length);
 add(dev,role,'Exercices maths après le cours',after===indexes.length,after+'/'+indexes.length);
}
async function inspectNavigation(p,dev,role){
 for(const name of ['home','matieres','exercices','outils','difficultes']){
  const exists=await p.locator('[data-nav="'+name+'"]').count()>0;
  if(exists)await nav(p,name);
  add(dev,role,'Onglet '+name,exists&&await p.locator('#'+name+'.page.active').count()>0);
 }
 const x=await p.evaluate(()=>({over:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  body:document.body.scrollWidth-document.documentElement.clientWidth}));
 add(dev,role,'Aucun défilement horizontal',Math.max(x.over,x.body)<=12,JSON.stringify(x));
}
async function inspectParent(p,dev){
 await nav(p,'parent');
 const x=await p.evaluate(()=>({
  auth:window.__TIM_PARENT===true&&!window.__TIM_GUEST,
  reports:!!document.querySelector('#parent-content .tim-parent-unified'),
  importMath:!!document.querySelector('#parent-content .math-private-import'),
  export:[...document.querySelectorAll('#parent-content button')].some(el=>el.textContent.includes('Exporter le bilan complet')),
  results:document.querySelector('#parent-content .tim-parent-unified .results-list')?.querySelectorAll('article').length||0,
  bonus:(document.querySelector('#parent-content')?.textContent||'').includes('Défi bonus personnalisé')
 }));
 for(const [k,v] of Object.entries(x))add(dev,'Parent','Espace Parent '+k,k==='results'?v>0:v,k==='results'?'résultats présents : '+(v>0):'');
}
async function main(){
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{}),args:['--no-sandbox']});
 try{
  const p=await browser.newContext();
  const status=await p.request.get(SITE+'api/status');
  const st=await status.json().catch(()=>({}));
  add('global','Serveur','API Cloudflare disponible',status.ok()&&st.available===true,status.status());
  for(const f of ['Tim_Defi_Du_Samedi_10XP.gif','Tim_Defi_Bonus_5XP.gif','Tim_Dimanche_Hologramme_20XP_Gagne.gif']){
   const r=await p.request.get(SITE+'assets/animations/'+f);
   add('global','Animations',f,r.ok()&&(r.headers()['content-type']||'').includes('image'),r.status());
  }
  const guest=await p.request.post(SITE+'api/tim',{data:{action:'getParentReport',payload:{}}});
  add('global','Sécurité','Rejet API sans compte',guest.status()===401,guest.status());
  for(const f of ['worker/auth.mjs','functions/index.mjs']){
   const r=await p.request.get(SITE+f);
   add('global','Sécurité','Code privé non accessible '+f,r.status()===404,r.status());
  }
  await p.close();
  for(const [dev,width,height] of [['mobile',390,844],['ordinateur',1280,900]]){
   for(const role of ['Visiteur','Parent','Tim']){
    const ctx=await browser.newContext({viewport:{width,height},locale:'fr-FR',serviceWorkers:'block'});
    let blocked=0;
    await ctx.route('**/*',async route=>{
     const req=route.request(),u=req.url();
     const mutation=/firestore.googleapis.com/.test(u)&&/:commit|:write|:batchWrite/.test(u);
     let badApi=false;
     if(/\/api\/tim(?:\?|$)/.test(u)&&req.method()==='POST'){
      try{badApi=!/^(get|list|read)/i.test(String(req.postDataJSON()?.action||''));}catch{badApi=true;}
     }
     if(mutation||badApi){blocked++;await route.fulfill({status:403,contentType:'application/json',body:'{"error":"audit-read-only"}'});}
     else await route.continue();
    });
    const page=await ctx.newPage(),issues=[];
    page.on('pageerror',e=>issues.push(errText(e)));
    try{
     await login(page,role);
     add(dev,role,'Entrée dans le compte',true);
     await inspectNavigation(page,dev,role);
     await inspectSpanish(page,dev,role);
     await inspectMath(page,dev,role);
     if(role==='Parent')await inspectParent(page,dev);
     if(role==='Visiteur'&&dev==='mobile'){
      await nav(page,'home');
      await page.screenshot({path:path.join(out,'visiteur-accueil-mobile.jpg'),fullPage:true,type:'jpeg',quality:62});
     }
    }catch(e){errors.push({device:dev,role,message:errText(e)});}
    add(dev,role,'Aucune tentative de modification',blocked===0,blocked);
    add(dev,role,'Aucune erreur JavaScript',issues.length===0,issues.length);
    await ctx.close();
   }
  }
 }finally{await browser.close();}
 const report={date:new Date().toISOString(),checks,errors};
 fs.writeFileSync(path.join(out,'rapport.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(out,'rapport.md'),
  '# Audit Parent, Tim et Visiteur\n\nLecture seule, résultats sans données personnelles.\n\n'+
  checks.map(x=>'- '+x.device+' / '+x.role+' / '+x.name+' : '+(x.ok?'OK':'ÉCHEC')+' '+x.note).join('\n')+
  '\n\n'+errors.map(x=>'- ERREUR '+x.device+'/'+x.role+' : '+x.message).join('\n')+'\n');
 console.log('AUDIT RESULTATS '+JSON.stringify({total:checks.length,success:checks.filter(x=>x.ok).length,
  failed:checks.filter(x=>!x.ok),errors}));
 if(errors.length||checks.some(x=>!x.ok))process.exitCode=1;
}
main().catch(e=>{console.error('AUDIT FATAL '+errText(e));process.exitCode=1;});
