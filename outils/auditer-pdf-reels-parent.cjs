'use strict';
// Read-only authenticated PDF inspection. Does not expose files, account info, or answers.
const {chromium}=require('playwright');
const SITE=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const email=process.env.TIM_PARENT_EMAIL||'',password=process.env.TIM_PARENT_PASSWORD||'';
if(!email||!password)throw Error('Compte Parent non configure pour ce controle en lecture seule.');
const report={};
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function verify(browser,device,viewport){
 const context=await browser.newContext({viewport,locale:'fr-FR',acceptDownloads:false});
 const page=await context.newPage();
 let popupCount=0;
 page.on('popup',()=>{popupCount++;});
 try{
  const res=await page.goto(SITE,{waitUntil:'domcontentloaded',timeout:45000});
  assert(res?.ok(),'Page du classeur inaccessible');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,undefined,{timeout:40000});
  await page.waitForFunction(()=>!!window.__TIM_BRIDGE?.attachments?.read&&!!window.TIM_PHYSICS_INLINE_PDF?.createInline&&!!window.pdfjsLib,undefined,{timeout:15000});
  // L'animation d'accueil est superposee aux lecons apres connexion.
  // La fermer par son controle officiel, sans desactiver ses fonctions.
  const intro=page.locator('#intro-screen');
  if(await intro.isVisible()){
    await page.locator('#intro-silent').click({timeout:8000});
    await intro.waitFor({state:'hidden',timeout:15000});
  }
  const result=await page.evaluate(async()=>{
   const api=window.__TIM_BRIDGE.attachments;
   const pack=window.__TIM_DATA?.metadata?.spanishEnt;
   const spanishTag=window.TIM_SPANISH_ENT_EXACT?.TAG;
   const wanted=(pack?.index||[]).map(x=>({name:String(x.nom_dans_archive||'').split('/').pop(),
    lesson:(x.rattache_a||[]).find(t=>t.type==='cours')?.id||null})).filter(x=>x.name.endsWith('.pdf'));
   const list=async id=>{try{return await api.list('lesson',id);}catch{return [];}};
   const spanishFiles=spanishTag?await list(spanishTag):[];
   const spanish=wanted.map(x=>({...x,target:spanishTag,meta:spanishFiles.find(m=>m.fileName===x.name)}));
   const ids=window.TIM_INLINE_ENT_DOCUMENTS?.mathCourseIds?.()||[];
   const math=[];
   for(const id of ids){
    const files=await list(id);
    for(const meta of files)if(/\.pdf$/i.test(meta.fileName||''))math.push({target:id,name:meta.fileName,meta});
   }
   const physReq=[
    ['PCENT6390167','Chapitre 1 Atomes molécules et ions 3eme.pdf'],
    ['PCENT6390168','Eval formative controle 2 el.pdf'],
    ['PCENT6390168','Ce que je dois savoir pour le contrôle 1 3e 2026.pdf'],
    ['PCENT6390201','Chapitre 1 tableau molecules.pdf']
   ];
   const cache={};
   const physics=[];
   for(const [target,name] of physReq){
    cache[target]??=await list(target);
    physics.push({target,name,meta:cache[target].find(x=>x.fileName===name)});
   }
   window.__PDF_PARENT_READONLY={spanish,math,physics};
   return {spanishExpected:spanish.length,spanishPresent:spanish.filter(x=>x.meta).length,
     spanishLinked:spanish.filter(x=>x.meta&&x.lesson).length,
     mathCours:ids.length,mathPdf:math.length,
     physicsExpected:physics.length,physicsPresent:physics.filter(x=>x.meta).length};
  });
  report[device]={inventory:result};
  console.log(device+' : espagnol '+result.spanishPresent+'/'+result.spanishExpected+
   ' PDF, math '+result.mathPdf+' PDF lies a '+result.mathCours+' cours, physique '+result.physicsPresent+'/'+result.physicsExpected+' PDF.');
  assert(result.spanishExpected>0,'Inventaire des PDF espagnols absent');
  assert(result.spanishPresent===result.spanishExpected,'Un ou plusieurs PDF espagnols manquent dans le stockage prive');
  assert(result.mathPdf>=19,'L’import des 18 rattachements maths n’est pas visible en entier');
  assert(result.physicsPresent>0,'Aucun PDF de physique-chimie rattache a une lecon ENT');
  // Parse each actual PDF; never extract, log, upload or reproduce its contents.
  const parse=await page.evaluate(async()=>{
   const docs=window.__PDF_PARENT_READONLY,api=window.__TIM_BRIDGE.attachments,lib=window.pdfjsLib;
   // Même version et même worker que le lecteur utilisé dans les leçons.
   lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.2.146/build/pdf.worker.min.js';
   const groups={};
   for(const [name,items] of Object.entries(docs)){
    const seen=new Set(),r={present:0,parsed:0,failed:0,pages:0};
    for(const item of items){
     if(!item.meta)continue;
     const key=item.target+'/'+item.name;
     if(seen.has(key))continue;seen.add(key);r.present++;
     try{
      const blob=await api.read(item.meta);
      if(blob.size<20||(await blob.slice(0,5).text())!=='%PDF-')throw Error('Signature PDF invalide');
      const task=lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false});
      const pdf=await task.promise;
      r.pages+=pdf.numPages;
      r.parsed++;
      try{await task.destroy();}catch{}
     }catch(e){r.failed++;r.lastError=String(e?.name||'Erreur')+': '+String(e?.message||'Inconnue').slice(0,150);}
    }
    groups[name]=r;
   }
   return groups;
  });
  report[device].parsed=parse;
  for(const [subject,s] of Object.entries(parse)){
   console.log(device+' '+subject+' : '+s.parsed+'/'+s.present+' PDF ouverts, '+s.pages+' pages reconnues.'+(s.lastError?' Type erreur : '+s.lastError:''));
   assert(s.parsed===s.present,device+' '+subject+' : certains PDF reels ne peuvent pas etre ouverts');
  }
  // Render an actual PDF in each lesson's same-page component.
  for(const subject of ['spanish','math','physics']){
   const info=await page.evaluate(async subject=>{
    const docs=window.__PDF_PARENT_READONLY,available=docs[subject].filter(x=>x.meta);
    const chosen=subject==='spanish'?(available.find(x=>x.lesson)||available[0]):
     subject==='math'?available.find(x=>x.target==='M26S0921'&&x.name==='Leçon Pythagore à compléter.pdf'):available[0];
    if(!chosen)return {available:false};
    const host=document.createElement('section');
    host.id='tim-real-pdf-audit-'+subject;
    host.className=subject==='math'?'math-reading-lesson':'tim-es-reading';
    host.style.cssText='margin:20px auto;padding:10px;width:min(93vw,680px);box-sizing:border-box';
    document.body.append(host);
    if(subject==='spanish'&&chosen.lesson&&window.TIM_SPANISH_ENT_EXACT?.renderLessonOriginal){
      await window.TIM_SPANISH_ENT_EXACT.renderLessonOriginal(host,chosen.lesson,'course');
    }else if(subject==='math'&&window.TIM_INLINE_ENT_DOCUMENTS?.mount){
      await window.TIM_INLINE_ENT_DOCUMENTS.mount(host,[chosen.target],{limit:10,auto:false});
    }else{
      const card=window.TIM_PHYSICS_INLINE_PDF.createInline(
       {target:chosen.target,fileName:chosen.name},1,'Document ENT du professeur',{manual:true});
      host.append(card);
    }
    return {available:true,embedded:!!host.querySelector('.pc-inline-pdf'),
      section:subject==='spanish'?'cours officiel espagnol':subject==='math'?'cours de maths':'cours de physique'};
   },subject);
   assert(info.available,device+' '+subject+' : pas de PDF disponible');
   assert(info.embedded,device+' '+subject+' : aucun lecteur PDF dans le corps de la lecon');
   const box=page.locator('#tim-real-pdf-audit-'+subject+' .pc-inline-pdf').first();
   // Le popup d'accueil peut apparaitre apres le chargement de la session Parent.
   if(await page.locator('#intro-screen').isVisible()){
     await page.locator('#intro-skip').click({timeout:10000});
     await page.locator('#intro-screen').waitFor({state:'hidden',timeout:15000});
   }
   await box.getByRole('button',{name:'Afficher ici le document du professeur'}).click({timeout:12000});
   const ok=await page.waitForFunction(subject=>{
      const root=document.getElementById('tim-real-pdf-audit-'+subject);
      const text=root?.querySelector('.pc-pdf-toolbar span')?.textContent||'';
      const canvas=root?.querySelector('canvas');
      return /^Page \d+ \/ \d+$/.test(text)&&canvas?.width>0&&canvas?.height>0;
    },subject,{timeout:30000}).then(()=>true).catch(()=>false);
   if(!ok){
    const status=await box.locator('p').allTextContents().catch(()=>[]);
    throw Error(device+' '+subject+' : la page PDF reelle ne s’affiche pas dans la lecon. '+(status||[]).slice(-2).join(' ').slice(0,130));
   }
   const dimensions=await box.locator('canvas').evaluate(c=>({width:c.width,height:c.height}));
   assert(dimensions.width>0&&dimensions.height>0,'Image PDF vide');
   report[device][subject]={inline:true,canvas:true};
   console.log('OK '+device+' : PDF '+subject+' affiche dans la lecon (canvas).');
   await page.locator('#tim-real-pdf-audit-'+subject).evaluate(node=>node.remove());
  }
  // Vérifier LES VRAIES PAGES du classeur, pas un lecteur créé séparément dans le test.
  assert(await page.evaluate(()=>typeof window.TIM_PEDAGOGY_NAVIGATE==='function'),
    'La navigation vers les matieres est indisponible');
  for(const target of [
   {label:'Cours ENT 12 novembre',button:'[data-math-open-original="TIM_ENT_20261112"]'},
   {label:'Leçon BIS reciproque de Thales',button:'[data-math-reciproque]'}
  ]){
   await page.evaluate(()=>window.TIM_PEDAGOGY_NAVIGATE('Mathématiques','MBIS14'));
   await page.locator('#matieres-content article.math-reading-lesson').first().waitFor({state:'visible',timeout:15000});
   await page.locator('#matieres-content .spx-back').first().click();
   const row=page.locator('#matieres-content '+target.button).first();
   await row.waitFor({state:'visible',timeout:15000});
   await row.click({timeout:12000});
   const viewer=page.locator('#matieres-content article.math-reading-lesson [data-tim-thales-original-pdf] .pc-inline-pdf').first();
   await viewer.waitFor({state:'visible',timeout:20000});
   assert(!(await viewer.getByRole('button',{name:'Afficher ici le document du professeur'}).count()),
     device+' '+target.label+' : le PDF attend un clic manuel');
   assert((await viewer.locator('h4').first().textContent()).includes('Le document original'),
     device+' '+target.label+' : le lecteur PDF ne porte pas sa reference');
   const fileName=await page.locator('#matieres-content article.math-reading-lesson [data-tim-thales-original-pdf] .tim-inline-ent-file h4').first().textContent();
   assert(/Thalès/i.test(fileName),device+' '+target.label+' : PDF de Thales manquant');
   await viewer.scrollIntoViewIfNeeded({timeout:12000});
   const rendered=await page.waitForFunction(()=>{
      const root=document.querySelector('#matieres-content article.math-reading-lesson [data-tim-thales-original-pdf]');
      const canvas=root?.querySelector('canvas'),label=root?.querySelector('.pc-pdf-toolbar span')?.textContent||'';
      return !!canvas&&canvas.width>0&&canvas.height>0&&/^Page \d+ \/ \d+$/.test(label);
    },undefined,{timeout:35000}).then(()=>true).catch(()=>false);
   assert(rendered,device+' '+target.label+' : le PDF d origine ne s affiche pas automatiquement dans la lecon');
   console.log('OK '+device+' : '+target.label+' affiche automatiquement le PDF de Thales dans le corps du cours.');
  }
  assert(popupCount===0,'Le lecteur a ouvert un onglet exterieur');
  console.log('OK '+device+' : aucune nouvelle fenetre ou onglet.');
 }finally{
  await context.close();
 }
}
(async()=>{
 const installed=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>require('node:fs').existsSync(p));
 const browser=await chromium.launch({headless:true,...(installed?{executablePath:installed}:{})});
 try{
  await verify(browser,'ordinateur',{width:1280,height:840});
  await verify(browser,'telephone',{width:390,height:844});
  console.log('PASS : les vrais PDF disponibles sont lus, et un PDF par matiere est affiche dans la page sur les deux formats.');
 }finally{await browser.close();}
})().catch(e=>{console.error('AUDIT PDF PRIVE ECHEC : '+e.message);process.exitCode=1;});
