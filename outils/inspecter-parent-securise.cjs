'use strict';
// Lecture seule du vrai espace Parent. Aucun mot de passe, jeton, cookie ou
// resultat individuel dans les rapports publics.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const EMAIL=process.env.TIM_PARENT_EMAIL||'';
const PASSWORD=process.env.TIM_PARENT_PASSWORD||'';
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const output=path.join(process.cwd(),'browser-parent-results');
fs.mkdirSync(output,{recursive:true});
const data={site:URL,date:new Date().toISOString(),checks:[],devices:[],notes:[],pageErrors:[],subjectInventory:[]};
function check(name,ok,detail=''){data.checks.push({name,ok,detail});console.log((ok?'OK':'ECHEC')+' '+name+(detail?' : '+detail:''));}
async function picture(page,filename){
  // Ne jamais archiver de formulaire contenant le mot de passe.
  if(!await page.locator('body.ready').count())return;
  try{
    await page.addStyleTag({content:'#parent-corrections, #parent-content .results-list, #account-name { visibility: hidden !important; }'});
    await page.screenshot({path:path.join(output,filename+'.jpg'),type:'jpeg',quality:62,fullPage:true,animations:'disabled',timeout:12000});
  }catch(e){data.notes.push('Capture impossible : '+filename+' — '+String(e.message||e).slice(0,220));}
}
async function inspect(browser,label,viewport){
  const context=await browser.newContext({viewport,locale:'fr-FR'});
  const page=await context.newPage();
  const device={label,authenticated:false,lessonCount:0,exerciseCount:0,subjectsCount:0,correctionsState:'non verifie'};
  data.devices.push(device);
  page.on('pageerror',e=>data.pageErrors.push(label+' : '+e.message.slice(0,140)));
  try{
    const r=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});
    check(label+' site disponible',r?.ok()===true,'HTTP '+r?.status());
    await page.locator('#parent-enter').click({timeout:10000});
    check(label+' formulaire Parent ouvert',await page.locator('#login-form').isVisible());
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-password').fill(PASSWORD);
    await page.locator('#login-button').click();
    try{await page.locator('body.ready').waitFor({timeout:35000});}
    catch{
      // Ne pas publier l'adresse e-mail ni une trace du mot de passe.
      const state=await page.locator('#access-status').innerText().catch(()=>'' );
      const generic=/Lecture des cours|résultats|incomplet|Firebase|connexion refusée/i.test(state);
      check(label+' authentification Parent',false,generic?'Connexion ou chargement Firebase non termine':'Session Parent indisponible');
      await context.close();return;
    }
    device.authenticated=await page.evaluate(()=>window.__TIM_PARENT===true);
    check(label+' session Parent authentifiee',device.authenticated);
    await page.waitForFunction(()=>typeof window.openLesson==='function' && !!window.__TIM_DATA?.lessons,null,{timeout:20000});
    const intro=page.locator('#intro-screen');
    if(await intro.isVisible()){
      await page.locator('#intro-silent').click({timeout:5000});
      await intro.waitFor({state:'hidden',timeout:13000});
    }
    const stats=await page.evaluate(()=>({
      lessons:window.__TIM_DATA?.lessons?.length||0,
      exercises:window.__TIM_DATA?.exercises?.length||0,
      subjects:new Set((window.__TIM_DATA?.lessons||[]).map(x=>x.subject||'Espagnol')).size,
      parentNav:[...document.querySelectorAll('[data-nav="parent"]')].some(el=>!el.hidden)
    }));
    device.lessonCount=stats.lessons;device.exerciseCount=stats.exercises;device.subjectsCount=stats.subjects;
    check(label+' menu Parent visible',stats.parentNav);
    check(label+' lecons chargees',stats.lessons>0,'Nombre : '+stats.lessons);
    const subjects=await page.evaluate(()=>{
      const lessons=window.__TIM_DATA?.lessons||[],exercises=window.__TIM_DATA?.exercises||[];
      return [...new Set([...lessons.map(x=>x.subject||'Espagnol'),...exercises.map(x=>x.subject||'Espagnol')])].map(name=>({name,lessons:lessons.filter(x=>(x.subject||'Espagnol')===name).length,exercises:exercises.filter(x=>(x.subject||'Espagnol')===name).length}));
    });
    if(label==='ordinateur')data.subjectInventory=subjects;
    check(label+' exercices charges',stats.exercises>0,'Nombre : '+stats.exercises);
    await picture(page,label+'-accueil-parent');
    for(const id of ['matieres','exercices','parent']){
      const tab=page.locator('[data-nav="'+id+'"]:visible').first();
      try{
        await tab.click({timeout:9000});
        const active=await page.locator('#'+id+'.page.active').count()===1;
        check(label+' onglet '+id,active);
        await picture(page,label+'-onglet-'+id);
      }catch(e){check(label+' onglet '+id,false,'Clic non abouti');}
    }
    // Les résultats individuels ont été volontairement masqués pour les captures.
    // Lire textContent (et non isVisible/innerText) pour ne pas confondre masquage et panne.
    await page.waitForFunction(()=>{
      const el=document.getElementById('pending-corrections-status');
      return !!el && el.textContent.trim()!=='Chargement…';
    },null,{timeout:12000}).catch(()=>{});
    device.correctionsState=await page.locator('#pending-corrections-status').textContent().catch(()=>'absent');
    if(/indisponible|non accessibles/i.test(device.correctionsState)){
      check(label+' suivi corrections Firebase',false,'Fonction indisponible dans la session Parent');
    }else{
      check(label+' panneau corrections present',(await page.locator('#parent-corrections').count())>0);
    }
    const first=await page.evaluate(()=>window.__TIM_DATA.lessons?.[0]?.id);
    if(first){
      await page.evaluate(id=>window.openLesson(id),first);
      check(label+' ouverture lecon privee',await page.locator('#lesson-detail.active h2').isVisible());
      await picture(page,label+'-lecon-privee');
    }
    // Aucun bouton de publication, correction, enregistrement ni modification n'est activé.
  }catch(e){check(label+' inspection interrompue',false,e.message.slice(0,180));}
  finally{await context.close();}
}
(async()=>{
 if(!EMAIL||!PASSWORD){
   console.log('Secrets TIM_PARENT_EMAIL et TIM_PARENT_PASSWORD non configures. Aucun acces prive tente.');
   process.exit(0);
 }
 const b=await chromium.launch({headless:true});
 try{
   await inspect(b,'ordinateur',{width:1365,height:900});
   await inspect(b,'telephone',{width:390,height:844});
 }finally{await b.close();}
 data.completed=new Date().toISOString();
 const errors=data.checks.filter(x=>!x.ok);
 const report=[
 '# Inspection de l’espace Parent (lecture seule)',
 '',
 '**Date :** '+data.completed,
 '**Résultat :** '+errors.length+' anomalie(s) détectée(s).',
 '',
 '## Contrôles',
 ...data.checks.map(x=>'- '+(x.ok?'OK':'ÉCHEC')+' : '+x.name+(x.detail?' — '+x.detail:'')),
 '',
 '## Inventaire',
 ...data.devices.map(d=>'- '+d.label+' : session '+(d.authenticated?'authentifiée':'non ouverte')+', '+d.lessonCount+' leçons, '+d.exerciseCount+' exercices, '+d.subjectsCount+' matières représentées.'),
 '',
 '## Répartition des matières',
 ...data.subjectInventory.map(s=>'- '+s.name+' : '+s.lessons+' leçons, '+s.exercises+' exercices'),
 '',
 '## Erreurs JavaScript',
 ...(data.pageErrors.length?data.pageErrors:['Aucune erreur capturée']),
 '',
 'Aucun mot de passe ou jeton de session enregistré. Zones de résultats individuels masquées dans les captures.'
 ].join('\n');
 fs.writeFileSync(path.join(output,'rapport-parent.md'),report);
 fs.writeFileSync(path.join(output,'rapport-parent.json'),JSON.stringify(data,null,2));
 console.log(report);
 // L'échec de fonctions Firebase est consigné sans empêcher la collecte des autres données.
})().catch(e=>{console.error('Inspection Parent interrompue : '+e.message);process.exitCode=1;});
