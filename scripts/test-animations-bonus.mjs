import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
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
 'Tim_Animation_3XP_Mouche.mp4','Tim_Animation_2XP_Grattage.mp4',
 'Tim_Animation_1XP_Vitre_Embuee.mp4','Tim_Animation_0XP_Toc_Toc_Paume.mp4',
 'Tim_Animation_Minus1XP_Tete_Penaude.gif','Tim_Defi_Du_Samedi_10XP.gif',
 'Tim_Dimanche_Hologramme_20XP_Gagne.gif',
 'Tim_Defi_Bonus_5XP.gif'
];
const src=readFileSync('tim-animations.js','utf8');
for(const file of files){
 assert.ok(src.includes(file),'Référence manquante '+file);
 if(!existsSync('assets/animations/'+file))console.warn('MÉDIA EN ATTENTE : '+file);
}
const backend=readFileSync('functions/index.mjs','utf8');
for(const func of ['assignParentBonus','getParentBonus','submitTimExercise'])
 assert.ok(backend.includes('export const '+func+'=onCall('),'Fonction manquante '+func);
console.log('10 vérifications XP réussies ;',files.length,'médias attendus.');
