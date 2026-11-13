/* Barème XP V18 des missions. Aucune modification des notes déjà enregistrées. */
/* Exercices d'entraînement liés à une leçon, distincts des devoirs ENT.
   Une seule validation : 7/10 → +1, 5/10 → +0,5, moins de 5 → 0.
   Pas de pénalité, pas de modification rétroactive des notes. */
export function lessonTrainingPoints(score,total=10){
 if(!Number.isFinite(score)||!Number.isFinite(total)||total<=0||score<0||score>total)
  throw Error('Invalid lesson exercise score');
 const p=score/total;
 return p>=0.7?1:p>=0.5?0.5:0;
}
export function rawPoints({kind,category,score,total,needsReview}) {
 if(!category||needsReview||!total)return 0;
 // Les relevés privés, les devoirs ENT et les défis sont exclus de ce barème.
 if(kind==='training'&&(category==='school'||category==='training'))
  return lessonTrainingPoints(score,total);
 if(category==='school'||category==='training')return 0;
 const p=Math.max(0,Math.min(1,score/total));
 // Défi bonus du jour : 5 XP dès 70 %. L'ancien barème Parent est conservé.
 if(kind==='bonus-day')return p>=.7?5:p>=.5?2.5:0;
  if(kind==='bonus-parent')return p>=.85?5:0;
 if(kind==='daily')return p>=.9?3:p>=.7?2:p>=.5?1:p>=.2?0:-1;
 if(kind==='weekly')return p>=.85?10:p>=.75?7:p>=.6?4:p>=.5?1:p>=.4?0:-1;
 if(kind==='sunday')return p>=.85?20:p>=.75?14:p>=.6?8:p>=.5?2:p>=.4?0:-2;
 if(category==='bonus')return p===1?2:p>=.6?1:0;
 throw Error('Unknown exercise category');
}
export function cappedPoints(raw,dayEarned=0,dayLost=0,weekEarned=0,dayBonus=0,category='bonus'){
 if(!Number.isFinite(raw))throw Error('Invalid XP');
 // Les défis n'ont ni le plafond ancien de +10/jour ni celui de +50/semaine.
 if(category==='challenge')return raw;
 if(raw<=0)return raw;
 if(category==='bonus')return Math.max(0,Math.min(raw,3-dayBonus));
 return raw;
}
export function weeklyReward(points){
 const xp=Math.max(0,Number(points)||0);
 return xp>=75?10:xp>=38?5:xp>=19?2:0;
}
