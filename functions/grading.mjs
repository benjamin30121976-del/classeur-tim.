// Copie du moteur de notation V16, uniquement côté serveur.
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?¡!.,;:]/g,'').replace(/\s+/g,' ').trim();
export function grade(exercise, key, responses) {
 if (!exercise || !key || !Array.isArray(exercise.questions) || !Array.isArray(key.questions) || !Array.isArray(responses)) throw new Error('Invalid exercise');
 if (exercise.questions.length !== key.questions.length || responses.length !== exercise.questions.length || responses.length > 30) throw new Error('Invalid answer count');
 let score=0,total=0,needsReview=false;
 const answers=exercise.questions.map((question,i)=>{
  const response=String(responses[i] ?? '');
  if(response.length>10000)throw new Error('Answer too long');
  const secret=key.questions[i];
  let correct=null;
  if(question.type==='mc')correct=String(secret.right)===response;
  else if(question.type==='text')correct=[secret.right,...(secret.also||[])].some(x=>normalize(x)===normalize(response));
  else if(question.type==='free')needsReview=true;
  else throw new Error('Unsupported question type');
  if(correct!==null){total++;if(correct)score++;}
  return {question:question.q,response,correct,expected:question.type==='mc'?question.options?.[Number(secret.right)]:secret.right,skill:question.skill||'',explanation:secret.why||''};
 });
 return {score,total,needsReview,answers};
}
