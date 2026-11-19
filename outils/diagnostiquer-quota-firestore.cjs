'use strict';
/*
 * Diagnostic MINIMAL, lecture seule : quota Google et disponibilité du chemin
 * Firestore serveur. Aucun cours, document, copie, mot de passe ou jeton ne
 * figure dans les logs et les artefacts. Ne modifie rien dans Google/Firebase.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const PROJECT='classeur-ba3e7';
const FREE_READ_THRESHOLD=50000; // seuil documentaire uniquement, PAS le quota observé
const OUT=path.resolve('diagnostic-firestore');
const LIMIT=12000;
function safeCode(value){const v=String(value||'');return /^[A-Z_0-9]{3,72}$/.test(v)?v:null;}
function pacificMidnight(now=new Date()){
 const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'});
 const parts=f.formatToParts(now);const get=t=>parts.find(p=>p.type===t)?.value;
 const date=get('year')+'-'+get('month')+'-'+get('day');
 // Pacific midnight corresponds to 07:00 or 08:00 UTC (DST aware).
 let h=8,guess=new Date(date+'T08:00:00.000Z');
 const fmt=d=>f.formatToParts(d).filter(p=>['year','month','day','hour'].includes(p.type)).map(p=>p.value).join('-');
 const midnight=new Date(date+'T07:00:00.000Z');
 if(fmt(midnight).startsWith([get('month'),get('day')].join('-')))h=7;
 // More robust: compare date part in Pacific explicitly, then choose earliest
 // UTC hour 07/08 that corresponds to today's 00:00 Pacific.
 for(const utcHour of [7,8,9]){
  const d=new Date(date+'T'+String(utcHour).padStart(2,'0')+':00:00.000Z');
  const v=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',hourCycle:'h23',
   year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit'}).formatToParts(d);
  const map=Object.fromEntries(v.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  if(map.year===get('year')&&map.month===get('month')&&map.day===get('day')&&map.hour==='00')return d;
 }
 return guess;
}
async function transport(url,options={}){
 const abort=AbortSignal.timeout(LIMIT);
 try{return await fetch(url,{...options,signal:abort,redirect:'error'});}
 catch{return null;}
}
async function auth(sa){
 const now=Math.floor(Date.now()/1000);
 const header=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
 const body=Buffer.from(JSON.stringify({iss:sa.client_email,
  scope:'https://www.googleapis.com/auth/cloud-platform.read-only',
  aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+1200})).toString('base64url');
 const joined=header+'.'+body;
 const sig=crypto.sign('RSA-SHA256',Buffer.from(joined),sa.private_key).toString('base64url');
 const res=await transport('https://oauth2.googleapis.com/token',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:joined+'.'+sig})
 });
 if(!res||!res.ok)return {code:'oauth-unavailable',http:res?.status||0};
 const data=await res.json().catch(()=>({}));
 return data.access_token?{token:data.access_token}:{code:'oauth-token-missing',http:res.status};
}
async function getJson(url,token){
 const res=await transport(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
 if(!res)return {http:0,code:'network-timeout'};
 let json={};
 try{json=await res.json();}catch{}
 return {http:res.status,json,code:safeCode(json?.error?.status)||null};
}
async function estimateReads(token,now=new Date()){
 const start=pacificMidnight(now);
 const metric='firestore.googleapis.com/document/read_count';
 const u=new URL('https://monitoring.googleapis.com/v3/projects/'+PROJECT+'/timeSeries');
 u.searchParams.set('filter','metric.type="'+metric+'"');
 u.searchParams.set('interval.startTime',start.toISOString());
 u.searchParams.set('interval.endTime',now.toISOString());
 u.searchParams.set('view','FULL');u.searchParams.set('pageSize','1000');
 let total=0,points=0,series=0, pages=0;
 for(let i=0;i<5;i++){
  const r=await getJson(u,token);
  if(r.http!==200)return {status:'unavailable',http:r.http,code:r.code,
   reason:'monitoring-metric-not-readable',metric};
  for(const s of r.json.timeSeries||[]){
   series++;
   for(const p of s.points||[]){
    const v=Number(p.value?.int64Value??p.value?.doubleValue);
    if(Number.isFinite(v)&&v>=0){total+=v;points++;}
   }
  }
  pages++;
  if(!r.json.nextPageToken)break;
  u.searchParams.set('pageToken',r.json.nextPageToken);
 }
 if(!points)return {status:'no-data',metric,from:start.toISOString(),
  warning:'Pas de métrique : impossible de conclure à zéro lecture.'};
 return {status:'estimate',metric,from:start.toISOString(),to:now.toISOString(),
  observedDocumentReads:Math.round(total),points,series,pages,
  freeTierReference:FREE_READ_THRESHOLD,
  apparentHeadroomToFreeThreshold:Math.max(0,FREE_READ_THRESHOLD-Math.round(total)),
  warning:'Estimation Cloud Monitoring, pas le solde facturé ni la preuve du plafond effectif ; index, lectures minimales et délais de publication peuvent manquer.'};
}
async function quotaLimits(token){
 const u=new URL('https://serviceusage.googleapis.com/v1beta1/projects/'+PROJECT+'/services/firestore.googleapis.com/consumerQuotaMetrics');
 u.searchParams.set('view','FULL');u.searchParams.set('pageSize','100');
 const r=await getJson(u,token);
 if(r.http!==200)return {status:'unavailable',http:r.http,code:r.code,
  reason:'service-usage-iam-or-api-unavailable'};
 const names=(r.json.metrics||[]).map(m=>({
  metric:String(m.metric||'').slice(0,140),
  limits:(m.consumerQuotaLimits||[]).slice(0,15).map(x=>({
   name:String(x.name||'').split('/').pop().slice(0,90),
   unit:String(x.unit||'').slice(0,90),
   effectiveLimit:Number(x.effectiveLimit||0)||null
  }))
 }));
 return {status:'available',metrics:names,warning:'Limites API, non le compteur de lectures Firestore gratuit.'};
}
async function firestoreProbe(token){
 const base='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
 const docs=[base+'/__tim_health__/readonly_probe',base+'/lessons?pageSize=1'];
 const result=[];
 for(const [i,url] of docs.entries()){
  const r=await getJson(url,token);
  const hdr={probe:i?'collection-one-only':'missing-document',http:r.http,googleStatus:r.code};
  const reasons=Array.isArray(r.json?.error?.details)?r.json.error.details.map(x=>safeCode(x?.reason)).filter(Boolean):[];
  if(reasons[0])hdr.googleReason=reasons[0];
  result.push(hdr);
  if([403,429].includes(r.http))break; // Ne pas insister si la capacité est refusée.
 }
 return result;
}
async function main(){
 fs.mkdirSync(OUT,{recursive:true});
 const summary={timestamp:new Date().toISOString(),project:PROJECT,mode:'read-only',
  note:'Jamais de copie, note, tentative, XP ou corrigé lu ou écrit.'};
 let account;
 try{account=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT||'');}catch{}
 if(!account||account.project_id!==PROJECT||!account.private_key||!account.client_email){
  summary.access='service-account-missing-or-invalid';
 }else{
  const a=await auth(account);
  if(!a.token)summary.access={status:'oauth-failed',http:a.http,reason:a.code};
  else{
   summary.access='authenticated-service-account';
   summary.reads=await estimateReads(a.token);
   summary.quotas=await quotaLimits(a.token);
   summary.firestore=await firestoreProbe(a.token);
  }
 }
 fs.writeFileSync(path.join(OUT,'quota-readonly.json'),JSON.stringify(summary,null,2));
 console.log('DIAGNOSTIC QUOTA EN LECTURE SEULE\n'+JSON.stringify(summary,null,2));
 if(summary.access!=='authenticated-service-account')process.exitCode=2;
}
if(require.main===module)main().catch(()=>{console.log('Diagnostic quota interrompu sans fuite de secret');process.exitCode=2;});
module.exports={pacificMidnight,FREE_READ_THRESHOLD,safeCode};
