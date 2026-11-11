import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import vm from 'node:vm';

function animationHarness(){
 const overlays=[], timers=new Map();
 let index=1;
 const make=tag=>{
  const node={
   tagName:tag.toUpperCase(),children:[],style:{},hidden:false,
   setAttribute(){},append(...args){this.children.push(...args);},
   remove(){this.removed=true;},load(){},pause(){},
   play(){return Promise.resolve();}
  };
  return node;
 };
 const document={
  body:{append(node){overlays.push(node);}},
  createElement:make
 };
 const window={matchMedia:()=>({matches:false})};
 const context={
  window,document,Promise,Number,
  setTimeout(fn,ms){const id=index++;timers.set(id,{fn,ms});return id;},
  clearTimeout(id){timers.delete(id);}
 };
 const source=readFileSync(new URL('../tim-animations.js',import.meta.url),'utf8');
 vm.runInNewContext(source,context);
 return {api:window.TIM_ANIMATIONS,overlays,timers};
}

test('Dimanche: hologramme correct uniquement après gain confirmé de 20 XP',async()=>{
 const {api,overlays}=animationHarness();
 await api.playResult({kind:'sunday'},{xp:0});
 await api.playResult({kind:'sunday'},{xp:10});
 await api.playResult({kind:'weekly'},{xp:20});
 assert.equal(overlays.length,0);
 const running=api.playResult({kind:'sunday'},{xp:20});
 assert.equal(overlays.length,1);
 const card=overlays[0].children[0];
 const media=card.children[0];
 assert.equal(media.tagName,'IMG');
 assert.match(media.src,/Tim_Dimanche_Hologramme_20XP_Gagne\.gif$/);
 const skip=card.children.find(x=>x.textContent==='Passer l’animation');
 assert.ok(skip);
 skip.onclick();
 await running;
 assert.equal(overlays[0].removed,true);
 const f=statSync(new URL('../assets/animations/Tim_Dimanche_Hologramme_20XP_Gagne.gif',import.meta.url));
 assert.ok(f.size>100000);
});
test('Cinq réactions quotidiennes conservées; la minuterie ne ferme pas une future animation',async()=>{
 const {api,overlays,timers}=animationHarness();
 for(const [xp,file] of [
  [3,'3XP_Mouche.mp4'],[2,'2XP_Grattage.mp4'],[1,'1XP_Vitre_Embuee.mp4'],
  [0,'0XP_Toc_Toc_Paume.mp4'],[-1,'Minus1XP_Tete_Penaude.gif']
 ]){
  const running=api.playResult({kind:'daily'},{xp});
  const card=overlays.at(-1).children[0],media=card.children[0];
  assert.ok(media.src.endsWith(file),file);
  if(media.tagName==='IMG')media.onload();
  const skip=card.children.find(x=>x.textContent==='Passer l’animation');
  skip.onclick();
  await running;
  assert.equal(timers.size,0);
 }
});
test('La carte de dimanche ne révèle le hologramme corrigé que sur demande',()=>{
 const {api}=animationHarness();
 const img={src:'old'};
 api.setCardImage(img,'sundayCard','old');
 assert.match(img.src,/Tim_Dimanche_Hologramme_20XP_Gagne\.gif$/);
});
