/* Explication pédagogique, uniquement côté serveur après soumission.
   N'exporte jamais de réponses attendues via l'API publique des exercices. */
const PERSONS=['yo','tú','él / ella','nosotros / nosotras','vosotros / vosotras','ellos / ellas'];
const SUBJECTS=[['yo'],['tú'],['él','ella','usted'],['nosotros','nosotras'],['vosotros','vosotras'],['ellos','ellas','ustedes']];
const norm=s=>String(s??'').normalize('NFC').toLocaleLowerCase('es').trim().replace(/\s+/g,' ').replace(/[.,;:«»"()]/g,'');
function verbForms(verbs){
 return Object.entries(verbs).flatMap(([infinitive,v])=>v.forms.map((form,person)=>({infinitive,person,form})));
}
function same(a,b){return norm(a)===norm(b);}
export function answerVariants(q,verbs){
 const choices=[String(q.right)];
 if(q.kind==='qcm')return choices;
 if(q.verb&&Number.isInteger(q.pronounIndex))
  for(const pronoun of SUBJECTS[q.pronounIndex]||[])choices.push(pronoun+' '+q.right);
 if(q.kind==='write'&&q.sourceFr){
  const full=String(q.right);
  const firstPerson=Object.values(verbs).some(v=>
   norm(full)===norm(v.forms[0])||norm(full).startsWith(norm(v.forms[0])+' '));
  if(firstPerson||/^(tengo|vivo|voy|soy|estoy|quiero|puedo|pienso|hablo|como)\b/i.test(full))
   choices.push('Yo '+full);
  if(/^No (tengo|quiero|puedo|soy|estoy|voy|hablo|vivo|pienso)\b/i.test(full))
   choices.push('Yo '+full[0].toLowerCase()+full.slice(1));
  const isName=/^Mi nombre es ([\p{L}]+)\.?$/iu.exec(full);
  if(isName)choices.push('Me llamo '+isName[1]+'.');
  const saysName=/^Me llamo ([\p{L}]+)\.?$/iu.exec(full);
  if(saysName)choices.push('Mi nombre es '+saysName[1]+'.');
 }
 return [...new Set(choices)];
}
function conjugationRule(q,response,verbs){
 const v=verbs[q.verb];if(!v)return null;
 const person=PERSONS[q.pronounIndex];
 const form=v.forms[q.pronounIndex];
 const found=verbForms(verbs).find(({form:word})=>same(word,response));
 if(found?.infinitive===q.verb&&found.person!==q.pronounIndex){
  return {category:'conjugaison',
   feedback:'Tu as écrit « '+response+' », forme utilisée avec « '+PERSONS[found.person]+' ». Ici, le pronom demandé est « '+person+' » : il faut « '+form+' ».',
   rule:'Pour « '+q.verb+' » ('+v.meaning+'), compare les personnes : '+v.forms.map((word,i)=>PERSONS[i]+' → '+word).join(' ; ')+'.'};
 }
 if(found&&found.infinitive!==q.verb){
  return {category:'conjugaison',feedback:'« '+response+' » vient du verbe « '+found.infinitive+' », mais ici on doit conjuguer « '+q.verb+' » avec « '+person+' ».',
   rule:'Le présent de « '+q.verb+' » avec « '+person+' » est « '+form+' ». Le verbe doit rester le même.'};
 }
 return {category:'conjugaison',
  feedback:'Pour « '+person+' », la bonne forme de « '+q.verb+' » est « '+form+' ». Vérifie la terminaison'+(q.verb==='llamarse'?' et le pronom réfléchi':'')+'.',
  rule:'Tableau de « '+q.verb+' » : '+v.forms.map((word,i)=>PERSONS[i]+' → '+word).join(' ; ')+'.'};
}
function gapRule(q,response,verbs){
 const expected=String(q.right),act=String(response);
 if(/^(gusta|gustan)$/i.test(expected)&&/^(gusta|gustan)$/i.test(act))
  return {category:'grammaire',feedback:'Tu as confondu « gusta » (singulier) et « gustan » (pluriel). Il faut regarder la chose qui plaît.',
   rule:'« Me gusta el fútbol » (singulier) ; « Me gustan las matemáticas » (pluriel).'};
 if(/^(el|la|los|las|un|una|unos|unas)$/i.test(expected)&&/^(el|la|los|las|un|una|unos|unas)$/i.test(act))
  return {category:'accord',feedback:'Tu as choisi l’article « '+act+' » mais le nom demande « '+expected+' ».',
   rule:'el/un : masculin singulier ; la/una : féminin singulier ; los/unos : masculin pluriel ; las/unas : féminin pluriel.'};
 if(expected.includes('ñ')&&same(expected.replaceAll('ñ','n'),act))
  return {category:'orthographe',feedback:'Tu as écrit n à la place de ñ. Ce sont deux lettres espagnoles différentes.',
   rule:'Exemple : « año » signifie « année ». Le signe au-dessus du ñ doit rester présent.'};
 const forms=verbForms(verbs);
 const core=s=>s.replace(/^(me|te|se|nos|os)\s+/i,'');
 const expectedForm=forms.find(({form})=>same(form,expected)||same(core(form),expected));
 const givenForm=forms.find(({form})=>same(form,act)||same(core(form),act));
 if(expectedForm){
  if(givenForm&&givenForm.infinitive===expectedForm.infinitive&&givenForm.person!==expectedForm.person)
   return {category:'conjugaison',
    feedback:'« '+act+' » est la forme utilisée avec « '+PERSONS[givenForm.person]+' ». Dans cette phrase, il faut « '+expected+' », forme utilisée avec « '+PERSONS[expectedForm.person]+' ».',
    rule:'Verbe « '+expectedForm.infinitive+' » : '+PERSONS[expectedForm.person]+' → '+expectedForm.form+'.'};
  return {category:'conjugaison',
   feedback:'La forme du verbe attendue ici est « '+expected+' ». Regarde le sujet et la conjugaison dans la phrase.',
   rule:'« '+expectedForm.infinitive+' » ('+verbs[expectedForm.infinitive].meaning+') avec « '+PERSONS[expectedForm.person]+' » se conjugue « '+expectedForm.form+' ».'};
 }
 if(q.kind==='gap')
  return {category:'vocabulaire',feedback:'Le mot « '+act+' » ne complète pas correctement cette phrase. On attend « '+expected+' ».',
   rule:'Phrase complète : « '+q.fullSpanish+' » = « '+q.sourceFr+' ».'};
 return null;
}
export function explainSpanishResponse(q,response,mark,verbs,lesson){
 if(q.kind==='qcm'){
  const french=q.choices[q.right],choice=q.choices[response];
  if(mark.points===1)return {category:'réussi',feedback:'Exact : « '+q.sourceEs+' » signifie « '+french+' ».',
    rule:'Retenir l’association « '+q.sourceEs+' » → « '+french+' ».'};
  const match=(lesson.vocab||[]).find(([es,fr])=>same(fr,choice));
  return {category:'vocabulaire',feedback:'Tu as choisi « '+choice+' ». Mais « '+q.sourceEs+' » signifie « '+french+' ».',
   rule:match?'« '+choice+' » correspond plutôt à « '+match[0]+' » en espagnol. Compare ces deux expressions.':
    'Relis l’expression complète « '+q.sourceEs+' » et sa traduction « '+french+' ».'};
 }
 if(mark.points===1)return {category:'réussi',
  feedback:same(response,q.right)?'Bonne réponse : le mot, la conjugaison et la forme conviennent.':'Bonne réponse : cette autre formulation est également correcte en espagnol.',
  rule:q.explanation};
 if(mark.points===0.5){
  const a=norm(response),b=norm(mark.expected);
  const stripMarks=x=>x.replace(/[¿?¡!]/g,'');
  const stripAccents=x=>x.normalize('NFD').replace(/([aeiou])[\u0300\u0301\u0302\u0308]/g,'$1').normalize('NFC');
  const missingAccent=stripMarks(a)!==stripMarks(b);
  const markIssue=stripAccents(a)!==stripAccents(b);
  const category=missingAccent&&markIssue?'accents et ponctuation':missingAccent?'accents':'ponctuation';
  return {category,feedback:'Le sens est compris : 0,5 point. '+mark.feedback,
   rule:'Compare ta réponse avec « '+mark.expected+' ». Repère les accents et, si c’est une question, les signes « ¿ » et « ? ».'};
 }
 if(q.verb)return conjugationRule(q,response,verbs);
 if(q.kind==='gap')return gapRule(q,response,verbs);
 if(q.kind==='write'){
  if(/^No /i.test(q.right)&&!/^No /i.test(String(response).trim()))
   return {category:'construction',feedback:'La négation « no » manque : sans elle, la phrase ne dit plus la même chose.',
     rule:'En espagnol, « no » précède généralement le verbe : « No tengo » = « Je n’ai pas ».'};
  const expected=String(q.right),source=String(q.sourceFr||''),answer=String(response);
  const shortExpression=expected.trim().split(/\s+/).length<=3;
  if(shortExpression)return {category:'vocabulaire',
    feedback:'Tu as écrit « '+answer+' ». Pour « '+source+' », la formulation attendue est « '+expected+' ».',
    rule:'Retenir cette expression : « '+source+' » → « '+expected+' ». Compare les mots et leur orthographe.'};
  return {category:'traduction',
    feedback:'Tu as écrit « '+answer+' ». Pour traduire « '+source+' », il fallait écrire « '+expected+' ».',
    rule:'Compare les mots importants et leur ordre dans « '+expected+' ». Vérifie les accords et la conjugaison lorsque la phrase en contient.'};
 }
 return {category:'vocabulaire',feedback:mark.feedback,rule:q.explanation};
}
