/* Questions déterministes pour 15 sous-leçons : 5 QCM + 5 écrits, 10 questions chacun.
   Le même moteur est utilisé sur le site et dans la fonction de notation serveur. */
function parseSpanishTrainingId(id){
 const m=/^SP([QW])_(L(?:0[1-9]|1[0-5]))_0([1-5])$/.exec(String(id||""));
 return m?{id,mode:m[1],lesson:m[2],series:Number(m[3])}:null;
}
function normalizeSpanishAnswer(value){
 return String(value??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[’']/g,"").replace(/[¿?¡!.,;:()"]/g," ")
  .replace(/\s+/g," ").trim();
}
function buildSpanishTasks(id,curriculum){
 const parsed=parseSpanishTrainingId(id);
 if(!parsed)return null;
 const x=curriculum?.[parsed.lesson];
 if(!x||!Array.isArray(x.pairs)||x.pairs.length!==10)return null;
 const {mode,series}=parsed,pairs=x.pairs;
 const questions=[];
 for(let i=0;i<10;i++){
  const row=(i+(series-1)*2)%10,p=pairs[row],es=p[0],fr=p[1];
  let prompt="",type=mode==="Q"?"mc":"text",answer="",note="",choices=null,correctIndex=null;
  if(mode==="Q"){
   // Les questions alternent la traduction vers le français et vers l'espagnol.
   const direction=series===1||series===4?"es-fr":series===2?"fr-es":(i+series)%2===0?"es-fr":"fr-es";
   const src=direction==="es-fr"?es:fr,target=direction==="es-fr"?fr:es,side=direction==="es-fr"?1:0;
   prompt=(direction==="es-fr"?"Que signifie en français « ":"Comment dit-on en espagnol « ")+src+" » ?";
   answer=target;
   const wrong=[];
   for(let j=1;j<10&&wrong.length<3;j++){
    const item=String(pairs[(row+j)%10][side]);
    if(item!==target&&!wrong.includes(item))wrong.push(item);
   }
   choices=wrong.slice(0,3);
   correctIndex=(i+series)%4;
   choices.splice(correctIndex,0,target);
   note=(direction==="es-fr"?"L’expression espagnole ":"En espagnol, on écrit ")+"« "+es+" » : « "+fr+" ». "+x.tip;
  }else{
   const direction=series===1?"es-fr":series===2?"fr-es":series===5?(i%2===0?"es-fr":"fr-es"):"cloze";
   if(direction==="es-fr"){
    prompt="Écris en français : « "+es+" ».";
    answer=fr;
   }else if(direction==="fr-es"){
    prompt="Écris en espagnol : « "+fr+" ».";
    answer=es;
   }else{
    const words=es.trim().split(/\s+/);
    if(words.length<2){prompt="Écris en espagnol : « "+fr+" ».";answer=es;}
    else if(series===3){answer=words.pop();prompt="Complète en espagnol : « "+words.join(" ")+" ____ » (en français : « "+fr+" »).";}
    else{answer=words.shift();prompt="Complète en espagnol : « ____ "+words.join(" ")+" » (en français : « "+fr+" »).";}
   }
   note="Expression complète : « "+es+" » = « "+fr+" ». "+x.tip;
  }
  questions.push({type,prompt,choices,answer,correctIndex,note,source:es,translation:fr});
 }
 return {id,lesson:parsed.lesson,mode,series,title:(mode==="Q"?"QCM ":"Écriture ")+series,questions};
}
function evaluateSpanishTask(task,responses){
 if(!task||!Array.isArray(task.questions)||task.questions.length!==10||
 !Array.isArray(responses)||responses.length!==10)throw Error("Réponses invalides.");
 let score=0;
 const items=task.questions.map((q,i)=>{
  const response=String(responses[i]??"").trim();
  if(response.length>300)throw Error("Une réponse est trop longue.");
  const correct=q.type==="mc"?String(q.correctIndex)===response:normalizeSpanishAnswer(response)===normalizeSpanishAnswer(q.answer);
  if(correct)score++;
  return {prompt:q.prompt,response,correct,expected:q.answer,explanation:q.note};
 });
 return {id:task.id,score,total:10,items};
}

export {parseSpanishTrainingId,normalizeSpanishAnswer,buildSpanishTasks,evaluateSpanishTask};
