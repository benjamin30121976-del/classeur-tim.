import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../../boot.js',import.meta.url),'utf8');
const server=readFileSync(new URL('../../worker/server.mjs',import.meta.url),'utf8');
test('en cas de quota Firestore Tim aucun contenu Invité n est injecté',()=>{
 const start=code.indexOf("if(isParent){",code.indexOf('async function startSession(user){'));
 const end=code.indexOf("if(!Array.isArray(content.lessons)",start);
 assert.ok(start>=0&&end>start);
 const source=code.slice(start,end);
 assert.doesNotMatch(source,/window\.TIM_GUEST_DATA|safe\.lessons|safe\.exercises/);
 assert.match(source,/showTimCourseUnavailable\(\)/);
 assert.match(source,/response\.data\.additionsIncomplete===true/);
 assert.match(source,/document\.getElementById\('tim-course-unavailable'\)\?\.remove\(\)/);
});
test('message de chargement facile à lire, relance manuelle sans consommation de tentative',()=>{
 const start=code.indexOf('function showTimCourseUnavailable(){');
 const end=code.indexOf('\n// Firestore Standard',start);
 assert.ok(start>=0&&end>start);
 const source=code.slice(start,end);
 assert.match(source,/Cours momentanément indisponibles/);
 assert.match(source,/Réessayer de charger mes cours/);
 assert.match(source,/startSession\(activeUser\)/);
 assert.match(source,/window\.__TIM_DATA=null/);
 assert.doesNotMatch(source,/submitTimExercise|setDoc\(|XP\s*=|fetchAttempts\(/);
});
test('le serveur vérifie le jeton avant de lire le cache du cours privé',()=>{
 const token=server.indexOf("const uid=await verifyFirebaseToken(");
 const course=server.indexOf("if(data.action==='getTimCourseContent')");
 assert.ok(token>=0&&course>token);
 assert.match(server,/authenticatedTimCourse\(uid,request/);
 assert.match(server,/throw new ApiFault\(503,'student-course-incomplete'\)/);
});
