/* Mathématiques de Tim — banque entièrement privée dans Cloudflare KV.
   Aucun énoncé, indice de réponse ni corrigé n'est stocké dans le dépôt public.
   Le serveur ne transmet les corrections qu'après la validation définitive.
*/
export const MATH_BANK_VERSION='TIM-MATH-20261111-32b5d2cb2e6a';
const ID=/^MT(?:0[1-9]|1[0-9]|2[0-3])$/;
export function mathId(id){return ID.test(String(id||''));}

async function loadBank(env){
 const kv=env?.TIM_MATH_PRIVATE_KV;
 if(!kv||typeof kv.get!=='function')throw Error('math-bank-unavailable');
 let bank;
 try{bank=await kv.get(MATH_BANK_VERSION,'json');}
 catch{throw Error('math-bank-unavailable');}
 if(!bank||bank.version!==MATH_BANK_VERSION||
     bank.public?.version!==MATH_BANK_VERSION||bank.private?.version!==MATH_BANK_VERSION||
     bank.public?.questions!==230||bank.private?.questions!==230||
     !bank.public.quizzes||!bank.private.quizzes)
  throw Error('math-bank-invalid');
 return bank;
}
function extract(bank,id){
 if(!mathId(id))throw Error('math-invalid-id');
 const pub=bank.public.quizzes[id],priv=bank.private.quizzes[id];
 if(!pub||!priv||pub.id!==id||pub.bankVersion!==MATH_BANK_VERSION||
    pub.lessonId!==priv.lessonId||!Array.isArray(pub.questions)||pub.questions.length!==10||
    !Array.isArray(priv.questions)||priv.questions.length!==10)
   throw Error('math-quiz-invalid');
 return {pub,priv};
}
export async function mathPublicTaskPrivate(env,id){
 const {pub}=extract(await loadBank(env),id);
 const questions=pub.questions.map(q=>{
  if(typeof q.prompt!=='string'||!Array.isArray(q.choices)||q.choices.length!==4||
     q.choices.some(c=>typeof c!=='string'||!c.trim())||new Set(q.choices).size!==4)
   throw Error('math-public-quiz-invalid');
  return {prompt:q.prompt,choices:q.choices.slice()};
 });
 return {id,lessonId:pub.lessonId,title:pub.title,bankVersion:MATH_BANK_VERSION,questions};
}
export async function gradeMathTaskPrivate(env,id,answers,version){
 if(!mathId(id)||!Array.isArray(answers)||answers.length!==10||
    answers.some(x=>!Number.isInteger(x)||x<0||x>3))throw Error('math-invalid-answers');
 if(version!==MATH_BANK_VERSION)throw Error('math-stale-bank');
 const {pub,priv}=extract(await loadBank(env),id);
 const items=pub.questions.map((question,i)=>{
  const key=priv.questions[i];
  if(!key||!Number.isInteger(key.correctIndex)||key.correctIndex<0||key.correctIndex>3||
     question.choices[key.correctIndex]!==key.expected||
     typeof key.explanation!=='string'||!Array.isArray(key.feedbackByIndex)||
     key.feedbackByIndex.length!==4||key.feedbackByIndex[key.correctIndex]!==null||
     key.feedbackByIndex.some((v,j)=>j!==key.correctIndex&&typeof v!=='string'))
    throw Error('math-question-bank-mismatch');
  const correct=answers[i]===key.correctIndex;
  const feedback=correct?'':key.feedbackByIndex[answers[i]]+' ';
  return {questionId:key.questionId,prompt:question.prompt,response:question.choices[answers[i]],
    expected:key.expected,correct,explanation:feedback+key.explanation,
    lessonId:pub.lessonId,entReference:key.entReference||null};
 });
 return {id,lessonId:pub.lessonId,bankVersion:MATH_BANK_VERSION,
  score:items.filter(it=>it.correct).length,total:10,items};
}
