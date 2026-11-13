/* Barème unique des entraînements de leçon : +1 / +0,5 / 0 XP.
   Les défis et les devoirs du professeur restent indépendants. */
import {lessonTrainingPoints} from '../functions/xp.mjs';
export function spanishLessonXp(score,total=10){
 if(total!==10)throw Error('Score de leçon invalide');
 return lessonTrainingPoints(score,total);
}
