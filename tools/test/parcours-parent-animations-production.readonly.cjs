'use strict';
// Contrôle du site Cloudflare réel. Compte Parent seulement, copies fictives,
// aucune validation Tim, blocage des requêtes non autorisées avant tout envoi.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const SITE=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const OUT=path.resolve('audit-production-tim-sans-impact');
const readActions=new Set([
 'getParentBonus','getSpanishDailyMissions','getMixedChallengePlan','getParentReport',
 'getSpanishTrainingProgress','getTimReleasedCorrections','getMathEntProgress',
 'getMathTrainingProgress','getSpanishEntTrainingProgress','getPhysicsTrainingProgress',
 'getPhysicsEntProgress','getSpanishEntTrainingTask','getMathTrainingTask',
 'getEnglishTrainingTask','getEnglishTrainingProgress',
 'getSvtTrainingTask','getSvtTrainingProgress',
 'getHgTrainingTask','getHgTrainingProgress',
 'getFrTrainingTask','getFrTrainingProgress',
 'getTimCourseContent',
 'getMathEntTask','getPhysicsTrainingTask','getPhysicsEntTask',
 'previewMixedChallenge'
]);
const report={site:SITE,checks:[],blockedNonRead:0,blockedHosts:[],mode:'simulation Parent sans écriture'};
function check(label,condition){
 report.checks.push({label,ok:Boolean(condition)});
 assert(condition,label);
 console.log('OK '+label);
}
async function routeSafe(route){
 const req=route.request(),method=req.method().toUpperCase();
 if(['GET','HEAD','OPTIONS'].includes(method))return route.continue();
 const url=new URL(req.url());
 if(method==='POST'){
  if(['identitytoolkit.googleapis.com','securetoken.googleapis.com'].includes(url.hostname)||
     (url.hostname==='www.googleapis.com'&&url.pathname.includes('/identitytoolkit/')))
   return route.continue();
  if(url.hostname==='firestore.googleapis.com' &&
     (/(?:batchGet|runQuery|runAggregationQuery|listen)$/i.test(url.pathname) ||
      /\/Firestore\/Listen\/channel/i.test(url.pathname)))
   return route.continue();
  if(url.pathname==='/api/tim'){
   let payload={};try{payload=req.postDataJSON()||{};}catch{}
   if(readActions.has(payload.action))return route.continue();
  }
 }
 report.blockedNonRead++;
 const category=url.pathname.match(/Firestore\/([^/?]+)\/channel/i)?.[1]||
  url.pathname.match(/:(batchGet|runQuery|listen|commit|batchWrite|write)$/i)?.[1]||'autre';
 report.blockedHosts.push(url.hostname+' '+method+' '+category);
 return route.abort('blockedbyclient');
}
async function animations(browser){
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,
  locale:'fr-FR',timezoneId:'Europe/Paris'});
 try{
  const page=await ctx.newPage();
  await page.route('**/*',r=>{
   if(['GET','HEAD','OPTIONS'].includes(r.request().method()))return r.continue();
   report.blockedNonRead++;return r.abort('blockedbyclient');
  });
  const res=await page.goto(SITE,{waitUntil:'domcontentloaded',timeout:45000});
  check('Site de production accessible en invité',res && res.ok());
  await page.waitForFunction(()=>typeof window.TIM_ANIMATIONS?.playResult==='function',null,{timeout:20000});
  await page.evaluate(()=>{void window.TIM_ANIMATIONS.playOpening();});
  check('Vraie animation ouverture affichée',await page.locator('.tim-anim-overlay video').isVisible());
  await page.getByRole('button',{name:'Passer l’animation'}).click();
  await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
  for(const [kind,xp,score,total] of [
   ['daily',3,10,10],['daily',2,8,10],['daily',1,6,10],['daily',0,3,10],
   ['daily',-1,1,10],['training',2.5,8,10],['sunday',20,20,20]
  ]){
   await page.evaluate(v=>{void window.TIM_ANIMATIONS.playResult(
    {kind:v.kind},{xp:v.xp,score:v.score,total:v.total,
     correctionStatus:'released',correctionLocked:false});},{kind,xp,score,total});
   const layer=page.locator('.tim-anim-overlay');
   await layer.waitFor({timeout:10000});
   const media=layer.locator('video,img').first();
   if(await media.count()){
    const type=await media.evaluate(e=>e.tagName);
    if(type==='VIDEO'){
     await page.waitForFunction(()=>{
      const x=document.querySelector('.tim-anim-overlay video');
      return x&&x.readyState>=2;
     },null,{timeout:12000});
     await media.evaluate(e=>e.dispatchEvent(new Event('ended')));
    }else{
     await page.waitForFunction(()=>{
      const x=document.querySelector('.tim-anim-overlay img');
      return x&&x.complete&&x.naturalWidth>0;
     },null,{timeout:12000});
     // Média réellement chargé ; seule sa fin de lecture est accélérée.
     await media.evaluate(e=>e.dispatchEvent(new Event('error')));
    }
   }
   const award=layer.locator('.tim-anim-award:not([hidden])');
   await award.waitFor({timeout:10000});
   const expected=(xp>0?'+':'')+String(xp).replace('.',',')+' XP';
   check('XP fictifs correctement affichés : '+expected,
    (await award.locator('.tim-anim-award-value').innerText()).trim()===expected);
   check('Note fictive affichée : '+score+'/'+total,
    (await award.locator('.tim-anim-award-grade').innerText()).includes(score+' / '+total));
   if([3,-1,2.5,20].includes(xp))
    await layer.screenshot({path:path.join(OUT,'animation-fictive-'+String(xp).replace('.','_')+'.png')});
   await layer.getByRole('button',{name:'Voir ma correction'}).click();
   await layer.waitFor({state:'detached'});
  }
  check('Animations : aucune requête interdite',report.blockedNonRead===0);
 }finally{await ctx.close();}
}
async function parent(browser){
 const {mixedMission}=await import('../../worker/mixed-challenges.mjs');
 assert(process.env.TIM_PARENT_EMAIL&&process.env.TIM_PARENT_PASSWORD,'Secrets Parent absents');
 const ctx=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true,
  locale:'fr-FR',timezoneId:'Europe/Paris'});
 try{
  const page=await ctx.newPage();
  await page.route('**/*',routeSafe);
  await page.goto(SITE,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
  await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
  await page.locator('#login-button').click();
  try{
   await page.waitForFunction(()=>document.body.classList.contains('ready')&&
    window.__TIM_PARENT===true&&typeof window.__TIM_BRIDGE?.mixedMissionPreview==='function',
    null,{timeout:35000});
  }catch{
   const state=await page.evaluate(()=>({
    ready:document.body.classList.contains('ready'),
    parent:window.__TIM_PARENT===true,
    bridge:typeof window.__TIM_BRIDGE?.mixedMissionPreview==='function',
    loginVisible:!!document.querySelector('#login-form:not([hidden])'),
    statusPresent:Boolean(document.querySelector('#access-status')?.textContent?.trim())
   }));
   console.log('Diagnostic Parent non sensible : '+JSON.stringify(state)+
    ', appels bloqués : '+JSON.stringify(report.blockedHosts));
   throw Error('Chargement du compte Parent incomplet.');
  }
  check('Connexion au compte Parent exclusivement',await page.evaluate(()=>window.__TIM_PARENT===true));
  const m=await page.evaluate(()=>{
   const plan=window.__TIM_CHALLENGES||{};
   const day=new Date(String(plan.today)+'T12:00:00Z').getUTCDay();
   const id=day===6?plan.weekly:day===0?plan.sunday:plan.dailyIds?.[0];
   const ex=window.__TIM_DATA?.exercises?.find(e=>e.id===id);
   return {id,kind:ex?.kind,count:ex?.questions?.length,bank:ex?.questionBank};
  });
  check('Défi actuel réel disponible',m.id&&m.bank==='mixed-202611-v1'&&[10,20].includes(m.count));
  const zero=await page.evaluate(v=>window.__TIM_BRIDGE.mixedMissionPreview(
    v.id,Array(v.count).fill(''),[]),m);
  check('Simulation vide non enregistrée, 0 XP',zero.practice===true&&zero.saved===false&&
   zero.submitted===false&&zero.xp===0&&zero.score===0&&zero.total===m.count);
  check('Corrections de toutes les questions vides',zero.answers?.length===m.count);
  const fixture=mixedMission(m.id);
  check('Banque complète pour la simulation positive',fixture?.questions?.length===m.count);
  const solutions=fixture.questions.map(q=>{
   if(q.type==='mc'||q.type==='text')return String(q.right);
   return JSON.stringify({m:String(q.right),
    c:q.parts.filter(n=>typeof n==='number').join(' ; ')+' '+
      q.parts.filter(n=>typeof n==='string').join(' '),
    s:'La réponse au problème est '+q.answer+' '+(q.unit||'unités')+'.'});
  });
  const graded=await page.evaluate(v=>window.__TIM_BRIDGE.mixedMissionPreview(v.id,v.answers,[]),
   {id:m.id,answers:solutions});
  check('Simulation positive sans note ni XP Tim',graded.practice===true&&
   graded.saved===false&&graded.submitted===false&&graded.xp===0&&graded.score>0&&
   graded.total===m.count);
  check('Explications pédagogiques présentes',graded.answers?.length===m.count&&
   graded.answers.every(x=>typeof x.explanation==='string'&&x.explanation.length>0));
  report.scoreDeSimulationFictif=graded.score;
  // Contrôle du vrai bouton dans l'interface Parent, sans jamais cliquer sur Valider Tim.
  const selector=m.kind==='daily'?'.daily-loup-launch':
   m.kind==='sunday'?'.sunday-card .mission-launch':'.weekly-card .mission-launch';
  const launch=page.locator(selector).first();
  check('Bouton du défi utilisable',await launch.count()===1);
  await launch.evaluate(b=>b.click());
  const skip=page.getByRole('button',{name:'Voir ma correction'});
  if(await skip.isVisible().catch(()=>false))await skip.click();
  const detail=page.locator('#exercise-detail');
  await detail.getByText('Essai Parent — méthode du défi').waitFor({timeout:20000});
  await detail.getByRole('button',{name:'Commencer mon essai Parent'}).evaluate(b=>b.click());
  for(let i=0;i<m.count;i++)
   await detail.locator('.mix-nav button').last().evaluate(b=>b.click());
  const correct=detail.getByRole('button',{name:'Corriger mon essai Parent (sans XP)'});
  check('Bouton de correction Parent disponible',await correct.isEnabled());
  await correct.evaluate(b=>b.click());
  await detail.getByText('Note de mon essai Parent : 0/'+m.count).waitFor({timeout:30000});
  check('Corrections visibles sur toutes les questions',
   await detail.locator('.mix-correction').count()===m.count);
  check('Aucune requête d’écriture tentée',report.blockedNonRead===0);
  // Pas de capture des copies ni des notes privées Parent.
 }finally{await ctx.close();}
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{}),
  args:['--autoplay-policy=no-user-gesture-required','--no-sandbox']});
 try{await animations(browser);await parent(browser);}
 finally{await browser.close();}
 fs.writeFileSync(path.join(OUT,'rapport.json'),JSON.stringify({...report,
  date:new Date().toISOString(),status:'pass'},null,2)+'\n');
 console.log('TERMINÉ : production inspectée en simulation Parent, aucune écriture Tim.');
})().catch(err=>{
 fs.mkdirSync(OUT,{recursive:true});
 fs.writeFileSync(path.join(OUT,'rapport.json'),JSON.stringify({...report,
  date:new Date().toISOString(),status:'failed'},null,2)+'\n');
 console.error('ÉCHEC DU CONTRÔLE : '+String(err?.message||err).slice(0,180));
 process.exitCode=1;
});
