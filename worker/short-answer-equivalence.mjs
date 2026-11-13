/* Comparaison prudente des réponses écrites.
   Serveur uniquement : ne pas utiliser pour inventer des synonymes ou pour
   décider qu'une phrase libre est fausse sur le seul fondement de sa forme. */
const SUBSCRIPT='₀₁₂₃₄₅₆₇₈₉';
const CONTRACTS=[
 ["i'm","i am"],["you're","you are"],["we're","we are"],["they're","they are"],
 ["he's","he is"],["she's","she is"],["it's","it is"],
 ["i've","i have"],["we've","we have"],["they've","they have"],
 ["i'll","i will"],["you'll","you will"],["we'll","we will"],["they'll","they will"],
 ["don't","do not"],["doesn't","does not"],["didn't","did not"],
 ["isn't","is not"],["aren't","are not"],["wasn't","was not"],["weren't","were not"],
 ["can't","cannot"],["couldn't","could not"],["won't","will not"],["wouldn't","would not"],
 ["shouldn't","should not"],["haven't","have not"],["hasn't","has not"],["hadn't","had not"]
];
function replaceSubscripts(text){
 return text.replace(/[₀-₉]/g,c=>String(SUBSCRIPT.indexOf(c)));
}
export function standardAnswer(value,{english=false}={}){
 let text=replaceSubscripts(String(value??''))
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[‘’´]/g,"'").replace(/[−–—⁻]/g,'-').replace(/⁺/g,'+')
  .replace(/[\u00a0\u2009\u202f]/g,' ').replace(/\s+/g,' ').trim()
  .replace(/^[«»"“”\s]+|[«»"“”\s]+$/g,'')
  .replace(/[.!?;:,]+$/g,'').trim();
 if(english){
  for(const [short,long] of CONTRACTS)text=text.replace(new RegExp('\\b'+short+'\\b','g'),long);
 }
 // Les espaces sans importance (y compris dans une formule chimique) et
 // les parenthèses ne doivent pas fausser une réponse courte.
 return text.replace(/[\s()]/g,'');
}
export function sameShortAnswer(actual,expected,alternatives=[],opts={}){
 const normalized=standardAnswer(actual,opts);
 return [expected,...alternatives].some(candidate=>standardAnswer(candidate,opts)===normalized);
}
export function numericEquivalent(actual,expected){
 const parse=x=>{
  const s=String(x??'').trim().replace(/[−–—]/g,'-').replace(/[\u00a0\u202f]/g,'')
    .replace(/,/g,'.');
  if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s))return null;
  const n=Number(s);return Number.isFinite(n)?n:null;
 };
 const a=parse(actual),b=parse(expected);
 return a!==null&&b!==null&&Math.abs(a-b)<1e-10;
}
