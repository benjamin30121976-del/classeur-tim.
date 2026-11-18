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
  if(process.env.TIM_NOV17_ONLY==='1'){
   await inspectNov17Lessons(page,label);
   return;
  }
  // Contrôle la vraie version Cloudflare, sans injecter le code de la branche.
  const production=await page.evaluate(()=>{
   const modules=['physique-chimie-inline-pdf.js','tim-inline-ent-documents.js',
    'francais-documents.js','anglais-documents.js',
    'svt-documents.js','histoire-geographie-documents.js'];
   const urls=[...document.scripts].map(s=>s.src).filter(Boolean);
   const missing=modules.filter(name=>!urls.some(src=>src.includes('/'+name+'?v=')));
   return {missing,
    fullPdf:typeof window.TIM_PHYSICS_INLINE_PDF?.createFullInline==='function',
    office:typeof window.TIM_INLINE_ENT_DOCUMENTS?.renderOfficeDocument==='function',
    svt:typeof window.TIM_SVT_DOCUMENTS?.render==='function',
    english:typeof window.TIM_ENGLISH_DOCUMENTS?.render==='function'};
  });
  if(production.missing.length||!production.fullPdf||!production.office||!production.svt||!production.english)
   throw Error('Modules Cloudflare absents ou inactifs : '+production.missing.join(', '));
  console.log('VERSION Cloudflare '+label+' : six modules originaux chargés, sans suffixe figé.');
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
  await inspectNov17Lessons(page,label);
 }finally{await context.close();}
}

/* Contrôle ciblé ajouté sur branche d'audit : navigation réelle dans les leçons
   publiées, sans importer, valider ni modifier la moindre donnée de Tim. */
async function inspectNov17Lessons(page,device){
 // Appeler le rendu de la matière réellement publiée dans son conteneur normal.
 // Le menu Matières est masqué sur certains formats du compte Parent.
 await page.evaluate(async()=>{
  const root=document.getElementById('matieres-content');
  if(!root||!window.TIM_SPANISH_ENT_EXACT?.render)throw Error('Parcours espagnol indisponible');
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id==='matieres'));
  root.replaceChildren();
  await window.TIM_SPANISH_ENT_EXACT.render(root,{});
 });
 // L'introduction se déclenche parfois après la connexion : la fermer comme
 // le Parent le ferait avant de contrôler le vrai rendu de la matière.
 const lateIntro=page.locator('#intro-screen');
 if(await lateIntro.isVisible()){
  await page.evaluate(()=>document.getElementById('intro-silent')?.click());
  await lateIntro.waitFor({state:'hidden',timeout:14000});
 }
 await page.evaluate(()=>{
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id==='matieres'));
 });
 await page.waitForFunction(()=>[...document.querySelectorAll('#matieres-content details.tim-es-lesson')]
  .some(x=>/17 novembre|17\/11/i.test(x.querySelector(':scope > summary')?.textContent||'')),
  null,{timeout:20000});
 const spanish=page.locator('#matieres-content details.tim-es-lesson')
  .filter({has:page.locator('summary').filter({hasText:/17 novembre|17\/11/i})}).first();
 await spanish.evaluate(node=>{
  let current=node;
  while(current){
   if(current.tagName==='DETAILS')current.open=true;
   current=current.parentElement;
  }
 });
 await page.waitForFunction(()=>[...document.querySelectorAll('#matieres-content .tim-nov17-original')]
  .filter(x=>x.closest('details.tim-es-lesson')?.open).length>=3,null,{timeout:30000});
 const spanishFiles=[
  {key:'11 Presente de indicativo LISTA 2.pdf',label:'espagnol liste 2'},
  {key:'3D.pdf — version du 17 novembre',label:'espagnol 3D du 17 novembre'}
 ];
 for(const file of spanishFiles){
  const row=spanish.locator('.tim-nov17-original').filter({hasText:file.key}).first();
  if(await row.count()!==1)throw Error('Leçon espagnole : référence '+file.label+' absente');
  const viewer=row.locator('.pc-inline-full-document');
  if(await viewer.count()!==1)throw Error('Leçon espagnole : PDF '+file.label+' pas intégré automatiquement');
  const opening=await row.locator('button').allTextContents();
  if(opening.some(s=>/ouvrir|afficher ici|lire.*document/i.test(s)))
    throw Error('Leçon espagnole : bouton de lecture encore requis pour '+file.label);
  const layout=await viewer.evaluate(node=>{
   const rows=[];let target=node;
   while(target&&rows.length<24){
    const st=getComputedStyle(target),rect=target.getBoundingClientRect();
    rows.push({tag:target.tagName,id:String(target.id||''),cls:String(target.className||'').slice(0,70),
     display:st.display,visibility:st.visibility,width:Math.round(rect.width),
     height:Math.round(rect.height),open:target.tagName==='DETAILS'?target.open:null});
    target=target.parentElement;
   }
   return rows;
  });
  console.log('GEOMETRIE '+device+' '+file.label+' '+JSON.stringify(layout));
  await viewer.scrollIntoViewIfNeeded({timeout:12000});
  const ready=await page.waitForFunction(key=>{
   const rows=[...document.querySelectorAll('#matieres-content .tim-nov17-original')];
   const row=rows.find(x=>x.querySelector('h4')?.textContent.includes(key));
   return (row?.querySelectorAll('.pc-pdf-page').length||0)>0;
  },file.key,{timeout:40000}).then(()=>true).catch(()=>false);
  if(!ready)throw Error('Leçon espagnole : pages du PDF non chargées '+file.label);
  const total=await row.locator('.pc-pdf-page').count();
  if(!total)throw Error('Leçon espagnole : PDF vide '+file.label);
  for(let i=0;i<total;i++){
   await row.locator('.pc-pdf-page').nth(i).scrollIntoViewIfNeeded({timeout:15000});
   const painted=await page.waitForFunction(({key,index})=>{
    const rows=[...document.querySelectorAll('#matieres-content .tim-nov17-original')];
    const row=rows.find(x=>x.querySelector('h4')?.textContent.includes(key));
    const frame=row?.querySelectorAll('.pc-pdf-page')[index];
    const canvas=frame?.querySelector('canvas');
    return frame?.dataset.rendered==='1'&&canvas?.width>100&&canvas?.height>100;
   },{key:file.key,index:i},{timeout:40000}).then(()=>true).catch(()=>false);
   if(!painted)throw Error('Leçon espagnole : page '+(i+1)+'/'+total+' illisible '+file.label);
  }
  console.log('VISUEL '+device+' '+file.label+' : '+total+'/'+total+
   ' pages rendues dans la leçon sans bouton d’ouverture');
 }
 await page.evaluate(()=>{
  const root=document.getElementById('matieres-content');
  if(!root||!window.TIM_SVT_PATH?.render)throw Error('Parcours SVT indisponible');
  root.replaceChildren();
  window.TIM_SVT_PATH.render(root,{openLessonId:'SVT_ENT_20261117'});
 });
 const chapter=page.locator('#matieres-content details.chapter-section')
  .filter({has:page.locator('summary').filter({hasText:'Lymphocytes B et T'})}).first();
 if(await chapter.count()!==1)throw Error('Chapitre SVT Lymphocytes B et T introuvable');
 if(await chapter.getAttribute('open')===null)await chapter.locator(':scope > summary').click();
 const lesson=chapter.locator('details.tim-es-lesson')
  .filter({has:page.locator('summary').filter({hasText:'17/11/2026'})}).first();
 if(await lesson.count()!==1)throw Error('Leçon SVT du 17 novembre absente');
 if(await lesson.getAttribute('open')===null)await lesson.locator(':scope > summary').click();
 const figure=lesson.locator('.tim-inline-ent-file')
  .filter({hasText:'Capture d\'écran 2026-11-17 102650.png'}).first();
 await figure.waitFor({state:'attached',timeout:30000});
 if(await figure.locator('.tim-inline-image-button').count())
  throw Error('Leçon SVT : bouton d’ouverture du schéma encore nécessaire');
 await figure.scrollIntoViewIfNeeded({timeout:12000});
 const image=figure.locator('img');
 await image.waitFor({state:'visible',timeout:35000});
 const loaded=await page.waitForFunction(()=>{
  const lesson=[...document.querySelectorAll('#matieres-content details.tim-es-lesson')]
   .find(x=>(x.querySelector(':scope > summary')?.textContent||'').includes('17/11/2026'));
  const img=lesson?.querySelector('.tim-inline-ent-file img');
  return !!img?.complete&&img.naturalWidth>0&&img.naturalHeight>0;
 },null,{timeout:35000}).then(()=>true).catch(()=>false);
 if(!loaded)throw Error('Leçon SVT : schéma non visible ou image illisible');
 const dims=await image.evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight}));
 console.log('VISUEL '+device+' SVT lymphocytes T : image '+dims.w+'x'+dims.h+
  ' visible dans la leçon sans bouton d’ouverture');
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
