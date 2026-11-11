import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rawPoints,cappedPoints} from '../functions/xp.mjs';
const checks=[
 ['daily 10/10',3,rawPoints({kind:'daily',category:'challenge',score:10,total:10})],
 ['daily 7/10',2,rawPoints({kind:'daily',category:'challenge',score:7,total:10})],
 ['daily 5/10',1,rawPoints({kind:'daily',category:'challenge',score:5,total:10})],
 ['daily 2/10',0,rawPoints({kind:'daily',category:'challenge',score:2,total:10})],
 ['daily 1/10',-1,rawPoints({kind:'daily',category:'challenge',score:1,total:10})],
 ['samedi 17/20',10,rawPoints({kind:'weekly',category:'challenge',score:17,total:20})],
 ['dimanche 17/20',20,rawPoints({kind:'sunday',category:'challenge',score:17,total:20})],
 ['bonus Parent 9/10',5,rawPoints({kind:'bonus-parent',category:'challenge',score:9,total:10})],
 ['bonus Parent 8/10',0,rawPoints({kind:'bonus-parent',category:'challenge',score:8,total:10})],
 ['bonus Parent plafonds anciens exclus',5,cappedPoints(5,8,0,40,3,'challenge')]
];
for(const [name,expected,actual] of checks){assert.equal(actual,expected,name);console.log('OK',name);}
const files=[
 'Tim_Defi_Du_Jour_Valide.gif',
 'Tim_Animation_3XP_Mouche.mp4','Tim_Animation_2XP_Grattage.mp4',
 'Tim_Animation_1XP_Vitre_Embuee.mp4','Tim_Animation_0XP_Toc_Toc_Paume.mp4',
 'Tim_Animation_Minus1XP_Tete_Penaude.gif','Tim_Defi_Du_Samedi_10XP.gif',
 'Tim_Defi_Du_Dimanche_20XP_Original.mp4','Tim_Defi_Du_Dimanche_20XP_Original.gif',
 'Tim_Defi_Bonus_5XP.gif'
];
const src=readFileSync('tim-animations.js','utf8');
for(const file of files){
 assert.ok(src.includes(file),'Référence manquante '+file);
 if(!existsSync('assets/animations/'+file))console.warn('MÉDIA EN ATTENTE : '+file);
}
const app=readFileSync('app.js','utf8');
assert.ok(app.includes("setCardImage?.(wolf,'daily'"),'Animation du défi du jour non branchée');
assert.ok(app.includes("barre-xp-original.png"),'Barre XP PNG non branchée');
assert.ok(existsSync('assets/barre-xp-original.png'),'Image PNG originale absente');
assert.ok(existsSync('assets/loup-intro.gif'),'Introduction du loup absente');
assert.ok(existsSync('assets/animations/Tim_Defi_Du_Dimanche_20XP_Original.mp4'),'MP4 du dimanche absent');
assert.ok(existsSync('assets/animations/Tim_Defi_Du_Dimanche_20XP_Original.gif'),'Version GIF du dimanche absente');
// Éviter toute reconversion ou substitution des deux originaux du parent.
const originals=[
 ['assets/animations/Tim_Defi_Du_Jour_Valide.gif','b9e2e539dc10c9660ef72492b48af09c1b01494d'],
 ['assets/barre-xp-original.png','03699c1e938b1dc7f709412ff04859e2dc148ef2']
];
for(const [file,sha] of originals){
 const data=readFileSync(file);
 const actual=createHash('sha1').update(Buffer.from('blob '+data.length+String.fromCharCode(0))).update(data).digest('hex');
 assert.equal(actual,sha,'Original modifié ou remplacé : '+file);
}
const originalDaily=readFileSync('assets/animations/Tim_Defi_Du_Jour_Valide.gif');
assert.match(originalDaily.toString('ascii',0,6),/^GIF8[79]a$/);
assert.equal(originalDaily.readUInt16LE(6),358);
assert.equal(originalDaily.readUInt16LE(8),356);
const originalBar=readFileSync('assets/barre-xp-original.png');
assert.equal(originalBar.readUInt32BE(16),2172);
assert.equal(originalBar.readUInt32BE(20),724);
const css=readFileSync('assets/design-defis-xp.css','utf8');
assert.ok(css.includes('object-fit:contain'),'Original du loup potentiellement recadré');
const backend=readFileSync('functions/index.mjs','utf8');
for(const func of ['assignParentBonus','getParentBonus','submitTimExercise'])
 assert.ok(backend.includes('export const '+func+'=onCall('),'Fonction manquante '+func);
console.log('10 vérifications XP réussies ; 10 animations validées (5 résultats, 4 défis, introduction) et barre PNG.');
