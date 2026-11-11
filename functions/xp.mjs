/* Barème XP V18 des missions. Aucune modification des notes déjà enregistrées. */
export function rawPoints({kind,category,score,total,needsReview}) {
 if(!category||category==='school'||needsReview||!total||category==='training')return 0;
 const p=Math.max(0,Math.min(1,score/total));
 // Bonus exceptionnel du parent : 5 XP à partir de 85 % de réussite, 0 sinon.
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
