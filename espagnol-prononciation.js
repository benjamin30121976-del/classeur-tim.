/* Commandes de prononciation espagnole pour le parcours pédagogique de Tim.
   S'appuie sur la synthèse vocale de l'appareil, sans API payante ni fichier audio.
   Un clic est requis pour chaque lecture : aucune voix ne démarre toute seule. */
(function(){
 "use strict";
 function saySpanish(text,button){
  const value=String(text||"").trim();
  if(!value)return;
  if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){
   alert("La lecture vocale n'est pas disponible dans ce navigateur.");
   return;
  }
  try{
   window.speechSynthesis.cancel();
   const utterance=new SpeechSynthesisUtterance(value);
   utterance.lang="es-ES";
   utterance.rate=button?.getAttribute('data-say-speed')==='slow'?0.65:0.86;
   utterance.pitch=1;
   const voices=window.speechSynthesis.getVoices();
   const spanish=voices.find(v=>/^es[-_]es$/i.test(v.lang))||voices.find(v=>/^es(?:[-_]|$)/i.test(v.lang));
   if(spanish)utterance.voice=spanish;
   const original=button?.getAttribute("aria-label")||"Écouter en espagnol";
   if(button)button.setAttribute("aria-label","Lecture en cours");
   utterance.onend=()=>{if(button?.isConnected)button.setAttribute("aria-label",original);};
   utterance.onerror=()=>{if(button?.isConnected)button.setAttribute("aria-label",original);};
   window.speechSynthesis.speak(utterance);
  }catch(error){alert("Impossible de prononcer ce mot sur cet appareil.");}
 }
 document.addEventListener("click",event=>{
  const b=event.target.closest?.("[data-say-es]");
  if(!b||b.disabled)return;
  const text=b.getAttribute("data-say-es");
  saySpanish(text,b);
 });
 window.TIM_SPANISH_SPEECH={speak:saySpanish};
})();