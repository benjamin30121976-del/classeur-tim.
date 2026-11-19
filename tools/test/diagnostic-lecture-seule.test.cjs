'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../boot.js'),'utf8');
const start=source.indexOf('async function runFirebaseDiagnostic(){');
const end=source.indexOf('function timParisDay(){',start);
test('diagnostic Parent strictement en lecture seule',()=>{
 assert.ok(start>=0&&end>start,'fonction de diagnostic trouvée');
 const body=source.slice(start,end);
 assert.doesNotMatch(body,/\b(?:setDoc|addDoc|deleteDoc|updateDoc|runTransaction)\s*\(/,
   'aucune mutation de Firestore, même pour vérifier un refus');
 assert.match(body,/getDoc\(/);
 assert.match(body,/getDocs\(/);
 assert.match(body,/getParentReport/);
 assert.match(body,/writePermissionNotTested:true/,
   'ne pas prétendre avoir contrôlé une règle en écriture');
});
