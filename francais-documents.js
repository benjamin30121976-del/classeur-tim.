/* Français : import des 14 pièces ENT du ZIP, exclusivement dans Firestore privé.
   Le PDF est visualisé dans la leçon par le lecteur déjà utilisé en maths/physique. */
(function(){'use strict';
const E=(tag,text)=>{const a=document.createElement(tag);if(text!==undefined)a.textContent=String(text);return a;};
const add=(root,tag,text)=>{const a=E(tag,text);root.append(a);return a;};
const bridge=()=>window.__TIM_BRIDGE?.attachments;
const plan=()=>window.TIM_FR_PACK?.attachments||[];
const FILE_MIME={pdf:'application/pdf'};
async function render(target,slot){
 slot.replaceChildren();
 const rows=plan().filter(x=>x.target===target);
 if(!rows.length){add(slot,'p','Aucune pièce jointe originale référencée à cette séance dans la collecte.');return;}
 add(slot,'h4','Documents originaux associés à cette séance');
 if(window.__TIM_GUEST||!bridge()){
  add(slot,'p','Les fichiers sont réservés aux comptes Tim et Parent.');
  return;
 }
 const api=bridge();
 let found=[];
 try{found=await api.list('lesson',target)}catch(e){add(slot,'p','Impossible de consulter les documents privés : '+(e.message||e));return;}
 for(const row of rows){
  const card=E('section');card.style.cssText='margin:9px 0;padding:12px;border:1px solid #a9bfd9;border-radius:11px;background:#f6f9fe;color:#243a56';
  const name=add(card,'strong',row.name),file=found.find(f=>f.fileName===row.name);
  if(file&&row.kind==='pdf'&&window.TIM_PHYSICS_INLINE_PDF?.createInline){
   card.append(window.TIM_PHYSICS_INLINE_PDF.createInline({target,fileName:row.name},1,'Lire le PDF original dans la leçon',{manual:true}));
  }else if(file&&row.kind==='docx'){
   const b=add(card,'button','Télécharger le DOCX original');b.type='button';b.className='plain';b.onclick=async()=>{
    b.disabled=true;try{const blob=await api.read(file),url=URL.createObjectURL(blob),link=E('a');link.href=url;link.download=row.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){add(card,'p','Lecture indisponible : '+(e.message||e));}finally{b.disabled=false;}
   };
  }else add(card,'p','Document ENT identifié dans l’archive du 12 novembre ; pas encore importé dans le lecteur privé de Tim.');
  slot.append(card);
 }
}
function parentImport(){
 const pane=E('section');pane.className='panel';
 if(!window.__TIM_PARENT||window.__TIM_GUEST)return pane;
 add(pane,'h3','Documents originaux d’français — import privé');
 add(pane,'p','Sélectionne le ZIP « ENT-Tim-Francais-pieces-jointes-12-11-2026.zip ». Les quatorze fichiers sont associés aux bonnes dates de cours, sans modifier les originaux ni les notes.');
 const input=E('input');input.type='file';input.accept='.zip,application/zip';input.setAttribute('aria-label','ZIP des 14 documents ENT d’français');input.style.cssText='display:block;max-width:100%;margin:12px 0';
 const status=add(pane,'p','Aucun fichier sélectionné.');
 const go=E('button','Importer les 14 fichiers dans le classeur privé');go.type='button';go.className='plain';go.disabled=true;
 let zip=null;
 input.onchange=async()=>{
  zip=null;go.disabled=true;status.textContent='Vérification de l’archive…';
  try{
   const f=input.files?.[0];if(!f||f.size>15000000)throw Error('Le ZIP est absent ou trop volumineux.');
   if(!window.JSZip)throw Error('Lecteur ZIP indisponible.');
   const candidate=await window.JSZip.loadAsync(f,{checkCRC32:false});
   const missing=plan().filter(item=>!candidate.file('pieces_jointes/'+item.filename));
   if(missing.length)throw Error(missing.length+' document(s) manquant(s) : archive différente de celle du 12 novembre.');
   zip=candidate;status.textContent='Archive vérifiée : 14 fichiers officiels trouvés, aucun import effectué.';go.disabled=false;
  }catch(e){status.textContent='Archive non reconnue : '+(e.message||e);}
 };
 go.onclick=async()=>{
  if(!zip||!window.__TIM_PARENT||!bridge())return;
  if(!confirm('Importer les 14 documents ENT dans le classeur privé de Tim ?'))return;
  go.disabled=true;input.disabled=true;
  let done=0,skip=0;const errors=[];
  try{
   for(const entry of plan()){
    try{
     status.textContent='Import '+(done+skip+errors.length+1)+' / 14 : '+entry.name;
     const api=bridge(),old=await api.list('lesson',entry.target);
     if(old.some(x=>x.fileName===entry.name)){skip++;continue;}
     const blob=await zip.file('pieces_jointes/'+entry.filename).async('blob');
     if(blob.size<1||blob.size>api.MAX_BYTES)throw Error('Taille incorrecte');
     const file=new File([blob],entry.name,{type:FILE_MIME[entry.kind]});
     await api.upload('lesson',entry.target,file,entry.name,p=>{status.textContent=entry.name+' : '+p+' %'});
     done++;
    }catch(e){errors.push(entry.name+' : '+String(e.message||e));}
   }
   status.textContent='Import privé : '+done+' nouveau(x) fichier(s), '+skip+' déjà présent(s).'+(errors.length?' Erreurs : '+errors.join(' | '):'')+' Réouvre la leçon ENT pour consulter son document.';
  }finally{go.disabled=false;input.disabled=false;}
 };
 pane.append(input,go);return pane;
}
window.TIM_FR_DOCUMENTS={render,parentImport,plan};
})();