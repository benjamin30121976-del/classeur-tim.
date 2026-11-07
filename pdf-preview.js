// V15.1 — lecteur PDF sur téléphone : PDF.js peint les pages dans un canvas.
// Le PDF reste dans le navigateur. Seuls les scripts publics du lecteur sont chargés depuis cdnjs.
// La version du worker doit correspondre exactement à la bibliothèque.
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
let pdfLibraryPromise = null;
async function pdfLibrary() {
  if (!pdfLibraryPromise) {
    pdfLibraryPromise = import(PDFJS_URL).then(lib => {
      lib.GlobalWorkerOptions.workerSrc = WORKER_URL;
      return lib;
    }).catch(error => {pdfLibraryPromise = null; throw error;});
  }
  return pdfLibraryPromise;
}
function element(tag, cls, value) {
  const node=document.createElement(tag);if(cls)node.className=cls;if(value!=null)node.textContent=value;return node;
}
export async function mountPdfPreview(container, blob) {
  container.replaceChildren();
  const toolbar=element('div','pdf-reader-toolbar');
  const prev=element('button','plain','← Précédente'),next=element('button','plain','Suivante →');
  const minus=element('button','plain','−'),plus=element('button','plain','+');
  const position=element('span','pdf-reader-position','Chargement…');
  const label=element('span','pdf-reader-zoom','100 %');
  for(const b of [prev,next,minus,plus])b.type='button';
  toolbar.append(prev,position,next,minus,label,plus);
  const stage=element('div','pdf-reader-stage');
  const message=element('p','small','Préparation de l’aperçu PDF…');
  container.append(toolbar,message,stage);
  let doc=null,renderTask=null,currentPage=1,zoom=1,revision=0,closed=false;
  const refreshControls=()=>{
    prev.disabled=!doc||currentPage<=1;next.disabled=!doc||currentPage>=doc.numPages;
    minus.disabled=zoom<=.5;plus.disabled=zoom>=2;
    position.textContent=doc?'Page '+currentPage+' / '+doc.numPages:'Chargement…';
    label.textContent=Math.round(zoom*100)+' %';
  };
  refreshControls();
  async function display() {
    if(!doc||closed)return;
    const version=++revision;
    if(renderTask){try{renderTask.cancel();}catch(e){}renderTask=null;}
    refreshControls();message.textContent='Affichage de la page '+currentPage+'…';
    try{
      const page=await doc.getPage(currentPage);
      if(version!==revision||closed)return;
      const nominal=page.getViewport({scale:1});
      // Ajustement initial à la largeur du téléphone, puis zoom manuel.
      const avail=Math.max(240,stage.clientWidth-8);
      const scale=Math.min(1.8,avail/nominal.width)*zoom;
      const viewport=page.getViewport({scale});
      const pixelRatio=Math.min(window.devicePixelRatio||1,2.5);
      const canvas=element('canvas','pdf-reader-canvas');
      canvas.width=Math.ceil(viewport.width*pixelRatio);
      canvas.height=Math.ceil(viewport.height*pixelRatio);
      canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
      const context=canvas.getContext('2d',{alpha:false});
      if(!context)throw Error('Le navigateur ne peut pas afficher cette page.');
      stage.replaceChildren(canvas);
      renderTask=page.render({canvasContext:context,viewport,transform:[pixelRatio,0,0,pixelRatio,0,0]});
      await renderTask.promise;
      if(version===revision&&!closed)message.textContent='';
    }catch(e){
      if(e?.name==='RenderingCancelledException'||version!==revision||closed)return;
      message.textContent='Impossible d’afficher cette page : '+(e?.message||e)+'. Le téléchargement reste disponible.';
    }finally{if(version===revision)renderTask=null;}
  }
  prev.addEventListener('click',()=>{if(currentPage>1){currentPage--;display();}});
  next.addEventListener('click',()=>{if(doc&&currentPage<doc.numPages){currentPage++;display();}});
  minus.addEventListener('click',()=>{zoom=Math.max(.5,Math.round((zoom-.25)*100)/100);display();});
  plus.addEventListener('click',()=>{zoom=Math.min(2,Math.round((zoom+.25)*100)/100);display();});
  let loadingTask;
  const dispose=()=>{
    if(closed)return;closed=true;revision++;
    if(renderTask){try{renderTask.cancel();}catch(e){}}
    if(loadingTask){loadingTask.destroy().catch(()=>{});}
    if(doc){doc.destroy().catch(()=>{});}
    container.replaceChildren();
  };
  try{
    const lib=await pdfLibrary();
    if(closed)return dispose;
    loadingTask=lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false});
    doc=await loadingTask.promise;
    if(closed)return dispose;
    await display();
  }catch(e){
    if(!closed){
      message.textContent='Aperçu indisponible sur cet appareil ('+(e?.message||e)+'). Utilise le bouton « Télécharger » ci-dessus.';
      toolbar.hidden=true;
    }
  }
  return dispose;
}
