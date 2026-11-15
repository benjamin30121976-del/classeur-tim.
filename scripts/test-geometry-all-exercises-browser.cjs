'use strict';
/* Contrôle Chromium local : énoncés publics uniquement, aucune session élève ni écriture. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
const geometry=fs.readFileSync(path.join(dir,'maths-geometry-general.js'),'utf8');
const legacy=fs.readFileSync(path.join(dir,'maths-bonus-figures.js'),'utf8');
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const first=app.indexOf('function openExercise(id,options={}){');
const last=app.indexOf("\ndocument.getElementById('exercise-search')",first);
assert(first>0&&last>first,'Fonction openExercise absente');
const exerciseCode=app.slice(first,last);
const BD=[
 'Dans ABC, M est sur [AB] et N sur [AC], dans le même ordre à partir de A. Si AM/AB = AN/AC, quelle conclusion permet la réciproque de Thalès ?',
 'A, M, B sont alignés dans cet ordre et A, N, C aussi. AM=2, AB=6, AN=3, AC=9. Peut-on conclure (MN)//(BC) ?',
 'A, M, B et A, N, C sont alignés dans cet ordre. AM=2, AB=7, AN=3, AC=9. Que peut-on dire ?',
 'Dans la même configuration, AM=4, AB=12, AN=5 et AC=15. Quelle égalité est juste ?',
 'Dans ABC, M ∈ [AB], N ∈ [AC] dans le même ordre. AM=3, AB=9, AN=6, AC=12. Les droites (MN) et (BC) sont-elles parallèles ?',
 'Pourquoi préciser que A,M,B et A,N,C sont alignés dans le même ordre ?',
 'Si AM/AB = AN/AC, avec AM=3 cm, AB=9 cm et AC=15 cm, quelle est la longueur AN en cm ? Écris seulement le nombre.',
 'Si on SAIT déjà que (MN) est parallèle à (BC), quel résultat utilise-t-on en premier ?',
 'A,M,B et A,N,C sont alignés dans le même ordre. AM/AB=2/5 et AN/AC=4/10. Quelle conclusion ?',
 'Quelle rédaction est correcte pour conclure ?'
];
const bd={id:'BD1611_MA01',kind:'training',subject:'Mathématiques',title:'16/11 — Réciproque de Thalès : s’entraîner',
 level:'10 questions',description:'Test local de figures',questions:BD.map(q=>({type:'mc',q,options:['Option A','Option B','Option C','Option D']}))};
const pyth={id:'M26PYT1001',kind:'school',subject:'Mathématiques',title:'Archive ENT — Exercice 7 de Pythagore',
 questions:[
  {q:'AB=4,2 cm, BC=5,6 cm et AC=7 cm : quelle est la nature du triangle ABC ?'},
  {q:'Quel est son périmètre ?'},{q:'Quelle est son aire ?'}
 ]};
(async()=>{
 const {mathNov12ForParentImport,mathNov12Score}=await import('../maths-12nov-training.mjs');
 const original=mathNov12ForParentImport().exercises;
 const current=original.find(x=>x.id==='MTH12_03');
 const legacyExercise=structuredClone(current);
 legacyExercise.questions[9]={
  q:'Le professeur a demandé l’exercice 25 p.253, mais son énoncé n’est pas dans l’ENT. Comment le classeur doit-il le présenter ?',
  options:['Inventer les mesures de la page','Indiquer que l’énoncé manque et proposer des exercices distincts','Prétendre que ces questions sont l’exercice officiel','Marquer le devoir comme réalisé']
 };
 const sample=Array(10).fill(0);
 const oldGrade=mathNov12Score('MTH12_03',sample,legacyExercise);
 const newGrade=mathNov12Score('MTH12_03',sample,current);
 assert(oldGrade&&newGrade,'Compatibilité des banques Thalès absente');
 assert.equal(oldGrade.items[9].correct,false,'Ancienne question : index 0 doit être faux');
 assert.equal(newGrade.items[9].correct,true,'Nouvelle question : index 0 doit être vrai');
 assert.match(oldGrade.items[9].expected,/énoncé manque/);
 assert.match(newGrade.items[9].expected,/réciproque de Thalès/);
 const unknown=structuredClone(current);unknown.questions[9].q='Question non autorisée';
 assert.equal(mathNov12Score('MTH12_03',sample,unknown),null,'Une banque inconnue ne doit jamais être notée avec un autre corrigé');
 console.log('OK compatibilité Thalès : ancien et nouveau questionnaire, barèmes séparés, banque inconnue refusée.');
 const {mathPublicTask,mathTask,gradeMathTask}=await import('../worker/maths-training-curriculum.mjs');
 const mathsData=JSON.parse(fs.readFileSync(path.join(dir,'maths-bis-data.js'),'utf8').split('=').slice(1).join('=').trim().replace(/;$/,''));
 const lessons=Object.fromEntries(mathsData.lessons.map(x=>[x.id,x.title]));
 assert.equal(mathsData.lessons.length,23,'Leçons BIS incomplètes');
 const required=['Objectif','Comprendre','Méthode étape par étape','Exemples corrigés','Schéma explicatif','Comment rédiger le résultat','Erreur fréquente'];
 mathsData.lessons.forEach((l,i)=>{
  assert.equal(l.id,'MBIS'+String(i+1).padStart(2,'0'));
  for(const name of required)assert.equal(l.blocks.filter(b=>b.h===name).length,1,l.id+' : rubrique '+name+' manquante');
  assert(l.blocks.find(b=>b.h==='Comment rédiger le résultat')?.body.length>100,l.id+' : aide à la rédaction trop courte');
  assert(l.help?.simple&&l.help?.steps?.length>=3&&l.help?.example,l.id+' : parcours d’aide incomplet');
 });
 for(let n=1;n<=23;n++){
  const id='MT'+String(n).padStart(2,'0'),task=mathTask(id);
  assert.equal(task.questions.length,10,id+' : série incomplète');
  for(const q of task.questions){
   assert(q.prompt.length>=10&&q.explanation?.length>=15,id+' : énoncé ou correction insuffisants');
   assert.equal(q.choices.length,4,id+' : mauvais nombre de choix');
   assert.equal(new Set(q.choices.map(x=>x.normalize('NFKC').trim().toLowerCase())).size,4,id+' : réponses doublées');
   assert.equal(q.choices[q.correctIndex],q.expected,id+' : bonne réponse décalée');
   assert.equal(q.feedbackByIndex.filter(Boolean).length,3,id+' : correction des mauvaises réponses incomplète');
  }
  const right=task.questions.map(q=>q.correctIndex);
  const perfect=gradeMathTask(id,right);
  assert.equal(perfect.score,10,id+' : notation 10/10 incorrecte');
  for(let shift=1;shift<=3;shift++){
   const wrong=gradeMathTask(id,task.questions.map(q=>(q.correctIndex+shift)%4));
   assert.equal(wrong.score,0,id+' : notation 0/10 incorrecte');
   assert(wrong.items.every(x=>!x.correct&&x.explanation.length>=20&&x.expected),id+' : corrections des erreurs incomplètes');
  }
 }
 console.log('OK 23 leçons BIS, 23 aides à la rédaction, 230 questions, 690 erreurs simulées en mémoire (0 écriture).');
 const tasks=Array.from({length:23},(_,i)=>mathPublicTask('MT'+String(i+1).padStart(2,'0'))).map(t=>({
  ...t,hint:lessons[t.lessonId]||'',subject:'Mathématiques'
 }));
 const browser=await chromium.launch({headless:true});
 try{
  for(const [device,viewport] of [['android',{width:390,height:844}],['bureau',{width:1280,height:900}]]){
   const page=await browser.newPage({viewport,locale:'fr-FR'});
   page.on('request',req=>{if(!/^(data:|about:)/.test(req.url()))throw Error('Réseau non autorisé : '+req.url());});
   await page.setContent('<!DOCTYPE html><html lang="fr"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:15px;background:#15203b;color:#f7f9fe;font:16px Arial}.panel{background:#fff;color:#25344a;border-radius:15px;padding:16px}figure{color:#25344a}.q{padding:15px;border-bottom:1px solid #aab}.qtitle{font-size:21px;font-weight:bold}.choose{display:block}</style><div id="exercise-index"></div><div id="exercise-detail"></div></html>');
   await page.addScriptTag({content:geometry});
   await page.addScriptTag({content:legacy});
   const inventory=await page.evaluate(tasks=>tasks.map(t=>{
    const figures=t.questions.map(q=>!!window.TIM_GEOMETRY_DIAGRAMS.renderPrompt(q.prompt,t.hint));
    return {id:t.id,withFigure:figures.filter(Boolean).length,total:t.questions.length,
     missing:t.questions.map((q,i)=>({prompt:q.prompt,fig:figures[i]})).filter(x=>!x.fig).map(x=>x.prompt.slice(0,110))};
   }),tasks);
   if(device==='android')console.log('BANQUE_230_FIGURES '+JSON.stringify(inventory));
   for(const id of ['MT05','MT06','MT07','MT08','MT09','MT14','MT15','MT16','MT18','MT21','MT22']){
    const item=inventory.find(x=>x.id===id);
    assert.equal(item?.withFigure,10,id+' : il manque une figure dans un exercice de géométrie');
   }
   for(const id of ['MT01','MT02','MT03','MT04','MT10','MT11','MT12','MT13','MT19','MT20']){
    const item=inventory.find(x=>x.id===id);
    assert.equal(item?.withFigure,0,id+' : les calculs sans géométrie ne doivent pas recevoir de figure inutile');
   }
   // Régression : le bonus du 16/11 avait un ancien énoncé D/E en base,
   // mais affichait M/N. Le dessin doit suivre M/N et la légende sans chiffres.
   const stale=structuredClone(bd);
   stale.questions[0].q='Dans le triangle ABC, D est sur [AB] et E sur [AC], dans le même ordre. On sait que AD/AB = AE/AC. Quelle conclusion permet la réciproque de Thalès ?';
   const consistent=await page.evaluate(ex=>{
    const figure=window.TIM_GEOMETRY_DIAGRAMS.render(ex,0);
    const marks=[...figure.querySelectorAll('svg text')].map(el=>el.textContent);
    const caption=figure.querySelector('figcaption')?.textContent||'';
    const shown=window.TIM_GEOMETRY_DIAGRAMS.displayPrompt(ex,0,ex.questions[0].q);
    return {marks,caption,shown};
   },stale);
   assert(consistent.shown.includes('M est sur [AB]')&&consistent.shown.includes('N sur [AC]'),
    'Le texte présenté doit bien être celui de M et N');
   assert(consistent.marks.includes('M')&&consistent.marks.includes('N'),
    'Le schéma de la question 1 doit afficher les deux points M et N : '+JSON.stringify(consistent));
   assert(!consistent.marks.includes('D')&&!consistent.marks.includes('E'),
    'Le schéma affiche encore les anciens points D et E');
   assert.match(consistent.caption,/égalité des rapports/);
   assert(!/compare les longueurs données/i.test(consistent.caption),
    'La légende ne doit pas demander des longueurs inexistantes');
   assert(!/sont parallèles/i.test(consistent.caption),
    'La légende ne doit pas donner la conclusion');
   const direct=await page.evaluate(({bd,original,pyth})=>{
    const b=bd.questions.map((_,i)=>window.TIM_BONUS_FIGURES.render(bd,i));
    const bis=original.map(ex=>({
     id:ex.id,
     present:ex.questions.map((_,i)=>Boolean(window.TIM_BONUS_FIGURES.render(ex,i)?.querySelector('svg'))),
     without:ex.questions.map((q,i)=>!window.TIM_BONUS_FIGURES.render(ex,i)&&i+1).filter(Boolean)
    }));
    const historical=pyth.questions.map((_,i)=>window.TIM_BONUS_FIGURES.render(pyth,i));
    const para=b[4]?.querySelector('svg')?.getAttribute('aria-label');
    return {
     bd:b.map(fig=>!!fig?.querySelector('svg[role="img"]')),
     q1HasAnswer:b[0]?.textContent.includes('(MN) est parallèle à (BC)'),
     q5Data:b[4]?.textContent,
     q5Description:para,
     q8Given:b[7]?.textContent,
     bis,pyth:historical.map(fig=>Boolean(fig?.querySelector('svg'))),
     pythLabels:historical.map(fig=>fig?.textContent)
    };
   },{bd,original,pyth});
   assert.equal(direct.bd.filter(Boolean).length,10,'Les dix questions du devoir Thalès doivent avoir leur schéma : '+JSON.stringify(direct.bd));
   assert.equal(direct.q1HasAnswer,false,'La figure de Q1 ne doit pas livrer la conclusion');
   assert.match(direct.q5Data,/AM\s*:\s*3/,'Q5 : mesure AM absente');
   assert.match(direct.q5Data,/AN\s*:\s*6/,'Q5 : mesure AN absente');
   assert(!direct.q5Data.includes('indiquées parallèles'),'Q5 : ne pas présenter le parallélisme comme une donnée');
   assert(direct.q8Given.includes('indiquées parallèles'),'Q8 : reconnaître les parallèles fournies');
   assert.deepEqual(direct.bis.map(x=>x.present.filter(Boolean).length),[10,10,10],'Les 30 questions BIS de Thalès doivent désormais avoir un schéma');
   assert.deepEqual(direct.pyth,[true,true,true],'Les trois questions de l’archive Pythagore sont sans figure');
   assert(direct.pythLabels[1].includes('4,2 cm'),'Les dimensions du triangle doivent rester visibles pour la question suivante.');
   await page.evaluate(({source,ex})=>{
    const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text??'');return n;};
    const button=(text,fn,cls)=>{const n=E('button',cls,text);n.onclick=fn;return n;};
    const DATA={lessons:[],exercises:[ex]};
    window.__TIM_PARENT=true;window.__TIM_GUEST=false;window.__CLOUD_ATTEMPTS=[];
    window.TIM_EXERCISE={mode:()=>false};
    const f={DATA,document,window,E,button,badge:()=>E('span','badge','Maths'),
      notice:t=>E('div','note',t),safe:v=>String(v??''),page:()=>{},clear:n=>(n.replaceChildren(),n),
      lessonBy:()=>null,exerciseBy:()=>ex,attemptFor:()=>null,drafts:()=>({}),
      makeAttachmentPanel:()=>E('div','attachments',''),v7Feedback:()=>E('div'),scrollTop:()=>{},
      openLesson:()=>{},renderExerciseIndex:()=>{},v7NewAttempt:()=>{},
      DRAFT_KEY:'test',save:()=>{},confirm:()=>false,alert:()=>{},exerciseDescription:x=>x.description||''};
    Function(...Object.keys(f),source+';return openExercise')(...Object.values(f))(ex.id,{skipOpening:true});
   },{source:exerciseCode,ex:bd});
   assert.equal(await page.locator('#exercise-detail .q').count(),10);
   assert.equal(await page.locator('#exercise-detail .q figure svg[role="img"]').count(),10,
     'Le vrai rendu de l’onglet Exercices ne contient pas les dix schémas.');
   const widths=await page.locator('#exercise-detail .q figure').evaluateAll(items=>items.map(el=>({
    figure:el.getBoundingClientRect().width,container:el.parentElement.getBoundingClientRect().width
   })));
   assert(widths.every(v=>v.figure<=v.container+2),'Un schéma déborde sur le téléphone.');
   const output=path.join(dir,'browser-results','animations-exercices');
   fs.mkdirSync(output,{recursive:true});
   await page.locator('#exercise-detail .q').first().screenshot({
    path:path.join(output,'devoir-thales-question1-'+device+'.png'),animations:'disabled'
   });
   console.log('OK '+device+': 10/10 devoir Thalès, 30/30 BIS, 3/3 archive Pythagore ; rendu Exercices 10/10 ; aucune tentative.');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
