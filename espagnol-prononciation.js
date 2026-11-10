/* Lecture vocale espagnole et française séparée pour Tim.
   Seul un clic déclenche le son. Aucun texte bilingue ne doit être envoyé
   à une unique voix : utiliser les données data-say-es ou data-say-fr. */
(function(){
 "use strict";
 function sayText(text,language,button){
  const raw=String(text||"").trim();
  // Certains moteurs prononcent un point final « punto » ou « point » :
  // les consignes orales n'ont pas besoin de lire leur point final.
  const value=raw.replace(/[.。]+\s*$/u,'').trim();
  if(!value)return;
  if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){
   alert("La lecture vocale n'est pas disponible dans ce navigateur.");
   return;
  }
  try{
   const lang=language==='fr'?'fr-FR':'es-ES';
   const voices=window.speechSynthesis.getVoices();
   const exact=voices.find(v=>v.lang?.replace('_','-').toLowerCase()===lang.toLowerCase());
   const compatible=exact||voices.find(v=>v.lang?.toLowerCase().startsWith(language));
   // Une voix espagnole ne doit pas lire du français, et inversement.
   if(voices.length&& !compatible){
    alert(language==='fr'?
     "Aucune voix française n'est installée ou disponible. Active la voix française dans les paramètres de synthèse vocale du téléphone.":
     "Aucune voix espagnole n'est installée ou disponible. Active la voix espagnole dans les paramètres de synthèse vocale du téléphone.");
    return;
   }
   window.speechSynthesis.cancel();
   const utterance=new SpeechSynthesisUtterance(value);
   utterance.lang=lang;
   utterance.rate=button?.getAttribute('data-say-speed')==='slow'?0.65:0.86;
   utterance.pitch=1;
   if(compatible)utterance.voice=compatible;
   const original=button?.getAttribute("aria-label")||"Écouter";
   if(button)button.setAttribute("aria-label","Lecture en cours");
   utterance.onend=()=>{if(button?.isConnected)button.setAttribute("aria-label",original);};
   utterance.onerror=()=>{
    if(button?.isConnected)button.setAttribute("aria-label",original);
   };
   window.speechSynthesis.speak(utterance);
  }catch(_){alert("Impossible de prononcer cette phrase sur cet appareil.");}
 }
 const saySpanish=(text,button)=>sayText(text,'es',button);
 const sayFrench=(text,button)=>sayText(text,'fr',button);
 document.addEventListener("click",event=>{
  const b=event.target.closest?.("[data-say-es], [data-say-fr]");
  if(!b||b.disabled)return;
  if(b.hasAttribute('data-say-fr'))sayFrench(b.getAttribute("data-say-fr"),b);
  else saySpanish(b.getAttribute("data-say-es"),b);
 });
 window.TIM_SPANISH_SPEECH={speak:saySpanish,speakFrench:sayFrench};
})();