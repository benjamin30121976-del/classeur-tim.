/* 12 novembre 2026 : réciproque de Thalès.
   Exercices originaux du classeur. Les énoncés n°25 p.253 du manuel ne sont PAS fournis.
   Importés par compte Parent dans la collection exercices Firebase existante. */
const Q=(prompt,choices,right,why)=>({prompt,choices,right,why});
export const MATH12_IDS=['MTH12_01','MTH12_02','MTH12_03'];
const SERIES=[
 [
  Q('À quoi sert la réciproque du théorème de Thalès ?',['Prouver que deux droites sont parallèles','Calculer une aire','Mesurer un angle au rapporteur','Prouver que deux droites sont perpendiculaires'],0,'La réciproque permet de démontrer un parallélisme à partir de rapports de longueurs égaux et d’alignements correctement vérifiés.'),
  Q('Pour utiliser la réciproque de Thalès dans un triangle ABC avec D sur [AB] et E sur [AC], que faut-il vérifier en premier ?',['Que AB = AC','Que les points sont alignés dans le même ordre','Que le triangle est rectangle','Que D et E sont des milieux'],1,'On vérifie l’alignement et l’ordre des points sur les deux côtés avant de comparer des rapports.'),
  Q('Dans le triangle ABC, A, D, B et A, E, C sont alignés dans cet ordre. Quels rapports faut-il comparer ?',['AD / AC et AE / AB','DE / AB et AD / BC','AD / AB et AE / AC','AB / AC et DE / BC'],2,'Il faut comparer les proportions sur les côtés correspondants : AD/AB et AE/AC.'),
  Q('Si AD = 2 cm et AB = 5 cm, combien vaut AD / AB ?',['0,2','2,5','0,5','0,4'],3,'On divise 2 par 5 : AD/AB = 0,4.'),
  Q('Si AE = 3 cm et AC = 6 cm, combien vaut AE / AC ?',['0,5','2','0,3','3'],0,'3/6 = 1/2 = 0,5.'),
  Q('Les alignements sont corrects et AD / AB = AE / AC = 0,5. Quelle conclusion est valable ?',['(DE) est perpendiculaire à (BC)','(DE) est parallèle à (BC)','AB = AC','DE = BC'],1,'Les rapports égaux et les alignements dans le même ordre permettent de conclure au parallélisme par la réciproque.'),
  Q('Les alignements sont corrects, AD / AB = 0,5 et AE / AC = 0,6. Quelle conclusion ?',['(DE) est parallèle à (BC)','D est le milieu de [AB]','(DE) n’est pas parallèle à (BC)','Le dessin suffit à prouver le parallélisme'],2,'Des rapports différents, avec la configuration correcte, montrent que les droites ne sont pas parallèles : contraposée.'),
  Q('Un dessin semble montrer deux droites parallèles. Cela suffit-il pour une preuve ?',['Oui, toujours','Oui si le dessin est précis','Oui si les segments sont de même couleur','Non, il faut vérifier les conditions mathématiques'],3,'Un dessin est un indice, pas une démonstration. Il faut vérifier les alignements et les rapports.'),
  Q('Quel énoncé correspond au théorème de Thalès direct, et non à sa réciproque ?',['Des droites parallèles permettent d’écrire des rapports égaux','Des rapports égaux permettent de prouver un parallélisme','Les rapports différents prouvent un non-parallélisme','Un dessin suffit pour conclure'],0,'Le théorème direct part du parallélisme connu pour calculer des rapports. La réciproque fait l’inverse.'),
  Q('Pour conclure avec la réciproque, quelles deux conditions doivent être réunies ?',['Deux angles droits et deux longueurs égales','Même ordre des points alignés et rapports correspondants égaux','Un triangle isocèle et un angle de 60°','Trois segments de même longueur'],1,'Les alignements dans le même ordre et l’égalité des rapports correspondants sont indispensables.')
 ],
 [
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=3, AB=6, AE=4, AC=8. (DE) et (BC) sont-elles parallèles ?',['Oui, car les deux rapports valent 0,5','Non, car 3 est différent de 4','Non, car les longueurs sont toutes différentes','Impossible, car aucune longueur ne correspond'],0,'3/6 = 0,5 et 4/8 = 0,5 ; mêmes ordres d’alignement : les droites sont parallèles.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=4, AB=10, AE=6, AC=12. Conclusion ?',['Parallèles car 4+6=10','Non parallèles car 4/10=0,4 et 6/12=0,5','Parallèles car AB est plus grand que AD','Impossible à calculer'],1,'0,4 et 0,5 sont différents. Les droites ne sont pas parallèles dans cette configuration.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=2, AB=8, AE=3, AC=12. Conclusion ?',['Non parallèles car 2≠3','Impossible, il manque BC','Parallèles car les rapports valent 0,25','Perpendiculaires car 8 et 12 sont pairs'],2,'2/8 = 0,25 et 3/12 = 0,25, donc parallèles par la réciproque.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=5, AB=10, AE=4, AC=10. Conclusion ?',['Parallèles car les côtés mesurent 10 cm','Parallèles car 5−4=1','Impossible sans mesurer un angle','Non parallèles car 0,5 est différent de 0,4'],3,'5/10 = 0,5 et 4/10 = 0,4. Les rapports diffèrent.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=3, AB=9, AE=4, AC=12. Conclusion ?',['Parallèles : les rapports valent 1/3','Non parallèles : 3≠4','Perpendiculaires : 9+3=12','On ne peut jamais utiliser Thalès sur des fractions'],0,'3/9 = 1/3 et 4/12 = 1/3. Les droites sont parallèles.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=7, AB=14, AE=3, AC=6. Conclusion ?',['Non parallèles car 7≠3','Parallèles : les rapports valent 1/2','Impossible car les longueurs sont trop petites','Perpendiculaires car 7+3=10'],1,'7/14 = 1/2 et 3/6 = 1/2.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=2, AB=3, AE=4, AC=6. Conclusion ?',['Non parallèles car 2/3≠4/6','Impossible, il manque une longueur','Parallèles car 2/3=4/6','Parallèles seulement si le triangle est rectangle'],2,'Les rapports sont équivalents : 2/3 = 4/6.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=3, AB=6, AE=6, AC=9. Conclusion ?',['Parallèles car 3+6=9','Parallèles car 3 et 6 sont pairs','Impossible sans dessin','Non parallèles car 1/2≠2/3'],3,'3/6 = 1/2, tandis que 6/9 = 2/3.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=4, AB=5, AE=6, AC=7,5. Conclusion ?',['Parallèles : les rapports valent 0,8','Non parallèles car 5≠7,5','Impossible avec des décimaux','Perpendiculaires'],0,'4/5 = 0,8 et 6/7,5 = 0,8 : parallèles.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AD=6, AB=9, AE=10, AC=15. Conclusion ?',['Non parallèles car 6≠10','Parallèles car les rapports valent 2/3','Impossible car les longueurs dépassent 10','Perpendiculaires'],1,'6/9 = 2/3 et 10/15 = 2/3 : parallèles.')
 ],
 [
  Q('Dans ABC, A-D-B et A-E-C sont alignés dans le même ordre. AD/AB=1/2 et AE/AC=2/4. Conclusion ?',['Parallèles car 1/2 = 2/4','Non parallèles car 1≠2','On ne peut jamais comparer des fractions','Perpendiculaires'],0,'Une fraction égale à une autre (1/2=2/4) permet d’utiliser la réciproque.'),
  Q('D est sur [AB] et E sur [AC]. Quelle égalité sert à prouver (DE)//(BC) ?',['AD/AC = AB/AE','AD/AB = AE/AC','AD/AE = AC/AB','AB/BC = AE/DE'],1,'Les rapports AD/AB et AE/AC utilisent deux longueurs correspondantes sur chaque côté.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AB=15, AD=9, AC=10, AE=6. Conclusion ?',['Non parallèles','Données insuffisantes','Parallèles car 9/15 = 6/10 = 0,6','Perpendiculaires'],2,'9/15=0,6 et 6/10=0,6, avec les alignements vérifiés.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AB=12, AD=3, AC=16, AE=4. Conclusion ?',['Non parallèles','Perpendiculaires','Impossible avec 16 cm','Parallèles : 3/12 = 4/16 = 1/4'],3,'3/12=1/4 et 4/16=1/4.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AB=12, AD=4, AC=9, AE=2. Conclusion ?',['Non parallèles : 1/3≠2/9','Parallèles car 12 et 9 sont multiples de 3','Parallèles car 4+2=6','Impossible à déterminer'],0,'4/12=1/3 et 2/9 sont différents : non-parallélisme.'),
  Q('Deux rapports sont égaux, mais l’ordre des points alignés est inconnu. Que faut-il faire ?',['Conclure immédiatement que les droites sont parallèles','Vérifier les alignements et l’ordre avant toute conclusion','Supposer que le dessin est exact','Mesurer un angle et abandonner les longueurs'],1,'L’égalité des rapports seule ne suffit pas : vérifie le positionnement des points.'),
  Q('Dans la configuration de Thalès, les rapports AD/AB et AE/AC sont différents. Quel raisonnement convient ?',['La réciproque prouve le parallélisme','Les angles deviennent droits','La contraposée prouve que les droites ne sont pas parallèles','Les segments ont même longueur'],2,'La contraposée du théorème de Thalès permet de prouver qu’il n’y a pas parallélisme lorsque les rapports diffèrent.'),
  Q('D appartient au segment [AB], E au segment [AC], et les rapports AD/AB et AE/AC sont égaux. Quelle phrase conclut correctement ?',['AB est parallèle à AC','A est le milieu de DE','Le triangle ABC est rectangle','D’après la réciproque de Thalès, (DE) est parallèle à (BC)'],3,'Il faut citer la réciproque du théorème de Thalès et nommer les deux droites.'),
  Q('Dans ABC, A-D-B et A-E-C sont dans cet ordre. AB=8, AD=2, AC=14, AE=3,5. Conclusion ?',['Parallèles car les rapports valent 0,25','Non parallèles car 2≠3,5','Perpendiculaires','Impossible avec des décimaux'],0,'2/8=0,25 et 3,5/14=0,25, avec les alignements corrects.'),
  Q('Le professeur a demandé l’exercice 25 p.253, mais son énoncé n’est pas dans l’ENT. Comment le classeur doit-il le présenter ?',['Inventer les mesures de la page','Indiquer que l’énoncé manque et proposer des exercices distincts','Prétendre que ces questions sont l’exercice officiel','Marquer le devoir comme réalisé'],1,'Les trois séries sont des exercices pédagogiques originaux, pas une reproduction du devoir 25 p.253.')
 ]
];
export function mathNov12ForParentImport(){
 const lesson={id:'MTH12',subject:'Mathématiques',chapter:'Thalès',topic:'Réciproque de Thalès',category:'bis',date:'2026-11-12',
  title:'12 novembre — La réciproque de Thalès · entraînements',
  summary:'Prover le parallélisme avec les rapports de longueurs et l’alignement dans le même ordre. Exercices du classeur, distincts du devoir 25 p.253.',
  blocks:[{kind:'note',h:'Le cours du professeur',body:'12 novembre : réciproque du théorème de Thalès. Devoir pour le 13 novembre : finir l’exercice 25 page 253. Le texte de cet exercice n’est pas fourni dans l’ENT.'},
   {kind:'note',h:'Méthode BIS en 4 étapes',body:'1. Vérifier l’ordre des points. 2. Calculer AD/AB. 3. Calculer AE/AC. 4. Si les rapports sont égaux, conclure (DE)//(BC) par la réciproque de Thalès.'}],
  help:{simple:'Deux proportions identiques sur deux côtés d’un triangle permettent de prouver que les droites sont parallèles, si les points sont bien alignés.',
   steps:['Vérifier les alignements','Calculer les rapports','Comparer et conclure en nommant le théorème'],
   example:'AD=3, AB=5, AE=4,2, AC=7 : 3/5=4,2/7=0,6, donc (DE)//(BC).',
   check:{q:'3/6 est-il égal à 4/8 ?',options:['Oui','Non'],right:0,why:'Les deux valent 1/2.'}}};
 const names=['Comprendre la méthode','Calculer et comparer','Rédiger et conclure'];
 const exercises=SERIES.map((rows,i)=>({id:MATH12_IDS[i],lesson:'MTH12',subject:'Mathématiques',topic:'Réciproque de Thalès',
  title:'12 novembre — '+names[i],level:'10 questions',category:'school',kind:'training',
  source:'Entraînement BIS du classeur — non fourni par le professeur',enabled:true,
  description:'10 questions sur la réciproque de Thalès ; une seule tentative ; note sur 10 ; +1 / +0,5 / 0 XP selon la note.',
  questions:rows.map(item=>({type:'mc',q:item.prompt,options:item.choices,right:String(item.right),
    why:item.why,skill:'Réciproque de Thalès'}))}));
 return {lessons:[lesson],exercises};
}
export function mathNov12PublicTask(id,exercise){
 if(!MATH12_IDS.includes(id)||!exercise||exercise.questions?.length!==10)return null;
 return {id,lessonId:'MTH12',title:exercise.title,
  questions:exercise.questions.map((q,i)=>({number:i+1,prompt:q.q,choices:q.options}))};
}
export function mathNov12Score(id,answers){
 const pack=mathNov12ForParentImport();
 const ex=pack.exercises.find(x=>x.id===id);
 if(!ex||!Array.isArray(answers)||answers.length!==10||answers.some(x=>!Number.isInteger(x)||x<0||x>3))return null;
 const items=ex.questions.map((q,i)=>({prompt:q.q,response:q.options[answers[i]],
   expected:q.options[Number(q.right)],correct:answers[i]===Number(q.right),
   explanation:q.why,category:q.skill,points:answers[i]===Number(q.right)?1:0}));
 const score=items.filter(x=>x.correct).length;
 return {id,lessonId:'MTH12',score,total:10,xp:score>=7?1:score>=5?0.5:0,
  items,errors:items.filter(x=>!x.correct).length};
}
