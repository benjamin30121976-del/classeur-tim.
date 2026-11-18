import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const boot=fs.readFileSync(new URL('../../boot.js',import.meta.url),'utf8');

function whitelist(name){
 const pos=boot.indexOf(name+':async');
 assert.ok(pos>=0,'Méthode du compte absente : '+name);
 const body=boot.slice(pos,pos+640);
 const match=body.match(/if\(!\/(\^[^/]+)\/\.test\(String\(id\|\|''\)\)/);
 assert.ok(match,'Validation identifiant absente dans '+name);
 return new RegExp(match[1]);
}
const exercises=[
 {id:'FRQ_L12_01',bad:'FRQ_L14_01',methods:['frTrainingTask','frTrainingSubmit','frTrainingPreviewSubmit']},
 {id:'FRQ_L13_02',bad:'FRQ_L15_01',methods:['frTrainingTask','frTrainingSubmit','frTrainingPreviewSubmit']},
 {id:'SVQ_L08_01',bad:'SVQ_L09_01',methods:['svtTrainingTask','svtTrainingSubmit','svtTrainingPreviewSubmit']},
 {id:'SVQ_L08_02',bad:'SVQ_L07_03',methods:['svtTrainingTask','svtTrainingSubmit','svtTrainingPreviewSubmit']},
 {id:'ENQ_L08_01',bad:'ENQ_L08_02',methods:['englishTrainingTask','englishTrainingSubmit','englishTrainingPreviewSubmit']},
 {id:'HGQ_L09_03',bad:'HGQ_L08_03',methods:['hgTrainingTask','hgTrainingSubmit','hgTrainingPreviewSubmit']},
 {id:'ESE_L16_01',bad:'ESE_L15_01',methods:['spanishEntTrainingTask','spanishEntTrainingSubmit','spanishEntTrainingPreview']}
];
for(const group of exercises){
 test('Interface Tim/Parent : '+group.id+' autorisé et '+group.bad+' refusé',()=>{
  for(const method of group.methods){
   const r=whitelist(method);
   assert.equal(r.test(group.id),true,method+' doit accepter '+group.id);
   assert.equal(r.test(group.bad),false,method+' doit refuser '+group.bad);
  }
 });
}
test('Les anciens exercices sont toujours autorisés',()=>{
 for(const [method,id] of [
  ['frTrainingTask','FRQ_L11_01'],
  ['svtTrainingTask','SVQ_L07_02'],
  ['englishTrainingTask','ENQ_L02_03'],
  ['hgTrainingTask','HGQ_L09_02'],
  ['spanishEntTrainingTask','ESE_L14_03']
 ])assert.equal(whitelist(method).test(id),true,method);
});
