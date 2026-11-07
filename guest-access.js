/* Accès public en lecture seule, sans connexion ni accès à Firestore. */
(()=>{'use strict';
const go=document.getElementById('guest-enter');
if(!go)return;
go.addEventListener('click',()=>{
 if(window.__TIM_GUEST||document.body.classList.contains('ready'))return;
 const source=window.TIM_GUEST_DATA;
 if(!source||!Array.isArray(source.lessons)||!source.lessons.length){document.getElementById('access-status').textContent='Le catalogue public est indisponible.';return;}
 window.__TIM_GUEST=true;window.__TIM_PARENT=false;
 window.__TIM_DATA=window.TIM_APPLY_SPANISH_NOV05?.(source)||source;window.__CLOUD_ATTEMPTS=[];
 window.__TIM_CHALLENGE_SETUP?.(window.__TIM_DATA);
 window.__TIM_BRIDGE={submit:async()=>{throw Error('Accès invité : aucune validation autorisée.');},refresh:async()=>[],notifyAlert:()=>{}};
 document.getElementById('access').hidden=true;document.body.classList.add('ready','guest-mode');
 document.getElementById('account-name').textContent='Mode invité · Lecture seule';
 document.querySelectorAll('[data-nav="parent"]').forEach(b=>b.hidden=true);
 document.getElementById('logout-button').textContent='Quitter la visite';
 document.getElementById('logout-button').onclick=()=>location.reload();
 const script=document.createElement('script');script.src='./app.js';script.onerror=()=>{document.body.classList.remove('ready');document.getElementById('access').hidden=false;document.getElementById('access-status').textContent='Impossible de charger la visite.';};
 script.onload=()=>window.TIM_INTRO_SHOW?.();document.body.append(script);
});
})();
