'use strict';
// Contrôle lecture seule du serveur de production.
// Ne soumet aucun exercice, ne change aucune note et ne stocke aucun jeton.
const fs=require('node:fs');
const boot=fs.readFileSync('boot.js','utf8');
const key=boot.match(/const DEFAULT_FIREBASE_CONFIG\s*=\s*\{[\s\S]*?apiKey:\s*'([^']+)'/)?.[1];
if(!key)throw Error('Configuration Firebase introuvable');
const root='https://classeur-tim-v16.pages.dev';
async function call(action,token){
 const headers={'Content-Type':'application/json'};
 if(token)headers.Authorization='Bearer '+token;
 const res=await fetch(root+'/api/tim',{method:'POST',headers,body:JSON.stringify({action,payload:{}}),signal:AbortSignal.timeout(16000)});
 const data=await res.json().catch(()=>({}));
 return {status:res.status,code:data.error||'OK',count:Array.isArray(data?.data?.attempts)?data.data.attempts.length:undefined};
}
async function run(){
 const status=await fetch(root+'/api/status',{signal:AbortSignal.timeout(16000)});
 const st=await status.json().catch(()=>({}));
 console.log('SERVEUR',JSON.stringify({http:status.status,platform:st.platform,available:st.available}));
 const unauthorized=await call('getParentReport');
 console.log('INVITE getParentReport',JSON.stringify(unauthorized));
 const email=process.env.TIM_PARENT_EMAIL,password=process.env.TIM_PARENT_PASSWORD;
 if(!email||!password){console.log('PARENT non configuré');return;}
 const login=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(key),{
 method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true}),signal:AbortSignal.timeout(16000)});
 const auth=await login.json().catch(()=>({}));
 if(login.status!==200||!auth.idToken){console.log('PARENT Connexion impossible, HTTP',login.status);process.exitCode=1;return;}
 const token=auth.idToken;
 for(const action of ['getParentReport','getTimCourseContent','getTimReleasedCorrections','getMathTrainingProgress']){
  const r=await call(action,token);
  console.log('PARENT',action,JSON.stringify(r));
  if(action==='getParentReport'&&r.status!==200)process.exitCode=1;
  if(['getTimCourseContent','getTimReleasedCorrections'].includes(action)&&r.status!==403)process.exitCode=1;
 }
 if(unauthorized.status!==401)process.exitCode=1;
}
run().catch(e=>{console.log('DIAGNOSTIC ERREUR',e.name);process.exitCode=1;});
