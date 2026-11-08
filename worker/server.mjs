/* School backend for Cloudflare Pages + Firebase Spark.
   Every action verifies a signed Firebase ID token, then enforces the Tim/Parent role.
   No answer key, credential or student grade is served to anonymous visitors. */
import {PROJECT,TIM_UID,PARENT_UID,ApiFault,verifyFirebaseToken} from './auth.mjs';
import {firestore,createWrite,upsertWrite,updateWrite,NOW} from './firestore.mjs';
import {grade} from '../functions/grading.mjs';
import {rawPoints,cappedPoints} from '../functions/xp.mjs';
import {buildMission,isMissionId,isMissionOpen} from '../functions/missions-v18.mjs';
import {mathId,mathTask,mathPublicTask,gradeMathTask} from './maths-training-curriculum.mjs';

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
 if(isMissionId(id)){
  const source=await db.get('content/main'),mission=buildMission(id,source);
  if(!mission)throw new ApiFault(404,'mission-not-found');
  if(!isMissionOpen(mission))throw new ApiFault(409,'mission-not-open');
  return {exercise:{...sanitize(mission),enabled:true},key:{questions:mission.questions.map(q=>({right:q.right,also:q.also,why:q.why}))}};
 }
 const extra=await db.get('exercises/'+id);
 let raw=extra;
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
 const {id,answers}=payload;
 if(!validId(id)||!Array.isArray(answers)||answers.length>30||
  answers.some(x=>!['string','number','boolean'].includes(typeof x)||String(x).length>2000))
  throw new ApiFault(400,'invalid-exercise');
 const {exercise,key}=await resolveExercise(db,id);
 if(exercise.enabled!==true)throw new ApiFault(409,'exercise-closed');
 let evaluated;
 try{evaluated=grade(exercise,key,answers);}catch{throw new ApiFault(400,'invalid-answers');}
 const transaction=await db.transaction();
 const [publicRecord,privateRecord,xpRecord]=await Promise.all([
  db.get('attempts/'+id,transaction),db.get('privateAttempts/'+id,transaction),db.get('xpState/tim',transaction)
 ]);
 if(publicRecord||privateRecord)throw new ApiFault(409,'already-exists');
 const today=parisDate(new Date()),week=mondayOf(today),state=xpRecord||{};
 const current=state.date===today?state:{earned:0,lost:0,bonus:0};
 const weekEarned=state.week===week?Number(state.weekEarned||0):0;
 const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
 const category=exercise.category||'school';
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
  policyVersion:18,...evaluated
 };
 const pending={
  exerciseId:id,authorUid:uid,policyVersion:18,xp:points,correctionStatus:'pending-parent'
 };
 await db.commit([
  createWrite('attempts/'+id,pending,NOW),
  createWrite('privateAttempts/'+id,details,NOW),
  upsertWrite('xpState/tim',stateAfter,[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}])
 ],transaction);
 return {id,submitted:true,xp:points,correctionLocked:true,correctionStatus:'pending-parent'};
}
async function parentReport(db,uid){
 permitted(uid,'parent');
 const [notes,attempts]=await Promise.all([db.list('privateAttempts',1000),db.list('attempts',1000)]);
 const attemptById=new Map(attempts.map(x=>[x.id,x.data]));
 const records=notes.map(x=>{
  const a=attemptById.get(x.id)||{},n=x.data||{};
  return {id:x.id,title:String(n.title||x.id),score:n.score??null,total:n.total??null,
   needsReview:Boolean(n.needsReview),xp:a.xp??0,
   correctionStatus:a.correctionStatus==='released'?'released':'pending-parent'};
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
  id:x.id,answers:x.details.answers||[],score:x.details.score,total:x.details.total
 }))};
}
async function courseContent(db,uid){
 permitted(uid,'tim');
 const [main,lessons,exercises]=await Promise.all([
  db.get('content/main'),db.list('lessons',500),db.list('exercises',500)
 ]);
 if(!main||!Array.isArray(main.lessons)||!Array.isArray(main.exercises))
  throw new ApiFault(404,'course-not-found');
 return {content:sanitize(main),
  additions:sanitize({lessons:lessons.map(x=>x.data),exercises:exercises.map(x=>x.data)})};
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
async function getMathTrainingTask(db,uid,payload){
 allowedFamily(uid);
 if(!mathId(payload?.id))throw new ApiFault(400,'invalid-exercise');
 const task=mathPublicTask(payload.id);
 if(!task)throw new ApiFault(404,'exercise-not-found');
 const existing=await db.get('mathTrainingAttempts/'+payload.id);
 return {task,completed:Boolean(existing&&existing.authorUid===TIM_UID)};
}
async function submitMathTraining(db,uid,payload){
 permitted(uid,'tim');
 const id=payload?.id,answers=payload?.answers;
 if(!mathId(id)||!Array.isArray(answers)||answers.length!==2||
    answers.some(x=>!Number.isInteger(x)||x<0||x>3))
  throw new ApiFault(400,'invalid-answers');
 let result;
 try{result=gradeMathTask(id,answers);}
 catch{throw new ApiFault(400,'invalid-answers');}
 const tx=await db.transaction();
 const existing=await db.get('mathTrainingAttempts/'+id,tx);
 if(existing)throw new ApiFault(409,'already-exists');
 await db.commit([createWrite('mathTrainingAttempts/'+id,{
   ...result,authorUid:uid,subject:'Mathématiques',answers,
   title:mathTask(id).title,version:1
 },NOW)],tx);
 return {...result,submitted:true,submittedAt:new Date().toISOString()};
}
async function getMathTrainingProgress(db,uid){
 allowedFamily(uid);
 const attempts=await db.list('mathTrainingAttempts',100);
 return {attempts:attempts.filter(x=>mathId(x.id)&&x.data?.authorUid===TIM_UID)
   .map(x=>({...x.data,id:x.id,xp:0})).sort((a,b)=>String(b.submittedAt||'').localeCompare(String(a.submittedAt||'')))};
}

const ACTIONS={
 getMathTrainingTask:getMathTrainingTask,
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
  return respond({available:Boolean(env.FIREBASE_SERVICE_ACCOUNT),platform:'cloudflare-pages'});
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
  const result=await ACTIONS[data.action](db,uid,data.payload||{});
  return respond({data:result});
 }catch(error){
  const {status,code}=faultMessage(error);
  // Never return upstream Google errors, secrets or student data.
  return respond({error:code},status);
 }
}
export const TESTABLE={sanitize,resolveExercise,submitExercise,courseContent,parentReport,releaseCorrection,releasedCorrections,oldTrainingProgress,getMathTrainingTask,submitMathTraining,getMathTrainingProgress};
