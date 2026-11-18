/* Contrôle Chromium en lecture seule de la préparation du 18/11.
   Aucun identifiant, aucune session, aucun appel réseau, aucun dépôt de copie Tim. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
  await page.route('**/*',route=>route.abort());
  await page.setContent('<main id="root"></main>');
  await page.evaluate(()=>{
   window.__TIM_PARENT=true;window.__TIM_GUEST=false;
   window.TIM_FR_PACK={lessons:[],bis:[{id:'FR_BIS12',examples:[],help:[]}]};
   window.__TIM_DATA={metadata:{spanishEnt:{lessons:[],dates:{},homework:[]}}};
   window.TIM_SPANISH_SIMPLIFIED={lessons:Array.from({length:14},(_,i)=>({id:'L'+(i+1)})),render:async(root)=>{root.innerHTML='<section class="tim-es-results"></section>';},renderQuestions:(slot,task)=>{slot.textContent='Questionnaire de '+task.questions.length+' questions, aucune soumission de test';},drawCorrection:()=>{throw Error('Correction réelle interdite au test');}};
   window.TIM_PHYSICS_INLINE_PDF={createFullInline:()=>{const el=document.createElement('section');el.className='pc-inline-full-document';return el;}};
   window.__TIM_BRIDGE={attachments:{list:async(type,target)=>target==='ENTESP_2026'?[{fileName:'liste2.pdf',sha256:'1a7d9be5cb0bda99adb1a337795822f5295478bba7994ffcb0bb543bade816e3'},{fileName:'18nov.pdf',sha256:'1ca666f7b213054347c1eec08c8aad87983f25c8279af7202a387dd95071192f'}]:[],upload:()=>{throw Error('AUCUN IMPORT ATTENDU');},read:()=>{throw Error('AUCUNE LECTURE ATTENDUE')}},spanishEntTrainingTask:async()=>({completed:false,task:{questions:Array.from({length:10},(_,i)=>({prompt:'Question '+i}))}})};
  });
  for(const p of ['espagnol-ent-exact.js','tim-ent-18nov-private-import.js','tim-ent-18nov-lessons.js'])
   await page.addScriptTag({content:fs.readFileSync(p,'utf8')});
  await page.evaluate(async()=>window.TIM_SPANISH_ENT_EXACT.render(document.getElementById('root'),{}));
  const order=await page.locator('.tim-es-chronological-lessons > [data-ent-date]').evaluateAll(nodes=>nodes.map(n=>n.dataset.entDate));
  assert.deepEqual(order,['2026-11-17','2026-11-18'],'Les séances 17 et 18 doivent être dans cet ordre.');
  assert.equal(await page.locator('.tim-ent18-import-tools').evaluate(n=>n.open),false,'Import Parent replié, sans masquer les cours');
  assert.equal(await page.locator('[data-ent-id="10099~6400507"]').count(),1);
  assert.equal(await page.locator('#tim-ent-18nov-private-import').count(),1);
  await page.locator('[data-ent-id="10099~6400507"] summary').first().click();
  await page.getByText('1 · Leçon ENT — Mme Gonzalez').waitFor({state:'visible'});
  await page.locator('[data-ent-id="10099~6400507"] .pc-inline-full-document').first().waitFor({state:'attached'});
  assert.equal(await page.locator('[data-ent-id="10099~6400507"] .pc-inline-full-document').count(),2,'Les deux PDF de la leçon doivent être intégrés sans bouton');
  await page.getByRole('button',{name:'Leçon BIS',exact:true}).click();
  assert.equal(await page.locator('[data-ent-id="10099~6400507"] table tr').count(),7);
  await page.getByRole('button',{name:"Je n’ai pas compris",exact:true}).click();
  assert.equal(await page.getByText(/je repère d’abord la personne/i).count(),1);
  await page.getByRole('button',{name:'Exercices ENT',exact:true}).click();
  assert.equal(await page.getByText(/215358/).count(),1);
  await page.getByRole('button',{name:'Entraînement',exact:true}).click();
  assert.equal(await page.locator('[data-ent-id="10099~6400507"] [data-es-training-id]').count(),3);
  await page.locator('[data-es-training-id="ESE_L17_01"]').click();
  await page.getByText(/Questionnaire de 10 questions/).waitFor({state:'visible'});
  const fr=await page.evaluate(()=>({
    count:window.TIM_FR_PACK.lessons.length,
    id:window.TIM_FR_PACK.lessons[0]?.entId,
    examples:window.TIM_FR_PACK.bis[0].examples.length
  }));
  assert.equal(fr.count,1);assert.equal(fr.id,'10099~6410460');assert.equal(fr.examples,2);
  // La réouverture de la page ne crée pas de seconde séance.
  await page.evaluate(async()=>window.TIM_SPANISH_ENT_EXACT.render(document.getElementById('root'),{}));
  assert.equal(await page.locator('[data-ent-id="10099~6400507"]').count(),1);
  const checks=await page.evaluate(()=>({
    files:window.TIM_ENT_18NOV_IMPORT.spec.map(x=>x.id),
    educational:window.TIM_ENT_18NOV_LESSONS.exerciseIds.length
  }));
  assert.equal(checks.files.length,5);assert.equal(checks.educational,3);
  await page.screenshot({path:'/tmp/tim-ent-18nov-lecture-seule.png',fullPage:true});
  console.log('CHROMIUM_OK : 17 puis 18, 2 PDF automatiques simulés, 5 onglets, 3 exercices de 10, import Parent discret, aucune écriture.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});