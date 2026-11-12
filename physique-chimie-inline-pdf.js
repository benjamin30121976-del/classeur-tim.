/* PDF de physique-chimie dans les leçons (aucune nouvelle page).
   Fichiers lus par Firestore dans le navigateur authentifié. PDF.js local :
   assets/vendor/pdfjs-3.2.146.min.js, licence Apache 2.0.
   Le worker traite seulement les octets déjà reçus ; aucun PDF de Tim n'est publié. */
(function(){
'use strict';
const E=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el;};
const button=(txt,fn)=>{
 const b=E('button','pc-pdf-inline-button',txt);b.type='button';b.onclick=fn;
 b.style.cssText='font-size:14px;font-weight:750;background:#edf3fb;border:1px solid #bfd1e4;color:#264976;padding:8px 12px;min-height:41px;border-radius:9px;cursor:pointer';
 return b;
};
const docs={
 CHAPTER:{target:'PCENT6390167',fileName:'Chapitre 1 Atomes molécules et ions 3eme.pdf'},
 TEST:{target:'PCENT6390168',fileName:'Eval formative controle 2 el.pdf'},
 REVISION:{target:'PCENT6390168',fileName:'Ce que je dois savoir pour le contrôle 1 3e 2026.pdf'},
 MOLECULES:{target:'PCENT6390201',fileName:'Chapitre 1 tableau molecules.pdf'}
};
/* Page 1=page 1 dans le PDF officiel. Les autres notions n'ont pas de
   pages de PDF spécifiques dans les documents importés : ne rien inventer. */
const INLINE={
 PC_BIS01:{
  afterRule:[{key:'CHAPTER',page:9,title:'Le noyau et les électrons — page 9 du cours du professeur'}],
  beforeWorked:[{key:'CHAPTER',page:13,title:'Les lettres A, Z et N — page 13 du cours du professeur'}]
 },
 PC_BIS02:{
  afterExamples:[{key:'TEST',page:1,title:'Questions du professeur sur les ions — fiche de contrôle'}]
 },
 PC_BIS03:{
  afterRule:[{key:'CHAPTER',page:4,title:'Lire la formule d’une molécule — page 4 du cours du professeur'}],
  afterExamples:[{key:'MOLECULES',page:1,title:'Compléter les formules et les modèles — tableau du professeur'}]
 }
};
const cache=new Map();
const fileKey=x=>x.target+'/'+x.fileName;
function available(){return !window.__TIM_GUEST&&Boolean(window.__TIM_BRIDGE?.attachments);}
async function lookup(ref){
 const api=window.__TIM_BRIDGE?.attachments;
 if(!api)throw Error('Le lecteur privé n’est pas connecté.');
 const items=await api.list('lesson',ref.target);
 const entry=items.find(x=>x.fileName===ref.fileName);
 if(!entry)throw Error('Ce PDF n’a pas encore été trouvé dans les fichiers privés importés.');
 return entry;
}
async function load(ref){
 const k=fileKey(ref);
 if(cache.has(k))return cache.get(k);
 const p=(async()=>{
  const meta=await lookup(ref),blob=await window.__TIM_BRIDGE.attachments.read(meta);
  if(!blob||blob.size<20)throw Error('Le fichier PDF est vide.');
  if(!window.pdfjsLib)throw Error('Le moteur de lecture PDF n’a pas été chargé.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.2.146/build/pdf.worker.min.js';
  const data=new Uint8Array(await blob.arrayBuffer());
  const pdf=await window.pdfjsLib.getDocument({data,isEvalSupported:false,enableXfa:false}).promise;
  return {pdf,meta};
 })();
 cache.set(k,p);
 try{return await p;}catch(e){cache.delete(k);throw e;}
}
const css={
 card:'margin:16px 0 22px;padding:12px 11px 16px;border-radius:13px;border:1px solid #c4d5e8;background:#f5f8fe;color:#233c58',
 toolbar:'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:9px 0 12px',
 viewport:'max-width:100%;overflow-x:auto;overflow-y:visible;background:#fff;border:1px solid #d0dce9;border-radius:6px;padding:4px',
 heading:'font-size:16px;font-weight:800;color:#294875;line-height:1.45;margin:0 0 7px',
 message:'font-size:14px;color:#36536f;line-height:1.5;white-space:normal',
 caption:'font-size:12px;line-height:1.5;color:#506a82;margin:10px 0 0'
};
function createInline(ref,pageNo,title,{manual=false}={}){
 const card=E('section','pc-inline-pdf');
 card.style.cssText=css.card;
 const heading=E('h4','',title||'Document original du professeur');heading.style.cssText=css.heading;card.append(heading);
 if(!available()){
  const msg=E('p','','Le document original est réservé aux comptes Tim et Parent.');
  msg.style.cssText=css.message;card.append(msg);return card;
 }
 const explanation=E('p','', 'Extrait du vrai document ENT, placé dans la leçon. Tu peux lire l’explication juste au-dessus puis regarder la page ici, sans changer d’écran.');
 explanation.style.cssText=css.message;
 card.append(explanation);
 const status=E('p','','Préparation de la page du professeur…');status.style.cssText=css.message;card.append(status);
 const toolbar=E('div','pc-pdf-toolbar');toolbar.style.cssText=css.toolbar;
 const prev=button('← Page avant',()=>show(page-1));const next=button('Page après →',()=>show(page+1));
 const minus=button('A−',()=>zoomTo(zoom-.25)),plus=button('A+',()=>zoomTo(zoom+.25));
 const label=E('span','', '');label.style.cssText='font-weight:750;font-size:13px;color:#2f5276';
 toolbar.append(prev,label,next,minus,plus);card.append(toolbar);
 const frame=E('div','pc-pdf-canvas-frame');frame.style.cssText=css.viewport;
 const canvas=E('canvas','pc-inline-canvas');canvas.style.cssText='display:block;margin:0 auto;max-width:none;height:auto;background:#fff';
 frame.append(canvas);card.append(frame);
 const note=E('p','','PDF original du professeur • conservé dans les fichiers privés • zoom possible sans quitter la leçon.');
 note.style.cssText=css.caption;card.append(note);
 let pdf=null,page=pageNo,zoom=1,busy=false,serial=0;
 const zoomTo=v=>{zoom=Math.max(.75,Math.min(2.25,v));draw();};
 const show=n=>{if(!pdf)return;page=Math.max(1,Math.min(pdf.numPages,n));draw();};
 async function draw(){
  if(!pdf)return;
  const seq=++serial;
  if(busy)return;busy=true;
  try{
   status.textContent='Affichage de la page…';
   const current=await pdf.getPage(page);
   if(seq!==serial)return;
   const dpr=Math.min(2,Math.max(1,window.devicePixelRatio||1));
   const size=Math.max(240,Math.min(750,Math.round(frame.clientWidth||frame.getBoundingClientRect().width||340)-12));
   const base=current.getViewport({scale:1});
   const viewport=current.getViewport({scale:size*zoom/base.width});
   canvas.width=Math.ceil(viewport.width*dpr);
   canvas.height=Math.ceil(viewport.height*dpr);
   canvas.style.width=viewport.width+'px';
   canvas.style.height=viewport.height+'px';
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Canvas indisponible.');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   await current.render({canvasContext:ctx,viewport,transform:[dpr,0,0,dpr,0,0]}).promise;
   if(seq!==serial)return;
   label.textContent='Page '+page+' / '+pdf.numPages;
   prev.disabled=page<=1;next.disabled=page>=pdf.numPages;
   minus.disabled=zoom<=.75;plus.disabled=zoom>=2.25;
   status.textContent='';
  }catch(e){
   status.textContent='Affichage impossible pour le moment : '+String(e?.message||e);
  }finally{
   busy=false;
   if(seq!==serial)draw();
  }
 }
 async function start(){
  try{
   const entry=await load(ref);pdf=entry.pdf;
   page=Math.min(pdf.numPages,Math.max(1,pageNo));
   await draw();
  }catch(e){
   status.textContent='Lecture dans la leçon indisponible : '+String(e?.message||e);
   toolbar.hidden=true;frame.hidden=true;
   /* On ne force jamais l'ouverture d'une nouvelle page. */
  }
 }
 toolbar.hidden=true;frame.hidden=true;
 const initialize=async()=>{
  if(card.dataset.started)return;
  card.dataset.started='1';
  toolbar.hidden=false;frame.hidden=false;
  await start();
 };
 if(manual){
  const trigger=button('Afficher ici le document du professeur',initialize);
  trigger.style.cssText+=';display:block;width:100%;margin:9px 0';
  card.insertBefore(trigger,status);
  status.textContent='Le PDF s’affichera ici après avoir appuyé sur le bouton.';
 }else if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(x=>x.isIntersecting)){observer.disconnect();initialize();}
  },{rootMargin:'250px 0px',threshold:0});
  observer.observe(card);
 }else{initialize();}
 return card;
}
function insertLesson(id,placement,parent){
 const list=INLINE[id]?.[placement]||[];
 for(const x of list){const ref=docs[x.key];if(ref)parent.append(createInline(ref,x.page,x.title));}
}
function originalFiles(id,container,metadata){
 if(!available())return false;
 for(const file of metadata||[]){
  const found=Object.values(docs).find(x=>x.fileName===file.fileName);
  if(!found||!/\.pdf$/i.test(file.fileName))continue;
  container.append(createInline(found,1, 'Document du professeur — '+(file.title||file.fileName),{manual:true}));
 }
 return true;
}
window.TIM_PHYSICS_INLINE_PDF={insertLesson,createInline,originalFiles,available};
})();