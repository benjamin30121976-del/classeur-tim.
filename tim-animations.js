/* Animations validées : ouverture des exercices et révélation des XP.
   Visuel uniquement : aucune modification des notes, corrections ou tentatives. */
(()=>{'use strict';
 // Original conservé séparément : assets/animations/Tim_Defi_Du_Jour_Valide.gif
 // La carte quotidienne continue d'utiliser son WebP actuel sans changement.
 const root='./assets/animations/';
 const files={
  daily:'../loup-defi-original.webp',
  reward:'../loup-defi-original.webp',
  weeklyPartial:'../loup-weekly-anime.webp',
  sundayPartial:'../loup-sunday-anime.webp',
  opening:'Tim_Ouverture_Exercice_Splash_Tan_Tan_V6_Moins_Aigue.mp4',
  plus3:'Tim_Animation_3XP_Mouche.mp4',
  plus2:'Tim_Animation_2XP_Grattage.mp4',
  plus2half:'Tim_Animation_2_5XP_Loup.gif',
  plus1:'Tim_Animation_1XP_Vitre_Embuee.mp4',
  zero:'Tim_Animation_0XP_Toc_Toc_Paume.mp4',
  minus1:'Tim_Animation_Minus1XP_Tete_Penaude.gif',
  saturday:'Tim_Defi_Du_Samedi_10XP.gif',
  sunday:'Tim_Defi_Du_Dimanche_20XP_Original.mp4',
  sundayCard:'Tim_Defi_Du_Dimanche_20XP_Original.gif',
  bonus:'Tim_Defi_Bonus_5XP.gif'
 };
 const dur={minus1:5000,saturday:6500,sunday:6500,bonus:6500,
  weeklyPartial:3500,sundayPartial:3500,reward:3200};
 const url=key=>files[key]?root+files[key]:'';
 const motionOK=()=>!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 let active=null;
 function close(){
  if(!active)return;
  const {layer,media,resolve,timer}=active;active=null;
  if(timer!==null)clearTimeout(timer);
  if(media?.tagName==='VIDEO'){
   media.pause();media.removeAttribute('src');media.load();
  }
  layer.remove();resolve();
 }
 function xpLabel(xp){
  const numeric=Number(xp);
  if(!Number.isFinite(numeric))return '';
  return (numeric>0?'+':'')+numeric.toLocaleString('fr-FR',{maximumFractionDigits:2})+' XP';
 }
 // Bouton Passer toujours disponible ; si le média ne charge pas,
 // on affiche quand même le résultat confirmé par le serveur.
 function play(key,options={}){
  const xp=typeof options.xp==='number'&&Number.isFinite(options.xp)?options.xp:null;
  // En mode mouvement réduit, la récompense reste consultable sans animation.
  const hasMedia=motionOK()&&Boolean(files[key]);
  if((!hasMedia&&xp===null)||!document.body)return Promise.resolve();
  close();
  return new Promise(resolve=>{
   const layer=document.createElement('div');layer.className='tim-anim-overlay';
   layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');
   layer.setAttribute('aria-label',xp!==null?'Révélation des XP':key==='opening'?'Ouverture de l’exercice':'Animation du loup');
   const card=document.createElement('div');card.className='tim-anim-card';
   const media=hasMedia?(files[key].endsWith('.mp4')?document.createElement('video'):document.createElement('img')):null;
   const award=xp===null?null:document.createElement('div');
   if(award){
    award.className='tim-anim-award';award.hidden=!!media;
    const caption=document.createElement('span');
    caption.className='tim-anim-award-caption';
    caption.textContent='RÉSULTAT DU DÉFI';
    if(options.kind==='training'||options.kind==='bonus')caption.textContent='RÉSULTAT DE L’EXERCICE';
    award.append(caption);
    const value=document.createElement('strong');value.className='tim-anim-award-value';
    value.textContent=xpLabel(xp);award.append(value);
    if(Number.isFinite(options.score)&&Number.isFinite(options.total)){
     const grade=document.createElement('span');grade.className='tim-anim-award-grade';
     grade.textContent='Note : '+options.score.toLocaleString('fr-FR')+' / '+options.total.toLocaleString('fr-FR');
     award.append(grade);
    }
   }
   const skip=document.createElement('button');skip.type='button';skip.className='tim-anim-skip';
   skip.textContent=key==='opening'?'Passer l’animation':'Voir ma correction';
   skip.onclick=close;
   const sound=document.createElement('button');sound.type='button';sound.className='tim-anim-skip';
   sound.textContent='Activer le son';sound.hidden=true;
   card.append(...[media,award,sound,skip].filter(Boolean));layer.append(card);document.body.append(layer);
   active={layer,media,resolve,timer:null,stage:'media'};
   const next=()=>{
    if(active?.layer!==layer||active.stage!=='media')return;
    if(!award){close();return;}
    active.stage='award';
    if(active.timer!==null)clearTimeout(active.timer);
    if(media)media.hidden=true;
    award.hidden=false;sound.hidden=true;
    active.timer=setTimeout(close,1750);
   };
   if(!media){
    active.stage='award';active.timer=setTimeout(close,2200);
    return;
   }
   media.className='tim-anim-media';media.setAttribute('aria-label','Animation '+key);
   media.onerror=next;
   if(media.tagName==='VIDEO'){
    media.playsInline=true;media.preload='auto';media.autoplay=true;
    media.muted=window.TIM_SOUND?.on===false;
    media.volume=.75;media.onended=next;
    sound.onclick=()=>{media.muted=false;media.play()?.then(()=>sound.hidden=true).catch(()=>{});};
   }else{
    media.alt='Animation du loup';media.onload=()=>{
     if(active?.media===media)active.timer=setTimeout(next,dur[key]||6000);
    };
   }
   media.src=url(key);
   if(media.tagName==='VIDEO'){
    const attempt=media.play();
    attempt?.catch?.(()=>{
     if(active?.media!==media)return;
     media.muted=true;sound.hidden=false;
     media.play()?.catch?.(next);
    });
    active.timer=setTimeout(next,key==='opening'?6500:16000);
   }
  });
 }
 function playOpening(){return play('opening');}
 function playResult(ex,saved){
  const xp=Number(saved?.xp);
  if(!Number.isFinite(xp))return Promise.resolve();
  // Ne pas annoncer de récompense avant l'autorisation de correction,
  // ni pour un devoir scolaire à 0 XP.
  if(saved?.correctionStatus==='pending-parent'||saved?.correctionLocked===true)return Promise.resolve();
  if(window.TIM_EXERCISE?.school?.(ex))return Promise.resolve();
  const kind=ex?.kind;
  // Une animation pour chaque résultat possible, sans annoncer un gain fictif :
  // les vidéos/GIF avec un nombre fixe ne servent que pour ce nombre exact ;
  // les gains intermédiaires utilisent les WebP animés déjà présents.
  const shared=xp===2.5?'plus2half':xp===2?'plus2':xp===1?'plus1':
   xp===0?'zero':xp===-1?'minus1':'reward';
  const daily=xp===3?'plus3':shared;
  const media=kind==='daily'?daily:
   kind==='weekly'?(xp===10?'saturday':(xp===7||xp===4)?'weeklyPartial':shared):
   kind==='sunday'?(xp===20?'sunday':(xp===14||xp===8)?'sundayPartial':shared):
   (kind==='bonus-parent'||kind==='bonus-day')&&xp===5?'bonus':shared;
  return play(media,{xp,score:Number(saved.score),total:Number(saved.total),
   kind:kind==='training'?'training':kind?'challenge':'bonus'});
 }
 // Garde les visuels d'accueil originaux en cas de média absent.
 function setCardImage(img,key,fallback){
  if(!img||!files[key])return;
  img.onerror=()=>{img.onerror=null;img.src=fallback;};
  img.src=url(key);
 }
 window.TIM_ANIMATIONS={play,playOpening,playResult,setCardImage,url,xpLabel};
})();
