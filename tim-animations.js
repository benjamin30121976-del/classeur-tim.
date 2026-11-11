/* Animations validées avec le parent — aucune modification des règles de notation.
   Les médias se trouvent dans assets/animations/. Si un fichier manque, le cours reste accessible. */
(()=>{'use strict';
 const root='./assets/animations/';
 const files={
  plus3:'Tim_Animation_3XP_Mouche.mp4',
  plus2:'Tim_Animation_2XP_Grattage.mp4',
  plus1:'Tim_Animation_1XP_Vitre_Embuee.mp4',
  zero:'Tim_Animation_0XP_Toc_Toc_Paume.mp4',
  minus1:'Tim_Animation_Minus1XP_Tete_Penaude.gif',
  saturday:'Tim_Defi_Du_Samedi_10XP.gif',
  sunday:'Tim_Defi_Du_Dimanche_20XP_Original.mp4',
  bonus:'Tim_Defi_Bonus_5XP.gif'
 };
 const dur={minus1:5000,saturday:6500,bonus:6500};
 const url=key=>root+(files[key]||'');
 const motionOK=()=>!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 let active=null;
 function close(){
  if(!active)return;
  const {layer,media,resolve}=active;active=null;
  if(media?.tagName==='VIDEO'){media.pause();media.removeAttribute('src');media.load();}
  layer.remove();resolve();
 }
 // Modal immédiatement passable, une seule animation à la fois.
 function play(key){
  if(!files[key]||!motionOK()||!document.body)return Promise.resolve();
  close();
  return new Promise(resolve=>{
   const layer=document.createElement('div');layer.className='tim-anim-overlay';
   layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');
   layer.setAttribute('aria-label','Animation du loup');
   const card=document.createElement('div');card.className='tim-anim-card';
   const media=files[key].endsWith('.mp4')?document.createElement('video'):document.createElement('img');
   media.className='tim-anim-media';media.setAttribute('aria-label','Animation '+key);
   if(media.tagName==='VIDEO'){
    media.playsInline=true;media.preload='auto';media.autoplay=true;media.volume=.75;
    media.onended=close;
   }else{media.alt='Animation du loup';media.onload=()=>{if(active?.media===media)active.timer=setTimeout(close,dur[key]||6000);};}
   media.onerror=close;
   const skip=document.createElement('button');skip.type='button';skip.className='tim-anim-skip';
   skip.textContent='Passer l’animation';skip.onclick=close;
   card.append(media,skip);layer.append(card);document.body.append(layer);
   active={layer,media,resolve,timer:null};
   const originalClose=resolve;active.resolve=()=>{clearTimeout(active?.timer);originalClose();};
   media.src=url(key);
   if(media.tagName==='VIDEO'){
    const attempt=media.play();
    attempt?.catch?.(()=>{media.muted=true;media.play()?.catch?.(close);});
    active.timer=setTimeout(close,16000);
   }
  });
 }
 function playResult(ex,saved){
  const xp=Number(saved?.xp);
  if(!Number.isFinite(xp))return Promise.resolve();
  if(ex?.kind==='sunday'&&xp===20)return play('sunday');
  if(ex?.kind!=='daily')return Promise.resolve();
  return play(xp===3?'plus3':xp===2?'plus2':xp===1?'plus1':xp===0?'zero':xp===-1?'minus1':null);
 }
 // Utilisé pour les cartes de défis. Préserve l'ancienne image en cas d'asset manquant.
 function setCardImage(img,key,fallback){
  if(!img||!files[key])return;
  img.onerror=()=>{img.onerror=null;img.src=fallback;};
  img.src=url(key);
 }
 window.TIM_ANIMATIONS={play,playResult,setCardImage,url};
})();