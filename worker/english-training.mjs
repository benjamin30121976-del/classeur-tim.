/* Anglais — 11 exercices, 110 questions pédagogiques.
   Ne jamais importer ce module dans le navigateur : les clés de réponse restent au serveur.
   Les leçons 1 et 2 ont chacune trois exercices ; les cinq autres ont un exercice de dix questions. */
import {ENGLISH_QUESTIONS} from './english-questions.mjs';
import {EXTRA_ENGLISH_QUESTIONS} from './english-extra.mjs';

export const ENGLISH_BANK_VERSION='en-20261113-v2';
const LESSONS=[...ENGLISH_QUESTIONS,...EXTRA_ENGLISH_QUESTIONS];
const NAMES=['Je comprends les mots','Je lis et j’applique','Je réponds par écrit'];
const RE=/^ENQ_L(0[1-7])_0([1-3])$/;
export function englishTrainingId(id){return typeof id==='string'&&Boolean(context(id));}
function context(id){
 const m=RE.exec(String(id||''));if(!m)return null;
 if(Number(m[1])>2&&Number(m[2])!==1)return null;
 return {lesson:Number(m[1]),series:Number(m[2]),lessonId:'EN_BIS'+m[1],id};
}
function cleanAnswer(value){
 return String(value??'').toLowerCase().normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'')
 .replace(/[−–—]/g,'-')
 .replace(/[\s\u00a0]/g,'')
 .replace(/[()]/g,'')
 .trim();
}
function validQuestions(){
 for(let j=0;j<LESSONS.length;j++){
  const rows=LESSONS[j];
  if(rows.length!==(j<2?30:10))throw Error('Banque anglais incomplète : L'+(j+1));
  const seen=new Set();
  for(let i=0;i<rows.length;i++){
   const row=rows[i];
   if(seen.has(row[1]))throw Error('Question dupliquée');
   seen.add(row[1]);
   if(row[0]==='q'){
    if(row.length!==5||row[3].length!==3||new Set([row[2],...row[3]]).size!==4||
       !row[1].trim()||!row[2].trim()||!row[4].trim())throw Error('QCM mal formé : '+j+'/'+i);
   }else if(row[0]==='t'){
    if(row.length!==5||!row[1].trim()||!row[2].trim()||!row[3].trim()||!Array.isArray(row[4]))
     throw Error('Réponse écrite mal formée : '+j+'/'+i);
   }else throw Error('Type de question inconnu : '+j+'/'+i);
  }
 }
 return true;
}
validQuestions();
export function englishTask(id){
 const c=context(id);if(!c)return null;
 const rows=LESSONS[c.lesson-1].slice((c.series-1)*10,c.series*10);
 return {id,lessonId:c.lessonId,series:c.series,
  title:c.lesson>2?'Exercice BIS — compréhension et rédaction':'Exercice '+c.series+' — '+NAMES[c.series-1],
  bankVersion:ENGLISH_BANK_VERSION,
  questions:rows.map((row,i)=>{
   const fullIndex=(c.series-1)*10+i;
   if(row[0]==='t')return {kind:'text',prompt:row[1],expected:row[2],explanation:row[3],accepted:[row[2],...row[4]]};
   const pos=(c.lesson*3+fullIndex*7)%4;
   const options=row[3].slice();options.splice(pos,0,row[2]);
   return {kind:'qcm',prompt:row[1],choices:options,right:pos,expected:row[2],explanation:row[4]};
  })
 };
}
export function englishPublicTask(id){
 const task=englishTask(id);if(!task)return null;
 return {id:task.id,lessonId:task.lessonId,series:task.series,title:task.title,bankVersion:task.bankVersion,
  questions:task.questions.map(q=>q.kind==='qcm'
   ?{kind:'qcm',prompt:q.prompt,choices:q.choices}
   :{kind:'text',prompt:q.prompt})};
}
export function gradeEnglishTask(id,answers,bankVersion){
 if(bankVersion!==ENGLISH_BANK_VERSION)throw Error('stale-bank');
 const task=englishTask(id);
 if(!task||!Array.isArray(answers)||answers.length!==10)throw Error('invalid-answers');
 const items=task.questions.map((q,i)=>{
  const answer=answers[i];
  if(q.kind==='qcm' && (!Number.isInteger(answer)||answer<0||answer>3))throw Error('invalid-qcm-answer');
  if(q.kind==='text' && (typeof answer!=='string'||!answer.trim()||answer.length>80))throw Error('invalid-text-answer');
  const correct=q.kind==='qcm'?answer===q.right:q.accepted.some(a=>cleanAnswer(a)===cleanAnswer(answer));
  return {questionIndex:i,kind:q.kind,prompt:q.prompt,
   response:q.kind==='qcm'?q.choices[answer]:answer,
   expected:q.expected,correct,points:correct?1:0,
   feedback:correct?'Réponse correcte. '+q.explanation:'À revoir : '+q.explanation,
   explanation:q.explanation,category:task.lessonId};
 });
 const wrong=items.filter(x=>!x.correct);
 return {id,lessonId:task.lessonId,series:task.series,title:task.title,score:10-wrong.length,total:10,
  xp:0,items,errorCounts:wrong.length?{[task.lessonId]:wrong.length}:{},
  lessonToReview:wrong.length?task.lessonId:null,bankVersion:ENGLISH_BANK_VERSION};
}
export const ENGLISH_BANK_TEST={validate:validQuestions,allIds:()=>Array.from({length:7},(_,i)=>Array.from({length:i<2?3:1},(_,j)=>'ENQ_L0'+(i+1)+'_0'+(j+1))).flat()};
