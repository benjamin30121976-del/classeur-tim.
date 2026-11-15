/* Exception ponctuelle validée par le Parent, décidée le 15/11/2026 :
   ne pas remettre à zéro la progression de la barre XP le lundi 16/11.
   Les défis restent datés normalement ; aucune ancienne copie ni XP modifié.
   Reprise du comportement normal le lundi 23/11/2026. */
export const XP_EXCEPTION_WEEK='2026-11-16';
export const XP_CARRY_FROM='2026-11-09';
export const XP_NORMAL_RESET='2026-11-23';

function monday(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))throw Error('Invalid XP date');
 const d=new Date(s+'T12:00:00Z');
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw Error('Invalid XP date');
 d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
 return d.toISOString().slice(0,10);
}
export function xpPeriodStart(date){
 const week=monday(date);
 return week===XP_EXCEPTION_WEEK?XP_CARRY_FROM:week;
}
export function xpCarryActive(date){
 return monday(date)===XP_EXCEPTION_WEEK;
}
