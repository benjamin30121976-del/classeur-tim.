/* Documents ENT dans le corps de la leçon — Maths, Espagnol et Physique.
   Aucun document privé n'est publié dans ce dépôt : lecture via le pont Firebase
   de Tim, puis rendu dans la page par le moteur PDF.js déjà chargé. */
(function(){
'use strict';
const E=(tag,txt='',cls='')=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=String(txt);return e;};
const status=(host,msg)=>{host.replaceChildren(E('p',msg));};
const allowed=()=>!window.__TIM_GUEST&&Boolean(window.__TIM_BRIDGE?.attachments);
const pdf=x=>/\.pdf$/i.test(x.fileName||'');
const image=x=>/\.(png|jpe?g|webp|gif)$/i.test(x.fileName||'');
const IMAGE_MAX=4194304;
const cardStyle='margin:12px 0;padding:12px;border-radius:11px;border:1px solid #bbcee3;background:#f4f8fe;color:#25415f';
const nameStyle='font-size:15px;font-weight:800;line-height:1.4';
const hintStyle='font-size:13px;line-height:1.5;color:#3f5774';
const resolveName=x=>String(x.fileName||'Document ENT').slice(0,160);
async function getRefs(ids,{filenamePattern=null}={}){
 const bridge=window.__TIM_BRIDGE?.attachments;
 const all=await Promise.all([...new Set(ids.map(String).filter(Boolean))].slice(0,50).map(async id=>{
  try{
   const items=await bridge.list('lesson',id);
   return {id,items:(items||[]).filter(x=>pdf(x)||image(x)),error:null};
  }catch(e){return {id,items:[],error:String(e.message||e)};}
 }));
 let failed=0;
 const docs=[],seen=new Set();
 for(const x of all){
  if(x.error)failed++;
  for(const file of x.items){
   if(filenamePattern&&!filenamePattern.test(file.fileName||''))continue;
   const key=x.id+'/'+file.fileName;
   if(seen.has(key))continue;
   seen.add(key);docs.push({courseId:x.id,file});
  }
 }
 return {docs,failed,total:all.length};
}
async function renderImage(holder,record){
 const api=window.__TIM_BRIDGE?.attachments;
 status(holder,'Chargement de l’image originale…');
 try{
  const data=await api.read(record.file);
  if(!data||data.size>IMAGE_MAX)throw Error('Image absente ou trop volumineuse.');
  const url=URL.createObjectURL(data);
  const img=E('img');img.src=url;img.alt='Schéma du professeur : '+resolveName(record.file);
  img.loading='lazy';img.style.cssText='display:block;max-width:100%;height:auto;margin:8px auto;border-radius:6px;background:#fff';
  img.onload=()=>setTimeout(()=>URL.revokeObjectURL(url),180000);
  img.onerror=()=>{URL.revokeObjectURL(url);status(holder,'Impossible d’afficher cette image.');};
  holder.replaceChildren(img);
 }catch(e){status(holder,'Lecture de l’image indisponible : '+String(e.message||e));}
}
function renderRecord(holder,record,{auto=false}={}){
 const file=record.file,box=E('section','','tim-inline-ent-file');
 box.style.cssText=cardStyle;
 const heading=E('h4',resolveName(file));heading.style.cssText=nameStyle;box.append(heading);
 if(pdf(file)){
  const pdfViewer=window.TIM_PHYSICS_INLINE_PDF?.createInline?.(
   {target:record.courseId,fileName:file.fileName},
   1,'Le document original — à consulter ici, dans la leçon',{manual:!auto}
  );
  if(pdfViewer)box.append(pdfViewer);
  else box.append(E('p','Le lecteur PDF intégré est indisponible.'));
 }else{
  const button=E('button','Afficher ici le schéma / l’image','tim-inline-image-button');button.type='button';
  button.style.cssText='min-height:44px;padding:10px;border-radius:9px;border:1px solid #99bad7;background:#e7f2fc;color:#254769;font-weight:800';
  const slot=E('div');button.onclick=()=>{
   button.disabled=true;renderImage(slot,record).finally(()=>{button.disabled=false;});
  };
  box.append(button,slot);
 }
 holder.append(box);
}
async function mount(host,ids,{title='Documents ENT du professeur',filenamePattern=null,limit=30,auto=false}={}){
 host.replaceChildren();
 const h=E('h3',title);host.append(h);
 if(!allowed()){
  host.append(E('p','Documents privés : ouvrir le compte Parent ou Tim pour les consulter.'));
  return {count:0};
 }
 const state=E('p','Recherche des documents associés à cette leçon…');state.style.cssText=hintStyle;
 host.append(state);
 const {docs,failed,total}=await getRefs(ids,{filenamePattern});
 if(!host.isConnected)return {count:docs.length};
 if(!docs.length){
  state.textContent=failed===total&&total>0
   ?'Impossible de consulter la bibliothèque privée pour le moment.'
   :'Aucun PDF ou schéma correspondant n’est actuellement importé dans cette leçon. Les textes et exercices restent utilisables.';
  return {count:0};
 }
 state.textContent=docs.length+' document(s) original(aux) disponible(s) dans le classeur privé. Affiche une fiche ici pour lire son contenu sans changer d’onglet.';
 for(const record of docs.slice(0,Math.max(1,limit)))renderRecord(host,record,{auto});
 if(docs.length>limit)host.append(E('p','Seuls les '+limit+' premiers documents sont affichés pour éviter de surcharger cette page.'));
 if(failed)host.append(E('p','Certains dossiers ENT ne sont momentanément pas accessibles.'));
 return {count:docs.length};
}
function mathCourseIds(){
 const list=window.__TIM_DATA?.lessons||[];
 return list.filter(l=>l.subject==='Mathématiques'&&l.category!=='bis'&&l.kind!=='bis'&&!/^MBIS/.test(String(l.id||''))).map(l=>String(l.id));
}
function forMathExercise(host,id){
 const pattern=id==='ME_ENT_PROGRAMMES'?/(?:egalite|égalité).*?(?:rapports|rapport).*?(?:programme|calcul)|programme.*calcul/i:
  id==='ME_ENT_THALES3'?/application.*directe|exercices.*thales/i:null;
 return mount(host,mathCourseIds(),{
  title:'Fiche originale de Mme Pialet — dans l’exercice',
  filenamePattern:pattern,limit:2,auto:false
 });
}
window.TIM_INLINE_ENT_DOCUMENTS={mount,forMathExercise,mathCourseIds};
})();