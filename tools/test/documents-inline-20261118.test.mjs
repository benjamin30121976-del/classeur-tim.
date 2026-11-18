import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL('../../'+file,import.meta.url),'utf8');

test('Le lecteur privé propose toutes les pages PDF en défilement sans bouton',()=>{
 const s=read('physique-chimie-inline-pdf.js');
 assert.match(s,/function createFullInline\(/);
 assert.match(s,/for\(let n=1;n<=pdf\.numPages;n\+\+\)/);
 assert.match(s,/IntersectionObserver/);
 assert.match(s,/pc-pdf-all-pages/);
 assert.match(s,/createFullInline\(found,/);
 assert.match(s,/createFullInline,originalFiles/);
});
test('Français et anglais : les originaux PDF ne demandent plus de clic',()=>{
 for(const file of ['francais-documents.js','anglais-documents.js']){
  const s=read(file);
  assert.match(s,/createFullInline\(\{target,fileName:row\.name\}/,file);
  assert.doesNotMatch(s,/manual:true/,file);
 }
 const english=read('anglais-documents.js');
 assert.match(english,/renderOfficeDocument\(content,file,'docx'\)/);
});
test('SVT et Histoire : le texte ODT est déplié automatiquement',()=>{
 for(const file of ['svt-documents.js','histoire-geographie-documents.js']){
  const s=read(file);
  assert.match(s,/renderOfficeDocument\(area,saved,'odt'\)/,file);
  assert.doesNotMatch(s,/panel\.append\(read,download\)/,file);
 }
 const common=read('tim-inline-ent-documents.js');
 assert.match(common,/async function renderOfficeDocument\(/);
 assert.match(common,/await window\.JSZip\.loadAsync\(blob\)/);
 assert.match(common,/word\/document\.xml/);
 assert.match(common,/content\.xml/);
});
test('Mathématiques : original du chapitre et pages visibles sans ouverture de volet',()=>{
 const math=read('maths-parcours.js');
 assert.match(math,/className='math-inline-ent-sources'/);
 assert.match(math,/limit:30,auto:true/);
 assert.doesNotMatch(math,/details\.className='math-inline-ent-sources'/);
 const common=read('tim-inline-ent-documents.js');
 assert.match(common,/filenamePattern:pattern,limit:2,auto:true/);
 assert.match(common,/createFullInline\?/);
});
test('Espagnol : les PDF ENT et les documents du 17 novembre apparaissent sans clic',()=>{
 const s=read('espagnol-ent-exact.js');
 assert.match(s,/function nov17OriginalsInline\(/);
 assert.match(s,/nov17OriginalsInline\(fileHost\)/);
 assert.match(s,/createFullInline\?/);
 assert.doesNotMatch(s,/Utilise « Afficher ici le document »/);
});
test('Les 9 scripts sont actualisés sur la page',()=>{
 const s=read('index.html');
 for(const file of ['physique-chimie-inline-pdf.js','tim-inline-ent-documents.js','francais-documents.js','anglais-documents.js','svt-documents.js','histoire-geographie-documents.js','physique-chimie-documents.js','maths-parcours.js','espagnol-ent-exact.js']){
  assert.ok(s.includes(file+'?v=documents-inline-auto-20261118-v1'),file);
 }
});
