import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const app=read('app.js');
const boot=read('boot.js');
const server=read('worker/server.mjs');
const xp=read('xp-rules.js');

test('18 défis quotidiens ENT visibles ensemble, sans calendrier et sans réinitialiser de copie',()=>{
 const start=app.indexOf('function freeEntDailyPanel(compact=false){');
 const end=app.indexOf('\nfunction dailyMissionPanel(){',start);
 assert.ok(start>=0&&end>start,'Panneau des défis ENT libres absent');
 const code=app.slice(start,end);
 const exercises=Array.from({length:18},(_,i)=>({
  id:'ENTD_202611'+(i<3?'20':String(23+Math.floor((i-3)/3)))+'_0'+(i%3+1),
  kind:'daily',category:'challenge',timEntBatch:true,
  period:'2026-11-'+(i<3?'20':String(23+Math.floor((i-3)/3))),
  title:'Défi '+i,questions:Array.from({length:10},()=>({subject:'Mathématiques'}))
 }));
 const saved=new Map([[exercises[0].id,{id:exercises[0].id,score:8,xp:2}]]);
 const E=(tag,cls='',text='')=>({tag,cls,textContent:text,children:[],append(...items){this.children.push(...items);}});
 const cardAction=(title,subtitle,description,click,status)=>({tag:'card',title,subtitle,status,click});
 const button=(label,click)=>({tag:'button',label,click});
 const service={DATA:{exercises},attemptFor:id=>saved.get(id),E,cardAction,button,
  page:()=>{},openExercise:()=>{},renderExerciseIndex:()=>{}};
 const render=Function(...Object.keys(service),code+';return freeEntDailyPanel')(...Object.values(service));
 const full=render(false),list=full.children.find(item=>item.cls==='clicklist');
 assert.equal(list.children.length,18);
 assert.equal(list.children.filter(x=>x.status==='Voir la copie').length,1);
 assert.match(full.children[2].textContent,/Aucun déblocage quotidien/);
 const small=render(true),compactList=small.children.find(item=>item.cls==='clicklist');
 assert.equal(compactList.children.length,3);
 assert.ok(compactList.children.every(x=>x.status==='Faire le défi'));
 assert.equal(saved.size,1,'Les copies précédentes restent intactes');
});

test('Les défis quotidiens importés sont accessibles même jeudi, dimanche ou la semaine suivante',()=>{
 const context={window:{__TIM_CHALLENGES:{},TIM_EXERCISE:{mode:()=> 'challenge'}},Date,Intl};
 vm.runInNewContext(xp,context,{filename:'xp-rules.js'});
 const can=context.window.TIM_XP.canSubmit;
 const daily={id:'ENTD_20261127_03',kind:'daily',category:'challenge',period:'2026-11-27',timEntBatch:true};
 for(const date of ['2026-11-19T15:00:00+01:00','2026-11-22T15:00:00+01:00','2026-11-29T15:00:00+01:00'])
  assert.equal(can(daily,new Date(date)),true,date);
});

test('Samedi et dimanche ENT restent fermés en dehors de leur jour',()=>{
 const context={window:{__TIM_CHALLENGES:{},TIM_EXERCISE:{mode:()=> 'challenge'}},Date,Intl};
 vm.runInNewContext(xp,context,{filename:'xp-rules.js'});
 const can=context.window.TIM_XP.canSubmit;
 const sat={id:'ENTW_20261121',kind:'weekly',timEntBatch:true,period:'2026-11-21'};
 const sun={id:'ENTS_20261122',kind:'sunday',timEntBatch:true,period:'2026-11-22'};
 assert.equal(can(sat,new Date('2026-11-19T15:00:00+01:00')),false);
 assert.equal(can(sat,new Date('2026-11-21T15:00:00+01:00')),true);
 assert.equal(can(sat,new Date('2026-11-22T15:00:00+01:00')),false);
 assert.equal(can(sun,new Date('2026-11-21T15:00:00+01:00')),false);
 assert.equal(can(sun,new Date('2026-11-22T15:00:00+01:00')),true);
 assert.equal(can(sun,new Date('2026-11-23T15:00:00+01:00')),false);
 assert.match(server,/if\(exercise\.timEntBatch===true&&\['weekly','sunday'\]\.includes\(exercise\.kind\)\)/);
});

test('Le dimanche 22 novembre n’est pas remplacé par le dimanche 29',()=>{
 const match=boot.match(/const sundayDate=(\(\(\)=>\{const d=new Date\(missionPlan\.meta\.today[^\n]+\}\)\(\));/);
 assert.ok(match,'Calcul de la prochaine échéance dimanche absent');
 const due=Function('missionPlan','Date','return '+match[1]);
 assert.equal(due({meta:{today:'2026-11-19'}},Date),'2026-11-22');
 assert.equal(due({meta:{today:'2026-11-21'}},Date),'2026-11-22');
 assert.equal(due({meta:{today:'2026-11-22'}},Date),'2026-11-22');
 assert.equal(due({meta:{today:'2026-11-23'}},Date),'2026-11-29');
});
