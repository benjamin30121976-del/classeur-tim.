/* Espagnol ENT original — import privé Parent depuis les 2 ZIP Termux.
   Aucun document d'élève n'est publié avec ce code source. */
(function(){
'use strict';
const TAG='ENTESP_2026';
const $=(name,cls='',txt)=>{const e=document.createElement(name);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
function problem(message){throw Error(message);}
function datesSorted(pack){return Object.entries(pack.dates||{}).sort((a,b)=>String(a[1]).localeCompare(String(b[1])));}
function escFiles(name){return String(name||'').split('/').pop();}
function getHrefFile(info){return escFiles(info.nom_dans_archive||'');}
function lessonHtml(doc){return (doc.included||[]).filter(i=>i.type==='lessonContent').map(i=>String(i.attributes?.html||'')).filter(Boolean).join('\n');}
function courseTitle(doc){
 const official=asText(lessonHtml(doc)).replace(/\s+/g,' ').trim();
 const withoutDate=official.replace(/^(?:lunes|martes|mi[eé]rcoles|jueves|viernes)\s+\d{1,2}\s*\/\s*\d{1,2}\s*:\s*/i,'').trim();
 if(!withoutDate)return 'Aucun contenu de cours publié par l’ENT';
 return withoutDate.slice(0,110)+(withoutDate.length>110?'…':'');
}
function deadline(value){
 const original=String(value||'');
 if(!original)return 'Échéance non précisée';
 const parsed=new Date(original);
 if(Number.isNaN(parsed.getTime()))return original;
 return new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(parsed)+' (heure française)';
}

function lessonHomeworkIds(doc){
 const rel=doc.data?.relationships||{},ids=new Set();
 for(const k of ['toDoForTheLesson','toDoAfterTheLesson']){
  let d=rel[k]?.data||[];if(!Array.isArray(d))d=[d];
  for(const item of d)if(item&&item.id)ids.add(String(item.id));
 }
 return [...ids];
}
function asText(raw){
 const s=String(raw||'');
 const html=s.replace(/<\s*br\s*\/?>/gi,'\n').replace(/<\s*\/(?:p|div|li|tr|h[1-6])\s*>/gi,'\n');
 const dom=new DOMParser().parseFromString(html,'text/html');
 dom.querySelectorAll('script,style,iframe,object,embed').forEach(x=>x.remove());
 return (dom.body.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
}
function txt(root,str){
 const pre=$('pre','ent-es-pre',String(str||'')||'[Aucun texte publié dans l’ENT]');
 pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;background:#152039;color:#f3f6fc;padding:12px;border:1px solid #40516d;border-radius:10px;max-height:500px;overflow:auto';
 root.append(pre);
}
async function zipInfo(file){
 if(!file||!file.name.toLowerCase().endsWith('.zip'))problem('Choisis les deux fichiers ZIP Termux.');
 if(!window.JSZip)problem('Lecteur ZIP non chargé sur le site.');
 return window.JSZip.loadAsync(file);
}
async function jsonFile(zip,name){
 const e=zip.file(name);if(!e)problem('Fichier manquant dans le ZIP : '+name);
 const raw=await e.async('string');if(raw.length>750000)problem('Données ZIP anormalement volumineuses.');
 return JSON.parse(raw);
}
function validate(pack){
 const lessons=pack.lessons,homework=pack.homework,dates=pack.dates,index=pack.index;
 if(!Array.isArray(lessons)||!Array.isArray(homework)||!Array.isArray(index)||!dates||typeof dates!=='object')problem('Export ENT incomplet.');
 if(lessons.length<1||lessons.length>160||homework.length>350||index.length>150)problem('Nombre d’éléments anormal.');
 const ids=new Set();
 for(const doc of lessons){
  const id=String(doc?.data?.id||'');if(!id||ids.has(id)||!dates[id])problem('Identifiant de séance ou date invalide.');
  ids.add(id);
  const subj=(doc.included||[]).find(i=>i.type==='subject');
  if(!/espagnol/i.test(String(subj?.attributes?.label||'')))problem('Matière non confirmée pour la séance '+id);
 }
 const hwIds=new Set();
 for(const doc of homework){const id=String(doc?.data?.id||'');if(!id||hwIds.has(id))problem('Devoir ENT dupliqué ou sans identifiant.');hwIds.add(id);}
 const attachIds=new Set();
 for(const item of index){
  if(!item?.id||attachIds.has(item.id)||!item.present||!item.nom_dans_archive||!/\.pdf$/i.test(item.nom_dans_archive))problem('Index de PDF incorrect.');
  attachIds.add(item.id);
 }
 return {lessons:lessons.length,homework:homework.length,pdfs:index.length};
}
async function readTwoZips(courseFile,attachmentFile){
 const courses=await zipInfo(courseFile),files=await zipInfo(attachmentFile);
 const pack={lessons:await jsonFile(courses,'cours_espagnol_ENT_originaux.json'),
   homework:await jsonFile(courses,'travaux_associes_ENT_originaux.json'),
   dates:await jsonFile(courses,'dates_seances.json'),
   index:await jsonFile(courses,'index_fiches_espagnol.json'),
   report:await jsonFile(courses,'rapport_collecte_en_ligne.json')};
 const counts=validate(pack);
 const other=await jsonFile(files,'index_fiches_espagnol.json');
 if(other.length!==pack.index.length||other.some(x=>!pack.index.some(y=>x.id===y.id&&x.nom_dans_archive===y.nom_dans_archive)))
  problem('Les deux ZIP ne correspondent pas à la même collecte Termux.');
 const binary=[];
 let total=0;
 for(const item of pack.index){
  const path=item.nom_dans_archive;
  if(!path.startsWith('fiches_ENT/')||path.includes('..'))problem('Nom de fichier interdit dans le ZIP.');
  const entry=files.file(path);
  if(!entry)problem('PDF ENT absent : '+escFiles(path));
  const bytes=await entry.async('uint8array');
  if(bytes.length<1||bytes.length>4*1024*1024)problem('Taille du PDF incompatible : '+escFiles(path));
  if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')problem('Fichier non PDF : '+escFiles(path));
  total+=bytes.length;if(total>35*1024*1024)problem('Archive disproportionnée.');
  const filename=escFiles(path);
  binary.push({id:String(item.id),filename,blob:new File([bytes],filename,{type:'application/pdf'})});
 }
 return {pack,binary,counts};
}
function appendFileLinks(root,refs,metas){
 for(const info of refs){
  const name=getHrefFile(info);
  const meta=metas.find(x=>x.fileName===name);
  const row=$('div','ent-es-file');
  row.style.cssText='display:flex;gap:10px;align-items:center;margin:6px 0';
  row.append($('span','','PDF · '+String(info.nom_ENT||name)));
  if(meta){
   const b=$('button','','Ouvrir');b.type='button';
   b.addEventListener('click',async()=>{
    b.disabled=true;b.textContent='Ouverture…';
    try{
     const blob=await window.__TIM_BRIDGE.attachments.read(meta);
     const url=URL.createObjectURL(blob);const link=$('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.download=info.nom_ENT||name;
     link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){alert('Lecture du PDF impossible : '+e.message)}
    finally{b.disabled=false;b.textContent='Ouvrir';}
   });row.append(b);
  }else row.append($('small','','PDF non présent dans Firebase'));
  root.append(row);
 }
}
async function render(root,opts={}){
 root.replaceChildren();
 if(typeof opts.back==='function'){
  const back=$('button','btn','← Toutes les matières');back.onclick=opts.back;root.append(back);
 }
 root.append($('h2','','Espagnol — cours et devoirs originaux ENT'));
 const bridge=window.__TIM_BRIDGE,pack=window.__TIM_DATA?.spanishEnt;
 const isParent=!!window.__TIM_PARENT&&!window.__TIM_GUEST;
 if(!pack){
  root.append($('p','','Aucune collecte ENT complète n’est encore installée dans Firebase. Les anciennes leçons BIS et entraînements ne sont pas affichés dans cette matière.'));
 }else{
  const c=validate(pack);
  root.append($('p','','Source : ENT du collège Frédéric Desmons — '+c.lessons+' séances, '+c.homework+' devoirs associés, '+c.pdfs+' PDF. Mise à jour : '+(pack.collectedAt||'date non fournie')+'.'));
  const pstatus=$('p','','Vérification des pièces jointes privées…');root.append(pstatus);
  let metas=[];
  try{metas=await bridge.attachments.list('lesson',TAG);
      const have=pack.index.filter(i=>metas.some(m=>m.fileName===getHrefFile(i))).length;
      pstatus.textContent='PDF originaux disponibles dans Firebase : '+have+'/'+pack.index.length;
  }catch(e){pstatus.textContent='Accès aux PDF privés impossible : '+e.message;}
  const lessonsById=new Map(pack.lessons.map(l=>[String(l.data.id),l]));
  const homeworkById=new Map(pack.homework.map(h=>[String(h.data.id),h]));
  const assignments=$('details');assignments.append($('summary','','Les '+pack.homework.length+' devoirs / consignes officiels ENT'));
  for(const h of pack.homework){
   const attrs=h.data.attributes||{};
   const block=$('section');block.style.cssText='padding:10px;margin:10px 0;border:1px solid #485d78;border-radius:10px';
   block.append($('strong','','Devoir ENT '+h.data.id+' — pour le '+deadline(attrs.dueDateTime||attrs.dueDate)));
   block.append($('small','',' Référence ENT '+h.data.id));
   txt(block,asText([attrs.title,attrs.html,...(h.included||[]).filter(i=>i.type==='pedagogicContent').map(i=>i.attributes?.html)].filter(Boolean).join('\n')));
   appendFileLinks(block,pack.index.filter(i=>(i.rattache_a||[]).some(x=>x.type==='travail_associe'&&x.id===h.data.id)),metas);
   assignments.append(block);
  }
  root.append(assignments);
  root.append($('h3','','Cours ENT, par date'));
  for(const [id,date] of datesSorted(pack)){
   const l=lessonsById.get(id);if(!l)continue;
   const panel=$('details');panel.style.cssText='padding:10px;margin:10px 0;border:1px solid #4e6280;border-radius:12px';
   panel.append($('summary','',date+' — '+courseTitle(l)));
   panel.append($('small','','Intitulé ENT : '+String(l.data.attributes?.title||'Espagnol LV2')+' · Réf. '+id));
   const time=l.data.attributes||{};
   panel.append($('small','',String(time.startDateTime||'')+' — '+String(time.endDateTime||'')));
   panel.append($('h4','','Activité de séance — texte original ENT'));
   txt(panel,asText(lessonHtml(l)));
   const original=$('details');original.append($('summary','','Voir le texte HTML brut, identique à la source ENT'));
   txt(original,lessonHtml(l));panel.append(original);
   for(const hid of lessonHomeworkIds(l)){
    const h=homeworkById.get(hid);
    if(h){panel.append($('h4','','Travail associé ENT '+hid));const attrs=h.data.attributes||{};
      txt(panel,asText([attrs.title,attrs.html].filter(Boolean).join('\n')));
      appendFileLinks(panel,pack.index.filter(i=>(i.rattache_a||[]).some(x=>x.type==='travail_associe'&&x.id===hid)),metas);
    }
   }
   root.append(panel);
  }
  const all=$('details');all.append($('summary','','Les '+pack.index.length+' fiches originales (inventaire complet)'));
  appendFileLinks(all,pack.index,metas);root.append(all);
 }
 if(!isParent)return;
 const uploader=$('section');uploader.style.cssText='margin:18px 0;padding:14px;border:1px solid #6a879f;border-radius:12px';
 uploader.append($('h3','','Parent — actualiser depuis les ZIP Termux'));
 uploader.append($('p','','Importer les 2 ZIP de la même collecte : aucun document privé n’est envoyé sur GitHub. Les autres matières et les anciennes notes restent intactes.'));
 const f1=$('input');f1.type='file';f1.accept='.zip';f1.setAttribute('aria-label','ZIP des cours et devoirs');
 const f2=$('input');f2.type='file';f2.accept='.zip';f2.setAttribute('aria-label','ZIP des fiches PDF');
 const label1=$('label','','Cours et devoirs ENT : ');label1.append(f1);
 const label2=$('label','','Fiches PDF ENT : ');label2.append(f2);
 for(const label of [label1,label2]){label.style.cssText='display:block;margin:9px 0';uploader.append(label);}
 const inspect=$('button','btn','Vérifier les PDF espagnols déjà présents dans Firebase');inspect.type='button';
 const inspection=$('p','','');
 inspect.addEventListener('click',async()=>{
  inspect.disabled=true;inspection.textContent='Recherche des anciennes pièces jointes espagnoles…';
  try{
   const all=[],targets=[TAG,...Array.from({length:15},(_,i)=>'L'+String(i+1).padStart(2,'0'))];
   for(const id of targets){
    const rows=await bridge.attachments.list('lesson',id);
    for(const r of rows)if(!all.some(v=>v.id===r.id))all.push({...r,oldTarget:id});
   }
   if(f1.files[0]&&f2.files[0]){
    const loaded=await readTwoZips(f1.files[0],f2.files[0]);
    let exact=0;
    for(const b of loaded.binary){
     const digest=await crypto.subtle.digest('SHA-256',await b.blob.arrayBuffer());
     const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
     if(all.some(r=>r.sha256===hash&&r.size===b.blob.size))exact++;
    }
    inspection.textContent='Contrôle par empreinte SHA-256 : '+exact+'/'+loaded.binary.length+' PDF ENT identiques déjà stockés. '+all.length+' ancienne(s) pièce(s) jointes espagnoles trouvées dans les emplacements vérifiés.';
   }else{
    inspection.textContent=all.length+' PDF ou pièces jointes dans les emplacements espagnols vérifiés. Pour confirmer lesquels correspondent exactement aux neuf PDF ENT, sélectionne les deux ZIP et relance ce contrôle.';
   }
  }catch(e){inspection.textContent='Vérification Firebase impossible : '+e.message;}
  finally{inspect.disabled=false;}
 });
 uploader.append(inspect,inspection);
 const status=$('p','','Aucune modification tant que les deux fichiers ne sont pas validés.');
 const act=$('button','btn','Vérifier et installer uniquement l’ENT espagnol');act.type='button';
 act.addEventListener('click',async()=>{
  act.disabled=true;status.textContent='Lecture des deux ZIP…';
  try{
   const loaded=await readTwoZips(f1.files[0],f2.files[0]);
   const {lessons,homework,pdfs}=loaded.counts;
   status.textContent='Source vérifiée : '+lessons+' séances, '+homework+' devoirs et '+pdfs+' PDF. Enregistrement privé en cours…';
   await bridge.saveSpanishEnt(loaded.pack,loaded.binary,(msg)=>{status.textContent=msg;});
   status.textContent='Import terminé. Actualisation du classeur…';
   window.location.reload();
  }catch(e){
   status.textContent='IMPORT INTERROMPU : '+e.message;
   if(/permission|autorisation|accès refusé/i.test(e.message)){
    const a=$('a','','Ouvrir les règles Firebase du classeur');
    a.href='https://console.firebase.google.com/project/classeur-ba3e7/firestore/rules';
    a.target='_blank';a.rel='noopener noreferrer';
    status.append(document.createTextNode(' — '));status.append(a);
   }
  }
  finally{act.disabled=false;}
 });
 uploader.append(act,status);root.append(uploader);
}
window.TIM_SPANISH_ENT_EXACT={render,parse:readTwoZips,validate,TAG};
})();
