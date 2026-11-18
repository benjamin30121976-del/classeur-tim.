'use strict';
/* Import ciblé d'un seul exercice Bonus devoirs de physique depuis le compte Parent.
   Aucun UPDATE/DELETE, aucune écriture de copies, notes, XP ou tentatives Tim.
   Branche de préparation uniquement ; ne modifie pas main. */
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const URL=process.env.TIM_SITE_URL||'https://classeur-tim-v16.pages.dev/';
const EMAIL=process.env.TIM_PARENT_EMAIL,PASSWORD=process.env.TIM_PARENT_PASSWORD;
(async()=>{
 assert.equal(process.env.TIM_PHYSIQUE_BONUS_PUBLISH,'OUI','Publication non autorisée.');
 assert(EMAIL&&PASSWORD,'Accès Parent non configuré ; aucune écriture.');
 const pack=JSON.parse(readFileSync(path.join(__dirname,'../packs/bonus-physique-atome-az-18nov-2026.json'),'utf8'));
 assert.equal(pack.lessons?.length,0);
 assert.equal(pack.exercises?.length,1);
 const ex=pack.exercises[0];
 assert.equal(ex.id,'BD1811_PC02');
 assert.equal(ex.subject,'Physique-chimie');
 assert.equal(ex.lesson,'PC_BIS01');
 assert.equal(ex.homeworkBonus,true);
 assert.equal(ex.category,'bonus');
 assert.equal(ex.questions?.length,10);
 assert(ex.questions.every(q=>q.q?.trim()&&q.why?.trim()&&q.right!==undefined));
 const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'});
  await page.goto(URL+'?bonus-atome-1811',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#parent-enter').click();
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('#login-button').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&typeof window.__TIM_BRIDGE?.publish==='function',null,{timeout:60000});
  const lessonOk=await page.evaluate(()=>window.__TIM_DATA?.lessons?.some(x=>x.id==='PC_BIS01')===true);
  assert(lessonOk,'Leçon PC_BIS01 absente du compte Parent ; aucun import.');
  const current=await page.evaluate(async id=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,getDoc,doc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const snap=await getDoc(doc(getFirestore(getApp()),'exercises',id));
   return snap.exists()?(snap.data().payloadJson?JSON.parse(snap.data().payloadJson):snap.data()):null;
  },ex.id);
  if(current){
   for(const key of Object.keys(ex))assert.deepEqual(current[key],ex[key],'Conflit avec un exercice existant : '+key);
   console.log('Exercice déjà présent, contenu identique. Aucun écrasement.');
  } else {
   const count=await page.evaluate(async exercise=>window.__TIM_BRIDGE.publish({lessons:[],exercises:[exercise]}),ex);
   assert.equal(count,1,'Un seul bonus devait être ajouté.');
   console.log('Import Parent exécuté : un exercice créé, sans autre écriture.');
  }
  const verified=await page.evaluate(async id=>{
   const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
   const {getFirestore,getDoc,doc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
   const snap=await getDoc(doc(getFirestore(getApp()),'exercises',id));
   if(!snap.exists())return null;
   const data=snap.data().payloadJson?JSON.parse(snap.data().payloadJson):snap.data();
   return {id:data.id,homeworkBonus:data.homeworkBonus,subject:data.subject,questions:data.questions?.length,category:data.category};
  },ex.id);
  assert.deepEqual(verified,{id:'BD1811_PC02',homeworkBonus:true,subject:'Physique-chimie',questions:10,category:'bonus'});
  // Deux véritables dessins PNG, liés uniquement à ce bonus.
  // Les fichiers déjà présents ne sont jamais supprimés ni remplacés.
  const images=await page.evaluate(async exerciseId=>{
   const api=window.__TIM_BRIDGE?.attachments;
   if(!api?.upload||!api?.list||!api?.read)throw Error('Gestion privée des dessins indisponible');
   const definitions=[
    {name:'tim-atome-noyau-schema.png',title:'Schéma 1 — Atome et noyau : protons, neutrons, électrons',type:'atom'},
    {name:'tim-ecriture-A-Z-schema.png',title:'Schéma 2 — Écriture symbolique : A, Z et symbole X',type:'notation'}
   ];
   const makePng=async type=>{
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=640;
    const c=canvas.getContext('2d');
    const txt=(s,x,y,size=30,color='#203047',weight=500,align='left')=>{
     c.font=weight+' '+size+'px sans-serif';c.textAlign=align;c.fillStyle=color;c.fillText(s,x,y);
    };
    const disk=(x,y,r,fill,stroke='#fff',lineWidth=3)=>{
     c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=lineWidth;c.stroke();
    };
    const line=(x,y,X,Y,color='#566d82',width=3)=>{
     c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=width;c.stroke();
    };
    c.fillStyle='#f8fbff';c.fillRect(0,0,960,640);
    c.strokeStyle='#a8bed4';c.lineWidth=4;c.strokeRect(12,12,936,616);
    if(type==='atom'){
     txt('STRUCTURE SIMPLIFIÉE D’UN ATOME',480,67,38,'#173b5b',750,'center');
     // Représentation pédagogique, sans prétendre décrire une orbite réelle.
     c.beginPath();c.ellipse(460,329,302,204,0,0,Math.PI*2);c.strokeStyle='#9bbbd1';c.lineWidth=5;c.stroke();
     disk(460,329,127,'#f2f6fb','#577ba0',5);
     const particles=[[399,283,'p+','#c55353'],[460,277,'n0','#427db3'],[523,289,'p+','#c55353'],
                      [398,354,'n0','#427db3'],[462,346,'p+','#c55353'],[525,351,'n0','#427db3'],[459,412,'n0','#427db3']];
     particles.forEach(([x,y,label,color])=>{disk(x,y,36,color);txt(label,x,y+10,24,'#fff',750,'center');});
     [[160,329],[610,185],[755,329]].forEach(([x,y])=>{disk(x,y,29,'#dc983d');txt('e−',x,y+9,24,'#fff',750,'center');});
     txt('Électrons (−)',75,484,28,'#9d601b',750);
     line(225,463,163,359,'#b78035',3);
     txt('Noyau',690,460,30,'#203c58',750);
     line(693,443,572,390,'#547c99',3);
     txt('p+ : proton (+)',60,543,25,'#b43d3d',700);
     txt('n0 : neutron (neutre)',335,543,25,'#346e9e',700);
     txt('e− : électron (−)',680,543,25,'#9d601b',700);
    }else{
     txt('LIRE LES DEUX NOMBRES D’UN ATOME',480,67,38,'#173b5b',750,'center');
     txt('A',260,235,85,'#be5050',750,'center');
     txt('Z',260,392,85,'#366f9c',750,'center');
     txt('X',385,332,168,'#203d5e',750,'center');
     line(324,199,540,199,'#be5050',5);
     line(324,360,540,360,'#366f9c',5);
     txt('A = nombre de nucléons',550,206,30,'#b33f3f',750);
     txt('protons + neutrons',550,244,26,'#394b60',550);
     txt('Z = nombre de protons',550,367,30,'#2b678f',750);
     txt('X = symbole chimique',480,445,27,'#3b526d',650,'center');
     txt('Nombre de neutrons : N = A − Z',480,515,32,'#1a527b',750,'center');
    }
    txt('Schéma pédagogique non à l’échelle · Physique-chimie 3e',480,603,20,'#61758a',500,'center');
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob||blob.size<1000)throw Error('Dessin PNG non généré');
    return blob;
   };
   const before=await api.list('exercise',exerciseId);
   const result=[];
   for(const spec of definitions){
    const prior=before.filter(x=>x.fileName===spec.name);
    if(prior.length>1)throw Error('Schéma dupliqué : '+spec.name);
    if(prior.length===0){
     const blob=await makePng(spec.type);
     const file=new File([blob],spec.name,{type:'image/png'});
     await api.upload('exercise',exerciseId,file,spec.title);
     result.push({name:spec.name,action:'ajouté',size:file.size});
    } else result.push({name:spec.name,action:'existant',size:prior[0].size});
   }
   const after=await api.list('exercise',exerciseId);
   for(const spec of definitions){
    const meta=after.find(x=>x.fileName===spec.name);
    if(!meta||meta.mime!=='image/png')throw Error('Schéma non visible dans la liste privée : '+spec.name);
    const imageBlob=await api.read(meta);
    if(imageBlob.type!=='image/png'||imageBlob.size<1000)throw Error('Schéma illisible : '+spec.name);
   }
   return result;
  },ex.id);
  assert.equal(images.length,2);
  console.log('DESSINS PUBLIÉS ET RELUS DANS LE CLASSEUR : '+JSON.stringify(images));
  await page.reload({waitUntil:'domcontentloaded'});
  // Le classeur exige de choisir à nouveau Parent après chaque rechargement,
  // même si Firebase conserve la session. Ne pas saisir de mot de passe Tim.
  await page.locator('#parent-enter').click();
  await page.waitForFunction(()=>document.body.classList.contains('ready')&&window.__TIM_PARENT===true&&window.__TIM_DATA?.exercises?.some(x=>x.id==='BD1811_PC02'),null,{timeout:60000});
  const shown=await page.evaluate(()=>window.__TIM_DATA.exercises.some(x=>x.id==='BD1811_PC02'&&x.homeworkBonus===true&&x.questions?.length===10));
  assert(shown,'Le bonus n apparaît pas dans le catalogue rechargé Parent.');
  console.log('PUBLIÉ ET VÉRIFIÉ : Bonus devoirs / Physique-chimie / Atome et noyau, 10 questions, dans le catalogue Parent rechargé.');
  console.log('Aucune copie, note, XP ou tentative de Tim modifiée.');
 } finally {await browser.close();}
})().catch(e=>{console.error('PUBLICATION NON CONFIRMÉE : '+String(e?.message||e).slice(0,500));process.exitCode=1;});
