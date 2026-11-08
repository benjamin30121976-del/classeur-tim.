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
      "13 a une plus grande valeur absolue que 8 : le résultat est +5.",
      [
        "13 l'emporte sur 8 en valeur absolue : le résultat est positif.",
        "21 vient de 8 + 13, mais il faut tenir compte du signe de −8.",
        "Il faut faire 13 − 8, et le résultat est positif."
      ]
    ],
    [
      "Calcule (−6) × 4.",
      "−24",
      [
        "24",
        "−10",
        "10"
      ],
      "Les signes sont différents : le produit est négatif. 6 × 4 = 24.",
      [
        "Un négatif multiplié par un positif donne un négatif.",
        "L'opération demandée est une multiplication, pas une soustraction.",
        "Le produit vaut 24 en valeur absolue, avec un signe négatif."
      ]
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
      "3/4 = 6/8, puis 6/8 + 1/8 = 7/8.",
      [
        "On ne peut pas additionner directement les dénominateurs de deux fractions.",
        "3/4 correspond à 6/8, auquel il faut ajouter encore 1/8.",
        "Le dénominateur commun est 8, et non 12."
      ]
    ],
    [
      "Calcule les 2/5 de 30.",
      "12",
      [
        "6",
        "15",
        "60"
      ],
      "30 × 2 ÷ 5 = 12.",
      [
        "6 est seulement un cinquième de 30 ; il faut deux cinquièmes.",
        "2/5 n'est pas une moitié : 30 ÷ 5 × 2.",
        "Tu as multiplié par 2 sans diviser par 5."
      ]
    ]
  ],
  "MBIS03": [
    [
      "Effectue ce calcul : (−3)³. Quel résultat obtiens-tu ?",
      "−27",
      [
        "27",
        "−9",
        "9"
      ],
      "(−3) × (−3) × (−3) = −27.",
      [
        "Une puissance impaire d'un nombre négatif reste négative.",
        "L'exposant 3 indique trois facteurs, pas une multiplication par 3.",
        "Il faut multiplier trois facteurs −3, en conservant les signes."
      ]
    ],
    [
      "Effectue ce calcul : 2⁻³. Quel résultat obtiens-tu ?",
      "1/8",
      [
        "−8",
        "8",
        "1/6"
      ],
      "2⁻³ = 1/(2³) = 1/8.",
      [
        "Un exposant négatif ne rend pas automatiquement le résultat négatif.",
        "Il faut prendre l'inverse de 2³, pas garder 8.",
        "2³ vaut 8 et non 6 ; l'inverse est 1/8."
      ]
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
      "On écrit un nombre entre 1 et 10 multiplié par une puissance de dix : 6,3 × 10⁴.",
      [
        "63 × 10³ représente bien 63 000, mais 63 n'est pas entre 1 et 10 : ce n'est pas une écriture scientifique.",
        "6,3 × 10³ donne 6 300, soit dix fois trop petit.",
        "0,63 × 10⁴ donne 6 300 et son coefficient n'est pas entre 1 et 10."
      ]
    ],
    [
      "Écris 0,009 en notation scientifique.",
      "9 × 10⁻³",
      [
        "0,9 × 10⁻³",
        "9 × 10³",
        "9 × 10⁻²"
      ],
      "0,009 = 9 millièmes = 9 × 10⁻³.",
      [
        "0,9 × 10⁻³ donne 0,0009, pas 0,009.",
        "9 × 10³ vaut 9 000, beaucoup trop grand.",
        "9 × 10⁻² vaut 0,09 : c'est dix fois trop grand."
      ]
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
      "L'hypoténuse est toujours opposée à l'angle droit, donc AC.",
      [
        "AB touche l'angle droit en B, il ne lui est pas opposé.",
        "BC touche l'angle droit en B, ce n'est pas l'hypoténuse.",
        "Un triangle rectangle possède toujours une hypoténuse."
      ]
    ],
    [
      "Dans un triangle rectangle, les deux côtés de l'angle droit mesurent 6 cm et 8 cm. Quelle est la longueur de l'hypoténuse ?",
      "10 cm",
      [
        "14 cm",
        "2 cm",
        "12 cm"
      ],
      "Pythagore : la longueur de l'hypoténuse vaut √(6² + 8²) = √100 = 10 cm.",
      [
        "On ne trouve pas l'hypoténuse en additionnant 6 et 8.",
        "Soustraire les longueurs ne remplace pas Pythagore.",
        "Il faut calculer √(6² + 8²) : cela vaut 10, pas 12."
      ]
    ]
  ],
  "MBIS06": [
    [
      "Dans un triangle rectangle, l'hypoténuse mesure 10 cm et un côté de l'angle droit mesure 6 cm. Quelle est la longueur de l'autre côté ?",
      "8 cm",
      [
        "4 cm",
        "16 cm",
        "√136 cm"
      ],
      "Le carré du côté recherché est 10² − 6² = 64. Donc sa longueur vaut √64 = 8 cm.",
      [
        "Calculer 10 − 6 ne suffit pas : Pythagore utilise des carrés.",
        "Ajouter les deux côtés ne donne pas la longueur manquante.",
        "L'hypoténuse est connue : il faut soustraire les carrés, pas les additionner."
      ]
    ],
    [
      "Dans un triangle rectangle, les deux côtés de l'angle droit mesurent 7 cm et 24 cm. Quelle est la longueur de l'hypoténuse ?",
      "25 cm",
      [
        "31 cm",
        "17 cm",
        "√527 cm"
      ],
      "L'hypoténuse vaut √(7² + 24²) = √625 = 25 cm.",
      [
        "7 + 24 n'est pas l'hypoténuse : additionne leurs carrés.",
        "17 est une différence de longueurs et non un résultat de Pythagore.",
        "√527 correspond à 24² − 7², alors qu'il faut additionner ces deux carrés."
      ]
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
      "8²+15² = 64+225 = 289 = 17² : la réciproque s'applique.",
      [
        "8² + 15² vaut exactement 17² : le triangle est donc rectangle.",
        "Les trois longueurs suffisent pour vérifier la réciproque de Pythagore.",
        "L'échelle du dessin n'est pas nécessaire : les longueurs permettent la démonstration."
      ]
    ],
    [
      "Les trois côtés d'un triangle mesurent 5 cm, 12 cm et 13 cm. Pour appliquer la réciproque de Pythagore, quelle longueur compare-t-on seule aux deux autres ?",
      "13 cm",
      [
        "5 cm",
        "12 cm",
        "5 + 12 cm"
      ],
      "On compare le carré du plus grand côté, 13², à la somme 5² + 12².",
      [
        "5 est plus petit que 13 ; le côté candidat est le plus long.",
        "12 est plus petit que 13 ; on teste le plus long côté.",
        "5 + 12 est une somme, et non une longueur d'un côté donné."
      ]
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
      "6²+7² = 85, tandis que 8² = 64 : les carrés ne sont pas égaux.",
      [
        "6² + 7² ne vaut pas 8² : le triangle n'est pas rectangle.",
        "Les trois longueurs suffisent pour appliquer la contraposée.",
        "6 + 7 > 8 prouve que le triangle existe, pas qu'il est rectangle."
      ]
    ],
    [
      "Pourquoi comparer le carré du côté le plus long aux deux autres ?",
      "L'hypoténuse est le plus long côté d'un triangle rectangle.",
      [
        "Tous les côtés sont égaux.",
        "Il faut toujours additionner les longueurs.",
        "Le plus petit côté est l'hypoténuse."
      ],
      "La contraposée de Pythagore compare le carré de la plus grande longueur à la somme des deux autres carrés.",
      [
        "Un triangle rectangle n'a pas toujours trois côtés de même longueur.",
        "On doit comparer les carrés, pas simplement additionner les longueurs.",
        "L'hypoténuse est le plus long côté, et non le plus petit."
      ]
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
      "La diagonale est l'hypoténuse : √(5²+12²) = 13 m.",
      [
        "17 m additionne simplement 5 et 12 ; une diagonale se calcule avec les carrés.",
        "7 m est une différence de côtés, pas la diagonale.",
        "√119 provient de la soustraction des carrés ; pour la diagonale, on les additionne."
      ]
    ],
    [
      "Avant d'utiliser le théorème de Pythagore dans un devoir, il faut…",
      "Justifier que le triangle est rectangle.",
      [
        "Mesurer le dessin à la règle.",
        "Dire que toutes les longueurs sont égales.",
        "Écrire directement le résultat."
      ],
      "On indique le triangle et son angle droit avant d'écrire l'égalité de Pythagore.",
      [
        "Un dessin mesuré à la règle n'est pas une démonstration.",
        "Les quatre côtés d'un rectangle ne sont pas nécessairement égaux.",
        "Il faut d'abord identifier le triangle rectangle et son angle droit."
      ]
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
      "Les termes en x se regroupent : 4x + 3x = 7x. Le terme −2 reste.",
      [
        "Le terme −2 reste présent après la réduction.",
        "4 + 3 − 2 = 5, mais −2 n'est pas un coefficient de x.",
        "Le nombre −2 n'est pas un terme en x : il ne devient pas −2x."
      ]
    ],
    [
      "Calcule 2x + 1 si x = −3.",
      "−5",
      [
        "−7",
        "7",
        "5"
      ],
      "2 × (−3) + 1 = −6 + 1 = −5.",
      [
        "2 × (−3) = −6 : on ajoute ensuite 1 au lieu de le soustraire.",
        "Le signe négatif de x doit être conservé au remplacement.",
        "−6 + 1 vaut −5, et non +5."
      ]
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
      "On distribue le 4 aux deux termes : 4 × 2x = 8x et 4 × (−3) = −12.",
      [
        "Le 4 doit aussi multiplier le −3, ce qui donne −12.",
        "4 × 2x vaut 8x, pas 6x : on multiplie, on n'additionne pas.",
        "4 × (−3) donne −12, pas +12."
      ]
    ],
    [
      "Réduis 7x − (3x + 5).",
      "4x − 5",
      [
        "4x + 5",
        "10x − 5",
        "4x"
      ],
      "On enlève les parenthèses précédées de − : 7x − 3x − 5 = 4x − 5.",
      [
        "Le signe moins devant la parenthèse transforme +5 en −5.",
        "Il faut soustraire 3x à 7x, et non les additionner.",
        "Le terme −5 ne disparaît pas pendant la réduction."
      ]
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
      "Les quatre produits donnent x² + x − 3x − 3 = x² − 2x − 3.",
      [
        "Le produit −3 × x est négatif, il ne donne pas +3x.",
        "Il faut calculer les quatre produits, dont x × 1 et −3 × x.",
        "Le produit −3 × 1 vaut −3 et non +3."
      ]
    ],
    [
      "Développe (x − 4)(x − 7).",
      "x² − 11x + 28",
      [
        "x² − 11x − 28",
        "x² + 11x + 28",
        "x² − 28"
      ],
      "x² − 7x − 4x + 28 = x² − 11x + 28.",
      [
        "Le produit (−4) × (−7) est positif : +28.",
        "Les deux termes en x sont négatifs, pas positifs.",
        "Il manque les termes −7x et −4x dans cette expression."
      ]
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
      "On multiplie tout le résultat x − 2, ce qui impose des parenthèses.",
      [
        "Le facteur 5 multiplie tout (x − 2), pas uniquement x.",
        "Le calcul demandé multiplie (x − 2) par 5, pas x par 1.",
        "On soustrait d'abord 2 : il ne faut pas changer son signe."
      ]
    ],
    [
      "Réduis 5(x − 2) + 3x.",
      "8x − 10",
      [
        "8x − 2",
        "5x + 1",
        "2x − 10"
      ],
      "5x − 10 + 3x = 8x − 10.",
      [
        "5 × (−2) vaut −10, pas −2.",
        "Après développement, on obtient 5x − 10, puis on ajoute 3x.",
        "5x + 3x donne 8x, et non 2x."
      ]
    ]
  ],
  "MBIS14": [
    [
      "Quelle condition est indispensable pour appliquer Thalès ?",
      "Des alignements et des segments parallèles.",
      [
        "Deux côtés égaux dans un triangle.",
        "Deux droites perpendiculaires.",
        "Un angle droit dans un triangle."
      ],
      "On justifie les alignements des points et le parallélisme des segments.",
      [
        "Deux côtés égaux ne suffisent pas à appliquer Thalès ; il faut des alignements et des droites parallèles.",
        "Des droites perpendiculaires ne remplacent pas les droites parallèles de la configuration de Thalès.",
        "Un angle droit tout seul permet éventuellement Pythagore, mais pas Thalès sans parallèles."
      ]
    ],
    [
      "Dans le triangle ABC, M appartient à [AB], N à [AC] et (MN) est parallèle à (BC). Complète : AM/AB = AN/AC = …",
      "MN/BC",
      [
        "BC/MN",
        "AM/BC",
        "AN/MN"
      ],
      "Les côtés correspondants des triangles AMN et ABC sont AM/AB, AN/AC et MN/BC.",
      [
        "BC/MN inverse ce rapport, alors que les autres sont dans le sens petit/grand.",
        "AM et BC ne sont pas les deux côtés correspondants de ces triangles.",
        "AN et MN sont deux côtés du petit triangle, pas deux côtés correspondants."
      ]
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
      "D'après Thalès : 2/8 = 3/AC, donc AC = 3 × 8 ÷ 2 = 12 cm.",
      [
        "6 cm ne vérifie pas 2/8 = 3/AC : refais le produit en croix.",
        "Il ne faut pas inverser les termes du rapport ; AC est quatre fois AN.",
        "24 cm résulte d'une mauvaise proportion : AC = AN × AB / AM."
      ]
    ],
    [
      "Dans une configuration de Thalès, MN/BC = 2/5 et BC = 20 cm. Calcule MN.",
      "8 cm",
      [
        "50 cm",
        "10 cm",
        "2 cm"
      ],
      "MN = BC × 2/5 = 20 × 2/5 = 8 cm.",
      [
        "50 cm correspond à l'inverse du rapport 2/5, ce n'est pas le bon sens.",
        "10 cm représente la moitié de 20 alors qu'il faut prendre 2/5.",
        "2 cm reprend le numérateur sans appliquer le rapport à 20 cm."
      ]
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
      "Thalès donne AM/AB = AN/AC = MN/BC. Ainsi MN/BC = 2/7.",
      [
        "7/2 inverse petit et grand côté : on doit conserver le rapport 2/7.",
        "Le rapport de départ vaut 2/7 et non 2/5.",
        "5/7 n'est pas égal à 2/7, donc la proportion n'est pas conservée."
      ]
    ],
    [
      "Dans le triangle ABC, M est sur [AB], N est sur [AC] et (MN) est parallèle à (BC). L'égalité AB/AM = AN/AC = BC/MN est-elle l'égalité de Thalès correctement écrite ?",
      "Non",
      [
        "Oui",
        "Oui, si le triangle est rectangle",
        "Oui, si le triangle est isocèle"
      ],
      "Non. Si on inverse les rapports, on les inverse tous : AB/AM = AC/AN = BC/MN.",
      [
        "AN/AC n'est pas inversé, contrairement aux deux autres rapports.",
        "Un angle droit ne corrige pas l'inversion du rapport du milieu.",
        "Un triangle isocèle ne dispense pas de garder tous les rapports dans le même sens."
      ]
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
      "x(x + 5) = x² + 5x.",
      [
        "x(x + 5) n'est pas 2x + 5 : il faut effectuer deux multiplications.",
        "Dans x × 5, le x reste : le terme est 5x et non 5.",
        "Distribue x aux deux termes séparément : x × x et x × 5."
      ]
    ],
    [
      "Quel indice annonce qu'on peut utiliser Thalès ?",
      "Des points alignés et des segments parallèles.",
      [
        "La présence d'une lettre x dans une expression.",
        "Un angle droit dans l'un des triangles.",
        "Deux triangles qui partagent seulement un sommet."
      ],
      "Thalès repose sur les alignements et les parallèles, pas sur un programme de calcul.",
      [
        "Une lettre x indique du calcul littéral, pas une situation géométrique de Thalès.",
        "Un angle droit peut servir à Pythagore mais ne donne pas les droites parallèles nécessaires à Thalès.",
        "Deux triangles peuvent partager un sommet sans avoir des côtés parallèles."
      ]
    ]
  ],
  "MBIS18": [
    [
      "Quel théorème calcule CG dans le triangle CDG rectangle en D ?",
      "Pythagore",
      [
        "Le théorème de Thalès.",
        "La réciproque du théorème de Pythagore.",
        "Le théorème des milieux."
      ],
      "Puisque le triangle est rectangle en D, CG² = CD² + DG².",
      [
        "Aucune paire de droites parallèles n'est donnée pour appliquer Thalès au triangle rectangle.",
        "La réciproque sert à prouver qu'un triangle est rectangle ; ici il est déjà annoncé rectangle, on cherche CG.",
        "Le théorème des milieux exige des milieux de côtés, qui ne sont pas indiqués ici."
      ]
    ],
    [
      "Dans le triangle CDG, E est sur [CD], F est sur [CG] et (EF) est parallèle à (DG). Quel théorème permet de calculer EF à partir de DG, CE et CD ?",
      "Thalès",
      [
        "Pythagore",
        "La somme des angles seulement",
        "Une règle graduée sur le dessin"
      ],
      "Avec les points alignés et (EF) parallèle à (DG), Thalès donne EF/DG = CE/CD.",
      [
        "Aucun angle droit nécessaire à Pythagore n'est donné pour cette situation.",
        "La somme des angles ne permet pas de calculer les longueurs demandées.",
        "Une mesure à la règle dépend de l'échelle du dessin ; utilise les rapports de Thalès."
      ]
    ]
  ],
  "MBIS19": [
    [
      "Calcule le carré du nombre −4, c'est-à-dire (−4)².",
      "16",
      [
        "−16",
        "−8",
        "8"
      ],
      "(−4) × (−4) = 16.",
      [
        "Deux nombres négatifs multipliés donnent un produit positif.",
        "L'exposant 2 signifie une multiplication par soi-même, pas un doublement.",
        "(−4)² vaut 16 ; 8 n'est pas le carré de −4."
      ]
    ],
    [
      "Calcule 1/3 + 1/6.",
      "1/2",
      [
        "2/9",
        "2/6",
        "1/9"
      ],
      "1/3 = 2/6, donc 2/6 + 1/6 = 3/6 = 1/2.",
      [
        "On ne peut pas additionner directement les dénominateurs des fractions.",
        "1/3 vaut 2/6, auquel il faut ajouter 1/6 : on obtient 3/6.",
        "Le dénominateur ne se multiplie pas lors d'une addition de fractions."
      ]
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
      "5 × x = 5x et 5 × (−2) = −10.",
      [
        "Le 5 multiplie aussi −2 ; le résultat contient −10 et pas −2.",
        "Le produit 5 × (−2) est négatif, pas positif.",
        "Le x doit aussi être multiplié par 5 : le coefficient est 5x."
      ]
    ],
    [
      "Réduis 6a² + 4a + 3a.",
      "6a² + 7a",
      [
        "13a²",
        "13a",
        "6a² + 12a"
      ],
      "4a + 3a = 7a ; 6a² est un terme d'un autre degré.",
      [
        "6a² ne s'additionne pas à 7a : ces termes sont de degrés différents.",
        "Le terme 6a² reste un terme en a², il ne devient pas un terme en a.",
        "4a + 3a donne 7a, on ne multiplie pas les coefficients entre eux."
      ]
    ]
  ],
  "MBIS21": [
    [
      "Avec trois côtés de longueurs 3, 4 et 5, quel outil prouve qu'un triangle est rectangle ?",
      "La réciproque de Pythagore",
      [
        "Le théorème de Thalès.",
        "Le théorème de Pythagore sans sa réciproque.",
        "Le calcul du périmètre."
      ],
      "3² + 4² = 5² ; la réciproque permet de prouver l'angle droit.",
      [
        "Thalès concerne des alignements et parallèles, pas la démonstration d'un angle droit à partir de trois longueurs.",
        "Le théorème direct suppose déjà le triangle rectangle ; pour le démontrer grâce aux côtés, il faut sa réciproque.",
        "Un périmètre additionne les longueurs, il ne prouve pas qu'un angle est droit."
      ]
    ],
    [
      "Dans le triangle ABC, M est sur [AB], N sur [AC] et (MN) est parallèle à (BC). Quel théorème permet de calculer BC à partir de AM, AB et MN ?",
      "Le théorème de Thalès",
      [
        "Le théorème de Pythagore.",
        "La réciproque du théorème de Pythagore.",
        "Un simple calcul d'aire."
      ],
      "La configuration permet d'écrire avec Thalès : AM/AB = MN/BC.",
      [
        "Pythagore demande un triangle rectangle ; ici ce sont les alignements et la parallèle qui donnent une relation de longueurs.",
        "La réciproque de Pythagore sert à démontrer un angle droit, pas à exploiter un parallélisme.",
        "Une aire ne fournit pas directement BC à partir des longueurs des côtés correspondants."
      ]
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
      "Les deux côtés de l'angle droit servent de base et de hauteur : leur produit divisé par deux.",
      [
        "L'addition de deux longueurs ne donne pas une aire.",
        "Le produit des deux côtés de l'angle droit est le double de l'aire du triangle.",
        "La moyenne des côtés n'est pas la formule de l'aire du triangle rectangle."
      ]
    ],
    [
      "Avant d'écrire les rapports de Thalès, que faut-il vérifier ?",
      "Alignements, parallèles et correspondance des côtés.",
      [
        "Deux longueurs égales dans le dessin.",
        "La présence d'un angle droit.",
        "La seule mesure du plus petit côté."
      ],
      "Il faut vérifier les alignements, les parallèles et la correspondance des côtés.",
      [
        "Deux longueurs égales n'établissent ni l'alignement des points ni le parallélisme des segments.",
        "Un angle droit seul renvoie à Pythagore ; pour Thalès il faut des points alignés et des segments parallèles.",
        "La plus petite longueur ne suffit pas : on doit aussi vérifier les alignements et les parallèles."
      ]
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
      "On calcule la racine carrée de 20,25 : MN = 4,5 m.",
      [
        "1,5² vaut 2,25 et non 20,25 : vérifie la racine carrée.",
        "5,25² ne vaut pas 20,25 : vérifie en élevant la longueur proposée au carré.",
        "6,75² ne vaut pas 20,25 : vérifie en élevant la longueur proposée au carré."
      ]
    ],
    [
      "Peut-on regrouper directement un terme en x² avec un terme en x ?",
      "Non",
      [
        "Oui",
        "Seulement si x est négatif",
        "Toujours après une division"
      ],
      "Ce sont des termes de degrés différents : ils ne sont pas semblables.",
      [
        "x² et x n'ont pas le même degré : on ne les additionne pas en un seul terme.",
        "Le signe de x ne change pas la nature des termes x² et x.",
        "Une division ne rend pas automatiquement les termes x² et x semblables."
      ]
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
