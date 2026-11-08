/* Huit questions autonomes par leçon BIS. Réponses et corrections côté serveur uniquement. */
function Q(prompt,answer,wrong,why){
 const a=String(answer),seen=new Set([a]);
 if(wrong.length!==3||wrong.some(v=>{const x=String(v);if(seen.has(x))return true;seen.add(x);return false;}))throw Error('QCM ambigu : '+prompt);
 return [prompt,a,wrong.map(String),why,explainWrongChoices(prompt,a,wrong.map(String),why)];
}
function explainWrongChoices(prompt,expected,wrong,method){
 let reasons;
 if(prompt.startsWith('Calcule (−')&&prompt.includes(' + ')){
  reasons=[
   'Le signe négatif de cette proposition est incorrect : le nombre positif de l’addition a ici la plus grande valeur absolue.',
   'Cette proposition revient à additionner les valeurs absolues : il faut soustraire les distances à zéro.',
   'Cette proposition traite le second nombre comme négatif alors qu’il est positif dans l’énoncé.'
  ];
 }else if(prompt.startsWith('Calcule (−')&&prompt.includes(' × ')){
  reasons=[
   'Le résultat ne peut pas être positif : un facteur est négatif et l’autre positif.',
   'Cette proposition correspond à une addition des valeurs, alors que l’opération demandée est une multiplication.',
   'Cette proposition additionne les valeurs et perd le signe négatif du produit.'
  ];
 }else if(prompt.startsWith('Calcule (−')&&prompt.includes(')²')){
  reasons=[
   'Le carré est positif : multiplier deux facteurs négatifs donne un produit positif.',
   'Tu as doublé le nombre au lieu de le multiplier par lui-même.',
   'Tu as pris le double de la valeur absolue plutôt que son carré.'
  ];
 }else if(prompt.startsWith('Calcule ')&&prompt.includes('⁻²')){
  reasons=[
   'Cette réponse est le carré, pas son inverse : un exposant −2 demande 1 sur le carré.',
   'Un exposant négatif ne veut pas dire que le résultat est négatif.',
   'Tu as pris l’inverse du double, et non l’inverse du carré.'
  ];
 }else if(prompt.startsWith('Calcule ')&&prompt.includes(' + ')&&prompt.includes('/')){
  reasons=[
   'Tu as additionné les dénominateurs, mais ils doivent rester identiques pour additionner ces fractions.',
   'Tu as multiplié les numérateurs au lieu de les additionner.',
   'Tu n’as gardé que la première fraction : la seconde doit aussi être ajoutée.'
  ];
 }else if(prompt.startsWith('Calcule les 2/4')){
  reasons=[
   'Tu as calculé un quart au lieu de deux quarts, donc la moitié.',
   'Tu as conservé le nombre entier sans appliquer la fraction 2/4.',
   'Tu as ajouté 2 au résultat alors que prendre deux quarts revient exactement à diviser par 2.'
  ];
 }else if(prompt.startsWith('Écris ')&&prompt.includes('scientifique')){
  reasons=[
   'Ton exposant est inférieur de 1 : la valeur obtenue est dix fois trop petite.',
   'Ton exposant est supérieur de 1 : la valeur obtenue est dix fois trop grande.',
   'Ton exposant est inférieur de 2 : la valeur obtenue est cent fois trop petite.'
  ];
 }else if(prompt.startsWith('Dans un triangle rectangle, l’hypoténuse vaut')){
  reasons=[
   'Tu as soustrait directement les deux longueurs sans élever au carré.',
   'La somme des longueurs dépasse l’hypoténuse : un côté de l’angle droit doit être plus petit.',
   'Cette valeur ne vérifie pas l’égalité des carrés : calcule la racine de la différence.'
  ];
 }else if(prompt.startsWith('Dans un triangle rectangle, les deux côtés')){
  reasons=[
   'Tu as additionné les longueurs au lieu d’additionner leurs carrés.',
   'Tu as soustrait les longueurs alors que l’hypoténuse demande la somme des carrés.',
   'Cette longueur est trop grande et ne vérifie pas le calcul de la racine carrée.'
  ];
 }else if(prompt.startsWith('Un rectangle mesure')){
  reasons=[
   'La somme des deux côtés n’est pas la diagonale du rectangle.',
   'La différence des deux côtés n’est pas la diagonale du rectangle.',
   'Cette réponse ne vérifie pas l’égalité diagonale² = largeur² + longueur².'
  ];
 }else if(prompt.startsWith('Un triangle a pour côtés')){
  reasons=[
   'La conclusion doit découler de la comparaison des carrés des trois longueurs.',
   'Les longueurs sont suffisantes pour appliquer la réciproque ou la contraposée de Pythagore.',
   'La conclusion vient des calculs sur les longueurs, pas de la taille du dessin.'
  ];
 }else if(prompt.startsWith('Réduis ')){
  reasons=[
   'Le terme numérique constant doit rester présent après la réduction.',
   'Un nombre seul ne peut pas être regroupé avec un terme contenant x.',
   'Les deux termes en x s’additionnent : les coefficients ne doivent pas être soustraits.'
  ];
 }else if(prompt.startsWith('Calcule ')&&prompt.includes(' pour x = ')){
  reasons=[
   'Tu as additionné des valeurs au lieu de commencer par multiplier le coefficient par x.',
   'Le dernier nombre doit être ajouté, pas soustrait.',
   'Tu as oublié de multiplier la valeur de x par son coefficient.'
  ];
 }else if(prompt.startsWith('Développe (x + ')){
  reasons=[
   'Tu as oublié le produit des deux nombres constants dans le développement.',
   'Tu as mal additionné les coefficients des deux termes en x.',
   'Le produit des deux nombres positifs est positif, et non négatif.'
  ];
 }else if(prompt.startsWith('Développe ')){
  reasons=[
   'Le facteur devant les parenthèses doit aussi multiplier le nombre constant négatif.',
   'Le coefficient de x est mal calculé : multiplie les coefficients plutôt que de les additionner.',
   'Le terme constant est négatif puisqu’un nombre positif multiplie un nombre négatif.'
  ];
 }else if(prompt.startsWith('Programme de calcul :')){
  reasons=[
   'Tu as oublié d’ajouter le nombre de fois demandé du nombre de départ lors de la dernière étape.',
   'Tu n’as pas multiplié par le facteur indiqué le nombre soustrait au départ.',
   'La soustraction de départ doit produire un terme négatif après développement.'
  ];
 }else if(prompt.startsWith('Dans le triangle ABC, ')&&prompt.includes('Calcule AC')){
  reasons=[
   'Cette valeur ne respecte pas les deux rapports égaux : vérifie le produit en croix.',
   'Tu as mal isolé AC : il faut multiplier AN par AB puis diviser par AM.',
   'Doubler arbitrairement une longueur ne conserve pas le coefficient de proportionnalité.'
  ];
 }else if(prompt.startsWith('Dans le triangle ABC, ')&&prompt.includes('Calcule MN')){
  reasons=[
   'Tu as inversé le rapport petit/grand : MN est plus petit que BC.',
   'Tu as pris un nombre incorrect de parts du segment BC.',
   'Tu as additionné une longueur et un numérateur au lieu d’appliquer le rapport.'
  ];
 }else if(prompt.startsWith('Dans le triangle ABC, ')&&prompt.includes('rapport MN/BC')){
  reasons=[
   'Tu as inversé le rapport : MN/BC est dans le même sens que AM/AB.',
   'Tu as modifié le dénominateur du rapport, alors que Thalès conserve le rapport donné.',
   'Tu as modifié le numérateur du rapport, alors que Thalès conserve le rapport donné.'
  ];
 }else if(prompt.startsWith('Un triangle rectangle a deux côtés')){
  reasons=[
   'Tu as oublié de diviser le produit base × hauteur par deux.',
   'Tu as additionné les longueurs, alors qu’une aire se calcule à partir de leur produit.',
   'Tu as ajouté un nombre après le calcul de l’aire : ce n’est pas demandé.'
  ];
 }else if(prompt.includes('Quel outil')||prompt.includes('Quelle méthode')){
  const rule=wrong.map(x=>{
   if(x.includes('Thalès'))return 'Thalès nécessite des points alignés et des droites parallèles ; ce n’est pas la bonne condition ici.';
   if(x.includes('Réciproque'))return 'La réciproque sert à prouver un angle droit à partir des trois côtés, et pas à calculer un côté d’un triangle déjà rectangle.';
   if(x.includes('Contraposée'))return 'La contraposée sert à montrer qu’un triangle n’est pas rectangle quand les carrés diffèrent.';
   if(x.includes('Pythagore'))return 'Pythagore direct nécessite un triangle déjà rectangle ; la situation donnée demande une autre propriété.';
   return 'Calculer un périmètre ou une aire ne démontre pas la relation de longueurs ou l’angle demandé.';
  });
  reasons=rule;
 }
 if(!reasons||reasons.length!==3)throw Error('Correction spécifique manquante : '+prompt);
 return wrong.map((option,i)=>'Pour la réponse « '+option+' » : '+reasons[i]+' Méthode à suivre : '+method);
}

const T=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[6,8,10],[9,12,15],[12,16,20],[10,24,26]];
const N=[[4,5,6],[5,6,8],[6,7,8],[7,8,10],[8,9,11],[9,10,12],[10,11,14],[12,13,17]];
const R=[[1,2,2,4],[2,3,4,6],[1,3,3,9],[2,5,4,10],[3,4,6,8],[1,4,2,8],[3,5,6,10],[2,7,4,14]];
const sup=n=>String(n).replaceAll('0','⁰').replaceAll('1','¹').replaceAll('2','²').replaceAll('3','³').replaceAll('4','⁴').replaceAll('5','⁵');
function arithmetic(i){
 const a=3+i,b=9+i*2,k=b-a;
 return i%2===0?
 Q('Calcule (−'+a+') + '+b+'.',k,[-k,a+b,-a-b],'Le nombre positif '+b+' a la plus grande valeur absolue : '+b+' − '+a+' = '+k+'.'):
 Q('Calcule (−'+a+') × 3.',-3*a,[3*a,-a-3,a+3],'Un nombre négatif multiplié par un positif reste négatif : '+a+' × 3 = '+a*3+'.');
}
function fractions(i){
 const a=1+i,b=2+i,d=8+i*2,k=a+b;
 return i%2===0?
 Q('Calcule '+a+'/'+d+' + '+b+'/'+d+'.',k+'/'+d,[k+'/'+(2*d),(a*b)+'/'+d,a+'/'+d],'Même dénominateur : on additionne les numérateurs sans changer le dénominateur. Résultat : '+k+'/'+d+'.'):
 Q('Calcule les 2/4 de '+(12+4*i)+'.',(12+4*i)/2,[(12+4*i)/4,(12+4*i),((12+4*i)/2)+2],'2/4 est la moitié : on divise le nombre par deux.');
}
function powers(i){
 const a=3+i;
 return i%2===0?
 Q('Calcule le carré de −'+a+', c’est-à-dire (−'+a+')².',a*a,[-a*a,-2*a,2*a],'Le carré d’un nombre négatif est positif : (−'+a+') × (−'+a+') = '+a*a+'.'):
 Q('Calcule '+a+'⁻² en appliquant la règle des exposants négatifs.','1/'+a*a,[a*a,-a*a,'1/'+(a*2)],'L’exposant −2 signifie l’inverse du carré : 1/('+a+'²) = 1/'+a*a+'.');
}
function scientific(i){
 const n=2+i,p=2+(i%3),fmt=x=>n+' × 10'+sup(x);
 return Q('Écris '+(n*10**p).toLocaleString('fr-FR')+' en écriture scientifique.',fmt(p),[fmt(p-1),fmt(p+1),fmt(p-2)],'On choisit un coefficient entre 1 et 10 et la puissance de dix adaptée : '+fmt(p)+'.');
}
function pyth(i,mode){
 const [a,b,c]=T[i];
 if(mode==='side')return Q('Dans un triangle rectangle, l’hypoténuse vaut '+c+' cm et un côté de l’angle droit '+a+' cm. Calcule l’autre côté.',b+' cm',[(c-a)+' cm',(a+c)+' cm',(b+1)+' cm'],'Pythagore : côté = √('+c+'² − '+a+'²) = '+b+' cm.');
 if(mode==='diagonal')return Q('Un rectangle mesure '+a+' m par '+b+' m. Quelle est sa diagonale ?',c+' m',[(a+b)+' m',(b-a)+' m',(c+1)+' m'],'La diagonale est l’hypoténuse : √('+a+'² + '+b+'²) = '+c+' m.');
 return Q('Dans un triangle rectangle, les deux côtés de l’angle droit mesurent '+a+' cm et '+b+' cm. Quelle est l’hypoténuse ?',c+' cm',[(a+b)+' cm',(b-a)+' cm',(c+3)+' cm'],'Pythagore : √('+a+'² + '+b+'²) = '+c+' cm.');
}
function triangleCheck(i,non=false){
 const [a,b,c]=non?N[i]:i%2===0?T[i]:N[i],valid=a*a+b*b===c*c,correct=valid?'Oui':'Non';
 return Q('Un triangle a pour côtés '+a+', '+b+' et '+c+' cm. Est-il rectangle ?',correct,[valid?'Non':'Oui','Impossible à déterminer','Il faut mesurer le dessin'],'On compare les carrés : '+a+'² + '+b+'² = '+(a*a+b*b)+' et '+c+'² = '+c*c+'. '+(valid?'Ces valeurs sont égales.':'Elles sont différentes.'));
}
function algebra(i,type){
 const a=2+i%3,b=3+i%4,c=1+i%2;
 if(type==='substitution'){
  const x=-(2+i),k=a*x+c;
  return Q('Calcule '+a+'x + '+c+' pour x = '+x+'.',k,[a+x+c,a*x-c,x+c],'On remplace x : '+a+' × ('+x+') + '+c+' = '+k+'.');
 }
 if(type==='develop'){
  const ab=a*b,n=a*c;
  return Q('Développe '+a+'('+b+'x − '+c+').',ab+'x − '+n,[ab+'x − '+c,(ab+1)+'x − '+n,ab+'x + '+n],'Le '+a+' multiplie les deux termes : '+ab+'x − '+n+'.');
 }
 if(type==='double'){
  const k=a+b,n=a*b;
  return Q('Développe (x + '+a+')(x + '+b+').','x² + '+k+'x + '+n,['x² + '+k+'x','x² + '+(k+1)+'x + '+n,'x² + '+k+'x − '+n],'Quatre produits : x² + '+b+'x + '+a+'x + '+n+' = x² + '+k+'x + '+n+'.');
 }
 if(type==='programme'){
  const k=a+c,n=a*b;
  return Q('Programme de calcul : choisir x, retirer '+b+', multiplier le résultat par '+a+', puis ajouter '+c+' fois le nombre de départ. Quelle expression obtient-on après réduction ?',k+'x − '+n,[a+'x − '+n,k+'x − '+b,k+'x + '+n],'Après les étapes : '+a+'(x − '+b+') + '+c+'x = '+k+'x − '+n+'.');
 }
 const k=a+b;
 return Q('Réduis '+a+'x + '+b+'x − '+c+'.',k+'x − '+c,[k+'x',(k-c)+'x',(a-b)+'x − '+c],'Les termes en x se regroupent : '+k+'x. Le nombre −'+c+' reste seul.');
}
function thales(i,mode){
 const [am,ab,an,ac]=R[i],p=am,d=ab;
 const pre='Dans le triangle ABC, M est sur [AB], N sur [AC] et (MN) est parallèle à (BC). ';
 if(mode==='length')return Q(pre+'AM = '+am+' cm, AB = '+ab+' cm, AN = '+an+' cm. Calcule AC.',ac+' cm',[(ac+2)+' cm',(ac-1)+' cm',(ac*2)+' cm'],'Thalès : AM/AB = AN/AC, donc AC = '+an+' × '+ab+' / '+am+' = '+ac+' cm.');
 if(mode==='segment'){
  const bc=ab*4,mn=am*4;
  return Q(pre+'MN/BC = '+p+'/'+d+' et BC = '+bc+' cm. Calcule MN.',mn+' cm',[(bc*d/p)+' cm',((bc/d)+1)+' cm',(bc+p)+' cm'],'Thalès : MN = '+bc+' × '+p+'/'+d+' = '+mn+' cm.');
 }
 return Q(pre+'AM/AB = '+p+'/'+d+'. Quel est le rapport MN/BC ?',p+'/'+d,[d+'/'+p,p+'/'+(d+1),(p+1)+'/'+d],'Les rapports correspondants AM/AB, AN/AC et MN/BC sont égaux selon Thalès.');
}
const METHODS=[
 ['Un triangle est rectangle et deux côtés sont connus. Quel outil calcule le troisième ?','Théorème de Pythagore'],
 ['Trois côtés sont connus mais aucun angle droit n’est indiqué. Quel outil permet de tester si le triangle est rectangle ?','Réciproque de Pythagore'],
 ['Dans deux triangles, des points sont alignés et les segments correspondants sont parallèles. Quel outil permet de calculer les longueurs ?','Théorème de Thalès'],
 ['Les trois côtés d’un triangle ne vérifient pas l’égalité de Pythagore. Quelle méthode prouve qu’il n’est pas rectangle ?','Contraposée de Pythagore']
];
function method(i){
 const [prompt,good]=METHODS[i%4],all=METHODS.map(x=>x[1]),others=all.filter(x=>x!==good);
 return Q(prompt,good,others,'On choisit « '+good+' » car ses conditions correspondent aux données de l’énoncé.');
}
function area(i){
 const a=4+i,b=6+i,k=a*b/2;
 return Q('Un triangle rectangle a deux côtés perpendiculaires de '+a+' cm et '+b+' cm. Calcule son aire.',k+' cm²',[a*b+' cm²',(a+b)+' cm²',(k+2)+' cm²'],'Aire = base × hauteur / 2 = '+a+' × '+b+' / 2 = '+k+' cm².');
}
export function mathExtraQuestions(lessonId){
 const id=Number(String(lessonId).slice(4));if(id<1||id>23)return [];
 const list=[];
 for(let i=0;i<8;i++){
  let item;
  switch(id){
   case 1:item=arithmetic(i);break;
   case 2:item=fractions(i);break;
   case 3:item=powers(i);break;
   case 4:item=scientific(i);break;
   case 5:item=i%2===0?pyth(i):method(Math.floor(i/2));break;
   case 6:item=pyth(i,i%2===0?'side':'hyp');break;
   case 7:item=triangleCheck(i);break;
   case 8:item=triangleCheck(i,true);break;
   case 9:item=pyth(i,'diagonal');break;
   case 10:item=algebra(i,i%2===0?'reduce':'substitution');break;
   case 11:item=algebra(i,'develop');break;
   case 12:item=algebra(i,'double');break;
   case 13:item=algebra(i,'programme');break;
   case 14:item=i%2===0?thales(i):method(Math.floor(i/2));break;
   case 15:item=thales(i,i%2===0?'length':'segment');break;
   case 16:item=thales(i,i%2===0?'ratio':'segment');break;
   case 17:item=i%2===0?algebra(i,'reduce'):thales(i);break;
   case 18:item=i%2===0?pyth(i):thales(i,'segment');break;
   case 19:item=i%3===0?powers(i):i%3===1?fractions(i):arithmetic(i);break;
   case 20:item=algebra(i,i%2===0?'develop':'double');break;
   case 21:item=i%2===0?method(Math.floor(i/2)):thales(i);break;
   case 22:item=i%2===0?area(i):method(Math.floor(i/2));break;
   case 23:item=i%2===0?algebra(i,'reduce'):pyth(i);break;
  }
  list.push(item);
 }
 return list;
}
