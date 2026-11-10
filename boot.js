import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,deleteDoc,collection,getDocs,query,where,serverTimestamp,runTransaction} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';
import {getFunctions,httpsCallable} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-functions.js';
import {initializeAppCheck,ReCaptchaV3Provider} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app-check.js';
import {makeAttachmentBridge} from './attachments.js';
import {setupMissions,isMissionId} from './missions-v18.mjs';

// Only the two existing Firebase Authentication users are authorized.
// Security does NOT rely on these frontend constants: Firestore Rules enforce them.
const TIM_UID='uqZI3Up97YWzKvWhssWQidn4TJO2';
const PARENT_UID='BPEuNAhHVyX8ewQ2I54s56m11vj1';
const access=document.getElementById('access');
const status=document.getElementById('access-status');
const form=document.getElementById('login-form');
const button=document.getElementById('login-button');
let auth,db,functionsApi,activeUser,appLoaded=false,unsubscribe=null;
/* Firebase Spark alternative: signed Firebase Auth token over a same-origin
   Cloudflare Pages route. The old callable remains a fallback until configured.
   Never retry an uncertain submission through another provider. */
let workerReady=null;
async function cloudflareReady(){
 if(workerReady!==null)return workerReady;
 try{
  const response=await fetch('/api/status',{cache:'no-store'});
  if(!response.ok)return workerReady=false;
  const json=await response.json();
  return workerReady=json.platform==='cloudflare-pages'&&json.available===true;
 }catch{return workerReady=false;}
}
async function protectedCall(name,data={}){
 if(!await cloudflareReady())return httpsCallable(functionsApi,name)(data);
 if(!activeUser)throw Error('Compte Firebase non connecté.');
 const token=await activeUser.getIdToken();
 const response=await fetch('/api/tim',{
  method:'POST',
  headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
  cache:'no-store',body:JSON.stringify({action:name,payload:data})
 });
 let result;
 try{result=await response.json();}catch{throw Error('Réponse sécurisée Cloudflare invalide.');}
 if(!response.ok){
  const code=typeof result.error==='string'?result.error:'server-error';
  const error=new Error('Service de validation : '+code+'.');
  error.code='functions/'+code;
  throw error;
 }
 if(!result||typeof result!=='object'||!('data'in result))throw Error('Réponse Cloudflare incomplète.');
 return result;
}
const cloudCallable=name=>data=>protectedCall(name,data);

let selectedRole=null;
const roleChoices=document.querySelector('.role-choices');
const roleLabel=document.getElementById('selected-role-label');
function chooseRole(role){
 selectedRole=role;
 roleChoices.hidden=true;form.hidden=false;
 roleLabel.textContent=role==='tim'?'Connexion de Tim':'Connexion du parent';
 document.getElementById('login-email').focus();
 if(auth?.currentUser){
  const expected=role==='tim'?TIM_UID:PARENT_UID;
  if(auth.currentUser.uid===expected){startSession(auth.currentUser);}
  else {signOut(auth).catch(()=>message('Impossible de changer de compte.'));}
 }
}
document.getElementById('tim-enter').addEventListener('click',()=>chooseRole('tim'));
document.getElementById('parent-enter').addEventListener('click',()=>chooseRole('parent'));
document.getElementById('role-back').addEventListener('click',()=>{selectedRole=null;form.hidden=true;roleChoices.hidden=false;});

const message=(msg,good=false)=>{status.textContent=msg;status.classList.toggle('good',good);};
// Firestore Standard does not accept an array directly inside another array.
// Wrap only those inner arrays as a map; restore them after reading the document.
// This preserves the original lessons, bilingual tables, timeline and exercises.
const NESTED_ARRAY_TAG='__tim_nested_array_v1';
function encodeForFirestore(value,insideArray=false){
 if(Array.isArray(value)){
  const entries=value.map(item=>encodeForFirestore(item,true));
  return insideArray?{[NESTED_ARRAY_TAG]:entries}:entries;
 }
 if(value && typeof value==='object'){
  return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,encodeForFirestore(v,false)]));
 }
 return value;
}
function decodeFromFirestore(value){
 if(Array.isArray(value))return value.map(decodeFromFirestore);
 if(value && typeof value==='object'){
  if(Object.keys(value).length===1 && Array.isArray(value[NESTED_ARRAY_TAG])){
   return value[NESTED_ARRAY_TAG].map(decodeFromFirestore);
  }
  return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,decodeFromFirestore(v)]));
 }
 return value;
}
function norm(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?¡!.,;:]/g,'').replace(/\s+/g,' ').trim();}
function analyseLettre(value){
 const s=norm(value);
 const checks=[
  ['une salutation', /\b(hola|querido|querida|buenos dias|buenas tardes)\b/.test(s)],
  ['une présentation', /\b(me llamo|soy|mi nombre es)\b/.test(s)],
  ['un âge avec « tengo … años »', /\btengo\s+([a-z0-9 ]{1,20})\s+anos\b/.test(s)],
  ['une ville', /\b(vivo en|soy de|mi ciudad es)\b/.test(s)],
  ['un goût', /\b(me gusta|me gustan|me encanta|me encantan)\b/.test(s)],
  ['une question', /[?¿]/.test(value)],
  ['une formule de fin', /\b(adios|hasta pronto|hasta luego|un beso|un abrazo|saludos|nos vemos)\b/.test(s)]
 ];
 const missing=checks.filter(x=>!x[1]).map(x=>x[0]);
 return {correct:missing.length===0, points:checks.length-missing.length,maxPoints:checks.length, expected:'Hola, me llamo Ana. Tengo quince años. Vivo en Nimes. Me gusta el deporte. ¿Y a ti? Hasta pronto.',
  explanation:'Contrôle automatique de structure : '+(missing.length?'éléments manquants : '+missing.join(', ')+'.':'les sept éléments demandés sont présents.')+' La qualité grammaticale d’une lettre libre ne peut pas être garantie par cette vérification.'};
}
function result(ex,values,submittedAt,policyVersion){
 const answers=ex.questions.map((q,i)=>{
  const response=String(values[i]??'');
  const letter=q.type==='free'&&(ex.id==='E08'||q.rubric==='letter')?analyseLettre(response):null;
  const correct=letter?letter.correct:q.type==='free'?null:q.type==='mc'?String(q.right)===response:[q.right,...(q.also||[])].some(x=>norm(x)===norm(response));
  return {question:q.q,response,correct,expected:letter?letter.expected:q.type==='mc'?q.options[q.right]:q.right,skill:q.skill,points:letter?.points,maxPoints:letter?.maxPoints,explanation:letter?letter.explanation:q.why};
 });
 const graded=answers.filter(x=>x.correct!==null);
 return {id:ex.id,date:submittedAt?.toDate?.().toISOString()||new Date().toISOString(),title:ex.title,lesson:ex.lesson,
   score:graded.reduce((n,x)=>n+(typeof x.points==='number'?x.points:(x.correct?1:0)),0),total:graded.reduce((n,x)=>n+(typeof x.maxPoints==='number'?x.maxPoints:1),0),needsReview:graded.length===0,answers,policyVersion:policyVersion||0};
}
async function loadCourseAdditions(content){
 const [extraLessons,extraExercises]=await Promise.all([getDocs(collection(db,'lessons')),getDocs(collection(db,'exercises'))]);
 const syntheticId=id=>/^(TLM|TQM)(0[1-9]|1[0-7])$/.test(String(id));
 const lessons=new Map(content.lessons.filter(l=>!syntheticId(l.id)).map(l=>[l.id,l]));
 const exercises=new Map(content.exercises.filter(e=>!syntheticId(e.id)).map(e=>[e.id,e]));
 // Les révisions sont de nouveaux documents immuables : la règle CREATE existante suffit.
 // Le lecteur ne présente que la version la plus récente, sous l'identifiant de cours initial.
 const versions=[];
 extraLessons.forEach(d=>{if(syntheticId(d.id))return;const raw=d.data();const v=raw.payloadJson?JSON.parse(raw.payloadJson):decodeFromFirestore(raw);if(v.id===d.id && typeof v.title==='string' && Array.isArray(v.blocks))versions.push(v);});
 versions.filter(v=>!v.replacesId).forEach(v=>lessons.set(v.id,v));
 versions.filter(v=>v.replacesId).sort((a,b)=>String(a.savedAt||'').localeCompare(String(b.savedAt||''))).forEach(v=>{
  if(!/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(v.replacesId))return;
  lessons.set(v.replacesId,{...v,id:v.replacesId,revisionId:v.id});
 });
 extraExercises.forEach(d=>{if(syntheticId(d.id))return;const raw=d.data();const v=raw.payloadJson?JSON.parse(raw.payloadJson):decodeFromFirestore(raw);if(v.id===d.id && typeof v.title==='string' && Array.isArray(v.questions))exercises.set(d.id,v);});
 return {...content,lessons:[...lessons.values()],exercises:[...exercises.values()]};
}
async function publishCoursePack(pack){
 if(activeUser?.uid!==PARENT_UID)throw Error('Réservé au parent.');
 const entries=[...(pack.lessons||[]).map(v=>['lessons',v]),...(pack.exercises||[]).map(v=>['exercises',v])];
 if(!entries.length || entries.length>30)throw Error('Ajouter entre 1 et 30 contenus par lot.');
 const seen=new Set();
 const ids=new Set(window.__TIM_DATA.lessons.concat(window.__TIM_DATA.exercises).map(x=>x.id));
 for(const [type,v] of entries){
  if(!v||typeof v.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(v.id)||typeof v.title!=='string'||!v.title.trim()||v.title.length>200)throw Error('Identifiant ou titre incorrect.');
  if(ids.has(v.id)||seen.has(v.id))throw Error('Le contenu '+v.id+' existe déjà. Aucun écrasement autorisé.');
  if(type==='lessons'&&(!Array.isArray(v.blocks)||!v.help))throw Error('Structure de leçon invalide : '+v.id);
  if(type==='exercises'&&(!Array.isArray(v.questions)||v.questions.length<1||v.questions.length>15||v.questions.some(q=>!['mc','text','free'].includes(q.type)||!q.q||q.right===undefined||(q.type==='free'&&q.rubric!=='letter'))))throw Error('Questions invalides : '+v.id);
  if(type==='exercises'&&!['school','bonus'].includes(v.category))throw Error('Précise category: "school" (devoir ENT, 0 XP) ou "bonus" (entraînement avec XP) pour '+v.id+'.');
  seen.add(v.id);
 }
 const supportedLessons=new Set([...window.__TIM_DATA.lessons.map(x=>x.id),...(pack.lessons||[]).map(x=>x.id)]);
 for(const ex of pack.exercises||[]){if(!supportedLessons.has(ex.lesson))throw Error('Leçon associée introuvable : '+ex.lesson);}
 await runTransaction(db,async tx=>{
  const refs=entries.map(([type,v])=>doc(db,type,v.id));
  const snaps=[];for(const ref of refs)snaps.push(await tx.get(ref));
  if(snaps.some(x=>x.exists()))throw Error('Une référence existe déjà dans Firebase. Import annulé.');
  const publishedAt=new Date().toISOString();
  entries.forEach(([type,v],i)=>tx.set(refs[i],{id:v.id,title:v.title,payloadJson:JSON.stringify({...v,publishedAt})}));
 });
 return entries.length;
}


// V16 : le parent peut corriger un cours existant sans republier Netlify.
// Les blocs, identifiants et références d'exercices ne sont pas réinitialisés.
async function saveEditableLesson(lesson){
 if(activeUser?.uid!==PARENT_UID)throw Error('Réservé au parent.');
 if(!lesson||typeof lesson.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(lesson.id))throw Error('Référence de cours invalide.');
 if(typeof lesson.title!=='string'||!lesson.title.trim()||lesson.title.length>200||!Array.isArray(lesson.blocks)||lesson.blocks.length>120)throw Error('Titre ou contenu de cours invalide.');
 if(typeof lesson.subject!=='string'||!lesson.subject.trim()||typeof lesson.chapter!=='string'||!lesson.chapter.trim())throw Error('Matière ou chapitre manquant.');
 const original=window.__TIM_DATA.lessons.find(l=>l.id===lesson.id);
 if(lesson.blocks.some(b=>!['note','bullets','table','svg','figure'].includes(b.kind)))throw Error('Bloc de cours non reconnu.');
 if(lesson.blocks.some(b=>b.kind==='svg'&&!window.TIM_LESSON_EDITOR?.safeSvg?.(b.svg)))throw Error('Schéma SVG invalide.');
 if(lesson.blocks.some(b=>b.kind==='figure'&&!/^[A-Za-z0-9]{12,35}$/.test(b.attachmentId||'')))throw Error('Une figure attend encore son fichier image.');
 const publishedAt=original?(original.publishedAt||original.date||'cours-historique'):(lesson.publishedAt||new Date().toISOString());
 const newLesson=!original;
 // Une édition de cours crée une RÉVISION. Cela ne requiert jamais de modifier
 // une leçon ou un résultat existant dans Firebase et ne demande aucune règle UPDATE.
 const savedId=newLesson?lesson.id:'R'+Date.now().toString(36)+Math.random().toString(36).slice(2,9);
 const value={...lesson,id:savedId,publishedAt,savedAt:new Date().toISOString()};
 delete value.revisionId;
 if(!newLesson)value.replacesId=lesson.id;
 else delete value.replacesId;
 const json=JSON.stringify(value);
 if(json.length>650000)throw Error('Cours trop volumineux pour Firestore ; utilise des figures en pièces jointes.');
 const ref=doc(db,'lessons',savedId);
 try{await setDoc(ref,{id:savedId,title:value.title,payloadJson:json});}
 catch(e){if(e.code==='permission-denied'||/permission/i.test(e.message||''))throw Error('Création de cours bloquée par les règles Firestore. Il faut vérifier les autorisations existantes de la collection « lessons ».');throw e;}
 return lesson.id;
}

// Import ENT ESPAGNOL : source conservée dans content/main (Firebase privé).
// Ne modifie aucune autre matière ni les résultats de Tim.
async function saveSpanishEnt(pack,binaries,progress=()=>{}){
 if(activeUser?.uid!==PARENT_UID)throw Error('Import réservé au compte Parent.');
 const ent=window.TIM_SPANISH_ENT_EXACT;
 if(!ent||!Array.isArray(binaries))throw Error('Lecteur ENT indisponible.');
 const counts=ent.validate(pack);
 if(!pack.report||pack.report.matiere!=='ESPAGNOL LV2')throw Error('Origine ESPAGNOL LV2 non confirmée.');
 if(binaries.length!==counts.pdfs||binaries.some(b=>!pack.index.some(i=>String(i.id)===b.id)))throw Error('PDF originaux incomplets.');
 const attach=makeAttachmentBridge(db,()=>activeUser,PARENT_UID,TIM_UID);
 // Tester les permissions AVANT toute modification.
 let old=await attach.list('lesson',ent.TAG);
 const added=[];
 let stage='contrôle des droits Firebase';
 try{
  for(let i=0;i<binaries.length;i++){
   const b=binaries[i];
   const digest=await crypto.subtle.digest('SHA-256',await b.blob.arrayBuffer());
   const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
   const oldMatch=old.find(x=>x.fileName===b.filename&&x.sha256===hash);
   if(oldMatch){progress('PDF déjà présent et identique : '+(i+1)+'/'+binaries.length);continue;}
   stage='enregistrement PDF '+(i+1)+'/'+binaries.length+' dans attachment_chunks / attachments';
   progress('Stockage sécurisé du PDF '+(i+1)+'/'+binaries.length+'…');
   const id=await attach.upload('lesson',ent.TAG,b.blob,b.filename);
   old=await attach.list('lesson',ent.TAG);
   const meta=old.find(x=>x.id===id);
   if(!meta||meta.sha256!==hash)throw Error('Contrôle du PDF échoué : '+b.filename);
   added.push(meta);
  }
  // Vérifier tous les fichiers AVANT de remplacer le cours dans Firebase.
  for(const b of binaries){
   const digest=await crypto.subtle.digest('SHA-256',await b.blob.arrayBuffer());
   const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
   if(!old.some(x=>x.fileName===b.filename&&x.sha256===hash))throw Error('PDF manquant après copie : '+b.filename);
  }
  stage='sauvegarde puis mise à jour des cours dans content/main';
  progress('9 fichiers vérifiés : mise à jour privée du classeur espagnol…');
  const mainRef=doc(db,'content','main'),snap=await getDoc(mainRef);
  if(!snap.exists())throw Error('Classeur Firebase principal introuvable.');
  const previous=decodeFromFirestore(snap.data());
  if(!Array.isArray(previous.lessons)||!Array.isArray(previous.exercises))throw Error('Structure Firebase inattendue.');
  // Les règles Firestore publiées n'autorisent que les champs existants de content/main.
  // On conserve intégralement les anciennes données (dont les notes et exercices)
  // et on stocke l'ENT sous le champ deja autorise « metadata ».
  // Le filtre d'affichage isole uniquement l'espagnol original sans destruction.
  // Si le nouvel export correspond encore aux memes cours/devoirs,
  // ne pas perdre les traductions francaises deja sauvegardees.
  let keptTranslations=null;
  const oldTranslations=previous.metadata?.spanishEnt?.translations;
  if(oldTranslations&&ent.validateTranslations){
   try{
    await ent.validateTranslations(pack,{
     schema:oldTranslations.schema,language:oldTranslations.language,
     courses:oldTranslations.courses,homework:oldTranslations.homework
    });
    keptTranslations=oldTranslations;
   }catch{keptTranslations=null;}
  }
  const next={
   ...previous,
   metadata:{
    ...(previous.metadata && typeof previous.metadata==='object' && !Array.isArray(previous.metadata) ? previous.metadata : {}),
    spanishEnt:{
     lessons:pack.lessons,homework:pack.homework,dates:pack.dates,index:pack.index,
     collectedAt:pack.report.date_collecte||new Date().toISOString(),
     source:'ENT Skolengo — données originales Termux',version:2,
     ...(keptTranslations?{translations:keptTranslations}:{})
    }
   }
  };
  const bytes=new TextEncoder().encode(JSON.stringify(next)).length;
  if(bytes>850000)throw Error('Classeur trop volumineux pour Firebase ('+bytes+' octets). Aucune leçon modifiée.');
  await setDoc(mainRef,encodeForFirestore(next));
  const confirmed=decodeFromFirestore((await getDoc(mainRef)).data());
  if(!confirmed?.metadata?.spanishEnt||confirmed.metadata.spanishEnt.lessons.length!==counts.lessons||confirmed.metadata.spanishEnt.homework.length!==counts.homework||confirmed.metadata.spanishEnt.index.length!==counts.pdfs)
   throw Error('Vérification après enregistrement impossible. Vérifier le contenu Parent.');
  progress('Import ENT terminé : '+counts.lessons+' cours, '+counts.homework+' devoirs, '+counts.pdfs+' PDF.');
  return true;
 }catch(error){
  // Ne jamais retirer des fichiers antérieurs : uniquement les nouveaux fichiers
  // de CET essai, si la publication principale n'a pas été confirmée.
  // Aucune suppression automatique : les éventuels fichiers sans rattachement
  // seront conservés dans l'espace privé pour éviter toute perte.
  if(/permission|autorisation|access denied/i.test(String(error?.message||''))){
   throw new Error('Accès refusé pendant '+stage+'. Les règles actuelles ne permettent pas cette écriture ; aucune règle n’a été modifiée.');
  }
  throw new Error(stage+' : '+String(error?.message||error));
 }
}

// Traductions francaises : enregistrement prive dans le meme document Firebase.
// Les textes ENT et les anciennes notes ne sont jamais modifies.
async function saveSpanishTranslations(translations){
 if(activeUser?.uid!==PARENT_UID)throw Error('La traduction doit être installée depuis le compte Parent.');
 const ent=window.TIM_SPANISH_ENT_EXACT;
 if(!ent?.validateTranslations)throw Error('Le module de traduction n’est pas chargé.');
 const ref=doc(db,'content','main');
 const snap=await getDoc(ref);
 if(!snap.exists())throw Error('Le classeur principal est introuvable.');
 const old=decodeFromFirestore(snap.data());
 const original=old.metadata?.spanishEnt;
 if(!original)throw Error('Il faut d’abord installer les cours ENT dans la matière espagnole.');
 const counts=await ent.validateTranslations(original,translations);
 // Vérifier que les traductions de fiches correspondent à des PDF effectivement présents,
 // en comparant les empreintes enregistrées ; sans lecture ni publication de leurs octets.
 if(translations.attachments){
   const files=await makeAttachmentBridge(db,()=>activeUser,PARENT_UID,TIM_UID).list('lesson',ent.TAG);
   for(const item of original.index){
    const translated=translations.attachments[String(item.id)];
    const filename=String(item.nom_dans_archive||'').split('/').pop();
    const matching=files.find(m=>m.fileName===filename);
    if(matching&&matching.sha256!==translated.sha256)
     throw Error('La fiche '+item.nom_ENT+' ne correspond pas au PDF original attendu.');
   }
 }
 const compact={
  schema:translations.schema,language:'fr',
  notice:'Traduction pédagogique non officielle ; les textes et PDF ENT restent inchangés.',
  courses:translations.courses,homework:translations.homework,
  ...(translations.attachments?{attachments:translations.attachments}:
    (original.translations?.attachments?{attachments:original.translations.attachments}:{})),
  validatedAt:new Date().toISOString()
 };
 const next={...old,metadata:{...old.metadata,spanishEnt:{...original,translations:compact}}};
 const bytes=new TextEncoder().encode(JSON.stringify(next)).length;
 if(bytes>850000)throw Error('Le document Firebase deviendrait trop volumineux. Les anciens cours restent inchangés.');
 try{await setDoc(ref,encodeForFirestore(next));}
 catch(e){throw Error('Firebase a refusé la sauvegarde des traductions : '+String(e.code||e.message||e));}
 const check=await getDoc(ref);
 if(!check.exists())throw Error('Vérification de la sauvegarde impossible.');
 const saved=decodeFromFirestore(check.data()).metadata?.spanishEnt?.translations;
 if(saved?.language!=='fr'||Object.keys(saved.courses||{}).length!==counts.lessons||
    Object.keys(saved.homework||{}).length!==counts.homework||
    (counts.pdfs>0&&Object.keys(saved.attachments||{}).length!==counts.pdfs))
  throw Error('La sauvegarde n’a pas pu être confirmée.');
 return counts;
}

// Aucune installation automatique de cours hors ENT.

async function saveAlertWebhook(url){
 if(activeUser?.uid!==PARENT_UID)throw Error('Réservé au parent.');
 const value=String(url||'').trim();
 if(value && !/^https:\/\/hook\.[a-z0-9-]+\.make\.com\/[a-zA-Z0-9_-]+$/.test(value))throw Error('Adresse Make incorrecte : elle doit commencer par https://hook.…make.com/');
 await setDoc(doc(db,'settings','alerts'),{makeWebhook:value,enabled:!!value,updatedAt:serverTimestamp()});
 return !!value;
}
async function readAlertWebhook(){
 try{const v=await getDoc(doc(db,'settings','alerts'));return v.exists()&&v.data().enabled?v.data().makeWebhook:'';}catch(e){return '';}
}
async function notifyAlert(id,saved){
 if(activeUser?.uid!==TIM_UID)return;
 const url=await readAlertWebhook();
 if(!url)return;
 // Le webhook ne contient que des identifiants de résultat, pas les réponses privées.
 const payload=JSON.stringify({event:'exercise_validated',exerciseId:id,title:saved.title,xp:saved.xp,correctionStatus:'pending-parent',submittedAt:saved.date});
 try {if(navigator.sendBeacon && navigator.sendBeacon(url,new Blob([payload],{type:'text/plain'})))return;}
 catch(e){}
 try{await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:payload,keepalive:true});}catch(e){console.warn('Notification Make non envoyée',e);}
}
async function runFirebaseDiagnostic(){
 if(activeUser?.uid!==PARENT_UID)throw Error('Réservé au parent.');
 // Diagnostic non destructif, aligné sur les règles réelles de Firestore.
 const report={parentContentRead:false,attemptsRead:false,unauthorizedAttemptWriteBlocked:false,backendReport:false};
 const source=await getDoc(doc(db,'content','main'));
 report.parentContentRead=source.exists();
 await getDocs(query(collection(db,'attempts'),where('authorUid','==',TIM_UID)));
 report.attemptsRead=true;
 try{
  await setDoc(doc(db,'attempts','diagnostic_interdit'),{authorUid:PARENT_UID,xp:999});
  throw Error('Sécurité défaillante : écriture directe des résultats autorisée.');
 }catch(error){
  if(error.code==='permission-denied')report.unauthorizedAttemptWriteBlocked=true;
  else throw error;
 }
 const response=await cloudCallable('getParentReport')({});
 report.backendReport=Array.isArray(response.data?.attempts);
 if(!report.parentContentRead||!report.attemptsRead||!report.unauthorizedAttemptWriteBlocked||!report.backendReport)
  throw Error('Diagnostic incomplet : '+JSON.stringify(report));
 return report;
}

async function fetchAttempts(content){
 const docs=await getDocs(activeUser?.uid===TIM_UID?
   query(collection(db,'attempts'),where('authorUid','==',TIM_UID)):
   collection(db,'attempts'));
 const map=new Map(content.exercises.map(x=>[x.id,x])),list=[];
 const isParent=activeUser?.uid===PARENT_UID;
 // Les originaux des notes sont déjà conservés dans privateAttempts.
 // Les règles existantes en autorisent la lecture au seul parent.
 let grades=new Map();
 if(isParent){
  try{
   const privateDocs=await getDocs(collection(db,'privateAttempts'));
   grades=new Map(privateDocs.docs.map(doc=>[doc.id,doc.data()]));
  }catch(error){console.warn('Notes détaillées Parent indisponibles :',error.code||error.message);}
 }
 docs.forEach(d=>{
  const record=d.data(),ex=map.get(d.id);if(!ex&&!isMissionId(d.id))return;
  const secret=isParent?grades.get(d.id):null;
  const released=record.correctionStatus==='released';
  list.push({
   id:d.id,date:record.submittedAt?.toDate?.().toISOString()||new Date().toISOString(),
   title:ex?.title||secret?.title||(d.id.startsWith('DAY_')?'Petit défi du '+d.id.slice(4,12):d.id.startsWith('SUNDAY_')?'Grand défi du dimanche':'Grand défi du samedi'),lesson:ex?.lesson||'',xp:Number(record.xp||0),policyVersion:Number(record.policyVersion||0),
   correctionStatus:released?'released':'pending-parent',
   correctionLocked:isParent?false:!released,
   answers:isParent&&Array.isArray(secret?.answers)?secret.answers:[],
   score:isParent&&Number.isFinite(secret?.score)?secret.score:null,
   total:isParent&&Number.isFinite(secret?.total)?secret.total:null,
   needsReview:isParent?Boolean(secret?.needsReview):false
  });
 });
 if(activeUser?.uid===TIM_UID&&list.some(x=>x.correctionStatus==='released')){
  try{
   const response=await cloudCallable('getTimReleasedCorrections')({});
   const released=new Map((response.data?.corrections||[]).map(x=>[x.id,x]));
   for(const attempt of list){
    if(attempt.correctionStatus!=='released')continue;
    const correction=released.get(attempt.id);
    if(!correction){attempt.correctionLocked=true;attempt.correctionStatus='pending-parent';continue;}
    attempt.answers=Array.isArray(correction.answers)?correction.answers:[];
    attempt.score=correction.score;attempt.total=correction.total;
    attempt.correctionLocked=false;
   }
  }catch(error){console.warn('Corrections Tim en attente :',error.code||error.message);}
 }
 list.sort((a,b)=>a.date.localeCompare(b.date));window.__CLOUD_ATTEMPTS=list;return list;
}

function stopApp(){if(window.__TIM_GUEST)return;document.body.classList.remove('ready');access.hidden=false;appLoaded=false;window.__CLOUD_ATTEMPTS=[];window.__TIM_SPANISH_PROGRESS={status:'loading',attempts:[]};
  for(const id of ['content-import','content-import-button','import-logout'])document.getElementById(id)?.remove();
  access.querySelector('h1').textContent="Accède à tes missions";
  access.querySelector('p').textContent='Connexion réservée à Tim et à son parent.';
  document.querySelectorAll('[data-nav="parent"]').forEach(el=>el.hidden=true);}
function showImport(){
 stopApp();document.getElementById('login-form').hidden=true;
 access.querySelector('h1').textContent='Installer les cours';
 access.querySelector('p').textContent='Compte parent connecté. Les cours n’ont pas encore été importés dans Firestore. Choisis le fichier JSON privé livré avec le classeur.';
 let field=document.getElementById('content-import');
 if(!field){field=document.createElement('input');field.id='content-import';field.type='file';field.accept='.json,application/json';access.append(field);
  const upload=document.createElement('button');upload.id='content-import-button';upload.textContent='Importer les cours dans la base privée';access.append(upload);
  upload.onclick=async()=>{
   const f=field.files?.[0];if(!f){message('Choisis d’abord le fichier JSON privé.');return;}
   upload.disabled=true;
   try{const payload=JSON.parse(await f.text());
    if(!Array.isArray(payload.lessons)||!Array.isArray(payload.exercises)||payload.lessons.length<2||payload.exercises.length<2||payload.archive?.length)
      throw Error('Fichier de cours invalide ou contenant des captures à ne pas publier.');
    if(new TextEncoder().encode(JSON.stringify(payload)).length>800000)throw Error('Fichier trop volumineux.');
    await setDoc(doc(db,'content','main'),encodeForFirestore(payload));await startSession(activeUser);
   }catch(e){message('Import impossible : '+(e.message||'Erreur'));upload.disabled=false;}
  };
 }
 if(!document.getElementById('import-logout')){const out=document.createElement('button');out.id='import-logout';out.textContent='Se déconnecter';out.onclick=()=>signOut(auth);access.append(out);}
 message('Aucun cours n’est encore publié. Import réservé au compte parent.',true);
}
async function startSession(user){
 activeUser=user;const isParent=user.uid===PARENT_UID;
 if(!(isParent||user.uid===TIM_UID)){await signOut(auth);message('Cet utilisateur n’est pas autorisé à accéder au classeur.');return;}
 if(appLoaded){window.location.reload();return;}
 message('Ouverture des cours privés…',true);
 let content,serverAdditions=null;
 if(isParent){
  let snapshot;try{snapshot=await getDoc(doc(db,'content','main'));}catch(e){message('Lecture des cours parent impossible : '+(e.message||'Firestore'));return;}
  if(!snapshot.exists()){showImport();return;}
  content=decodeFromFirestore(snapshot.data());
 }else{
  try{const response=await cloudCallable('getTimCourseContent')({});content=decodeFromFirestore(response.data.content);serverAdditions=response.data.additions;}
  catch(e){message('Chargement des cours de Tim impossible : '+(e.message||'Firebase'));return;}
 }
 if(!Array.isArray(content.lessons)||!Array.isArray(content.exercises)){message('Le contenu du cours est incomplet.');return;}
 const missionSource=content; // référentiel identique à celui du serveur
 // V16 Cloudflare : 23 leçons BIS déjà disponibles, sans import manuel ni écrasement Firebase.
 const builtInBis=window.TIM_MATHS_BIS_PACK?.lessons||[];
 const knownLessonIds=new Set(content.lessons.map(l=>l.id));
 content={...content,lessons:[...content.lessons,...builtInBis.filter(l=>!knownLessonIds.has(l.id))]};
 if(isParent){try{content=await loadCourseAdditions(content);}catch(e){console.warn('Extensions indisponibles :',e);}}
 else if(serverAdditions){const l=new Map(content.lessons.map(x=>[x.id,x]));const e=new Map(content.exercises.map(x=>[x.id,x]));const versions=(serverAdditions.lessons||[]).filter(item=>item?.id&&Array.isArray(item.blocks));for(const item of versions.filter(x=>!x.replacesId))l.set(item.id,item);for(const item of versions.filter(x=>x.replacesId).sort((a,b)=>String(a.savedAt||'').localeCompare(String(b.savedAt||'')))){if(/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(item.replacesId))l.set(item.replacesId,{...item,id:item.replacesId,revisionId:item.id});}for(const item of serverAdditions.exercises||[])if(item?.id&&Array.isArray(item.questions))e.set(item.id,item);content={...content,lessons:[...l.values()],exercises:[...e.values()]};}
 content=window.TIM_APPLY_SPANISH_NOV05?.(content)||content;
 const missionInput=window.TIM_SPANISH_ENT_EXACT?{...missionSource,exercises:missionSource.exercises.filter(e=>!String(e.subject||'').toLowerCase().includes('espagnol'))}:missionSource;
 const missionPlan=setupMissions(missionInput,new Date(),window.TIM_SPANISH_EDU);
 window.__TIM_CHALLENGES=missionPlan.meta;
 // Le défi du jour est supprimé : aucune génération ni prévisualisation.
 window.__TIM_NEXT_DAILY=null;
 const existingMissionIds=new Set(content.exercises.map(x=>x.id));
 const retainedExercises=content.exercises.filter(x=>!/^DAY_20\d{6}(?:_\d{2})?$/.test(String(x.id||'')));
 content={...content,exercises:[...retainedExercises,...missionPlan.exercises.filter(x=>!existingMissionIds.has(x.id))]};
 // Dans la matière espagnole, seuls les documents ENT exacts sont désormais visibles.
 // Les anciennes notes restent archivées dans Firestore pour le parent.
 if(window.TIM_SPANISH_ENT_EXACT){
   const notSpanish=x=>!String(x?.subject||'').toLowerCase().includes('espagnol');
   content={...content,lessons:content.lessons.filter(notSpanish),exercises:content.exercises.filter(notSpanish)};
 }
 // Tim never receives answer fields through the application state.
 // Server-side storage/rules must also be migrated before production release.
 if(!isParent){
  const hiddenFields=new Set(['right','also','why','expected','answer','answers','answerKey','answerKeys','solution','solutions','correction','corrections','explanation','rubric']);
  content={...content,exercises:content.exercises.map(ex=>({...ex,questions:(ex.questions||[]).map(q=>Object.fromEntries(Object.entries(q).filter(([key])=>!hiddenFields.has(key))))}))};
 }
 window.__TIM_DATA=content;window.__TIM_PARENT=isParent;
 window.__CLOUD_ATTEMPTS=[];window.__TIM_SPANISH_PROGRESS={status:'loading',attempts:[]};
 try{await fetchAttempts(content);}catch(e){message('Impossible de lire les résultats. Les règles Firestore sont à vérifier.');return;}
 window.__TIM_SPANISH_PROGRESS={status:'loading',attempts:[]};
 const trainingId=/^SP[QW]_L(?:0[1-9]|1[0-5])_0[1-5]$/;
 const loadSpanishProgress=async()=>{
  try{
   const docs=await getDocs(activeUser?.uid===TIM_UID?
    query(collection(db,'attempts'),where('authorUid','==',TIM_UID)):
    collection(db,'attempts'));
   const ids=docs.docs.filter(d=>trainingId.test(d.id));
   let grades=new Map();
   if(activeUser?.uid===PARENT_UID&&ids.length){
    const priv=await getDocs(collection(db,'privateAttempts'));
    grades=new Map(priv.docs.filter(d=>trainingId.test(d.id)).map(d=>[d.id,d.data()]));
   }
   const attempts=ids.map(d=>{
    const m=/^SP([QW])_(L\d\d)_0([1-5])$/.exec(d.id),privateRecord=grades.get(d.id);
    return {
     id:d.id,lessonId:m[2],mode:m[1],series:Number(m[3]),
     score:Number.isFinite(privateRecord?.score)?privateRecord.score:null,total:10,
     submittedAt:d.data().submittedAt?.toDate?.().toISOString()||'',
     xp:0,cloudSaved:true,
     items:Array.isArray(privateRecord?.answers)?privateRecord.answers.map(q=>({
      prompt:q.question,response:q.response,correct:q.correct,
      expected:q.expected,explanation:q.explanation||''
     })):[]
    };
   });
   // Sans les exercices publiés dans Firebase, on garde le mode local
   // pour ne jamais annoncer une synchronisation qui n'existe pas.
   const catalogue=window.__TIM_DATA?.exercises||[];
   const available=catalogue.some(ex=>trainingId.test(ex.id));
   window.__TIM_SPANISH_PROGRESS={
    status:available?'ok':'local',attempts,
    message:available?'':'Les entraînements sont préparés. La publication dans Firebase est en attente.'
   };
  }catch(error){
   console.warn('Suivi Espagnol indisponible :',error.code||error.message);
   window.__TIM_SPANISH_PROGRESS={
    status:'unavailable',attempts:[],
    message:'La lecture des notes Firebase est momentanément indisponible.'
   };
  }
  document.dispatchEvent(new Event('tim-spanish-training-progress'));
  return window.__TIM_SPANISH_PROGRESS;
 };
 window.__TIM_BRIDGE={
  spanishEntTrainingTask:async(id)=>{
   if(!/^ESE_L(?:0[1-9]|1[0-3])_0[1-3]$/.test(String(id||'')))throw Error('Exercice espagnol inconnu.');
   const r=await cloudCallable('getSpanishEntTrainingTask')({id});
   if(!r.data?.task||r.data.task.questions?.length!==10)throw Error('Les dix questions sont indisponibles.');
   return r.data;
  },
  spanishEntTrainingSubmit:async(id,answers,translationsUsed)=>{
   if(activeUser?.uid!==TIM_UID)throw Error('Seul Tim peut valider.');
   if(!/^ESE_L(?:0[1-9]|1[0-3])_0[1-3]$/.test(String(id||''))||
      !Array.isArray(answers)||answers.length!==10||
      !Array.isArray(translationsUsed)||translationsUsed.length!==10||
      translationsUsed.some(v=>typeof v!=='boolean')||
      answers.some(v=>!((Number.isInteger(v)&&v>=0&&v<=3)||(typeof v==='string'&&v.trim().length>0&&v.length<=200))))
      throw Error('Réponses incomplètes.');
   const r=await cloudCallable('submitSpanishEntTraining')({id,answers,translationsUsed});
   if(!r.data?.submitted||!Number.isInteger(r.data.score)||r.data.xp!==0||
      !Array.isArray(r.data.items)||r.data.items.length!==10||
      !Number.isInteger(r.data.translationHelpCount))
      throw Error('La validation n’a pas été confirmée.');
   return r.data;
  },
  spanishEntTrainingProgress:async(id)=>{
   if(activeUser?.uid!==TIM_UID&&activeUser?.uid!==PARENT_UID)throw Error('Accès réservé à la famille.');
   const r=await cloudCallable('getSpanishEntTrainingProgress')(id?{id}:{});
   if(id){
    if(!('attempt'in (r.data||{})))throw Error('Copie indisponible.');
   }else if(!Array.isArray(r.data?.attempts))throw Error('Suivi des exercices indisponible.');
   return r.data;
  },
  trainingProgress:loadSpanishProgress,
  mathTrainingTask:async(id)=>{
   if(!/^MT(?:0[1-9]|1[0-9]|2[0-3])$/.test(id))throw Error('Exercice de mathématiques invalide.');
   const r=await cloudCallable('getMathTrainingTask')({id});
   return r.data;
  },
  mathTrainingSubmit:async(id,answers)=>{
   if(activeUser?.uid!==TIM_UID)throw Error('Seul Tim peut valider une évaluation.');
   if(!/^MT(?:0[1-9]|1[0-9]|2[0-3])$/.test(id)||
      !Array.isArray(answers)||answers.length!==10)throw Error('Réponses invalides.');
   const r=await cloudCallable('submitMathTraining')({id,answers});
   if(!r.data?.submitted||r.data?.xp!==0||!Number.isInteger(r.data?.score))
    throw Error('La note ne peut pas être confirmée.');
   return r.data;
  },
  mathTrainingProgress:async()=>{
   if(activeUser?.uid!==TIM_UID&&activeUser?.uid!==PARENT_UID)throw Error('Accès réservé à Tim et au Parent.');
   const r=await cloudCallable('getMathTrainingProgress')({});
   if(!Array.isArray(r.data?.attempts))throw Error('Historique des maths indisponible.');
   window.__TIM_MATH_PROGRESS={status:'ok',attempts:r.data.attempts};
   return window.__TIM_MATH_PROGRESS;
  },
  trainingSubmit:async(id,answers)=>{
   if(window.__TIM_GUEST||activeUser?.uid!==TIM_UID)throw Error('Seul Tim peut valider un entraînement.');
   if(!trainingId.test(id)||!Array.isArray(answers)||answers.length!==10)throw Error('Exercice invalide.');
   const ex=window.__TIM_DATA.exercises.find(q=>q.id===id);
   if(!ex)throw Error('Exercice pas encore publié dans Firebase.');
   // Reprise du service existant pour les devoirs : validation unique
   // et notation sur le serveur, aucune nouvelle fonction à déployer.
   const response=await cloudCallable('submitTimExercise')({id,answers});
   if(!response.data?.submitted||Number(response.data.xp)!==0)
    throw Error('Confirmation de validation sans XP non reçue.');
   await loadSpanishProgress();
   return {submitted:true,xp:0,cloudSaved:true};
  },
  submit:async(id,values)=>{
   if(window.__TIM_GUEST||activeUser.uid!==TIM_UID)throw Error('Seul Tim peut valider les exercices.');
   const ex=window.__TIM_DATA.exercises.find(q=>q.id===id);
   if(!ex||!Array.isArray(values)||values.length!==ex.questions.length)throw Error('Exercice ou réponses invalides.');
   const response=await cloudCallable('submitTimExercise')({id,answers:values});
   const xp=Number(response.data?.xp||0);
   const released=response.data?.correctionStatus==='released'&&Array.isArray(response.data.answers)&&response.data.answers.length===ex.questions.length;
   return {id,date:new Date().toISOString(),title:ex.title,lesson:ex.lesson,xp,correctionLocked:!released,correctionStatus:released?'released':'pending-parent',answers:released?response.data.answers:[],score:released?Number(response.data.score):null,total:released?Number(response.data.total):null,needsReview:false,policyVersion:18};
  },
  refresh:async()=>fetchAttempts(window.__TIM_DATA),
  publish:publishCoursePack,
  saveLesson:saveEditableLesson,
  attachments:makeAttachmentBridge(db,()=>activeUser,PARENT_UID,TIM_UID),
  saveSpanishEnt,
  saveSpanishTranslations,
  diagnose:runFirebaseDiagnostic,
  saveAlertWebhook,
  readAlertWebhook,
  notifyAlert,
  logout:async()=>signOut(auth)
 };
 // Le suivi espagnol charge sans bloquer l'ouverture de la session.
 loadSpanishProgress().catch(()=>{});
 if(isParent){
  const panel=document.createElement('section');panel.id='parent-corrections';panel.style.cssText='margin:16px auto;padding:16px;max-width:850px;border:1px solid #6788b2;border-radius:16px;background:#14253e;color:white';
  panel.innerHTML='<h2>Résultats et copies de Tim</h2><p id="pending-corrections-status">Chargement…</p><div id="pending-corrections-list"></div>';
  document.getElementById('account-strip').after(panel);
  const refreshCorrections=async()=>{
   const status=panel.querySelector('#pending-corrections-status');
   const list=panel.querySelector('#pending-corrections-list');
   status.textContent='Actualisation du suivi des devoirs…';list.replaceChildren();
   let attempts=[],releaseServiceAvailable=true;
   try{
    // Conserver le circuit serveur et ses boutons quand il est opérationnel.
    const response=await cloudCallable('getParentReport')({});
    if(!Array.isArray(response.data?.attempts))throw Error('Réponse de suivi incomplète');
    attempts=response.data.attempts;
   }catch(serviceError){
    // Les notes sont déjà lisibles en Firestore par le parent authentifié.
    // Ne pas présenter une panne de fonctions comme une panne de la base.
    releaseServiceAvailable=false;
    try{
     const [submissions,privateNotes]=await Promise.all([
      getDocs(collection(db,'attempts')),
      getDocs(collection(db,'privateAttempts'))
     ]);
     const titles=new Map((window.__TIM_DATA?.exercises||[]).map(ex=>[ex.id,ex.title]));
     const grades=new Map(privateNotes.docs.map(d=>[d.id,d.data()]));
     attempts=submissions.docs.map(d=>{
      const data=d.data(),detail=grades.get(d.id)||{};
      return {
       id:d.id,
       title:String(detail.title||titles.get(d.id)||data.title||d.id),
       score:Number.isFinite(detail.score)?detail.score:null,
       total:Number.isFinite(detail.total)?detail.total:null,
       correctionStatus:data.correctionStatus==='released'?'released':'pending-parent',xp:Number(data.xp||0)
      };
     });
     // Les copies privées dont la tentative publique manquerait ne sont
     // jamais masquées : l'anomalie sera visible au compte Parent.
     for(const [id,data] of grades){
      if(attempts.some(a=>a.id===id))continue;
      attempts.push({
       id,title:String(data.title||titles.get(id)||id),
       score:Number.isFinite(data.score)?data.score:null,
       total:Number.isFinite(data.total)?data.total:null,
       correctionStatus:'pending-parent',orphan:true
      });
     }
    }catch(readError){
     status.textContent='Lecture des résultats Firebase indisponible. Réessaie après reconnexion.';
     const note=document.createElement('p');
     note.textContent='Les résultats ne sont pas effacés. Ce message signale seulement un échec de lecture de la base.';
     list.append(note);
     console.warn('Lecture directe du suivi Parent refusée :',readError.code||readError.message);
     return;
    }
   }
   // Les évaluations mathématiques, comme les entraînements espagnols,
   // sont corrigées automatiquement : ne pas les mettre en "attente parent".
   // Elles disposent d'un enregistrement privé dédié dans Firestore.
   let mathRecords=[],mathUnavailable=false;
   try{
    const response=await cloudCallable('getMathTrainingProgress')({});
    if(!Array.isArray(response.data?.attempts))throw Error('Historique de mathématiques incomplet');
    mathRecords=response.data.attempts.filter(a=>
     /^MT(?:0[1-9]|1[0-9]|2[0-3])$/.test(String(a.id||'')));
   }catch(mathError){
    mathUnavailable=true;
    console.warn('Lecture du suivi mathématique indisponible :',mathError.code||mathError.message);
   }
   // Les 150 entraînements espagnols et les 23 évaluations de mathématiques
   // sont corrigés immédiatement ; le compteur "en attente" reste réservé
   // aux devoirs dont la correction doit être débloquée.
   const spanishTraining=id=>/^SP[QW]_L(?:0[1-9]|1[0-5])_0[1-5]$/.test(String(id||''));
   const gradedMission=id=>/^DAY_20\d{6}_\d{2}$|^WEEK_20\d{2}W\d{2}$|^SUNDAY_20\d{6}$/.test(String(id||''));
   attempts=attempts.filter(a=>a.id!=='DAY_20261108_01');
   const automatic=[...attempts.filter(a=>spanishTraining(a.id)||gradedMission(a.id)),...mathRecords];
   const schoolAttempts=attempts.filter(a=>!spanishTraining(a.id)&&!gradedMission(a.id));
   const pending=schoolAttempts.filter(a=>a.correctionStatus!=='released');
   const released=schoolAttempts.filter(a=>a.correctionStatus==='released');
   const validatedCount=attempts.length+mathRecords.length;
   status.textContent=pending.length+' devoir'+(pending.length>1?'s':'')+' en attente de correction\n'+validatedCount+' exercice'+(validatedCount>1?'s':'')+' validé'+(validatedCount>1?'s':'')+' en ligne'+(mathUnavailable?' (hors mathématiques momentanément indisponibles)':'');
   status.style.whiteSpace='pre-line';
   if(mathUnavailable){
    const info=document.createElement('p');
    info.textContent='Les résultats de mathématiques ne sont pas accessibles actuellement ; ils ne sont pas inclus dans le total ci-dessus. Réessaie après reconnexion.';
    info.style.cssText='font-size:14px;line-height:1.5;color:#ffd7a6';
    list.append(info);
   }
   if(!releaseServiceAvailable){
    const info=document.createElement('p');
    info.textContent='Consultation des résultats : disponible via Firebase. Autoriser ou reverrouiller les corrections nécessite toujours le service serveur, actuellement inaccessible. Les notes restent enregistrées.';
    info.style.cssText='font-size:14px;line-height:1.5;color:#d8e7ff';
    list.append(info);
   }
   if(!pending.length){
    const empty=document.createElement('p');empty.textContent='Aucun devoir en attente de correction.';list.append(empty);
   }
   const addLine=(item,isReleased,isAutomatic=false)=>{
    // Toutes les données de copies restent privées et sont lues uniquement
    // par le compte Parent : jamais de réponses ou de notes dans l'URL.
    const line=document.createElement('article');
    line.style.cssText='padding:14px;margin:12px 0;border:1px solid #526b8b;border-radius:13px;background:#1a304d;overflow-wrap:anywhere';
    const match=/^SP([QW])_(L(?:0[1-9]|1[0-5]))_0([1-5])$/.exec(String(item.id||''));
    const mathMatch=/^MT(0[1-9]|1[0-9]|2[0-3])$/.exec(String(item.id||''));
    const ex=window.__TIM_DATA?.exercises?.find(e=>e.id===item.id);
    const lesson=mathMatch?window.__TIM_DATA?.lessons?.find(l=>l.id==='MBIS'+mathMatch[1]):
      match?window.TIM_SPANISH_EDU?.[match[2]]:
      window.__TIM_DATA?.lessons?.find(l=>l.id===ex?.lesson);
    const isMission=gradedMission(item.id);
    const subject=mathMatch?'Mathématiques':match?'Espagnol':isMission?'Défi · Espagnol':(ex?.subject||'Exercice');
    const lessonTitle=lesson?.name||lesson?.title||'';
    const exerciseTitle=match?(match[1]==='Q'?'QCM ':'Écriture ')+Number(match[3]):mathMatch?'Évaluation de la sous-leçon · '+mathMatch[1]:(item.title||'Exercice');
    const heading=document.createElement('strong');heading.textContent=subject+(lessonTitle?' · '+lessonTitle:'');
    heading.style.cssText='display:block;font-size:17px;color:#eef5ff';
    const summary=document.createElement('p');
    const score=Number.isFinite(item.score)&&Number.isFinite(item.total)?item.score+'/'+item.total:'Note indisponible';
    summary.textContent=exerciseTitle+' · '+score+' · '+(isAutomatic?'Corrigé immédiatement':isReleased?'Correction autorisée':'Correction en attente')+(isMission&&Number.isFinite(item.xp)?' · '+(item.xp>=0?'+':'')+item.xp+' XP':'');
    summary.style.cssText='margin:5px 0 10px;color:#cbd9ee';
    line.append(heading,summary);
    if(item.orphan){
     const warning=document.createElement('small');
     warning.textContent='Détail enregistré, tentative associée introuvable.';
     line.append(warning);
    }
    if(releaseServiceAvailable&&!isAutomatic){
     const action=document.createElement('button');action.type='button';
     action.textContent=isReleased?'Reverrouiller':'Débloquer la correction';
     action.onclick=async()=>{
      action.disabled=true;
      try{
       await cloudCallable('setParentCorrectionRelease')({id:item.id,released:!isReleased});
       await refreshCorrections();
      }catch(error){
       action.disabled=false;
       alert('Modification non confirmée : fonction Firebase de contrôle indisponible. La note n’a pas été changée.');
      }
     };
     line.append(action);
    }
    const view=document.createElement('button');view.type='button';
    view.textContent='Voir la copie et les réponses';
    view.style.cssText='display:block;padding:10px 13px;margin:7px 0;border-radius:9px;border:1px solid #adcaed;background:#f0f5ff;color:#21385b;font-weight:750;max-width:100%;white-space:normal;text-align:left';
    const copy=document.createElement('div');copy.hidden=true;
    copy.style.cssText='padding:13px 0 3px;border-top:1px solid #58718e;margin-top:12px';
    let loaded=false;
    const note=(value,style='')=>{
     const p=document.createElement('p');p.textContent=String(value??'');
     p.style.cssText='margin:5px 0 10px;white-space:pre-wrap;'+style;copy.append(p);
    };
    view.onclick=async()=>{
     if(!copy.hidden){copy.hidden=true;view.textContent='Voir la copie et les réponses';return;}
     copy.hidden=false;view.textContent='Masquer la copie';
     if(loaded)return;
     note('Chargement de la copie enregistrée…');
     try{
      if(mathMatch){
       // Le même bouton "Voir la copie" fonctionne pour les mathématiques.
       // Le relevé provient de l'API sécurisée, sans contacter de service public.
       const record=item;
       copy.replaceChildren();
       if(!Array.isArray(record.items)||!record.items.length){
        note('La copie détaillée est momentanément indisponible. Actualise les résultats.');
        return;
       }
       const when=new Date(record.submittedAt||'');
       if(Number.isFinite(when.getTime()))
        note('Validé le '+when.toLocaleString('fr-FR',{timeZone:'Europe/Paris'}),'font-size:13px;color:#c3d8f2');
       note('Note : '+record.score+'/'+record.total+' · 0 XP','font-weight:800;font-size:17px');
       const errors=record.items.filter(q=>q.correct===false);
       note(errors.length?
         'Bilan : '+errors.length+' erreur'+(errors.length>1?'s':'')+'. Relire la leçon BIS « '+(lesson?.title||'Mathématiques')+' » et le cours ENT du même chapitre.':
         'Bilan : toutes les réponses sont correctes.','font-weight:600');
       for(const [index,answer] of record.items.entries()){
        const section=document.createElement('section');
        section.style.cssText='margin:12px 0;padding:10px 12px;background:#203954;border:1px solid #506781;border-radius:10px';
        const question=document.createElement('strong');
        question.textContent=(index+1)+'. '+String(answer.prompt||'Question');
        question.style.cssText='display:block;margin-bottom:7px';
        const given=document.createElement('p');
        given.textContent='Réponse de Tim : '+String(answer.response??'');
        given.style.cssText='margin:0 0 5px';
        const result=document.createElement('p');
        result.textContent=answer.correct?'Bonne réponse':'Réponse à revoir';
        result.style.cssText='font-weight:700;margin:0;color:'+(answer.correct?'#a4e9c8':'#ffb6a7');
        section.append(question,given,result);
        if(!answer.correct&&answer.expected!==undefined){
         const expected=document.createElement('p');
         expected.textContent='Réponse attendue : '+String(answer.expected);
         section.append(expected);
        }
        const explain=document.createElement('p');
        explain.textContent=String(answer.explanation||'Revoir la sous-leçon.');
        section.append(explain);copy.append(section);
       }
       loaded=true;
       return;
      }
      // Le service de résumé peut être indisponible : les copies sont déjà
      // lisibles dans privateAttempts via les règles Firestore Parent.
      const [privateDoc,attemptDoc]=await Promise.all([
       getDoc(doc(db,'privateAttempts',item.id)),
       getDoc(doc(db,'attempts',item.id))
      ]);
      copy.replaceChildren();
      if(!privateDoc.exists()){
       note('La copie détaillée n’est pas disponible dans Firebase pour cet exercice.');
       return;
      }
      const record=privateDoc.data();
      const dateValue=attemptDoc.exists()?attemptDoc.data()?.submittedAt:record?.submittedAt;
      const date=dateValue?.toDate?.();
      if(date instanceof Date&&!Number.isNaN(date.getTime()))
       note('Validé le '+date.toLocaleString('fr-FR',{timeZone:'Europe/Paris'}),'font-size:13px;color:#c3d8f2');
      if(Number.isFinite(record.score)&&Number.isFinite(record.total)){
       const gained=attemptDoc.exists()?Number(attemptDoc.data()?.xp):Number(item.xp);
       note('Note : '+record.score+'/'+record.total+(isMission&&Number.isFinite(gained)?' · '+(gained>=0?'+':'')+gained+' XP':''),'font-weight:800;font-size:17px');
      }
      const answers=Array.isArray(record.answers)?record.answers:[];
      if(!answers.length){
       note('Les questions et les réponses de cette tentative ne sont pas conservées dans ce dossier.');
       loaded=true;return;
      }
      const training=match?window.TIM_SPANISH_TRAINING_ENGINE?.buildSpanishTasks?.(item.id,window.TIM_SPANISH_EDU):null;
      for(const [index,answer] of answers.entries()){
       const exerciseQuestion=ex?.questions?.[index];
       const taskQuestion=training?.questions?.[index];
       let response=String(answer.response??'');
       // Un QCM sauvegarde l'index du choix : afficher sa vraie réponse,
       // pas le numéro de case coché (0, 1, 2 ou 3).
       const choices=taskQuestion?.type==='mc'?taskQuestion.choices:
        exerciseQuestion?.type==='mc'?exerciseQuestion.options:null;
       if(Array.isArray(choices)&&/^\d+$/.test(response)&&choices[Number(response)]!==undefined)
        response=String(choices[Number(response)]);
       const section=document.createElement('section');
       section.style.cssText='margin:12px 0;padding:10px 12px;background:#203954;border:1px solid #506781;border-radius:10px';
       const question=document.createElement('strong');
       question.textContent=(index+1)+'. '+String(answer.question||answer.prompt||taskQuestion?.prompt||exerciseQuestion?.q||'Question');
       question.style.cssText='display:block;margin-bottom:7px';
       const responseLine=document.createElement('p');responseLine.textContent='Réponse de Tim : '+response;
       responseLine.style.cssText='margin:0 0 5px;white-space:pre-wrap';
       section.append(question,responseLine);
       const result=document.createElement('p');
       result.textContent=answer.correct===true?'Bonne réponse':answer.correct===false?'Réponse à revoir':'Réponse enregistrée';
       result.style.cssText='font-weight:700;margin:0;color:'+(answer.correct===false?'#ffb6a7':'#a4e9c8');
       section.append(result);
       if(answer.correct===false&&answer.expected!==undefined){
        const expected=document.createElement('p');
        expected.textContent='Réponse attendue : '+String(answer.expected);
        expected.style.cssText='margin:6px 0 0';section.append(expected);
       }
       copy.append(section);
      }
      loaded=true;
     }catch(error){
      copy.replaceChildren();
      note('Impossible de charger la copie pour le moment. Réessaie après reconnexion.');
      console.warn('Copie Parent indisponible :',error.code||error.message);
     }
    };
    line.append(view,copy);
    list.append(line);
   };
   automatic.forEach(x=>addLine(x,true,true));
   released.forEach(x=>addLine(x,true));
   pending.forEach(x=>addLine(x,false));
   const reload=document.createElement('button');reload.type='button';
   reload.textContent='Actualiser les résultats';
   reload.style.cssText='padding:10px 15px;margin-top:12px;border-radius:8px;border:1px solid #93b1e1;background:#f0f5ff;color:#1c3157;font-weight:700;cursor:pointer';
   reload.onclick=async()=>{reload.disabled=true;await refreshCorrections();};
   list.append(reload);
  };
  refreshCorrections();
 }
 document.getElementById('login-form').hidden=false;
 access.hidden=true;document.body.classList.add('ready');
 document.getElementById('account-name').textContent=isParent?'Espace parent — compte connecté':'Espace Tim — compte connecté';
 document.querySelectorAll('[data-nav="parent"]').forEach(el=>el.hidden=!isParent);
 document.getElementById('logout-button').onclick=()=>signOut(auth);
 const sc=document.createElement('script');sc.src='./app.js?v=espagnol-13x3-20261110';sc.onerror=()=>{stopApp();message('Le module pédagogique du classeur n’a pas chargé.');};
 sc.addEventListener('load',()=>{try{if(document.querySelector('.mission-hero'))window.TIM_INTRO_SHOW?.();}catch(e){console.warn('Animation d’ouverture indisponible :',e);}});
 document.body.append(sc);appLoaded=true;
}

// Netlify Drop: Firebase Web config (public client identifiers, never passwords).
const CONFIG_STORAGE_KEY='mi-espanol-firebase-web-config';
function parseFirebaseConfig(s){
  let c;if(s&&typeof s==='object'){c=s;}else try{c=JSON.parse(s);}catch(_){c={};for(const m of s.matchAll(/(apiKey|authDomain|projectId|appId|messagingSenderId|storageBucket|measurementId|appCheckSiteKey)\s*:\s*["']([^"']+)["']/g))c[m[1]]=m[2];}
  if(!c || c.projectId!=='classeur-ba3e7' || !c.apiKey || !c.authDomain || !c.appId) throw Error('Configuration incomplète ou projet différent de classeur-ba3e7.');
  // L'authentification Firebase peut être initialisée sans App Check ; les fonctions protégées restent indisponibles sans sa clé.
  return c;
}
function shareAddress(c){return location.origin+location.pathname+'#fb='+encodeURIComponent(JSON.stringify(c));}
function configureHelp(){
  const p=document.createElement('details');p.id='firebase-setup';const summary=document.createElement('summary');summary.textContent='Configuration de la connexion privée (parent)';p.append(summary);document.getElementById('login-form').hidden=true;p.style.cssText='margin-top:14px;border-top:1px solid #dde4ee;padding-top:12px';
  const tip=document.createElement('p');tip.textContent='Pour utiliser ton projet Classeur, copie le bloc firebaseConfig depuis Firebase > Paramètres du projet > Tes applications > Espanol Tim. Les valeurs de configuration sont des identifiants publics du site, jamais un mot de passe.';
  const t=document.createElement('textarea');t.id='firebase-config-text';t.rows=9;t.placeholder='Colle ici le bloc const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "classeur-ba3e7", appId: "..." };';t.style.cssText='width:100%;border:1px solid #bbc6d6;border-radius:12px;padding:12px;background:#fff;color:#12223d;font-size:12px';
  const b=document.createElement('button');b.textContent='Enregistrer la configuration';b.onclick=()=>{try{const c=parseFirebaseConfig(t.value);localStorage.setItem(CONFIG_STORAGE_KEY,JSON.stringify(c));location.href=shareAddress(c);}catch(e){message(e.message);}};
  p.append(tip,t,b);access.append(p);message('Visite en invité disponible. La connexion privée nécessite la configuration Firebase sur ce téléphone.',true);
}
function installShareLink(c){
  if(document.getElementById('share-setup-link'))return;
  const b=document.createElement('button');b.id='share-setup-link';b.type='button';b.style.cssText='margin-top:12px;background:#e9edff;color:#3b49ae;';b.textContent='Copier le lien pour l’iPhone de Tim';
  b.onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);b.textContent='Lien copié';}catch(e){message('Impossible de copier automatiquement : ouvre la page dans Chrome.');}};
  access.append(b);
}
// Firebase Web identifiers are public; no user credentials are stored in source.
const DEFAULT_FIREBASE_CONFIG={
  apiKey:'AIzaSyBjKcuPZ5AcaHiZ44-3W1yIQzAun9mZH9c',
  authDomain:'classeur-ba3e7.firebaseapp.com',
  projectId:'classeur-ba3e7',
  storageBucket:'classeur-ba3e7.firebasestorage.app',
  messagingSenderId:'418090384222',
  appId:'1:418090384222:web:4e2c1e264fdd7352e02dcf'
};
function loadConfiguredFirebase(){
  // A previously saved App Check site key is retained if present.
  let saved={};
  try{
    const stored=localStorage.getItem(CONFIG_STORAGE_KEY);
    if(stored){const candidate=JSON.parse(stored);if(candidate?.projectId===DEFAULT_FIREBASE_CONFIG.projectId)saved=candidate;}
    if(location.hash.startsWith('#fb=')){
      const candidate=parseFirebaseConfig(decodeURIComponent(location.hash.slice(4)));
      saved=candidate;
      localStorage.setItem(CONFIG_STORAGE_KEY,JSON.stringify(candidate));
      history.replaceState(null,'',location.pathname+location.search);
    }
  }catch(e){console.warn('Configuration personnalisée ignorée :',e);}
  return parseFirebaseConfig({...DEFAULT_FIREBASE_CONFIG,...saved});
}
try{
 const cfg=loadConfiguredFirebase();
 if(!cfg){
  document.getElementById('tim-enter').addEventListener('click',()=>message('Configuration Firebase nécessaire pour la connexion de Tim.'));
  document.getElementById('parent-enter').addEventListener('click',()=>message('Configuration Firebase nécessaire pour la connexion Parent.'));
  throw {setupWaiting:true};
 }
 installShareLink(cfg);
 const app=initializeApp(cfg);auth=getAuth(app);db=getFirestore(app);
 const appCheckSiteKey=String(cfg.appCheckSiteKey||'').trim();
 if(appCheckSiteKey){initializeAppCheck(app,{provider:new ReCaptchaV3Provider(appCheckSiteKey),isTokenAutoRefreshEnabled:true});}
 else {console.info('App Check absent : les fonctions Firebase directes nécessitent sa clé. Le serveur Cloudflare utilise les jetons Firebase signés si ce service est configuré.');}
 functionsApi=getFunctions(app,'europe-west1');
 form.addEventListener('submit',async(e)=>{
  e.preventDefault();button.disabled=true;message('Connexion en cours…');
  try{if(!selectedRole)throw new Error('Choisir un espace');const credential=await signInWithEmailAndPassword(auth,document.getElementById('login-email').value.trim(),document.getElementById('login-password').value);if(credential.user.uid!==(selectedRole==='tim'?TIM_UID:PARENT_UID)){await signOut(auth);throw new Error('Mauvais espace');}document.getElementById('login-password').value='';}
  catch(e){message('Connexion refusée : vérifie ton adresse et ton mot de passe.');}finally{button.disabled=false;}
 });
 document.getElementById('logout-button').onclick=()=>signOut(auth);
 onAuthStateChanged(auth,async(user)=>{
  if(window.__TIM_GUEST)return;
  if(!user){if(appLoaded){window.location.reload();return;}stopApp();document.getElementById('login-form').hidden=!selectedRole;roleChoices.hidden=Boolean(selectedRole);message('Choisis Invité, Tim ou Parent.',true);return;}
  if(!selectedRole){
   // Ne pas ouvrir automatiquement un espace privé sans choix explicite.
   roleChoices.hidden=false;form.hidden=true;message('Choisis Invité, Tim ou Parent.',true);return;
  }
  const expected=selectedRole==='tim'?TIM_UID:PARENT_UID;
  if(user.uid!==expected){await signOut(auth);message('Ce compte ne correspond pas à l’espace choisi.');return;}
  await startSession(user);
 });
}catch(err){if(!err.setupWaiting){stopApp();message('Impossible d’ouvrir Firebase : '+(err.message||'Erreur de configuration'));}}
