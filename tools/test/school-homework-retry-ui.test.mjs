/* Test statique de l'interface : ne soumet aucune copie de Tim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const boot=fs.readFileSync(path.join(root,'boot.js'),'utf8');
const worker=fs.readFileSync(path.join(root,'worker/server.mjs'),'utf8');

test('l'élève peut refaire un devoir scolaire sans altérer la première copie',()=>{
 assert.match(app,/const retryMode=options\.retrySchool===true&&schoolTask/);
 assert.match(app,/Refaire ce devoir pour améliorer ma note/);
 assert.match(app,/openExercise\(id,\{retrySchool:true,skipOpening:true/);
 assert.match(app,/window\.__TIM_BRIDGE\.retrySchoolHomework\(id,vals\)/);
 assert.match(app,/if\(retryMode\)\{[\s\S]*?return; \/\/ La note de reprise est lue séparément/);
 assert.match(app,/Les bonnes réponses restent cachées/);
});

test('la première note scolaire est affichée même quand les solutions sont verrouillées',()=>{
 assert.match(boot,/score:released\|\|ex\.kind==='school'\?Number\(response\.data\.score\):null/);
 assert.match(boot,/total:released\|\|ex\.kind==='school'\?Number\(response\.data\.total\):null/);
 assert.match(boot,/retryTimSchoolHomework/);
 assert.match(boot,/getTimSchoolHomeworkRetakes/);
});

test('le serveur garde les anciennes routes et intègre les nouveaux appels scolaires',()=>{
 assert.match(worker,/submitTimExercise:submitExercise/);
 assert.match(worker,/retryTimSchoolHomework:/);
 assert.match(worker,/getTimSchoolHomeworkRetakes:/);
 assert.match(worker,/setParentCorrectionRelease:releaseCorrection/);
});
