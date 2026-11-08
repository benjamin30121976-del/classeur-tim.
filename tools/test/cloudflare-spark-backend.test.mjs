/* Security/unit tests only: in-memory Firestore; no real grades or Firebase calls. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TESTABLE} from '../../worker/server.mjs';
import {TIM_UID,PARENT_UID,ApiFault} from '../../worker/auth.mjs';
import {fromFields} from '../../worker/firestore.mjs';

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
test('Tim valide une seule fois, avec 0 XP et note réservée au parent',async()=>{
 const db=fakeDB({'exercises/MATH_Q01':exercise});
 const first=await TESTABLE.submitExercise(db,TIM_UID,{id:'MATH_Q01',answers:['0','15']});
 assert.equal(first.submitted,true);
 assert.equal(first.xp,0);
 assert.equal(db.commits(),1);
 assert.equal(db.docs.get('privateAttempts/MATH_Q01').score,2);
 assert.equal(db.docs.get('privateAttempts/MATH_Q01').total,2);
 assert.equal(db.docs.get('attempts/MATH_Q01').correctionStatus,'pending-parent');
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
