/* Import local des documents ENT : les archives restent sur le téléphone ; seules les pièces
 * explicitement sélectionnées sont transférées dans Firestore, sous le compte parent.
 * Aucun PDF scolaire n'est publié sur Cloudflare Pages.
 */
(function(){'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const E=(tag,cls='',text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const terms=['thales','pythagore','puissance','litteral','numerique','fractions','calcul','rapport','programme','automatisme','scientifique','reciproque','contraposee','developpement','evaluation','brevet'];
const cleanName=s=>s.split('/').pop().slice(0,120);
function bestMatch(name,courses){const key=norm(name),hits=[];for(const c of courses){const blob=norm([c.title,c.topic,c.chapter,c.summary,c.date].join(' '));let score=0;for(const t of terms){if(key.includes(t)&&blob.includes(t))score+=t==='calcul'?2:4;}
 const dt=String(name).match(/(20\d\d)[-_](\d\d)[-_](\d\d)/);if(dt){const d=Number(dt[3]);const mn=Number(dt[2]);const months=['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];const known=norm(c.date);if(new RegExp('\\b'+d+'\\b').test(known)&&known.includes(months[mn-1]))score+=3;}
 hits.push([score,c]);}hits.sort((a,b)=>b[0]-a[0]);return hits[0]?.[0]>=4?hits[0][1].id:'';}
function render({lessons,api}){
 const box=E('section','panel v16-private-import');box.append(E('h3','','Importer les documents ENT originaux en une fois'));
 box.append(E('p','small','Sélectionne l’archive privée ZIP des mathématiques. Les PDF, photocopies et schémas sont reconnus ; vérifie le cours proposé pour chaque fichier. Aucun fichier n’est envoyé sans appuyer sur Importer. Les cours et résultats existants ne sont pas modifiés.'));
 const courses=lessons.filter(l=>l.subject==='Mathématiques'&&l.category!=='bis'&&l.kind!=='bis'&&!/^MBIS/.test(l.id));
 if(!courses.length){box.append(E('p','note','Aucun cours ENT de mathématiques disponible dans la base. Il faut d’abord importer les fiches des cours dans le compte parent.'));return box;}
 const input=E('input','attachment-file');input.type='file';input.accept='.zip,application/zip';input.setAttribute('aria-label','Choisir l’archive privée ZIP des documents ENT');
 const status=E('p','v16-import-status','Aucune archive sélectionnée.');status.setAttribute('role','status');
 const list=E('div','v16-import-list');const tools=E('div','btnrow');const start=E('button','btn','Importer les documents sélectionnés');start.type='button';start.disabled=true;
 const pdfs=E('button','plain','PDF uniquement');pdfs.type='button';const all=E('button','plain','Tout sélectionner');all.type='button';const none=E('button','plain','Tout désélectionner');none.type='button';
 const rows=[];let zip=null,busy=false;tools.append(pdfs,all,none);
 function refresh(){const selected=rows.filter(x=>x.checked.checked&&x.select.value).length;const incomplete=rows.filter(x=>x.checked.checked&&!x.select.value).length;start.disabled=busy||!selected||!!incomplete;status.textContent=rows.length+' fichier(s) reconnus. '+selected+' prêt(s).'+(incomplete?' '+incomplete+' fichier(s) sélectionné(s) sans cours associé.':'')+' Seules les pièces cochées seront importées.';}
 for(const btn of [pdfs,all,none])btn.disabled=true;
 pdfs.onclick=()=>{for(const r of rows)r.checked.checked=r.ext==='pdf'&&!!r.select.value;refresh();};
 all.onclick=()=>{for(const r of rows)r.checked.checked=!!r.select.value;refresh();};
 none.onclick=()=>{for(const r of rows)r.checked.checked=false;refresh();};
 input.onchange=async()=>{rows.length=0;list.replaceChildren();zip=null;start.disabled=true;status.textContent='Lecture de l’archive ZIP sur ce téléphone…';
  try{
   const file=input.files?.[0];if(!file)return;if(file.size>65000000)throw Error('Archive trop volumineuse (maximum 65 Mo).');if(!window.JSZip)throw Error('Le lecteur ZIP n’a pas chargé.');
   zip=await window.JSZip.loadAsync(file,{checkCRC32:false});
   const entries=Object.entries(zip.files).filter(([path,f])=>!f.dir&&/\.(pdf|png|jpg|jpeg|webp|gif)$/i.test(path)&&/(pieces jointes|pièces jointes)/i.test(path)).sort(([a],[b])=>a.localeCompare(b,'fr'));
   if(!entries.length)throw Error('Aucun PDF ou schéma dans le dossier « Pièces jointes ».');if(entries.length>150)throw Error('Archive trop volumineuse en nombre de fichiers (150 maximum).');
   for(const [path,entry] of entries){const name=cleanName(path),ext=name.split('.').pop().toLowerCase();const row=E('div','v16-import-row');const left=E('label');const ck=E('input');ck.type='checkbox';ck.checked=ext==='pdf'||/lecon|leçon|cours|fiche/i.test(name)&&!/ent maths/i.test(name);
    left.append(ck,E('strong','',name));const sel=E('select');sel.setAttribute('aria-label','Cours associé à '+name);sel.append(new Option('— Choisir le cours ENT —',''));
    for(const l of courses)sel.append(new Option((l.date||'')+' · '+l.title,l.id));const guess=bestMatch(name,courses);sel.value=guess;
    // Do not preselect unclear matches: attaching a document to the wrong chapter is worse than a skipped import.
    if(!guess)ck.checked=false;
    ck.onchange=refresh;sel.onchange=refresh;row.append(left,sel);list.append(row);rows.push({entry,name,ext,checked:ck,select:sel,row});}
   for(const btn of [pdfs,all,none])btn.disabled=false;refresh();
  }catch(err){status.textContent='Archive non reconnue : '+(err.message||err);}
 };
 start.onclick=async()=>{
  if(busy)return;const selected=rows.filter(r=>r.checked.checked&&r.select.value);if(!selected.length)return;
  if(!confirm('Importer '+selected.length+' document(s) ENT vers le compte privé de Tim ? Vérifie que chaque document est rattaché au bon cours.'))return;
  busy=true;start.disabled=true;input.disabled=true;let ok=0,duplicates=0;const issues=[];const cache=new Map();
  try{
   for(let i=0;i<selected.length;i++){const r=selected[i];status.textContent='Import privé '+(i+1)+'/'+selected.length+' : '+r.name+'\nRéussis : '+ok+' · déjà présents : '+duplicates;
    try{
     const id=r.select.value;let known=cache.get(id);if(!known){known=await api.list('lesson',id);cache.set(id,known);}
     const sizeHint=r.entry._data?.uncompressedSize;
     if(known.some(x=>x.fileName===r.name&&(sizeHint===undefined||x.size===sizeHint))){duplicates++;r.row.style.opacity='.5';continue;}
     const blob=await r.entry.async('blob');if(blob.size>4194304){issues.push(r.name+' : dépasse 4 Mo');continue;}
     const mime={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'}[r.ext];const file=new File([blob],r.name,{type:mime});
     const key=await api.upload('lesson',id,file,r.name,()=>{});known.push({id:key,fileName:r.name,size:file.size});ok++;r.row.style.opacity='.5';
    }catch(err){issues.push(r.name+' : '+(err.message||err));}
   }
   status.textContent='Terminé : '+ok+' document(s) ajouté(s) · '+duplicates+' déjà présent(s).'+(issues.length?'\nÉchecs : '+issues.slice(0,8).join('\n'):'')+'\nTim retrouve les documents dans le cours ENT correspondant après actualisation.';
  }finally{busy=false;input.disabled=false;start.disabled=false;}
 };
 box.append(input,tools,list,start,status);return box;
}
window.TIM_ENT_PRIVATE_IMPORT={render};
})();
