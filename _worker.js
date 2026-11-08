/* Cloudflare Pages advanced mode : seul le site public est servi.
   Les sources internes et les clés de correction ne sont jamais accessibles. */
import {handleRequest} from './worker/server.mjs';
export default {
 async fetch(request,env){
  const pathname=new URL(request.url).pathname;
  if(pathname==='/api/tim'||pathname==='/api/status')return handleRequest(request,env);
  let plain=pathname;
  try{plain=decodeURIComponent(pathname).toLowerCase();}catch{
   return new Response('Not found',{status:404});
  }
  if(/\/(?:worker|functions|tools|outils|\.github|browser-requests)(?:\/|$)/.test(plain)||
     /\/(?:firestore\.rules|firebase\.json|package(?:-lock)?\.json|readme\.md|clou[d]flare_spark_mise_en_service\.md|\.gitignore|\.assetsignore)(?:$|\/)/.test(plain)){
   return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  }
  return env.ASSETS.fetch(request);
 }
};
