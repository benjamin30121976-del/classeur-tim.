/* Import prive des documents ENT de mathématiques déjà archivés pour Tim.
   Les octets des originaux restent dans Firebase, jamais dans GitHub.
   Aucune action en dehors du compte Parent et du clic explicite « Importer ». */
(function(){
'use strict';
const VERSION='TIM-MATH-ENT-DOCUMENTS-20261112-v1';
const MAX_ZIP=10*1024*1024,MAX_FILE=4*1024*1024;
const LIST=[
 ['2026-10-09 leçon Théorème de Thalès.pdf','M26S1009','original-pdf'],
 ['2026-10-09 exercices application directe.pdf','M26S1009','original-pdf'],
 ['2026-10-15 Exercices Thales et Pythagore extraits DNB.pdf','M26S1015','original-pdf'],
 ['2026-11-02 Fiche egalite des 3 rapports et programmes de calcul.pdf','M26S1102','original-pdf'],
 ['2026-11-02 automatismes 3eme seance 5.1.pdf','M26S1102','conversion-pdf'],
 ['2026-11-02 automatismes 3eme seance 5.1.odp','M26S1102','original-odp'],
 ['2026-11-05 correction evaluation 16 octobre sujets A et B.pdf','M26S1105','original-pdf'],
 ['2026-11-05 automatismes 3eme seance 5.2.pdf','M26S1105','conversion-pdf'],
 ['2026-11-05 automatismes 3eme seance 5.2.odp','M26S1105','original-odp']
];
const EXPECTED=new Map(LIST.map(([name,targetId,kind])=>[name,{targetId,kind}]));
const FAMILY_LESSONS=new Set(['M26S1009','M26S1015','M26S1102','M26S1105']);
const E=(tag,value)=>{const x=document.createElement(tag);if(value!=null)x.textContent=String(value);return x;};
const mime=kind=>kind==='original-odp'?'application/vnd.oasis.opendocument.presentation':'application/pdf';
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
const validSignature=(bytes,kind)=>{
 if(kind==='original-odp')return bytes[0]===80&&bytes[1]===75&&bytes[2]===3&&bytes[3]===4;
 return String.fromCharCode(...bytes.slice(0,5))==='%PDF-';
};
const authorized=()=>window.__TIM_PARENT===true&&!window.__TIM_GUEST&&Boolean(window.__TIM_BRIDGE?.attachments);
async function inspect(file){
 if(!authorized())throw Error('Importer depuis le compte Parent uniquement.');
 if(!window.JSZip)throw Error('Le lecteur ZIP n’est pas chargé.');
 if(!file||file.size<=0||file.size>MAX_ZIP)throw Error('Choisis le ZIP fourni, de 10 Mo maximum.');
 const zip=await window.JSZip.loadAsync(await file.arrayBuffer());
 const names=Object.keys(zip.files).filter(name=>!zip.files[name].dir);
 if(names.length!==LIST.length+1||!names.includes('manifest.json'))throw Error('Archive non conforme : neuf documents et un manifeste attendus.');
 const manifest=JSON.parse(await zip.file('manifest.json').async('string'));
 if(manifest?.version!==VERSION||!Array.isArray(manifest.items)||manifest.items.length!==LIST.length)throw Error('Version de l’archive incompatible.');
 const items=[],seen=new Set();let total=0;
 for(const item of manifest.items){
  const name=String(item?.fileName||'');
  const required=EXPECTED.get(name);
  if(!required||seen.has(name)||required.targetId!==item.targetId||required.kind!==item.kind)
   throw Error('Fichier ou rattachement ENT non reconnu : '+name.slice(0,80));
  seen.add(name);
  if(!FAMILY_LESSONS.has(item.targetId)||!/^[a-f0-9]{64}$/.test(String(item.sha256))||
   !Number.isInteger(item.size)||item.size<20||item.size>MAX_FILE)
   throw Error('Métadonnées ou taille incorrectes : '+name.slice(0,80));
  const entry=zip.file('documents/'+name);
  if(!entry)throw Error('Document absent du ZIP : '+name);
  const bytes=await entry.async('uint8array');
  total+=bytes.length;
  if(total>9*1024*1024||bytes.length!==item.size||!validSignature(bytes,item.kind)||await hash(bytes)!==item.sha256)
   throw Error('Intégrité ou signature incorrecte : '+name);
  items.push({name,targetId:item.targetId,kind:item.kind,sha256:item.sha256,
   file:new File([bytes],name,{type:mime(item.kind)})});
 }
 if(seen.size!==EXPECTED.size||names.some(n=>n!=='manifest.json'&&(!n.startsWith('documents/')||!seen.has(n.slice('documents/'.length)))))
  throw Error('L’archive contient des documents inattendus.');
 const lessons=window.__TIM_DATA?.lessons||[];
 for(const id of FAMILY_LESSONS)
  if(!lessons.some(l=>l.id===id&&l.subject==='Mathématiques'))
   throw Error('Le cours '+id+' n’est pas disponible dans ce classeur. Aucun import effectué.');
 const api=window.__TIM_BRIDGE.attachments;
 const existing=new Map();
 for(const id of FAMILY_LESSONS)existing.set(id,await api.list('lesson',id));
 let already=0;
 for(const item of items){
  const same=(existing.get(item.targetId)||[]).filter(x=>x.fileName===item.name);
  if(same.some(x=>x.sha256!==item.sha256))
   throw Error('Un document porte le même nom mais a un autre contenu : '+item.name+'. Aucun remplacement automatique.');
  item.done=same.some(x=>x.sha256===item.sha256);
  if(item.done)already++;
 }
 return {items,already};
}
function render(){
 const root=E('details');root.className='math-ent-pdf-import';root.style.cssText=
  'margin:16px 0;padding:13px;border-radius:13px;border:1px solid #aac5e5;background:#f1f6ff;color:#254364';
 if(!authorized())return root;
 const header=E('summary','Parent — rattacher les PDF originaux aux cours de mathématiques');
 header.style.cssText='cursor:pointer;font-weight:850;line-height:1.5';
 const intro=E('p','Un seul ZIP contient les cinq PDF ENT, les deux présentations originales et leurs deux versions PDF pour la lecture sur téléphone. Les neuf documents sont associés automatiquement aux cours des 9 et 15 octobre, 2 et 5 novembre. Aucun résultat de Tim n’est modifié.');
 intro.style.cssText='line-height:1.55';
 const input=E('input');input.type='file';input.accept='.zip,application/zip';input.setAttribute('aria-label','ZIP des PDF de mathématiques');
 input.style.cssText='display:block;width:100%;box-sizing:border-box;padding:12px 6px;margin:9px 0;max-width:100%';
 const check=E('button','1. Vérifier le ZIP');check.type='button';check.className='plain';
 const importButton=E('button','2. Importer les documents manquants');importButton.type='button';importButton.disabled=true;importButton.className='plain';
 for(const b of [check,importButton])b.style.cssText='margin:7px 7px 7px 0;min-height:43px;white-space:normal';
 const status=E('p','Aucun ZIP sélectionné. Les documents privés ne sont pas enregistrés avant confirmation.');
 status.setAttribute('role','status');status.style.cssText='font-size:14px;line-height:1.5';
 const preview=E('div');let prepared=null;
 const setBusy=busy=>{check.disabled=busy;input.disabled=busy;importButton.disabled=busy||!prepared||prepared.items.every(x=>x.done);};
 input.onchange=()=>{prepared=null;preview.replaceChildren();importButton.disabled=true;status.textContent='Appuie sur « Vérifier le ZIP » avant tout envoi.';};
 check.onclick=async()=>{
  prepared=null;setBusy(true);preview.replaceChildren();status.textContent='Vérification des neuf fichiers et des cours cibles…';
  try{
   const x=await inspect(input.files?.[0]);prepared=x;
   const ul=E('ul');ul.style.cssText='font-size:13px;line-height:1.55;padding-left:20px';
   for(const item of x.items){
    const label=item.done?'Déjà présent':'À importer';
    ul.append(E('li',label+' · '+item.name+' → cours '+item.targetId));
   }
   preview.append(ul);
   status.textContent='Archive vérifiée : '+x.items.length+' documents. '+x.already+
    ' déjà présents ; '+(x.items.length-x.already)+' à ajouter dans Firebase privé.';
  }catch(e){status.textContent='ZIP non accepté. Aucun envoi effectué : '+String(e.message||e);}
  finally{setBusy(false);}
 };
 importButton.onclick=async()=>{
  if(!prepared||!authorized())return;
  setBusy(true);let added=0;
  const pending=prepared.items.filter(x=>!x.done);
  try{
   const api=window.__TIM_BRIDGE.attachments;
   for(let i=0;i<pending.length;i++){
    const x=pending[i];
    status.textContent='Import '+(i+1)+'/'+pending.length+' : '+x.name;
    await api.upload('lesson',x.targetId,x.file,x.name,
     pct=>{status.textContent='Import '+(i+1)+'/'+pending.length+' : '+x.name+' · '+pct+' %';});
    x.done=true;added++;
   }
   for(const id of FAMILY_LESSONS){
    const list=await api.list('lesson',id);
    if(prepared.items.filter(x=>x.targetId===id).some(x=>!list.some(y=>y.fileName===x.name&&y.sha256===x.sha256)))
      throw Error('Une pièce jointe ne figure pas encore dans la leçon '+id);
   }
   status.textContent='Import terminé : '+added+' ajoutés, '+prepared.already+' déjà présents. Tous les documents sont rattachés aux quatre cours. Ouvre à nouveau la leçon pour les afficher sans changer de page.';
   preview.replaceChildren();prepared=null;input.value='';
  }catch(e){
   status.textContent=added+' document(s) ajoutés avant interruption. Vérifie de nouveau le même ZIP pour reprendre uniquement les fichiers manquants : '+String(e.message||e);
   prepared=null;
  }finally{setBusy(false);}
 };
 root.append(header,intro,input,check,importButton,status,preview);
 return root;
}
window.TIM_MATH_ENT_PDF_IMPORT={render,VERSION,expected:LIST.length};
})();