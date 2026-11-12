/* Import groupé, strictement privé, des PDF ENT de maths depuis le compte Parent.
   Le ZIP reste sur l'appareil Parent ; les PDF vont directement dans les pièces
   jointes Firebase des cours existants. Aucune réponse ni note n'est touchée. */
(function(){
'use strict';
const VERSION='TIM-MATH-PDF-20261112-1';
const MAX_ARCHIVE=12*1024*1024,MAX_DOC=4*1024*1024;
const byId='TIM_MATHS_IMPORT_MANIFEST.json';
const el=(tag,value)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);return e;};
const allowed=()=>!!window.__TIM_PARENT&&!window.__TIM_GUEST&&!!window.__TIM_BRIDGE?.attachments?.upload;
const isPdf=name=>typeof name==='string'&&/\.pdf$/i.test(name)&&name.length<=120;
const dateId=date=>'M26S'+date.slice(2).replace(/-/g,'');
const mathSource=l=>l?.subject==='Mathématiques'&&!/^MBIS/i.test(String(l.id||''))&&l.kind!=='bis'&&l.category!=='bis';
function matchCourse(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Date ENT incorrecte.');
 const list=(window.__TIM_DATA?.lessons||[]).filter(mathSource);
 const exact=list.find(l=>l.id===dateId(date));
 if(exact)return exact;
 const matches=list.filter(l=>String(l.date||'').includes(date));
 if(matches.length===1)return matches[0];
 throw Error(matches.length?'Plusieurs cours correspondent à '+date+'.':'Cours original du '+date+' absent du classeur.');
}
function hex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function checkZip(file){
 if(!allowed())throw Error('Connexion Parent nécessaire.');
 if(!file||!/\.zip$/i.test(file.name)||file.size<100||file.size>MAX_ARCHIVE)throw Error('Choisir le ZIP privé de 17 PDF (maximum 12 Mo).');
 if(!window.JSZip)throw Error('Lecteur ZIP indisponible.');
 if(!crypto?.subtle)throw Error('Vérification SHA-256 non disponible sur cette page.');
 const zip=await window.JSZip.loadAsync(await file.arrayBuffer());
 const manifestFile=zip.file(byId);
 if(!manifestFile)throw Error('Ce ZIP ne contient pas le manifeste de vérification attendu.');
 const data=JSON.parse(await manifestFile.async('string'));
 if(data?.version!==VERSION||data.count!==17||!Array.isArray(data.documents)||data.documents.length!==17)throw Error('Lot différent des 17 PDF mathématiques vérifiés.');
 const seen=new Set(),records=[];
 for(const item of data.documents){
  if(!/^[A-Z0-9_]{2,20}$/.test(item.docId||'')||seen.has(item.docId))throw Error('Doublon ou référence de pièce jointe invalide.');
  seen.add(item.docId);
  if(typeof item.zipPath!=='string'||!/^pieces_jointes\/[^/\\]{1,150}\.pdf$/i.test(item.zipPath))throw Error('Chemin PDF non autorisé.');
  if(!isPdf(item.displayName)||!isPdf(item.zipPath)||!Number.isInteger(item.size)||item.size<20||item.size>MAX_DOC||
     !/^[0-9a-f]{64}$/.test(item.sha256||'')||
     !Array.isArray(item.targetDates)||!item.targetDates.length||item.targetDates.length>3)
    throw Error('Métadonnées du document '+item.docId+' invalides.');
  const zipped=zip.file(item.zipPath);
  if(!zipped)throw Error('PDF absent : '+item.docId);
  const bytes=await zipped.async('uint8array');
  if(bytes.length!==item.size||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('PDF altéré : '+item.docId);
  const sha=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
  if(sha!==item.sha256)throw Error('Empreinte SHA-256 incorrecte : '+item.docId);
  const targets=[...new Set(item.targetDates)].map(date=>matchCourse(date));
  if(targets.length!==new Set(targets.map(l=>l.id)).size)throw Error('Rattachement dupliqué : '+item.docId);
  records.push({item,bytes,targets});
 }
 return records;
}
function render(){
 const details=el('details');details.className='panel math-pdf-bulk-import';
 const title=el('summary','Mathématiques — importer les 17 PDF originaux en une fois');
 title.style.cssText='cursor:pointer;font-weight:850;line-height:1.5';
 const expl=el('p','Les 15 PDF ENT originaux et les 2 présentations converties en PDF restent privés. Le classeur vérifie chaque fichier et le cours correspondant, puis ajoute uniquement les pièces manquantes. Aucune note, tentative ou réponse de Tim n’est modifiée.');
 const input=el('input');input.type='file';input.accept='.zip,application/zip';input.setAttribute('aria-label','Archive privée des 17 PDF de maths');input.style.cssText='max-width:100%;margin:12px 0;padding:7px 0';
 const verify=el('button','1 · Vérifier le ZIP');verify.type='button';verify.className='plain';
 const upload=el('button','2 · Importer les PDF vérifiés');upload.type='button';upload.className='plain';upload.disabled=true;
 const state=el('p','Aucun fichier chargé.');state.setAttribute('role','status');state.setAttribute('aria-live','polite');
 const list=el('div');list.className='math-pdf-upload-preview';
 let plan=null;
 const reset=()=>{plan=null;upload.disabled=true;list.replaceChildren();};
 input.addEventListener('change',()=>{reset();state.textContent='Fichier choisi. Lance la vérification avant toute importation.';});
 verify.onclick=async()=>{
  reset();
  verify.disabled=true;
  state.textContent='Vérification des 17 PDF, des empreintes et des cours…';
  try{
   plan=await checkZip(input.files?.[0]);
   const api=window.__TIM_BRIDGE.attachments;
   let newCount=0,skipped=0,conflicts=0;
   for(const record of plan){
    record.toUpload=[];
    for(const target of record.targets){
     const existing=await api.list('lesson',target.id);
     if(existing.some(x=>x.sha256===record.item.sha256&&x.size===record.item.size)){skipped++;continue;}
     if(existing.some(x=>x.fileName===record.item.displayName)){conflicts++;continue;}
     record.toUpload.push(target);newCount++;
    }
    const row=el('p',record.item.docId+' — '+record.item.displayName+' → '+record.targets.map(t=>t.title||t.id).join(' ; ')+
      (record.toUpload.length?' · à importer : '+record.toUpload.length:' · déjà présent ou à vérifier'));
    row.style.cssText='margin:7px 0;font-size:14px;overflow-wrap:anywhere';
    list.append(row);
   }
   state.textContent='17 PDF intègres. '+newCount+' rattachement(s) à ajouter ; '+skipped+' déjà présent(s) ; '+conflicts+' conflit(s) de nom à vérifier manuellement.';
   upload.disabled=newCount===0||conflicts>0;
   if(conflicts)state.textContent+=' Aucun import tant que les conflits ne sont pas résolus.';
  }catch(e){reset();state.textContent='Vérification interrompue : '+String(e?.message||e);}
  finally{verify.disabled=false;}
 };
 upload.onclick=async()=>{
  if(!allowed()||!plan){state.textContent='Vérifier le ZIP depuis le compte Parent avant import.';return;}
  verify.disabled=true;upload.disabled=true;input.disabled=true;
  let uploaded=0;
  try{
   const api=window.__TIM_BRIDGE.attachments;
   const total=plan.reduce((n,r)=>n+r.toUpload.length,0);
   for(const record of plan){
    for(const target of record.toUpload){
     // Nouvelle vérification pour rendre une seconde importation sans doublons.
     const existing=await api.list('lesson',target.id);
     if(existing.some(x=>x.sha256===record.item.sha256&&x.size===record.item.size)){uploaded++;continue;}
     if(existing.some(x=>x.fileName===record.item.displayName))throw Error('Conflit : '+record.item.displayName+'. Aucun document remplacé.');
     const pdf=new File([record.bytes],record.item.displayName,{type:'application/pdf'});
     const label=(record.item.isConversion?'PDF de consultation (ODP) — ':'Document original ENT — ')+record.item.displayName;
     await api.upload('lesson',target.id,pdf,label.slice(0,120),
       pct=>state.textContent='Ajout '+(uploaded+1)+'/'+total+' : '+record.item.docId+' ('+pct+' %)');
     uploaded++;
     state.textContent=uploaded+' / '+total+' rattachement(s) vérifié(s) dans Firebase.';
    }
   }
   state.textContent='Import terminé : '+uploaded+' rattachement(s) traités. PDF visibles dans les leçons ENT et BIS correspondantes. Notes et tentatives de Tim inchangées.';
   reset();input.value='';
  }catch(e){
   state.textContent='Import partiel : '+uploaded+' rattachement(s) traités. '+String(e?.message||e)+'. Relancer la vérification : les fichiers déjà importés seront ignorés.';
  }finally{verify.disabled=false;input.disabled=false;}
 };
 if(!allowed()){details.append(title,el('p','Import réservé au Parent.'));return details;}
 details.append(title,expl,input,verify,upload,state,list);
 return details;
}
window.TIM_MATH_PDF_BULK_IMPORT={render,checkZip,matchCourse,version:VERSION};
})();