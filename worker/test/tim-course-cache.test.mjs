import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticatedTimCourse,TIM_COURSE_CACHE_SECONDS} from '../tim-course-cache.mjs';
import {TIM_UID,PARENT_UID} from '../auth.mjs';
const request=new Request('https://classeur-tim-v16.pages.dev/api/tim',{method:'POST'});
const complete=()=>({
 content:{lessons:[{id:'ENT',title:'Cours ENT',blocks:[]}],
  exercises:[{id:'E1',questions:[{q:'Question',type:'mc'}]}]},
 additions:{lessons:[{id:'BIS',blocks:[]}],exercises:[{id:'E2',questions:[{q:'Deuxième',type:'mc'}]}]},
 additionsIncomplete:false
});
function mockCache(){
 const map=new Map();
 return {
  map,match:async request=>map.get(request.url)?.clone()||null,
  put:async(request,value)=>{map.set(request.url,value.clone());}
 };
}
test('cache complet : deux chargements du même Tim ne font qu une lecture Firestore',async()=>{
 const cache=mockCache();let reads=0,clock=1000;
 const loader=async()=>{reads++;return complete()};
 const opt={cache,now:()=>clock};
 const a=await authenticatedTimCourse(TIM_UID,request,loader,opt);
 const b=await authenticatedTimCourse(TIM_UID,request,loader,opt);
 assert.equal(reads,1);
 assert.deepEqual(a,b);
 assert.equal(b.additions.exercises.length,1);
 assert.equal(b.additions.lessons.length,1);
 assert.equal(cache.map.size,1);
 clock+=TIM_COURSE_CACHE_SECONDS*1000+1;
 await authenticatedTimCourse(TIM_UID,request,loader,opt);
 assert.equal(reads,2,'après expiration les nouveautés sont relues');
});
test('le cache privé exige Tim authentifié, même si la copie est disponible',async()=>{
 const cache=mockCache();
 await authenticatedTimCourse(TIM_UID,request,async()=>complete(),{cache});
 let called=false;
 await assert.rejects(()=>authenticatedTimCourse(PARENT_UID,request,async()=>{called=true;return complete()},{cache}),
  e=>e.status===403);
 assert.equal(called,false);
});
test('échec/quotas : jamais de cache vide, aucun catalogue invité dans les réponses',async()=>{
 const cache=mockCache();
 let attempts=0;
 await assert.rejects(()=>authenticatedTimCourse(TIM_UID,request,async()=>{
  attempts++;return {...complete(),additionsIncomplete:true};
 },{cache}),e=>e.status===503&&e.code==='student-course-incomplete');
 assert.equal(cache.map.size,0);
 await assert.rejects(()=>authenticatedTimCourse(TIM_UID,request,async()=>{
  attempts++;throw Object.assign(Error('quota'),{status:503});
 },{cache}),e=>e.status===503);
 assert.equal(attempts,2);
});
test('une erreur de cache ne rend pas les leçons inaccessibles',async()=>{
 const cache={match:async()=>{throw Error('edge indisponible')},
  put:async()=>{throw Error('edge indisponible')}};
 const x=await authenticatedTimCourse(TIM_UID,request,async()=>complete(),{cache});
 assert.equal(x.content.lessons[0].id,'ENT');
});
