// Vérifications UI en mémoire : aucune connexion Firebase, aucune tentative consommée.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

class Element {
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.hidden=false;this.src='';this.attributes={};}
 setAttribute(name,value){this.attributes[name]=value;}
 removeAttribute(name){delete this.attributes[name];}
 append(...nodes){this.children.push(...nodes);}
 remove(){this.removed=true;}
 pause(){}
 load(){}
 play(){return Promise.resolve();}
}
const body=new Element('body');
const document={body,createElement(tag){return new Element(tag);}};
const window={matchMedia:()=>({matches:false}),TIM_EXERCISE:{school:ex=>ex?.category==='school'},TIM_SOUND:{on:true}};
vm.runInNewContext(readFileSync('tim-animations.js','utf8'),{window,document,console,setTimeout,clearTimeout,Promise});
const anim=window.TIM_ANIMATIONS;
const find=(node,match)=>match(node)?node:node.children.map(x=>find(x,match)).find(Boolean);
const overlay=()=>body.children.at(-1);
const skip=()=>find(overlay(),x=>x.tagName==='BUTTON'&&x.textContent?.includes('correction'));
const media=()=>find(overlay(),x=>x.tagName==='VIDEO'||x.tagName==='IMG');
const award=()=>find(overlay(),x=>x.className==='tim-anim-award');
assert.equal(typeof anim.playOpening,'function');
let p=anim.playOpening();
assert.match(media().src,/Tim_Ouverture_Exercice_Splash_Tan_Tan_V6_Moins_Aigue.mp4$/);
assert.equal(media().playsInline,true,'lecture vidéo intégrée sur téléphone');
const firstSkip=find(overlay(),x=>x.tagName==='BUTTON'&&x.textContent?.includes('Passer'));
assert.ok(firstSkip,'bouton Passer à l’entrée');
firstSkip.onclick();await p;

for(const [xp,expected] of [
 [3,'Tim_Animation_3XP_Mouche.mp4'],
 [2.5,'Tim_Animation_2_5XP_Loup.gif'],
 [2,'Tim_Animation_2XP_Grattage.mp4'],
 [1,'Tim_Animation_1XP_Vitre_Embuee.mp4'],
 [0,'Tim_Animation_0XP_Toc_Toc_Paume.mp4'],
 [-1,'Tim_Animation_Minus1XP_Tete_Penaude.gif']
]){
 p=anim.playResult({kind:'daily'},{xp,score:7,total:10,correctionStatus:'released'});
 assert.match(media().src,new RegExp(expected.replace('.','\\.').replace('+','\\+')));
 assert.equal(award().hidden,true,'XP cachés pendant animation');
 media().onerror();
 assert.equal(award().hidden,false,'XP révélés à la fin du clip');
 const strong=find(award(),x=>x.tagName==='STRONG');
 assert.equal(strong.textContent,anim.xpLabel(xp),'nombre XP affiché');
 assert.equal(find(award(),x=>x.className==='tim-anim-award-grade').textContent,'Note : 7 / 10');
 skip().onclick();await p;
}
p=anim.playResult({kind:'daily'},{xp:2,score:7.5,total:10,correctionStatus:'released'});
assert.equal(find(award(),x=>x.className==='tim-anim-award-grade').textContent,'Note : 7,5 / 10','format décimal français');
skip().onclick();await p;
p=anim.playResult({kind:'sunday'},{xp:20,score:17,total:20,correctionStatus:'released'});
assert.match(media().src,/Tim_Defi_Du_Dimanche_20XP_Original.mp4$/);skip().onclick();await p;
p=anim.playResult({kind:'sunday'},{xp:14,score:15,total:20,correctionStatus:'released'});
assert.equal(media(),undefined,'ne pas montrer +20 XP si 14 XP obtenus');
assert.equal(award().hidden,false);skip().onclick();await p;
// Vérifier que les deux GIF existants ne sont montrés que pour la récompense gagnée.
for(const [kind,xp,score,total,expectedFile] of [
 ['weekly',10,17,20,'Tim_Defi_Du_Samedi_10XP.gif'],
 ['bonus-parent',5,9,10,'Tim_Defi_Bonus_5XP.gif'],
 ['bonus-day',5,7,10,'Tim_Defi_Bonus_5XP.gif'],
 ['bonus-day',2.5,6,10,'Tim_Animation_2_5XP_Loup.gif'],
 ['weekly',7,15,20,null],
 ['weekly',0,8,20,null],
 ['bonus-parent',0,8,10,null],
 ['bonus-day',0,4,10,null],
 ['training',0.5,6,10,null]
]){
 p=anim.playResult({kind},{xp,score,total,correctionStatus:'released'});
 if(expectedFile){
  assert.ok(media()?.src?.endsWith(expectedFile),kind+' '+xp+' XP : mauvais média');
  assert.equal(award().hidden,true,'Les XP ne sont révélés qu’après le GIF');
  media().onerror();
  assert.equal(award().hidden,false,'Les XP sont révélés après le GIF');
 }else assert.equal(media(),undefined,'GIF indû pour '+kind+' '+xp+' XP');
 assert.equal(find(award(),x=>x.tagName==='STRONG').textContent,anim.xpLabel(xp));
 assert.equal(find(award(),x=>x.className==='tim-anim-award-grade').textContent,
  'Note : '+score.toLocaleString('fr-FR')+' / '+total.toLocaleString('fr-FR'));
 skip().onclick();await p;
}
const last=body.children.length;
await anim.playResult({kind:'weekly'},{xp:10,score:17,total:20,correctionStatus:'pending-parent'});
assert.equal(body.children.length,last,'Ne pas lancer le GIF si la correction n’est pas autorisée');
await anim.playResult({category:'school'},{xp:0,correctionStatus:'pending-parent'});
assert.equal(overlay().removed,true,'aucune récompense trompeuse pour devoir scolaire');
const app=readFileSync('app.js','utf8');
assert.match(app,/!window\.__TIM_PARENT&&!window\.__TIM_GUEST&&!attemptFor\(id\)/);
assert.match(app,/openExercise\(id,\{skipOpening:true\}\)/);
assert.match(app,/await window\.TIM_ANIMATIONS\?\.playResult\?\.\(ex,saved\)/);
for(const [file,head] of [
 ['espagnol-training-ui.js','Espagnol'],
 ['maths-parcours.js','Mathématiques'],
 ['anglais-exercices.js','Anglais']
]){
 const source=readFileSync(file,'utf8');
 assert.match(source,/playOpening/,head+' : ouverture manquante');
 assert.match(source,/playResult/,head+' : révélation XP manquante');
}
console.log('OUVERTURE + RÉVÉLATION XP : tests sans écriture réussis.');
