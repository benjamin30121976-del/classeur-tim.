'use strict';
(async function auditRunner(){
 'use strict';
 const {chromium}=require('playwright');
 const fs=require('node:fs'),path=require('node:path');
 const site=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
 const report={site,checks:[],blockedMutations:0,errors:[],started:new Date().toISOString()};
 const folder=path.join(process.cwd(),'audit-13nov-report');fs.mkdirSync(folder,{recursive:true});
 const safe=s=>String(s||'').slice(0,180);
 const record=(id,ok,detail='')=>{report.checks.push({id,ok,detail:safe(detail)});console.log((ok===true?'OK':ok===false?'FAIL':'UNKNOWN')+' '+id+' '+safe(detail))};
 async function openSubject(page,subject){
   await page.locator('[data-nav="matieres"]:visible').first().click({timeout:9000});
   const card=page.locator('#matieres-content button.matter-card').filter({hasText:subject}).first();
   if(!await card.count())throw Error('Carte '+subject+' absente');
   if(await card.isDisabled())throw Error('Carte '+subject+' désactivée');
   await card.click({timeout:9000});
 }
 async function checkChapter(page,role,subject,chapter,key,requirements){
   try{
     await openSubject(page,subject);
     const g=page.locator('#matieres-content details.chapter-section').filter({hasText:chapter}).first();
     if(!await g.count())throw Error('Chapitre '+chapter+' absent');
     await g.locator(':scope > summary').click({timeout:7000});
     const lesson=g.locator('details.tim-es-lesson').filter({hasText:'13/11/2026'}).first();
     if(!await lesson.count())throw Error('Séance du 13 absente');
     await lesson.locator(':scope > summary').click({timeout:7000});
     for(const [tab,words] of Object.entries(requirements)){
       await lesson.locator('button[data-tab="'+tab+'"]').click({timeout:7000});
       const txt=await lesson.locator('section.panel').first().innerText();
       const pass=words.every(w=>txt.toLowerCase().includes(w.toLowerCase()));
       record(role+' '+key+' onglet '+tab,pass,words.join(' / '));
       if(tab==='bis'){
         const num=await lesson.locator('section.panel svg').count();
         record(role+' '+key+' schéma',num>0,'SVG '+num);
         if(role.startsWith('guest')){
           const f=path.join(folder,role+'-'+key+'-bis.png');
           await lesson.screenshot({path:f,timeout:9000,animations:'disabled'}).catch(()=>{});
         }
       }
     }
     await lesson.locator('button[data-tab="train"]').click({timeout:7000});
     const btns=lesson.locator('section.panel button');
     record(role+' '+key+' 2 exercices visibles',(await btns.count())>=2,'boutons '+await btns.count());
     if(role.startsWith('guest')){
       await btns.first().click();
       const result=await lesson.locator('section.panel').innerText();
       record(role+' '+key+' exercice réservé',/réservés aux comptes|Visiteur/i.test(result));
     }
   }catch(e){record(role+' '+key+' navigation',false,e.message)}
 }
 async function auditPage(browser,role,width,height){
   const tag=role+'-'+width;
   const ctx=await browser.newContext({viewport:{width,height},locale:'fr-FR',reducedMotion:'reduce'});
   const page=await ctx.newPage();
   page.on('pageerror',e=>report.errors.push(tag+': '+safe(e.message)));
   await page.route('**/api/tim',async route=>{
     let action='';try{action=route.request().postDataJSON().action||''}catch{}
     if(!/^(get|read|list|preview|check)/i.test(action)){report.blockedMutations++;await route.abort('blockedbyclient');return}
     await route.continue();
   });
   try{
     const res=await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
     record(tag+' HTTP 200',res?.status()===200,'HTTP '+res?.status());
     await page.locator('#'+(role==='parent'?'parent':'guest')+'-enter').click();
     if(role==='parent'){
       if(!process.env.TIM_PARENT_EMAIL||!process.env.TIM_PARENT_PASSWORD){record(tag+' connexion Parent',null,'Secrets CI absents');return}
       await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
       await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
       await page.locator('#login-button').click();
       await page.locator('body.ready').waitFor({timeout:55000});
       record(tag+' Parent authentifié',await page.evaluate(()=>window.__TIM_PARENT===true));
     }else{
       await page.locator('body.guest-mode').waitFor({timeout:25000});
       record(tag+' mode Invité',true);
     }
     await page.waitForFunction(()=>!!window.TIM_HG_PACK&&!!window.TIM_SVT_PACK&&!!window.TIM_MATH_PATH,null,{timeout:30000});
     const intro=page.locator('#intro-screen');
     if(await intro.isVisible()){
       const skip=page.locator('#intro-silent');if(await skip.isVisible())await skip.click();
       await intro.waitFor({state:'hidden',timeout:16000}).catch(()=>{});
     }
     const versions=await page.evaluate(async()=>{
       const urls=['/histoire-geographie-pack.js','/svt-pack.js','/maths-parcours.js','/boot.js','/worker/hg-questions.mjs'];
       const r={};for(const u of urls){const a=await fetch(u,{cache:'no-store'});const text=await a.text();r[u]={http:a.status,marker:text.includes('HGQ_L0[1-9]')};}return r;
     });
     if(role==='guest'&&width===1365){
       for(const [url,v] of Object.entries(versions)){
         record('PUBLIC '+url,url.includes('worker/')?v.http!==200:v.http===200,'HTTP '+v.http);
       }
       record('PUBLIC boot accepte HG09',versions['/boot.js'].marker,'Identifiants HGQ_L09 autorisés côté client');
     }
     const packs=await page.evaluate(()=>({hg:window.TIM_HG_PACK?.bis?.length,svt:window.TIM_SVT_PACK?.bis?.length,math:!!window.TIM_MATH_PATH}));
     record(tag+' 9 leçons BIS HG',packs.hg===9);
     record(tag+' 7 leçons BIS SVT',packs.svt===7);
     await checkChapter(page,tag,'Histoire-géographie','Nazisme : dictature et persécutions','HG',{
       ent:['bilan EMC','nazisme'],bis:['1933','1935','Shoah'],help:['Propagande','Antisémitisme'],entex:['définir 5 mots','16/11/2026']
     });
     await checkChapter(page,tag,'SVT','Phagocytose','SVT',{
       ent:['Séance','13/11/2026'],bis:['phagocytose','englober','Je vois'],help:['repérer','englober'],entex:['Leçon','13/11/2026']
     });
     if(role==='guest'){
       await page.locator('[data-nav="matieres"]:visible').first().click();
       const names=await page.locator('#matieres-content button.matter-card strong').allTextContents();
       record(tag+' 7 matières',['Espagnol','Mathématiques','Physique-chimie','Anglais','SVT','Histoire-géographie','Français'].every(s=>names.includes(s)));
       record(tag+' Math Invité protégé',await page.locator('#matieres-content button.matter-card').filter({hasText:'Mathématiques'}).first().isDisabled());
     }else{
       try{
         await openSubject(page,'Mathématiques');
         const home=await page.locator('#matieres-content').innerText();
         record(tag+' Math ENT 13',home.includes('13 novembre')&&home.includes('Thalès'));
         await page.locator('#matieres-content [data-math-reciproque]').first().click({timeout:8000});
         const txt=await page.locator('#matieres-content').innerText();
         record(tag+' Math BIS réciproque / contraposée',txt.includes('réciproque du théorème de Thalès')&&txt.includes('contraposée')&&txt.includes('AD/AB'));
         record(tag+' Math schéma',await page.locator('#matieres-content svg').count()>0);
         record(tag+' Math 3 exercices',await page.locator('#matieres-content [data-math-nov12-ex]').count()===3);
       }catch(e){record(tag+' Maths navigation',false,e.message)}
       for(const [label,method,id] of [
         ['HG ancien QCM','hgTrainingTask','HGQ_L08_01'],
         ['HG nouveau QCM','hgTrainingTask','HGQ_L09_01'],
         ['HG nouveau écrit','hgTrainingTask','HGQ_L09_02'],
         ['SVT phagocytose QCM','svtTrainingTask','SVQ_L07_01'],
         ['Math QCM','mathTrainingTask','MT01'],
         ['HG résultats globaux','hgTrainingProgress',null],
         ['SVT résultats globaux','svtTrainingProgress',null],
         ['HG copie ciblée','hgTrainingProgress','HGQ_L09_01']
       ]){
         const result=await page.evaluate(async ([method,id])=>{
           try{const v=id===null?await window.__TIM_BRIDGE[method]():await window.__TIM_BRIDGE[method](id);
             const q=v?.task?.questions||[];return {ok:true,count:q.length,leaked:q.some(x=>['right','expected','explanation','accepted','answer'].some(k=>Object.hasOwn(x,k))),hasList:Array.isArray(v?.attempts),hasCopy:'attempt' in (v||{})};
           }catch(e){return {ok:false,error:String(e?.message||e).slice(0,120)}}
         },[method,id]);
         const expectedTask=method.includes('Task');
         record(tag+' '+label,result.ok&&(!expectedTask||result.count===10)&&!result.leaked,result.ok?'10 questions='+result.count+' ; copie ou liste='+!!(result.hasList||result.hasCopy):result.error);
       }
     }
   }catch(e){record(tag+' audit interrompu',false,e.message)}
   finally{await ctx.close()}
 }
 const browser=await chromium.launch({headless:true});
 try{
   await auditPage(browser,'guest',1365,900);
   await auditPage(browser,'guest',390,844);
   await auditPage(browser,'parent',390,844);
 }finally{await browser.close()}
 report.finished=new Date().toISOString();
 fs.writeFileSync(path.join(folder,'bilan.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(folder,'bilan.md'),['# Audit ciblé du 13 novembre','',...report.checks.map(x=>'- '+(x.ok===true?'OK':x.ok===false?'ÉCHEC':'NON TESTÉ')+' : '+x.id+' — '+x.detail),'','Requêtes de mutation bloquées : '+report.blockedMutations].join('\n'));
 console.log('AUDIT_TOTAL '+JSON.stringify({ok:report.checks.filter(x=>x.ok===true).length,failed:report.checks.filter(x=>x.ok===false).length,unknown:report.checks.filter(x=>x.ok===null).length,mutationBlocked:report.blockedMutations}));
 if(report.checks.some(x=>x.ok===false))process.exitCode=1;
})().catch(e=>{console.error('AUDIT FATAL '+String(e?.message||e).slice(0,130));process.exitCode=1;});
