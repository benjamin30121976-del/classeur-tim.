// Lecture seule du projet Cloudflare Pages et des noms de clés KV.
// Ne télécharge jamais une valeur KV ni les corrigés.
const fs=require('node:fs');
const account=process.env.CF_ACCOUNT_ID||'';
const token=process.env.CF_READ_TOKEN||'';
const lines=['## Diagnostic Cloudflare KV — mathématiques',
 'Lecture seule : aucune écriture, aucun déploiement, aucun corrigé téléchargé.'];
const report=(name,status)=>lines.push('- '+name+' : **'+status+'**');
function finish(){
 const msg=lines.join('\n')+'\n';
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,msg);
 console.log(msg);
}
if(!account||!token){
 report('Accès Cloudflare','NON CONFIGURÉ : renseigner CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN_READONLY dans les secrets GitHub');
 finish();process.exit(0);
}
async function get(path){
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account)+path,{
  method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(18000)
 });
 if(!response.ok)throw Error('HTTP '+response.status);
 const data=await response.json();
 if(!data.success)throw Error('Accès API refusé');
 return data.result;
}
(async()=>{
 const p=await get('/pages/projects/classeur-tim-v16');
 report('Projet Pages','VISIBLE');
 const refs={};
 for(const env of ['preview','production']){
  refs[env]=p?.deployment_configs?.[env]?.kv_namespaces?.TIM_MATH_PRIVATE_KV?.namespace_id||'';
  report('Binding '+env,refs[env]?'PRÉSENT':'ABSENT');
 }
 const namespaces=await get('/storage/kv/namespaces?per_page=100');
 for(const env of ['preview','production']){
  const id=refs[env];if(!id)continue;
  const exists=Array.isArray(namespaces)&&namespaces.some(n=>n.id===id);
  report('Namespace '+env,exists?'ACCESSIBLE':'NON TROUVÉ');
  if(!exists)continue;
  const keys=await get('/storage/kv/namespaces/'+encodeURIComponent(id)+'/keys?prefix=TIM-MATH-20261111-32b5d2cb2e6a');
  report('Clé privée '+env,Array.isArray(keys)&&keys.some(k=>k.name==='TIM-MATH-20261111-32b5d2cb2e6a')?'PRÉSENTE (valeur non lue)':'ABSENTE');
 }
})().catch(e=>report('Diagnostic API','INCOMPLET ('+String(e.message).replace(/[^A-Za-z0-9 ._-]/g,'')+')')).finally(finish);
