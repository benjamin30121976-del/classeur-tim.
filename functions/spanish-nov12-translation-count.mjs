/* Même comptage que l'interface V16 : une question traduite compte une fois,
   quel que soit le nombre de réouvertures de l'aide.
   Seulement les 3 exercices du 12 novembre : aucun changement pour les anciens. */
export function getSpanishNov12TranslationCount(id,translationsUsed){
 if(!/^ESE_L14_0[1-3]$/.test(String(id||'')))return null;
 if(!Array.isArray(translationsUsed)||translationsUsed.length!==10||
    translationsUsed.some(flag=>typeof flag!=='boolean'))
   throw new Error('Indicateurs de traduction invalides : dix booléens attendus.');
 return translationsUsed.filter(Boolean).length;
}
