/* SVT — 14 exercices (7 chapitres × 2 questionnaires de 10 questions).
   Corrections et bonnes réponses exclusivement côté serveur. */
import {SVT_QCM,SVT_WRITTEN} from './svt-questions.mjs';
import {sameShortAnswer} from './short-answer-equivalence.mjs';
export const SVT_BANK_VERSION='svt-20261113-v1';
const RE=/^SVQ_L(0[1-7])_0([1-2])$/;
const LABELS=['Je comprends les notions','Je rédige et j’applique'];
function context(id){
 const match=RE.exec(String(id||''));
 if(!match)return null;
 return {id,lesson:Number(match[1]),series:Number(match[2]),lessonId:'SVT_BIS'+match[1]};
}
export function svtTrainingId(id){return Boolean(context(id));}
function validate(){
 if(SVT_QCM.length!==7||SVT_WRITTEN.length!==7)throw Error('7 chapitres SVT exigés');
 for(let c=0;c<7;c++){
  if(SVT_QCM[c].length!==10||SVT_WRITTEN[c].length!==10)throw Error('10 questions par questionnaire SVT');
  for(const [q,right,wrong,why] of SVT_QCM[c]){
   if(!q?.trim()||!right?.trim()||!why?.trim()||wrong.length!==3||
      new Set([right,...wrong].map(x=>x.toLowerCase())).size!==4)throw Error('QCM SVT incomplet');
  }
  for(const [q,right,why,alternatives] of SVT_WRITTEN[c]){
   if(!q?.trim()||!right?.trim()||!why?.trim()||!Array.isArray(alternatives))throw Error('Question écrite SVT incomplète');
  }
 }
 return true;
}
validate();
export function svtTask(id){
 const c=context(id);if(!c)return null;
 const rows=c.series===1?SVT_QCM[c.lesson-1]:SVT_WRITTEN[c.lesson-1];
 return {id,lessonId:c.lessonId,series:c.series,
  title:'SVT · Exercice '+c.series+' — '+LABELS[c.series-1],
  bankVersion:SVT_BANK_VERSION,
  questions:rows.map((row,i)=>{
   if(c.series===2)return {kind:'text',prompt:row[0],expected:row[1],explanation:row[2],accepted:[row[1],...row[3]]};
   const [prompt,expected,wrong,explanation]=row;
   const position=(c.lesson*3+i*7)%4;
   const choices=wrong.slice();choices.splice(position,0,expected);
   return {kind:'qcm',prompt,expected,choices,right:position,explanation};
  })};
}
export function svtPublicTask(id){
 const task=svtTask(id);if(!task)return null;
 return {id:task.id,lessonId:task.lessonId,series:task.series,
  title:task.title,bankVersion:task.bankVersion,
  questions:task.questions.map(q=>q.kind==='qcm'
   ?{kind:'qcm',prompt:q.prompt,choices:q.choices}
   :{kind:'text',prompt:q.prompt})};
}
export function gradeSvtTask(id,answers,bankVersion){
 if(bankVersion!==SVT_BANK_VERSION)throw Error('stale-bank');
 const task=svtTask(id);
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
  lessonToReview:wrong.length?task.lessonId:null,bankVersion:SVT_BANK_VERSION};
}
export const SVT_BANK_TEST={validate,allIds:()=>Array.from({length:7},(_,i)=>[1,2].map(s=>'SVQ_L0'+(i+1)+'_0'+s)).flat()};
