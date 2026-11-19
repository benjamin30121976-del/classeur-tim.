/* Devoir scolaire d'origine ENT : note disponible après rendu, corrigé
   inaccessible avant la fin du jour d'échéance (Europe/Paris).
   Les entraînements, Bonus devoirs et défis conservent la correction immédiate. */
const DATE=/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;
export const isSchoolHomework=ex=>ex?.category==='school'||ex?.kind==='school';
export function schoolCorrectionNotBefore(ex){
 if(!isSchoolHomework(ex))return null;
 const due=String(ex?.homeworkDue||ex?.due||'');
 if(!DATE.test(due))return null;
 const parsed=new Date(due+'T12:00:00Z');
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==due)return null;
 parsed.setUTCDate(parsed.getUTCDate()+1);
 return parsed.toISOString().slice(0,10);
}
export function schoolCorrectionIsOpen(record,today){
 if(!record?.schoolHomework)return true;
 return Boolean(DATE.test(String(record.correctionNotBefore||''))&&today>=record.correctionNotBefore);
}
export function schoolExerciseCorrectionIsOpen(ex,today){
 if(!isSchoolHomework(ex))return true;
 return schoolCorrectionIsOpen({schoolHomework:true,correctionNotBefore:schoolCorrectionNotBefore(ex)},today);
}
