import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {grade} from './grading.mjs';
import {rawPoints,cappedPoints} from './xp.mjs';
import {suggestedCorrectionAt} from './schedule.mjs';
initializeApp();
const db=getFirestore();
const timUid=process.env.TIM_STUDENT_UID,parentUid=process.env.TIM_PARENT_UID;
const validId=id=>typeof id==='string'&&/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(id);
function role(request,which){const uid=which==='tim'?timUid:parentUid;if(!uid||request.auth?.uid!==uid)throw new HttpsError('permission-denied','Accès non autorisé');}
function parisDate(d){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
export const submitTimExercise=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'tim');
 const {id,answers}=request.data||{};
 if(!validId(id)||!Array.isArray(answers))throw new HttpsError('invalid-argument','Exercice invalide');
 const exerciseRef=db.doc('publicExercises/'+id),keyRef=db.doc('answerKeys/'+id),attemptRef=db.doc('attempts/'+id),privateRef=db.doc('privateAttempts/'+id),xpRef=db.doc('xpState/tim');
 try{return await db.runTransaction(async tx=>{
  const [exDoc,keyDoc,attemptDoc,privateDoc,xpDoc]=await Promise.all([tx.get(exerciseRef),tx.get(keyRef),tx.get(attemptRef),tx.get(privateRef),tx.get(xpRef)]);
  if(!exDoc.exists||!keyDoc.exists)throw new HttpsError('not-found','Exercice indisponible');
  if(attemptDoc.exists||privateDoc.exists)throw new HttpsError('already-exists','Déjà validé');
  const ex=exDoc.data();
  if(ex.enabled!==true)throw new HttpsError('failed-precondition','Exercice fermé');
  const result=grade(ex,keyDoc.data(),answers);
  const now=new Date(),date=parisDate(now),state=xpDoc.exists?xpDoc.data():{};
  const monday=new Date(date+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
  const week=monday.toISOString().slice(0,10),today=state.date===date?state:{earned:0,lost:0,bonus:0};
  const weekEarned=state.week===week?Number(state.weekEarned||0):0;
  const category=ex.category||'school';
  const raw=rawPoints({kind:ex.kind,category,score:result.score,total:result.total,needsReview:result.needsReview});
  const xp=cappedPoints(raw,Number(today.earned||0),Number(today.lost||0),weekEarned,Number(today.bonus||0),category);
  tx.set(xpRef,{date,week,earned:Number(today.earned||0)+Math.max(0,xp),lost:Number(today.lost||0)+Math.max(0,-xp),bonus:Number(today.bonus||0)+(category==='bonus'?Math.max(0,xp):0),weekEarned:weekEarned+Math.max(0,xp),updatedAt:FieldValue.serverTimestamp()});
  const common={exerciseId:id,authorUid:request.auth.uid,submittedAt:FieldValue.serverTimestamp(),score:result.score,total:result.total,needsReview:result.needsReview,policyVersion:17};
  tx.create(attemptRef,{...common,xp,responses:answers.map(v=>String(v)),suggestedReleaseAt:suggestedCorrectionAt(ex,date)});
  tx.create(privateRef,{...common,...result});
  return {id,submitted:true,correctionLocked:true};
 });}catch(error){if(error instanceof HttpsError)throw error;throw new HttpsError('internal','Échec de validation');}
});
export const getParentReport=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'parent');
 const snap=await db.collection('privateAttempts').limit(1000).get();
 const attempts=await Promise.all(snap.docs.map(async d=>{
  const [record,ex]=await Promise.all([db.doc('attempts/'+d.id).get(),db.doc('publicExercises/'+d.id).get()]);
  const data=record.exists?record.data():{};
  return {id:d.id,title:ex.exists?(ex.data().title||d.id):d.id,score:data.score??d.get('score')??0,total:data.total??d.get('total')??0,needsReview:Boolean(data.needsReview??d.get('needsReview')),xp:data.xp??0};
 }));
 return {attempts};
});
export const getTimReleasedCorrections=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'tim');
 const [attempts,releases]=await Promise.all([db.collection('attempts').where('authorUid','==',request.auth.uid).limit(1000).get(),db.collection('releasedCorrections').limit(1000).get()]);
 const ids=new Set(attempts.docs.map(d=>d.id)),now=Date.now();
 const eligible=releases.docs.filter(d=>ids.has(d.id)&&d.get('released')===true&&typeof d.get('releaseAt')?.toMillis==='function'&&d.get('releaseAt').toMillis()<=now);
 const docs=await Promise.all(eligible.map(d=>db.doc('privateAttempts/'+d.id).get()));
 return {corrections:docs.filter(d=>d.exists).map(d=>({id:d.id,answers:d.data().answers||[],score:d.data().score,total:d.data().total}))};
});
export const setParentCorrectionRelease=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'parent');
 const {id,releaseAt,released}=request.data||{},millis=Date.parse(releaseAt);
 if(!validId(id)||typeof released!=='boolean'||!Number.isFinite(millis)||millis<Date.UTC(2026,0,1)||millis>Date.now()+366*86400000)throw new HttpsError('invalid-argument','Paramètres invalides');
 const attempt=await db.doc('attempts/'+id).get();
 if(!attempt.exists)throw new HttpsError('not-found','Tentative introuvable');
 // Parent may postpone, never advance the release before the scheduled class at 18:00 Paris.
 const earliest=attempt.get('suggestedReleaseAt');
 if(released===true){
   if(typeof earliest!=='string'||!Number.isFinite(Date.parse(earliest)))throw new HttpsError('failed-precondition','Horaire scolaire non validé');
   if(millis<Date.parse(earliest))throw new HttpsError('failed-precondition','Correction avant la fin du cours à 18 h');
 }
 await db.doc('releasedCorrections/'+id).set({released,releaseAt:new Date(millis),updatedAt:FieldValue.serverTimestamp()});
 return {saved:true,id,released,releaseAt:new Date(millis).toISOString()};
});
