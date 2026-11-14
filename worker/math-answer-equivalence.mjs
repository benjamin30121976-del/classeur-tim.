/* Interprétation prudente des réponses numériques de Tim.
   Accepte les égalités correctement calculées, les unités et une courte
   phrase-réponse, jamais un nombre seulement présent au milieu d'un calcul.
   Ne lance aucun code et ne lit pas les données de Tim. */
const tolerance=(a,b)=>Math.abs(a-b)<1e-9;
const symbols=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[−–—]/g,'-').replace(/[×·]/g,'*')
 .replace(/÷/g,'/').replace(/,/g,'.').replace(/[\u00a0\u202f]/g,' ')
 .replace(/\s+/g,' ').trim();
function arithmetic(value){
 let t=symbols(value).replace(/\s+/g,'');
 if(!t||t.length>140||!/^[0-9.+*/()\-]+$/.test(t))return null;
 // « 2(3+4) » et « (3+4)2 » sont des multiplications.
 t=t.replace(/(\d)\(/g,'$1*(').replace(/\)(\d)/g,')*$1').replace(/\)\(/g,')*(');
 const tokens=t.match(/\d+(?:\.\d+)?|\.\d+|[()+*/-]/g)||[];
 if(tokens.join('')!==t)return null;
 let pos=0;
 function primary(){
  const cur=tokens[pos++];
  if(cur==='-')return -primary();
  if(cur==='+')return primary();
  if(cur==='('){const n=sum();if(tokens[pos++]!==')')throw Error('Parenthese');return n;}
  if(!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(cur||''))throw Error('Nombre');
  return Number(cur);
 }
 function product(){
  let n=primary();
  while(tokens[pos]==='*'||tokens[pos]==='/'){
   const op=tokens[pos++],v=primary();
   if(op==='/'&&tolerance(v,0))throw Error('Division par zero');
   n=op==='*'?n*v:n/v;
  }
  return n;
 }
 function sum(){
  let n=product();
  while(tokens[pos]==='+'||tokens[pos]==='-'){
   const op=tokens[pos++],v=product();
   n=op==='+'?n+v:n-v;
  }
  return n;
 }
 try{const result=sum();return pos===tokens.length&&Number.isFinite(result)?result:null;}
 catch{return null;}
}
function stripUnit(s,prompt){
 const text=symbols(s);
 const actual=/\s*(cm2|cm\^2|cm²|m2|m\^2|m²|cm|m)\.?$/.exec(text);
 if(!actual)return text;
 const unit=actual[1];
 const square=/2|²/.test(unit),askedArea=/\b(?:aire|surface)\b/.test(symbols(prompt));
 const askedPerimeter=/\b(?:perimetre|contour|tour|bord|cadre|cloture)\b/.test(symbols(prompt));
 if((square&&askedPerimeter)||(!square&&askedArea))return null;
 return text.slice(0,actual.index).trim();
}
function simplestFraction(raw){
 const t=symbols(raw).replace(/\s/g,'');
 const m=/^([+-]?\d+)\/(\d+)$/.exec(t);
 if(!m||!Number(m[2]))return false;
 let a=Math.abs(Number(m[1])),b=Math.abs(Number(m[2]));
 while(b){const c=a%b;a=b;b=c;}
 return a===1;
}
export function numericMathAnswerMatches(actual,expected,prompt=''){
 const wanted=arithmetic(stripUnit(expected,prompt));
 if(wanted===null)return false;
 const original=symbols(actual),task=symbols(prompt);
 if(!original||/\b(?:pas|faux|incorrect|environ|approximativement)\b/.test(original))return false;
 if(/\b(?:fraction irreductible|fraction simplifiee)\b/.test(task)&&
    (!simplestFraction(original)||!original.includes('/')))return false;
 if(/\b(?:perimetre|contour|tour|bord)\b/.test(task)&&/\b(?:aire|surface)\b/.test(original))return false;
 if(/\b(?:aire|surface)\b/.test(task)&&/\bperimetre\b/.test(original))return false;
 const chain=original
  .replace(/^(?:(?:le|la|l')\s*)?(?:perimetre|contour|longueur|aire|surface|resultat|reponse|valeur|mesure)(?:\s+(?:du rectangle|de l'affiche|de la figure|du cadre))?\s*(?:(?:est|vaut|mesure|fait|donne)(?:\s+de)?|:|=)?\s*/, '')
  .replace(/^(?:(?:on|je|nous)\s*(?:trouve|obtient|calcule)|il\s*(?:faut|reste)|cela\s*(?:fait|donne)|donc|ainsi)\s*(?:de|:|=)*\s*/,'')
  .replace(/^(?:p|a|bc)\s*=\s*/,'');
 const parts=chain.split('=').map(s=>s.trim()).filter(Boolean);
 if(!parts.length)return false;
 const values=parts.map(x=>arithmetic(stripUnit(x,prompt)));
 return values.every(v=>v!==null&&tolerance(v,wanted));
}
export function numericMathEquivalent(a,b){const x=arithmetic(a),y=arithmetic(b);return x!==null&&y!==null&&tolerance(x,y);}
