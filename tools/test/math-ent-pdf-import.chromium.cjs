'use strict';
// Navigateur sans compte ni aucun document de Tim : archives factices uniquement.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const files=[
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
(async()=>{
 const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(f=>fs.existsSync(f));
 const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{}),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent('<!doctype html><html lang="fr"><body></body></html>');
  await page.addScriptTag({path:path.resolve('jszip.min.js')});
  await page.addScriptTag({path:path.resolve('maths-ent-pdf-import.js')});
  await page.evaluate(()=>{
   window.__TIM_PARENT=true;window.__TIM_GUEST=false;
   window.__TIM_DATA={lessons:['M26S1009','M26S1015','M26S1102','M26S1105'].map(id=>({id,subject:'Mathématiques'}))};
   window.__BATCH_FILES=new Map();
   window.__BATCH_UPLOADS=[];
   window.__TIM_BRIDGE={attachments:{
    list:async(kind,id)=>window.__BATCH_FILES.get(id)||[],
    upload:async(kind,id,file,title,onProgress)=>{
     if(kind!=='lesson'||!file)throw Error('Rattachement invalide');
     const bytes=new Uint8Array(await file.arrayBuffer());
     const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
     const record={fileName:file.name,sha256:hash};
     const existing=window.__BATCH_FILES.get(id)||[];existing.push(record);window.__BATCH_FILES.set(id,existing);
     window.__BATCH_UPLOADS.push({id,name:file.name});onProgress(100);return 'demo-file-id';
    }
   }};
   document.body.append(window.TIM_MATH_ENT_PDF_IMPORT.render());
  });
  const bytes=await page.evaluate(async files=>{
   const zip=new window.JSZip(),manifest={version:'TIM-MATH-ENT-DOCUMENTS-20261112-v1',items:[]};
   for(const [fileName,targetId,kind] of files){
    const raw=kind==='original-odp'?'PK\x03\x04synthetic':'%PDF-1.4\nsynthetic';
    const data=new TextEncoder().encode(raw+' '+fileName);
    const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
    zip.file('documents/'+fileName,data);
    manifest.items.push({fileName,targetId,kind,sha256:sha,size:data.length});
   }
   zip.file('manifest.json',JSON.stringify(manifest));
   return Array.from(await zip.generateAsync({type:'uint8array'}));
  },files);
  assert.equal(await page.locator('.math-ent-pdf-import').count(),1,'Panneau parent introuvable');
  await page.locator('.math-ent-pdf-import summary').click();
  await page.locator('.math-ent-pdf-import input[type=file]').setInputFiles({
   name:'Tim_Mathematiques_PDF_ENT_a_importer.zip',mimeType:'application/zip',buffer:Buffer.from(bytes)
  });
  await page.getByRole('button',{name:'1. Vérifier le ZIP'}).click();
  await page.getByText(/Archive vérifiée : 9 documents/).waitFor({timeout:15000});
  await page.getByRole('button',{name:'2. Importer les documents manquants'}).click();
  await page.getByText(/Import terminé : 9 ajoutés, 0 déjà présents/).waitFor({timeout:15000});
  const state=await page.evaluate(()=>({uploads:window.__BATCH_UPLOADS,stored:[...window.__BATCH_FILES.entries()]}));
  assert.equal(state.uploads.length,9);
  assert.equal(state.stored.reduce((n,[,v])=>n+v.length,0),9);
  for(const [n,id] of files.map(x=>[x[0],x[1]]))
   assert(state.uploads.some(x=>x.name===n&&x.id===id),'Mauvais rattachement : '+n);
  // Réimporter ne crée pas de doublons.
  await page.locator('.math-ent-pdf-import input[type=file]').setInputFiles({
   name:'Tim_Mathematiques_PDF_ENT_a_importer.zip',mimeType:'application/zip',buffer:Buffer.from(bytes)
  });
  await page.getByRole('button',{name:'1. Vérifier le ZIP'}).click();
  await page.getByText(/9 déjà présents ; 0 à ajouter/).waitFor({timeout:15000});
  assert.equal(await page.getByRole('button',{name:'2. Importer les documents manquants'}).isDisabled(),true);
  const anon=await page.evaluate(()=>{
   window.__TIM_PARENT=false;
   const view=window.TIM_MATH_ENT_PDF_IMPORT.render();
   return {inputs:view.querySelectorAll('input').length,buttons:view.querySelectorAll('button').length};
  });
  assert.equal(anon.inputs,0);assert.equal(anon.buttons,0);
  console.log('OK : import ZIP, neuf associations, absence de doublons et restriction Parent testés dans Chromium.');
  await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
