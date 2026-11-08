import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,deleteDoc,collection,getDocs,serverTimestamp,runTransaction} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';
import {makeAttachmentBridge} from './attachments.js';

// Only the two existing Firebase Authentication users are authorized.
// Security does NOT rely on these frontend constants: Firestore Rules enforce them.
const TIM_UID='uqZI3Up97YWzKvWhssWQidn4TJO2';
const PARENT_UID='BPEuNAhHVyX8ewQ2I54s56m11vj1';
const access=document.getElementById('access');
const status=document.getElementById('access-status');
const form=document.getElementById('login-form');
const button=document.getElementById('login-button');
let auth,db,activeUser,appLoaded=false,unsubscribe=null;
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
 const payload=JSON.stringify({event:'exercise_validated',exerciseId:id,title:saved.title,score:saved.score,total:saved.total,submittedAt:saved.date});
 try {if(navigator.sendBeacon && navigator.sendBeacon(url,new Blob([payload],{type:'text/plain'})))return;}
 catch(e){}
 try{await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:payload,keepalive:true});}catch(e){console.warn('Notification Make non envoyée',e);}
}
async function runFirebaseDiagnostic(){
 if(activeUser?.uid!==PARENT_UID)throw Error('Réservé au parent.');
 const key='test_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
 const ref=doc(db,'test_attempts',key), data={authorUid:PARENT_UID,answers:['tengo','incorrect'],submittedAt:serverTimestamp(),kind:'diagnostic-sans-note'};
 let created=false, read=false, locked=false, erased=false;
 try{
  await setDoc(ref,data);created=true;
  const snapshot=await getDoc(ref);read=snapshot.exists()&&snapshot.data().answers[0]==='tengo';
  try{await setDoc(ref,{...data,kind:'update-interdite'});}catch(_){locked=true;}
  return {created,read,locked,erased:true};
 }finally{
  if(created){await deleteDoc(ref);erased=true;}
 }
}
async function fetchAttempts(content){
 const docs=await getDocs(collection(db,'attempts'));
 const map=new Map(content.exercises.map(x=>[x.id,x]));
 // Reconstituer également les anciennes missions uniques (jours et semaines passés).
 const list=[];docs.forEach(d=>{const a=d.data();let ex=map.get(d.id),values=a.answers;
  if(/^(DAY_20\d{6}|WEEK_20\d{2}W\d{2}|SUNDAY_20\d{6})$/.test(d.id)&&Array.isArray(values)){
   // Les réponses transportent les références exactes des questions : le contrôle ne change pas si de nouveaux cours sont ajoutés.
   try{const decoded=values.map(v=>JSON.parse(v));if(decoded.every(v=>v&&typeof v.ref==='string'&&typeof v.v==='string')){
    const frozen=window.__TIM_CHALLENGE_FROM_REFS?.(d.id,content,decoded.map(v=>v.ref));
    if(frozen){ex=frozen;const at=content.exercises.findIndex(x=>x.id===d.id);if(at>=0)content.exercises[at]=frozen;else content.exercises.push(frozen);map.set(d.id,frozen);values=decoded.map(v=>v.v);}
   }}catch(e){}
   if(!ex){ex=window.__TIM_CHALLENGE_ENSURE?.(content,d.id);if(ex)map.set(d.id,ex);}
  }
  if(ex&&Array.isArray(values)&&values.length===ex.questions.length)list.push(result(ex,values,a.submittedAt,a.policyVersion));});
 list.sort((a,b)=>a.date.localeCompare(b.date));window.__CLOUD_ATTEMPTS=list;return list;
}
function stopApp(){if(window.__TIM_GUEST)return;document.body.classList.remove('ready');access.hidden=false;appLoaded=false;window.__CLOUD_ATTEMPTS=[];
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
 let snapshot;try{snapshot=await getDoc(doc(db,'content','main'));}catch(e){message('Les règles Firestore bloquent encore la lecture des cours. Configure les règles correspondantes avant de continuer.');return;}
 if(!snapshot.exists()){if(isParent)showImport();else message('Les cours ne sont pas encore chargés. Le parent doit les importer.');return;}
 let content=decodeFromFirestore(snapshot.data());if(!Array.isArray(content.lessons)||!Array.isArray(content.exercises)){message('Le contenu du cours est incomplet.');return;}
 // V16 Cloudflare : 23 leçons BIS déjà disponibles, sans import manuel ni écrasement Firebase.
 const builtInBis=window.TIM_MATHS_BIS_PACK?.lessons||[];
 const knownLessonIds=new Set(content.lessons.map(l=>l.id));
 content={...content,lessons:[...content.lessons,...builtInBis.filter(l=>!knownLessonIds.has(l.id))]};
 try{content=await loadCourseAdditions(content);}catch(e){console.warn('Extension de cours indisponible avant mise à jour des règles Firebase :',e);}
 content=window.TIM_APPLY_SPANISH_NOV05?.(content)||content;
 if(window.__TIM_CHALLENGE_SETUP) content=window.__TIM_CHALLENGE_SETUP(content);
 window.__TIM_DATA=content;window.__TIM_PARENT=isParent;
 window.__CLOUD_ATTEMPTS=[];
 try{await fetchAttempts(content);}catch(e){message('Impossible de lire les résultats. Les règles Firestore sont à vérifier.');return;}
 window.__TIM_BRIDGE={
  submit:async(id,values)=>{
   if(window.__TIM_GUEST||activeUser.uid!==TIM_UID)throw Error('Seul Tim peut valider les exercices.');
   if(!window.TIM_XP?.canSubmit(window.__TIM_DATA.exercises.find(q=>q.id===id),new Date()))throw Error('Ce défi n’est plus disponible pour cette date.');
   const ex=window.__TIM_DATA.exercises.find(q=>q.id===id);
   if(!ex||!Array.isArray(values)||values.length!==ex.questions.length)throw Error('Exercice ou réponses invalides.');
   // Firestore security rules prevent overwrite: one document per exercise id, create only.
   const stored=['daily','weekly','sunday'].includes(ex.kind)?values.map((v,i)=>JSON.stringify({ref:ex.questions[i].sourceId,v:String(v)})):values;
   await setDoc(doc(db,'attempts',id),{exerciseId:id,authorUid:TIM_UID,answers:stored,submittedAt:serverTimestamp(),policyVersion:12});
   return result(ex,values,new Date(),12);
  },
  refresh:async()=>fetchAttempts(window.__TIM_DATA),
  publish:publishCoursePack,
  saveLesson:saveEditableLesson,
  attachments:makeAttachmentBridge(db,()=>activeUser,PARENT_UID,TIM_UID),
  diagnose:runFirebaseDiagnostic,
  saveAlertWebhook,
  readAlertWebhook,
  notifyAlert,
  logout:async()=>signOut(auth)
 };
 document.getElementById('login-form').hidden=false;
 access.hidden=true;document.body.classList.add('ready');
 document.getElementById('account-name').textContent=isParent?'Espace parent — compte connecté':'Espace Tim — compte connecté';
 document.querySelectorAll('[data-nav="parent"]').forEach(el=>el.hidden=!isParent);
 document.getElementById('logout-button').onclick=()=>signOut(auth);
 const sc=document.createElement('script');sc.src='./app.js';sc.onerror=()=>{stopApp();message('Le module pédagogique du classeur n’a pas chargé.');};
 sc.addEventListener('load',()=>{try{if(document.querySelector('.mission-hero'))window.TIM_INTRO_SHOW?.();}catch(e){console.warn('Animation d’ouverture indisponible :',e);}});
 document.body.append(sc);appLoaded=true;
}

// Netlify Drop: Firebase Web config (public client identifiers, never passwords).
const CONFIG_STORAGE_KEY='mi-espanol-firebase-web-config';
function parseFirebaseConfig(s){
  let c;try{c=JSON.parse(s);}catch(_){c={};for(const m of s.matchAll(/(apiKey|authDomain|projectId|appId|messagingSenderId|storageBucket|measurementId)\s*:\s*["']([^"']+)["']/g))c[m[1]]=m[2];}
  if(!c || c.projectId!=='classeur-ba3e7' || !c.apiKey || !c.authDomain || !c.appId) throw Error('Configuration incomplète ou projet différent de classeur-ba3e7.');
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
  b.onclick=async()=>{try{await navigator.clipboard.writeText(shareAddress(c));b.textContent='Lien copié';}catch(e){message('Impossible de copier automatiquement : ouvre la page dans Chrome.');}};
  access.append(b);
}
function loadConfiguredFirebase(){
  try{
    if(location.hash.startsWith('#fb=')){
      const c=parseFirebaseConfig(decodeURIComponent(location.hash.slice(4)));
      localStorage.setItem(CONFIG_STORAGE_KEY,JSON.stringify(c));
      history.replaceState(null,'',location.pathname+location.search);
      return c;
    }
    const stored=localStorage.getItem(CONFIG_STORAGE_KEY);
    if(stored) return parseFirebaseConfig(stored);
  }catch(e){message('Configuration du projet non reconnue : '+e.message);}
  configureHelp();return null;
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
