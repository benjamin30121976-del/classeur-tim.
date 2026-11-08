'use strict';
// Lecture seule du vrai espace Parent. Aucun mot de passe, jeton, cookie ou
// resultat individuel dans les rapports publics.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const requestFile=path.join(process.cwd(),'browser-requests','parent.json');
let privateAudit={};
try{privateAudit=JSON.parse(fs.readFileSync(requestFile,'utf8'));}catch{}
const EMAIL=process.env.TIM_PARENT_EMAIL||'';
const PASSWORD=process.env.TIM_PARENT_PASSWORD||'';
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const output=path.join(process.cwd(),'browser-parent-results');
fs.mkdirSync(output,{recursive:true});
const data={site:URL,date:new Date().toISOString(),checks:[],devices:[],notes:[],pageErrors:[],subjectInventory:[],educationInventory:[],lessonIndex:[],exerciseIndex:[],integrity:[]};
function check(name,ok,detail=''){data.checks.push({name,ok,detail});console.log((ok?'OK':'ECHEC')+' '+name+(detail?' : '+detail:''));}
function saveEncryptedPrivateReport(payload){
 if(privateAudit.mode!=='lecture-privee-defi-20261108')return;
 if(!String(privateAudit.publicKeyPem||'').startsWith('-----BEGIN PUBLIC KEY-----'))throw Error('Clé publique de rapport absente');
 const key=crypto.randomBytes(32),iv=crypto.randomBytes(12);
 const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 const raw=Buffer.from(JSON.stringify({version:1,createdAt:new Date().toISOString(),...payload}),'utf8');
 const ciphertext=Buffer.concat([cipher.update(raw),cipher.final()]);
 const wrappedKey=crypto.publicEncrypt({key:privateAudit.publicKeyPem,padding:crypto.constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key);
 fs.writeFileSync(path.join(output,'defi-20261108-chiffre.json'),JSON.stringify({
  format:'rsa-oaep-sha256-aes-256-gcm',encryptedKey:wrappedKey.toString('base64'),
  iv:iv.toString('base64'),authTag:cipher.getAuthTag().toString('base64'),
  ciphertext:ciphertext.toString('base64')
 },null,2));
 console.log('Rapport privé chiffré créé (aucune note ni réponse dans les journaux).');
}
async function collectPrivateTrial(page,label){
 if(label!=='ordinateur'||privateAudit.mode!=='lecture-privee-defi-20261108')return;
 const result=await page.evaluate(async()=>{
  let refreshError='';
  try{await window.__TIM_BRIDGE?.refresh?.();}catch(e){refreshError=String(e?.code||'refresh-unavailable');}
  const data=window.__CLOUD_ATTEMPTS||[];
  const id='DAY_20261108_01';
  const attempt=data.find(x=>x.id===id);
  const screenshotNote=document.getElementById('pending-corrections-status')?.textContent?.slice(0,350)||'';
  return {status:attempt?'record-found':'record-not-found',id,refreshError,
   totalRecords:data.length,correctionPanelStatus:screenshotNote,
   record:attempt?{
    id:attempt.id,title:attempt.title,score:attempt.score,total:attempt.total,
    xp:attempt.xp,policyVersion:attempt.policyVersion,date:attempt.date,
    correctionStatus:attempt.correctionStatus,answers:Array.isArray(attempt.answers)?attempt.answers:[]
   }:null};
 });
 saveEncryptedPrivateReport(result);
}
async function eraseCancelledTrial(page,label){
 if(label!=='ordinateur'||privateAudit.mode!=='annuler-defi-20261108')return;
 const report=await page.evaluate(async()=>{
  if(window.__TIM_PARENT!==true)throw Error('Compte Parent non authentifié');
  if(!window.__TIM_BRIDGE?.resetTrial20261108)throw Error('Service de retrait absent de cette version');
  const first=await window.__TIM_BRIDGE.resetTrial20261108();
  const verification=await window.__TIM_BRIDGE.resetTrial20261108();
  return {id:'DAY_20261108_01',first,verification,
   exerciseNotInCatalogue:!(window.__TIM_DATA?.exercises||[]).some(x=>x.id==='DAY_20261108_01'),
   exerciseNotInHistory:!(window.__CLOUD_ATTEMPTS||[]).some(x=>x.id==='DAY_20261108_01')};
 });
 // Le rapport archivé n'expose ni note, ni réponse, ni identifiants secrets.
 fs.writeFileSync(path.join(output,'verification-suppression-defi.json'),JSON.stringify(report,null,2));
 const gone=report.verification?.removed===false&&
  Object.values(report.verification?.deleted||{}).every(x=>x===false)&&
  report.exerciseNotInCatalogue&&report.exerciseNotInHistory;
 check('Defi annulé et copie supprimée côté Firebase',gone, gone?'Tentative, copie et correction absentes au second contrôle':'Vérification de suppression incomplète');
 if(!gone){process.exitCode=1;throw Error('Suppression du défi non confirmée');}
 console.log('Retrait Parent/Tim confirmé et vérifié, sans publication des données privées.');
}
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
    if(label==='ordinateur'){
      data.subjectInventory=subjects;
      const catalogue=await page.evaluate(()=>{
        const lessons=window.__TIM_DATA?.lessons||[],exercises=window.__TIM_DATA?.exercises||[];
        const subj=item=>item?.subject||'Espagnol';
        const bis=l=>l.kind==='bis'||l.category==='bis'||/^MBIS\d{2}$/.test(l.id||'');
        const bonus=l=>l.kind==='bonus'||l.category==='bonus'||/^M26B_/.test(l.id||'')||/cours bonus/i.test(l.source||'');
        const challenge=e=>['daily','weekly','sunday'].includes(e?.kind);
        const school=e=>!!e&&!challenge(e)&&(e.category==='school'||e.exerciseType==='school'||e.fromENT===true||e.origin==='ENT'||e.sourceType==='ENT');
        const L=lessons.map(l=>({id:l.id,title:l.title,subject:subj(l),date:l.date||'',topic:l.topic||'',kind:l.kind||'',category:l.category||'',origin:l.origin||'',source:l.source||'',type:bis(l)?'BIS':bonus(l)?'BONUS':'ENT',blocks:Array.isArray(l.blocks)?l.blocks.length:0,original_lesson_ids:l.original_lesson_ids||l.originalLessonIds||[]}));
        const E=exercises.map(e=>({id:e.id,title:e.title,subject:subj(e),lesson:e.lesson||'',date:e.date||'',category:e.category||'',kind:e.kind||'',exerciseType:e.exerciseType||'',origin:e.origin||'',sourceType:e.sourceType||'',type:challenge(e)?'DEFI':school(e)?'ENT':'BONUS',questions:Array.isArray(e.questions)?e.questions.length:0}));
        const names=[...new Set([...L.map(x=>x.subject),...E.map(x=>x.subject)])];
        return {L,E,groups:names.map(name=>{
          const ls=L.filter(x=>x.subject===name),es=E.filter(x=>x.subject===name);
          return {name,lessons:ls.length,ENT:ls.filter(x=>x.type==='ENT').length,
            BIS:ls.filter(x=>x.type==='BIS').length,lessonBonus:ls.filter(x=>x.type==='BONUS').length,
            exercises:es.length,exENT:es.filter(x=>x.type==='ENT').length,exBONUS:es.filter(x=>x.type==='BONUS').length,exDEFI:es.filter(x=>x.type==='DEFI').length};
        }),integrity:[
          ...E.filter(e=>!['daily','weekly','sunday'].includes(e.kind)&&e.lesson&&!L.some(l=>l.id===e.lesson)).map(e=>'Exercice '+e.id+' : cours rattache absent ('+e.lesson+')'),
          ...L.filter(l=>l.blocks===0).map(l=>'Lecon '+l.id+' sans bloc de contenu'),
          ...E.filter(e=>e.questions===0).map(e=>'Exercice '+e.id+' sans question')
        ]};
      });
      data.educationInventory=catalogue.groups;
      data.lessonIndex=catalogue.L;
      data.exerciseIndex=catalogue.E;
      data.integrity=catalogue.integrity;
    }
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
    await eraseCancelledTrial(page,label);
    // Examen privé du résultat du défi : rapport hybride chiffré, jamais publié en clair.
    try{await collectPrivateTrial(page,label);}
    catch(e){console.log('Examen privé du défi : impossible de produire le rapport chiffré.');}

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
    // Aucune publication ni modification, sauf l'annulation ciblée demandée par le Parent quand le mode correspondant est explicitement actif.
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
 '## Détail ENT / BIS / bonus par matière',
 ...data.educationInventory.map(x=>'- '+x.name+' : '+x.ENT+' cours ENT, '+x.BIS+' leçons BIS, '+x.lessonBonus+' cours bonus ; '+x.exENT+' exercices ENT, '+x.exBONUS+' exercices bonus, '+x.exDEFI+' défis (total '+x.lessons+' leçons et '+x.exercises+' exercices).'),
 '',
 '## Contrôle des références',
 ...(data.integrity.length?data.integrity:['Aucune référence orpheline et aucun contenu vide signalé.']),
 '',
 '## Index des leçons (identifiant et intitulé, sans contenu ni réponse)',
 ...data.lessonIndex.map(x=>'- ['+x.subject+'] '+x.type+' | '+x.id+' | '+x.title+' | '+x.date+' | blocs='+x.blocks),
 '',
 '## Index des exercices (identifiant et intitulé, sans question ni correction)',
 ...data.exerciseIndex.map(x=>'- ['+x.subject+'] '+x.type+' | '+x.id+' | '+x.title+' | lié à '+x.lesson+' | questions='+x.questions),
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
