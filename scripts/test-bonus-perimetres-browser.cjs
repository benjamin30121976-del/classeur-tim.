'use strict';
/* Contrôle Chromium du formulaire et du corrigé de remédiation.
   Fixt. locale, aucun compte Tim/Parent, aucune connexion Firebase ni écriture. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'browser-results','animations-exercices');
fs.mkdirSync(out,{recursive:true});
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const start=app.search(/function openExercise\(id(?:,options=\{\})?\)\{/);
const end=app.indexOf("\ndocument.getElementById('exercise-search')",start);
assert(start>=0&&end>start,'Fonction de correction introuvable');
const code=app.slice(start,end);
(async()=>{
 const {BONUS_PERIMETRE_TIM:ex}=await import('../functions/bonus-perimetres-tim-20261114.mjs');
 const {grade}=await import('../functions/grading.mjs');
 const answers=ex.questions.map((q,i)=>{
  if(i<5)return String(q.right);
  const wrong=q.type==='mc'?String((q.right+1)%4):'réponse incorrecte';
  return q.reasoningCheck?.kind==='rectangle-perimeter-v1'?
   wrong+' ||| '+JSON.stringify({calculation:'Je n ai pas su écrire une opération.',conclusion:'Je n ai pas su conclure correctement.'}):wrong;
 });
 const corrected=grade(ex,{questions:ex.questions.map(q=>({right:q.right,also:q.also||[],why:q.why}))},answers);
 assert.equal(corrected.score,5);
 const saved={id:ex.id,date:'2026-11-14T09:00:00Z',score:corrected.score,total:corrected.total,xp:2.5,
  correctionStatus:'released',correctionLocked:false,needsReview:false,answers:corrected.answers};
 const browser=await chromium.launch({headless:true});
 try{
  for(const [name,viewport] of [['telephone',{width:390,height:844}],['ordinateur',{width:1365,height:900}]]){
   const page=await browser.newPage({viewport,locale:'fr-FR'});
   page.on('request',req=>{if(!/^data:|^about:/.test(req.url()))throw Error('Réseau interdit : '+req.url());});
   await page.setContent('<!doctype html><html lang="fr"><meta charset="utf-8"><style>body{font:16px Arial;line-height:1.5;padding:16px}.panel,.q,.feedback{margin:12px 0;padding:12px;border:1px solid #ccd}.hide{display:none}.q:not(.active){display:none}</style><main id="exercise-index"></main><section id="exercise-detail"></section></html>');
   const open=async old=>{
    await page.evaluate(({source,ex,old})=>{
     const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text??'');return n;};
     const button=(label,fn,cls)=>{const n=E('button',cls,label);n.onclick=fn;return n;};
     const DATA={lessons:[],exercises:[ex]};
     window.__TIM_PARENT=false;window.__TIM_GUEST=false;
     window.__CLOUD_ATTEMPTS=old?[old]:[];
     window.__TIM_BRIDGE={submit:async()=>{throw Error('Écriture interdite dans ce test');},refresh:async()=>{throw Error('Lecture privée interdite dans ce test');}};
     window.TIM_EXERCISE={school:()=>false};
     const services={DATA,document,window,E,button,badge:()=>E('span','badge','Mathématiques'),notice:s=>E('div','note',s),
      safe:v=>String(v??''),page:()=>{},clear:n=>(n.replaceChildren(),n),
      lessonBy:id=>DATA.lessons.find(x=>x.id===id),
      exerciseBy:id=>DATA.exercises.find(x=>x.id===id),
      attemptFor:id=>window.__CLOUD_ATTEMPTS.find(x=>x.id===id),
      drafts:()=>({}),makeAttachmentPanel:()=>E('div','attachments',''),
      v7Feedback:()=>E('div','reaction',''),scrollTop:()=>{},openLesson:()=>{throw Error('Aucune leçon correspondante');},
      renderExerciseIndex:()=>{},v7NewAttempt:()=>{},DRAFT_KEY:'test-local',save:()=>{},
      confirm:()=>false,alert:()=>{},exerciseDescription:item=>item.description};
     const fn=Function(...Object.keys(services),source+';return openExercise')(...Object.values(services));
     fn(ex.id,{skipOpening:true});
    },{source:code,ex,old});
   };
   await open(null);
   const before=await page.locator('#exercise-detail').innerText();
   assert(!/Leçon associée|Voir la leçon correspondante|Revoir cette leçon|Je n.ai pas compris|Indice :/i.test(before),'Aide ou lien présent avant validation');
   assert.equal(await page.locator('#exercise-detail .q').count(),10,'Les 10 questions doivent exister');
   assert.equal(await page.locator('#exercise-detail textarea').count(),4,'Deux questions avec calcul et conclusion distincts requis');
   await page.screenshot({path:path.join(out,'bonus-perimetres-'+name+'-avant.png'),fullPage:true});
   await open(saved);
   const after=await page.locator('#exercise-detail').innerText();
   assert(after.includes('Ta note : 5/10'),'Note de l\'essai absente');
   assert(after.includes('2.5 XP')||after.includes('2,5 XP'),'XP non visibles');
   assert.equal(await page.locator('#exercise-detail .feedback').count(),5,'Corriger seulement les 5 erreurs');
   assert(after.includes('Réponse attendue :'),'Réponse attendue absente');
   assert(after.includes('Explication :'),'Raisonnement détaillé absent');
   assert(after.includes('Calcul écrit :'),'Calcul de Tim non visible dans la correction');
   assert(after.includes('Phrase-réponse écrite :'),'Conclusion de Tim non visible dans la correction');
   assert(!after.includes('Revoir la leçon :'),'Lien fictif présent dans la correction');
   assert.equal(await page.getByText('Valider définitivement cet exercice').count(),0,'Tentative rejouable');
   await page.screenshot({path:path.join(out,'bonus-perimetres-'+name+'-corrige.png'),fullPage:true});
   console.log('OK Chromium '+name+' : 10 questions, aucune aide avant, correction de 5 erreurs, XP, aucun lien fictif ni revalidation.');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
