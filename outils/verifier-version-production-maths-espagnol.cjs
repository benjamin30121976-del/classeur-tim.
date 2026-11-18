'use strict';
/* Controle production Maths/Espagnol : versions reellement referees dans HTML.
   Aucune connexion aux comptes, aucun resultat modifie. */
const base='https://classeur-tim-v16.pages.dev/';
const expected={
 'maths-ent-exercices.js':['ME_ENT_PROGRAMMES','ME_ENT_THALES3',"parent()?'Essayer cette fiche"],
 'maths-parcours.js':['TIM_MATH_ENT.renderDirectory','TIM_INLINE_ENT_DOCUMENTS'],
 'boot.js':['mathEntPreviewSubmit','spanishEntTrainingPreview'],
 'app.js':['renderMathOfficialExercises'],
 'parent-unified-results.js':['mathEntProgress'],
 'espagnol-simplifie.js':['spanishEntTrainingPreview'],
 'espagnol-ent-exact.js':['TIM_PHYSICS_INLINE_PDF'],
 'tim-inline-ent-documents.js':['TIM_INLINE_ENT_DOCUMENTS']
};
async function fetchWithTimeout(path){
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),18000);
 try{
  const response=await fetch(new URL(path,base),{signal:control.signal,redirect:'follow',cache:'no-store'});
  if(!response.ok)throw Error(path+' : HTTP '+response.status);
  return await response.text();
 }finally{clearTimeout(timer);}
}
function pathFromHtml(html,name){
 const literal=name.replaceAll('.','\\.');
 const regex=new RegExp('(?:\\./)?'+literal+'(?:\\?v=[^"\\x27<>\\s]+)?','g');
 const hits=html.match(regex)||[];
 if(!hits.length){
  if(name==='app.js')return './app.js';
  throw Error('Module absent de index.html : '+name);
 }
 const candidate=hits.find(x=>x.includes('?v='))||hits[0];
 return candidate.startsWith('./')?candidate:'./'+candidate;
}
async function audit(){
 const html=await fetchWithTimeout('./');
 const results={};
 for(const [name,signals] of Object.entries(expected)){
  const path=pathFromHtml(html,name),body=await fetchWithTimeout(path);
  for(const signature of signals)if(!body.includes(signature))
   throw Error(name+' : fonction attendue absente : '+signature.slice(0,45));
  results[name]={version:path.split('?v=')[1]||'sans-version',checked:signals.length};
 }
 const state=JSON.parse(await fetchWithTimeout('./api/status'));
 for(const [key,val] of [['mathEntInteractive',true],['mathEntOriginalTasks',2],['spanishParentPreview',true]]){
  if(state[key]!==val)throw Error('API status : '+key+' incorrect');
 }
 for(const path of ['./worker/math-ent-training.mjs','./worker/physics-ent-training.mjs']){
  const resp=await fetch(new URL(path,base),{redirect:'manual'});
  if(resp.status!==404)throw Error('Fichier de correction prive publiquement expose : '+path+' HTTP '+resp.status);
 }
 return results;
}
(async()=>{
 let last;
 for(let i=1;i<=8;i++){
  try{
   const result=await audit();
   for(const [name,v] of Object.entries(result))
    console.log('MODULE '+name+' version='+v.version+' fonctions='+v.checked);
   console.log('PASS PRODUCTION MATHS/ESPAGNOL : modules, API et protection des corriges confirmes.');
   return;
  }catch(e){last=e;console.error('Essai '+i+'/8 : '+String(e.message||e).slice(0,170));if(i!==8)await new Promise(r=>setTimeout(r,7000));}
 }
 throw last;
})().catch(e=>{console.error('ECHEC CONTROLE PRODUCTION : '+String(e.message||e));process.exitCode=1;});
