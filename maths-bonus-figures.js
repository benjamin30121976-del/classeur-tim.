/* Figures pédagogiques des bonus maths déjà publiés.
 * Lecture seule : aucune clé de correction, aucun accès Firebase, aucune nouvelle tentative.
 * Les dessins montrent uniquement les données de l'énoncé, jamais les résultats.
 */
(function(){
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const PYTHAGORE=[
  {names:'ABC',right:'B'},
  {names:'IJK',right:'J'},
  {names:'ABC',right:'B',sizes:{AB:'3 cm',BC:'4 cm',AC:'?'}},
  {names:'DEF',right:'E',sizes:{DE:'5 cm',EF:'12 cm',DF:'?'}},
  {names:'GHI',right:'H',sizes:{GH:'9 cm',GI:'15 cm',HI:'?'}},
  {names:'JKL',right:'K',sizes:{JL:'10 cm',JK:'6 cm',KL:'?'}},
  {names:'ABC',right:'B',sizes:{AB:'7 cm',BC:'24 cm',AC:'?'}},
  {names:'MNP',right:'N',sizes:{MP:'25 cm',MN:'7 cm',NP:'?'}},
  {names:'ABC',right:'A',sizes:{AB:'5 cm',AC:'12 cm',BC:'?'}},
  {type:'ladder'}
 ];
 const THALES=[
  {},
  {},
  {sizes:{AM:'3 cm',AB:'9 cm',AN:'4 cm',AC:'?'}},
  {sizes:{AM:'4 cm',AB:'10 cm',AC:'15 cm',AN:'?'}},
  {sizes:{AM:'5 cm',AB:'15 cm',MN:'4 cm',BC:'?'}},
  {sizes:{AM:'6 cm',AB:'10 cm',AN:'9 cm',AC:'?'}},
  {sizes:{AB:'12 cm',AM:'8 cm',BC:'9 cm',MN:'?'}},
  {type:'crossed',sizes:{AM:'2 cm',AB:'8 cm',AN:'3 cm',AC:'?'}},
  {sizes:{AM:'4 cm',AB:'12 cm',AN:'5 cm',AC:'?'}},
  {small:['D','E'],sizes:{AD:'4 cm',AB:'10 cm',DE:'6 cm',BC:'?'}}
 ];
 const RECTANGLES=[
  {type:'outline'},
  {l:'3 cm',w:'4 cm'},
  {l:'3 cm',w:'4 cm'},
  {l:'3 cm',w:'4 cm',grid:true},
  {type:'outline'},
  {l:'6 cm',w:'5 cm'},
  {l:'5 cm',w:'2 cm'},
  {l:'7 cm',w:'3 cm'},
  {l:'8 cm',w:'4 cm'},
  {l:'9 m',w:'6 m'}
 ];
 const PROMPTS={
  TIMBONUSM03:[
   'Regarde le triangle ABC. Il est rectangle en B (le petit carré marque l’angle droit). Quel côté est son hypoténuse ?',
   'Regarde le triangle IJK, rectangle en J. Quelle égalité de Pythagore est correcte ?',
   'Sur la figure, ABC est rectangle en B. AB mesure 3 cm et BC mesure 4 cm. Calcule la longueur AC.',
   'Sur la figure, DEF est rectangle en E. DE mesure 5 cm et EF mesure 12 cm. Calcule DF.',
   'Sur la figure, GHI est rectangle en H. GH mesure 9 cm et GI mesure 15 cm. Calcule HI.',
   'Sur la figure, JKL est rectangle en K. JL mesure 10 cm et JK mesure 6 cm. Calcule KL.',
   'Sur la figure, ABC est rectangle en B. AB mesure 7 cm et BC mesure 24 cm. Calcule AC.',
   'Sur la figure, MNP est rectangle en N. MP mesure 25 cm et MN mesure 7 cm. Calcule NP.',
   'Sur la figure, ABC est rectangle en A. AB mesure 5 cm et AC mesure 12 cm. Quelle égalité faut-il écrire pour calculer BC ?',
   'Une échelle est posée contre un mur : le pied est à 2,4 m du mur, et le haut à 3,2 m du sol. Calcule la longueur de l’échelle.'
  ],
  TIMBONUSM05:[
   'Regarde la figure : A, M et B sont alignés ; A, N et C sont alignés ; (MN) est parallèle à (BC). Quel théorème permet de comparer les longueurs ?',
   'Regarde les deux triangles de la figure. Quelle égalité de rapports de Thalès est correcte ?',
   'Sur la figure, AM = 3 cm, AB = 9 cm, AN = 4 cm, et (MN) est parallèle à (BC). Calcule AC.',
   'Sur la figure, AM = 4 cm, AB = 10 cm et AC = 15 cm. Avec (MN) parallèle à (BC), calcule AN.',
   'Sur la figure, AM = 5 cm, AB = 15 cm et MN = 4 cm. Avec (MN) parallèle à (BC), calcule BC.',
   'Sur la figure, AM = 6 cm, AB = 10 cm et AN = 9 cm. Avec (MN) parallèle à (BC), calcule AC.',
   'Sur la figure, AB = 12 cm, AM = 8 cm et BC = 9 cm. Avec (MN) parallèle à (BC), calcule MN.',
   'Regarde la figure croisée : les deux triangles se rejoignent en A, et (MN) est parallèle à (BC). AM = 2 cm, AB = 8 cm, AN = 3 cm. Calcule AC.',
   'Dans la figure, AM = 4 cm, AB = 12 cm et AN = 5 cm. Avec AM/AB = AN/AC, quelle égalité du produit en croix est correcte ?',
   'Dans la figure, D est sur [AB], E sur [AC] et (DE) est parallèle à (BC). AD = 4 cm, AB = 10 cm et DE = 6 cm. Calcule BC et rédige une phrase-réponse.'
  ],
  TIMBONUSPERIM20261114:[
   'Que signifie le périmètre d’un rectangle ?',
   'Ce rectangle mesure 3 cm sur 4 cm. Quel calcul donne son périmètre ?',
   'Ce rectangle mesure 3 cm sur 4 cm. Calcule son périmètre en cm.',
   'Ce rectangle mesure 3 cm sur 4 cm. Quelle est son aire (la surface à l’intérieur) ? Choisis la bonne unité.',
   'Pour placer un cadre autour d’une affiche rectangulaire, quelle grandeur faut-il calculer ?',
   'Une affiche mesure 6 cm sur 5 cm. Calcule son périmètre en cm : c’est la longueur de baguette nécessaire pour son cadre.',
   'Ce rectangle mesure 5 cm sur 2 cm. Calcule son périmètre en cm.',
   'Pour un rectangle de 7 cm sur 3 cm, un élève calcule 7 × 3. Quelle proposition explique correctement son erreur sur le périmètre ?',
   'Ce rectangle mesure 8 cm sur 4 cm. Calcule son périmètre en cm, écris tes calculs, puis rédige une phrase-réponse.',
   'Ce potager mesure 9 m sur 6 m. Calcule son périmètre en mètres pour connaître la longueur de clôture nécessaire. Écris le calcul et la phrase-réponse.'
  ]
 };
 function node(tag,attributes,text){
  const element=document.createElementNS(NS,tag);
  for(const key of Object.keys(attributes||{}))element.setAttribute(key,String(attributes[key]));
  if(text!==undefined)element.textContent=text;
  return element;
 }
 function add(svg,tag,attrs,text){const n=node(tag,attrs,text);svg.append(n);return n;}
 function line(svg,x1,y1,x2,y2,stroke='#2b5577',width=3){
  add(svg,'line',{x1,y1,x2,y2,stroke,'stroke-width':width,'stroke-linecap':'round'});
 }
 function badge(svg,x,y,text){
  const value=String(text);
  const width=Math.max(27,value.length*7.7+14);
  add(svg,'rect',{x:x-width/2,y:y-16,width,height:26,rx:7,fill:'#fff',stroke:'#b3cadc','stroke-width':1});
  add(svg,'text',{x,y:y+2,'font-size':14,'font-weight':700,fill:'#183b59','text-anchor':'middle'},value);
 }
 function vertex(svg,x,y,letter){
  add(svg,'circle',{cx:x,cy:y,r:4,fill:'#234d74'});
  add(svg,'text',{x:x+(x<100?-16:x>300?13:0),y:y+(y<55?-10:y>240?20:-12),
   fill:'#142b42','font-size':18,'font-weight':700,'text-anchor':'middle'},letter);
 }
 function baseSvg(description){
  const svg=node('svg',{viewBox:'0 0 390 320',role:'img','aria-label':description,
   style:'display:block;width:100%;max-width:520px;height:auto;margin:auto'});
  add(svg,'title',{},description);
  add(svg,'rect',{x:1,y:1,width:388,height:318,rx:15,fill:'#f8fbff',stroke:'#c4d7e8','stroke-width':2});
  return svg;
 }
 function finish(svg,caption){
  add(svg,'text',{x:195,y:303,'text-anchor':'middle','font-size':12,fill:'#576b7c'},caption);
  return svg;
 }
 function rightMark(svg,x,y,atBottom=true){
  // Angle droit entre le côté vertical et le côté horizontal.
  const yy=atBottom?y-18:y+18;
  line(svg,x,yy,x+18,yy,'#d36c14',2.6);
  line(svg,x+18,yy,x+18,y,'#d36c14',2.6);
 }
 function pythagore(spec){
  const sv=baseSvg(spec.type==='ladder'?'Échelle, mur vertical et sol horizontal formant un triangle rectangle':
   'Triangle '+spec.names+' rectangle en '+spec.right+', longueurs indiquées sur les côtés');
  if(spec.type==='ladder'){
   line(sv,65,250,355,250,'#596777',5);
   line(sv,65,43,65,250,'#596777',5);
   line(sv,65,50,326,250,'#09679b',5);
   rightMark(sv,65,250);
   badge(sv,34,153,'3,2 m');
   badge(sv,204,273,'2,4 m');
   badge(sv,235,125,'Échelle = ?');
   add(sv,'text',{x:90,y:43,fill:'#263f5a','font-size':14},'Mur');
   add(sv,'text',{x:335,y:275,fill:'#263f5a','font-size':14},'Sol');
  }else{
   const letters=spec.names.split('');
   const rightFirst=spec.right===letters[0];
   const coords=rightFirst?[[69,247],[69,46],[332,247]]:[[69,46],[69,247],[332,247]];
   const points=Object.fromEntries(letters.map((k,i)=>[k,coords[i]]));
   const draw=(a,b)=>line(sv,...points[a],...points[b],'#1e6299',3);
   draw(letters[0],letters[1]);draw(letters[1],letters[2]);draw(letters[0],letters[2]);
   rightMark(sv,69,247);
   for(const letter of letters){const [x,y]=points[letter];vertex(sv,x,y,letter);}
   const sz=spec.sizes||{};
   const leftKey=letters[0]+letters[1];
   const bottomKey=rightFirst?letters[0]+letters[2]:letters[1]+letters[2];
   const diagKey=rightFirst?letters[1]+letters[2]:letters[0]+letters[2];
   if(Object.hasOwn(sz,leftKey))badge(sv,42,146,leftKey+' = '+sz[leftKey]);
   if(Object.hasOwn(sz,bottomKey))badge(sv,215,275,bottomKey+' = '+sz[bottomKey]);
   if(Object.hasOwn(sz,diagKey))badge(sv,255,130,diagKey+' = '+sz[diagKey]);
  }
  return finish(sv,'Schéma non à l’échelle.');
 }
 function thales(spec){
  const small=spec.small||['M','N'],l=small[0],r=small[1],sz=spec.sizes||{};
  const crossed=spec.type==='crossed';
  const sv=baseSvg(crossed?'Deux triangles en configuration croisée, les droites MN et BC sont parallèles':
    'Deux triangles imbriqués : A, '+l+', B alignés et A, '+r+', C alignés. '+l+r+' parallèle à BC.');
  if(crossed){
   const pt={A:[188,143],M:[65,247],B:[311,37],N:[65,37],C:[312,248]};
   line(sv,...pt.M,...pt.B,'#23639a');line(sv,...pt.N,...pt.C,'#23639a');
   line(sv,...pt.M,...pt.N,'#2b8a63',4);line(sv,...pt.B,...pt.C,'#2b8a63',4);
   for(const k of ['M','A','B','N','C'])vertex(sv,...pt[k],k);
   const loc={AM:[98,201],AB:[276,93],AN:[102,97],AC:[272,202],MN:[55,143],BC:[329,143]};
   for(const [key,val] of Object.entries(sz))if(loc[key])badge(sv,...loc[key],key+' = '+val);
  }else{
   const pt={A:[186,39],B:[57,246],C:[327,246]};
   pt[l]=[134,122];pt[r]=[244,122];
   line(sv,...pt.A,...pt.B);line(sv,...pt.A,...pt.C);
   line(sv,...pt.B,...pt.C,'#2b8a63',4);
   line(sv,...pt[l],...pt[r],'#2b8a63',4);
   for(const k of ['A',l,r,'B','C'])vertex(sv,...pt[k],k);
   const loc={AB:[55,166],AC:[335,168],BC:[195,269]};
   loc['A'+l]=[125,79];loc['A'+r]=[248,79];loc[l+r]=[195,138];
   for(const [key,val] of Object.entries(sz))if(loc[key])badge(sv,...loc[key],key+' = '+val);
  }
  add(sv,'text',{x:195,y:289,'text-anchor':'middle',fill:'#1b7357',
   'font-size':15,'font-weight':700},'('+l+r+') ∥ (BC)');
  return finish(sv,'Schéma non à l’échelle. Les segments verts sont parallèles.');
 }
 function rectangle(spec,index){
  const label=spec.type==='outline'?'Rectangle dessiné sans dimensions':
   'Rectangle : longueur '+spec.l+' et largeur '+spec.w+', sans résultat indiqué';
  const sv=baseSvg(label);
  const x=73,y=68,w=250,h=148;
  add(sv,'rect',{x,y,width:w,height:h,fill:'#e8f4fd',stroke:'#1b649c','stroke-width':5});
  if(spec.grid){
   for(let j=1;j<3;j++)line(sv,x+j*w/3,y,x+j*w/3,y+h,'#9bc5df',1.5);
   for(let j=1;j<4;j++)line(sv,x,y+j*h/4,x+w,y+j*h/4,'#9bc5df',1.5);
  }
  if(spec.l&&spec.w){
   badge(sv,197,55,spec.l);
   badge(sv,345,139,spec.w);
  }else if(index===4){
   add(sv,'text',{x:196,y:145,fill:'#226a96','font-size':17,'text-anchor':'middle'},'Affiche');
  }
  return finish(sv,'Schéma non à l’échelle.');
 }
 function render(ex,index){
  if(!ex||ex.kind!=='bonus-day'||ex.subject!=='Mathématiques')return null;
  const configs=ex.id==='TIMBONUSM03'?PYTHAGORE:
    ex.id==='TIMBONUSM05'?THALES:
    ex.id==='TIMBONUSPERIM20261114'?RECTANGLES:null;
  if(!configs||!configs[index])return null;
  const fig=document.createElement('figure');
  fig.className='tim-math-bonus-figure';
  fig.style.cssText='margin:12px 0 18px;max-width:570px;padding:6px;border:1px solid #8daac4;border-radius:15px;background:#f8fbff;color:#1b3047';
  const svg=ex.id==='TIMBONUSM03'?pythagore(configs[index]):
    ex.id==='TIMBONUSM05'?thales(configs[index]):rectangle(configs[index],index);
  const caption=document.createElement('figcaption');
  caption.textContent='Figure de l’énoncé — toutes les mesures indiquées sont des données, pas les réponses.';
  caption.style.cssText='text-align:center;font-size:12px;color:#334d65;padding:5px';
  fig.append(svg,caption);
  return fig;
 }
 function displayPrompt(ex,index,fallback){
  const prompts=ex?.kind==='bonus-day'&&ex?.subject==='Mathématiques'?PROMPTS[ex.id]:null;
  return prompts?.[index]||fallback;
 }
 window.TIM_BONUS_FIGURES=Object.freeze({render,displayPrompt});
})();
