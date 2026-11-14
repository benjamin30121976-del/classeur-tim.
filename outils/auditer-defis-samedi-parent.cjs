'use strict';
/* Audit Parent strictement en lecture seule. Réutilise la session Chromium
   authentifiée du workflow existant. Ne journalise ni réponse, ni note,
   ni correction, ni identité ; aucune écriture dans Firebase. */
module.exports=async function auditerDefisParent(page,check){
 const snap=await page.evaluate(()=>{
  if(window.__TIM_PARENT!==true)throw Error('Compte Parent non authentifié');
  const attempts=Array.isArray(window.__CLOUD_ATTEMPTS)?window.__CLOUD_ATTEMPTS:[];
  const want=attempts.filter(a=>/^WEEK_20\d{2}W\d{2}$/.test(a.id||'')||/^TIMBONUS/.test(a.id||''));
  const extras=(window.__TIM_DATA?.exercises||[]).filter(e=>/^TIMBONUS/.test(e.id||''))
   .map(e=>({id:e.id,title:e.title,lesson:e.lesson||null,
    questions:(e.questions||[]).map(q=>({type:q.type,words:String(q.q||'').split(/\s+/).length,
     reasoningRequired:Boolean(q.reasoningRequired)}))}));
  return {attempts:want.map(a=>({id:a.id,score:a.score,total:a.total,answers:a.answers||[]})),
   bonuses:extras};
 });
 console.log('AUDIT SAMEDI ET BONUS : lecture Parent réussie ; '+snap.attempts.length+' copie(s) du samedi ou bonus consultable(s).');
 const archives=snap.attempts.filter(a=>/^WEEK_/.test(a.id));
 if(!archives.length){
  console.log('AUDIT SAMEDI : aucune copie durable du samedi consultable en session Parent. Un essai Parent non enregistré ne peut pas être reconstitué.');
 }else{
  const {mixedMission,gradeMixedMission}=await import('../worker/mixed-challenges.mjs');
  for(const copy of archives){
   const lesson=mixedMission(copy.id);
   if(!lesson){console.log('AUDIT '+copy.id+' : ancien format non inspectable, copie conservée.');continue;}
   const valid=copy.answers.length===lesson.questions.length &&
      copy.answers.every((x,i)=>x.question===lesson.questions[i].q);
   console.log('AUDIT '+copy.id+' : 20 questions='+Boolean(lesson.questions.length===20)+
    ', copie complète='+Boolean(valid)+', erreurs ou points partiels='+copy.answers.filter(a=>a.correct===false).length+'.');
   if(!valid)continue;
   const responses=copy.answers.map(a=>String(a.response??''));
   try{
    const recalculated=gradeMixedMission(lesson,responses);
    const differs=Math.abs(Number(recalculated.score)-Number(copy.score))>0.000001;
    console.log('AUDIT '+copy.id+' : total recalculé identique à la copie='+!differs+'.');
   }catch(error){console.log('AUDIT '+copy.id+' : recalcul impossible ; copie inchangée.');}
   for(const [i,a] of copy.answers.entries()){
    if(a.correct!==false)continue;
    const q=lesson.questions[i];
    const partial=Number(a.points)>0&&Number(a.points)<1;
    const suspectReason=q.type==='reason'&&a.methodCorrect===true&&a.conclusionCorrect===true&&a.calculationCorrect===false;
    const literal=String(a.response||'').trim();
    const asNumber=Number(literal.replace(',','.').replace(/\s*(?:cm²?|cm2|m²?|m2|unités?)$/i,'').trim());
    const expectedNumber=Number(String(q.right).replace(',','.'));
    const numericallyRight=q.type==='text'&&q.subject==='Mathématiques'&&
     literal.length>0&&Number.isFinite(asNumber)&&Number.isFinite(expectedNumber)&&asNumber===expectedNumber;
    const equivalentAlgebra=q.type==='text'&&q.subject==='Mathématiques'&&
     /[a-z]/i.test(literal)&&/[a-z]/i.test(String(q.right))&&
     literal.replace(/\s/g,'').length>3;
    console.log('AUDIT '+copy.id+' Q'+String(i+1).padStart(2,'0')+
      ' : matière='+q.subject+', type='+q.format+
      ', partiel='+partial+', méthode-et-conclusion-justes-calcul-refusé='+suspectReason+
      ', nombre-math-correct-refusé='+numericallyRight+', écriture-algébrique-à-revoir='+equivalentAlgebra+
      ', points-non-nuls='+Boolean(Number(a.points)>0)+'.');
   }
  }
 }
 const bySubject={};for(const b of snap.bonuses){const L=b.questions||[];bySubject[b.id]={length:L.length,reasoning:L.filter(q=>q.reasoningRequired).length,long:L.filter(q=>q.words>=24).length,linked:!!b.lesson};}
 console.log('AUDIT BONUS : '+JSON.stringify(bySubject));
 check('Audit Parent samedi + bonus en lecture seule',true,'Copie du samedi : '+(archives.length?'présente':'absente')+' ; bonus référencés : '+snap.bonuses.length);
};
