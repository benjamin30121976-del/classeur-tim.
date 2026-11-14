/* Vérification déterministe d'un calcul de périmètre.
 * L'élève écrit librement ses opérations et sa conclusion.
 * L'évaluation ne se fonde JAMAIS sur le nombre de caractères.
 * Ne pas traiter une rédaction libre générale comme une preuve automatiquement comprise.
 */
const EPS=1e-9;
const close=(a,b)=>Math.abs(a-b)<EPS;
const isScalar=v=>v.ok&&close(v.l,0)&&close(v.w,0);
const lin=(l,w,k,ok=true)=>({l,w,k,ok});
const plus=(a,b,sign=1)=>lin(a.l+sign*b.l,a.w+sign*b.w,a.k+sign*b.k,a.ok&&b.ok);
const scale=(v,s)=>lin(v.l*s,v.w*s,v.k*s,v.ok&&Number.isFinite(s));
function multiply(a,b){
 if(!a.ok||!b.ok||(!isScalar(a)&&!isScalar(b)))return lin(0,0,0,false);
 return isScalar(a)?scale(b,a.k):scale(a,b.k);
}
function divide(a,b){
 if(!isScalar(b)||close(b.k,0))return lin(0,0,0,false);
 return scale(a,1/b.k);
}
function parseMath(input,length,width){
 let text=String(input||'').replace(/\s+/g,'').replace(/−/g,'-');
 // Autoriser 2(8+4) et (8+4)2 sans obliger une multiplication typographiée.
 text=text.replace(/(\d)\(/g,'$1*(').replace(/\)(\d)/g,')*$1').replace(/\)\(/g,')*(');
 const tokens=text.match(/\d+(?:\.\d+)?|[()+*/-]/g)||[];
 if(tokens.join('')!==text||!tokens.length)return null;
 let p=0;
 const value=n=>close(n,length)?lin(1,0,0):close(n,width)?lin(0,1,0):lin(0,0,n);
 function primary(){
  const tok=tokens[p++];
  if(tok==='('){const x=sum();if(tokens[p++]!==')')throw Error('Parenthèse manquante');return x;}
  if(tok==='+')return primary();
  if(tok==='-')return scale(primary(),-1);
  if(tok===undefined||!/^\d+(?:\.\d+)?$/.test(tok))throw Error('Nombre attendu');
  return value(Number(tok));
 }
 function product(){
  let x=primary();
  while(tokens[p]==='*'||tokens[p]==='/'){
   const op=tokens[p++],other=primary();
   x=op==='*'?multiply(x,other):divide(x,other);
  }
  return x;
 }
 function sum(){
  let x=product();
  while(tokens[p]==='+'||tokens[p]==='-'){
   const sign=tokens[p++]==='+'?1:-1;
   x=plus(x,product(),sign);
  }
  return x;
 }
 try{const result=sum();return p===tokens.length&&result.ok?result:null;}
 catch{return null;}
}
const numerical=(v,l,w)=>v.l*l+v.w*w+v.k;
function mathFragments(input){
 const text=String(input||'')
  .replace(/[−–—]/g,'-').replace(/[×·]/g,'*')
  .replace(/(\d|\))\s*[xX]\s*(?=\d|\()/g,'$1*')
  .replace(/(\d)\s*,\s*(\d)/g,'$1.$2')
  .replace(/\bcm(?:\s*²)?\b|\bm(?:\s*²)?\b/gi,'')
  .replace(/\b(?:puis|ensuite|donc)\b/gi,';');
 const fragments=[];
 for(const part of text.split(/[;\n]/)){
  for(const match of part.matchAll(/(?:\d|\()[\d().+\-*/\s=]*/g)){
   const formula=match[0].trim();
   if(formula)fragments.push(formula.replace(/\s+$/,''));
  }
 }
 return fragments;
}
function evaluateCalculations(text,length,width){
 const perimeter=2*(length+width);
 let direct=false,half=false,double=false,contradiction=false;
 for(const formula of mathFragments(text)){
  const pieces=formula.split('=').map(x=>x.trim()).filter(Boolean);
  if(!pieces.length)continue;
  // Ignorer P = : le fragment commence au premier nombre.
  const v=parseMath(pieces[0],length,width);
  if(!v)continue;
  const total=numerical(v,length,width);
  if(pieces.length>1){
   const right=pieces[1].replace(/\s+/g,'');
   const rightN=Number(right);
   if(!Number.isFinite(rightN)||!close(total,rightN)){contradiction=true;continue;}
  }
  const full=close(v.l,2)&&close(v.w,2)&&close(v.k,0)&&close(total,perimeter);
  if(full&&(!pieces[1]||close(Number(pieces[1]),perimeter)))direct=true;
  const halfFormula=close(v.l,1)&&close(v.w,1)&&close(v.k,0)&&
   close(total,length+width)&&pieces.length>1&&close(Number(pieces[1]),length+width);
  if(halfFormula)half=true;
  const constDouble=isScalar(v)&&close(v.k,perimeter)&&pieces.length>1&&
   close(Number(pieces[1]),perimeter)&&
   /(?:^|[^\d])(?:2\s*\*\s*|)(?:\d+(?:\.\d+)?)(?:\s*\*\s*2|)(?:$|[^\d])/.test(pieces[0])&&
   pieces[0].includes('*')&&pieces[0].includes(String(length+width));
  if(constDouble)double=true;
 }
 return {correct:(direct||(half&&double))&&!contradiction,contradiction};
}
function checkConclusion(text,expected,unit){
 const s=String(text||'').replace(/\s+/g,' ').trim();
 const units=unit==='cm'?'cm':unit==='m'?'m|mètre(?:s)?':null;
 if(!units)return false;
 const quantity=new RegExp('(?:^|[^\\d])'+expected+'\\s*(?:'+units+')(?![\\w²^])','i');
 const context=/\b(?:p[ée]rim[èe]tre|contour|tour|bord|baguette|cl[ôo]ture|entourer|encadrer)\b/i;
 const sentence=/\b(?:il|le|la|on|nous|je)\b/i;
 return s.length>=16&&quantity.test(s)&&context.test(s)&&sentence.test(s)&&
  !/\b(?:n['’]est pas|ne mesure pas)\b/i.test(s);
}
export function assessRectanglePerimeterReasoning(raw,{length,width,unit}={}){
 if(!Number.isFinite(length)||!Number.isFinite(width)||length<=0||width<=0||!['cm','m'].includes(unit))
  throw Error('Configuration de périmètre invalide');
 let data={};
 try{data=JSON.parse(String(raw||''));}catch{return {
  validFormat:false,calculationCorrect:false,conclusionCorrect:false,
  calculation:'',conclusion:'',feedback:'Le calcul et la phrase-réponse doivent être renseignés séparément.'
 };}
 if(!data||typeof data!=='object'||Array.isArray(data))data={};
 const calculation=typeof data.calculation==='string'?data.calculation.trim():'';
 const conclusion=typeof data.conclusion==='string'?data.conclusion.trim():'';
 const validFormat=calculation.length>0&&conclusion.length>0;
 const analysed=evaluateCalculations(calculation,length,width);
 const conclusionCorrect=checkConclusion(conclusion,2*(length+width),unit);
 const messages=[];
 if(!analysed.correct)messages.push(analysed.contradiction?
  'Le calcul écrit contient une égalité incorrecte ou ne démontre pas le périmètre demandé.':
  'Le calcul écrit ne démontre pas l’addition des deux longueurs et des deux largeurs.');
 if(!conclusionCorrect)messages.push('La phrase-réponse doit expliquer ce qui est mesuré et indiquer la valeur avec la bonne unité.');
 return {validFormat,calculationCorrect:analysed.correct,conclusionCorrect,calculation,conclusion,feedback:messages.join(' ')};
}
