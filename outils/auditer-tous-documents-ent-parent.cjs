'use strict';
/* Inventaire et rendu des documents originaux ENT sur le VRAI site publié.
   Authentification Parent, lecture Firestore uniquement. Aucune copie, note,
   tentative, validation d'exercice, import ou modification de fichier. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const email=process.env.TIM_PARENT_EMAIL||'',password=process.env.TIM_PARENT_PASSWORD||'';
if(!email||!password)throw Error('Secrets Parent non configurés.');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const safeErr=e=>String(e?.message||e).slice(0,140);
const five=[
 {key:'EN_CORRECTION_16',target:'EN_ENT_20261112',file:'CORRECTION What were they doing.pdf',size:2362641,kind:'pdf',pages:6,sha256:'84dda7694ac027c6165cf5850d911d74e05a961e73915b4b6dc40867f8dfc687'},
 {key:'ES_CALENDRIER_17',target:'ENTESP_2026',file:'4 EECEno empiezo las clases en septiembre.pdf',size:743171,kind:'pdf',pages:3,sha256:'be48a6fa18032c127be5cdc1652ca9a585908953a67cedc562dbd7575b472837'},
 {key:'ES_VERBES_17',target:'ENTESP_2026',file:'11 Presente de indicativo LISTA 2.pdf',size:511949,kind:'pdf',pages:1,sha256:'1a7d9be5cb0bda99adb1a337795822f5295478bba7994ffcb0bb543bade816e3'},
 {key:'ES_FICHE_3D_17',target:'ENTESP_2026',file:'3D.pdf',size:54288,kind:'pdf',pages:2,sha256:'9e6658b16436577febe7ee0e597c033496a8d82057258fcad9a475559e4a0215'},
 {key:'SVT_IMAGE_17',target:'SVT_ENT_20261117',file:"Capture d'écran 2026-11-17 102650.png",size:164054,kind:'png',pages:1,sha256:'d4d46ee96c3f22fedb0e1f6b42eabd2b837f6af0a1d4cd3b2f031524d11ecaf5'}
];
const normalize=x=>String(x||'').normalize('NFC').toLocaleLowerCase('fr-FR').trim();
const same=(actual,expected)=>{
 const a=normalize(actual),e=normalize(expected);
 return a===e||a.endsWith('_'+e);
};
async function login(page){
 const resp=await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
 if(!resp?.ok())throw Error('Site Cloudflare indisponible');
 await page.locator('#parent-enter').click();
 await page.locator('#login-email').fill(email);
 await page.locator('#login-password').fill(password);
 await page.locator('#login-button').click();
 await page.waitForFunction(()=>window.__TIM_PARENT===true&&!!window.__TIM_BRIDGE?.attachments?.read&&!!window.TIM_PHYSICS_INLINE_PDF?.createFullInline,undefined,{timeout:45000});
 const intro=page.locator('#intro-screen');
 if(await intro.isVisible()){
  await page.locator('#intro-silent').click({timeout:10000});
  await intro.waitFor({state:'hidden',timeout:14000});
 }
}
async function session(browser,device,viewport){
 const context=await browser.newContext({viewport,locale:'fr-FR',acceptDownloads:false});
 const page=await context.newPage();
 const report={device,catalog:[],five:[],examples:[],errors:[]};
 const id='originals-audit-private';
 try{
  await login(page);
  const inventory=await page.evaluate(async fives=>{
   const api=window.__TIM_BRIDGE.attachments;
   const caches=new Map();
   const get=async target=>{
    if(!caches.has(target))caches.set(target,await api.list('lesson',target).catch(()=>null));
    return caches.get(target);
   };
   const plans=[
    ['Français',window.TIM_FR_PACK?.attachments||[]],
    ['Anglais',window.TIM_ANGLAIS_PACK?.attachments||[]],
    ['SVT',window.TIM_SVT_PACK?.attachments||[]],
    ['Histoire-géographie',window.TIM_HG_PACK?.attachments||[]]
   ];
   const items=[];
   for(const [subject,plan] of plans)for(const row of plan){
    const files=await get(row.target);
    items.push({subject,target:row.target,name:row.name,kind:row.kind,
      present:!!files?.some(x=>x.fileName===row.name),access:files!==null});
   }
   const mathsIds=window.TIM_INLINE_ENT_DOCUMENTS?.mathCourseIds?.()||[];
   for(const target of mathsIds){
    const files=await get(target);
    if(files)for(const item of files.filter(x=>/\.(pdf|png|jpe?g|webp)$/i.test(x.fileName||'')))
     items.push({subject:'Mathématiques',target,name:item.fileName,kind:/\.pdf$/i.test(item.fileName)?'pdf':'image',present:true,access:true});
   }
   const phys=[
    ['PCENT6390167','Chapitre 1 Atomes molécules et ions 3eme.pdf'],
    ['PCENT6390168','Eval formative controle 2 el.pdf'],
    ['PCENT6390168','Ce que je dois savoir pour le contrôle 1 3e 2026.pdf'],
    ['PCENT6390201','Chapitre 1 tableau molecules.pdf']
   ];
   for(const [target,name] of phys){
    const files=await get(target);
    items.push({subject:'Physique-chimie',target,name,kind:'pdf',present:!!files?.some(x=>x.fileName===name),access:files!==null});
   }
   const meta=window.__TIM_DATA?.metadata?.spanishEnt;
   const tag=window.TIM_SPANISH_ENT_EXACT?.TAG||'ENTESP_2026';
   for(const row of (meta?.index||[]).filter(x=>/\.pdf$/i.test(x.nom_dans_archive||''))){
    const target=tag,name=String(row.nom_dans_archive||'').split('/').pop(),files=await get(target);
    items.push({subject:'Espagnol',target,name,kind:'pdf',present:!!files?.some(x=>x.fileName===name),access:files!==null,
      linked:!!row.rattache_a?.length});
   }
   const find=async spec=>{
    const targets=spec.key==='SVT_IMAGE_17'
      ?[spec.target,'SVT_HW_215689','10099~215689']:spec.key==='EN_CORRECTION_16'
      ?[spec.target,'EN_ENT_20261117','10099~215028']:[spec.target];
    let exact=null,location=null,hadError=false;
    for(const target of targets){
     const data=await get(target);
     if(!data){hadError=true;continue;}
     const file=data.find(x=>{
      const a=String(x.fileName||'').normalize('NFC').toLocaleLowerCase('fr-FR');
      const b=spec.file.normalize('NFC').toLocaleLowerCase('fr-FR');
      return a===b||a.endsWith('_'+b);
     });
     if(file){exact=file;location=target;break;}
    }
    let verified=false,observedSize=null,signature=false,hashMatch=false;
    if(exact){
     try{
      const blob=await api.read(exact);
      observedSize=blob.size;
      const head=new Uint8Array(await blob.slice(0,8).arrayBuffer());
      signature=spec.kind==='pdf'
       ?head.slice(0,5).every((v,i)=>v===[37,80,68,70,45][i])
       :head.every((v,i)=>v===[137,80,78,71,13,10,26,10][i]);
      const fingerprint=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
      const hex=[...new Uint8Array(fingerprint)].map(x=>x.toString(16).padStart(2,'0')).join('');
      hashMatch=hex===spec.sha256;
      verified=signature&&observedSize===spec.size&&hashMatch;
     }catch{verified=false;}
    }
    const inCatalog=spec.key==='EN_CORRECTION_16'
      ?window.TIM_ANGLAIS_PACK?.attachments?.some(x=>x.target===location&&x.name===exact?.fileName)
      :spec.key==='SVT_IMAGE_17'
      ?window.TIM_SVT_PACK?.attachments?.some(x=>x.target===location&&x.name===exact?.fileName)
      :false;
    return {key:spec.key,found:!!exact,where:location===spec.target?'expected':location?'other':'none',
      verified,bytesMatch:observedSize===spec.size,signature,hashMatch,
      inCatalog:!!inCatalog};
   };
   const checked=[];
   for(const spec of fives)checked.push(await find(spec));
   return {items,checked,mathsIds:mathsIds.length,spanishIndex:(meta?.index||[]).length};
  },five);
  const bySubject={};
  for(const x of inventory.items){
   bySubject[x.subject]??={referenced:0,stored:0,missing:0,accessErrors:0,targets:new Set()};
   const v=bySubject[x.subject];v.referenced++;v.targets.add(x.target);
   if(x.present)v.stored++;else v.missing++;
   if(!x.access)v.accessErrors++;
  }
  for(const [subject,v]of Object.entries(bySubject)){
   const summary={subject,referenced:v.referenced,stored:v.stored,missing:v.missing,targets:v.targets.size,readErrors:v.accessErrors};
   report.catalog.push(summary);
   console.log('CATALOGUE '+device+' '+JSON.stringify(summary));
   if(v.missing)report.errors.push(subject+': '+v.missing+' références absentes du stockage privé');
  }
  if(inventory.mathsIds!==17)report.errors.push('Mathématiques: nombre de séances ENT différent de 17');
  for(const outcome of inventory.checked){
   report.five.push(outcome);
   console.log('PIECE '+device+' '+JSON.stringify(outcome));
   if(!outcome.found||!outcome.verified||outcome.where!=='expected')report.errors.push(outcome.key+': non importée, incorrecte ou mal rattachée');
   if(outcome.key==='SVT_IMAGE_17'&&!outcome.inCatalog)report.errors.push('SVT_IMAGE_17: document non relié au module SVT de la leçon');
  }
  if(process.env.TIM_AUDIT_INVENTORY_ONLY==='1'){
   console.log('BILAN INVENTAIRE '+device+' '+JSON.stringify({references:inventory.items.length,five:report.five,issues:report.errors.length}));
   if(report.errors.length)console.log('ANOMALIES INVENTAIRE '+device+' '+JSON.stringify(report.errors.slice(0,35)));
   return report;
  }
  // Contrôle du rendu avec les mêmes modules que les véritables leçons,
  // sans injection de code local et sans modifier Firestore.
  let seq=0;
  const subjects=[
   ['Français','TIM_FR_DOCUMENTS'],
   ['Anglais','TIM_ENGLISH_DOCUMENTS'],
   ['SVT','TIM_SVT_DOCUMENTS'],
   ['Histoire-géographie','TIM_HG_DOCUMENTS'],
   ['Mathématiques','TIM_INLINE_ENT_DOCUMENTS']
  ];
  for(const [subject,code] of subjects){
   const targets=[...new Set(inventory.items.filter(x=>x.subject===subject&&x.present).map(x=>x.target))];
   let success=0,failed=0;
   for(const target of targets){
    const key=id+'-'+(seq++);
    try{
     const counts=await page.evaluate(async({subject,target,key})=>{
      const host=document.createElement('section');host.id=key;host.style.cssText='position:relative;max-width:620px;margin:25px auto;background:white;color:#223';
      document.body.append(host);
      if(subject==='Mathématiques')await window.TIM_INLINE_ENT_DOCUMENTS.mount(host,[target],{auto:true,limit:30});
      else{
       const obj=subject==='Français'?window.TIM_FR_DOCUMENTS:
        subject==='Anglais'?window.TIM_ENGLISH_DOCUMENTS:
        subject==='SVT'?window.TIM_SVT_DOCUMENTS:window.TIM_HG_DOCUMENTS;
       await obj.render(target,host);
      }
      return {pdf:host.querySelectorAll('.pc-inline-full-document').length,
        officeLoading:host.querySelectorAll('.tim-original-office').length,
        manual:[...host.querySelectorAll('button')].some(b=>/afficher ici le document|lire le texte du document/i.test(b.textContent||''))};
     },{subject,target,key});
     const files=inventory.items.filter(x=>x.subject===subject&&x.target===target&&x.present);
     const pdfExpected=files.filter(x=>x.kind==='pdf').length;
     if(counts.pdf!==pdfExpected||counts.manual)throw Error('nombre de lecteurs PDF ou bouton manuel inattendu');
     const host=page.locator('#'+key);
     if(files.some(x=>['odt','docx'].includes(x.kind))){
      const expectedOffice=files.filter(x=>['odt','docx'].includes(x.kind)).length;
      await page.waitForFunction(({key,expected})=>document.getElementById(key)?.querySelectorAll('.tim-original-office').length===expected,
       {key,expected:expectedOffice},{timeout:18000});
     }
     for(let i=0;i<counts.pdf;i++){
      const view=host.locator('.pc-inline-full-document').nth(i);
      await view.scrollIntoViewIfNeeded({timeout:10000});
      const first=view.locator('.pc-pdf-page').first();
      await first.waitFor({state:'attached',timeout:22000});
      await first.scrollIntoViewIfNeeded();
      await page.waitForFunction(({key,i})=>{
       const pdf=document.getElementById(key)?.querySelectorAll('.pc-inline-full-document')[i];
       return pdf?.querySelector('.pc-pdf-page')?.dataset.rendered==='1'&&pdf.querySelector('.pc-pdf-page canvas')?.width>0;
      },{key,i},{timeout:22000});
      const last=view.locator('.pc-pdf-page').last();
      await last.scrollIntoViewIfNeeded({timeout:12000});
      await page.waitForFunction(({key,i})=>{
       const pdf=document.getElementById(key)?.querySelectorAll('.pc-inline-full-document')[i];
       const nodes=pdf?.querySelectorAll('.pc-pdf-page canvas');
       return !!nodes?.length&&pdf.querySelectorAll('.pc-pdf-page')[nodes.length-1]?.dataset.rendered==='1'&&nodes[nodes.length-1].width>0;
      },{key,i},{timeout:22000});
     }
     success+=files.length;
    }catch(e){failed++;report.errors.push('Rendu '+subject+': '+safeErr(e));}
    finally{await page.evaluate(key=>document.getElementById(key)?.remove(),key);}
   }
   console.log('AFFICHAGE '+device+' '+JSON.stringify({subject,targets:targets.length,documentsValidated:success,failedTargets:failed}));
   report.examples.push({subject,targets:targets.length,documentsValidated:success,failedTargets:failed});
  }
  // Physique : les quatre originaux figurent dans les leçons, avec lecteur complet.
  for(const subject of ['Physique-chimie','Espagnol']){
   const files=inventory.items.filter(x=>x.subject===subject&&x.present);
   let success=0,failed=0;
   for(const file of files){
    const key=id+'-'+(seq++);
    try{
     await page.evaluate(({key,file})=>{
      const root=document.createElement('div');root.id=key;
      root.style.cssText='position:relative;max-width:620px;margin:25px auto;background:white;color:#223';
      document.body.append(root);
      root.append(window.TIM_PHYSICS_INLINE_PDF.createFullInline({target:file.target,fileName:file.name},'Document ENT original'));
     },{key,file});
     const viewer=page.locator('#'+key+' .pc-inline-full-document');
     await viewer.scrollIntoViewIfNeeded({timeout:15000});
     const first=viewer.locator('.pc-pdf-page').first();
     await first.waitFor({state:'attached',timeout:25000});
     await first.scrollIntoViewIfNeeded({timeout:15000});
     await page.waitForFunction(key=>{
      const first=document.getElementById(key)?.querySelector('.pc-pdf-page');
      return first?.dataset.rendered==='1'&&first.querySelector('canvas')?.width>0;
     },key,{timeout:25000});
     const last=viewer.locator('.pc-pdf-page').last();
     await last.scrollIntoViewIfNeeded({timeout:15000});
     await page.waitForFunction(key=>{
      const blocks=document.getElementById(key)?.querySelectorAll('.pc-pdf-page');
      const last=blocks?.[blocks.length-1];
      return last?.dataset.rendered==='1'&&last.querySelector('canvas')?.width>0;
     },key,{timeout:25000});
     success++;
    }catch(e){failed++;report.errors.push('Lecture '+subject+': '+safeErr(e));}
    finally{await page.evaluate(key=>document.getElementById(key)?.remove(),key);}
   }
   console.log('AFFICHAGE '+device+' '+JSON.stringify({subject,documentsValidated:success,failedDocuments:failed}));
   report.examples.push({subject,documentsValidated:success,failedDocuments:failed});
  }
  console.log('BILAN '+device+' '+JSON.stringify({totalReferences:inventory.items.length,five:report.five,problems:report.errors.length}));
  if(report.errors.length)console.log('ANOMALIES '+device+' '+JSON.stringify(report.errors.slice(0,35)));
 }finally{await context.close();}
 return report;
}
(async()=>{
 const exe=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
 const browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{})});
 try{
  const results=[];
  for(const [label,viewport] of [['ordinateur',{width:1280,height:840}],['telephone',{width:390,height:844}]])
   results.push(await session(browser,label,viewport));
  const failures=results.reduce((n,x)=>n+x.errors.length,0);
  console.log('AUDIT GLOBAL : '+(failures?'ANOMALIES TROUVÉES':'TOUS LES DOCUMENTS RÉFÉRENCÉS AFFICHÉS')+
   ' ; '+failures+' anomalie(s), aucune écriture privée.');
  if(failures)process.exitCode=2;
 }finally{await browser.close();}
})().catch(e=>{console.error('AUDIT INTERROMPU : '+safeErr(e));process.exitCode=1;});
