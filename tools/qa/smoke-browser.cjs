'use strict';
// Parcours non authentifié et lecture seule de la version de la branche PR.
const {chromium}=require('playwright');
const fs=require('node:fs');
const url=process.env.TIM_PREVIEW_URL||'http://127.0.0.1:8765/';
const dir='browser-qa-results';
fs.mkdirSync(dir,{recursive:true});
const errors=[];
const results=[];
async function run(device,browser){
  const mobile=device==='mobile';
  const context=await browser.newContext({
    viewport:mobile?{width:390,height:844}:{width:1280,height:900},
    isMobile:mobile,hasTouch:mobile,locale:'fr-FR'
  });
  const page=await context.newPage();
  const record=(name,ok,detail='')=>{results.push({device,name,ok,detail});if(!ok)errors.push(device+' '+name+': '+detail);};
  page.on('pageerror',e=>{errors.push(device+' erreur JS: '+String(e.message).slice(0,300));});
  try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
    record('Page de départ',response?.ok()===true,'HTTP '+response?.status());
    const guest=page.locator('#guest-enter');
    await guest.waitFor({state:'visible',timeout:20000});
    record('Choix Invité',true);
    await guest.click();
    await page.waitForFunction(()=>document.body.classList.contains('guest-mode')&&typeof window.openLesson==='function',{},{timeout:30000});
    record('Ouverture du classeur Invité',true);
    const skip=page.locator('#intro-skip');
    if(await skip.isVisible()){await skip.click(); await page.locator('#intro-screen').waitFor({state:'hidden',timeout:18000});}
    const catalog=await page.evaluate(()=>({
      lessons:(window.__TIM_DATA?.lessons||[]).map(x=>({id:x.id,title:x.title})),
      exercises:(window.__TIM_DATA?.exercises||[]).filter(x=>x.id&&Array.isArray(x.questions)).map(x=>({id:x.id,title:x.title,questions:x.questions.length}))
    }));
    // Le catalogue des anciennes leçons ENT est volontairement masqué au profil Invité.
    // Ne jamais exposer des cours privés dans le seul but de réussir un test.
    record('Séparation des cours privés',catalog.lessons.every(l=>!String(l.title).includes('Ficha de datos')),'Leçons publiques : '+catalog.lessons.length);
    const exposed=await page.evaluate(()=>{
      const banned=new Set(['right','also','why','expected','answer','answers','answerKey','answerKeys','solution','solutions','correction','corrections','explanation','rubric']);
      const walk=(v,p)=>Array.isArray(v)?v.flatMap((x,i)=>walk(x,p+'/'+i)):v&&typeof v==='object'?Object.entries(v).flatMap(([k,x])=>banned.has(k)?[p+'/'+k]:walk(x,p+'/'+k)):[];
      return walk(window.__TIM_DATA,'cours');
    });
    record('Corrigés non exposés au visiteur',exposed.length===0,'Champs interdits trouvés : '+exposed.length);
    record('Exercices publics chargés',catalog.exercises.length>0,'Quantité : '+catalog.exercises.length);
    await page.locator('[data-nav="matieres"]:visible').first().click();
    record('Page matières',await page.locator('#matieres.page.active').count()>0);
    // Le parcours espagnol réellement affiché est TIM_SPANISH_ENT_EXACT,
    // qui s'appuie sur TIM_SPANISH_SIMPLIFIED (pas sur l'ancien TIM_SPANISH_PATH).
    const spanish=page.locator('#matieres-content button.matter-espanol');
    record('Espagnol accessible depuis les matières',await spanish.count()>0&&await spanish.isEnabled());
    if(await spanish.isEnabled()){
      await spanish.click();
      const list=page.locator('#matieres-content details.tim-es-lesson');
      const amount=await list.count();
      record('13 leçons espagnoles affichées',amount===13,'Leçons : '+amount);
      for(let i=0;i<amount;i++){
        const card=list.nth(i);
        await card.locator('summary').first().click();
        await card.locator('.tim-es-reading').waitFor({state:'visible',timeout:10000});
        const body=(await card.locator('.tim-es-reading').innerText()).trim();
        const exerciseButtons=await card.locator('.tim-es-exercises button[data-es-training-id]').count();
        record('Lecture espagnol '+(i+1),body.length>=70,'Texte : '+body.length+' caractères');
        record('Exercices proposés espagnol '+(i+1),exerciseButtons===3,'Boutons : '+exerciseButtons);
        if(i===0)await page.screenshot({path:dir+'/'+device+'-espagnol-lecon.png',fullPage:true,animations:'disabled'});
        await card.locator('button.tim-es-back').click();
        await list.nth(i).waitFor({state:'visible',timeout:5000});
      }
    }
    // Test isolé des 23 leçons BIS de mathématiques, sans session Tim :
    // lecture de données pédagogiques statiques et aucune soumission.
    const mathSetup=await page.evaluate(()=>{
      const pack=window.TIM_MATHS_BIS_PACK?.lessons||[];
      if(!window.TIM_MATH_PATH||!Array.isArray(pack)||pack.length!==23)return {count:pack.length,mounted:false};
      const container=document.getElementById('matieres-content');
      container.replaceChildren();
      const mount=document.createElement('div');container.append(mount);
      window.TIM_MATH_PATH.render(mount,{lessons:pack,exercises:[],back:()=>{}});
      return {count:pack.length,mounted:true};
    });
    record('23 leçons BIS mathématiques disponibles',mathSetup.mounted&&mathSetup.count===23,'Leçons : '+mathSetup.count);
    if(mathSetup.mounted){
      const list=page.locator('#matieres-content .math-lesson-entry[data-math-bis]');
      record('Liste des 23 leçons de mathématiques',await list.count()===23,'Titres : '+await list.count());
      const ids=await list.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-math-bis')));
      for(const [i,id] of ids.entries()){
        await page.locator('#matieres-content .math-lesson-entry[data-math-bis="'+id+'"]').click();
        const article=page.locator('#matieres-content article.math-reading-lesson');
        const sectionCount=await article.locator('.math-reading-section').count();
        const content=(await article.innerText()).trim();
        record('Lecture mathématiques '+(i+1),content.length>=110&&sectionCount>=3,'Texte : '+content.length+' ; sections : '+sectionCount);
        const more=page.locator('#matieres-content details.math-reading-actions');
        record('Exercices mathématiques repliés '+(i+1),await more.count()===1&&!(await more.evaluate(n=>n.open)));
        if(i===0){
          await page.screenshot({path:dir+'/'+device+'-maths-lecon.png',fullPage:true,animations:'disabled'});
          await more.locator('summary').click();
          const help=more.locator('[data-math-help="'+id+'"]');
          await help.click();
          record('Aide mathématiques sans grille de boutons',await page.locator('#matieres-content .spx-quick-links').count()===0);
          // Depuis l'aide, revenir au chapitre, puis à toutes les leçons.
          await page.locator('#matieres-content [data-math-back]').first().click();
        }
        await page.locator('#matieres-content [data-math-back]').first().click();
        const again=page.locator('#matieres-content .math-lesson-entry[data-math-bis]');
        record('Retour liste mathématiques '+(i+1),await again.count()===23);
      }
    }
    if(catalog.lessons.length){
      await page.evaluate(id=>window.openLesson(id),catalog.lessons[0].id);
      const title=page.locator('#lesson-detail.active h2');
      await title.first().waitFor({state:'visible',timeout:10000});
      record('Ouverture d’une leçon',Boolean((await title.first().innerText()).trim()));
    }
    if(catalog.exercises.length){
      const ex=catalog.exercises.find(x=>x.questions>0)||catalog.exercises[0];
      await page.evaluate(id=>window.openExercise(id),ex.id);
      const title=page.locator('#exercise-detail.active h2');
      await title.first().waitFor({state:'visible',timeout:10000});
      record('Ouverture d’un exercice',Boolean((await title.first().innerText()).trim()));
    }
    await page.screenshot({path:dir+'/'+device+'-classeur.png',fullPage:true,animations:'disabled'});
  }catch(e){
    record('Parcours interrompu',false,String(e.message||e).slice(0,450));
    try{await page.screenshot({path:dir+'/'+device+'-erreur.png',fullPage:true});}catch{}
  }
  await context.close();
}
(async()=>{
  const browser=await chromium.launch();
  try{for(const device of ['desktop','mobile'])await run(device,browser);}
  finally{await browser.close();}
  fs.writeFileSync(dir+'/resultats.json',JSON.stringify({url,results,errors},null,2));
  for(const r of results)console.log((r.ok?'OK ':'ERREUR ')+r.device+' / '+r.name+' '+r.detail);
  if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
  else console.log('Parcours navigateur Invit\u00e9 r\u00e9ussi sur ordinateur et mobile, sans modifier les donn\u00e9es.');
})().catch(e=>{console.error(e);process.exitCode=1;});
