/* Cloudflare Pages advanced mode : seul le site public est servi.
   Les sources internes et les clés de correction ne sont jamais accessibles. */
import {handleRequest} from './worker/server.mjs';
export default {
 async fetch(request,env){
  const pathname=new URL(request.url).pathname;
  if(pathname==='/api/ent-connectivity-probe'){
    const targets=[
      ['sso','https://sso.mon-ent-occitanie.fr/oidc/.well-known'],
      ['cas','https://cas.mon-ent-occitanie.fr/'],
      ['educonnect','https://educonnect.education.gouv.fr/']
    ];
    const status={};
    for(const [label,url] of targets){
      try{
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),8000);
        try{
          const resp=await fetch(url,{method:'GET',redirect:'manual',signal:controller.signal,
            headers:{'Accept':'application/json'}});
          status[label]={http:resp.status};
        } finally {clearTimeout(timer);}
      }catch(err){status[label]={error:err && err.name ? String(err.name) : 'NetworkError'};}
    }
    return new Response(JSON.stringify({probe:'public-only',status}),{
      status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}
    });
  }
  if(pathname==='/api/tim'||pathname==='/api/status')return handleRequest(request,env);
  let plain=pathname;
  try{plain=decodeURIComponent(pathname).toLowerCase();}catch{
   return new Response('Not found',{status:404});
  }
  if(/\/(?:worker|functions|tools|outils|\.github|browser-requests)(?:\/|$)/.test(plain)||
     /\/(?:firestore\.rules|firebase\.json|package(?:-lock)?\.json|readme\.md|clou[d]flare_spark_mise_en_service\.md|_worker\.js|\.gitignore|\.assetsignore)(?:$|\/)/.test(plain)){
   return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  }
  return env.ASSETS.fetch(request);
 }
};
