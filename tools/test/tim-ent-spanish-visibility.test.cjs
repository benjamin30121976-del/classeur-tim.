'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const boot=fs.readFileSync(path.resolve(__dirname,'../../boot.js'),'utf8');
const opening="   const notSpanish=x=>!String(x?.subject||'').toLowerCase().includes('espagnol');";
const closing="\n }\n // Défi bonus personnalisé";
const start=boot.indexOf(opening);
const end=boot.indexOf(closing,start);
assert.ok(start>0&&end>start,'le filtrage espagnol existant doit être identifiable');
const actualCode=boot.slice(start,end);
function executeFilter(data){
 const ctx={content:structuredClone(data)};
 vm.runInNewContext(actualCode+'\nthis.result=content;',ctx);
 return ctx.result;
}
test('nouveaux cours ENT et BIS espagnols sont visibles par Tim',()=>{
 const rows={
  lessons:[
   {id:'ANCIEN_ES',subject:'Espagnol'},
   {id:'L14',subject:'Espagnol'},
   {id:'ES_BATCH_001',subject:'Espagnol',timEntBatch:true,kind:'ent'},
   {id:'ES_BATCH_BIS001',subject:'Espagnol',timEntBatch:true,kind:'bis'},
   {id:'EN_BATCH_001',subject:'Anglais',timEntBatch:true}
  ],
  exercises:[
   {id:'ANCIEN_ES_QUIZ',subject:'Espagnol'},
   {id:'ESE_L14_01',subject:'Espagnol'},
   {id:'ES_BATCH_QUIZ',subject:'Espagnol',timEntBatch:true},
   {id:'ES_BATCH_BONUS',subject:'Espagnol',timEntBatch:true,homeworkBonus:true},
   {id:'EN_BATCH_QUIZ',subject:'Anglais',timEntBatch:true}
  ]
 };
 const filtered=executeFilter(rows);
 const lessonIds=Array.from(filtered.lessons,l=>l.id);
 const exerciseIds=Array.from(filtered.exercises,e=>e.id);
 assert.ok(lessonIds.includes('ES_BATCH_001'));
 assert.ok(lessonIds.includes('ES_BATCH_BIS001'));
 assert.ok(exerciseIds.includes('ES_BATCH_QUIZ'));
 assert.ok(exerciseIds.includes('ES_BATCH_BONUS'));
 assert.ok(lessonIds.includes('L14'));
 assert.ok(exerciseIds.includes('ESE_L14_01'));
 assert.ok(lessonIds.includes('EN_BATCH_001'));
 assert.ok(exerciseIds.includes('EN_BATCH_QUIZ'));
 assert.ok(!lessonIds.includes('ANCIEN_ES'));
 assert.ok(!exerciseIds.includes('ANCIEN_ES_QUIZ'));
});
