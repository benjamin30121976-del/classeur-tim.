'use strict';
/*
  Contrôle exhaustif des notes / XP sur le SITE PUBLIC publié.
  Note: toutes les notes sont fictives. AUCUN appel de validation et AUCUNE
  connexion au compte Tim. Les seules requêtes réseau autorisées sont GET/HEAD.
  Le module de notation est importé du dépôt pour comparer indépendamment les seuils.
*/
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const URL_SITE=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const OUT=path.resolve('audit-production-tim-sans-impact');
fs.mkdirSync(OUT,{recursive:true});
const report={mode:'simulations fictives sans écriture',site:URL_SITE,summary:{},scenarios:[],issues:[],blocked:0};

const specs=[
 {kind:'daily',total:10,boundaries:[[.9,3],[.7,2],[.5,1],[.2,0],[0,-1]]},
 {kind:'weekly',total:20,boundaries:[[.85,10],[.75,7],[.6,4],[.5,1],[.4,0],[0,-1]]},
 {kind:'sunday',total:20,boundaries:[[.85,20],[.75,14],[.6,8],[.5,2],[.4,0],[0,-2]]},
 {kind:'bonus-parent',total:10,boundaries:[[.85,5],[0,0]]},
 {kind:'bonus-day',total:10,boundaries:[[.7,5],[.5,2.5],[0,0]]}
];
const expected=(spec,score)=>spec.boundaries.find(([threshold])=>score/spec.total>=threshold-1e-12)[1];
function mediaKey(spec,xp){
 if(xp===2.5)return 'plus2half';
 if(spec.kind==='daily')return {'3':'plus3','2':'plus2','1':'plus1','0':'zero','-1':'minus1'}[String(xp)]||null;
 if(spec.kind==='sunday'&&xp===20)return 'sunday';
 return null;
}
function label(n){return (n>0?'+':'')+n.toLocaleString('fr-FR')+' XP';}
function signal(message){report.issues.push(message);console.log('ANOMALIE : '+message);}
async function auditBarèmes(){
 const {rawPoints,cappedPoints}=await import('../../functions/xp.mjs');
 const {mixedMission,mixedPlan}=await import('../../worker/mixed-challenges.mjs');
 let tested=0;
 for(const spec of specs){
  for(let q=0;q<=spec.total*4;q++){
   const score=q/4,truth=expected(spec,score);
   const actual=rawPoints({kind:spec.kind,category:'challenge',score,total:spec.total,needsReview:false});
   assert.equal(actual,truth,spec.kind+' '+score+'/'+spec.total);
   assert.equal(cappedPoints(actual,100,100,100,100,'challenge'),truth,
    'Les limites du bonus libre ne doivent pas écrêter un défi.');
   tested++;
  }
  assert.equal(rawPoints({kind:spec.kind,category:'challenge',
   score:spec.total,total:spec.total,needsReview:true}),0,
   'Copie à revoir = pas de gain hypothétique');
 }
 // Trois défis quotidiens, un samedi et un dimanche : banques valides
 const mon=mixedPlan(new Date('2026-11-16T12:00:00Z'));
 assert.equal(mon.dailyIds.length,3);
 for(const id of mon.dailyIds){
  const ex=mixedMission(id);
  assert.equal(ex?.kind,'daily');
  assert.equal(ex?.questions?.length,10);
 }
 for(const [id,kind] of [[mon.weekly,'weekly'],[mon.sunday,'sunday']]){
  const ex=mixedMission(id);assert.equal(ex?.kind,kind);assert.equal(ex.questions.length,20);
 }
 report.summary.barèmeTests=tested;
 console.log('OK '+tested+' cas de notation indépendants (quart de point compris).');
}
async function runBrowser(mobile){
 const target=mobile?'mobile':'bureau';
 const {rawPoints}=await import('../../functions/xp.mjs');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},
  isMobile:mobile,hasTouch:mobile,locale:'fr-FR',timezoneId:'Europe/Paris'});
 try{
  const page=await context.newPage();
  await page.route('**/*',route=>{
   if(['GET','HEAD'].includes(route.request().method().toUpperCase()))return route.continue();
   report.blocked++;return route.abort('blockedbyclient');
  });
  const response=await page.goto(URL_SITE,{waitUntil:'domcontentloaded',timeout:45000});
  assert(response&&response.ok(),'Site de production indisponible');
  await page.waitForFunction(()=>typeof window.TIM_ANIMATIONS?.playResult==='function'&&
    typeof window.TIM_XP?.contribution==='function',null,{timeout:20000});
  const published=await page.evaluate(()=>({
   scripts:[...document.scripts].map(s=>s.src).filter(Boolean),
   mappings:Object.fromEntries(['opening','plus3','plus2','plus1','zero','minus1','plus2half','sunday']
     .map(k=>[k,window.TIM_ANIMATIONS.url(k)]))
  }));
  assert(published.scripts.some(s=>s.includes('tim-animations.js?v=revelation-xp-defis-20261113-v2')),
   'Le site n’utilise pas la version contrôlée du lecteur');
  // En exercice neuf le vrai média d'entrée doit être décodable.
  await page.evaluate(()=>{void window.TIM_ANIMATIONS.playOpening()});
  const opening=page.locator('.tim-anim-overlay video');
  await opening.waitFor({timeout:5000});
  await page.waitForFunction(()=>{const v=document.querySelector('.tim-anim-overlay video');return v&&v.readyState>=2;},
   null,{timeout:12000});
  assert((await opening.getAttribute('src')).includes('Tan_Tan_V6_Moins_Aigue.mp4'));
  await page.getByRole('button',{name:'Passer l’animation'}).click();
  await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
  let displayed=0;
  for(const spec of specs){
   const cases=mobile?
    [...Array.from({length:spec.total+1},(_,n)=>n),...{
      daily:[1.75,4.75,6.75,8.75,9.25],
      weekly:[7.75,9.75,11.75,14.75,16.75,17.25],
      sunday:[7.75,9.75,11.75,14.75,16.75,17.25],
      'bonus-parent':[8.5,8.75,9.25],
      'bonus-day':[4.75,5.25,6.75,7.25]
     }[spec.kind]]:
    ({daily:[0,1,2,5,7,9,10],weekly:[0,8,10,12,15,17,20],
      sunday:[0,8,10,12,15,17,20],'bonus-parent':[0,8,9,10],
      'bonus-day':[0,5,6,7,10]})[spec.kind];
   for(const score of cases){
    const xp=expected(spec,score),key=mediaKey(spec,xp);
    assert.equal(rawPoints({kind:spec.kind,category:'challenge',score,total:spec.total}),xp);
    const fromClient=await page.evaluate(v=>window.TIM_XP.contribution(
      {score:v.score,total:v.total,needsReview:false,policyVersion:18},
      {kind:v.kind,category:'challenge'}),{kind:spec.kind,score,total:spec.total});
    assert.equal(fromClient,xp,'Recalcul frontend différent du serveur '+spec.kind+' '+score);
    await page.evaluate(v=>{void window.TIM_ANIMATIONS.playResult(
      {kind:v.kind,category:'challenge'},
      {xp:v.xp,score:v.score,total:v.total,correctionStatus:'released',correctionLocked:false});},
      {kind:spec.kind,score,total:spec.total,xp});
    const overlay=page.locator('.tim-anim-overlay');await overlay.waitFor({timeout:5000});
    const media=overlay.locator('.tim-anim-media');
    if(key){
     assert.equal(await media.count(),1,'Média absent '+spec.kind+' '+score);
     assert((await media.getAttribute('src')).endsWith(published.mappings[key].split('/').pop()),
      'Animation incorrecte '+spec.kind+' '+score);
     if(await media.evaluate(e=>e.tagName)==='VIDEO'){
      await page.waitForFunction(()=>{const v=document.querySelector('.tim-anim-overlay video');
       return v&&v.readyState>=2;},null,{timeout:12000});
      await media.evaluate(e=>e.dispatchEvent(new Event('ended')));
     }else{
      await page.waitForFunction(()=>{const i=document.querySelector('.tim-anim-overlay img');
       return i&&i.complete&&i.naturalWidth>0;},null,{timeout:12000});
      await media.evaluate(e=>e.dispatchEvent(new Event('error')));
     }
    }else assert.equal(await media.count(),0,'Film trompeur '+spec.kind+' '+score+' XP '+xp);
    const award=overlay.locator('.tim-anim-award:not([hidden])');await award.waitFor({timeout:4000});
    const shownXp=(await award.locator('.tim-anim-award-value').innerText()).trim();
    assert.equal(shownXp,label(xp),'XP incorrects '+spec.kind+' '+score);
    const shownNote=(await award.locator('.tim-anim-award-grade').innerText()).trim();
    const expectedNote='Note : '+score.toLocaleString('fr-FR')+' / '+spec.total;
    if(shownNote!==expectedNote){
     // L'absence de virgule n'altère pas les résultats, mais elle sera signalée.
     if(!shownNote.includes(''+score+' / '+spec.total))
       throw Error('Note incohérente '+spec.kind+' '+score+' : '+shownNote);
     if(!report.issues.includes('Les notes fractionnaires sont affichées avec un point au lieu de la virgule française'))
      signal('Les notes fractionnaires sont affichées avec un point au lieu de la virgule française');
    }
    if(mobile&&[
      'daily:10','daily:8','daily:6','daily:3','daily:1',
      'weekly:17','weekly:15','weekly:12','weekly:10','weekly:8','weekly:7',
      'sunday:17','sunday:15','sunday:12','sunday:10','sunday:8','sunday:7',
      'bonus-parent:9','bonus-day:5'].includes(spec.kind+':'+score)){
      await overlay.screenshot({path:path.join(OUT,'defi-'+spec.kind+'-'+String(score).replace('.','_')+'.png')});
    }
    // L'écran se ferme automatiquement après l'affichage. Si le délai a
    // expiré, ne pas attendre pendant 30 s un bouton déjà supprimé.
    await page.evaluate(()=>{
      const button=document.querySelector('.tim-anim-overlay .tim-anim-skip');
      if(button&&button.textContent==='Voir ma correction')button.click();
    });
    await overlay.waitFor({state:'detached',timeout:5000});
    displayed++;
   }
  }
  // Un devoir ENT ou une copie non corrigée ne doit déclencher aucune récompense.
  for(const [ex,saved] of [
   [{category:'school'},{xp:0,score:10,total:10,correctionStatus:'released'}],
   [{kind:'daily'},{xp:3,score:10,total:10,correctionStatus:'pending-parent'}],
   [{kind:'daily'},{xp:3,score:10,total:10,correctionLocked:true}]
  ]){
   await page.evaluate(v=>void window.TIM_ANIMATIONS.playResult(v.ex,v.saved),{ex,saved});
   assert.equal(await page.locator('.tim-anim-overlay').count(),0,'Récompense non autorisée');
  }
  assert.equal(report.blocked,0,'Une requête non lecture seule a été tentée');
  report.summary[target]={animationsControles:displayed};
  console.log('OK '+target+': '+displayed+' couples note/XP, vidéos/GIF, sans écriture.');
 }finally{await context.close();await browser.close();}
}
(async()=>{
 try{await auditBarèmes();await runBrowser(true);await runBrowser(false);
  report.summary.totalVisuels=report.summary.mobile.animationsControles+report.summary.bureau.animationsControles;
  report.status='passed';
  console.log('SUCCÈS: '+report.summary.barèmeTests+' seuils et '+report.summary.totalVisuels+' contrôles visuels.');}
 catch(error){report.status='failed';report.issues.push(String(error?.message||error));
  console.error('ÉCHEC: '+String(error?.message||error).slice(0,400));process.exitCode=1;}
 finally{fs.writeFileSync(path.join(OUT,'tous-baremes-animations.json'),JSON.stringify({...report,
  date:new Date().toISOString()},null,2)+'\n');}
})();
