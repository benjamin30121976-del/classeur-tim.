/* Security/unit tests only: in-memory Firestore; no real grades or Firebase calls. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../../worker/server.mjs';
import {TIM_UID,PARENT_UID,ApiFault} from '../../worker/auth.mjs';
import {fromFields,inspectFirestoreRead} from '../../worker/firestore.mjs';

function fakeDB(initial={}){
 const docs=new Map(Object.entries(initial));
 let commits=0;
 return {
  docs,
  get:async(path)=>docs.has(path)?structuredClone(docs.get(path)):null,
  list:async path=>[...docs.entries()].filter(([key])=>key.startsWith(path+'/'))
   .map(([key,data])=>({id:key.slice(path.length+1),data:structuredClone(data)})),
  transaction:async()=>({id:'fake-transaction'}),
  commit:async(writes)=>{
   for(const w of writes){
    const path=w.update.name.split('/documents/')[1];
    if(w.currentDocument?.exists===false&&docs.has(path))throw new ApiFault(409,'already-exists');
   }
   for(const w of writes){
    const path=w.update.name.split('/documents/')[1],value=fromFields(w.update.fields);
    const data=w.updateMask?{...(docs.get(path)||{}),...value}:value;
    for(const x of w.updateTransforms||[])if(x.setToServerValue==='REQUEST_TIME')data[x.fieldPath]=new Date().toISOString();
    docs.set(path,data);
   }
   commits++;
   return {ok:true};
  },
  commits:()=>commits
 };
}
const exercise={
 id:'MATH_Q01',title:'Pythagore',subject:'Mathématiques',lesson:'M09',
 category:'school',kind:'training',enabled:true,
 questions:[
  {q:'12?',type:'mc',options:['12','13','14'],right:'0',why:'Calcul de base'},
  {q:'15?',type:'text',right:'quinze',also:['15'],why:'Écrire le nombre'}
 ]
};
test('Tim valide une seule fois, avec 1 XP et correction immédiate selon les règles actuelles',async()=>{
 const db=fakeDB({'exercises/MATH_Q01':exercise});
 const first=await TESTABLE.submitExercise(db,TIM_UID,{id:'MATH_Q01',answers:['0','15']});
 assert.equal(first.submitted,true);
 assert.equal(first.xp,1);
 assert.equal(db.commits(),1);
 assert.equal(db.docs.get('privateAttempts/MATH_Q01').score,2);
 assert.equal(db.docs.get('privateAttempts/MATH_Q01').total,2);
 assert.equal(db.docs.get('attempts/MATH_Q01').correctionStatus,'released');
 assert.equal(db.docs.get('releasedCorrections/MATH_Q01').released,true);
 assert.equal(db.docs.get('attempts/MATH_Q01').score,undefined);
 await assert.rejects(()=>TESTABLE.submitExercise(db,TIM_UID,{id:'MATH_Q01',answers:['0','15']}),e=>e.code==='already-exists');
 assert.equal(db.commits(),1);
});
test('Un parent ne peut pas répondre à la place de Tim',async()=>{
 const db=fakeDB({'exercises/MATH_Q01':exercise});
 await assert.rejects(()=>TESTABLE.submitExercise(db,PARENT_UID,{id:'MATH_Q01',answers:['0','15']}),e=>e.status===403);
 assert.equal(db.commits(),0);
});
test('Note et historique Parent, sans données dans la réponse publique Tim',async()=>{
 const db=fakeDB({'exercises/MATH_Q01':exercise,
  'attempts/MATH_Q01':{authorUid:TIM_UID,correctionStatus:'pending-parent',xp:0},
  'privateAttempts/MATH_Q01':{authorUid:TIM_UID,score:1,total:2,title:'Pythagore',answers:[{response:'15'}]}
 });
 const report=await TESTABLE.parentReport(db,PARENT_UID);
 assert.equal(report.pendingCorrections,1);
 assert.equal(report.attempts[0].score,1);
 assert.equal(report.attempts[0].title,'Pythagore');
 await assert.rejects(()=>TESTABLE.parentReport(db,TIM_UID),e=>e.status===403);
});
test('Parent libère les corrections, Tim voit uniquement celles autorisées',async()=>{
 const db=fakeDB({'attempts/MATH_Q01':{authorUid:TIM_UID,correctionStatus:'pending-parent',xp:0},
  'privateAttempts/MATH_Q01':{score:2,total:2,answers:[{question:'1+1',response:'2',correct:true}]}
 });
 let before=await TESTABLE.releasedCorrections(db,TIM_UID);
 assert.equal(before.corrections.length,0);
 await assert.rejects(()=>TESTABLE.releaseCorrection(db,TIM_UID,{id:'MATH_Q01',released:true}),e=>e.status===403);
 const set=await TESTABLE.releaseCorrection(db,PARENT_UID,{id:'MATH_Q01',released:true});
 assert.equal(set.saved,true);
 assert.equal(db.docs.get('attempts/MATH_Q01').correctionStatus,'released');
 let after=await TESTABLE.releasedCorrections(db,TIM_UID);
 assert.equal(after.corrections.length,1);
 assert.equal(after.corrections[0].score,2);
 await TESTABLE.releaseCorrection(db,PARENT_UID,{id:'MATH_Q01',released:false});
 after=await TESTABLE.releasedCorrections(db,TIM_UID);
 assert.equal(after.corrections.length,0);
});
test('Le chargement du cours ne transmet jamais les clés de correction',async()=>{
 const db=fakeDB({
  'content/main':{lessons:[{id:'L01',title:'Notions'}],exercises:[exercise]},
  'lessons/L02':{id:'L02',title:'Autres'},
  'exercises/MATH_Q01':exercise
 });
 const data=await TESTABLE.courseContent(db,TIM_UID);
 assert.equal(data.content.exercises[0].questions[0].right,undefined);
 assert.equal(data.additions.exercises[0].questions[1].also,undefined);
 assert.equal(data.additions.exercises[0].questions[1].why,undefined);
 await assert.rejects(()=>TESTABLE.courseContent(db,PARENT_UID),e=>e.status===403);
});
test('Toute tentative invalide ou écriture libre est refusée',async()=>{
 const db=fakeDB({'exercises/MATH_Q01':exercise});
 for(const [id,answers] of [['MATH_Q01',['0']],['../../privateAttempts',['0','15']]]){
  await assert.rejects(()=>TESTABLE.submitExercise(db,TIM_UID,{id,answers}),e=>e.status===400);
 }
 assert.equal(db.commits(),0);
});

test('Les anciennes corrections d’espagnol restent privées tant que le Parent ne les a pas autorisées',async()=>{
 const db=fakeDB({
  'spanishTrainingAttempts/SPW_L09_01':{
   authorUid:TIM_UID,lessonId:'L09',mode:'W',series:1,score:5,total:10,
   items:[{question:'Conjugaison',response:'hablo',expected:'hablamos',correct:false}]
  }
 });
 const tim=await TESTABLE.oldTrainingProgress(db,TIM_UID);
 const parent=await TESTABLE.oldTrainingProgress(db,PARENT_UID);
 assert.equal(tim.attempts.length,1);
 assert.equal(tim.attempts[0].items.length,0);
 assert.equal(parent.attempts[0].items.length,1);
});

test('Sonde Firestore : ne retourne que deux statuts HTTP sans lire de documents ni écrire',async()=>{
 const calls=[];
 const result=await inspectFirestoreRead('JETON_FICTIF',async(url,options)=>{
  calls.push({url:String(url),method:options.method,auth:options.headers.Authorization});
  return new Response('',{status:String(url).includes('__tim_health__')?404:401});
 });
 assert.deepEqual(result,{documentHttpStatus:404,collectionHttpStatus:401,readOnly:true});
 assert.equal(calls.length,2);
 assert.ok(calls[0].url.endsWith('/__tim_health__/readonly_probe'));
 assert.match(calls[1].url,/hgTrainingAttempts\?pageSize=1/);
 assert.ok(calls.every(c=>c.method==='GET'&&c.auth==='Bearer JETON_FICTIF'));
 assert.equal(JSON.stringify(result).includes('JETON_FICTIF'),false);
 const network=await inspectFirestoreRead('JETON_FICTIF',async()=>{throw Error('réseau indisponible');});
 assert.deepEqual(network,{documentHttpStatus:0,collectionHttpStatus:0,readOnly:true});
});

test('Sonde Firestore : accessible uniquement au Parent, zéro mutation de base',async()=>{
 let calls=0;
 const db={probe:async()=>{calls++;return {documentHttpStatus:404,collectionHttpStatus:403,readOnly:true}}};
 await assert.rejects(()=>TESTABLE.getFirestoreReadDiagnostics(db,TIM_UID),e=>e.status===403);
 assert.equal(calls,0,'Tim ne peut pas déclencher la sonde');
 const response=await TESTABLE.getFirestoreReadDiagnostics(db,PARENT_UID);
 assert.deepEqual(response,{readOnly:true,documentHttpStatus:404,collectionHttpStatus:403});
 assert.equal(calls,1);
 assert.deepEqual(Object.keys(response).sort(),['collectionHttpStatus','documentHttpStatus','readOnly'].sort());
});


test('En cas de HTTP 429, le Parent peut pratiquer sans écrire et sans inventer la copie Tim',async()=>{
 const db={
  async get(){throw new ApiFault(503,'firestore-limit-429');},
  async list(){throw Error('Firestore LIST interdit dans cette simulation Parent');},
  async transaction(){throw Error('Transaction interdite dans cette simulation Parent');},
  async commit(){throw Error('Écriture interdite dans cette simulation Parent');}
 };
 for(const [name,method,id] of [
  ['HG','getHgTrainingTask','HGQ_L09_01'],
  ['SVT','getSvtTrainingTask','SVQ_L07_01'],
  ['Physique','getPhysicsTrainingTask','PCQ_L01_01'],
  ['Anglais','getEnglishTrainingTask','ENQ_L01_01'],
  ['Français','getFrTrainingTask','FRQ_L01_01']
 ]){
  const result=await TESTABLE[method](db,PARENT_UID,{id});
  assert.equal(result.task?.questions?.length,10,name);
  assert.equal(result.completed,null,name);
  assert.equal(result.completionVerified,false,name);
  assert.equal(result.task.questions.some(q=>['right','expected','accepted','explanation'].some(k=>Object.hasOwn(q,k))),false,name);
  await assert.rejects(()=>TESTABLE[method](db,TIM_UID,{id}),e=>e.code==='firestore-limit-429',name+' Tim ne doit pas valider sans suivi');
 }
 const previewTask=await TESTABLE.getHgTrainingTask(db,PARENT_UID,{id:'HGQ_L09_01'});
 const graded=await TESTABLE.previewHgTraining(db,PARENT_UID,{
  id:'HGQ_L09_01',answers:Array(10).fill(0),bankVersion:previewTask.task.bankVersion
 });
 assert.equal(graded.practice,true);
 assert.equal(graded.saved,false);
 assert.equal(graded.xp,0);
 assert.equal(graded.items.length,10);
});


test('Firestore sain : le Parent conserve le statut de copie terminée, sans régression',async()=>{
 const db={get:async()=>({authorUid:TIM_UID})};
 const result=await TESTABLE.getHgTrainingTask(db,PARENT_UID,{id:'HGQ_L09_01'});
 assert.equal(result.completed,true);
 assert.equal('completionVerified' in result,false);
 const broken={get:async()=>{throw Error('panne inconnue');}};
 await assert.rejects(()=>TESTABLE.getHgTrainingTask(broken,PARENT_UID,{id:'HGQ_L09_01'}),/panne inconnue/);
});
