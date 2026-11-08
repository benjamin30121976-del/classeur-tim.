/* Huit questions autonomes par leçon BIS. Réponses et corrections côté serveur uniquement. */
function Q(prompt,answer,wrong,why){
 const a=String(answer),seen=new Set([a]);
 if(wrong.length!==3||wrong.some(v=>{const x=String(v);if(seen.has(x))return true;seen.add(x);return false;}))throw Error('QCM ambigu : '+prompt);
 return [prompt,a,wrong.map(String),why,wrong.map(x=>'« '+x+' » ne convient pas : '+why)];
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
 Q('Calcule (−'+a+')².',a*a,[-a*a,-2*a,2*a],'Le carré d’un nombre négatif est positif : (−'+a+') × (−'+a+') = '+a*a+'.'):
 Q('Calcule '+a+'⁻².','1/'+a*a,[a*a,-a*a,'1/'+(a*2)],'L’exposant −2 signifie l’inverse du carré : 1/('+a+'²) = 1/'+a*a+'.');
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
