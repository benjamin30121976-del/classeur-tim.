import test from 'node:test';
import assert from 'node:assert/strict';
import {MATH_ENT_IDS,MATH_ENT_VERSION,mathEntPublicTask,gradeMathEnt,MATH_ENT_TEST} from '../math-ent-training.mjs';
import {TESTABLE} from '../server.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
import {fromFields} from '../firestore.mjs';
function db(){
 const data=new Map();
 return {
  data,
  async get(path){return data.get(path)||null},
  async list(col){return [...data.entries()].filter(([p])=>p.startsWith(col+'/')).map(([p,v])=>({id:p.slice(col.length+1),data:v}))},
  async transaction(){return {}},
  async commit(writes){
   for(const w of writes){
    const path=w.update.name.split('/documents/')[1];
    assert.ok(path);
    if(w.currentDocument?.exists===false&&data.has(path))throw Error('already-exists');
    const value=fromFields(w.update.fields);
    if(w.updateTransforms?.some(x=>x.fieldPath==='submittedAt'))value.submittedAt=new Date().toISOString();
    data.set(path,value);
   }
  }
 };
}
const six=['2(x-9)+3x','-3x+x²+2','x(x+5)-8','-4(2x+3)+4','3(x+7)+x³','(x+1)^2-2x'];
const thales=['A','parallèles','AN/AC=AM/AB=NM/CB','2,4','8,75',
 'E','parallèles','EJ/EG=EI/EF=IJ/FG','7,5','3,2',
 'T','parallèles','TR/TV=TS/TU=RS/UV','7,5','4,5'];
test('Deux fiches originales ENT : 6 programmes et 3 figures de Thalès = 15 réponses',()=>{
 assert.deepEqual(MATH_ENT_IDS,['ME_ENT_PROGRAMMES','ME_ENT_THALES3']);
 const a=mathEntPublicTask(MATH_ENT_IDS[0]),b=mathEntPublicTask(MATH_ENT_IDS[1]);
 assert.equal(a.fields.length,6);assert.equal(b.fields.length,15);
 assert.equal(b.cases.length,3);
 assert.deepEqual(a.fields.map(x=>x.steps.length),[4,4,4,5,4,4]);
 for(const t of [a,b]){
  assert.equal(t.bankVersion,MATH_ENT_VERSION);
  const json=JSON.stringify(t);
  assert.equal(json.includes('"correct"'),false);
  assert.equal(json.includes('"explanation"'),false);
  assert.equal(json.includes('"expected"'),false);
 }
});
test('Le correcteur accepte les expressions équivalentes, sans évaluer du JavaScript arbitraire',()=>{
 for(const [a,b] of [
  ['5x-18','2(x-9)+3x'],['x²-3x+2','-3x+x²+2'],
  ['x(x+5)-8','x²+5x-8'],['-4(2x+3)+4','-8x-8'],
  ['3(x+7)+x³','x^3+3x+21'],['(x+1)^2-2x','x²+1']
 ])assert.equal(MATH_ENT_TEST.sameExpression(a,b),true,a+' ≠ '+b);
 for(const attempt of ['x+1','alert(1)','process.exit(0)','x^1000','1000000000000'])
  assert.equal(MATH_ENT_TEST.sameExpression(attempt,'5x-18'),false,attempt);
 assert.equal(gradeMathEnt('ME_ENT_PROGRAMMES',six,MATH_ENT_VERSION).score,10);
 assert.equal(gradeMathEnt('ME_ENT_PROGRAMMES',six.map(()=>'0'),MATH_ENT_VERSION).score,0);
});
test('Thalès : 2,4 et 8,75 / 7,5 et 3,2 / 7,5 et 4,5 sont notés correctement',()=>{
 const perfect=gradeMathEnt('ME_ENT_THALES3',thales,MATH_ENT_VERSION);
 assert.equal(perfect.score,10);assert.equal(perfect.fieldCount,15);
 assert.ok(perfect.items.every(x=>x.correct&&x.explanation.length>15));
 const wrong=gradeMathEnt('ME_ENT_THALES3',thales.map(()=>'0'),MATH_ENT_VERSION);
 assert.equal(wrong.score,0);
 assert.equal(gradeMathEnt('ME_ENT_THALES3',thales.map((x,i)=>i===3?'2.4':x),MATH_ENT_VERSION).score,10);
});
test('Une seule tentative Tim, XP et copie math ENT détaillée consultable par Parent',async()=>{
 const store=db();
 let first=await TESTABLE.getMathEntTask(store,TIM_UID,{id:'ME_ENT_PROGRAMMES'});
 assert.equal(first.completed,false);
 assert.equal(JSON.stringify(first).includes('"expected"'),false);
 let result=await TESTABLE.submitMathEntTask(store,TIM_UID,{id:'ME_ENT_PROGRAMMES',answers:six,bankVersion:MATH_ENT_VERSION});
 assert.equal(result.submitted,true);assert.equal(result.score,10);assert.equal(result.xp,1);
 const parent=await TESTABLE.getMathEntProgress(store,PARENT_UID,{id:'ME_ENT_PROGRAMMES'});
 assert.equal(parent.attempt.items.length,6);
 assert.equal(parent.attempt.items[0].expected,'5x - 18');
 const summaries=await TESTABLE.getMathEntProgress(store,PARENT_UID,{});
 assert.equal(summaries.attempts.length,1);assert.equal(summaries.attempts[0].xp,1);
 assert.equal((await TESTABLE.getMathEntTask(store,TIM_UID,{id:'ME_ENT_PROGRAMMES'})).completed,true);
 await assert.rejects(()=>TESTABLE.submitMathEntTask(store,TIM_UID,{id:'ME_ENT_PROGRAMMES',answers:six,bankVersion:MATH_ENT_VERSION}),e=>e.status===409);
 await assert.rejects(()=>TESTABLE.submitMathEntTask(store,PARENT_UID,{id:'ME_ENT_THALES3',answers:thales,bankVersion:MATH_ENT_VERSION}),e=>e.status===403);
});
test('Parent : essai indépendant corrigé, 0 XP, aucune écriture dans la base de Tim',async()=>{
 const store=db();
 for(const [id,answers] of [['ME_ENT_PROGRAMMES',six],['ME_ENT_THALES3',thales]]){
  const pre=await TESTABLE.previewMathEntTask(store,PARENT_UID,{id,answers,bankVersion:MATH_ENT_VERSION});
  assert.equal(pre.score,10);assert.equal(pre.xp,0);assert.equal(pre.saved,false);
  assert.equal(pre.practice,true);assert.equal(pre.submitted,false);
  assert.equal(store.data.size,0);
  assert.equal((await TESTABLE.getMathEntTask(store,TIM_UID,{id})).completed,false);
  await assert.rejects(()=>TESTABLE.previewMathEntTask(store,TIM_UID,{id,answers,bankVersion:MATH_ENT_VERSION}),e=>e.status===403);
  await assert.rejects(()=>TESTABLE.previewMathEntTask(store,PARENT_UID,{id,answers:answers.slice(1),bankVersion:MATH_ENT_VERSION}),e=>e.status===400);
 }
});
