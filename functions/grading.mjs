// Copie du moteur de notation V16, uniquement côté serveur.
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?¡!.,;:]/g,'').replace(/\s+/g,' ').trim();
// Réponses de maths : accepte les signes typographiques, les espaces et les écritures d'exposants sans changer la valeur demandée.
export const normalizeMath = value => String(value ?? '').toLowerCase().trim()
 .replace(/[−–—]/g,'-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,ch=>'^'+'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(ch))
 .replace(/\s+/g,'').replace(/,/g,'.').replace(/[×·]/g,'*');
export function grade(exercise, key, responses) {
 if (!exercise || !key || !Array.isArray(exercise.questions) || !Array.isArray(key.questions) || !Array.isArray(responses)) throw new Error('Invalid exercise');
 if (exercise.questions.length !== key.questions.length || responses.length !== exercise.questions.length || responses.length > 30) throw new Error('Invalid answer count');
 let score=0,total=0,needsReview=false;
 const answers=exercise.questions.map((question,i)=>{
  const rawResponse=String(responses[i] ?? '');
  const isMathBonus=exercise.kind==='bonus-day'&&exercise.subject==='Mathématiques';
  const separator=isMathBonus?rawResponse.indexOf(' ||| '):-1;
  const response=separator>=0?rawResponse.slice(0,separator):rawResponse;
  const reasoning=separator>=0?rawResponse.slice(separator+5):'';
  if(isMathBonus&&question.reasoningRequired&&reasoning.trim().length<8)throw new Error('Reasoning missing');
  if(rawResponse.length>10000)throw new Error('Answer too long');
  const secret=key.questions[i];
  let correct=null;
  if(question.type==='mc')correct=String(secret.right)===response;
  else if(question.type==='text'){
   correct=[secret.right,...(secret.also||[])].some(x=>(isMathBonus?normalizeMath(x):normalize(x))===(isMathBonus?normalizeMath(response):normalize(response)));
   if(isMathBonus&&!correct){const normalized=normalizeMath(response),expected=normalizeMath(secret.right);if(expected.startsWith('x=')&&normalized===expected.slice(2))correct=true;}
  }
  else if(question.type==='free')needsReview=true;
  else throw new Error('Unsupported question type');
  if(correct!==null){total++;if(correct)score++;}
  return {question:question.q,response,correct,expected:question.type==='mc'?question.options?.[Number(secret.right)]:secret.right,skill:question.skill||'',explanation:secret.why||'',...(isMathBonus&&question.reasoningRequired?{reasoning}: {})};
 });
 return {score,total,needsReview,answers};
}
