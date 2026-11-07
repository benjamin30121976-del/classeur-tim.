// V16 — Éditeur pédagogique sans code. Accessible uniquement depuis l'espace parent.
// Le contenu est composé de blocs texte, listes, vrais tableaux et figures privées.
(function(){'use strict';
const el=(tag,cls='',text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
const makeButton=(text,fn,cls='plain')=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
const field=(label,val='',multi=false)=>{const wrap=el('label','v16-field');wrap.append(el('span','',label));const x=el(multi?'textarea':'input','v16-input');if(!multi)x.type='text';else x.rows=3;x.value=String(val??'');wrap.append(x);return [wrap,x];};
const clone=x=>JSON.parse(JSON.stringify(x));
const blank=()=>({id:'',title:'',subject:'Mathématiques',chapter:'',topic:'',kind:'ent',category:'school',date:'',summary:'',source:'Document transmis par le parent',blocks:[],help:{simple:'',steps:[],example:'',check:null}});
const safeSvg=svg=>typeof svg==='string'&&svg.length<50000&&/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(svg)&&!/<\s*(?:script|foreignObject|iframe|image|use|animate|set)\b/i.test(svg)&&!/\bon\w+\s*=|javascript:|\b(?:href|xlink:href)\s*=\s*["'](?:https?:|data:)/i.test(svg);
function render({lessons,bridge,onSaved}){
 const root=el('section','panel v16-editor');root.id='v16-lesson-editor';
 root.append(el('h3','','ÉDITEUR DE LEÇONS · V16'),el('p','small','Écrire un cours, ajouter un tableau et placer les figures dans la leçon, sans ouvrir le programme. Tu peux aussi reprendre un cours existant. Les modifications sont enregistrées dans Firebase.'));
 if(!bridge?.saveLesson){root.append(el('p','note','Connexion au compte parent nécessaire.'));return root;}
 let lesson=blank(),unsaved=false,entFilesPicker=null;
 const mode=el('select','v16-input');mode.setAttribute('aria-label','Choisir un cours à modifier');mode.append(new Option('＋ Créer une nouvelle leçon',''));
 const existing=lessons.slice().sort((a,b)=>(a.subject||'').localeCompare(b.subject||'','fr')||a.title.localeCompare(b.title,'fr'));
 for(const l of existing)mode.append(new Option((l.subject||'Espagnol')+' · '+l.title,l.id));
 const intro=el('div','v16-topbar');intro.append(el('strong','','Cours à préparer ou modifier'),mode);root.append(intro);
 const editor=el('div','v16-editor-body');root.append(editor);
 function inputRow(label,value,assign,multi=false){const [w,x]=field(label,value,multi);x.oninput=()=>{assign(x.value);unsaved=true;};return w;}
 function redraw(){editor.replaceChildren();unsaved=false;
  const idInfo=el('p','small',lesson.id?'Identifiant du cours : '+lesson.id+' · les exercices associés et les résultats restent liés.':'Nouvelle leçon : identifiant créé automatiquement à la publication.');editor.append(idInfo);
  const grid=el('div','v16-fields');
  const typeLabel=el('label','v16-field');typeLabel.append(el('span','','Type de document'));
  const typePicker=el('select','v16-input');typePicker.setAttribute('aria-label','Type de document');typePicker.append(new Option('COURS ORIGINAL ENT · conserver le PDF du professeur','ent'),new Option('LEÇON BIS · explications et schémas intégrés','bis'));
  typePicker.value=(lesson.kind==='bis'||lesson.category==='bis'||/^MBIS/.test(lesson.id||''))?'bis':'ent';
  function setType(kind){lesson.kind=kind;lesson.category=kind==='bis'?'bis':'school';}
  typePicker.onchange=()=>{setType(typePicker.value);unsaved=true;redraw();};
  typeLabel.append(typePicker);grid.append(typeLabel);
  grid.append(inputRow('Matière',lesson.subject,v=>lesson.subject=v),inputRow('Chapitre / thème',lesson.chapter,v=>{lesson.chapter=v;lesson.topic=v;}),inputRow('Titre de la leçon',lesson.title,v=>lesson.title=v),inputRow('Date du cours (facultatif)',lesson.date,v=>lesson.date=v),inputRow('Résumé',lesson.summary,v=>lesson.summary=v,true),inputRow('Source / provenance',lesson.source,v=>lesson.source=v,true));editor.append(grid);
  const heading=el('h4','','Contenu de la leçon — dans l’ordre choisi');editor.append(heading);
  editor.append(el('p','small','Ajoute autant de paragraphes, listes, tableaux ou figures que nécessaire. Les flèches permettent de déplacer chaque bloc.'));
  const blocksRoot=el('div','v16-blocks');editor.append(blocksRoot);
  function blocksRedraw(){blocksRoot.replaceChildren();lesson.blocks.forEach((block,index)=>{
   const section=el('section','v16-block');const top=el('div','v16-block-top');const name={note:'Texte',bullets:'Liste',table:'Tableau',figure:'Figure',svg:'Schéma intégré'}[block.kind]||block.kind;
   top.append(el('strong','',`${index+1}. ${name}`));
   top.append(makeButton('↑',()=>{if(index<1)return;[lesson.blocks[index-1],lesson.blocks[index]]=[lesson.blocks[index],lesson.blocks[index-1]];unsaved=true;blocksRedraw();},'v16-small'));
   top.append(makeButton('↓',()=>{if(index===lesson.blocks.length-1)return;[lesson.blocks[index+1],lesson.blocks[index]]=[lesson.blocks[index],lesson.blocks[index+1]];unsaved=true;blocksRedraw();},'v16-small'));
   top.append(makeButton('Retirer',()=>{if(!confirm('Retirer ce bloc de la leçon ?'))return;lesson.blocks.splice(index,1);unsaved=true;blocksRedraw();},'v16-small v16-remove'));section.append(top);
   const [w,h]=field('Titre du bloc (facultatif)',block.h||'');h.oninput=()=>{block.h=h.value;unsaved=true;};section.append(w);
   if(block.kind==='note')section.append(inputRow('Texte / explication',block.body||'',v=>block.body=v,true));
   else if(block.kind==='bullets')section.append(inputRow('Une ligne par point de la liste',(block.items||[]).join('\n'),v=>block.items=v.split('\n').map(s=>s.trim()).filter(Boolean),true));
   else if(block.kind==='table'){
    section.append(el('p','small','Un rang par ligne. Sépare les colonnes avec le signe | . Exemple : Notion | Définition'));
    section.append(inputRow('Cellules du tableau',(block.rows||[]).map(r=>r.join(' | ')).join('\n'),v=>{block.rows=v.split('\n').map(s=>s.split('|').map(x=>x.trim())).filter(r=>r.some(Boolean));block.tableRole='grid';},true));
   }else if(block.kind==='svg'){
    section.append(el('p','small','Schéma SVG déjà associé à cette leçon. Il reste visible dans le cours de Tim.'));
    if(safeSvg(block.svg)){const im=el('img','v16-figure-thumb');im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(block.svg);im.alt=block.h||'Schéma';section.append(im);}
    section.append(inputRow('Légende',block.caption||'',v=>block.caption=v));
   }else if(block.kind==='figure'){
    section.append(inputRow('Légende de l’image',block.caption||'',v=>block.caption=v));
    if(block.attachmentId)section.append(el('p','small','Illustration déjà enregistrée dans le cours (référence conservée).'));
    const picker=el('input','v16-input');picker.type='file';picker.accept='.png,.jpg,.jpeg,.webp,.gif,.svg,image/svg+xml';picker.setAttribute('aria-label','Choisir une image à cet emplacement');
    picker.onchange=async()=>{const file=picker.files?.[0];if(!file)return;
     if(file.name.toLowerCase().endsWith('.svg')){
      if(file.size>50000){alert('Fichier SVG trop volumineux (50 Ko maximum).');return;}
      const svg=await file.text();if(!safeSvg(svg)){alert('Schéma SVG invalide ou contenant des éléments non autorisés.');return;}
      block.kind='svg';block.svg=svg;delete block._file;delete block.attachmentId;unsaved=true;blocksRedraw();return;
     }
     if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>2097152){alert('Choisis un schéma SVG de moins de 50 Ko ou une image PNG, JPEG, WebP, GIF de moins de 2 Mo.');picker.value='';return;}
     block._file=file;unsaved=true;
    };
    section.append(picker);
   }
   blocksRoot.append(section);
  });}
  blocksRedraw();
  const adding=el('div','v16-add-buttons');for(const [label,make] of [
   ['＋ Texte',()=>({kind:'note',h:'Explication',body:''})],
   ['＋ Liste',()=>({kind:'bullets',h:'À retenir',items:[]})],
   ['＋ Tableau',()=>({kind:'table',h:'Tableau',tableRole:'grid',rows:[['Notion','Définition']]})],
   ['＋ Schéma / image',()=>({kind:'figure',h:'Figure',caption:''})]
  ])adding.append(makeButton(label,()=>{lesson.blocks.push(make());blocksRedraw();unsaved=true;},'v16-add'));
  editor.append(adding);
  entFilesPicker=null;
  if(lesson.kind==='ent'){
   const source=el('div','v16-import');source.append(el('h4','','PDF et pièces jointes originales de l’ENT'));
   source.append(el('p','small','Tu peux joindre directement le PDF ou les images du professeur ici. Le fichier reste privé dans Firebase ; il n’est pas placé sur Cloudflare. Maximum 4 Mo par fichier.'));
   entFilesPicker=el('input','v16-input');entFilesPicker.type='file';entFilesPicker.multiple=true;entFilesPicker.accept='.pdf,.png,.jpg,.jpeg,.webp,.gif';entFilesPicker.setAttribute('aria-label','Documents originaux ENT à joindre');source.append(entFilesPicker);editor.append(source);
  }
  const helpPanel=el('details','v16-import');helpPanel.append(el('summary','','Aide à comprendre (explications complémentaires)'));
  helpPanel.append(el('p','small','Ces explications apparaissent dans le bouton « Je n’ai pas compris » de Tim. Elles ne remplacent pas le cours principal.'));
  lesson.help=lesson.help||{simple:'',steps:[],example:'',check:null};
  helpPanel.append(inputRow('Explication simple',lesson.help.simple||lesson.summary||'',v=>lesson.help.simple=v,true));
  helpPanel.append(inputRow('Étapes guidées (une par ligne)',(lesson.help.steps||[]).join('\n'),v=>lesson.help.steps=v.split('\n').map(x=>x.trim()).filter(Boolean),true));
  helpPanel.append(inputRow('Exemple expliqué',lesson.help.example||'',v=>lesson.help.example=v,true));
  editor.append(helpPanel);
  const actions=el('div','v16-actions');const msg=el('p','v16-status','Aucune publication en cours.');
  const preview=makeButton('Aperçu du cours',()=>{
   const doc=getLesson();if(!doc)return;
   const wrap=el('div','v16-preview');wrap.append(el('h4','',doc.title||'Leçon sans titre'),el('p','small',doc.subject+' · '+doc.chapter),el('p','',doc.summary));
   for(const b of doc.blocks){const box=el('div','v16-preview-block');box.append(el('h4','',b.h||''));
    if(b.kind==='note')box.append(el('p','v16-prewrap',b.body));
    if(b.kind==='bullets'){const ul=el('ul');for(const line of b.items)ul.append(el('li','',line));box.append(ul);}
    if(b.kind==='table'){const t=el('table','v16-native-table');for(const [i,row] of b.rows.entries()){const tr=el('tr');for(const cell of row)tr.append(el(i===0?'th':'td','',cell));t.append(tr);}box.append(t);}
    if(b.kind==='svg'&&safeSvg(b.svg)){const img=el('img','v16-figure-thumb');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(b.svg);img.alt=b.h||'Figure';box.append(img);}
    if(b.kind==='figure')box.append(el('p','small',b.attachmentId?'Figure enregistrée · '+(b.caption||''):b._file?'Image sélectionnée · '+b._file.name:'Image à choisir avant publication'));
    wrap.append(box);
   }
   const overlay=el('dialog','v16-preview-modal');overlay.append(wrap,makeButton('Fermer l’aperçu',()=>{overlay.close();overlay.remove();},'btn'));document.body.append(overlay);overlay.showModal();
  });
  const save=makeButton('ENREGISTRER LA LEÇON',async()=>{
   const doc=getLesson();if(!doc)return;save.disabled=true;msg.textContent='Enregistrement en cours…';
   const uploaded=[];
   try{
    for(const [bi,b] of doc.blocks.entries()){if(b._file){if(!bridge.attachments)throw Error('Pièces jointes Firebase non configurées.');
     msg.textContent='Envoi du schéma '+b._file.name+'…';const aid=await bridge.attachments.upload('lesson',doc.id,b._file,b.caption||b.h||b._file.name,p=>msg.textContent='Envoi du schéma : '+p+' %');
     b.attachmentId=aid;delete b._file;lesson.blocks[bi].attachmentId=aid;delete lesson.blocks[bi]._file;uploaded.push(aid);}}
    msg.textContent='Sauvegarde du cours dans Firebase…';await bridge.saveLesson(doc);
    const originals=[...(entFilesPicker?.files||[])];let uploadedEnt=0;
    for(const file of originals){
     if(!bridge.attachments)throw Error('Cours enregistré, mais pièces jointes Firebase indisponibles.');
     msg.textContent='Cours enregistré. Ajout du document ENT '+(uploadedEnt+1)+'/'+originals.length+' : '+file.name;
     await bridge.attachments.upload('lesson',doc.id,file,file.name,()=>{});uploadedEnt++;
    }
    msg.textContent='Cours enregistré'+(uploadedEnt?' et '+uploadedEnt+' document(s) ENT ajouté(s)':'')+'. Il sera visible par Tim après actualisation.';unsaved=false;
    if(onSaved)onSaved(doc);
   }catch(e){msg.textContent='Non enregistré : '+(e.message||e)+'. Si des images ont été envoyées, elles restent dans les pièces jointes du cours.';}finally{save.disabled=false;}
  },'btn v16-save');
  const backup=makeButton('Exporter ce cours (.json)',()=>{const v=getLesson();if(!v)return;for(const b of v.blocks)delete b._file;const blob=new Blob([JSON.stringify({lessons:[v],exercises:[]},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download=(v.id||'nouveau-cours')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);},'plain');
  actions.append(preview,backup,save);editor.append(actions,msg);
 }
 function getLesson(){if(!lesson.id)lesson.id='L'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);const v=clone(lesson);if(!v.title.trim()){alert('Indique le titre du cours.');return null;}if(!v.subject.trim()||!v.chapter.trim()){alert('Indique une matière et un chapitre.');return null;}if(!v.blocks.length){if(v.kind==='ent'&&entFilesPicker?.files?.length){v.blocks=[{kind:'note',h:'Document original ENT',body:'Consulte le document du professeur dans la section « Documents originaux ENT ».'}];}else{alert('Ajoute un contenu de leçon ou sélectionne le PDF original ENT.');return null;}}
  // Les fichiers File ne se sérialisent pas en JSON ; les recopier depuis les blocs de travail.
  for(const [i,b] of v.blocks.entries()){if(lesson.blocks[i]?._file)b._file=lesson.blocks[i]._file;}
  v.topic=v.chapter;v.help=v.help||{simple:v.summary||'',steps:[],example:v.summary||'',check:null};if(!v.help.simple)v.help.simple=v.summary||'';
  if(JSON.stringify(v,(k,val)=>k==='_file'?undefined:val).length>650000){alert('La leçon est trop volumineuse. Réduis la taille des figures ou utilise les pièces jointes.');return null;}return v;
 }
 mode.onchange=()=>{if(unsaved&&!confirm('Abandonner les modifications non enregistrées ?')){mode.value=lesson.id;return;}lesson=mode.value?clone(existing.find(l=>l.id===mode.value)):blank();redraw();};
 redraw();
 const infoBis=el('div','v16-import');infoBis.append(el('strong','','23 leçons BIS de maths déjà intégrées à la V16'));
 infoBis.append(el('p','small','Les 23 leçons BIS et leurs schémas sont présentes pour Tim dès la connexion. Elles ne nécessitent plus d’importation Firebase. Pour les modifier, sélectionne la leçon BIS ci-dessus ; le cours original ENT n’est pas remplacé.'));
 root.append(infoBis);
 return root;
}
window.TIM_LESSON_EDITOR={render,safeSvg};
})();
