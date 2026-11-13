/* FR — 22 exercices (11 chapitres × 2 questionnaires de 10 questions).
   Corrections et bonnes réponses exclusivement côté serveur. */
import {FR_QCM,FR_WRITTEN} from './fr-questions.mjs';
import {sameShortAnswer} from './short-answer-equivalence.mjs';
export const FR_BANK_VERSION='fr-20261113-v1';
const RE=/^FRQ_L((?:0[1-9]|1[01]))_0([1-2])$/;
const LABELS=['Je comprends les notions','Je rédige et j’applique'];
function context(id){
 const match=RE.exec(String(id||''));
 if(!match)return null;
 return {id,lesson:Number(match[1]),series:Number(match[2]),lessonId:'FR_BIS'+match[1]};
}
export function frTrainingId(id){return Boolean(context(id));}
function validate(){
 if(FR_QCM.length!==11||FR_WRITTEN.length!==11)throw Error('11 chapitres FR exigés');
 for(let c=0;c<11;c++){
  if(FR_QCM[c].length!==10||FR_WRITTEN[c].length!==10)throw Error('10 questions par questionnaire FR');
  for(const [q,right,wrong,why] of FR_QCM[c]){
   if(!q?.trim()||!right?.trim()||!why?.trim()||wrong.length!==3||
      new Set([right,...wrong].map(x=>x.toLowerCase())).size!==4)throw Error('QCM FR incomplet');
  }
  for(const [q,right,why,alternatives] of FR_WRITTEN[c]){
   if(!q?.trim()||!right?.trim()||!why?.trim()||!Array.isArray(alternatives))throw Error('Question écrite FR incomplète');
  }
 }
 return true;
}
validate();
export function frTask(id){
 const c=context(id);if(!c)return null;
 const rows=c.series===1?FR_QCM[c.lesson-1]:FR_WRITTEN[c.lesson-1];
 return {id,lessonId:c.lessonId,series:c.series,
  title:'Français · Exercice '+c.series+' — '+LABELS[c.series-1],
  bankVersion:FR_BANK_VERSION,
  questions:rows.map((row,i)=>{
   if(c.series===2)return {kind:'text',prompt:row[0],expected:row[1],explanation:row[2],accepted:[row[1],...row[3]]};
   const [prompt,expected,wrong,explanation]=row;
   const position=(c.lesson*3+i*7)%4;
   const choices=wrong.slice();choices.splice(position,0,expected);
   return {kind:'qcm',prompt,expected,choices,right:position,explanation};
  })};
}
export function frPublicTask(id){
 const task=frTask(id);if(!task)return null;
 return {id:task.id,lessonId:task.lessonId,series:task.series,
  title:task.title,bankVersion:task.bankVersion,
  questions:task.questions.map(q=>q.kind==='qcm'
   ?{kind:'qcm',prompt:q.prompt,choices:q.choices}
   :{kind:'text',prompt:q.prompt})};
}
export function gradeFrTask(id,answers,bankVersion){
 if(bankVersion!==FR_BANK_VERSION)throw Error('stale-bank');
 const task=frTask(id);
 if(!task||!Array.isArray(answers)||answers.length!==10)throw Error('invalid-answers');
 const items=task.questions.map((q,i)=>{
  const answer=answers[i];
  if(q.kind==='qcm'&&(!Number.isInteger(answer)||answer<0||answer>3))throw Error('invalid-qcm-answer');
  if(q.kind==='text'&&(typeof answer!=='string'||!answer.trim()||answer.length>120))throw Error('invalid-text-answer');
  const correct=q.kind==='qcm'?answer===q.right:sameShortAnswer(answer,q.expected,q.accepted.slice(1));
  const response=q.kind==='qcm'?q.choices[answer]:answer;
  const explanation=correct?q.explanation:
   q.kind==='qcm'?'Tu as choisi « '+response+' ». La réponse attendue est « '+q.expected+' ». '+q.explanation:
   'Ta réponse « '+response+' » ne correspond pas aux formes reconnues. Réponse attendue : « '+q.expected+' ». '+q.explanation;
  return {questionIndex:i,kind:q.kind,prompt:q.prompt,response,expected:q.expected,
   correct,points:correct?1:0,feedback:correct?'Réponse correcte. '+q.explanation:'À revoir : '+explanation,
   explanation,category:task.lessonId};
 });
 const wrong=items.filter(x=>!x.correct);
 return {id,lessonId:task.lessonId,series:task.series,title:task.title,score:10-wrong.length,total:10,
  xp:0,items,errorCounts:wrong.length?{[task.lessonId]:wrong.length}:{},
  lessonToReview:wrong.length?task.lessonId:null,bankVersion:FR_BANK_VERSION};
}
export const FR_BANK_TEST={validate,allIds:()=>Array.from({length:11},(_,i)=>[1,2].map(s=>'FRQ_L0'+(i+1)+'_0'+s)).flat()};
