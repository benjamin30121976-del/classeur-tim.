import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {grade} from './grading.mjs';
import {rawPoints,cappedPoints} from './xp.mjs';
import {buildMission,isMissionId,isMissionOpen} from './missions-v18.mjs';
import {spanishNov05Exercises} from './spanish-nov05-private.mjs';
import {SPANISH_COURSE} from './spanish-training-curriculum.mjs';
import {buildSpanishTasks,evaluateSpanishTask} from './spanish-training-engine.mjs';
import {nov12IdValid,nov12TaskPublic,nov12Evaluate,nov12TaskIds} from './spanish-nov12-training.mjs';
initializeApp();
const db=getFirestore();
const timUid=process.env.TIM_STUDENT_UID||'uqZI3Up97YWzKvWhssWQidn4TJO2',parentUid=process.env.TIM_PARENT_UID||'BPEuNAhHVyX8ewQ2I54s56m11vj1';
const validId=id=>typeof id==='string'&&/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(id);
const parentBonusId=id=>typeof id==='string'&&/^BONUS_[A-Za-z0-9]{20}$/.test(id);
function role(request,which){const uid=which==='tim'?timUid:parentUid;if(!uid||request.auth?.uid!==uid)throw new HttpsError('permission-denied','Accès non autorisé');}
function parisDate(d){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const get=t=>p.find(x=>x.type===t).value;return `${get('year')}-${get('month')}-${get('day')}`;}
async function resolveExercise(id){
 if(parentBonusId(id)){
  const doc=await db.doc('settings/parentBonusCurrent').get();
  const assigned=doc.exists?doc.data():null;
  if(assigned?.id!==id||!validId(assigned.sourceId)||parentBonusId(assigned.sourceId))
   throw new HttpsError('failed-precondition','Ce défi bonus n’est plus actif.');
  const source=await resolveExercise(assigned.sourceId);
  if(source.exercise.kind)throw new HttpsError('failed-precondition','Exercice bonus invalide.');
  return {exercise:{...source.exercise,id,kind:'bonus-parent',category:'challenge',title:'Défi bonus · '+source.exercise.title,enabled:true},key:source.key};
 }
 if(isMissionId(id)){
  const doc=await db.doc('content/main').get();
  const main=doc.exists?decodeCourse(doc.data()?.payloadJson?JSON.parse(doc.data().payloadJson):doc.data()):null;
  const mission=buildMission(id,main,SPANISH_COURSE);
  if(!mission)throw new HttpsError('not-found','Défi introuvable');
  if(!isMissionOpen(mission))throw new HttpsError('failed-precondition','Défi fermé');
  return {exercise:{...sanitizeCourse(mission),enabled:true},key:{questions:mission.questions.map(q=>({right:q.right,also:q.also,why:q.why}))}};
 }
 const spanish=spanishNov05Exercises.find(ex=>ex.id===id);
 if(spanish)return {exercise:{...sanitizeCourse(spanish),enabled:spanish.enabled!==false},key:{questions:spanish.questions.map(q=>({right:q.right,also:q.also,why:q.why}))}};

 const [publicDoc,keyDoc]=await Promise.all([db.doc('publicExercises/'+id).get(),db.doc('answerKeys/'+id).get()]);
 if(publicDoc.exists&&keyDoc.exists){const exercise=publicDoc.data();return {exercise:{...exercise,enabled:exercise.enabled!==false},key:keyDoc.data()};}
 const [source,extra]=await Promise.all([db.doc('content/main').get(),db.doc('exercises/'+id).get()]);
 let exercise;
 if(extra.exists){const v=extra.data();exercise=decodeCourse(v.payloadJson?JSON.parse(v.payloadJson):v);}
 if(!exercise&&source.exists){const raw=source.data();const data=decodeCourse(raw?.payloadJson?JSON.parse(raw.payloadJson):raw);exercise=(data.exercises||[]).find(x=>x.id===id);}
 if(!exercise)throw new HttpsError('not-found','Exercice introuvable');
 return {exercise:{...sanitizeCourse(exercise),enabled:exercise.enabled!==false},key:{questions:(exercise.questions||[]).map(q=>({right:q.right,also:q.also,why:q.why}))}};
}
export const submitTimExercise=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'tim');
 const {id,answers}=request.data||{};
 if(!validId(id)||!Array.isArray(answers)||answers.length>100||answers.some(v=>!['string','number','boolean'].includes(typeof v)||String(v).length>2000))throw new HttpsError('invalid-argument','Exercice invalide');
 const attemptRef=db.doc('attempts/'+id),privateRef=db.doc('privateAttempts/'+id),xpRef=db.doc('xpState/tim');
 const resolved=await resolveExercise(id);
 try{return await db.runTransaction(async tx=>{
  const bonusRef=parentBonusId(id)?db.doc('settings/parentBonusCurrent'):null;
  const [attemptDoc,privateDoc,xpDoc,activeBonus]=await Promise.all([tx.get(attemptRef),tx.get(privateRef),tx.get(xpRef),bonusRef?tx.get(bonusRef):Promise.resolve(null)]);
  if(bonusRef&&(!activeBonus?.exists||activeBonus.data()?.id!==id))throw new HttpsError('failed-precondition','Défi bonus retiré ou remplacé.');

  if(attemptDoc.exists||privateDoc.exists)throw new HttpsError('already-exists','Déjà validé');
  const ex=resolved.exercise,autoRelease=isMissionId(id)||parentBonusId(id);
  if(ex.enabled!==true)throw new HttpsError('failed-precondition','Exercice fermé');
  const now=new Date(),date=parisDate(now),state=xpDoc.exists?xpDoc.data():{};
  const result=grade(ex,resolved.key,answers);
  const monday=new Date(date+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
  const week=monday.toISOString().slice(0,10),today=state.date===date?state:{earned:0,lost:0,bonus:0};
  const weekEarned=state.week===week?Number(state.weekEarned||0):0;
  const weekXp=state.week===week?Number(state.weekXp??state.weekEarned??0):0;
  const category=ex.category||'school';
  const raw=rawPoints({kind:ex.kind,category,score:result.score,total:result.total,needsReview:result.needsReview});
  const xp=cappedPoints(raw,Number(today.earned||0),Number(today.lost||0),weekEarned,Number(today.bonus||0),category);
  tx.set(xpRef,{date,week,earned:Number(today.earned||0)+Math.max(0,xp),lost:Number(today.lost||0)+Math.max(0,-xp),bonus:Number(today.bonus||0)+(category==='bonus'?Math.max(0,xp):0),weekEarned:weekEarned+Math.max(0,xp),weekXp:Math.max(0,weekXp+xp),policyVersion:18,updatedAt:FieldValue.serverTimestamp()});
  const common={exerciseId:id,title:String(ex.title||id).slice(0,200),authorUid:request.auth.uid,submittedAt:FieldValue.serverTimestamp(),score:result.score,total:result.total,needsReview:result.needsReview,policyVersion:18};
  tx.create(attemptRef,{exerciseId:id,authorUid:request.auth.uid,submittedAt:FieldValue.serverTimestamp(),policyVersion:18,xp,correctionStatus:autoRelease?'released':'pending-parent'});
  tx.create(privateRef,{...common,...result});
  if(autoRelease)tx.set(db.doc('releasedCorrections/'+id),{released:true,updatedAt:FieldValue.serverTimestamp()});
  return autoRelease?{id,submitted:true,xp,correctionLocked:false,correctionStatus:'released',score:result.score,total:result.total,answers:result.answers}:
   {id,submitted:true,xp,correctionLocked:true,correctionStatus:'pending-parent'};
 });}catch(error){if(error instanceof HttpsError)throw error;throw new HttpsError('internal','Échec de validation');}
});
// Défi bonus exceptionnel de 5 XP : un exercice choisi par le parent, validation unique par Tim.
export const assignParentBonus=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'parent');
 const sourceId=request.data?.sourceId;
 if(!validId(sourceId)||parentBonusId(sourceId)||isMissionId(sourceId))
  throw new HttpsError('invalid-argument','Choisis un exercice existant.');
 const source=await resolveExercise(sourceId);
 if(source.exercise.kind||!Array.isArray(source.exercise.questions)||source.exercise.questions.length<10)
  throw new HttpsError('failed-precondition','Le défi bonus exige un exercice de 10 questions minimum.');
 if((await db.doc('attempts/'+sourceId).get()).exists)
  throw new HttpsError('failed-precondition','Cet exercice a déjà été validé.');
 const id='BONUS_'+db.collection('settings').doc().id;
 await db.doc('settings/parentBonusCurrent').set({
  id,sourceId,title:String(source.exercise.title||sourceId).slice(0,180),
  assignedAt:FieldValue.serverTimestamp(),assignedBy:request.auth.uid,maxXP:5
 });
 return {assigned:true,id,sourceId,maxXP:5};
});
export const getParentBonus=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 const uid=request.auth?.uid;
 if(uid!==timUid&&uid!==parentUid)throw new HttpsError('permission-denied','Réservé aux comptes Tim et Parent.');
 const doc=await db.doc('settings/parentBonusCurrent').get();
 if(!doc.exists)return {exercise:null};
 const assigned=doc.data();
 if(!parentBonusId(assigned.id)||!validId(assigned.sourceId))return {exercise:null};
 const attempt=await db.doc('attempts/'+assigned.id).get();
 try{
  const source=await resolveExercise(assigned.sourceId);
  const ex=sanitizeCourse({...source.exercise,id:assigned.id,kind:'bonus-parent',
   category:'challenge',title:'Défi bonus · '+source.exercise.title,
   description:'Défi personnalisé du parent · jusqu’à 5 XP · une seule validation.',
   enabled:true});
  return {exercise:ex,completed:attempt.exists,maxXP:5};
 }catch(error){console.warn('Défi bonus inaccessible:',error?.message);return {exercise:null};}
});
export const getParentReport=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'parent');
 const snap=await db.collection('privateAttempts').limit(1000).get();
 const attempts=await Promise.all(snap.docs.map(async d=>{
  const [record,ex]=await Promise.all([db.doc('attempts/'+d.id).get(),db.doc('publicExercises/'+d.id).get()]);
  const data=record.exists?record.data():{};
  return {id:d.id,title:d.get('title')||(ex.exists?ex.data().title:d.id)||d.id,score:d.get('score')??0,total:d.get('total')??0,needsReview:Boolean(d.get('needsReview')),xp:data.xp??0,correctionStatus:data.correctionStatus==='released'?'released':'pending-parent'};
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


/* Un essai unique, sans XP, pour chacun des 150 entraînements espagnols.
   Aucune écriture directe depuis le navigateur : les réponses sont corrigées
   puis enregistrées atomiquement côté serveur. Les corrections restent
   consultables ensuite par Tim et son parent. */
export const submitSpanishTraining=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'tim');
 const {id,answers}=request.data||{};
 const task=buildSpanishTasks(id,SPANISH_COURSE);
 if(!task||!Array.isArray(answers)||answers.length!==10||
    answers.some(v=>!['string','number'].includes(typeof v)||String(v).length>300))
  throw new HttpsError('invalid-argument','Exercice ou réponses invalides.');
 const evaluated=evaluateSpanishTask(task,answers);
 const ref=db.doc('spanishTrainingAttempts/'+id);
 try{
  return await db.runTransaction(async tx=>{
   const existing=await tx.get(ref);
   if(existing.exists)throw new HttpsError('already-exists','Cet exercice a déjà été validé. Tu peux consulter la correction, sans le refaire.');
   tx.create(ref,{
    id,authorUid:request.auth.uid,lessonId:task.lesson,mode:task.mode,
    series:task.series,score:evaluated.score,total:10,
    submittedAt:FieldValue.serverTimestamp(),xp:0,
    items:evaluated.items,version:1
   });
   return {...evaluated,submitted:true,xp:0};
  });
 }catch(error){
  if(error instanceof HttpsError)throw error;
  throw new HttpsError('internal','Enregistrement indisponible : aucune validation confirmée.');
 }
});
export const getSpanishTrainingProgress=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 const uid=request.auth?.uid;
 if(uid!==timUid&&uid!==parentUid)throw new HttpsError('permission-denied','Réservé à Tim et à son parent.');
 const snapshot=await db.collection('spanishTrainingAttempts').where('authorUid','==',timUid).limit(200).get();
 const attempts=snapshot.docs.map(doc=>{
  const data=doc.data();
  const date=data.submittedAt?.toDate?.().toISOString()||'';
  return {id:doc.id,lessonId:data.lessonId,mode:data.mode,series:data.series,
    score:Number(data.score)||0,total:10,submittedAt:date,xp:0,
    items:Array.isArray(data.items)?data.items:[]};
 }).filter(record=>Boolean(buildSpanishTasks(record.id,SPANISH_COURSE)));
 return {attempts};
});


/* Leçon 14 du 12 novembre : trois séries de 10 questions.
   Fonctions séparées des 13 leçons existantes pour préserver leurs corrections,
   tentatives, comptes et anciens résultats. */
function nov12Family(request){
 const uid=request.auth?.uid;
 if(uid!==timUid&&uid!==parentUid)throw new HttpsError('permission-denied','Accès réservé à Tim et au parent.');
}
function requireNov12Id(id){
 if(!nov12IdValid(id))throw new HttpsError('invalid-argument','Exercice du 12 novembre inconnu.');
 return String(id);
}
export const getSpanishNov12TrainingTask=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 nov12Family(request);
 const id=requireNov12Id(request.data?.id);
 const snap=await db.doc('spanishNov12Attempts/'+id).get();
 return {task:nov12TaskPublic(id),completed:snap.exists};
});
export const previewSpanishNov12Training=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'parent');
 const id=requireNov12Id(request.data?.id);
 const result=nov12Evaluate(id,request.data?.answers,request.data?.translationsUsed);
 if(!result)throw new HttpsError('invalid-argument','Les dix réponses sont requises.');
 return {...result,practice:true,saved:false,xp:0};
});
export const submitSpanishNov12Training=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 role(request,'tim');
 const id=requireNov12Id(request.data?.id);
 const evaluated=nov12Evaluate(id,request.data?.answers,request.data?.translationsUsed);
 if(!evaluated)throw new HttpsError('invalid-argument','Les dix réponses sont nécessaires.');
 const ref=db.doc('spanishNov12Attempts/'+id);
 try{
  return await db.runTransaction(async tx=>{
   const prior=await tx.get(ref);
   if(prior.exists)throw new HttpsError('already-exists','Exercice déjà validé. Consulte ta correction.');
   tx.create(ref,{...evaluated,authorUid:request.auth.uid,submittedAt:FieldValue.serverTimestamp(),policy:'one-attempt-v1',lessonId:'10099~6400554'});
   return {...evaluated,submitted:true};
  });
 }catch(error){
  if(error instanceof HttpsError)throw error;
  throw new HttpsError('internal','Validation non confirmée : consulte ton résultat avant de réessayer.');
 }
});
export const getSpanishNov12TrainingProgress=onCall({region:'europe-west1',enforceAppCheck:true},async request=>{
 nov12Family(request);
 const id=request.data?.id;
 if(id!==undefined&&id!==null)requireNov12Id(id);
 const ids=id?[String(id)]:nov12TaskIds();
 const snapshots=await Promise.all(ids.map(x=>db.doc('spanishNov12Attempts/'+x).get()));
 const reports=snapshots.filter(x=>x.exists).map(x=>{
  const d=x.data(),timestamp=d.submittedAt?.toDate?.()?.toISOString()||'';
  return {id:x.id,score:d.score,total:10,xp:d.xp||0,items:d.items||[],errorCounts:d.errorCounts||{},
   translationHelpCount:d.translationHelpCount||0,lessonId:'10099~6400554',submittedAt:timestamp};
 });
 return id?{attempt:reports[0]||null}:{attempts:reports};
});
