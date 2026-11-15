/* Second examen de la copie de samedi 14/11/2026.
   Tim a écrit deux calculs exacts en deux lignes. Ne pas pénaliser
   une méthode différente de la solution modèle.
   Pur calcul : aucun réseau, aucune mutation des documents.
*/
import {mixedMission} from './mixed-challenges.mjs';
import {rawPoints} from '../functions/xp.mjs';
import {SATURDAY_COPY_ID,SATURDAY_REVISION} from './saturday-20261114-review.mjs';

export const SATURDAY_FULL_CREDIT_VERSION='samedi-20261114-parent-20261115-v2';
export const SATURDAY_FULL_CREDIT_ARCHIVE='gradingReviewHistory/WEEK_2026W46-v2';
export const SATURDAY_PREVIOUS_ARCHIVE='gradingReviewHistory/WEEK_2026W46';
const fail=msg=>{throw Error('saturday-full-credit-'+msg);};
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8;
const clean=s=>String(s??'').trim()
 .replace(/[×*]/g,'x').replace(/[−–—]/g,'-').replace(/,/g,'.')
 .replace(/\s*([+=\/x])\s*/g,'').replace(/\s+/g,' ');
const proof12=s=>/^(?:p=)?6\+6=12(?:\s+|;\s*)(?:p=)?12x2=24(?:\s*cm)?$/i.test(clean(s));
const proof15=s=>/^6\/24=0\.25(?:\s+|;\s*)0\.25x4=1$/i.test(clean(s));

export function prepareSaturdayFullCredit(copy,pub,xp,firstArchive){
 const mission=mixedMission(SATURDAY_COPY_ID);
 if(!mission||mission.questions?.length!==20||mission.kind!=='weekly')fail('bank-changed');
 if(!copy||!pub||!xp||!firstArchive)fail('document-missing');
 if(copy.exerciseId!==SATURDAY_COPY_ID||pub.exerciseId!==SATURDAY_COPY_ID)fail('wrong-exercise');
 if(copy.gradeRevision?.version!==SATURDAY_REVISION||
    firstArchive.version!==SATURDAY_REVISION||
    firstArchive.correctedScore!==14||
    copy.gradeRevision.originalScore!==12||
    copy.gradeRevision.correctedScore!==14)fail('previous-revision-not-matching');
 if(copy.authorUid!==pub.authorUid||!copy.authorUid||
    pub.correctionStatus!=='released')fail('author-or-release');
 if(!Array.isArray(copy.answers)||copy.answers.length!==20||copy.total!==20||
    !close(copy.score,14))fail('wrong-current-score');
 if(!copy.answers.every((a,i)=>a&&a.question===mission.questions[i].q&&
    typeof a.response==='string'&&Number.isFinite(a.points)))fail('bank-or-copies-changed');
 if(!close(copy.answers.reduce((n,a)=>n+a.points,0),14))fail('stored-points-inconsistent');
 if(!close(pub.xp,4)||!close(firstArchive.originalPublicAttempt?.xp,4)||
    firstArchive.originalPrivateAttempt?.score!==12)fail('original-xp-inconsistent');

 for(const [i,valid,model] of [
  [11,proof12,24],
  [14,proof15,1]
 ]){
  const a=copy.answers[i],q=mission.questions[i];
  if(q.subject!=='Mathématiques'||q.type!=='text'||Number(q.right)!==model||
    !close(a.points,0.5)||a.correct!==false||!valid(a.response))
    fail('math-response-not-proved-'+(i+1));
 }
 if(!close(copy.answers[2].points,1)||copy.answers[2].correct!==true)
  fail('spanish-previous-fix-changed');
 if(xp.week!=='2026-11-09'||!Number.isFinite(xp.weekXp)||
    !Number.isFinite(xp.weekEarned)||xp.weekEarned<4||
    xp.weekXp<0||xp.weekXp>xp.weekEarned||
    !['2026-11-14','2026-11-15'].includes(xp.date))
  fail('xp-state-not-in-expected-week');
 const earned=rawPoints({kind:'weekly',category:'challenge',score:14,total:20,needsReview:false});
 const corrected=rawPoints({kind:'weekly',category:'challenge',score:15,total:20,needsReview:false});
 if(!close(earned,4)||!close(corrected,7))fail('xp-policy-changed');
 const delta=corrected-earned; // exactement +3, sans perte ni double crédit
 if(!close(delta,3))fail('xp-delta-unexpected');

 const updated=copy.answers.map(a=>({...a}));
 updated[11]={...updated[11],correct:true,points:1,
  explanation:'Raisonnement correct. 6 + 6 = 12 cm (longueur + largeur), puis 12 × 2 = 24 cm. C’est la formule du périmètre P = 2 × (L + l), écrite en deux étapes. Résultat : 24 cm.'};
 updated[14]={...updated[14],correct:true,points:1,
  explanation:'Raisonnement correct. 6/24 = 0,25, puis 0,25 × 4 = 1. Convertir la fraction en nombre décimal avant la multiplication est une méthode valable. Résultat : 1.',
  lessonId:'MBIS02'};
 if(!close(updated.reduce((n,a)=>n+a.points,0),15))fail('new-score-not-15');
 for(let i=0;i<20;i++){
  if(updated[i].response!==copy.answers[i].response)fail('original-response-changed');
  if(i!==11&&i!==14&&JSON.stringify(updated[i])!==JSON.stringify(copy.answers[i]))
   fail('unrelated-correction-changed');
 }
 const xpPatch={weekXp:xp.weekXp+delta,weekEarned:xp.weekEarned+delta};
 // Un rattrapage de samedi ne doit jamais augmenter les gains de dimanche.
 if(xp.date==='2026-11-14'){
  if(!Number.isFinite(xp.earned))fail('saturday-daily-xp-missing');
  xpPatch.earned=xp.earned+delta;
 }
 return {
  scoreBefore:14,scoreAfter:15,xpBefore:4,xpAfter:7,deltaXp:delta,
  answers:updated,xpPatch,
  changes:[{question:12,from:0.5,to:1},{question:15,from:0.5,to:1}]
 };
}
