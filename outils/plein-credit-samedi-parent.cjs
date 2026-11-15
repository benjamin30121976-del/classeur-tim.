'use strict';
/* Séance Chromium Parent existante. Audit en PR exclusivement lecture seule ;
   après fusion, le service Parent transactionnel archive la copie et ne
   modifie que le score des deux réponses et les XP correspondants. */
const assert=require('node:assert/strict');
const ID='WEEK_2026W46',VERSION='samedi-20261114-parent-20261115-v2';
async function readCopy(page){
 return page.evaluate(()=>{
  if(window.__TIM_PARENT!==true)throw Error('Accès Parent authentifié obligatoire');
  const x=(window.__CLOUD_ATTEMPTS||[]).find(a=>a.id==='WEEK_2026W46');
  if(!x)return null;
  return {id:x.id,score:x.score,total:x.total,xp:x.xp,
   answers:Array.isArray(x.answers)?x.answers:[]};
 });
}
async function serverReview(page,mode,approval){
 return page.evaluate(async({mode,approval})=>{
  const {getAuth}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js');
  const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
  const current=getAuth(getApp()).currentUser;
  if(!current)throw Error('Session Parent indisponible');
  const token=await current.getIdToken();
  const resp=await fetch('/api/tim',{method:'POST',cache:'no-store',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
   body:JSON.stringify({action:'correctSaturdayFullCredit',payload:{
    mode,...(approval?{approval}:{})
   }})});
  const body=await resp.json().catch(()=>({}));
  return {http:resp.status,status:body?.data?.status||null,
   data:body?.data||null,error:body?.error||null};
 },{mode,approval});
}
async function readCurrentFromFirestore(page){
 return page.evaluate(async()=>{
  const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
  const {getFirestore,doc,getDoc}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js');
  const db=getFirestore(getApp());
  const [a,b]=await Promise.all([
   getDoc(doc(db,'privateAttempts','WEEK_2026W46')),
   getDoc(doc(db,'attempts','WEEK_2026W46'))
  ]);
  const privateDoc=a.data(),attempt=b.data();
  return privateDoc&&attempt?{
   score:privateDoc.score,total:privateDoc.total,xp:attempt.xp,
   version:privateDoc.gradeRevision?.version,
   q12:privateDoc.answers?.[11]?.points,
   q15:privateDoc.answers?.[14]?.points,
   correct12:privateDoc.answers?.[11]?.correct,
   correct15:privateDoc.answers?.[14]?.correct
  }:null;
 });
}
module.exports=async function controlSaturdayFullCredit(page,check,mode){
 if(!['preview','apply'].includes(mode))throw Error('Mode de correction inconnu');
 const copy=await readCopy(page);
 if(!copy||copy.total!==20||copy.answers.length!==20){
  check('Copie du samedi disponible',false,'Aucune écriture sans copie entière');return;
 }
 const {proveSaturdayTwoCalculations}=await import('../worker/saturday-20261114-full-credit.mjs');
 const already=copy.score===15&&copy.xp===7&&
  copy.answers[11]?.points===1&&copy.answers[14]?.points===1;
 if(mode==='preview'){
  assert.equal(copy.score,14,'La note antérieure doit être 14/20');
  assert.equal(copy.xp,4,'Les XP antérieurs doivent être 4');
  assert.equal(proveSaturdayTwoCalculations(copy),true,
   'Les deux calculs ne correspondent pas à la copie originale relue');
  console.log('SAMEDI PLEIN CREDIT PRECONTROLE : 2 calculs corrects, 14/20 -> 15/20, 4 XP -> 7 XP ; aucune écriture.');
  check('Deux calculs du samedi validés en lecture seule',true,
   'Q12 et Q15 : 1/1 justifié ; archive et état XP contrôlés par le serveur après déploiement.');
  return;
 }
 // Idempotence : éviter de modifier à nouveau une copie déjà corrigée.
 // Même après un éventuel échec de l'interface, on ne réécrit pas.
 let deployed=false;
 for(let i=0;i<20;i++){
  const p=await serverReview(page,'apply');
  if(p.http===403&&p.error==='saturday-full-credit-approval-required'){
   deployed=true;break;
  }
  if(i<19)await page.waitForTimeout(9000);
 }
 if(!deployed)throw Error('STOP : serveur de rectification non déployé ; aucune écriture.');
 const pre=await serverReview(page,'preview');
 if(pre.http===200&&pre.status==='already-corrected'){
  const verified=await readCurrentFromFirestore(page);
  assert.ok(verified&&verified.score===15&&verified.xp===7&&
   verified.version===VERSION&&verified.q12===1&&verified.q15===1&&
   verified.correct12===true&&verified.correct15===true);
  console.log('SAMEDI PLEIN CREDIT : correction déjà confirmée, aucune nouvelle écriture.');
  check('Copie du samedi déjà corrigée',true,'15/20, 7 XP, calculs à 1/1, aucune nouvelle écriture.');
  return;
 }
 if(already)throw Error('STOP : compte Parent indique 15/20 mais archive serveur non vérifiée.');
 if(copy.score!==14||copy.xp!==4||!proveSaturdayTwoCalculations(copy))
  throw Error('STOP : copie Parent différente du précontrôle, aucune écriture.');
 if(pre.http!==200||pre.status!=='eligible'||pre.data.fromScore!==14||
    pre.data.toScore!==15||pre.data.fromXp!==4||pre.data.toXp!==7||
    pre.data.xpDelta!==3||JSON.stringify(pre.data.questions)!=='[12,15]')
  throw Error('STOP : précontrôle serveur incompatible, aucune écriture : '+String(pre.error||pre.http));
 const result=await serverReview(page,'apply','WEEK_2026W46_FULL_CREDIT_PARENT_20261115');
 if(result.http!==200||!['corrected','already-corrected'].includes(result.status))
  throw Error('STOP : serveur n’a pas confirmé la correction : '+String(result.error||result.http));
 const saved=await readCurrentFromFirestore(page);
 if(!saved||saved.score!==15||saved.total!==20||saved.xp!==7||
    saved.version!==VERSION||saved.q12!==1||saved.q15!==1||
    saved.correct12!==true||saved.correct15!==true)
  throw Error('STOP : résultats de la copie non confirmés après transaction.');
 console.log('SAMEDI PLEIN CREDIT CONFIRMÉ : Q12 1/1, Q15 1/1, 15/20 et 7 XP ; archive originale conservée ; tentative unique inchangée.');
 check('Rectification de la copie du samedi confirmée',true,
  'Note 15/20, 7 XP, deux calculs corrigés ; archive historique et tentative protégées.');
};
