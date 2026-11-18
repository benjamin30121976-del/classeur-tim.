/* Leçon ENT du 18 novembre 2026 — import des cinq pièces originales.
   Le Parent sélectionne le ZIP produit par Termux. Les pièces restent
   dans le stockage privé du classeur, jamais dans le dépôt GitHub public.
   Idempotent : vérification SHA-256 avant et après toute création. */
(function(){'use strict';
const SPEC=Object.freeze([
 {id:'10099~114824',label:'Français : fiche IV, devoir du 26/11',path:'pieces_ENT/10099_114824_Fiche de travail n°IV (3 personnages).pdf',target:'FR_HW_214980',name:'Fiche de travail n°IV (3 personnages).pdf',mime:'application/pdf',size:342824,sha:'90d15dfd284b24ed655961cae1d8cf36c701b06046000046a6d938f0ebdc41dc'},
 {id:'10099~115422',label:'SVT : schéma lymphocyte T',path:"pieces_ENT/10099_115422_Capture d'écran 2026-11-17 102650.png",target:'SVT_ENT_20261117',name:"Capture d'écran 2026-11-17 102650.png",mime:'image/png',size:164054,sha:'d4d46ee96c3f22fedb0e1f6b42eabd2b837f6af0a1d4cd3b2f031524d11ecaf5'},
 {id:'10099~115426',label:'Espagnol : liste 2 des verbes',path:'pieces_ENT/10099_115426_11 Presente de indicativo LISTA 2.pdf',target:'ENTESP_2026',name:'11 Presente de indicativo LISTA 2.pdf',mime:'application/pdf',size:511949,sha:'1a7d9be5cb0bda99adb1a337795822f5295478bba7994ffcb0bb543bade816e3'},
 {id:'10099~115427',label:'Espagnol : 3D.pdf du 17/11',path:'pieces_ENT/10099_115427_3D.pdf',target:'ENTESP_2026',name:'3D_original_ENT_17-11-2026.pdf',mime:'application/pdf',size:54288,sha:'9e6658b16436577febe7ee0e597c033496a8d82057258fcad9a475559e4a0215'},
 {id:'10099~115430',label:'Espagnol : 3D.pdf du 18/11',path:'pieces_ENT/10099_115430_3D.pdf',target:'ENTESP_2026',name:'3D_original_ENT_18-11-2026.pdf',mime:'application/pdf',size:132461,sha:'1ca666f7b213054347c1eec08c8aad87983f25c8279af7202a387dd95071192f'}
]);
const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=String(txt);return n};
const sha=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),n=>n.toString(16).padStart(2,'0')).join('');
async function inspect(file){
 if(!window.JSZip)throw Error('Lecteur ZIP indisponible');
 if(!file||file.size>8_000_000)throw Error('Sélectionner le ZIP des pièces jointes du 18/11 (8 Mo maximum)');
 const zip=await window.JSZip.loadAsync(file);
 const found=[];for(const spec of SPEC){
  const entry=zip.file(spec.path);if(!entry)throw Error('Pièce absente : '+spec.id);
  const bytes=await entry.async('uint8array');
  if(bytes.length!==spec.size||await sha(bytes)!==spec.sha)throw Error('Pièce altérée : '+spec.id);
  const sig=Array.from(bytes.slice(0,8));
  if(spec.mime==='application/pdf'&&String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('PDF incorrect : '+spec.id);
  if(spec.mime==='image/png'&&sig.join(',')!=='137,80,78,71,13,10,26,10')throw Error('PNG incorrect : '+spec.id);
  found.push({spec,bytes});
 }return found;
}
function panel(){
 const section=el('section');section.className='panel';section.id='tim-ent-18nov-private-import';
 if(!window.__TIM_PARENT||window.__TIM_GUEST)return section;
 section.append(el('h3','Parent — importer les cinq documents ENT des 17–18 novembre'));
 section.append(el('p','Sélectionner ENT-Tim-18-11-2026-pieces-jointes.zip. Les originaux vont au stockage privé. Les copies existantes, notes, XP et tentatives ne sont jamais modifiés.'));
 const input=el('input');input.type='file';input.accept='.zip,application/zip';input.setAttribute('aria-label','Archive ENT des cinq pièces jointes');
 input.style.cssText='display:block;max-width:100%;margin:12px 0';
 const button=el('button','Importer les originaux vérifiés');button.type='button';button.className='plain';button.disabled=true;
 const info=el('p','Sélectionne le ZIP, puis lance l’import.');info.setAttribute('role','status');
 section.append(input,button,info);
 let prepared=null,busy=false;
 input.onchange=async()=>{
  prepared=null;button.disabled=true;info.textContent='Contrôle des originaux…';
  try{prepared=await inspect(input.files?.[0]);info.textContent='5 fichiers vérifiés par empreinte ; aucun import effectué.';button.disabled=false;}
  catch(e){info.textContent='Archive non valide : '+String(e?.message||e);}
 };
 button.onclick=async()=>{
  if(!prepared||busy||!window.__TIM_PARENT||window.__TIM_GUEST)return;
  const api=window.__TIM_BRIDGE?.attachments;
  if(!api?.list||!api?.upload||!api?.read)return void(info.textContent='Compte Parent : stockage privé indisponible.');
  if(!window.confirm('Importer ces cinq originaux ENT dans le stockage privé sans effacer les documents déjà présents ?'))return;
  busy=true;button.disabled=true;input.disabled=true;let verified=0,created=0;
  try{
   for(const {spec,bytes} of prepared){
    const items=await api.list('lesson',spec.target);
    let record=items.find(x=>x.sha256===spec.sha);
    if(!record){
     if(items.some(x=>x.fileName===spec.name&&x.sha256!==spec.sha))throw Error('Conflit de nom, non remplacé : '+spec.name);
     const file=new File([bytes],spec.name,{type:spec.mime});
     info.textContent='Import de '+spec.label+'…';
     await api.upload('lesson',spec.target,file,spec.label,p=>{info.textContent='Import '+spec.id+' : '+p+' %';});
     created++;
     record=(await api.list('lesson',spec.target)).find(x=>x.sha256===spec.sha);
    }
    if(!record)throw Error('Fichier introuvable après import : '+spec.id);
    const got=await api.read(record);
    if(got.size!==spec.size||await sha(await got.arrayBuffer())!==spec.sha)throw Error('Contrôle après import refusé : '+spec.id);
    verified++;info.textContent=verified+'/5 pièces vérifiées dans le stockage privé.';
   }
   info.textContent='5/5 originaux en place ('+created+' nouvel(le)(s)). Les contenus ENT et résultats de Tim sont préservés.';
   section.dataset.importComplete='1';
  }catch(e){info.textContent='Import partiel : '+verified+'/5 ; '+String(e?.message||e)+' Aucun fichier existant n’a été écrasé.';}
  finally{busy=false;button.disabled=false;input.disabled=false;}
 };
 return section;
}
window.TIM_ENT_18NOV_IMPORT={panel,spec:SPEC};
})();