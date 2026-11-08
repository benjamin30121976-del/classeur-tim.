/* Tests pédagogiques hors connexion : n'utilisent aucune note réelle. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('espagnol-renforcement.js','utf8');
const scope={window:{}};
vm.runInNewContext(src,scope,{filename:'espagnol-renforcement.js'});
const R=scope.window.TIM_SPANISH_REINFORCEMENT;
test('15 sous-leçons avec guide, piège et méthode',()=>{
 assert.equal(Object.keys(R.DATA).length,15);
 for(let i=1;i<=15;i++){
  const id='L'+String(i).padStart(2,'0'),x=R.DATA[id];
  assert.ok(x&&x.goal&&x.pitfall&&x.steps.length>=3,id);
  assert.match(R.guide(id),/Comprendre avant de mémoriser/);
  assert.match(R.practice(id),/3 mises en situation avant la note/);
 }
});
test('45 mises en situation variées, sans modifier une note',()=>{
 const tasks=Object.values(R.DATA).flatMap(d=>d.tasks);
 assert.equal(tasks.length,45);
 const kinds=new Set(tasks.map(t=>t[0]));
 assert.ok(kinds.size>=5,'Variantes pédagogiques insuffisantes');
 for(const [kind,prompt,answer,why] of tasks){
  assert.ok(['dialogue','repair','listen','choice','complete','write'].includes(kind));
  assert.ok(prompt.length>=16&&answer&&why);
 }
 assert.doesNotMatch(src,/httpsCallable|collection\(|setDoc\(|\bxp\s*\+\+/i);
});
test('20 tableaux de conjugaison complets aux six personnes',()=>{
 assert.equal(Object.values(R.TABLES).reduce((n,a)=>n+a.length,0),20);
 for(const groups of Object.values(R.TABLES))for(const [verb,forms] of groups){
  assert.ok(verb&&forms.length===6);
  assert.ok(forms.every(x=>String(x).trim().length>1));
 }
 assert.equal(R.TABLES.L09[0][1][3],'hablamos');
 assert.equal(R.TABLES.L10[0][1][1],'eres');
 assert.equal(R.TABLES.L15[9][1][5],'tienen');
 assert.match(R.guide('L15'),/Les six personnes au présent/);
});
test('La compréhension des erreurs dépend des notions',()=>{
 assert.match(R.errorHint('L09',{source:'nosotros hablamos'}),/nosotros/i);
 assert.match(R.errorHint('L10',{source:'yo estoy'}),/Ser/i);
 assert.match(R.errorHint('L04',{source:'me gustan los perros'}),/gusta/i);
 assert.ok(R.errorHint('L01',{}).length>8);
});
test('La correction des exercices déjà publiés reste non modifiée',()=>{
 const content=fs.readFileSync('espagnol-training-engine.js','utf8');
 assert.match(content,/function buildSpanishTasks\(/);
 assert.match(content,/function evaluateSpanishTask\(/);
 const html=fs.readFileSync('index.html','utf8');
 const before=html.indexOf('espagnol-pedagogie-data.js'),boost=html.indexOf('espagnol-renforcement.js'),ui=html.indexOf('espagnol-training-ui.js');
 assert.ok(before<boost&&boost<ui);
 const training=fs.readFileSync('espagnol-training-ui.js','utf8');
 assert.match(training,/spx-parent-diagnostic/);
 assert.match(training,/spx-review-help/);
 assert.match(training,/data-say-speed/);
});
