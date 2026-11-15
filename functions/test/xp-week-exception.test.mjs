import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {xpPeriodStart,xpCarryActive,XP_NORMAL_RESET} from '../xp-week-exception.mjs';
function browserXp(){
 const window={};
 runInNewContext(readFileSync('xp-rules.js','utf8'),{window,Intl,Date});
 return window.TIM_XP;
}
test('Calendrier : UNE seule exemption, du lundi 16 au dimanche 22 novembre 2026',()=>{
 const periods={
  '2026-11-08':'2026-11-02',
  '2026-11-09':'2026-11-09','2026-11-14':'2026-11-09',
  '2026-11-15':'2026-11-09',
  '2026-11-16':'2026-11-09','2026-11-17':'2026-11-09',
  '2026-11-20':'2026-11-09','2026-11-22':'2026-11-09',
  '2026-11-23':'2026-11-23','2026-11-24':'2026-11-23',
  '2026-11-29':'2026-11-23',
  '2026-11-30':'2026-11-30','2026-12-07':'2026-12-07'
 };
 const client=browserXp();
 for(const [date,wanted] of Object.entries(periods)){
  assert.equal(xpPeriodStart(date),wanted,'Serveur : '+date);
  assert.equal(client.xpPeriodStart(date),wanted,'Affichage : '+date);
  assert.equal(xpCarryActive(date),date>='2026-11-16'&&date<='2026-11-22');
 }
 assert.equal(XP_NORMAL_RESET,'2026-11-23');
});
test('Ne pas décaler les vrais lundis des défis ni leurs dates de validation',()=>{
 const c=browserXp();
 assert.equal(c.monday('2026-11-16'),'2026-11-16');
 assert.equal(c.monday('2026-11-22'),'2026-11-16');
 assert.equal(c.monday('2026-11-23'),'2026-11-23');
 assert.equal(c.xpPeriodStart('2026-11-16'),'2026-11-09');
});
test('La barre du lundi 16 conserve l acquis, ajoute les nouveaux XP, puis remet à zéro le 23',()=>{
 const c=browserXp();
 const saved=[
  {day:'2026-11-14',xp:7},
  {day:'2026-11-15',xp:8},
  {day:'2026-11-16',xp:3},
  {day:'2026-11-18',xp:2}
 ];
 const calc=day=>saved.filter(x=>c.xpPeriodStart(x.day)===c.xpPeriodStart(day)).reduce((s,x)=>s+x.xp,0);
 assert.equal(calc('2026-11-16'),20);
 assert.equal(calc('2026-11-22'),20);
 assert.equal(calc('2026-11-23'),0);
});
test('Aucune date invalide acceptée côté serveur',()=>{
 for(const s of ['2026-11-31','2026-13-16','2026-11-16T00:00',''])
  assert.throws(()=>xpPeriodStart(s),/Invalid XP date/);
});
test('Les dix voies de notation utilisent la période XP exception',()=>{
 const source=readFileSync('worker/server.mjs','utf8');
 const matches=source.match(/week=xpPeriodStart\(today\)/g)||[];
 assert.equal(matches.length,10);
 assert.equal(source.includes('mondayOf(today)'),false);
 const html=readFileSync('index.html','utf8');
 const boot=readFileSync('boot.js','utf8');
 assert.match(html,/xp-rules\.js\?v=xp-barre-exception-16nov/);
 assert.match(boot,/app\.js\?v=xp-barre-exception-16nov/);
});
