'use strict';
/* Publication non destructive des 150 exercices espagnols à partir du compte Parent
   existant. Les mots de passe sont utilisés uniquement en mémoire dans GitHub Actions.
   Toute sortie console est limitée aux nombres, jamais aux réponses ni aux données privées. */
const {chromium}=require('playwright');
const email=process.env.TIM_PARENT_EMAIL||'',password=process.env.TIM_PARENT_PASSWORD||'';
const url=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const assert=require('assert').strict;
(async()=>{
 if(!email||!password)throw Error('Secrets de connexion Parent absents, publication annulée.');
 const {SPANISH_COURSE}=await import('../functions/spanish-training-curriculum.mjs');
 const {buildSpanishTasks}=await import('../functions/spanish-training-engine.mjs');
 const exercises=[];
 for(const lesson of Object.keys(SPANISH_COURSE)){
  for(const mode of ['Q','W'])for(let n=1;n<=5;n++){
   const id='SP'+mode+'_'+lesson+'_0'+n,task=buildSpanishTasks(id,SPANISH_COURSE);
   assert(task&&task.questions.length===10);
   exercises.push({
    id,lesson,title:(mode==='Q'?'QCM ':'Écriture ')+n+' — '+SPANISH_COURSE[lesson].name,
    subject:'Espagnol',topic:'Entraînement de la sous-leçon',category:'school',kind:'training',
    source:'Entraînement du classeur (non ENT)',description:'10 questions, validation unique, 0 XP',
    questions:task.questions.map(q=>q.type==='mc'?{
     type:'mc',q:q.prompt,options:q.choices,right:String(q.correctIndex),why:q.note
    }:{
     type:'text',q:q.prompt,right:q.answer,why:q.note
    })
   });
  }
 }
 assert.equal(exercises.length,150);
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1250,height:850},locale:'fr-FR'});
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response?.ok())throw Error('Le classeur n’est pas accessible.');
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&!!window.__TIM_BRIDGE?.publish,{timeout:45000});
  // Ne pas publier un exercice dont la leçon ENT d'origine n'est pas présente.
  const plan=await page.evaluate(candidates=>{
   const lessons=new Set((window.__TIM_DATA?.lessons||[]).map(x=>x.id));
   const present=new Set((window.__TIM_DATA?.exercises||[]).map(x=>x.id));
   const missingLessons=[...new Set(candidates.filter(x=>!lessons.has(x.lesson)).map(x=>x.lesson))];
   if(missingLessons.length)throw Error('Une ou plusieurs leçons ENT associées sont absentes. Aucun import effectué.');
   return {missing:candidates.filter(x=>!present.has(x.id)).map(x=>x.id),existing:candidates.filter(x=>present.has(x.id)).length};
  },exercises);
  console.log('Exercices déjà présents : '+plan.existing+'. Manquants : '+plan.missing.length+'.');
  const remaining=new Set(plan.missing),pending=exercises.filter(x=>remaining.has(x.id));
  for(let i=0;i<pending.length;i+=30){
   const batch=pending.slice(i,i+30);
   const saved=await page.evaluate(async input=>window.__TIM_BRIDGE.publish({lessons:[],exercises:input}),batch);
   assert.equal(saved,batch.length);
   console.log('Lot publié : '+Math.min(i+30,pending.length)+' / '+pending.length+'.');
  }
  // Relire l'index parent Firestore après import (pas seulement la réponse d'écriture).
  await page.reload({waitUntil:'domcontentloaded'});
  try{
   await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,{timeout:18000});
  }catch(error){
   // Les comptes Firebase conservent normalement leur session entre deux chargements.
   if(await page.locator('#parent-enter').isVisible()){
    await page.locator('#parent-enter').click();
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(password);
    await page.locator('#login-button').click();
   }
   await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true,{timeout:45000});
  }
  const count=await page.evaluate(ids=>{
   const present=new Set((window.__TIM_DATA?.exercises||[]).map(x=>x.id));
   return ids.filter(id=>present.has(id)).length;
  },exercises.map(x=>x.id));
  assert.equal(count,150,'Les 150 entraînements ne sont pas tous présents dans le compte Parent après relecture');
  console.log('CONFIRMÉ : les 150 exercices sont enregistrés dans le même Firestore que les devoirs existants.');
 }finally{await browser.close();}
})().catch(err=>{console.error('Publication non confirmée : '+String(err.message||err).slice(0,240));process.exit(1);});
