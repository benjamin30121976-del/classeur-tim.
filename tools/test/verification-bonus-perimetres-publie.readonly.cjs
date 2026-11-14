'use strict';
/* Contrôle d'affichage réel de l'exercice importé, exclusivement Parent en lecture seule.
   Ne valide aucun exercice, ne modifie aucun score ni tentative.
*/
const {chromium}=require('playwright');
const {existsSync}=require('node:fs');
const assert=require('node:assert/strict');
const URL='https://classeur-tim-v16.pages.dev/';
const ID='TIMBONUSPERIM20261114';
(async()=>{
 assert(process.env.TIM_PARENT_EMAIL&&process.env.TIM_PARENT_PASSWORD,'Secrets Parent indisponibles');
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR',reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message).slice(0,120)));
  let writes=0;
  await page.route('**/api/tim',async route=>{
    let action='';try{action=route.request().postDataJSON()?.action||'';}catch{}
    if(/^(submit|import|publish|set|delete|release)/i.test(action)){
      writes++;await route.abort('blockedbyclient');return;
    }
    await route.continue();
  });
  const response=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(response.status(),200,'Site non accessible');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(process.env.TIM_PARENT_EMAIL);
  await page.locator('#login-password').fill(process.env.TIM_PARENT_PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&Array.isArray(window.__TIM_DATA?.exercises),null,{timeout:60000});
  const summary=await page.evaluate(id=>{
    const rows=window.__TIM_DATA.exercises.filter(e=>e.id===id);
    return {found:rows.length,subject:rows[0]?.subject,title:rows[0]?.title,
      category:rows[0]?.category,kind:rows[0]?.kind,enabled:rows[0]?.enabled,
      count:rows[0]?.questions?.length,reasoning:rows[0]?.questions?.filter(q=>q.reasoningRequired).length};
  },ID);
  console.log('CATALOGUE_BONUS_PUBLIC '+JSON.stringify(summary));
  assert.equal(summary.found,1,'Exercice manquant ou doublonné dans le classeur');
  assert.equal(summary.subject,'Mathématiques');
  assert.equal(summary.kind,'bonus-day');
  assert.equal(summary.category,'bonus');
  assert.equal(summary.enabled,true);
  assert.equal(summary.count,10);
  assert.equal(summary.reasoning,2);
  await page.evaluate(()=>document.querySelector('[data-nav="exercices"]').click());
  const nav=await page.evaluate(()=>({
   active:document.querySelector('.page.active')?.id||'none',
   content:(document.querySelector('#exercise-list')?.innerText||'').slice(0,250),
   spotlightCount:document.querySelectorAll('#exercise-list .bonus-spotlight').length,
   bonusPool:window.TIM_BONUS?.state(window.__TIM_DATA.exercises,[])?.chosen?.length??null,
   errorsVisible:(document.querySelector('#exercise-list')?.innerText||'').includes('Aucun exercice bonus')
  }));
  console.log('NAVIGATION_BONUS_DIAGNOSTIC '+JSON.stringify(nav));
  if(nav.spotlightCount===0)throw Error('Le panneau bonus n a pas été construit par la navigation');
  await page.locator('#exercise-list .bonus-spotlight').waitFor({state:'attached',timeout:4000});
  const math=page.locator('#exercise-list .bonus-spotlight .bonus-mission-item').filter({hasText:'Mathématiques'}).first();
  assert.equal(await math.count(),1,'Matière Mathématiques absente des bonus affichés');
  await math.evaluate(el=>el.click());
  const btn=page.locator('#exercise-list .bonus-spotlight .bonus-mission-item').filter({hasText:'Le tour des rectangles'}).first();
  assert.equal(await btn.count(),1,'Défi du périmètre non visible dans le catalogue');
  await btn.evaluate(el=>el.click());
  await page.locator('#exercise-detail .q').first().waitFor({timeout:12000});
  const view={questions:await page.locator('#exercise-detail .q').count(),
    textareas:await page.locator('#exercise-detail textarea').count(),
    visibleTitle:(await page.locator('#exercise-detail').innerText()).includes('Le tour des rectangles')};
  console.log('AFFICHAGE_MOBILE_BONUS '+JSON.stringify(view));
  assert.equal(view.questions,10,'Le questionnaire complet ne s affiche pas');
  assert.equal(view.textareas,4,'Les deux questions de raisonnement doivent comporter calcul et conclusion');
  assert.equal(view.visibleTitle,true,'Titre du défi absent');
  assert.equal(writes,0,'Mutation API interceptée : le contrôle doit être en lecture seule');
  console.log('CONFIRMÉ : Le tour des rectangles est disponible dans le compte Parent, 10 questions, saisies de raisonnement et zéro validation.');
  if(errors.length)console.log('ERREURS_JS_QUANTITE '+errors.length);
 }finally{await browser.close()}
})().catch(e=>{console.error('AFFICHAGE_NON_CONFIRME '+String(e.message||e).slice(0,210));process.exitCode=1});
