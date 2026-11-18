/* Import ciblé du 17/11/2026 : trois pièces ENT privées, sans effacer les anciennes.
   Le Parent sélectionne une fois le ZIP ENT ; aucune pièce n'entre dans GitHub. */
(function(){'use strict';
const SPEC=Object.freeze([
 {label:'Espagnol — présent de l’indicatif, liste 2',
  path:'pieces_ENT/10099_115426_11 Presente de indicativo LISTA 2.pdf',
  target:'ENTESP_2026',name:'11 Presente de indicativo LISTA 2.pdf',
  mime:'application/pdf',size:511949,
  hash:'1a7d9be5cb0bda99adb1a337795822f5295478bba7994ffcb0bb543bade816e3'},
 {label:'Espagnol — 3D.pdf du 17 novembre (original distinct)',
  path:'pieces_ENT/10099_115427_3D.pdf',
  target:'ENTESP_2026',name:'3D_original_ENT_17-11-2026.pdf',
  mime:'application/pdf',size:54288,
  hash:'9e6658b16436577febe7ee0e597c033496a8d82057258fcad9a475559e4a0215'},
 {label:'SVT — lymphocytes T, schéma du 17 novembre',
  path:"pieces_ENT/10099_115422_Capture d'écran 2026-11-17 102650.png",
  target:'SVT_ENT_20261117',name:"Capture d'écran 2026-11-17 102650.png",
  mime:'image/png',size:164054,
  hash:'d4d46ee96c3f22fedb0e1f6b42eabd2b837f6af0a1d4cd3b2f031524d11ecaf5'}
]);
const E=(tag,text,cls)=>{
 const node=document.createElement(tag);
 if(text!==undefined)node.textContent=String(text);
 if(cls)node.className=cls;
 return node;
};
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
async function validateZip(file){
 if(!window.JSZip)throw Error('Lecteur ZIP indisponible.');
 if(!file||file.size>8*1024*1024||file.size<1000)throw Error('Sélectionne le ZIP ENT des 16–17 novembre (8 Mo maximum).');
 const zip=await window.JSZip.loadAsync(file);
 const prepared=[];
 for(const entry of SPEC){
  const zipped=zip.file(entry.path);
  if(!zipped)throw Error('Fichier original absent de cette archive : '+entry.label);
  const bytes=await zipped.async('uint8array');
  if(bytes.byteLength!==entry.size)throw Error('Taille originale différente pour '+entry.label);
  const digest=await sha(bytes);
  if(digest!==entry.hash)throw Error('Empreinte du fichier ENT différente : '+entry.label);
  const pdf=entry.mime==='application/pdf';
  if(pdf&&!String.fromCharCode(...bytes.subarray(0,5)).startsWith('%PDF-'))
   throw Error('PDF illisible : '+entry.label);
  if(!pdf&&Array.from(bytes.subarray(0,8)).join(',')!=='137,80,78,71,13,10,26,10')
   throw Error('Image PNG illisible : '+entry.label);
  prepared.push({entry,bytes});
 }
 return prepared;
}
function panel(){
 const card=E('section',undefined,'tim-nov17-private-import');
 card.style.cssText='border:1px solid #9db6d5;border-radius:12px;padding:14px;margin:16px 0;background:#f3f8ff;color:#223c5c';
 if(!window.__TIM_PARENT||window.__TIM_GUEST)return card;
 card.append(E('h3','Parent — compléter les trois documents originaux du 17 novembre'));
 card.append(E('p','Une seule sélection du ZIP ENT suffit pour ajouter la liste de conjugaison, le bon 3D.pdf et le schéma de SVT. Les originaux restent privés ; aucun fichier existant ne sera effacé ou remplacé.'));
 const input=E('input');
 input.type='file';input.accept='.zip,application/zip';
 input.setAttribute('aria-label','ZIP ENT des trois pièces originales du 17 novembre');
 input.style.cssText='display:block;width:100%;max-width:100%;margin:10px 0';
 const status=E('p','Sélectionne le ZIP d’origine ou le petit ZIP de trois documents.');
 status.setAttribute('role','status');status.style.cssText='font-size:14px;line-height:1.5;overflow-wrap:anywhere';
 const submit=E('button','Importer et vérifier les trois originaux');
 submit.type='button';submit.className='plain';submit.disabled=true;
 submit.style.cssText='min-height:45px;padding:10px 13px;margin:9px 0';
 let prepared=null,busy=false;
 input.onchange=async()=>{
  submit.disabled=true;prepared=null;status.textContent='Vérification des trois empreintes originales…';
  try{
   prepared=await validateZip(input.files?.[0]);
   status.textContent='Archive vérifiée : 3 originaux authentiques. Rien n’a encore été enregistré.';
   submit.disabled=false;
  }catch(err){status.textContent='Archive refusée : '+String(err?.message||err);}
 };
 submit.onclick=async()=>{
  if(!prepared||busy||!window.__TIM_PARENT||window.__TIM_GUEST)return;
  const bridge=window.__TIM_BRIDGE?.attachments;
  if(!bridge?.list||!bridge?.upload||!bridge?.read){
   status.textContent='Import privé indisponible : reconnecte le compte Parent.';return;
  }
  if(!window.confirm('Importer uniquement les trois documents ENT dans le stockage privé ? Le 3D.pdf existant sera conservé.'))return;
  busy=true;submit.disabled=true;input.disabled=true;
  let completed=0,created=0;
  try{
   for(const item of prepared){
    const spec=item.entry;
    status.textContent='Vérification du stockage privé : '+spec.label;
    let saved=await bridge.list('lesson',spec.target);
    let found=saved.find(x=>x.sha256===spec.hash);
    if(!found){
     if(saved.some(x=>x.fileName===spec.name&&x.sha256!==spec.hash))
      throw Error('Un fichier du même nom mais différent existe déjà : '+spec.name+'. Aucun écrasement effectué.');
     const file=new File([item.bytes],spec.name,{type:spec.mime});
     await bridge.upload('lesson',spec.target,file,spec.label,p=>{
      status.textContent='Import de '+spec.label+' : '+p+' %';
     });
     created++;
     saved=await bridge.list('lesson',spec.target);
     found=saved.find(x=>x.sha256===spec.hash);
    }
    if(!found)throw Error('L’original importé est introuvable dans la leçon : '+spec.label);
    const check=await bridge.read(found);
    if(check.size!==spec.size||await sha(await check.arrayBuffer())!==spec.hash)
     throw Error('Contrôle d’intégrité impossible : '+spec.label);
    completed++;
    status.textContent=completed+'/3 documents exacts vérifiés dans le stockage privé.';
   }
   status.textContent='3/3 documents conformes dans le classeur privé ('+created+' nouveau(x)). Le 3D.pdf ancien est conservé. Rouvre la leçon d’espagnol du 17 novembre ou celle de SVT pour voir les documents directement.';
   card.dataset.importComplete='1';
  }catch(err){
   status.textContent='Import partiel : '+completed+'/3 vérifié(s). '+String(err?.message||err)+' Les documents déjà présents ne sont pas modifiés ; tu peux relancer après vérification.';
  }finally{busy=false;submit.disabled=false;input.disabled=false;}
 };
 card.append(input,submit,status);
 return card;
}
window.TIM_ENT_17NOV_IMPORT={panel};
})();