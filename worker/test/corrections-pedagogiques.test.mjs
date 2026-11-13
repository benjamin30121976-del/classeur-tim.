import test from 'node:test';
import assert from 'node:assert/strict';
import {sameShortAnswer,numericEquivalent} from '../short-answer-equivalence.mjs';
import {ENGLISH_BANK_TEST,ENGLISH_BANK_VERSION,englishTask,gradeEnglishTask,englishPublicTask} from '../english-training.mjs';
import {PHYSICS_BANK_TEST,PHYSICS_BANK_VERSION,physicsTask,gradePhysicsTask,physicsPublicTask} from '../physics-training.mjs';
import {mixedMission,gradeMixedMission,publicMixedMission} from '../mixed-challenges.mjs';

test('Anglais : 110 bonnes et 110 mauvaises réponses, correction spécifique et réponses cachées',()=>{
 let count=0;
 for(const id of ENGLISH_BANK_TEST.allIds()){
  const task=englishTask(id),publicTask=englishPublicTask(id);
  assert.equal(task.questions.length,10);
  assert.ok(publicTask.questions.every(q=>!('expected' in q)&&!('explanation' in q)&&!('right' in q)));
  const correct=task.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const wrong=task.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'réponse évidemment fausse');
  const good=gradeEnglishTask(id,correct,ENGLISH_BANK_VERSION);
  const bad=gradeEnglishTask(id,wrong,ENGLISH_BANK_VERSION);
  assert.equal(good.score,10);
  assert.equal(bad.score,0);
  for(const item of bad.items){
   assert.equal(item.correct,false);
   assert.ok(item.expected.length>0);
   assert.ok(item.explanation.includes(item.expected),'La correction doit donner le bon modèle');
   assert.ok(item.explanation.length>25);
  }
  count+=10;
 }
 assert.equal(count,110);
});

test('Anglais : contraction, apostrophe, ponctuation, mais pas de négation inverse',()=>{
 const id='ENQ_L06_01',t=englishTask(id),responses=t.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
 const index=responses.findIndex(x=>typeof x==='string'&&x==='I am a student');
 assert.ok(index>=0);
 responses[index]="I'm a student.";
 assert.equal(gradeEnglishTask(id,responses,ENGLISH_BANK_VERSION).score,10);
 responses[index]="I am not a student";
 assert.equal(gradeEnglishTask(id,responses,ENGLISH_BANK_VERSION).score,9);
 assert.equal(sameShortAnswer('I didn’t go.','I did not go',[],{english:true}),true);
 assert.equal(sameShortAnswer("She isn't shy",'She is shy',[],{english:true}),false);
});

test('Physique : 210 bonnes et 210 mauvaises réponses, avec les explications adaptées',()=>{
 let count=0;
 for(const id of PHYSICS_BANK_TEST.allIds()){
  const task=physicsTask(id),publicTask=physicsPublicTask(id);
  const good=task.questions.map(q=>q.kind==='qcm'?q.right:q.expected);
  const wrong=task.questions.map(q=>q.kind==='qcm'?(q.right+1)%4:'réponse certainement fausse');
  assert.equal(gradePhysicsTask(id,good,PHYSICS_BANK_VERSION).score,10);
  const correction=gradePhysicsTask(id,wrong,PHYSICS_BANK_VERSION);
  assert.equal(correction.score,0);
  assert.ok(correction.items.every(x=>x.explanation.includes(x.expected)));
  assert.ok(publicTask.questions.every(q=>!('expected' in q)&&!('explanation' in q)&&!('right' in q)));
  count+=10;
 }
 assert.equal(count,210);
});

test('Physique : H₂ = H2, charges et ponctuation, sans confondre exposants et indices',()=>{
 assert.equal(sameShortAnswer('H₂.','H2'),true);
 assert.equal(sameShortAnswer('H²','H2'),false);
 assert.equal(sameShortAnswer('−1','-1'),true);
 assert.equal(sameShortAnswer('bleue.','bleue'),true);
 assert.equal(sameShortAnswer('18','8'),false);
 assert.equal(sameShortAnswer('Fe','Fé'),true);
});

function singleText(subject,right,also=[]){
 return {questionBank:'mixed-202611-v1',questions:[
  {type:'text',format:'short',q:'Question de contrôle',subject,right,also,why:'Règle explicitée dans le cours.',lessonId:'BIS_TEST'}
 ]};
}
function points(subject,expected,actual){
 return gradeMixedMission(singleText(subject,expected),[actual]).score;
}
test('Quatre matières : variantes reconnues sans donner un point à une réponse fausse',()=>{
 const variants=[
  ['Anglais','I did not go',"I didn't go",1],
  ['Anglais','I am shy',"I'm shy.",1],
  ['Anglais','I am shy',"I am not shy",0],
  ['Mathématiques','0,5','0.5',1],
  ['Mathématiques','0,5','05',0],
  ['Mathématiques','5','15',0],
  ['Physique-chimie','CO₂','CO2',1],
  ['Physique-chimie','CO₂','CO²',0],
  ['Espagnol','habláis','habláis',1],
  ['Espagnol','habláis','hablais',0.5],
  ['Espagnol','habláis','hablo',0]
 ];
 for(const [subject,expected,response,score] of variants)
  assert.equal(points(subject,expected,response),score,
   subject+' : '+JSON.stringify(response)+' ne doit pas être noté comme '+score);
 assert.equal(numericEquivalent('5,0','5'),true);
 assert.equal(numericEquivalent('05','0,5'),false);
});

function reasonProblem(expected,unit,parts){
 return {questionBank:'mixed-202611-v1',questions:[{
  type:'reason',format:'reason',subject:'Mathématiques',q:'Expliquer le résultat',
  right:0,methods:['Bonne méthode','Fausse méthode'],parts,answer:String(expected),unit,
  diagram:'rectangle',why:'Règle : utiliser la bonne formule.',lessonId:'MBIS19'
 }]};
}
const written=(m,c,s)=>JSON.stringify({m:String(m),c,s});
test('Raisonnement : la bonne méthode vaut 0,5 ; le calcul 0,25 ; la conclusion 0,25',()=>{
 const mission=reasonProblem(5,'cm',[3,2,'+',5]);
 assert.equal(gradeMixedMission(mission,[written(0,'3+2=5','Le résultat est 5 cm.')]).score,1);
 assert.equal(gradeMixedMission(mission,[written(0,'calcul faux','Conclusion fausse')]).score,0.5);
 assert.equal(gradeMixedMission(mission,[written(0,'3+2=5','Le résultat est 15 cm.')]).score,0.75);
 assert.equal(gradeMixedMission(mission,[written(1,'3+2=5','Le résultat est 5 cm.')]).score,0.5);
});

test('Raisonnement : « ne sont pas parallèles » contredit la conclusion attendue',()=>{
 const mission=reasonProblem('parallèles','',[4,8,'÷',3,6]);
 const wrong=gradeMixedMission(mission,[written(0,'4/8 = 3/6','Les droites ne sont pas parallèles.')]);
 const good=gradeMixedMission(mission,[written(0,'4/8 = 3/6','Les droites sont parallèles.')]);
 assert.equal(wrong.answers[0].conclusionCorrect,false);
 assert.equal(good.answers[0].conclusionCorrect,true);
});

test('Défis quotidiens : cinq matières, deux questions anglaises et 30 questions distinctes',()=>{
 const englishIds=[];
 for(const day of ['16','17','18','19','20']){
  for(const slot of ['01','02','03']){
   const id='DAY_202611'+day+'_'+slot,challenge=mixedMission(id);
   assert.ok(challenge);
   assert.equal(challenge.questions.length,10);
   assert.equal(challenge.questions.filter(q=>q.subject==='Anglais').length,2);
   assert.equal(challenge.questions.filter(q=>q.subject==='SVT').length,2);
   for(const subject of ['Espagnol','Mathématiques','Physique-chimie','Anglais','SVT'])
    assert.ok(challenge.questions.some(q=>q.subject===subject),id+' sans '+subject);
   englishIds.push(...challenge.questions.filter(q=>q.subject==='Anglais').map(q=>q.sourceId));
   const publicData=publicMixedMission(challenge);
   assert.ok(publicData.questions.every(q=>!('right' in q)&&!('why' in q)&&!('answer' in q)));
  }
 }
 assert.equal(englishIds.length,30);
 assert.equal(new Set(englishIds).size,30);
 for(const id of ['DAY_20261113_04','WEEK_2026W46','SUNDAY_20261115'])
  assert.equal(mixedMission(id).questions.filter(q=>q.subject==='Anglais').length,0);
});
