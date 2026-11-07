// V15 — Pièces jointes privées. Aucun hébergement Firebase Storage ou Netlify Function requis.
// Les fichiers sont découpés en documents Firestore, lus seulement à l'ouverture.
import {collection, query, where, getDocs, getDoc, setDoc, deleteDoc, doc, serverTimestamp, Bytes} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';

export const ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;
export const ATTACHMENT_CHUNK_BYTES = 300 * 1024;
const FORMATS = Object.freeze({
  pdf:'application/pdf', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg',
  webp:'image/webp', gif:'image/gif', txt:'text/plain',
  docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  odp:'application/vnd.oasis.opendocument.presentation',
  odt:'application/vnd.oasis.opendocument.text'
});
const MAX_CHUNKS=Math.ceil(ATTACHMENT_MAX_BYTES/ATTACHMENT_CHUNK_BYTES);
const permitted = (uid,parent,tim)=>uid===parent||uid===tim;
const errorMessage=e=>{
 const s=String(e?.code||'')+' '+String(e?.message||e||'');
 return /permission-denied/i.test(s)?'Accès refusé : ajoute les deux règles « attachments » et « attachment_chunks » fournies dans le fichier INSTALLATION_V15.txt, sans effacer tes anciennes règles Firebase.':s;
};
function assertFile(file){
 if(!file || !Number.isFinite(file.size) || file.size<=0 || file.size>ATTACHMENT_MAX_BYTES)
   throw Error('Fichier vide ou trop volumineux. Maximum : 4 Mo par pièce jointe.');
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 if(!Object.hasOwn(FORMATS,ext))throw Error('Format non autorisé. PDF, images PNG/JPEG/WebP/GIF, TXT, DOCX, PPTX, XLSX, ODP ou ODT uniquement.');
 if(file.name.length>120)throw Error('Le nom du fichier est trop long (120 caractères maximum).');
 return {ext,mime:FORMATS[ext]};
}
function magicValid(bytes,ext){
 const head=Array.from(bytes.slice(0,12));
 const ascii=String.fromCharCode(...head);
 if(ext==='pdf')return ascii.startsWith('%PDF-');
 if(ext==='png')return head.slice(0,8).join(',')==='137,80,78,71,13,10,26,10';
 if(['jpg','jpeg'].includes(ext))return head[0]===255&&head[1]===216&&head[2]===255;
 if(ext==='gif')return ascii.startsWith('GIF87a')||ascii.startsWith('GIF89a');
 if(ext==='webp')return ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WEBP';
 if(['docx','pptx','xlsx','odt','odp'].includes(ext))return ascii.startsWith('PK\x03\x04');
 return ext==='txt';
}
async function sha256(bytes){
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
function validateTarget(kind,targetId){
 if(!['lesson','exercise'].includes(kind)||typeof targetId!=='string'||!(/^[A-Za-z][A-Za-z0-9_-]{1,35}$/.test(targetId)))throw Error('Cours ou exercice associé invalide.');
}
export function makeAttachmentBridge(db,getUser,parentUid,timUid){
 const owner=()=>{if(getUser()?.uid!==parentUid)throw Error('Réservé au compte parent.');};
 const reader=()=>{if(!permitted(getUser()?.uid,parentUid,timUid))throw Error('Connexion autorisée requise.');};
 async function list(kind,targetId){
  reader();validateTarget(kind,targetId);
  try{
   const records=await getDocs(query(collection(db,'attachments'),where('targetId','==',targetId)));
   return records.docs.map(x=>({id:x.id,...x.data()})).filter(x=>x.targetKind===kind&&x.ready===true)
     .sort((a,b)=>String(a.fileName).localeCompare(String(b.fileName),'fr'));
  }catch(e){throw Error(errorMessage(e));}
 }
 async function upload(kind,targetId,file,label,onProgress=()=>{}){
  owner();validateTarget(kind,targetId);
  const {mime,ext}=assertFile(file),title=String(label||file.name).trim().slice(0,120);
  if(!title)throw Error('Indique un titre.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!magicValid(bytes,ext))throw Error('Ce fichier ne semble pas correspondre à son extension.');
  const hash=await sha256(bytes),count=Math.ceil(bytes.length/ATTACHMENT_CHUNK_BYTES);
  if(count>MAX_CHUNKS)throw Error('Fichier trop volumineux.');
  // Identifiant aléatoire non prévisible ; les anciens documents restent intacts.
  const id=doc(collection(db,'attachments')).id;
  const written=[];
  try{
   for(let i=0;i<count;i++){
    const from=i*ATTACHMENT_CHUNK_BYTES;
    const chunkRef=doc(db,'attachment_chunks',id+'_'+i);
    await setDoc(chunkRef,{ownerUid:parentUid,attachmentId:id,index:i,bytes:Bytes.fromUint8Array(bytes.slice(from,from+ATTACHMENT_CHUNK_BYTES))});
    written.push(chunkRef);onProgress(Math.round((i+1)/(count+1)*100));
   }
   await setDoc(doc(db,'attachments',id),{
    ownerUid:parentUid, ready:true, schemaVersion:1,
    targetKind:kind,targetId,title,fileName:file.name,mime,size:bytes.length,
    chunkCount:count,sha256:hash,createdAt:serverTimestamp()
   });
   onProgress(100);return id;
  }catch(e){
   // En cas d'échec, supprimer les morceaux temporaires : pas de fichier partiel visible.
   await Promise.allSettled(written.map(ref=>deleteDoc(ref)));
   throw Error(errorMessage(e));
  }
 }
 async function read(meta){
  reader();
  if(!meta?.id||!Number.isInteger(meta.chunkCount)||meta.chunkCount<1||meta.chunkCount>MAX_CHUNKS||meta.size>ATTACHMENT_MAX_BYTES)throw Error('Référence de fichier incorrecte.');
  try{
   const blobs=await Promise.all(Array.from({length:meta.chunkCount},(_,i)=>getDoc(doc(db,'attachment_chunks',meta.id+'_'+i))));
   if(blobs.some(x=>!x.exists()))throw Error('Fichier incomplet : il manque des morceaux de données.');
   const parts=blobs.map((snap,i)=>{const x=snap.data();if(x.attachmentId!==meta.id||x.index!==i||!x.bytes?.toUint8Array)throw Error('Fichier endommagé.');return x.bytes.toUint8Array();});
   const total=parts.reduce((n,x)=>n+x.length,0);
   if(total!==meta.size)throw Error('Taille du fichier incorrecte.');
   const data=new Uint8Array(total);let offset=0;for(const part of parts){data.set(part,offset);offset+=part.length;}
   if(meta.sha256&&await sha256(data)!==meta.sha256)throw Error('Contrôle d’intégrité du fichier échoué.');
   const mime=Object.values(FORMATS).includes(meta.mime)?meta.mime:'application/octet-stream';
   return new Blob([data],{type:mime});
  }catch(e){throw Error(errorMessage(e));}
 }
 async function remove(meta){
  owner();if(!meta?.id||!Number.isInteger(meta.chunkCount)||meta.chunkCount<1||meta.chunkCount>MAX_CHUNKS)throw Error('Référence incorrecte.');
  try{
   // Retirer d'abord la référence visible, puis les morceaux binaires.
   await deleteDoc(doc(db,'attachments',meta.id));
   const results=await Promise.allSettled(Array.from({length:meta.chunkCount},(_,i)=>deleteDoc(doc(db,'attachment_chunks',meta.id+'_'+i))));
   if(results.some(r=>r.status==='rejected'))throw Error('Pièce jointe retirée de la liste, mais nettoyage partiel.');
  }catch(e){throw Error(errorMessage(e));}
 }
 return {list,upload,read,remove,MAX_BYTES:ATTACHMENT_MAX_BYTES};
}
