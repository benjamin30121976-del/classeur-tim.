import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {grade} from './grading.mjs';
import {rawPoints,cappedPoints} from './xp.mjs';
initializeApp();
const db=getFirestore();
const timUid=process.env.TIM_STUDENT_UID||'uqZI3Up97YWzKvWhssWQidn4TJO2',parentUid=process.env.TIM_PARENT_UID||'BPEuNAhHVyX8ewQ2I54s56m11vj1';
const validId=id=>typeof id==='string'&&/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(id);
function role(request,which){const uid=which==='tim'?timUid:parentUid;if(!uid||request.auth?.uid!==uid)throw new HttpsError('permission-denied','Accès non autorisé');}
function parisDate(d){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const get=t=>p.find(x=>x.type===t).value;return `${get('year')}-${get('month')}-${get('day')}`;}
async function resolveExercise(id){
 const [publicDoc,keyDoc]=await Promise.all([db.doc('publicExercises/'+id).get(),db.doc('answerKeys/'+id).get()]);
 if(publicDoc.exists&&keyDoc.exists)return {exercise:publicDoc.data(),key:keyDoc.data()};
 const [source,extra]=await Promise.all([db.doc('content/main').get(),db.doc('exercises/'+id).get()]);
 let exercise;
 if(extra.exists){const v=extra.data();exercise=decodeCourse(v.payloadJson?JSON.parse(v.payloadJson):v);}
 if(!exercise&&source.exists){const raw=source.data();const data=decodeCourse(raw?.payloadJson?JSON.parse(raw.payloadJson):raw);exercise=(data.exercises||[]).find(x=>x.id===id);}
 if(!exercise)throw new HttpsError('not-found','Exercice introuvable');
 return {exercise:{...sanitizeCourse(exercise),enabled:true},key:{questions:(exercise.questions||[]).map(q=>({right:q.right,also:q.also,why:q.why}))}};
}
export const submitTimExercise=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'tim');
 const {id,answers}=request.data||{};
 if(!validId(id)||!Array.isArray(answers)||answers.length>100||answers.some(v=>!['string','number','boolean'].includes(typeof v)||String(v).length>2000))throw new HttpsError('invalid-argument','Exercice invalide');
 const attemptRef=db.doc('attempts/'+id),privateRef=db.doc('privateAttempts/'+id),xpRef=db.doc('xpState/tim');
 const resolved=await resolveExercise(id);
 try{return await db.runTransaction(async tx=>{
  const [attemptDoc,privateDoc,xpDoc]=await Promise.all([tx.get(attemptRef),tx.get(privateRef),tx.get(xpRef)]);

  if(attemptDoc.exists||privateDoc.exists)throw new HttpsError('already-exists','Déjà validé');
  const ex=resolved.exercise;
  if(ex.enabled!==true)throw new HttpsError('failed-precondition','Exercice fermé');
  const now=new Date(),date=parisDate(now),state=xpDoc.exists?xpDoc.data():{};
  const result=grade(ex,resolved.key,answers);
  const monday=new Date(date+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
  const week=monday.toISOString().slice(0,10),today=state.date===date?state:{earned:0,lost:0,bonus:0};
  const weekEarned=state.week===week?Number(state.weekEarned||0):0;
  const category=ex.category||'school';
  const raw=rawPoints({kind:ex.kind,category,score:result.score,total:result.total,needsReview:result.needsReview});
  const xp=cappedPoints(raw,Number(today.earned||0),Number(today.lost||0),weekEarned,Number(today.bonus||0),category);
  tx.set(xpRef,{date,week,earned:Number(today.earned||0)+Math.max(0,xp),lost:Number(today.lost||0)+Math.max(0,-xp),bonus:Number(today.bonus||0)+(category==='bonus'?Math.max(0,xp):0),weekEarned:weekEarned+Math.max(0,xp),updatedAt:FieldValue.serverTimestamp()});
  const common={exerciseId:id,authorUid:request.auth.uid,submittedAt:FieldValue.serverTimestamp(),score:result.score,total:result.total,needsReview:result.needsReview,policyVersion:17};
  tx.create(attemptRef,{exerciseId:id,authorUid:request.auth.uid,submittedAt:FieldValue.serverTimestamp(),policyVersion:17,xp,correctionStatus:'pending-parent'});
  tx.create(privateRef,{...common,...result});
  return {id,submitted:true,xp,correctionLocked:true,correctionStatus:'pending-parent'};
 });}catch(error){if(error instanceof HttpsError)throw error;throw new HttpsError('internal','Échec de validation');}
});
export const getParentReport=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'parent');
 const snap=await db.collection('privateAttempts').limit(1000).get();
 const attempts=await Promise.all(snap.docs.map(async d=>{
  const [record,ex]=await Promise.all([db.doc('attempts/'+d.id).get(),db.doc('publicExercises/'+d.id).get()]);
  const data=record.exists?record.data():{};
  return {id:d.id,title:ex.exists?(ex.data().title||d.id):d.id,score:d.get('score')??0,total:d.get('total')??0,needsReview:Boolean(d.get('needsReview')),xp:data.xp??0,correctionStatus:data.correctionStatus==='released'?'released':'pending-parent'};
 }));
 return {attempts,pendingCorrections:attempts.filter(a=>a.correctionStatus==='pending-parent').length};
});
export const getTimReleasedCorrections=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'tim');
 const [attempts,releases]=await Promise.all([db.collection('attempts').where('authorUid','==',request.auth.uid).limit(1000).get(),db.collection('releasedCorrections').limit(1000).get()]);
 const eligibleAttempts=new Map(attempts.docs.map(d=>[d.id,d.data()]));
 const settings=new Map(releases.docs.map(d=>[d.id,d.data()]));
 const eligible=[...eligibleAttempts.entries()].filter(([id,a])=>a.correctionStatus==='released'&&settings.get(id)?.released===true).map(([id])=>({id}));
 const docs=await Promise.all(eligible.map(d=>db.doc('privateAttempts/'+d.id).get()));
 return {corrections:docs.filter(d=>d.exists).map(d=>({id:d.id,answers:d.data().answers||[],score:d.data().score,total:d.data().total}))};
});
export const setParentCorrectionRelease=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'parent');
 const {id,released}=request.data||{};
 if(!validId(id)||typeof released!=='boolean')throw new HttpsError('invalid-argument','Paramètres invalides');
 const attemptRef=db.doc('attempts/'+id),releaseRef=db.doc('releasedCorrections/'+id);
 await db.runTransaction(async tx=>{
  const attempt=await tx.get(attemptRef);
  if(!attempt.exists)throw new HttpsError('not-found','Tentative introuvable');
  tx.update(attemptRef,{correctionStatus:released?'released':'pending-parent'});
  tx.set(releaseRef,{released,updatedAt:FieldValue.serverTimestamp()});
 });
 return {saved:true,id,released};
});

// Read-only course view: Firebase Admin reads private source, but sends no answer keys to Tim.
const PRIVATE_COURSE_FIELDS=new Set(['right','also','why','expected','answer','answers','answerKey','answerKeys','solution','solutions','correction','corrections','explanation','rubric']);
function decodeCourse(value){
 if(Array.isArray(value))return value.map(decodeCourse);
 if(value&&typeof value==='object'){
  if(Object.keys(value).length===1&&Array.isArray(value.__tim_nested_array_v1))return value.__tim_nested_array_v1.map(decodeCourse);
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,decodeCourse(v)]));
 }
 return value;
}
function sanitizeCourse(value){
 if(Array.isArray(value))return value.map(sanitizeCourse);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!PRIVATE_COURSE_FIELDS.has(k)).map(([k,v])=>[k,sanitizeCourse(v)]));
 return value;
}
export const getTimCourseContent=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'tim');
 const source=await db.doc('content/main').get();
 if(!source.exists)throw new HttpsError('not-found','Cours non importés');
 const raw=source.data();
 const content=decodeCourse(raw?.payloadJson?JSON.parse(raw.payloadJson):raw);
 const [lessons,exercises]=await Promise.all([db.collection('lessons').limit(500).get(),db.collection('exercises').limit(500).get()]);
 const parse=d=>{const v=d.data();return decodeCourse(v.payloadJson?JSON.parse(v.payloadJson):v);};
 const additions={lessons:lessons.docs.map(parse),exercises:exercises.docs.map(parse)};
 return {content:sanitizeCourse(content),additions:sanitizeCourse(additions)};
});
