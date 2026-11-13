import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../app.js',import.meta.url),'utf8');
const start=source.search(/function openExercise\(id(?:,options=\{\})?\)\{/);
const end=source.indexOf("\ndocument.getElementById('exercise-search')",start);
assert.ok(start>=0&&end>start,'Correction manquante dans app.js');
const code=source.slice(start,end);
function element(tag='div',cls='',text=''){
 const n={tag,cls,textContent:String(text??''),style:{},children:[],listeners:{},value:''};
 n.classList={add(){},remove(){},toggle(){}};
 n.append=(...xs)=>n.children.push(...xs);
 n.replaceChildren=(...xs)=>{n.children=[...xs];};
 n.addEventListener=(key,fn)=>{n.listeners[key]=fn;};
 n.querySelectorAll=(sel)=>{
  const out=[];const visit=p=>{for(const x of p.children){out.push(x);visit(x);}};visit(n);
  return sel==='*'?out:sel==='.q'?out.filter(x=>x.cls==='q'):sel==='input'?out.filter(x=>x.tag==='input'):[];
 };
 n.querySelector=sel=>sel==='button.btn'?n.querySelectorAll('*').find(x=>x.tag==='button'&&x.cls==='btn'):null;
 n.insertBefore=(x,ref)=>{const i=n.children.indexOf(ref);n.children.splice(i<0?n.children.length:i,0,x);};
 return n;
}
const all=n=>[n,...n.children.flatMap(all)];
function harness(saved){
 const exercise={id:'DAY_20261109_01',kind:'daily',title:'Exemple',level:'Mission quotidienne',description:'2 questions',lesson:'L01',
  questions:[{type:'text',q:'Écris hola',sourceId:'SRC:0'},{type:'text',q:'Écris gracias',sourceId:'SRC:1'}]};
 const DATA={lessons:[{id:'L01',title:'Se présenter'}],exercises:[{id:'SRC',lesson:'L01'},exercise]};
 const detail=element('div'),index=element('div'),alerts=[];
 const document={getElementById:id=>id==='exercise-detail'?detail:id==='exercise-index'?index:element(),querySelector:()=>null};
 const window={__TIM_GUEST:false,__TIM_PARENT:false,__CLOUD_ATTEMPTS:saved?[saved]:[],__TIM_BRIDGE:{submit:async()=>saved,refresh:async()=>{}}};
 const button=(label,fn,cls)=>{const n=element('button',cls,label);n.listeners.click=fn;return n;};
 const services={DATA,document,window,E:element,button,badge:t=>element('span','badge',t),notice:t=>element('div','note',t),
  safe:v=>String(v??''),page:()=>{},clear:n=>(n.replaceChildren(),n),lessonBy:id=>DATA.lessons.find(x=>x.id===id),
  exerciseBy:id=>DATA.exercises.find(x=>x.id===id),attemptFor:id=>window.__CLOUD_ATTEMPTS.find(x=>x.id===id),
  drafts:()=>({}),makeAttachmentPanel:()=>element(),v7Feedback:()=>element('div','reaction','Loup'),
  scrollTop:()=>{},openLesson:()=>{},v7NewAttempt:()=>{},DRAFT_KEY:'draft',save:()=>{},
  confirm:()=>true,alert:msg=>alerts.push(msg),exerciseDescription:ex=>ex.description};
 const openExercise=Function(...Object.keys(services),code+';return openExercise')(...Object.values(services));
 return {exercise,detail,alerts,window,openExercise};
}
const result={id:'DAY_20261109_01',date:'2026-11-09T18:00:00Z',score:1,total:2,xp:-1,
 correctionStatus:'released',correctionLocked:false,needsReview:false,
 answers:[{question:'Écris hola',response:'hola',correct:true,expected:'hola'},
  {question:'Écris gracias',response:'merci',correct:false,expected:'gracias',explanation:'Gracias signifie merci.'}]};
test('Le résultat présente la note avant les XP, puis les réponses et les leçons',()=>{
 const h=harness(structuredClone(result));h.openExercise(h.exercise.id);
 const nodes=all(h.detail),texts=nodes.map(x=>x.textContent);
 for(const label of ['Ta note : 1/2','XP attribués : -1 XP','Correction détaillée : 1/2',
  'Réponse attendue : gracias','Explication : Gracias signifie merci.','Revoir la leçon : Se présenter'])
  assert.ok(texts.includes(label),'Élément absent : '+label);
 const summary=nodes.find(x=>x.id==='challenge-result-summary');
 const correction=nodes.find(x=>x.id==='challenge-detailed-correction');
 assert.ok(summary&&correction);
 assert.ok(h.detail.children.indexOf(summary)<h.detail.children.indexOf(correction));
 assert.ok(!nodes.some(x=>x.cls==='panel'&&x.children.some(y=>y.cls==='q')));
});
test('Une réussite parfaite reste relisible sans correction détaillée',()=>{
 const perfect=structuredClone(result);
 perfect.score=2;perfect.total=2;perfect.xp=3;
 perfect.answers[1]={question:'Écris gracias',response:'gracias',correct:true,expected:'gracias',explanation:'Réponse bien écrite.'};
 const h=harness(perfect);h.openExercise(h.exercise.id);
 const texts=all(h.detail).map(x=>x.textContent);
 assert.ok(texts.includes('Ta note : 2/2'));
 assert.ok(texts.includes('Toutes les réponses sont correctes — aucune correction nécessaire.'));
 assert.ok(texts.includes('Revoir mon exercice — questions et réponses'));
 assert.ok(texts.includes('Ma réponse : gracias'));
 assert.ok(!texts.some(x=>x.startsWith('Réponse attendue :')||x.startsWith('Correction détaillée :')||x.startsWith('Explication :')));
 assert.ok(!texts.includes('Valider définitivement cet exercice'));
});
test('Si la correction ne se charge pas, Tim peut la recharger sans recommencer',()=>{
 const h=harness({...structuredClone(result),score:null,total:null,answers:[],correctionLocked:true});
 h.openExercise(h.exercise.id);
 const texts=all(h.detail).map(x=>x.textContent);
 assert.ok(texts.includes('Actualiser ma note et mon corrigé'));
 assert.ok(!texts.includes('Valider définitivement cet exercice'));
});
test('Une validation montre le résultat directement sans alerte XP isolée',async()=>{
 const h=harness();h.window.__TIM_BRIDGE.submit=async()=>structuredClone(result);
 h.openExercise(h.exercise.id);
 const first=all(h.detail),inputs=first.filter(x=>x.tag==='input'&&x.type==='text');
 assert.equal(inputs.length,2);inputs[0].value='hola';inputs[1].value='merci';
 const submit=first.find(x=>x.textContent==='Valider définitivement cet exercice');
 assert.ok(submit);await submit.listeners.click();
 assert.equal(h.window.__CLOUD_ATTEMPTS.length,1);
 assert.deepEqual(h.alerts,[]);
 const texts=all(h.detail).map(x=>x.textContent);
 assert.ok(texts.includes('Ta note : 1/2'));
 assert.ok(texts.includes('Correction détaillée : 1/2'));
});

test("Revoir une animation n'enregistre aucune nouvelle tentative et garde les XP existants",async()=>{
 const h=harness(structuredClone(result));
 let called=0,seen=null;
 h.window.TIM_ANIMATIONS={playResult:async(ex,saved)=>{called++;seen={id:ex.id,xp:saved.xp};}};
 const original=JSON.stringify(h.window.__CLOUD_ATTEMPTS);
 h.openExercise(h.exercise.id);
 const replay=all(h.detail).find(x=>x.cls?.includes('replay-result-animation'));
 assert.ok(replay,'Bouton de relecture XP absent de la copie déjà terminée');
 await replay.listeners.click();
 assert.equal(called,1);
 assert.deepEqual(seen,{id:h.exercise.id,xp:-1});
 assert.equal(JSON.stringify(h.window.__CLOUD_ATTEMPTS),original,'Copie/XP modifiés en rejouant seulement la vidéo');
 assert.ok(!all(h.detail).some(x=>x.textContent==='Valider définitivement cet exercice'));
});
