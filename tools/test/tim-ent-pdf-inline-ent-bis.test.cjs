/**
 * Contrat des cours ENT et BIS : le PDF original complet est visible dans
 * la fiche elle-même sans déclenchement de bouton (données fictives).
 * Test statique : ne remplace PAS un contrôle réel Android authentifié.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const pdf=fs.readFileSync(path.join(root,'physique-chimie-inline-pdf.js'),'utf8');

test('le cours ENT et la leçon BIS partagent le document original via son identifiant ENT',()=>{
 assert.match(app,/const originalForPdf=bis&&l\.timEntBatch/);
 assert.match(app,/x\.kind==='ent'&&x\.entId===l\.entId&&subjectOf\(x\)===subjectOf\(l\)/);
 assert.match(app,/if\(originalForPdf\)dest\.append\(makeAttachmentPanel\('lesson',originalForPdf\.id,\{inlineRequired:true\}\)\)/);
 assert.match(app,/if\(bis&&\(!originalForPdf\|\|originalForPdf\.id!==l\.id\)\)/);
});
test('un PDF original utilise directement le lecteur intégral dans chaque fiche, pas un clic obligatoire',()=>{
 assert.match(app,/if\(item\.mime==='application\/pdf'\)\{/);
 assert.match(app,/embedded\.append\(window\.TIM_PHYSICS_INLINE_PDF\.createFullInline\(/);
 assert.match(app,/row\.append\(embedded\)/);
 assert.match(app,/PDF intégré indisponible : lecteur non chargé/);
});
test('le lecteur complet précrée toutes les pages puis les charge automatiquement au défilement',()=>{
 const start=pdf.indexOf('function createFullInline(');
 const end=pdf.indexOf('window.TIM_PHYSICS_INLINE_PDF=',start);
 assert.ok(start>=0&&end>start);
 const code=pdf.slice(start,end);
 assert.match(code,/for\(let n=1;n<=pdf\.numPages;n\+\+\)/);
 assert.match(code,/const observer=new IntersectionObserver/);
 assert.match(code,/observer\.observe\(card\)/);
 assert.match(code,/else Promise\.resolve\(\)\.then\(begin\)/);
 assert.doesNotMatch(code,/createInline\(|manual\s*:\s*true/);
});
