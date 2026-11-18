'use strict';
/* Contrôle du code réellement publié sur vrais fichiers privés, par Chromium connecté
   au compte Parent. Aucune API de validation, aucune écriture Firebase,
   aucune capture ni texte original dans les logs. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const url=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const email=process.env.TIM_PARENT_EMAIL||'';
const password=process.env.TIM_PARENT_PASSWORD||'';
if(!email||!password)throw Error('Compte Parent de lecture seule non configuré');

async function testDevice(browser,label,viewport){
 const context=await browser.newContext({viewport,locale:'fr-FR'});
 const page=await context.newPage();
 try{
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response?.ok())throw Error('Site du classeur inaccessible');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,undefined,{timeout:45000});
  const intro=page.locator('#intro-screen');
  if(await intro.isVisible()){
   await page.locator('#intro-silent').click({timeout:8000});
   await intro.waitFor({state:'hidden',timeout:14000});
  }
  // Contrôle la vraie version Cloudflare, sans injecter le code de la branche.
  const production=await page.evaluate(()=>{
   const version='documents-inline-auto-20261118-v1';
   const modules=['physique-chimie-inline-pdf.js','tim-inline-ent-documents.js',
    'francais-documents.js','anglais-documents.js',
    'svt-documents.js','histoire-geographie-documents.js'];
   const urls=[...document.scripts].map(s=>s.src).filter(Boolean);
   const missing=modules.filter(name=>!urls.some(src=>src.includes(name+'?v='+version)));
   return {missing,
    fullPdf:typeof window.TIM_PHYSICS_INLINE_PDF?.createFullInline==='function',
    office:typeof window.TIM_INLINE_ENT_DOCUMENTS?.renderOfficeDocument==='function'};
  });
  if(production.missing.length||!production.fullPdf||!production.office)
   throw Error('Version Cloudflare non confirmée : '+production.missing.join(', ')
    +(production.fullPdf&&production.office?'':' ; lecteur intégral ou bureautique absent'));
  console.log('VERSION Cloudflare '+label+' : les six modules 20261118-v1 sont chargés directement.');
  const tasks=[
   {kind:'french-pdf',expect:'pdf'},
   {kind:'english-pdf',expect:'pdf'},
   {kind:'english-docx',expect:'office'},
   {kind:'svt-odt',expect:'office'},
   {kind:'history-odt',expect:'office'},
   {kind:'maths-pdf',expect:'pdf'},
   {kind:'physics-pdf',expect:'pdf'},
   {kind:'spanish-pdf',expect:'pdf'}
  ];
  for(let i=0;i<tasks.length;i++){
   const task=tasks[i];
   const id='tim-parent-inline-audit-'+i;
   const info=await page.evaluate(async({kind,id})=>{
    const host=document.createElement('section');host.id=id;
    host.style.cssText='position:relative;max-width:620px;margin:30px auto;background:white;color:#223';
    document.body.append(host);
    const api=window.__TIM_BRIDGE?.attachments;
    if(!api?.list||!api?.read)throw Error('Pont documents privés indisponible');
    if(kind==='french-pdf'||kind==='english-pdf'||kind==='english-docx'){
     const french=kind==='french-pdf';
     const plan=french?window.TIM_FR_PACK?.attachments:window.TIM_ANGLAIS_PACK?.attachments;
     const category=kind==='english-docx'?'docx':'pdf';
     const target=plan?.find(x=>x.kind===category)?.target;
     if(!target)throw Error('Document catalogue absent');
     if(french)await window.TIM_FR_DOCUMENTS.render(target,host);
     else await window.TIM_ENGLISH_DOCUMENTS.render(target,host);
     return {found:true};
    }
    if(kind==='svt-odt'||kind==='history-odt'){
     const svt=kind==='svt-odt';
     const pack=svt?window.TIM_SVT_PACK:window.TIM_HG_PACK;
     if(!pack?.attachments?.[0])throw Error('Document ODT absent du catalogue');
     if(svt)await window.TIM_SVT_DOCUMENTS.render(pack.attachments[0].target,host);
     else await window.TIM_HG_DOCUMENTS.render(pack.attachments[0].target,host);
     return {found:true};
    }
    if(kind==='maths-pdf'){
     await window.TIM_INLINE_ENT_DOCUMENTS.mount(host,['M26S1009'],{auto:true,limit:1});
     return {found:true};
    }
    if(kind==='physics-pdf'){
     const stored=await api.list('lesson','PCENT6390167');
     const file=stored.find(f=>/\.pdf$/i.test(f.fileName||''));
     if(!file)throw Error('PDF physique absent');
     host.append(window.TIM_PHYSICS_INLINE_PDF.createFullInline({target:'PCENT6390167',fileName:file.fileName},'PDF original du professeur'));
     return {found:true};
    }
    if(kind==='spanish-pdf'){
     const tag=window.TIM_SPANISH_ENT_EXACT?.TAG;
     if(!tag)throw Error('Index espagnol absent');
     const stored=await api.list('lesson',tag);
     const file=stored.find(f=>/\.pdf$/i.test(f.fileName||''));
     if(!file)throw Error('PDF espagnol absent');
     host.append(window.TIM_PHYSICS_INLINE_PDF.createFullInline({target:tag,fileName:file.fileName},'PDF original du professeur'));
     return {found:true};
    }
    throw Error('Sujet inconnu');
   },{kind:task.kind,id});
   if(!info.found)throw Error('Document absent '+task.kind);
   const holder=page.locator('#'+id);
   const expected=task.expect==='pdf'?holder.locator('.pc-inline-full-document').first():holder.locator('.tim-original-office').first();
   await expected.waitFor({state:'attached',timeout:25000});
   await expected.scrollIntoViewIfNeeded({timeout:10000});
   if(task.expect==='pdf'){
    const success=await page.waitForFunction(id=>{
     const root=document.getElementById(id);
     return !!root?.querySelector('.pc-pdf-all-pages .pc-pdf-page canvas[width]') &&
      !![...root.querySelectorAll('.pc-pdf-all-pages .pc-pdf-page canvas')].find(c=>c.width>0&&c.height>0);
    },id,{timeout:35000}).then(()=>true).catch(()=>false);
    if(!success)throw Error(task.kind+': aucune page PDF visible automatiquement');
   }else{
    const content=await expected.textContent();
    if(!content||content.length<25)throw Error(task.kind+': texte ODT/DOCX non visible');
   }
   const buttons=await holder.locator('button').allTextContents();
   if(buttons.some(text=>/afficher ici le document|lire le texte du document/i.test(text)))
    throw Error(task.kind+': un clic reste requis');
   const pages=task.expect==='pdf'?await holder.locator('.pc-pdf-page').count():0;
   if(task.expect==='pdf'&&pages<1)throw Error(task.kind+': aucune page reconnue');
   if(task.expect==='pdf'&&pages>1){
    await holder.locator('.pc-pdf-page').last().scrollIntoViewIfNeeded({timeout:13000});
    const tail=await page.waitForFunction(id=>{
     const parts=[...(document.getElementById(id)?.querySelectorAll('.pc-pdf-page')||[])];
     const last=parts.at(-1);
     const canvas=last?.querySelector('canvas');
     return canvas?.width>0&&canvas.height>0;
    },id,{timeout:35000}).then(()=>true).catch(()=>false);
    if(!tail)throw Error(task.kind+': dernière page non rendue au défilement');
   }
   console.log('OK '+label+' '+task.kind+' : document visible sans clic'+(pages?' ; pages dans le défilement='+pages:''));
   await holder.evaluate(node=>node.remove());
  }
 }finally{await context.close();}
}
(async()=>{
 const candidates=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'];
 const bin=candidates.find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(bin?{executablePath:bin}:{})});
 try{
  await testDevice(browser,'ordinateur',{width:1280,height:840});
  await testDevice(browser,'telephone',{width:390,height:844});
 }finally{await browser.close();}
})().catch(error=>{console.error('ÉCHEC affichage automatique Parent : '+String(error?.message||error).slice(0,300));process.exitCode=1;});
