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
function frenchPreview(raw,max=125){
 let value=String(raw||'').replace(/\s+/g,' ').trim();
 value=value.replace(/^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+\d{1,2}(?:er)?\s+[^:]{2,24}:\s*/i,'');
 if(!value)return 'Traduction française non disponible';
 if(value.length>max)value=value.slice(0,max-1).replace(/\s+\S*$/,'')+'…';
 return value;
}
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
 // Les données Skolengo contiennent parfois des lignes vides garnies d'espaces.
 // Les réduire pour un affichage lisible sans changer les mots ni le contenu ENT.
 return (dom.body.textContent||'')
   .replace(/\r\n?/g,'\n')
   .replace(/\u00a0/g,' ')
   .split('\n').map(line=>line.trim()).join('\n')
   .replace(/\n(?:[ \t]*\n)+/g,'\n\n')
   .trim();
}
// Les traductions sont chargees depuis Firebase prive, jamais depuis GitHub public.
function homeworkOriginal(doc){
 const attrs=doc.data?.attributes||{};
 return [attrs.title,attrs.html,...(doc.included||[]).filter(i=>i.type==='pedagogicContent').map(i=>i.attributes?.html)].filter(Boolean).map(String).join('\n');
}
async function hashOriginal(source){
 const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(source||'')));
 return Array.from(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');
}
async function validateTranslations(pack,translations){
 validate(pack);
 if(!translations||translations.schema!=='tim-spanish-ent-translations-v1'||translations.language!=='fr')problem('Ce fichier ne correspond pas au modèle de traduction française ENT.');
 const lessonIds=new Set(pack.lessons.map(x=>String(x.data.id)));
 const homeIds=new Set(pack.homework.map(x=>String(x.data.id)));
 if(!translations.courses||!translations.homework||
   Object.keys(translations.courses).length!==lessonIds.size||
   Object.keys(translations.homework).length!==homeIds.size)
  problem('Traductions incomplètes : toutes les leçons et tous les devoirs doivent être présents.');
 for(const doc of pack.lessons){
  const id=String(doc.data.id),entry=translations.courses[id];
  if(!entry||typeof entry.fr!=='string'||!entry.fr.trim()||entry.fr.length>10000||
     !/^[a-f0-9]{64}$/.test(String(entry.sha256||'')))
   problem('Traduction de cours invalide : '+id);
  const originalHash=await hashOriginal(lessonHtml(doc));
  if(originalHash!==entry.sha256)problem('La traduction ne correspond pas au cours ENT '+id+'. Vérifier que le fichier concerne la bonne collecte.');
 }
 for(const doc of pack.homework){
  const id=String(doc.data.id),entry=translations.homework[id];
  if(!entry||typeof entry.fr!=='string'||!entry.fr.trim()||entry.fr.length>10000||
     !/^[a-f0-9]{64}$/.test(String(entry.sha256||'')))
   problem('Traduction du devoir invalide : '+id);
  const originalHash=await hashOriginal(homeworkOriginal(doc));
  if(originalHash!==entry.sha256)problem('La traduction ne correspond pas au devoir ENT '+id+'.');
 }
 if(translations.attachments!==undefined){
   const knownPdfIds=new Set(pack.index.map(x=>String(x.id)));
   if(!translations.attachments||Object.keys(translations.attachments).length!==knownPdfIds.size)
    problem('Les traductions des PDF sont incomplètes.');
   for(const [id,entry] of Object.entries(translations.attachments)){
    if(!knownPdfIds.has(id)||typeof entry?.fr!=='string'||!entry.fr.trim()||
      typeof entry?.label_fr!=='string'||!entry.label_fr.trim()||
      !/^[a-f0-9]{64}$/.test(String(entry.sha256||'')))
     problem('Traduction de la fiche PDF invalide : '+id);
   }
 }
 return {lessons:lessonIds.size,homework:homeIds.size,pdfs:translations.attachments?Object.keys(translations.attachments).length:0};
}
function appendFrench(root,entries,id){
 const item=entries?.[String(id)];
 if(!item?.fr)return;
 const title=$('h4','ent-es-traduction-title','Traduction française');
 title.style.cssText='color:#a6f2df;margin:16px 0 6px';
 root.append(title);
 txt(root,item.fr);
 const note=$('small','','Traduction d’aide à la lecture — le texte original de l’ENT reste inchangé.');
 note.style.cssText='display:block;opacity:.8;margin-bottom:10px';
 root.append(note);
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
function appendFileLinks(root,refs,metas,translations){
 for(const info of refs){
  const name=getHrefFile(info);
  const meta=metas.find(x=>x.fileName===name);
  const row=$('div','ent-es-file');
  row.style.cssText='display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0';

  const originalName=String(info.nom_ENT||name);
  const nameBox=$('span','','Fiche PDF ENT · '+originalName);
  nameBox.style.cssText='flex:1;min-width:0;overflow-wrap:anywhere';
  row.append(nameBox);
  if(meta){
   /* Le PDF original est dessiné ici, à côté de la consigne et de la traduction.
      Aucun onglet extérieur, aucune URL du fichier privé divulguée. */
   const viewer=window.TIM_PHYSICS_INLINE_PDF?.createInline?.(
    {target:TAG,fileName:name},1,
    'Fiche originale du professeur — '+originalName,{manual:true}
   );
   if(viewer){
    const guide=$('p','ent-es-inline-guide','La fiche reste sur cette page. Utilise « Afficher ici le document » puis Page avant / Page après et A+ pour l’agrandir.');
    guide.style.cssText='margin:8px 0;color:inherit;font-size:14px;line-height:1.5';
    row.append(guide);
    root.append(row,viewer);
   }else{
    row.append($('small','','Lecteur PDF intégré indisponible : actualiser le classeur.'));
    root.append(row);
   }
  }else{
   row.append($('small','','PDF original non importé dans la bibliothèque privée.'));
   root.append(row);
  }
  const translation=translations?.attachments?.[String(info.id)];
  if(translation?.fr){
    const detail=$('details','ent-es-pdf-fr');
    detail.style.cssText='margin:0 0 14px 8px;padding:8px 10px;border-left:3px solid #80cbb4;background:#16352f;border-radius:5px';
    detail.append($('summary','','Lire en français : '+translation.label_fr));
    txt(detail,translation.fr);
    detail.append($('small','','Aide française pour comprendre la fiche ; l’exercice original reste en espagnol et ses réponses ne sont pas fournies.'));
    root.append(detail);
  }
 }
}

/* Leçon BIS L01 : aide pédagogique en français, distincte du cours ENT original.
   Première séance du 16/09/2026, réf. ENT 10099~6400501.
   Aucun exercice ajouté, aucune donnée privée enregistrée. */

/* Prononciation de L01 : boutons reliés au lecteur espagnol existant.
   Aucun enregistrement, aucune API payante, aucun changement aux exercices. */
function enhanceBisL01Audio(body){
 const makeButton=(spoken,label='Écouter')=>{
  const b=$('button','ent-es-bis-listen',label);
  b.type='button';b.setAttribute('data-say-es',spoken);
  b.setAttribute('aria-label','Écouter en espagnol : '+spoken);
  b.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:38px;margin:4px 5px;padding:8px 11px;border:1px solid #2e448f!important;border-radius:9px;background:#2e448f!important;color:white!important;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer;opacity:1!important;text-shadow:none!important';
  return b;
 };
 // Écouter séparément chaque question, chaque réponse, puis la présentation.
 body.querySelectorAll('.ent-es-bis-example').forEach(row=>{
  const spanish=row.querySelector('strong')?.textContent?.trim();
  if(!spanish)return;
  const parts=spanish.includes(' — ')?spanish.split(' — '):[spanish];
  const actions=$('div','ent-es-bis-audio-actions');
  actions.style.cssText='display:flex;flex-wrap:wrap;align-items:center;margin:7px 0';
  parts.forEach((p,i)=>actions.append(makeButton(p,parts.length===2?(i?'Écouter la réponse':'Écouter la question'):'Écouter la phrase')));
  row.append(actions);
 });
 // Leçon §2 : deux expressions distinctes par ligne (avant les =).
 const lists=[...body.querySelectorAll('ul')];
 if(lists[0]){
  lists[0].querySelectorAll('li').forEach(li=>{
   String(li.textContent||'').split(';').map(s=>s.trim().split(' = ')[0].trim()).filter(Boolean).forEach(s=>li.append(makeButton(s)));
  });
 }
 // Tableau de L01 : un pronom par encadré, puis un verbe par ligne.
 // Sur téléphone, seules trois colonnes restent visibles : verbe / forme et sens / audio.
 if(lists[1]){
  const phrases=[
   ['Yo — je',[['Llamarse','me llamo','je m’appelle'],['Ser','soy','je suis'],['Ir','voy','je vais']]],
   ['Tú — tu',[['Llamarse','te llamas','tu t’appelles'],['Ser','eres','tu es'],['Ir','vas','tu vas']]],
   ['Él / Ella — il / elle',[['Llamarse','se llama','il / elle s’appelle'],['Ser','es','il / elle est'],['Ir','va','il / elle va']]],
   ['Nosotros / Nosotras — nous',[['Llamarse','nos llamamos','nous nous appelons'],['Ser','somos','nous sommes'],['Ir','vamos','nous allons']]],
   ['Vosotros / Vosotras — vous',[['Llamarse','os llamáis','vous vous appelez'],['Ser','sois','vous êtes'],['Ir','vais','vous allez']]],
   ['Ellos / Ellas — ils / elles',[['Llamarse','se llaman','ils / elles s’appellent'],['Ser','son','ils / elles sont'],['Ir','van','ils / elles vont']]]
  ];
  const wrap=$('div','ent-es-bis-conjugation-cards');
  wrap.style.cssText='display:grid;grid-template-columns:minmax(0,1fr);gap:11px;margin:13px 0';
  for(const [person,rows] of phrases){
   const card=$('section');
   card.style.cssText='border:1px solid #cbd2ec;background:white;padding:10px 9px;border-radius:12px;max-width:100%;overflow:hidden';
   const label=$('h5','',person);
   label.style.cssText='margin:2px 0 8px;font-size:16px;color:#243a90';
   card.append(label);
   const tab=$('table');
   tab.style.cssText='width:100%;border-collapse:collapse;table-layout:fixed;font-size:14px';
   const header=$('tr');
   for(const [i,word] of ['Verbe','Espagnol — français','Écouter'].entries()){
    const th=$('th','',word);
    th.style.cssText='text-align:left;color:#32435f;border-bottom:2px solid #e1e5f4;padding:7px 3px;'+(i===0?'width:70px;':i===2?'width:46px;':'');
    header.append(th);
   }
   const thead=$('thead');thead.append(header);tab.append(thead);
   const tbody=$('tbody');
   for(const [verb,form,fr] of rows){
    const tr=$('tr');
    const a=$('td','',verb);a.style.cssText='padding:9px 3px;border-bottom:1px solid #e6e9f3;vertical-align:middle;font-weight:750;overflow-wrap:anywhere';
    const b=$('td');b.style.cssText='padding:9px 3px;border-bottom:1px solid #e6e9f3;vertical-align:middle;overflow-wrap:anywhere';
    const es=$('strong','',form);es.style.cssText='color:#263a90;display:block;font-size:15px';
    const french=$('span','',fr);french.style.cssText='display:block;color:#58657e;font-size:13px';
    b.append(es,french);
    const c=$('td');c.style.cssText='padding:7px 0;border-bottom:1px solid #e6e9f3;vertical-align:middle';
    const audio=makeButton(form,'▶');audio.textContent='▶';
    audio.style.cssText='width:39px;height:38px;min-height:38px!important;padding:4px!important;border-radius:9px;background:#273b91!important;color:#fff!important;border:1px solid #273b91!important;font-weight:850';
    c.append(audio);
    tr.append(a,b,c);tbody.append(tr);
   }
   tab.append(tbody);card.append(tab);wrap.append(card);
  }
  lists[1].replaceWith(wrap);
 }
 const groups=[
  ['La fiche de renseignements',[
   ['ficha','fiche'],['de','de / du selon le contexte'],['datos','renseignements / données'],
   ['mi','mon / ma'],['nombre','nom / prénom sur la fiche'],['apellido','nom de famille'],
   ['edad','âge'],['fecha','date'],['nacimiento','naissance'],
   ['dirección','adresse'],['lugar','lieu'],['nacionalidad','nationalité'],
   ['mis','mes'],['gustos','goûts']]],
  ['Questions et réponses',[
   ['cómo','comment'],['te','te / toi'],['llamas','tu t’appelles'],
   ['cuántos','combien de'],['años','ans'],['tienes','tu as'],
   ['tengo','j’ai'],['quince','quinze'],['dónde','où'],
   ['vives','tu habites'],['vivo','j’habite'],['en','en / à'],
   ['Francia','France'],['qué','que / quoi / quel'],['eres','tu es'],
   ['soy','je suis'],['francés','français'],['francesa','française'],
   ['me','me / moi'],['llamo','je m’appelle'],['gusta','plaît / aime avec me'],
   ['el','le'],['fútbol','football']]],
  ['Les pronoms personnels',[
   ['yo','je'],['tú','tu'],['él','il'],['ella','elle'],
   ['nosotros','nous (masculin ou mixte)'],['nosotras','nous (féminin)'],
   ['vosotros','vous (masculin ou mixte)'],['vosotras','vous (féminin)'],
   ['ellos','ils'],['ellas','elles'],['se','se'],
   ['nos','nous'],['os','vous, pronom réfléchi']]],
  ['Les verbes et leurs formes',[
   ['llamarse','s’appeler'],['ser','être'],['ir','aller'],['tener','avoir'],
   ['llama','s’appelle'],['llamamos','nous appelons'],['llamáis','vous appelez'],
   ['llaman','s’appellent'],['es','est'],['somos','sommes'],
   ['sois','êtes'],['son','sont'],['voy','je vais'],['vas','tu vas'],
   ['va','il va'],['vamos','nous allons'],['vais','vous allez'],['van','ils vont']]],
  ['Les mots de la présentation complète',[
   ['hola','bonjour / salut'],['al','au (a + el)'],['colegio','collège'],
   ['Alex','prénom du personnage fictif']]]
 ];
 const all=new Set();
 const box=$('details','ent-es-bis-lexicon');
 box.style.cssText='border:1px solid #bec5ea;border-radius:12px;margin:17px 0;padding:12px;background:#fff;color:#23314b';
 for(const [,entries] of groups)for(const [es] of entries)all.add(es.toLocaleLowerCase('es'));
 const title=$('summary','','Tous les mots de la leçon : '+all.size+' mots à écouter un par un');
 title.style.cssText='font-weight:900;font-size:17px;color:#263a97;cursor:pointer;padding:8px 0';
 box.append(title);
 for(const [group,entries] of groups){
  const h=$('h5','',group);h.style.cssText='font-size:16px;margin:20px 0 8px;color:#263a97';box.append(h);
  for(const [es,fr] of entries){
   const row=$('div','ent-es-bis-vocab-row');
   row.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-bottom:1px solid #e7eaf0;padding:6px 0';
   const label=$('span');label.style.cssText='flex:1 1 160px';
   const word=$('strong','',es);word.style.cssText='color:#253996';
   label.append(word,document.createTextNode(' — '+fr));
   row.append(label,makeButton(es));box.append(row);
  }
 }
 const subtitle=$('h4','','7. Le dictionnaire de cette leçon, mot par mot');
 subtitle.style.cssText='margin:24px 0 8px;font-size:18px;color:#1c307c';
 const instruction=$('p','','Appuie sur « Tous les mots » pour afficher le répertoire. Chaque mot espagnol a sa traduction française et son propre bouton « Écouter ». Les phrases et conjugaisons ci-dessus sont également écoutables.');
 instruction.style.cssText='margin:6px 0 12px';
 body.append(subtitle,instruction,box);
}
function appendBisL01(panel){
 const bis=$('details','ent-es-bis-l01');
 bis.style.cssText='margin:14px 0;padding:12px 14px;border:2px solid #a7a1eb;border-radius:13px;background:#f5f3ff;color:#232b46';
 const toggle=$('summary','','Ouvrir la leçon BIS — comprendre « Se présenter » (en français)');
 toggle.style.cssText='cursor:pointer;font-weight:900;font-size:18px;line-height:1.45;color:#263a97;padding:10px 3px';
 bis.append(toggle);
 const body=$('div','ent-es-bis-body');
 body.style.cssText='font-size:16px;line-height:1.65;color:#1e2b43;padding:4px 2px 14px';
 const heading=(s)=>{const e=$('h4','',s);e.style.cssText='margin:22px 0 9px;font-size:18px;color:#1c307c';body.append(e);};
 const paragraph=(s)=>{const e=$('p','',s);e.style.cssText='margin:7px 0 12px';body.append(e);};
 const list=(items)=>{const e=$('ul');e.style.cssText='padding-left:23px;margin:9px 0 16px';for(const t of items){const li=$('li','',t);li.style.cssText='margin:8px 0';e.append(li);}body.append(e);};
 const example=(es,fr)=>{
  const row=$('div','ent-es-bis-example');
  row.style.cssText='padding:10px 12px;margin:7px 0;background:#fff;border:1px solid #d6d9ed;border-radius:10px';
  const spanish=$('strong','',es);spanish.style.cssText='display:block;color:#253996;font-weight:800';
  const french=$('span','',fr);french.style.cssText='display:block;color:#34405a;margin-top:2px';
  row.append(spanish,french);body.append(row);
 };
 heading('1. À quoi sert cette leçon ?');
 paragraph('La fiche de renseignements (« ficha de datos ») sert à parler de toi. Le professeur demande une présentation à l’oral, notée sur 10, à partir d’une fiche vide. Il faut donc savoir former quelques phrases sans lire un texte tout préparé.');
 paragraph('L’objectif n’est pas de traduire chaque mot de la fiche par cœur : il faut comprendre la question, puis savoir répondre.');
 heading('2. Comprendre les mots de la fiche');
 list([
  'Mi nombre = mon prénom ; mi apellido = mon nom de famille.',
  'Mi edad = mon âge ; mi fecha de nacimiento = ma date de naissance.',
  'Mi dirección = mon adresse ; mi lugar de nacimiento = mon lieu de naissance.',
  'Mi nacionalidad = ma nationalité ; mis gustos = mes goûts.'
 ]);
 heading('3. Savoir répondre aux questions');
 example('¿Cómo te llamas? — Me llamo Alex.','Comment t’appelles-tu ? — Je m’appelle Alex.');
 example('¿Cuántos años tienes? — Tengo quince años.','Quel âge as-tu ? — J’ai quinze ans.');
 example('¿Dónde vives? — Vivo en Francia.','Où habites-tu ? — J’habite en France.');
 example('¿De qué nacionalidad eres? — Soy francés.','Quelle est ta nationalité ? — Je suis français. (« francesa » au féminin.)');
 example('¿Qué te gusta? — Me gusta el fútbol.','Qu’aimes-tu ? — J’aime le football.');
 heading('4. Les trois verbes demandés par le professeur');
 paragraph('LLAMARSE signifie « s’appeler », SER signifie « être », IR signifie « aller ». Voici les six personnes au présent. Pour chaque pronom, le tableau montre les trois verbes sur trois lignes séparées, avec leur traduction et un bouton d’écoute.');
 list([
  'Yo (je) : me llamo / soy / voy.',
  'Tú (tu) : te llamas / eres / vas.',
  'Él, ella (il, elle) : se llama / es / va.',
  'Nosotros, nosotras (nous) : nos llamamos / somos / vamos.',
  'Vosotros, vosotras (vous) : os llamáis / sois / vais.',
  'Ellos, ellas (ils, elles) : se llaman / son / van.'
 ]);
 paragraph('Pour indiquer l’âge, on utilise un autre verbe : TENER (avoir). « Tengo quince años » = « J’ai quinze ans ». On ne dit pas « Soy quince años ».');
 heading('5. Exemple de présentation complète');
 example('Hola. Me llamo Alex. Tengo quince años. Vivo en Francia. Soy francés. Me gusta el fútbol. Voy al colegio.','Bonjour. Je m’appelle Alex. J’ai quinze ans. J’habite en France. Je suis français. J’aime le football. Je vais au collège.');
 paragraph('Cet exemple utilise un personnage fictif. Pour ton oral, remplace son prénom et ses informations par les tiennes, sans les publier sur le site.');
 heading('6. Ce qu’il faut apprendre et comprendre');
 list([
  'Comprendre les rubriques de la ficha de datos.',
  'Savoir dire au moins ton prénom, ton âge, où tu habites et ce que tu aimes.',
  'Savoir répondre aux questions simples ci-dessus avec une phrase complète.',
  'Reconnaître et conjuguer llamarse, ser et ir, comme demandé sur la photocopie.',
  'Comprendre que « me llamo » veut dire « je m’appelle », que « soy » exprime une identité et que « voy » signifie « je vais ».'
 ]);
 paragraph('Pour réviser : lis les exemples avec leur traduction, cache la partie française, puis refais la présentation à voix haute sans regarder la fiche.');
 enhanceBisL01Audio(body);
 bis.append(body);panel.append(bis);
}

async function renderArchive(root,opts={}){
 root.replaceChildren();
 if(typeof opts.back==='function'){
  const back=$('button','btn','← Toutes les matières');back.onclick=opts.back;root.append(back);
 }
 root.append($('h2','','Espagnol — cours et devoirs originaux ENT'));
 const bridge=window.__TIM_BRIDGE,pack=window.__TIM_DATA?.metadata?.spanishEnt;
 const translations=pack?.translations;
 const isParent=!!window.__TIM_PARENT&&!window.__TIM_GUEST;
 if(!pack){
  root.append($('p','','Aucune collecte ENT complète n’est encore installée dans Firebase. Les anciennes leçons BIS et entraînements ne sont pas affichés dans cette matière.'));
 }else{
  const c=validate(pack);
  root.append($('p','','Source : ENT du collège Frédéric Desmons — '+c.lessons+' séances, '+c.homework+' devoirs associés, '+c.pdfs+' PDF. Mise à jour : '+(pack.collectedAt||'date non fournie')+'.'));
  root.append($('p','','Traduction française : '+(translations?.language==='fr'?'disponible pour '+Object.keys(translations.courses||{}).length+' séances et '+Object.keys(translations.homework||{}).length+' devoirs, sur les comptes Parent et Tim.':'à installer depuis le compte Parent.')));

  const pstatus=$('p','','Vérification des pièces jointes privées…');root.append(pstatus);
  let metas=[];
  try{metas=await bridge.attachments.list('lesson',TAG);
      const have=pack.index.filter(i=>metas.some(m=>m.fileName===getHrefFile(i))).length;
      pstatus.textContent='PDF originaux disponibles dans Firebase : '+have+'/'+pack.index.length;
  }catch(e){pstatus.textContent='Accès aux PDF privés impossible : '+e.message;}
  if(isParent){
   const controls=$('section','ent-es-translations-import');
   controls.style.cssText='padding:14px;margin:16px 0;border:1px solid #638f87;border-radius:12px;background:#11342d';
   controls.append($('h3','','Parent — ajouter les traductions françaises'));
   controls.append($('p','','Un seul fichier de traduction est nécessaire. Les cours et PDF originaux restent inchangés. Après installation, Tim et Parent verront la même traduction.'));
   const file=$('input');file.type='file';file.accept='.json,application/json';
   file.setAttribute('aria-label','Traductions françaises JSON');
   file.style.cssText='display:block;max-width:100%;margin:10px 0';
   const action=$('button','btn','Installer les traductions françaises');action.type='button';
   const feedback=$('p','','Aucune traduction modifiée pour le moment.');
   action.addEventListener('click',async()=>{
    action.disabled=true;feedback.textContent='Vérification des traductions…';
    try{
     if(!file.files[0])problem('Choisis le fichier de traduction française au format JSON.');
     if(file.files[0].size>100000)problem('Fichier de traduction trop volumineux.');
     const payload=JSON.parse(await file.files[0].text());
     const result=await validateTranslations(pack,payload);
     feedback.textContent='Correspondance ENT vérifiée : '+result.lessons+' séances, '+result.homework+' devoirs et '+result.pdfs+' fiches traduites. Enregistrement privé dans Firebase…';
     await bridge.saveSpanishTranslations(payload);
     feedback.textContent='Traductions enregistrées pour Parent et Tim. Actualisation…';
     window.location.reload();
    }catch(e){feedback.textContent='Traductions non installées : '+String(e.message||e);}
    finally{action.disabled=false;}
   });
   controls.append(file,action,feedback);
   root.append(controls);
  }
  const lessonsById=new Map(pack.lessons.map(l=>[String(l.data.id),l]));
  const homeworkById=new Map(pack.homework.map(h=>[String(h.data.id),h]));
  const assignments=$('details');assignments.append($('summary','','Les '+pack.homework.length+' devoirs / consignes officiels ENT'));
  for(const h of pack.homework){
   const attrs=h.data.attributes||{};
   const block=$('section');block.style.cssText='padding:10px;margin:10px 0;border:1px solid #485d78;border-radius:10px';
   block.append($('strong','','Devoir ENT — pour le '+deadline(attrs.dueDateTime||attrs.dueDate)));
   block.append($('p','','En français : '+frenchPreview(translations?.homework?.[h.data.id]?.fr,220)));
   block.append($('small','',' Référence ENT '+h.data.id));
   txt(block,asText([attrs.title,attrs.html,...(h.included||[]).filter(i=>i.type==='pedagogicContent').map(i=>i.attributes?.html)].filter(Boolean).join('\n')));
   appendFrench(block,translations?.homework,h.data.id);
   appendFileLinks(block,pack.index.filter(i=>(i.rattache_a||[]).some(x=>x.type==='travail_associe'&&x.id===h.data.id)),metas,translations);
   assignments.append(block);
  }
  root.append(assignments);
  root.append($('h3','','Cours ENT, par date'));
  for(const [id,date] of datesSorted(pack)){
   const l=lessonsById.get(id);if(!l)continue;
   const panel=$('details');panel.style.cssText='padding:10px;margin:10px 0;border:1px solid #4e6280;border-radius:12px';
   const heading=$('summary');
   heading.style.cssText='line-height:1.45;padding:5px 0';
   const line1=$('div','',''+date+' — '+frenchPreview(translations?.courses?.[id]?.fr,155));
   line1.style.cssText='font-weight:700;white-space:normal;overflow-wrap:anywhere';
   const line2=$('div','','Espagnol : '+courseTitle(l));
   line2.style.cssText='font-size:.84em;opacity:.8;white-space:normal;overflow-wrap:anywhere;margin-top:4px';
   heading.append(line1,line2);panel.append(heading);
   panel.append($('small','','Intitulé ENT : '+String(l.data.attributes?.title||'Espagnol LV2')+' · Réf. '+id));

   const coursePanel=$('details','ent-es-course');
   coursePanel.style.cssText='margin:14px 0;padding:10px 12px;border:1px solid #82b6c9;border-radius:10px;background:#173450';
   const courseSummary=$('summary','','Ouvrir la leçon ENT — espagnol et traduction française');
   courseSummary.style.cssText='cursor:pointer;font-weight:800;color:#ffffff;font-size:18px;padding:12px 4px;line-height:1.4';
   coursePanel.append(courseSummary);
   const time=l.data.attributes||{};
   coursePanel.append($('small','','Séance '+String(time.startDateTime||date)+' — '+String(time.endDateTime||'')));
   coursePanel.append($('h4','','Cours original ENT (espagnol)'));
   txt(coursePanel,asText(lessonHtml(l)));
   appendFrench(coursePanel,translations?.courses,id);
   const original=$('details');
   original.append($('summary','','Voir le texte HTML brut tel que récupéré de l’ENT'));
   txt(original,lessonHtml(l));
   coursePanel.append(original);
   panel.append(coursePanel);
   if(String(id)==='10099~6400501')appendBisL01(panel);
   else window.TIM_SPANISH_ENT_BIS?.render(panel,String(id));
   const associatedHomeworkIds=lessonHomeworkIds(l);
   const lessonFiles=pack.index.filter(i=>(i.rattache_a||[]).some(x=>
     (x.type==='cours'&&x.id===id)||
     (x.type==='travail_associe'&&associatedHomeworkIds.includes(x.id))
   ));
   // La leçon et l'exercice de l'ENT ne sont pas des questionnaires interactifs
   // dans le classeur : la consigne originale s'ouvre ici, avec sa fiche si elle existe.
   const associatedHomework=associatedHomeworkIds.map(hid=>homeworkById.get(hid)).filter(Boolean);
   if(associatedHomework.length || lessonFiles.length){
    const exerciseArea=$('section','ent-es-assignment-area');
    exerciseArea.style.cssText='padding:10px;margin:14px 0;border:1px solid #5c88b9;border-radius:12px;background:#102b40';
    exerciseArea.append($('h4','','Exercices et devoirs originaux de l’ENT'));
    exerciseArea.append($('p','','Appuie sur « Ouvrir l’exercice ENT » pour lire la consigne originale et sa traduction. Si une fiche PDF est prévue par la professeure, son bouton est également affiché.'));
    for(const h of associatedHomework){
     const hid=String(h.data.id),attrs=h.data.attributes||{};
     const pdfs=pack.index.filter(i=>(i.rattache_a||[]).some(x=>x.type==='travail_associe'&&x.id===hid));
     const ex=$('details','ent-es-exercise');
     ex.style.cssText='margin:10px 0;padding:10px 12px;border:1px solid #82b6c9;border-radius:10px;background:#173450';
     const summary=$('summary','','Ouvrir l’exercice ENT'+(pdfs.length?' — '+pdfs.length+' fiche'+(pdfs.length>1?'s':'')+' PDF':' — consigne écrite'));
     summary.style.cssText='cursor:pointer;font-weight:800;color:#ffffff;font-size:17px;padding:10px 4px;line-height:1.4';
     ex.append(summary);
     ex.append($('h5','','Consigne originale ENT'));
     txt(ex,asText(homeworkOriginal(h)));
     appendFrench(ex,translations?.homework,hid);
     window.TIM_SPANISH_ENT_EXERCISE_BIS?.render(ex,hid);
     if(pdfs.length){
      ex.append($('h5','','Fiche'+(pdfs.length>1?'s':'')+' originale'+(pdfs.length>1?'s':'')+' de l’exercice'));
      appendFileLinks(ex,pdfs,metas,translations);
     }else{
      ex.append($('p','','Aucune fiche PDF n’est associée à ce devoir dans la collecte ENT ; la consigne écrite est conservée ci-dessus.'));
     }
     exerciseArea.append(ex);
    }
    const unassigned=lessonFiles.filter(info=>!associatedHomework.some(h=>
      (info.rattache_a||[]).some(x=>x.type==='travail_associe'&&x.id===String(h.data.id))));
    if(unassigned.length){
     const extra=$('details','ent-es-course-pdfs');
     extra.style.cssText='margin:10px 0;padding:8px 12px;border:1px solid #82b6c9;border-radius:10px;background:#173450';
     const summary=$('summary','','Voir les autres fiches PDF de cette séance ('+unassigned.length+')');
     summary.style.cssText='cursor:pointer;font-weight:800;color:#fff;font-size:17px;padding:10px 4px';
     extra.append(summary);appendFileLinks(extra,unassigned,metas,translations);exerciseArea.append(extra);
    }
    panel.append(exerciseArea);
   }else{
    panel.append($('p','','Aucun exercice ou document PDF associé à cette séance dans la collecte ENT.'));
   }
   root.append(panel);
  }
  const all=$('details');all.append($('summary','','Les '+pack.index.length+' fiches originales (inventaire complet)'));
  appendFileLinks(all,pack.index,metas,translations);root.append(all);
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
/* Suivi chronologique espagnol : conserver la séance vérifiée du 12 novembre
   dans les leçons, puis faire progresser automatiquement le dernier cours importé.
   Lecture seule : jamais de modification des notes, XP ni fichiers privés. */
function frenchDate(iso){
 const day=String(iso||'').slice(0,10);
 if(!/^20\d{2}-\d{2}-\d{2}$/.test(day))return String(iso||'date non précisée');
 const value=new Date(day+'T12:00:00Z');
 if(Number.isNaN(value.getTime()))return day;
 return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(value);
}
function lateSpanishLessons(pack){
 if(!pack?.lessons||!pack?.dates)return [];
 const known=new Set(window.TIM_SPANISH_SIMPLIFIED?.lessons?.map(x=>String(x.id))||[]);
 known.add(String(window.TIM_SPANISH_NOV12?.ENT_ID||'10099~6400554'));
 return pack.lessons.map(doc=>{
  const id=String(doc?.data?.id||''),date=String(pack.dates[id]||'').slice(0,10);
  return {id,date,doc};
 }).filter(item=>item.id&&!known.has(item.id)&&/^20\d{2}-\d{2}-\d{2}$/.test(item.date)&&
     item.date>'2026-11-05'&&(asText(lessonHtml(item.doc))||lessonHomeworkIds(item.doc).length))
   .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
function createSpanishSession(item,label){
 const card=$('details','tim-es-lesson ent-es-followup');
 card.style.cssText='border:1px solid #c6d1e8;border-radius:14px;margin:12px 0;background:#f7f9ff;color:#273448;overflow:hidden';
 const heading=$('summary','',label+' — '+frenchDate(item.date)+' — '+courseTitle(item.doc));
 heading.style.cssText='display:block;cursor:pointer;font-weight:850;line-height:1.55;padding:17px 14px;color:#263a83;font-size:17px;overflow-wrap:anywhere';
 card.append(heading);
 const body=$('div');body.style.cssText='padding:4px 13px 18px;color:#26344b';
 card.append(body);
 let ready=false,loading=false;
 card.addEventListener('toggle',async()=>{
  if(!card.open||ready||loading)return;
  loading=true;body.textContent='Ouverture de la leçon ENT et de ses documents…';
  try{
   const lesson=$('section');body.replaceChildren(lesson);
   await renderLessonOriginal(lesson,item.id,'all');
   if(!window.TIM_SPANISH_ENT_BIS?.render(body,item.id)){
    const note=$('p','','Leçon BIS à préparer : le cours original et ses consignes restent disponibles ci-dessus.');
    note.style.cssText='font-size:14px;color:#425571;padding:10px 0';
    body.append(note);
   }
   ready=true;
  }catch(error){body.textContent='Cours indisponible : '+String(error?.message||error);}
  finally{loading=false;}
 });
 return card;
}
function appendChronologicalSpanish(root){
 if(window.__TIM_GUEST)return;
 const pack=window.__TIM_DATA?.metadata?.spanishEnt;
 const incoming=lateSpanishLessons(pack);
 // Une séance n'est annoncée comme nouvelle que si son contenu figure vraiment
 // dans la dernière collecte ENT ; aucune date ni cours ne sont inventés.
 const next=incoming.length&&incoming[incoming.length-1].date>'2026-11-12'?incoming.pop():null;
 const container=$('section','tim-es-chronological');
 const chronology=$('div','tim-es-chronological-lessons');
 const nov12=window.TIM_SPANISH_NOV12?.render?.();
 let seq=14;
 const records=incoming.map(x=>({type:'import',date:x.date,id:x.id,item:x}));
 if(nov12)records.push({type:'nov12',date:'2026-11-12',id:'10099~6400554'});
 records.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 for(const item of records){
  if(item.type==='nov12'){
   nov12.querySelector('summary').textContent='Leçon '+seq+' — 12 novembre — Conjugaison et « No empiezo en septiembre »';
   nov12.classList.add('tim-es-lesson');
   chronology.append(nov12);
  }else chronology.append(createSpanishSession(item.item,'Leçon '+seq));
  seq++;
 }
 if(chronology.childElementCount){
  const title=$('h3','','Suite des leçons ENT — par date');
  title.style.cssText='margin:21px 0 10px;font-size:19px';
  container.append(title,chronology);
 }
 const notice=$('section','tim-es-upcoming');
 notice.style.cssText='margin:18px 0;padding:13px 14px;border:1px solid #8cabc7;border-radius:12px;background:#edf5ff;color:#243d5e';
 if(next){
  const head=$('h3','','Nouveau cours ENT — '+frenchDate(next.date));
  head.style.cssText='font-size:17px;color:#243d5e;margin:0 0 7px';
  notice.append(head,$('p','','La dernière séance importée est présentée ici. À la prochaine actualisation de l’ENT, elle rejoindra automatiquement la liste chronologique.'));
  notice.append(createSpanishSession(next,'Ouvrir le nouveau cours ENT'));
 }else{
  notice.append($('h3','','Prochain cours ENT : en attente'));
  notice.append($('p','','Le cours du 12 novembre est maintenant classé avec les leçons. Le prochain cours apparaîtra ici seulement après l’importation de nouveaux documents ENT.'));
 }
 container.append(notice);
 const results=root.querySelector('.tim-es-results');
 if(results)root.insertBefore(container,results);else root.append(container);
}
/* Présentation élève : leçons d'origine, séance du 12 novembre classée
   et nouvelle séance après un import vérifié. Archives détaillées pour Parent. */
async function render(root,opts={}){
 const app=window.TIM_SPANISH_SIMPLIFIED;
 if(!app)return renderArchive(root,opts);
 await app.render(root,opts,{appendL01:appendBisL01});
 appendChronologicalSpanish(root);

 if(window.__TIM_PARENT&&!window.__TIM_GUEST){
  const archive=$('details','ent-es-archive-parent');
  archive.style.cssText='border:1px solid #7a8ca8;border-radius:13px;padding:13px 14px;margin:24px 0;background:#20324d;color:#f3f7ff';
  const summary=$('summary','','Archives Parent — cours, devoirs, PDF et séances d’origine');
  summary.style.cssText='cursor:pointer;font-size:17px;font-weight:850;line-height:1.5;padding:10px 3px;color:#fff';
  archive.append(summary);
  const inner=$('div');archive.append(inner);
  let loaded=false,loading=false;
  archive.addEventListener('toggle',async()=>{
   if(!archive.open||loaded||loading)return;
   loading=true;inner.textContent='Chargement des archives originales…';
   try{await renderArchive(inner,{});loaded=true;}
   catch(error){inner.textContent='Archives indisponibles : '+(error.message||error);}
   finally{loading=false;}
  });
  root.append(archive);
 }
}

/* Lecture des sources originales, sous la leçon BIS correspondante.
   Les fichiers ENT privés ne sont jamais recopiés dans le dépôt public. */
async function renderLessonOriginal(root,lessonId,section='course'){
 root.replaceChildren();
 if(window.__TIM_GUEST){root.append($('p','','Cours ENT original : connexion Tim ou Parent nécessaire.'));return;}
 if(String(lessonId)==='10099~6400554'&&window.TIM_SPANISH_NOV12?.renderOriginal){
  await window.TIM_SPANISH_NOV12.renderOriginal(root,section);
  return;
 }
 const pack=window.__TIM_DATA?.metadata?.spanishEnt;
 if(!pack?.lessons){
  root.append($('p','','Les documents originaux ENT ne sont pas encore disponibles dans cette session. La leçon BIS reste accessible.'));
  return;
 }
 const id=String(lessonId);
 const lesson=pack.lessons.find(doc=>String(doc?.data?.id)===id);
 if(!lesson){root.append($('p','','Cette séance n’a pas de texte original retrouvé dans la collecte ENT.'));return;}
 const source=asText(lessonHtml(lesson));
 const translations=pack.translations;
 if(section!=='exercises'){
 const title=$('h4','', 'Ce que Mme Gonzalez a écrit dans l’ENT');
 root.append(title);
 const copy=$('p','ent-es-source-text',source||'Aucun texte de cours n’a été renseigné pour cette séance.');
 copy.setAttribute('lang','es');copy.style.whiteSpace='pre-wrap';root.append(copy);
 if(translations?.courses?.[id]?.fr){
  root.append($('h4','','Traduction en français'));
  const fr=$('p','ent-es-source-fr',translations.courses[id].fr);
  fr.style.whiteSpace='pre-wrap';root.append(fr);
 }
 }
 const homeIds=lessonHomeworkIds(lesson);
 const homework=(pack.homework||[]).filter(x=>homeIds.includes(String(x?.data?.id)));
 let metas=[];
 const attachments=window.__TIM_BRIDGE?.attachments;
 if(attachments?.list){
  try{metas=await attachments.list('lesson',TAG);}catch(_){}
 }
 const refs=(pack.index||[]).filter(info=>(info.rattache_a||[]).some(link=>
  (link.type==='cours'&&String(link.id)===id)||
  (link.type==='travail_associe'&&homeIds.includes(String(link.id)))
 ));
 if(section!=='exercises'&&refs.length){
  root.append($('h4','','Fiches originales du professeur — dans cette leçon'));
  root.append($('p','','Lis le cours et la traduction, puis affiche ici les PDF associés sans changer de page.'));
  appendFileLinks(root,refs,metas,translations);
 }
 if((section==='exercises'||section==='all')&&homework.length){
  root.append($('h4','','Exercices demandés par la professeure'));
  homework.forEach(item=>{
   const hid=String(item.data.id);
   const section=$('details','ent-es-homework-item');
   section.append($('summary','','Lire la consigne originale du devoir'));
   const es=$('p','ent-es-source-text',asText(homeworkOriginal(item)));
   es.style.whiteSpace='pre-wrap';es.setAttribute('lang','es');section.append(es);
   if(translations?.homework?.[hid]?.fr){
    const fr=$('p','ent-es-source-fr',translations.homework[hid].fr);
    fr.style.whiteSpace='pre-wrap';section.append(fr);
   }
   root.append(section);
  });
 }
 if(section==='exercises'&&refs.length){
  root.append($('h4','','Fiches PDF du professeur'));
  appendFileLinks(root,refs,metas,translations);
 }
 if(section==='exercises'&&!homework.length&&!refs.length){
  root.append($('p','ent-es-empty','Aucun devoir ou PDF associé à cette séance dans l’archive.'));
 }
}

window.TIM_SPANISH_ENT_EXACT={render,renderLessonOriginal,parse:readTwoZips,validate,validateTranslations,TAG,lessonCount:()=>window.__TIM_GUEST?13:14+lateSpanishLessons(window.__TIM_DATA?.metadata?.spanishEnt).length};
})();
