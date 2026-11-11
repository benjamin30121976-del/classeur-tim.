/* Défi bonus : zéro exercice avant publication explicite.
 * Une fiche avec kind:'bonus-day' et 10 à 20 questions avec explications
 * apparaît à l'accueil. Si plusieurs sont publiées, une seule (la plus récente).
 * Pas de tirage automatique ni d'attribution par le Parent.
 */
(()=>{'use strict';
 const dt=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
 function day(value=new Date()){
  const p=Object.fromEntries(dt.formatToParts(new Date(value)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
 }
 function pool(exercises,attempts,stamp=day()){
  return (exercises||[])
   .filter(ex=>ex?.kind==='bonus-day'&&ex.enabled!==false&&
    Array.isArray(ex.questions)&&ex.questions.length>=10&&ex.questions.length<=20&&
    (!ex.publishedAt||day(ex.publishedAt)<=stamp))
   .sort((a,b)=>String(b.publishedAt||'').localeCompare(String(a.publishedAt||''))||b.id.localeCompare(a.id))
   .slice(0,1);
 }
 function draw(exercises,attempts,stamp=day()){return pool(exercises,attempts,stamp);}
 function state(exercises,attempts,date=new Date()){
  const stamp=day(date),chosen=pool(exercises,attempts,stamp);
  const done=chosen.filter(ex=>(attempts||[]).some(a=>a.id===ex.id));
  return {stamp,chosen,round:0,done:done.length,remaining:chosen.length-done.length,canChange:false};
 }
 window.TIM_BONUS={day,pool,draw,state,change:()=>false};
})();
