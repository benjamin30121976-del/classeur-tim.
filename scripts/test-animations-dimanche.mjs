import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import vm from 'node:vm';

// Lecture simulée. Aucun contact Firebase, aucune tentative créée.
function animationHarness(){
 const overlays=[],timers=new Map();let seq=1;
 const make=tag=>({
  tagName:tag.toUpperCase(),children:[],hidden:false,
  setAttribute(){},removeAttribute(){},
  append(...args){this.children.push(...args);},
  remove(){this.removed=true;},load(){},pause(){},
  play(){return Promise.resolve();}
 });
 const document={body:{append(node){overlays.push(node);}},createElement:make};
 const window={matchMedia:()=>({matches:false})};
 vm.runInNewContext(readFileSync(new URL('../tim-animations.js',import.meta.url),'utf8'),{
  window,document,Promise,Number,
  setTimeout(fn,ms){const id=seq++;timers.set(id,{fn,ms});return id;},
  clearTimeout(id){timers.delete(id);}
 });
 return {api:window.TIM_ANIMATIONS,overlays,timers};
}
const find=(node,fn)=>fn(node)?node:node.children.map(x=>find(x,fn)).find(Boolean);
const last=overlays=>overlays.at(-1);
function skip(overlay){
 const btn=find(overlay,n=>n.tagName==='BUTTON'&&n.textContent==='Voir ma correction');
 assert.ok(btn,'bouton pour rejoindre le corrigé');
 btn.onclick();
}

test('Dimanche: le MP4 à 20 XP seulement, sinon dévoilement du montant réel',async()=>{
 const {api,overlays}=animationHarness();
 for(const [amount,file] of [
  [0,'Tim_Animation_0XP_Toc_Toc_Paume.mp4'],
  [2,'Tim_Animation_2XP_Grattage.mp4'],
  [8,'loup-sunday-anime.webp'],
  [14,'loup-sunday-anime.webp'],
  [-2,'loup-defi-original.webp']
 ]){
  const running=api.playResult({kind:'sunday'},{xp:amount,score:15,total:20});
  const overlay=last(overlays),card=overlay.children[0];
  const media=find(card,n=>n.tagName==='VIDEO'||n.tagName==='IMG');
  assert.ok(media?.src?.endsWith(file),'Animation exacte du dimanche : '+amount);
  const award=find(card,n=>n.className==='tim-anim-award');
  assert.equal(award.hidden,true);
  media.onerror();
  assert.equal(award.hidden,false);
  assert.equal(find(award,n=>n.tagName==='STRONG').textContent,api.xpLabel(amount));
  skip(overlay);await running;
 }
 const running=api.playResult({kind:'sunday'},{xp:20,score:17,total:20});
 const overlay=last(overlays),card=overlay.children[0],media=card.children[0];
 assert.equal(media.tagName,'VIDEO');
 assert.ok(media.src.endsWith('Tim_Defi_Du_Dimanche_20XP_Original.mp4'))
 const award=find(card,n=>n.className==='tim-anim-award');
 assert.equal(award.hidden,true);
 media.onended();
 assert.equal(award.hidden,false,'le +20 est révélé après le film');
 assert.equal(find(award,n=>n.tagName==='STRONG').textContent,'+20 XP');
 skip(overlay);await running;
 assert.equal(overlay.removed,true);
 assert.ok(statSync(new URL('../assets/animations/Tim_Defi_Du_Dimanche_20XP_Original.mp4',import.meta.url)).size>100000);
});

test('Cinq réactions quotidiennes conservées et timers nettoyés',async()=>{
 const {api,overlays,timers}=animationHarness();
 for(const [xp,file] of [
  [3,'3XP_Mouche.mp4'],[2,'2XP_Grattage.mp4'],[1,'1XP_Vitre_Embuee.mp4'],
  [0,'0XP_Toc_Toc_Paume.mp4'],[-1,'Minus1XP_Tete_Penaude.gif']
 ]){
  const running=api.playResult({kind:'daily'},{xp,score:7,total:10,correctionStatus:'released'});
  const overlay=last(overlays),card=overlay.children[0],media=card.children[0];
  assert.ok(media.src.endsWith(file),file);
  if(media.tagName==='IMG')media.onload();
  const award=find(card,n=>n.className==='tim-anim-award');
  assert.equal(award.hidden,true);
  // Le parent peut accéder directement à la correction.
  skip(overlay);await running;
  assert.equal(overlay.removed,true);
  assert.equal(timers.size,0,'aucune minuterie suspendue');
 }
});

test('La carte du dimanche conserve le GIF original',()=>{
 const {api}=animationHarness();
 const img={src:'old'};
 api.setCardImage(img,'sundayCard','old');
 assert.ok(img.src.endsWith('Tim_Defi_Du_Dimanche_20XP_Original.gif'))
});
