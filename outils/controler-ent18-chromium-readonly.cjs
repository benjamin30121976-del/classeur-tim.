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
   window.TIM_SPANISH_ENT_EXACT={render:async(root)=>{root.innerHTML='<div class="tim-es-chronological"></div>'; }};
   window.__TIM_BRIDGE={attachments:{list:async()=>[],upload:()=>{throw Error('AUCUN IMPORT ATTENDU');},read:()=>{throw Error('AUCUNE LECTURE ATTENDUE')}}};
  });
  for(const p of ['tim-ent-18nov-private-import.js','tim-ent-18nov-lessons.js'])
   await page.addScriptTag({content:fs.readFileSync(p,'utf8')});
  await page.evaluate(async()=>window.TIM_SPANISH_ENT_EXACT.render(document.getElementById('root'),{}));
  assert.equal(await page.locator('[data-ent-id="10099~6400507"]').count(),1);
  assert.equal(await page.locator('#tim-ent-18nov-private-import').count(),1);
  await page.locator('[data-ent-id="10099~6400507"] summary').first().click();
  assert.equal(await page.getByText('1 · Leçon ENT — Mme Gonzalez').count(),1);
  await page.getByRole('button',{name:'Leçon BIS',exact:true}).click();
  assert.equal(await page.locator('[data-ent-id="10099~6400507"] table tr').count(),7);
  await page.getByRole('button',{name:"Je n’ai pas compris",exact:true}).click();
  assert.equal(await page.getByText(/je repère d’abord la personne/i).count(),1);
  await page.getByRole('button',{name:'Exercices ENT',exact:true}).click();
  assert.equal(await page.getByText(/215358/).count(),1);
  await page.getByRole('button',{name:'Préparation écrite',exact:true}).click();
  assert.equal(await page.locator('[data-ent-id="10099~6400507"] details details').count(),10);
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
    educational:window.TIM_ENT_18NOV_LESSONS.questions.length
  }));
  assert.equal(checks.files.length,5);assert.equal(checks.educational,10);
  await page.screenshot({path:'/tmp/tim-ent-18nov-lecture-seule.png',fullPage:true});
  console.log('CHROMIUM_OK: 5 pièces, cours français unique, 5 onglets espagnols, 10 questions, 0 écriture.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});