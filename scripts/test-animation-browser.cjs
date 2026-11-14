'use strict';
// Contrôle Chromium/Playwright local du lecteur réel et de ses médias.
// Aucun compte Firebase/Firestore et aucune tentative de Tim.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'browser-results','animations-exercices');
fs.mkdirSync(output,{recursive:true});
const errors=[];
const mime={'.mp4':'video/mp4','.gif':'image/gif','.webp':'image/webp','.js':'text/javascript','.css':'text/css'};
const fixture=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/tim-animations.css"><style>body{background:#15263b;color:#fff;font:16px sans-serif;padding:20px}</style></head><body>
<h1>Contrôle en lecture seule des animations de Tim</h1>
<button id="opening">Ouvrir un exercice neuf</button>
<button id="plus25">Résultat +2,5 XP</button>
<button id="plus3">Résultat +3 XP</button>
<button id="bonus">Résultat bonus Parent +5 XP</button>
<button id="bonus-day">Résultat bonus du jour +5 XP</button>
<button id="weekly">Résultat samedi +10 XP</button>
<button id="weekly-partial">Résultat samedi +7 XP</button>
<button id="sunday-partial">Résultat dimanche +14 XP</button>
<button id="sunday-low">Résultat dimanche +8 XP</button>
<button id="sunday-minus">Résultat dimanche −2 XP</button>
<button id="weekly-minus">Résultat samedi −1 XP</button>
<button id="bonus-zero">Résultat bonus 0 XP</button>
<script>window.TIM_SOUND={on:true};window.TIM_EXERCISE={school:()=>false};</script>
<script src="/tim-animations.js"></script>
<script>
document.getElementById('opening').onclick=()=>window.TIM_ANIMATIONS.playOpening();
document.getElementById('plus25').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'training'},{xp:2.5,score:8,total:10,correctionStatus:'released'});
document.getElementById('plus3').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'daily'},{xp:3,score:10,total:10,correctionStatus:'released'});
document.getElementById('bonus').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'bonus-parent'},{xp:5,score:9,total:10,correctionStatus:'released'});
document.getElementById('bonus-day').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'bonus-day'},{xp:5,score:7,total:10,correctionStatus:'released'});
document.getElementById('weekly').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'weekly'},{xp:10,score:17,total:20,correctionStatus:'released'});
document.getElementById('weekly-partial').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'weekly'},{xp:7,score:15,total:20,correctionStatus:'released'});
document.getElementById('sunday-partial').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'sunday'},{xp:14,score:15,total:20,correctionStatus:'released'});
document.getElementById('sunday-low').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'sunday'},{xp:8,score:12,total:20,correctionStatus:'released'});
document.getElementById('sunday-minus').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'sunday'},{xp:-2,score:7,total:20,correctionStatus:'released'});
document.getElementById('weekly-minus').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'weekly'},{xp:-1,score:7,total:20,correctionStatus:'released'});
document.getElementById('bonus-zero').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'bonus-day'},{xp:0,score:4,total:10,correctionStatus:'released'});
</script></body></html>`;
const server=http.createServer((req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/controle'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(fixture);return;}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Absent');return;}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
 } catch(error){res.writeHead(500);res.end(String(error));}
});
const listen=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const close=()=>new Promise(resolve=>server.close(resolve));
(async()=>{
 await listen();const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try {
  for(const mobile of [true,false]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},
    isMobile:mobile,hasTouch:mobile,locale:'fr-FR'});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push((mobile?'mobile':'bureau')+': '+e.message));
   const tag=mobile?'android':'bureau';
   await page.goto(base+'/controle',{waitUntil:'load'});
   await page.locator('#opening').click();
   await page.locator('.tim-anim-overlay video').waitFor();
   await page.waitForFunction(()=>{const v=document.querySelector('.tim-anim-overlay video');return !!v&&v.readyState>=2;},{timeout:12000});
   const opened=await page.locator('.tim-anim-overlay video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,paused:v.paused}));
   assert.ok(opened.width>=300&&opened.height>=400,'Vidéo ouverture non décodée');
   assert.ok(opened.duration>2&&opened.duration<6,'Durée ouverture inattendue');
   assert.ok(await page.getByText('Passer l’animation').isVisible(),'Bouton Passer absent');
   await page.screenshot({path:path.join(output,tag+'-ouverture.png')});
   await page.getByText('Passer l’animation').click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   await page.locator('#plus25').click();
   await page.locator('.tim-anim-overlay img').waitFor();
   const img=page.locator('.tim-anim-overlay img');
   await page.waitForFunction(()=>{const i=document.querySelector('.tim-anim-overlay img');return i&&i.complete&&i.naturalWidth>0;},{timeout:12000});
   await page.screenshot({path:path.join(output,tag+'-loup-2-5.png')});
   // Le GIF a sa durée programmée ; pas de nouvel essai soumis.
   await page.locator('.tim-anim-award:not([hidden])').waitFor({timeout:9500});
   assert.ok(await page.locator('.tim-anim-award-value').getByText('+2,5 XP',{exact:true}).isVisible(),'Révélation +2,5 XP absente');
   await page.screenshot({path:path.join(output,tag+'-resultat-2-5.png')});
   await page.getByText('Voir ma correction').click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   await page.locator('#plus3').click();
   await page.locator('.tim-anim-overlay video').waitFor();
   assert.ok(await page.getByText('Voir ma correction').isVisible(),'Bouton correction absent');
   await page.getByText('Voir ma correction').click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   for(const [id,clip,xp,note] of [
    ['bonus','Tim_Defi_Bonus_5XP.gif','+5 XP','Note : 9 / 10'],
    ['bonus-day','Tim_Defi_Bonus_5XP.gif','+5 XP','Note : 7 / 10'],
    ['weekly','Tim_Defi_Du_Samedi_10XP.gif','+10 XP','Note : 17 / 20']
   ]){
    await page.locator('#'+id).click();
    const gif=page.locator('.tim-anim-overlay img.tim-anim-media');
    await gif.waitFor({timeout:5000});
    assert.ok((await gif.getAttribute('src')).endsWith(clip),'GIF erroné '+id);
    await page.waitForFunction(()=>{
      const i=document.querySelector('.tim-anim-overlay img.tim-anim-media');
      return i&&i.complete&&i.naturalWidth>0;
    },null,{timeout:12000});
    assert.equal(await page.locator('.tim-anim-award:not([hidden])').count(),0,
     'Montant affiché avant le GIF '+id);
    await page.screenshot({path:path.join(output,tag+'-'+id+'-gif.png')});
    // Fin de l'animation simulée, sans modifier les données scolaires.
    await gif.evaluate(e=>e.dispatchEvent(new Event('error')));
    await page.locator('.tim-anim-award:not([hidden])').waitFor({timeout:5000});
    assert.equal(await page.locator('.tim-anim-award-value').innerText(),xp);
    assert.equal(await page.locator('.tim-anim-award-grade').innerText(),note);
    await page.screenshot({path:path.join(output,tag+'-'+id+'-resultat.png')});
    await page.getByRole('button',{name:'Voir ma correction'}).click();
    await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   }
   // Toutes les situations intermédiaires ont une véritable animation du loup,
   // sans afficher le nombre d'XP d'une autre récompense.
   for(const [id,clip,xp,note] of [
    ['weekly-partial','loup-weekly-anime.webp','+7 XP','Note : 15 / 20'],
    ['sunday-partial','loup-sunday-anime.webp','+14 XP','Note : 15 / 20'],
    ['sunday-low','loup-sunday-anime.webp','+8 XP','Note : 12 / 20'],
    ['sunday-minus','loup-defi-original.webp','-2 XP','Note : 7 / 20'],
    ['weekly-minus','Tim_Animation_Minus1XP_Tete_Penaude.gif','-1 XP','Note : 7 / 20'],
    ['bonus-zero','Tim_Animation_0XP_Toc_Toc_Paume.mp4','0 XP','Note : 4 / 10']
   ]){
    await page.locator('#'+id).click();
    const clipNode=page.locator('.tim-anim-overlay .tim-anim-media');
    assert.equal(await clipNode.count(),1,'Animation manquante '+id);
    assert.ok((await clipNode.getAttribute('src')).endsWith(clip),'Animation trompeuse '+id);
    if(await clipNode.evaluate(el=>el.tagName)==='VIDEO'){
     await page.waitForFunction(()=>{
      const v=document.querySelector('.tim-anim-overlay video');return v&&v.readyState>=2;
     },null,{timeout:12000});
     await clipNode.evaluate(el=>el.dispatchEvent(new Event('ended')));
    }else{
     await page.waitForFunction(()=>{
      const i=document.querySelector('.tim-anim-overlay img');return i&&i.complete&&i.naturalWidth>0;
     },null,{timeout:12000});
     await page.screenshot({path:path.join(output,tag+'-'+id+'-animation.png')});
     await clipNode.evaluate(el=>el.dispatchEvent(new Event('error')));
    }
    const revealed=page.locator('.tim-anim-award:not([hidden])');
    await revealed.waitFor({timeout:6000});
    assert.equal(await revealed.locator('.tim-anim-award-value').innerText(),xp);
    assert.equal(await revealed.locator('.tim-anim-award-grade').innerText(),note);
    await page.getByRole('button',{name:'Voir ma correction'}).click();
    await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   }
   console.log('OK - Chromium '+tag+' : bonus +5, samedi +10 et tous les gains intermédiaires sont animés et exacts.');
   await context.close();
  }
  // Le réglage Android "réduire les animations" ne doit pas cacher la note et les XP.
  const reduced=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',locale:'fr-FR'});
  const accessible=await reduced.newPage();
  await accessible.goto(base+'/controle',{waitUntil:'load'});
  await accessible.locator('#plus25').click();
  assert.equal(await accessible.locator('.tim-anim-overlay video,.tim-anim-overlay img').count(),0,
    'Vidéo indésirable quand les animations sont réduites');
  assert.ok(await accessible.locator('.tim-anim-award-value').getByText('+2,5 XP',{exact:true}).isVisible(),
    'Résultat XP masqué par le réglage Android');
  await accessible.screenshot({path:path.join(output,'android-mouvement-reduit-note-xp.png')});
  await accessible.getByRole('button',{name:'Voir ma correction'}).click();
  await accessible.locator('.tim-anim-overlay').waitFor({state:'detached'});
  await accessible.locator('#weekly').click();
  assert.equal(await accessible.locator('.tim-anim-overlay video,.tim-anim-overlay img').count(),0,
    'GIF indésirable en mode mouvement réduit');
  assert.equal(await accessible.locator('.tim-anim-award-value').innerText(),'+10 XP');
  await accessible.getByRole('button',{name:'Voir ma correction'}).click();
  await reduced.close();
  console.log('OK - Chromium Android mouvement réduit : note et XP visibles sans animation.');
  assert.deepEqual(errors,[],'Erreurs JavaScript du navigateur');
 } finally {await browser.close();}
})().then(close).catch(async error=>{console.error(error);await close();process.exitCode=1;});
