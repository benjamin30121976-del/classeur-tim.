/* Authentication for Cloudflare Pages, no Firebase Cloud Functions (Spark-compatible).
   Do not log tokens, service account keys or JWT payloads. */
export const PROJECT='classeur-ba3e7';
export const TIM_UID='uqZI3Up97YWzKvWhssWQidn4TJO2';
export const PARENT_UID='BPEuNAhHVyX8ewQ2I54s56m11vj1';
export class ApiFault extends Error{
 constructor(status,code,message){super(message||code);this.status=status;this.code=code;}
}
const TE=new TextEncoder();
function fromBase64Url(v){
 const x=v.replace(/-/g,'+').replace(/_/g,'/'),raw=atob(x+'='.repeat((4-x.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function toBase64Url(bytes){
 let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function parseJwt(jwt){
 if(typeof jwt!=='string'||jwt.length>12000)throw new ApiFault(401,'unauthenticated');
 const parts=jwt.split('.');
 if(parts.length!==3)throw new ApiFault(401,'unauthenticated');
 try{
  return {header:JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0]))),
   body:JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1]))),
   signature:fromBase64Url(parts[2]),signed:TE.encode(parts[0]+'.'+parts[1])};
 }catch{throw new ApiFault(401,'unauthenticated');}
}
let cachedKeys=null;
async function googleKeys(){
 if(cachedKeys&&Date.now()<cachedKeys.expires)return cachedKeys.keys;
 const r=await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
 if(!r.ok)throw new ApiFault(503,'identity-service-unavailable');
 const keys=(await r.json()).keys||[];
 const maxAge=Number(/max-age=(\d+)/.exec(r.headers.get('cache-control')||'')?.[1]||1800);
 cachedKeys={keys,expires:Date.now()+Math.min(3600,Math.max(60,maxAge-60))*1000};
 return keys;
}
export async function verifyFirebaseToken(header){
 const match=/^Bearer\s+(\S+)$/i.exec(header||'');
 if(!match)throw new ApiFault(401,'unauthenticated');
 const jwt=parseJwt(match[1]),now=Math.floor(Date.now()/1000);
 if(jwt.header.alg!=='RS256'||!jwt.header.kid)throw new ApiFault(401,'unauthenticated');
 const p=jwt.body;
 if(p.aud!==PROJECT||p.iss!=='https://securetoken.google.com/'+PROJECT||
  !p.sub||typeof p.sub!=='string'||p.sub.length>128||
  !Number.isFinite(p.iat)||p.iat>now||!Number.isFinite(p.exp)||p.exp<=now||
  !Number.isFinite(p.auth_time)||p.auth_time>now)throw new ApiFault(401,'unauthenticated');
 const key=(await googleKeys()).find(k=>k.kid===jwt.header.kid);
 if(!key)throw new ApiFault(401,'unauthenticated');
 const imported=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,jwt.signature,jwt.signed))
  throw new ApiFault(401,'unauthenticated');
 if(p.sub!==TIM_UID&&p.sub!==PARENT_UID)throw new ApiFault(403,'forbidden');
 return p.sub;
}
function privateKeyBuffer(pem){
 const clean=String(pem||'').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
 if(!clean)throw new ApiFault(503,'service-credential-invalid');
 return Uint8Array.from(atob(clean),c=>c.charCodeAt(0));
}
let cachedAccess=null;
export async function getFirestoreAccessToken(env){
 let account;
 try{account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT||'');}catch{throw new ApiFault(503,'service-account-not-configured');}
 if(account.project_id!==PROJECT||!account.client_email||!account.private_key||
  !String(account.client_email).endsWith('.gserviceaccount.com'))
  throw new ApiFault(503,'service-account-invalid');
 if(cachedAccess?.email===account.client_email&&Date.now()+60000<cachedAccess.expires)return cachedAccess.token;
 const key=await crypto.subtle.importKey('pkcs8',privateKeyBuffer(account.private_key),
  {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const now=Math.floor(Date.now()/1000),h={alg:'RS256',typ:'JWT'};
 const payload={iss:account.client_email,scope:'https://www.googleapis.com/auth/datastore',
  aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3300};
 const unsigned=toBase64Url(TE.encode(JSON.stringify(h)))+'.'+toBase64Url(TE.encode(JSON.stringify(payload)));
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,TE.encode(unsigned));
 const assertion=unsigned+'.'+toBase64Url(new Uint8Array(signature));
 const body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion});
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
 if(!r.ok)throw new ApiFault(503,'service-account-permission');
 const answer=await r.json();
 if(!answer.access_token)throw new ApiFault(503,'service-account-permission');
 cachedAccess={email:account.client_email,token:answer.access_token,
  expires:Date.now()+Number(answer.expires_in||3300)*1000};
 return answer.access_token;
}
