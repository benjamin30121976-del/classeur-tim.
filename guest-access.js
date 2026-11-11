/* Accès public en lecture seule, sans connexion ni accès à Firestore. */
(()=>{'use strict';
const go=document.getElementById('guest-enter');
if(!go)return;
go.addEventListener('click',async()=>{
 if(window.__TIM_GUEST||document.body.classList.contains('ready'))return;
 const source=window.TIM_GUEST_DATA;
 if(!source||!Array.isArray(source.lessons)||!source.lessons.length){document.getElementById('access-status').textContent='Le catalogue public est indisponible.';return;}
 window.__TIM_GUEST=true;window.__TIM_PARENT=false;
 const {setupMissions}=await import('./missions-v18.mjs');
 const plan=setupMissions(source,new Date(),window.TIM_SPANISH_EDU);window.__TIM_CHALLENGES=plan.meta;
 const base=window.TIM_APPLY_SPANISH_NOV05?.(source)||source;
 window.__TIM_DATA={...base,exercises:[...base.exercises,...plan.exercises]};window.__CLOUD_ATTEMPTS=[];
 // Defense in depth: optional exercise packs must never expose answer keys to guests.
 const hidden=new Set(['right','also','why','expected','answer','answers','answerKey','answerKeys','solution','solutions','correction','corrections','explanation','rubric']);
 const strip=value=>Array.isArray(value)?value.map(strip):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!hidden.has(key)).map(([key,item])=>[key,strip(item)])):value;
 window.__TIM_DATA=strip(window.__TIM_DATA);
 // Le mode invité ne diffuse plus les anciennes leçons et exercices espagnols.
 if(window.TIM_SPANISH_ENT_EXACT){
  const keep=x=>!String(x?.subject||'').toLowerCase().includes('espagnol');
  window.__TIM_DATA={...window.__TIM_DATA,lessons:window.__TIM_DATA.lessons.filter(keep),exercises:window.__TIM_DATA.exercises.filter(keep)};
 }

 window.__TIM_BRIDGE={submit:async()=>{throw Error('Accès invité : aucune validation autorisée.');},refresh:async()=>[],notifyAlert:()=>{}};
 document.getElementById('access').hidden=true;document.body.classList.add('ready','guest-mode');
 document.getElementById('account-name').textContent='Mode invité · Lecture seule';
 document.querySelectorAll('[data-nav="parent"]').forEach(b=>b.hidden=true);
 document.getElementById('logout-button').textContent='Quitter la visite';
 document.getElementById('logout-button').onclick=()=>location.reload();
 const script=document.createElement('script');script.src='./app.js?v=bonus-accueil-20261112';script.onerror=()=>{document.body.classList.remove('ready');document.getElementById('access').hidden=false;document.getElementById('access-status').textContent='Impossible de charger la visite.';};
 script.onload=()=>window.TIM_INTRO_SHOW?.();document.body.append(script);
});
})();
