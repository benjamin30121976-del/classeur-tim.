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
const mime={'.mp4':'video/mp4','.gif':'image/gif','.js':'text/javascript','.css':'text/css'};
const fixture=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/tim-animations.css"><style>body{background:#15263b;color:#fff;font:16px sans-serif;padding:20px}</style></head><body>
<h1>Contrôle en lecture seule des animations de Tim</h1>
<button id="opening">Ouvrir un exercice neuf</button>
<button id="plus25">Résultat +2,5 XP</button>
<button id="plus3">Résultat +3 XP</button>
<button id="bonus">Résultat bonus +5 XP</button>
<script>window.TIM_SOUND={on:true};window.TIM_EXERCISE={school:()=>false};</script>
<script src="/tim-animations.js"></script>
<script>
document.getElementById('opening').onclick=()=>window.TIM_ANIMATIONS.playOpening();
document.getElementById('plus25').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'training'},{xp:2.5,score:8,total:10,correctionStatus:'released'});
document.getElementById('plus3').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'daily'},{xp:3,score:10,total:10,correctionStatus:'released'});
document.getElementById('bonus').onclick=()=>window.TIM_ANIMATIONS.playResult({kind:'bonus-parent'},{xp:5,score:9,total:10,correctionStatus:'released'});
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
   assert.ok(await page.getByText('+2,5 XP').isVisible(),'Révélation +2,5 XP absente');
   await page.screenshot({path:path.join(output,tag+'-resultat-2-5.png')});
   await page.getByText('Voir ma correction').click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   await page.locator('#plus3').click();
   await page.locator('.tim-anim-overlay video').waitFor();
   assert.ok(await page.getByText('Voir ma correction').isVisible(),'Bouton correction absent');
   await page.getByText('Voir ma correction').click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   await page.locator('#bonus').click();
   await page.getByText('+5 XP').waitFor();
   await page.screenshot({path:path.join(output,tag+'-bonus-5.png')});
   await page.getByText('Voir ma correction').click();
   await page.locator('.tim-anim-overlay').waitFor({state:'detached'});
   console.log('OK - Chromium '+tag+' : ouverture MP4, bouton Passer, GIF +2,5, XP et retour correction.');
   await context.close();
  }
  assert.deepEqual(errors,[],'Erreurs JavaScript du navigateur');
 } finally {await browser.close();}
})().then(close).catch(async error=>{console.error(error);await close();process.exitCode=1;});
