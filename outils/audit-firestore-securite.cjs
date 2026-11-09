'use strict';
// Audit des droits réels de Firestore. Lecture seule : GET et connexion Firebase.
// Aucun document n'est enregistré, modifié, supprimé ou exporté.
const {createSign}=require('node:crypto');
const fs=require('node:fs');
const PROJECT='classeur-ba3e7';
const boot=fs.readFileSync('boot.js','utf8');
const API_KEY=boot.match(/const DEFAULT_FIREBASE_CONFIG\s*=\s*\{[\s\S]*?apiKey:\s*'([^']+)'/)?.[1];
if(!API_KEY)throw Error('Clé publique Firebase absente dans boot.js');
const ROOT='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/';
const apiFetch=async(url,init={})=>{
 try{const res=await fetch(url,{...init,signal:AbortSignal.timeout(18000)});
 const json=await res.json().catch(()=>({}));
 return {status:res.status,code:json?.error?.status||'OK',json};}
 catch(e){return {status:0,code:e.name||'NETWORK_ERROR',json:{}};}
};
const short=x=>({http:x.status,code:x.code});
const log=(who,path,type,r)=>console.log('TEST',who,path,type,JSON.stringify(short(r)));
const query=(col,token)=>apiFetch(ROOT+col+'?pageSize=1&key='+encodeURIComponent(API_KEY),{headers:token?{Authorization:'Bearer '+token}:{}});
const get=(path,token)=>apiFetch(ROOT+path+'?key='+encodeURIComponent(API_KEY),{headers:token?{Authorization:'Bearer '+token}:{}});
async function authenticate(role,email,password){
 if(!email||!password){console.log('IDENTIFIANTS',role,'non configures');return null;}
 const r=await apiFetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(API_KEY),{
 method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
 if(r.status!==200||!r.json.idToken){console.log('AUTH',role,JSON.stringify(short(r)));return null;}
 console.log('AUTH',role,'OK');
 return {token:r.json.idToken,uid:r.json.localId};
}
function base64url(x){return Buffer.from(x).toString('base64url');}
async function inspectProductionRules(){
 const source=process.env.FIREBASE_SERVICE_ACCOUNT||'';
 if(!source){console.log('REGLES_DEPLOYEES','compte de service non disponible dans les secrets GitHub');return;}
 let sa;try{sa=JSON.parse(source);}catch{console.log('REGLES_DEPLOYEES','format du compte de service incorrect');return;}
 if(sa.project_id!==PROJECT||!sa.private_key||!sa.client_email){console.log('REGLES_DEPLOYEES','compte de service non valide pour ce projet');return;}
 const now=Math.floor(Date.now()/1000);
 const claims={iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+300};
 const input=base64url(JSON.stringify({typ:'JWT',alg:'RS256'}))+'.'+base64url(JSON.stringify(claims));
 const signer=createSign('RSA-SHA256');signer.update(input);signer.end();
 const assertion=input+'.'+signer.sign(sa.private_key).toString('base64url');
 const result=await apiFetch('https://oauth2.googleapis.com/token',{
 method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})
 });
 if(result.status!==200||!result.json.access_token){console.log('REGLES_DEPLOYEES','impossible de creer un jeton en lecture seule',JSON.stringify(short(result)));return;}
 const bearer={Authorization:'Bearer '+result.json.access_token};
 const rel=await apiFetch('https://firebaserules.googleapis.com/v1/projects/'+PROJECT+'/releases/cloud.firestore',{headers:bearer});
 if(rel.status!==200||!rel.json.rulesetName){console.log('REGLES_DEPLOYEES','lecture de la version impossible',JSON.stringify(short(rel)));return;}
 const rule=await apiFetch('https://firebaserules.googleapis.com/v1/'+rel.json.rulesetName,{headers:bearer});
 if(rule.status!==200){console.log('REGLES_DEPLOYEES','lecture du contenu impossible',JSON.stringify(short(rule)));return;}
 const files=rule.json?.source?.files||[];
 console.log('REGLES_DEPLOYEES','lecture reussie',files.length,'fichier(s)');
 for(const file of files){
  // Ne jamais imprimer d'identifiant individuel, de secret, ni de contenu de document.
  const str=String(file.content||'');
  const blocks=str.split(/\n(?=\s*match\s+\/)/);
  console.log('REGLES_VERSION',rel.json.rulesetName.split('/').pop(),'date',rel.json.updateTime||'non-precisee');
  for(const b of blocks){
   const header=b.match(/match\s+\/[^\n{]+(?:\{[^\n}]+\})?/);
   if(!header)continue;
   const label=header[0].replace(/\s+/g,' ').slice(0,120);
   const allows=[...b.matchAll(/allow\s+([^:;]+)\s*:\s*if\s+([^;]+);/g)].map(x=>(x[1]+' if '+x[2]).replace(/(['"])[a-zA-Z0-9_-]{19,}\1/g,"'[identifiant masque]'").slice(0,180));
   console.log('REGLES_BLOC',JSON.stringify({label,allows}));
  }
 }
}
async function main(){
 console.log('AUDIT des droits de production - strictement en lecture seule');
 const parent=await authenticate('Parent',process.env.TIM_PARENT_EMAIL,process.env.TIM_PARENT_PASSWORD);
 const student=await authenticate('Tim',process.env.TIM_STUDENT_EMAIL,process.env.TIM_STUDENT_PASSWORD);
 const paths=['content/main','settings/alerts','privateAttempts/audit-document-inexistant-20261109','answerKeys/audit-document-inexistant-20261109','lessons/audit-document-inexistant-20261109','publicLessons/audit-document-inexistant-20261109'];
 if(parent?.token){
  const main=await get('content/main',parent.token);
  if(main.status===200){
    const fields=main.json?.fields||{};
    const hits={right:0,also:0,why:0,expected:0,answer:0,answers:0,solution:0,correction:0};
    const walk=(value)=>{
      if(!value||typeof value!=='object')return;
      for(const [key,child] of Object.entries(value)){
        if(Object.prototype.hasOwnProperty.call(hits,key))hits[key]++;
        walk(child);
      }
    };
    walk(fields);
    const exerciseCount=fields.exercises?.arrayValue?.values?.length;
    console.log('CONTENU PRINCIPAL : document charge, nombre exercices',exerciseCount??'inconnu');
    console.log('CHAMPS POUVANT CONTENIR DES REPONSES CORRECTES',JSON.stringify(hits));
    console.log('AUDIT REMARQUE : seules les PRESENCES de champs sont affichees, jamais leur valeur');
  }
 }
 for(const who of [{name:'Invité',token:null},{name:'Parent',token:parent?.token},{name:'Tim',token:student?.token}]){
  if(who.name!=='Invité'&&!who.token)continue;
  for(const path of paths)log(who.name,path,'get',await get(path,who.token));
  for(const coll of ['privateAttempts','attempts','answerKeys','settings','content','lessons','exercises','publicLessons']){
   log(who.name,coll,'list',await query(coll,who.token));
  }
 }
 if(parent?.token&&student?.token){
  const mine=await query('attempts',parent.token);
  const d=mine.json?.documents?.[0];
  if(d){
   const path=d.name.split('/documents/')[1];
   const author=d.fields?.authorUid?.stringValue||'';
   console.log('VERIFICATION AUTEUR TENTATIVE',author===student.uid?'Tim':'Autre ou manquant');
   for(const who of [{name:'Invité',token:null},{name:'Parent',token:parent.token},{name:'Tim',token:student.token}]){
    log(who.name,'attempts/<document-existant>','get',await get(path,who.token));
    log(who.name,'privateAttempts/<document-correspondant>','get',await get(path.replace(/^attempts\//,'privateAttempts/'),who.token));
   }
  }else console.log('AUCUNE TENTATIVE EXISTANTE pour comparer les permissions GET');
 }
 await inspectProductionRules();
}
main().catch(e=>{console.log('AUDIT ERREUR',e.name);process.exitCode=1;});
