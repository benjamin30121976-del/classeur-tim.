'use strict';
/* Présentation du bonus HG corrigé dans le vrai openExercise du Chromium existant.
   Questions de préparation locales ; pas de compte Tim, pas de Firestore,
   aucune requête réseau ni aucune validation. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const style=fs.readFileSync(path.join(dir,'assets/homework-bonus-detail.css'),'utf8');
const first=app.indexOf('function openExercise(id,options={}){');
const last=app.indexOf("\ndocument.getElementById('exercise-search')",first);
assert(first>0&&last>first,'Rendu openExercise introuvable');
const source=app.slice(first,last);
const cssStart=html.indexOf('<style>'),cssEnd=html.indexOf('</style>',cssStart);
assert(cssStart>=0&&cssEnd>cssStart,'CSS original introuvable');
const originalCss=html.slice(cssStart+7,cssEnd);
const geom=fs.readFileSync(path.join(dir,'maths-geometry-general.js'),'utf8');
const figures=fs.readFileSync(path.join(dir,'maths-bonus-figures.js'),'utf8');
const pack=JSON.parse(fs.readFileSync(path.join(dir,'packs/bonus-nazisme-cahier-16nov-v2.json'),'utf8'));
const ex=pack.exercises[0];
assert.equal(ex.id,'BD1611_HG02');
assert.equal(ex.questions.length,10);

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [name,viewport] of [
   ['android',{width:390,height:844}],
   ['petit-android',{width:360,height:740}],
   ['ordinateur',{width:1180,height:850}]
  ]){
   const page=await browser.newPage({viewport,locale:'fr-FR'});
   await page.route('**/*',r=>r.abort('blockedbyclient'));
   await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+
    originalCss+'</style><style>'+style+'</style></head><body class="ready">'+
    '<section class="page active" id="exercices"><div id="exercise-index"></div><div class="detail" id="exercise-detail"></div></section>'+
    '<nav class="tabs"><button><span class="nav-icon">⌂</span>Accueil</button>'+
    '<button><span class="nav-icon">▦</span>Matières</button>'+
    '<button class="selected"><span class="nav-icon">✎</span>Exercices</button>'+
    '<button><span class="nav-icon">⌕</span>Outils</button>'+
    '<button><span class="nav-icon">!</span>Erreurs</button></nav></body></html>');
   await page.addScriptTag({content:geom});
   await page.addScriptTag({content:figures});
   await page.evaluate(({source,exercise})=>{
    const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;
     if(text!==undefined)n.textContent=String(text??'');return n;};
    const button=(txt,fn,cls)=>{const el=E('button',cls,txt);el.type='button';el.onclick=fn;return el;};
    window.__TIM_PARENT=false;window.__TIM_GUEST=false;window.__CLOUD_ATTEMPTS=[];
    window.TIM_EXERCISE={mode:()=> 'bonus'};
    const stub={
     document,window,E,button,badge:()=>E('span','badge','3e D'),
     notice:(s,cls)=>E('div','notice '+(cls||''),s),
     page:()=>{},clear:n=>(n.replaceChildren(),n),
     lessonBy:()=>({id:'BD16_HG_CAHIER',title:'Les cinq mots du cahier sur le nazisme'}),
     exerciseBy:()=>exercise,attemptFor:()=>null,
     drafts:()=>({}),makeAttachmentPanel:(kind,id,opts)=>{
      const n=E('section','attachment-panel');n.hidden=!!opts?.hideIfEmpty;
      return n;},
     safe:x=>String(x??''),scrollTop:()=>{},openLesson:()=>{},
     renderMatiere:()=>{},renderExerciseIndex:()=>{},
     v7NewAttempt:()=>{},DRAFT_KEY:'test',
     save:()=>{throw Error('Aucune écriture autorisée')},
     confirm:()=>{throw Error('Aucune validation autorisée')},
     alert:()=>{},exerciseDescription:x=>x.description||'',
     badge:()=>E('span','badge','3e D')
    };
    Function(...Object.keys(stub),source+';return openExercise')(
     ...Object.values(stub))(exercise.id,{skipOpening:true});
   },{source,exercise:ex});
   const result=await page.evaluate(()=>{
    const root=document.getElementById('exercise-detail');
    const q=root.querySelector('.quiz-current');
    const computed=getComputedStyle(q?.querySelector('.qtitle'));
    const option=getComputedStyle(q?.querySelector('.choose span'));
    const xp=root.querySelector('.homework-detail-mode-info');
    const card=root.querySelector('.homework-detail-hero');
    const rects=({elem,viewport})=>elem?.getBoundingClientRect().width<=viewport+2;
    const contrast=(color,bg)=>{
     const components=c=>(c.match(/[\d.]+/g)||[]).slice(0,3).map(v=>{
      const n=Number(v)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;
     });
     const light=c=>{const [r,g,b]=components(c);return r*.2126+g*.7152+b*.0722;};
     const a=light(color),b=light(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    };
    return {
     hasClass:root.classList.contains('homework-bonus-detail'),
     subject:card?.querySelector('.homework-detail-subject')?.textContent,
     topic:card?.querySelector('h2')?.textContent,
     date:card?.querySelector('.homework-detail-date')?.textContent,
     disclaimers:card?.querySelectorAll('.homework-detail-disclaimer')?.length,
     oldIntro:root.querySelectorAll(':scope > .intro, :scope > .note.info').length,
     extraAttached:root.querySelector('.attachment-panel')?.hidden,
     adviceClosed:root.querySelector('.exercise-method-advice')?.open===false,
     adviceTitle:root.querySelector('.exercise-method-advice>summary')?.textContent,
     adviceText:root.querySelector('.exercise-method-advice')?.textContent,
     courseLinks:[...root.querySelectorAll('a,button')].filter(x=>/Cours ENT|Leçon BIS correspondante|Voir la leçon/i.test(x.textContent)).length,
     xpVisible:!!xp&&getComputedStyle(xp).display!=='none',
     xpContrast:contrast(getComputedStyle(xp).color,getComputedStyle(xp).backgroundColor),
     qCount:root.querySelectorAll('.q').length,
     currentCount:root.querySelectorAll('.quiz-current').length,
     figureCount:q?.querySelectorAll('figure svg').length,
     answers:q?.querySelectorAll('.choose').length,
     qFont:parseFloat(computed.fontSize),
     optionFont:parseFloat(option.fontSize),
     optionColor:option.color,
     answerBg:getComputedStyle(q?.querySelector('.choose')).backgroundColor,
     answerText:q?.querySelector('.choose span')?.textContent,
     progress:root.querySelector('.quiz-progress .quiz-row')?.innerText,
     navHeight:document.querySelector('.tabs')?.getBoundingClientRect().height,
     widthValid:document.documentElement.scrollWidth<=window.innerWidth+2,
     questionFits:rects({elem:q,viewport:window.innerWidth}),
     originalDescriptionVisible:root.innerText.includes('ANCIEN TEXTE RÉPÉTÉ'),
     originalInstructionsVisible:root.innerText.includes('L’ENT ne donne pas les énoncés exacts'),
     backAvailable:!!root.querySelector('button.back')&&root.querySelector('button.back').textContent.includes('Retour'),
     oldFooterVisible:root.innerText.includes('Pour les défis, la note et la correction'),
     writing:window.__CLOUD_ATTEMPTS.length
    };
   });
   assert.equal(result.hasClass,true,name+' : classe de présentation absente');
   assert.equal(result.subject,'Histoire-géographie',name+' : matière absente');
   assert.match(result.topic,/cinq idées nazies/i);
   assert.match(result.date,/16\/11/);
   assert.equal(result.disclaimers,1);
   assert.equal(result.oldIntro,0,name+' : anciens paragraphes toujours présents');
   assert.equal(result.extraAttached,true,name+' : rubrique pièces jointes vide non masquée');
   assert.equal(result.adviceClosed,true,name+' : conseils de méthode doivent rester repliés');
   assert.equal(result.adviceTitle,'Conseils pour répondre');
   assert.match(result.adviceText,/brouillon/i);
   assert.match(result.adviceText,/Relis chaque réponse/i);
   assert.equal(result.courseLinks,0,name+' : aucun lien vers les cours dans l’exercice');
   assert.equal(result.xpVisible,true,name+' : barème bonus doit être consultable');
   assert(result.xpContrast>=4.5,name+' : contraste de la règle XP insuffisant : '+result.xpContrast);
   assert.equal(result.qCount,10);
   assert.equal(result.currentCount,1);
   assert.equal(result.figureCount,0);
   assert.equal(result.answers,4);
   assert(result.qFont<=22&&result.qFont>=18,name+' : taille de titre trop grande : '+result.qFont);
   assert(result.optionFont>=15&&result.optionFont<=19,name+' : choix illisible : '+result.optionFont);
   assert.equal(result.widthValid,true,name+' : largeur dépasse le viewport');
   assert.equal(result.questionFits,true,name+' : question déborde');
   assert.equal(result.navHeight,0,name+' : les onglets fixes doivent être masqués pendant le questionnaire');
   assert.equal(result.originalDescriptionVisible,false,name+' : ancien paragraphe répété');
   assert.equal(result.originalInstructionsVisible,false,name+' : consigne repliée devrait être cachée');
   assert.equal(result.backAvailable,true,name+' : bouton Retour obligatoire si la navigation est masquée');
   assert.equal(result.oldFooterVisible,false,name+' : ancien texte répété toujours visible');
   assert.equal(result.writing,0,'Une copie réelle ne doit pas être créée en test');
   const output=path.join(dir,'browser-results','animations-exercices');
   fs.mkdirSync(output,{recursive:true});
   await page.locator('#exercise-detail').screenshot({
    path:path.join(output,'bonus-nazisme-design-'+name+'.png'),
    animations:'disabled'
   });
   // Le menu doit réapparaître lorsqu'on revient à Matières ou à l'accueil.
   await page.evaluate(()=>document.getElementById('exercices').classList.remove('active'));
   const menuBack=await page.locator('.tabs').evaluate(el=>getComputedStyle(el).display);
   assert.notEqual(menuBack,'none',name+' : navigation générale absente après avoir quitté le devoir');
   console.log('OK design bonus HG cahier '+name+' : '+JSON.stringify(result));
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
