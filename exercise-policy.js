/* V12 · Types de travaux et calendrier scolaire, Europe/Paris.
   Devoir du professeur : toujours 0 XP. Bonus créé depuis une leçon : +0 à +2 XP.
   La correction reste différée dans l'interface (le lendemain à 18 h).
   ATTENTION : le corrigé n'est pas encore protégé par un service de correction serveur. */
(()=>{'use strict';
 const dt=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
 const hr=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'});
 const dateParts=d=>Object.fromEntries(dt.formatToParts(new Date(d)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 function day(x){const d=new Date(x);if(!Number.isFinite(d.getTime()))return '';const v=dateParts(d);return `${v.year}-${v.month}-${v.day}`;}
 function nextDay(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
 const challenge=ex=>['daily','weekly','sunday','bonus-parent','bonus-day'].includes(ex?.kind);
 const school=ex=>!!ex&&!challenge(ex)&&(ex.category==='school'||ex.exerciseType==='school'||ex.fromENT===true||ex.origin==='ENT'||ex.sourceType==='ENT');
 function mode(ex,now=new Date()){
  if(challenge(ex))return 'challenge';
  const publication=day(ex?.publishedAt),today=day(now);
  if(publication&&publication>today)return 'upcoming';
  return school(ex)?'school':'bonus';
 }
 function releaseDay(submittedAt){return nextDay(day(submittedAt));}
 function canShow(attempt,now=new Date(),isParent=false){
  if(isParent)return true;
  if(!attempt?.date)return false;
  const release=releaseDay(attempt.date),today=day(now);
  if(!today||!release)return false;
  if(today>release)return true;
  if(today<release)return false;
  return Number(hr.format(new Date(now)))>=18;
 }
 function releaseLabel(attempt){const d=releaseDay(attempt?.date);if(!d)return 'le lendemain à 18 h';
  const midday=new Date(d+'T12:00:00Z');
  const date=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',weekday:'long',day:'numeric',month:'long'}).format(midday);
  return `${date} à 18 h`;
 }
 window.TIM_EXERCISE={day,nextDay,mode,school,challenge,canShow,releaseDay,releaseLabel};
})();
