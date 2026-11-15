/* Révision exceptionnelle et traçable de la copie du samedi 14 novembre 2026.
   Fonction pure : aucune lecture ni écriture Firestore. Elle refuse toute autre
   copie, toute modification des réponses ou du barème XP. */
import {mixedMission,gradeMixedMission} from './mixed-challenges.mjs';
import {numericMathAnswerMatches} from './math-answer-equivalence.mjs';
import {rawPoints} from '../functions/xp.mjs';

export const SATURDAY_COPY_ID='WEEK_2026W46';
export const SATURDAY_REVISION='samedi-20261114-parent-20261115-v1';
const near=(a,b)=>Math.abs(a-b)<1e-8;
const fails=reason=>{throw Error('saturday-review-'+reason);};
const isNumericFinalAnswer=(answer,expected)=>{
 const text=String(answer||'').trim();
 if(!text||text.length<10||text.includes('?')||
    !text.includes('=')||!/[+×*÷/]/.test(text)||
    /\b(?:pas|faux|incorrect|environ|approximativement)\b/i.test(text))return false;
 const matches=text.match(/[+-]?\d+(?:[.,]\d+)?/g)||[];
 if(!matches.length)return false;
 const last=Number(matches[matches.length-1].replace(',','.'));
 return Number.isFinite(last)&&near(last,Number(expected));
};

export function examineSaturdayCopy(copy,publicRecord){
 if(!copy||!publicRecord||copy.exerciseId!==SATURDAY_COPY_ID||
    publicRecord.exerciseId!==SATURDAY_COPY_ID)fails('not-matching-copy');
 if(copy.gradeRevision?.version===SATURDAY_REVISION)fails('already-corrected');
 if(!Array.isArray(copy.answers)||copy.answers.length!==20||copy.total!==20||
    !Number.isFinite(copy.score))fails('invalid-score-or-questions');
 if(!Number.isFinite(publicRecord.xp))fails('xp-missing');
 const mission=mixedMission(SATURDAY_COPY_ID);
 if(!mission||mission.questions.length!==20||mission.kind!=='weekly')fails('bank-not-matching');
 const correctQuestions=copy.answers.every((a,i)=>
   a&&typeof a.response==='string'&&a.question===mission.questions[i].q&&
   Number.isFinite(a.points)&&a.points>=0&&a.points<=1);
 if(!correctQuestions)fails('changed-original-questions');
 const originalTotal=copy.answers.reduce((sum,a)=>sum+a.points,0);
 if(!near(originalTotal,copy.score))fails('original-score-inconsistent');
 const fresh=gradeMixedMission(mission,copy.answers.map(a=>a.response),
   Array.isArray(copy.translationsUsed)?copy.translationsUsed:[]);
 if(fresh.answers.length!==20)fails('regrade-incomplete');
 const updated=copy.answers.map(a=>({...a}));
 const edits=[];
 // La traduction espagnole reconnue comme bonne dans l'audit du 15/11.
 const spanishIndex=2,spanishOld=updated[spanishIndex],spanishNew=fresh.answers[spanishIndex];
 if(spanishOld.points!==0||spanishOld.correct!==false||
    spanishNew.points<=0||spanishNew.points>1||
    mission.questions[spanishIndex].subject!=='Espagnol')fails('spanish-review-mismatch');
 updated[spanishIndex]={...spanishOld,
   points:spanishNew.points,correct:spanishNew.correct,
   explanation:'Réponse réexaminée : formulation espagnole correcte reconnue par le nouveau correcteur. '+
    (spanishNew.points===0.5?'Attention : les accents restent à vérifier. ':'')+
    mission.questions[spanishIndex].why};
 edits.push({question:3,oldPoints:0,newPoints:spanishNew.points,reason:'variante espagnole valide'});

 // Le bon résultat final ne suffit PAS à valider une égalité fausse :
 // accorder seulement 0,5/1 pour le résultat, avec méthode expliquée.
 for(const [i,model] of [
  [11,'Pour un rectangle de 6 cm par 6 cm : P = 6 + 6 + 6 + 6 = 24 cm.'],
  [14,'Pour les fractions : 6/24 × 4 = (6 × 4)/24 = 24/24 = 1.']
 ]){
  const q=mission.questions[i],old=updated[i],newGrade=fresh.answers[i];
  if(q.subject!=='Mathématiques'||q.type!=='text'||old.points!==0||
     old.correct!==false||newGrade.points!==0||!isNumericFinalAnswer(old.response,q.right))
   fails('math-review-mismatch-'+(i+1));
  // Le résultat final est juste ; les étapes n'ont PAS été prouvées correctes.
  const validWhole=numericMathAnswerMatches(old.response,q.right,q.q);
  const awarded=validWhole?1:0.5;
  updated[i]={...old,correct:awarded===1,points:awarded,
   explanation:'Le résultat final écrit est juste. '+
     (awarded===1?'Les étapes du calcul sont également correctes. ':
       'Certaines étapes du calcul ne sont pas assez claires ou comportent une égalité incorrecte : 0,5 point est accordé pour le résultat, mais pas pour un raisonnement non vérifié. ')+
     model,
   ...(i===14?{lessonId:'MBIS02'}:{lessonId:null})};
  edits.push({question:i+1,oldPoints:0,newPoints:awarded,
   reason:awarded===1?'calcul complet valable':'résultat final juste, étapes non validées'});
 }
 const newScore=updated.reduce((total,a)=>total+a.points,0);
 if(!near(newScore,copy.score+edits.reduce((s,e)=>s+e.newPoints-e.oldPoints,0))||
    newScore<=copy.score||newScore>20)fails('new-score-inconsistent');
 const originalXp=rawPoints({kind:'weekly',category:'challenge',score:copy.score,total:20,needsReview:false});
 const correctedXp=rawPoints({kind:'weekly',category:'challenge',score:newScore,total:20,needsReview:false});
 if(!near(originalXp,correctedXp)||!near(publicRecord.xp,originalXp))
  fails('xp-would-change');
 for(let i=0;i<updated.length;i++){
  if([2,11,14].includes(i))continue;
  if(JSON.stringify(updated[i])!==JSON.stringify(copy.answers[i]))
   fails('other-answer-changed');
 }
 return {oldScore:copy.score,newScore,total:20,
  oldXp:publicRecord.xp,newXp:publicRecord.xp,answers:updated,changes:edits,
  version:SATURDAY_REVISION};
}
