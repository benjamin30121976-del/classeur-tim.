'use strict';
// Contrôle du patrimoine de cours EXISTANT, sans Firestore ni tentative Tim.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const test=require('node:test'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
function windowObject(file,key){
 const src=fs.readFileSync(path.join(root,file),'utf8');
 const context={window:{}};
 vm.runInNewContext(src,context,{timeout:3000,filename:file});
 return context.window[key];
}
const packs=[
 ['Espagnol','guest-data.js','TIM_GUEST_DATA'],
 ['Mathématiques','maths-bis-data.js','TIM_MATHS_BIS_PACK'],
 ['Physique-chimie','physique-chimie-pack.js','TIM_PHYSIQUE_PACK'],
 ['Anglais','anglais-pack.js','TIM_ANGLAIS_PACK'],
 ['SVT','svt-pack.js','TIM_SVT_PACK'],
 ['Histoire-géographie','histoire-geographie-pack.js','TIM_HG_PACK'],
 ['Français','francais-pack.js','TIM_FR_PACK']
];
test('Les sept matières disposent de leurs contenus historiques',()=>{
 const report={};
 for(const [subject,file,key] of packs){
  const pack=windowObject(file,key);
  assert.ok(pack&&Array.isArray(pack.lessons)&&pack.lessons.length>0,subject+' : aucun cours disponible');
  const ids=pack.lessons.map(l=>String(l?.id||''));
  assert.ok(ids.every(Boolean),subject+' : cours sans identifiant');
  assert.equal(ids.length,new Set(ids).size,subject+' : identifiants de cours dupliqués');
  assert.ok(pack.lessons.every(l=>String(l.title||'').trim()),subject+' : intitulé vide');
  const bis=pack.bis||[];
  if(['Anglais','SVT','Histoire-géographie','Français'].includes(subject))
   assert.ok(Array.isArray(bis)&&bis.length>0,subject+' : toutes les leçons BIS ont disparu');
  if(subject==='Espagnol'){
   assert.ok(Array.isArray(pack.exercises)&&pack.exercises.length>0,'catalogue espagnol absent');
   assert.ok(pack.lessons.every(l=>l.help?.simple),'aides espagnoles absentes');
  }
  report[subject]={cours:pack.lessons.length,bis:bis.length||(
   subject==='Mathématiques'?pack.lessons.length:0),
   devoirs:(pack.homework||[]).length,pieces:(pack.attachments||[]).length};
 }
 console.log('Inventaire des sept matières (lecture seule) : '+JSON.stringify(report));
});
