/* Évaluations de mathématiques tirées des questions des 23 leçons BIS.
   Une validation définitive par sous-leçon ; les devoirs ENT restent distincts.
   Les notes restent réservées à Tim et au compte Parent. */
const CONTENT={
  "MBIS01": [
    [
      "Calcule (−8) + 13.",
      "5",
      [
        "−5",
        "21",
        "−21"
      ],
      "13 a une plus grande valeur absolue que 8 : le résultat est +5."
    ],
    [
      "Calcule (−6) × 4.",
      "−24",
      [
        "24",
        "−10",
        "10"
      ],
      "Les signes sont différents : le produit est négatif. 6 × 4 = 24."
    ]
  ],
  "MBIS02": [
    [
      "Calcule 3/4 + 1/8.",
      "7/8",
      [
        "4/12",
        "1/2",
        "7/12"
      ],
      "3/4 = 6/8, puis 6/8 + 1/8 = 7/8."
    ],
    [
      "Calcule les 2/5 de 30.",
      "12",
      [
        "6",
        "15",
        "60"
      ],
      "30 × 2 ÷ 5 = 12."
    ]
  ],
  "MBIS03": [
    [
      "Calcule (−3)³.",
      "−27",
      [
        "27",
        "−9",
        "9"
      ],
      "(−3) × (−3) × (−3) = −27."
    ],
    [
      "Calcule 2⁻³.",
      "1/8",
      [
        "−8",
        "8",
        "1/6"
      ],
      "2⁻³ = 1/(2³) = 1/8."
    ]
  ],
  "MBIS04": [
    [
      "Écris 63 000 en notation scientifique.",
      "6,3 × 10⁴",
      [
        "63 × 10³",
        "6,3 × 10³",
        "0,63 × 10⁴"
      ],
      "On écrit un nombre entre 1 et 10 multiplié par une puissance de dix : 6,3 × 10⁴."
    ],
    [
      "Écris 0,009 en notation scientifique.",
      "9 × 10⁻³",
      [
        "0,9 × 10⁻³",
        "9 × 10³",
        "9 × 10⁻²"
      ],
      "0,009 = 9 millièmes = 9 × 10⁻³."
    ]
  ],
  "MBIS05": [
    [
      "Dans un triangle rectangle en B, quelle est l'hypoténuse ?",
      "AC",
      [
        "AB",
        "BC",
        "Aucun côté"
      ],
      "L'hypoténuse est toujours opposée à l'angle droit, donc AC."
    ],
    [
      "Les côtés de l'angle droit mesurent 6 et 8. Quelle est l'hypoténuse ?",
      "10",
      [
        "14",
        "2",
        "12"
      ],
      "√(6²+8²) = √100 = 10."
    ]
  ],
  "MBIS06": [
    [
      "Hypoténuse 10 et un autre côté 6 : quelle est la longueur manquante ?",
      "8",
      [
        "4",
        "16",
        "√136"
      ],
      "√(10²−6²) = √64 = 8."
    ],
    [
      "Côtés de l'angle droit 7 et 24 : quelle est l'hypoténuse ?",
      "25",
      [
        "31",
        "17",
        "√527"
      ],
      "√(7²+24²) = √625 = 25."
    ]
  ],
  "MBIS07": [
    [
      "Un triangle de côtés 8, 15 et 17 est-il rectangle ?",
      "Oui",
      [
        "Non",
        "Impossible à vérifier",
        "Seulement si la figure est à l'échelle"
      ],
      "8²+15² = 64+225 = 289 = 17² : la réciproque s'applique."
    ],
    [
      "Pour les longueurs 5, 12 et 13, quel côté comparer seul aux deux autres ?",
      "13",
      [
        "5",
        "12",
        "5 + 12"
      ],
      "La plus grande longueur, 13, serait l'hypoténuse."
    ]
  ],
  "MBIS08": [
    [
      "Un triangle de côtés 6, 7 et 8 est-il rectangle ?",
      "Non",
      [
        "Oui",
        "Impossible à décider",
        "Oui, car 6+7>8"
      ],
      "6²+7² = 85, tandis que 8² = 64 : les carrés ne sont pas égaux."
    ],
    [
      "Pourquoi comparer le carré du côté le plus long aux deux autres ?",
      "L'hypoténuse est le plus long côté d'un triangle rectangle.",
      [
        "Tous les côtés sont égaux.",
        "Il faut toujours additionner les longueurs.",
        "Le plus petit côté est l'hypoténuse."
      ],
      "La contraposée de Pythagore compare le carré de la plus grande longueur à la somme des deux autres carrés."
    ]
  ],
  "MBIS09": [
    [
      "Un rectangle mesure 5 m sur 12 m. Combien mesure sa diagonale ?",
      "13 m",
      [
        "17 m",
        "7 m",
        "√119 m"
      ],
      "La diagonale est l'hypoténuse : √(5²+12²) = 13 m."
    ],
    [
      "Avant d'utiliser le théorème de Pythagore dans un devoir, il faut…",
      "Justifier que le triangle est rectangle.",
      [
        "Mesurer le dessin à la règle.",
        "Dire que toutes les longueurs sont égales.",
        "Écrire directement le résultat."
      ],
      "On indique le triangle et son angle droit avant d'écrire l'égalité de Pythagore."
    ]
  ],
  "MBIS10": [
    [
      "Réduis 4x + 3x − 2.",
      "7x − 2",
      [
        "7x",
        "5x",
        "7x − 2x"
      ],
      "Les termes en x se regroupent : 4x + 3x = 7x. Le terme −2 reste."
    ],
    [
      "Calcule 2x + 1 si x = −3.",
      "−5",
      [
        "−7",
        "7",
        "5"
      ],
      "2 × (−3) + 1 = −6 + 1 = −5."
    ]
  ],
  "MBIS11": [
    [
      "Développe 4(2x − 3).",
      "8x − 12",
      [
        "8x − 3",
        "6x − 12",
        "8x + 12"
      ],
      "On distribue le 4 aux deux termes : 4 × 2x = 8x et 4 × (−3) = −12."
    ],
    [
      "Réduis 7x − (3x + 5).",
      "4x − 5",
      [
        "4x + 5",
        "10x − 5",
        "4x"
      ],
      "On enlève les parenthèses précédées de − : 7x − 3x − 5 = 4x − 5."
    ]
  ],
  "MBIS12": [
    [
      "Développe (x − 3)(x + 1).",
      "x² − 2x − 3",
      [
        "x² + 4x − 3",
        "x² − 3",
        "x² − 2x + 3"
      ],
      "Les quatre produits donnent x² + x − 3x − 3 = x² − 2x − 3."
    ],
    [
      "Développe (x − 4)(x − 7).",
      "x² − 11x + 28",
      [
        "x² − 11x − 28",
        "x² + 11x + 28",
        "x² − 28"
      ],
      "x² − 7x − 4x + 28 = x² − 11x + 28."
    ]
  ],
  "MBIS13": [
    [
      "Choisir x, retirer 2, puis multiplier le résultat par 5 : quelle expression ?",
      "5(x − 2)",
      [
        "5x − 2",
        "x − 10",
        "5x + 2"
      ],
      "On multiplie tout le résultat x − 2, ce qui impose des parenthèses."
    ],
    [
      "Réduis 5(x − 2) + 3x.",
      "8x − 10",
      [
        "8x − 2",
        "5x + 1",
        "2x − 10"
      ],
      "5x − 10 + 3x = 8x − 10."
    ]
  ],
  "MBIS14": [
    [
      "Quelle condition est indispensable pour appliquer Thalès ?",
      "Des alignements et des segments parallèles.",
      [
        "Un triangle de couleur bleue.",
        "Deux longueurs identiques.",
        "Un angle droit seulement."
      ],
      "On justifie les alignements des points et le parallélisme des segments."
    ],
    [
      "Dans le triangle ABC, M appartient à [AB], N à [AC] et (MN) est parallèle à (BC). Complète : AM/AB = AN/AC = …",
      "MN/BC",
      [
        "BC/MN",
        "AM/BC",
        "AN/MN"
      ],
      "Les côtés correspondants des triangles AMN et ABC sont AM/AB, AN/AC et MN/BC."
    ]
  ],
  "MBIS15": [
    [
      "Dans le triangle ABC, M est sur [AB] et N sur [AC], avec (MN) parallèle à (BC). AM = 2 cm, AB = 8 cm et AN = 3 cm. Calcule AC.",
      "12 cm",
      [
        "6 cm",
        "4 cm",
        "24 cm"
      ],
      "D'après Thalès : 2/8 = 3/AC, donc AC = 3 × 8 ÷ 2 = 12 cm."
    ],
    [
      "Dans une configuration de Thalès, MN/BC = 2/5 et BC = 20 cm. Calcule MN.",
      "8 cm",
      [
        "50 cm",
        "10 cm",
        "2 cm"
      ],
      "MN = BC × 2/5 = 20 × 2/5 = 8 cm."
    ]
  ],
  "MBIS16": [
    [
      "Dans le triangle ABC, M est sur [AB], N est sur [AC] et (MN) est parallèle à (BC). Si AM/AB = 2/7, combien vaut MN/BC ?",
      "2/7",
      [
        "7/2",
        "2/5",
        "5/7"
      ],
      "Thalès donne AM/AB = AN/AC = MN/BC. Ainsi MN/BC = 2/7."
    ],
    [
      "Dans le triangle ABC, M est sur [AB], N est sur [AC] et (MN) est parallèle à (BC). L'égalité AB/AM = AN/AC = BC/MN est-elle l'égalité de Thalès correctement écrite ?",
      "Non",
      [
        "Oui",
        "Oui, si le triangle est rectangle",
        "Oui, si le triangle est isocèle"
      ],
      "Non. Si on inverse les rapports, on les inverse tous : AB/AM = AC/AN = BC/MN."
    ]
  ],
  "MBIS17": [
    [
      "Choisir x, ajouter 5, puis multiplier par x : quelle expression réduite ?",
      "x² + 5x",
      [
        "2x + 5",
        "x² + 5",
        "5x²"
      ],
      "x(x + 5) = x² + 5x."
    ],
    [
      "Quel indice annonce qu'on peut utiliser Thalès ?",
      "Des points alignés et des segments parallèles.",
      [
        "Une variable x dans une expression.",
        "Un angle droit sans parallèles.",
        "Une addition de fractions."
      ],
      "Thalès repose sur les alignements et les parallèles, pas sur un programme de calcul."
    ]
  ],
  "MBIS18": [
    [
      "Quel théorème calcule CG dans le triangle CDG rectangle en D ?",
      "Pythagore",
      [
        "Thalès",
        "Une proportionnalité sans justification",
        "La règle de trois seule"
      ],
      "Puisque le triangle est rectangle en D, CG² = CD² + DG²."
    ],
    [
      "Dans le triangle CDG, E est sur [CD], F est sur [CG] et (EF) est parallèle à (DG). Quel théorème permet de calculer EF à partir de DG, CE et CD ?",
      "Thalès",
      [
        "Pythagore",
        "La somme des angles seulement",
        "Une règle graduée sur le dessin"
      ],
      "Avec les points alignés et (EF) parallèle à (DG), Thalès donne EF/DG = CE/CD."
    ]
  ],
  "MBIS19": [
    [
      "Calcule (−4)².",
      "16",
      [
        "−16",
        "−8",
        "8"
      ],
      "(−4) × (−4) = 16."
    ],
    [
      "Calcule 1/3 + 1/6.",
      "1/2",
      [
        "2/9",
        "2/6",
        "1/9"
      ],
      "1/3 = 2/6, donc 2/6 + 1/6 = 3/6 = 1/2."
    ]
  ],
  "MBIS20": [
    [
      "Développe 5(x − 2).",
      "5x − 10",
      [
        "5x − 2",
        "5x + 10",
        "x − 10"
      ],
      "5 × x = 5x et 5 × (−2) = −10."
    ],
    [
      "Réduis 6a² + 4a + 3a.",
      "6a² + 7a",
      [
        "13a²",
        "13a",
        "6a² + 12a"
      ],
      "4a + 3a = 7a ; 6a² est un terme d'un autre degré."
    ]
  ],
  "MBIS21": [
    [
      "Avec trois côtés de longueurs 3, 4 et 5, quel outil prouve qu'un triangle est rectangle ?",
      "La réciproque de Pythagore",
      [
        "Le théorème de Thalès",
        "La distributivité",
        "La somme des fractions"
      ],
      "3² + 4² = 5² ; la réciproque permet de prouver l'angle droit."
    ],
    [
      "Dans le triangle ABC, M est sur [AB], N sur [AC] et (MN) est parallèle à (BC). Quel théorème permet de calculer BC à partir de AM, AB et MN ?",
      "Le théorème de Thalès",
      [
        "La réciproque de Pythagore",
        "Une multiplication de nombres relatifs",
        "Le calcul d'une aire"
      ],
      "La configuration permet d'écrire avec Thalès : AM/AB = MN/BC."
    ]
  ],
  "MBIS22": [
    [
      "Quelle est l'aire d'un triangle rectangle ?",
      "(Côté 1 × côté 2) ÷ 2",
      [
        "Côté 1 + côté 2",
        "Côté 1 × côté 2",
        "(Côté 1 + côté 2) ÷ 2"
      ],
      "Les deux côtés de l'angle droit servent de base et de hauteur : leur produit divisé par deux."
    ],
    [
      "Avant d'écrire les rapports de Thalès, que faut-il vérifier ?",
      "Alignements, parallèles et correspondance des côtés.",
      [
        "Seulement la couleur de la figure.",
        "Uniquement la longueur du plus petit côté.",
        "Que le triangle est équilatéral."
      ],
      "Il faut vérifier les alignements, les parallèles et la correspondance des côtés."
    ]
  ],
  "MBIS23": [
    [
      "MN² = 20,25 m² et MN est une longueur positive. Calcule MN.",
      "4,5 m",
      [
        "1,5 m",
        "5,25 m",
        "6,75 m"
      ],
      "On calcule la racine carrée de 20,25 : MN = 4,5 m."
    ],
    [
      "Peut-on regrouper directement un terme en x² avec un terme en x ?",
      "Non",
      [
        "Oui",
        "Seulement si x est négatif",
        "Toujours après une division"
      ],
      "Ce sont des termes de degrés différents : ils ne sont pas semblables."
    ]
  ]
};
export const MATH_TOTAL=23;
export function mathId(id){return /^MT(?:0[1-9]|1[0-9]|2[0-3])$/.test(String(id||''));}
export function mathTask(id){
 if(!mathId(id))return null;
 const suffix=id.slice(2),lessonId='MBIS'+suffix,rows=CONTENT[lessonId];
 if(!rows)return null;
 const questions=rows.map(([prompt,expected,alternatives,explanation,wrongFeedback],i)=>{
  const position=(Number(suffix)+i*2)%4;
  const choices=alternatives.slice();
  choices.splice(position,0,expected);
  const feedbackByIndex=Array.isArray(wrongFeedback)?wrongFeedback.slice():alternatives.map(()=>"Vérifie les opérations et les données de la question.");
  feedbackByIndex.splice(position,0,null);
  return {prompt,choices,correctIndex:position,expected,explanation,feedbackByIndex,lessonId};
 });
 return {id,lessonId,questions,title:'Évaluation de la sous-leçon · '+suffix,subject:'Mathématiques'};
}
export function mathPublicTask(id){
 const t=mathTask(id);
 return t?{id:t.id,lessonId:t.lessonId,title:t.title,questions:t.questions.map(q=>({prompt:q.prompt,choices:q.choices}))}:null;
}
export function gradeMathTask(id,answers){
 const t=mathTask(id);
 if(!t||!Array.isArray(answers)||answers.length!==t.questions.length||answers.some(x=>!Number.isInteger(x)||x<0||x>3))throw Error('invalid-answers');
 const items=t.questions.map((q,i)=>{const correct=answers[i]===q.correctIndex;const feedback=correct?'':q.feedbackByIndex[answers[i]]||'Cette réponse ne correspond pas à la méthode.';return {prompt:q.prompt,response:q.choices[answers[i]],expected:q.expected,correct,explanation:correct?q.explanation:feedback+' '+q.explanation,lessonId:t.lessonId};});
 return {id,lessonId:t.lessonId,score:items.filter(x=>x.correct).length,total:items.length,items,xp:0};
}
