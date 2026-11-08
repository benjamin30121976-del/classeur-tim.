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
const data={site:URL,date:new Date().toISOString(),checks:[],devices:[],notes:[],pageErrors:[],subjectInventory:[],educationInventory:[],lessonIndex:[],exerciseIndex:[],integrity:[]};
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
      dailyChallenges:(window.__TIM_DATA?.exercises||[]).filter(x=>/^DAY_20\d{6}(?:_\d{2})?$/.test(String(x.id||''))).length,
      subjects:new Set((window.__TIM_DATA?.lessons||[]).map(x=>x.subject||'Espagnol')).size,
      parentNav:[...document.querySelectorAll('[data-nav="parent"]')].some(el=>!el.hidden)
    }));
    device.lessonCount=stats.lessons;device.exerciseCount=stats.exercises;device.subjectsCount=stats.subjects;
    check(label+' menu Parent visible',stats.parentNav);
    check(label+' lecons chargees',stats.lessons>0,'Nombre : '+stats.lessons);
    check(label+' défi du jour supprimé du classeur',stats.dailyChallenges===0,'Défis quotidiens visibles : '+stats.dailyChallenges);
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
    // Audit en lecture seule du backend des 23 tests. Aucune soumission.
    if(label==='ordinateur'){
      try{
        const audit=await page.evaluate(async()=>{
          const bridge=window.__TIM_BRIDGE;
          let available=0,valid=0,errors=[];
          if(!bridge?.mathTrainingTask)return {available,valid,errors:['API maths indisponible']};
          for(let i=1;i<=23;i++){
            const id='MT'+String(i).padStart(2,'0');
            try{
              const response=await bridge.mathTrainingTask(id);
              available++;
              const q=response?.task?.questions||[];
              if(response?.task?.id===id&&q.length===10&&q.every(item=>typeof item.prompt==='string'&&item.prompt.length>=15&&Array.isArray(item.choices)&&item.choices.length===4&&new Set(item.choices).size===4))valid++;
              else errors.push(id+' incomplet');
            }catch(e){errors.push(id+' service indisponible');}
          }
          return {available,valid,errors};
        });
        check('23 évaluations mathématiques récupérables via API Parent',audit.available===23,'Réponses serveur : '+audit.available+'/23');
        check('230 questions de mathématiques complètes côté site',audit.valid===23,'Tests complets : '+audit.valid+'/23'+(audit.errors.length?' ; anomalies : '+audit.errors.join(', ').slice(0,200):''));
      }catch(e){check('audit des évaluations mathématiques côté site',false,'Erreur de lecture du service : '+String(e.message||e).slice(0,130));}
    }
    // Vérifier la lisibilité de la fiche de mathématiques sur téléphone et ordinateur.
    // Lecture seule : aucun exercice n'est soumis et aucun résultat n'est créé.
    try{
      await page.locator('[data-nav="matieres"]:visible').first().click({timeout:9000});
      await page.locator('#matieres-content .matter-card').filter({hasText:'Mathématiques'}).first().click({timeout:9000});
      await page.locator('.math-path .spx-card').filter({hasText:'Calcul littéral'}).first().click({timeout:9000});
      await page.locator('[data-math-programs="MBIS13"]').first().click({timeout:9000});
      const headings=await page.locator('.math-path section.spx-panel h3').allTextContents();
      check(label+' programmes A et B visibles',headings.includes('Programme A')&&headings.includes('Programme B'));
      const five=page.locator('.math-path section.spx-panel').filter({has:page.locator('h3:text-is("Les cinq questions du professeur")')}).locator('ol li');
      check(label+' exercice complet avec cinq questions',(await five.count())===5,'Fiche ENT sans validation');
      await picture(page,label+'-maths-programmes-a-b');
    }catch(e){check(label+' fiche programmes A/B',false,'Navigation ou affichage incomplet : '+String(e.message||e).slice(0,110));}
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
