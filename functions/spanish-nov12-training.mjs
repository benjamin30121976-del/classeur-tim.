/* Leçon 14, 12 novembre : questions d'entraînement originales, distinctes de la photocopie ENT.
   Les réponses et explications restent exclusivement dans les fonctions Firebase. */
const ID_PATTERN=/^ESE_L14_0([1-3])$/;
const q=(prompt,fr,choices,right,category,explanation)=>({kind:'qcm',prompt,fr,choices,right,category,explanation});
const g=(prompt,fr,right,category,explanation)=>({kind:'gap',prompt,fr,right,category,explanation});
const w=(prompt,fr,right,category,explanation)=>({kind:'write',prompt,fr,right,category,explanation});
const BANK=[
 [
 q('¿Qué significa « nunca »?','Que signifie « nunca » ?', ['souvent','jamais','déjà','hier'],1,'Vocabulaire','Nunca signifie jamais.'),
 q('¿Qué significa « nada »?','Que signifie « nada » ?', ['toujours','quelque chose','rien','personne'],2,'Vocabulaire','Nada signifie rien, notamment dans « No veo nada ».'),
 q('¿Qué expresión corrige una idea anterior?','Quelle expression corrige une idée précédente ?', ['no… sino…','muy… también…','ayer… hoy…','sí… y…'],0,'Construction','No… sino… permet de dire « non pas ceci, mais plutôt cela ».'),
 q('¿Cuál es el hemisferio sur?','Qu’est-ce que le « hemisferio sur » ?', ['l’hémisphère nord','le pôle Nord','l’équateur','l’hémisphère sud'],3,'Vocabulaire','Sur signifie sud.'),
 q('¿Qué significa « empiezo »?','Que signifie « empiezo » ?', ['je termine','je commence','nous commençons','il commence'],1,'Conjugaison','Empiezo est la première personne du singulier de empezar.'),
 q('¿Qué mes es « septiembre »?','Quel mois signifie « septiembre » ?', ['septembre','octobre','mars','janvier'],0,'Vocabulaire','Septiembre signifie septembre.'),
 q('¿Qué significa « el invierno »?','Que signifie « el invierno » ?', ['le printemps','l’été','l’hiver','l’automne'],2,'Vocabulaire','Invierno signifie hiver.'),
 q('¿Qué significa « el verano »?','Que signifie « el verano » ?', ['le printemps','l’été','l’hiver','l’automne'],1,'Vocabulaire','Verano signifie été.'),
 q('En agosto, ¿qué estación hay en el hemisferio sur?','En août, quelle est la saison dans l’hémisphère sud ?', ['invierno','verano','primavera','otoño'],0,'Compréhension','En août, c’est l’hiver dans l’hémisphère sud, à l’inverse de l’hémisphère nord.'),
 q('« No empiezo en septiembre, sino en marzo » significa…','Que signifie cette phrase ?', ['Je commence en septembre et en mars','Je ne commence jamais','Je commence en septembre, pas en mars','Je ne commence pas en septembre, mais en mars'],3,'Compréhension','Sino introduit le mois qui remplace le premier.')
 ],
 [
 g('No empiezo en septiembre, ___ en marzo.','Complète : Je ne commence pas en septembre, mais en mars.','sino','Construction','Après une négation, sino corrige l’information rejetée.'),
 g('___ estudio los domingos.','Complète : Je n’étudie jamais le dimanche.','Nunca','Négation','Nunca est placé avant le verbe : aucune autre négation n’est nécessaire ici.'),
 g('No veo ___.','Complète : Je ne vois rien.','nada','Négation','Nada, placé après le verbe, complète « no ».'),
 g('Yo ___ las clases en marzo.','Complète : Je commence les cours en mars.','empiezo','Conjugaison','Empezar change e en ie à yo : empiezo.'),
 g('El hemisferio ___ está al sur del ecuador.','Complète : L’hémisphère sud est au sud de l’équateur.','sur','Vocabulaire','Sur signifie sud.'),
 g('El contrario de invierno es ___.','Complète : Le contraire d’hiver est été.','verano','Vocabulaire','Le contraire d’invierno (hiver) est verano (été).'),
 g('Tú ___ las clases en septiembre.','Complète : Tu commences les cours en septembre.','empiezas','Conjugaison','À tú, empezar se conjugue empiezas.'),
 g('Ella ___ el curso en marzo.','Complète : Elle commence les cours en mars.','empieza','Conjugaison','À ella, empezar se conjugue empieza.'),
 g('Nosotros ___ el curso en septiembre.','Complète : Nous commençons les cours en septembre.','empezamos','Conjugaison','À nosotros, pas de diphtongue : empezamos.'),
 g('En agosto es ___ en el hemisferio sur.','Complète : En août, c’est l’hiver dans l’hémisphère sud.','invierno','Compréhension','Août est un mois d’hiver dans l’hémisphère sud.')
 ],
 [
 w('Escribe en español « jamais ».','Écris en espagnol : jamais.','nunca','Vocabulaire','Jamais se traduit par nunca.'),
 w('Escribe en español « rien ».','Écris en espagnol : rien.','nada','Vocabulaire','Rien se traduit par nada.'),
 w('Escribe « l’hémisphère sud » en español.','Écris en espagnol : l’hémisphère sud.','el hemisferio sur','Vocabulaire','Hemisferio sur signifie hémisphère sud.'),
 w('Conjuga empezar: yo ___.','Conjugue empezar au présent avec yo.','empiezo','Conjugaison','La forme yo du verbe empezar est empiezo.'),
 w('Conjuga empezar: tú ___.','Conjugue empezar au présent avec tú.','empiezas','Conjugaison','La forme tú du verbe empezar est empiezas.'),
 w('Conjuga empezar: él ___.','Conjugue empezar au présent avec él.','empieza','Conjugaison','La forme él du verbe empezar est empieza.'),
 w('Escribe « l’hiver » en español.','Écris en espagnol : l’hiver.','el invierno','Vocabulaire','L’hiver se dit el invierno.'),
 w('Escribe « l’été » en español.','Écris en espagnol : l’été.','el verano','Vocabulaire','L’été se dit el verano.'),
 w('Escribe « septembre » en español.','Écris en espagnol : septembre.','septiembre','Vocabulaire','Septembre se traduit par septiembre.'),
 w('Completa la frase: No empiezo en septiembre, ___ en marzo.','Complète avec le mot qui corrige l’idée précédente : pas en septembre, mais en mars.','sino','Construction','Après « no empiezo », on utilise sino pour opposer mars à septembre.')
 ]
];
const LABELS=['Je comprends les mots','Je complète les phrases','J’écris seul'];
export function nov12IdValid(id){return ID_PATTERN.test(String(id||''));}
function taskById(id){
 const m=ID_PATTERN.exec(String(id||''));
 if(!m)return null;
 const series=Number(m[1]),questions=BANK[series-1];
 return {id,series,lessonId:'10099~6400554',title:'Exercice '+series+' — '+LABELS[series-1],questions};
}
export function nov12TaskPublic(id){
 const task=taskById(id);if(!task)return null;
 return {id:task.id,title:task.title,lessonId:task.lessonId,
  questions:task.questions.map((item,i)=>({
   kind:item.kind,
   instructionEs:item.kind==='qcm'?item.prompt:item.kind==='gap'?'Completa la frase.':'Escribe tu respuesta en español.',
   instructionFr:item.fr,
   speechEs:item.prompt,
   speechFr:item.fr,
   ...(item.kind==='qcm'?{choices:item.choices}:{stem:item.prompt}),
   number:i+1
  }))};
}
function norm(value){return String(value??'').trim().normalize('NFC').toLocaleLowerCase('es').replace(/\s+/g,' ');}
export function nov12Evaluate(id,answers,translationsUsed){
 const task=taskById(id);if(!task||!Array.isArray(answers)||answers.length!==10||
  !Array.isArray(translationsUsed)||translationsUsed.length!==10||
  translationsUsed.some(v=>typeof v!=='boolean'))return null;
 const items=task.questions.map((q,i)=>{
  const response=answers[i];
  const valid=q.kind==='qcm'?(Number.isInteger(response)&&response>=0&&response<4):
    (typeof response==='string'&&response.length>0&&response.length<=200);
  if(!valid)return null;
  const correct=q.kind==='qcm'?response===q.right:norm(response)===norm(q.right);
  return {prompt:q.prompt,response:q.kind==='qcm'?q.choices[response]:response,
   expected:q.kind==='qcm'?q.choices[q.right]:q.right,
   correct,points:correct?1:0,category:correct?'réussi':q.category,
   feedback:correct?'Réponse correcte.':q.explanation,
   explanation:q.explanation};
 });
 if(items.some(x=>!x))return null;
 const score=items.reduce((v,x)=>v+x.points,0),xp=score>=7?1:score>=5?0.5:0;
 const errorCounts={};
 for(const item of items){if(!item.correct)errorCounts[item.category]=(errorCounts[item.category]||0)+1;}
 return {id,score,total:10,xp,items,errorCounts,translationHelpCount:translationsUsed.filter(Boolean).length};
}
export function nov12TaskIds(){return [1,2,3].map(n=>'ESE_L14_0'+n);}

/* Format habituel de publication Parent : exercices persistés dans Firestore,
   et évalués par la fonction déjà publiée submitTimExercise.
   Cette méthode n'a besoin d'aucune nouvelle clé ni fonction Firebase. */
export function nov12ForParentImport(){
 return BANK.map((items,i)=>({
  id:'ESE_L14_0'+(i+1),lesson:'L14',subject:'Espagnol',
  title:'12 novembre — '+LABELS[i],topic:'Négations, conjugaison et saisons',
  level:'Entraînement 10 questions',category:'school',kind:'training',
  source:'Exercices pédagogiques du classeur — 12 novembre 2026, distincts du devoir officiel',
  description:'10 questions ; une seule soumission ; selon la note : +1 / +0,5 / 0 XP ; corrections et suivi Parent.',
  enabled:true,
  questions:items.map(item=>item.kind==='qcm'
   ?{type:'mc',q:item.prompt,options:item.choices,right:String(item.right),why:item.explanation,skill:item.category}
   :{type:'text',q:item.prompt,right:item.right,why:item.explanation,skill:item.category})
 }));
}
