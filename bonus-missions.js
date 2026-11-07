/* V11 : 3 bonus proposés chaque jour, tirage stable par date (Europe/Paris).
 * Tirage calculé sans appels externes. Un changement facultatif est mémorisé
 * dans CE navigateur. Aucun changement à Firebase ou aux règles de correction.
 */
(()=>{'use strict';
 const dt=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
 function day(value=new Date()){
  const p=Object.fromEntries(dt.formatToParts(new Date(value)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
 }
 function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function key(stamp){return 'tim_v11_bonus_draw_'+stamp;}
 function read(stamp){try{return localStorage.getItem(key(stamp))==='1'?1:0;}catch(e){return 0;}}
 function pool(exercises,attempts,stamp){
  const existing=new Set((attempts||[]).filter(a=>{try{return day(a.date)<stamp;}catch(e){return false;}}).map(a=>a.id));
  const on=new Date(stamp+'T12:00:00Z');
  return (exercises||[]).filter(e=>e&&!e.kind&&!existing.has(e.id)&&window.TIM_EXERCISE?.mode(e,on)==='bonus');
 }
 function draw(exercises,attempts,stamp,round){
  const eligible=pool(exercises,attempts,stamp);
  const sorted=eligible.slice().sort((a,b)=>hash(stamp+'|'+round+'|'+a.id)-hash(stamp+'|'+round+'|'+b.id)||a.id.localeCompare(b.id));
  if(round){
   const original=new Set(draw(exercises,attempts,stamp,0).map(e=>e.id));
   // Une autre série quand le catalogue est assez fourni ; jamais plus de 3.
   sorted.sort((a,b)=>Number(original.has(a.id))-Number(original.has(b.id))||hash(stamp+'|second|'+a.id)-hash(stamp+'|second|'+b.id));
  }
  const bySubject=new Map();for(const ex of sorted){const s=ex.subject||'Espagnol';if(!bySubject.has(s))bySubject.set(s,[]);bySubject.get(s).push(ex);}
  const subjects=[...bySubject.keys()].sort((a,b)=>hash(stamp+'|subject|'+round+'|'+a)-hash(stamp+'|subject|'+round+'|'+b));
  const result=[];let progress=true;while(result.length<3&&progress){progress=false;for(const s of subjects){const next=bySubject.get(s).shift();if(next){result.push(next);progress=true;if(result.length===3)break;}}}
  return result;
 }
 function state(exercises,attempts,date=new Date()){
  const stamp=day(date),round=read(stamp),chosen=draw(exercises,attempts,stamp,round);
  const done=chosen.filter(e=>(attempts||[]).some(a=>a.id===e.id));
  return {stamp,chosen,round,done:done.length,remaining:chosen.length-done.length,canChange:!round&&done.length===0&&pool(exercises,attempts,stamp).length>3};
 }
 function change(exercises,attempts,date=new Date()){
  const s=state(exercises,attempts,date);
  if(!s.canChange)return false;
  try{localStorage.setItem(key(s.stamp),'1');return true;}catch(e){return false;}
 }
 // Fonctions pures exposées pour le test et pour le calcul stable.
 window.TIM_BONUS={day,pool,draw,state,change};
})();
