/* Physique-chimie — documents originaux ENT privés.
   Le ZIP est lu uniquement dans le navigateur Parent. Les fichiers sont
   enregistrés par le pont de pièces jointes Firestore déjà utilisé par les maths.
   Aucune pièce jointe n’est publiée dans GitHub ou Cloudflare.
*/
(function(){
'use strict';
const PLAN=[
 {zip:'a47c5a5103320011_chapitre 1 Atomes molécules et ions 3eme.pptx',name:'Chapitre 1 Atomes molécules et ions 3eme.pptx',type:'application/vnd.openxmlformats-officedocument.presentationml.presentation',target:'PCENT6390167'},
 {zip:'5b4c95e0f0e2282e_chapitre 1 Atomes molécules et ions 3eme.pdf',name:'Chapitre 1 Atomes molécules et ions 3eme.pdf',type:'application/pdf',target:'PCENT6390167'},
 {zip:'1d7b8e0eef098ca0_Eval formative controle 2 el.pdf',name:'Eval formative controle 2 el.pdf',type:'application/pdf',target:'PCENT6390168'},
 {zip:'662d889f2e26d425_Ce que je dois savoir pour le contrôle 1 3e 2026.pdf',name:'Ce que je dois savoir pour le contrôle 1 3e 2026.pdf',type:'application/pdf',target:'PCENT6390168'},
 {zip:'2c0d3c14ccb3cd53_chapitre 1  tableau molecules.pdf',name:'Chapitre 1 tableau molecules.pdf',type:'application/pdf',target:'PCENT6390201'}
];
/* Un sixième fichier ENT est un doublon binaire du tableau des molécules :
   il reste référencé dans le journal, sans import inutile. */
const ASSOCIATION={
 PC_BIS01:['PCENT6390167','PCENT6390168'],
 PC_BIS02:['PCENT6390167'],
 PC_BIS03:['PCENT6390167','PCENT6390201'],
 PC_BIS04:[],
 PC_BIS05:[],
 PC_BIS06:[],
 PC_BIS07:[]
};
const E=(tag,cls,text)=>{
 const x=document.createElement(tag);if(cls)x.className=cls;
 if(text!==undefined)x.textContent=String(text);return x;
};
const bridge=()=>window.__TIM_BRIDGE?.attachments;
function message(parent,text){parent.append(E('p','',text))}
/* Un PDF s'affiche dans un nouvel onglet si Android le permet.
   Le téléchargement reste possible séparément pour un manuel ou un PowerPoint.
   Le lien de secours est visible lorsqu'une fenêtre est bloquée. */
async function openFile(file,button,kind='view',row=null){
 const api=bridge();if(!api)throw Error('Lecteur privé indisponible.');
 const isPdf=(file.mime||'').includes('pdf')||/\.pdf$/i.test(file.fileName||'');
 let tab=null;
 if(kind==='view'&&isPdf){
  try{tab=window.open('about:blank','_blank');}catch(_){}
 }
 button.disabled=true;
 const old=button.textContent;
 button.textContent=kind==='download'?'Préparation du téléchargement…':'Ouverture du PDF…';
 try{
  const blob=await api.read(file);
  const url=URL.createObjectURL(blob);
  if(kind==='view'&&isPdf){
   if(tab){
    try{tab.location.replace(url);}
    catch(_){try{tab.location.href=url;}catch(__){}}
   }else if(row){
    const link=E('a','pc-pdf-fallback','Appuyer ici pour afficher le PDF');
    link.href=url;link.target='_blank';link.rel='noopener noreferrer';
    link.style.cssText='display:block;margin:8px 0;color:#244d89;text-decoration:underline;font-weight:800;line-height:1.5';
    row.append(link);
   }
  }else{
   const link=E('a');link.href=url;link.download=file.fileName||'document.pdf';
   document.body.append(link);link.click();link.remove();
  }
  setTimeout(()=>URL.revokeObjectURL(url),180000);
 }catch(e){
  try{if(tab&&!tab.closed)tab.close();}catch(_){}
  throw e;
 }finally{button.disabled=false;button.textContent=old;}
}
async function lessonFiles(id,slot){
 slot.replaceChildren();
 if(window.__TIM_GUEST){message(slot,'Les documents originaux sont réservés aux comptes Tim et Parent.');return;}
 const api=bridge();if(!api){message(slot,'Le lecteur privé n’est pas disponible.');return;}
 const targets=ASSOCIATION[id]||[];
 if(!targets.length){message(slot,'Aucune pièce jointe originale n’est associée à cette leçon dans la collecte ENT.');return;}
 message(slot,'Recherche des documents originaux dans le classeur privé…');
 try{
  const files=(await Promise.all(targets.map(id=>api.list('lesson',id)))).flat();
  slot.replaceChildren();
  if(!files.length){message(slot,'Les documents ENT sont récupérés, mais pas encore importés dans le lecteur privé. Le compte Parent peut les importer depuis son archive ZIP, sans quitter le classeur.');return;}
  for(const file of files){
   const isPdf=(file.mime||'').includes('pdf')||/\.pdf$/i.test(file.fileName||'');
   const row=E('div','pc-doc-row');
   row.style.cssText='padding:15px 13px;margin:10px 0;border:1px solid #c3d1e3;border-radius:12px;background:#f7faff;color:#253c60';
   const title=isPdf?'PDF du professeur : ':'Document PowerPoint : ';
   row.append(E('strong','',title+(file.title||file.fileName)));
   const err=E('p');err.style.cssText='color:#a34c42;font-size:13px';
   if(isPdf){
    if(window.TIM_PHYSICS_INLINE_PDF?.originalFiles){
     window.TIM_PHYSICS_INLINE_PDF.originalFiles(id,row,[file]);
    }else{
     row.append(E('p','','Le lecteur intégré du PDF est indisponible.'));
    }
   }
   const download=E('button','plain',isPdf?'Télécharger ce PDF':'Télécharger le PowerPoint');
   download.style.cssText='display:block;margin:6px 0;min-height:41px;font-size:14px';
   download.type='button';
   download.onclick=()=>openFile(file,download,'download',row).catch(e=>{err.textContent='Téléchargement impossible : '+(e.message||e)});
   row.append(download,err);slot.append(row);
  }
 }catch(e){slot.replaceChildren();message(slot,'Lecture privée indisponible : '+(e.message||''));}
}
function parentImport(){
 const panel=E('section','pc-import-private');panel.style.cssText='margin:18px 0;padding:13px;border:1px solid #9eb4cc;border-radius:13px;background:#f4f8ff;color:#263c57';
 if(!window.__TIM_PARENT||window.__TIM_GUEST)return panel;
 panel.append(E('h3','','Importer les cinq documents originaux de physique-chimie'));
 message(panel,'Utilise le ZIP « ENT-Tim-physique-chimie-pieces-jointes.zip » déjà téléchargé sur ton téléphone. Les cinq fichiers sont associés aux cours ENT correspondants. Le sixième fichier est un doublon.');
 const input=E('input');input.type='file';input.accept='.zip,application/zip';input.setAttribute('aria-label','Archive ZIP des pièces jointes de physique-chimie');
 input.style.cssText='display:block;margin:12px 0;max-width:100%';
 const status=E('p','','Aucune archive sélectionnée.');
 const button=E('button','spx-quick-link','Importer les cinq fichiers dans le classeur privé');
 button.type='button';button.disabled=true;button.style.cssText='margin:12px 0;min-height:43px';
 let zip=null;
 input.onchange=async()=>{
  button.disabled=true;zip=null;status.textContent='Vérification du ZIP…';
  try{
   const file=input.files?.[0];if(!file)throw Error('Aucun fichier sélectionné.');
   if(file.size>20000000)throw Error('Archive supérieure à 20 Mo.');
   if(!window.JSZip)throw Error('Lecture ZIP indisponible.');
   zip=await window.JSZip.loadAsync(file);
   const missing=PLAN.filter(x=>!zip.file('pieces_jointes/'+x.zip)).map(x=>x.name);
   if(missing.length)throw Error('Le ZIP ne correspond pas à la collecte attendue : '+missing.join(', '));
   status.textContent='Archive reconnue : cinq fichiers originaux présents. Aucun transfert effectué.';
   button.disabled=false;
  }catch(e){zip=null;status.textContent='Archive non reconnue : '+(e.message||e);}
 };
 button.onclick=async()=>{
  if(!zip||!window.__TIM_PARENT||!bridge())return;
  if(!confirm('Importer les cinq fichiers officiels en stockage privé pour Tim et le Parent ?'))return;
  button.disabled=true;input.disabled=true;
  let done=0,skipped=0;const errors=[];
  try{
   for(const entry of PLAN){
    try{
     status.textContent='Import privé '+(done+skipped+errors.length+1)+' / 5 : '+entry.name;
     const api=bridge(),already=await api.list('lesson',entry.target);
     if(already.some(f=>f.fileName===entry.name)){skipped++;continue;}
     const data=await zip.file('pieces_jointes/'+entry.zip).async('blob');
     if(!data.size||data.size>4*1024*1024)throw Error('Taille invalide');
     const file=new File([data],entry.name,{type:entry.type});
     await api.upload('lesson',entry.target,file,entry.name,percent=>{
      status.textContent='Import privé : '+entry.name+' · '+percent+' %';
     });
     done++;
    }catch(e){errors.push(entry.name+' : '+(e.message||e));}
   }
   status.textContent='Import terminé : '+done+' nouveau(x) fichier(s), '+skipped+' déjà présent(s).'+(errors.length?' Erreurs : '+errors.join(' ; '):'')+
     ' Les cours originaux sont désormais accessibles depuis le bouton « 1 · Leçon ENT » des leçons correspondantes.';
  }finally{button.disabled=false;input.disabled=false;}
 };
 panel.append(input,button,status);return panel;
}
window.TIM_PHYSICS_DOCUMENTS={lessonFiles,parentImport,plan:PLAN.map(p=>({name:p.name,target:p.target}))};
})();
