/* Barème des 39 entraînements d'espagnol ; les défis V18 gardent leurs règles. */
export function spanishLessonXp(score,total=10){
 if(!Number.isFinite(score)||total!==10||score<0||score>10)throw Error('Score espagnol invalide');
 return score>=7?1:score>=5?0.5:0;
}
