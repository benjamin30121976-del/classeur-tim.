/* Dernière séance d'espagnol vérifiée dans l'export ENT du 12/11/2026.
   Référence : séance 10099~6400554, texte 10099~214865, devoir 10099~214866.
   Aucun élève, note, réponse attendue ni PDF privé publié ici. */
(function(){
'use strict';
const ENT_ID='10099~6400554';
const HOMEWORK_ID='10099~214866';
const PDF_NAME='4 EECEno empiezo las clases en septiembre.pdf';
const PDF_TARGET='ENTESP_2026';
const PDF_SHA='be48a6fa18032c127be5cdc1652ca9a585908953a67cedc562dbd7575b472837';
const e=(tag,content,cls)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(content!==undefined)el.textContent=content;
 return el;
};
const style={
 panel:'border:1px solid #b7ccdf;border-radius:13px;padding:12px 14px;margin:18px 0;background:#f3f8ff;color:#203854;line-height:1.6',
 summary:'font-weight:850;font-size:17px;cursor:pointer;color:#233f70;padding:6px 0;line-height:1.5',
 section:'border-top:1px solid #d5e2ef;padding:13px 0 5px',
 caption:'font-size:13px;line-height:1.5;color:#526a83',
 rule:'font-size:15px;line-height:1.65',
};
const para=(parent,value)=>parent.append(e('p',value));
const title=(parent,value)=>parent.append(e('h4',value));
const section=(parent,heading)=>{
 const box=e('section',undefined,'tim-es-nov12-section');box.style.cssText=style.section;
 title(box,heading);parent.append(box);return box;
};
function render(){
 if(window.__TIM_GUEST)return null;
 const root=e('details',undefined,'tim-es-nov12');root.style.cssText=style.panel;
 const summary=e('summary','Dernier cours ENT · Jeudi 12 novembre — « No empiezo en septiembre »');
 summary.style.cssText=style.summary;root.append(summary);
 const slot=e('div');
 root.append(slot);
 let loaded=false;
 root.addEventListener('toggle',()=>{
  if(!root.open||loaded)return;
  loaded=true;
  build(slot).catch(err=>{
   slot.append(e('p','La fiche PDF n’est pas disponible : '+String(err?.message||err)));
  });
 });
 return root;
}
async function build(slot){
 slot.replaceChildren();
 const origin=section(slot,'1 · Texte de Mme Gonzalez dans l’ENT');
 const exact=e('p','Jueves 12 /11 : evaluación de conjugación\n-CE ”no empiezo en septiembre” grupo A (no… sino;nunca , nada; hemisferio sur) , plickers');
 exact.lang='es';exact.style.whiteSpace='pre-wrap';origin.append(exact);
 const note=e('p','Retranscription du texte de la séance ENT 10099~6400554. CE = compréhension écrite. Aucun nouveau PDF n’était joint directement au cours du 12 novembre.');
 note.style.cssText=style.caption;origin.append(note);

 const trans=section(slot,'2 · Traduction française de la consigne');
 para(trans,'Jeudi 12 novembre : évaluation de conjugaison. Compréhension écrite « Je ne commence pas en septembre », groupe A : « non… mais », « jamais », « rien », hémisphère sud ; utilisation de Plickers.');

 const pdf=section(slot,'3 · Fiche du professeur du groupe A — directement dans la leçon');
 const st=e('p','Recherche de la fiche originale dans le stockage privé…');st.style.cssText=style.caption;pdf.append(st);
 const api=window.__TIM_BRIDGE?.attachments;
 if(!api?.list||!window.TIM_PHYSICS_INLINE_PDF?.createInline){
  st.textContent='Lecteur privé indisponible. Vérifie la connexion du compte Tim ou Parent.';
 }else{
  try{
   const files=await api.list('lesson',PDF_TARGET);
   const meta=(files||[]).find(x=>x.fileName===PDF_NAME||x.sha256===PDF_SHA);
   const showPdf=found=>{
    st.textContent='Fiche originale associée au travail du 17 novembre : « No empiezo las clases en septiembre ». Elle n’est pas présentée comme un PDF publié le 12 novembre.';
    pdf.append(window.TIM_PHYSICS_INLINE_PDF.createInline({target:PDF_TARGET,fileName:found.fileName},1,
       'Fiche originale du groupe A — No empiezo las clases en septiembre',{manual:false}));
   };
   if(meta){showPdf(meta);}
   else{
    st.textContent='Le PDF figure dans l’export ENT, mais n’est pas encore présent dans le stockage privé du classeur.';
    if(window.__TIM_PARENT&&!window.__TIM_GUEST&&api.upload){
     const help=e('p','Parent : télécharge la petite archive ZIP du groupe A depuis cette conversation, puis sélectionne-la ici. Le PDF original reste privé et aucun autre document ne sera modifié.');
     help.style.cssText=style.caption;
     const picker=e('input');picker.type='file';picker.accept='.zip,.pdf,application/zip,application/pdf';picker.setAttribute('aria-label','Archive ZIP de la fiche PDF espagnol groupe A');
     picker.style.cssText='display:block;max-width:100%;margin:10px 0';
     const upload=e('button','Installer cette fiche PDF privée');upload.type='button';
     upload.style.cssText='min-height:44px;padding:9px 12px;border:1px solid #7692bc;border-radius:9px;background:#244575;color:white;font-size:15px;font-weight:800';
     upload.addEventListener('click',async()=>{
      if(!picker.files?.[0]){st.textContent='Choisir d’abord le ZIP du groupe A dans tes téléchargements.';return;}
      upload.disabled=true;
      try{
       const src=picker.files[0];
       let bytes;
       if(/\.zip$/i.test(src.name)){
        if(!window.JSZip||src.size>6000000)throw Error('Archive ZIP invalide ou trop volumineuse.');
        const zip=await window.JSZip.loadAsync(await src.arrayBuffer());
        const entries=Object.values(zip.files).filter(f=>!f.dir);
        if(entries.length!==1||entries[0].name!==PDF_NAME)throw Error('Cette archive ne contient pas la fiche ENT attendue.');
        bytes=await entries[0].async('uint8array');
       }else if(/\.pdf$/i.test(src.name)){
        bytes=new Uint8Array(await src.arrayBuffer());
       }else throw Error('Sélectionner le ZIP contenant la fiche du groupe A.');
       if(bytes.length<20||bytes.length>4194304||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('PDF invalide.');
       const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
        b=>b.toString(16).padStart(2,'0')).join('');
       if(digest!==PDF_SHA)throw Error('Ce fichier ne correspond pas à la photocopie ENT du groupe A.');
       const latest=await api.list('lesson',PDF_TARGET);
       let found=latest.find(x=>x.fileName===PDF_NAME||x.sha256===PDF_SHA);
       if(!found){
        const original=new File([bytes],PDF_NAME,{type:'application/pdf'});
        await api.upload('lesson',PDF_TARGET,original,'Photocopie originale ENT — Groupe A, 17 novembre',n=>{st.textContent='Importation privée du PDF : '+n+' %';});
        found=(await api.list('lesson',PDF_TARGET)).find(x=>x.fileName===PDF_NAME&&x.sha256===PDF_SHA);
       }
       if(!found)throw Error('Enregistrement non confirmé dans Firebase.');
       help.remove();picker.remove();upload.remove();
       showPdf(found);
      }catch(err){st.textContent='Aucun autre fichier modifié. '+String(err?.message||err);}
      finally{upload.disabled=false;}
     });
     pdf.append(help,picker,upload);
    }
   }
  }catch(_){st.textContent='Fiche momentanément inaccessible dans le stockage privé.';}
 }

 const bis=section(slot,'4 · Leçon BIS : comprendre les négations');
 para(bis,'En français, on dit « je ne commence pas en septembre, mais en mars ». En espagnol, « no… sino… » corrige la première idée : on remplace septembre par un autre mois.');
 const examples=e('ul');[
  'No empiezo las clases en septiembre, sino en marzo. = Je ne commence pas les cours en septembre, mais en mars.',
  'Nunca empiezo en septiembre. = Je ne commence jamais en septembre.',
  'No veo nada. = Je ne vois rien.',
  'El hemisferio sur = l’hémisphère sud. Les saisons y sont inversées par rapport à l’hémisphère nord.'
 ].forEach(x=>examples.append(e('li',x)));bis.append(examples);
 const help=section(slot,'5 · Je n’ai pas compris');
 para(help,'Pour « no… sino », repère ce qui est refusé après « no » et ce qui le remplace après « sino ». « Nunca » indique jamais ; « nada » signifie rien. Lis d’abord la phrase entière, puis traduis les mots difficiles.');
 para(help,'Exemple guidé : « No estudio el lunes, sino el martes » signifie « Je n’étudie pas le lundi, mais le mardi ». Attention : on ne traduit pas « sino » isolément comme un verbe.');

 const homework=section(slot,'6 · Devoir pour mardi 17 novembre');
 const due=e('p','« Para el martes 17/11 : terminar la fotocopia grupo A “no empiezo en septiembre”. »');
 due.lang='es';homework.append(due);
 para(homework,'Traduction : terminer la photocopie du groupe A « Je ne commence pas en septembre ». Le cahier de textes indique aussi une évaluation de conjugaison concernant Tim.');
 const cite=e('p','Source ENT : cours 10099~6400554, contenu 10099~214865, devoir 10099~214866. Aucune nouvelle évaluation interactive, note ou tentative ajoutée.');
 cite.style.cssText=style.caption;homework.append(cite);
}
window.TIM_SPANISH_NOV12={render,ENT_ID,HOMEWORK_ID,PDF_NAME};
})();