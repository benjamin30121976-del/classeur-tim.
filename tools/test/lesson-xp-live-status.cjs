'use strict';
/* Test public en lecture seule : vérifie uniquement la version du barème déployée.
   Aucune connexion à Tim/Parent, aucune note, tentative ou réponse modifiée. */
const assert=require('node:assert/strict');
const url='https://classeur-tim-v16.pages.dev/api/status';
const target='7-5-0-v1';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let last='';
 for(let i=0;i<10;i++){
  try{
   const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(9000)});
   const data=response.ok?await response.json():null;
   last=JSON.stringify({status:response.status,platform:data?.platform,
    ready:data?.available,lessonTrainingXpPolicy:data?.lessonTrainingXpPolicy,mixedChallengesVersion:data?.mixedChallengesVersion});
   if(response.ok&&data?.platform==='cloudflare-pages'&&data?.available===true&&data.lessonTrainingXpPolicy===target&&data.mixedChallengesVersion==='mixed-202611-v1'){
    console.log('PASS : serveur Cloudflare en ligne avec barème '+target+' et défis mélangés version mixed-202611-v1 ; aucune donnée personnelle consultée.');
    return;
   }
  }catch(error){last=String(error?.message||error).slice(0,150);}
  if(i<9)await pause(9000);
 }
 throw Error('Version des XP/défis non confirmée en production : '+last);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
