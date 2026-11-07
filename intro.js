/* V9 — musique originale de 6,6 s, lancée seulement après un geste utilisateur. */
(()=>{'use strict';
 const overlay=document.getElementById('intro-screen');
 const img=document.getElementById('intro-animation');
 const play=document.getElementById('intro-play');
 const silent=document.getElementById('intro-silent');
 const gate=document.getElementById('intro-gate');
 const music=document.getElementById('intro-music');
 let timer=null,lastFocus=null,started=false,withMusic=false,fallback=false;
 function stopMusic(){
  if(!music)return;
  music.pause();
  try{music.currentTime=0;}catch(e){}
 }
 function close(){
  if(!overlay||overlay.hidden)return;
  overlay.hidden=true;
  document.body.classList.remove('intro-open');
  if(timer!==null){clearTimeout(timer);timer=null;}
  // La fanfare finale est dans le MP3 : éviter de superposer l'ancienne.
  if(started&&withMusic&&fallback)window.TIM_SOUND?.play('welcome');
  stopMusic();
  if(lastFocus?.isConnected)try{lastFocus.focus({preventScroll:true});}catch(e){}
 }
 function start(withSound){
  if(!overlay||overlay.hidden||!gate||gate.hidden)return;
  started=true;withMusic=!!withSound;fallback=false;
  if(withSound){
   window.TIM_SOUND?.setOn(true);
   if(window.TIM_SOUND?.mode==='muet')window.TIM_SOUND.setMode('bulle');
   window.TIM_SOUND?.unlock();
   if(music){
    stopMusic();
    music.volume=.86;
    try{
     const result=music.play(); // appelé directement par le clic, compatible Android
     if(result&&typeof result.catch==='function')result.catch(()=>{
      if(!overlay.hidden){fallback=true;window.TIM_SOUND?.play('intro');}
     });
    }catch(e){fallback=true;window.TIM_SOUND?.play('intro');}
   }else{fallback=true;window.TIM_SOUND?.play('intro');}
  }else{
   window.TIM_SOUND?.setOn(false);
   stopMusic();
  }
  gate.hidden=true;
  img.removeAttribute('src');
  img.src='./assets/loup-intro.gif?t='+Date.now();
  const bar=overlay.querySelector('.intro-progress span');
  if(bar){bar.style.animation='none';void bar.offsetWidth;bar.style.animation='intro-count 6.7s linear forwards';}
  timer=setTimeout(close,6700);
 }
 function show(){
  if(!overlay||!img||!gate)return;
  if(timer!==null){clearTimeout(timer);timer=null;}
  stopMusic();
  lastFocus=document.activeElement;
  started=false;withMusic=false;fallback=false;
  gate.hidden=false;overlay.hidden=false;
  document.body.classList.add('intro-open');
  img.src='./assets/loup-accueil.webp';
  const bar=overlay.querySelector('.intro-progress span');
  if(bar)bar.style.animation='none';
  play?.focus({preventScroll:true});
 }
 play?.addEventListener('click',()=>start(true));
 silent?.addEventListener('click',()=>start(false));
 window.TIM_INTRO_SHOW=show;
})();
