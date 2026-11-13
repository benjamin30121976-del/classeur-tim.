/* School backend for Cloudflare Pages + Firebase Spark.
   Every action verifies a signed Firebase ID token, then enforces the Tim/Parent role.
   No answer key, credential or student grade is served to anonymous visitors. */
import {PROJECT,TIM_UID,PARENT_UID,ApiFault,verifyFirebaseToken} from './auth.mjs';
import {firestore,createWrite,upsertWrite,updateWrite,NOW} from './firestore.mjs';
import {grade} from '../functions/grading.mjs';
import {rawPoints,cappedPoints} from '../functions/xp.mjs';
import {buildMission,isMissionId,isMissionOpen} from '../functions/missions-v18.mjs';
import {SPANISH_COURSE} from '../functions/spanish-training-curriculum.mjs';
import {isMixedMissionId,mixedMission,mixedPlan,publicMixedMission,gradeMixedMission} from './mixed-challenges.mjs';
import {mathId,mathPublicTaskPrivate,gradeMathTaskPrivate,MATH_BANK_VERSION,validateMathFragment} from './math-private-kv.mjs';
import {spanishEntTrainingId,spanishEntTask,spanishEntPublicTask,gradeSpanishEntTask,isSpanishDailyMissionId,spanishDailyMissionIds,buildSpanishDailyMission,gradeSpanishDailyMission} from './spanish-ent-training.mjs';
import {spanishLessonXp} from './spanish-lesson-xp.mjs';
import {physicsTrainingId,physicsPublicTask,gradePhysicsTask,PHYSICS_BANK_VERSION} from './physics-training.mjs';
import {englishTrainingId,englishPublicTask,gradeEnglishTask,ENGLISH_BANK_VERSION} from './english-training.mjs';
import {PHYSICS_ENT_VERSION,physicsEntId,physicsEntPublicTask,physicsEntGrade} from './physics-ent-training.mjs';
import {MATH_ENT_VERSION,mathEntId,mathEntPublicTask,gradeMathEnt} from './math-ent-training.mjs';

const PRIVATE_FIELDS=new Set(['right','also','why','expected','answer','answers','answerKey','answerKeys','solution','solutions','correction','corrections','explanation','rubric']);
function sanitize(value){
 if(Array.isArray(value))return value.map(sanitize);
 if(value&&typeof value==='object')
  return Object.fromEntries(Object.entries(value).filter(([key])=>!PRIVATE_FIELDS.has(key)).map(([key,v])=>[key,sanitize(v)]));
 return value;
}
const validId=id=>typeof id==='string'&&/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(id);
function permitted(uid,required){
 if(uid!==(required==='parent'?PARENT_UID:TIM_UID))throw new ApiFault(403,'forbidden');
}
function parisDate(date){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const x=t=>parts.find(p=>p.type===t)?.value;
 return x('year')+'-'+x('month')+'-'+x('day');
}
function mondayOf(date){
 const m=new Date(date+'T12:00:00Z');
 m.setUTCDate(m.getUTCDate()-(m.getUTCDay()+6)%7);
 return m.toISOString().slice(0,10);
}
const noStore={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:noStore});
function faultMessage(error){
 if(error instanceof ApiFault)return {status:error.status,code:error.code};
 return {status:500,code:'server-error'};
}
function checkOrigin(req){
 const origin=req.headers.get('Origin');
 if(origin&&origin!==new URL(req.url).origin)throw new ApiFault(403,'origin-denied');
 const fetchSite=req.headers.get('Sec-Fetch-Site');
 if(fetchSite==='cross-site')throw new ApiFault(403,'origin-denied');
}
async function resolveExercise(db,id){
 if(isMixedMissionId(id)){
  const mission=mixedMission(id);
  if(!mission)throw new ApiFault(404,'mission-not-found');
  if(!isMissionOpen(mission))throw new ApiFault(409,'mission-not-open');
  return {exercise:{...publicMixedMission(mission),enabled:true},key:null,mixedSource:mission};
 }
 if(isSpanishDailyMissionId(id)){
  const mission=buildSpanishDailyMission(id);
  if(!mission)throw new ApiFault(404,'mission-not-found');
  if(!isMissionOpen(mission))throw new ApiFault(409,'mission-not-open');
  return {exercise:{...sanitize(mission),enabled:true},key:null,spanishSource:mission};
 }
 if(isMissionId(id)){
  const source=await db.get('content/main'),mission=buildMission(id,source,SPANISH_COURSE);
  if(!mission)throw new ApiFault(404,'mission-not-found');
  if(!isMissionOpen(mission))throw new ApiFault(409,'mission-not-open');
  return {exercise:{...sanitize(mission),enabled:true},key:{questions:mission.questions.map(q=>({right:q.right,also:q.also,why:q.why}))}};
 }
 const extra=await db.get('exercises/'+id);
 let raw=extra;
 // Les exercices ajoutés au classeur sont stockés avec leur payloadJson privé.
 if(raw&&typeof raw.payloadJson==='string'){
  try{const parsed=JSON.parse(raw.payloadJson);if(parsed.id!==id)throw Error('ID mismatch');raw=parsed;}
  catch{throw new ApiFault(409,'exercise-invalid');}
 }
 if(!raw){
  const pub=await db.get('publicExercises/'+id);
  const key=await db.get('answerKeys/'+id);
  if(pub&&key)return {exercise:{...pub,enabled:pub.enabled!==false},key};
  const source=await db.get('content/main');
  raw=(source?.exercises||[]).find(e=>e.id===id);
 }
 if(!raw||!Array.isArray(raw.questions))throw new ApiFault(404,'exercise-not-found');
 const key={questions:raw.questions.map(q=>({right:q.right,also:q.also,why:q.why}))};
 return {exercise:{...sanitize(raw),enabled:raw.enabled!==false},key};
}
async function submitExercise(db,uid,payload){
 permitted(uid,'tim');
 const {id,answers,translationsUsed=[],reviewChanges=[]}=payload;
 if(!validId(id)||!Array.isArray(answers)||answers.length>30||
  answers.some(x=>!['string','number','boolean'].includes(typeof x)||String(x).length>2000))
  throw new ApiFault(400,'invalid-exercise');
 const {exercise,key,spanishSource,mixedSource}=await resolveExercise(db,id);
 if(exercise.enabled!==true)throw new ApiFault(409,'exercise-closed');
  // Défi bonus : pas de texte libre ni de question sans correction expliquée.
  if(exercise.kind==='bonus-day'){
   if(!Array.isArray(exercise.questions)||exercise.questions.length<10||exercise.questions.length>20||
      exercise.questions.some((q,i)=>!['mc','text'].includes(q.type)||!String(key?.questions?.[i]?.why||'').trim()))
    throw new ApiFault(409,'bonus-questionnaire-incomplet');
  }
 let evaluated;
 try{
  if(mixedSource){
   if(!Array.isArray(translationsUsed)||translationsUsed.length>20||
       translationsUsed.some((v,i)=>typeof v!=='boolean'||(v===true&&mixedSource.questions[i]?.subject!=='Espagnol')))
    throw Error('invalid-translations');
   if(!Array.isArray(reviewChanges)||reviewChanges.length>mixedSource.questions.length||
      reviewChanges.some(c=>!c||!Number.isInteger(c.questionIndex)||
       c.questionIndex<0||c.questionIndex>=answers.length||
       typeof c.before!=='string'||c.before.length>2000||
       typeof c.after!=='string'||c.after.length>2000||
       c.after!==String(answers[c.questionIndex])||c.before===c.after))
    throw Error('invalid-review');
   evaluated=gradeMixedMission(mixedSource,answers,translationsUsed);
  }else evaluated=spanishSource?gradeSpanishDailyMission(spanishSource,answers):grade(exercise,key,answers);
 }catch{throw new ApiFault(400,'invalid-answers');}
 const transaction=await db.transaction();
 const [publicRecord,privateRecord,xpRecord]=await Promise.all([
  db.get('attempts/'+id,transaction),db.get('privateAttempts/'+id,transaction),db.get('xpState/tim',transaction)
 ]);
 if(publicRecord||privateRecord)throw new ApiFault(409,'already-exists');
 const today=parisDate(new Date()),week=mondayOf(today),state=xpRecord||{};
 const current=state.date===today?state:{earned:0,lost:0,bonus:0};
 const weekEarned=state.week===week?Number(state.weekEarned||0):0;
 const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
 const category=exercise.kind==='bonus-day'?'challenge':exercise.category||'school';
 let raw,points;
 try{
  raw=rawPoints({kind:exercise.kind,category,score:evaluated.score,total:evaluated.total,needsReview:evaluated.needsReview});
  points=cappedPoints(raw,Number(current.earned||0),Number(current.lost||0),weekEarned,Number(current.bonus||0),category);
 }catch{throw new ApiFault(400,'invalid-category');}
 const stateAfter={
  date:today,week,
  earned:Number(current.earned||0)+Math.max(0,points),
  lost:Number(current.lost||0)+Math.max(0,-points),
  bonus:Number(current.bonus||0)+(category==='bonus'?Math.max(0,points):0),
  weekEarned:weekEarned+Math.max(0,points),weekXp:Math.max(0,weekXp+points),policyVersion:18
 };
 const details={
  exerciseId:id,title:String(exercise.title||id).slice(0,200),authorUid:uid,
  score:evaluated.score,total:evaluated.total,needsReview:evaluated.needsReview,
  policyVersion:18,...evaluated,
  ...(mixedSource?{reviewChanges:reviewChanges.map(c=>({
    questionIndex:c.questionIndex,before:c.before,after:c.after
   })),reviewChangeCount:reviewChanges.length}:{})
 };
 const autoRelease=isMissionId(id)||exercise.kind==='bonus-day';
 const pending={
  exerciseId:id,authorUid:uid,policyVersion:18,xp:points,correctionStatus:autoRelease?'released':'pending-parent'
 };
 await db.commit([
  createWrite('attempts/'+id,pending,NOW),
  createWrite('privateAttempts/'+id,details,NOW),
  upsertWrite('xpState/tim',stateAfter,[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]),
  ...(autoRelease?[createWrite('releasedCorrections/'+id,{released:true},NOW)]:[])
 ],transaction);
 return autoRelease?{id,submitted:true,xp:points,correctionLocked:false,correctionStatus:'released',score:evaluated.score,total:evaluated.total,answers:evaluated.answers,translationHelpCount:evaluated.translationHelpCount??0}:
  {id,submitted:true,xp:points,correctionLocked:true,correctionStatus:'pending-parent'};
}
async function parentReport(db,uid){
 permitted(uid,'parent');
 const [notes,attempts]=await Promise.all([db.list('privateAttempts',1000),db.list('attempts',1000)]);
 const attemptById=new Map(attempts.map(x=>[x.id,x.data]));
 const records=notes.map(x=>{
  const a=attemptById.get(x.id)||{},n=x.data||{};
  return {id:x.id,title:String(n.title||x.id),score:n.score??null,total:n.total??null,
   needsReview:Boolean(n.needsReview),xp:a.xp??0,translationHelpCount:n.translationHelpCount??null,
   correctionStatus:a.correctionStatus==='released'?'released':'pending-parent',reviewChangeCount:n.reviewChangeCount??null};
 });
 return {attempts:records,pendingCorrections:records.filter(r=>r.correctionStatus!=='released').length};
}
async function releaseCorrection(db,uid,payload){
 permitted(uid,'parent');
 if(!validId(payload.id)||typeof payload.released!=='boolean')
  throw new ApiFault(400,'invalid-request');
 const tx=await db.transaction();
 const attempt=await db.get('attempts/'+payload.id,tx);
 if(!attempt)throw new ApiFault(404,'attempt-not-found');
 const status=payload.released?'released':'pending-parent';
 await db.commit([
  updateWrite('attempts/'+payload.id,{correctionStatus:status}),
  upsertWrite('releasedCorrections/'+payload.id,{released:payload.released},
   [{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],tx);
 return {saved:true,id:payload.id,released:payload.released};
}
async function releasedCorrections(db,uid){
 permitted(uid,'tim');
 const [attempts,releases]=await Promise.all([db.list('attempts',1000),db.list('releasedCorrections',1000)]);
 const allowed=new Set(releases.filter(x=>x.data?.released===true).map(x=>x.id));
 const released=attempts.filter(x=>x.data?.authorUid===uid&&x.data.correctionStatus==='released'&&allowed.has(x.id));
 const entries=await Promise.all(released.map(async x=>({id:x.id,details:await db.get('privateAttempts/'+x.id)})));
 return {corrections:entries.filter(x=>x.details).map(x=>({
  id:x.id,answers:x.details.answers||[],score:x.details.score,total:x.details.total,translationHelpCount:x.details.translationHelpCount??null
 }))};
}
async function courseContent(db,uid){
 permitted(uid,'tim');
 // Ne pas bloquer Tim si la lecture des compléments Firestore échoue.
 // Les collections manquantes sont marquées, et le cours principal reste accessible.
 const main=await db.get('content/main');
 if(!main||!Array.isArray(main.lessons)||!Array.isArray(main.exercises))
  throw new ApiFault(404,'course-not-found');
 const resilientList=async name=>{
  for(let attempt=0;attempt<3;attempt++){
   try{return {items:await db.list(name,500),available:true};}
   catch(error){
    if(attempt===2)return {items:[],available:false};
    await new Promise(resolve=>setTimeout(resolve,200*(attempt+1)));
   }
  }
 };
 const [lessonList,exerciseList]=await Promise.all([
  resilientList('lessons'),resilientList('exercises')
 ]);
 const lessons=lessonList.items,exercises=exerciseList.items;
 // Les ajouts du classeur sont stockés avec un payloadJson. Le convertir
 // AVANT de filtrer les corrigés, pour que Tim voie le défi publié sans fuite
 // de réponses dans la chaîne JSON brute.
 const unpack=record=>{
  const value=record.data||{};
  if(typeof value.payloadJson!=='string')return value;
  try{
   const parsed=JSON.parse(value.payloadJson);
   return parsed&&parsed.id===record.id?parsed:null;
  }catch{return null;}
 };
 return {content:sanitize(main),
  additions:sanitize({
   lessons:lessons.map(unpack).filter(Boolean),
   exercises:exercises.map(unpack).filter(Boolean)
  }),
  additionsIncomplete:!lessonList.available||!exerciseList.available};
}
async function oldTrainingProgress(db,uid){
 if(uid!==TIM_UID&&uid!==PARENT_UID)throw new ApiFault(403,'forbidden');
 const list=await db.list('spanishTrainingAttempts',200);
 return {attempts:list.filter(x=>x.data?.authorUid===TIM_UID).map(x=>({
  id:x.id,lessonId:x.data.lessonId,mode:x.data.mode,series:x.data.series,
  score:x.data.score,total:x.data.total,submittedAt:x.data.submittedAt||'',
  xp:0,items:uid===PARENT_UID?(x.data.items||[]):[]
 }))};
}
/* Évaluations mathématiques : une tentative, correction immédiate, 0 XP.
   Le serveur note et écrit avant de rendre la réponse à Tim.
   Les deux comptes autorisés peuvent consulter le résultat ; aucun invité. */
function allowedFamily(uid){
 if(uid!==TIM_UID&&uid!==PARENT_UID)throw new ApiFault(403,'forbidden');
}
// Chargement sécurisé des corrigés via le compte Parent, sans secret Cloudflare KV.
export async function importMathPrivateQuiz(db,uid,payload){
 permitted(uid,'parent');
 const id=payload?.id,fragment=payload?.fragment;
 let raw;
 try{raw=JSON.stringify(fragment);}
 catch{throw new ApiFault(400,'invalid-math-bank');}
 if(!mathId(id)||!raw||raw.length>40000)throw new ApiFault(400,'invalid-math-bank');
 try{validateMathFragment(fragment,id);}
 catch{throw new ApiFault(400,'invalid-math-bank');}
 const path='mathPrivateQuizzes/'+id;
 const tx=await db.transaction();
 const existing=await db.get(path,tx);
 if(existing){
  // The real Firestore reader unwraps payloadJson automatically. Do not reject
  // an identical re-import of a quiz that was already saved successfully.
  const stored=typeof existing.payloadJson==='string'?existing.payloadJson:JSON.stringify(existing);
  if(existing.version===MATH_BANK_VERSION&&stored===raw)
   return {saved:true,id,unchanged:true};
  throw new ApiFault(409,'math-bank-already-installed');
 }
 await db.commit([createWrite(path,{payloadJson:raw,version:MATH_BANK_VERSION})],tx);
 return {saved:true,id,unchanged:false};
}
export async function getMathTrainingTask(db,uid,payload,env){
 allowedFamily(uid);
 const id=payload?.id;
 if(!mathId(id))throw new ApiFault(400,'invalid-exercise');
 const existing=await db.get('mathTrainingAttempts/'+id);
 let task;
 try{task=await mathPublicTaskPrivate(env,id,db);}
 catch{throw new ApiFault(503,'math-bank-unavailable');}
 return {task,completed:Boolean(existing&&existing.authorUid===TIM_UID)};
}
export async function submitMathTraining(db,uid,payload,env){
 permitted(uid,'tim');
 const id=payload?.id,answers=payload?.answers;
 if(!mathId(id)||!Array.isArray(answers)||answers.length!==10||
    answers.some(x=>!Number.isInteger(x)||x<0||x>3))
  throw new ApiFault(400,'invalid-answers');
 // Une page restée ouverte avec une autre version ne doit jamais consommer une tentative.
 if(payload?.bankVersion!==MATH_BANK_VERSION)throw new ApiFault(409,'stale-bank');
 let result,xp;
 try{
  result=await gradeMathTaskPrivate(env,id,answers,payload.bankVersion,db);
  xp=spanishLessonXp(result.score,result.total);
 }catch{
  // Le refus intervient AVANT toute écriture Firestore ; aucune tentative n'est consommée.
  throw new ApiFault(503,'math-bank-unavailable');
 }
 const tx=await db.transaction();
 const [existing,xpRecord]=await Promise.all([
  db.get('mathTrainingAttempts/'+id,tx),
  db.get('xpState/tim',tx)
 ]);
 if(existing)throw new ApiFault(409,'already-exists');
 const today=parisDate(new Date()),week=mondayOf(today),state=xpRecord||{};
 const current=state.date===today?state:{earned:0,lost:0,bonus:0};
 const weekEarned=state.week===week?Number(state.weekEarned||0):0;
 const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
 const nextXP={
  date:today,week,
  earned:Number(current.earned||0)+xp,
  lost:Number(current.lost||0),
  bonus:Number(current.bonus||0),
  weekEarned:weekEarned+xp,
  weekXp:Math.max(0,weekXp+xp),
  policyVersion:18
 };
 await db.commit([
  createWrite('mathTrainingAttempts/'+id,{
   ...result,xp,authorUid:uid,subject:'Mathématiques',answers,
   title:'Évaluation de la sous-leçon · '+id.slice(2),
   bankVersion:MATH_BANK_VERSION,version:3
  },NOW),
  upsertWrite('xpState/tim',nextXP,[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],tx);
 return {...result,xp,submitted:true,submittedAt:new Date().toISOString()};
}
export async function getMathTrainingProgress(db,uid){
 allowedFamily(uid);
 const attempts=await db.list('mathTrainingAttempts',100);
 return {attempts:attempts.filter(x=>mathId(x.id)&&x.data?.authorUid===TIM_UID)
  .map(x=>({...x.data,id:x.id,xp:Number(x.data.xp||0)}))
  .sort((a,b)=>String(b.submittedAt||'').localeCompare(String(a.submittedAt||'')))};
}

/* Physique-chimie : même contrat de validation que l’espagnol.
   L’énoncé ne contient aucune clé ; seule la transaction enregistrée révèle la correction.
   Une seule tentative par exercice, 21 exercices indépendants.
   Les résultats complets sont accessibles à Tim et au Parent seulement. */
async function getPhysicsTrainingTask(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(!physicsTrainingId(id))throw new ApiFault(400,'invalid-physics-exercise');
 const task=physicsPublicTask(id);
 const old=await db.get('physicsTrainingAttempts/'+id);
 return {task,completed:Boolean(old&&old.authorUid===TIM_UID)};
}
async function submitPhysicsTraining(db,uid,payload){
 permitted(uid,'tim');
 const id=payload?.id,answers=payload?.answers;
 if(!physicsTrainingId(id)||!Array.isArray(answers)||answers.length!==10)
  throw new ApiFault(400,'invalid-physics-answers');
 if(payload?.bankVersion!==PHYSICS_BANK_VERSION)
  throw new ApiFault(409,'stale-physics-bank');
 let result,xp;
 try{
  result=gradePhysicsTask(id,answers,payload.bankVersion);
  xp=spanishLessonXp(result.score,result.total);
 }catch{throw new ApiFault(400,'invalid-physics-answers');}
 // Les réponses ne sont jamais écrites hors transaction : pas de note en double.
 const tx=await db.transaction();
 const [old,xpRecord]=await Promise.all([
  db.get('physicsTrainingAttempts/'+id,tx),
  db.get('xpState/tim',tx)
 ]);
 if(old)throw new ApiFault(409,'already-exists');
 const today=parisDate(new Date()),week=mondayOf(today),state=xpRecord||{};
 const current=state.date===today?state:{earned:0,lost:0,bonus:0};
 const weekEarned=state.week===week?Number(state.weekEarned||0):0;
 const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
 const nextXP={
  date:today,week,
  earned:Number(current.earned||0)+xp,
  lost:Number(current.lost||0),
  bonus:Number(current.bonus||0),
  weekEarned:weekEarned+xp,
  weekXp:Math.max(0,weekXp+xp),
  policyVersion:18
 };
 await db.commit([
  createWrite('physicsTrainingAttempts/'+id,{
   ...result,xp,authorUid:uid,subject:'Physique-chimie',
   answers,version:1
  },NOW),
  upsertWrite('xpState/tim',nextXP,[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],tx);
 return {...result,xp,submitted:true,submittedAt:new Date().toISOString()};
}
/* Aperçu/essai du Parent uniquement : correction en mémoire, sans écriture
   Firestore, sans tentative, sans XP et sans modification des résultats de Tim. */
async function previewPhysicsTraining(db,uid,payload){
 permitted(uid,'parent');
 const id=payload?.id,answers=payload?.answers;
 if(!physicsTrainingId(id)||!Array.isArray(answers)||answers.length!==10)
  throw new ApiFault(400,'invalid-physics-preview');
 if(payload?.bankVersion!==PHYSICS_BANK_VERSION)
  throw new ApiFault(409,'stale-physics-bank');
 let graded;
 try{graded=gradePhysicsTask(id,answers,payload.bankVersion);}
 catch{throw new ApiFault(400,'invalid-physics-preview');}
 return {...graded,xp:0,practice:true,submitted:false,saved:false,
  message:'Simulation Parent : aucune note, tentative ou XP enregistrés.'};
}
async function getPhysicsTrainingProgress(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(id!==undefined&&id!==null){
  if(!physicsTrainingId(id))throw new ApiFault(400,'invalid-physics-exercise');
  const old=await db.get('physicsTrainingAttempts/'+id);
  return {attempt:old?.authorUid===TIM_UID?{...old,id,xp:Number(old.xp||0)}:null};
 }
 const docs=await db.list('physicsTrainingAttempts',100);
 return {attempts:docs.filter(x=>physicsTrainingId(x.id)&&x.data?.authorUid===TIM_UID)
  .map(x=>({id:x.id,lessonId:x.data.lessonId,series:x.data.series,title:x.data.title,
   score:x.data.score,total:x.data.total,xp:Number(x.data.xp||0),
   errorCounts:x.data.errorCounts||{},submittedAt:x.data.submittedAt||''}))
  .sort((a,b)=>String(b.submittedAt||'').localeCompare(String(a.submittedAt||'')))};
}

async function getEnglishTrainingTask(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(!englishTrainingId(id))throw new ApiFault(400,'invalid-physics-exercise');
 const task=englishPublicTask(id);
 const old=await db.get('englishTrainingAttempts/'+id);
 return {task,completed:Boolean(old&&old.authorUid===TIM_UID)};
}
async function submitEnglishTraining(db,uid,payload){
 permitted(uid,'tim');
 const id=payload?.id,answers=payload?.answers;
 if(!englishTrainingId(id)||!Array.isArray(answers)||answers.length!==10)
  throw new ApiFault(400,'invalid-physics-answers');
 if(payload?.bankVersion!==ENGLISH_BANK_VERSION)
  throw new ApiFault(409,'stale-physics-bank');
 let result,xp;
 try{
  result=gradeEnglishTask(id,answers,payload.bankVersion);
  xp=spanishLessonXp(result.score,result.total);
 }catch{throw new ApiFault(400,'invalid-physics-answers');}
 // Les réponses ne sont jamais écrites hors transaction : pas de note en double.
 const tx=await db.transaction();
 const [old,xpRecord]=await Promise.all([
  db.get('englishTrainingAttempts/'+id,tx),
  db.get('xpState/tim',tx)
 ]);
 if(old)throw new ApiFault(409,'already-exists');
 const today=parisDate(new Date()),week=mondayOf(today),state=xpRecord||{};
 const current=state.date===today?state:{earned:0,lost:0,bonus:0};
 const weekEarned=state.week===week?Number(state.weekEarned||0):0;
 const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
 const nextXP={
  date:today,week,
  earned:Number(current.earned||0)+xp,
  lost:Number(current.lost||0),
  bonus:Number(current.bonus||0),
  weekEarned:weekEarned+xp,
  weekXp:Math.max(0,weekXp+xp),
  policyVersion:18
 };
 await db.commit([
  createWrite('englishTrainingAttempts/'+id,{
   ...result,xp,authorUid:uid,subject:'Anglais',
   answers,version:1
  },NOW),
  upsertWrite('xpState/tim',nextXP,[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],tx);
 return {...result,xp,submitted:true,submittedAt:new Date().toISOString()};
}
/* Aperçu/essai du Parent uniquement : correction en mémoire, sans écriture
   Firestore, sans tentative, sans XP et sans modification des résultats de Tim. */
async function previewEnglishTraining(db,uid,payload){
 permitted(uid,'parent');
 const id=payload?.id,answers=payload?.answers;
 if(!englishTrainingId(id)||!Array.isArray(answers)||answers.length!==10)
  throw new ApiFault(400,'invalid-physics-preview');
 if(payload?.bankVersion!==ENGLISH_BANK_VERSION)
  throw new ApiFault(409,'stale-physics-bank');
 let graded;
 try{graded=gradeEnglishTask(id,answers,payload.bankVersion);}
 catch{throw new ApiFault(400,'invalid-physics-preview');}
 return {...graded,xp:0,practice:true,submitted:false,saved:false,
  message:'Simulation Parent : aucune note, tentative ou XP enregistrés.'};
}
async function getEnglishTrainingProgress(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(id!==undefined&&id!==null){
  if(!englishTrainingId(id))throw new ApiFault(400,'invalid-physics-exercise');
  const old=await db.get('englishTrainingAttempts/'+id);
  return {attempt:old?.authorUid===TIM_UID?{...old,id,xp:Number(old.xp||0)}:null};
 }
 const docs=await db.list('englishTrainingAttempts',100);
 return {attempts:docs.filter(x=>englishTrainingId(x.id)&&x.data?.authorUid===TIM_UID)
  .map(x=>({id:x.id,lessonId:x.data.lessonId,series:x.data.series,title:x.data.title,
   score:x.data.score,total:x.data.total,xp:Number(x.data.xp||0),
   errorCounts:x.data.errorCounts||{},submittedAt:x.data.submittedAt||''}))
  .sort((a,b)=>String(b.submittedAt||'').localeCompare(String(a.submittedAt||'')))};
}

/* Mathématiques : deux fiches ENT dont les énoncés sont réellement disponibles.
   La note est calculée au serveur, aucune bonne réponse n’est envoyée avant
   la validation unique ; le compte Parent ne peut faire que des essais sans note. */
async function getMathEntTask(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(!mathEntId(id))throw new ApiFault(400,'invalid-math-ent-id');
 const old=await db.get('mathEntAttempts/'+id);
 return {task:mathEntPublicTask(id),completed:Boolean(old?.authorUid===TIM_UID)};
}
async function submitMathEntTask(db,uid,payload){
 permitted(uid,'tim');
 const id=payload?.id,answers=payload?.answers;
 if(!mathEntId(id)||!Array.isArray(answers)||answers.length>20)throw new ApiFault(400,'invalid-math-ent-answers');
 if(payload?.bankVersion!==MATH_ENT_VERSION)throw new ApiFault(409,'stale-math-ent-bank');
 let result,xp;
 try{result=gradeMathEnt(id,answers,payload.bankVersion);xp=spanishLessonXp(result.score,result.total);}
 catch{throw new ApiFault(400,'invalid-math-ent-answers');}
 const tx=await db.transaction();
 const [old,xpState]=await Promise.all([db.get('mathEntAttempts/'+id,tx),db.get('xpState/tim',tx)]);
 if(old)throw new ApiFault(409,'already-exists');
 const today=parisDate(new Date()),week=mondayOf(today),state=xpState||{};
 const current=state.date===today?state:{earned:0,lost:0,bonus:0};
 const weekEarned=state.week===week?Number(state.weekEarned||0):0;
 const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
 const nextXP={
  date:today,week,earned:Number(current.earned||0)+xp,
  lost:Number(current.lost||0),bonus:Number(current.bonus||0),
  weekEarned:weekEarned+xp,weekXp:Math.max(0,weekXp+xp),policyVersion:18
 };
 await db.commit([
  createWrite('mathEntAttempts/'+id,{...result,xp,authorUid:uid,answers,version:1},NOW),
  upsertWrite('xpState/tim',nextXP,[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],tx);
 return {...result,xp,submitted:true,submittedAt:new Date().toISOString()};
}
async function previewMathEntTask(db,uid,payload){
 permitted(uid,'parent');
 const id=payload?.id,answers=payload?.answers;
 if(!mathEntId(id)||!Array.isArray(answers)||answers.length>20)throw new ApiFault(400,'invalid-math-ent-answers');
 if(payload?.bankVersion!==MATH_ENT_VERSION)throw new ApiFault(409,'stale-math-ent-bank');
 let result;
 try{result=gradeMathEnt(id,answers,payload.bankVersion);}
 catch{throw new ApiFault(400,'invalid-math-ent-answers');}
 return {...result,xp:0,practice:true,submitted:false,saved:false,
  message:'Essai Parent non enregistré, aucun résultat de Tim modifié.'};
}
async function getMathEntProgress(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(id!==undefined&&id!==null){
  if(!mathEntId(id))throw new ApiFault(400,'invalid-math-ent-id');
  const doc=await db.get('mathEntAttempts/'+id);
  return {attempt:doc?.authorUid===TIM_UID?{...doc,id,xp:Number(doc.xp||0)}:null};
 }
 const records=await db.list('mathEntAttempts',50);
 return {attempts:records.filter(x=>mathEntId(x.id)&&x.data?.authorUid===TIM_UID).map(x=>({
  id:x.id,lessonId:x.data.lessonId,title:x.data.title,subject:'Mathématiques',
  score:x.data.score,total:10,source:x.data.source,
  correctFields:x.data.correctFields,fieldCount:x.data.fieldCount,
  xp:Number(x.data.xp||0),submittedAt:x.data.submittedAt||'',errorCounts:x.data.errorCounts||{}
 }))};
}
/* Exercice ENT original : même discipline de sécurité que l’Espagnol / Maths.
   Tim valide une fois ; son Parent peut faire des essais non enregistrés.
   Les bonnes réponses restent dans worker/physics-ent-training.mjs uniquement. */
async function getPhysicsEntTask(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(!physicsEntId(id))throw new ApiFault(400,'invalid-physics-ent-id');
 const task=physicsEntPublicTask(id);
 const old=await db.get('physicsEntAttempts/'+id);
 return {task,completed:Boolean(old?.authorUid===TIM_UID)};
}
async function submitPhysicsEntTask(db,uid,payload){
 permitted(uid,'tim');
 const id=payload?.id,answers=payload?.answers;
 if(!physicsEntId(id)||!Array.isArray(answers)||answers.length>20)
  throw new ApiFault(400,'invalid-physics-ent-answers');
 if(payload?.bankVersion!==PHYSICS_ENT_VERSION)
  throw new ApiFault(409,'stale-physics-ent-bank');
 let result,xp;
 try{
  result=physicsEntGrade(id,answers,payload.bankVersion);
  xp=spanishLessonXp(result.score,result.total);
 }catch{throw new ApiFault(400,'invalid-physics-ent-answers');}
 const tx=await db.transaction();
 const [old,weekRecord]=await Promise.all([
  db.get('physicsEntAttempts/'+id,tx),db.get('xpState/tim',tx)
 ]);
 if(old)throw new ApiFault(409,'already-exists');
 const today=parisDate(new Date()),week=mondayOf(today),state=weekRecord||{};
 const current=state.date===today?state:{earned:0,lost:0,bonus:0};
 const weekEarned=state.week===week?Number(state.weekEarned||0):0;
 const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
 const nextXP={
  date:today,week,
  earned:Number(current.earned||0)+xp,
  lost:Number(current.lost||0),
  bonus:Number(current.bonus||0),
  weekEarned:weekEarned+xp,
  weekXp:Math.max(0,weekXp+xp),
  policyVersion:18
 };
 await db.commit([
  createWrite('physicsEntAttempts/'+id,{
   ...result,xp,authorUid:uid,answers,version:1
  },NOW),
  upsertWrite('xpState/tim',nextXP,[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],tx);
 return {...result,xp,submitted:true,submittedAt:new Date().toISOString()};
}
async function previewPhysicsEntTask(db,uid,payload){
 permitted(uid,'parent');
 const id=payload?.id,answers=payload?.answers;
 if(!physicsEntId(id)||!Array.isArray(answers)||answers.length>20)
  throw new ApiFault(400,'invalid-physics-ent-answers');
 if(payload?.bankVersion!==PHYSICS_ENT_VERSION)
  throw new ApiFault(409,'stale-physics-ent-bank');
 let graded;
 try{graded=physicsEntGrade(id,answers,payload.bankVersion);}
 catch{throw new ApiFault(400,'invalid-physics-ent-answers');}
 return {...graded,practice:true,saved:false,submitted:false,xp:0,
  message:'Essai Parent, sans note ni XP et sans écriture en base de données.'};
}
async function getPhysicsEntProgress(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(id!==undefined&&id!==null){
  if(!physicsEntId(id))throw new ApiFault(400,'invalid-physics-ent-id');
  const x=await db.get('physicsEntAttempts/'+id);
  return {attempt:x?.authorUid===TIM_UID?{...x,id,xp:Number(x.xp||0)}:null};
 }
 const records=await db.list('physicsEntAttempts',100);
 return {attempts:records.filter(x=>physicsEntId(x.id)&&x.data?.authorUid===TIM_UID)
  .map(x=>({id:x.id,type:'ent',subject:'Physique-chimie',
   title:x.data.title,source:x.data.source,score:x.data.score,total:10,
   correctFields:x.data.correctFields,fieldCount:x.data.fieldCount,
   xp:Number(x.data.xp||0),submittedAt:x.data.submittedAt||'',
   errorCounts:x.data.errorCounts||{}}))};
}

/* Parcours Espagnol : résultats immédiats, zéro XP et tentative unique.
   Les questions sont publiques seulement après authentification, les clés
   de correction restent dans le serveur et ne sont renvoyées qu'après
   la validation enregistrée dans Firestore. */
async function getSpanishEntTrainingTask(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(!spanishEntTrainingId(id))throw new ApiFault(400,'invalid-exercise');
 const task=spanishEntPublicTask(id);
 const saved=await db.get('spanishEntTrainingAttempts/'+id);
 return {task,completed:Boolean(saved&&saved.authorUid===TIM_UID)};
}
/* Aperçu pédagogique du Parent : même correcteur que Tim, sans écriture ni XP.
   Toutes les bonnes réponses restent dans le module privé du Worker. */
async function previewSpanishEntTraining(db,uid,payload){
 permitted(uid,'parent');
 const id=payload?.id,answers=payload?.answers,translationsUsed=payload?.translationsUsed;
 if(!spanishEntTrainingId(id)||!Array.isArray(answers)||answers.length!==10||
    !Array.isArray(translationsUsed)||translationsUsed.length!==10||
    translationsUsed.some(v=>typeof v!=='boolean')||
    answers.some(v=>!((typeof v==='string'&&v.trim().length>0&&v.length<=200)||
      (Number.isInteger(v)&&v>=0&&v<=3))))
  throw new ApiFault(400,'invalid-spanish-preview');
 let report;
 try{report=gradeSpanishEntTask(id,answers,translationsUsed);}
 catch{throw new ApiFault(400,'invalid-spanish-preview');}
 return {...report,practice:true,submitted:false,saved:false,xp:0,
  message:'Essai Parent : aucun résultat ou XP enregistré pour Tim.'};
}
async function submitSpanishEntTraining(db,uid,payload){
 permitted(uid,'tim');
 const id=payload?.id,answers=payload?.answers,translationsUsed=payload?.translationsUsed;
 if(!spanishEntTrainingId(id)||!Array.isArray(answers)||answers.length!==10||
    !Array.isArray(translationsUsed)||translationsUsed.length!==10||
    translationsUsed.some(v=>typeof v!=='boolean')||
    answers.some(v=>!((typeof v==='string'&&v.trim().length>0&&v.length<=200)||(Number.isInteger(v)&&v>=0&&v<=3))))
   throw new ApiFault(400,'invalid-answers');
 let result,xp;
 try{
  result=gradeSpanishEntTask(id,answers,translationsUsed);
  xp=spanishLessonXp(result.score,result.total);
 }catch{throw new ApiFault(400,'invalid-answers');}
 // L'enregistrement du résultat et des XP se fait dans la même transaction.
 // Une tentative déjà enregistrée n'accorde jamais d'XP une seconde fois.
 const transaction=await db.transaction();
 const [old,xpRecord]=await Promise.all([
  db.get('spanishEntTrainingAttempts/'+id,transaction),
  db.get('xpState/tim',transaction)
 ]);
 if(old)throw new ApiFault(409,'already-exists');
 const today=parisDate(new Date()),week=mondayOf(today),state=xpRecord||{};
 const current=state.date===today?state:{earned:0,lost:0,bonus:0};
 const weekEarned=state.week===week?Number(state.weekEarned||0):0;
 const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
 const nextXP={
  date:today,week,
  earned:Number(current.earned||0)+xp,
  lost:Number(current.lost||0),
  bonus:Number(current.bonus||0),
  weekEarned:weekEarned+xp,
  weekXp:Math.max(0,weekXp+xp),policyVersion:18
 };
 await db.commit([
  createWrite('spanishEntTrainingAttempts/'+id,{
   ...result,xp,authorUid:uid,subject:'Espagnol',answers,translationsUsed,version:4
  },NOW),
  upsertWrite('xpState/tim',nextXP,[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],transaction);
 return {...result,xp,submitted:true,submittedAt:new Date().toISOString()};
}
async function getSpanishEntTrainingProgress(db,uid,payload){
 allowedFamily(uid);
 const id=payload?.id;
 if(id!==undefined && id!==null){
  if(!spanishEntTrainingId(id))throw new ApiFault(400,'invalid-exercise');
  const saved=await db.get('spanishEntTrainingAttempts/'+id);
  return {attempt:saved?.authorUid===TIM_UID?{...saved,id,xp:Number(saved.xp||0)}:null};
 }
 const docs=await db.list('spanishEntTrainingAttempts',100);
 return {attempts:docs.filter(r=>spanishEntTrainingId(r.id)&&r.data?.authorUid===TIM_UID)
   .map(r=>({id:r.id,lessonId:r.data.lessonId,series:r.data.series,
    score:r.data.score,total:r.data.total,translationHelpCount:r.data.translationHelpCount||0,errorCounts:r.data.errorCounts||{},submittedAt:r.data.submittedAt||'',xp:Number(r.data.xp||0)}))
   .sort((a,b)=>String(b.submittedAt).localeCompare(String(a.submittedAt)))};
}

/* Simulation pédagogique : Parent seulement, sans accès ni écriture Firestore.
   L'exercice et le corrigé sont reconstitués exclusivement sur le Worker.
   Toutes les questions peuvent être testées, même avec une copie incomplète. */
async function previewMixedChallenge(db,uid,payload){
 permitted(uid,'parent');
 const id=payload?.id,answers=payload?.answers,translationsUsed=payload?.translationsUsed||[];
 if(!isMixedMissionId(id))throw new ApiFault(400,'invalid-mixed-preview');
 const mission=mixedMission(id);
 if(!mission||!Array.isArray(answers)||answers.length!==mission.questions.length||
    answers.some(x=>typeof x!=='string'||x.length>2000)||
    !Array.isArray(translationsUsed)||translationsUsed.length>mission.questions.length||
    translationsUsed.some((v,i)=>typeof v!=='boolean'||
      (v===true&&mission.questions[i]?.subject!=='Espagnol')))
  throw new ApiFault(400,'invalid-mixed-preview');
 let graded;
 try{graded=gradeMixedMission(mission,answers,translationsUsed,{allowIncomplete:true});}
 catch{throw new ApiFault(400,'invalid-mixed-preview');}
 return {...graded,id,practice:true,saved:false,submitted:false,xp:0,
  message:'Simulation Parent non enregistrée : aucun résultat, aucune tentative, aucun XP de Tim modifié.'};
}
async function getMixedChallengePlan(db,uid){
 allowedFamily(uid);
 const plan=mixedPlan(new Date());
 return {...plan,exercises:plan.exercises.map(publicMixedMission)};
}
async function getSpanishDailyMissions(db,uid){
 allowedFamily(uid);
 const day=parisDate(new Date()),dailyIds=spanishDailyMissionIds(day);
 const exercises=dailyIds.map(id=>buildSpanishDailyMission(id)).filter(Boolean).map(sanitize);
 if(exercises.length!==dailyIds.length)throw new ApiFault(503,'mission-bank-incomplete');
 return {day,dailyIds,exercises};
}

const ACTIONS={
 previewSpanishEntTraining:previewSpanishEntTraining,
 getMathEntTask:getMathEntTask,
 submitMathEntTask:submitMathEntTask,
 previewMathEntTask:previewMathEntTask,
 getMathEntProgress:getMathEntProgress,
 getPhysicsEntTask:getPhysicsEntTask,
 submitPhysicsEntTask:submitPhysicsEntTask,
 previewPhysicsEntTask:previewPhysicsEntTask,
 getPhysicsEntProgress:getPhysicsEntProgress,
 getEnglishTrainingTask:getEnglishTrainingTask,
 submitEnglishTraining:submitEnglishTraining,
 getEnglishTrainingProgress:getEnglishTrainingProgress,
 previewEnglishTraining:previewEnglishTraining,
 getPhysicsTrainingTask:getPhysicsTrainingTask,
 submitPhysicsTraining:submitPhysicsTraining,
 getPhysicsTrainingProgress:getPhysicsTrainingProgress,
 previewPhysicsTraining:previewPhysicsTraining,
 getSpanishDailyMissions:getSpanishDailyMissions,
 getMixedChallengePlan:getMixedChallengePlan,
 previewMixedChallenge:previewMixedChallenge,
 getSpanishEntTrainingTask:getSpanishEntTrainingTask,
 submitSpanishEntTraining:submitSpanishEntTraining,
 getSpanishEntTrainingProgress:getSpanishEntTrainingProgress,
 getMathTrainingTask:getMathTrainingTask,
 importMathPrivateQuiz:importMathPrivateQuiz,
 submitMathTraining:submitMathTraining,
 getMathTrainingProgress:getMathTrainingProgress,
 getParentReport:parentReport,
 submitTimExercise:submitExercise,
 setParentCorrectionRelease:releaseCorrection,
 getTimReleasedCorrections:releasedCorrections,
 getTimCourseContent:courseContent,
 getSpanishTrainingProgress:oldTrainingProgress
};
export async function handleRequest(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/status'&&request.method==='GET')
  return respond({available:Boolean(env.FIREBASE_SERVICE_ACCOUNT),platform:'cloudflare-pages',lessonTrainingXpPolicy:'7-5-0-v1',mixedChallengesVersion:'mixed-202611-v1',mixedDailyRollout:'2026-11-13-separate-ids',features:{physicsParentPreview:true,physicsEntInteractive:true,physicsEntOriginalTasks:2,mathEntInteractive:true,mathEntOriginalTasks:2,spanishParentPreview:true,mixedParentPreview:true}});
 if(url.pathname!=='/api/tim')return respond({error:'not-found'},404);
 try{
  if(request.method!=='POST')throw new ApiFault(405,'method-not-allowed');
  checkOrigin(request);
  if(Number(request.headers.get('Content-Length')||0)>70000)throw new ApiFault(413,'too-large');
  const uid=await verifyFirebaseToken(request.headers.get('Authorization'));
  let data;
  try{data=await request.json();}catch{throw new ApiFault(400,'invalid-json');}
  if(!data||typeof data.action!=='string'||!ACTIONS[data.action])
   throw new ApiFault(400,'unknown-action');
  if(JSON.stringify(data).length>70000)throw new ApiFault(413,'too-large');
  const db=await firestore(env);
  const result=await ACTIONS[data.action](db,uid,data.payload||{},env);
  return respond({data:result});
 }catch(error){
  const {status,code}=faultMessage(error);
  // Never return upstream Google errors, secrets or student data.
  return respond({error:code},status);
 }
}
export const TESTABLE={getEnglishTrainingTask,submitEnglishTraining,getEnglishTrainingProgress,previewEnglishTraining,previewSpanishEntTraining,getMathEntTask,submitMathEntTask,previewMathEntTask,getMathEntProgress,getPhysicsEntTask,submitPhysicsEntTask,previewPhysicsEntTask,getPhysicsEntProgress,previewPhysicsTraining,getPhysicsTrainingTask,submitPhysicsTraining,getPhysicsTrainingProgress,sanitize,resolveExercise,submitExercise,getSpanishDailyMissions,getMixedChallengePlan,previewMixedChallenge,courseContent,parentReport,releaseCorrection,releasedCorrections,oldTrainingProgress,getMathTrainingTask,submitMathTraining,getMathTrainingProgress,importMathPrivateQuiz,getSpanishEntTrainingTask,submitSpanishEntTraining,getSpanishEntTrainingProgress};
