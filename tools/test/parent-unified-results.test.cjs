'use strict';
/* Test du panneau Parent en mémoire seulement : aucune connexion ni écriture Firebase. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const filename=path.join(__dirname,'../../parent-unified-results.js');
const source=fs.readFileSync(filename,'utf8');
class Node {
 constructor(tag){this.tag=tag;this.className='';this.textContent='';this.children=[];}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=items;}
}
function renderCopy(record,items){
 const window={};
 const code=source.replace('window.TIM_PARENT_UNIFIED={render};','window.TIM_PARENT_UNIFIED={render,renderDetails};');
 assert.notEqual(code,source,'Point de chargement du panneau Parent introuvable');
 vm.runInNewContext(code,{window,document:{createElement:tag=>new Node(tag)},console,setTimeout,clearTimeout});
 const root=new Node('div');
 window.TIM_PARENT_UNIFIED.renderDetails(root,record,items);
 const output=[];
 const walk=n=>{output.push(String(n.textContent||''));for(const child of n.children||[])walk(child);};
 walk(root);
 return output.join('\n');
}
test('0,75/1 reste une réponse partiellement correcte et ne devient pas une erreur entière',()=>{
 const text=renderCopy({score:0.75,total:1,lesson:'Mathématiques'},[{
  question:'Quel est le résultat ?',response:'24 cm',expected:'24 cm',correct:false,
  points:0.75,explanation:'Détailler les étapes.'
 }]);
 assert.match(text,/Réponses partielles : 1/);
 assert.match(text,/Erreurs : 0/);
 assert.match(text,/Réponse partiellement correcte/);
 assert.match(text,/Points attribués : 0,75\/1/);
 assert.doesNotMatch(text,/Réponse incorrecte/);
});
test('le bilan Parent conserve les bonnes réponses et les points déjà enregistrés',()=>{
 const text=renderCopy({score:1,total:1,lesson:'Mathématiques'},[{
  question:'Quel est le périmètre ?',response:'24 cm',expected:'24 cm',correct:true,points:1
 }]);
 assert.match(text,/Réponse de Tim : 24 cm/);
 assert.match(text,/Réponse attendue : 24 cm/);
 assert.match(text,/Points attribués : 1\/1/);
});
test('l export récupère les détails des sept matières, sans consommer de tentative',()=>{
 assert(source.includes("['spanishEnt','physics','physicsEnt','mathEnt','english','svt','hg','fr']"));
 assert(source.includes('safeRead('));
 assert.doesNotMatch(source,/submitTimExercise|deleteDoc|addDoc\(/);
});


test('le Parent voit explicitement si le raisonnement n a pas été évalué automatiquement',()=>{
 const text=renderCopy({score:1,total:1,lesson:'Mathématiques'},[{
  question:'Développe',response:'2x+6',expected:'2x+6',correct:true,points:1,
  reasoning:'2x+3+3',reasoningAssessment:'not-automatically-graded'
 }]);
 assert.match(text,/démarche écrite est conservée sans évaluation automatique/);
});
