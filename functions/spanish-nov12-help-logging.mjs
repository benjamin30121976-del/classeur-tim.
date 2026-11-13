/* Métadonnées de suivi pédagogiques stockées par la fonction Firebase
   submitTimExercise déjà publiée. Cette fiche de suivi n'est PAS un devoir :
   elle n'est jamais présentée à Tim, n'entre dans aucune moyenne et vaut 0 XP.
   Une seule donnée : nombre de questions dont la traduction a été affichée,
   de 0 à 10, selon le comptage original V16 (une question comptée au plus une fois). */
export const SPANISH_NOV12_HELP_IDS=['ESE_L14_01','ESE_L14_02','ESE_L14_03'];
export const spanishNov12HelpId=id=>
 SPANISH_NOV12_HELP_IDS.includes(id)?'TRH_'+id:null;
export function spanishNov12HelpExercises(){
 return SPANISH_NOV12_HELP_IDS.map((target,i)=>({
  id:spanishNov12HelpId(target),subject:'Espagnol',lesson:'L14',
  title:'Suivi privé des traductions · 12 novembre · exercice '+(i+1),
  description:'Donnée interne de suivi, sans exercice supplémentaire pour Tim. Une question traduite compte une seule fois.',
  topic:'Aide de traduction',source:'Compteur pédagogique',
  category:'school',kind:'translation-help-log',enabled:true,
  questions:[{type:'text',
   q:'Nombre de questions avec traduction française affichée (0 à 10)',
   right:'0',skill:'Suivi privé',why:'Cette donnée sert au suivi Parent, pas à la notation.'}]
 }));
}
export function readSpanishNov12HelpCount(record){
 const value=record?.answers?.[0]?.response;
 if(!/^(?:10|[0-9])$/.test(String(value??'')))return null;
 return Number(value);
}
