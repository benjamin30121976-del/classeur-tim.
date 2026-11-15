'use strict';
/* Réutilise exclusivement la session Chromium Parent existante.
   PR = aperçu sans écriture. Fusion autorisée = correction atomique via
   le serveur Parent, sans toucher à la tentative ni aux XP de Tim.
   Aucune réponse individuelle n'est affichée dans les logs. */
const assert=require('node:assert/strict');
const ID='WEEK_2026W46';
async function currentParentAttempt(page){
 return page.evaluate(()=>{
  if(window.__TIM_PARENT!==true)throw Error('Compte Parent non authentifié');
  const record=(window.__CLOUD_ATTEMPTS||[]).find(a=>a.id==='WEEK_2026W46');
  return record?{id:record.id,score:record.score,total:record.total,
   answers:record.answers,xp:record.xp}:null;
 });
}
async function remoteReview(page,mode,approval){
 return page.evaluate(async ({mode,approval})=>{
  const {getApp}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js');
  const {getAuth}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js');
  const current=getAuth(getApp()).currentUser;
  if(!current)throw Error('Session Parent indisponible');
  const token=await current.getIdToken();
  const resp=await fetch('/api/tim',{method:'POST',cache:'no-store',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
   body:JSON.stringify({action:'reviseSaturday20261114',payload:{mode, ...(approval?{approval}:{})}})});
  const body=await resp.json().catch(()=>({}));
  return {status:resp.status,result:body?.data||null,error:body?.error||null};
 },{mode,approval});
}
module.exports=async function reviseSaturdayParent(page,check,mode){
 if(mode!=='preview'&&mode!=='apply')throw Error('Mode de révision inconnu');
 const attempt=await currentParentAttempt(page);
 if(!attempt||attempt.answers?.length!==20||!Number.isFinite(attempt.score)||
    !Number.isFinite(attempt.xp)){
  check('Copie originale du samedi disponible',false,'Aucune correction sans copie authentifiée');
  return;
 }
 if(mode==='preview'){
  const {examineSaturdayCopy}=await import('../worker/saturday-20261114-review.mjs');
  const review=examineSaturdayCopy({
   exerciseId:attempt.id,total:attempt.total,score:attempt.score,answers:attempt.answers
  },{exerciseId:attempt.id,xp:attempt.xp});
  assert.deepEqual(review.changes.map(x=>x.question),[3,12,15]);
  assert.equal(review.oldXp,review.newXp);
  console.log('SAMEDI PRECONTROLE : copie de 20 réponses ; seules Q3, Q12 et Q15 révisées ; score augmenté ; XP inchangés ; aucune écriture.');
  check('Révision samedi lecture seule',true,'Copie conservable, XP inchangés, sauvegarde requise avant écriture.');
  return;
 }
 // La nouvelle action est réellement déployée lorsque l'API sait refuser
 // une demande SANS autorisation. Son refus ciblé ne lit aucune copie.
 let ready=false;
 for(let i=0;i<20;i++){
  const probe=await remoteReview(page,'apply',null);
  if(probe.status===403&&probe.error==='saturday-review-approval-required'){
   ready=true;break;
  }
  if(i<19)await page.waitForTimeout(10000);
 }
 if(!ready)throw Error('STOP : correcteur serveur indisponible ; aucune écriture.');
 const previous=await remoteReview(page,'preview',null);
 if(previous.status===200&&previous.result?.status==='already-corrected'){
  check('Copie du samedi déjà rectifiée',true,'Aucune nouvelle écriture nécessaire.');
  return;
 }
 if(previous.status!==200||previous.result?.status!=='eligible'||
   previous.result?.xpUnchanged!==true||JSON.stringify(previous.result?.questions)!=='[3,12,15]'||
   previous.result.oldScore!==attempt.score)
  throw Error('STOP : précontrôle serveur différent du contrôle Parent ; aucune écriture.');
 const result=await remoteReview(page,'apply','WEEK_2026W46_PARENT_REQUEST_20261115');
 if(result.status!==200||!['corrected','already-corrected'].includes(result.result?.status)||
    result.result.xpUnchanged!==true)
  throw Error('STOP : rectification non confirmée par le serveur : '+String(result.error||result.status));
 if(result.result.status==='corrected'&&!result.result.originalArchived)
  throw Error('STOP : copie d’origine non certifiée archivée.');
 // Vérification après rechargement : copie affichée par le compte Parent,
 // scores privés mis à jour, XP du document de tentative inchangé.
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>document.body.classList.contains('ready')&&
   window.__TIM_PARENT===true&&Array.isArray(window.__CLOUD_ATTEMPTS),null,{timeout:50000});
 const after=await currentParentAttempt(page);
 if(!after||after.score!==result.result.newScore&&result.result.status==='corrected'||
    after.xp!==attempt.xp||after.answers?.length!==20)
  throw Error('STOP : relecture Parent de la correction non confirmée.');
 for(const i of [2,11,14])if(!(after.answers[i]?.points>attempt.answers[i].points))
  throw Error('STOP : nouveau barème non visible sur la copie.');
 console.log('SAMEDI CONFIRMÉ : Q3, Q12, Q15 rectifiées ; original archivé, note révisée visible Parent ; XP préservés, aucune nouvelle tentative.');
 check('Rectification samedi vérifiée par Parent',true,
  'Trois corrections ciblées, archive originale et XP inchangés.');
};
