/* Test du bouton "Passer l'animation" dans le vrai site, sans TinyFish. */
const {chromium}=require('playwright');
const path=require('path');
const fs=require('fs');
const assert=require('assert').strict;
const output=path.join(process.cwd(),'test-intro-results');
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const [device,width,height] of [['mobile',390,844],['ordinateur',1200,820]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));
   await page.goto('http://127.0.0.1:8778/',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#guest-enter').click();
   await page.waitForFunction(()=>document.body.classList.contains('guest-mode'),{timeout:20000});
   await page.locator('#intro-screen').waitFor({state:'visible',timeout:20000});
   const intro=page.locator('#intro-screen');
   const skip=page.locator('#intro-skip');
   assert.equal(await skip.isVisible(),true,device+': skip button invisible');
   assert.equal((await skip.innerText()).includes('Passer l’animation'),true);
   const bb=await skip.boundingBox();
   assert(bb,device+': skip button has no bounding box');
   assert(bb.x+bb.width>width*.62&&bb.x+bb.width<=width+1,device+': skip not top-right');
   assert(bb.y<90,device+': skip not at top');
   assert(await page.locator('#intro-play').isVisible(),device+': sound option missing');
   assert(await page.locator('#intro-silent').isVisible(),device+': silent option missing');
   await page.screenshot({path:path.join(output,device+'-choix-son-et-passer.png')});

   // Passage sans même choisir le son : fermeture immédiate et accueil visible.
   const initialOn=await page.evaluate(()=>window.TIM_SOUND?.on);
   await skip.click();
   await page.waitForFunction(()=>{
    const intro=document.getElementById('intro-screen');
    return intro.hidden&&document.getElementById('home').classList.contains('active')&&!document.body.classList.contains('intro-open');
   },{timeout:2500});
   assert.equal(await page.evaluate(()=>window.TIM_SOUND?.on),initialOn,device+': skip altered saved sound preference');
   assert.equal(await page.locator('#intro-music').evaluate(a=>a.paused),true,device+': music not stopped by skip');
   await page.screenshot({path:path.join(output,device+'-accueil-direct.png')});

   // Lorsque la musique et le GIF sont lancés, le raccourci reste cliquable.
   await page.evaluate(()=>window.TIM_INTRO_SHOW());
   assert.equal(await intro.isVisible(),true);
   await page.locator('#intro-play').click();
   assert.equal(await page.locator('#intro-gate').isHidden(),true,device+': intro failed to start with sound');
   assert((await page.locator('#intro-animation').getAttribute('src')).includes('loup-intro.gif'),device+': animation not started');
   assert.equal(await skip.isVisible(),true,device+': skip disappeared while playing');
   await skip.click();
   await page.waitForFunction(()=>document.getElementById('intro-screen').hidden,{timeout:2500});
   assert.equal(await page.locator('#intro-music').evaluate(a=>a.paused),true,device+': MP3 still playing');
   assert.equal(await page.evaluate(()=>window.TIM_SOUND?.on),true,device+': skip should not mute app after sound selection');

   // Même possibilité pendant l'animation silencieuse.
   await page.evaluate(()=>window.TIM_INTRO_SHOW());
   await page.locator('#intro-silent').click();
   assert.equal(await page.locator('#intro-gate').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.TIM_SOUND?.on),false,device+': silent option not respected');
   await skip.click();
   await page.waitForFunction(()=>document.getElementById('intro-screen').hidden,{timeout:2500});
   assert.equal(await page.evaluate(()=>window.TIM_SOUND?.on),false,device+': skip altered mute setting');

   // La fermeture automatique de fin d'animation reste active.
   if(device==='ordinateur'){
     await page.evaluate(()=>window.TIM_INTRO_SHOW());
     await page.locator('#intro-silent').click();
     await page.waitForFunction(()=>document.getElementById('intro-screen').hidden,{timeout:9000});
     assert.equal(await page.locator('#home.active').isVisible(),true);
   }
   assert.deepEqual(jsErrors,[],device+': unexpected Javascript error(s)');
   console.log('OK '+device+' : son, sans son, passer avant et pendant, accueil direct, musique arrêtée.');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
