// Contrôle sans connexion et sans écriture dans les données de Tim.
// Le projet est statique : pas de compilation déclarée dans le package.json.
import {readFileSync, existsSync} from 'node:fs';
import {execFileSync, spawnSync} from 'node:child_process';

const errors=[];
const html=readFileSync('index.html','utf8');
const resources=[];
const tags=html.match(/<(?:script|link)\b[^>]*>/gi)||[];

for(const tag of tags){
  const attr=tag.match(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/i);
  if(!attr)continue;
  const value=attr[2];
  if(/^(?:https?:|data:|\/\/|#)/i.test(value))continue;
  const clean=value.split(/[?#]/)[0].replace(/^\.\//,'').replace(/^\//,'');
  if(!clean||clean.startsWith('..'))continue;
  resources.push(clean);
  if(!existsSync(clean))errors.push('Fichier HTML introuvable : '+clean);
}
if(resources.length<10)errors.push('Trop peu de ressources trouvées dans index.html : '+resources.length);
for(const id of ['access','matieres','cours','exercices','parent']){
  if(!html.includes('id="'+id+'"'))errors.push('Zone principale absente : '+id);
}

const listed=execFileSync('git',['ls-files','-z','--','*.js','*.mjs','*.cjs'],{encoding:'utf8'});
const scripts=listed.split('\0').filter(Boolean);
if(scripts.length<10)errors.push('Nombre anormal de fichiers JavaScript : '+scripts.length);
for(const file of scripts){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8',timeout:15000});
  if(result.status!==0)errors.push('Syntaxe '+file+' : '+(result.stderr||result.error||'erreur').toString().slice(0,700));
}
console.log('Références HTML vérifiées : '+resources.length);
console.log('Fichiers JavaScript contrôlés : '+scripts.length);
if(errors.length){
  for(const e of errors)console.error('ÉCHEC : '+e);
  process.exitCode=1;
}else console.log('Contrôles statiques et syntaxiques réussis.');
