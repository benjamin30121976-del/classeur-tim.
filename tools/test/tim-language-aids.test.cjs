/** Contrôle des aides de langue : code hors ligne, aucun compte Tim consulté. */
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..','..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const english=fs.readFileSync(path.join(root,'anglais-parcours.js'),'utf8');
const spanish=fs.readFileSync(path.join(root,'espagnol-prononciation.js'),'utf8');
const importPack=fs.readFileSync(path.join(root,'tim-ent-batch-import.js'),'utf8');
const packText=fs.readFileSync(path.join(root,'anglais-pack.js'),'utf8');
const pack=JSON.parse(packText.match(/window\.TIM_ANGLAIS_PACK=(\{.*\});\s*$/s)[1]);

test('les nouveaux énoncés espagnols gardent la question et révèlent la traduction sur clic',()=>{
 assert.match(app,/function renderEntSpanishQuestionAids\(/);
 assert.match(app,/const french=E\('p','ent-question-translation'/);
 assert.match(app,/french\.hidden=true/);
 assert.match(app,/button\('Traduire en français'/);
 assert.match(app,/french\.hidden=!french\.hidden/);
 assert.match(app,/button\('Écouter en espagnol'/);
 assert.match(app,/voice\.lang='es-ES'/);
 assert.match(importPack,/Traduction française manquante pour un énoncé espagnol/);
});

test('les nouveaux exercices anglais traduisent seulement la consigne et parlent anglais',()=>{
 assert.match(app,/language==='Anglais'/);
 assert.match(app,/button\('Écouter en anglais'/);
 assert.match(app,/voice\.lang='en-GB'/);
 assert.match(importPack,/Traduction française manquante pour un énoncé anglais\/espagnol/);
});

test('les mots espagnols restent audibles en voix espagnole et non française',()=>{
 assert.match(spanish,/const lang=language==='fr'\?'fr-FR':'es-ES'/);
 assert.match(spanish,/utterance\.rate=button\?\.getAttribute\('data-say-speed'\)==='slow'\?0\.65:0\.86/);
});

test('les leçons BIS existantes en anglais ont écoute normale et lente avec bonne langue',()=>{
 assert.ok(pack.bis.length>=1);
 assert.ok(pack.bis.every(x=>Array.isArray(x.examples)&&x.examples.length>0));
 assert.match(english,/for\(const \[a,b\] of bis\.examples\)/);
 assert.match(english,/englishListenButtons\(a\)/);
 assert.match(english,/button\('🔊 Écouter'/);
 assert.match(english,/button\('🐢 Lentement'/);
 assert.match(english,/utterance\.lang='en-GB'/);
 assert.match(english,/utterance\.rate=slow\?0\.65:0\.86/);
});

test('les futures leçons BIS automatiquement importées gardent un lecteur de mots par langue',()=>{
 assert.match(app,/function makeLanguageAudioPanel\(lesson\)/);
 assert.match(app,/if\(bis&&l\.timEntBatch\)/);
 assert.match(app,/const audioPanel=makeLanguageAudioPanel\(l\)/);
 assert.match(app,/subject==='Anglais'\?'en-GB':'es-ES'/);
 assert.match(app,/audioPhrases/);
 assert.match(app,/button\('🔊 Écouter'/);
 assert.match(app,/button\('🐢 Lentement'/);
});
