/* Défi bonus à l'accueil : aucun exercice n'est attribué automatiquement.
 * Pour publier un exercice, renseigner son ID existant dans BONUS_EXERCISE_ID,
 * ou un ID par date dans BONUS_SCHEDULE. Un seul exercice est montré.
 * Les résultats et le barème des exercices bonus restent inchangés.
 */
(()=>{'use strict';
 const BONUS_EXERCISE_ID='';
 const BONUS_SCHEDULE=Object.freeze({
  // '2026-11-13':'ID_D_UN_EXERCICE_BONUS_EXISTANT'
 });
 const dt=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
 function day(value=new Date()){
  const p=Object.fromEntries(dt.formatToParts(new Date(value)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
 }
 function pool(exercises,attempts,stamp=day()){
  const chosenId=BONUS_SCHEDULE[stamp]||BONUS_EXERCISE_ID;
  if(!chosenId)return [];
  const exercise=(exercises||[]).find(e=>e?.id===chosenId);
  if(!exercise||exercise.enabled===false||exercise.kind)return [];
  if(window.TIM_EXERCISE?.mode(exercise,new Date(stamp+'T12:00:00Z'))!=='bonus')return [];
  return [exercise];
 }
 function draw(exercises,attempts,stamp=day()){return pool(exercises,attempts,stamp);}
 function state(exercises,attempts,date=new Date()){
  const stamp=day(date),chosen=pool(exercises,attempts,stamp);
  const done=chosen.filter(ex=>(attempts||[]).some(a=>a.id===ex.id));
  return {stamp,chosen,round:0,done:done.length,remaining:chosen.length-done.length,canChange:false};
 }
 // Le tirage aléatoire et l'attribution Parent ne s'appliquent plus au bonus de l'accueil.
 const change=()=>false;
 window.TIM_BONUS={day,pool,draw,state,change};
})();
