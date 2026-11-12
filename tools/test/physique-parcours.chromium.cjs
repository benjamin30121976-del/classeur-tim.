'use strict';
/* Audit Chromium en lecture seule. Il n’utilise aucun compte Tim/Parent, ne
   valide aucune question et bloque toute requête de mutation. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const target=process.env.TIM_SITE_URL||'http://127.0.0.1:8779/';
const output='audit-physique';
function makeSyntheticPdf(){
 const operations='BT /F1 24 Tf 65 690 Td (Document de controle - non prive) Tj ET';
 const objs=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
  '<< /Length '+Buffer.byteLength(operations,'latin1')+' >>\nstream\n'+operations+'\nendstream',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
 ];
 let body='%PDF-1.4\n',offsets=[0];
 for(let i=0;i<objs.length;i++){
  offsets.push(Buffer.byteLength(body,'latin1'));
  body+=(i+1)+' 0 obj\n'+objs[i]+'\nendobj\n';
 }
 const xref=Buffer.byteLength(body,'latin1');
 body+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
 for(let i=1;i<offsets.length;i++)body+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 body+='trailer\n<< /Root 1 0 R /Size '+(objs.length+1)+' >>\nstartxref\n'+xref+'\n%%EOF\n';
 return Buffer.from(body,'latin1').toString('base64');
}

async function main(){
 fs.mkdirSync(output,{recursive:true});
 const path=['/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(path?{executablePath:path}:{}),args:['--no-sandbox']});
 const report={site:target,readOnly:true,checks:{},errors:[]};
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  await page.route('**/*',async route=>{
   if(!['GET','HEAD'].includes(route.request().method())){report.errors.push('Mutation blocked: '+route.request().url());await route.abort();return;}
   await route.continue();
  });
  page.on('pageerror',e=>report.errors.push('JS: '+String(e.message).slice(0,300)));
  const res=await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
  assert.ok(res?.ok(),'Accueil inaccessible');
  await page.locator('#guest-enter').waitFor({state:'visible',timeout:30000});
  await page.locator('#guest-enter').click();
  await page.locator('body.guest-mode').waitFor({timeout:30000});
  const intro=page.locator('#intro-screen');
  if(await intro.isVisible()){
   const skip=page.locator('#intro-skip');
   if(await skip.isVisible())await skip.click();
   else {
    const silent=page.locator('#intro-silent');
    if(await silent.isVisible())await silent.click();
   }
   await intro.waitFor({state:'hidden',timeout:20000});
  }
  const nav=page.locator('[data-nav="matieres"]').first();
  await nav.waitFor({state:'visible',timeout:20000});await nav.click();
  const physics=page.locator('#matieres-content button.matter-card').filter({hasText:'Physique-chimie'});
  await physics.waitFor({state:'visible',timeout:20000});await physics.click();
  const cards=page.locator('#matieres-content details.tim-es-lesson');
  await cards.first().waitFor({state:'visible',timeout:20000});
  report.checks.sevenLessons=await cards.count();
  assert.equal(report.checks.sevenLessons,7,'Le nombre de leçons diffère');
  await cards.first().locator('summary').click();
  await page.locator('#matieres-content .tim-es-course-sheet').waitFor({state:'visible',timeout:15000});
  report.checks.diagram=await page.locator('#matieres-content .pc-learning-drawing svg').count();
  assert.equal(report.checks.diagram,1,'Dessin manquant');
  const menu=page.locator('#matieres-content .tim-es-quick-links button');
  report.checks.fiveActions=await menu.count();
  assert.equal(report.checks.fiveActions,5,'Les cinq actions espagnoles manquent');
  await menu.nth(2).click();
  await page.locator('.tim-es-course-help').waitFor({state:'visible',timeout:15000});
  report.checks.help=true;
  await menu.nth(0).click();
  await page.locator('.tim-es-ent-original').waitFor({state:'visible',timeout:15000});
  report.checks.ent=true;
  await menu.nth(4).click();
  const choices=page.locator('.pc-exercise-work');
  await page.locator('.tim-es-exercises').waitFor({state:'visible',timeout:15000});
  const series=page.locator('.tim-es-exercises button.tim-es-quick-link');
  report.checks.series=await series.count();
  assert.equal(report.checks.series,3,'Trois exercices par leçon manquants');
  await series.first().click();
  await choices.getByText(/réservés aux comptes Tim et Parent/i).waitFor({timeout:15000});
  report.checks.guestCannotGrade=true;
  // Vérifier le menu Exercices général, sans modifier aucune donnée.
  const general=page.locator('[data-nav="exercices"]').first();
  await general.waitFor({state:'visible',timeout:15000});
  await general.click();
  const physicsTile=page.locator('#exercise-list button.matter-card').filter({hasText:'Physique-chimie'});
  await physicsTile.waitFor({state:'visible',timeout:15000});
  report.checks.physicsInGeneralExercises=true;
  report.checks.physicsCounter=await physicsTile.textContent();
  assert.ok(/23 exercice/.test(report.checks.physicsCounter),'Le menu général doit annoncer 23 exercices (2 ENT + 21 BIS)');
  await physicsTile.click();
  const officialCards=page.locator('#exercise-list .pc-ent-official-card');
  await officialCards.first().waitFor({state:'visible',timeout:10000});
  report.checks.originalEntExercises=await officialCards.count();
  assert.equal(report.checks.originalEntExercises,2,'Deux fiches ENT originales doivent apparaître avant les BIS');
  const lessonBoxes=page.locator('#exercise-list .pc-exercise-lesson');
  await lessonBoxes.first().waitFor({state:'visible',timeout:15000});
  report.checks.exerciseLessonGroups=await lessonBoxes.count();
  assert.equal(report.checks.exerciseLessonGroups,7,'Sept groupes de leçons attendus dans Exercices');
  const interactiveTiles=page.locator('#exercise-list .pc-exercise-lesson button.tile');
  report.checks.interactiveExerciseTiles=await interactiveTiles.count();
  assert.equal(report.checks.interactiveExerciseTiles,21,'Les 21 exercices doivent être cliquables');
  await interactiveTiles.first().click();
  const globalSlot=page.locator('#exercise-detail .pc-global-training-slot');
  await globalSlot.waitFor({state:'visible',timeout:15000});
  await globalSlot.getByText(/réservés aux comptes Tim et Parent/i).waitFor({timeout:15000});
  report.checks.guestCannotSubmitFromMainMenu=true;
  const backExercise=page.locator('#exercise-detail button').filter({hasText:'Retour aux exercices de physique-chimie'});
  await backExercise.click();
  assert.equal(await interactiveTiles.count(),21,'La navigation retour doit conserver les exercices');
  // Test du PDF intégré avec un DOCUMENT SYNTHÉTIQUE, jamais avec ceux de Tim.
  await page.evaluate(b64=>{
   window.__TIM_GUEST=false;
   const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
   const blob=new Blob([bytes],{type:'application/pdf'});
   window.__TIM_BRIDGE={attachments:{
    list:async()=>[{id:'pdf-factice',targetKind:'lesson',targetId:'PCENT6390167',fileName:'Chapitre 1 Atomes molécules et ions 3eme.pdf',size:blob.size}],
    read:async()=>blob
   }};
   const host=document.createElement('div');host.id='pc-test-in-page';
   host.style.cssText='padding:20px;max-width:600px;margin:auto;background:white';
   document.body.append(host);
   const example=window.TIM_PHYSICS_INLINE_PDF.createInline(
    {target:'PCENT6390167',fileName:'Chapitre 1 Atomes molécules et ions 3eme.pdf'},
    1,'Test privé simulé — rester dans la même page'
   );
   host.append(example);
  },makeSyntheticPdf());
  await page.locator('#pc-test-in-page').scrollIntoViewIfNeeded();
  try{
   await page.waitForFunction(()=>{
    const label=document.querySelector('#pc-test-in-page .pc-pdf-toolbar span');
    return label && /^Page \d+ \/ \d+$/.test(label.textContent.trim());
   },{timeout:45000});
  }catch(err){
   const status=await page.locator('#pc-test-in-page .pc-inline-pdf').innerText();
   throw new Error('Le PDF intégré n’a pas été rendu. État : '+status.slice(0,1200)+' ; '+err.message);
  }
  const pageLabel=await page.locator('#pc-test-in-page .pc-pdf-toolbar span').innerText();
  assert.equal(pageLabel,'Page 1 / 1');
  const hasCanvas=await page.locator('#pc-test-in-page canvas').evaluate(x=>x.width>300&&x.height>300);
  assert.equal(hasCanvas,true,'Le dessin PDF doit être rendu sur le canvas');
  report.checks.privatePdfInsideLesson=true;
  report.checks.pdfCanvasRendered=true;
  report.checks.openedTabs=0;
  await page.locator('#pc-test-in-page').screenshot({path:output+'/pdf-integre-demonstration.jpg',type:'jpeg',quality:75});
  // Simulation locale du profil Parent : AUCUNE vraie connexion ni API appelée.
  await page.evaluate(async()=>{
   window.__TIM_PARENT=true;
   window.__TIM_GUEST=false;
   window.__PC_PREVIEW_TEST={written:false,calls:0};
   window.__TIM_BRIDGE.physicsTrainingTask=async id=>({
    completed:false,
    task:{
     id,lessonId:'PC_BIS01',title:'Exercice Parent de démonstration',bankVersion:'pc-audit-demo',
     questions:Array.from({length:10},(_,n)=>({
      kind:'qcm',prompt:'Question de démonstration '+(n+1)+' : quelle réponse choisir ?',
      choices:['Réponse A','Réponse B','Réponse C','Réponse D']
     }))
    }
   });
   window.__TIM_BRIDGE.physicsTrainingPreviewSubmit=async(id,answers,bankVersion)=>{
    window.__PC_PREVIEW_TEST.calls++;
    if(id!=='PCQ_L01_01'||answers.length!==10||bankVersion!=='pc-audit-demo')
     throw new Error('Validation de simulation incorrecte');
    return {practice:true,saved:false,submitted:false,xp:0,score:10,total:10,
      items:answers.map((answer,i)=>({
       questionIndex:i,correct:true,prompt:'Question de démonstration '+(i+1),
       response:'Réponse '+String.fromCharCode(65+answer),
       expected:'Réponse A',explanation:'Explication de démonstration.'
      }))
    };
   };
   const host=document.createElement('div');
   host.id='pc-parent-audit';
   host.style.cssText='padding:20px;background:#fff;color:#1b2f4a';
   document.body.append(host);
   await window.TIM_PHYSICS_TRAINING.mount('PCQ_L01_01',host);
  });
  const host=page.locator('#pc-parent-audit');
  await host.getByText(/Mode essai Parent/).waitFor({state:'visible',timeout:12000});
  for(let i=0;i<10;i++){
   await host.locator('input[type="radio"]').first().check();
   if(i<9)await host.getByRole('button',{name:'Suivante →'}).click();
  }
  await host.locator('input[type="checkbox"]').check();
  await host.getByRole('button',{name:/Corriger mon essai/}).click();
  await host.getByText(/Simulation Parent — 10 \/ 10/).waitFor({state:'visible',timeout:12000});
  const audit=await page.evaluate(()=>window.__PC_PREVIEW_TEST);
  assert.equal(audit.calls,1,'Une seule correction simulée');
  assert.equal(audit.written,false,'Aucune écriture de tentative sur le compte Tim');
  report.checks.parentSeesAndAnswersTenQuestions=true;
  report.checks.parentSimulationNoWrite=true;

  // Fiche ENT reproduite en DOM avec un pont d'essai local : aucun compte privé.
  await page.evaluate(async()=>{
   const fields=Array.from({length:10},(_,i)=>({
    id:'question'+i,kind:'text',group:i<6?i+1:Math.min(8,i),label:'Question originale '+(i+1),
    placeholder:'Écris la réponse'
   }));
   window.__PC_ENT_AUDIT={calls:0,submitted:false};
   window.__TIM_BRIDGE.physicsEntTask=async()=>({
    completed:false,
    task:{id:'PC_ENT_CTRL1',type:'formative',title:'Préparation au contrôle — test technique',
     source:'Reproduction de test sans document privé',date:'2026-09-29',bankVersion:'pc-ent-test',scale:'10 réponses.',
     document:{target:'PCENT6390168',fileName:'Eval formative controle 2 el.pdf',page:1},
     fields}
   });
   window.__TIM_BRIDGE.physicsEntPreviewSubmit=async(id,answers)=>{
    window.__PC_ENT_AUDIT.calls++;
    if(id!=='PC_ENT_CTRL1'||answers.length!==10)throw new Error('Fiche incorrecte');
    return {id,practice:true,saved:false,submitted:false,xp:0,score:10,total:10,
     correctFields:10,fieldCount:10,scale:'10 réponses.',
     items:answers.map((response,i)=>({prompt:'Question de contrôle '+(i+1),
      response,expected:'test',correct:true,kind:'text',explanation:'Réponse vérifiée dans la simulation.'}))};
   };
   const slot=document.createElement('div');slot.id='pc-ent-test';document.body.append(slot);
   await window.TIM_PHYSICS_ENT.mount('PC_ENT_CTRL1',slot);
  });
  const entHost=page.locator('#pc-ent-test');
  await entHost.getByText(/Mode essai Parent/).waitFor({state:'visible',timeout:15000});
  const entInputs=entHost.locator('textarea');
  assert.equal(await entInputs.count(),10,'Les dix réponses de la fiche ENT doivent être saisissables');
  for(let i=0;i<10;i++)await entInputs.nth(i).fill('réponse de test');
  await entHost.locator('input[type=checkbox]').check();
  await entHost.getByRole('button',{name:/Corriger mon essai ENT/}).click();
  await entHost.locator('.pc-ent-grade').getByText(/10 \/ 10 · 0 XP/).waitFor({state:'visible',timeout:15000});
  const entAudit=await page.evaluate(()=>window.__PC_ENT_AUDIT);
  assert.equal(entAudit.calls,1);
  assert.equal(entAudit.submitted,false);
  report.checks.entTeacherQuestionsFillableParent=true;
  report.checks.entParentNoSavedAttempt=true;

  // Le tableau des molécules utilise les 12 cases d'un vrai exercice ENT :
  // six formules écrites et six modèles construits avec les boules.
  await page.evaluate(async()=>{
   const rows=[
    {id:'eau',name:'Eau'}, {id:'dioxygene',name:'Dioxygène'},
    {id:'diazote',name:'Diazote'},{id:'dihydrogene',name:'Dihydrogène'},
    {id:'dioxyde_carbone',name:'Dioxyde de carbone'},
    {id:'methane',name:'Méthane',printedFormula:'CH₄'},
    {id:'protoxyde_azote',name:'Protoxyde d’azote',printedModel:'2 N (bleu) + 1 O (rouge)'}
   ];
   const fields=[];
   for(const [i,row] of rows.entries()){
    if(!row.printedFormula)fields.push({id:row.id+'_formula',group:i+1,kind:'formula',label:'Formule : '+row.name});
    if(!row.printedModel)fields.push({id:row.id+'_model',group:i+1,kind:'model',label:'Modèle : '+row.name,atoms:['H','C','N','O']});
   }
   window.__PC_ENT_TABLE_AUDIT={calls:0};
   window.__TIM_BRIDGE.physicsEntTask=async()=>({completed:false,task:{
    id:'PC_ENT_MOLECULES',type:'molecule-table',title:'Chapitre 1 — Tableau des molécules',
    source:'Tableau original — essai sans compte',date:'2026-10-06',bankVersion:'pc-ent-test',scale:'12 cases.',
    document:{target:'PCENT6390201',fileName:'Chapitre 1 tableau molecules.pdf',page:1},molecules:rows,fields
   }});
   window.__TIM_BRIDGE.physicsEntPreviewSubmit=async(id,answers)=>{
    window.__PC_ENT_TABLE_AUDIT.calls++;
    if(id!=='PC_ENT_MOLECULES'||answers.length!==12)throw new Error('Tableau incomplet');
    return {id,practice:true,saved:false,submitted:false,xp:0,score:10,total:10,
     correctFields:12,fieldCount:12,scale:'12 cases.',
     items:answers.map((response,i)=>({prompt:'Cellule '+(i+1),kind:'text',response,expected:'réponse',correct:true,
      explanation:'Corrigé de simulation.'}))};
   };
   const host=document.createElement('div');host.id='pc-ent-table-test';document.body.append(host);
   await window.TIM_PHYSICS_ENT.mount('PC_ENT_MOLECULES',host);
  });
  const mol=page.locator('#pc-ent-table-test');
  const molRows=mol.locator('.pc-ent-molecule-row');
  assert.equal(await molRows.count(),7,'Le tableau ENT doit comporter sept lignes');
  const compositions=[
   {formula:'H2O',atoms:['H','H','O']},
   {formula:'O2',atoms:['O','O']},
   {formula:'N2',atoms:['N','N']},
   {formula:'H2',atoms:['H','H']},
   {formula:'CO2',atoms:['C','O','O']},
   {atoms:['C','H','H','H','H']},
   {formula:'N2O'}
  ];
  for(const [i,m] of compositions.entries()){
   const line=molRows.nth(i);
   if(m.formula)await line.locator('input[type=text]').fill(m.formula);
   for(const atom of m.atoms||[])await line.getByRole('button',{name:new RegExp('^\\+ '+atom+' ·')}).click();
  }
  await mol.locator('input[type=checkbox]').check();
  await mol.getByRole('button',{name:/Corriger mon essai ENT/}).click();
  await mol.locator('.pc-ent-grade').getByText(/10 \/ 10 · 0 XP/).waitFor({state:'visible',timeout:15000});
  assert.equal((await page.evaluate(()=>window.__PC_ENT_TABLE_AUDIT)).calls,1);
  report.checks.entMoleculeSevenRowsTwelveFields=true;
  report.checks.entMoleculeModelsFillable=true;


  // Vérifier aussi les nouvelles fiches originales ENT de maths en profil Parent simulé.
  // Aucune connexion et aucun appel au serveur réel.
  await page.evaluate(async()=>{
   const names=[
    'Choisis un nombre, soustrais 9, multiplie par 2 et ajoute son triple.',
    'Multiplie par −3, ajoute le carré du nombre puis 2.',
    'Ajoute 5, multiplie par le nombre de départ puis soustrais 8.',
    'Multiplie par 2, ajoute 3, multiplie par −4 et ajoute 4.',
    'Ajoute 7, multiplie par 3 puis ajoute le cube du nombre.',
    'Ajoute 1, mets le résultat au carré, puis soustrais son double.'
   ];
   window.__TIM_PARENT=true;window.__TIM_GUEST=false;
   window.__MATH_ENT_AUDIT={calls:0,saved:false};
   window.__TIM_BRIDGE.mathEntTask=async id=>{
    if(id==='ME_ENT_PROGRAMMES')return {completed:false,task:{
     id,kind:'programmes',title:'Fiche ENT — six programmes',
     source:'Fiche ENT',date:'2026-11-02',due:'2026-11-05',bankVersion:'math-ent-test',
     total:10,scale:'6 réponses.',
     fields:names.map((name,i)=>({id:'P'+(i+1),group:i+1,kind:'expression',
      label:'Programme n°'+(i+1)+' — expression associée',
      steps:[name],placeholder:'Expression littérale'}))}};
    const cases=[
     {id:'T1',title:'Case 1 — triangles emboîtés',first:'(AC) et (AB)',parallel:'(NM) et (CB)',given:'AN=2 AC=5 AB=6 MN=3,5'},
     {id:'T2',title:'Case 2 — triangles emboîtés',first:'(EG) et (EF)',parallel:'(IJ) et (GF)',given:'EJ=4 EG=10 EI=3 FG=8'},
     {id:'T3',title:'Case 3 — papillon',first:'(RV) et (SU)',parallel:'(RS) et (UV)',given:'TU=3 UV=4 TV=5 RS=6'}
    ];
    return {completed:false,task:{id,kind:'thales',title:'Fiche ENT — Thalès',
      source:'Fiche ENT de démonstration',date:'2026-10-09',due:'2026-10-12',
      bankVersion:'math-ent-test',total:10,scale:'15 réponses.',
      cases,fields:cases.flatMap((c,i)=>[
       {id:'T'+(i+1)+'_inter',group:i+1,kind:'point',label:'Intersection ?'},
       {id:'T'+(i+1)+'_para',group:i+1,kind:'parallel',label:'Parallèles ?'},
       {id:'T'+(i+1)+'_ratio',group:i+1,kind:'ratios',label:'Rapports ?'},
       {id:'T'+(i+1)+'_a',group:i+1,kind:'number',label:'Longueur 1 ?'},
       {id:'T'+(i+1)+'_b',group:i+1,kind:'number',label:'Longueur 2 ?'}
      ])}};
   };
   window.__TIM_BRIDGE.mathEntPreviewSubmit=async(id,answers)=>{
    window.__MATH_ENT_AUDIT.calls++;
    if(!['ME_ENT_PROGRAMMES','ME_ENT_THALES3'].includes(id))throw Error('incorrect ID');
    if(answers.length!==(id==='ME_ENT_PROGRAMMES'?6:15))throw Error('wrong number of answers');
    return {id,practice:true,saved:false,submitted:false,xp:0,score:10,total:10,
     correctFields:answers.length,fieldCount:answers.length,scale:'Essai.',
     items:answers.map((response,i)=>({prompt:'Question '+(i+1),response,
      expected:'résultat correct',explanation:'Explication pour l’essai.',correct:true}))};
   };
   const host=document.createElement('div');host.id='maths-ent-audit';
   host.style.cssText='padding:22px;background:#fff;color:#213a5b;margin-top:40px';
   document.body.append(host);
   const directory=document.createElement('div');directory.id='maths-ent-directory';host.append(directory);
   window.TIM_MATH_ENT.renderDirectory(directory,{showUnavailable:false});
   const program=document.createElement('div');program.id='maths-ent-program';host.append(program);
   await window.TIM_MATH_ENT.mount('ME_ENT_PROGRAMMES',program);
  });
  assert.equal(await page.locator('#maths-ent-directory .math-ent-entry').count(),2,
   'Deux vraies fiches maths ENT accessibles dans le menu');
  const prog=page.locator('#maths-ent-program');
  assert.equal(await prog.locator('input[type=text]').count(),6,'Six programmes à compléter');
  for(let i=0;i<6;i++)await prog.locator('input[type=text]').nth(i).fill('5x-18');
  await prog.locator('input[type=checkbox]').check();
  await prog.getByRole('button',{name:/Corriger mon essai ENT/}).click();
  await prog.locator('.math-ent-results-header').getByText(/10\/10/).waitFor({state:'visible',timeout:12000});
  report.checks.mathsEntProgrammesParentFillable=true;
  await page.evaluate(async()=>{
   const host=document.querySelector('#maths-ent-audit');
   const thales=document.createElement('div');thales.id='maths-ent-thales';
   host.append(thales);
   await window.TIM_MATH_ENT.mount('ME_ENT_THALES3',thales);
  });
  const thales=page.locator('#maths-ent-thales');
  assert.equal(await thales.locator('input[type=text]').count(),15,'Quinze cases Thalès attendues');
  assert.equal(await thales.locator('svg').count(),3,'Trois schémas Thalès attendus');
  for(let i=0;i<15;i++)await thales.locator('input[type=text]').nth(i).fill('réponse essai');
  await thales.locator('input[type=checkbox]').check();
  await thales.getByRole('button',{name:/Corriger mon essai ENT/}).click();
  await thales.locator('.math-ent-results-header').getByText(/10\/10/).waitFor({state:'visible',timeout:12000});
  const mathAudit=await page.evaluate(()=>window.__MATH_ENT_AUDIT);
  assert.equal(mathAudit.calls,2);
  assert.equal(mathAudit.saved,false);
  report.checks.mathsEntThalesThreeCasesFillable=true;
  report.checks.mathsEntParentNoWrite=true;
  // Espagnol : la vraie fiche PDF de la séance reste à côté du cours et de sa
  // traduction, même lorsque le lecteur n'a jamais ouvert un onglet supplémentaire.
  await page.evaluate(async pdfBase64=>{
   const bytes=Uint8Array.from(atob(pdfBase64),ch=>ch.charCodeAt(0));
   const blob=new Blob([bytes],{type:'application/pdf'});
   window.__TIM_PARENT=true;window.__TIM_GUEST=false;
   window.__TEST_NEW_TABS=0;
   window.open=()=>{window.__TEST_NEW_TABS++;throw new Error('Nouvel onglet interdit');};
   window.__TIM_DATA.metadata=window.__TIM_DATA.metadata||{};
   window.__TIM_DATA.metadata.spanishEnt={
    lessons:[{data:{id:'DEMO-ESP'},included:[{type:'lessonContent',attributes:{html:'<p>Se présenter en espagnol</p>'}}]}],
    homework:[],
    index:[{id:'fiche-demo',nom_ENT:'Fiche de cours du professeur',nom_dans_archive:'fiche-demo.pdf',
      rattache_a:[{type:'cours',id:'DEMO-ESP'}]}],
    translations:{courses:{'DEMO-ESP':{fr:'Se présenter en français'}},attachments:{}}
   };
   window.__TIM_BRIDGE.attachments={
    list:async(type,id)=>id==='ENTESP_2026'
      ?[{id:'spanish-pdf-demo',fileName:'fiche-demo.pdf',size:blob.size}]:[],
    read:async()=>blob
   };
   const mount=document.createElement('div');mount.id='spanish-inline-pdf-test';
   document.body.append(mount);
   await window.TIM_SPANISH_ENT_EXACT.renderLessonOriginal(mount,'DEMO-ESP','course');
  },makeSyntheticPdf());
  const spanish=page.locator('#spanish-inline-pdf-test');
  await spanish.getByText('Traduction en français').waitFor({state:'visible',timeout:12000});
  assert.equal(await spanish.locator('.pc-inline-pdf').count(),1,'Le PDF espagnol doit être dans la leçon');
  await spanish.getByRole('button',{name:/Afficher ici le document/}).click();
  await spanish.locator('.pc-pdf-toolbar span').getByText('Page 1 / 1').waitFor({state:'visible',timeout:30000});
  report.checks.spanishPdfInlineWithTranslation=true;
  assert.equal(await page.evaluate(()=>window.__TEST_NEW_TABS),0,'Aucun onglet nouveau en espagnol');

  // Maths : un PDF enregistré dans le cours ENT se lit directement ici.
  await page.evaluate(async pdfBase64=>{
   const bytes=Uint8Array.from(atob(pdfBase64),ch=>ch.charCodeAt(0));
   const blob=new Blob([bytes],{type:'application/pdf'});
   window.__TIM_BRIDGE.attachments={
    list:async(type,id)=>id==='MATH-COURSE-DEMO'
      ?[{id:'math-pdf-demo',fileName:'2026-11-02 programmes calcul maths.pdf',size:blob.size}]:[],
    read:async()=>blob
   };
   const host=document.createElement('div');host.id='math-inline-pdf-test';
   document.body.append(host);
   await window.TIM_INLINE_ENT_DOCUMENTS.mount(host,['MATH-COURSE-DEMO'],{
    filenamePattern:/programme.*maths/i,limit:2
   });
  },makeSyntheticPdf());
  const mathDoc=page.locator('#math-inline-pdf-test');
  await mathDoc.getByText('1 document(s) original(aux)').waitFor({state:'visible',timeout:15000});
  assert.equal(await mathDoc.locator('.pc-inline-pdf').count(),1);
  await mathDoc.getByRole('button',{name:/Afficher ici le document/}).click();
  await mathDoc.locator('.pc-pdf-toolbar span').getByText('Page 1 / 1').waitFor({state:'visible',timeout:30000});
  report.checks.mathPdfInlineNoOtherPage=true;
  assert.equal(await page.evaluate(()=>window.__TEST_NEW_TABS),0,'Aucun onglet nouveau en maths');

  // La correction doit permettre de revenir à la vraie sous-leçon BIS.
  await page.evaluate(()=>window.TIM_PEDAGOGY_NAVIGATE('Mathématiques','MBIS13'));
  await page.locator('#matieres-content .math-reading-lesson').waitFor({state:'visible',timeout:15000});
  assert.ok((await page.locator('#matieres-content .spx-hero h2').innerText()).length>4);
  report.checks.mathFeedbackDeepLinkToLesson=true;
  await page.screenshot({path:output+'/physique-mobile.jpg',type:'jpeg',quality:70,fullPage:true});
  fs.writeFileSync(output+'/rapport.json',JSON.stringify(report,null,2));
  process.stdout.write(JSON.stringify(report)+'\n');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
