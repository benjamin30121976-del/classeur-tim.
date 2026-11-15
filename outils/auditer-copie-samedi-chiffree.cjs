'use strict';
/* Audit ponctuel, lecture seule. Ne publier aucune réponse privée en clair :
   seules des données chiffrées pour la revue demandée par le Parent
   sont imprimées dans GitHub Actions. Clé privée absente du dépôt. */
const crypto=require('node:crypto');
const PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApTLEc8pg0NGzF/leeRHW\nxSONqKfe8zdWulWfy2+OnqHKm6K3w1UWWIpSqVdNFQCVes2MAzYdPp9JlH7qKV+h\nyRMTlNE1MI0nSuX+7AKzmgeK5zLSu6CJJ/5xNiJP0NXd6AfCkc4+21tSqUFfQ+2Q\nPcsRhjLpFHC/3xjjWIJfry91L0xxns2IDwNOFmFYD4MX1MFQIIqJjHEv9t1EolfM\nHa1Wy2srU8VsucmQ2dyDykiw2XKcyP2O/3sD8IMJZe1O0VZmlHw9bQt3xgeaMzXH\nTH2RZSW+IlUvjrAh3QvOARx7/TS6cnfpIoOUYa9C97z+PyjiM9ZleUDgKi23XUdk\n1QIDAQAB\n-----END PUBLIC KEY-----";
module.exports=async function auditSaturdayVerbatim(page,check){
 const original=await page.evaluate(()=>{
  if(window.__TIM_PARENT!==true)throw Error('Parent non authentifié');
  const copy=(window.__CLOUD_ATTEMPTS||[]).find(x=>x.id==='WEEK_2026W46');
  if(!copy||copy.answers?.length!==20)throw Error('Copie du samedi introuvable ou incomplète');
  return {id:copy.id,score:copy.score,total:copy.total,xp:copy.xp,
   selected:[11,14].map(i=>({
    index:i,
    question:copy.answers[i].question,
    response:copy.answers[i].response,
    points:copy.answers[i].points,
    correct:copy.answers[i].correct,
    explanation:copy.answers[i].explanation,
    expected:copy.answers[i].expected,
    lessonId:copy.answers[i].lessonId
   }))};
 });
 const {mixedMission}=await import('../worker/mixed-challenges.mjs');
 const mission=mixedMission('WEEK_2026W46');
 if(original.selected.some(a=>a.question!==mission.questions[a.index].q))
  throw Error('Source de questions incompatible avec la copie');
 const data={date:'2026-11-14',id:original.id,total:original.total,score:original.score,xp:original.xp,
  entries:original.selected.map(a=>({...a,
    originalPrompt:mission.questions[a.index].q,
    modelAnswer:mission.questions[a.index].right,
    pedagogicalCorrection:mission.questions[a.index].why,
    questionType:mission.questions[a.index].type,
    skill:mission.questions[a.index].skill
  }))};
 const key=crypto.randomBytes(32),iv=crypto.randomBytes(12);
 const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 const text=Buffer.from(JSON.stringify(data),'utf8');
 const ciphertext=Buffer.concat([cipher.update(text),cipher.final()]);
 const encryptedKey=crypto.publicEncrypt({key:PUBLIC_KEY,oaepHash:'sha256'},key);
 const envelope={v:1,k:encryptedKey.toString('base64'),iv:iv.toString('base64'),
  t:cipher.getAuthTag().toString('base64'),ct:ciphertext.toString('base64')};
 console.log('AUDIT_SAMEDI_CHIFFRE='+Buffer.from(JSON.stringify(envelope)).toString('base64'));
 check('Réponses originales et corrections du samedi consultées sans écriture',true,
   'Questions 12 et 15 examinées et chiffrées. Aucune réponse en clair dans le rapport.');
};
