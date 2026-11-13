/* Maths ENT : exercices réellement fournis par Mme Pialet (PDF de Tim).
   2026-11-02 : fiche de 6 programmes de calcul (verso du PDF de 4 pages).
   2026-10-09 : les 3 cases du haut de la fiche d'application directe de Thalès.
   Les exercices du manuel Mission Indigo 2016 sont hors de cette banque : aucune
   page du manuel n'a été recopiée sans texte original transmis par la famille.
   Les corrigés demeurent UNIQUEMENT côté Cloudflare Worker. */
export const MATH_ENT_VERSION='math-ent-20261112-v1';
export const MATH_ENT_IDS=['ME_ENT_PROGRAMMES','ME_ENT_THALES3'];
export const mathEntId=id=>MATH_ENT_IDS.includes(id);
const PROGRAMMES=[
 {id:'P1',steps:['Choisis un nombre.','Soustrais 9.','Multiplie par 2.','Ajoute le triple du nombre de départ.'],expected:'5x - 18',
  why:'On part de x : 2(x − 9) + 3x = 2x − 18 + 3x = 5x − 18.'},
 {id:'P2',steps:['Choisis un nombre.','Multiplie par −3.','Ajoute le carré du nombre de départ.','Ajoute 2.'],expected:'x² − 3x + 2',
  why:'À partir de x : −3x + x² + 2 = x² − 3x + 2.'},
 {id:'P3',steps:['Choisis un nombre.','Ajoute 5.','Multiplie par le nombre de départ.','Soustrais 8.'],expected:'x² + 5x − 8',
  why:'À partir de x : x(x + 5) − 8 = x² + 5x − 8.'},
 {id:'P4',steps:['Choisis un nombre.','Multiplie par 2.','Ajoute 3.','Multiplie par −4.','Ajoute 4.'],expected:'−8x − 8',
  why:'À partir de x : −4(2x + 3) + 4 = −8x − 12 + 4 = −8x − 8.'},
 {id:'P5',steps:['Choisis un nombre.','Ajoute 7.','Multiplie par 3.','Ajoute le cube du nombre de départ.'],expected:'x³ + 3x + 21',
  why:'À partir de x : 3(x + 7) + x³ = x³ + 3x + 21.'},
 {id:'P6',steps:['Choisis un nombre.','Ajoute 1.','Mets le résultat au carré.','Soustrais le double du nombre de départ.'],expected:'x² + 1',
  why:'À partir de x : (x + 1)² − 2x = x² + 2x + 1 − 2x = x² + 1.'}
];
const THALES=[
 {id:'T1',title:'Case 1 — Triangles emboîtés',intersection:'A',parallel:'(NM) et (CB)',
  first:'(AC) et (AB)',ratios:'AN/AC = AM/AB = NM/CB',given:'AN = 2 ; AC = 5 ; AB = 6 ; MN = 3,5.',
  a:'AM',aValue:2.4,b:'BC',bValue:8.75,
  why:'AN/AC = AM/AB = MN/BC. Donc AM = 2 × 6 / 5 = 2,4 et BC = 3,5 × 5 / 2 = 8,75.'},
 {id:'T2',title:'Case 2 — Triangles emboîtés',intersection:'E',parallel:'(IJ) et (GF)',
  first:'(EG) et (EF)',ratios:'EJ/EG = EI/EF = IJ/FG',given:'EJ = 4 ; FG = 8 ; EI = 3 ; EG = 10.',
  a:'EF',aValue:7.5,b:'IJ',bValue:3.2,
  why:'EJ/EG = EI/EF = IJ/FG. Donc EF = 3 × 10 / 4 = 7,5 et IJ = 4 × 8 / 10 = 3,2.'},
 {id:'T3',title:'Case 3 — Configuration papillon',intersection:'T',parallel:'(RS) et (UV)',
  first:'(RV) et (SU)',ratios:'TR/TV = TS/TU = RS/UV',given:'TU = 3 ; UV = 4 ; TV = 5 ; RS = 6.',
  a:'RT',aValue:7.5,b:'TS',bValue:4.5,
  why:'TR/TV = TS/TU = RS/UV = 6/4 = 1,5. Donc RT = 1,5 × 5 = 7,5 et TS = 1,5 × 3 = 4,5.'}
];
function makeTask(id){
 if(id==='ME_ENT_PROGRAMMES')return {
  id,kind:'programmes',title:'Fiche ENT — Six programmes de calcul',
  source:'Fiche de travail sur l’égalité des 3 rapports et programmes de calcul',
  date:'2026-11-02',due:'2026-11-05',bankVersion:MATH_ENT_VERSION,
  total:10,lessonId:'MBIS13',scale:'Six expressions à écrire. Note ramenée sur 10.',
  fields:PROGRAMMES.map((p,i)=>({id:p.id,group:i+1,kind:'expression',
   label:'Programme n°'+(i+1)+' — expression littérale associée, réduite si possible',
   steps:[...p.steps],placeholder:'Avec x comme nombre de départ : …'}))
 };
 if(id==='ME_ENT_THALES3')return {
  id,kind:'thales',title:'Fiche ENT — Thalès, trois premières cases',
  source:'Fiche d’exercices 3e : Théorème de Thalès (les 3 premières cases de la première ligne)',
  date:'2026-10-09',due:'2026-10-12',bankVersion:MATH_ENT_VERSION,
  total:10,lessonId:'MBIS14',scale:'15 réponses : 5 par figure, note ramenée sur 10.',
  cases:THALES.map(x=>({id:x.id,title:x.title,first:x.first,parallel:x.parallel,given:x.given,values:[x.a,x.b],ratioHint:'Écris les trois fractions égales, par exemple AB/AC = AD/AE = BD/CE.'})),
  fields:THALES.flatMap((t,i)=>[
   {id:t.id+'_inter',group:i+1,kind:'point',label:'Les droites '+t.first+' sont sécantes en quel point ?'},
   {id:t.id+'_para',group:i+1,kind:'parallel',label:'Les droites '+t.parallel+' sont-elles parallèles ou sécantes ?'},
   {id:t.id+'_ratio',group:i+1,kind:'ratios',label:'D’après le théorème de Thalès, écris les trois rapports égaux.'},
   {id:t.id+'_a',group:i+1,kind:'number',label:'Calcule '+t.a+'.',unit:'cm'},
   {id:t.id+'_b',group:i+1,kind:'number',label:'Calcule '+t.b+'.',unit:'cm'}
  ])
 };
 return null;
}
export const mathEntPublicTask=makeTask;
const trim=v=>String(v??'').trim();
const numeric=v=>{
 const s=trim(v).toLowerCase().replace(/[ \u00a0]/g,'').replace(/[−–]/g,'-').replace(/,/g,'.').replace(/cm$/,'');
 return /^[-+]?\d+(\.\d+)?$/.test(s)?Number(s):NaN;
};
const polyZero=()=>[0,0,0,0],polyConst=n=>[n,0,0,0];
const polyX=()=>[0,1,0,0];
const polyAdd=(a,b)=>a.map((n,i)=>n+b[i]);
const polyScale=(a,n)=>a.map(v=>v*n);
function polyMul(a,b){
 const c=polyZero();
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){
  if(i+j>=4){if(Math.abs(a[i]*b[j])>1e-9)throw Error('degree-too-high');}
  else c[i+j]+=a[i]*b[j];
 }
 if(c.some(v=>Math.abs(v)>1e7))throw Error('magnitude-too-high');
 return c;
}
function tokenize(input){
 let s=trim(input).replace(/²/g,'^2').replace(/³/g,'^3')
  .replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/\s/g,'')
  .replace(/,/g,'.').replace(/X/g,'x');
 if(s.length>120)throw Error('expression-too-long');
 const parts=s.match(/\d+(?:\.\d+)?|x|[()+*^-]/g)||[];
 if(!parts.length||parts.join('')!==s)throw Error('invalid-character');
 const out=[];
 for(const t of parts){
  const prev=out[out.length-1];
  if(prev&&(/^\d/.test(prev)||prev==='x'||prev===')')&&(t==='x'||t==='('||/^\d/.test(t)))out.push('*');
  out.push(t);
 }
 return out;
}
function parsePolynomial(input){
 const tokens=tokenize(input);let i=0;
 function take(k){if(tokens[i]===k){i++;return true;}return false;}
 function atom(){
  if(take('(')){const p=expr();if(!take(')'))throw Error('unclosed');return p;}
  if(tokens[i]==='x'){i++;return polyX();}
  if(/^\d/.test(tokens[i]||'')){const n=Number(tokens[i++]);if(!Number.isFinite(n)||n>1e5)throw Error('invalid-number');return polyConst(n);}
  throw Error('invalid-term');
 }
 function pow(){
  if(take('+'))return pow();
  if(take('-'))return polyScale(pow(),-1);
  let p=atom();
  if(take('^')){
   const n=Number(tokens[i++]);
   if(!Number.isInteger(n)||n<0||n>3)throw Error('invalid-power');
   let o=polyConst(1);for(let j=0;j<n;j++)o=polyMul(o,p);p=o;
  }
  return p;
 }
 function term(){
  let a=pow();
  while(take('*'))a=polyMul(a,pow());
  return a;
 }
 function expr(){
  let a=term();
  while(i<tokens.length&&(['+','-'].includes(tokens[i]))){
   const op=tokens[i++],b=term();a=polyAdd(a,polyScale(b,op==='+'?1:-1));
  }
  return a;
 }
 const result=expr();
 if(i!==tokens.length)throw Error('unparsed');
 return result;
}
function sameExpression(a,b){
 try{const x=parsePolynomial(a),y=parsePolynomial(b);return x.every((v,i)=>Math.abs(v-y[i])<1e-7);}
 catch{return false;}
}
function correctRatio(input,ratio){
 const norm=x=>String(x).replace(/\([^)]*\)/g,m=>m.replace(/[()]/g,'')).toUpperCase().replace(/\s/g,'').replace(/÷/g,'/').replace(/:/g,'/').replace(/,/g,'.');
 const parts=norm(input).split('=');
 if(parts.length!==3)return false;
 const expected=norm(ratio).split('=');
 const canon=parts.map(x=>x.replace(/[^A-Z/]/g,'')).sort().join('|');
 const forward=expected.map(x=>x.replace(/[^A-Z/]/g,'')).sort().join('|');
 const reverse=expected.map(x=>x.split('/').reverse().join('/')).sort().join('|');
 return canon===forward||canon===reverse;
}
function thalesField(field,response){
 const group=Number(field.group)-1,t=THALES[group];
 switch(field.kind){
  case 'point':return trim(response).toUpperCase().replace(/[^A-Z]/g,'')===t.intersection;
  case 'parallel':return /^parall[eè]les?$/i.test(trim(response))||trim(response).toLowerCase()==='paralleles';
  case 'ratios':return correctRatio(response,t.ratios);
  case 'number':return Number.isFinite(numeric(response))&&Math.abs(numeric(response)-(field.id.endsWith('_a')?t.aValue:t.bValue))<1e-4;
 }
 return false;
}
export function gradeMathEnt(id,answers,version){
 if(!mathEntId(id)||version!==MATH_ENT_VERSION||!Array.isArray(answers))throw Error('invalid-task');
 const task=makeTask(id);
 if(answers.length!==task.fields.length||answers.some(x=>typeof x!=='string'||!x.trim()||x.length>160))
  throw Error('invalid-answers');
 let items;
 if(id==='ME_ENT_PROGRAMMES')items=task.fields.map((f,i)=>({
  prompt:f.label,group:f.group,response:answers[i],expected:PROGRAMMES[i].expected,
  correct:sameExpression(answers[i],PROGRAMMES[i].expected),
  explanation:PROGRAMMES[i].why
 }));
 else items=task.fields.map((f,i)=>{
  const t=THALES[f.group-1];
  const expected=f.kind==='point'?t.intersection:f.kind==='parallel'?'parallèles':
   f.kind==='ratios'?t.ratios:f.id.endsWith('_a')?String(t.aValue).replace('.',','):String(t.bValue).replace('.',',');
  return {prompt:f.label,group:f.group,response:answers[i],expected,
   correct:thalesField(f,answers[i]),explanation:t.why};
 });
 const correctFields=items.filter(x=>x.correct).length;
 return {id,kind:'mathsEnt',subject:'Mathématiques',lessonId:task.lessonId,title:task.title,
  source:task.source,bankVersion:MATH_ENT_VERSION,scale:task.scale,
  score:Math.round(correctFields/items.length*10),total:10,
  correctFields,fieldCount:items.length,errorCounts:correctFields===items.length?{}:{[id]:items.length-correctFields},
  items};
}
export const MATH_ENT_TEST={parsePolynomial,sameExpression,PROGRAMMES,THALES};
