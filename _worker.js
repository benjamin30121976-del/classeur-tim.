/* Cloudflare Pages advanced mode, same static website and a private /api route.
   This file does not contain service account credentials or answer keys. */
import {handleRequest} from './worker/server.mjs';
export default {
 async fetch(request,env){
  const pathname=new URL(request.url).pathname;
  if(pathname==='/api/tim'||pathname==='/api/status')return handleRequest(request,env);
  return env.ASSETS.fetch(request);
 }
};
