'use strict';
/* Contrôle pur de la correction ciblée MTH12_03 Q10.
   Aucun accès réseau, aucune écriture Firebase ; utilisé par la procédure Parent existante. */
const OLD={
 type:'mc',
 q:'Le professeur a demandé l’exercice 25 p.253, mais son énoncé n’est pas dans l’ENT. Comment le classeur doit-il le présenter ?',
 options:['Inventer les mesures de la page','Indiquer que l’énoncé manque et proposer des exercices distincts','Prétendre que ces questions sont l’exercice officiel','Marquer le devoir comme réalisé'],
 right:'1',
 why:'Les trois séries sont des exercices pédagogiques originaux, pas une reproduction du devoir 25 p.253.',
 skill:'Réciproque de Thalès'
};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function planQuestion10(raw,expected,flags={}){
 if(typeof raw!=='string'||!raw.trim())throw Error('STOP : document source Firestore manquant ou non sérialisé.');
 const stored=JSON.parse(raw);
 if(stored?.id!=='MTH12_03'||expected?.id!=='MTH12_03'||
    !Array.isArray(stored.questions)||stored.questions.length!==10||
    !Array.isArray(expected.questions)||expected.questions.length!==10)throw Error('STOP : exercice MTH12_03 incomplet.');
 if(!equal(stored.questions.slice(0,9),expected.questions.slice(0,9)))throw Error('STOP : les neuf autres questions ont changé, mise à jour refusée.');
 if(flags.publicExercise||flags.answerKey)throw Error('STOP : banque publique/clé de réponses prioritaire, mise à jour ciblée insuffisante.');
 const q10=stored.questions[9],newQ=expected.questions[9];
 if(equal(q10,newQ))return {status:'already-corrected',nextPayload:raw};
 if(!equal(q10,OLD))throw Error('STOP : question 10 inconnue, aucune modification autorisée.');
 if(flags.attempt||flags.privateAttempt||flags.releasedCorrection)
  throw Error('STOP : une copie/correction de Tim existe. Exercice laissé intact.');
 const patched={...stored,questions:stored.questions.slice()};
 patched.questions[9]={...newQ};
 if(!equal(patched.questions.slice(0,9),stored.questions.slice(0,9)))throw Error('STOP : les neuf autres questions seraient modifiées.');
 const nextPayload=JSON.stringify(patched);
 if(equal(JSON.parse(nextPayload),stored))throw Error('STOP : aucun changement réel dans la banque.');
 return {status:'ready',nextPayload};
}
module.exports={planQuestion10,OLD};
