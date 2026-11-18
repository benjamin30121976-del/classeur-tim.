'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {webcrypto}=require('node:crypto');
const src=fs.readFileSync(path.join(__dirname,'../../tim-ent-batch-import.js'),'utf8');
const sample=()=> {
 const help={simple:'Le présent du verbe conocer signifie connaître.',
   steps:['Reconnaître le sujet','Identifier le radical'],example:'Yo conozco',check:null};
 const lessons=[
  {id:'ENT_ES001',entId:'10099~6400507',kind:'ent',category:'school',timEntBatch:true,
   subject:'Espagnol',chapter:'Conjugaison',title:'Conocer — cours ENT',
   blocks:[{kind:'note',body:'Conocer : yo conozco'}],help},
  {id:'BIS_ES001',entId:'10099~6400507',kind:'bis',category:'bis',timEntBatch:true,
   subject:'Espagnol',chapter:'Conjugaison',title:'Comprendre conocer',
   blocks:[{kind:'note',body:'Le présent de conocer'}],help}
 ];
 const q={type:'mc',q:'Que signifie conocer ?',options:['connaître','venir','pouvoir','faire'],right:0,
  why:'Le verbe espagnol conocer signifie connaître et non venir ou pouvoir.'};
 const exercises=[
  {id:'TR_ES001',lesson:'BIS_ES001',kind:'training',category:'training',
   subject:'Espagnol',title:'Révisions',timEntBatch:true,questions:Array(10).fill(0).map(()=>({...q}))},
  {id:'HW_ES001',lesson:'BIS_ES001',kind:'homework-bonus',category:'bonus',
   subject:'Espagnol',title:'Préparation 19 novembre',timEntBatch:true,homeworkBonus:true,
   linkedHomework:['10099~215356'],homeworkDue:'2026-11-19',
   questions:Array(10).fill(0).map(()=>({...q}))}
 ];
 const manifest={schema:'tim-ent-batch-v1',sources:[
  {kind:'lesson',entId:'10099~6400507',needsBis:true,targets:['ENT_ES001','BIS_ES001']},
  {kind:'homework',entId:'10099~215356',targets:[]}],
  homework:[{entId:'10099~215356',subject:'Espagnol',due:'2026-11-19',title:'Réviser conocer'}],
  documents:[{entId:'10099~6400507',targetId:'ENT_ES001',
   path:'pieces_ENT/10099_115430_lecon.pdf',fileName:'3D_ENT_115430.pdf',
   mime:'application/pdf',sha256:'a'.repeat(64),size:60}]
 };
 return {pack:{lessons,exercises},manifest};
};
function load(){
 const ctx={window:{},crypto:webcrypto,console};vm.runInNewContext(src,ctx,{filename:'tim-ent-batch-import.js'});
 return ctx.window.TIM_ENT_BATCH;
}
test('Le lot cours/BIS, bonus et PDF correctement reliés passe le précontrôle',()=>{
 const api=load(),s=sample(),report=api.checkPack(s.pack,s.manifest);
 assert.equal(report.lessons,2);
 assert.equal(report.exercises,2);
 assert.equal(report.homework,1);
 assert.equal(report.documents,1);
});
test('Blocage si un PDF est rattaché à une mauvaise leçon',()=>{
 const api=load(),s=sample();
 s.manifest.documents[0].targetId='FR_FAUX';
 assert.throws(()=>api.checkPack(s.pack,s.manifest),/non relié/);
});
test('Blocage si un devoir futur reste sans exercice',()=>{
 const api=load(),s=sample();
 s.pack.exercises.pop();
 assert.throws(()=>api.checkPack(s.pack,s.manifest),/sans exercice corrigé/);
});
test('Blocage si une correction est trop courte',()=>{
 const api=load(),s=sample();
 s.pack.exercises[0].questions[0].why='C’est ça';
 assert.throws(()=>api.checkPack(s.pack,s.manifest),/dix corrections/);
});
test('Blocage si une leçon BIS ou un original manque',()=>{
 const api=load(),s=sample();
 s.pack.lessons=s.pack.lessons.filter(l=>l.kind!=='ent');
 assert.throws(()=>api.checkPack(s.pack,s.manifest),/Cours ENT ou BIS manquant/);
});
test('Blocage si le même exercice est publié avec un contenu différent',()=>{
 const api=load(),s=sample();
 const old=structuredClone(s.pack.exercises[0]);
 old.questions[0].q='Une autre question';
 assert.throws(()=>api.checkPack(s.pack,s.manifest,{lessons:[],exercises:[old]}),/différent/);
});
test('Blocage si le fichier dépasse 4 Mo ou si son empreinte manque',()=>{
 const api=load(),s=sample();
 s.manifest.documents[0].size=5*1024*1024;
 assert.throws(()=>api.checkPack(s.pack,s.manifest),/4 Mo/);
 s.manifest.documents[0].size=100;
 s.manifest.documents[0].sha256='';
 assert.throws(()=>api.checkPack(s.pack,s.manifest),/invalide/);
});
test('Réception d’un ZIP fictif avec PDF altéré : aucune écriture possible',async()=>{
 const api=load(),s=sample();const bytes=Buffer.from('%PDF-1.4\ntest sans donnée privée\n');
 s.manifest.documents[0].size=bytes.length;
 s.manifest.documents[0].sha256=Buffer.from(await webcrypto.subtle.digest('SHA-256',bytes)).toString('hex');
 const json=new Map([['MANIFESTE_LOT_TIM.json',JSON.stringify(s.manifest)],
   ['PACK_PEDAGOGIQUE.json',JSON.stringify(s.pack)]]);
 const ctx={window:{},crypto:webcrypto,console};
 vm.runInNewContext(src,ctx,{filename:'tim-ent-batch-import.js'});
 ctx.window.JSZip={loadAsync:async()=>({file:name=>json.has(name)?
   {async:async()=>json.get(name)}:
   (name===s.manifest.documents[0].path?
     {async:async()=>new Uint8Array(bytes)}:null)})};
 const file={size:1000};
 const data=await ctx.window.TIM_ENT_BATCH.prepare(file,{lessons:[],exercises:[]});
 assert.equal(data.report.documents,1);
 assert.equal(data.docs.length,1);
 s.manifest.documents[0].sha256='0'.repeat(64);
 json.set('MANIFESTE_LOT_TIM.json',JSON.stringify(s.manifest));
 await assert.rejects(ctx.window.TIM_ENT_BATCH.prepare(file,{lessons:[],exercises:[]}),/altéré/);
});
