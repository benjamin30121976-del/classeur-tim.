export function grade(exercise,key,answers){
 if(!Array.isArray(exercise?.questions)||!Array.isArray(key?.questions)||!Array.isArray(answers)||answers.length!==exercise.questions.length||key.questions.length!==answers.length)throw Error('Invalid answer count');
 const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 let score=0,total=0,needsReview=false;
 const graded=exercise.questions.map((q,i)=>{
  const value=answers[i];if(String(value??'').length>10000)throw Error('Oversized answer');
  if(q.type==='free'){needsReview=true;return {correct:null};}
  total++;
  const expected=key.questions[i];
  const allowed=[expected.right,...(expected.also||[])].map(normalize);
  const correct=allowed.includes(normalize(value));
  if(correct)score++;
  return {correct};
 });
 return {score,total,needsReview,answers:graded};
}
