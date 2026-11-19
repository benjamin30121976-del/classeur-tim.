'use strict';
/*
 * Inspection des comptes élève et Parent, sur le site publié.
 * Lecture seule : aucune soumission, aucune note, copie, tentative ou XP modifié.
 */
const fs = require('node:fs');
const path = require('node:path');
const SITE = 'https://classeur-tim-v16.pages.dev/';
const OUTPUT = path.join(process.cwd(), 'browser-comptes-lecture-seule');
const ROLES = [
  {id:'eleve', entry:'#tim-enter', parent:false, email:process.env.TIM_STUDENT_EMAIL || '', password:process.env.TIM_STUDENT_PASSWORD || ''},
  {id:'parent', entry:'#parent-enter', parent:true, email:process.env.TIM_PARENT_EMAIL || '', password:process.env.TIM_PARENT_PASSWORD || ''}
];
const DEVICES = [
  {id:'ordinateur', viewport:{width:1365,height:900}, isMobile:false},
  {id:'telephone', viewport:{width:390,height:844}, isMobile:true, hasTouch:true}
];
const MASKS = [
  '#account-name', '#parent-content .results-list', '#parent-content .result-details',
  '#parent-content .copy-detail', '#parent-corrections .results-list',
  '#parent-corrections .result-details', '#difficulties-content'
];

function actionIsReadOnly(action) {
  return typeof action === 'string' && /^get[A-Z][a-zA-Z0-9]*$/.test(action);
}
function isFirestoreWriteEndpoint(url) {
  return /firestore\.googleapis\.com/i.test(url) &&
    (/\/Write\/channel/i.test(url) || /(?:documents:commit|documents:batchWrite|\/documents\/[^?]+$)/i.test(url));
}
function isTimWriteRequest(method,url,body) {
  if (method==='GET'||method==='HEAD') return false;
  if (isFirestoreWriteEndpoint(url)) return true;
  if (!/\/api\/tim(?:\?|$)/.test(url)) return false;
  try { return !actionIsReadOnly(JSON.parse(body||'{}').action); }
  catch { return true; }
}
function check(report,label,ok,detail='') {
  report.checks.push({label,ok:Boolean(ok),detail});
  console.log((ok?'OK':'ECHEC')+' '+label+(detail?' : '+detail:''));
}
async function capture(page,name) {
  await page.addStyleTag({content:MASKS.join(', ')+' { visibility:hidden !important; }'});
  await page.screenshot({path:path.join(OUTPUT,name+'.jpg'),type:'jpeg',quality:65,
    fullPage:false,animations:'disabled',timeout:15000});
}
async function inspect(browser,role,device,report) {
  const prefix=role.id+'/'+device.id;
  const context=await browser.newContext({
    viewport:device.viewport,locale:'fr-FR',isMobile:device.isMobile,
    hasTouch:Boolean(device.hasTouch)
  });
  const blocked=[];
  await context.route('**/*',async route=>{
    const req=route.request(),url=req.url();
    if (isTimWriteRequest(req.method(),url,req.postData())) {
      blocked.push(/\/api\/tim/.test(url)?'api/tim':'Firestore');
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  const page=await context.newPage();
  const jsErrors=[],privateReadErrors=[];
  page.on('pageerror',error=>{
    const name=String(error?.name||'Erreur JS');
    const stack=String(error?.stack||'');
    const hit=stack.match(/\/([A-Za-z0-9_-]+\.m?js):(\d{1,6}):(\d{1,5})/);
    const location=hit?hit[1]+':'+hit[2]+':'+hit[3]:'emplacement inconnu';
    const cause=String(error?.message||'');
    const onlyProperty=cause.match(/Cannot read properties of (?:undefined|null) \(reading ['"]([A-Za-z0-9_]{1,60})['"]\)/);
    const safeCause=onlyProperty?' propriété '+onlyProperty[1]:'';
    jsErrors.push((/^(TypeError|ReferenceError|SyntaxError|Error)$/.test(name)?name:'Erreur JS')+' '+location+safeCause);
  });
  page.on('response',async response=>{
    if(!response.url().includes('/api/tim')||response.status()<400)return;
    const payload=response.request().postData()||'';
    if(!payload.includes('"getTimCourseContent"'))return;
    try{
      const data=await response.json();
      const code=/^[a-z0-9-]{1,70}$/.test(String(data?.error||''))?data.error:'unknown';
      privateReadErrors.push({http:response.status(),code});
    }catch{privateReadErrors.push({http:response.status(),code:'invalid-response'});}
  });
  try {
    const res=await page.goto(SITE,{waitUntil:'domcontentloaded',timeout:45000});
    // Diagnostic public d'accès au backend ; aucun jeton ou document privé.
    const backend=await page.evaluate(async()=>{
      try{
        const response=await fetch('/api/status',{cache:'no-store'});
        const publicStatus=await response.json();
        return {http:response.status,available:publicStatus.available===true,
          platform:publicStatus.platform||''};
      }catch{return {http:0,available:false,platform:'unavailable'};}
    });
    report.devices.push({role:role.id,device:device.id,backend});
    check(report,prefix+' : backend Cloudflare disponible',backend.http===200&&backend.available,
      'HTTP '+backend.http+', active '+backend.available);
    check(report,prefix+' : site disponible',Boolean(res?.ok()));
    await page.locator(role.entry).click({timeout:15000});
    await page.locator('#login-email').fill(role.email);
    await page.locator('#login-password').fill(role.password);
    await page.locator('#login-button').click();
    // Ne plus confondre une connexion Firebase réussie avec le chargement
    // des cours : l'erreur Firestore est maintenant visible et traçable.
    try{
      await page.waitForFunction(()=>{
        const bodyReady=document.body.classList.contains('ready');
        const failed=Boolean(document.querySelector('#tim-course-unavailable'));
        const status=document.querySelector('#access-status')?.textContent||'';
        return bodyReady||failed||status.includes('Connexion refusée')||
          status.includes('Impossible de charger');
      },null,{timeout:42000});
    }catch{
      check(report,prefix+' : chargement authentifie expire',false,
        privateReadErrors.map(e=>'HTTP '+e.http+' '+e.code).join(', ')||
        'délai de 42s sans écran complet ni message exploitable');
      return;
    }
    if(!await page.locator('body.ready').count()||
       !await page.locator('body.ready').isVisible().catch(()=>false)){
      const failed=await page.locator('#tim-course-unavailable').count()>0;
      const errors=privateReadErrors.map(e=>'HTTP '+e.http+' '+e.code).join(', ');
      check(report,prefix+' : compte connecte et cours prives disponibles',false,
        failed?'Identifiants acceptés ; cours privés indisponibles'+(errors?' : '+errors:''):
        (errors||'écran non disponible ; vérifier Auth et Firestore'));
      report.devices.push({role:role.id,device:device.id,
        privateCourseStatus:failed?'unavailable':'unknown',
        privateHttpErrors:privateReadErrors});
      return;
    }
    const authenticated=await page.evaluate(expected=>{
      const label=document.querySelector('#account-name')?.textContent||'';
      return window.__TIM_GUEST!==true && window.__TIM_PARENT===expected &&
        label.includes(expected?'Espace parent':'Espace Tim') &&
        Boolean(window.__TIM_DATA?.lessons?.length) &&
        Boolean(window.__TIM_DATA?.exercises?.length);
    },role.parent);
    check(report,prefix+' : authentification reelle (non invite)',authenticated);
    if(!authenticated)return;
    await page.waitForFunction(()=>typeof window.openLesson==='function',null,{timeout:20000});
    const intro=page.locator('#intro-screen');
    if(await intro.isVisible().catch(()=>false)){
      if(await page.locator('#intro-skip').isVisible().catch(()=>false))
        await page.locator('#intro-skip').click({timeout:10000});
      else if(await page.locator('#intro-silent').isVisible().catch(()=>false))
        await page.locator('#intro-silent').click({timeout:10000});
    }
    const stats=await page.evaluate(()=>({
      lessons:window.__TIM_DATA?.lessons?.length||0,
      exercises:window.__TIM_DATA?.exercises?.length||0,
      dataSubjectCount:new Set((window.__TIM_DATA?.lessons||[]).map(x=>x.subject||'Espagnol')).size,
      guestFallback:window.__TIM_READONLY_FALLBACK===true,
      parentMenu:[...document.querySelectorAll('[data-nav="parent"]')].some(el=>!el.hidden),
      xp:!!document.querySelector('#xp-header'),
      challengePanel:!!document.querySelector('#home-content .daily-loup-panel'),
      weekendPanels:(document.querySelector('#home-content')?.innerText||'').toLowerCase().includes('samedi')&&
        (document.querySelector('#home-content')?.innerText||'').toLowerCase().includes('dimanche')
    }));
    report.devices.push({role:role.id,device:device.id,authenticated,...stats});
    check(report,prefix+' : cours et exercices',stats.lessons>0&&stats.exercises>0,
      stats.lessons+' lecons, '+stats.exercises+' exercices');
    check(report,prefix+' : menu du bon compte',stats.parentMenu===role.parent);
    check(report,prefix+' : jauge XP visible',stats.xp);
    check(report,prefix+' : espace defi quotidien',stats.challengePanel);
    // Le moteur d'exercices et les parcours de matieres sont separés.
    // Le nombre de matieres dans __TIM_DATA n'est donc PAS un compteur UI.
    if(!role.parent) check(report,prefix+' : donnees privees, pas secours Invite',!stats.guestFallback,
      stats.guestFallback?(privateReadErrors.map(x=>'HTTP '+x.http+' '+x.code).join(', ')||'service du cours indisponible'):'lecture privee disponible');
    const pages=[
      {id:'home',file:'accueil'}, {id:'matieres',file:'matieres'},
      {id:'prochaines',file:'missions-a-venir'}, {id:'exercices',file:'exercices'}
    ];
    for(const dest of pages){
      if(dest.id!=='home'){
        const nav=page.locator('[data-nav="'+dest.id+'"]:visible').first();
        if(!(await nav.count())){
          check(report,prefix+' : lien '+dest.id,false,'non visible');
          continue;
        }
        await nav.click({timeout:12000});
      }
      const visible=await page.locator('#'+dest.id+'.page.active').isVisible().catch(()=>false);
      check(report,prefix+' : page '+dest.id+' affichee',visible);
      if(visible) {
        try{await capture(page,role.id+'-'+device.id+'-'+dest.file);}
        catch{check(report,prefix+' : capture '+dest.id,false,'capture indisponible');}
      }
    }
    // Les cours se trouvent dans les tuiles Matières : aucun bouton
    // de navigation global "cours" n'existe dans la version actuelle.
    await page.locator('[data-nav="matieres"]:visible').first().click({timeout:12000});
    const required=['Espagnol','Mathématiques','Physique-chimie','Anglais',
      'Français','Histoire-géographie','SVT'];
    const matterCards=await page.locator('#matieres-content .matter-card').evaluateAll(buttons=>
      buttons.map(b=>({name:b.querySelector('strong')?.textContent?.trim()||'',enabled:!b.disabled})));
    const core=required.map(name=>({name,card:matterCards.find(c=>c.name===name)}));
    const available=core.filter(x=>x.card&&x.card.enabled);
    report.devices.at(-1).matterCards=matterCards.length;
    report.devices.at(-1).coreSubjectsAvailable=available.length;
    check(report,prefix+' : sept matieres visibles et accessibles',available.length===7,
      available.length+'/7 matieres principales');
    for(const {name} of available){
      await page.locator('#matieres-content .matter-card').filter({has:page.locator('strong', {hasText:name})}).first().click({timeout:12000});
      await page.waitForTimeout(name==='Espagnol'?850:220);
      const display=await page.locator('#matieres-content').evaluate(node=>({
        textLength:(node.innerText||'').trim().length,
        controls:node.querySelectorAll('button,details,summary,a').length,
        hasError:/\bindisponible\s*:/i.test((node.innerText||'').slice(0,500))
      }));
      check(report,prefix+' : presentation '+name,
        display.textLength>=45 && display.controls>=1 && !display.hasError,
        'contenu et navigation visibles');
      // Retour uniquement par navigation : aucune réponse ou correction soumise.
      await page.locator('[data-nav="matieres"]:visible').first().click({timeout:12000});
    }
    if(role.parent){
      // L'écran Parent est vérifié en dernier : sur téléphone, son panneau
      // peut recouvrir la barre de navigation lors d'un retour aux matières.
      // Sur mobile, revenir d'abord à l'accueil comme le ferait le Parent.
      // Ne pas forcer un clic sur une commande masquée : l'échec doit être signalé.
      await page.locator('[data-nav="home"]:visible').first().click({timeout:12000});
      const parentNav=page.locator('[data-nav="parent"]').first();
      const navVisible=await parentNav.isVisible().catch(()=>false);
      check(report,prefix+' : acces au bouton Parent depuis accueil',navVisible);
      if(navVisible)await parentNav.click({timeout:12000});
      const parentVisible=navVisible&&await page.locator('#parent.page.active').isVisible().catch(()=>false);
      check(report,prefix+' : page parent affichee',parentVisible);
      if(parentVisible){
        try{await capture(page,role.id+'-'+device.id+'-espace-parent');}
        catch{check(report,prefix+' : capture parent',false,'capture indisponible');}
      }
    }
    // Ne jamais cliquer sur un bouton Commencer, Valider, Corriger ou Publier.
    check(report,prefix+' : aucune ecriture',blocked.length===0,
      blocked.length?blocked.length+' appel(s) bloques':'aucun appel d ecriture');
    check(report,prefix+' : erreurs JavaScript',jsErrors.length===0,
      jsErrors.length?jsErrors.join(', ').slice(0,110):'aucune');
  }catch(error){
    const errors=privateReadErrors.map(e=>'HTTP '+e.http+' '+e.code).join(', ');
    const safeType=/^(TimeoutError|Error|TypeError)$/.test(String(error?.name))?
      String(error.name):'navigation';
    check(report,prefix+' : inspection complete',false,
      safeType+(errors?' ; cours privés : '+errors:' ; étape de navigation incomplète'));
  }finally{await context.close();}
}
async function main(){
  fs.mkdirSync(OUTPUT,{recursive:true});
  const report={site:SITE,timestamp:new Date().toISOString(),
    mode:'deux comptes separes, production, lecture seule',checks:[],devices:[]};
  for(const r of ROLES)if(!r.email||!r.password)
    check(report,r.id+' : secrets presents',false,
      'secrets TIM_'+(r.id==='eleve'?'STUDENT':'PARENT')+'_EMAIL/PASSWORD absents');
  if(report.checks.some(c=>!c.ok)){
    fs.writeFileSync(path.join(OUTPUT,'rapport.json'),JSON.stringify(report,null,2));
    process.exitCode=1;return;
  }
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true});
  try{
    for(const role of ROLES){
      for(const device of DEVICES){
        const previous=report.devices.some(d=>d.role===role.id&&
          d.privateCourseStatus==='unavailable');
        if(previous){
          check(report,role.id+'/'+device.id+' : controle suspendu',false,
            'Firestore refuse déjà les cours privés : aucune deuxième connexion inutile');
          break;
        }
        await inspect(browser,role,device,report);
      }
    }
  }finally{await browser.close();}
  const failed=report.checks.filter(c=>!c.ok);
  const lines=['# Inspection Tim et Parent (lecture seule)', '',
    'Date : '+report.timestamp,'Anomalies : '+failed.length,'',
    ...report.checks.map(c=>'- '+(c.ok?'OK':'ECHEC')+' — '+c.label+
      (c.detail?' : '+c.detail:'')),'',
    'Aucune soumission, note, copie, tentative ou XP modifie.',
    'Captures anonymisees. Aucun secret ou cookie archive.',
    'Site de production inspecte ; la correspondance a un commit non publie n est pas attestee.'
  ];
  fs.writeFileSync(path.join(OUTPUT,'rapport.md'),lines.join('\n'));
  fs.writeFileSync(path.join(OUTPUT,'rapport.json'),JSON.stringify(report,null,2));
  console.log('Inspection terminee : '+failed.length+' anomalie(s).');
  if(failed.length)process.exitCode=1;
}
if(require.main===module)main().catch(()=>{
  console.error('Inspection interrompue. Aucun secret publie.');
  process.exitCode=1;
});
module.exports={actionIsReadOnly,isFirestoreWriteEndpoint,isTimWriteRequest};
