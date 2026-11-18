'use strict';
/* Audit PASSIF de l'affichage des originaux ENT : aucune validation ni ecriture. */
const {chromium}=require('playwright');
const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const mail=process.env.TIM_PARENT_EMAIL||'';
const password=process.env.TIM_PARENT_PASSWORD||'';
if(!mail||!password)throw Error('Connexion Parent de lecture seule indisponible.');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(browser,device,viewport){
 const context=await browser.newContext({viewport,locale:'fr-FR'});
 const page=await context.newPage();
 try{
  const response=await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response?.ok())throw Error('Site non disponible.');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(mail);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,undefined,{timeout:40000});
  const intro=page.locator('#intro-screen');
  if(await intro.isVisible()){
   await page.locator('#intro-silent').click({timeout:7000});
   await intro.waitFor({state:'hidden',timeout:13000});
  }
  const report=await page.evaluate(async()=>{
   const api=window.__TIM_BRIDGE?.attachments;
   if(!api?.list)throw Error('Pont de lecture des fichiers prives indisponible.');
   const counts=[];
   const list=async id=>{try{return {items:await api.list('lesson',id),error:false};}
                         catch{return {items:[],error:true};}};
   const sections=[
    ['Francais',window.TIM_FR_PACK?.attachments,window.TIM_FR_DOCUMENTS],
    ['Anglais',window.TIM_ANGLAIS_PACK?.attachments,window.TIM_ENGLISH_DOCUMENTS],
    ['SVT',window.TIM_SVT_PACK?.attachments,window.TIM_SVT_DOCUMENTS],
    ['Histoire-geographie',window.TIM_HG_PACK?.attachments,window.TIM_HG_DOCUMENTS]
   ];
   for(const [subject,plan,renderer] of sections){
    if(!Array.isArray(plan)){counts.push({subject,error:'Fiches non chargees'});continue;}
    const byTarget=new Map();
    for(const row of plan){
     if(!byTarget.has(row.target))byTarget.set(row.target,[]);
     byTarget.get(row.target).push(row);
    }
    let present=0,missing=0,errors=0,viewer=0,manual=0,bodyVisible=0;
    for(const [target,entries] of byTarget){
     const found=await list(target);
     if(found.error)errors++;
     for(const row of entries){
      if(found.items.some(x=>x.fileName===row.name))present++;else missing++;
     }
     if(found.items.length&&typeof renderer?.render==='function'){
      const holder=document.createElement('section');
      holder.style.cssText='position:absolute;left:-12000px;top:0;width:500px';
      document.body.append(holder);
      try{
       await renderer.render(target,holder);
       viewer+=holder.querySelectorAll('.pc-inline-pdf').length;
       manual+=[...holder.querySelectorAll('button')].filter(x=>/afficher ici|lire le texte|telecharger/i.test(x.textContent||'')).length;
       bodyVisible+=holder.querySelectorAll('.pc-inline-pdf:not(:has(button)), .ent-es-source-text, .odt-text-preview').length;
      }catch{}
      holder.remove();
     }
    }
    counts.push({subject,lessonsWithReferences:byTarget.size,references:plan.length,stored:present,missing,readErrors:errors,
      embeddedReaders:viewer,extraClickButtons:manual,visibleTextWithoutClick:bodyVisible});
   }
   const mathIds=window.TIM_INLINE_ENT_DOCUMENTS?.mathCourseIds?.()||[];
   let mathPresent=0,mathTargets=0,mathError=0,mathImages=0;
   for(const id of mathIds){
    const found=await list(id);
    if(found.error)mathError++;
    const rows=found.items.filter(x=>/\.(pdf|png|jpe?g|webp|gif)$/i.test(x.fileName||''));
    if(rows.length)mathTargets++;
    mathPresent+=rows.length;mathImages+=rows.filter(x=>/\.(png|jpe?g|webp|gif)$/i.test(x.fileName||'')).length;
   }
   counts.push({subject:'Mathematiques',courseIds:mathIds.length,targetsWithFiles:mathTargets,stored:mathPresent,images:mathImages,
    readErrors:mathError,displayRule:'Lecon BIS: volet ferme; rendu des PDF non automatique pour ces volets'});
   const phys=[
    ['PCENT6390167','Chapitre 1 Atomes molécules et ions 3eme.pdf'],
    ['PCENT6390168','Eval formative controle 2 el.pdf'],
    ['PCENT6390168','Ce que je dois savoir pour le contrôle 1 3e 2026.pdf'],
    ['PCENT6390201','Chapitre 1 tableau molecules.pdf']
   ];
   const pcCache=new Map();let pcPresent=0,pcErrors=0;
   for(const [id,name] of phys){
    if(!pcCache.has(id))pcCache.set(id,await list(id));
    const found=pcCache.get(id);if(found.error)pcErrors++;
    if(found.items.some(x=>x.fileName===name))pcPresent++;
   }
   counts.push({subject:'Physique-chimie',references:phys.length,stored:pcPresent,readErrors:pcErrors,
    displayRule:'Certaines pages BIS auto; PDF complet selon un autre parcours'});
   const meta=window.__TIM_DATA?.metadata?.spanishEnt;
   const spanishTag=window.TIM_SPANISH_ENT_EXACT?.TAG;
   if(meta?.index&&spanishTag){
    const saved=await list(spanishTag);
    const plan=meta.index.map(x=>String(x.nom_dans_archive||'').split('/').pop()).filter(x=>/\.pdf$/i.test(x));
    const present=plan.filter(name=>saved.items.some(x=>x.fileName===name)).length;
    const nov17=saved.items.filter(x=>/no empiezo|LISTA 2|3D\.pdf/i.test(x.fileName||'')).length;
    counts.push({subject:'Espagnol',references:plan.length,stored:present,nov17StoredCandidates:nov17,readErrors:saved.error?1:0,
      displayRule:'PDF de l archive en mode manuel; seance 17 novembre: noms de fichiers'});
   }else counts.push({subject:'Espagnol',error:'Archive espagnole inaccessible'});
   return counts;
  });
  for(const item of report)console.log('AUDIT '+device+' '+JSON.stringify(item));
  if(report.length!==7)throw Error('Sept matieres attendues');
  return report;
 }finally{await context.close();}
}
(async()=>{
 const paths=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'];
 const fs=require('node:fs');
 const executable=paths.find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 try{
  for(const [name,viewport]of [['telephone',{width:390,height:844}],['ordinateur',{width:1280,height:840}]])
   await run(browser,name,viewport);
 }finally{await browser.close();}
})().catch(e=>{console.error('Audit prive interrompu : '+String(e.message||e).slice(0,220));process.exitCode=1;});
