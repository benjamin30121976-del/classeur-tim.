/* Firestore REST client; server access is scoped by Google IAM rather than Rules.
   Credentials never enter the web bundle or responses. */
import {PROJECT,ApiFault,getFirestoreAccessToken} from './auth.mjs';
const dbRoot='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
const docName=path=>'projects/'+PROJECT+'/databases/(default)/documents/'+path;
export function fromValue(v){
 if(!v)return null;
 if('stringValue'in v)return v.stringValue;
 if('integerValue'in v)return Number(v.integerValue);
 if('doubleValue'in v)return Number(v.doubleValue);
 if('booleanValue'in v)return v.booleanValue;
 if('nullValue'in v)return null;
 if('timestampValue'in v)return v.timestampValue;
 if('arrayValue'in v)return (v.arrayValue.values||[]).map(fromValue);
 if('mapValue'in v)return fromFields(v.mapValue.fields||{});
 return null;
}
export function fromFields(fields){return Object.fromEntries(Object.entries(fields||{}).map(([k,v])=>[k,fromValue(v)]));}
export function toValue(v){
 if(v===undefined||v===null)return {nullValue:'NULL_VALUE'};
 if(v instanceof Date)return {timestampValue:v.toISOString()};
 if(typeof v==='boolean')return {booleanValue:v};
 if(typeof v==='number'){
  if(!Number.isFinite(v))throw new ApiFault(400,'invalid-data');
  return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};
 }
 if(typeof v==='string')return {stringValue:v};
 if(Array.isArray(v))return {arrayValue:{values:v.map(toValue)}};
 if(typeof v==='object')return {mapValue:{fields:toFields(v)}};
 throw new ApiFault(400,'invalid-data');
}
export function toFields(data){return Object.fromEntries(Object.entries(data||{}).filter(([k])=>k!=='__proto__').map(([k,v])=>[k,toValue(v)]));}
export function asDocument(path,data){
 return {name:docName(path),fields:toFields(data)};
}
export function fromDocument(doc){
 if(!doc)return null;
 const item=fromFields(doc.fields||{});
 if(item.payloadJson&&typeof item.payloadJson==='string'){
  try{return JSON.parse(item.payloadJson);}catch{throw new ApiFault(502,'corrupt-course-document');}
 }
 return unwrapNested(item);
}
function unwrapNested(x){
 if(Array.isArray(x))return x.map(unwrapNested);
 if(x&&typeof x==='object'){
  if(Object.keys(x).length===1&&Array.isArray(x.__tim_nested_array_v1))return x.__tim_nested_array_v1.map(unwrapNested);
  return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,unwrapNested(v)]));
 }
 return x;
}
export async function firestore(env){
 const token=await getFirestoreAccessToken(env);
 async function request(method,endpoint,body,transaction){
  const url=new URL(dbRoot+endpoint);
  if(transaction)url.searchParams.set('transaction',transaction);
  const response=await fetch(url,{method,headers:{
   Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})
  },...(body?{body:JSON.stringify(body)}:{})});
  if(response.status===404)return null;
  if(!response.ok){
   if(response.status===409)throw new ApiFault(409,'already-exists');
   if(response.status===403)throw new ApiFault(503,'firestore-service-permission');
   throw new ApiFault(502,'firestore-service-error');
  }
  return response.json();
 }
 async function get(path,tx){
  const raw=await request('GET','/'+path,null,tx);
  return raw?fromDocument(raw):null;
 }
 async function list(collectionName,max=1000){
  const result=[],limit=Math.min(500,max);let pageToken='';
  do{
   const url=new URL(dbRoot+'/'+collectionName);
   url.searchParams.set('pageSize',String(limit));
   if(pageToken)url.searchParams.set('pageToken',pageToken);
   const resp=await fetch(url,{headers:{Authorization:'Bearer '+token}});
   if(!resp.ok)throw new ApiFault(502,'firestore-list-error');
   const data=await resp.json();
   for(const doc of data.documents||[]){
    result.push({id:String(doc.name||'').split('/').pop(),data:fromDocument(doc)});
   }
   pageToken=data.nextPageToken||'';
  }while(pageToken&&result.length<max);
  return result.slice(0,max);
 }
 async function transaction(){
  const res=await request('POST',':beginTransaction',{options:{readWrite:{}}});
  if(!res?.transaction)throw new ApiFault(502,'firestore-transaction-error');
  return res.transaction;
 }
 async function commit(writes,tx){
  const res=await request('POST',':commit',{writes,transaction:tx});
  if(!res)throw new ApiFault(502,'firestore-commit-error');
  return res;
 }
 return {get,list,transaction,commit,docName};
}
export function createWrite(path,data,transform=[]){
 return {update:asDocument(path,data),currentDocument:{exists:false},...(transform.length?{updateTransforms:transform}:{})};
}
export function upsertWrite(path,data,transform=[]){
 return {update:asDocument(path,data),...(transform.length?{updateTransforms:transform}:{})};
}
export function updateWrite(path,data){
 return {update:asDocument(path,data),updateMask:{fieldPaths:Object.keys(data)}};
}
export const NOW=[{fieldPath:'submittedAt',setToServerValue:'REQUEST_TIME'}];
