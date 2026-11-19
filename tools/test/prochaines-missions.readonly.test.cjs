'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

// Exécuter le vrai code de l'onglet "À venir" en lecture seule.
// Aucun navigateur authentifié, aucune soumission, aucun appel réseau.
const source=fs.readFileSync(path.join(__dirname,'../../prochaines-missions.js'),'utf8');
function planner(){
  const context={window:{},Date,Intl,console};
  vm.runInNewContext(source,context,{filename:'prochaines-missions.js'});
  return context;
}
const question=()=>({type:'text',q:'Répondre',right:'oui',
  why:'Il faut justifier la réponse avec les connaissances de la leçon étudiée.'});
const bonus=(id,entId,due)=>({id,subject:'Anglais',category:'bonus',
  homeworkBonus:true,linkedHomework:[entId],homeworkDue:due,
  questions:Array.from({length:10},question)});

test('les travaux J+2, J+3, J+4, J+7 et leurs bonus sont reconnus',()=>{
  const c=planner();
  c.window.TIM_ANGLAIS_PACK={homework:[
    {id:'entJ2',title:'Révision anglais',due:'2026-11-20',content:'Apprendre la leçon'}]};
  const data={metadata:{timEntHomework:[
    {id:'entJ2',subject:'Anglais',title:'Révision anglais',due:'2026-11-20'},
    {id:'entJ3',subject:'Anglais',title:'Révision anglais J3',due:'2026-11-21'},
    {id:'entJ4',subject:'Anglais',title:'Révision anglais J4',due:'2026-11-22'},
    {id:'entTomorrow',subject:'Anglais',title:'Révision de demain',due:'2026-11-19'}]},
  exercises:[
    {id:'entJ7',entId:'entJ7',subject:'Anglais',category:'school',
      title:'Devoir ENT J7',homeworkDue:'2026-11-25',questions:[question()]},
    bonus('B1','entJ2','2026-11-20'),bonus('B2','entJ2','2026-11-20'),
    bonus('B3','entJ2','2026-11-20'),bonus('B4','entJ4','2026-11-22'),
    bonus('B5','entJ7','2026-11-25')
  ]};
  const r=c.window.TIM_NEXT_MISSIONS.collect(data,new Date('2026-11-18T12:00:00Z'));
  assert.equal(r.later.length,4,'J+1 ne va pas dans À venir');
  assert.deepEqual(Array.from(r.later,x=>x.due),[
    '2026-11-20','2026-11-21','2026-11-22','2026-11-25']);
  assert.equal(r.later.find(x=>x.id==='entJ2').bonusCount,3,
    'ne pas limiter les 3 exercices à 2');
  assert.equal(r.later.find(x=>x.id==='entJ3').bonusCount,0,
    'une préparation manquante doit être identifiable');
  assert.equal(r.withBonus,3);
  assert.equal(r.withoutBonus,1);
  assert.equal(r.later.find(x=>x.id==='entJ7').subject,'Anglais');
});

test('la présentation permet toutes les séries, sans simulation de copie',()=>{
  assert.match(source,/for\(const ex of available\)\s*\{/);
  assert.doesNotMatch(source,/for\(const ex of available\.slice\(0,2\)\)/);
  assert.match(source,/Aucun exercice bonus associé précisément/);
});
