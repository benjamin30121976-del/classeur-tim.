/* Questions publiques uniquement : traduction française des énoncés,
   jamais de réponse attendue dans ce fichier. */
window.TIM_ES12_PUBLIC_HINTS={
 "ESE_L14_01": [
  "Que signifie « nunca » ?",
  "Que signifie « nada » ?",
  "Quelle expression corrige une idée précédente ?",
  "Qu’est-ce que le « hemisferio sur » ?",
  "Que signifie « empiezo » ?",
  "Quel mois signifie « septiembre » ?",
  "Que signifie « el invierno » ?",
  "Que signifie « el verano » ?",
  "En août, quelle est la saison dans l’hémisphère sud ?",
  "Que signifie cette phrase ?"
 ],
 "ESE_L14_02": [
  "Complète : Je ne commence pas en septembre, mais en mars.",
  "Complète : Je n’étudie jamais le dimanche.",
  "Complète : Je ne vois rien.",
  "Complète : Je commence les cours en mars.",
  "Complète : L’hémisphère sud est au sud de l’équateur.",
  "Complète : Le contraire d’hiver est été.",
  "Complète : Tu commences les cours en septembre.",
  "Complète : Elle commence les cours en mars.",
  "Complète : Nous commençons les cours en septembre.",
  "Complète : En août, c’est l’hiver dans l’hémisphère sud."
 ],
 "ESE_L14_03": [
  "Écris en espagnol : jamais.",
  "Écris en espagnol : rien.",
  "Écris en espagnol : l’hémisphère sud.",
  "Conjugue empezar au présent avec yo.",
  "Conjugue empezar au présent avec tú.",
  "Conjugue empezar au présent avec él.",
  "Écris en espagnol : l’hiver.",
  "Écris en espagnol : l’été.",
  "Écris en espagnol : septembre.",
  "Complète avec le mot qui corrige l’idée précédente : pas en septembre, mais en mars."
 ]
};

/* Adaptateur vers les mêmes exercices enregistrés par le Parent dans Firestore.
   Aucune réponse attendue ici : la banque est chargée seulement après l'essai. */
window.TIM_ES12_STUDY={
 isId:id=>/^ESE_L14_0[1-3]$/.test(String(id||'')),
 task:(id,ex)=>{
  if(!ex||!Array.isArray(ex.questions)||ex.questions.length!==10)return null;
  const hints=window.TIM_ES12_PUBLIC_HINTS[id]||[];
  return {id,title:ex.title,questions:ex.questions.map((q,i)=>({
   kind:q.type==='mc'?'qcm':'write',
   instructionEs:q.type==='mc'?q.q:'Escribe tu respuesta en español.',
   instructionFr:hints[i]||'Écris ta réponse en espagnol.',
   speechEs:q.q,speechFr:hints[i]||'',
   ...(q.type==='mc'?{choices:q.options}:{stem:q.q}),
   number:i+1
  }))};
 },
 saved:(id)=>{
  try{const x=JSON.parse(localStorage.getItem('tim-es12-correction-'+id)||'null');
   return x?.id===id&&x.report?.submitted===true?x.report:null;
  }catch(_){return null;}
 },
 remember:(id,report)=>{
  try{localStorage.setItem('tim-es12-correction-'+id,JSON.stringify({id,report,savedAt:new Date().toISOString()}));}
  catch(_){}
 },
 officialReport:(id,doc)=>{
  const answers=Array.isArray(doc?.answers)?doc.answers:[];
  if(answers.length!==10)return null;
  const items=answers.map(x=>({prompt:x.question||x.prompt||'',response:x.response,
   correct:x.correct===true,points:x.correct?1:0,expected:x.expected||'',
   category:x.correct?'réussi':x.skill||'À revoir',
   feedback:x.explanation||'',explanation:x.explanation||''}));
  const errors={};
  items.filter(x=>!x.correct).forEach(x=>{errors[x.category]=(errors[x.category]||0)+1;});
  const count=doc?.translationHelpCount;
  return {id,submitted:true,score:Number(doc.score)||0,total:10,xp:0,items,
   errorCounts:errors,
   ...(Number.isInteger(count)&&count>=0&&count<=10?{translationHelpCount:count}:{})};
 }
};
