/* Cache éphémère du catalogue COMPLET de Tim, uniquement APRÈS vérification
 * du jeton Firebase par le serveur. Ce cache ne contient ni copie, ni note,
 * ni corrigé, ni XP. Aucun catalogue Invité ne peut le remplir.
 *
 * Durée courte : 90 s, afin de réduire les lectures Firestore répétitives.
 * L'absence de cache + quota épuisé reste une indisponibilité explicite :
 * jamais un catalogue partiel affiché comme complet.
 */
import {ApiFault,TIM_UID} from './auth.mjs';

export const TIM_COURSE_CACHE_SECONDS=90;
// Cache en mémoire de l'instance du Worker, jamais le cache CDN partagé.
// Les cours privés n'ont ainsi aucun point d'accès HTTP caché ni clé publique.
const entries=new Map();
const privateMemoryCache={
 async match(key){const item=entries.get(key.url);return item?new Response(item):null;},
 async put(key,response){
  const payload=await response.text();
  entries.clear(); // Ce site ne compte qu'un utilisateur Élève.
  entries.set(key.url,payload);
 }
};
const PRIVATE_PATH='/__interne__/cache-cours-tim-complet-v1';
function complete(payload){
 return Boolean(payload&&payload.additionsIncomplete!==true&&
  Array.isArray(payload.content?.lessons)&&
  Array.isArray(payload.content?.exercises)&&
  Array.isArray(payload.additions?.lessons)&&
  Array.isArray(payload.additions?.exercises));
}
function cacheKey(request){
 const u=new URL(request.url);
 u.pathname=PRIVATE_PATH;
 u.search='';
 return new Request(u.toString(),{method:'GET'});
}
export async function authenticatedTimCourse(uid,request,loader,options={}){
 if(uid!==TIM_UID)throw new ApiFault(403,'forbidden');
 const now=options.now??(()=>Date.now());
 // Cache de processus privé : disponible entre requêtes d'une même instance du Worker.
 const cache=options.cache===undefined?privateMemoryCache:options.cache;
 const key=cache?cacheKey(request):null;
 if(cache&&key){
  try{
   const hit=await cache.match(key);
   if(hit?.ok){
    const record=await hit.json();
    if(Number.isFinite(record?.expiresAt)&&record.expiresAt>now()&&
       complete(record.value))return record.value;
   }
  }catch{ /* Aucun échec de cache ne devient une erreur de connexion. */ }
 }
 // N'accéder à Firestore que si aucune copie complète récente n'existe.
 const value=await loader();
 if(!complete(value))throw new ApiFault(503,'student-course-incomplete');
 if(cache&&key){
  try{
   await cache.put(key,new Response(JSON.stringify({
     expiresAt:now()+TIM_COURSE_CACHE_SECONDS*1000,value
    }),{headers:{'Content-Type':'application/json',
     'Cache-Control':'no-store'}}));
  }catch{ /* La réponse complète reste utilisable sans cache. */ }
 }
 return value;
}
