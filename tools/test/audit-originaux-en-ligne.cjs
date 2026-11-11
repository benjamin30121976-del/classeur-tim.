'use strict';
const {chromium}=require('playwright');
const crypto=require('node:crypto');
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
 const base='https://classeur-tim-v16.pages.dev/';
 const assets=[
 ['Défi du jour','assets/animations/Tim_Defi_Du_Jour_Valide.gif',358,356,'b9e2e539dc10c9660ef72492b48af09c1b01494d'],
 ['Jauge XP','assets/barre-xp-original.png',2172,724,'03699c1e938b1dc7f709412ff04859e2dc148ef2']
 ];
 let checks=[];
 try {
   const home=await p.goto(base,{waitUntil:'domcontentloaded',timeout:35000});
   console.log('HOME_HTTP',home?.status());
   for(const [name,path,width,height,sha] of assets){
    const result=await p.evaluate(async ({url})=>{
      const img=new Image();
      img.src=url;
      try{await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),10000))]);return {loaded:true,width:img.naturalWidth,height:img.naturalHeight};}
      catch(e){return {loaded:false,error:String(e).slice(0,160)};}
    },{url:base+path+'?audit=20261111'});
    const response=await p.request.get(base+path+'?auditbytes=20261111',{timeout:12000}).catch(e=>null);
    const data=response?.ok()?await response.body():null;
    const found=data?crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+data.length+'\\0'),data])).digest('hex'):null;
    const x={name,path,...result,http:response?.status()??null,exactOriginal:found===sha,digest:found,expected:sha,dimensionOK:result.width===width&&result.height===height};
    checks.push(x);console.log('FICHIER',JSON.stringify(x));
   }
   const js=(await p.request.get(base+'tim-animations.js?audit=20261111')).ok()?await (await p.request.get(base+'tim-animations.js?audit=20261111')).text():'';
   const app=(await p.request.get(base+'app.js?audit=20261111')).ok()?await (await p.request.get(base+'app.js?audit=20261111')).text():'';
   console.log('REFERENCES',JSON.stringify({daily:js.includes("daily:'Tim_Defi_Du_Jour_Valide.gif'"),sundayMP4:js.includes("sunday:'Tim_Defi_Du_Dimanche_20XP_Original.mp4'"),xpBar:app.includes("picture.src='./assets/barre-xp-original.png'"),wolf:app.includes("setCardImage?.(wolf,'daily'")}));
 }finally{await b.close();}
 if(checks.some(x=>!x.loaded||!x.dimensionOK||!x.exactOriginal))process.exitCode=1;
})().catch(e=>{console.error('AUDIT_ERROR',e.message);process.exitCode=1;});
