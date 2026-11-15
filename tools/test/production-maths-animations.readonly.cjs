'use strict';
// AUDIT LECTURE SEULE. Ne transmet aucun identifiant, réponse ni mutation.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const out=path.join(process.cwd(),'audit-production-tim');
fs.mkdirSync(out,{recursive:true});
const base=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const report={site:base,date:new Date().toISOString(),mode:'visiteur lecture seule',screens:[],staticFiles:{},devices:[],warnings:[]};
async function probe(page,p){
 try{
  const resp=await page.request.get(new URL(p,base).href,{timeout:20000});
  const type=resp.headers()['content-type']||'';
  const expected=p.endsWith('.gif')?'image/':p.endsWith('.js')?'javascript':'';
  return {status:resp.status(),available:resp.ok()&&(!expected||(expected==='image/'?type.startsWith('image/'):type.includes('javascript'))),contentType:type};
 }catch(e){return {status:'error',available:false,error:String(e.message).slice(0,120)};}
}
async function main(){
 const fsNative=require('node:fs');
 const chromePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fsNative.existsSync(p));
 const browser=await chromium.launch({headless:true,...(chromePath?{executablePath:chromePath}:{}),args:['--no-sandbox']});
 try{
  const probePage=await browser.newPage();
  for(const file of ['/tim-animations.js','/assets/animations/Tim_Defi_Du_Samedi_10XP.gif','/assets/animations/Tim_Defi_Bonus_5XP.gif','/maths-parcours.js','/maths-bis-data.js']){
   report.staticFiles[file]=await probe(probePage,file);
  }
  // Audit ciblé des fichiers réellement servis sur Cloudflare.
  // Aucune connexion, aucune soumission. Vérifier aussi la version Android.
  const required=[
   {uri:'/',includes:[
    'assets/homework-bonus-detail.css?v=presentation-validee-20261115-v1',
    'boot.js?v=xp-barre-exception-16nov-lien-ent-thales-20261115-v4']},
   {uri:'/boot.js',includes:['app.js?v=xp-barre-exception-16nov-bonus-devoir-detail-20261115-v5']},
   {uri:'/app.js',includes:[
    "root.classList.toggle('homework-bonus-detail',isHomeworkDetail)",
    'Cours et informations complémentaires',
    'if(!isHomeworkDetail)root.append',
    'hideIfEmpty:isHomeworkDetail']},
   {uri:'/assets/homework-bonus-detail.css',includes:[
    '.homework-detail-hero',
    '.homework-detail-mode-info',
    'body:has(#exercices.page.active #exercise-detail.homework-bonus-detail.active) .tabs',
    'display:none!important']}
  ];
  report.homeworkDetailPublished=[];
  for(let attempt=0;attempt<18;attempt++){
   const entries=await Promise.all(required.map(async row=>{
    const response=await probePage.request.get(new URL(row.uri,base).href,{timeout:22000});
    const body=await response.text();
    const missing=row.includes.filter(x=>!body.includes(x));
    return {uri:row.uri,http:response.status(),ok:response.ok()&&missing.length===0,missing:missing.length};
   }));
   report.homeworkDetailPublished=entries;
   if(entries.every(e=>e.ok))break;
   if(attempt<17)await probePage.waitForTimeout(5000);
  }
  for(const item of report.homeworkDetailPublished)
   console.log('Bonus devoir Cloudflare '+item.uri+' : HTTP '+item.http+', version '+
    (item.ok?'CORRECTE':'NON CONFIRMÉE')+', marqueurs absents '+item.missing);
  // Vérification publique sans jeton ni secret : service du backend configuré ?
  try{
   const response=await probePage.request.get(new URL('/api/status',base).href,{timeout:20000});
   const type=response.headers()['content-type']||'';
   let body={};try{body=await response.json();}catch{}
   report.backend={status:response.status(),platform:body.platform||null,available:body.available===true,contentType:type};
  }catch(e){report.backend={available:false,error:String(e.message).slice(0,120)};}
  await probePage.close();
  for(const [device,size] of [['telephone',{width:390,height:844}],['ordinateur',{width:1280,height:860}]]){
   const page=await browser.newPage({viewport:size,locale:'fr-FR'});
   const row={device,checks:{},lessons:[],errors:[],blockedNonGet:0};
   report.devices.push(row);
   await page.route('**/*',async route=>{
    if(route.request().method()!=='GET'&&route.request().method()!=='HEAD'){
     row.blockedNonGet++;await route.abort('blockedbyclient');return;
    }
    await route.continue();
   });
   page.on('pageerror',e=>row.errors.push(e.message.slice(0,240)));
   try{
    const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
    row.checks.http=response?.status()||null;
    row.checks.enterGuest=await page.locator('#guest-enter').isVisible();
    row.checks.introButton=await page.locator('#intro-skip').count()>0;
    row.checks.scriptTags=await page.evaluate(()=>[...document.scripts].map(x=>(x.getAttribute('src')||'').split('?')[0]).filter(Boolean));
    await page.waitForFunction(()=>Boolean(document.querySelector('.tabs')&&document.getElementById('exercise-detail')),{timeout:12000});
    row.checks.homeworkStyle=await page.evaluate(()=>{
     const section=document.getElementById('exercices');
     const detail=document.getElementById('exercise-detail');
     const nav=document.querySelector('.tabs');
     const previousSection=section.className,previousDetail=detail.className;
     section.classList.add('active');detail.classList.add('active','homework-bonus-detail');
     // La feuille CSS publique doit empêcher les onglets de couvrir la figure.
     const hidden=getComputedStyle(nav).display==='none';
     section.className=previousSection;detail.className=previousDetail;
     const restored=getComputedStyle(nav).display!=='none';
     return {hiddenDuringExercise:hidden,restoredAfterLeaving:restored};
    });
    console.log('Bonus devoir navigation Cloudflare '+device+' : '+JSON.stringify(row.checks.homeworkStyle));
    await page.screenshot({path:path.join(out,device+'-accueil.jpg'),type:'jpeg',quality:68,fullPage:true,timeout:20000});
    if(row.checks.enterGuest){
     await page.locator('#guest-enter').click({timeout:15000});
     await page.locator('body.guest-mode').waitFor({timeout:20000});
     await page.waitForFunction(()=>typeof window.openLesson==='function'&&Boolean(document.querySelector('#home.page.active')),{timeout:20000});
     row.checks.guestOpened=true;
     const intro=page.locator('#intro-screen');
     if(await intro.isVisible()){
      const skip=page.locator('#intro-skip');
      if(await skip.isVisible())await skip.click({timeout:10000});
      else {
       const silent=page.locator('#intro-silent');
       if(await silent.isVisible())await silent.click({timeout:10000});
      }
      await intro.waitFor({state:'hidden',timeout:18000});
     }
     // Navigation locale en mode Visiteur : évite la couverture de l'écran par l'intro.
     await page.evaluate(()=>{
      const button=[...document.querySelectorAll('[data-nav="matieres"]')][0];
      if(!button)throw Error('Onglet matières absent');
      button.click();
     });
     await page.waitForFunction(()=>Boolean(document.querySelector('#matieres-content button.matter-card')),{timeout:12000});
     await page.waitForTimeout(350);
     const mat=page.locator('#matieres-content');
     row.checks.subjects=(await mat.locator('button.matter-card').allTextContents()).map(s=>s.trim().replace(/\s+/g,' ').slice(0,95));
     const math=mat.locator('button.matter-card').filter({hasText:'Mathématiques'}).first();
     row.checks.mathVisible=await math.count()===1 && await math.isVisible();
     if(row.checks.mathVisible){
      await math.evaluate(button=>button.click());
      await page.waitForTimeout(350);
      row.checks.mathGroupCount=await mat.locator('.spx-card').count();
      row.checks.mathHeadings=(await mat.locator('h2,h3').allTextContents()).map(s=>s.trim()).slice(0,30);
      row.checks.mathTrainingLabel=(await mat.locator('[data-math-train]').allTextContents()).slice(0,5);
      row.checks.mathNote=(await mat.innerText()).slice(0,650);
     }
     row.checks.javascriptCapabilities=await page.evaluate(()=>({
      mathPath:Boolean(window.TIM_MATH_PATH),
      mathBisCount:window.TIM_MATHS_BIS_PACK?.lessons?.length??null,
      animations:Boolean(window.TIM_ANIMATIONS),
      bonusPanel:Boolean(window.TIM_ANIMATIONS?.url?.('bonus')),
      guest:Boolean(window.__TIM_GUEST)
     }));
     await page.screenshot({path:path.join(out,device+'-mathematiques.jpg'),type:'jpeg',quality:68,fullPage:true,timeout:20000});
    }
   }catch(e){row.errors.push('Audit interrompu : '+String(e.message).slice(0,280));}
   await page.close();
  }
 }finally{await browser.close();}
 const lines=['# État du classeur Tim en production (lecture seule)',
  '', 'Site : '+base,'Date UTC : '+report.date,
  'Aucune connexion Parent/Tim ni exercice validé. Toute requête POST a été bloquée.',
  '','## État du serveur privé','- API Cloudflare : '+JSON.stringify(report.backend||{}),'','## Ressources du site public'];
 for(const [key,v] of Object.entries(report.staticFiles))lines.push('- '+key+' : HTTP '+v.status+', '+(v.available?'fichier correct':'absent ou mauvais type')+' ('+v.contentType+')');
 for(const e of report.homeworkDetailPublished||[])lines.push('- Bonus devoir '+e.uri+' : '+(e.ok?'version publiée':'NON CONFIRMÉ')+', HTTP '+e.http);
 for(const d of report.devices){
  lines.push('','## '+d.device,'- Page HTTP : '+d.checks.http,
   '- Accès Visiteur : '+Boolean(d.checks.guestOpened),
   '- Matière mathématiques : '+Boolean(d.checks.mathVisible),
   '- Chapitres mathématiques : '+(d.checks.mathGroupCount??'non mesuré'),
   '- Leçons BIS vues dans le code : '+(d.checks.javascriptCapabilities?.mathBisCount??'non mesuré'),
   '- Lecteur animations chargé : '+Boolean(d.checks.javascriptCapabilities?.animations),
   '- Requêtes non-GET empêchées : '+d.blockedNonGet);
  if(d.checks.mathHeadings?.length)lines.push('- Rubriques : '+d.checks.mathHeadings.join(' / '));
  for(const error of d.errors)lines.push('- Avertissement : '+error);
 }
 fs.writeFileSync(path.join(out,'rapport.md'),lines.join('\n')+'\n');
 fs.writeFileSync(path.join(out,'rapport.json'),JSON.stringify(report,null,2)+'\n');
 console.log(lines.join('\n'));
 if(report.devices.every(d=>!d.checks.http||d.checks.http>=400))process.exitCode=1;
 if(!report.homeworkDetailPublished?.every(e=>e.ok))process.exitCode=1;
 if(!report.devices.every(d=>d.checks.homeworkStyle?.hiddenDuringExercise&&d.checks.homeworkStyle?.restoredAfterLeaving))process.exitCode=1;
}
main().catch(e=>{console.error('Audit échoué : '+e.message);process.exitCode=1;});
