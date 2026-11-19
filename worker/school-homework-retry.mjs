/* Reprises des devoirs originaux ENT : copies immuables et 0 XP.
 * La première copie demeure dans attempts/privateAttempts et n'est jamais
 * réécrite. Les reprises sont dans schoolHomeworkRetakes, avec un état séparé.
 * Aucune bonne réponse ni correction dans les réponses API avant l'échéance.
 */
import {TIM_UID,PARENT_UID,ApiFault} from './auth.mjs';
import {createWrite,upsertWrite,NOW} from './firestore.mjs';
import {isSchoolHomework,schoolCorrectionNotBefore} from './school-homework-policy.mjs';

const validId=id=>typeof id==='string'&&/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(id);
const parisToday=()=>{
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',
  year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const value=type=>parts.find(p=>p.type===type)?.value||'';
 return value('year')+'-'+value('month')+'-'+value('day');
};

function schoolDue(ex){
 const due=String(ex.homeworkDue||ex.due||'');
 // La règle de date est validée par la fonction existante.
 if(!schoolCorrectionNotBefore(ex))throw new ApiFault(409,'school-homework-undated');
 return due;
}
function safeScores(initial,state){
 const list=Array.isArray(state?.scores)?state.scores:[];
 if(!Number.isFinite(initial)||initial<0)return [];
 if(!list.length){
  if(state)return [];
  return [{attempt:1,score:initial}];
 }
 if(list.length>100||list.some((x,i)=>!Number.isInteger(x?.attempt)||
    x.attempt!==i+1||!Number.isFinite(x?.score)||x.score<0))
  return [];
 if(list[0].score!==initial)return [];
 return list.map(x=>({attempt:x.attempt,score:x.score}));
}
export async function schoolHomeworkRetakeStatus(db,uid,payload,{resolveExercise}){
 if(uid!==TIM_UID&&uid!==PARENT_UID)throw new ApiFault(403,'forbidden');
 const id=payload?.id;
 if(!validId(id))throw new ApiFault(400,'invalid-exercise');
 const {exercise}=await resolveExercise(db,id);
 if(!isSchoolHomework(exercise)||exercise.kind!=='school')
  throw new ApiFault(409,'not-school-homework');
 const due=schoolDue(exercise);
 const [first,state]=await Promise.all([
  db.get('attempts/'+id),db.get('schoolHomeworkRetakeState/'+id)
 ]);
 if(!first||first.authorUid!==TIM_UID||first.schoolHomework!==true)
  return {id,submitted:false,canRetry:false,scores:[]};
 const scores=safeScores(Number(first.schoolScore),state);
 const latest=scores.length?scores[scores.length-1].score:Number(first.schoolScore);
 const total=Number(first.schoolTotal);
 const canRetry=Boolean(parisToday()<=due&&Number.isFinite(latest)&&
  Number.isFinite(total)&&latest<total&&scores.length>0);
 return {id,submitted:true,due,canRetry,
  score:latest,total,attemptCount:scores.length,
  bestScore:scores.length?Math.max(...scores.map(x=>x.score)):latest,
  scores:scores.map(x=>({attempt:x.attempt,score:x.score})),
  correctionLocked:parisToday()<=due};
}
export async function retrySchoolHomework(db,uid,payload,{resolveExercise,grade}){
 if(uid!==TIM_UID)throw new ApiFault(403,'forbidden');
 const id=payload?.id,answers=payload?.answers;
 if(!validId(id)||!Array.isArray(answers)||!answers.length||answers.length>30||
    answers.some(x=>!['string','number','boolean'].includes(typeof x)||String(x).length>2000))
  throw new ApiFault(400,'invalid-exercise');
 const {exercise,key}=await resolveExercise(db,id);
 if(!isSchoolHomework(exercise)||exercise.kind!=='school'||exercise.enabled!==true)
  throw new ApiFault(409,'school-retry-not-eligible');
 const due=schoolDue(exercise);
 if(parisToday()>due)throw new ApiFault(409,'school-retry-deadline-passed');
 if(answers.length!==exercise.questions?.length)throw new ApiFault(400,'invalid-answers');
 const graded=grade(exercise,key,answers);
 if(graded.needsReview||!Number.isFinite(graded.score)||!Number.isFinite(graded.total)||
    !Array.isArray(graded.answers)||graded.answers.length!==answers.length)
  throw new ApiFault(409,'school-retry-manual-review-required');
 // La transaction relit le premier devoir ET le pointeur, pour éviter
 // deux copies portant le même numéro lors d'une double validation.
 const tx=await db.transaction();
 const [original,state]=await Promise.all([
  db.get('attempts/'+id,tx),db.get('schoolHomeworkRetakeState/'+id,tx)
 ]);
 if(!original||original.authorUid!==uid||original.schoolHomework!==true||
    !Number.isFinite(Number(original.schoolScore))||
    Number(original.schoolTotal)!==graded.total)
  throw new ApiFault(409,'school-retry-original-unavailable');
 const scores=safeScores(Number(original.schoolScore),state);
 if(!scores.length)throw new ApiFault(409,'school-retry-history-invalid');
 const previous=scores[scores.length-1];
 if(scores.length>=100)throw new ApiFault(409,'school-retry-too-many-attempts');
 if(previous.score>=graded.total)throw new ApiFault(409,'school-retry-already-perfect');
 if(state&&(!Number.isInteger(state.attemptCount)||state.attemptCount!==scores.length||
    state.authorUid!==uid||state.exerciseId!==id))
  throw new ApiFault(409,'school-retry-history-invalid');
 const number=scores.length+1;
 const history=[...scores,{attempt:number,score:graded.score}];
 const copyPath='schoolHomeworkRetakes/'+id+'_T'+number;
 const statePath='schoolHomeworkRetakeState/'+id;
 await db.commit([
  createWrite(copyPath,{
   exerciseId:id,authorUid:uid,attemptNumber:number,schoolHomework:true,
   correctionNotBefore:schoolCorrectionNotBefore(exercise),
   score:graded.score,total:graded.total,xp:0,
   ...graded
  },NOW),
  upsertWrite(statePath,{
   exerciseId:id,authorUid:uid,attemptCount:number,
   scores:history,latestScore:graded.score,total:graded.total,xp:0,
   due,correctionNotBefore:schoolCorrectionNotBefore(exercise)
  },[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],tx);
 // L'énoncé est identique ; les solutions restent privées.
 // AUCUNE écriture sur attempts/id, privateAttempts/id ou xpState/tim.
 return {id,submitted:true,attemptNumber:number,score:graded.score,total:graded.total,
  bestScore:Math.max(...history.map(x=>x.score)),xp:0,
  correctionLocked:true,correctionStatus:'pending-parent'};
}
