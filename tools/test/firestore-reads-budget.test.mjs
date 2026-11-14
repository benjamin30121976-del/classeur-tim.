import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../../boot.js',import.meta.url),'utf8');
const take=(startMarker,endMarker)=>{
 const a=code.indexOf(startMarker),b=code.indexOf(endMarker,a);
 assert(a>=0&&b>a,'Fonction introuvable : '+startMarker);
 return code.slice(a,b);
};
const fetchSource=take('async function fetchAttempts(content){','\nfunction stopApp()');
const spanishSource=take(' const loadSpanishProgress=async()=>{','\n /* Reprise du compteur existant');
const roleIds={parent:'PARENT_FICTIF',tim:'TIM_FICTIF'};
function mock(role){
 const reads={attempts:0,privateAttempts:0};
 const a={id:'SPQ_L01_01',data:()=>({authorUid:roleIds.tim,xp:1,correctionStatus:'pending-parent',
  submittedAt:{toDate:()=>new Date('2026-11-12T10:00:00Z')}})};
 const p={id:'SPQ_L01_01',data:()=>({score:9,answers:[{question:'Hola',response:'hola',correct:true,expected:'hola',explanation:'Réponse juste'}]})};
 const data={attempts:[a],privateAttempts:[p]};
 const docs=(items)=>({docs:items,forEach:(callback)=>items.forEach(callback)});
 const getDocs=async q=>{
  reads[q.collection]++;
  if(!Object.hasOwn(data,q.collection))throw Error('Collection inconnue : '+q.collection);
  return docs(data[q.collection]);
 };
 const window={__TIM_DATA:{exercises:[{id:'SPQ_L01_01',kind:'training',title:'Espagnol',lesson:'L01',questions:[{type:'text'}]}]},
  __CLOUD_ATTEMPTS:[],__TIM_SPANISH_PROGRESS:null};
 const activeUser={uid:roleIds[role]};
 const refs={activeUser,TIM_UID:roleIds.tim,PARENT_UID:roleIds.parent,window,
  getDocs,collection:(_db,collection)=>({collection}),query:q=>q,where:()=>({}),db:{},
  isMissionId:()=>false,cloudCallable:()=>()=>{throw Error('Aucun serveur appelé dans ce test')},
  document:{dispatchEvent:()=>{}},Event:class{},console,Date};
 const evaluator=Function(...Object.keys(refs),
  'let nextSpanishProgressSnapshot=null;\n'+
  "const trainingId=/^SP[QW]_L(?:0[1-9]|1[0-5])_0[1-5]$/;\n"+
  fetchSource+'\n'+spanishSource+
  '\nreturn {fetchAttempts,loadSpanishProgress};');
 const methods=evaluator(...Object.values(refs));
 return {reads,window,methods};
}
for(const role of ['parent','tim']){
 test('Un seul chargement initial des tentatives pour le suivi espagnol ('+role+')',async()=>{
  const h=mock(role),content={exercises:h.window.__TIM_DATA.exercises};
  await h.methods.fetchAttempts(content);
  assert.equal(h.reads.attempts,1);
  assert.equal(h.reads.privateAttempts,role==='parent'?1:0);
  await h.methods.loadSpanishProgress();
  assert.equal(h.reads.attempts,1,'Le suivi initial ne doit pas relire les tentatives');
  assert.equal(h.reads.privateAttempts,role==='parent'?1:0,'Pas de deuxième lecture des copies');
  const progress=h.window.__TIM_SPANISH_PROGRESS;
  assert.equal(progress.status,'ok');
  assert.equal(progress.attempts.length,1);
  assert.equal(progress.attempts[0].xp,1);
  if(role==='parent')assert.equal(progress.attempts[0].score,9,'Note d origine conservée');
  await h.methods.loadSpanishProgress();
  assert.equal(h.reads.attempts,2,'Actualisation explicite doit relire les tentatives');
  assert.equal(h.reads.privateAttempts,role==='parent'?2:0,'Actualisation Parent fraîche');
  assert.equal(h.window.__CLOUD_ATTEMPTS[0].xp,1,'XP inchangés');
 });
}
test('Pas de cache persistant ni de lecture des résultats Tim sur le compte Invité',()=>{
 assert(code.includes('nextSpanishProgressSnapshot=null; // usage unique'));
 assert(code.includes('function stopApp(){if(window.__TIM_GUEST)return;nextSpanishProgressSnapshot=null;'));
 assert(!fetchSource.includes('setDoc('),'Aucune écriture de résultats dans le chargement des tentatives');
});
