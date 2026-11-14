'use strict';
/* Audit Parent sans écriture : les anciennes copies restent inchangées.
   N'afficher ni énoncé, ni réponse, ni score, ni identifiant de Tim. */
module.exports=async function auditCorrectionSamedi(page,check){
 const old=await page.evaluate(()=>{
  if(window.__TIM_PARENT!==true)throw Error('Session Parent requise');
  const source=(window.__CLOUD_ATTEMPTS||[]).find(a=>a.id==='WEEK_2026W46');
  return source?{id:source.id,answers:source.answers,score:source.score}:null;
 });
 if(!old){
  check('Comparaison du samedi 14/11 en lecture seule',false,'Copie du samedi non visible au compte Parent');
  return;
 }
 const {mixedMission,gradeMixedMission}=await import('../worker/mixed-challenges.mjs');
 const mission=mixedMission(old.id);
 if(!Array.isArray(old.answers)||old.answers.length!==20||
    old.answers.some((a,i)=>a.question!==mission.questions[i].q))
   throw Error('Copie historique différente de la banque ; relecture refusée.');
 const fresh=gradeMixedMission(mission,old.answers.map(a=>String(a.response??'')));
 for(const idx of [11,14]){
  const value=String(old.answers[idx].response??'').trim();
  const same=String(mission.questions[idx].right??'');
  const tokens=value.match(/[+-]?\d+(?:[.,]\d+)?/g)||[];
  const last=tokens.length?Number(tokens[tokens.length-1].replace(',','.')):NaN;
  const expected=Number(same);
  console.log('FORMAT COPIE WEEK_2026W46 Q'+(idx+1)+
    ' : longueur='+value.length+', nombre-de-nombres='+tokens.length+
    ', nombre-final-juste='+(last===expected)+
    ', avec-egalite='+(value.includes('='))+
    ', avec-calcul='+( /[+×*÷/]/.test(value))+
    ', texte-libres='+(/[a-zàâéèêëîïôùûüç]/i.test(value))+
    ', unite-cm='+(/\bcm\b/i.test(value))+
    ', marqueur-resultat='+(/donc|réponse|reponse|résultat|resultat|on obtient|soit|=/.test(value.toLowerCase()))+
    ', point-interrogation='+value.includes('?')+
    ', negation='+(/\b(?:pas|faux|incorrect)\b/i.test(value))+
    '. Aucun contenu de réponse divulgué.');
 }
 const changed=[];
 for(let i=0;i<20;i++){
  const before=Number(old.answers[i].points),after=Number(fresh.answers[i].points);
  if(after>before+1e-8)changed.push({numero:i+1,matiere:mission.questions[i].subject});
 }
 if(fresh.score+1e-8<Number(old.score))
  throw Error('Le correcteur nouveau diminuerait la note ; modification interdite.');
 console.log('AUDIT SAMEDI SECURISÉ : 20 réponses reprises sans écriture ; erreurs désormais reconnues = '+
  changed.map(x=>'Q'+x.numero+' ('+x.matiere+')').join(', ')+
  '. Aucun score, aucune réponse, aucun XP enregistrés.');
 check('Relecture du samedi 14/11 sans toucher à la copie',true,
  changed.length+' réponse(s) anciennement refusée(s) reconnue(s) par le correcteur corrigé.');
};
