/* Défis pédagogiques mélangés de Tim — nouveau référentiel privé.
   Entrée en vigueur : samedi 14/11 (week-end) et lundi 16/11 (quotidien).
   Les anciennes missions et leurs copies ne sont jamais remplacées.
   Les réponses et barèmes ne sont importés que côté serveur. */
import {weekId,monday,parisDay} from '../functions/missions-v18.mjs';

const n=(s)=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[¿?¡!.,;:]/g,'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const dayString=s=>s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8);
const validDay=s=>/^20\d{6}$/.test(s)&&!Number.isNaN(new Date(dayString(s)+'T12:00:00Z').getTime())&&
 new Date(dayString(s)+'T12:00:00Z').toISOString().slice(0,10)===dayString(s);
const addDays=(s,days)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
const mc=(q,options,right,why,extra={})=>({type:'mc',format:'mc',q,options,right,why,...extra});
const txt=(q,right,why,format='short',also=[],extra={})=>({type:'text',format,q,right,also,why,...extra});
const reason=(q,methods,right,parts,answer,unit,why,extra={})=>({
 type:'reason',format:'reason',q,methods,right,parts,answer:String(answer),unit,
 why,calcLabel:'Écris ton calcul et ses étapes.',conclusionLabel:'Rédige une phrase de conclusion.',...extra
});
const B={
 es:{
  mc:[
   ()=>mc('Elige la forma correcta: « Nosotros ... quince años ».',['tengo','tenemos','tienen','tenéis'],1,'Avec nosotros, tener se conjugue tenemos.',{fr:'Choisis la bonne forme de tener (avoir) pour « nous ».'}),
   ()=>mc('Elige la forma correcta: « Yo ... al colegio ».',['va','voy','vas','vamos'],1,'Ir au présent avec yo donne voy.',{fr:'Choisis la forme de ir (aller) avec « je ».'}),
   ()=>mc('Elige la frase negativa correcta.',['Yo no nunca estudio.','Nunca estudio los domingos.','Yo nada estudio nunca.','No nada estudio.'],1,'Nunca peut se placer avant le verbe : Nunca estudio los domingos.',{fr:'Choisis la phrase négative correctement construite.'}),
   ()=>mc('Elige la conjugación de HACER con « él ».',['haces','hacen','hace','hago'],2,'Le verbe hacer avec él donne hace.',{fr:'Choisis la conjugaison de faire avec « il ».'}),
   ()=>mc('¿Qué frase expresa una oposición « non… mais » ?',['No voy hoy, sino mañana.','No voy hoy y mañana.','Voy hoy también.','Voy hoy siempre.'],0,'Sino oppose deux éléments après une négation.',{fr:'Quelle phrase exprime une opposition « non… mais » ?'})
  ],
  fill:[
   ()=>txt('Completa: « Yo ___ quince años » (tener, presente).','tengo','Avec yo, le présent de tener est tengo.','fill',[],{fr:'Complète avec tener au présent à la première personne.'}),
   ()=>txt('Completa: « Nosotros ___ al colegio » (ir, presente).','vamos','Avec nosotros, ir devient vamos.','fill',[],{fr:'Complète avec ir au présent pour « nous ».'}),
   ()=>txt('Completa: « No estudio el lunes, ___ el martes ».','sino','Après no, sino marque une opposition : non lundi, mais mardi.','fill',[],{fr:'Complète la phrase négative avec le mot qui marque une opposition.'}),
   ()=>txt('Completa: « Ella nunca ___ tarde » (llegar, presente).','llega','Le sujet ella impose la terminaison -a de llegar.','fill',[],{fr:'Complète avec llegar (arriver) au présent pour « elle ».'}),
   ()=>txt('Completa: « Vosotros ___ español » (hablar, presente).','habláis','Hablar avec vosotros prend -áis.','fill',['hablais'],{fr:'Complète avec hablar (parler) au présent pour « vous ».'}),
   ()=>txt('Completa: « Yo ___ mi mochila » (traer, presente).','traigo','Traer est irrégulier avec yo : traigo.','fill',[],{fr:'Complète avec traer (apporter) au présent pour « je ».'})
  ],
  short:[
   ()=>txt('Traduce al español: « Je vais au collège ».','Voy al colegio','Voy est la forme de ir avec yo.','short',['Yo voy al colegio'],{fr:'Traduis la phrase française en espagnol.'}),
   ()=>txt('Traduce al español: « Je ne vais jamais en cours le samedi ».','Nunca voy a clase el sábado','Nunca exprime jamais ; voy est la conjugaison de ir.','short',['No voy nunca a clase el sábado','No voy a clase nunca el sábado'],{fr:'Traduis en espagnol en utilisant une négation correcte.'}),
   ()=>txt('Traduce al español: « Nous avons quinze ans ».','Tenemos quince años','En espagnol, l’âge se formule avec tener.','short',['Nosotros tenemos quince años'],{fr:'Traduis en espagnol en conjuguant avoir pour « nous ».'}),
   ()=>txt('Traduce al español: « Je ne comprends rien ».','No entiendo nada','No ... nada signifie ne ... rien.','short',[],{fr:'Traduis en espagnol avec la négation « ne… rien ».'}),
   ()=>txt('Traduce al español: « Elle fait ses devoirs ».','Ella hace sus deberes','Hacer prend hace avec ella ; sus signifie ses.','short',['Hace sus deberes'],{fr:'Traduis en espagnol avec faire au présent.'}),
   ()=>txt('Escribe una frase en español para decir: « Je m’appelle Lucía ».','Me llamo Lucía','Le verbe pronominal llamarse s’emploie avec me pour je.','short',['Yo me llamo Lucía'],{fr:'Écris une phrase espagnole signifiant « Je m’appelle Lucía ».'})
  ]
 },
 ma:{
  fill:[
   s=>{const a=7+s%5,b=3+s%4;return txt('Calcule : (−'+a+') + '+b+' = ?',String(b-a),'Dans une somme de signes opposés, on soustrait les valeurs absolues.','fill');},
   s=>{const a=2+s%4,b=3+(s>>2)%3;return txt('Calcule : '+a+'³ = ?',String(a*a*a),'Une puissance 3 signifie multiplier le nombre par lui-même trois fois.','fill');},
   s=>{const a=3+s%4,b=2+(s>>1)%3;return txt('Calcule : '+a+' × ('+b+' + 2) = ?',String(a*(b+2)),'On commence par effectuer le calcul entre parenthèses.','fill');},
   s=>{const a=2+s%3,b=4+s%5;return txt('Réduis : '+a+'x + '+b+'x = ?',(a+b)+'x','On additionne les coefficients des termes de même nature.','fill',[''+(a+b)+' x']);},
   s=>{const a=3+s%4,b=2+s%3;return txt('Calcule : '+a+'/'+(a*b)+' × '+b+' = ?','1/'+a,'On simplifie le produit des fractions.','fill',[],{difficulty:'medium'});}
  ],
  short:[
   s=>{const a=2+s%4,b=3+s%5;return txt('Développe puis réduis : '+a+'(x + '+b+').',a+'x + '+(a*b),'La distributivité multiplie chaque terme entre parenthèses par '+a+'.','short',[a+'x+'+(a*b),a+'*x+'+(a*b)]);},
   s=>{const a=3+s%4,b=4+s%3;return txt('Un rectangle mesure '+a+' cm de long et '+b+' cm de large. Donne son périmètre en cm.',String(2*(a+b)),'Le périmètre d’un rectangle est deux fois la somme de sa longueur et de sa largeur.','short',[2*(a+b)+' cm']);},
   s=>{const a=4+s%3,b=5+s%4;return txt('Calcule l’aire d’un rectangle de '+a+' cm sur '+b+' cm, en cm².',String(a*b),'L’aire du rectangle vaut longueur × largeur.','short',[a*b+' cm²',a*b+' cm2']);},
   s=>{const a=2+s%4,b=3+s%4;return txt('Pour x = '+a+', calcule '+b+'x + 1.',String(b*a+1),'Remplace x par la valeur donnée puis multiplie et additionne.','short');},
   s=>{const a=2+s%4;return txt('Écris sous forme de fraction irréductible : '+a+'/'+(2*a)+'.','1/2','Le numérateur et le dénominateur sont divisibles par '+a+'.','short',['0,5','0.5']);}
  ],
  reason:[
   s=>{const a=6+s%5,b=4+(s>>2)%5,v=a*b;return reason(
     'Un rectangle mesure '+a+' cm de long et '+b+' cm de large. Calcule son aire et explique ta méthode.',
     ['Aire = longueur × largeur','Périmètre = 2 × (longueur + largeur)','Utiliser Pythagore'],0,[a,b,'×',v],v,'cm²',
     'L’aire d’un rectangle est le produit de la longueur par la largeur. Ici : '+a+' × '+b+' = '+v+' cm².',
     {diagram:'rectangle',dimensions:[a,b],lesson:'MBIS19'});},
   s=>{const k=1+s%3,a=3*k,b=4*k,c=5*k;return reason(
     'ABC est un triangle rectangle en A. AB = '+a+' cm et AC = '+b+' cm. Calcule BC, l’hypoténuse.',
     ['Théorème de Pythagore','Théorème de Thalès','Aire du triangle'],0,[a*a,b*b,'+',c*c],c,'cm',
     'Pythagore : BC² = AB² + AC² = '+(a*a)+' + '+(b*b)+' = '+(c*c)+'. Donc BC = '+c+' cm.',
     {diagram:'triangle',dimensions:[a,b],lesson:'MBIS06'});},
   s=>{const d=4+s%3,v=3*d;return reason(
     'Une bibliothèque possède '+d+' rayons de 3 livres chacun. Combien de livres y a-t-il au total ?',
     ['Multiplier le nombre de rayons par 3','Additionner 3 au nombre de rayons','Diviser le nombre de rayons par 3'],0,[d,3,'×',v],v,'livres',
     d+' groupes de 3 livres représentent '+d+' × 3 = '+v+' livres.',{lesson:'MBIS13'});},
   s=>{const a=2+s%3,b=3+s%4,v=a*(b+2);return reason(
     'Un programme de calcul demande de prendre '+b+', d’ajouter 2, puis de multiplier le résultat par '+a+'. Quel nombre obtient-on ?',
     ['Calculer ('+b+' + 2) × '+a,'Calculer '+b+' + (2 × '+a+')','Calculer ('+b+' × 2) + '+a],0,[b,2,'+',a,'×',v],v,'',
     'On respecte l’ordre des opérations : ('+b+' + 2) × '+a+' = '+v+'.',{lesson:'MBIS13'});},
   s=>{const a=3+s%4,b=2+s%4,v=2*(a+b);return reason(
     'Le cadre d’une affiche rectangulaire mesure '+a+' cm sur '+b+' cm. Quelle longueur totale de bord faut-il prévoir ?',
     ['Calculer le périmètre : 2 × (L + l)','Calculer l’aire : L × l','Additionner seulement L et l'],0,[a,b,'+',2,'×',v],v,'cm',
     'Le bord correspond au périmètre du rectangle : 2 × ('+a+' + '+b+') = '+v+' cm.',
     {diagram:'rectangle',dimensions:[a,b],lesson:'MBIS19'});}
  ]
 },
 pc:{
  mc:[
   ()=>mc('Dans l’atome, quelles particules se trouvent dans le noyau ?',['Électrons et protons','Protons et neutrons','Électrons seuls','Molécules et ions'],1,'Le noyau contient des protons et des neutrons.',{lesson:'PC_BIS01'}),
   ()=>mc('Un atome qui perd un électron devient…',['Un ion négatif','Un atome sans noyau','Un ion positif','Un neutron'],2,'La perte d’une charge négative rend l’ensemble positif.',{lesson:'PC_BIS02'}),
   ()=>mc('Dans une réaction chimique, les réactifs sont…',['À gauche de la flèche','À droite de la flèche','Toujours des gaz','Les résultats obtenus'],0,'Les réactifs sont les substances de départ.',{lesson:'PC_BIS06'}),
   ()=>mc('Dans une molécule de H₂O, combien y a-t-il d’atomes d’oxygène ?',['0','1','2','3'],1,'Sans indice après O, il y a un seul atome d’oxygène.',{lesson:'PC_BIS03'}),
   ()=>mc('Que faut-il conserver quand on équilibre une équation chimique ?',['Le nombre de chaque type d’atome','Le nombre de molécules uniquement','La couleur du liquide','La forme du récipient'],0,'Chaque type d’atome doit être présent en même nombre avant et après.',{lesson:'PC_BIS07'})
  ],
  fill:[
   s=>{const z=6+s%8;return txt('Un atome neutre possède '+z+' protons. Combien possède-t-il d’électrons ?',String(z),'Dans un atome neutre, le nombre d’électrons est égal au nombre de protons.','fill',[],{lesson:'PC_BIS01'});},
   s=>{const z=5+s%6,nn=6+(s>>2)%7;return txt('Un noyau a A = '+(z+nn)+' nucléons et Z = '+z+' protons. Combien de neutrons ?',String(nn),'Neutrons = A − Z = '+(z+nn)+' − '+z+' = '+nn+'.','fill',[],{lesson:'PC_BIS01'});},
   ()=>txt('Complète : un ion de charge positive est un …','cation','Un cation est un ion positif ; un anion est négatif.','fill',['un cation'],{lesson:'PC_BIS02'}),
   ()=>txt('Dans 2 H₂O, combien d’atomes d’hydrogène y a-t-il au total ?','4','Il y a 2 molécules et chacune contient 2 hydrogènes, donc 2 × 2 = 4.','fill',[],{lesson:'PC_BIS03'}),
   ()=>txt('Complète : les produits d’une réaction chimique sont placés à … de la flèche.','droite','Une équation s’écrit réactifs → produits.','fill',['à droite'],{lesson:'PC_BIS06'})
  ],
  short:[
   ()=>txt('Explique en quelques mots ce qu’est un nucléon.','un proton ou un neutron','Le noyau contient des nucléons : protons et neutrons.','short',['proton ou neutron','proton et neutron','les protons et les neutrons'],{lesson:'PC_BIS01'}),
   ()=>txt('Quel est le nom d’un ion négatif ?','anion','Un ion qui gagne des électrons peut devenir négatif : c’est un anion.','short',['un anion'],{lesson:'PC_BIS02'}),
   ()=>txt('Écris la formule chimique du dioxyde de carbone.','CO₂','Le dioxyde de carbone contient 1 carbone C et 2 oxygènes O.','short',['CO2'],{lesson:'PC_BIS03'}),
   ()=>txt('Que peut indiquer l’apparition de bulles pendant une réaction ?','un dégagement de gaz','Des bulles peuvent indiquer qu’un gaz se forme.','short',['formation d’un gaz','un gaz se forme','du gaz'],{lesson:'PC_BIS06'}),
   ()=>txt('Comment appelle-t-on un solide qui apparaît dans une solution pendant un test ?','un précipité','Un précipité est un solide qui se forme dans un liquide lors d’un test.','short',['précipité'],{lesson:'PC_BIS05'})
  ],
  reason:[
   s=>{const z=7+s%6,nn=9+(s>>2)%7,a=z+nn;return reason(
     'Le noyau d’un atome contient A = '+a+' nucléons, dont Z = '+z+' protons. Combien contient-il de neutrons ?',
     ['Soustraire Z du nombre total A','Additionner A et Z','Multiplier A par Z'],0,[a,z,'−',nn],nn,'neutrons',
     'Les nucléons rassemblent protons et neutrons. Neutrons = A − Z = '+a+' − '+z+' = '+nn+'.',
     {diagram:'atom',dimensions:[a,z],lesson:'PC_BIS01'});},
   s=>{const m=2+s%3,v=m*2;return reason(
     'On représente '+m+' molécules d’eau, H₂O. Combien d’atomes d’hydrogène y a-t-il au total ?',
     ['Multiplier le nombre de molécules par 2','Ajouter 1 au nombre de molécules','Compter uniquement les atomes d’oxygène'],0,[m,2,'×',v],v,'atomes',
     'Dans H₂O il y a 2 hydrogènes par molécule : '+m+' × 2 = '+v+' atomes d’hydrogène.',
     {diagram:'water',dimensions:[m],lesson:'PC_BIS03'});},
   s=>{const z=8+s%5,e=z-1;return reason(
     'Un atome possède '+z+' protons et perd 1 électron. Quelle est la charge de l’ion obtenu ?',
     ['La perte d’un électron rend l’ion positif','La perte d’un électron rend l’ion négatif','La charge reste toujours nulle'],0,[z,e,'−',1],'+1','',
     'Un électron porte une charge négative : en perdre un crée un ion de charge +1.',
     {lesson:'PC_BIS02'});},
   s=>{const low=5+s%6,high=low+7+s%5;return reason(
     'Un liquide passe de '+low+' °C à '+high+' °C. De combien de degrés sa température a-t-elle augmenté ?',
     ['Faire température finale − température initiale','Additionner les deux températures','Multiplier les deux températures'],0,[high,low,'−',high-low],high-low,'°C',
     'Variation de température = '+high+' − '+low+' = '+(high-low)+' °C.',
     {lesson:'PC_BIS04'});}
  ]
 }
};
const TITLES={es:'Espagnol',ma:'Mathématiques',pc:'Physique-chimie'};
const BLUEPRINT=[
 [['es','mc'],['ma','reason'],['pc','short'],['es','fill'],['pc','mc'],['ma','fill'],['es','short'],['pc','reason'],['ma','short'],['es','fill']],
 [['ma','reason'],['pc','fill'],['es','short'],['pc','mc'],['ma','fill'],['es','mc'],['ma','reason'],['pc','short'],['es','fill'],['ma','short']],
 [['pc','reason'],['es','fill'],['ma','short'],['pc','mc'],['es','short'],['ma','reason'],['pc','fill'],['es','mc'],['pc','short'],['ma','fill']]
];
function lessonFor(q,subject){return q.lesson||(subject==='es'?'L14':subject==='ma'?'MBIS13':'PC_BIS01');}
function selectQuestions(id,kind){
 const items=kind==='daily'?BLUEPRINT[Number(id.slice(-2))-1]:
  kind==='weekly'?[...BLUEPRINT[0],...BLUEPRINT[1]]:[...BLUEPRINT[1],...BLUEPRINT[2]];
 const dailyIndex=kind==='daily'?Number(id.slice(-2))-1:0;
 const rotationSeed=kind==='daily'?id.slice(0,12):id;
 const used={},selected=[];
 if(kind==='daily')for(const earlier of BLUEPRINT.slice(0,dailyIndex))
  for(const [subject,format] of earlier)used[subject+'-'+format]=(used[subject+'-'+format]||0)+1;
 for(let i=0;i<items.length;i++){
  const [subject,format]=items[i],k=subject+'-'+format;
  const options=B[subject][format],index=(hash(rotationSeed+'|'+k)%options.length)+(used[k]||0);
  used[k]=(used[k]||0)+1;
  const seed=hash(rotationSeed+'|'+k+'|'+index);
  const question=options[index%options.length](seed);
  selected.push({...question,subject:TITLES[subject],lessonId:lessonFor(question,subject),
   sourceId:'mix-'+subject+'-'+format+'-'+index,skill:TITLES[subject]+': '+format,
   difficulty:['facile','moyenne','difficile'][hash(id+'|diff|'+i)%3]});
 }
 // Mélanger sujets et difficultés tout en conservant 2 QCM, 3 phrases à
 // compléter, 3 réponses courtes et 2 raisonnements dans chaque série de 10.
 return selected.map((q,i)=>({q,order:hash(id+'|ordre|'+i)})).sort((a,b)=>a.order-b.order).map(x=>x.q);
}
export function isMixedMissionId(id){
 const daily=/^DAY_(20\d{6})_(0[1-3])$/.exec(String(id||''));
 if(daily)return daily[1]>='20261116'&&validDay(daily[1])&&![0,6].includes(new Date(dayString(daily[1])+'T12:00:00Z').getUTCDay());
 const saturday=/^WEEK_(20\d{2})W(\d{2})$/.exec(String(id||''));
 if(saturday)return id>=weekId('2026-11-14')&&Number(saturday[2])<=53;
 const sunday=/^SUNDAY_(20\d{6})$/.exec(String(id||''));
 return Boolean(sunday&&sunday[1]>='20261115'&&validDay(sunday[1])&&
  new Date(dayString(sunday[1])+'T12:00:00Z').getUTCDay()===0);
}
export function mixedMission(id){
 if(!isMixedMissionId(id))return null;
 const daily=/^DAY_(20\d{6})_(0[1-3])$/.exec(id),sunday=/^SUNDAY_(20\d{6})$/.exec(id);
 const kind=daily?'daily':sunday?'sunday':'weekly';
 const period=daily?dayString(daily[1]):sunday?dayString(sunday[1]):id;
 const questions=selectQuestions(id,kind);
 const count=kind==='daily'?10:20;
 if(questions.length!==count)throw Error('Défi incomplet');
 return {id,title:kind==='daily'?'Défi du jour · Mission '+Number(daily[2])+' / 3':
   kind==='weekly'?'Grand défi du samedi · Trois matières':'Grand défi du dimanche · Révisions depuis la rentrée',
  description:count+' questions mélangées : espagnol, mathématiques, physique-chimie. Rédaction et raisonnement.',
  level:kind==='daily'?'Mission quotidienne':kind==='weekly'?'Contrôle du samedi':'Grand contrôle du dimanche',
  subject:'Défis',lesson:questions[0].lessonId,kind,category:'challenge',period,
  questionBank:'mixed-202611-v1',
  realLessons:[...new Set(questions.map(q=>q.lessonId))],
  questions};
}
export function mixedPlan(now=new Date()){
 const today=parisDay(now),compact=today.replace(/-/g,''),dow=new Date(today+'T12:00:00Z').getUTCDay();
 const dailyIds=dow>=1&&dow<=5&&compact>='20261116'?[1,2,3].map(i=>'DAY_'+compact+'_0'+i):[];
 const weekly=weekId(today),sunday='SUNDAY_'+addDays(monday(today),6).replace(/-/g,'');
 const ids=[...dailyIds,weekly,sunday];
 return {day:today,dailyIds,weekly,sunday,exercises:ids.map(mixedMission).filter(Boolean)};
}
export function publicMixedMission(mission){
 if(!mission)return null;
 return {...mission,questions:mission.questions.map(q=>{
  const {right,also,why,parts,answer,unit,...publicFields}=q;
  return publicFields;
 })};
}
function valueMatches(actual,expected,alternatives=[]){
 const a=n(actual).replace(/\s*([+\-=×÷*/²])\s*/g,'$1');
 return [expected,...alternatives].some(x=>a===n(x).replace(/\s*([+\-=×÷*/²])\s*/g,'$1'));
}
function calcCorrect(input,q){
 const s=n(input).replace(/[−–—]/g,'−').replace(/,/g,'.');
 if(s.length<5||!q.parts)return false;
 const operands=q.parts.filter(p=>typeof p==='number').map(String);
 if(!operands.every(v=>new RegExp('(^|[^\\d])'+v+'([^\\d]|$)').test(s)))return false;
 const operations=q.parts.filter(p=>typeof p==='string');
 if(!operations.every(op=>(op==='×'?/[×*x]/:op==='−'?/[-−]/:op==='+'?/\+/:op==='÷'?/[÷/]/:/./).test(s)))return false;
 return true;
}
function conclusionCorrect(input,q){
 const s=n(input).replace(/,/g,'.');
 if(s.length<12||!/[a-zàâéèêëîïôùûüç]/i.test(s))return false;
 const expected=n(q.answer).replace(/,/g,'.');
 if(!s.includes(expected))return false;
 if(q.unit==='cm²'&&!/(cm2|cm²|centimetr)/.test(s))return false;
 if(q.unit==='cm'&&!/(cm|centimetr)/.test(s))return false;
 if(q.unit==='°C'&&!/(°c|degres|degre)/.test(s))return false;
 if(q.unit==='neutrons'&&!/neutron/.test(s))return false;
 if(q.unit==='atomes'&&!/atome/.test(s))return false;
 if(q.unit==='livres'&&!/livre/.test(s))return false;
 return true;
}
export function gradeMixedMission(mission,responses,translationsUsed=[]){
 if(!mission||mission.questionBank!=='mixed-202611-v1'||
  !Array.isArray(responses)||responses.length!==mission.questions.length)throw Error('Réponses invalides');
 let score=0;
 const answers=mission.questions.map((q,i)=>{
  const raw=String(responses[i]??'');
  if(raw.length>2000)throw Error('Réponse trop longue');
  if(q.type==='reason'){
   let object;try{object=JSON.parse(raw);}catch{throw Error('Raisonnement incomplet');}
   const method=Number(object.m),calc=String(object.c||''),conclusion=String(object.s||'');
   if(!Number.isInteger(method)||method<0||method>=q.methods.length||!calc.trim()||!conclusion.trim())
    throw Error('Raisonnement incomplet');
   const methodOk=method===q.right,calcOk=calcCorrect(calc,q),conclusionOk=conclusionCorrect(conclusion,q);
   const points=(methodOk?0.5:0)+(calcOk?0.25:0)+(conclusionOk?0.25:0);
   score+=points;
   return {question:q.q,response:raw,correct:points===1,points,expected:q.why,
    methodResponse:q.methods[method],calculationResponse:calc,conclusionResponse:conclusion,
    methodCorrect:methodOk,calculationCorrect:calcOk,conclusionCorrect:conclusionOk,
    skill:q.skill,subject:q.subject,lessonId:q.lessonId,explanation:q.why};
  }
  const correct=q.type==='mc'?raw===String(q.right):valueMatches(raw,q.right,q.also||[]);
  score+=correct?1:0;
  return {question:q.q,response:raw,correct,points:correct?1:0,
   expected:q.type==='mc'?q.options[q.right]:q.right,subject:q.subject,
   skill:q.skill,lessonId:q.lessonId,explanation:q.why};
 });
 const count=translationsUsed.filter((v,i)=>v===true&&mission.questions[i]?.subject==='Espagnol').length;
 return {score,total:mission.questions.length,needsReview:false,answers,
  translationHelpCount:count,translationsUsed:translationsUsed.map((v,i)=>v===true&&mission.questions[i]?.subject==='Espagnol')};
}
