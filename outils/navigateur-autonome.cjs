'use strict';
// Navigateur autonome du classeur. Une modification de browser-requests/inspection.json
// suffit pour déclencher une inspection, sans clic manuel GitHub.
const {chromium} = require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=process.env.GITHUB_WORKSPACE||process.cwd();
const cfg=JSON.parse(fs.readFileSync(path.join(root,'browser-requests','inspection.json'),'utf8'));
const out=path.join(root,'browser-results');
fs.mkdirSync(out,{recursive:true});
const result={site:cfg.site,started:new Date().toISOString(),devices:[],checks:[],pages:[],lessons:[],exercises:[],errors:[],screenshots:[],notes:[],fatal:false};
const slug=s=>String(s||'sans-nom').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/gi,'-').replace(/-+/g,'-').slice(0,54);
const log=(name,ok,detail='')=>{result.checks.push({name,ok,detail});console.log((ok?'OK':'ERREUR')+' '+name+(detail?' :: '+detail:''));};
const capture=async(page,label)=>{
  const name=slug(label)+'.jpg';
  try{await page.screenshot({path:path.join(out,name),type:'jpeg',quality:67,fullPage:true,animations:'disabled',timeout:15000});
      result.screenshots.push(name);}catch(e){result.errors.push('Capture '+name+' : '+e.message.slice(0,200));}
};
const browserErrors=(page,device)=>{
  page.on('pageerror',e=>result.errors.push(device+' JS : '+e.message.slice(0,350)));
  page.on('console',m=>{if(m.type()==='error')result.errors.push(device+' Console : '+m.text().slice(0,350));});
};
const inspectVisibleImages=async(page,context)=>{
  const images=await page.locator('img').evaluateAll(els=>els.map(x=>({
    src:(x.currentSrc||x.src||'').slice(0,200),
    loaded:x.complete&&x.naturalWidth>0,
    visible:!!x.getClientRects().length
  })));
  for(const im of images.filter(i=>i.visible&&!i.loaded))
    result.errors.push(context+' Image non chargee : '+im.src);
  return images.length;
};
async function session(browser,device){
  const mobile=device==='mobile',context=await browser.newContext({
    viewport:mobile?{width:390,height:844}:{width:1365,height:900},
    deviceScaleFactor:1,locale:'fr-FR',isMobile:mobile,hasTouch:mobile,
    userAgent:mobile?'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36':undefined
  });
  const page=await context.newPage();browserErrors(page,device);
  const overview={device,lessons:0,exercises:0,images:0};
  result.devices.push(overview);
  try{
    const r=await page.goto(cfg.site,{waitUntil:'domcontentloaded',timeout:45000});
    log(device+' connexion Cloudflare',!!r&&r.status()<400,'HTTP '+r?.status());
    await capture(page,device+'-00-accueil');
    for(const [name,id] of [['Invité','guest-enter'],['Tim','tim-enter'],['Parent','parent-enter']])
      log(device+' bouton '+name,await page.locator('#'+id).isVisible());
    for(const [name,id] of [['Parent','parent-enter'],['Tim','tim-enter']]){
      await page.locator('#'+id).click();
      log(device+' ouverture formulaire '+name,await page.locator('#login-form').isVisible());
      await capture(page,device+'-connexion-'+name);
      await page.locator('#role-back').click();
    }
    await page.locator('#guest-enter').click();
    await page.locator('body.guest-mode').waitFor({timeout:15000});
    log(device+' acces Invite',true);
    const intro=page.locator('#intro-screen');
    if(await intro.isVisible()){
      await capture(page,device+'-intro-loup');
      log(device+' boutons intro',await page.locator('#intro-silent').isVisible() && await page.locator('#intro-play').isVisible());
      await page.locator('#intro-silent').click();
      await page.waitForTimeout(900);
      await capture(page,device+'-animation-loup');
      await intro.waitFor({state:'hidden',timeout:15000});
      log(device+' animation terminee',true);
    }else{
      result.notes.push(device+' : animation intro non visible');
    }
    await capture(page,device+'-invite-apres-intro');
    const catalog=await page.evaluate(()=>({
      lessons:(window.__TIM_DATA?.lessons||[]).map(l=>({id:String(l.id),title:l.title,subject:l.subject||'Espagnol',blocks:l.blocks?.length||0})),
      exercises:(window.__TIM_DATA?.exercises||[]).map(e=>({id:String(e.id),title:e.title,subject:e.subject||'Espagnol',questions:e.questions?.length||0}))
    }));
    overview.lessons=catalog.lessons.length;overview.exercises=catalog.exercises.length;
    result.notes.push(device+' : '+overview.lessons+' lecons et '+overview.exercises+' exercices accessibles dans le mode Invite.');
    for(const tab of ['home','matieres','cours','exercices','dico','difficultes']){
      try{
        const btn=page.locator('[data-nav="'+tab+'"]:visible').first();
        if(!await btn.count()){result.notes.push(device+' : onglet '+tab+' sans bouton visible');continue;}
        await btn.click({timeout:6500});
        const active=await page.locator('#'+tab+'.page.active').count()>0;
        log(device+' navigation '+tab,active);
        result.pages.push({device,tab,ok:active,text:(await page.locator('#'+tab).innerText()).slice(0,1100)});
        await capture(page,device+'-onglet-'+tab);
        overview.images+=await inspectVisibleImages(page,device+' '+tab);
      }catch(e){log(device+' navigation '+tab,false,e.message.slice(0,200));}
    }
    // Chaque lecon/exercice est ouvert via la meme fonction que le bouton Ouvrir du site.
    // Il s'agit d'un test de rendu, pas d'une modification des donnees.
    const lessons=catalog.lessons.slice(0,Math.max(0,cfg.maxLessons||0));
    for(let i=0;i<lessons.length;i++){
      const l=lessons[i];
      try{
        await page.evaluate(id=>window.openLesson(id),l.id);
        const title=await page.locator('#lesson-detail.active h2').first().innerText({timeout:5000});
        const ok=title.trim().length>0;
        result.lessons.push({...l,ok,renderedTitle:title});
        if(cfg.screenshotAllLessons||i<2)await capture(page,device+'-lecon-'+String(i+1).padStart(2,'0')+'-'+l.id);
        await inspectVisibleImages(page,device+' lecon '+l.id);
        if(!ok)log(device+' lecon '+l.id,false,'Titre absent');
      }catch(e){result.lessons.push({...l,ok:false,error:e.message.slice(0,220)});log(device+' lecon '+l.id,false,e.message.slice(0,220));}
    }
    const exercises=catalog.exercises.slice(0,Math.max(0,cfg.maxExercises||0));
    for(let i=0;i<exercises.length;i++){
      const ex=exercises[i];
      try{
        await page.evaluate(id=>window.openExercise(id),ex.id);
        const title=await page.locator('#exercise-detail.active h2').first().innerText({timeout:5000});
        const shown=await page.locator('#exercise-detail.active .q').count();
        const ok=title.trim().length>0&&(shown===ex.questions||ex.questions===0);
        result.exercises.push({...ex,ok,shown,renderedTitle:title});
        if(cfg.screenshotAllExercises||i<2)await capture(page,device+'-exercice-'+String(i+1).padStart(2,'0')+'-'+ex.id);
        if(!ok)log(device+' exercice '+ex.id,false,'Questions '+shown+'/'+ex.questions);
      }catch(e){result.exercises.push({...ex,ok:false,error:e.message.slice(0,220)});log(device+' exercice '+ex.id,false,e.message.slice(0,220));}
    }
    for(let i=0;i<(cfg.actions||[]).length;i++){
      const act=cfg.actions[i];
      try{
        if(act.type==='click')await page.locator(act.selector).first().click({timeout:8000});
        else if(act.type==='nav')await page.locator('[data-nav="'+act.page+'"]:visible').first().click({timeout:8000});
        else if(act.type==='lesson')await page.evaluate(id=>window.openLesson(id),act.id);
        else if(act.type==='exercise')await page.evaluate(id=>window.openExercise(id),act.id);
        else if(act.type==='wait')await page.waitForTimeout(Math.min(15000,Math.max(0,act.ms||1000)));
        else if(act.type==='screenshot'){}else throw Error('Action inconnue');
        await capture(page,device+'-commande-'+(i+1)+'-'+(act.name||act.type));
        log(device+' commande '+(i+1)+' '+act.type,true);
      }catch(e){log(device+' commande '+(i+1)+' '+act.type,false,e.message.slice(0,250));}
    }
  }catch(e){log(device+' navigation interrompue',false,e.message.slice(0,400));result.fatal=true;await capture(page,device+'-erreur');}
  await context.close();
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  for(const d of cfg.devices||['desktop','mobile'])await session(browser,d);
  await browser.close();
  result.completed=new Date().toISOString();
  const failed=result.checks.filter(c=>!c.ok);
  const brokenLesson=result.lessons.filter(x=>!x.ok);
  const brokenExercise=result.exercises.filter(x=>!x.ok);
  const head=[
    '# Inspection automatique du classeur',
    '',
    '**Site :** '+cfg.site,
    '**Date :** '+result.completed,
    '**Résultat :** '+(result.fatal?'Interruption du navigateur':failed.length+' anomalies signalées'),
    '',
    '## Inventaire visité',
    ...result.devices.map(d=>'- '+d.device+' : '+d.lessons+' leçons, '+d.exercises+' exercices (espace Invité)'),
    '',
    '## Contrôles',
    ...result.checks.map(c=>'- '+(c.ok?'OK':'ÉCHEC')+' — '+c.name+(c.detail?' : '+c.detail:'')),
    '',
    '## Fiches en anomalie',
    ...brokenLesson.map(l=>'- Leçon '+l.id+' : '+l.title+' : '+(l.error||'rendu incomplet')),
    ...brokenExercise.map(e=>'- Exercice '+e.id+' : '+e.title+' : '+(e.error||'rendu incomplet')),
    ...(brokenLesson.length+brokenExercise.length===0?['Aucune fiche en anomalie lors de ce parcours.']:[]),
    '',
    '## Erreurs de navigateur',
    ...(result.errors.length?result.errors.slice(0,70):['Aucune erreur relevée.']),
    '',
    '## Captures',
    result.screenshots.length+' captures de pages dans les artefacts du workflow.',
    '',
    '**Important :** ce test examine seulement l’espace Invité. Les espaces Tim et Parent ne sont pas inspectés après connexion.'
  ].join('\n');
  fs.writeFileSync(path.join(out,'rapport.md'),head);
  fs.writeFileSync(path.join(out,'rapport.json'),JSON.stringify(result,null,2));
  console.log(head.slice(0,9000));
  // Une anomalie d'un bouton ne doit pas masquer l'existence des captures.
  if(result.fatal)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
