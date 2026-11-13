/* V18 · Devoir scolaire 0 XP, bonus libre (+2/+1/0), missions quotidiennes et grands défis.
   La V10 et les validations antérieures sont conservées par leur barème d'origine. */
(()=>{'use strict';
const f=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
const day=date=>{const d=new Date(date);if(!Number.isFinite(d.getTime()))return '';const parts=Object.fromEntries(f.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${parts.year}-${parts.month}-${parts.day}`;};
const monday=s=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);};
const isChallenge=ex=>['daily','weekly','sunday','bonus-parent','bonus-day'].includes(ex?.kind);
function exercisePoints(a){if(a.needsReview||!a.total)return 0;const p=Math.max(0,Math.min(1,(a.score||0)/a.total));return p===1?3:p>=.8?2:p>=.6?1:p>=.4?-1:-2;}
function bonusPoints(a){if(a.needsReview||!a.total)return 0;const p=Math.max(0,Math.min(1,(a.score||0)/a.total));return p===1?2:p>=.6?1:0;}
function canSubmit(ex,time){if(!ex)return false;const d=day(time);const dow=new Date(d+'T12:00:00Z').getUTCDay();
 if(ex.kind==='daily')return window.__TIM_CHALLENGES?.dailyIds?.includes(ex.id)===true&&dow>=1&&dow<=5&&ex.id.startsWith('DAY_'+d.replace(/-/g,'')+'_');
 if(ex.kind==='sunday')return dow===0&&ex.id==='SUNDAY_'+d.replace(/-/g,'')&&window.__TIM_CHALLENGES?.sunday===ex.id;
 if(ex.kind==='weekly')return dow===6&&window.__TIM_CHALLENGES?.weekly===ex.id;
 if(window.TIM_EXERCISE?.mode(ex,time)==='upcoming')return false;
 return true;
}
function challengeDateValid(ex,achieved){
 if(ex?.kind==='daily')return ex.id==='DAY_'+achieved.replace(/-/g,'');
 if(ex?.kind==='sunday')return new Date(achieved+'T12:00:00Z').getUTCDay()===0&&ex.id==='SUNDAY_'+achieved.replace(/-/g,'');
 if(ex?.kind==='weekly'){
  const date=new Date(achieved+'T12:00:00Z'),w=date.getUTCDay();if(w!==5&&w!==6&&w!==0)return false;
  const mondayWeek=monday(achieved),stamp=ex.weekStart;const wm=String(ex.id).match(/^WEEK_(20\d{2})W(\d{2})$/);if(!wm)return false;
  const first=new Date(Date.UTC(+wm[1],0,4,12));first.setUTCDate(first.getUTCDate()-((first.getUTCDay()+6)%7)+(+wm[2]-1)*7);
  const expectedWeek=first.toISOString().slice(0,10);
  return mondayWeek===expectedWeek&&(!stamp||stamp===expectedWeek);
 }
 return false;
}
// Historical V9 / V10 challenge scoring: exercise score + 5 XP bonus.
function contributionV9(a,ex){const achieved=day(a.date);if(!achieved)return 0;
 if(isChallenge(ex)){if(!challengeDateValid(ex,achieved))return 0;return exercisePoints(a)+(a.total&&a.score/a.total>=.8?5:0);}
 if(!ex?.publishedAt||day(ex.publishedAt)!==achieved)return 0;
 return exercisePoints(a);
}
// Preserve the V10 scores for previously validated exercises (no policyVersion).
function contributionV10(a,ex){if(!ex)return 0;if(isChallenge(ex))return contributionV9(a,ex);
 const achieved=day(a.date);if(!achieved)return 0;
 return ex.publishedAt&&day(ex.publishedAt)===achieved?exercisePoints(a):bonusPoints(a);
}
function isBonus(ex,attemptDate){return !!ex&&!isChallenge(ex)&&window.TIM_EXERCISE?.mode(ex,attemptDate)==='bonus';}
function contribution(a,ex){if(!ex)return 0;
 if(isChallenge(ex)&&a.policyVersion>=18){const p=a.total>0?a.score/a.total:0;if(a.needsReview||!a.total)return 0;
  if(ex.kind==='bonus-day')return p>=.7?5:p>=.5?2.5:0;
   if(ex.kind==='bonus-parent')return p>=.85?5:0;
  return ex.kind==='daily'?(p>=.9?3:p>=.7?2:p>=.5?1:p>=.2?0:-1):ex.kind==='weekly'?(p>=.85?10:p>=.75?7:p>=.6?4:p>=.5?1:p>=.4?0:-1):(p>=.85?20:p>=.75?14:p>=.6?8:p>=.5?2:p>=.4?0:-2);
 }
 // Le bonus +5 est ajouté aux points de l’épreuve (-2 à +3), comme avant V12.
 if(isChallenge(ex))return contributionV9(a,ex);
 // Une leçon d'entraînement suit exclusivement les XP réellement attribués
 // lors de sa validation, sans recalculer ni augmenter les anciennes copies.
 if(ex.kind==='training'&&(ex.category==='school'||ex.category==='training'))
  return Number.isFinite(a.xp)?Math.max(0,Math.min(1,a.xp)):0;
 if(window.TIM_EXERCISE?.school(ex))return 0;
 if(window.TIM_EXERCISE?.mode(ex,a.date)==='upcoming')return 0;
 return bonusPoints(a);
}
function reward(xp){return xp>=75?10:xp>=38?5:xp>=19?2:0;}
window.TIM_XP={day,monday,exercisePoints,bonusPoints,isBonus,contribution,contributionV9,contributionV10,reward,canSubmit};
})();
