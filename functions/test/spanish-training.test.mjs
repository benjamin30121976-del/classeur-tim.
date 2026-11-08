import test from 'node:test';
import assert from 'node:assert/strict';
import {SPANISH_COURSE} from '../spanish-training-curriculum.mjs';
import {parseSpanishTrainingId,buildSpanishTasks,evaluateSpanishTask,normalizeSpanishAnswer} from '../spanish-training-engine.mjs';
test('15 sous-leçons x (5 QCM + 5 écrits) x 10 questions',()=>{
 const lessonIds=Object.keys(SPANISH_COURSE);
 assert.equal(lessonIds.length,15);
 const ids=[];
 for(const lesson of lessonIds){
  for(const mode of ['Q','W'])for(let n=1;n<=5;n++){
   const id='SP'+mode+'_'+lesson+'_0'+n;
   const parsed=parseSpanishTrainingId(id);
   assert.equal(parsed.lesson,lesson);
   const task=buildSpanishTasks(id,SPANISH_COURSE);
   assert.equal(task.questions.length,10,id);
   assert.equal(task.questions.every(q=>q.type===(mode==='Q'?'mc':'text')),true,id);
   assert.equal(task.questions.every(q=>q.answer&&q.note),true,id);
   if(mode==='Q')assert.equal(task.questions.every(q=>q.choices.length===4&&q.choices[q.correctIndex]===q.answer),true,id);
   ids.push(id);
  }
 }
 assert.equal(ids.length,150);
 assert.equal(new Set(ids).size,150);
});
test('notation écrite : accents et casse tolérés, réponse incorrecte non acceptée',()=>{
 const task=buildSpanishTasks('SPW_L09_01',SPANISH_COURSE);
 const answers=task.questions.map(q=>q.answer);
 assert.equal(evaluateSpanishTask(task,answers).score,10);
 const modified=[...answers];modified[0]='Cette réponse est fausse';
 assert.equal(evaluateSpanishTask(task,modified).score,9);
 assert.equal(normalizeSpanishAnswer('¡ESPAÑOL!'),normalizeSpanishAnswer('espanol'));
});
test('QCM : une seule réponse à quatre choix',()=>{
 const task=buildSpanishTasks('SPQ_L10_01',SPANISH_COURSE);
 const answers=task.questions.map(q=>String(q.correctIndex));
 const result=evaluateSpanishTask(task,answers);
 assert.equal(result.score,10);
 assert.equal(result.total,10);
 assert.equal(result.items.length,10);
 assert.equal(result.items.every(q=>q.correct),true);
});
test('aucun exercice extérieur au catalogue ou tentative incomplète acceptés',()=>{
 assert.equal(buildSpanishTasks('SPW_L09_06',SPANISH_COURSE),null);
 assert.equal(buildSpanishTasks('SPW_L99_01',SPANISH_COURSE),null);
 assert.equal(buildSpanishTasks('E01',SPANISH_COURSE),null);
 assert.throws(()=>evaluateSpanishTask(buildSpanishTasks('SPW_L09_01',SPANISH_COURSE),['a']),/invalides/);
});
