/* SVT : document ODT ENT du 12 novembre ; import uniquement par le compte Parent.
   Le fichier d'origine est conservé dans le stockage privé, jamais GitHub. */
(function(){'use strict';
const E=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n;};
const add=(r,tag,t)=>{const n=E(tag,t);r.append(n);return n;};
const bridge=()=>window.__TIM_BRIDGE?.attachments;
const plan=()=>window.TIM_SVT_PACK?.attachments||[];
async function previewOdt(blob,slot){
 const zip=await window.JSZip.loadAsync(blob);
 const content=await zip.file('content.xml')?.async('text');
 if(!content)throw Error('Texte ODT non disponible');
 const doc=new DOMParser().parseFromString(content,'application/xml');
 const nodes=[...doc.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0','p'),
              ...doc.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0','h')];
 if(!nodes.length)throw Error('Le document ne contient pas de paragraphes lisibles.');
 const panel=E('section');
 panel.style.cssText='background:#f6f9fe;color:#273950;border:1px solid #b9cedb;border-radius:12px;padding:13px;margin:9px 0';
 add(panel,'h4','Aperçu texte du document ODT original (mise en page simplifiée)');
 for(const line of nodes.slice(0,160)){
  const txt=String(line.textContent||'').trim();
  if(txt)add(panel,'p',txt);
 }
 if(nodes.length>160)add(panel,'p','Le document est plus long : télécharge le fichier original pour consulter l’intégralité.');
 slot.replaceChildren(panel);
}
async function render(target,slot){
 slot.replaceChildren();
 const docs=plan().filter(d=>d.target===target);
 if(!docs.length){add(slot,'p','Aucune pièce jointe téléchargée pour cette séance dans la collecte ENT.');return;}
 if(window.__TIM_GUEST||!bridge()){add(slot,'p','Les originaux sont réservés aux comptes Tim et Parent.');return;}
 let found=[];
 try{found=await bridge().list('lesson',target)}catch(e){add(slot,'p','Accès au document privé indisponible : '+e.message);return;}
 for(const d of docs){
  const panel=E('section');panel.style.cssText='margin:10px 0;padding:13px;border-radius:12px;border:1px solid #a9bfd9;background:#f6f9fe;color:#273e5d';
  add(panel,'strong',d.name);
  const saved=found.find(f=>f.fileName===d.name);
  if(!saved){add(panel,'p','Document original retrouvé dans l’archive ; import privé encore nécessaire depuis le compte Parent.');slot.append(panel);continue;}
  const area=E('div');panel.append(area);
  const read=E('button','Lire le texte du document dans la leçon');read.type='button';read.className='plain';
  read.onclick=async()=>{
   read.disabled=true;area.replaceChildren(E('p','Chargement…'));
   try{await previewOdt(await bridge().read(saved),area);}catch(e){area.replaceChildren(E('p','Aperçu indisponible : '+e.message));}
   finally{read.disabled=false;}
  };
  const download=E('button','Télécharger l’original ODT');download.type='button';download.className='plain';
  download.onclick=async()=>{
   download.disabled=true;
   try{const blob=await bridge().read(saved),url=URL.createObjectURL(blob),a=E('a');a.href=url;a.download=d.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
   catch(e){add(panel,'p','Téléchargement indisponible : '+e.message);}
   finally{download.disabled=false;}
  };
  panel.append(read,download);slot.append(panel);
 }
}
function parentImport(){
 const panel=E('section');panel.className='panel';
 if(!window.__TIM_PARENT||window.__TIM_GUEST)return panel;
 add(panel,'h3','SVT — importer le document original de Mme Vidon');
 add(panel,'p','Sélectionne « ENT-Tim-SVT-pieces-jointes-12-11-2026.zip ». Le fichier ODT sera classé dans le cours du 3 novembre, sans modifier la moindre copie ni note.');
 const input=E('input');input.type='file';input.accept='.zip,application/zip';input.style.cssText='display:block;max-width:100%;margin:10px 0';
 input.setAttribute('aria-label','ZIP du document SVT original');
 const status=add(panel,'p','Aucune archive sélectionnée.');
 const go=E('button','Importer le document ODT original dans le classeur privé');go.type='button';go.className='plain';go.disabled=true;
 let zip=null;
 input.onchange=async()=>{
  zip=null;go.disabled=true;status.textContent='Vérification de l’archive…';
  try{
   const file=input.files?.[0];if(!file||file.size>4000000)throw Error('Le ZIP est absent ou trop volumineux.');
   if(!window.JSZip)throw Error('Lecteur ZIP indisponible.');
   zip=await window.JSZip.loadAsync(file);
   if(!zip.file('pieces_jointes/'+plan()[0].filename))throw Error('Ce ZIP ne contient pas le fichier ODT de l’ENT.');
   status.textContent='Archive valide : 1 fichier original détecté. Aucun import effectué.';go.disabled=false;
  }catch(e){status.textContent='Archive invalide : '+e.message;zip=null;}
 };
 go.onclick=async()=>{
  if(!zip||!window.__TIM_PARENT||!bridge())return;
  if(!confirm('Importer le document original SVT dans le classeur privé de Tim ?'))return;
  go.disabled=true;input.disabled=true;
  try{
   const d=plan()[0],previous=await bridge().list('lesson',d.target);
   if(previous.some(f=>f.fileName===d.name)){status.textContent='0 nouveau fichier · 1 déjà présent. Aucun doublon créé.';return;}
   const blob=await zip.file('pieces_jointes/'+d.filename).async('blob');
   if(blob.size!==d.size||blob.size>bridge().MAX_BYTES)throw Error('Fichier original incomplet ou volumineux.');
   await bridge().upload('lesson',d.target,new File([blob],d.name,{type:'application/vnd.oasis.opendocument.text'}),d.name,p=>{status.textContent=d.name+' · '+p+' %';});
   status.textContent='1 fichier original SVT importé. Consulte la séance du 3 novembre.';
  }catch(e){status.textContent='Import non terminé : '+e.message;}
  finally{go.disabled=false;input.disabled=false;}
 };
 panel.append(input,go);return panel;
}
window.TIM_SVT_DOCUMENTS={render,parentImport,plan};
})();
