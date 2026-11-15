'use strict';
/* Test Chromium local et non destructif : les cours EMC existants sont simplement
   présentés sous une autre entrée. Aucune authentification ni requête réseau. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const dir=path.resolve(__dirname,'..');
const pack=fs.readFileSync(path.join(dir,'histoire-geographie-pack.js'),'utf8');
const parcours=fs.readFileSync(path.join(dir,'histoire-geographie-parcours.js'),'utf8');
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
assert.match(app,/name==='EMC'&&window\.TIM_HG_PATH/, 'Routage EMC vers le parcours existant manquant');
assert.match(app,/emcOnly:true/, 'Filtre de matière EMC manquant');
assert.match(app,/exerciseSubject==='EMC'/, 'Exercices EMC non accessibles');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for(const [device,viewport] of [
   ['android',{width:390,height:844}],
   ['bureau',{width:1180,height:850}]
  ]) {
   const page=await browser.newPage({viewport,locale:'fr-FR'});
   await page.route('**/*',route=>route.abort('blockedbyclient'));
   await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font:16px/1.5 Arial;background:#0d1020;color:#f7f8ff;margin:0;padding:12px}button,details{max-width:100%}button{margin:4px;padding:9px;white-space:normal}summary{cursor:pointer}.panel{padding:10px;border:1px solid #637492;border-radius:12px}</style></head><body><main id="root"></main></body></html>');
   await page.addScriptTag({content:pack});
   await page.addScriptTag({content:parcours});
   const stats=await page.evaluate(()=>{
    window.__TIM_PARENT=false;window.__TIM_GUEST=true;
    const root=document.getElementById('root');
    const src=window.TIM_HG_PACK;
    const expectedChapters=src.chapters.filter(ch=>ch.includes('(EMC)'));
    const expectedLessons=src.lessons.filter(c=>expectedChapters.includes(c.chapter));
    const expectedBis=src.bis.filter(c=>expectedChapters.includes(c.group));
    window.TIM_HG_PATH.render(root,{emcOnly:true,back:()=>{}});
    const emc={
     title:root.querySelector('h2')?.textContent,
     chapters:root.querySelectorAll('details.chapter-section').length,
     lessons:root.querySelectorAll('details.tim-es-lesson').length,
     expectedChapters:expectedChapters.length,
     expectedLessons:expectedLessons.length,
     bis:expectedBis.length,
     rawText:root.textContent,
     scrollWidth:document.documentElement.scrollWidth,
     screen:innerWidth
    };
    window.TIM_HG_PATH.render(root,{back:()=>{}});
    emc.originalChapterCount=root.querySelectorAll('details.chapter-section').length;
    emc.originalLessonCount=root.querySelectorAll('details.tim-es-lesson').length;
    window.TIM_HG_PATH.render(root,{emcOnly:true,back:()=>{}});
    return emc;
   });
   assert.match(stats.title,/^EMC/);
   assert.equal(stats.chapters,3,'Trois chapitres EMC attendus');
   assert.equal(stats.lessons,5,'Cinq cours EMC historiques réutilisés');
   assert.equal(stats.bis,3,'Trois leçons BIS EMC conservées');
   assert.equal(stats.chapters,stats.expectedChapters);
   assert.equal(stats.lessons,stats.expectedLessons);
   assert.equal(stats.originalChapterCount,9,'Histoire-géographie original ne doit pas perdre ses chapitres');
   assert.equal(stats.originalLessonCount,25,'Histoire-géographie original ne doit pas perdre ses séances');
   assert(stats.scrollWidth<=stats.screen+2,'Débordement horizontal '+device);
   assert.match(stats.rawText,/Loi Veil/);
   await page.locator('details.chapter-section').first().evaluate(el=>el.open=true);
   await page.locator('details.tim-es-lesson').first().evaluate(el=>el.open=true);
   const tabs=await page.locator('details.tim-es-lesson').first().locator('button').allTextContents();
   for(const text of ['Leçon ENT','Leçon BIS','Je n’ai pas compris','Exercices ENT','Entraînement'])
    assert(tabs.some(t=>t.includes(text)), 'Onglet manquant: '+text);
   await page.locator('details.tim-es-lesson').first().getByRole('button',{name:'Leçon BIS'}).click();
   assert(await page.locator('details.tim-es-lesson').first().getByText('Comprendre la leçon pas à pas').count()>0);
   // Vérifier les vrais rattachements : devoir pour le 9, mais donné en séance du 6.
   const linked=await page.evaluate(()=>{
    const root=document.querySelector('#root');
    const sessions=[...root.querySelectorAll('details.tim-es-lesson')];
    const textFor=date=>{
     const item=sessions.find(x=>x.querySelector('summary')?.textContent.startsWith(date));
     if(!item)return '';
     item.open=true;
     item.querySelector('button[data-tab="ent"]')?.click();
     return item.querySelector('section.panel')?.textContent||'';
    };
    return {
     six:textFor('06/11/2026'),
     nine:textFor('09/11/2026'),
     twelve:textFor('12/11/2026'),
     homeworkIds:window.TIM_HG_PACK.homework.map(x=>x.id)
    };
   });
   assert.match(linked.six,/III.*valeurs et principes de la République/i,'Cours EMC du 6 novembre non rattaché au devoir du 9');
   assert.doesNotMatch(linked.nine,/III.*valeurs et principes de la République/i,'Cours donné le 6 rattaché à tort au 9');
   assert.match(linked.twelve,/institutions de justice/i,'Cours sur les institutions de la séance du 12 non accessible');
   assert.deepEqual(['10099~213498','10099~213669','10099~214592','10099~214770','10099~215099'].filter(x=>linked.homeworkIds.includes(x)).length,5);
   const output=path.join(dir,'browser-results','emc-presentation');
   fs.mkdirSync(output,{recursive:true});
   await page.screenshot({path:path.join(output,'emc-'+device+'.png'),fullPage:true,animations:'disabled'});
   console.log('EMC '+device+' OK : '+JSON.stringify({...stats,rawText:undefined}));
   await page.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
