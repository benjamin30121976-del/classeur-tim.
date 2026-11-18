/* Import de LOT ENT unifié, sans inventer d'accès ENT.
 * ZIP préparé à partir des collectes Termux, leçons rédigées et vérifiées.
 * Tous les PDF restent PRIVÉS, importés uniquement après confirmation Parent.
 */
(function(){'use strict';
const $=(tag,txt,cls)=>{const el=document.createElement(tag);if(txt!==undefined)el.textContent=txt;if(cls)el.className=cls;return el;};
const ID=/^[A-Za-z][A-Za-z0-9_-]{1,35}$/;
const SHA=/^[0-9a-f]{64}$/i;
const DATE=/^20\d\d-\d\d-\d\d$/;
const TYPES={'pdf':'application/pdf','png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg',
 'webp':'image/webp','gif':'image/gif','docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'odt':'application/vnd.oasis.opendocument.text','txt':'text/plain'};
const limit=4*1024*1024;
function fail(message){throw Error(message);}
const unique=x=>new Set(x).size===x.length;
const str=x=>String(x??'').trim();
function validQuestions(ex){
 if(!Array.isArray(ex.questions)||ex.questions.length!==10)return false;
 return ex.questions.every(q=>{
  if(!str(q.q)||str(q.why).length<30)return false;
  if(q.type==='text')return Boolean(str(q.right));
  if(q.type==='mc')return Array.isArray(q.options)&&q.options.length===4&&
   unique(q.options.map(x=>str(x).toLowerCase()))&&Number.isInteger(q.right)&&q.right>=0&&q.right<4;
  return false;
 });
}
function checkPack(pack,manifest,existing={lessons:[],exercises:[]}){
 if(manifest?.schema!=='tim-ent-batch-v1')fail('Format de manifeste inconnu.');
 const lessons=pack?.lessons,exercises=pack?.exercises,docs=manifest.documents,homework=manifest.homework;
 if(!Array.isArray(lessons)||!Array.isArray(exercises)||!Array.isArray(docs)||!Array.isArray(homework)||
    !Array.isArray(manifest.sources))fail('Lot incomplet : cours, exercices, devoirs, sources ou documents absents.');
 if(lessons.length+exercises.length>120)fail('Lot supérieur à 120 fiches, fractionnement nécessaire.');
 if(docs.length>150)fail('Lot supérieur à 150 pièces jointes.');
 const all=[...lessons,...exercises],ids=all.map(x=>x.id);
 if(!unique(ids)||ids.some(x=>!ID.test(str(x))))fail('Identifiants de leçons/exercices invalides ou doublés.');
 const existingLessons=new Map((existing.lessons||[]).map(x=>[x.id,x]));
 const existingEx=new Map((existing.exercises||[]).map(x=>[x.id,x]));
 const already=[];
 function same(a,b){
  const clean=x=>JSON.stringify(Object.fromEntries(Object.entries(x)
   .filter(([k])=>!['publishedAt','savedAt','revisionId'].includes(k)).sort(([a],[b])=>a.localeCompare(b))));
  return clean(a)===clean(b);
 }
 for(const lesson of lessons){
  if(lesson.timEntBatch!==true||!['ent','bis'].includes(lesson.kind)||!str(lesson.entId)||
     !str(lesson.chapter)||!str(lesson.title)||!str(lesson.subject)||!Array.isArray(lesson.blocks)||!lesson.blocks.length||
     !lesson.help||!str(lesson.help.simple)||!Array.isArray(lesson.help.steps))
   fail('Leçon ENT/BIS incomplète : '+lesson.id);
  if(existingLessons.has(lesson.id)){
   if(!same(existingLessons.get(lesson.id),lesson))fail('Leçon déjà publiée mais différente : '+lesson.id);
   already.push(lesson.id);
  }
 }
 for(const ex of exercises){
  if(ex.timEntBatch!==true||!str(ex.title)||!validQuestions(ex))fail('Exercice sans dix corrections pédagogiques : '+ex.id);
  if(!['training','homework-bonus'].includes(ex.kind))fail('Catégorie d’exercice non prise en charge dans ce lot : '+ex.id);
  if(ex.kind==='training'&&(ex.category!=='training'||ex.homeworkBonus===true))
   fail('Catégorie entraînement invalide : '+ex.id);
  if(ex.kind==='homework-bonus'&&
     (ex.homeworkBonus!==true||ex.category!=='bonus'||!DATE.test(ex.homeworkDue)||!ex.linkedHomework?.length))
   fail('Lien ENT ou échéance du bonus absent : '+ex.id);
  if(!lessons.some(l=>l.id===ex.lesson)&&!existingLessons.has(ex.lesson))
   fail('Leçon de rattachement absente : '+ex.id);
  if(existingEx.has(ex.id)){
   if(!same(existingEx.get(ex.id),ex))fail('Exercice déjà publié mais différent : '+ex.id);
   already.push(ex.id);
  }
 }
 const dailyTarget=Number(manifest.dailyTrainingRequired||0);
 if(!Number.isInteger(dailyTarget)||dailyTarget<0||dailyTarget>5)
   fail('Nombre d’entraînements quotidiens invalide.');
 const dailyCount=exercises.filter(e=>e.kind==='training'&&e.practiceRole==='daily-review').length;
 if(dailyCount<dailyTarget)fail('Entraînements quotidiens manquants : '+dailyCount+'/'+dailyTarget);
 const hIds=homework.map(h=>String(h.entId));
 if(!unique(hIds))fail('Devoir ENT dupliqué.');
 for(const h of homework){
  if(!str(h.entId)||!DATE.test(String(h.due||''))||!str(h.subject)||!str(h.title))
   fail('Devoir ENT sans matière/date/intitulé : '+h.entId);
  if(!exercises.some(e=>e.homeworkBonus===true&&e.homeworkDue===h.due&&
      e.subject===h.subject&&e.linkedHomework.map(String).includes(String(h.entId))) &&
      !(existing.exercises||[]).some(e=>e.homeworkBonus===true&&e.homeworkDue===h.due&&
       e.subject===h.subject&&e.linkedHomework?.map(String).includes(String(h.entId))))
   fail('Devoir sans exercice corrigé associé : '+h.entId);
 }
 const sourceIds=new Set(manifest.sources.map(s=>String(s.entId)));
 for(const source of manifest.sources){
  if(!str(source.entId)||!['lesson','homework'].includes(source.kind)||
     !Array.isArray(source.targets)||!source.targets.every(t=>ID.test(str(t))))
   fail('Provenance ou correspondance ENT manquante.');
  if(source.kind==='lesson'&&source.needsBis===true){
   const own=lessons.filter(l=>l.entId===source.entId);
   if(!own.some(l=>l.kind==='ent')||!own.some(l=>l.kind==='bis'))
    fail('Cours ENT ou BIS manquant pour '+source.entId);
   if(!own.some(l=>exercises.some(e=>e.kind==='training'&&e.lesson===l.id)))
    fail('Exercice de leçon manquant pour '+source.entId);
  }
 }
 const docIds=docs.map(d=>String(d.entId)+'|'+String(d.path));
 if(!unique(docIds))fail('Pièce jointe dupliquée.');
 for(const d of docs){
  const path=str(d.path),ext=str(d.fileName).split('.').pop().toLowerCase();
  if(!sourceIds.has(String(d.entId))||!ID.test(str(d.targetId))||
     !manifest.sources.some(s=>String(s.entId)===String(d.entId)&&s.targets.includes(d.targetId)))
   fail('Document ENT non relié au cours/devoir d’origine : '+d.entId);
  if(!path.startsWith('pieces_ENT/')||path.includes('..')||path.includes('\\')||
     !TYPES[ext]||d.mime!==TYPES[ext]||!SHA.test(str(d.sha256))||
     !Number.isInteger(d.size)||d.size<1||d.size>limit)
   fail('Document ENT invalide ou dépasse 4 Mo : '+path);
 }
 return {lessons:lessons.length,exercises:exercises.length,homework:homework.length,
  documents:docs.length,already,remaining:all.filter(x=>!already.includes(x.id)).length};
}
async function sha(bytes){
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
async function prepare(file,data){
 if(!window.JSZip)fail('Lecteur ZIP indisponible.');
 if(!file||!file.size||file.size>90*1024*1024)fail('ZIP absent ou trop volumineux (90 Mo maximum).');
 const zip=await window.JSZip.loadAsync(file,{checkCRC32:true});
 const manifestEntry=zip.file('MANIFESTE_LOT_TIM.json'),packEntry=zip.file('PACK_PEDAGOGIQUE.json');
 if(!manifestEntry||!packEntry)fail('Archive incomplète : manifeste ou lot pédagogique absent.');
 const manifest=JSON.parse(await manifestEntry.async('string'));
 const pack=JSON.parse(await packEntry.async('string'));
 const report=checkPack(pack,manifest,data);
 const docs=[];
 for(const d of manifest.documents){
  const entry=zip.file(d.path);
  if(!entry)fail('Document original absent du ZIP : '+d.path);
  const bytes=await entry.async('uint8array');
  if(bytes.length!==d.size||await sha(bytes)!==d.sha256.toLowerCase())
   fail('Document original altéré : '+d.path);
  if(d.mime==='application/pdf'&&String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')
   fail('Faux PDF : '+d.path);
  docs.push({...d,bytes});
 }
 return {pack,manifest,docs,report};
}
function render(){
 const panel=$('section',undefined,'panel tim-ent-batch-import');
 panel.id='tim-ent-batch-import';
 if(!window.__TIM_PARENT||window.__TIM_GUEST)return panel;
 panel.append($('h3','ENT — importer cours, devoirs, exercices et originaux dans le classeur'),
  $('p','Sélectionne le lot validé à partir de Termux. Les PDF restent privés et sont placés dans leurs leçons. Aucune note, copie ou XP de Tim ne sera modifié.'));
 const input=$('input');input.type='file';input.accept='.zip,application/zip';
 input.setAttribute('aria-label','Lot ENT vérifié pour le classeur');
 const status=$('p','Sélectionne le ZIP : aucun import n’a été effectué.');
 status.setAttribute('role','status');
 const submit=$('button','Vérifier puis importer les éléments manquants','plain');
 submit.disabled=true;submit.type='button';
 panel.append(input,submit,status);
 let prepared=null,busy=false;
 input.onchange=async()=>{
  submit.disabled=true;prepared=null;status.textContent='Contrôle des cours, questions, échéances et fichiers…';
  try{
   const data=window.__TIM_DATA||{lessons:[],exercises:[]};
   prepared=await prepare(input.files?.[0],data);
   const r=prepared.report;
   status.textContent=r.lessons+' leçons · '+r.exercises+' exercices corrigés · '+
     r.homework+' devoirs · '+r.documents+' originaux vérifiés (SHA-256). '+
     r.already.length+' contenu(s) déjà présent(s). Aucun import effectué.';
   submit.disabled=false;
  }catch(e){status.textContent='Lot refusé : '+String(e?.message||e);}
 };
 submit.onclick=async()=>{
  if(busy||!prepared||!window.__TIM_PARENT||window.__TIM_GUEST)return;
  const api=window.__TIM_BRIDGE;
  if(!api?.publish||!api.publishEntHomeworks||!api.attachments?.upload||!api.attachments?.read){
   status.textContent='Import impossible : services Parent indisponibles.';return;
  }
  if(!window.confirm('Confirmer l’import du lot ENT validé dans le classeur privé ? Aucun résultat de Tim ne sera modifié.'))return;
  busy=true;input.disabled=true;submit.disabled=true;
  let added=0,hw=0,docsDone=0,skipped=0;
  try{
   const ignore=new Set(prepared.report.already);
   const pack={
    lessons:prepared.pack.lessons.filter(x=>!ignore.has(x.id)),
    exercises:prepared.pack.exercises.filter(x=>!ignore.has(x.id))
   };
   if(pack.lessons.length+pack.exercises.length){
    status.textContent='Publication des nouvelles leçons et exercices vérifiés…';
    added=await api.publish(pack);
   }
   status.textContent='Rattachement des devoirs futurs à leur échéance…';
   hw=await api.publishEntHomeworks(prepared.manifest.homework);
   for(const [i,d] of prepared.docs.entries()){
    status.textContent='Placement des originaux dans les leçons : '+(i+1)+'/'+prepared.docs.length;
    const records=await api.attachments.list('lesson',d.targetId);
    const old=records.find(x=>x.sha256===d.sha256);
    if(old){skipped++;continue;}
    if(records.some(x=>x.fileName===d.fileName))fail('Conflit : fichier différent sous le même nom pour '+d.targetId);
    const file=new File([d.bytes],d.fileName,{type:d.mime});
    await api.attachments.upload('lesson',d.targetId,file,d.title||d.fileName,()=>{});
    const saved=(await api.attachments.list('lesson',d.targetId)).find(x=>x.sha256===d.sha256);
    if(!saved)fail('Original non retrouvé après import : '+d.fileName);
    const blob=await api.attachments.read(saved);
    if(blob.size!==d.size||await sha(await blob.arrayBuffer())!==d.sha256.toLowerCase())
      fail('Contrôle d’intégrité après publication impossible : '+d.fileName);
    docsDone++;
   }
   status.textContent='Import vérifié : '+added+' cours/exercices, '+hw+' devoirs, '+
    docsDone+' documents ajoutés, '+skipped+' documents déjà présents. Recharge le classeur pour voir les nouveautés.';
   panel.dataset.importComplete='1';
  }catch(e){
   status.textContent='Import PARTIEL : '+added+' cours/exercices, '+hw+' devoirs, '+
    docsDone+' documents. '+String(e?.message||e)+'. Ne pas appeler Tim ; reprendre ce lot après vérification.';
  }finally{busy=false;input.disabled=false;submit.disabled=false;}
 };
 return panel;
}
window.TIM_ENT_BATCH={render,checkPack,prepare};
})();